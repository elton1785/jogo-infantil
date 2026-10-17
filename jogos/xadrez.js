// Xadrez com dicas (regras oficiais da FIDE, como se joga no Brasil):
// - Todos os movimentos, xeque, xeque-mate, afogamento, roque (pequeno e grande, com as
//   condições), en passant, promoção (escolher a peça ou sempre dama), regra dos 50 lances,
//   repetição tripla e material insuficiente (empates).
// - Contra o computador (3 níveis: minimax com poda alfa-beta, material + posição; o fácil erra
//   de propósito às vezes). O cálculo roda num Web Worker criado a partir de um Blob (sem
//   arquivos extras); se o aparelho não deixar, roda aos poucos na própria página.
// - 2 jogadores no mesmo aparelho (o tabuleiro pode girar a cada vez).
// - Dicas: pontinhos para onde a peça pode ir (captura em vermelho), voz explicando cada peça na
//   primeira vez, botão 💡 Dica (o próprio motor sugere e a coruja explica), avisos de xeque e
//   de peça ameaçada, desfazer jogada.
// - Aprender: lições de cada peça (pegar as estrelas), roque, en passant, promoção, xeque, e
//   desafios de xeque-mate em 1 lance.
(() => {
  // =====================================================================
  // MOTOR: regras e computador. Função autocontida (sem nada de fora) porque
  // o mesmo código vira o Web Worker (fabricaMotor.toString()).
  // Tabuleiro: Int8Array(64), casa 0 = a8, 7 = h8, 56 = a1, 63 = h1.
  // Peças: 1 peão, 2 cavalo, 3 bispo, 4 torre, 5 dama, 6 rei; positivas = brancas.
  // =====================================================================
  function fabricaMotor() {
    const VAL = [0, 100, 320, 330, 500, 900, 0];
    const MATE = 100000, INF = 1e9, PARAR = { parar: true };
    const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]; // 0-3 retas, 4-7 diagonais
    const SALTO_N = [], SALTO_K = [], RAIOS = DIRS.map(() => []);
    for (let s = 0; s < 64; s++) {
      const r = s >> 3, c = s & 7;
      SALTO_N[s] = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
        .filter(([dr, dc]) => r + dr >= 0 && r + dr < 8 && c + dc >= 0 && c + dc < 8).map(([dr, dc]) => (r + dr) * 8 + c + dc);
      SALTO_K[s] = DIRS.filter(([dr, dc]) => r + dr >= 0 && r + dr < 8 && c + dc >= 0 && c + dc < 8).map(([dr, dc]) => (r + dr) * 8 + c + dc);
      DIRS.forEach(([dr, dc], d) => {
        const raio = [];
        for (let rr = r + dr, cc = c + dc; rr >= 0 && rr < 8 && cc >= 0 && cc < 8; rr += dr, cc += dc) raio.push(rr * 8 + cc);
        RAIOS[d][s] = raio;
      });
    }
    // Direito de roque: 1 = brancas pequeno, 2 = brancas grande, 4 = pretas pequeno, 8 = pretas grande
    const MASCARA = new Array(64).fill(15);
    MASCARA[60] = 12; MASCARA[63] = 14; MASCARA[56] = 13; MASCARA[4] = 3; MASCARA[7] = 11; MASCARA[0] = 7;

    // Tabelas de posição (do ponto de vista das brancas, casa 0 = a8)
    const PST = [null,
      [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5,
        0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
      [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30,
        -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
      [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10,
        -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
      [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5,
        -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
      [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5,
        0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
    ];
    const REI_MEIO = [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30,
      -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10,
      20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20];
    const REI_FIM = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30,
      -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30,
      -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];

    const LETRAS = "pnbrqk";
    function deFEN(fen) {
      const [pecas, vez = "w", roque = "-", ep = "-", meio = "0", lance = "1"] = fen.trim().split(/\s+/);
      const b = new Int8Array(64);
      let s = 0;
      for (const ch of pecas) {
        if (ch === "/") continue;
        if (/\d/.test(ch)) { s += +ch; continue; }
        const t = LETRAS.indexOf(ch.toLowerCase()) + 1;
        b[s++] = ch === ch.toUpperCase() ? t : -t;
      }
      let cr = 0;
      if (roque.includes("K")) cr |= 1;
      if (roque.includes("Q")) cr |= 2;
      if (roque.includes("k")) cr |= 4;
      if (roque.includes("q")) cr |= 8;
      const epSq = ep === "-" ? -1 : (8 - +ep[1]) * 8 + "abcdefgh".indexOf(ep[0]);
      return { b, vez: vez === "w" ? 1 : -1, roque: cr, ep: epSq, meio: +meio, lance: +lance };
    }

    function rei(b, cor) {
      for (let s = 0; s < 64; s++) if (b[s] === 6 * cor) return s;
      return -1;
    }

    // A casa `sq` é atacada por alguma peça da cor `por` (1 brancas, -1 pretas)?
    function atacada(b, sq, por) {
      const r = sq >> 3, c = sq & 7;
      if (por === 1) {
        if (r < 7) { if (c > 0 && b[sq + 7] === 1) return true; if (c < 7 && b[sq + 9] === 1) return true; }
      } else if (r > 0) { if (c > 0 && b[sq - 9] === -1) return true; if (c < 7 && b[sq - 7] === -1) return true; }
      const cav = 2 * por, re = 6 * por;
      for (const t of SALTO_N[sq]) if (b[t] === cav) return true;
      for (const t of SALTO_K[sq]) if (b[t] === re) return true;
      for (let d = 0; d < 8; d++) {
        const raio = RAIOS[d][sq];
        for (let i = 0; i < raio.length; i++) {
          const p = b[raio[i]];
          if (!p) continue;
          const a = p * por;
          if (a === 5 || a === (d < 4 ? 4 : 3)) return true;
          break;
        }
      }
      return false;
    }

    // Valor da peça mais barata da cor `por` que ataca `sq` (0 se nenhuma; rei vale 10000)
    function menorAtacante(b, sq, por) {
      const r = sq >> 3, c = sq & 7;
      let menor = 0;
      const ver = v => { if (!menor || v < menor) menor = v; };
      if (por === 1) {
        if (r < 7 && ((c > 0 && b[sq + 7] === 1) || (c < 7 && b[sq + 9] === 1))) return VAL[1];
      } else if (r > 0 && ((c > 0 && b[sq - 9] === -1) || (c < 7 && b[sq - 7] === -1))) return VAL[1];
      for (const t of SALTO_N[sq]) if (b[t] === 2 * por) ver(VAL[2]);
      for (let d = 0; d < 8; d++) {
        for (const t of RAIOS[d][sq]) {
          const p = b[t];
          if (!p) continue;
          const a = p * por;
          if (a === 5 || a === (d < 4 ? 4 : 3)) ver(VAL[a]);
          break;
        }
      }
      for (const t of SALTO_K[sq]) if (b[t] === 6 * por) ver(10000);
      return menor;
    }

    const mov = (de, para, p, cap, extra) => Object.assign({ de, para, p, cap, promo: 0, roque: 0, ep: false, duplo: false }, extra);

    // Jogadas "pseudo-legais" (sem conferir se o próprio rei fica em xeque).
    // `so`: só as da peça nessa casa (-1 = todas). `soCapturas`: capturas e promoções (busca quieta).
    function pseudo(pos, so = -1, soCapturas = false) {
      const b = pos.b, v = pos.vez, ms = [];
      for (let s = so >= 0 ? so : 0; s < (so >= 0 ? so + 1 : 64); s++) {
        const p = b[s];
        if (!p || (p > 0) !== (v > 0)) continue;
        const t = p * v, r = s >> 3, c = s & 7;
        if (t === 1) {
          const f = -8 * v, s1 = s + f, ult = v === 1 ? 0 : 7, ini = v === 1 ? 6 : 1;
          if (s1 >= 0 && s1 < 64 && !b[s1]) {
            if (s1 >> 3 === ult) {
              for (const pr of soCapturas ? [5] : [5, 4, 3, 2]) ms.push(mov(s, s1, p, 0, { promo: pr }));
            } else if (!soCapturas) {
              ms.push(mov(s, s1, p, 0));
              if (r === ini && !b[s1 + f]) ms.push(mov(s, s1 + f, p, 0, { duplo: true }));
            }
          }
          for (const dc of [-1, 1]) {
            const cc = c + dc;
            if (cc < 0 || cc > 7) continue;
            const s2 = s1 + dc;
            if (b[s2] && b[s2] * v < 0) {
              if (s2 >> 3 === ult) for (const pr of [5, 4, 3, 2]) ms.push(mov(s, s2, p, b[s2], { promo: pr }));
              else ms.push(mov(s, s2, p, b[s2]));
            } else if (s2 === pos.ep && !b[s2]) ms.push(mov(s, s2, p, -v, { ep: true }));
          }
        } else if (t === 2 || t === 6) {
          for (const x of (t === 2 ? SALTO_N : SALTO_K)[s]) {
            if (!b[x]) { if (!soCapturas) ms.push(mov(s, x, p, 0)); } else if (b[x] * v < 0) ms.push(mov(s, x, p, b[x]));
          }
          if (t === 6 && !soCapturas) {
            const casa = v === 1 ? 60 : 4, kb = v === 1 ? 1 : 4, qb = v === 1 ? 2 : 8;
            if (s === casa && (pos.roque & (kb | qb)) && !atacada(b, s, -v)) {
              if ((pos.roque & kb) && !b[s + 1] && !b[s + 2] && b[s + 3] === 4 * v && !atacada(b, s + 1, -v) && !atacada(b, s + 2, -v))
                ms.push(mov(s, s + 2, p, 0, { roque: 1 }));
              if ((pos.roque & qb) && !b[s - 1] && !b[s - 2] && !b[s - 3] && b[s - 4] === 4 * v && !atacada(b, s - 1, -v) && !atacada(b, s - 2, -v))
                ms.push(mov(s, s - 2, p, 0, { roque: 2 }));
            }
          }
        } else {
          const d0 = t === 3 ? 4 : 0, d1 = t === 4 ? 4 : 8;
          for (let d = d0; d < d1; d++) {
            for (const x of RAIOS[d][s]) {
              if (!b[x]) { if (!soCapturas) ms.push(mov(s, x, p, 0)); continue; }
              if (b[x] * v < 0) ms.push(mov(s, x, p, b[x]));
              break;
            }
          }
        }
      }
      return ms;
    }

    function aplicar(pos, m) {
      const b = pos.b.slice(), v = pos.vez;
      b[m.de] = 0;
      b[m.para] = m.promo ? m.promo * v : m.p;
      if (m.ep) b[m.para + 8 * v] = 0;
      if (m.roque === 1) { b[m.de + 1] = b[m.de + 3]; b[m.de + 3] = 0; }
      if (m.roque === 2) { b[m.de - 1] = b[m.de - 4]; b[m.de - 4] = 0; }
      return {
        b, vez: -v, roque: pos.roque & MASCARA[m.de] & MASCARA[m.para], ep: m.duplo ? (m.de + m.para) / 2 : -1,
        meio: m.p * v === 1 || m.cap ? 0 : pos.meio + 1, lance: pos.lance + (v === -1 ? 1 : 0),
      };
    }

    const legal = (n, cor) => { const k = rei(n.b, cor); return k < 0 || !atacada(n.b, k, -cor); };
    function legais(pos, so = -1) { return pseudo(pos, so).filter(m => legal(aplicar(pos, m), pos.vez)); }
    function emXeque(pos) { const k = rei(pos.b, pos.vez); return k >= 0 && atacada(pos.b, k, -pos.vez); }

    // Chave da posição para a repetição tripla (en passant só conta se a captura for possível)
    function chave(pos) {
      const ep = pos.ep >= 0 && legais(pos).some(m => m.ep) ? pos.ep : -1;
      return `${pos.b.join(",")}|${pos.vez}|${pos.roque}|${ep}`;
    }

    // Ninguém consegue dar xeque-mate: rei contra rei, rei e bispo ou cavalo contra rei,
    // ou só bispos (de qualquer lado) todos na mesma cor de casa
    function insuficiente(b) {
      const outros = [];
      for (let s = 0; s < 64; s++) {
        const t = Math.abs(b[s]);
        if (!t || t === 6) continue;
        if (t === 1 || t === 4 || t === 5) return false;
        outros.push({ t, cor: ((s >> 3) + (s & 7)) % 2 });
      }
      if (outros.length <= 1) return true;
      return outros.every(o => o.t === 3 && o.cor === outros[0].cor);
    }

    function avaliar(pos) {
      const b = pos.b;
      let s = 0, mat = 0, matB = 0, matP = 0, rb = -1, rp = -1;
      for (let q = 0; q < 64; q++) {
        const p = b[q];
        if (!p) continue;
        const t = p > 0 ? p : -p;
        if (t === 6) { if (p > 0) rb = q; else rp = q; continue; }
        if (t !== 1) mat += VAL[t];
        if (p > 0) { s += VAL[t] + PST[t][q]; matB += VAL[t]; } else { s -= VAL[t] + PST[t][q ^ 56]; matP += VAL[t]; }
      }
      const fim = mat <= 1300;
      const tab = fim ? REI_FIM : REI_MEIO;
      if (rb >= 0) s += tab[rb];
      if (rp >= 0) s -= tab[rp ^ 56];
      // Final ganho: empurra o rei do outro para a borda e aproxima o próprio rei (para saber dar o mate)
      if (fim && rb >= 0 && rp >= 0 && Math.abs(matB - matP) >= 300) {
        const ganha = matB > matP ? 1 : -1, ki = ganha > 0 ? rp : rb, km = ganha > 0 ? rb : rp;
        const r = ki >> 3, c = ki & 7;
        const borda = Math.max(3 - r, r - 4) + Math.max(3 - c, c - 4);
        const dist = Math.abs(r - (km >> 3)) + Math.abs(c - (km & 7));
        s += ganha * (borda * 10 + (14 - dist) * 4);
      }
      return s * pos.vez;
    }

    const notaOrdem = m => (m.cap ? VAL[Math.abs(m.cap)] * 10 - VAL[Math.abs(m.p)] + 1000 : 0) + (m.promo ? VAL[m.promo] : 0);
    function ordenar(ms) {
      for (const m of ms) m.o = notaOrdem(m);
      return ms.sort((a, b) => b.o - a.o);
    }

    let nos = 0, limite = 0;
    function quieta(pos, alfa, beta, qp) {
      if ((++nos & 2047) === 0 && Date.now() > limite) throw PARAR;
      const parado = avaliar(pos);
      if (parado >= beta) return parado;
      if (parado > alfa) alfa = parado;
      if (qp >= 8) return parado;
      const v = pos.vez;
      for (const m of ordenar(pseudo(pos, -1, true))) {
        const n = aplicar(pos, m);
        if (!legal(n, v)) continue;
        const s = -quieta(n, -beta, -alfa, qp + 1);
        if (s >= beta) return s;
        if (s > alfa) alfa = s;
      }
      return alfa;
    }

    function negamax(pos, prof, alfa, beta, ply) {
      if ((++nos & 2047) === 0 && Date.now() > limite) throw PARAR;
      if (pos.meio >= 100) return 0;
      const v = pos.vez, xeque = emXeque(pos);
      if (xeque && ply < 10) prof++;
      if (prof <= 0) return quieta(pos, alfa, beta, 0);
      let melhor = -INF, algum = false;
      for (const m of ordenar(pseudo(pos))) {
        const n = aplicar(pos, m);
        if (!legal(n, v)) continue;
        algum = true;
        const s = -negamax(n, prof - 1, -beta, -alfa, ply + 1);
        if (s > melhor) melhor = s;
        if (s > alfa) alfa = s;
        if (alfa >= beta) break;
      }
      if (!algum) return xeque ? -MATE + ply : 0;
      return melhor;
    }

    const NIVEIS = {
      facil: { prof: 1, tempo: 700, acaso: 0.3 },             // às vezes joga qualquer coisa
      medio: { prof: 3, tempo: 1800, margem: 40, chance: 0.15 }, // às vezes a 2ª melhor
      dificil: { prof: 6, tempo: 2600 },
      dica: { prof: 3, tempo: 1500 },
    };

    // Melhor jogada para quem tem a vez, no nível pedido. `tempoMax` encurta o tempo (sem Worker).
    function melhor(pos, nivel, tempoMax) {
      const ms = legais(pos);
      if (ms.length <= 1) return ms[0] || null;
      const cfg = NIVEIS[nivel] || NIVEIS.medio;
      if (cfg.acaso && Math.random() < cfg.acaso) return ms[Math.floor(Math.random() * ms.length)];
      for (let i = ms.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ms[i], ms[j]] = [ms[j], ms[i]]; }
      ordenar(ms);
      nos = 0;
      limite = Date.now() + Math.min(cfg.tempo, tempoMax || Infinity);
      let escolhida = ms[0], notas = null;
      for (let p = 1; p <= cfg.prof; p++) {
        try {
          const res = [];
          let alfa = -INF;
          for (const m of ms) {
            const n = aplicar(pos, m);
            const v = -negamax(n, p - 1, -INF, -(alfa - (cfg.margem || 0)), 1);
            res.push({ m, v });
            if (v > alfa) alfa = v;
          }
          res.sort((a, b) => b.v - a.v);
          ms.splice(0, ms.length, ...res.map(r => r.m));
          escolhida = res[0].m;
          notas = res;
          if (res[0].v > MATE - 100) break; // achou um mate
        } catch (e) {
          if (e !== PARAR) throw e;
          break;
        }
      }
      if (cfg.chance && notas && Math.random() < cfg.chance) {
        const perto = notas.filter(r => r.v >= notas[0].v - cfg.margem && r.v > -MATE + 100);
        escolhida = perto[Math.floor(Math.random() * perto.length)].m;
      }
      return escolhida;
    }

    return { VAL, deFEN, rei, atacada, menorAtacante, pseudo, legais, aplicar, emXeque, chave, insuficiente, avaliar, melhor };
  }

  const X = fabricaMotor();
  const INICIAL = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  // ---------- Cálculo do computador fora da tela (Web Worker de Blob) ----------
  let trabalhador = null; // null = ainda não criado; false = não deu (calcula aqui mesmo)
  let pedidos = 0;
  const pendentes = new Map();
  function obterTrabalhador() {
    if (trabalhador !== null) return trabalhador || null;
    try {
      const src = `const X = (${fabricaMotor.toString()})();
onmessage = e => { const d = e.data; let m = null; try { m = X.melhor(d.pos, d.nivel); } catch (err) { m = null; } postMessage({ id: d.id, m }); };`;
      const url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
      const w = new Worker(url);
      w.onmessage = e => {
        const f = pendentes.get(e.data.id);
        pendentes.delete(e.data.id);
        if (f) f.cb(e.data.m || X.melhor(f.pos, f.nivel, 600));
      };
      w.onerror = ev => {
        if (ev && ev.preventDefault) ev.preventDefault();
        trabalhador = false;
        const lista = [...pendentes.values()];
        pendentes.clear();
        lista.forEach(f => setTimeout(() => f.cb(X.melhor(f.pos, f.nivel, 1200)), 20));
      };
      trabalhador = w;
    } catch (e) { trabalhador = false; }
    return trabalhador || null;
  }
  // Pede a melhor jogada; `cb(m)` recebe a jogada. Devolve uma função que cancela o pedido.
  function calcular(pos, nivel, cb) {
    const w = obterTrabalhador();
    if (!w) {
      let cancelado = false;
      setTimeout(() => { if (!cancelado) cb(X.melhor(pos, nivel, 1200)); }, 40);
      return () => { cancelado = true; };
    }
    const id = ++pedidos;
    pendentes.set(id, { cb, pos, nivel });
    w.postMessage({ id, pos, nivel });
    return () => {
      if (!pendentes.has(id)) return;
      pendentes.delete(id);
      // Cálculo em andamento: descarta o Worker (o próximo pedido cria outro)
      if (trabalhador === w) { w.terminate(); trabalhador = null; pendentes.forEach(f => setTimeout(() => f.cb(X.melhor(f.pos, f.nivel, 800)), 20)); pendentes.clear(); }
    };
  }

  // =====================================================================
  // DESENHOS: peças em SVG, minitabuleiros da explicação
  // =====================================================================
  const NOME = [null, "peão", "cavalo", "bispo", "torre", "dama", "rei"];
  const FEM = [false, false, false, false, true, true, false];
  const art = t => (FEM[t] ? "a" : "o");
  const seu = t => (FEM[t] ? "sua" : "seu");
  const Maiusc = s => s.charAt(0).toUpperCase() + s.slice(1);
  const nomeCasa = s => "abcdefgh"[s & 7] + (8 - (s >> 3));
  const casaIdx = n => (8 - +n[1]) * 8 + "abcdefgh".indexOf(n[0]);
  const COR_NOME = { 1: "brancas", "-1": "pretas" };

  // Desenho de cada peça (viewBox 100×100). f = recheio, s = contorno, d = detalhes
  function corpoPeca(t, f, s, d) {
    const a = `fill="${f}" stroke="${s}" stroke-width="3.6" stroke-linejoin="round"`;
    const linha = `fill="none" stroke="${d}" stroke-width="3.4" stroke-linecap="round"`;
    const base = `<path ${a} d="M24 93h52c3 0 5-2 5-5v-2c0-3-2-5-5-5H24c-3 0-5 2-5 5v2c0 3 2 5 5 5z"/>`;
    switch (t) {
      case 1: return `<path ${a} d="M31 83C31 69 39 61 43 55h14c4 6 12 14 12 28z"/><ellipse ${a} cx="50" cy="53" rx="13" ry="4.6"/><circle ${a} cx="50" cy="35" r="13"/>${base}<path ${linha} d="M44 31a7 7 0 0 1 6-5"/>`;
      case 2: return `<path ${a} d="M70 85C72 70 71 52 61 38C59 30 57 22 54 12L46 23C36 23 26 33 18 49C15 55 16 62 22 64C28 66 34 62 40 60C44 65 42 75 32 85z"/>${base}<circle cx="41" cy="37" r="3.8" fill="${d}"/><circle cx="22" cy="56" r="2" fill="${d}"/><path ${linha} d="M62 42C67 53 68 66 66 78"/>`;
      case 3: return `<path ${a} d="M33 83C33 71 39 65 42 60h16c3 5 9 11 9 23z"/><ellipse ${a} cx="50" cy="59" rx="13" ry="4.4"/><path ${a} d="M50 19C36 31 34 43 38 50c2 4 6 6 12 6s10-2 12-6c4-7 2-19-12-31z"/><circle ${a} cx="50" cy="14" r="5.2"/>${base}<path ${linha} d="M53 31L46 42"/>`;
      case 4: return `<path ${a} d="M32 82L36 46h28l4 36z"/><path ${a} d="M27 47V21h10v8h8v-8h10v8h8v-8h10v26z"/>${base}<path ${linha} d="M35 72h30"/>`;
      case 5: return `<path ${a} d="M28 81L18 33l17 22 2-29 9 27 4-30 4 30 9-27 2 29 17-22-10 48z"/><circle ${a} cx="18" cy="31" r="5"/><circle ${a} cx="37" cy="24" r="5"/><circle ${a} cx="50" cy="19" r="5.4"/><circle ${a} cx="63" cy="24" r="5"/><circle ${a} cx="82" cy="31" r="5"/>${base}<path ${linha} d="M31 72c12-5 26-5 38 0"/>`;
      case 6: return `<path ${a} d="M46 8h8v8h8v8h-8v12h-8V24h-8v-8h8z"/><ellipse ${a} cx="50" cy="45" rx="8" ry="9"/><path ${a} d="M30 82C21 66 22 50 33 47c8-2 13 4 17 12 4-8 9-14 17-12 11 3 12 19 3 35z"/>${base}<path ${linha} d="M33 73c11-5 23-5 34 0"/>`;
    }
    return "";
  }
  const cachePeca = new Map();
  function pecaSVG(p) {
    if (!cachePeca.has(p)) {
      const branca = p > 0, t = Math.abs(p);
      const corpo = branca ? corpoPeca(t, "#fffaf0", "#3d2b1a", "#3d2b1a") : corpoPeca(t, "#34303d", "#0c0b10", "#a59cba");
      cachePeca.set(p, `<svg viewBox="0 0 100 100" aria-hidden="true">${corpo}</svg>`);
    }
    return cachePeca.get(p);
  }

  // Minitabuleiro para a explicação: linhas com letras de FEN ("K", "n"...), "." vazia,
  // "*" pontinho (pode ir), "x" casa de captura, "+" estrela
  function miniTab(linhas, { largura = 150 } = {}) {
    const L = linhas.length, C = linhas[0].length, cel = 20;
    let s = `<svg viewBox="0 0 ${C * cel + 8} ${L * cel + 8}" style="width:${largura}px" aria-hidden="true"><rect width="${C * cel + 8}" height="${L * cel + 8}" rx="5" fill="#5a3418"/>`;
    linhas.forEach((l, r) => [...l].forEach((ch, c) => {
      const x = 4 + c * cel, y = 4 + r * cel;
      s += `<rect x="${x}" y="${y}" width="${cel}" height="${cel}" fill="${(r + c) % 2 ? "#b07a4f" : "#f0d9b5"}"/>`;
      if (ch === "*") s += `<circle cx="${x + cel / 2}" cy="${y + cel / 2}" r="3.6" fill="#2a9d55"/>`;
      else if (ch === "x") s += `<rect x="${x + 1}" y="${y + 1}" width="${cel - 2}" height="${cel - 2}" fill="none" stroke="#e63946" stroke-width="2.5" rx="3"/>`;
      else if (ch === "+") s += `<text x="${x + cel / 2}" y="${y + cel * 0.74}" font-size="${cel * 0.7}" text-anchor="middle">⭐</text>`;
      else if (ch !== ".") {
        const t = "pnbrqk".indexOf(ch.toLowerCase()) + 1;
        if (t) s += `<svg x="${x}" y="${y}" width="${cel}" height="${cel}" viewBox="0 0 100 100">${corpoPeca(t, ch === ch.toUpperCase() ? "#fffaf0" : "#34303d", ch === ch.toUpperCase() ? "#3d2b1a" : "#0c0b10", ch === ch.toUpperCase() ? "#3d2b1a" : "#a59cba")}</svg>`;
      }
    }));
    return s + "</svg>";
  }
  const pecaSolta = (p, larg = 64) => pecaSVG(p).replace("<svg ", `<svg style="width:${larg}px" `);

  const ICONE = `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="1" y="1" width="62" height="62" rx="9" fill="#5a3418"/><rect x="5" y="5" width="27" height="27" fill="#f0d9b5"/><rect x="32" y="5" width="27" height="27" fill="#b07a4f"/><rect x="5" y="32" width="27" height="27" fill="#b07a4f"/><rect x="32" y="32" width="27" height="27" fill="#f0d9b5"/><svg x="6" y="4" width="54" height="56" viewBox="0 0 100 100">${corpoPeca(2, "#fffaf0", "#3d2b1a", "#3d2b1a")}</svg></svg>`;

  // =====================================================================
  // TEXTOS
  // =====================================================================
  const EXPLICA = [null,
    "O peão anda uma casa para a frente. Na primeira vez, pode andar duas. Ele captura na diagonal, uma casa à frente.",
    "O cavalo anda em L: duas casas para um lado e uma para o outro. Ele é a única peça que pula por cima das outras!",
    "O bispo anda na diagonal, quantas casas quiser. Ele fica sempre na mesma cor de casa.",
    "A torre anda em linha reta: para a frente, para trás e para os lados, quantas casas quiser.",
    "A dama é a peça mais forte: anda em linha reta e na diagonal, quantas casas quiser.",
    "O rei anda só uma casa, para qualquer lado. Ele nunca pode ficar em xeque: proteja o seu rei!",
  ];

  // Peça em perigo: atacada e sem defesa, ou atacada por uma peça mais barata
  function emPerigo(b, sq) {
    const p = b[sq], t = Math.abs(p), cor = Math.sign(p);
    if (!p || t === 6) return false;
    const atac = X.menorAtacante(b, sq, -cor);
    if (!atac) return false;
    return !X.atacada(b, sq, cor) || atac < X.VAL[t];
  }

  // Explica a jogada sugerida pela 💡 Dica, em linguagem simples
  function explicarDica(pos, m) {
    const t = Math.abs(m.p), peca = `${seu(t)} ${NOME[t]}`, para = nomeCasa(m.para);
    const n = X.aplicar(pos, m);
    if (X.emXeque(n) && !X.legais(n).length) return `Leve ${peca} para ${para}: é xeque-mate!`;
    if (m.roque) return `Faça o roque ${m.roque === 1 ? "pequeno" : "grande"}: toque no rei e depois em ${para}. O rei fica protegido e a torre entra no jogo!`;
    if (m.promo) return `${Maiusc(peca)} pode chegar ao fim do tabuleiro, em ${para}, e virar dama!`;
    if (m.ep) return `${Maiusc(peca)} pode capturar o peão en passant, indo para ${para}!`;
    if (m.cap) return `${Maiusc(peca)} pode capturar ${art(Math.abs(m.cap))} ${NOME[Math.abs(m.cap)]} em ${para}!`;
    if (X.emXeque(pos)) return t === 6 ? `Seu rei está em xeque! Fuja com ele para ${para}.` : `Seu rei está em xeque! Proteja o rei levando ${peca} para ${para}.`;
    if (emPerigo(pos.b, m.de)) return `${Maiusc(peca)} está em perigo! Leve ${art(t)} ${NOME[t]} para ${para}, onde fica mais seguro.`;
    if (X.emXeque(n)) return `${Maiusc(peca)} pode dar xeque no rei, indo para ${para}!`;
    // Passa a atacar uma peça importante?
    const alvos = X.pseudo({ ...n, vez: pos.vez, ep: -1, roque: 0 }, m.para).filter(x => x.cap && Math.abs(x.cap) !== 6 && emPerigo(n.b, x.para));
    if (alvos.length) {
      const a = Math.abs(alvos.sort((x, y) => Math.abs(y.cap) - Math.abs(x.cap))[0].cap);
      return `Leve ${peca} para ${para}: ${FEM[t] ? "ela" : "ele"} vai atacar ${art(a)} ${NOME[a]} do outro!`;
    }
    const linhaInicial = pos.vez === 1 ? 7 : 0;
    if ((t === 2 || t === 3) && m.de >> 3 === linhaInicial) return `Tire ${art(t)} ${NOME[t]} de casa: em ${para} ele ajuda a controlar o centro.`;
    if (t === 1 && [3, 4].includes(m.para & 7)) return `Avance o peão para ${para}: ele ocupa o centro do tabuleiro.`;
    return `Uma boa jogada: leve ${peca} para ${para}.`;
  }

  // Frase curta descrevendo a jogada (no balão)
  function descrever(m) {
    const t = Math.abs(m.p);
    if (m.roque) return m.roque === 1 ? "Roque pequeno" : "Roque grande";
    let s = `${Maiusc(NOME[t])} ${nomeCasa(m.de)} → ${nomeCasa(m.para)}`;
    if (m.ep) s += " (en passant)";
    else if (m.cap) s += `, captura ${art(Math.abs(m.cap))} ${NOME[Math.abs(m.cap)]}`;
    if (m.promo) s += `, vira ${NOME[m.promo]}`;
    return s;
  }

  // =====================================================================
  // TELA E TABULEIRO (usados na partida, nas lições e nos desafios)
  // =====================================================================
  // Tela: topo (jogador de cima / título), tabuleiro, baixo (jogador de baixo), balão e botões.
  function montarTela(area) {
    area.innerHTML = "";
    const el = document.createElement("div");
    el.className = "xz-tela";
    const parte = (classe, tag = "div") => { const d = document.createElement(tag); d.className = classe; el.appendChild(d); return d; };
    const topo = parte("xz-topo"), slot = parte("xz-slot"), baixo = parte("xz-baixo"), msg = parte("xz-msg"), botoes = parte("xz-botoes");
    msg.innerHTML = `<span class="xz-coruja">🦉</span><span class="xz-texto"></span>`;
    area.appendChild(el);
    const tela = {
      el, topo, slot, baixo, msg, botoes, tab: null,
      texto(t) { msg.querySelector(".xz-texto").textContent = t; msg.classList.remove("novo"); void msg.offsetWidth; msg.classList.add("novo"); },
      botao(icone, rotulo, fn, classe = "") {
        const b = document.createElement("button");
        b.className = "xz-btn " + classe;
        b.innerHTML = `<span class="ic"></span><span class="rot"></span>`;
        b.querySelector(".ic").textContent = icone;
        b.querySelector(".rot").textContent = rotulo;
        b.addEventListener("click", fn);
        botoes.appendChild(b);
        return b;
      },
      ajustar() {
        if (!tela.tab) return;
        const w = el.clientWidth, h = el.clientHeight;
        const deitado = w > h * 1.12;
        el.classList.toggle("deitado", deitado);
        let lado;
        if (deitado) lado = Math.min(h, w - botoes.offsetWidth - Math.min(420, Math.max(250, w * 0.26)) - 28);
        else {
          tela.tab.tamanho(40);
          const outros = topo.offsetHeight + baixo.offsetHeight + msg.offsetHeight + botoes.offsetHeight + 4 * 8;
          lado = Math.min(w, h - outros, 760);
        }
        tela.tab.tamanho(Math.max(200, Math.floor(lado)));
      },
    };
    const sessao = Motor.sessaoAtual();
    let espera = null;
    const aoRedimensionar = () => {
      if (sessao !== Motor.sessaoAtual() || !document.contains(el)) { window.removeEventListener("resize", aoRedimensionar); return; }
      clearTimeout(espera);
      espera = setTimeout(() => tela.ajustar(), 120);
    };
    window.addEventListener("resize", aoRedimensionar);
    return tela;
  }

  // Tabuleiro de madeira com coordenadas. As 64 casas são botões criados uma vez só (o destaque
  // do controle continua na mesma casa); `desenhar(estado)` só atualiza o que mudou.
  function criarTabuleiro({ aoTocar, aoArrastar }) {
    const moldura = document.createElement("div");
    moldura.className = "xz-moldura";
    const grade = document.createElement("div");
    grade.className = "xz-grade";
    moldura.appendChild(grade);
    const letras = [], numeros = [];
    for (let i = 0; i < 8; i++) {
      const l = document.createElement("span"); l.className = "xz-coord col"; moldura.appendChild(l); letras.push(l);
      const n = document.createElement("span"); n.className = "xz-coord lin"; moldura.appendChild(n); numeros.push(n);
    }
    const casas = [];
    for (let i = 0; i < 64; i++) {
      const b = document.createElement("button");
      b.addEventListener("click", () => aoTocar(b._sq, b));
      grade.appendChild(b);
      casas.push(b);
    }
    const tab = {
      el: moldura, virado: null, casas,
      mapear(v) {
        tab.virado = v;
        casas.forEach((b, i) => {
          const sq = v ? 63 - i : i;
          b._sq = sq;
          b._p = undefined; // desenha a peça de novo
          b.className = "xz-casa " + (((sq >> 3) + (sq & 7)) % 2 ? "escura" : "clara");
          b.setAttribute("aria-label", nomeCasa(sq));
        });
        for (let i = 0; i < 8; i++) {
          letras[i].textContent = "abcdefgh"[v ? 7 - i : i];
          numeros[i].textContent = v ? i + 1 : 8 - i;
        }
      },
      casaDe: sq => casas.find(b => b._sq === sq),
      tamanho(lado) {
        const m = Math.max(17, Math.min(28, Math.round(lado * 0.042)));
        const g = Math.floor((lado - 2 * m) / 8) * 8;
        moldura.style.padding = m + "px";
        moldura.style.setProperty("--m", m + "px");
        grade.style.width = grade.style.height = g + "px";
        moldura.style.fontSize = Math.max(13, Math.round(m * 0.72)) + "px";
        letras.forEach((l, i) => { l.style.left = m + (i + 0.5) * g / 8 + "px"; });
        numeros.forEach((n, i) => { n.style.top = m + (i + 0.5) * g / 8 + "px"; });
      },
      // estado: { b, sel, destinos: Map(sq → "mov"|"cap"), ultima: [de, para], xeque, dica: [de, para],
      //           perigo: Set, estrelas: Set, arrastaveis: Set, desligado }
      desenhar(st) {
        const ult = st.ultima || [], dica = st.dica || [];
        casas.forEach(b => {
          const sq = b._sq, p = st.b[sq];
          const tipo = st.destinos && st.destinos.get(sq);
          b.classList.toggle("sel", st.sel === sq);
          b.classList.toggle("mov", tipo === "mov");
          b.classList.toggle("cap", tipo === "cap");
          b.classList.toggle("ultima", ult.includes(sq));
          b.classList.toggle("xeque", st.xeque === sq);
          b.classList.toggle("dica", dica.includes(sq));
          b.classList.toggle("perigo", !!(st.perigo && st.perigo.has(sq)));
          b.classList.toggle("xz-estrela", !!(st.estrelas && st.estrelas.has(sq)));
          b.disabled = !!st.desligado;
          if (b._p !== p) {
            b._p = p;
            const velha = b.querySelector(".xz-peca");
            if (velha) velha.remove();
            if (p) {
              const s = document.createElement("span");
              s.className = "xz-peca";
              s.dataset.p = p;
              s.innerHTML = pecaSVG(p);
              Motor.arrastavel(s, {
                alvos: () => casas.filter(c => c.classList.contains("mov") || c.classList.contains("cap")),
                aoComecar: () => aoArrastar(b._sq),
                aoSoltar: alvo => aoTocar(alvo._sq, alvo) === true,
              });
              b.appendChild(s);
            }
          }
          const s = b.querySelector(".xz-peca");
          if (s) s.disabled = !(st.arrastaveis && st.arrastaveis.has(sq));
        });
      },
      // A peça que acabou de chegar em `para` desliza desde `de`
      deslizar(de, para, ms = 320) {
        const a = tab.casaDe(de), b = tab.casaDe(para);
        const el = b && b.querySelector(".xz-peca");
        if (!a || !el) return;
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        el.animate([{ transform: `translate(${ra.left - rb.left}px, ${ra.top - rb.top}px) scale(1.12)`, zIndex: 3 }, { transform: "none", zIndex: 3 }],
          { duration: ms, easing: "ease-in-out" });
      },
    };
    return tab;
  }

  // Cartão de jogador: peça do rei da cor, nome, peças capturadas
  function cartaoJogador(el, { cor, nome, vez, pensando, b }) {
    const inicial = { 1: 8, 2: 2, 3: 2, 4: 2, 5: 1 };
    const conta = {};
    let matMeu = 0, matOutro = 0;
    for (let s = 0; s < 64; s++) {
      const p = b[s];
      if (!p || Math.abs(p) === 6) continue;
      if (Math.sign(p) === -cor) conta[Math.abs(p)] = (conta[Math.abs(p)] || 0) + 1;
      if (Math.sign(p) === cor) matMeu += X.VAL[Math.abs(p)]; else matOutro += X.VAL[Math.abs(p)];
    }
    let capt = "";
    [5, 4, 3, 2, 1].forEach(t => { for (let i = (conta[t] || 0); i < inicial[t]; i++) capt += `<span class="xz-capt">${pecaSVG(-cor * t)}</span>`; });
    const dif = Math.round((matMeu - matOutro) / 100);
    el.className = el.className.replace(/ ?(da-vez|pensando)/g, "") + (vez ? " da-vez" : "") + (pensando ? " pensando" : "");
    el.innerHTML = `<span class="xz-rei">${pecaSVG(6 * cor)}</span><span class="xz-nome"></span><span class="xz-capts">${capt}${dif > 0 ? `<b>+${dif}</b>` : ""}</span>`;
    el.querySelector(".xz-nome").textContent = nome + (pensando ? " pensando…" : "");
  }

  // =====================================================================
  // PARTIDA
  // =====================================================================
  const OPCOES = [
    { chave: "modo", titulo: "Jogar contra", valores: [["robo", "🤖 Computador"], ["dois", "👥 2 jogadores"]] },
    { chave: "nivel", quando: op => op.modo !== "dois", titulo: "Computador", valores: [["facil", "😊 Fácil"], ["medio", "🧠 Médio"], ["dificil", "🦉 Difícil"]] },
    { chave: "cor", titulo: "Suas peças", valores: [["b", "⚪ Brancas (começam)"], ["p", "⚫ Pretas"]] },
    { chave: "dicas", regra: true, titulo: "Mostrar para onde a peça vai", valores: [["sim", "💡 Sim"], ["nao", "🙈 Não"]] },
    { chave: "avisos", regra: true, titulo: "Avisos de xeque e de perigo", valores: [["sim", "🔔 Sim"], ["nao", "🔕 Não"]] },
    { chave: "promo", regra: true, titulo: "Peão que chega ao fim vira", valores: [["dama", "👑 Sempre dama"], ["escolher", "🤔 Eu escolho"]] },
    { chave: "girar", regra: true, quando: op => op.modo === "dois", titulo: "2 jogadores: girar o tabuleiro", valores: [["sim", "🔄 Sim"], ["nao", "⏹️ Não"]] },
  ];
  const PADRAO = {
    "6-8": { modo: "robo", nivel: "facil", cor: "b", dicas: "sim", avisos: "sim", promo: "dama", girar: "sim" },
    "8-10": { modo: "robo", nivel: "medio", cor: "b", dicas: "sim", avisos: "sim", promo: "escolher", girar: "sim" },
  };
  const NIVEIS = { facil: "😊 Fácil", medio: "🧠 Médio", dificil: "🦉 Difícil" };

  function telaInicial(area, faixa) {
    const id = (faixa && faixa.id) || "6-8";
    Motor.escolherModo(area, [
      { icone: ICONE, rotulo: "Jogar", iniciar: () => opcoes(area, id) },
      { icone: "🎓", rotulo: "Aprender as peças", iniciar: () => menuLicoes(area, id) },
      { icone: "🧩", rotulo: "Desafios de xeque-mate", iniciar: () => menuDesafios(area, id) },
    ]);
  }

  function opcoes(area, id) {
    Motor.telaOpcoes(area, {
      opcoes: OPCOES, padrao: PADRAO[id] || PADRAO["6-8"], chave: `xadrez-opcoes-${id}`,
      antes: Placar.painel("xadrez", { comZerar: true }),
      aoJogar: op => partida(area, op, id),
    });
  }

  function partida(area, op, idFaixa) {
    const contraRobo = op.modo === "robo";
    const minha = contraRobo ? (op.cor === "p" ? -1 : 1) : 1;
    const mostrar = op.dicas !== "nao", avisos = op.avisos !== "nao", sempreDama = op.promo !== "escolher";
    const girar = !contraRobo && op.girar !== "nao";
    let pos = X.deFEN(INICIAL);
    const hist = [];         // posições antes de cada jogada
    const chaves = [X.chave(pos)];
    let sel = -1, destinos = new Map(), dica = null, perigo = new Set(), ultima = null;
    let acabou = false, pensando = false, promoAberta = false, viradoManual = false, calculandoDica = false;
    let cancelar = null, vezDoPedido = 0;
    const explicadas = new Set();
    let falouRoque = false;

    const tela = montarTela(area);
    const tab = criarTabuleiro({ aoTocar: tocar, aoArrastar: sq => { if (daVez() && sel !== sq) escolher(sq, true); } });
    tela.tab = tab;
    tela.slot.appendChild(tab.el);
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela.el);
    tela.el.classList.toggle("sem-pontos", !mostrar);

    const btDica = tela.botao("💡", "Dica", pedirDica, "dica");
    const btDesfazer = tela.botao("↩️", "Desfazer", desfazer);
    if (!contraRobo) tela.botao("🔄", "Girar", () => { viradoManual = !viradoManual; render(); Motor.ploc(); });
    tela.botoes.appendChild(Motor.botaoSom());

    const daVez = () => !acabou && !pensando && !promoAberta && (!contraRobo || pos.vez === minha);
    const virado = () => (contraRobo ? minha === -1 : (girar && pos.vez === -1) !== viradoManual);
    const nomeDe = cor => (contraRobo ? (cor === minha ? "🧒 Você" : `🤖 ${NIVEIS[op.nivel]}`) : cor === 1 ? "Brancas" : "Pretas");

    function render() {
      const v = virado();
      if (v !== tab.virado) tab.mapear(v);
      const pode = new Set();
      if (daVez()) X.legais(pos).forEach(m => pode.add(m.de));
      tab.desenhar({
        b: pos.b, sel, destinos, ultima: ultima && [ultima.de, ultima.para],
        xeque: X.emXeque(pos) ? X.rei(pos.b, pos.vez) : -1, dica, perigo: avisos ? perigo : null,
        arrastaveis: pode, desligado: promoAberta,
      });
      const deCima = v ? 1 : -1;
      cartaoJogador(tela.topo, { cor: deCima, nome: nomeDe(deCima), vez: !acabou && pos.vez === deCima, pensando: pensando && pos.vez === deCima, b: pos.b });
      cartaoJogador(tela.baixo, { cor: -deCima, nome: nomeDe(-deCima), vez: !acabou && pos.vez === -deCima, pensando: pensando && pos.vez === -deCima, b: pos.b });
      btDesfazer.disabled = acabou || !hist.length || promoAberta || (contraRobo && !hist.some(h => h.pos.vez === minha));
      btDica.disabled = !daVez() || calculandoDica;
    }

    function limparSelecao() { sel = -1; destinos = new Map(); }

    function escolher(sq, arrastando = false) {
      const ms = X.legais(pos, sq);
      const casa = tab.casaDe(sq);
      if (!ms.length) {
        limparSelecao();
        render();
        Motor.animar(casa, "balanca");
        if (X.emXeque(pos)) Motor.falar("Seu rei está em xeque! Essa peça não consegue proteger o rei.");
        else Motor.falar(`${Maiusc(art(Math.abs(pos.b[sq])))} ${NOME[Math.abs(pos.b[sq])]} não pode andar agora.`);
        return;
      }
      sel = sq;
      destinos = new Map();
      ms.forEach(m => destinos.set(m.para, m.cap ? "cap" : "mov"));
      if (dica && dica[0] !== sq) dica = null;
      if (!arrastando) Motor.ploc();
      const t = Math.abs(pos.b[sq]);
      if (mostrar && !explicadas.has(t)) {
        explicadas.add(t);
        Motor.falar(EXPLICA[t]);
        tela.texto(EXPLICA[t]);
      } else if (mostrar && t === 6 && ms.some(m => m.roque) && !falouRoque) {
        falouRoque = true;
        const fala = "Você pode fazer o roque! Toque na casa a duas casas do rei, do lado da torre.";
        Motor.falar(fala);
        tela.texto(fala);
      } else if (mostrar && ms.some(m => m.ep)) {
        const fala = "Esse peão pode capturar en passant!";
        Motor.falar(fala);
        tela.texto(fala);
      }
      render();
    }

    // Toque (ou soltar a peça arrastada) numa casa. Devolve true se jogou.
    function tocar(sq, casa) {
      if (!daVez()) {
        if (pensando) Motor.falar("Espere: o computador está pensando.");
        return false;
      }
      if (sel >= 0 && destinos.has(sq)) {
        const ms = X.legais(pos, sel).filter(m => m.para === sq);
        if (ms.length > 1) { // promoção
          if (sempreDama) jogar(ms.find(m => m.promo === 5));
          else abrirPromocao(ms);
        } else jogar(ms[0]);
        return true;
      }
      const p = pos.b[sq];
      if (p && Math.sign(p) === pos.vez) { escolher(sq); return false; }
      if (sel >= 0) { limparSelecao(); render(); return false; }
      Motor.animar(casa, "balanca");
      if (p && contraRobo) Motor.falar("Essa peça é do computador. Toque numa peça sua!");
      return false;
    }

    function abrirPromocao(ms) {
      promoAberta = true;
      render();
      const caixa = document.createElement("div");
      caixa.className = "xz-promo";
      caixa.innerHTML = `<div class="xz-promo-titulo">O peão chegou ao fim! Vira:</div><div class="xz-promo-pecas"></div>`;
      [5, 4, 3, 2].forEach(t => {
        const b = document.createElement("button");
        b.className = "xz-promo-peca";
        b.innerHTML = `${pecaSVG(t * pos.vez)}<span>${Maiusc(NOME[t])}</span>`;
        b.addEventListener("click", () => {
          caixa.remove();
          promoAberta = false;
          jogar(ms.find(m => m.promo === t));
        });
        caixa.querySelector(".xz-promo-pecas").appendChild(b);
      });
      tela.el.appendChild(caixa);
      Motor.falar("O peão chegou ao fim do tabuleiro! Escolha em que peça ele vira.");
    }

    function jogar(m) {
      hist.push({ pos, ultima, nChaves: chaves.length });
      const quem = pos.vez;
      pos = X.aplicar(pos, m);
      chaves.push(X.chave(pos));
      ultima = m;
      limparSelecao();
      dica = null;
      perigo = new Set();
      if (m.cap) { Motor.nota(520, { dur: 0.14, vol: 0.25 }); Motor.nota(330, { dur: 0.22, vol: 0.22, inicio: 0.1 }); } else Motor.ploc();
      render();
      tab.deslizar(m.de, m.para);
      if (m.roque) tab.deslizar(m.roque === 1 ? m.de + 3 : m.de - 4, m.roque === 1 ? m.de + 1 : m.de - 1);
      tela.texto(`${contraRobo ? (quem === minha ? "Você" : "Computador") : Maiusc(COR_NOME[quem])}: ${descrever(m)}`);

      const fim = resultado();
      if (fim) return terminar(fim);
      const xeque = X.emXeque(pos);
      const falas = [];
      if (m.promo) falas.push(`O peão virou ${NOME[m.promo]}!`);
      if (contraRobo && quem !== minha) {
        if (m.cap) falas.push(`O computador capturou ${seu(Math.abs(m.cap))} ${NOME[Math.abs(m.cap)]}.`);
        if (xeque) falas.push(avisos ? "Xeque! Seu rei está sendo atacado. Proteja o rei!" : "Xeque!");
      } else if (xeque) falas.push(contraRobo ? "Xeque! Você atacou o rei!" : `Xeque! ${Maiusc(COR_NOME[pos.vez])}, protejam o rei!`);
      if (!contraRobo && !xeque) falas.push(`Vez das ${COR_NOME[pos.vez]}!`);
      if (avisos && !xeque && (!contraRobo || pos.vez === minha)) {
        const lista = [];
        for (let s = 0; s < 64; s++) if (pos.b[s] && Math.sign(pos.b[s]) === pos.vez && emPerigo(pos.b, s)) lista.push(s);
        perigo = new Set(lista);
        if (lista.length) {
          const t = Math.max(...lista.map(s => Math.abs(pos.b[s])));
          falas.push(`Cuidado! ${Maiusc(seu(t))} ${NOME[t]} está em perigo.`);
          render();
        }
      }
      if (falas.length) {
        Motor.falar(falas.join(" "));
        if (xeque || perigo.size) tela.texto(falas.join(" "));
      }
      if (contraRobo && pos.vez !== minha) vezDoRobo();
    }

    function resultado() {
      if (!X.legais(pos).length) return X.emXeque(pos) ? { tipo: "mate", vencedor: -pos.vez } : { tipo: "afogado" };
      if (pos.meio >= 100) return { tipo: "50" };
      const k = chaves[chaves.length - 1];
      if (chaves.filter(x => x === k).length >= 3) return { tipo: "repeticao" };
      if (X.insuficiente(pos.b)) return { tipo: "material" };
      return null;
    }

    function acharMov(m) {
      const ms = X.legais(pos);
      return (m && ms.find(x => x.de === m.de && x.para === m.para && x.promo === m.promo)) || Motor.sortear(ms);
    }

    function vezDoRobo() {
      pensando = true;
      render();
      const pedido = ++vezDoPedido, inicio = Date.now();
      const p0 = pos;
      Motor.depois(() => {
        if (pedido !== vezDoPedido || !vivo()) return;
        cancelar = calcular(p0, op.nivel, m => {
          cancelar = null;
          if (pedido !== vezDoPedido || !vivo()) return;
          Motor.depois(() => {
            if (pedido !== vezDoPedido || !vivo() || acabou) return;
            const j = acharMov(m);
            // mostra de onde a peça sai antes de mexer
            tab.casaDe(j.de).classList.add("dica");
            Motor.depois(() => {
              if (pedido !== vezDoPedido || !vivo() || acabou) return;
              pensando = false;
              jogar(j);
            }, 450);
          }, Math.max(0, 650 - (Date.now() - inicio)));
        });
      }, 350);
    }

    function pedirDica() {
      if (!daVez() || calculandoDica) return;
      calculandoDica = true;
      render();
      tela.texto("Hmm… deixa eu pensar numa boa jogada…");
      const pedido = vezDoPedido, p0 = pos;
      cancelar = calcular(p0, "dica", m => {
        cancelar = null;
        calculandoDica = false;
        if (pedido !== vezDoPedido || !vivo() || pos !== p0) { if (vivo()) render(); return; }
        const j = acharMov(m);
        const texto = explicarDica(pos, j);
        dica = [j.de, j.para];
        sel = j.de;
        destinos = new Map();
        X.legais(pos, j.de).forEach(x => destinos.set(x.para, x.cap ? "cap" : "mov"));
        tela.texto("💡 " + texto);
        Motor.falar(texto);
        render();
      });
    }

    function desfazer() {
      if (acabou || !hist.length || promoAberta) return;
      if (cancelar) { cancelar(); cancelar = null; }
      vezDoPedido++;
      pensando = false;
      calculandoDica = false;
      let h = hist.pop();
      if (contraRobo) while (h.pos.vez !== minha && hist.length) h = hist.pop();
      pos = h.pos;
      ultima = h.ultima;
      chaves.length = h.nChaves;
      limparSelecao();
      dica = null;
      perigo = new Set();
      Motor.ploc();
      tela.texto("Jogada desfeita. Tente outra!");
      Motor.falar("Jogada desfeita.");
      render();
      if (contraRobo && pos.vez !== minha) vezDoRobo();
    }

    function terminar(fim) {
      acabou = true;
      render();
      let frase, explica = "";
      const ganhei = fim.tipo === "mate" && contraRobo && fim.vencedor === minha;
      if (fim.tipo === "mate") {
        frase = contraRobo ? (ganhei ? "Xeque-mate! Você ganhou!" : "Xeque-mate! O computador ganhou desta vez!") : `Xeque-mate! As ${COR_NOME[fim.vencedor]} ganharam!`;
        explica = "O rei está em xeque e não tem como escapar.";
      } else {
        frase = "Empate!";
        explica = {
          afogado: "Afogamento: o rei não está em xeque, mas não tem nenhuma jogada.",
          50: "Foram 50 lances de cada lado sem captura e sem andar peão.",
          repeticao: "A mesma posição se repetiu três vezes.",
          material: "Ninguém tem peças suficientes para dar xeque-mate.",
        }[fim.tipo];
      }
      tela.texto(`${frase} ${explica}`);
      if (fim.tipo === "mate") Motor.nota(220, { dur: 0.5, vol: 0.25 });
      Motor.falar(`${frase} ${explica}`);
      Motor.depois(() => {
        if (!vivo()) return;
        area.innerHTML = "";
        const caixa = document.createElement("div");
        caixa.className = "fim xz-fim";
        caixa.innerHTML = `<div class="trofeu"></div><div class="resumo"></div><div class="xz-fim-explica"></div>`;
        caixa.querySelector(".trofeu").innerHTML = fim.tipo !== "mate" ? "🤝" : contraRobo ? (ganhei ? "🏆" : "🤖") : pecaSolta(6 * fim.vencedor, 96);
        caixa.querySelector(".resumo").textContent = frase;
        caixa.querySelector(".xz-fim-explica").textContent = explica;
        if (contraRobo) {
          const seq = Placar.resultado("xadrez", fim.tipo !== "mate" ? null
            : ganhei ? { id: "voce", rotulo: "🧒 Você" } : { id: `robo-${op.nivel}`, rotulo: `🤖 ${NIVEIS[op.nivel]}` });
          caixa.appendChild(Placar.painel("xadrez"));
          if (seq.novaMelhorSequencia) Motor.depois(() => Motor.falar(`${seq.sequencia} vitórias seguidas! É o seu recorde!`), 600);
        }
        const linha = document.createElement("div");
        linha.className = "xz-fim-botoes";
        const botao = (icone, rotulo, fn) => {
          const b = document.createElement("button");
          b.className = "modo";
          b.innerHTML = `<span class="icone">${icone}</span><span class="rotulo">${rotulo}</span>`;
          b.addEventListener("click", fn);
          linha.appendChild(b);
          return b;
        };
        botao("🔁", "Jogar de novo", () => partida(area, op, idFaixa));
        botao("⚙️", "Opções", () => opcoes(area, idFaixa));
        caixa.appendChild(linha);
        area.appendChild(caixa);
        if (ganhei || (!contraRobo && fim.tipo === "mate")) { Motor.comemorar(caixa.querySelector(".trofeu")); Motor.tim(); }
      }, 3200);
    }

    tab.mapear(virado());
    render();
    tela.ajustar();
    requestAnimationFrame(() => { if (vivo()) tela.ajustar(); });
    if (contraRobo && minha === -1) {
      tela.texto("As brancas começam. O computador joga primeiro!");
      Motor.falar("As brancas começam. O computador joga primeiro!");
      vezDoRobo();
    } else {
      const fala = contraRobo ? "Você começa com as brancas! Toque numa peça e depois na casa para onde ela vai." : "As brancas começam!";
      tela.texto(fala + (mostrar ? " Precisa de ajuda? Toque em 💡 Dica." : ""));
      Motor.falar(fala);
    }
  }

  // =====================================================================
  // APRENDER: lições das peças e das regras especiais
  // =====================================================================
  // tipo "estrelas": a peça anda sozinha (ou com obstáculos) pegando as estrelas.
  // tipo "tarefa": posição de verdade; `pre` = jogada do outro lado antes; `ok(m, n)` diz se acertou.
  const LICOES = [
    { id: "torre", nome: "Torre", peca: 4, texto: EXPLICA[4],
      fases: [{ pecas: { a1: "R" }, estrelas: ["a6", "f6", "f2"] }, { pecas: { d4: "R", d6: "P" }, estrelas: ["a4", "a8", "h8"], fala: "As peças não pulam as outras: a torre não passa pelo peão." }] },
    { id: "bispo", nome: "Bispo", peca: 3, texto: EXPLICA[3],
      fases: [{ pecas: { c1: "B" }, estrelas: ["e3", "g5", "d8"] }, { pecas: { f1: "B" }, estrelas: ["b5", "e8", "h5"] }] },
    { id: "dama", nome: "Dama", peca: 5, texto: EXPLICA[5],
      fases: [{ pecas: { d1: "Q" }, estrelas: ["d5", "g8", "a2"] }, { pecas: { e4: "Q" }, estrelas: ["h7", "b7", "b1"] }] },
    { id: "rei", nome: "Rei", peca: 6, texto: EXPLICA[6],
      fases: [{ pecas: { e1: "K" }, estrelas: ["d2", "d3", "e4"] }, { pecas: { e4: "K" }, estrelas: ["f5", "g6", "h6"] }] },
    { id: "cavalo", nome: "Cavalo", peca: 2, texto: EXPLICA[2],
      fases: [{ pecas: { b1: "N" }, estrelas: ["c3", "d5", "f6"] }, { pecas: { g1: "N", f2: "P", g2: "P", h2: "P", e2: "P" }, estrelas: ["f3", "e5", "c6"], fala: "Viu? O cavalo pula por cima dos peões!" }] },
    { id: "peao", nome: "Peão", peca: 1, texto: EXPLICA[1],
      fases: [{ pecas: { e2: "P" }, estrelas: ["e4", "e6"], fala: "Na primeira vez o peão pode andar duas casas!" },
        { pecas: { d4: "P", e5: "n" }, estrelas: ["e5", "e8"], fala: "O peão captura na diagonal: pegue o cavalo preto! E chegando ao fim, ele vira dama." }] },
    { id: "xeque", nome: "Xeque", icone: "⚠️", tipo: "tarefa",
      texto: "Xeque é quando uma peça ataca o rei. Dê xeque no rei preto!",
      fases: [{ fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1", ok: (m, n) => X.emXeque(n), errou: "Isso ainda não ataca o rei. Procure uma casa onde a torre mire o rei preto." },
        { fen: "6k1/8/8/8/8/8/8/3BK3 w - - 0 1", ok: (m, n) => X.emXeque(n), errou: "O bispo anda na diagonal. Que diagonal chega no rei?" }] },
    { id: "roque", nome: "Roque", icone: "🏰", tipo: "tarefa",
      texto: "No roque, o rei anda duas casas para o lado da torre e a torre pula para o outro lado dele. Só pode se o rei e a torre ainda não andaram, não há peças entre eles e o rei não está em xeque nem passa por casa atacada.",
      fases: [{ fen: "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1", ok: m => m.roque === 1, fala: "Faça o roque pequeno: toque no rei e depois em g1.", errou: "Ainda não é o roque. Toque no rei e depois em g1." },
        { fen: "r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1", ok: m => m.roque === 2, fala: "Agora o roque grande: toque no rei e depois em c1.", errou: "Ainda não é o roque grande. Toque no rei e depois em c1." }] },
    { id: "enpassant", nome: "En passant", icone: "🎯", tipo: "tarefa",
      texto: "Quando um peão anda duas casas e para do lado do seu peão, você pode capturá-lo como se ele tivesse andado só uma. É a captura en passant, e só vale logo em seguida!",
      fases: [{ fen: "4k3/3p4/8/4P3/8/8/8/4K3 b - - 0 1", pre: ["d7", "d5"], ok: m => m.ep, fala: "O peão preto andou duas casas! Capture en passant: leve seu peão para d6.", errou: "Quase! Leve o seu peão na diagonal para d6, atrás do peão preto." }] },
    { id: "promocao", nome: "Promoção", icone: "👑", tipo: "tarefa",
      texto: "Quando o peão chega ao outro lado do tabuleiro, ele vira dama, torre, bispo ou cavalo. Quase sempre a dama é a melhor!",
      fases: [{ fen: "8/1P2k3/8/8/8/8/8/4K3 w - - 0 1", ok: m => m.promo, fala: "Leve o peão até o fim do tabuleiro e escolha a peça!", errou: "Leve o peão para a frente, até a última fileira." }] },
  ];

  const carregar = (k, padrao) => { try { return JSON.parse(localStorage.getItem(k)) || padrao; } catch (e) { return padrao; } };
  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };

  function menuLicoes(area, id) {
    const feitas = carregar("xadrez-licoes", []);
    Motor.escolherModo(area, LICOES.map((l, i) => ({
      icone: l.peca ? pecaSolta(l.peca, 56) : l.icone,
      rotulo: `${l.nome}${feitas.includes(l.id) ? " ⭐" : ""}`,
      iniciar: () => licao(area, id, i),
    })), { pequenos: true });
    Motor.falar("Escolha uma lição!");
  }

  function posicaoDe(pecas) {
    const b = new Int8Array(64);
    Object.entries(pecas).forEach(([c, ch]) => {
      const t = "pnbrqk".indexOf(ch.toLowerCase()) + 1;
      b[casaIdx(c)] = ch === ch.toUpperCase() ? t : -t;
    });
    return { b, vez: 1, roque: 0, ep: -1, meio: 0, lance: 1 };
  }

  function licao(area, idFaixa, indice) {
    const L = LICOES[indice];
    const tarefa = L.tipo === "tarefa";
    let fase = 0, pos, estrelas, sel = -1, destinos = new Map(), ultima = null, ocupado = false, promoAberta = false;
    const tela = montarTela(area);
    const tab = criarTabuleiro({ aoTocar: tocar, aoArrastar: sq => { if (!ocupado && sel !== sq) escolher(sq); } });
    tela.tab = tab;
    tela.slot.appendChild(tab.el);
    tela.el.classList.add("licao");
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela.el);
    tela.botao("🔁", "Recomeçar", () => { Motor.ploc(); comecarFase(false); });
    tela.botao("👂", "Ouvir", () => { Motor.falar(L.texto); tela.texto(L.texto); });
    tela.botao("📚", "Lições", () => menuLicoes(area, idFaixa));
    tela.botoes.appendChild(Motor.botaoSom());
    tab.mapear(false);

    function titulo() {
      const total = L.fases.length;
      tela.topo.className = "xz-topo xz-titulo";
      tela.topo.innerHTML = `<span class="xz-rei"></span><span class="xz-nome"></span><span class="xz-progresso"></span>`;
      tela.topo.querySelector(".xz-rei").innerHTML = L.peca ? pecaSVG(L.peca) : `<span class="xz-emoji">${L.icone}</span>`;
      tela.topo.querySelector(".xz-nome").textContent = L.nome;
      tela.topo.querySelector(".xz-progresso").textContent = "⭐".repeat(fase) + "☆".repeat(total - fase);
      tela.baixo.className = "xz-baixo xz-vazio";
      tela.baixo.textContent = tarefa ? "" : `Pegue ${estrelas.size === 1 ? "a estrela" : `as ${estrelas.size} estrelas`}!`;
      if (!tarefa) tela.baixo.className = "xz-baixo xz-faltam";
    }

    function render() {
      const pode = new Set();
      if (!ocupado) X.legais(pos).forEach(m => { if (podeMover(m.de)) pode.add(m.de); });
      tab.desenhar({ b: pos.b, sel, destinos, ultima: ultima && [ultima.de, ultima.para], estrelas, arrastaveis: pode,
        xeque: X.emXeque(pos) ? X.rei(pos.b, pos.vez) : -1, desligado: promoAberta });
      titulo();
    }

    // Nas lições de estrelas só a peça da lição anda (o peão que vira dama continua valendo)
    function podeMover(sq) {
      const p = pos.b[sq];
      if (!p || Math.sign(p) !== pos.vez) return false;
      return tarefa || Math.abs(p) === L.peca || (L.peca === 1 && Math.abs(p) === 5);
    }

    function comecarFase(primeira) {
      const F = L.fases[fase];
      sel = -1; destinos = new Map(); ultima = null; ocupado = false;
      if (tarefa) {
        pos = X.deFEN(F.fen);
        estrelas = new Set();
      } else {
        pos = posicaoDe(F.pecas);
        estrelas = new Set(F.estrelas.map(casaIdx));
      }
      render();
      const fala = (primeira && fase === 0 ? L.texto + " " : "") + (F.fala || (tarefa ? "" : "Pegue todas as estrelas!"));
      tela.texto(fala);
      Motor.falar(fala);
      if (F.pre) { // o outro lado joga primeiro
        ocupado = true;
        Motor.depois(() => {
          if (!vivo()) return;
          const m = X.legais(pos).find(x => x.de === casaIdx(F.pre[0]) && x.para === casaIdx(F.pre[1]));
          pos = X.aplicar(pos, m);
          ultima = m;
          ocupado = false;
          Motor.ploc();
          render();
          tab.deslizar(m.de, m.para, 500);
        }, 1600);
      }
    }

    function escolher(sq) {
      if (!podeMover(sq)) { Motor.animar(tab.casaDe(sq), "balanca"); return; }
      sel = sq;
      destinos = new Map();
      X.legais(pos, sq).forEach(m => destinos.set(m.para, m.cap ? "cap" : "mov"));
      Motor.ploc();
      render();
    }

    function tocar(sq, casa) {
      if (ocupado || promoAberta) return false;
      if (sel >= 0 && destinos.has(sq)) {
        const ms = X.legais(pos, sel).filter(m => m.para === sq);
        if (ms.length > 1 && tarefa) abrirPromocao(ms);
        else jogar(ms.find(m => m.promo === 5) || ms[0]);
        return true;
      }
      if (pos.b[sq] && podeMover(sq)) { escolher(sq); return false; }
      if (sel >= 0) { sel = -1; destinos = new Map(); render(); return false; }
      Motor.animar(casa, "balanca");
      return false;
    }

    function abrirPromocao(ms) {
      promoAberta = true;
      render();
      const caixa = document.createElement("div");
      caixa.className = "xz-promo";
      caixa.innerHTML = `<div class="xz-promo-titulo">O peão vira:</div><div class="xz-promo-pecas"></div>`;
      [5, 4, 3, 2].forEach(t => {
        const b = document.createElement("button");
        b.className = "xz-promo-peca";
        b.innerHTML = `${pecaSVG(t)}<span>${Maiusc(NOME[t])}</span>`;
        b.addEventListener("click", () => { caixa.remove(); promoAberta = false; jogar(ms.find(m => m.promo === t)); });
        caixa.querySelector(".xz-promo-pecas").appendChild(b);
      });
      tela.el.appendChild(caixa);
      Motor.falar("Escolha em que peça o peão vira!");
    }

    function jogar(m) {
      const antes = pos;
      const n = X.aplicar(pos, m);
      sel = -1; destinos = new Map(); ultima = m;
      if (tarefa) {
        pos = n;
        render();
        tab.deslizar(m.de, m.para);
        if (m.roque) tab.deslizar(m.roque === 1 ? m.de + 3 : m.de - 4, m.roque === 1 ? m.de + 1 : m.de - 1);
        if (L.fases[fase].ok(m, n)) return acertou(m.promo ? `Muito bem! O peão virou ${NOME[m.promo]}!` : null);
        ocupado = true;
        Motor.animar(tab.casaDe(m.para), "balanca");
        tela.texto(L.fases[fase].errou);
        Motor.falar(L.fases[fase].errou);
        Motor.depois(() => { if (!vivo()) return; pos = antes; ultima = null; ocupado = false; render(); }, 1500);
        return;
      }
      pos = { ...n, vez: 1, ep: -1 }; // só as brancas jogam nas lições de estrelas
      Motor.ploc();
      render();
      tab.deslizar(m.de, m.para);
      if (m.promo) { Motor.falar("O peão chegou ao fim e virou dama!"); tela.texto("O peão chegou ao fim e virou dama! 👑"); }
      if (estrelas.has(m.para)) {
        estrelas.delete(m.para);
        Motor.tim();
        const casa = tab.casaDe(m.para);
        Motor.comemorar(casa);
        render();
        if (!estrelas.size) return acertou();
      }
    }

    function acertou(fala) {
      ocupado = true;
      Motor.tim();
      fase++;
      render();
      const frase = fala || Motor.elogio();
      tela.texto(frase);
      Motor.falar(frase);
      if (fase < L.fases.length) { Motor.depois(() => { if (vivo()) comecarFase(false); }, 2000); return; }
      const feitas = carregar("xadrez-licoes", []);
      if (!feitas.includes(L.id)) guardar("xadrez-licoes", [...feitas, L.id]);
      Motor.depois(() => {
        if (!vivo()) return;
        area.innerHTML = "";
        const caixa = document.createElement("div");
        caixa.className = "fim xz-fim";
        caixa.innerHTML = `<div class="trofeu"></div><div class="estrelas">⭐⭐⭐</div><div class="resumo"></div>`;
        caixa.querySelector(".trofeu").innerHTML = L.peca ? pecaSolta(L.peca, 110) : L.icone;
        caixa.querySelector(".resumo").textContent = `Você aprendeu: ${L.nome}!`;
        const linha = document.createElement("div");
        linha.className = "xz-fim-botoes";
        const botao = (icone, rotulo, fn) => {
          const b = document.createElement("button");
          b.className = "modo";
          b.innerHTML = `<span class="icone">${icone}</span><span class="rotulo">${rotulo}</span>`;
          b.addEventListener("click", fn);
          linha.appendChild(b);
        };
        if (indice + 1 < LICOES.length) botao("➡️", `Próxima: ${LICOES[indice + 1].nome}`, () => licao(area, idFaixa, indice + 1));
        else botao("🧩", "Desafios", () => menuDesafios(area, idFaixa));
        botao("📚", "Lições", () => menuLicoes(area, idFaixa));
        caixa.appendChild(linha);
        area.appendChild(caixa);
        Motor.comemorar(caixa.querySelector(".trofeu"));
        Motor.falar(`Parabéns! Você aprendeu: ${L.nome}!`);
      }, 1800);
    }

    pos = tarefa ? X.deFEN(L.fases[0].fen) : posicaoDe(L.fases[0].pecas);
    estrelas = new Set();
    tela.ajustar();
    requestAnimationFrame(() => { if (vivo()) tela.ajustar(); });
    comecarFase(true);
  }

  // =====================================================================
  // DESAFIOS: xeque-mate em 1 lance (as brancas jogam)
  // =====================================================================
  const DESAFIOS = [
    { fen: "6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", dica: "A torre pode ir até a última fileira. Os peões pretos prendem o próprio rei!" },
    { fen: "7k/R7/8/8/8/8/8/1R4K1 w - - 0 1", dica: "Uma torre já segura a fileira 7. A outra pode atacar na fileira 8." },
    { fen: "k7/8/1K6/8/8/8/8/7Q w - - 0 1", dica: "O seu rei já cuida das casas perto do rei preto. Use a dama na fileira 8." },
    { fen: "4k3/8/4K3/8/8/8/8/7Q w - - 0 1", dica: "A dama pode atacar o rei pela fileira 8, e o seu rei segura as casas da frente." },
    { fen: "rnbqkbnr/ppppp2p/5p2/6p1/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1", dica: "A dama pode atacar o rei pela diagonal, de h5." },
    { fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1", dica: "O peão de f7 só é protegido pelo rei. Dama e bispo atacam juntos!" },
    { fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1", dica: "O rei preto está sufocado pelas próprias peças. O cavalo pode atacar de f7!" },
    { fen: "k7/2P5/1K6/8/8/8/8/8 w - - 0 1", dica: "O peão chega ao fim e vira dama… ou torre!" },
    { fen: "7k/6pp/8/8/8/8/1B6/K2Q4 w - - 0 1", dica: "A dama pode ir até a fileira 8, em d8." },
    { fen: "6k1/5ppp/7Q/8/8/8/1B6/6K1 w - - 0 1", dica: "O bispo de b2 mira até g7. A dama pode capturar lá, protegida por ele!" },
    { fen: "7k/R7/5N2/8/8/8/8/6K1 w - - 0 1", dica: "A torre pode atacar o rei na fileira 7. O cavalo protege a torre!" },
    { fen: "3r2k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1", dica: "A torre preta está sozinha na coluna d. A dama pode capturá-la!" },
  ];

  function menuDesafios(area, id) {
    const feitos = carregar("xadrez-desafios", []);
    Motor.escolherModo(area, DESAFIOS.map((d, i) => ({
      icone: feitos.includes(i) ? "✅" : "🧩",
      rotulo: `Desafio ${i + 1}`,
      iniciar: () => desafio(area, id, i),
    })), { pequenos: true });
    Motor.falar("Desafios de xeque-mate em um lance! Escolha um.");
  }

  function desafio(area, idFaixa, i) {
    const D = DESAFIOS[i];
    const inicial = X.deFEN(D.fen);
    let pos = inicial, sel = -1, destinos = new Map(), ultima = null, ocupado = false, dicas = 0, dicaCasas = null;
    const tela = montarTela(area);
    const tab = criarTabuleiro({ aoTocar: tocar, aoArrastar: sq => { if (!ocupado && sel !== sq) escolher(sq); } });
    tela.tab = tab;
    tela.slot.appendChild(tab.el);
    tela.el.classList.add("licao");
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela.el);
    tela.botao("💡", "Dica", darDica, "dica");
    tela.botao("⏭️", "Pular", () => proximo());
    tela.botao("🧩", "Desafios", () => menuDesafios(area, idFaixa));
    tela.botoes.appendChild(Motor.botaoSom());
    tab.mapear(false);
    const mates = X.legais(inicial).filter(m => { const n = X.aplicar(inicial, m); return X.emXeque(n) && !X.legais(n).length; });

    function render() {
      const pode = new Set();
      if (!ocupado) X.legais(pos).forEach(m => pode.add(m.de));
      tab.desenhar({ b: pos.b, sel, destinos, ultima: ultima && [ultima.de, ultima.para], arrastaveis: pode, dica: dicaCasas,
        xeque: X.emXeque(pos) ? X.rei(pos.b, pos.vez) : -1 });
      tela.topo.className = "xz-topo xz-titulo";
      tela.topo.innerHTML = `<span class="xz-rei"><span class="xz-emoji">🧩</span></span><span class="xz-nome"></span><span class="xz-progresso"></span>`;
      tela.topo.querySelector(".xz-nome").textContent = `Desafio ${i + 1}`;
      tela.topo.querySelector(".xz-progresso").textContent = `${i + 1}/${DESAFIOS.length}`;
      tela.baixo.className = "xz-baixo xz-faltam";
      tela.baixo.textContent = "Brancas jogam: xeque-mate em 1!";
    }

    function escolher(sq) {
      const p = pos.b[sq];
      if (!p || p < 0) { Motor.animar(tab.casaDe(sq), "balanca"); return; }
      sel = sq;
      destinos = new Map();
      X.legais(pos, sq).forEach(m => destinos.set(m.para, m.cap ? "cap" : "mov"));
      Motor.ploc();
      render();
    }

    function tocar(sq, casa) {
      if (ocupado) return false;
      if (sel >= 0 && destinos.has(sq)) {
        const ms = X.legais(pos, sel).filter(m => m.para === sq);
        // promoção: escolhe a peça que dá mate (dama, se servir)
        const m = ms.find(x => x.promo === 5 && mates.some(y => y.de === x.de && y.para === x.para && y.promo === 5))
          || ms.find(x => mates.some(y => y.de === x.de && y.para === x.para && y.promo === x.promo)) || ms[0];
        jogar(m);
        return true;
      }
      if (pos.b[sq] > 0) { escolher(sq); return false; }
      if (sel >= 0) { sel = -1; destinos = new Map(); render(); return false; }
      Motor.animar(casa, "balanca");
      return false;
    }

    function jogar(m) {
      const n = X.aplicar(pos, m);
      pos = n; ultima = m; sel = -1; destinos = new Map(); dicaCasas = null;
      Motor.ploc();
      render();
      tab.deslizar(m.de, m.para);
      ocupado = true;
      if (X.emXeque(n) && !X.legais(n).length) {
        Motor.tim();
        Motor.comemorar(tab.casaDe(m.para));
        const feitos = carregar("xadrez-desafios", []);
        if (!feitos.includes(i)) guardar("xadrez-desafios", [...feitos, i]);
        const fala = `Xeque-mate! ${Motor.elogio()}`;
        tela.texto(`${fala} (${descrever(m)})`);
        Motor.falar(fala);
        Motor.depois(() => { if (vivo()) proximo(); }, 2800);
        return;
      }
      const fala = X.emXeque(n) ? "É xeque, mas o rei ainda consegue escapar. Tente outra!" : "Isso não é xeque-mate. Tente outra jogada!";
      Motor.animar(tab.casaDe(m.para), "balanca");
      tela.texto(fala);
      Motor.falar(fala);
      Motor.depois(() => { if (!vivo()) return; pos = inicial; ultima = null; ocupado = false; render(); }, 1700);
    }

    function darDica() {
      if (ocupado) return;
      dicas++;
      const m = mates[0];
      if (dicas === 1) { tela.texto("💡 " + D.dica); Motor.falar(D.dica); }
      else {
        dicaCasas = [m.de, m.para];
        escolher(m.de);
        const fala = `Leve ${art(Math.abs(m.p))} ${NOME[Math.abs(m.p)]} para ${nomeCasa(m.para)}.`;
        tela.texto("💡 " + fala);
        Motor.falar(fala);
      }
      render();
    }

    function proximo() {
      if (i + 1 < DESAFIOS.length) return desafio(area, idFaixa, i + 1);
      const feitos = carregar("xadrez-desafios", []);
      area.innerHTML = "";
      const caixa = document.createElement("div");
      caixa.className = "fim xz-fim";
      caixa.innerHTML = `<div class="trofeu">🏆</div><div class="resumo"></div>`;
      caixa.querySelector(".resumo").textContent = `Você resolveu ${feitos.length} de ${DESAFIOS.length} desafios!`;
      const linha = document.createElement("div");
      linha.className = "xz-fim-botoes";
      const b = document.createElement("button");
      b.className = "modo";
      b.innerHTML = `<span class="icone">🧩</span><span class="rotulo">Desafios</span>`;
      b.addEventListener("click", () => menuDesafios(area, idFaixa));
      linha.appendChild(b);
      caixa.appendChild(linha);
      area.appendChild(caixa);
      Motor.comemorar(caixa.querySelector(".trofeu"));
      Motor.falar(caixa.querySelector(".resumo").textContent);
    }

    render();
    tela.ajustar();
    requestAnimationFrame(() => { if (vivo()) tela.ajustar(); });
    const fala = "As brancas jogam e dão xeque-mate em um lance! Ache a jogada.";
    tela.texto(fala);
    Motor.falar(fala);
  }

  // =====================================================================
  // REGISTRO
  // =====================================================================
  JOGOS.push({
    id: "xadrez",
    nome: "Xadrez",
    icone: ICONE,
    faixas: ["6-8", "8-10"],
    ajuda: [
      { figura: miniTab(["k...", "Q...", ".K..", "...."], { largura: 120 }),
        texto: "Cada jogador começa com 16 peças. Ganha quem der xeque-mate: atacar o rei do outro de um jeito que ele não consiga escapar." },
      { figura: `<svg viewBox="0 0 300 100" style="width:170px" aria-hidden="true">${[4, 3, 5].map((t, i) => `<svg x="${i * 100}" width="100" height="100" viewBox="0 0 100 100">${corpoPeca(t, "#fffaf0", "#3d2b1a", "#3d2b1a")}</svg>`).join("")}</svg>`,
        texto: "A torre anda em linha reta, o bispo na diagonal e a dama nas duas direções, quantas casas quiserem." },
      { figura: miniTab([".*.*.", "*...*", "..N..", "*...*", ".*.*."], { largura: 130 }),
        texto: "O cavalo anda em L e pula as outras peças. O rei anda só uma casa para qualquer lado." },
      { figura: miniTab(["..*..", "..*.x", "..Pp.", "....."], { largura: 130 }),
        texto: "O peão anda para a frente (duas casas na primeira vez) e captura na diagonal. Chegou ao outro lado? Vira dama, torre, bispo ou cavalo!" },
      { figura: [miniTab(["....K..R"], { largura: 150 }), miniTab([".....RK."], { largura: 150 })],
        texto: "Roque: o rei anda duas casas para o lado da torre e a torre pula para o outro lado dele. Só se nenhum dos dois andou e o rei não está em xeque." },
      { figura: "🤝",
        texto: "Empate: afogamento (sem jogada e sem xeque), 50 lances sem captura e sem andar peão, a mesma posição três vezes, ou peças de menos para dar mate." },
      { figura: "💡",
        texto: "Toque na peça e depois na casa (ou arraste). Os pontinhos mostram para onde ela pode ir. 💡 Dica sugere uma jogada e ↩️ desfaz." },
      { figura: "🎓",
        texto: "Em Aprender tem lições de cada peça, e em Desafios você treina o xeque-mate em um lance." },
    ],
    iniciar(area, faixa) { telaInicial(area, faixa); },
  });
  CATALOGO["xadrez"] = ["mesa", "Xadrez com dicas, lições e desafios"];

  // Para os testes automáticos (regras)
  window.__xadrez = { X, DESAFIOS, LICOES };
})();
