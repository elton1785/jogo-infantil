// Pingue-pongue 🏓 — mesa oficial (2,74 m × 1,525 m, rede de 15,25 cm) em perspectiva, com a câmera
// atrás de quem joga, e a bolinha com física em 3D (sobe, cai e quica, com sombra na mesa).
// A raquete acompanha a bolinha na altura e rebate sozinha quando ela chega perto: o lado da raquete
// em que a bola bate decide para onde ela vai, e a cortada (⬆️ ou o botão 💥) manda mais forte.
// Regras: 11 pontos com 2 de vantagem, saque troca a cada 2 pontos (no 10 a 10, a cada ponto),
// o saque quica no seu lado e depois no do adversário; bola fora, na rede ou dois quiques = ponto
// do outro. Contra o computador (3 níveis) ou 2 jogadores (o de lá usa W A S D / 2º controle).
(() => {
  const MZ = 1.37, MX = 0.7625, REDE = 0.1525, RB = 0.02, G = 9.8;
  const VEL = { devagar: 0.62, normal: 0.8, rapida: 1 };
  const NIV = { facil: { vel: 1.0, erro: 0.28, alcance: 0.2 }, medio: { vel: 1.5, erro: 0.16, alcance: 0.26 }, dificil: { vel: 2.2, erro: 0.08, alcance: 0.3 } };
  // Personagens (crianças desenhadas no canvas) e cores da camiseta + raquete
  const PERS = {
    menino1: { nome: "Menino", emoji: "👦🏻", pele: "#f6d2b3", pele2: "#e0b08c", cabelo: "#7a4a24", tipo: "curto" },
    menino2: { nome: "Menino", emoji: "👦🏽", pele: "#c98d5e", pele2: "#a8703f", cabelo: "#2b1a10", tipo: "curto" },
    menino3: { nome: "Menino", emoji: "👦🏿", pele: "#7a4b2a", pele2: "#5e381d", cabelo: "#140d0a", tipo: "crespo" },
    menina1: { nome: "Menina", emoji: "👧🏻", pele: "#f6d2b3", pele2: "#e0b08c", cabelo: "#d19a32", tipo: "rabo" },
    menina2: { nome: "Menina", emoji: "👧🏽", pele: "#c98d5e", pele2: "#a8703f", cabelo: "#2b1a10", tipo: "longo" },
    menina3: { nome: "Menina", emoji: "👧🏿", pele: "#7a4b2a", pele2: "#5e381d", cabelo: "#140d0a", tipo: "coque" },
  };
  const CORES = { vermelha: "#e03131", azul: "#1c7ed6", verde: "#2f9e44", amarela: "#f0b400", roxa: "#7048e8", laranja: "#f76707", rosa: "#e64980", preta: "#343a40" };
  const figRaquete = c => `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="28" y="40" width="8" height="21" rx="3" fill="#c08a50"/><circle cx="32" cy="26" r="21" fill="#222"/><circle cx="32" cy="26" r="19" fill="${c}"/><ellipse cx="24" cy="18" rx="7" ry="4" fill="rgba(255,255,255,.25)" transform="rotate(-30 24 18)"/></svg>`;
  const valoresPers = Object.entries(PERS).map(([k, v]) => [k, v.nome, v.emoji]);
  const valoresCor = Object.entries(CORES).map(([k, c]) => [k, k[0].toUpperCase() + k.slice(1), figRaquete(c)]);
  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#e8590c"/><path d="M6 44 L20 22 H44 L58 44Z" fill="#1c5fa8" stroke="#fff" stroke-width="1.5"/><path d="M32 22 V44" stroke="#fff" stroke-width="1"/><path d="M12 34 H52" stroke="#e9ecef" stroke-width="3"/><circle cx="18" cy="48" r="8" fill="#e03131"/><rect x="16" y="54" width="4" height="8" rx="2" fill="#c08a50"/><circle cx="40" cy="16" r="3.5" fill="#fff"/></svg>';

  JOGOS.push({
    id: "pingpong", nome: "Pingue-pongue", icone: ICONE, teclas: true,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: "⬅️🏓➡️", texto: "Mova a raquete para os lados (setas, ou arraste o dedo na parte de baixo da tela). Ela rebate sozinha quando a bolinha chega!" },
      { figura: "🎯", texto: "Rebater com a ponta da raquete manda a bolinha para o lado; com o meio, ela vai reta." },
      { figura: "💥", texto: "Cortada: aperte ⬆️ (ou segure o botão 💥) quando a bolinha chegar, para mandar bem forte!" },
      { figura: "🏓", texto: "Saque: aperte Enter ou toque em SACAR. A bolinha quica no seu lado e depois no do outro. O saque troca a cada 2 pontos." },
      { figura: "🏆", texto: "Quem fizer 11 pontos primeiro ganha, mas tem que ter 2 de vantagem: no 10 a 10 continua até alguém abrir 2." },
      { figura: ["👦🏽", "👧🏻"], texto: "Antes de jogar, escolha o seu personagem e a cor da sua camiseta e da sua raquete." },
      { figura: "👫", texto: "Com 2 jogadores, o de lá usa W A S D e F para sacar (ou o 2º controle), ou arrasta o dedo na parte de cima da tela." },
    ],
    iniciar(area, faixa) {
      const fid = (faixa && faixa.id) || "6-8";
      const perfil = typeof Album !== "undefined" ? Album.perfilAtual().nome : "";
      Motor.telaOpcoes(area, {
        chave: `pingpong-${fid}`,
        padrao: { modo: "robo", nivel: "facil", nome1: perfil === "Visitante" ? "" : perfil, nome2: "", vel: fid === "5-6" ? "devagar" : fid === "6-8" ? "normal" : "rapida", pontos: fid === "5-6" ? "7" : "11", pers1: "menino2", cor1: "vermelha", pers2: "menina1", cor2: "azul" },
        opcoes: [
          { chave: "modo", titulo: "Contra quem?", valores: [["robo", "🤖 Contra o computador"], ["dois", "👫 2 jogadores"]] },
          { chave: "nivel", titulo: "O computador joga", quando: op => op.modo === "robo", valores: [["facil", "😊 Mais ou menos"], ["medio", "🧠 Bem"], ["dificil", "🦉 Muito bem"]] },
          { chave: "nome1", tipo: "texto", titulo: op => (op.modo === "dois" ? "Nome do jogador 1" : "Qual é o seu nome?"), dica: op => (op.modo === "dois" ? "Jogador 1" : "Você") },
          { chave: "nome2", tipo: "texto", titulo: "Nome do jogador 2", dica: "Jogador 2", quando: op => op.modo === "dois" },
          { chave: "pers1", titulo: op => (op.modo === "dois" ? "Jogador 1: escolha o personagem" : "Escolha o seu personagem"), valores: valoresPers },
          { chave: "cor1", titulo: op => (op.modo === "dois" ? "Jogador 1: cor da camiseta e da raquete" : "Cor da sua camiseta e da raquete"), valores: valoresCor },
          { chave: "pers2", titulo: "Jogador 2: escolha o personagem", quando: op => op.modo === "dois", valores: valoresPers },
          { chave: "cor2", titulo: "Jogador 2: cor da camiseta e da raquete", quando: op => op.modo === "dois", valores: op => valoresCor.filter(v => v[0] !== op.cor1) },
          { chave: "vel", titulo: "Velocidade da bolinha", valores: [["devagar", "🐢 Devagar"], ["normal", "🐇 Normal"], ["rapida", "🚀 Rápida"]] },
          { chave: "pontos", regra: true, titulo: "A partida vai até", valores: [["7", "7 pontos (jogo curto)"], ["11", "11 pontos (oficial)"], ["21", "21 pontos (antigo)"]] },
        ],
        aoJogar: op => partida(area, op, fid),
      });
    },
  });
  CATALOGO["pingpong"] = ["acao", "Rebata a bolinha na mesa oficial"];

  function partida(area, op, fid) {
    const dois = op.modo === "dois", nivel = NIV[op.nivel] || NIV.facil, kVel = VEL[op.vel] || 0.8, ALVO = +op.pontos || 11;
    const pequeno = fid === "5-6";
    const jog = [{ nome: op.nome1 || (dois ? "Jogador 1" : "Você"), pts: 0 }, { nome: dois ? op.nome2 || "Jogador 2" : "Computador", pts: 0 }];
    // visual de cada lado: personagem e cor (o computador sorteia um diferente do seu)
    const outroDe = (lista, nao) => { const l = lista.filter(k => k !== nao); return l[Math.floor(Math.random() * l.length)]; };
    const p1 = PERS[op.pers1] ? op.pers1 : "menino2", c1 = CORES[op.cor1] ? op.cor1 : "vermelha";
    const p2 = dois && PERS[op.pers2] ? op.pers2 : outroDe(Object.keys(PERS), p1);
    const c2 = dois && CORES[op.cor2] && op.cor2 !== c1 ? op.cor2 : outroDe(Object.keys(CORES), c1);
    const visual = [{ pers: PERS[p1], cor: CORES[c1] }, { pers: PERS[p2], cor: CORES[c2] }];
    let pausado = false;
    const P = Palco.criar(area, { classe: "pingpong-tela", aoPausar: () => { pausado = !pausado; P.pausa.textContent = pausado ? "▶️" : "⏸️"; } });
    const ctx = P.ctx;
    // raquetes: 0 = perto (você), 1 = longe; z fixo atrás da mesa, x controlado, y acompanha a bola
    const RAQ_R = pequeno ? 0.3 : 0.24;
    const raq = [{ x: 0, y: 0.25, z: -MZ - 0.25, vx: 0, alvoX: 0 }, { x: 0, y: 0.25, z: MZ + 0.25, vx: 0, alvoX: 0 }];
    const bola = { x: 0, y: 0.3, z: -MZ, vx: 0, vy: 0, vz: 0, ativa: false };
    let sacador = 0, saquesFeitos = 0, fase = "saque", ultimoA = -1, quiques = [], msg = null, confete = [], rastro = [], fim = false, tFase = 0;
    let cortada = [false, false];
    // ----- Entradas -----
    const tec = {};
    P.teclas((e, d) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      tec[k] = d;
      if (!d) return;
      if (k === "Enter" || k === " ") { e.preventDefault(); sacar(0); }
      if (k === "f" && dois) sacar(1);
    });
    const bSacar = P.botao("🏓<small>SACAR</small>", () => sacar(0), { classe: "principal" });
    const bCortada = P.botao("💥<small>cortada</small>", () => {}, { segurar: true });
    P.controles.append(bSacar, bCortada);
    const posicionar = () => { Object.assign(bSacar.style, { right: "12px", bottom: "12px", minWidth: "120px" }); Object.assign(bCortada.style, { right: "12px", bottom: "104px" }); };
    posicionar();
    // dedo: na metade de baixo controla a raquete de perto; na de cima, a de longe (2 jogadores)
    const dedos = new Map();
    P.canvas.addEventListener("pointerdown", e => { Motor.audio(); dedos.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { P.canvas.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } });
    P.canvas.addEventListener("pointermove", e => { if (dedos.has(e.pointerId)) dedos.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
    ["pointerup", "pointercancel"].forEach(t => P.canvas.addEventListener(t, e => dedos.delete(e.pointerId)));
    function controlar(dt) {
      const r = P.canvas.getBoundingClientRect(), v = vista();
      // jogador de perto
      let ix = (tec.ArrowRight ? 1 : 0) - (tec.ArrowLeft ? 1 : 0);
      if (!dois) ix += (tec.d ? 1 : 0) - (tec.a ? 1 : 0);
      const p2 = Palco.pad(1);
      cortada = [!!(bCortada.classList.contains("apertado") || tec.ArrowUp || (!dois && tec.w)), !!(dois && (tec.w || (p2 && p2.botao(3))))];
      dedos.forEach(p => {
        const sx = p.x - r.left, sy = p.y - r.top;
        const qual = dois && sy < P.H * 0.45 ? 1 : 0;
        if (!dois && sy < P.H * 0.3) return;
        const zr = raq[qual].z, s = v.esc(zr);
        raq[qual].alvoX = Math.max(-1.2, Math.min(1.2, v.camX + (sx - P.W / 2) / s));
      });
      const vel = 2.6;
      if (ix) { raq[0].alvoX = Math.max(-1.2, Math.min(1.2, raq[0].x + ix * vel * dt * 2)); }
      if (autoTeste && bola.ativa && bola.vz < 0) raq[0].alvoX = preverX(raq[0].z);
      // 2º jogador: W A S D / 2º controle (para ele, a esquerda dele é a direita da tela)
      if (dois) {
        let jx = (tec.d ? 1 : 0) - (tec.a ? 1 : 0);
        const p2 = Palco.pad(1);
        if (p2) { jx += p2.eixo(0) + (p2.botao(15) ? 1 : 0) - (p2.botao(14) ? 1 : 0); if (p2.botao(0) || p2.botao(2)) sacar(1); }
        if (jx) raq[1].alvoX = Math.max(-1.2, Math.min(1.2, raq[1].x + Math.max(-1, Math.min(1, jx)) * vel * dt * 2));
      } else robo(dt);
      raq.forEach((q, i) => {
        const vmax = i === 1 && !dois ? nivel.vel : 4;
        const d = q.alvoX - q.x, passo = Math.max(-vmax * dt, Math.min(vmax * dt, d * Math.min(1, dt * 14)));
        q.vx = passo / Math.max(dt, 1e-4); q.x += passo;
        // a altura acompanha a bolinha quando ela vem
        const vindo = bola.ativa && (i === 0 ? bola.vz < 0 : bola.vz > 0);
        q.y += ((vindo ? Math.max(0.05, Math.min(0.6, bola.y)) : 0.25) - q.y) * Math.min(1, dt * 6);
      });
    }
    // ----- Computador: vai para onde a bolinha vai chegar -----
    let palpite = null;
    function robo(dt) {
      const q = raq[1];
      if (bola.ativa && bola.vz > 0) {
        if (!palpite) palpite = preverX(q.z) + (Math.random() - 0.5) * nivel.erro;
        q.alvoX = palpite;
      } else { palpite = null; q.alvoX = fase === "saque" && sacador === 1 ? q.x : bola.x * 0.3; }
      if (fase === "saque" && sacador === 1 && tFase > 1.4) sacar(1);
    }
    function preverX(zAlvo) {
      // simula a bolinha até chegar no z da raquete (com os quiques)
      const b = { ...bola };
      for (let i = 0; i < 400; i++) { passoFisico(b, 1 / 120, true); if ((b.vz > 0 && b.z >= zAlvo) || (b.vz < 0 && b.z <= zAlvo)) break; }
      return b.x;
    }

    // ----- Física -----
    function passoFisico(b, dt, simulando) {
      b.vy -= G * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
      // rede: se passar no z=0 abaixo da altura da rede, bate e cai
      if ((b.zAnt < 0) !== (b.z < 0) && b.zAnt !== undefined && Math.abs(b.x) < MX + 0.15 && b.y < REDE + RB) {
        b.z = b.zAnt; b.vz = -b.vz * 0.15; b.vx *= 0.3;
        if (!simulando) evento("rede");
      }
      b.zAnt = b.z;
      // quique na mesa
      if (b.y < RB && b.vy < 0 && Math.abs(b.x) <= MX && Math.abs(b.z) <= MZ) {
        b.y = RB; b.vy = -b.vy * 0.86; b.vx *= 0.97; b.vz *= 0.97;
        if (!simulando) evento("quique", b.z < 0 ? 0 : 1);
      }
      // chão
      if (b.y < -0.76 + RB) { b.y = -0.76 + RB; b.vy = -b.vy * 0.6; b.vx *= 0.8; b.vz *= 0.8; if (!simulando) evento("chao"); }
    }
    // lança a bolinha de (x,y,z) para quicar em (tx, tz) em `t` segundos
    function lancar(tx, tz, t) {
      bola.vx = (tx - bola.x) / t; bola.vz = (tz - bola.z) / t;
      bola.vy = (RB - bola.y + 0.5 * G * t * t) / t;
      bola.zAnt = bola.z;
    }
    // alcance da altura sobre a rede: aumenta o tempo até passar com folga
    function rebater(lado) {
      const q = raq[lado], s = lado === 0 ? 1 : -1;
      const off = (bola.x - q.x) / RAQ_R; // -1..1: onde bateu na raquete
      let tx = Math.max(-MX * 0.92, Math.min(MX * 0.92, bola.x * 0.3 + off * MX * 0.75 + q.vx * 0.08));
      const forte = cortada[lado] && bola.y > 0.08;
      let tz = s * (forte ? 0.95 + Math.random() * 0.3 : 0.45 + Math.random() * 0.75);
      if (lado === 1 && !dois && Math.random() < nivel.erro * 0.35) { tx += (Math.random() < 0.5 ? -1 : 1) * 0.5; } // o computador erra às vezes
      let t = Math.abs(tz - bola.z) / (forte ? 8.5 : 5.6);
      bola.y = Math.max(bola.y, 0.04);
      for (let k = 0; k < 12; k++) { // garante passar por cima da rede
        lancar(tx, tz, t);
        const tr = -bola.z / bola.vz, yr = bola.y + bola.vy * tr - 0.5 * G * tr * tr;
        if (yr > REDE + 0.05) break;
        t *= 1.12;
      }
      ultimoA = lado; quiques = [];
      Motor.ruido({ dur: 0.05, vol: forte ? 0.32 : 0.2, filtro: "bandpass", freq: forte ? 1600 : 2400 });
      if (forte) { msg = { txt: "💥", t: 0.6 }; }
    }
    function sacar(lado) {
      if (fase !== "saque" || sacador !== lado || pausado || fim) return;
      if (lado === 1 && !dois && tFase < 1.2) return;
      const s = lado === 0 ? 1 : -1, q = raq[lado];
      bola.x = q.x; bola.y = 0.3; bola.z = -s * (MZ + 0.15);
      // saque: procura a velocidade que quica no seu lado (z1) e cai do outro lado passando a rede
      const z1 = -s * 0.75, alvoZ2 = s * (0.55 + Math.random() * 0.4), tx = (Math.random() - 0.5) * MX;
      let melhor = null;
      for (let vz = 2; vz <= 9; vz += 0.25) {
        const t1 = Math.abs(z1 - bola.z) / vz, vy0 = (RB - bola.y + 0.5 * G * t1 * t1) / t1;
        const vy1 = 0.86 * (G * t1 - vy0); if (vy1 <= 0) continue;
        const tr = Math.abs(z1) / (vz * 0.97), yRede = vy1 * tr - 0.5 * G * tr * tr;
        const z2 = z1 + s * vz * 0.97 * (2 * vy1 / G);
        if (yRede < REDE + 0.04 || Math.abs(z2) > MZ - 0.08 || s * z2 < 0.15) continue;
        const nota = Math.abs(z2 - alvoZ2);
        if (!melhor || nota < melhor.nota) melhor = { nota, vz, t1, vy0 };
      }
      if (!melhor) melhor = { vz: 4, t1: Math.abs(z1 - bola.z) / 4, vy0: 1 };
      const tTotal = melhor.t1 + 2 * 0.86 * (G * melhor.t1 - melhor.vy0) / G;
      bola.vz = s * melhor.vz; bola.vy = melhor.vy0; bola.vx = (tx - bola.x) / Math.max(0.3, tTotal); bola.zAnt = bola.z;
      bola.ativa = true; fase = "jogo"; ultimoA = lado; quiques = []; saqueAtual = true;
      Motor.ruido({ dur: 0.05, vol: 0.2, filtro: "bandpass", freq: 2400 });
      bSacar.hidden = true;
    }
    let saqueAtual = false;
    // Regras: quem fez o ponto
    function evento(tipo, lado) {
      if (fase !== "jogo") return;
      if (tipo === "quique") {
        Motor.nota(lado === 0 ? 900 : 760, { dur: 0.04, tipo: "triangle", vol: 0.1 });
        quiques.push(lado);
        const a = ultimoA, o = 1 - a;
        if (saqueAtual) {
          if (quiques.length === 1 && lado !== a) return ponto(o, "Saque errado!");
          if (quiques.length === 2) { if (lado !== o) return ponto(o, "Saque errado!"); saqueAtual = false; quiques = [o]; }
          return;
        }
        if (lado === a) return ponto(o, "Quicou do seu lado!");
        if (quiques.filter(l => l === o).length >= 2) return ponto(a, "Dois quiques!");
      } else if (tipo === "chao") {
        const a = ultimoA, o = 1 - a;
        const quicouDoOutro = quiques.includes(o) && !saqueAtual;
        ponto(quicouDoOutro ? a : o, quicouDoOutro ? "Ponto!" : "Fora!");
      } else if (tipo === "rede") { Motor.nota(200, { dur: 0.1, vol: 0.12 }); }
    }
    function ponto(quem, porque) {
      if (fase !== "jogo") return;
      fase = "ponto"; tFase = 0;
      jog[quem].pts++;
      const [a, b] = [jog[0].pts, jog[1].pts];
      msg = { txt: `${porque} Ponto de ${jog[quem].nome}`, t: 1.8 };
      if (quem === 0 || dois) { Motor.tim(); } else Motor.nota(300, { dur: 0.2, tipo: "triangle", vol: 0.1 });
      // fim de jogo: 11 (ou o escolhido) com 2 de vantagem
      if ((a >= ALVO || b >= ALVO) && Math.abs(a - b) >= 2) return setTimeout(() => terminar(a > b ? 0 : 1), 1200);
      Motor.falar(`${a} a ${b}.`, { naFila: false });
      // troca de saque: a cada 2 pontos; no empate em 10 a 10 (ou na prorrogação), a cada ponto
      saquesFeitos++;
      const deuce = a >= ALVO - 1 && b >= ALVO - 1;
      if (deuce || saquesFeitos >= 2) { sacador = 1 - sacador; saquesFeitos = 0; }
      setTimeout(() => { if (!P.vivo() || fim) return; fase = "saque"; tFase = 0; bola.ativa = false; posicionarSaque(); }, 1500);
    }
    function posicionarSaque() {
      const s = sacador === 0 ? 1 : -1;
      bola.x = raq[sacador].x; bola.y = 0.3; bola.z = -s * (MZ + 0.15); bola.vx = bola.vy = bola.vz = 0;
      bSacar.hidden = sacador !== 0;
      if (sacador === 0 || dois) Motor.falar(`Saque de ${jog[sacador].nome}.`, { naFila: true });
    }
    function terminar(v) {
      fim = true; fase = "fim"; bSacar.hidden = bCortada.hidden = true;
      const ganhou = v === 0 || dois;
      if (ganhou) { Palco.confete(confete, P.W / 2, P.H * 0.35, ["#ffd43b", "#ff8787", "#4dabf7", "#69db7c", "#fff"], 90); Motor.comemorar(P.canvas); }
      Motor.falar(dois ? `${jog[v].nome} venceu! Parabéns!` : v === 0 ? "Você venceu! Que jogo!" : "O computador venceu. Vamos de novo?");
      setTimeout(() => P.vivo() && P.fim(dois || v === 0 ? `${jog[v].nome} venceu!` : "O computador venceu!", ganhou ? "🏆" : "🤖", `${jog[0].nome} ${jog[0].pts} × ${jog[1].pts} ${jog[1].nome}`, [
        { rotulo: "🔁 Jogar de novo", principal: true, aoClicar: () => partida(area, op, fid) },
        { rotulo: "⚙️ Trocar opções", aoClicar: () => JOGOS.find(j => j.id === "pingpong").iniciar(area, { id: fid }) },
      ]), 1400);
    }

    // ----- Câmera e desenho -----
    function vista() {
      const W = P.W, H = P.H, emPe = W < H;
      const f = Math.min(W * (emPe ? 1.25 : 0.95), H * 1.05), hz = H * (emPe ? 0.3 : 0.26), camY = 1.05, camZ = -3.1, camX = 0;
      const esc = z => f / Math.max(0.2, z - camZ);
      const proj = (x, y, z) => { const s = esc(z); return [W / 2 + (x - camX) * s, hz + (camY - y) * s, s]; };
      return { W, H, f, hz, camY, camZ, camX, esc, proj };
    }
    function quad(v, pts, cor) {
      ctx.fillStyle = cor; ctx.beginPath();
      pts.forEach(([x, y, z], i) => { const p = v.proj(x, y, z); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); });
      ctx.closePath(); ctx.fill();
    }
    let tAnim = 0;
    function desenhar(dt) {
      tAnim += dt;
      const v = vista(), { W, H } = v, s = P.esc();
      // ginásio: parede, placas e piso
      const fy = v.proj(0, -0.76, 9)[1];
      const g = ctx.createLinearGradient(0, 0, 0, fy);
      g.addColorStop(0, "#1d2b4a"); g.addColorStop(1, "#33507c");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, fy);
      const pf = v.proj(-8, 0.2, 9), pf2 = v.proj(8, -0.76, 9);
      const cores = ["#e8590c", "#1c7ed6", "#2f9e44", "#e03131", "#7048e8"];
      for (let i = 0; i < 8; i++) { const x = pf[0] + (pf2[0] - pf[0]) * i / 8; ctx.fillStyle = cores[i % 5]; ctx.fillRect(x, pf[1], (pf2[0] - pf[0]) / 8 - 3, pf2[1] - pf[1]); Palco.texto(ctx, "🏓 PINGUE-PONGUE", x + (pf2[0] - pf[0]) / 16, (pf[1] + pf2[1]) / 2, Math.max(7, Math.min((pf2[1] - pf[1]) * 0.3, (pf2[0] - pf[0]) / 8 * 0.085)), "#fff", { contorno: null }); }
      ctx.fillStyle = "#b5523b"; ctx.fillRect(0, fy, W, H - fy);
      ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 2;
      for (let x = -8; x <= 8; x += 0.8) { const a = v.proj(x, -0.76, 9), b = v.proj(x, -0.76, -2.9); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
      // adversário (de lá)
      desenharAdversario(v);
      // pernas da mesa
      [[-MX + 0.1, -MZ + 0.15], [MX - 0.1, -MZ + 0.15], [-MX + 0.1, MZ - 0.15], [MX - 0.1, MZ - 0.15]].forEach(([x, z]) => quad(v, [[x - 0.03, 0, z], [x + 0.03, 0, z], [x + 0.03, -0.76, z], [x - 0.03, -0.76, z]], "#212529"));
      // tampo: lateral e superfície azul com as linhas
      quad(v, [[-MX, 0, -MZ], [MX, 0, -MZ], [MX, -0.03, -MZ], [-MX, -0.03, -MZ]], "#0b3d6b");
      quad(v, [[-MX, 0, -MZ], [MX, 0, -MZ], [MX, 0, MZ], [-MX, 0, MZ]], "#1c5fa8");
      ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(1.5, v.esc(0) * 0.02);
      const linha = (a, b) => { const p = v.proj(...a), q = v.proj(...b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
      linha([-MX, 0, -MZ], [MX, 0, -MZ]); linha([MX, 0, -MZ], [MX, 0, MZ]); linha([MX, 0, MZ], [-MX, 0, MZ]); linha([-MX, 0, MZ], [-MX, 0, -MZ]);
      ctx.lineWidth = Math.max(1, v.esc(0) * 0.008); linha([0, 0, -MZ], [0, 0, MZ]);
      // sombra e bolinha do lado de lá da rede vêm antes da rede
      const atras = bola.z > 0;
      if (atras) desenharBola(v);
      // rede
      quad(v, [[-MX - 0.15, 0, 0], [MX + 0.15, 0, 0], [MX + 0.15, REDE, 0], [-MX - 0.15, REDE, 0]], "rgba(240,240,240,.35)");
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1;
      for (let x = -MX - 0.15; x <= MX + 0.15; x += 0.05) linha([x, 0, 0], [x, REDE, 0]);
      ctx.strokeStyle = "#fff"; ctx.lineWidth = Math.max(2, v.esc(0) * 0.012); linha([-MX - 0.15, REDE, 0], [MX + 0.15, REDE, 0]);
      [-1, 1].forEach(l => quad(v, [[l * (MX + 0.15) - 0.015, -0.02, 0], [l * (MX + 0.15) + 0.015, -0.02, 0], [l * (MX + 0.15) + 0.015, REDE, 0], [l * (MX + 0.15) - 0.015, REDE, 0]], "#343a40"));
      if (!atras) desenharBola(v);
      // você, de costas e meio transparente (para não tampar a mesa), e a sua raquete na frente de tudo
      desenharVoce(v);
      desenharRaquete(v, raq[0], visual[0].cor, 0.9);
      mao(ctx, v, raq[0], visual[0].pers, 0.9);
      placar();
      Palco.desenharConfete(ctx, confete, dt);
      if (msg) { Palco.texto(ctx, msg.txt, W / 2, H * 0.18, Math.min(30 * s, W / 18), "#fff"); msg.t -= dt; if (msg.t <= 0) msg = null; }
      if (fase === "saque" && !fim) Palco.texto(ctx, sacador === 0 ? "Aperte SACAR (Enter) 🏓" : dois ? `${jog[1].nome}: F (ou A no 2º controle) para sacar` : "Saque do computador...", W / 2, H * 0.88, Math.min(22 * s, W / 20));
      if (pausado) Palco.texto(ctx, "⏸️ Pausa", W / 2, H / 2, 54 * s);
    }
    function desenharBola(v) {
      // sombra (na mesa ou no chão)
      const naMesa = Math.abs(bola.x) <= MX && Math.abs(bola.z) <= MZ;
      const sh = v.proj(bola.x, naMesa ? 0 : -0.76, bola.z);
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(sh[0], sh[1], Math.max(2, RB * 1.3 * sh[2]), Math.max(1, RB * 0.5 * sh[2]), 0, 0, 7); ctx.fill();
      // rastro
      rastro.forEach((r, i) => { const p = v.proj(r.x, r.y, r.z); ctx.fillStyle = `rgba(255,255,255,${i / rastro.length * 0.3})`; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.5, RB * p[2] * 0.8), 0, 7); ctx.fill(); });
      const p = v.proj(bola.x, bola.y, bola.z), r = Math.max(3, RB * p[2]);
      const g = ctx.createRadialGradient(p[0] - r * 0.3, p[1] - r * 0.3, r * 0.1, p[0], p[1], r);
      g.addColorStop(0, "#fff"); g.addColorStop(1, "#ffa94d");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
    }
    function desenharRaquete(v, q, cor, alfa) {
      const p = v.proj(q.x, q.y, q.z), r = RAQ_R * 0.62 * p[2];
      ctx.save(); ctx.globalAlpha = alfa;
      ctx.translate(p[0], p[1]); ctx.rotate(Math.max(-0.5, Math.min(0.5, q.vx * 0.08)));
      ctx.fillStyle = "#c08a50"; ctx.beginPath(); ctx.roundRect(-r * 0.16, r * 0.75, r * 0.32, r * 0.9, r * 0.08); ctx.fill();
      ctx.fillStyle = "#222"; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.04, r * 0.96, 0, 0, 7); ctx.fill();
      ctx.fillStyle = cor; ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.92, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.4, r * 0.25, -0.5, 0, 7); ctx.fill();
      ctx.restore();
    }
    // onde fica a mão na raquete (no cabo, girando junto com a raquete)
    function pontoMao(v, q) {
      const p = v.proj(q.x, q.y, q.z), r = RAQ_R * 0.62 * p[2], a = Math.max(-0.5, Math.min(0.5, q.vx * 0.08));
      return [p[0] - Math.sin(a) * r * 1.22, p[1] + Math.cos(a) * r * 1.22, r];
    }
    function mao(g, v, q, pers, alfa = 1) {
      const [x, y, r] = pontoMao(v, q);
      g.save(); g.globalAlpha = alfa;
      g.fillStyle = pers.pele; g.strokeStyle = pers.pele2; g.lineWidth = Math.max(1, r * 0.06);
      g.beginPath(); g.ellipse(x, y, r * 0.3, r * 0.26, 0, 0, 7); g.fill(); g.stroke();
      g.restore();
    }
    // Uma criança inteira em perspectiva: `costas` = vista por trás (você), senão de frente (o de lá).
    // Os dois braços: o da raquete vai até o cabo (com cotovelo), o outro fica dobrado na frente do corpo.
    function desenharPessoa(g, v, { x, z, q, pers, cor, costas, tela }) {
      const Y0 = -0.76, base = tela ? tela.base : v.proj(x, Y0, z), s = tela ? tela.s : base[2];
      const lado = costas ? 1 : -1; // lado da tela em que fica o braço da raquete
      const bob = Math.sin(tAnim * 5 + (costas ? 0 : 2)) * 0.008 + (fase === "jogo" ? -0.03 : 0); // base de espera: joelhos dobrados
      const inc = Math.max(-0.1, Math.min(0.1, q.vx * 0.035)); // inclina para o lado em que corre
      const X = (dx, h) => base[0] + (dx + (h > 0.62 ? inc * (h - 0.62) : 0)) * s, Y = h => base[1] - h * s;
      const traco = (pts, w, c) => { g.strokeStyle = c; g.lineWidth = w * s; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); };
      const disco = (px, py, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); };
      const hQ = 0.62 + bob, hO = 1.0 + bob, hC = 1.2 + bob, rC = 0.115 * s;
      // sombra
      g.fillStyle = "rgba(0,0,0,.22)"; g.beginPath(); g.ellipse(base[0], base[1], 0.28 * s, 0.06 * s, 0, 0, 7); g.fill();
      // pernas (joelhos um pouco dobrados), meias e tênis
      [-1, 1].forEach(l => {
        const passo = Math.max(-0.05, Math.min(0.05, q.vx * 0.02)) * l;
        const qx = X(l * 0.07, hQ), qy = Y(hQ), jx = X(l * 0.115 + passo, 0.32), jy = Y(0.32 + bob * 0.5), px = X(l * 0.12 + passo, 0.05), py = Y(0.05);
        traco([[qx, qy], [jx, jy], [px, py]], 0.075, pers.pele);
        traco([[X(l * 0.12 + passo, 0.13), Y(0.13)], [px, py]], 0.078, "#f8f9fa");
        g.fillStyle = "#343a40"; g.beginPath(); g.ellipse(px, Y(0.025), 0.07 * s, 0.035 * s, 0, 0, 7); g.fill();
        g.fillStyle = cor; g.fillRect(px - 0.05 * s, Y(0.04), 0.1 * s, 0.012 * s);
      });
      // short
      g.fillStyle = "#212529"; g.beginPath();
      g.moveTo(X(-0.135, 0.72), Y(0.72 + bob)); g.lineTo(X(0.135, 0.72), Y(0.72 + bob)); g.lineTo(X(0.155, 0.47), Y(0.47 + bob)); g.lineTo(X(0.01, 0.47), Y(0.47 + bob));
      g.lineTo(X(0, 0.55), Y(0.55 + bob)); g.lineTo(X(-0.01, 0.47), Y(0.47 + bob)); g.lineTo(X(-0.155, 0.47), Y(0.47 + bob)); g.closePath(); g.fill();
      // braço livre: dobrado na frente da barriga (de costas fica atrás do corpo)
      const ombroL = [X(-lado * 0.145, hO - 0.02), Y(hO - 0.02)], cotL = [X(-lado * 0.22, 0.8 + bob), Y(0.8 + bob)], maoL = [X(-lado * 0.11, 0.8 + bob), Y(0.82 + bob)];
      const bracoLivre = () => {
        traco([ombroL, cotL, maoL], 0.062, pers.pele);
        traco([ombroL, [ombroL[0] + (cotL[0] - ombroL[0]) * 0.4, ombroL[1] + (cotL[1] - ombroL[1]) * 0.4]], 0.085, cor);
        disco(maoL[0], maoL[1], 0.038 * s, pers.pele);
      };
      if (costas) bracoLivre();
      // camiseta (ombros mais largos que a cintura) com gola
      g.fillStyle = cor; g.beginPath();
      g.moveTo(X(-0.13, 0.7), Y(0.69 + bob)); g.lineTo(X(0.13, 0.7), Y(0.69 + bob));
      g.lineTo(X(0.165, hO - 0.06), Y(hO - 0.06)); g.quadraticCurveTo(X(0.165, hO + 0.02), Y(hO + 0.02), X(0.1, hO + 0.02), Y(hO + 0.02));
      g.lineTo(X(-0.1, hO + 0.02), Y(hO + 0.02)); g.quadraticCurveTo(X(-0.165, hO + 0.02), Y(hO + 0.02), X(-0.165, hO - 0.06), Y(hO - 0.06));
      g.closePath(); g.fill();
      g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(X(-0.13, 0.7), Y(0.73 + bob), 0.26 * s, 0.04 * s); // barra
      // pescoço e gola
      g.fillStyle = pers.pele2; g.fillRect(X(-0.035, hO), Y(hO + 0.1), 0.07 * s, 0.11 * s);
      if (costas) traco([[X(-0.06, hO + 0.015), Y(hO + 0.015)], [X(0.06, hO + 0.015), Y(hO + 0.015)]], 0.02, "rgba(255,255,255,.7)");
      else {
        g.fillStyle = "#fff"; g.beginPath(); g.moveTo(X(-0.06, hO + 0.02), Y(hO + 0.02)); g.lineTo(X(0, hO - 0.05), Y(hO - 0.05)); g.lineTo(X(0.06, hO + 0.02), Y(hO + 0.02)); g.closePath(); g.fill();
        g.fillStyle = pers.pele2; g.beginPath(); g.moveTo(X(-0.04, hO + 0.02), Y(hO + 0.02)); g.lineTo(X(0, hO - 0.03), Y(hO - 0.03)); g.lineTo(X(0.04, hO + 0.02), Y(hO + 0.02)); g.closePath(); g.fill();
      }
      if (!costas) bracoLivre();
      // braço da raquete: ombro → cotovelo (para fora e para baixo) → mão no cabo
      const ombro = [X(lado * 0.145, hO - 0.02), Y(hO - 0.02)], mp = pontoMao(v, q);
      const l1 = 0.21 * s, l2 = 0.2 * s, dx = mp[0] - ombro[0], dy = mp[1] - ombro[1], d = Math.hypot(dx, dy) || 1;
      let cot;
      if (d >= l1 + l2) cot = [ombro[0] + dx * l1 / (l1 + l2), ombro[1] + dy * l1 / (l1 + l2)];
      else {
        const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
        let nx = -dy / d, ny = dx / d;
        if (nx * lado + ny < 0) { nx = -nx; ny = -ny; } // cotovelo para fora/baixo
        cot = [ombro[0] + dx / d * a + nx * h, ombro[1] + dy / d * a + ny * h];
      }
      traco([ombro, cot, [mp[0], mp[1]]], 0.062, pers.pele);
      traco([ombro, [ombro[0] + (cot[0] - ombro[0]) * 0.4, ombro[1] + (cot[1] - ombro[1]) * 0.4]], 0.085, cor);
      // cabeça
      const cx = X(0, hC), cy = Y(hC);
      cabelo(g, cx, cy, rC, pers, costas, "atras");
      [-1, 1].forEach(l => disco(cx + l * rC * 0.98, cy + rC * 0.08, rC * 0.24, pers.pele2));
      disco(cx, cy, rC, pers.pele);
      if (!costas) {
        // rosto: olhos, bochechas e sorriso
        [-1, 1].forEach(l => {
          disco(cx + l * rC * 0.38, cy + rC * 0.05, rC * 0.13, "#2b2118");
          disco(cx + l * rC * 0.38 - rC * 0.04, cy + rC * 0.01, rC * 0.045, "#fff");
          g.fillStyle = "rgba(255,120,120,.35)"; g.beginPath(); g.ellipse(cx + l * rC * 0.58, cy + rC * 0.38, rC * 0.16, rC * 0.1, 0, 0, 7); g.fill();
        });
        g.strokeStyle = "#7a2e22"; g.lineWidth = Math.max(1, rC * 0.09); g.lineCap = "round";
        g.beginPath(); g.arc(cx, cy + rC * 0.3, rC * 0.3, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
      }
      cabelo(g, cx, cy, rC, pers, costas, "frente");
    }
    // cabelo em duas camadas: "atras" (antes da cabeça: rabo, cabelo comprido, coques) e "frente"
    function cabelo(g, cx, cy, r, pers, costas, camada) {
      const c = pers.cabelo, t = pers.tipo;
      const circ = (x, y, rr) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, rr, 0, 7); g.fill(); };
      if (camada === "atras") {
        if (t === "longo") { g.fillStyle = c; g.beginPath(); g.roundRect(cx - r * 1.12, cy - r * 0.6, r * 2.24, r * 2.15, r * 0.5); g.fill(); }
        if (t === "coque") { circ(cx - r * 0.85, cy - r * 0.75, r * 0.48); circ(cx + r * 0.85, cy - r * 0.75, r * 0.48); }
        if (t === "rabo" && !costas) { g.fillStyle = c; g.beginPath(); g.ellipse(cx + r * 1.05, cy + r * 0.3, r * 0.3, r * 0.7, -0.3, 0, 7); g.fill(); }
        return;
      }
      if (costas) {
        // de costas, quase a cabeça toda é cabelo (sobra a nuca)
        g.fillStyle = c; g.beginPath(); g.arc(cx, cy - r * 0.04, r * (t === "crespo" ? 1.16 : 1.05), Math.PI * 0.82, Math.PI * 2.18); g.closePath(); g.fill();
        if (t === "crespo") for (let a = 0; a < 7; a++) { const an = Math.PI * (0.95 + a * 0.18); circ(cx + Math.cos(an) * r * 1.02, cy + Math.sin(an) * r * 1.02, r * 0.3); }
        if (t === "rabo") { g.fillStyle = c; g.beginPath(); g.ellipse(cx, cy + r * 1.15, r * 0.26, r * 0.62, 0, 0, 7); g.fill(); g.fillStyle = "#e64980"; g.fillRect(cx - r * 0.2, cy + r * 0.55, r * 0.4, r * 0.14); }
        if (t === "longo") { g.fillStyle = c; g.beginPath(); g.roundRect(cx - r * 1.05, cy, r * 2.1, r * 1.55, [0, 0, r * 0.4, r * 0.4]); g.fill(); }
        return;
      }
      // de frente: topo da cabeça e franja
      g.fillStyle = c; g.beginPath();
      g.arc(cx, cy, r * (t === "crespo" ? 1.14 : 1.06), Math.PI * 0.96, Math.PI * 2.04);
      g.quadraticCurveTo(cx + r * 0.5, cy - r * 0.62, cx, cy - r * 0.5);
      g.quadraticCurveTo(cx - r * 0.5, cy - r * 0.62, cx - r * 1.04, cy - r * 0.05);
      g.closePath(); g.fill();
      if (t === "crespo") for (let a = 0; a < 6; a++) { const an = Math.PI * (1.05 + a * 0.18); circ(cx + Math.cos(an) * r * 1.0, cy + Math.sin(an) * r * 1.0, r * 0.3); }
      if (t === "longo") [-1, 1].forEach(l => { g.fillStyle = c; g.beginPath(); g.roundRect(cx + l * r * 1.02 - r * 0.2, cy - r * 0.2, r * 0.4, r * 1.3, r * 0.2); g.fill(); });
      if (t === "rabo") { g.fillStyle = "#e64980"; g.beginPath(); g.arc(cx + r * 0.9, cy - r * 0.2, r * 0.16, 0, 7); g.fill(); }
    }
    function desenharAdversario(v) {
      const q = raq[1];
      desenharPessoa(ctx, v, { x: q.x + 0.3, z: q.z + 0.32, q, pers: visual[1].pers, cor: visual[1].cor, costas: false });
      desenharRaquete(v, q, visual[1].cor, 1);
      mao(ctx, v, q, visual[1].pers);
    }
    // Você: desenhado numa camada à parte e colado meio transparente (para não tampar a bolinha)
    let camada = null;
    function desenharVoce(v) {
      const cv = P.canvas;
      if (!camada) camada = document.createElement("canvas");
      if (camada.width !== cv.width || camada.height !== cv.height) { camada.width = cv.width; camada.height = cv.height; }
      const g = camada.getContext("2d");
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, camada.width, camada.height);
      g.setTransform(ctx.getTransform());
      // de verdade ele estaria tão perto da câmera que só a cabeça caberia; então fica um pouco
      // menor, ao lado da raquete, com os ombros na altura da mão (a raquete parada)
      const q = raq[0], sr = v.esc(q.z), sB = sr * 0.6;
      const maoY = v.proj(q.x, 0.25, q.z)[1] + RAQ_R * 0.62 * sr * 1.22;
      const tela = { base: [v.W / 2 + (q.x - 0.34 - v.camX) * sr, Math.min(maoY + 0.96 * sB, v.H + 0.55 * sB)], s: sB }; // tela deitada: sobe até aparecer o peito
      desenharPessoa(g, v, { q, pers: visual[0].pers, cor: visual[0].cor, costas: true, tela });
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.62; ctx.drawImage(camada, 0, 0); ctx.restore();
    }
    function placar() {
      const s = Math.min(1.5, P.esc()), W = P.W;
      const w = Math.min(W - 150, 420 * s), x = W / 2 - w / 2, y = 8;
      Palco.caixa(ctx, x, y, w, 54 * s, 14);
      jog.forEach((j, i) => {
        const cx = x + (i === 0 ? w * 0.25 : w * 0.75);
        Palco.texto(ctx, (sacador === i && !fim ? "🏓 " : "") + j.nome.slice(0, 12), cx, y + 15 * s, 13 * s, "#fff", { contorno: null });
        Palco.texto(ctx, String(j.pts), cx, y + 38 * s, 26 * s, i === 0 ? "#ff8787" : "#8ce99a", { contorno: null });
      });
      Palco.texto(ctx, "×", x + w / 2, y + 30 * s, 22 * s, "#fff", { contorno: null });
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    let autoTeste = false;
    if (window.PING_TESTE) window.PING_TESTE = { auto: () => { autoTeste = true; }, estado: () => ({ fase, pts: jog.map(j => j.pts), sacador, quiques: quiques.join(","), ultimoA, b: [bola.x, bola.y, bola.z].map(v => +v.toFixed(2)) }) };
    // ----- Laço -----
    P.aoMedir = posicionar;
    posicionarSaque();
    P.rodar(dt => {
      if (!pausado && !fim) {
        tFase += dt;
        controlar(dt);
        if (fase === "saque") { const sd = sacador === 0 ? 1 : -1; bola.x = raq[sacador].x; bola.z = -sd * (MZ + 0.15); bola.y = 0.3 + Math.abs(Math.sin(tFase * 3)) * 0.08; }
        if (bola.ativa && (fase === "jogo" || fase === "ponto")) {
          const n = 6;
          for (let i = 0; i < n; i++) {
            passoFisico(bola, dt * kVel / n * 1.25, false);
            // a raquete alcança a bolinha?
            raq.forEach((q, lado) => {
              if (fase !== "jogo") return;
              const vindo = lado === 0 ? bola.vz < 0 && bola.z <= q.z + 0.05 : bola.vz > 0 && bola.z >= q.z - 0.05;
              if (!vindo || ultimoA === lado) return; // ninguém rebate duas vezes seguidas
              const alcance = RAQ_R + (lado === 1 && !dois ? nivel.alcance - 0.2 : 0);
              if (Math.abs(bola.x - q.x) < alcance && bola.y > -0.15 && bola.y < 0.75) {
                if (!quiques.includes(lado)) return; // precisa quicar do seu lado antes (não vale voleio)
                rebater(lado);
              }
            });
          }
          rastro.push({ x: bola.x, y: bola.y, z: bola.z }); if (rastro.length > 8) rastro.shift();
          // passou da raquete sem rebater
          if (fase === "jogo" && (bola.z < -MZ - 0.9 || bola.z > MZ + 0.9)) {
            const lado = bola.z < 0 ? 0 : 1;
            ponto(quiques.includes(lado) ? 1 - lado : lado, quiques.includes(lado) ? "Passou!" : "Fora!");
          }
        }
      }
      desenhar(dt);
    });
    Motor.falar(`Pingue-pongue! Começa sacando ${jog[0].nome}.`);
  }
})();
