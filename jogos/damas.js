// Damas (regras brasileiras): tabuleiro 8×8, 12 peças de cada lado nas casas escuras.
// - A pedra anda uma casa na diagonal para a frente e captura para a frente e para trás.
// - Captura obrigatória e "lei da maioria": é preciso fazer a jogada que captura mais peças
//   (pode ser desligada nas opções, para as crianças que estão aprendendo).
// - Pedra que termina a jogada na última fileira vira dama; a dama é "voadora": anda e captura
//   em qualquer distância na diagonal.
// Contra o computador (3 níveis) ou 2 jogadores no mesmo aparelho. Joga-se tocando (na peça e
// depois na casa) ou arrastando a peça até a casa; nas capturas em sequência, casa por casa.
(() => {
  const OPCOES = [
    { chave: "modo", titulo: "Jogar contra", valores: [["robo", "🤖 Computador"], ["dois", "👥 2 jogadores"]] },
    { chave: "nivel", titulo: "Computador", valores: [["facil", "😊 Fácil"], ["medio", "🧠 Médio"], ["dificil", "🦉 Difícil"]] },
    { chave: "cor", titulo: "Suas peças", valores: [["b", "⚪ Brancas (começam)"], ["p", "⚫ Pretas"]] },
    { chave: "obrigatoria", titulo: "Captura obrigatória", valores: [["sim", "✅ Sim (oficial)"], ["nao", "🙂 Não"]] },
    { chave: "dicas", titulo: "Mostrar jogadas", valores: [["sim", "💡 Sim"], ["nao", "🙈 Não"]] },
  ];
  const PADRAO = {
    "5-6":  { modo: "robo", nivel: "facil", cor: "b", obrigatoria: "nao", dicas: "sim" },
    "6-8":  { modo: "robo", nivel: "facil", cor: "b", obrigatoria: "sim", dicas: "sim" },
    "8-10": { modo: "robo", nivel: "medio", cor: "b", obrigatoria: "sim", dicas: "nao" },
  };
  const NIVEIS = { facil: "😊 Fácil", medio: "🧠 Médio", dificil: "🦉 Difícil" };
  const PROFUNDIDADE = { facil: 1, medio: 3, dificil: 5 };
  const NOME_COR = { b: "brancas", p: "pretas" };
  const DIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const LIMITE_EMPATE = 20; // jogadas seguidas só de damas, sem captura → empate

  // ---------- Regras ----------
  // Tabuleiro: matriz 8×8 com null ou { cor: "b"|"p", dama: bool }. Brancas embaixo (sobem).
  function inicial() {
    const t = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if ((r + c) % 2 === 0) continue;
      if (r < 3) t[r][c] = { cor: "p", dama: false };
      if (r > 4) t[r][c] = { cor: "b", dama: false };
    }
    return t;
  }
  const dentro = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
  const outra = cor => (cor === "b" ? "p" : "b");
  const frente = cor => (cor === "b" ? -1 : 1);
  const ultimaFileira = cor => (cor === "b" ? 0 : 7);

  // Sequências de captura a partir de (r, c). Peças capturadas só saem no fim da jogada
  // (bloqueiam o caminho e não podem ser capturadas duas vezes). A casa de saída fica vazia.
  // Cada jogada: { de: [r, c], caminho: [[r, c], ...casas onde pousa], capt: [[r, c], ...] }
  function capturas(t, r0, c0) {
    const peca = t[r0][c0], res = [];
    const vazia = (r, c) => dentro(r, c) && (!t[r][c] || (r === r0 && c === c0));
    function busca(r, c, caminho, capt) {
      let continuou = false;
      const jaCapturada = (r, c) => capt.some(([a, b]) => a === r && b === c);
      for (const [dr, dc] of DIRS) {
        if (!peca.dama) {
          const r1 = r + dr, c1 = c + dc, r2 = r + 2 * dr, c2 = c + 2 * dc;
          if (!dentro(r2, c2) || !t[r1][c1] || t[r1][c1].cor === peca.cor || jaCapturada(r1, c1) || !vazia(r2, c2)) continue;
          continuou = true;
          busca(r2, c2, [...caminho, [r2, c2]], [...capt, [r1, c1]]);
        } else {
          // Dama voadora: passa por casas vazias, pula uma peça adversária e pousa em qualquer casa vazia depois dela
          let r1 = r + dr, c1 = c + dc;
          while (vazia(r1, c1)) { r1 += dr; c1 += dc; }
          if (!dentro(r1, c1) || t[r1][c1].cor === peca.cor || jaCapturada(r1, c1)) continue;
          let r2 = r1 + dr, c2 = c1 + dc;
          while (vazia(r2, c2)) {
            continuou = true;
            busca(r2, c2, [...caminho, [r2, c2]], [...capt, [r1, c1]]);
            r2 += dr; c2 += dc;
          }
        }
      }
      if (!continuou && capt.length) res.push({ de: [r0, c0], caminho, capt });
    }
    busca(r0, c0, [], []);
    return res;
  }

  function simples(t, r, c) {
    const peca = t[r][c], res = [];
    for (const [dr, dc] of DIRS) {
      if (!peca.dama) {
        if (dr !== frente(peca.cor)) continue;
        if (dentro(r + dr, c + dc) && !t[r + dr][c + dc]) res.push({ de: [r, c], caminho: [[r + dr, c + dc]], capt: [] });
      } else {
        for (let r1 = r + dr, c1 = c + dc; dentro(r1, c1) && !t[r1][c1]; r1 += dr, c1 += dc) {
          res.push({ de: [r, c], caminho: [[r1, c1]], capt: [] });
        }
      }
    }
    return res;
  }

  function jogadasLegais(t, cor, obrigatoria) {
    const caps = [], movs = [];
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (!t[r][c] || t[r][c].cor !== cor) continue;
      caps.push(...capturas(t, r, c));
      movs.push(...simples(t, r, c));
    }
    if (!obrigatoria) return [...caps, ...movs];
    if (!caps.length) return movs;
    const max = Math.max(...caps.map(j => j.capt.length)); // lei da maioria
    return caps.filter(j => j.capt.length === max);
  }

  function aplicar(t, j) {
    const n = t.map(l => l.slice());
    const [r0, c0] = j.de, [rf, cf] = j.caminho[j.caminho.length - 1];
    const peca = { ...n[r0][c0] };
    n[r0][c0] = null;
    j.capt.forEach(([r, c]) => { n[r][c] = null; });
    if (!peca.dama && rf === ultimaFileira(peca.cor)) peca.dama = true;
    n[rf][cf] = peca;
    return n;
  }

  // ---------- Computador ----------
  function avaliar(t, cor) {
    let s = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = t[r][c];
      if (!p) continue;
      // Pedra vale mais quanto mais perto de virar dama; o centro e a última fileira de defesa ajudam
      const avanco = p.cor === "b" ? 7 - r : r;
      const v = p.dama ? 32 : 10 + avanco * 0.6 + (c > 1 && c < 6 ? 0.4 : 0) + (avanco === 0 ? 0.6 : 0);
      s += p.cor === cor ? v : -v;
    }
    return s;
  }

  function negamax(t, cor, prof, alfa, beta, obrig) {
    const js = jogadasLegais(t, cor, obrig);
    if (!js.length) return -1000 - prof; // sem jogada = perdeu (perder mais tarde é melhor)
    if (prof === 0) return avaliar(t, cor);
    js.sort((x, y) => y.capt.length - x.capt.length);
    let melhor = -Infinity;
    for (const j of js) {
      const v = -negamax(aplicar(t, j), outra(cor), prof - 1, -beta, -alfa, obrig);
      if (v > melhor) melhor = v;
      if (v > alfa) alfa = v;
      if (alfa >= beta) break;
    }
    return melhor;
  }

  function escolherJogada(t, cor, nivel, obrig) {
    const js = jogadasLegais(t, cor, obrig);
    if (nivel === "facil" && Math.random() < 0.6) {
      // Fácil: quase sempre joga ao acaso, mas não recusa capturas
      const caps = js.filter(j => j.capt.length);
      return Motor.sortear(caps.length ? caps : js);
    }
    let melhor = null, melhorV = -Infinity;
    for (const j of Motor.embaralhar(js)) {
      const v = -negamax(aplicar(t, j), outra(cor), PROFUNDIDADE[nivel] - 1, -Infinity, Infinity, obrig);
      if (v > melhorV) { melhorV = v; melhor = j; }
    }
    return melhor;
  }

  // ---------- Jogo ----------
  JOGOS.push({
    id: "damas",
    nome: "Damas",
    icone: "⚫",
    faixas: ["5-6", "6-8", "8-10"],
    iniciar(area, faixa) {
      const id = (faixa && faixa.id) || "6-8";
      Motor.telaOpcoes(area, {
        opcoes: OPCOES, padrao: PADRAO[id] || PADRAO["6-8"], chave: `damas-opcoes-${id}`,
        antes: Placar.painel("damas", { comZerar: true }),
        aoJogar: op => partida(area, op),
      });
    },
  });

  function partida(area, op) {
    const contraRobo = op.modo === "robo";
    const minhaCor = contraRobo ? op.cor : "b";
    const obrig = op.obrigatoria === "sim";
    const dicas = op.dicas === "sim";
    const virado = contraRobo && minhaCor === "p"; // as peças de quem joga ficam sempre embaixo
    let t = inicial();
    let vez = "b", acabou = false, semCaptura = 0;
    // Jogada em andamento (captura em sequência): candidatas que batem com as casas já tocadas
    let sel = null; // { de: [r, c], passo, candidatas }
    let ultima = null; // última jogada feita (para destacar)

    const daVez = () => !acabou && (!contraRobo || vez === minhaCor);
    const legais = () => jogadasLegais(t, vez, obrig);
    const igual = (a, b) => a[0] === b[0] && a[1] === b[1];

    function contar(cor) {
      let n = 0;
      t.forEach(l => l.forEach(p => { if (p && p.cor === cor) n++; }));
      return n;
    }

    function desenhar() {
      area.innerHTML = "";
      const tela = document.createElement("div");
      tela.className = "damas-jogo";
      area.appendChild(tela);
      const larg = tela.clientWidth, alt = tela.clientHeight;
      const deitado = larg > alt;

      // Placar da partida: peças de cada lado e de quem é a vez
      const info = document.createElement("div");
      info.className = "damas-info";
      const lados = contraRobo ? [minhaCor, outra(minhaCor)] : ["b", "p"];
      lados.forEach(cor => {
        const el = document.createElement("div");
        el.className = "damas-lado" + (vez === cor && !acabou ? " da-vez" : "");
        const peca = document.createElement("span");
        peca.className = `peca-dama ${cor}`;
        const nome = document.createElement("span");
        nome.textContent = contraRobo ? (cor === minhaCor ? "🧒 Você" : `🤖 ${NIVEIS[op.nivel]}`) : (cor === "b" ? "Brancas" : "Pretas");
        const qt = document.createElement("span");
        qt.className = "qt";
        qt.textContent = contar(cor);
        el.append(peca, nome, qt);
        info.appendChild(el);
      });

      // Tabuleiro
      const lado = Math.floor(Math.min(deitado ? larg - 230 : larg, deitado ? alt : alt - 130) / 8) * 8;
      const tab = document.createElement("div");
      tab.className = "damas-tabuleiro";
      Object.assign(tab.style, { width: lado + "px", height: lado + "px", fontSize: lado / 8 * 0.42 + "px" });

      // O que destacar: peças que podem jogar, casas de destino, peças já capturadas na sequência
      const js = daVez() ? legais() : [];
      const podem = new Set(js.map(j => j.de.join()));
      const destinos = new Set(sel && daVez() ? sel.candidatas.map(j => j.caminho[sel.passo].join()) : []);
      const capturadas = new Set(sel ? sel.candidatas[0].capt.slice(0, sel.passo).map(x => x.join()) : []);
      const posSel = sel ? (sel.passo ? sel.candidatas[0].caminho[sel.passo - 1] : sel.de) : null;
      const marcadas = new Set(ultima ? [ultima.de, ...ultima.caminho].map(x => x.join()) : []);

      casasAtuais = new Map();
      for (let vr = 0; vr < 8; vr++) for (let vc = 0; vc < 8; vc++) {
        const r = virado ? 7 - vr : vr, c = virado ? 7 - vc : vc;
        const casa = document.createElement("button");
        casa.className = "damas-casa " + ((r + c) % 2 ? "escura" : "clara");
        const k = `${r},${c}`;
        casa.dataset.pos = k;
        casasAtuais.set(k, casa);
        if (marcadas.has(k)) casa.classList.add("ultima");
        if (destinos.has(k)) casa.classList.add("destino");
        // Durante a captura em sequência, a peça aparece na casa onde já pousou
        let p = t[r][c];
        if (sel && sel.passo && igual(sel.de, [r, c])) p = null;
        if (posSel && sel.passo && igual(posSel, [r, c])) p = t[sel.de[0]][sel.de[1]];
        if (p) {
          const el = document.createElement("span");
          el.className = `peca-dama ${p.cor}` + (p.dama ? " dama" : "");
          if (capturadas.has(k)) el.classList.add("capturada");
          if (posSel && igual(posSel, [r, c])) el.classList.add("selecionada");
          else if (!sel && podem.has(k) && (dicas || (obrig && js[0].capt.length))) el.classList.add("pode");
          // Dá para arrastar a peça que pode jogar (ou, no meio de uma captura em sequência, a que está capturando)
          const meioCaptura = sel && sel.passo;
          if (daVez() && (meioCaptura ? igual(posSel, [r, c]) : podem.has(k))) {
            Motor.arrastavel(el, {
              alvos: () => [...tab.querySelectorAll(".damas-casa.destino")],
              aoComecar: () => comecarArraste(r, c),
              aoSoltar: alvo => avancar(...alvo.dataset.pos.split(",").map(Number)),
            });
          }
          casa.appendChild(el);
        }
        casa.addEventListener("click", () => tocar(r, c, casa));
        tab.appendChild(casa);
      }

      tela.classList.toggle("deitado", deitado);
      tela.append(info, tab);
    }

    // ---------- Toques e arrastes ----------
    let casasAtuais = new Map();

    // Leva a peça escolhida para (r, c), se for uma casa possível. Devolve true se andou.
    function avancar(r, c) {
      if (!daVez() || !sel || !sel.candidatas.some(j => igual(j.caminho[sel.passo], [r, c]))) return false;
      const cand = sel.candidatas.filter(j => igual(j.caminho[sel.passo], [r, c]));
      sel = { de: sel.de, passo: sel.passo + 1, candidatas: cand };
      const pronta = cand.find(j => j.caminho.length === sel.passo);
      if (pronta) fazer(pronta);
      else { Motor.ploc(); desenhar(); } // captura em sequência: continua da casa onde pousou
      return true;
    }

    // Começou a arrastar a peça em (r, c): ela fica escolhida e as casas possíveis acendem
    function comecarArraste(r, c) {
      if (!daVez()) return;
      if (!(sel && sel.passo) && !(sel && igual(sel.de, [r, c]))) {
        sel = { de: [r, c], passo: 0, candidatas: legais().filter(j => igual(j.de, [r, c])) };
      }
      const destinos = new Set(sel.candidatas.map(j => j.caminho[sel.passo].join()));
      casasAtuais.forEach((casa, k) => casa.classList.toggle("destino", destinos.has(k)));
    }

    function tocar(r, c, casa) {
      if (!daVez()) return;
      const js = legais();
      if (avancar(r, c)) return;
      if (sel && sel.passo) { Motor.animar(casa, "balanca"); return; } // no meio de uma captura em sequência
      const minhas = js.filter(j => igual(j.de, [r, c]));
      if (minhas.length) {
        sel = { de: [r, c], passo: 0, candidatas: minhas };
        desenhar();
        return;
      }
      Motor.animar(casa, "balanca");
      const p = t[r][c];
      if (p && p.cor === vez && obrig && js.length && js[0].capt.length) Motor.falar("Tem captura obrigatória!");
    }

    function fazer(j) {
      const peca = t[j.de[0]][j.de[1]];
      const viraDama = !peca.dama && j.caminho[j.caminho.length - 1][0] === ultimaFileira(peca.cor);
      // De onde a peça sai no último passo (para deslizar até o destino)
      const antes = j.caminho.length > 1 ? j.caminho[j.caminho.length - 2] : j.de;
      const jaAnimada = animando;
      animando = false;
      t = aplicar(t, j);
      ultima = j;
      sel = null;
      semCaptura = j.capt.length || !peca.dama ? 0 : semCaptura + 1;
      if (j.capt.length) {
        Motor.nota(520, { dur: 0.15, vol: 0.25 });
        Motor.nota(300, { dur: 0.25, vol: 0.25, inicio: 0.12 });
      } else Motor.ploc();
      if (viraDama) { Motor.tim(); Motor.falar("Virou dama!"); }
      else if (j.capt.length > 1) Motor.falar(`Capturou ${j.capt.length}!`);
      vez = outra(vez);
      if (!legais().length) return fim(outra(vez));
      if (semCaptura >= LIMITE_EMPATE) return fim(null);
      desenhar();
      if (!jaAnimada) deslizar(antes, j.caminho[j.caminho.length - 1]);
      if (contraRobo && vez !== minhaCor) Motor.depois(jogadaRobo, 900);
      else if (!contraRobo) Motor.depois(() => Motor.falar(`Vez das ${NOME_COR[vez]}!`), viraDama ? 1200 : 300);
    }

    // Peça desliza da casa `de` até a casa `para` (as duas já desenhadas)
    function deslizar(de, para) {
      const a = casasAtuais.get(de.join()), b = casasAtuais.get(para.join());
      const el = b && b.querySelector(".peca-dama");
      if (!a || !el) return;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      el.animate([{ transform: `translate(${ra.left - rb.left}px, ${ra.top - rb.top}px) scale(1.1)` }, { transform: "none" }],
        { duration: 380, easing: "ease-in-out" });
    }

    // Jogada do computador, mostrada devagar: a peça acende, desliza casa por casa
    // (as capturadas vão ficando apagadas) e só então a jogada acontece
    let animando = false;
    function jogadaRobo() {
      if (acabou) return;
      setTimeout(() => { // deixa a tela mostrar a vez antes do cálculo
        if (acabou) return;
        const j = escolherJogada(t, vez, op.nivel, obrig);
        animando = true;
        sel = { de: j.de, passo: 0, candidatas: [j] };
        desenhar();
        let passo = 0;
        const proximo = () => {
          if (acabou) return;
          if (passo === j.caminho.length) { fazer(j); return; }
          const de = passo ? j.caminho[passo - 1] : j.de;
          passo++;
          sel = { de: j.de, passo, candidatas: [j] };
          desenhar();
          deslizar(de, j.caminho[passo - 1]);
          if (j.capt.length) Motor.nota(520, { dur: 0.1, vol: 0.2 }); else Motor.ploc();
          Motor.depois(proximo, passo === j.caminho.length ? 450 : 550);
        };
        Motor.depois(proximo, 600);
      }, 30);
    }

    function fim(vencedor) {
      acabou = true;
      desenhar();
      let frase;
      if (!vencedor) frase = "Empate!";
      else if (contraRobo) frase = vencedor === minhaCor ? "Você ganhou!" : "O computador ganhou desta vez!";
      else frase = `As ${NOME_COR[vencedor]} ganharam!`;
      Motor.depois(() => {
        area.innerHTML = "";
        const caixa = document.createElement("div");
        caixa.className = "fim";
        caixa.innerHTML = `<div class="trofeu"></div><div class="resumo"></div>`;
        const ganhei = contraRobo && vencedor === minhaCor;
        caixa.querySelector(".trofeu").textContent = !vencedor ? "🤝" : contraRobo ? (ganhei ? "🏆" : "🤖") : vencedor === "b" ? "⚪" : "⚫";
        caixa.querySelector(".resumo").textContent = frase;
        let fala = frase;
        if (contraRobo) {
          const seq = Placar.resultado("damas", !vencedor ? null
            : ganhei ? { id: "voce", rotulo: "🧒 Você" } : { id: `robo-${op.nivel}`, rotulo: `🤖 ${NIVEIS[op.nivel]}` });
          caixa.appendChild(Placar.painel("damas"));
          if (seq.novaMelhorSequencia) fala += ` ${seq.sequencia} vitórias seguidas! É o seu recorde!`;
          else if (seq.sequencia > 1) fala += ` São ${seq.sequencia} vitórias seguidas!`;
        }
        const botao = document.createElement("button");
        botao.className = "modo";
        botao.innerHTML = `<span class="icone">🔁</span><span class="rotulo">Jogar de novo</span>`;
        botao.addEventListener("click", () => partida(area, op));
        caixa.appendChild(botao);
        area.appendChild(caixa);
        if (ganhei || (!contraRobo && vencedor)) { Motor.comemorar(caixa.querySelector(".trofeu")); Motor.tim(); }
        Motor.falar(contraRobo && !ganhei && vencedor ? `${fala} Vamos jogar de novo?` : fala);
      }, 1800);
    }

    // Girou o celular: desenha de novo
    let espera = null;
    const sessao = Motor.sessaoAtual();
    const aoRedimensionar = () => {
      if (acabou || sessao !== Motor.sessaoAtual()) { window.removeEventListener("resize", aoRedimensionar); return; }
      clearTimeout(espera);
      espera = setTimeout(() => { if (!acabou && area.querySelector(".damas-jogo")) desenhar(); }, 200);
    };
    window.addEventListener("resize", aoRedimensionar);

    desenhar();
    if (contraRobo && minhaCor !== "b") {
      Motor.falar("As brancas começam. O computador joga primeiro!");
      Motor.depois(jogadaRobo, 1200);
    } else Motor.falar(contraRobo ? "Você começa! Toque numa peça e depois na casa." : "As brancas começam!");
  }
})();
