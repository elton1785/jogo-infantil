// Futebol ⚽ — dois modos:
// • Pênaltis: vista de trás do batedor, em perspectiva (gramado listrado, gol com rede que balança,
//   goleiro, torcida). Quem bate mira (setas / arrastar o dedo no gol) e chuta com a barra de força
//   que sobe e desce; o goleiro (computador ou jogador 2) escolhe um lado para pular. Série de 5
//   cobranças alternadas e depois alternadas até desempatar (regra de verdade).
// • Partida: campo inteiro visto de cima, 3 contra 3 (goleiro + 2 na linha), campo cercado (a bola
//   bate na parede e volta, sem lateral nem escanteio — mais divertido para as crianças). Cada pessoa
//   controla o jogador do seu time mais perto da bola (troca sozinho); o resto é o computador.
// Contra o computador (3 níveis) ou 2 jogadores na mesma tela.
// Controles: jogador 1 = setas + Enter (chute) / espaço (passe) ou 1º controle (A chuta, X passa);
// jogador 2 = W A S D + F (chute) / G (passe) ou 2º controle. No toque: alavanca e botões grandes
// (em 2 jogadores, cada um usa um lado da tela). Os controles são lidos direto (Controle.pads()),
// por isso os eventos de teclado gerados pelo 1º controle (e.doControle) são ignorados.
(() => {
  const el = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const FONTE = '"Fredoka", "Comic Sans MS", sans-serif';
  const PELES = ["#f1c27d", "#e0ac69", "#c68642", "#8d5524", "#ffdbac", "#a0522d"];
  const CABELOS = ["#2b1b10", "#4a2c17", "#111111", "#7b4a1e", "#d9a441", "#3b2314"];
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  // Cores dos times (nomes genéricos). `gk`: camisa do goleiro na partida vista de cima.
  const CORES = {
    azul:     { nome: "Azul",     emoji: "🔵", c: "#1c7ed6", e: "#0b4a8b" },
    vermelho: { nome: "Vermelho", emoji: "🔴", c: "#e03131", e: "#8a1414" },
    verde:    { nome: "Verde",    emoji: "🟢", c: "#2f9e44", e: "#145222" },
    amarelo:  { nome: "Amarelo",  emoji: "🟡", c: "#fcc419", e: "#a87a00", texto: "#3a2a00" },
    roxo:     { nome: "Roxo",     emoji: "🟣", c: "#7048e8", e: "#3b1f99" },
    laranja:  { nome: "Laranja",  emoji: "🟠", c: "#f76707", e: "#9c3c00" },
  };
  const GOLEIRO_COR = ["#e64980", "#15aabf"];
  const nomeTime = id => `Time ${CORES[id].nome}`;

  // Força do computador
  const NIVEL = {
    facil:   { vel: 0.72, roubo: 0.8, tiro: 15, erro: 4.5, forcaTiro: 40, passe: 0.5, gkVel: 0.7, gkDefesa: 0.35, adivinha: 0.28, alcance: [0.7, 0.74] },
    medio:   { vel: 0.86, roubo: 1.7, tiro: 21, erro: 3, forcaTiro: 47, passe: 1.0, gkVel: 0.85, gkDefesa: 0.55, adivinha: 0.42, alcance: [0.83, 0.85] },
    dificil: { vel: 0.98, roubo: 2.8, tiro: 25, erro: 1.8, forcaTiro: 53, passe: 1.6, gkVel: 1, gkDefesa: 0.72, adivinha: 0.58, alcance: [0.93, 0.92] },
  };

  JOGOS.push({
    id: "futebol", nome: "Futebol", icone: "⚽",
    faixas: ["5-6", "6-8", "8-10"],
    teclas: true,
    ajuda: [
      { figura: "⚽", texto: "Escolha Pênaltis ou Partida, contra o computador ou com um amigo, e a cor do seu time." },
      { figura: ["🎯", "🥅"], texto: "Pênaltis: mire no gol com as setas (ou arrastando o dedo no gol). O alvo mostra onde a bola vai." },
      { figura: "💪", texto: "A barra de força sobe e desce: chute quando ela estiver no verde! Fraco demais o goleiro pega; forte demais a bola sobe." },
      { figura: ["🧤", "⬅️⬆️➡️"], texto: "Quando você for o goleiro, escolha um lado para pular antes do chute: esquerda, meio ou direita." },
      { figura: "🔁", texto: "São 5 cobranças para cada time, uma de cada vez. Se empatar, continua até alguém errar." },
      { figura: "🏟️", texto: "Partida: leve a bola até o gol do outro time. Você controla o jogador com a setinha, o mais perto da bola." },
      { figura: ["👟", "⚽"], texto: "Chutar: Enter, botão A do controle ou ⚽. Passar: espaço, botão X ou 👟. Sem a bola, 👟 troca de jogador." },
      { figura: "📱", texto: "No celular, mova o jogador com a bolinha da alavanca e toque nos botões grandes." },
      { figura: "🎮", texto: "Dois jogadores: o 1º usa as setas e Enter (ou o 1º controle); o 2º usa W A S D e F (ou o 2º controle). No celular, cada um usa um lado da tela." },
      { figura: "🏆", texto: "Quem fizer mais gols vence! Suas vitórias contra o computador ficam guardadas." },
    ],
    iniciar(area, faixa) { opcoes(area, faixa); },
  });
  CATALOGO["futebol"] = ["acao", "Pênaltis e partida com amigos"];

  // ---------- Tela de opções ----------
  const CHAVE = "futebol-opcoes";
  const PADRAO = { modo: "penaltis", jogadores: 1, nivel: "facil", cor1: "azul", cor2: "vermelho" };

  function camisaSVG(cor, num) {
    const c = CORES[cor];
    return `<svg viewBox="0 0 80 76" aria-hidden="true"><path d="M22 6 L32 2 Q40 10 48 2 L58 6 L76 20 L66 33 L58 28 L58 72 Q40 76 22 72 L22 28 L14 33 L4 20 Z" fill="${c.c}" stroke="${c.e}" stroke-width="3" stroke-linejoin="round"/><path d="M32 2 Q40 10 48 2" fill="none" stroke="${c.e}" stroke-width="4"/><text x="40" y="56" text-anchor="middle" font-size="26" font-weight="700" fill="${c.texto || "#fff"}" font-family="Fredoka, sans-serif">${num}</text></svg>`;
  }

  function opcoes(area, faixa) {
    const previa = el("div", "fut-previa");
    const pintar = op => {
      const dois = op.jogadores === 2;
      previa.innerHTML = `<div class="fut-time">${camisaSVG(op.cor1, 10)}<span>${dois ? "Jogador 1" : "Você"}</span></div>` +
        `<div class="fut-x">x</div><div class="fut-time">${camisaSVG(op.cor2, 7)}<span>${dois ? "Jogador 2" : "Computador"}</span></div>`;
    };
    let salvo = {};
    try { salvo = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { /* sem armazenamento */ }
    const op0 = { ...PADRAO, ...salvo };
    if (!CORES[op0.cor1] || !CORES[op0.cor2] || op0.cor1 === op0.cor2) { op0.cor1 = "azul"; op0.cor2 = "vermelho"; }
    pintar(op0);
    const valCores = Object.entries(CORES).map(([id, c]) => [id, `${c.emoji} ${c.nome}`]);
    Motor.telaOpcoes(area, {
      chave: CHAVE, padrao: PADRAO, antes: previa,
      opcoes: [
        { chave: "modo", titulo: "Modo", valores: [["penaltis", "⚽ Pênaltis"], ["partida", "🏟️ Partida"]] },
        { chave: "jogadores", titulo: "Jogadores", valores: [[1, "🤖 1 contra o computador"], [2, "👫 2 jogadores"]] },
        { chave: "nivel", titulo: "Nível do computador", valores: [["facil", "😊 Fácil"], ["medio", "🧠 Médio"], ["dificil", "🦉 Difícil"]] },
        { chave: "cor1", titulo: "Camisa do time 1", valores: valCores },
        { chave: "cor2", titulo: "Camisa do time 2", valores: valCores },
      ],
      aoMudar: (op, chave) => {
        if (chave === "cor1" && op.cor2 === op.cor1) op.cor2 = Object.keys(CORES).find(k => k !== op.cor1);
        if (chave === "cor2" && op.cor1 === op.cor2) op.cor1 = Object.keys(CORES).find(k => k !== op.cor2);
        pintar(op);
        if (chave === "cor1" || chave === "cor2") Motor.falar(nomeTime(op[chave]));
        else if (chave === "modo") Motor.falar(op.modo === "penaltis" ? "Disputa de pênaltis!" : "Partida no campo inteiro!");
        else if (chave === "jogadores") Motor.falar(op.jogadores === 2 ? "Dois jogadores!" : "Contra o computador!");
      },
      aoJogar: op => jogo(area, op, faixa),
    });
  }

  // ---------- Vitórias guardadas ----------
  const CHAVE_VIT = "futebol-vitorias";
  function lerVitorias() {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(CHAVE_VIT)); } catch (e) { /* ok */ }
    const base = { v: 0, e: 0, d: 0 };
    return { penaltis: { ...base, ...(v && v.penaltis) }, partida: { ...base, ...(v && v.partida) } };
  }
  function registrar(modo, venc) {
    const v = lerVitorias();
    v[modo][venc === 0 ? "v" : venc === 1 ? "d" : "e"]++;
    try { localStorage.setItem(CHAVE_VIT, JSON.stringify(v)); } catch (e) { /* ok */ }
    return v[modo];
  }

  // ---------- Desenhos comuns ----------
  function textoGrande(c, txt, x, y, tam, cor, escala = 1) {
    c.save();
    c.translate(x, y); c.scale(escala, escala);
    c.font = `bold ${tam}px ${FONTE}`;
    c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round";
    c.lineWidth = tam * 0.18; c.strokeStyle = "rgba(15,20,40,.85)";
    c.strokeText(txt, 0, 0);
    c.fillStyle = cor; c.fillText(txt, 0, 0);
    c.restore();
  }
  function pilula(c, txt, x, y, tam = 15) {
    c.save();
    c.font = `bold ${tam}px ${FONTE}`;
    const w = c.measureText(txt).width + tam * 1.4, h = tam * 1.9;
    c.fillStyle = "rgba(15,25,45,.72)";
    rr(c, x - w / 2, y - h / 2, w, h, h / 2); c.fill();
    c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(txt, x, y + 1);
    c.restore();
  }
  function soltarConfete(lista, x, y, cores, n = 70) {
    for (let i = 0; i < n; i++) {
      lista.push({ x, y, vx: rnd(-260, 260), vy: rnd(-460, -120), cor: Motor.sortear(cores), r: rnd(0, 6.3), vr: rnd(-10, 10), w: rnd(6, 11), h: rnd(3, 6), vida: rnd(1.6, 2.6) });
    }
  }
  function moverConfete(lista, dt) {
    lista.forEach(p => { p.vy += 520 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.vida -= dt; });
    return lista.filter(p => p.vida > 0);
  }
  function desenharConfete(c, lista) {
    lista.forEach(p => {
      c.save(); c.translate(p.x, p.y); c.rotate(p.r);
      c.globalAlpha = Math.min(1, p.vida * 2);
      c.fillStyle = p.cor; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      c.restore();
    });
  }
  // Bola com gomos (pentágonos) que giram
  function desenharBola(c, x, y, r, giro, contorno) {
    c.save();
    c.translate(x, y);
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.7, "#eef1f4"); g.addColorStop(1, "#aab3bc");
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill();
    c.save();
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.clip();
    c.fillStyle = "#24282d";
    const pent = (px, py, pr, a) => {
      c.beginPath();
      for (let i = 0; i < 5; i++) { const an = a + i * Math.PI * 0.4; c.lineTo(px + Math.cos(an) * pr, py + Math.sin(an) * pr); }
      c.closePath(); c.fill();
    };
    const ox = Math.sin(giro) * r * 0.3;
    pent(ox, Math.cos(giro * 0.7) * r * 0.12, r * 0.32, giro);
    for (let i = 0; i < 5; i++) { const an = giro + i * Math.PI * 0.4 + 0.6; pent(ox + Math.cos(an) * r * 0.9, Math.sin(an) * r * 0.9, r * 0.27, an); }
    c.restore();
    c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = contorno || r * 0.1;
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
    c.restore();
  }

  // Bonequinho em pé (pênaltis), em metros: origem nos pés, y para cima é negativo.
  // o: { camisa, escuro, calcao, meiao, pele, cabelo, numero, textoCor, frente, maos, luvas, peE, peD }
  function boneco(c, o) {
    c.lineCap = "round"; c.lineJoin = "round";
    const perna = (hx, fx, fy) => {
      c.strokeStyle = o.pele; c.lineWidth = 0.17;
      c.beginPath(); c.moveTo(hx, -0.9); c.lineTo(fx, fy); c.stroke();
      const mx = lerp(hx, fx, 0.45), my = lerp(-0.9, fy, 0.45);
      c.strokeStyle = o.meiao; c.lineWidth = 0.19;
      c.beginPath(); c.moveTo(mx, my); c.lineTo(fx, fy - 0.05); c.stroke();
      c.fillStyle = "#1f2327";
      c.beginPath(); c.ellipse(fx, fy - 0.03, 0.12, 0.075, 0, 0, Math.PI * 2); c.fill();
    };
    const peE = o.peE || { x: 0, y: 0 }, peD = o.peD || { x: 0, y: 0 };
    perna(-0.13, -0.18 + peE.x, -peE.y);
    perna(0.13, 0.18 + peD.x, -peD.y);
    // calção
    c.fillStyle = o.calcao; rr(c, -0.31, -1.1, 0.62, 0.3, 0.08); c.fill();
    // braços
    const oy = -1.47;
    const braco = (sx, m) => {
      const ex = lerp(sx, m[0], 0.45), ey = lerp(oy, m[1], 0.45);
      c.strokeStyle = o.camisa; c.lineWidth = 0.16;
      c.beginPath(); c.moveTo(sx, oy); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = o.pele; c.lineWidth = 0.12;
      c.beginPath(); c.moveTo(ex, ey); c.lineTo(m[0], m[1]); c.stroke();
      if (o.luvas) {
        c.fillStyle = "#fff"; c.strokeStyle = "#ff922b"; c.lineWidth = 0.05;
        c.beginPath(); c.arc(m[0], m[1], 0.12, 0, Math.PI * 2); c.fill(); c.stroke();
      } else {
        c.fillStyle = o.pele; c.beginPath(); c.arc(m[0], m[1], 0.07, 0, Math.PI * 2); c.fill();
      }
    };
    const maos = o.maos || [[-0.42, -0.98], [0.42, -0.98]];
    braco(-0.28, maos[0]); braco(0.28, maos[1]);
    // tronco
    c.fillStyle = o.camisa; rr(c, -0.33, -1.6, 0.66, 0.58, 0.15); c.fill();
    c.strokeStyle = o.escuro; c.lineWidth = 0.035; c.stroke();
    c.fillStyle = o.escuro; rr(c, -0.33, -1.17, 0.66, 0.07, 0.03); c.fill(); // barra da camisa
    // número
    c.save(); c.scale(0.01, 0.01);
    c.fillStyle = o.textoCor; c.font = `bold ${o.frente ? 20 : 30}px ${FONTE}`;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText(o.numero, o.frente ? 13 : 0, o.frente ? -143 : -132);
    c.restore();
    // pescoço e cabeça
    c.fillStyle = o.pele; c.fillRect(-0.07, -1.68, 0.14, 0.1);
    c.beginPath(); c.arc(0, -1.82, 0.2, 0, Math.PI * 2); c.fill();
    if (o.frente) {
      c.fillStyle = o.cabelo; c.beginPath(); c.arc(0, -1.85, 0.2, Math.PI * 1.02, Math.PI * 1.98); c.fill();
      c.fillStyle = "#222";
      c.beginPath(); c.arc(-0.07, -1.82, 0.026, 0, Math.PI * 2); c.arc(0.07, -1.82, 0.026, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#222"; c.lineWidth = 0.022;
      c.beginPath(); c.arc(0, -1.77, 0.07, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
      // gola em V
      c.fillStyle = o.escuro; c.beginPath(); c.moveTo(-0.1, -1.6); c.lineTo(0, -1.5); c.lineTo(0.1, -1.6); c.fill();
    } else {
      c.fillStyle = o.pele;
      c.beginPath(); c.arc(-0.2, -1.81, 0.045, 0, Math.PI * 2); c.arc(0.2, -1.81, 0.045, 0, Math.PI * 2); c.fill();
      c.fillStyle = o.cabelo; c.beginPath(); c.arc(0, -1.84, 0.195, 0, Math.PI * 2); c.fill();
    }
  }

  // =====================================================================================
  // Jogo: tela, entradas (teclado, controles, toque), laço e tela de fim
  // =====================================================================================
  function jogo(area, op, faixa) {
    op = { ...PADRAO, ...op };
    if (!CORES[op.cor1]) op.cor1 = "azul";
    if (!CORES[op.cor2] || op.cor2 === op.cor1) op.cor2 = Object.keys(CORES).find(k => k !== op.cor1);
    if (!NIVEL[op.nivel]) op.nivel = "facil";
    op.jogadores = op.jogadores === 2 ? 2 : 1;
    const sessao = Motor.sessaoAtual();
    area.innerHTML = "";
    const tela = el("div", "fut-tela");
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const topo = el("div", "fut-topo");
    const info = el("div", "fut-info");
    const pausaB = el("button", "chip fut-pausa");
    pausaB.textContent = "⏸️";
    pausaB.setAttribute("aria-label", "Pausar");
    pausaB.addEventListener("click", () => alternarPausa());
    topo.append(info, pausaB, Motor.botaoSom());
    const palco = el("div", "fut-palco");
    const canvas = el("canvas");
    const camada = el("div", "fut-toque");
    palco.append(canvas, camada);
    tela.append(topo, palco);
    area.appendChild(tela);

    const J = {
      op, fx: (faixa && faixa.id) || "8-10", nivel: NIVEL[op.nivel], humanos: op.jogadores,
      times: [{ ...CORES[op.cor1], id: op.cor1 }, { ...CORES[op.cor2], id: op.cor2 }],
      ctx: canvas.getContext("2d"), canvas, palco, camada, W: 300, H: 300, dpr: 1, pausado: false, acabou: false,
      // Botões de toque: celular/tablet (dedo é o ponteiro principal); no computador com tela de
      // toque eles aparecem no primeiro toque.
      toque: !!window.matchMedia && (matchMedia("(pointer: coarse)").matches || ((navigator.maxTouchPoints || 0) > 0 && !matchMedia("(pointer: fine)").matches)),
    };
    J.nomeTime = i => `Time ${J.times[i].nome}`;
    let infoAnt = "";
    J.setInfo = html => { if (html !== infoAnt) { infoAnt = html; info.innerHTML = html; } };

    // ---------- Entradas ----------
    const teclas = new Set();
    const CONJ = [
      { dir: { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }, chute: ["Enter"], passe: [" "] },
      { dir: { w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] }, chute: ["f"], passe: ["g"] },
    ];
    const dono = i => (J.humanos === 1 ? 0 : i);
    J.joy = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
    const padDe = h => {
      const ps = typeof Controle !== "undefined" && Controle.pads ? Controle.pads() : [];
      return J.humanos === 1 ? ps[0] || null : ps[h] || null;
    };
    // Direção na tela (x para a direita, y para baixo), tamanho até 1
    J.direcao = h => {
      let x = 0, y = 0;
      CONJ.forEach((cj, i) => {
        if (dono(i) !== h) return;
        Object.entries(cj.dir).forEach(([k, [dx, dy]]) => { if (teclas.has(k)) { x += dx; y += dy; } });
      });
      const p = padDe(h);
      if (p) {
        x += p.eixo(0) + (p.botao(15) ? 1 : 0) - (p.botao(14) ? 1 : 0);
        y += p.eixo(1) + (p.botao(13) ? 1 : 0) - (p.botao(12) ? 1 : 0);
      }
      x += J.joy[h].x; y += J.joy[h].y;
      const m = Math.hypot(x, y);
      if (m > 1) { x /= m; y /= m; }
      return { x, y };
    };
    const padAnt = [{}, {}];
    function lerPads() {
      for (let h = 0; h < J.humanos; h++) {
        const p = padDe(h);
        if (!p) { padAnt[h] = {}; continue; }
        const est = {
          chute: p.botao(0), passe: p.botao(2) || p.botao(3), pausa: p.botao(9),
          esq: p.botao(14) || p.eixo(0) < -0.55, dir: p.botao(15) || p.eixo(0) > 0.55,
          cima: p.botao(12) || p.eixo(1) < -0.55, baixo: p.botao(13) || p.eixo(1) > 0.55,
        };
        const a = padAnt[h];
        if (est.pausa && !a.pausa) alternarPausa();
        if (!J.acabou) {
          if (est.chute && !a.chute) { if (J.pausado) alternarPausa(); else M.acao(h, "chute"); }
          if (est.passe && !a.passe && !J.pausado) M.acao(h, "passe");
          if (!J.pausado && M.direcaoApertada) {
            if (est.esq && !a.esq) M.direcaoApertada(h, [-1, 0]);
            if (est.dir && !a.dir) M.direcaoApertada(h, [1, 0]);
            if (est.cima && !a.cima) M.direcaoApertada(h, [0, -1]);
            if (est.baixo && !a.baixo) M.direcaoApertada(h, [0, 1]);
          }
        }
        padAnt[h] = est;
      }
    }
    const chaveDe = e => (e.key && e.key.length === 1 ? e.key.toLowerCase() : e.key);
    function teclaDesce(e) {
      if (!vivo()) { limpar(); return; }
      if (e.doControle || J.acabou) return; // o 1º controle é lido direto
      const k = chaveDe(e);
      if (k === "p" || k === "Escape") { e.preventDefault(); alternarPausa(); return; }
      CONJ.forEach((cj, i) => {
        const h = dono(i);
        if (h >= J.humanos) return;
        if (cj.dir[k]) {
          e.preventDefault();
          teclas.add(k);
          if (!e.repeat && !J.pausado && M.direcaoApertada) M.direcaoApertada(h, cj.dir[k]);
        } else if (cj.chute.includes(k) || cj.passe.includes(k)) {
          e.preventDefault();
          if (e.repeat) return;
          if (J.pausado) { if (cj.chute.includes(k)) alternarPausa(); return; }
          M.acao(h, cj.chute.includes(k) ? "chute" : "passe");
        }
      });
    }
    function teclaSobe(e) {
      if (!vivo()) { limpar(); return; }
      teclas.delete(chaveDe(e));
    }
    const perdeuFoco = () => teclas.clear();
    const escondeu = () => { if (!vivo()) { limpar(); return; } if (document.hidden && !J.pausado && !J.acabou) alternarPausa(); };
    function limpar() {
      document.removeEventListener("keydown", teclaDesce);
      document.removeEventListener("keyup", teclaSobe);
      window.removeEventListener("blur", perdeuFoco);
      document.removeEventListener("visibilitychange", escondeu);
      obs.disconnect();
    }
    document.addEventListener("keydown", teclaDesce);
    document.addEventListener("keyup", teclaSobe);
    window.addEventListener("blur", perdeuFoco);
    document.addEventListener("visibilitychange", escondeu);

    // Primeiro toque na tela: liga os botões de toque (computador com tela de toque, etc.)
    tela.addEventListener("pointerdown", e => {
      if (e.pointerType === "touch" && !J.toque) { J.toque = true; M.montarToque(); medir(); }
    });

    // Alavanca virtual (joystick) do jogador h
    J.criarAlavanca = (h, tam) => {
      const base = el("div", "fut-joy");
      const bolinha = el("i");
      base.appendChild(bolinha);
      Object.assign(base.style, { width: tam + "px", height: tam + "px" });
      let id = null;
      const mover = e => {
        const r = base.getBoundingClientRect();
        let dx = (e.clientX - (r.left + r.width / 2)) / (r.width * 0.4);
        let dy = (e.clientY - (r.top + r.height / 2)) / (r.height * 0.4);
        const m = Math.hypot(dx, dy);
        if (m > 1) { dx /= m; dy /= m; }
        J.joy[h] = { x: Math.abs(dx) < 0.12 ? 0 : dx, y: Math.abs(dy) < 0.12 ? 0 : dy };
        bolinha.style.transform = `translate(${dx * r.width * 0.3}px, ${dy * r.height * 0.3}px)`;
      };
      const soltar = e => {
        if (e.pointerId !== id) return;
        id = null; J.joy[h] = { x: 0, y: 0 }; bolinha.style.transform = "";
      };
      base.addEventListener("pointerdown", e => {
        e.preventDefault();
        id = e.pointerId;
        try { base.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        mover(e);
      });
      base.addEventListener("pointermove", e => { if (e.pointerId === id) mover(e); });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => base.addEventListener(ev, soltar));
      base.addEventListener("contextmenu", e => e.preventDefault());
      return base;
    };
    // Botão de toque (reage no pointerdown, sem esperar o "click")
    J.criarBotao = (rotulo, aria, fn, classe = "") => {
      const b = el("button", "fut-bt " + classe);
      b.textContent = rotulo;
      b.setAttribute("aria-label", aria);
      b.addEventListener("pointerdown", e => {
        e.preventDefault();
        b.classList.add("apertado");
        if (!J.pausado && !J.acabou) fn();
      });
      ["pointerup", "pointercancel", "pointerleave"].forEach(ev => b.addEventListener(ev, () => b.classList.remove("apertado")));
      b.addEventListener("contextmenu", e => e.preventDefault());
      return b;
    };

    // ---------- Pausa ----------
    function alternarPausa() {
      if (J.acabou) return;
      J.pausado = !J.pausado;
      teclas.clear();
      pausaB.textContent = J.pausado ? "▶️" : "⏸️";
      pausaB.setAttribute("aria-label", J.pausado ? "Continuar" : "Pausar");
    }

    // ---------- Fim ----------
    J.fim = (placar, extra = "") => {
      J.acabou = true;
      const [a, b] = placar;
      const venc = a > b ? 0 : b > a ? 1 : -1;
      let titulo, trofeu, fala, detalhe = "";
      if (J.humanos === 1) {
        const v = registrar(op.modo, venc);
        titulo = venc === 0 ? "Você venceu! 🎉" : venc === 1 ? "O computador venceu" : "Empate!";
        trofeu = venc === 0 ? "🏆" : venc === 1 ? "🥈" : "🤝";
        fala = venc === 0 ? "Parabéns! Você venceu! É campeão!" : venc === 1 ? "Quase! Vamos jogar de novo?" : "Empate! Foi muito equilibrado!";
        detalhe = `🏆 Vitórias: ${v.v} · 🤝 Empates: ${v.e} · Jogos: ${v.v + v.e + v.d}`;
      } else {
        titulo = venc >= 0 ? `${J.nomeTime(venc)} venceu!` : "Empate!";
        trofeu = venc >= 0 ? "🏆" : "🤝";
        fala = venc >= 0 ? `Parabéns, ${J.nomeTime(venc)}! É campeão!` : "Empate! Foi muito equilibrado!";
      }
      const caixa = el("div", "arcade-fim fut-fim");
      const tr = el("div", "fut-fim-trofeu"); tr.textContent = trofeu;
      const ti = el("div", "titulo-fim"); ti.textContent = titulo;
      const pl = el("div", "fut-fim-placar");
      pl.innerHTML = `<i style="background:${J.times[0].c}"></i><span>${J.times[0].nome}</span><b>${a}</b><span>x</span><b>${b}</b><span>${J.times[1].nome}</span><i style="background:${J.times[1].c}"></i>`;
      caixa.append(tr, ti, pl);
      if (extra) { const ex = el("div", "detalhe-fim"); ex.textContent = extra; caixa.appendChild(ex); }
      if (detalhe) { const de = el("div", "detalhe-fim"); de.textContent = detalhe; caixa.appendChild(de); }
      const botoes = el("div", "fut-fim-botoes");
      const denovo = el("button", "chip executar"); denovo.textContent = "🔁 Jogar de novo";
      denovo.addEventListener("click", () => jogo(area, op, faixa));
      const trocar = el("button", "chip"); trocar.textContent = "⚙️ Trocar opções";
      trocar.addEventListener("click", () => opcoes(area, faixa));
      botoes.append(denovo, trocar);
      caixa.appendChild(botoes);
      camada.innerHTML = "";
      tela.appendChild(caixa);
      if (venc === 0 || J.humanos === 2 && venc >= 0) { Motor.comemorar(tr); Motor.tim(); }
      Motor.falar(fala);
    };

    // ---------- Modo ----------
    const M = op.modo === "partida" ? criarPartida(J) : criarPenaltis(J);

    // ---------- Tamanho ----------
    function medir() {
      const w = palco.clientWidth, h = palco.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(2.5, window.devicePixelRatio || 1);
      J.W = w; J.H = h; J.dpr = dpr;
      Object.assign(canvas, { width: Math.round(w * dpr), height: Math.round(h * dpr) });
      Object.assign(canvas.style, { width: w + "px", height: h + "px" });
      M.medir();
    }
    const obs = new ResizeObserver(() => { if (vivo()) medir(); else limpar(); });
    obs.observe(palco);

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.FUTEBOL_TESTE) {
      window.FUTEBOL_TESTE.estado = () => M.estado();
      window.FUTEBOL_TESTE.M = M;
      window.FUTEBOL_TESTE.J = J;
    }

    // ---------- Laço ----------
    let ultimo = performance.now();
    function quadro(agora) {
      if (!vivo()) { limpar(); return; }
      let dt = Math.min(0.05, Math.max(0, (agora - ultimo) / 1000));
      ultimo = agora;
      if (window.FUTEBOL_TESTE && window.FUTEBOL_TESTE.vel) dt *= window.FUTEBOL_TESTE.vel;
      lerPads();
      if (!J.pausado && !J.acabou) M.passo(dt);
      else if (J.acabou && M.passoFim) M.passoFim(dt);
      const c = J.ctx;
      c.setTransform(J.dpr, 0, 0, J.dpr, 0, 0);
      M.desenhar();
      if (J.pausado) {
        c.setTransform(J.dpr, 0, 0, J.dpr, 0, 0);
        c.fillStyle = "rgba(10,20,40,.45)"; c.fillRect(0, 0, J.W, J.H);
        textoGrande(c, "⏸️ Pausa", J.W / 2, J.H / 2, Math.min(56, J.W / 8), "#fff");
      }
      requestAnimationFrame(quadro);
    }
    medir();
    M.montarToque();
    M.comecar();
    requestAnimationFrame(quadro);
  }

  // =====================================================================================
  // PÊNALTIS
  // =====================================================================================
  function criarPenaltis(J) {
    const c = J.ctx;
    const humano = tm => tm === 0 || J.humanos === 2;
    const RB = 0.17, ZG = 17.7, ZSPOT = 7, PX = 3.66, PY = 2.44;
    const PERIODO = { "5-6": 2.3, "6-8": 1.8 }[J.fx] || 1.45;
    const N = J.nivel;
    let W = 1, H = 1, cx = 0, GW = 1, gy0 = 0, f = 1, hc = 1, yHor = 0, yBordas = 0, yBordasTopo = 0, zMin = 1;
    let torcida = [], filaH = 20, filas = 0, xIdle = -1.45;
    const gols = [[], []];
    let batedor = 0, fase = "mirar", tFase = 0, t = 0, alvo = { gx: 0, gy: 0.4 }, forca = 0, tForca = 0, forcaFinal = 0;
    let escolha = null, travado = false, mergulho = { d: 0, t: -9, x: 0, alto: 0 }, corrida = 0, voo = null, resultado = null;
    let bola = null, msg = null, rede = { x: 0, y: 1, t: 9, a: 0 }, animo = 0.15, confete = [], cpu = null, tChute = 9;
    const jaFalou = { bater: false, goleiro: false };
    let bChutar = null, bGoleiro = [];

    const proj = (X, Y, Z) => ({ x: cx + f * X / Z, y: yHor + f * (hc - Y) / Z, k: f / Z });
    const goleiroTime = () => 1 - batedor;
    const golsDe = tm => gols[tm].filter(Boolean).length;

    function medir() {
      W = J.W; H = J.H; cx = W / 2;
      const deitado = W > H;
      gy0 = H * (deitado ? 0.53 : 0.42);
      GW = Math.min(W * (deitado ? 0.5 : 0.84), H * 0.8);
      f = GW * 18 / (2 * PX);
      const ySpot = gy0 + (H - gy0) * (deitado ? 0.6 : 0.5);
      hc = (ySpot - gy0) / (f * (1 / ZSPOT - 1 / 18));
      yHor = gy0 - f * hc / 18;
      yBordas = proj(0, 0, 23).y;
      yBordasTopo = yBordas - f * 1.0 / 23;
      zMin = f * hc / (H + 4 - yHor);
      xIdle = deitado ? -1.45 : -0.95;
      gerarTorcida();
    }

    function gerarTorcida() {
      filaH = clamp(yBordasTopo / 5.5, 14, 30);
      filas = Math.ceil(yBordasTopo / filaH) + 1;
      torcida = [];
      const passo = filaH * 0.8;
      const extras = ["#ffffff", "#ffd43b", "#ff8787", "#74c0fc", "#b197fc", "#63e6be", "#ffa94d", "#f8f9fa"];
      for (let i = 0; i < filas; i++) {
        for (let x = (i % 2) * passo / 2 - passo; x < W + passo; x += passo) {
          const lado = x < W / 2 ? 0 : 1, r = Math.random();
          const cor = r < 0.55 ? J.times[lado].c : r < 0.68 ? J.times[1 - lado].c : Motor.sortear(extras);
          torcida.push({ x: x + rnd(-2, 2), fila: i, cor, pele: Motor.sortear(PELES), fase: rnd(0, 6.3),
            bandeira: Math.random() < 0.06 ? J.times[lado].c : null, bracos: Math.random() < 0.55 });
        }
      }
    }

    // ---------- Fluxo ----------
    function comecar() {
      batedor = 0;
      novaCobranca();
    }
    function novaCobranca() {
      fase = J.humanos === 2 ? "goleiro" : "mirar";
      tFase = 0; alvo = { gx: 0, gy: 0.4 }; tForca = Math.random() * PERIODO; forca = 0;
      escolha = null; travado = false; mergulho = { d: 0, t: -9, x: 0, alto: 0 }; corrida = 0; voo = null; resultado = null;
      bola = { X: 0, Y: RB, Z: ZSPOT, vX: 0, vY: 0, vZ: 0, giro: 0, fisica: false, dentro: false, visivel: true };
      msg = null; tChute = 9;
      cpu = humano(batedor) ? null : planejarCPU();
      atualizarInfo();
      const nb = J.nomeTime(batedor), ng = J.nomeTime(goleiroTime());
      if (J.humanos === 2) Motor.falar(`Goleiro do ${ng}, escolha um lado!`);
      else if (batedor === 0) {
        Motor.falar(jaFalou.bater ? "Sua vez de bater!" : "Sua vez de bater! Mire no gol e chute quando a força estiver no verde!");
        jaFalou.bater = true;
      } else {
        Motor.falar(jaFalou.goleiro ? "Você no gol!" : "Agora você é o goleiro! Escolha um lado para pular!");
        jaFalou.goleiro = true;
      }
      void nb;
    }
    function planejarCPU() {
      const lado = Math.random() < 0.5 ? -1 : 1;
      const n = J.op.nivel;
      const gx = lado * (n === "facil" ? rnd(0.12, 0.85) : n === "medio" ? rnd(0.35, 0.93) : rnd(0.55, 0.97));
      const gy = n === "facil" ? rnd(0.1, 0.75) : rnd(0.12, 0.88);
      const forca = n === "facil" ? rnd(0.25, 0.96) : n === "medio" ? rnd(0.35, 0.9) : rnd(0.45, 0.87);
      return { gx, gy, forca, espera: rnd(1.7, 2.6) + (J.fx === "5-6" ? 0.8 : 0) };
    }
    function atualizarInfo() {
      const tm = batedor;
      if (fase === "fim") { J.setInfo(`<span>🏁 Fim da disputa!</span>`); return; }
      J.setInfo(`<span><i style="background:${J.times[tm].c}"></i>${J.times[tm].nome} ⚽</span>`);
    }

    function escolher(d) {
      if (travado) return;
      if (escolha !== d) Motor.nota(660 + d * 120, { dur: 0.08, tipo: "triangle", vol: 0.12 });
      escolha = d;
      if (J.humanos === 2) {
        travado = true;
        if (fase === "goleiro") {
          fase = "goleiroPronto"; tFase = 0;
          Motor.falar(`Goleiro pronto! ${J.nomeTime(batedor)}, pode chutar!`);
        }
      }
    }
    const podeEscolher = () => !travado && (fase === "goleiro" || fase === "mirar" || fase === "corrida") && humano(goleiroTime());
    function lerGoleiro() {
      if (!podeEscolher()) return;
      const d = J.direcao(goleiroTime());
      if (Math.abs(d.x) > 0.5) escolher(Math.sign(d.x));
      else if (Math.abs(d.y) > 0.5) escolher(0);
    }

    function iniciarCorrida() {
      if (fase !== "mirar") return;
      forcaFinal = humano(batedor) ? forca : cpu.forca;
      if (!humano(batedor)) { alvo.gx = cpu.gx; alvo.gy = cpu.gy; }
      fase = "corrida"; corrida = 0; tFase = 0;
    }

    function salva(d, gx, gy, F) {
      const cpuGk = !humano(goleiroTime());
      let ax = cpuGk ? N.alcance[0] : 0.9, ay = cpuGk ? N.alcance[1] : 0.9;
      if (cpuGk && J.fx === "5-6") ax -= 0.06;
      const bonus = F < 0.3 ? 0.22 : F < 0.45 ? 0.08 : 0;
      if (d === 0) return Math.abs(gx) < 0.3 + bonus && gy < 0.8 + bonus;
      return gx * d > 0.1 && gx * d < ax + bonus && gy < ay + bonus;
    }

    function chutar() {
      travado = true;
      const F = forcaFinal;
      let gx = alvo.gx + rnd(-0.04, 0.04), gy = alvo.gy + rnd(-0.04, 0.04);
      if (F > 0.86) gy += (F - 0.86) * 4.5;
      if (F < 0.2) gy = Math.min(gy, 0.25);
      gy = Math.max(0.05, gy);
      const lado = Math.abs(gx) < 0.28 ? 0 : Math.sign(gx);
      if (!humano(goleiroTime())) {
        const outros = [-1, 0, 1].filter(v => v !== lado);
        escolha = Math.random() < N.adivinha ? lado : Motor.sortear(outros);
      } else if (escolha === null) escolha = 0;
      const ag = Math.abs(gx);
      if (ag > 1.04 || gy > 1.04) resultado = "fora";
      else if (ag > 0.955 || gy > 0.96) resultado = "trave";
      else resultado = salva(escolha, gx, gy, F) ? "defesa" : "gol";
      mergulho = {
        d: escolha, t: -0.12,
        x: resultado === "defesa" && escolha !== 0 ? clamp(gx * PX - escolha * 0.95, -2.9, 2.9) : escolha * 2.3,
        alto: resultado === "defesa" ? clamp((gy * PY - 1.0) * 0.5, 0, 0.75) : 0.2,
      };
      voo = { t: 0, dur: 1.0 - 0.5 * F, X1: gx * PX, Y1: gy * PY, gx, gy, efeito: (-gx * 0.9 + rnd(-0.3, 0.3)) * (F > 0.3 ? 1 : 0.4) };
      fase = "voo"; tFase = 0; tChute = 0;
      Motor.nota(140, { dur: 0.12, tipo: "triangle", vol: 0.45, ate: 60 });
      Motor.ruido({ dur: 0.07, vol: 0.18, freq: 2600 });
    }

    function chegou() {
      const v = voo, dur = v.dur;
      bola.vX = (v.X1 - v.efeito * Math.PI) / dur;
      bola.vY = (v.Y1 - RB) / dur - 0.4 * Math.PI / dur * Math.min(1, v.Y1);
      bola.vZ = 11 / dur;
      bola.fisica = true;
      const nome = J.nomeTime(batedor);
      if (resultado === "gol") {
        gols[batedor].push(true);
        bola.dentro = true;
        msg = { txt: "GOOOL!", cor: "#ffd43b", t: 0 };
        animo = 1;
        soltarConfete(confete, cx, gy0 - GW / 3 * 0.6, [J.times[batedor].c, "#ffd43b", "#fff", "#69db7c", "#74c0fc"], 90);
        Motor.ruido({ dur: 2.2, vol: 0.22, filtro: "bandpass", freq: 800 });
        Motor.tim();
        Motor.falar(J.humanos === 1 ? (batedor === 0 ? "Goool! Que golaço!" : "Gol do computador!") : `Goool do ${nome}!`);
      } else {
        gols[batedor].push(false);
        if (resultado === "defesa") {
          bola.Z = Math.min(bola.Z, ZG - 0.1);
          bola.vX = mergulho.d ? mergulho.d * rnd(2, 4) : rnd(-2, 2); bola.vY = 2.5; bola.vZ = -rnd(4, 6);
          msg = { txt: "DEFENDEU!", cor: "#74c0fc", t: 0 };
          animo = 0.7;
          Motor.ruido({ dur: 0.25, vol: 0.25, freq: 600 });
          Motor.falar(J.humanos === 1 ? (batedor === 1 ? "Defendeu! Que goleiro!" : "Defendeu!") : `Defendeu o goleiro do ${J.nomeTime(goleiroTime())}!`);
        } else if (resultado === "trave") {
          const travessao = v.gy > 0.96 && Math.abs(v.gx) <= 0.955;
          bola.vX = travessao ? rnd(-1.5, 1.5) : -Math.sign(v.gx) * rnd(2, 3.5);
          bola.vY = travessao ? -1 : 1.5; bola.vZ = -rnd(6, 8);
          msg = { txt: "NA TRAVE!", cor: "#ffa94d", t: 0 };
          animo = 0.5;
          Motor.nota(880, { dur: 0.6, tipo: "triangle", vol: 0.25 });
          Motor.nota(1320, { dur: 0.4, tipo: "sine", vol: 0.12 });
          Motor.falar("Na trave!");
        } else {
          msg = { txt: "PRA FORA!", cor: "#ff8787", t: 0 };
          animo = 0.4;
          Motor.falar("Pra fora!");
        }
      }
      fase = "depois"; tFase = 0;
      atualizarInfo();
    }

    function proximo() {
      const n0 = gols[0].length, n1 = gols[1].length, s0 = golsDe(0), s1 = golsDe(1);
      let acabou = false;
      if (n0 <= 5 && n1 <= 5 && !(n0 === 5 && n1 === 5)) {
        if (s0 + (5 - n0) < s1 || s1 + (5 - n1) < s0) acabou = true;
      } else if (n0 === n1 && s0 !== s1) acabou = true;
      if (acabou) {
        fase = "fim"; tFase = 0;
        atualizarInfo();
        apito(3);
        Motor.depois(() => { if (!J.acabou) J.fim([s0, s1], `Pênaltis · ${n0 + n1} cobranças`); }, 1500);
        return;
      }
      batedor = n0 > n1 ? 1 : 0;
      novaCobranca();
    }
    function apito(n = 1) {
      for (let i = 0; i < n; i++) Motor.nota(2700, { dur: i === n - 1 ? 0.45 : 0.16, tipo: "square", vol: 0.045, inicio: i * 0.22 });
    }

    // ---------- Passo ----------
    function passo(dt) {
      t += dt; tFase += dt; tChute += dt;
      animo = Math.max(0.15, animo - dt * 0.3);
      rede.t += dt;
      if (msg) msg.t += dt;
      confete = moverConfete(confete, dt);
      if (mergulho.t > -5) mergulho.t += dt;
      if (fase === "goleiro") { lerGoleiro(); tForca += dt; }
      if (fase === "goleiroPronto" && tFase > 0.5) { fase = "mirar"; tFase = 0; }
      if (fase === "mirar" || fase === "goleiroPronto") {
        tForca += dt;
        const k = (tForca / PERIODO) % 2;
        forca = k < 1 ? k : 2 - k;
        if (humano(batedor)) {
          if (fase === "mirar") {
            const d = J.direcao(batedor);
            alvo.gx = clamp(alvo.gx + d.x * 1.25 * dt, -1.15, 1.15);
            alvo.gy = clamp(alvo.gy - d.y * 1.1 * dt, 0.05, 1.12);
          }
        } else if (tFase > cpu.espera) iniciarCorrida();
        lerGoleiro();
      }
      if (fase === "corrida") {
        corrida += dt / 0.6;
        lerGoleiro();
        if (corrida >= 1) chutar();
      }
      if (fase === "voo") {
        voo.t += dt;
        const p = Math.min(1, voo.t / voo.dur);
        bola.X = voo.X1 * p + voo.efeito * Math.sin(Math.PI * p);
        bola.Y = RB + (voo.Y1 - RB) * p + Math.sin(Math.PI * p) * 0.4 * Math.min(1, voo.Y1);
        bola.Z = ZSPOT + (18 - ZSPOT) * p;
        bola.giro += dt * 18;
        if (resultado === "defesa" && bola.Z >= ZG - 0.1) { bola.Z = ZG - 0.1; chegou(); }
        else if (p >= 1) chegou();
      } else if (fase === "depois" || fase === "fim") {
        if (bola.fisica) fisicaBola(dt);
        if (fase === "depois" && tFase > 2.5) proximo();
      }
    }
    function fisicaBola(dt) {
      const b = bola;
      b.vY -= 9.8 * dt;
      b.X += b.vX * dt; b.Y += b.vY * dt; b.Z += b.vZ * dt;
      b.giro += dt * Math.hypot(b.vX, b.vZ) * 1.5;
      if (b.Y < RB) {
        b.Y = RB;
        b.vY = Math.abs(b.vY) > 0.8 ? -b.vY * 0.45 : 0;
        b.vX *= 0.85; b.vZ *= 0.85;
      }
      if (b.dentro) {
        const zb = 20 - b.Y / PY;
        if (b.Z > zb - RB) {
          b.Z = zb - RB;
          if (b.vZ > 0) { rede = { x: b.X, y: b.Y, t: 0, a: Math.min(1, b.vZ / 14) }; b.vZ = -b.vZ * 0.1; b.vX *= 0.4; b.vY *= 0.5; }
        }
        if (Math.abs(b.X) > PX - RB) { b.X = Math.sign(b.X) * (PX - RB); b.vX = -b.vX * 0.3; }
        if (b.Y > PY - RB) { b.Y = PY - RB; b.vY = -Math.abs(b.vY) * 0.3; }
      }
      if (b.Z > 30 || b.Z < 3.2) b.visivel = false;
    }

    // ---------- Ações ----------
    function acao(h, tipo) {
      if (fase === "mirar" && batedor === h && humano(h)) { iniciarCorrida(); return; }
      if (goleiroTime() === h && podeEscolher() && tipo === "chute") escolher(0);
    }
    function direcaoApertada(h, [dx, dy]) {
      if (goleiroTime() !== h || !podeEscolher()) return;
      escolher(dx ? Math.sign(dx) : 0);
      void dy;
    }

    // Toque no canvas: mirar no gol (batedor) ou escolher o lado (goleiro)
    function toqueCanvas(e) {
      if (J.pausado || J.acabou) return;
      const r = J.canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      if (fase === "mirar" && humano(batedor)) {
        alvo.gx = clamp((x - cx) / (GW / 2), -1.15, 1.15);
        alvo.gy = clamp((gy0 - y) / (GW / 3), 0.05, 1.12);
        return true;
      }
      if (podeEscolher()) { escolher(x < cx - GW / 6 ? -1 : x > cx + GW / 6 ? 1 : 0); }
      return false;
    }
    let arrastando = null;
    J.canvas.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (toqueCanvas(e)) { arrastando = e.pointerId; try { J.canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } }
    });
    J.canvas.addEventListener("pointermove", e => { if (arrastando === e.pointerId) toqueCanvas(e); });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => J.canvas.addEventListener(ev, e => { if (arrastando === e.pointerId) arrastando = null; }));
    J.canvas.addEventListener("contextmenu", e => e.preventDefault());

    function montarToque() {
      J.camada.innerHTML = "";
      bGoleiro = [];
      bChutar = null;
      if (!J.toque) return;
      bChutar = J.criarBotao("⚽ Chutar!", "Chutar", () => { if (fase === "mirar" && humano(batedor)) iniciarCorrida(); }, "chute largo");
      Object.assign(bChutar.style, { right: "12px", bottom: "12px", height: "72px" });
      J.camada.appendChild(bChutar);
      [[-1, "⬅️", "Pular para a esquerda", 160], [0, "🧍", "Ficar no meio", 86], [1, "➡️", "Pular para a direita", 12]].forEach(([d, rot, aria, dir]) => {
        const b = J.criarBotao(rot, aria, () => { if (podeEscolher()) escolher(d); });
        Object.assign(b.style, { right: dir + "px", bottom: "12px", width: "66px", height: "66px" });
        b.dataset.lado = d;
        J.camada.appendChild(b);
        bGoleiro.push(b);
      });
    }
    function atualizarBotoes() {
      if (bChutar) bChutar.hidden = !(fase === "mirar" && humano(batedor));
      const mostrar = podeEscolher();
      bGoleiro.forEach(b => {
        b.hidden = !mostrar;
        b.classList.toggle("escolhido", J.humanos === 1 && escolha === +b.dataset.lado);
      });
    }

    // ---------- Desenho ----------
    function desenharTorcida() {
      const base = yBordasTopo;
      const gr = c.createLinearGradient(0, 0, 0, base);
      gr.addColorStop(0, "#1e2b47"); gr.addColorStop(1, "#3a5078");
      c.fillStyle = gr; c.fillRect(0, 0, W, base + 1);
      const sc = filaH;
      for (let i = filas - 1; i >= 0; i--) {
        const y = base - i * filaH;
        c.fillStyle = i % 2 ? "#4b6189" : "#566d97";
        c.fillRect(0, y - sc * 0.3, W, sc * 0.3);
        torcida.forEach(fa => {
          if (fa.fila !== i) return;
          const pul = Math.abs(Math.sin(t * 8 + fa.fase)) * animo * sc * 0.4 + Math.sin(t * 2.2 + fa.fase) * sc * 0.03;
          const yy = y - sc * 0.15 - pul;
          if (animo > 0.45 && fa.bracos) {
            c.strokeStyle = fa.pele; c.lineWidth = sc * 0.11; c.lineCap = "round";
            const ab = Math.sin(t * 10 + fa.fase) * sc * 0.1;
            c.beginPath();
            c.moveTo(fa.x - sc * 0.22, yy - sc * 0.45); c.lineTo(fa.x - sc * 0.38 + ab, yy - sc * 1.05);
            c.moveTo(fa.x + sc * 0.22, yy - sc * 0.45); c.lineTo(fa.x + sc * 0.38 - ab, yy - sc * 1.05);
            c.stroke();
          }
          c.fillStyle = fa.cor; rr(c, fa.x - sc * 0.3, yy - sc * 0.56, sc * 0.6, sc * 0.62, sc * 0.2); c.fill();
          c.fillStyle = fa.pele; c.beginPath(); c.arc(fa.x, yy - sc * 0.74, sc * 0.21, 0, Math.PI * 2); c.fill();
          if (fa.bandeira) {
            const topoB = yy - sc * 1.7;
            c.strokeStyle = "#ddd"; c.lineWidth = Math.max(1, sc * 0.06);
            c.beginPath(); c.moveTo(fa.x + sc * 0.3, yy - sc * 0.4); c.lineTo(fa.x + sc * 0.3, topoB); c.stroke();
            c.fillStyle = fa.bandeira;
            c.beginPath(); c.moveTo(fa.x + sc * 0.3, topoB);
            for (let k = 0; k <= 6; k++) c.lineTo(fa.x + sc * 0.3 + k * sc * 0.15, topoB + Math.sin(t * 7 + k * 0.9 + fa.fase) * sc * 0.08);
            for (let k = 6; k >= 0; k--) c.lineTo(fa.x + sc * 0.3 + k * sc * 0.15, topoB + sc * 0.5 + Math.sin(t * 7 + k * 0.9 + fa.fase) * sc * 0.08);
            c.closePath(); c.fill();
          }
        });
      }
      // cobertura e refletores
      if (base > 80) {
        const hT = Math.min(16, base * 0.1);
        c.fillStyle = "#151d30"; c.fillRect(0, 0, W, hT);
        for (let x = W * 0.12; x < W; x += W * 0.25) {
          const g = c.createRadialGradient(x, hT, 0, x, hT, hT * 2.2);
          g.addColorStop(0, "rgba(255,250,220,.95)"); g.addColorStop(1, "rgba(255,250,220,0)");
          c.fillStyle = g; c.beginPath(); c.arc(x, hT, hT * 2.2, 0, Math.PI * 2); c.fill();
        }
      }
      // placas
      const hB = yBordas - yBordasTopo, segs = W > 700 ? 6 : 4, sw = W / segs;
      const textos = ["⚽ FUTEBOL", "BRINCAR", "E APRENDER", "⭐ GOOOL ⭐", "TORCIDA", "⚽ FUTEBOL"];
      for (let i = 0; i < segs; i++) {
        const cores = [[J.times[0].c, J.times[0].texto || "#fff"], ["#ffffff", "#1d3557"], [J.times[1].c, J.times[1].texto || "#fff"], ["#ffd43b", "#1d3557"]][i % 4];
        c.fillStyle = cores[0]; c.fillRect(i * sw, yBordasTopo, sw + 1, hB);
        c.fillStyle = cores[1]; c.font = `bold ${Math.max(8, hB * 0.55)}px ${FONTE}`;
        c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(textos[i % textos.length], i * sw + sw / 2, yBordasTopo + hB / 2 + 1, sw * 0.9);
      }
      c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(0, yBordas - 2, W, 2);
    }

    function desenharGramado() {
      c.fillStyle = "#3d9a47"; c.fillRect(0, yBordas, W, H - yBordas);
      let z = 23, i = 0;
      while (z > zMin && i < 80) {
        const z2 = Math.max(zMin, z - 2.2);
        const y1 = proj(0, 0, z).y, y2 = proj(0, 0, z2).y;
        if (i % 2) { c.fillStyle = "#4bab55"; c.fillRect(0, y1, W, y2 - y1 + 0.5); }
        z = z2; i++;
      }
      const h = (H - yBordas) * 0.35;
      const gr = c.createLinearGradient(0, yBordas, 0, yBordas + h);
      gr.addColorStop(0, "rgba(15,40,25,.3)"); gr.addColorStop(1, "rgba(15,40,25,0)");
      c.fillStyle = gr; c.fillRect(0, yBordas, W, h);
      // linhas
      const zl = z0 => Math.max(z0, zMin * 0.85);
      const linha = (X1, Z1, X2, Z2) => { const a = proj(X1, 0, zl(Z1)), b = proj(X2, 0, zl(Z2)); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); };
      c.strokeStyle = "rgba(255,255,255,.88)"; c.lineWidth = Math.max(1.5, proj(0, 0, 18).k * 0.1); c.lineCap = "butt";
      c.beginPath();
      linha(-60, 18, 60, 18);
      linha(-9.16, 18, -9.16, 12.5); linha(-9.16, 12.5, 9.16, 12.5); linha(9.16, 12.5, 9.16, 18);
      linha(-20.16, 18, -20.16, 1.5); linha(20.16, 18, 20.16, 1.5);
      c.stroke();
      const s = proj(0, 0, ZSPOT), s2 = proj(0, 0, ZSPOT + 0.25);
      c.fillStyle = "#fff"; c.beginPath(); c.ellipse(s.x, s.y, s.k * 0.2, Math.max(1.5, s.y - s2.y), 0, 0, Math.PI * 2); c.fill();
    }

    function pr(X, Y, Z) {
      const p = proj(X, Y, Z);
      if (rede.a > 0.01 && rede.t < 2) {
        const d2 = (X - rede.x) ** 2 + (Y - rede.y) ** 2;
        const g = rede.a * Math.exp(-d2 / 1.6) * Math.cos(rede.t * 18) * Math.exp(-rede.t * 2.6);
        p.x += (cx - p.x) * 0.16 * g;
        p.y += (yHor - p.y) * 0.16 * g;
      }
      return p;
    }
    function desenharRede() {
      const zb = Y => 20 - Y / PY;
      const k = proj(0, 0, 19).k;
      // fundo da rede
      c.fillStyle = "rgba(255,255,255,.08)";
      c.beginPath();
      [[-PX, 0, 20], [PX, 0, 20], [PX, PY, 19], [-PX, PY, 19]].forEach(([X, Y, Z], i) => { const p = proj(X, Y, Z); i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); });
      c.closePath(); c.fill();
      c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = Math.max(0.8, k * 0.022);
      const caminho = pts => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y))); c.stroke(); };
      for (let X = -PX; X <= PX + 0.01; X += PX / 9) {
        const pts = []; for (let Y = 0; Y <= PY + 0.01; Y += PY / 7) pts.push(pr(X, Y, zb(Y))); caminho(pts);
      }
      for (let Y = PY / 7; Y <= PY + 0.01; Y += PY / 7) {
        const pts = []; for (let X = -PX; X <= PX + 0.01; X += PX / 9) pts.push(pr(X, Y, zb(Y))); caminho(pts);
      }
      [-PX, PX].forEach(X => {
        for (let Y = 0; Y <= PY + 0.01; Y += PY / 7) caminho([pr(X, Y, 18), pr(X, Y, zb(Y))]);
        [0.25, 0.5, 0.75].forEach(u => caminho([pr(X, 0, 18 + 2 * u), pr(X, PY, 18 + u)]));
      });
      for (let X = -PX; X <= PX + 0.01; X += PX / 9) caminho([pr(X, PY, 18), pr(X, PY, 19)]);
      [0.33, 0.66].forEach(u => caminho([pr(-PX, PY, 18 + u), pr(PX, PY, 18 + u)]));
      // armação do fundo
      c.strokeStyle = "#ced4da"; c.lineWidth = Math.max(1.5, k * 0.06); c.lineCap = "round";
      caminho([proj(-PX, 0, 20), proj(-PX, PY, 19), proj(PX, PY, 19), proj(PX, 0, 20)]);
    }
    function desenharTraves() {
      const a = proj(-PX, 0, 18), b = proj(-PX, PY, 18), d = proj(PX, PY, 18), e = proj(PX, 0, 18);
      const lw = Math.max(3, a.k * 0.13);
      c.lineCap = "round"; c.lineJoin = "round";
      c.strokeStyle = "rgba(0,0,0,.18)"; c.lineWidth = lw;
      c.beginPath(); c.moveTo(a.x + lw * 0.6, a.y); c.lineTo(a.x + lw * 2, a.y + lw * 0.6); c.moveTo(e.x + lw * 0.6, e.y); c.lineTo(e.x + lw * 2, e.y + lw * 0.6); c.stroke();
      c.strokeStyle = "#c9d1d9"; c.lineWidth = lw + 2;
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.lineTo(d.x, d.y); c.lineTo(e.x, e.y); c.stroke();
      c.strokeStyle = "#fff"; c.lineWidth = lw;
      c.beginPath(); c.moveTo(a.x - lw * 0.15, a.y); c.lineTo(b.x - lw * 0.15, b.y - lw * 0.15); c.lineTo(d.x + lw * 0.15, d.y - lw * 0.15); c.lineTo(e.x + lw * 0.15, e.y); c.stroke();
    }

    function desenharGoleiro() {
      const cor = J.times[goleiroTime()];
      let X = 0, lift = 0, ang = 0, pose = "pronto";
      const mt = mergulho.t;
      if (mt > 0) {
        const p = clamp(mt / 0.4, 0, 1), e = 1 - (1 - p) * (1 - p);
        const cai = clamp(1 - (mt - 0.7) / 0.35, 0, 1);
        if (mergulho.d === 0) { lift = Math.sin(p * Math.PI) * 0.45; pose = "cima"; }
        else {
          X = mergulho.x * e; ang = mergulho.d * e * 1.3;
          lift = (mergulho.alto * e + Math.sin(p * Math.PI) * 0.15) * cai;
          pose = "estica";
        }
      } else if (fase !== "depois" && fase !== "fim") X = Math.sin(t * 1.7) * 0.22;
      const p = proj(X, 0, ZG);
      c.save();
      c.translate(p.x, p.y); c.scale(p.k, p.k);
      c.fillStyle = "rgba(0,0,0,.22)";
      c.beginPath(); c.ellipse(0, 0, 0.5 + Math.abs(ang) * 0.6, 0.12, 0, 0, Math.PI * 2); c.fill();
      c.translate(0, -lift);
      c.translate(0, -0.95); c.rotate(ang); c.translate(0, 0.95);
      const maos = pose === "cima" ? [[-0.32, -2.25], [0.32, -2.25]] : pose === "estica" ? [[-0.14, -2.32], [0.2, -2.34]]
        : [[-0.6, -1.2 + Math.sin(t * 5) * 0.03], [0.6, -1.2 + Math.sin(t * 5) * 0.03]];
      const agacha = pose === "pronto" ? 0.06 : 0;
      c.translate(0, agacha);
      boneco(c, { camisa: cor.c, escuro: cor.e, calcao: "#2b2f36", meiao: cor.c, pele: "#e0ac69", cabelo: "#2b1b10",
        numero: "1", textoCor: cor.texto || "#fff", frente: true, maos, luvas: true,
        peE: { x: -0.08, y: 0 }, peD: { x: 0.08, y: 0 } });
      c.restore();
    }

    function posBatedor() {
      let X = xIdle, Z = 5.2, peE = { x: 0, y: 0 }, peD = { x: 0, y: 0 }, bob = Math.sin(t * 3) * 0.01, festa = false;
      if (fase === "corrida") {
        const p = clamp(corrida, 0, 1);
        X = lerp(xIdle, -0.36, p); Z = lerp(5.2, 6.5, p);
        const s = Math.sin(p * Math.PI * 4);
        peE.y = Math.max(0, s) * 0.2; peD.y = Math.max(0, -s) * 0.2; bob = Math.abs(s) * 0.05;
      } else if (fase === "voo" || fase === "depois" || fase === "fim") {
        // depois do chute ele sai para o lado (para a criança ver a bola chegar no gol)
        const sai = clamp((tChute - 0.3) / 0.55, 0, 1), es = sai * sai * (3 - 2 * sai);
        X = lerp(-0.36, xIdle - 0.25, es); Z = lerp(6.5, 5.6, es);
        const k = clamp(tChute / 0.3, 0, 1);
        peD = { x: 0.1 * (1 - sai), y: 0.5 * Math.sin(k * Math.PI * 0.85) * (1 - sai) };
        if (sai > 0 && sai < 1) { const s = Math.sin(tChute * 18); peE.y = Math.max(0, s) * 0.15; peD.y = Math.max(peD.y, Math.max(0, -s) * 0.15); }
        festa = resultado === "gol" && tChute > 0.9;
        if (festa) bob = Math.abs(Math.sin(t * 9)) * 0.25;
      }
      return { X, Z, peE, peD, bob, festa };
    }
    function desenharBatedor(b) {
      const cor = J.times[batedor];
      const p = proj(b.X, 0, b.Z);
      c.save();
      c.translate(p.x, p.y); c.scale(p.k * 0.85, p.k * 0.85);
      c.fillStyle = "rgba(0,0,0,.25)";
      c.beginPath(); c.ellipse(0, 0, 0.42, 0.1, 0, 0, Math.PI * 2); c.fill();
      c.translate(0, -b.bob);
      const balanco = fase === "corrida" ? Math.sin(corrida * Math.PI * 4) * 0.12 : 0;
      const maos = b.festa ? [[-0.5, -2.2], [0.5, -2.2]] : [[-0.42 + balanco, -0.98], [0.42 - balanco, -0.98]];
      boneco(c, { camisa: cor.c, escuro: cor.e, calcao: "#ffffff", meiao: cor.c, pele: "#c68642", cabelo: "#2b1b10",
        numero: "10", textoCor: cor.texto || "#fff", frente: false, maos, peE: b.peE, peD: b.peD });
      c.restore();
    }

    function desenharBolaP() {
      if (!bola.visivel) return;
      const g = proj(bola.X, 0, bola.Z), p = proj(bola.X, bola.Y, bola.Z);
      const r = RB * p.k;
      if (bola.Z < 23) {
        c.fillStyle = `rgba(0,0,0,${0.3 / (1 + bola.Y)})`;
        c.beginPath(); c.ellipse(g.x, g.y, r * 1.05, r * 0.35, 0, 0, Math.PI * 2); c.fill();
      }
      desenharBola(c, p.x, p.y, Math.max(2, r), bola.giro);
    }

    function desenharMira() {
      if (!(fase === "mirar" && humano(batedor)) && !(fase === "corrida" && humano(batedor))) return;
      const p = proj(alvo.gx * PX, alvo.gy * PY, 18);
      const r = GW * 0.055 * (1 + 0.08 * Math.sin(t * 7));
      c.save();
      c.fillStyle = J.times[batedor].c + "66";
      c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#fff"; c.lineWidth = 3;
      c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(p.x, p.y, r * 0.35, 0, Math.PI * 2); c.stroke();
      c.beginPath();
      c.moveTo(p.x - r * 1.4, p.y); c.lineTo(p.x - r * 0.6, p.y); c.moveTo(p.x + r * 0.6, p.y); c.lineTo(p.x + r * 1.4, p.y);
      c.moveTo(p.x, p.y - r * 1.4); c.lineTo(p.x, p.y - r * 0.6); c.moveTo(p.x, p.y + r * 0.6); c.lineTo(p.x, p.y + r * 1.4);
      c.stroke();
      c.restore();
    }
    function desenharForca() {
      if (!humano(batedor) || !(fase === "mirar" || fase === "corrida" || fase === "goleiroPronto")) return;
      const s = proj(0, 0, ZSPOT);
      const bh = clamp((H - gy0) * 0.42, 70, 170), bw = 22;
      const x = Math.min(W - bw - 14, s.x + GW * 0.42), y = s.y - bh * 0.72;
      c.save();
      c.fillStyle = "rgba(15,25,45,.75)"; rr(c, x - 5, y - 5, bw + 10, bh + 10, 10); c.fill();
      const g = c.createLinearGradient(0, y + bh, 0, y);
      g.addColorStop(0, "#9be15d"); g.addColorStop(0.3, "#51cf66"); g.addColorStop(0.82, "#40c057");
      g.addColorStop(0.88, "#ffd43b"); g.addColorStop(1, "#fa5252");
      c.fillStyle = g; rr(c, x, y, bw, bh, 6); c.fill();
      // zona boa
      c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 2;
      [0.35, 0.86].forEach(v => { c.beginPath(); c.moveTo(x, y + bh * (1 - v)); c.lineTo(x + bw, y + bh * (1 - v)); c.stroke(); });
      const F = fase === "corrida" ? forcaFinal : forca;
      const yi = y + bh * (1 - F);
      c.fillStyle = "#fff"; c.strokeStyle = "#1d3557"; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x - 12, yi - 8); c.lineTo(x + 2, yi); c.lineTo(x - 12, yi + 8); c.closePath(); c.fill(); c.stroke();
      c.fillRect(x - 2, yi - 2, bw + 4, 4);
      c.font = `bold 14px ${FONTE}`; c.textAlign = "center"; c.textBaseline = "bottom"; c.fillStyle = "#fff";
      c.fillText("💪", x + bw / 2, y - 7);
      c.restore();
    }
    function desenharEscolhaGoleiro() {
      const gk = goleiroTime();
      if (!humano(gk) || travado && J.humanos === 1) return;
      if (fase === "goleiro" || (podeEscolher() && J.humanos === 1)) {
        // setas sobre o gol mostrando os lados
        [-1, 0, 1].forEach(d => {
          const p = proj(d * PX * 0.62, PY * 0.55, 18);
          const ativo = J.humanos === 1 && escolha === d;
          c.save();
          c.globalAlpha = ativo ? 0.95 : 0.55 + 0.15 * Math.sin(t * 5);
          c.fillStyle = ativo ? "#ffd43b" : "rgba(255,255,255,.85)";
          c.beginPath(); c.arc(p.x, p.y, GW * 0.065, 0, Math.PI * 2); c.fill();
          c.font = `${GW * 0.075}px ${FONTE}`; c.textAlign = "center"; c.textBaseline = "middle";
          c.fillText(ativo ? "🧤" : d < 0 ? "⬅️" : d > 0 ? "➡️" : "⬆️", p.x, p.y + 1);
          c.restore();
        });
      }
      if (J.humanos === 2 && (fase === "goleiroPronto" || (fase === "mirar" && travado))) {
        pilula(c, "🧤 Goleiro pronto!", cx, proj(0, PY, 18).y - 20, 15);
      }
    }

    function desenharTelao() {
      const nomes = [J.times[0].nome, J.times[1].nome];
      const n = Math.max(5, gols[0].length, gols[1].length);
      const ini = Math.max(0, n - 7), cols = n - ini;
      const linhaH = 24, slot = 20;
      c.font = `bold 15px ${FONTE}`;
      const nomeW = Math.max(c.measureText(nomes[0]).width, c.measureText(nomes[1]).width) + 30;
      const w = nomeW + cols * slot + 44, h = linhaH * 2 + 14;
      const topoGol = proj(0, PY, 18).y;
      let x = (W - w) / 2, y = 8;
      if (topoGol - 10 < h + y) {
        const dir = W - (cx + GW / 2) - 8;
        if (dir >= w + 8) x = W - w - 10; else y = 8;
      }
      c.save();
      c.fillStyle = "rgba(12,18,32,.88)"; rr(c, x, y, w, h, 12); c.fill();
      c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 2; c.stroke();
      [0, 1].forEach(tm => {
        const yy = y + 7 + linhaH * tm + linhaH / 2;
        if (fase !== "fim" && tm === batedor) { c.fillStyle = "rgba(255,255,255,.12)"; rr(c, x + 4, yy - linhaH / 2 + 1, w - 8, linhaH - 2, 8); c.fill(); }
        c.fillStyle = J.times[tm].c; c.beginPath(); c.arc(x + 16, yy, 7, 0, Math.PI * 2); c.fill();
        c.strokeStyle = "#fff"; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = "#fff"; c.textAlign = "left"; c.textBaseline = "middle";
        c.fillText(nomes[tm], x + 28, yy + 1);
        for (let i = 0; i < cols; i++) {
          const v = gols[tm][ini + i], sx = x + nomeW + 4 + i * slot + slot / 2;
          c.beginPath(); c.arc(sx, yy, 7, 0, Math.PI * 2);
          if (v === true) { c.fillStyle = "#40c057"; c.fill(); }
          else if (v === false) { c.fillStyle = "#fa5252"; c.fill(); c.strokeStyle = "#fff"; c.lineWidth = 2; c.beginPath(); c.moveTo(sx - 3, yy - 3); c.lineTo(sx + 3, yy + 3); c.moveTo(sx + 3, yy - 3); c.lineTo(sx - 3, yy + 3); c.stroke(); }
          else { c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 1.5; c.stroke(); }
        }
        c.fillStyle = "#ffd43b"; c.textAlign = "center"; c.font = `bold 18px ${FONTE}`;
        c.fillText(String(golsDe(tm)), x + w - 18, yy + 1);
        c.font = `bold 15px ${FONTE}`;
      });
      c.restore();
    }

    function dica() {
      if (J.toque || fase === "voo" || fase === "depois" || fase === "fim") return "";
      const teclasDe = h => (h === 0 ? { mira: "Setas", ok: "Enter" } : { mira: "W A S D", ok: "F" });
      if (fase === "goleiro") { const k = teclasDe(goleiroTime()); return `🧤 ${k.mira === "Setas" ? "⬅️ ⬆️ ➡️" : "A  W  D"}: escolha o lado em segredo`; }
      if ((fase === "mirar" || fase === "corrida") && humano(batedor)) { const k = teclasDe(batedor); return `🎯 ${k.mira}: mirar · ${k.ok} ou Ⓐ: chutar`; }
      if (podeEscolher()) { const k = teclasDe(goleiroTime()); return `🧤 ${k.mira === "Setas" ? "⬅️ ⬆️ ➡️" : "A  W  D"}: escolha o lado para pular`; }
      return "";
    }

    function desenhar() {
      c.clearRect(0, 0, W, H);
      desenharTorcida();
      desenharGramado();
      desenharRede();
      const bat = posBatedor();
      const itens = [
        { z: 18, d: desenharTraves },
        { z: ZG, d: desenharGoleiro },
        { z: bat.Z, d: () => desenharBatedor(bat) },
        { z: bola.Z, d: desenharBolaP },
      ];
      if (bola.dentro && bola.Z > 18) itens[3].z = 18.5;
      itens.sort((a, b) => b.z - a.z).forEach(i => i.d());
      desenharMira();
      desenharEscolhaGoleiro();
      desenharForca();
      desenharTelao();
      if (msg) {
        const e = msg.t < 0.25 ? 0.4 + msg.t / 0.25 * 0.8 : 1.2 - Math.min(0.2, (msg.t - 0.25) * 0.8);
        textoGrande(c, msg.txt, cx, proj(0, PY * 0.5, 18).y, Math.min(W * 0.13, 72), msg.cor, e);
      }
      desenharConfete(c, confete);
      const d = dica();
      if (d) pilula(c, d, W / 2, H - 22, W < 420 ? 13 : 15);
      atualizarBotoes();
    }

    return {
      medir, comecar, passo, desenhar, acao, direcaoApertada, montarToque,
      passoFim: dt => { t += dt; confete = moverConfete(confete, dt); rede.t += dt; if (bola && bola.fisica) fisicaBola(dt); },
      estado: () => ({ modo: "penaltis", fase, batedor, gols: gols.map(g => [...g]), alvo: { ...alvo }, forca, escolha, resultado, travado }),
      teste: { setForca: v => { tForca = v * PERIODO; } },
    };
  }

  // =====================================================================================
  // PARTIDA (campo visto de cima)
  // =====================================================================================
  function criarPartida(J) {
    const c = J.ctx;
    const N = J.nivel;
    const L = 80, LG = 50, B1 = 18, B2 = 32, RJ = 1.9, RB = 0.85, VEL = 15;
    const DUR = { "5-6": 120, "6-8": 150 }[J.fx] || 180;
    const pequeno = J.fx === "5-6";
    const humanoT = tm => tm === 0 || J.humanos === 2;
    let W = 1, H = 1, s = 1, rot = false, ox = 0, oy = 0, fundo = null;
    // Câmera: onde o campo inteiro fica pequeno demais (celular deitado), ela dá zoom e acompanha a bola
    let zoom = false, camX = 40, camY = 25, camPronta = false;
    let jogs = [], bola = null, placar = [0, 0], tempo = DUR, fase = "saida", tFase = 0, saidaTime = 0, msg = null, confete = [], t = 0;
    const ativo = [null, null], trocaManual = [0, 0];
    let avisouFim = false;

    const BASE = { gk: { x: 2.6, y: 25 }, def: { x: 17, y: 17 }, atk: { x: 30, y: 33 } };
    [0, 1].forEach(tm => ["gk", "def", "atk"].forEach((papel, i) => {
      jogs.push({ t: tm, papel, num: papel === "gk" ? 1 : i === 1 ? 4 : 9, x: 0, y: 0, vx: 0, vy: 0, dx: 0, dy: 0, fx: 1, fy: 0,
        anim: 0, atord: 0, comBola: 0, segura: 0, pele: Motor.sortear(PELES), cabelo: Motor.sortear(CABELOS), pulo: 0 });
    }));
    const camisaDe = p => (p.papel === "gk" ? GOLEIRO_COR[p.t] : J.times[p.t].c);
    const ehHumano = p => humanoT(p.t) && ativo[p.t] === p;
    const companheiro = p => jogs.find(q => q.t === p.t && q !== p && q.papel !== "gk");
    const fatorVel = p => (p.papel === "gk" ? (humanoT(p.t) ? 0.85 : N.gkVel) : humanoT(p.t) ? 0.88 : N.vel * (pequeno ? 0.9 : 1));

    // ---------- Tamanho e fundo ----------
    function reserva() {
      const r = { l: 0, r: 0, b: 0 };
      if (!J.toque) return r;
      if (!rot && H < 420) return r; // celular deitado: câmera com zoom, os botões ficam por cima do campo
      if (rot) r.b = 150;
      else if (J.humanos === 2) { r.l = 150; r.r = 150; }
      else { r.l = 150; r.r = 112; }
      return r;
    }
    function medir() {
      W = J.W; H = J.H;
      rot = H > W * 1.05;
      const r = reserva();
      const x0 = r.l, x1 = W - r.r, y0 = 0, y1 = H - r.b;
      const ex = rot ? 58 : 90, ey = rot ? 90 : 58;
      s = Math.min((x1 - x0) / ex, (y1 - y0) / ey);
      ox = (x0 + x1) / 2; oy = (y0 + y1) / 2;
      zoom = !rot && s * RJ < 12; // deitado com jogador menor que 12 px de raio: usa a câmera (em pé o campo inteiro cabe bem)
      if (zoom) {
        s = Math.max(s, Math.min(9, Math.min(W, H) / 30)); // ~17 px de raio no celular deitado
        ox = W / 2; oy = H / 2;
        camPronta = false;
      } else { camX = 40; camY = 25; }
      desenharFundo();
      montarToque();
    }
    function mundo(cc) {
      const d = J.dpr;
      if (rot) cc.setTransform(0, -s * d, s * d, 0, d * (ox - camY * s), d * (oy + camX * s));
      else cc.setTransform(s * d, 0, 0, s * d, d * (ox - camX * s), d * (oy - camY * s));
    }
    const naTela = (x, y) => (rot ? { x: ox + (y - camY) * s, y: oy - (x - camX) * s } : { x: ox + (x - camX) * s, y: oy + (y - camY) * s });
    // Mundo visível (em unidades) e câmera seguindo a bola com suavização e antecipação
    function moverCamera(dt, imediato) {
      if (!zoom || !bola) return;
      const vx = (rot ? H : W) / s, vy = (rot ? W : H) / s; // tamanho visível em x e y do mundo
      const lim = (alvo, meio, min, max) => (meio * 2 >= max - min ? (min + max) / 2 : clamp(alvo, min + meio, max - meio));
      const tx = lim(bola.x + bola.vx * 0.35, vx / 2, -5, 85), ty = lim(bola.y + bola.vy * 0.35, vy / 2, -4, 54);
      const k = imediato || !camPronta ? 1 : Math.min(1, dt * 3.5);
      camX += (tx - camX) * k; camY += (ty - camY) * k;
      camPronta = true;
    }
    const dirMundo = d => (rot ? { x: -d.y, y: d.x } : { x: d.x, y: d.y });

    function desenharFundo() {
      fundo = fundo || document.createElement("canvas");
      const esc = s * J.dpr;
      fundo.width = Math.ceil(90 * esc); fundo.height = Math.ceil(58 * esc);
      const g = fundo.getContext("2d");
      g.setTransform(esc, 0, 0, esc, 5 * esc, 4 * esc); // mundo (-5,-4) no canto do desenho
      // arquibancada em volta (pontinhos coloridos)
      g.fillStyle = "#2c3e5e"; rr(g, -5, -4, 90, 58, 3); g.fill();
      const cores = [J.times[0].c, J.times[1].c, "#ffffff", "#ffd43b", "#ff8787", "#74c0fc", "#b197fc", "#63e6be"];
      const ponto = (x, y) => { g.fillStyle = Motor.sortear(cores); g.beginPath(); g.arc(x + rnd(-0.15, 0.15), y + rnd(-0.15, 0.15), 0.42, 0, Math.PI * 2); g.fill(); };
      for (let x = -4.4; x <= 84.4; x += 1.05) { [-3.3, -2.3].forEach(y => ponto(x, y)); [LG + 2.3, LG + 3.3].forEach(y => ponto(x, y)); }
      for (let y = -1.2; y <= LG + 1.2; y += 1.05) {
        if (y > B1 - 1.5 && y < B2 + 1.5) continue;
        [-4.2, -3.2].forEach(x => ponto(x, y)); [L + 3.2, L + 4.2].forEach(x => ponto(x, y));
      }
      // pista em volta do gramado
      g.fillStyle = "#2f7a3c"; rr(g, -1.6, -1.6, L + 3.2, LG + 3.2, 1.6); g.fill();
      // gramado listrado
      for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#4cae54" : "#43a04b"; g.fillRect(i * 10, 0, 10, LG); }
      for (let j = 0; j < 5; j++) { g.fillStyle = "rgba(255,255,255,.035)"; if (j % 2) g.fillRect(0, j * 10, L, 10); }
      // paredes (placas coloridas)
      const placas = [J.times[0].c, "#ffffff", J.times[1].c, "#ffd43b"];
      g.lineWidth = 0.9; g.lineCap = "butt";
      let k = 0;
      for (let x = 0; x < L; x += 8) { g.strokeStyle = placas[k++ % 4]; g.beginPath(); g.moveTo(x, -0.95); g.lineTo(Math.min(L, x + 8), -0.95); g.stroke(); g.beginPath(); g.moveTo(x, LG + 0.95); g.lineTo(Math.min(L, x + 8), LG + 0.95); g.stroke(); }
      [[0, B1], [B2, LG]].forEach(([a, b]) => {
        g.strokeStyle = placas[k++ % 4]; g.beginPath(); g.moveTo(-0.95, a - (a === 0 ? 0.95 : 0)); g.lineTo(-0.95, b + (b === LG ? 0.95 : 0)); g.stroke();
        g.strokeStyle = placas[k++ % 4]; g.beginPath(); g.moveTo(L + 0.95, a - (a === 0 ? 0.95 : 0)); g.lineTo(L + 0.95, b + (b === LG ? 0.95 : 0)); g.stroke();
      });
      // linhas
      g.strokeStyle = "rgba(255,255,255,.92)"; g.lineWidth = 0.32;
      g.strokeRect(0, 0, L, LG);
      g.beginPath(); g.moveTo(L / 2, 0); g.lineTo(L / 2, LG); g.stroke();
      g.beginPath(); g.arc(L / 2, LG / 2, 7, 0, Math.PI * 2); g.stroke();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(L / 2, LG / 2, 0.45, 0, Math.PI * 2); g.fill();
      [0, 1].forEach(lado => {
        const X = v => (lado ? L - v : v), sg = lado ? -1 : 1;
        g.beginPath(); g.moveTo(X(0), 10); g.lineTo(X(12), 10); g.lineTo(X(12), 40); g.lineTo(X(0), 40); g.stroke();
        g.beginPath(); g.moveTo(X(0), 15); g.lineTo(X(4.5), 15); g.lineTo(X(4.5), 35); g.lineTo(X(0), 35); g.stroke();
        g.beginPath(); g.arc(X(8), 25, 0.4, 0, Math.PI * 2); g.fill();
        const a = Math.acos(4 / 7);
        g.beginPath();
        if (sg > 0) g.arc(8, 25, 7, -a, a); else g.arc(L - 8, 25, 7, Math.PI - a, Math.PI + a);
        g.stroke();
      });
      [[0, 0, 0], [L, 0, Math.PI / 2], [L, LG, Math.PI], [0, LG, Math.PI * 1.5]].forEach(([x, y, a]) => { g.beginPath(); g.arc(x, y, 1.2, a, a + Math.PI / 2); g.stroke(); });
      // gols com rede
      [0, 1].forEach(lado => {
        const x0 = lado ? L : -3, w = 3;
        g.fillStyle = "rgba(255,255,255,.2)"; g.fillRect(x0, B1, w, B2 - B1);
        g.strokeStyle = "rgba(255,255,255,.5)"; g.lineWidth = 0.08;
        for (let y = B1; y <= B2; y += 0.7) { g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); }
        for (let x = x0; x <= x0 + w + 0.01; x += 0.7) { g.beginPath(); g.moveTo(x, B1); g.lineTo(x, B2); g.stroke(); }
        g.strokeStyle = "#f1f3f5"; g.lineWidth = 0.4;
        const fx = lado ? L + w : -w, bx = lado ? L : 0;
        g.beginPath(); g.moveTo(bx, B1); g.lineTo(fx, B1); g.lineTo(fx, B2); g.lineTo(bx, B2); g.stroke();
        g.fillStyle = "#fff"; g.strokeStyle = "#868e96"; g.lineWidth = 0.12;
        [B1, B2].forEach(y => { g.beginPath(); g.arc(bx, y, 0.5, 0, Math.PI * 2); g.fill(); g.stroke(); });
      });
    }

    // ---------- Posições ----------
    function posicionar(quemSai) {
      jogs.forEach(p => {
        const b = BASE[p.papel];
        p.x = p.t === 0 ? b.x : L - b.x; p.y = p.t === 0 ? b.y : LG - b.y;
        p.vx = p.vy = p.dx = p.dy = 0; p.fx = p.t === 0 ? 1 : -1; p.fy = 0; p.atord = 0; p.comBola = 0; p.segura = 0; p.pulo = 0;
      });
      const atk = jogs.find(p => p.t === quemSai && p.papel === "atk");
      atk.x = quemSai === 0 ? L / 2 - RJ - RB - 0.1 : L / 2 + RJ + RB + 0.1; atk.y = LG / 2;
      bola = { x: L / 2, y: LG / 2, vx: 0, vy: 0, dono: null, prot: 0, semToque: null, tSem: 0, ignora: null, giro: 0, naRede: false };
      ativo[0] = jogs.find(p => p.t === 0 && p.papel === (quemSai === 0 ? "atk" : "def"));
      ativo[1] = jogs.find(p => p.t === 1 && p.papel === (quemSai === 1 ? "atk" : "def"));
      fase = "saida"; tFase = 0;
      camPronta = false; moverCamera(0, true);
    }
    function comecar() {
      placar = [0, 0]; tempo = DUR;
      posicionar(0);
      atualizarInfo();
      Motor.falar(J.humanos === 2 ? "Bola rolando! Cada um leva a bola até o gol do outro time!" : "Bola rolando! Leve a bola até o gol do outro time!");
    }
    let infoTempo = -1;
    function atualizarInfo() {
      const seg = Math.ceil(tempo);
      infoTempo = seg;
      const mm = Math.floor(seg / 60), ss = String(seg % 60).padStart(2, "0");
      J.setInfo(`<span class="fut-placar"><i style="background:${J.times[0].c}"></i><b>${placar[0]}</b>x<b>${placar[1]}</b><i style="background:${J.times[1].c}"></i></span><span class="fut-relogio${seg <= 10 ? " acabando" : ""}">⏱️ ${mm}:${ss}</span>`);
    }
    function apito(n = 1) {
      for (let i = 0; i < n; i++) Motor.nota(2700, { dur: i === n - 1 ? 0.45 : 0.16, tipo: "square", vol: 0.045, inicio: i * 0.22 });
    }

    // ---------- Chutes ----------
    function chutarBola(p, dx, dy, v) {
      const m = Math.hypot(dx, dy) || 1;
      bola.dono = null;
      bola.vx = dx / m * v; bola.vy = dy / m * v;
      bola.semToque = p; bola.tSem = 0.3; bola.ignora = null;
      p.comBola = 0;
      Motor.nota(150, { dur: 0.1, tipo: "triangle", vol: 0.35, ate: 70 });
      Motor.ruido({ dur: 0.05, vol: 0.12, freq: 2500 });
    }
    function chuteMirado(p) {
      const gx = p.t === 0 ? L + 1 : -1;
      const tx = gx - bola.x, ty = 25 - bola.y, td = Math.hypot(tx, ty);
      const dot = (p.fx * tx + p.fy * ty) / td;
      if (dot > 0.2 && td < 60) {
        const alvoY = 25 + clamp(p.fy * 14 + (bola.y - 25) * 0.15, -5.2, 5.2) + rnd(-1.1, 1.1);
        chutarBola(p, gx - bola.x, alvoY - bola.y, 50);
      } else chutarBola(p, p.fx, p.fy, 42);
    }
    function passar(p, q) {
      if (!q) return;
      const tx = q.x + q.vx * 0.35, ty = q.y + q.vy * 0.35;
      const d = Math.hypot(tx - bola.x, ty - bola.y);
      chutarBola(p, tx - bola.x, ty - bola.y, clamp(d * 1.05 + 12, 20, 46));
      if (humanoT(q.t)) { ativo[q.t] = q; trocaManual[q.t] = 0.8; }
    }
    function acao(h, tipo) {
      if (fase !== "jogo") return;
      const p = ativo[h];
      if (!p) return;
      if (tipo === "chute") {
        if (bola.dono === p) return chuteMirado(p);
        if (!bola.dono && dist(p, bola) < RJ + RB + 1.6) return chuteMirado(p);
        if (bola.dono && bola.dono.t !== p.t && bola.dono.papel !== "gk" && dist(p, bola) < RJ + RB + 1.6 && Math.random() < 0.6) roubar(p);
      } else {
        if (bola.dono === p) return passar(p, companheiro(p));
        const outro = companheiro(p);
        if (outro) { ativo[h] = outro; trocaManual[h] = 1.2; Motor.nota(520, { dur: 0.06, tipo: "sine", vol: 0.1 }); }
      }
    }
    function roubar(q) {
      const d = bola.dono;
      bola.dono = q; bola.prot = 0.7; q.comBola = 0;
      if (d) d.atord = 0.5;
      Motor.nota(220, { dur: 0.08, tipo: "square", vol: 0.06 });
    }

    // ---------- Inteligência ----------
    function ir(p, tx, ty, fator, freia = true) {
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      if (d < 0.25) { p.dx = p.dy = 0; return; }
      const v = VEL * fator * (freia ? Math.min(1, d / 3) : 1);
      p.dx = dx / d * v; p.dy = dy / d * v;
    }
    function decidir(p, dt) {
      if (ehHumano(p)) {
        const d = dirMundo(J.direcao(p.t));
        const v = VEL * (bola.dono === p ? 0.9 : 1);
        p.dx = d.x * v; p.dy = d.y * v;
        return;
      }
      if (p.papel === "gk") return goleiroIA(p, dt);
      campoIA(p, dt);
    }
    function cacador(tm) {
      let melhor = null, md = Infinity;
      jogs.forEach(q => { if (q.t === tm && q.papel !== "gk") { const d = dist(q, bola); if (d < md) { md = d; melhor = q; } } });
      return melhor;
    }
    function campoIA(p, dt) {
      const sentido = p.t === 0 ? 1 : -1, meuGol = p.t === 0 ? 0 : L;
      const f = fatorVel(p);
      if (bola.dono === p) return comBolaIA(p, f, dt);
      const temos = bola.dono && bola.dono.t === p.t;
      if (temos) {
        if (p.papel === "def" && bola.dono.papel !== "def") ir(p, clamp(bola.x - sentido * 12, 6, L - 6), 25 + (bola.y - 25) * 0.3, f * 0.85);
        else ir(p, clamp(bola.x + sentido * 13, 8, L - 8), bola.y > 25 ? 13 : 37, f * 0.9);
        return;
      }
      if (!humanoT(p.t) && cacador(p.t) === p) {
        return ir(p, bola.x + bola.vx * 0.25, bola.y + bola.vy * 0.25, f, false);
      }
      const k = p.papel === "atk" ? 0.72 : 0.42;
      const ty = 25 + (bola.y - 25) * 0.55 + (p.papel === "atk" ? (bola.y > 25 ? -5 : 5) : 0);
      ir(p, meuGol + (bola.x - meuGol) * k, ty, f * 0.85);
    }
    function comBolaIA(p, f, dt) {
      const golX = p.t === 0 ? L : 0;
      const dGol = Math.hypot(golX - p.x, 25 - p.y);
      const adv = jogs.filter(q => q.t !== p.t);
      let pertoD = Infinity;
      adv.forEach(q => { if (q.papel !== "gk") pertoD = Math.min(pertoD, dist(p, q)); });
      if (dGol < N.tiro * (pequeno ? 0.85 : 1) && p.comBola > 0.3 && Math.abs(golX - p.x) > 3) {
        const ty = clamp(25 + rnd(-5, 5) + rnd(-1, 1) * N.erro, B1 - 3, B2 + 3);
        return chutarBola(p, golX + (p.t === 0 ? 1 : -1) - bola.x, ty - bola.y, N.forcaTiro * (pequeno ? 0.9 : 1));
      }
      const comp = companheiro(p);
      if (comp && pertoD < 5 && p.comBola > 0.4 && Math.random() < N.passe * dt * 2) return passar(p, comp);
      let dx = golX - p.x, dy = 25 - p.y;
      const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
      adv.forEach(q => {
        const ex = p.x - q.x, ey = p.y - q.y, d = Math.hypot(ex, ey);
        const frente = (q.x - p.x) * (p.t === 0 ? 1 : -1) > -1;
        if (d < 8 && d > 0.01 && frente) { const w = (8 - d) / 8 * 1.3; dx += ex / d * w * 0.4; dy += ey / d * w; }
      });
      if (p.y < 6) dy += (6 - p.y) / 6;
      if (p.y > LG - 6) dy -= (p.y - (LG - 6)) / 6;
      const m2 = Math.hypot(dx, dy) || 1;
      p.dx = dx / m2 * VEL * f * 0.9; p.dy = dy / m2 * VEL * f * 0.9;
    }
    function goleiroIA(p, dt) {
      const linha = p.t === 0 ? 2.4 : L - 2.4, sentido = p.t === 0 ? 1 : -1, golX = p.t === 0 ? 0 : L;
      const f = fatorVel(p);
      if (bola.dono === p) {
        p.dx = p.dy = 0;
        p.segura += dt;
        if (p.segura > 0.9) {
          // repõe a bola para o companheiro mais livre
          const comps = jogs.filter(q => q.t === p.t && q.papel !== "gk");
          const livre = q => Math.min(...jogs.filter(o => o.t !== p.t).map(o => dist(o, q)));
          const alvo = comps.sort((a, b) => livre(b) - livre(a))[0];
          p.segura = 0;
          passar(p, alvo);
        }
        return;
      }
      p.segura = 0;
      const naArea = Math.abs(bola.x - golX) < 12 && bola.y > 10 && bola.y < 40;
      const vb = Math.hypot(bola.vx, bola.vy);
      if (!bola.dono && naArea && vb < 18) {
        let outro = Infinity;
        jogs.forEach(q => { if (q !== p) outro = Math.min(outro, dist(q, bola)); });
        if (dist(p, bola) < outro + 2) return ir(p, bola.x, bola.y, f * 1.1, false);
      }
      let ty = 25 + (bola.y - 25) * 0.5;
      if (!bola.dono && bola.vx * sentido < -8) {
        const tt = (bola.x - linha) / -bola.vx;
        if (tt > 0 && tt < 2) ty = bola.y + bola.vy * tt;
      }
      ty = clamp(ty, B1 + 0.5, B2 - 0.5);
      ir(p, linha + sentido * (naArea ? 1.2 : 0), ty, f * 1.2);
    }

    // ---------- Física ----------
    function moverJogador(p, dt) {
      const ac = Math.min(1, dt * 9);
      p.vx += (p.dx - p.vx) * ac; p.vy += (p.dy - p.vy) * ac;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.x = clamp(p.x, 0.8, L - 0.8); p.y = clamp(p.y, 0.8, LG - 0.8);
      if (p.papel === "gk") p.x = p.t === 0 ? Math.min(p.x, 14) : Math.max(p.x, L - 14);
      const qx = ehHumano(p) ? p.dx : p.vx, qy = ehHumano(p) ? p.dy : p.vy;
      const sp = Math.hypot(qx, qy);
      if (sp > 0.8) {
        const alvo = Math.atan2(qy, qx), atual = Math.atan2(p.fy, p.fx);
        let dif = alvo - atual;
        while (dif > Math.PI) dif -= Math.PI * 2;
        while (dif < -Math.PI) dif += Math.PI * 2;
        const na = atual + clamp(dif, -dt * 12, dt * 12);
        p.fx = Math.cos(na); p.fy = Math.sin(na);
      }
      p.anim += Math.hypot(p.vx, p.vy) * dt * 0.9;
    }
    function separar() {
      for (let i = 0; i < jogs.length; i++) {
        for (let j = i + 1; j < jogs.length; j++) {
          const a = jogs[i], b = jogs[j];
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = RJ * 1.7;
          if (d < min && d > 0.001) {
            const e = (min - d) / 2;
            a.x -= dx / d * e; a.y -= dy / d * e; b.x += dx / d * e; b.y += dy / d * e;
          }
        }
      }
    }
    const POSTES = [[0, B1], [0, B2], [L, B1], [L, B2]];
    function moverBola(dt) {
      if (bola.dono) {
        const p = bola.dono, off = RJ + RB * 0.85;
        bola.x = clamp(p.x + p.fx * off, -2, L + 2); bola.y = clamp(p.y + p.fy * off, RB, LG - RB);
        if ((bola.x < 0 || bola.x > L) && (bola.y < B1 + RB || bola.y > B2 - RB)) bola.x = clamp(bola.x, RB, L - RB);
        bola.vx = p.vx; bola.vy = p.vy;
        bola.giro += Math.hypot(p.vx, p.vy) * dt * 0.8;
        return;
      }
      const k = Math.exp(-1.0 * dt);
      bola.vx *= k; bola.vy *= k;
      let sp = Math.hypot(bola.vx, bola.vy);
      if (sp < 0.5) { bola.vx = bola.vy = 0; sp = 0; }
      bola.x += bola.vx * dt; bola.y += bola.vy * dt;
      bola.giro += sp * dt * 0.8;
      const naBoca = bola.y > B1 && bola.y < B2;
      if (bola.y < RB) { bola.y = RB; bola.vy = Math.abs(bola.vy) * 0.75; quique(sp); }
      if (bola.y > LG - RB) { bola.y = LG - RB; bola.vy = -Math.abs(bola.vy) * 0.75; quique(sp); }
      if (!naBoca || (bola.x >= RB && bola.x <= L - RB)) {
        if (bola.x < RB && !naBoca) { bola.x = RB; bola.vx = Math.abs(bola.vx) * 0.75; quique(sp); }
        if (bola.x > L - RB && !naBoca) { bola.x = L - RB; bola.vx = -Math.abs(bola.vx) * 0.75; quique(sp); }
      }
      if (bola.x < 0 || bola.x > L) {
        // dentro do gol: rede segura a bola
        if (bola.y < B1 + RB) { bola.y = B1 + RB; bola.vy = Math.abs(bola.vy) * 0.3; }
        if (bola.y > B2 - RB) { bola.y = B2 - RB; bola.vy = -Math.abs(bola.vy) * 0.3; }
        if (bola.x < -3 + RB) { bola.x = -3 + RB; bola.vx = Math.abs(bola.vx) * 0.15; }
        if (bola.x > L + 3 - RB) { bola.x = L + 3 - RB; bola.vx = -Math.abs(bola.vx) * 0.15; }
      }
      POSTES.forEach(([px, py]) => {
        const dx = bola.x - px, dy = bola.y - py, d = Math.hypot(dx, dy), min = RB + 0.5;
        if (d < min && d > 0.001) {
          const nx = dx / d, ny = dy / d;
          bola.x = px + nx * min; bola.y = py + ny * min;
          const vn = bola.vx * nx + bola.vy * ny;
          if (vn < 0) { bola.vx -= 1.7 * vn * nx; bola.vy -= 1.7 * vn * ny; if (-vn > 10) Motor.nota(900, { dur: 0.4, tipo: "triangle", vol: 0.18 }); }
        }
      });
    }
    function quique(sp) { if (sp > 14) Motor.nota(110, { dur: 0.08, tipo: "sine", vol: Math.min(0.25, sp / 160) }); }
    function posse(dt) {
      if (bola.tSem > 0) bola.tSem -= dt;
      if (bola.ignora && dist(bola.ignora, bola) > 5) bola.ignora = null;
      if (bola.dono) {
        const d = bola.dono;
        bola.prot -= dt;
        if (d.papel === "gk" || bola.prot > 0) return;
        for (const q of jogs) {
          if (q.t === d.t || q.atord > 0) continue;
          if (dist(q, bola) < RJ + RB + 0.5) {
            const taxa = ehHumano(q) ? 4 : humanoT(q.t) ? 1.5 : N.roubo * (pequeno ? 0.75 : 1);
            if (Math.random() < taxa * dt) { roubar(q); break; }
          }
        }
        return;
      }
      let melhor = null, md = Infinity;
      jogs.forEach(q => {
        if (q.atord > 0 || (bola.semToque === q && bola.tSem > 0) || bola.ignora === q) return;
        const d = dist(q, bola), alc = RJ + RB + (q.papel === "gk" ? 0.9 : 0.25);
        if (d < alc && d < md) { md = d; melhor = q; }
      });
      if (!melhor) return;
      const vb = Math.hypot(bola.vx, bola.vy);
      if (melhor.papel === "gk" && vb > 22) {
        const chance = humanoT(melhor.t) || J.humanos === 2 ? 0.55 : N.gkDefesa * (pequeno ? 0.8 : 1);
        if (Math.random() > chance) { bola.ignora = melhor; return; }
        Motor.ruido({ dur: 0.18, vol: 0.18, freq: 700 });
        msg = { txt: "DEFENDEU!", cor: "#74c0fc", t: 0, dur: 1.1 };
      }
      bola.dono = melhor; bola.prot = melhor.papel === "gk" ? 0 : 0.35; bola.tSem = 0; bola.ignora = null; melhor.comBola = 0;
    }
    function checarGol() {
      if (bola.y <= B1 || bola.y >= B2) return;
      if (bola.x < -RB) gol(1);
      else if (bola.x > L + RB) gol(0);
    }
    function gol(tm) {
      placar[tm]++;
      fase = "gol"; tFase = 0; saidaTime = 1 - tm;
      if (bola.dono) { bola.vx = bola.dono.vx; bola.vy = bola.dono.vy; }
      bola.dono = null; bola.naRede = true;
      msg = { txt: "GOOOL!", cor: "#ffd43b", t: 0, dur: 2.6 };
      jogs.forEach(p => { p.dx = p.dy = 0; p.pulo = p.t === tm ? 1 : 0; });
      const sc = naTela(tm === 0 ? L : 0, 25);
      soltarConfete(confete, sc.x, sc.y, [J.times[tm].c, "#ffd43b", "#fff", "#69db7c", "#74c0fc"], 90);
      Motor.ruido({ dur: 2.2, vol: 0.22, filtro: "bandpass", freq: 800 });
      Motor.tim();
      Motor.falar(J.humanos === 1 ? (tm === 0 ? "Goool! Que golaço!" : "Gol do computador!") : `Goool do ${J.nomeTime(tm)}!`);
      atualizarInfo();
    }
    function terminar() {
      fase = "fim"; tFase = 0;
      msg = { txt: "FIM DE JOGO!", cor: "#fff", t: 0, dur: 9 };
      apito(3);
      jogs.forEach(p => { p.dx = p.dy = 0; });
      Motor.depois(() => { if (!J.acabou) J.fim(placar, `Partida de ${Math.round(DUR / 60 * 10) / 10} minutos`.replace(".", ",")); }, 1700);
    }

    function escolherAtivos(dt) {
      for (let h = 0; h < J.humanos; h++) {
        trocaManual[h] = Math.max(0, trocaManual[h] - dt);
        const cands = jogs.filter(p => p.t === h && p.papel !== "gk");
        if (bola.dono && bola.dono.t === h && bola.dono.papel !== "gk") { ativo[h] = bola.dono; continue; }
        if (!ativo[h]) ativo[h] = cands[0];
        if (trocaManual[h] > 0) continue;
        const bx = bola.x + bola.vx * 0.3, by = bola.y + bola.vy * 0.3;
        const d = p => Math.hypot(p.x - bx, p.y - by);
        const melhor = cands.reduce((a, b) => (d(a) <= d(b) ? a : b));
        if (melhor !== ativo[h] && d(melhor) < d(ativo[h]) - 2.5) ativo[h] = melhor;
      }
    }

    function passo(dt) {
      t += dt; tFase += dt;
      moverCamera(dt);
      if (msg) msg.t += dt;
      confete = moverConfete(confete, dt);
      if (fase === "saida") {
        if (tFase > 1.4) { fase = "jogo"; tFase = 0; apito(1); }
        return;
      }
      if (fase === "gol") {
        moverBola(dt);
        jogs.forEach(p => { if (p.pulo) p.pulo += dt; });
        if (tFase > 2.8) { posicionar(saidaTime); msg = null; }
        return;
      }
      if (fase === "fim") { moverBola(dt); return; }
      tempo -= dt;
      if (tempo <= 10.5 && !avisouFim) { avisouFim = true; Motor.falar("Últimos dez segundos!"); }
      if (Math.ceil(tempo) !== infoTempo) atualizarInfo();
      if (tempo <= 0) { tempo = 0; atualizarInfo(); terminar(); return; }
      escolherAtivos(dt);
      jogs.forEach(p => { p.atord = Math.max(0, p.atord - dt); if (bola.dono === p) p.comBola += dt; });
      jogs.forEach(p => decidir(p, dt));
      jogs.forEach(p => moverJogador(p, dt));
      separar();
      moverBola(dt);
      posse(dt);
      checarGol();
    }

    // ---------- Desenho ----------
    function desenharJogador(p) {
      const camisa = camisaDe(p), escuro = p.papel === "gk" ? "#333" : J.times[p.t].e;
      const pulo = p.pulo ? Math.abs(Math.sin(p.pulo * 9)) * 0.35 : 0;
      c.save();
      c.translate(p.x, p.y);
      c.fillStyle = "rgba(0,0,0,.25)";
      c.beginPath(); c.ellipse(0.35, 0.5, RJ * 0.95, RJ * 0.8, 0, 0, Math.PI * 2); c.fill();
      const esc = 1 + pulo;
      c.scale(esc, esc);
      c.rotate(Math.atan2(p.fy, p.fx));
      const corre = Math.hypot(p.vx, p.vy) > 1;
      const a = corre ? Math.sin(p.anim * 1.6) : 0;
      c.fillStyle = "#1f2327";
      c.beginPath(); c.ellipse(RJ * 0.5 * a, -RJ * 0.36, RJ * 0.34, RJ * 0.19, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(-RJ * 0.5 * a, RJ * 0.36, RJ * 0.34, RJ * 0.19, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = p.papel === "gk" ? "#fff" : p.pele;
      c.beginPath(); c.arc(-RJ * 0.3 * a, -RJ * 0.86, RJ * 0.22, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(RJ * 0.3 * a, RJ * 0.86, RJ * 0.22, 0, Math.PI * 2); c.fill();
      c.fillStyle = camisa; c.strokeStyle = escuro; c.lineWidth = 0.22;
      c.beginPath(); c.ellipse(0, 0, RJ * 0.58, RJ * 0.86, 0, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = p.pele; c.beginPath(); c.arc(RJ * 0.12, 0, RJ * 0.45, 0, Math.PI * 2); c.fill();
      c.fillStyle = p.cabelo; c.beginPath(); c.arc(-RJ * 0.04, 0, RJ * 0.41, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    function desenhar() {
      c.setTransform(J.dpr, 0, 0, J.dpr, 0, 0);
      const gr = c.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, "#22324f"); gr.addColorStop(1, "#16233a");
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      mundo(c);
      if (fundo) c.drawImage(fundo, -5, -4, 90, 58);
      // marcador do jogador controlado
      for (let h = 0; h < J.humanos; h++) {
        const p = ativo[h];
        if (!p || fase === "fim") continue;
        const cor = h === 0 ? "#ffe066" : "#66d9e8";
        const r = RJ * (1.45 + 0.08 * Math.sin(t * 6));
        c.fillStyle = h === 0 ? "rgba(255,224,102,.3)" : "rgba(102,217,232,.3)";
        c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.fill();
        c.strokeStyle = cor; c.lineWidth = 0.38;
        c.beginPath(); c.arc(p.x, p.y, r, 0, Math.PI * 2); c.stroke();
        // setinha para onde ele olha
        c.fillStyle = cor;
        c.beginPath();
        const ax = p.x + p.fx * r * 1.25, ay = p.y + p.fy * r * 1.25;
        c.moveTo(ax + p.fx * 0.9, ay + p.fy * 0.9);
        c.lineTo(ax - p.fy * 0.75, ay + p.fx * 0.75);
        c.lineTo(ax + p.fy * 0.75, ay - p.fx * 0.75);
        c.closePath(); c.fill();
      }
      // sombra da bola, jogadores, bola
      const ordem = jogs.slice().sort((a, b) => (rot ? b.x - a.x : a.y - b.y));
      ordem.forEach(desenharJogador);
      c.fillStyle = "rgba(0,0,0,.25)";
      c.beginPath(); c.ellipse(bola.x + 0.3, bola.y + 0.35, RB, RB * 0.8, 0, 0, Math.PI * 2); c.fill();
      desenharBola(c, bola.x, bola.y, RB, bola.giro, 0.12);
      // etiquetas na tela (sempre de pé, mesmo com o campo girado)
      c.setTransform(J.dpr, 0, 0, J.dpr, 0, 0);
      for (let h = 0; h < J.humanos; h++) {
        const p = ativo[h];
        if (!p || fase === "fim") continue;
        const q = naTela(p.x, p.y), y = q.y - RJ * s * 1.5 - 10;
        const cor = h === 0 ? "#ffe066" : "#66d9e8";
        c.fillStyle = cor; c.strokeStyle = "#1d3557"; c.lineWidth = 2;
        c.beginPath(); c.moveTo(q.x - 7, y - 4); c.lineTo(q.x + 7, y - 4); c.lineTo(q.x, y + 5); c.closePath(); c.fill(); c.stroke();
        if (J.humanos === 2) {
          c.beginPath(); c.arc(q.x, y - 14, 10, 0, Math.PI * 2); c.fill(); c.stroke();
          c.fillStyle = "#1d3557"; c.font = `bold 14px ${FONTE}`; c.textAlign = "center"; c.textBaseline = "middle";
          c.fillText(String(h + 1), q.x, y - 13);
        }
      }
      const cxT = ox, cyT = oy;
      const tam = Math.min(W * 0.12, 70);
      if (fase === "saida" && !J.pausado) {
        textoGrande(c, tFase < 0.9 ? "Prontos?" : "Já!", cxT, cyT - (rot ? 0 : 0), tam * 0.8, "#fff", 1);
      }
      if (msg && msg.t < (msg.dur || 2)) {
        const e = msg.t < 0.25 ? 0.4 + msg.t / 0.25 * 0.8 : 1.2 - Math.min(0.2, (msg.t - 0.25) * 0.8);
        textoGrande(c, msg.txt, cxT, cyT, msg.txt.length > 9 ? tam * 0.75 : tam, msg.cor, e);
      }
      desenharConfete(c, confete);
      if (zoom) desenharMapa();
    }

    // Mini-mapa (só com a câmera): campo inteiro, jogadores, bola e o pedaço que está na tela
    function desenharMapa() {
      const mw = rot ? 64 : 104, mh = rot ? 104 : 64; // tamanho na tela
      const x0 = W / 2 - mw / 2, y0 = 6, k = (rot ? mh : mw) / L;
      const m = (x, y) => (rot ? { x: x0 + y * k, y: y0 + mh - x * k } : { x: x0 + x * k, y: y0 + y * k });
      c.save();
      c.globalAlpha = 0.9;
      c.fillStyle = "rgba(10,20,35,.55)"; rr(c, x0 - 4, y0 - 4, mw + 8, mh + 8, 8); c.fill();
      c.fillStyle = "#3f9b48"; c.fillRect(x0, y0, mw, mh);
      c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 1;
      c.strokeRect(x0 + 0.5, y0 + 0.5, mw - 1, mh - 1);
      const a = m(40, 0), b = m(40, LG);
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      [0, L].forEach(gx => { const p1 = m(gx, B1), p2 = m(gx, B2); c.lineWidth = 3; c.beginPath(); c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y); c.stroke(); });
      // janela da câmera
      const vx = (rot ? H : W) / s, vy = (rot ? W : H) / s;
      const v1 = m(clamp(camX - vx / 2, 0, L), clamp(camY - vy / 2, 0, LG)), v2 = m(clamp(camX + vx / 2, 0, L), clamp(camY + vy / 2, 0, LG));
      c.strokeStyle = "rgba(255,255,255,.95)"; c.lineWidth = 1.5;
      c.strokeRect(Math.min(v1.x, v2.x), Math.min(v1.y, v2.y), Math.abs(v2.x - v1.x), Math.abs(v2.y - v1.y));
      jogs.forEach(p => {
        const q = m(p.x, p.y);
        c.fillStyle = camisaDe(p);
        c.beginPath(); c.arc(q.x, q.y, 3.4, 0, Math.PI * 2); c.fill();
        c.strokeStyle = ehHumano(p) ? (p.t === 0 ? "#ffe066" : "#66d9e8") : "rgba(0,0,0,.5)";
        c.lineWidth = ehHumano(p) ? 2 : 1; c.stroke();
      });
      const qb = m(bola.x, bola.y);
      c.fillStyle = "#fff"; c.strokeStyle = "#000"; c.lineWidth = 1;
      c.beginPath(); c.arc(qb.x, qb.y, 2.6, 0, Math.PI * 2); c.fill(); c.stroke();
      c.restore();
    }

    // ---------- Toque ----------
    function montarToque() {
      J.camada.innerHTML = "";
      if (!J.toque || J.acabou) return;
      const pos = (elx, st) => { Object.assign(elx.style, st); J.camada.appendChild(elx); };
      if (J.humanos === 1) {
        pos(J.criarAlavanca(0, 124), { left: "10px", bottom: "12px" });
        const bc = J.criarBotao("⚽", "Chutar", () => acao(0, "chute"), "chute");
        pos(bc, { right: "14px", bottom: rot ? "60px" : "84px", width: "80px", height: "80px", fontSize: "38px" });
        const bp = J.criarBotao("👟", "Passar ou trocar de jogador", () => acao(0, "passe"));
        pos(bp, rot ? { right: "104px", bottom: "12px", width: "62px", height: "62px" } : { right: "24px", bottom: "12px", width: "62px", height: "62px" });
      } else {
        [0, 1].forEach(h => {
          const lado = h === 0 ? "left" : "right";
          pos(J.criarAlavanca(h, 108), { [lado]: "8px", bottom: "12px" });
          const bc = J.criarBotao("⚽", `Chutar jogador ${h + 1}`, () => acao(h, "chute"), "chute");
          const bp = J.criarBotao("👟", `Passar jogador ${h + 1}`, () => acao(h, "passe"));
          if (rot) {
            pos(bc, { [lado]: "122px", bottom: "74px", width: "58px", height: "58px", fontSize: "28px" });
            pos(bp, { [lado]: "122px", bottom: "10px", width: "56px", height: "56px", fontSize: "26px" });
          } else {
            pos(bc, { [lado]: "30px", bottom: "132px", width: "64px", height: "64px", fontSize: "30px" });
            pos(bp, { [lado]: "36px", bottom: "204px", width: "54px", height: "54px", fontSize: "24px" });
          }
          bc.classList.add(h === 0 ? "j1" : "j2"); bp.classList.add(h === 0 ? "j1" : "j2");
        });
      }
    }

    return {
      medir, comecar, passo, desenhar, acao, montarToque,
      passoFim: dt => { t += dt; confete = moverConfete(confete, dt); if (msg) msg.t += dt; },
      estado: () => ({ modo: "partida", fase, placar: [...placar], tempo, rot, s, zoom, cam: [camX, camY],
        bola: { x: bola.x, y: bola.y, vx: bola.vx, vy: bola.vy, dono: bola.dono ? jogs.indexOf(bola.dono) : -1 },
        jogs: jogs.map(p => ({ t: p.t, papel: p.papel, x: p.x, y: p.y })), ativo: ativo.map(p => (p ? jogs.indexOf(p) : -1)) }),
      teste: { setTempo: v => { tempo = v; }, golDireto: tm => gol(tm) },
    };
  }
})();
