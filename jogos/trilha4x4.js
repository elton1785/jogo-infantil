// Desafio 4x4 🚙 — trilha off-road de verdade, vista de lado: não é corrida, é vencer os obstáculos
// sem capotar (como no jeep trial). Subida de pedra, escada de pedras, atoleiro, travessia de rio,
// valeta, tronco caído, duna de areia e descida íngreme. O jipe tem física: suspensão, peso, rodas
// que patinam na lama e na areia, inclinação (inclinômetro no painel). O piloto escolhe a tração
// (4x2 ou 4x4) e a reduzida (mais força, menos velocidade); quando atola, usa o guincho preso numa
// árvore. Rio: entrar rápido demais afoga o motor (calço hidráulico). Penalidades: guincho, motor
// afogado, capotar (volta para o começo do obstáculo). O instrutor explica cada obstáculo antes.
// Abre pelo Pé na Estrada (modo Off-road 4x4): Desafio4x4.iniciar(area, op, aoOpcoes).
const Desafio4x4 = (() => {
  const LUGARES = {
    jalapao: { nome: "Jalapão", ceu: ["#3f9be0", "#fde2b8"], solo: ["#d9a560", "#a8703c"], longe: "#d58e4c", perto: "#c27a3e", mesa: true, arvore: "#4f8a3a",
      trilha: ["largada", "costelas", "areia", "duna", "rio", "tronco", "valeta", "rampa", "descida", "chegada"] },
    lencois: { nome: "Lençóis Maranhenses", ceu: ["#3aa0e6", "#e9f6ff"], solo: ["#f4efe2", "#d9cfb8"], longe: "#efe9da", perto: "#e6dfcc", dunas: true, arvore: "#6f9a4a",
      trilha: ["largada", "areia", "duna", "rio", "valeta", "duna", "atoleiro", "descida", "chegada"] },
    caatinga: { nome: "Sertão", ceu: ["#4aa3e0", "#fbe3b0"], solo: ["#b99a6a", "#86683f"], longe: "#a8805a", perto: "#94704d", mesa: true, arvore: "#7d8a4a",
      trilha: ["largada", "costelas", "tronco", "escada", "valeta", "rampa", "atoleiro", "descida", "chegada"] },
  };
  // Cada obstáculo: o nome, o que o instrutor fala antes, e a dica de tração (para o modo fácil ligar sozinho)
  const OBST = {
    costelas: { nome: "Costelas", fala: "Costelas! O chão é cheio de ondinhas: vá devagar, senão o jipe pula muito.", q4: false, red: false },
    areia: { nome: "Areia fofa", fala: "Areia fofa! Ligue o quatro por quatro e não pare de acelerar, senão o jipe afunda.", q4: true, red: false },
    duna: { nome: "Duna", fala: "Uma duna! Ligue o quatro por quatro e suba com embalo. Lá em cima, tire o pé para descer devagar.", q4: true, red: false },
    rio: { nome: "Travessia do rio", fala: "Travessia do rio! Entre bem devagar: se entrar rápido, a água entra no motor e ele apaga. O snorkel ajuda o motor a respirar.", q4: true, red: true },
    tronco: { nome: "Tronco caído", fala: "Um tronco caído! Chegue devagar e suba com calma, primeiro a roda da frente, depois a de trás.", q4: true, red: true },
    valeta: { nome: "Valeta", fala: "Valeta! Desça devagar, freando, e depois acelere para subir do outro lado.", q4: true, red: false },
    rampa: { nome: "Subida de pedra", fala: "Subida de pedra, bem íngreme! Ligue o quatro por quatro e a reduzida: a reduzida dá mais força para subir. Acelere com calma, sem tirar o pé.", q4: true, red: true },
    escada: { nome: "Escada de pedras", fala: "Escada de pedras! Quatro por quatro e reduzida, e suba um degrau de cada vez, devagarinho.", q4: true, red: true },
    atoleiro: { nome: "Atoleiro", fala: "Atoleiro! Lama funda. Quatro por quatro ligado e passe sem parar. Se atolar, use o guincho!", q4: true, red: false },
    descida: { nome: "Descida íngreme", fala: "Descida íngreme! Ligue a reduzida: o motor segura o jipe. Desça devagar, freando de leve, sempre reto.", q4: true, red: true },
  };
  // Atrito (aderência) e arrasto de cada tipo de chão
  const CHAO = { terra: [0.9, 0.4], areia: [0.55, 1.4], lama: [0.38, 3.2], pedra: [1.05, 0.3], tronco: [0.7, 0.3], cascalho: [0.85, 0.5] };
  const COR_JIPE = { vermelho: "#e63946", azul: "#2f80ed", amarelo: "#ffc21a", verde: "#2a9d55", rosa: "#ff70a6", laranja: "#f77f00" };

  function iniciar(area, op, aoOpcoes) {
    const lugar = LUGARES[op.trilha] || LUGARES.jalapao, cor = COR_JIPE[op.cor] || "#e63946";
    const facil = op.nivel === "facil", dificil = op.nivel === "dificil";
    let pausado = false;
    const P = Palco.criar(area, { classe: "trilha-tela", aoPausar: () => { pausado = !pausado; P.pausa.textContent = pausado ? "▶️" : "⏸️"; } });
    const ctx = P.ctx;

    // ---------- Terreno: alturas a cada 25 cm e o tipo de chão ----------
    const PASSO = 0.25, hs = [0], ts = ["terra"], secoes = [], aguas = [], arvores = [];
    const add = (len, f, tipo) => {
      const n = Math.max(1, Math.round(len / PASSO)), base = hs[hs.length - 1];
      for (let i = 1; i <= n; i++) { const t = i / n; hs.push(base + f(t)); ts.push(typeof tipo === "function" ? tipo(t) : tipo); }
    };
    const xAgora = () => (hs.length - 1) * PASSO, yAgora = () => hs[hs.length - 1];
    const suave = t => (1 - Math.cos(Math.PI * t)) / 2;
    const FORMA = {
      largada: () => add(16, () => 0, "terra"),
      chegada: () => add(24, () => 0, "terra"),
      costelas: () => add(22, t => 0.13 * Math.sin(t * 22 / 1.3 * Math.PI * 2), "terra"),
      areia: () => add(16, t => 0.08 * Math.sin(t * 16 / 2 * Math.PI * 2), "areia"),
      duna: () => { add(18, t => 4.2 * suave(t), "areia"); add(14, t => -4.2 * suave(t), "areia"); },
      rio: () => { const x0 = xAgora(), y0 = yAgora(); add(16, t => -1.15 * Math.min(1, Math.sin(Math.PI * t) * 1.7), "cascalho"); aguas.push({ x0: x0 + 0.6, x1: xAgora() - 0.6, nivel: y0 - 0.15 }); },
      tronco: () => { add(5, () => 0, "terra"); add(0.8, t => 0.42 * Math.sin(Math.PI * t), "tronco"); add(5, () => 0, "terra"); },
      valeta: () => add(9, t => -1.6 * Math.sin(Math.PI * t), "terra"),
      rampa: () => { add(3, () => 0, "pedra"); add(8, t => 4.4 * t + (Math.floor(t * 10) % 2 ? 0.22 : 0), "pedra"); add(4, () => 0, "pedra"); add(16, t => -4.4 * suave(t), "terra"); },
      escada: () => { for (let k = 0; k < 5; k++) { add(0.35, t => 0.32 * t, "pedra"); add(1.4, () => 0, "pedra"); } add(4, () => 0, "pedra"); add(12, t => -1.6 * suave(t), "terra"); },
      atoleiro: () => add(13, t => -0.65 * Math.sin(Math.PI * t), "lama"),
      descida: () => { add(16, t => 4 * suave(t), "terra"); add(3, () => 0, "terra"); add(7, t => -4.4 * suave(t), "pedra"); add(4, () => 0, "terra"); },
    };
    lugar.trilha.forEach((tipo, i) => {
      const x0 = xAgora();
      FORMA[tipo]();
      if (OBST[tipo]) secoes.push({ tipo, ...OBST[tipo], x0, x1: xAgora(), num: secoes.length + 1 });
      if (tipo !== "chegada") { const xa = xAgora(); add(7, () => 0, "terra"); arvores.push(xa + 3.5 + (i % 2) * 1.5); }
    });
    const FIM = xAgora() - 10;
    const nH = hs.length;
    const h = x => { const f = x / PASSO, i = Math.max(0, Math.min(nH - 2, Math.floor(f))), u = Math.max(0, Math.min(1, f - i)); return hs[i] + (hs[i + 1] - hs[i]) * u; };
    const tipoEm = x => ts[Math.max(0, Math.min(nH - 1, Math.round(x / PASSO)))];
    const inclinacao = x => (h(x + 0.2) - h(x - 0.2)) / 0.4;
    const aguaEm = x => aguas.find(a => x > a.x0 && x < a.x1);

    // ---------- O jipe: corpo rígido com duas rodas em suspensões de mola ----------
    const RODAS = [{ ox: -1.28, oy: 0.08 }, { ox: 1.28, oy: 0.08 }];  // traseira, dianteira (no corpo)
    const R = 0.47, L0 = 0.3, K = 60, C = 8, G = 9.8, INERCIA = 1.4, BATENTE = 0.2;
    const CANTOS = [[-1.95, -0.12], [0, -0.3], [1.95, -0.1], [1.85, 0.62], [0.35, 1.3], [-1.6, 1.3], [-1.95, 0.75]];
    const jipe = { x: 6, y: 0, a: 0, vx: 0, vy: 0, w: 0, giro: [0, 0], contato: [false, false], comp: [0, 0], patina: [0, 0] };
    jipe.y = h(jipe.x) + R + L0;
    let q4 = facil, reduzida = false, motorDesligado = 0, guinchando = null, parado = 0, capotado = 0, emRio = false;
    let tempo = 0, pontos = 0, penal = 0, fase = "andando", secaoAtual = -1, falouSecao = -1, msg = null, guinchos = 0, capotadas = 0, afogadas = 0;
    const particulas = [];
    const cosA = () => Math.cos(jipe.a), sinA = () => Math.sin(jipe.a);
    const mundo = (lx, ly) => [jipe.x + lx * cosA() - ly * sinA(), jipe.y + lx * sinA() + ly * cosA()];
    function forca(px, py, fx, fy, dt) {
      jipe.vx += fx * dt; jipe.vy += fy * dt;
      jipe.w += ((px - jipe.x) * fy - (py - jipe.y) * fx) / INERCIA * dt;
    }
    const velPonto = (px, py) => [jipe.vx - jipe.w * (py - jipe.y), jipe.vy + jipe.w * (px - jipe.x)];

    // ---------- Entradas ----------
    let acel = false, freio = false;
    const tec = {};
    const bFreio = P.botao("🛑<small>FREIO / RÉ</small>", v => { freio = v; }, { segurar: true });
    const bAcel = P.botao("⛽<small>ACELERAR</small>", v => { acel = v; }, { segurar: true, classe: "principal" });
    const b4 = P.botao("", () => trocar4x4());
    const bRed = P.botao("", () => trocarReduzida());
    const bGuincho = P.botao("🪝<small>GUINCHO (X)</small>", () => usarGuincho());
    [bFreio, bAcel, b4, bRed, bGuincho].forEach(b => P.controles.appendChild(b));
    bGuincho.hidden = true;
    const pintarBotoes = () => {
      b4.innerHTML = `${q4 ? "🟢" : "⚪"}<small>4x4</small>`;
      bRed.innerHTML = `${reduzida ? "🟢" : "⚪"}<small>REDUZIDA</small>`;
    };
    pintarBotoes();
    const posicionar = () => {
      const t = Math.max(88, Math.min(120, Math.min(P.W, P.H) * 0.2)), m = 14, sb = "env(safe-area-inset-bottom, 0px)", sl = "env(safe-area-inset-left, 0px)", sr = "env(safe-area-inset-right, 0px)";
      const est = { width: t + "px", height: t + "px", minWidth: "0", minHeight: "0", padding: "0" };
      Object.assign(bFreio.style, est, { left: `calc(${m}px + ${sl})`, bottom: `calc(${m}px + ${sb})` });
      Object.assign(bAcel.style, est, { right: `calc(${m}px + ${sr})`, bottom: `calc(${m}px + ${sb})` });
      const p = Math.max(64, t * 0.7);
      Object.assign(b4.style, { width: p + "px", height: p + "px", minWidth: "0", minHeight: "0", padding: "0", fontSize: "22px", right: `calc(${m + t + 10}px + ${sr})`, bottom: `calc(${m}px + ${sb})` });
      Object.assign(bRed.style, { width: p + "px", height: p + "px", minWidth: "0", minHeight: "0", padding: "0", fontSize: "22px", right: `calc(${m + t + 20 + p}px + ${sr})`, bottom: `calc(${m}px + ${sb})` });
      Object.assign(bGuincho.style, { minWidth: "130px", minHeight: "70px", left: "50%", transform: "translateX(-50%)", bottom: `calc(${m + t + 12}px + ${sb})` });
    };
    posicionar();
    P.aoMedir = posicionar;
    P.teclas((e, d) => {
      const k = e.key;
      // controle: A/RT acelera, LT freia (e dá ré), LB liga o 4x4, RB a reduzida, X o guincho, Y a buzina
      if (["ArrowRight", "ArrowUp", "Enter", "c", "C"].includes(k)) { tec.acel = d; e.preventDefault(); }
      else if (["ArrowLeft", "ArrowDown", "z", "Z"].includes(k)) { tec.freio = d; e.preventDefault(); }
      else if (d && !e.repeat && (k === "4" || k === "q" || k === "Q")) trocar4x4();
      else if (d && !e.repeat && (k === "r" || k === "R" || k === "e" || k === "E")) trocarReduzida();
      else if (d && !e.repeat && (k === "g" || k === "G" || k === " ")) { e.preventDefault(); usarGuincho(); }
      else if (d && !e.repeat && (k === "y" || k === "Y")) { Motor.nota(300, { dur: 0.4, tipo: "square", vol: 0.07 }); Motor.nota(380, { dur: 0.4, tipo: "square", vol: 0.05 }); }
    });
    function trocar4x4() { q4 = !q4; pintarBotoes(); Motor.nota(q4 ? 660 : 440, { dur: 0.12, tipo: "square", vol: 0.06 }); dizer(q4 ? "4x4 ligado: força nas quatro rodas!" : "4x2: só as rodas de trás puxam.", false); }
    function trocarReduzida() { reduzida = !reduzida; pintarBotoes(); Motor.nota(reduzida ? 330 : 550, { dur: 0.12, tipo: "square", vol: 0.06 }); dizer(reduzida ? "Reduzida ligada: mais força, menos velocidade." : "Reduzida desligada: mais velocidade.", false); }
    function usarGuincho() {
      if (guinchando || bGuincho.hidden || fase !== "andando") return;
      const alvo = arvores.find(x => x > jipe.x + 4) || jipe.x + 12;
      guinchando = { ax: alvo, ay: h(alvo) + 1.2, ate: jipe.x + Math.min(12, alvo - jipe.x - 2) };
      guinchos++; penal += 20; bGuincho.hidden = true;
      Motor.falar("Guincho! O cabo está preso na árvore e puxa o jipe. Vinte pontos de castigo.");
    }
    const dizer = (t, falar = true) => { msg = { txt: (t.match(/^[^.!?]+[.!?]/) || [t])[0], t: 3 }; if (falar) Motor.falar(t); }; // na tela, só a 1ª frase (a voz fala tudo)

    // ---------- Física ----------
    function passo(dt) {
      const acelera = (acel || tec.acel) && motorDesligado <= 0 && fase === "andando";
      const freia = (freio || tec.freio) && fase === "andando";
      const fwd = [cosA(), sinA()];
      const vAvanco = jipe.vx * fwd[0] + jipe.vy * fwd[1];
      const vmax = reduzida ? 5 : 13, forcaMotor = reduzida ? 7.6 : 4.4;
      jipe.vy -= G * dt;
      let algumContato = false;
      RODAS.forEach((rd, i) => {
        const [ax, ay] = mundo(rd.ox, rd.oy);
        const g = h(ax), comp = (g + R) - (ay - L0);
        jipe.contato[i] = comp > 0;
        jipe.comp[i] = Math.max(0, Math.min(BATENTE, comp));
        if (comp <= 0) return;
        algumContato = true;
        const s = inclinacao(ax), nl = Math.hypot(1, s), nx = -s / nl, ny = 1 / nl, tx = 1 / nl, ty = s / nl;
        const [pvx, pvy] = velPonto(ax, ay);
        const vn = pvx * nx + pvy * ny, vt = pvx * tx + pvy * ty;
        const Fn = Math.max(0, K * Math.min(comp, BATENTE) - C * vn) + (comp > BATENTE ? (comp - BATENTE) * 500 - vn * 10 : 0); // passou do curso: bate no batente
        forca(ax, ay, nx * Fn, ny * Fn, dt);
        const [mu, arrasto] = CHAO[tipoEm(ax)] || CHAO.terra, limite = mu * Fn;
        let Ft = -vt * arrasto * 0.35; // resistência do chão (lama e areia seguram muito)
        const tracao = i === 0 || q4;
        let pedido = 0;
        if (acelera && tracao) pedido = forcaMotor * (q4 ? 1 : 2) * 0.5 * (Math.abs(vAvanco) > vmax ? 0 : 1);
        if (freia) pedido = Math.abs(vt) > 0.4 && vAvanco > 0.2 ? -Math.sign(vt) * limite : tracao ? -forcaMotor * 0.55 * (q4 ? 1 : 2) * 0.5 : 0; // freia; parado, dá ré
        if (!acelera && !freia && reduzida) pedido = -vt * 1.6; // freio motor da reduzida segura nas descidas
        if (!acelera && !freia && Math.abs(vt) < 0.6) pedido = -vt * 3 * (Math.abs(s) < 0.15 ? 1 : 0.15); // parado no plano fica parado
        const real = Math.max(-limite, Math.min(limite, pedido));
        jipe.patina[i] = Math.abs(pedido) > limite * 1.02 && acelera ? 1 : 0;
        Ft += real;
        forca(ax, ay, tx * Ft, ty * Ft, dt);
        jipe.giro[i] += (vt + jipe.patina[i] * 3) / R * dt;
      });
      if (!algumContato) { RODAS.forEach((rd, i) => { jipe.giro[i] += (acelera ? 12 : 0) * dt; }); jipe.w += ((acelera ? 1 : 0) - (freia ? 1 : 0)) * 1.4 * dt; } // no ar: acelerar levanta o nariz
      // a lataria encostando no chão (bate e raspa)
      CANTOS.forEach(([lx, ly]) => {
        const [px, py] = mundo(lx, ly), g = h(px);
        if (py >= g) return;
        const [pvx, pvy] = velPonto(px, py), p = g - py;
        forca(px, py, -pvx * 6, 420 * p - pvy * 22, dt);
      });
      // água: freia e empurra um pouco para cima
      const ag = aguaEm(jipe.x);
      if (ag && jipe.y - 0.4 < ag.nivel) { const fundo = Math.min(1.2, ag.nivel - (jipe.y - 0.4)); jipe.vx -= jipe.vx * 1.6 * fundo * dt; jipe.vy += 3 * fundo * dt; }
      // guincho puxando até a árvore
      if (guinchando) {
        const [fx, fy] = mundo(1.95, 0.1), dx = guinchando.ax - fx, dy = guinchando.ay - fy, d = Math.hypot(dx, dy);
        forca(fx, fy, dx / d * 9, dy / d * 9, dt);
        if (jipe.x > guinchando.ate || d < 2.2) guinchando = null;
      }
      jipe.vx *= 1 - 0.05 * dt; jipe.w *= 1 - 1.2 * dt;
      if (facil) jipe.w -= Math.sin(jipe.a) * 1.8 * dt; // no fácil, o jipe é mais difícil de capotar
      jipe.x += jipe.vx * dt; jipe.y += jipe.vy * dt; jipe.a += jipe.w * dt;
      return acelera;
    }

    function atualizar(dt) {
      if (fase === "andando") tempo += dt;
      motorDesligado = Math.max(0, motorDesligado - dt);
      let acelerou = false;
      for (let k = 0; k < 8; k++) acelerou = passo(dt / 8) || acelerou;
      // qual obstáculo está chegando
      const prox = secoes.findIndex(sc => jipe.x < sc.x1);
      if (prox >= 0 && prox !== falouSecao && secoes[prox].x0 - jipe.x < 14) {
        falouSecao = prox;
        const sc = secoes[prox];
        Motor.falar(dificil && sc.num > 2 ? sc.nome + "!" : sc.fala);
        msg = { txt: `${sc.num}. ${sc.nome}`, t: 3.5 };
        if (facil) { q4 = sc.q4 || q4; reduzida = sc.red; pintarBotoes(); }
      }
      // passou de um obstáculo: pontos
      secoes.forEach(sc => {
        if (!sc.feito && jipe.x > sc.x1 && fase === "andando") {
          sc.feito = true; pontos += 100;
          Motor.tim();
          msg = { txt: `✅ ${sc.nome}! +100`, t: 2.4 };
        }
      });
      secaoAtual = secoes.findIndex(sc => jipe.x >= sc.x0 - 6 && jipe.x <= sc.x1);
      // rio: entrou rápido demais, a água entra no motor
      const ag = aguaEm(jipe.x + 1.8);
      if (ag && !emRio) {
        emRio = true;
        if (jipe.vx > 3.6 && motorDesligado <= 0) {
          motorDesligado = 3.5; afogadas++; penal += 20;
          for (let i = 0; i < 40; i++) particulas.push({ x: jipe.x + 1.8, y: ag.nivel, vx: (Math.random() - 0.3) * 6, vy: 3 + Math.random() * 5, vida: 1, cor: "rgba(220,240,255,.9)", r: 0.08 + Math.random() * 0.1 });
          Motor.ruido({ dur: 0.5, vol: 0.3, freq: 500 });
          dizer("Entrou rápido demais! A água entrou no motor e ele apagou. Espere ele ligar de novo. Vinte pontos de castigo.");
        }
      } else if (!ag) emRio = false;
      // atolou? (acelerando e o jipe não sai do lugar)
      if (fase === "andando" && acelerou && Math.abs(jipe.vx) < 0.35 && !guinchando) parado += dt; else parado = Math.max(0, parado - dt * 2);
      if (parado > (facil ? 1.8 : 2.6) && bGuincho.hidden && !guinchando) {
        bGuincho.hidden = false;
        const sc = secoes[secaoAtual];
        dizer(sc && (sc.q4 && !q4 || sc.red && !reduzida) ? `Atolou! Tente ${sc.q4 && !q4 ? "ligar o quatro por quatro" : ""}${sc.q4 && !q4 && sc.red && !reduzida ? " e " : ""}${sc.red && !reduzida ? "ligar a reduzida" : ""}, ou use o guincho!` : "Atolou! Dê ré e tente de novo com embalo, ou use o guincho!");
      }
      if (parado < 0.5 && !bGuincho.hidden && Math.abs(jipe.vx) > 1) bGuincho.hidden = true;
      // capotou? (de lado ou de cabeça para baixo)
      if (fase === "andando" && Math.cos(jipe.a) < 0.15) capotado += dt; else capotado = 0;
      if (capotado > 0.9) {
        fase = "capotou"; capotadas++; penal += 50;
        Motor.ruido({ dur: 0.6, vol: 0.35, freq: 200 });
        dizer("Capotou! Calma, a equipe vai desvirar o jipe. Cinquenta pontos de castigo. Vá mais devagar nesse obstáculo!");
        setTimeout(() => {
          if (!P.vivo()) return;
          const sc = secoes[Math.max(0, secaoAtual)] || secoes[0];
          const x = Math.max(4, (sc ? sc.x0 : jipe.x) - 5);
          Object.assign(jipe, { x, y: h(x) + R + L0 + 0.3, a: 0, vx: 0, vy: 0, w: 0 });
          fase = "andando"; capotado = 0;
        }, 2200);
      }
      // poeira, areia e lama saindo das rodas que patinam ou giram rápido
      RODAS.forEach((rd, i) => {
        if (!jipe.contato[i]) return;
        const [ax, ay] = mundo(rd.ox, rd.oy), tp = tipoEm(ax), rapido = Math.abs(jipe.vx) > 2;
        if ((jipe.patina[i] || (rapido && Math.random() < 0.4)) && Math.random() < 0.7) {
          const corP = { lama: "#5a3d22", areia: lugar.solo[0], terra: "#a07a50", pedra: "#9a9286", cascalho: "#8a8070", tronco: "#7a5230" }[tp] || "#a07a50";
          particulas.push({ x: ax - 0.4, y: h(ax) + 0.1, vx: -2 - Math.random() * 3 - jipe.patina[i] * 3, vy: 1 + Math.random() * 3, vida: 0.8, cor: corP, r: 0.06 + Math.random() * 0.08 });
        }
      });
      if (aguaEm(jipe.x) && Math.abs(jipe.vx) > 0.6 && Math.random() < 0.5) particulas.push({ x: jipe.x + 1.9, y: aguaEm(jipe.x).nivel, vx: 1 + Math.random() * 2, vy: 1.5 + Math.random() * 2, vida: 0.8, cor: "rgba(220,240,255,.85)", r: 0.06 + Math.random() * 0.08 });
      for (let i = particulas.length - 1; i >= 0; i--) { const p = particulas[i]; p.vy -= G * 0.7 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vida -= dt; if (p.vida <= 0) particulas.splice(i, 1); }
      if (particulas.length > 160) particulas.splice(0, particulas.length - 160);
      if (jipe.x > FIM && fase === "andando") terminar();
      if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
    }
    function terminar() {
      fase = "fim";
      const total = Math.max(0, pontos - penal), max = secoes.length * 100;
      const medalha = penal === 0 ? "🥇" : penal <= 50 ? "🥈" : "🥉";
      const chave = `trilha4x4-${op.trilha}`;
      let rec = 0; try { rec = +localStorage.getItem(chave) || 0; } catch (e) { /* ok */ }
      if (total > rec) { try { localStorage.setItem(chave, total); } catch (e) { /* ok */ } }
      Motor.tim(); Motor.comemorar(P.canvas);
      Motor.falar(penal === 0 ? `Trilha completa sem nenhum castigo! Você é um piloto de quatro por quatro de verdade! ${total} pontos!` : `Trilha completa! ${total} pontos.` + (capotadas ? ` Capotou ${capotadas} ${capotadas > 1 ? "vezes" : "vez"}.` : "") + (guinchos ? ` Usou o guincho ${guinchos} ${guinchos > 1 ? "vezes" : "vez"}.` : ""));
      setTimeout(() => {
        if (!P.vivo()) return;
        const linhas = [`🏁 ${secoes.length} obstáculos vencidos · ⏱️ ${Math.floor(tempo / 60)}:${String(Math.floor(tempo % 60)).padStart(2, "0")}`, `⭐ ${total} de ${max} pontos` + (total > rec ? " · 🏆 recorde!" : ""), `🪝 guincho: ${guinchos} · 🔄 capotou: ${capotadas} · 💦 motor afogado: ${afogadas}`];
        const det = document.createElement("div"); det.className = "detalhe-fim";
        linhas.forEach(l => { const d = document.createElement("div"); d.textContent = l; det.appendChild(d); });
        P.fim(penal === 0 ? "Trilha perfeita!" : "Trilha completa!", medalha, det, [
          { rotulo: "🔁 Fazer de novo", principal: true, aoClicar: () => iniciar(area, op, aoOpcoes) },
          { rotulo: "⚙️ Trocar trilha ou jipe", aoClicar: aoOpcoes },
        ]);
      }, 1500);
    }

    // ---------- Som do motor (ronco grave, sobe com a força) ----------
    const motor = (() => {
      const a = Motor.audio();
      if (!a) return { tocar() {}, parar() {} };
      const o = a.createOscillator(), o2 = a.createOscillator(), f = a.createBiquadFilter(), g = a.createGain();
      o.type = "sawtooth"; o2.type = "square"; f.type = "lowpass"; f.frequency.value = 400; g.gain.value = 0;
      o.connect(f); o2.connect(f); f.connect(g).connect(a.destination); o.start(); o2.start();
      let parado2 = false;
      return {
        tocar(rpm, forte) { if (parado2) return; const t = a.currentTime, on = rpm != null && Motor.somLigado(); o.frequency.setTargetAtTime(32 + (rpm || 0) * 70, t, 0.08); o2.frequency.setTargetAtTime(16 + (rpm || 0) * 35, t, 0.08); f.frequency.setTargetAtTime(300 + (forte ? 700 : 200), t, 0.1); g.gain.setTargetAtTime(on ? (forte ? 0.08 : 0.04) : 0, t, 0.1); },
        parar() { if (parado2) return; parado2 = true; try { o.stop(); o2.stop(); } catch (e) { /* ok */ } },
      };
    })();
    const vigia = setInterval(() => { if (!P.vivo()) { motor.parar(); clearInterval(vigia); } }, 500);

    // ---------- Desenho ----------
    let camX = jipe.x, camY = jipe.y;
    function desenhar(dt) {
      const W = P.W, H = P.H, s = P.esc(), k = Math.min(W / 17, H / 8.5);
      camX += (jipe.x + 2.5 - camX) * Math.min(1, dt * 3); camY += (jipe.y + 0.6 - camY) * Math.min(1, dt * 2.5);
      const sx = x => W * 0.42 + (x - camX) * k, sy = y => H * 0.58 - (y - camY) * k;
      // céu, sol e o fundo (chapadas ou dunas) andando devagar
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, lugar.ceu[0]); g.addColorStop(1, lugar.ceu[1]);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,250,215,.9)"; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.16, Math.min(W, H) * 0.06, 0, 7); ctx.fill();
      [[0.15, lugar.longe, 0.32], [0.35, lugar.perto, 0.45]].forEach(([par, corF, alt], c) => {
        ctx.fillStyle = corF; ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W + 20; x += 20) {
          const wx = (x - W * 0.42) / k * 1 + camX * par;
          let yy;
          if (lugar.dunas) yy = H * (0.55 - alt * 0.25) - (Math.sin(wx * 0.11 + c) * 0.5 + 0.5) * H * 0.12;
          else { const m = ((wx * 0.04 + c * 0.3) % 1 + 1) % 1; yy = H * (0.55 - alt * 0.25) - (m > 0.15 && m < 0.75 ? H * 0.13 : m <= 0.15 ? H * 0.13 * m / 0.15 : H * 0.13 * (1 - (m - 0.75) / 0.25)); }
          ctx.lineTo(x, yy);
        }
        ctx.lineTo(W, H); ctx.fill();
      });
      // árvores (onde o guincho prende), placas dos obstáculos e as estacas com fita
      arvores.forEach(x => {
        const X = sx(x), Y = sy(h(x));
        if (X < -100 || X > W + 100) return;
        ctx.fillStyle = "#6b4a2a"; ctx.fillRect(X - 0.12 * k, Y - 2.2 * k, 0.24 * k, 2.2 * k);
        ctx.fillStyle = lugar.arvore; [[0, 2.6, 0.9], [-0.6, 2.2, 0.6], [0.6, 2.2, 0.6]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(X + dx * k, Y - dy * k, r * k, 0, 7); ctx.fill(); });
      });
      secoes.forEach(sc => {
        [sc.x0, sc.x1].forEach((x, j) => {
          const X = sx(x), Y = sy(h(x));
          if (X < -60 || X > W + 60) return;
          for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? "#fff" : "#e63946"; ctx.fillRect(X - 0.05 * k, Y - (i + 1) * 0.35 * k, 0.1 * k, 0.35 * k); }
          if (!j) {
            ctx.fillStyle = "#7a5230"; ctx.fillRect(X - 0.6 * k - 0.04 * k, Y - 2 * k, 0.08 * k, 2 * k);
            ctx.font = `bold ${Math.max(11, 0.32 * k)}px Fredoka, sans-serif`; const tw = ctx.measureText(sc.nome).width + 16;
            ctx.fillStyle = "#a0703f"; ctx.beginPath(); ctx.roundRect(X - 0.6 * k - tw / 2, Y - 2.6 * k, tw, 0.6 * k, 6); ctx.fill();
            ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(sc.nome, X - 0.6 * k, Y - 2.3 * k);
          }
        });
      });
      // o chão: perfil, camada de cima de cada tipo e as pedras/tronco
      const x0 = camX - W * 0.42 / k - 1, x1 = camX + W * 0.58 / k + 1;
      const gs = ctx.createLinearGradient(0, H * 0.4, 0, H); gs.addColorStop(0, lugar.solo[0]); gs.addColorStop(1, lugar.solo[1]);
      ctx.fillStyle = gs; ctx.beginPath(); ctx.moveTo(sx(x0), H + 10);
      for (let x = x0; x <= x1; x += PASSO) ctx.lineTo(sx(x), sy(h(x)));
      ctx.lineTo(sx(x1), H + 10); ctx.fill();
      const CORTOPO = { terra: "#8a6a40", areia: lugar.solo[0], lama: "#4a3220", pedra: "#8d8a82", tronco: "#7a5230", cascalho: "#7f7668" };
      ctx.lineWidth = Math.max(3, 0.16 * k); ctx.lineCap = "round";
      for (let x = x0; x <= x1; x += PASSO) {
        const tp = tipoEm(x);
        ctx.strokeStyle = CORTOPO[tp] || "#8a6a40";
        ctx.beginPath(); ctx.moveTo(sx(x), sy(h(x)) + ctx.lineWidth / 2); ctx.lineTo(sx(x + PASSO), sy(h(x + PASSO)) + ctx.lineWidth / 2); ctx.stroke();
        const i = Math.round(x / PASSO);
        if (tp === "pedra" && i % 3 === 0) { ctx.fillStyle = i % 2 ? "#a19d94" : "#7d7a73"; ctx.beginPath(); ctx.ellipse(sx(x), sy(h(x)) + 0.1 * k, 0.28 * k, 0.18 * k, 0.3, 0, 7); ctx.fill(); }
        if (tp === "lama" && i % 4 === 0) { ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.beginPath(); ctx.ellipse(sx(x), sy(h(x)) - 0.02 * k, 0.2 * k, 0.04 * k, 0, 0, 7); ctx.fill(); }
        if (tp === "areia" && i % 5 === 0) { ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx(x) - 0.2 * k, sy(h(x)) + 0.25 * k); ctx.quadraticCurveTo(sx(x), sy(h(x)) + 0.18 * k, sx(x) + 0.2 * k, sy(h(x)) + 0.25 * k); ctx.stroke(); ctx.lineWidth = Math.max(3, 0.16 * k); }
        if (tp === "tronco" && ts[i - 1] !== "tronco") { const X = sx(x + 0.4), Y = sy(h(x)) ; ctx.fillStyle = "#6b4423"; ctx.beginPath(); ctx.arc(X, Y + 0.05 * k, 0.42 * k, 0, 7); ctx.fill(); ctx.fillStyle = "#c9935a"; ctx.beginPath(); ctx.arc(X, Y + 0.05 * k, 0.32 * k, 0, 7); ctx.fill(); ctx.strokeStyle = "#8a5a2b"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X, Y + 0.05 * k, 0.18 * k, 0, 7); ctx.stroke(); ctx.lineWidth = Math.max(3, 0.16 * k); }
      }
      // linha de chegada
      { const X = sx(FIM), Y = sy(h(FIM)); for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? "#111" : "#fff"; ctx.fillRect(X - 0.1 * k, Y - (i + 1) * 0.3 * k, 0.2 * k, 0.3 * k); } ctx.fillStyle = "#e63946"; ctx.font = `bold ${Math.max(14, 0.4 * k)}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.fillText("🏁 CHEGADA", X, Y - 3.4 * k); }
      // cabo do guincho
      if (guinchando) { const [fx, fy] = mundo(1.95, 0.1); ctx.strokeStyle = "#222"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx(fx), sy(fy)); ctx.lineTo(sx(guinchando.ax), sy(guinchando.ay)); ctx.stroke(); }
      desenharJipe(sx, sy, k);
      // água por cima (dá para ver o jipe dentro do rio)
      aguas.forEach(ag => {
        const X0 = sx(ag.x0), X1 = sx(ag.x1);
        if (X1 < 0 || X0 > W) return;
        ctx.fillStyle = "rgba(60,140,190,.55)"; ctx.beginPath(); ctx.moveTo(X0, sy(ag.nivel));
        for (let x = ag.x0; x <= ag.x1; x += 0.25) ctx.lineTo(sx(x), sy(ag.nivel + Math.sin(x * 3 + tempo * 3) * 0.04));
        for (let x = ag.x1; x >= ag.x0; x -= PASSO) ctx.lineTo(sx(x), sy(Math.min(ag.nivel, h(x))));
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 2; ctx.beginPath();
        for (let x = ag.x0; x <= ag.x1; x += 0.25) { const y = sy(ag.nivel + Math.sin(x * 3 + tempo * 3) * 0.04); x === ag.x0 ? ctx.moveTo(sx(x), y) : ctx.lineTo(sx(x), y); }
        ctx.stroke();
      });
      particulas.forEach(p => { ctx.globalAlpha = Math.min(1, p.vida * 1.5); ctx.fillStyle = p.cor; ctx.beginPath(); ctx.arc(sx(p.x), sy(p.y), Math.max(1.5, p.r * k), 0, 7); ctx.fill(); });
      ctx.globalAlpha = 1;
      painel(W, H, s);
    }
    // Jipe de lado (virado para a direita): rodas com cravos e aro, suspensão de mola, carroceria alta,
    // janelas com o piloto de capacete, santantônio, estepe atrás, snorkel, rack com galões, guincho na frente
    function desenharJipe(sx, sy, k) {
      const ARCO = 0.64, YARCO = -0.12; // caixas de roda (no corpo)
      const noCorpo = f => { ctx.save(); ctx.translate(sx(jipe.x), sy(jipe.y)); ctx.rotate(-jipe.a); ctx.scale(k, -k); f(); ctx.restore(); };
      // fundo escuro das caixas de roda (fica atrás do pneu) e o chassi
      noCorpo(() => { ctx.fillStyle = "#141417"; RODAS.forEach(rd => { ctx.beginPath(); ctx.arc(rd.ox, YARCO, ARCO, 0, Math.PI); ctx.fill(); }); ctx.fillStyle = "#2b2b30"; ctx.fillRect(-1.8, -0.36, 3.6, 0.14); });
      // rodas: seguem o chão, mas nunca saem de dentro da caixa de roda
      RODAS.forEach((rd, i) => {
        const [ax, ay] = mundo(rd.ox, rd.oy);
        const desce = jipe.contato[i] ? Math.max(0, Math.min(L0, ay - (h(ax) + R))) : L0;
        const [wx, wy] = mundo(rd.ox, rd.oy - desce);
        ctx.save(); ctx.translate(sx(wx), sy(wy)); ctx.rotate(-jipe.giro[i]);
        ctx.fillStyle = "#151517"; ctx.beginPath(); ctx.arc(0, 0, R * k, 0, 7); ctx.fill();
        ctx.fillStyle = "#26262b";
        for (let q = 0; q < 16; q++) { ctx.save(); ctx.rotate(q / 16 * Math.PI * 2); ctx.beginPath(); ctx.roundRect(-0.055 * k, -(R + 0.035) * k, 0.11 * k, 0.11 * k, 0.02 * k); ctx.fill(); ctx.restore(); }
        ctx.strokeStyle = "#2f2f35"; ctx.lineWidth = 0.03 * k; ctx.beginPath(); ctx.arc(0, 0, (R - 0.12) * k, 0, 7); ctx.stroke();
        const ga = ctx.createRadialGradient(-0.06 * k, -0.06 * k, 0.02 * k, 0, 0, 0.27 * k); ga.addColorStop(0, "#d5dade"); ga.addColorStop(1, "#7d858c");
        ctx.fillStyle = ga; ctx.beginPath(); ctx.arc(0, 0, 0.26 * k, 0, 7); ctx.fill();
        ctx.fillStyle = "#4a5056";
        for (let q = 0; q < 6; q++) { ctx.save(); ctx.rotate(q / 6 * Math.PI * 2); ctx.beginPath(); ctx.ellipse(0, -0.15 * k, 0.04 * k, 0.07 * k, 0, 0, 7); ctx.fill(); ctx.restore(); }
        ctx.fillStyle = "#2b2f33"; ctx.beginPath(); ctx.arc(0, 0, 0.07 * k, 0, 7); ctx.fill();
        ctx.restore();
      });
      noCorpo(() => {
        // lataria com o recorte certinho das caixas de roda
        ctx.beginPath();
        ctx.moveTo(-1.95, 0.78); ctx.lineTo(-1.95, YARCO);
        RODAS.forEach(rd => { ctx.lineTo(rd.ox - ARCO, YARCO); for (let a = Math.PI; a >= -0.001; a -= Math.PI / 16) ctx.lineTo(rd.ox + Math.cos(a) * ARCO, YARCO + Math.sin(a) * ARCO); });
        ctx.lineTo(1.98, YARCO); ctx.lineTo(1.98, 0.3); ctx.lineTo(1.88, 0.64); ctx.lineTo(0.8, 0.76); ctx.lineTo(0.38, 1.3); ctx.lineTo(-1.62, 1.3); ctx.lineTo(-1.95, 0.95); ctx.closePath();
        const gb = ctx.createLinearGradient(0, 1.3, 0, -0.2); gb.addColorStop(0, "rgba(255,255,255,.25)"); gb.addColorStop(0.5, "rgba(255,255,255,0)"); gb.addColorStop(1, "rgba(0,0,0,.25)");
        ctx.fillStyle = cor; ctx.fill(); ctx.fillStyle = gb; ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = 0.025; ctx.stroke();
        // molduras pretas dos para-lamas (alargadores) e a soleira com o estribo
        ctx.strokeStyle = "#1b1b1f"; ctx.lineWidth = 0.12; ctx.lineCap = "round";
        RODAS.forEach(rd => { ctx.beginPath(); ctx.arc(rd.ox, YARCO, ARCO + 0.05, 0.05, Math.PI - 0.05); ctx.stroke(); });
        ctx.fillStyle = "#1b1b1f"; ctx.fillRect(-0.62, YARCO - 0.02, 1.24, 0.14);
        ctx.fillStyle = "#3a3f45"; ctx.fillRect(-0.6, YARCO - 0.1, 1.2, 0.06);
        // vincos da lataria
        ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.fillRect(-1.95, 0.6, 3.85, 0.05);
        ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(-1.95, 0.25, 3.92, 0.04);
        // janelas, colunas e o piloto de capacete
        ctx.fillStyle = "#1f3550";
        ctx.beginPath(); ctx.moveTo(-1.55, 0.8); ctx.lineTo(-1.55, 1.2); ctx.lineTo(-0.6, 1.2); ctx.lineTo(-0.6, 0.8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-0.48, 0.8); ctx.lineTo(-0.48, 1.2); ctx.lineTo(0.32, 1.2); ctx.lineTo(0.66, 0.8); ctx.fill();
        ctx.fillStyle = "rgba(160,200,235,.35)"; ctx.beginPath(); ctx.moveTo(-1.45, 0.82); ctx.lineTo(-1.2, 1.18); ctx.lineTo(-1.05, 1.18); ctx.lineTo(-1.3, 0.82); ctx.fill();
        ctx.fillStyle = "#f8f9fa"; ctx.beginPath(); ctx.arc(-0.05, 0.99, 0.15, 0, 7); ctx.fill();
        ctx.fillStyle = "#1d3557"; ctx.beginPath(); ctx.arc(0.04, 0.99, 0.08, -1.2, 1.2); ctx.fill();
        ctx.fillStyle = "#e63946"; ctx.fillRect(-0.2, 1.03, 0.3, 0.04);
        // porta, maçaneta, espelho
        ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 0.025;
        ctx.beginPath(); ctx.moveTo(-0.54, 0.2); ctx.lineTo(-0.54, 0.78); ctx.moveTo(0.62, 0.3); ctx.lineTo(0.62, 0.74); ctx.stroke();
        ctx.fillStyle = "#222"; ctx.fillRect(-0.9, 0.52, 0.18, 0.04);
        ctx.fillStyle = "#1b1b1f"; ctx.fillRect(0.6, 0.8, 0.14, 0.1);
        // estepe atrás, para-choques de aço, lanterna, farol, guincho na frente
        ctx.fillStyle = "#151517"; ctx.beginPath(); ctx.roundRect(-2.24, 0.12, 0.3, 0.8, 0.1); ctx.fill();
        ctx.fillStyle = "#2b2b30"; ctx.fillRect(-2.16, 0.2, 0.12, 0.64);
        ctx.fillStyle = "#3a3f45"; ctx.fillRect(-2.1, -0.18, 0.24, 0.26); ctx.fillRect(1.94, -0.16, 0.28, 0.3);
        ctx.fillStyle = "#c92a2a"; ctx.fillRect(-1.99, 0.48, 0.06, 0.2);
        ctx.fillStyle = "#fff6c2"; ctx.beginPath(); ctx.arc(1.93, 0.47, 0.08, 0, 7); ctx.fill();
        ctx.fillStyle = "#555"; ctx.fillRect(2.02, -0.08, 0.2, 0.14); ctx.fillStyle = "#e63946"; ctx.fillRect(2.18, -0.05, 0.06, 0.07);
        // snorkel na coluna, rack do teto com galões e barra de faróis, antena com bandeirinha
        ctx.fillStyle = "#1b1b1f"; ctx.fillRect(0.72, 0.62, 0.09, 0.8); ctx.fillRect(0.62, 1.38, 0.26, 0.09);
        ctx.fillStyle = "#26262a"; ctx.fillRect(-1.6, 1.3, 1.96, 0.05); ctx.fillRect(-1.55, 1.35, 0.05, 0.12); ctx.fillRect(0.26, 1.35, 0.05, 0.12); ctx.fillRect(-1.6, 1.45, 1.96, 0.04);
        [["#c92a2a", -1.35], ["#2a9d55", -1.02]].forEach(([g, x]) => { ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, 1.35, 0.28, 0.24, 0.03); ctx.fill(); });
        ctx.fillStyle = "#1b1b1f"; ctx.fillRect(-0.5, 1.49, 0.8, 0.12); ctx.fillStyle = "#fff6c2"; for (let q = 0; q < 4; q++) ctx.fillRect(-0.45 + q * 0.19, 1.51, 0.12, 0.08);
        ctx.strokeStyle = "#222"; ctx.lineWidth = 0.025; ctx.beginPath(); ctx.moveTo(-1.85, 0.78); ctx.lineTo(-1.95, 2.0); ctx.stroke();
        ctx.fillStyle = "#f77f00"; ctx.beginPath(); ctx.moveTo(-1.95, 2.0); ctx.lineTo(-1.6, 1.92); ctx.lineTo(-1.95, 1.84); ctx.fill();
        // barro respingado embaixo
        ctx.fillStyle = "rgba(110,72,38,.5)"; for (let q = 0; q < 34; q++) { const x = -1.9 + (q * 0.137) % 3.8, y = YARCO + ((q * 0.29) % 0.45); ctx.fillRect(x, y, 0.05, 0.05); }
      });
    }
    // Painel: obstáculo atual, pontos e castigos, tempo, tração, inclinômetro e velocidade
    function painel(W, H, s) {
      const x0 = 70, y0 = 8, pw = 200 * s, ph = 78 * s;
      Palco.caixa(ctx, x0, y0, pw, ph, 14);
      const sc = secoes[Math.max(0, secoes.findIndex(c => jipe.x < c.x1))] || secoes[secoes.length - 1];
      const feitos = secoes.filter(c => c.feito).length;
      Palco.texto(ctx, `OBSTÁCULO ${Math.min(secoes.length, feitos + 1)}/${secoes.length}`, x0 + 12 * s, y0 + 16 * s, 12 * s, "rgba(255,255,255,.7)", { alinhar: "left", contorno: null });
      Palco.texto(ctx, sc ? sc.nome : "", x0 + 12 * s, y0 + 38 * s, 20 * s, "#fff", { alinhar: "left", contorno: null });
      Palco.texto(ctx, `⭐ ${pontos}${penal ? `  ·  −${penal}` : ""}   ⏱️ ${Math.floor(tempo / 60)}:${String(Math.floor(tempo % 60)).padStart(2, "0")}`, x0 + 12 * s, y0 + 62 * s, 14 * s, penal ? "#ffb3b3" : "#ffd60a", { alinhar: "left", contorno: null });
      // inclinômetro: o jipe desenhado inclinado, verde / amarelo / vermelho
      const graus = Math.round(jipe.a * 180 / Math.PI), perigo = Math.abs(graus) > 38 ? "#ff4d4d" : Math.abs(graus) > 25 ? "#ffd60a" : "#3cff78";
      const R2 = 44 * s, cx = W - R2 - 16, cy = 68 + R2;
      ctx.fillStyle = "rgba(15,20,35,.8)"; ctx.beginPath(); ctx.arc(cx, cy, R2, 0, 7); ctx.fill();
      ctx.strokeStyle = perigo; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.arc(cx, cy, R2 - 6 * s, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      ctx.save(); ctx.translate(cx, cy + 4 * s); ctx.rotate(-jipe.a);
      ctx.fillStyle = perigo; ctx.fillRect(-20 * s, -9 * s, 40 * s, 12 * s); ctx.fillRect(-14 * s, -17 * s, 22 * s, 8 * s);
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(-12 * s, 4 * s, 5 * s, 0, 7); ctx.arc(12 * s, 4 * s, 5 * s, 0, 7); ctx.fill();
      ctx.restore();
      Palco.texto(ctx, `${graus}°`, cx, cy + 26 * s, 14 * s, perigo, { contorno: null });
      Palco.texto(ctx, `${Math.round(Math.abs(jipe.vx) * 3.6)} km/h`, cx, cy + R2 + 14 * s, 14 * s, "#fff");
      // tração e reduzida acesas
      Palco.texto(ctx, `${q4 ? "🟢 4x4" : "⚪ 4x2"}   ${reduzida ? "🟢 REDUZIDA" : "⚪ ALTA"}`, x0 + 6 * s, y0 + ph + 16 * s, 13 * s, "#fff", { alinhar: "left" });
      if (motorDesligado > 0) Palco.texto(ctx, "💦 MOTOR AFOGADO...", W / 2, H * 0.3, 26 * s, "#8fd3ff");
      if (fase === "capotou") Palco.texto(ctx, "🔄 CAPOTOU!", W / 2, H * 0.3, 40 * s, "#ff6b6b");
      if (msg) Palco.texto(ctx, msg.txt, W / 2, H * 0.18, Math.min(30 * s, W / 16), "#fff");
      if (pausado) Palco.texto(ctx, "⏸️ Pausa", W / 2, H / 2, 54 * s);
      // com controle de videogame ligado: a legenda dos botões
      const temPad = navigator.getGamepads && [...navigator.getGamepads()].some(Boolean);
      if (temPad) Palco.texto(ctx, "🎮 A/RT acelera · LT freia/ré · LB 4x4 · RB reduzida · X guincho", W / 2, H - 14 * s, Math.min(14 * s, W / 50), "#fff");
    }

    if (window.TRILHA_TESTE) window.TRILHA_TESTE = { estado: () => ({ x: jipe.x, y: jipe.y, a: jipe.a, vx: jipe.vx, fase, pontos, penal, secoes: secoes.length, FIM, guincho: !bGuincho.hidden }), pular: x => { Object.assign(jipe, { x, y: h(x) + R + L0 + 0.3, a: 0, vx: 0, vy: 0, w: 0 }); camX = x; }, acel: v => { tec.acel = v; }, liga: () => { q4 = true; reduzida = true; pintarBotoes(); } };
    P.rodar(dt => {
      if (!pausado) atualizar(dt);
      motor.tocar(pausado || fase === "fim" || motorDesligado > 0 ? null : Math.min(1, Math.abs(jipe.vx) / (reduzida ? 5 : 13) + ((acel || tec.acel) ? 0.25 : 0)), acel || tec.acel);
      desenhar(pausado ? 0 : dt);
    });
    Motor.falar(`Desafio quatro por quatro no ${lugar.nome}! Aqui não é corrida: o desafio é passar por todos os obstáculos sem capotar e sem usar o guincho. Antes de cada obstáculo eu digo o que fazer. Use o botão quatro por quatro para ligar a força nas quatro rodas, e a reduzida para ter mais força nas subidas e descidas. Olhe o inclinômetro: se ficar vermelho, o jipe pode capotar!`);
  }
  return { iniciar };
})();
