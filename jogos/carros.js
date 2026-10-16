// Pé na Estrada: jogo de carro com dois modos (tudo desenhado por código, sem imagens).
// - 🏁 Corrida: estrada em 3D "de fliperama" (projeção por segmentos: curvas e morros), 5 carros
//   adversários, 3 voltas, contagem regressiva, posição na corrida e pódio. Cenários: campo,
//   praia, cidade à noite e neve. Com 2 jogadores a tela se divide (lado a lado na tela larga,
//   em cima/embaixo na estreita): cada metade mostra a estrada da câmera do seu carro, os dois
//   correm na mesma pista contra 4 carros do computador; jogador 1 = 1º controle ou setas + Enter,
//   jogador 2 = 2º controle ou W A S D + F; no toque, cada um tem os botões na sua metade.
// - 🏙️ Cidade: dirigir livre numa cidade vista de cima, com quarteirões, semáforos e trânsito que
//   respeita o sinal. Missões de entrega (buscar o 📦 e levar até a 🏠) com seta mostrando o caminho.
//   Passar no sinal vermelho não tem castigo: a voz explica que é preciso esperar o verde.
// Controles: botões na tela (⬅️ ➡️ virar, acelerar, frear/ré), setas do teclado (Enter também
// acelera) e controle de videogame (pela ponte do js/controle.js). No fácil o carro acelera sozinho.
(() => {
  const CORES = { vermelho: "#e63946", azul: "#2f80ed", amarelo: "#ffc21a", verde: "#2a9d55", rosa: "#ff70a6", laranja: "#f77f00" };
  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#7cc6fe"/><path d="M2 40h60v22H2z" fill="#6cc35a"/><path d="M24 40h16l14 22H10z" fill="#555"/><path d="M31 44h2v5h-2zM30.5 53h3v6h-3z" fill="#fff"/><g transform="translate(14 22)"><rect x="2" y="10" width="32" height="12" rx="4" fill="#e63946"/><path d="M8 10l4-8h12l4 8z" fill="#c1121f"/><path d="M10 9l3-5h10l3 5z" fill="#9ad1ff"/><rect x="3" y="13" width="5" height="3" rx="1" fill="#ffd60a"/><rect x="28" y="13" width="5" height="3" rx="1" fill="#ffd60a"/><circle cx="9" cy="23" r="4" fill="#222"/><circle cx="27" cy="23" r="4" fill="#222"/></g></svg>';

  // Ronco do motor: som contínuo que acompanha a velocidade, com troca de marcha. `lado`: -1 a 1,
  // para cada carro da corrida a dois soar do seu lado. tocar(pv, acelerando): pv de 0 a 1 (ou
  // null para silenciar, na pausa ou com o som desligado); parar() desliga de vez.
  function somDeMotor(lado = 0) {
    const a = Motor.audio();
    if (!a) return { tocar() {}, parar() {} };
    const t0 = a.currentTime;
    const saida = a.createGain();
    saida.gain.value = 0;
    if (lado && a.createStereoPanner) { const p = a.createStereoPanner(); p.pan.value = lado; saida.connect(p).connect(a.destination); }
    else saida.connect(a.destination);
    // explosões do motor: o volume pulsa no ritmo das rotações
    const pulso = a.createGain();
    pulso.gain.value = 0.65;
    pulso.connect(saida);
    const filtro = a.createBiquadFilter();
    filtro.type = "lowpass"; filtro.Q.value = 3; filtro.frequency.value = 350;
    filtro.connect(pulso);
    const o1 = a.createOscillator(), o2 = a.createOscillator(), g2 = a.createGain();
    o1.type = "sawtooth"; o2.type = "square"; g2.gain.value = 0.45;
    o1.connect(filtro); o2.connect(g2).connect(filtro);
    const lfo = a.createOscillator(), lfoG = a.createGain();
    lfoG.gain.value = 0.35;
    lfo.connect(lfoG).connect(pulso.gain);
    [o1, o2, lfo].forEach(o => o.start(t0));
    let parado = false;
    // app em segundo plano: o laço do jogo para, então o ronco também cala
    const aoEsconder = () => { if (document.hidden) saida.gain.setTargetAtTime(0, a.currentTime, 0.03); };
    document.addEventListener("visibilitychange", aoEsconder);
    return {
      tocar(pv, acelerando) {
        if (parado || document.hidden) return;
        const t = a.currentTime;
        if (pv == null) { saida.gain.setTargetAtTime(0, t, 0.05); return; }
        pv = Math.max(0, Math.min(1, pv));
        // 4 marchas: a rotação sobe em cada uma e cai um pouco na troca
        const m = Math.min(3, Math.floor(pv * 4)), rot = pv * 4 - m;
        const f = 42 + m * 10 + rot * 62 + (acelerando && pv < 0.05 ? 12 : 0);
        o1.frequency.setTargetAtTime(f, t, 0.06);
        o2.frequency.setTargetAtTime(f / 2, t, 0.06);
        lfo.frequency.setTargetAtTime(f / 2, t, 0.06);
        filtro.frequency.setTargetAtTime(260 + pv * 900 + (acelerando ? 350 : 0), t, 0.08);
        saida.gain.setTargetAtTime((0.045 + pv * 0.05) * (acelerando ? 1.25 : 0.85), t, 0.08);
      },
      parar() {
        if (parado) return;
        parado = true;
        document.removeEventListener("visibilitychange", aoEsconder);
        const t = a.currentTime;
        saida.gain.setTargetAtTime(0, t, 0.05);
        [o1, o2, lfo].forEach(o => { try { o.stop(t + 0.4); } catch (e) { /* ok */ } });
      },
    };
  }

  JOGOS.push({
    id: "carros", teclas: true,
    nome: "Pé na Estrada",
    icone: ICONE,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: "🏁🏙️", texto: "Escolha: corrida contra outros carros, ou passear pela cidade fazendo entregas." },
      { figura: "⬅️➡️", texto: "Os botões da esquerda viram o carro. No controle de videogame, use o direcional." },
      { figura: "⛽🛑", texto: "Os botões da direita aceleram e freiam (segurando o freio, dá ré). No modo fácil o carro acelera sozinho." },
      { figura: "🥇", texto: "Na corrida são 3 voltas: passe os outros carros e não saia da pista, que na grama o carro fica lento." },
      { figura: "👥🎮🎮", texto: "Corrida a dois: a tela se divide e cada um tem a sua estrada e os seus botões. Jogador 1 usa o 1º controle (ou as setas e Enter); jogador 2 usa o 2º controle (ou W A S D e F)." },
      { figura: "📦➜🏠", texto: "Na cidade, siga a seta: busque a encomenda e leve até a casinha. Pegue as estrelas pelo caminho!" },
      { figura: "🚦", texto: "Respeite os semáforos: no vermelho a gente para e espera o verde, como os outros carros." },
    ],
    iniciar(area, faixa) {
      const fid = (faixa && faixa.id) || "6-8";
      Motor.telaOpcoes(area, {
        chave: `carros-${fid}`,
        padrao: { modo: "corrida", jogadores: "1", cor: "vermelho", pista: "campo", nivel: fid === "5-6" ? "facil" : "normal" },
        opcoes: [
          { chave: "modo", titulo: "O que vamos fazer?", valores: [["corrida", "🏁 Corrida"], ["cidade", "🏙️ Passear na cidade"]] },
          { chave: "jogadores", titulo: "Jogadores (na corrida)", valores: [["1", "👤 1 jogador"], ["2", "👥 2 jogadores (tela dividida)"]] },
          { chave: "cor", titulo: "Cor do carro", valores: [["vermelho", "🔴 Vermelho"], ["azul", "🔵 Azul"], ["amarelo", "🟡 Amarelo"], ["verde", "🟢 Verde"], ["rosa", "🩷 Rosa"]] },
          { chave: "pista", titulo: "Pista da corrida", valores: [["campo", "🌳 Campo"], ["praia", "🏖️ Praia"], ["noite", "🌃 Cidade à noite"], ["neve", "❄️ Neve"]] },
          { chave: "nivel", titulo: "Jeito de dirigir", valores: [["facil", "🐢 Fácil (acelera sozinho)"], ["normal", "🐇 Normal"], ["dificil", "🚀 Rápido"]] },
        ],
        aoJogar: op => (op.modo === "cidade" ? cidade(area, op) : corrida(area, op)),
      });
    },
  });

  // ---------- Tela comum: topo (informações), palco (canvas) e controles ----------
  // Tela dividida (2 jogadores): lado a lado se o palco for largo, em cima/embaixo se for estreito.
  // Devolve o retângulo [x, y, largura, altura] de cada metade (jogador 1 em cima / à esquerda).
  const VAO = 6;
  function dividir(W, H) {
    if (W >= H) { const w = Math.floor((W - VAO) / 2); return [[0, 0, w, H], [W - w, 0, w, H]]; }
    const h = Math.floor((H - VAO) / 2);
    return [[0, 0, W, h], [0, H - h, W, h]];
  }
  function montarTela(area, { aoPausar, dois = false }) {
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "arcade-tela carros-tela" + (dois ? " carros-dois" : "");
    const topo = document.createElement("div");
    topo.className = "arcade-topo";
    const info = document.createElement("div");
    info.className = "arcade-info";
    const pausa = document.createElement("button");
    pausa.className = "chip";
    pausa.textContent = "⏸️";
    pausa.setAttribute("aria-label", "Pausar");
    pausa.addEventListener("click", aoPausar);
    topo.append(info, pausa, Motor.botaoSom());
    const palco = document.createElement("div");
    palco.className = "arcade-palco";
    const canvas = document.createElement("canvas");
    palco.appendChild(canvas);
    tela.append(topo, palco);
    area.appendChild(tela);
    const ctx = canvas.getContext("2d");
    const ent = { esq: false, dir: false, acel: false, freio: false };   // jogador 1
    const ent2 = { esq: false, dir: false, acel: false, freio: false };  // jogador 2 (tela dividida)
    const botao = (rotulo, alvo, chave, classe) => {
      const b = document.createElement("button");
      b.className = "carros-botao " + (classe || "");
      b.innerHTML = rotulo;
      const liga = v => { alvo[chave] = v; b.classList.toggle("apertado", v); };
      b.addEventListener("pointerdown", e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } liga(true); });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => b.addEventListener(ev, () => liga(false)));
      b.addEventListener("contextmenu", e => e.preventDefault());
      return b;
    };
    // Controles: volante à esquerda (⬅️ ➡️), pedais à direita (frear, acelerar).
    // Com 2 jogadores, cada metade da tela ganha os seus (menores).
    const controles = (alvo, onde) => {
      const esq = document.createElement("div"), dir = document.createElement("div");
      esq.className = "carros-pad volante";
      dir.className = "carros-pad pedais";
      esq.append(botao("⬅️", alvo, "esq"), botao("➡️", alvo, "dir"));
      dir.append(botao("<span>🛑</span><small>frear</small>", alvo, "freio", "freio"), botao("<span>⛽</span><small>acelerar</small>", alvo, "acel", "acel"));
      onde.append(esq, dir);
    };
    const metades = [];
    if (!dois) controles(ent, palco);
    else [ent, ent2].forEach((alvo, k) => {
      const m = document.createElement("div");
      m.className = `carros-metade j${k + 1}`;
      controles(alvo, m);
      palco.appendChild(m);
      metades.push(m);
    });
    // Teclado / controle de videogame (setas; Enter e espaço também aceleram).
    // Com 2 jogadores: jogador 1 = setas + Enter, jogador 2 = W A S D + F; os controles de videogame
    // são lidos direto na corrida, então as teclas que o 1º controle gera (doControle) são ignoradas.
    const MAPA = { ArrowLeft: "esq", ArrowRight: "dir", ArrowUp: "acel", ArrowDown: "freio", Enter: "acel", " ": "acel", a: "esq", d: "dir", w: "acel", s: "freio" };
    const MAPA1 = { ArrowLeft: "esq", ArrowRight: "dir", ArrowUp: "acel", ArrowDown: "freio", Enter: "acel", " ": "acel" };
    const MAPA2 = { a: "esq", d: "dir", w: "acel", s: "freio", f: "acel" };
    const qual = e => {
      if (!dois) return MAPA[e.key] ? [ent, MAPA[e.key]] : null;
      if (e.doControle) return null;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      return MAPA1[k] ? [ent, MAPA1[k]] : MAPA2[k] ? [ent2, MAPA2[k]] : null;
    };
    const desce = e => { const q = qual(e); if (q) { e.preventDefault(); q[0][q[1]] = true; } else if (e.key === "p" || e.key === "Escape") aoPausar(); };
    const sobe = e => { const q = qual(e); if (q) q[0][q[1]] = false; };
    document.addEventListener("keydown", desce);
    document.addEventListener("keyup", sobe);
    const soltarTeclas = () => { document.removeEventListener("keydown", desce); document.removeEventListener("keyup", sobe); };
    // Tamanho do canvas acompanha o palco (nitidez da tela)
    const tam = { w: 0, h: 0 };
    const medir = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      tam.w = palco.clientWidth; tam.h = palco.clientHeight;
      canvas.width = Math.round(tam.w * dpr); canvas.height = Math.round(tam.h * dpr);
      Object.assign(canvas.style, { width: tam.w + "px", height: tam.h + "px" });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (dois) dividir(tam.w, tam.h).forEach(([x, y, w, h], k) => Object.assign(metades[k].style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" }));
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(palco);
    const mostrarInfo = partes => {
      info.innerHTML = "";
      partes.forEach(t => { const s = document.createElement("span"); s.textContent = t; info.appendChild(s); });
    };
    const fim = (titulo, medalha, detalhe, aoDeNovo, aoOpcoes) => {
      const caixa = document.createElement("div");
      caixa.className = "arcade-fim";
      caixa.innerHTML = `<div class="medalha-fim"></div><div class="titulo-fim"></div><div class="detalhe-fim"></div>`;
      caixa.querySelector(".medalha-fim").textContent = medalha;
      caixa.querySelector(".titulo-fim").textContent = titulo;
      caixa.querySelector(".detalhe-fim").textContent = detalhe;
      const b = Object.assign(document.createElement("button"), { className: "chip executar", textContent: "🔁 Correr de novo" });
      b.addEventListener("click", () => { caixa.remove(); aoDeNovo(); });
      const o = Object.assign(document.createElement("button"), { className: "chip", textContent: "⚙️ Trocar pista ou carro" });
      o.addEventListener("click", aoOpcoes);
      caixa.append(b, o);
      tela.appendChild(caixa);
    };
    return { tela, ctx, tam, ent, ent2, pausa, mostrarInfo, fim, soltarTeclas, desligar: () => { soltarTeclas(); obs.disconnect(); } };
  }

  // ---------- Desenho dos carros ----------
  const clarear = (hex, f) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f))); return `rgb(${c.join(",")})`; };
  // Carro visto de trás (corrida), num canvas próprio; `curva` -1..1 inclina para o lado
  function carroDeTras(cor, curva = 0) {
    const W = 220, H = 130, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    c.translate(W / 2, H);
    const sk = curva * 10;
    // sombra
    c.fillStyle = "rgba(0,0,0,.3)"; c.beginPath(); c.ellipse(0, -6, 104, 12, 0, 0, Math.PI * 2); c.fill();
    // pneus
    c.fillStyle = "#1b1b1b";
    c.beginPath(); c.roundRect(-100, -44, 30, 40, 6); c.roundRect(70, -44, 30, 40, 6); c.fill();
    // carroceria
    const g = c.createLinearGradient(0, -100, 0, -14);
    g.addColorStop(0, clarear(cor, 0.25)); g.addColorStop(1, clarear(cor, -0.25));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-96, -22); c.lineTo(-92, -58); c.quadraticCurveTo(-88, -66, -76, -68);
    c.lineTo(-56 + sk, -70); c.lineTo(-40 + sk, -104); c.lineTo(40 + sk, -104); c.lineTo(56 + sk, -70);
    c.lineTo(76, -68); c.quadraticCurveTo(88, -66, 92, -58); c.lineTo(96, -22); c.quadraticCurveTo(96, -14, 86, -14);
    c.lineTo(-86, -14); c.quadraticCurveTo(-96, -14, -96, -22); c.closePath(); c.fill();
    c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 3; c.stroke();
    // vidro de trás
    const v = c.createLinearGradient(0, -100, 0, -72);
    v.addColorStop(0, "#9fd3ff"); v.addColorStop(1, "#2c4f73");
    c.fillStyle = v;
    c.beginPath(); c.moveTo(-34 + sk, -98); c.lineTo(34 + sk, -98); c.lineTo(46 + sk, -74); c.lineTo(-46 + sk, -74); c.closePath(); c.fill();
    // aerofólio
    c.fillStyle = clarear(cor, -0.45);
    c.fillRect(-84, -76, 168, 8); c.fillRect(-70, -70, 6, 8); c.fillRect(64, -70, 6, 8);
    // lanternas, placa e escapamento
    c.fillStyle = "#ff2b2b"; c.beginPath(); c.roundRect(-86, -56, 34, 12, 4); c.roundRect(52, -56, 34, 12, 4); c.fill();
    c.fillStyle = "#ffd0d0"; c.fillRect(-80, -53, 10, 4); c.fillRect(70, -53, 10, 4);
    c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-24, -44, 48, 16, 3); c.fill();
    c.fillStyle = "#1d6fb8"; c.fillRect(-24, -44, 48, 4);
    c.fillStyle = "#333"; c.font = "bold 10px sans-serif"; c.textAlign = "center"; c.fillText("BR 2026", 0, -31);
    c.fillStyle = "#666"; c.beginPath(); c.arc(-56, -20, 5, 0, Math.PI * 2); c.fill();
    return cv;
  }
  // Carro visto de cima (cidade): x para a frente
  function carroDeCima(c, cor, comprimento = 36, largura = 18, tipo = "carro") {
    const L = comprimento / 2, Wd = largura / 2;
    c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.roundRect(-L + 2, -Wd + 3, comprimento, largura, 6); c.fill();
    c.fillStyle = cor; c.beginPath(); c.roundRect(-L, -Wd, comprimento, largura, tipo === "onibus" ? 4 : 7); c.fill();
    c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1.2; c.stroke();
    if (tipo === "onibus") {
      c.fillStyle = "#cfe9ff"; for (let x = -L + 6; x < L - 8; x += 9) c.fillRect(x, -Wd + 2, 6, 3), c.fillRect(x, Wd - 5, 6, 3);
      c.fillStyle = "#2c4f73"; c.fillRect(L - 6, -Wd + 2, 4, largura - 4);
    } else {
      c.fillStyle = "#2c4f73"; c.beginPath(); c.roundRect(L * 0.15, -Wd + 2.5, L * 0.45, largura - 5, 3); c.fill(); // para-brisa
      c.beginPath(); c.roundRect(-L * 0.75, -Wd + 3, L * 0.3, largura - 6, 2); c.fill();                               // vidro de trás
      c.fillStyle = clarear(cor, 0.2); c.beginPath(); c.roundRect(-L * 0.42, -Wd + 3, L * 0.55, largura - 6, 3); c.fill(); // teto
      if (tipo === "taxi") { c.fillStyle = "#fff"; c.fillRect(-L * 0.2, -3, 6, 6); }
    }
    c.fillStyle = "#fff6b0"; c.fillRect(L - 2, -Wd + 2, 2, 4); c.fillRect(L - 2, Wd - 6, 2, 4);
    c.fillStyle = "#ff3b3b"; c.fillRect(-L, -Wd + 2, 2, 4); c.fillRect(-L, Wd - 6, 2, 4);
  }

  // =====================================================================
  // 🏁 Corrida (estrada em 3D por segmentos)
  // =====================================================================
  const TEMAS = {
    campo: { ceu: ["#3d8fe0", "#bfe6ff"], grama: ["#5fb34a", "#56a843"], zebra: ["#e63946", "#fff"], pista: ["#6b6b6b", "#666"], faixa: "#fff", nevoa: "#bfe6ff", morros: ["#7cc36a", "#5aa84a"], coisas: ["arvore", "arvore", "pinheiro", "placa", "flores"] },
    praia: { ceu: ["#1fa2ff", "#d9f6ff"], grama: ["#f2d58c", "#ebcd80"], zebra: ["#ff8a00", "#fff"], pista: ["#707070", "#6a6a6a"], faixa: "#fff", nevoa: "#d9f6ff", morros: ["#4fc3f7", "#29a3d8"], coisas: ["coqueiro", "coqueiro", "guarda-sol", "placa"] },
    noite: { ceu: ["#0b1030", "#2b2d6e"], grama: ["#2b3a2b", "#263426"], zebra: ["#ffd60a", "#333"], pista: ["#3b3b44", "#36363f"], faixa: "#ffd60a", nevoa: "#20224d", morros: ["#1b1d45", "#14163a"], coisas: ["predio", "predio", "poste", "predio"], noite: true },
    neve: { ceu: ["#8fb8d8", "#eef6ff"], grama: ["#f4f8ff", "#e8f0fa"], zebra: ["#2f80ed", "#fff"], pista: ["#7a7f86", "#757a81"], faixa: "#fff", nevoa: "#eef6ff", morros: ["#dfe9f5", "#c9d8ea"], coisas: ["pinheiro-neve", "pinheiro-neve", "boneco", "placa"] },
  };
  // Enfeites da beira da pista: [largura, altura] no mundo e o desenho
  function desenharEnfeite(tipo) {
    const cv = document.createElement("canvas"), c = cv.getContext("2d");
    const pronto = (w, h) => { cv.width = w; cv.height = h; return c; };
    if (tipo === "arvore") {
      pronto(160, 200);
      c.fillStyle = "#7a4a22"; c.fillRect(70, 120, 20, 80);
      [[80, 80, 62, "#3f9a3a"], [52, 104, 40, "#4cae45"], [110, 104, 40, "#4cae45"], [80, 56, 44, "#5cc254"]].forEach(([x, y, r, cor]) => { c.fillStyle = cor; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); });
    } else if (tipo === "pinheiro" || tipo === "pinheiro-neve") {
      pronto(120, 220);
      c.fillStyle = "#6b3e1f"; c.fillRect(52, 180, 16, 40);
      [[0, 190], [12, 140], [24, 92]].forEach(([d, y], i) => { c.fillStyle = ["#1f6b3a", "#26804a", "#2f9a58"][i]; c.beginPath(); c.moveTo(60, y - 90 + d); c.lineTo(110 - d, y); c.lineTo(10 + d, y); c.fill(); });
      if (tipo === "pinheiro-neve") { c.fillStyle = "#fff"; [[60, 34, 18], [60, 80, 26], [60, 128, 34]].forEach(([x, y, w]) => { c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x + w, y + 8); c.lineTo(x - w, y + 8); c.fill(); }); }
    } else if (tipo === "coqueiro") {
      pronto(180, 240);
      c.strokeStyle = "#8d5a2b"; c.lineWidth = 14; c.lineCap = "round"; c.beginPath(); c.moveTo(80, 240); c.quadraticCurveTo(70, 140, 100, 60); c.stroke();
      c.strokeStyle = "#2f9a3a"; c.lineWidth = 12;
      [[-70, 20], [-50, -30], [10, -50], [60, -20], [75, 30]].forEach(([dx, dy]) => { c.beginPath(); c.moveTo(100, 60); c.quadraticCurveTo(100 + dx * 0.5, 60 + dy - 20, 100 + dx, 60 + dy + 20); c.stroke(); });
      c.fillStyle = "#6b3e1f"; [[94, 70], [106, 72]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); });
    } else if (tipo === "guarda-sol") {
      pronto(160, 160);
      c.fillStyle = "#ddd"; c.fillRect(77, 50, 6, 110);
      ["#e63946", "#fff", "#2f80ed", "#fff", "#ffc21a"].forEach((cor, i) => { c.fillStyle = cor; c.beginPath(); c.moveTo(80, 10); c.arc(80, 60, 76, Math.PI + i * Math.PI / 5, Math.PI + (i + 1) * Math.PI / 5); c.fill(); });
    } else if (tipo === "predio") {
      const h = 220 + Math.floor(Math.random() * 3) * 60;
      pronto(150, h);
      c.fillStyle = ["#3b3f6b", "#4a3b6b", "#2f4b5b"][Math.floor(Math.random() * 3)]; c.fillRect(0, 0, 150, h);
      for (let y = 14; y < h - 20; y += 26) for (let x = 14; x < 140; x += 30) { c.fillStyle = Math.random() < 0.6 ? "#ffe680" : "#22264a"; c.fillRect(x, y, 16, 14); }
    } else if (tipo === "poste") {
      pronto(60, 240);
      c.fillStyle = "#555"; c.fillRect(26, 20, 8, 220); c.fillRect(26, 20, 30, 6);
      c.fillStyle = "#fff6b0"; c.beginPath(); c.arc(54, 30, 8, 0, 7); c.fill();
      c.fillStyle = "rgba(255,246,176,.25)"; c.beginPath(); c.arc(54, 30, 24, 0, 7); c.fill();
    } else if (tipo === "placa") {
      pronto(200, 150);
      c.fillStyle = "#666"; c.fillRect(30, 60, 10, 90); c.fillRect(160, 60, 10, 90);
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(4, 6, 192, 70, 10); c.fill();
      c.fillStyle = "#1d6fb8"; c.font = "bold 34px sans-serif"; c.textAlign = "center"; c.fillText(Motor.sortear(["VAI! 🏁", "ÉÉÉ! 🚗", "TURBO ⚡", "UAU! ⭐"]), 100, 54);
    } else if (tipo === "flores") {
      pronto(120, 60);
      for (let i = 0; i < 9; i++) { c.fillStyle = ["#ff70a6", "#ffd60a", "#fff"][i % 3]; c.beginPath(); c.arc(10 + i * 12, 30 + (i % 2) * 14, 7, 0, 7); c.fill(); }
    } else if (tipo === "boneco") {
      pronto(100, 150);
      c.fillStyle = "#fff"; [[50, 110, 38], [50, 58, 26]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.strokeStyle = "#cfdcea"; c.lineWidth = 2; c.stroke(); });
      c.fillStyle = "#222"; c.fillRect(30, 20, 40, 10); c.fillRect(38, 0, 24, 22);
      c.fillStyle = "#f77f00"; c.beginPath(); c.moveTo(50, 60); c.lineTo(70, 64); c.lineTo(50, 66); c.fill();
      c.fillStyle = "#222"; c.beginPath(); c.arc(42, 52, 3, 0, 7); c.arc(58, 52, 3, 0, 7); c.fill();
      c.strokeStyle = "#e63946"; c.lineWidth = 7; c.beginPath(); c.moveTo(28, 82); c.lineTo(72, 82); c.stroke();
    }
    return cv;
  }
  const TAM_ENFEITE = { arvore: 1300, pinheiro: 900, "pinheiro-neve": 900, coqueiro: 1300, "guarda-sol": 900, predio: 1800, poste: 500, placa: 1100, flores: 700, boneco: 650 };

  function corrida(area, op) {
    const tema = TEMAS[op.pista] || TEMAS.campo;
    const NIVEL = { facil: { max: 0.82, rivais: 0.7, auto: true }, normal: { max: 1, rivais: 0.86, auto: false }, dificil: { max: 1.12, rivais: 0.97, auto: false } }[op.nivel] || { max: 1, rivais: 0.86 };
    const sessao = Motor.sessaoAtual();
    let pausado = false;
    const DOIS = op.jogadores === "2"; // corrida a dois, com a tela dividida
    const T = montarTela(area, { dois: DOIS, aoPausar: () => alternarPausa() });
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(T.tela);

    // ----- Pista: segmentos com curva e altura -----
    const SEG = 200, LARGURA = 2000, FAIXAS = 3, ZEBRA = 3, VISTA = 180, ALT_CAMERA = 1000, FOV = 100;
    const PROF = 1 / Math.tan((FOV / 2) * Math.PI / 180);
    const segs = [];
    const ultimaY = () => (segs.length ? segs[segs.length - 1].p2.y : 0);
    const add = (curva, y) => { const n = segs.length; segs.push({ i: n, p1: { z: n * SEG, y: ultimaY() }, p2: { z: (n + 1) * SEG, y }, curva, carros: [], enfeites: [], cor: Math.floor(n / ZEBRA) % 2 }); };
    const suave = (a, b, p) => a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5);
    const trecho = (entra, fica, sai, curva, altura) => {
      const y0 = ultimaY(), y1 = y0 + altura * SEG, total = entra + fica + sai;
      for (let n = 0; n < entra; n++) add(curva * (n / entra) ** 2, suave(y0, y1, (n + 1) / total));
      for (let n = 0; n < fica; n++) add(curva, suave(y0, y1, (entra + n + 1) / total));
      for (let n = 0; n < sai; n++) add(curva * (1 - n / sai) ** 2, suave(y0, y1, (entra + fica + n + 1) / total));
    };
    trecho(15, 30, 15, 0, 0);
    trecho(25, 40, 25, 2, 20);
    trecho(20, 20, 20, 0, -20);
    trecho(25, 30, 25, -3, 0);
    trecho(15, 25, 15, 0, 40);
    trecho(25, 35, 25, 4, -20);
    trecho(20, 15, 20, -2, -20);
    trecho(15, 20, 15, 2, 20);
    trecho(25, 40, 25, -4, 0);
    trecho(20, 30, 20, 0, -40);
    trecho(30, 30, 40, 0, ultimaY() / -SEG); // volta à altura do começo
    const N = segs.length, VOLTA = N * SEG;
    // Largada e chegada (quadriculado)
    segs[2].largada = true; segs[3].largada = true;
    // Enfeites dos dois lados
    const imagens = {};
    const img = tipo => (imagens[tipo] = imagens[tipo] || desenharEnfeite(tipo));
    for (let n = 20; n < N - 10; n += 3 + Math.floor(Math.random() * 4)) {
      const lado = Math.random() < 0.5 ? -1 : 1, tipo = Motor.sortear(tema.coisas);
      segs[n].enfeites.push({ tipo, x: lado * (1.35 + Math.random() * 1.4) });
      if (Math.random() < 0.35) segs[n].enfeites.push({ tipo: Motor.sortear(tema.coisas), x: -lado * (1.4 + Math.random() * 1.6) });
    }

    // ----- Jogadores (1 ou 2, tela dividida) e adversários -----
    const VMAX = (SEG / (1 / 60)) * NIVEL.max;
    const CAM = ALT_CAMERA * PROF; // o carro do jogador fica esta distância à frente da câmera
    const EMOJI_COR = { vermelho: "🔴", azul: "🔵", amarelo: "🟡", verde: "🟢", rosa: "🩷", laranja: "🟠" };
    const cor1 = CORES[op.cor] ? op.cor : "vermelho", cor2 = cor1 === "azul" ? "laranja" : "azul";
    const novoJogador = (n, cor, ent) => {
      const hex = CORES[cor];
      return {
        n, cor, hex, tec: ent, ent, emoji: EMOJI_COR[cor],
        sprites: { reto: carroDeTras(hex, 0), esq: carroDeTras(hex, -1), dir: carroDeTras(hex, 1) },
        pos: 0, x: 0, vel: 0, voltas: 0, ceuDesl: 0, morroDesl: 0, sacode: 0, ultPos: 9, chegou: 0,
      };
    };
    const jog = DOIS ? [novoJogador(1, cor1, T.ent), novoJogador(2, cor2, T.ent2)] : [novoJogador(1, cor1, T.ent)];
    if (DOIS) { jog[0].x = -0.5; jog[1].x = 0.5; }
    const roncos = jog.map((j, i) => somDeMotor(DOIS ? (i ? 0.6 : -0.6) : 0));
    const usadas = jog.map(j => j.hex);
    const outrasCores = Object.values(CORES).filter(c => !usadas.includes(c));
    const rivais = outrasCores.slice(0, DOIS ? 4 : 5).map((cor, k) => ({
      cor, img: carroDeTras(cor), nome: ["Azulão", "Faísca", "Relâmpago", "Pipoca", "Trovão"][k],
      // largada: dois atrás do jogador (ainda na volta "-1") e os outros na frente
      x: [-0.5, 0.5][k % 2], z: k < 2 ? VOLTA - (k + 1) * 4 * SEG : (k - 1) * 4 * SEG, voltas: k < 2 ? -1 : 0,
      vel: VMAX * NIVEL.rivais * (0.93 + k * 0.025), chegou: 0,
    }));
    const TOTAL_CARROS = rivais.length + jog.length;
    let tempo = 0, fase = "largada", contagem = 3.6, chegada = 0, primeiraChegada = 0;
    const TOTAL_VOLTAS = 3;
    const segDe = z => segs[Math.floor(((z % VOLTA) + VOLTA) % VOLTA / SEG) % N];
    const progresso = (v, z) => v * VOLTA + z;
    const posicao = j => {
      const meu = progresso(j.voltas, j.pos);
      return 1 + rivais.filter(r => progresso(r.voltas, r.z) > meu).length + jog.filter(o => o !== j && progresso(o.voltas, o.pos) > meu).length;
    };
    const lugarDe = j => j.chegou || posicao(j);
    const relogio = () => `${Math.floor(tempo / 60)}:${String(Math.floor(tempo % 60)).padStart(2, "0")}`;

    // 2 jogadores: cada um lê o seu controle de videogame (o 1º e o 2º ligados), somado a teclado/toque
    let startAnt = false;
    function lerControles() {
      const ps = window.Controle ? Controle.pads() : [];
      jog.forEach((j, k) => {
        const p = ps[k], t = j.tec;
        if (!p) { j.ent = t; return; }
        const ax = p.eixo(0), ay = p.eixo(1);
        j.ent = {
          esq: t.esq || p.botao(14) || ax < -0.4,
          dir: t.dir || p.botao(15) || ax > 0.4,
          acel: t.acel || p.botao(0) || p.botao(2) || p.botao(7) || p.botao(12) || ay < -0.6,
          freio: t.freio || p.botao(13) || p.botao(6) || ay > 0.6,
        };
      });
      // Start do 2º controle pausa (o do 1º já chega como a tecla "p")
      const st = !!(ps[1] && ps[1].botao(9));
      if (st && !startAnt) alternarPausa();
      startAnt = st;
    }

    function moverJogador(j, dt) {
      const seg = segDe(j.pos + CAM), pv = j.vel / VMAX;
      const corre = fase === "correndo" && !j.chegou;
      if (DOIS && j.chegou) {
        // Já cruzou a chegada: segue devagar pela sua faixa, sem atrapalhar quem ainda corre
        j.vel += (VMAX * 0.45 - j.vel) * Math.min(1, dt);
        j.x += ((j.n === 1 ? -0.6 : 0.6) - j.x) * Math.min(1, dt * 1.5);
      } else {
        // Direção: vira mais rápido quando anda; nas curvas a força puxa para fora
        const dx = dt * 2.2 * pv;
        if (corre && j.ent.esq) j.x -= dx;
        if (corre && j.ent.dir) j.x += dx;
        j.x -= dx * pv * seg.curva * 0.28;
        const acelera = corre && (j.ent.acel || (NIVEL.auto && !j.ent.freio));
        if (acelera) j.vel += VMAX / 5 * dt;
        else if (j.ent.freio) j.vel -= VMAX * dt;
        else j.vel -= VMAX / 5 * dt;
        if (fase === "fim") j.vel -= VMAX / 3 * dt;
        // Fora da pista: mais devagar e sacudindo
        if (Math.abs(j.x) > 1.05) { if (j.vel > VMAX / 4) j.vel -= VMAX / 1.6 * dt; j.sacode = 1.5; } else j.sacode = 0;
        // Bateu num enfeite da beira
        seg.enfeites.forEach(e => { if (Math.abs(j.x - e.x) < 0.35 && Math.abs(e.x) > 1) { j.vel = VMAX / 5; j.x = e.x > 0 ? e.x - 0.5 : e.x + 0.5; Motor.ruido({ dur: 0.15, vol: 0.2, freq: 400 }); } });
        // Encostou num adversário (ou no outro jogador, que está na frente): perde velocidade
        rivais.forEach(r => {
          const dz = ((r.z - j.pos - CAM) % VOLTA + VOLTA) % VOLTA;
          if (j.vel > r.vel && dz < SEG * 1.2 && Math.abs(j.x - r.x) < 0.45) { j.vel = r.vel * 0.7; Motor.ruido({ dur: 0.12, vol: 0.15, freq: 900 }); }
        });
        jog.forEach(o => {
          if (o === j) return;
          const dz = ((o.pos - j.pos) % VOLTA + VOLTA) % VOLTA;
          if (j.vel > o.vel && dz > 0 && dz < SEG * 1.2 && Math.abs(j.x - o.x) < 0.45) { j.vel = o.vel * 0.7; Motor.ruido({ dur: 0.12, vol: 0.15, freq: 900 }); }
        });
      }
      j.x = Math.max(-2.6, Math.min(2.6, j.x));
      j.vel = Math.max(0, Math.min(VMAX, j.vel));
      j.pos += j.vel * dt;
      if (j.pos >= VOLTA) { j.pos -= VOLTA; j.voltas++; novaVolta(j); }
      j.ceuDesl += seg.curva * pv * dt * 0.012;
      j.morroDesl += seg.curva * pv * dt * 0.025;
    }

    function atualizar(dt) {
      if (fase === "largada") {
        const antes = Math.ceil(contagem);
        contagem -= dt;
        if (Math.ceil(contagem) !== antes && contagem > 0 && antes <= 3) { Motor.nota(440, { dur: 0.2, tipo: "square", vol: 0.08 }); Motor.falar(String(Math.ceil(contagem))); }
        if (contagem <= 0) { fase = "correndo"; Motor.nota(880, { dur: 0.4, tipo: "square", vol: 0.1 }); Motor.falar("Já!"); }
        return;
      }
      if (fase === "correndo" && contagem > -1.2) contagem -= dt; // o "JÁ!" fica um pouquinho na tela
      tempo += fase === "correndo" ? dt : 0;
      let pvMax = 0;
      jog.forEach(j => { const antes = j.pos; moverJogador(j, dt); if (antes !== j.pos) pvMax = Math.max(pvMax, j.vel / VMAX); });
      // Adversários: aceleram até a sua velocidade, freiam um pouco nas curvas e desviam
      const carrosJog = jog.map(j => ({ x: j.x, z: j.pos + CAM, v: j.vel }));
      rivais.forEach(r => {
        const sr = segDe(r.z), alvo = r.vel * (1 - Math.min(0.25, Math.abs(sr.curva) * 0.05)) * (r.chegou ? 0.4 : 1);
        r.v = (r.v || 0) + (alvo - (r.v || 0)) * Math.min(1, dt * 1.2);
        // desvia de quem está logo à frente (e dos jogadores)
        const frente = [...rivais.filter(o => o !== r), ...carrosJog].find(o => { const d = ((o.z - r.z) % VOLTA + VOLTA) % VOLTA; return d > 0 && d < SEG * 6 && Math.abs(o.x - r.x) < 0.5 && (o.v ?? o.vel) < r.v; });
        if (frente) r.x += (r.x > frente.x ? 1 : -1) * dt * 0.9;
        r.x = Math.max(-0.8, Math.min(0.8, r.x));
        r.z += r.v * dt;
        if (r.z >= VOLTA) { r.z -= VOLTA; r.voltas++; if (r.voltas >= TOTAL_VOLTAS && !r.chegou) r.chegou = ++chegada; }
      });
      // 2 jogadores: depois que o primeiro chega, o outro tem um tempinho para terminar
      if (DOIS && fase === "correndo" && primeiraChegada && tempo - primeiraChegada > 25) terminarDois();
    }
    const MEDALHA = l => (l === 1 ? "🥇" : l === 2 ? "🥈" : l === 3 ? "🥉" : "🏁");
    function novaVolta(j) {
      if (fase !== "correndo" || j.chegou) return;
      if (j.voltas >= TOTAL_VOLTAS) {
        j.chegou = posicao(j);
        if (!DOIS) { fimUmJogador(); return; }
        Motor.tim();
        Motor.falar(`Jogador ${j.n} chegou em ${j.chegou}º lugar!`);
        if (jog.every(o => o.chegou)) terminarDois();
        else if (!primeiraChegada) primeiraChegada = tempo;
      } else {
        Motor.tim();
        const msg = j.voltas === TOTAL_VOLTAS - 1 ? "Última volta" : `Volta ${j.voltas + 1}`;
        Motor.falar(DOIS ? `${msg}, jogador ${j.n}!` : msg + "!");
      }
    }
    function fimUmJogador() {
      fase = "fim";
      const lugar = jog[0].chegou;
      const t = relogio();
      const chave = `carros-recorde-${op.pista}`;
      let rec = 0; try { rec = +localStorage.getItem(chave) || 0; } catch (e) { /* ok */ }
      const novo = !rec || tempo < rec;
      if (novo) { try { localStorage.setItem(chave, tempo); } catch (e) { /* ok */ } }
      Motor.tim();
      Motor.falar(lugar === 1 ? "Você ganhou a corrida! Primeiro lugar!" : `Você chegou em ${lugar}º lugar! Muito bem!` + (novo ? " É o seu melhor tempo!" : ""));
      setTimeout(() => { if (vivo()) T.fim(lugar === 1 ? "Você venceu!" : `${lugar}º lugar!`, MEDALHA(lugar), `⏱️ ${t}` + (novo ? " · 🏆 melhor tempo!" : ""), () => corrida(area, op), () => JOGOS.find(j => j.id === "carros").iniciar(area)); }, 1200);
    }
    function terminarDois() {
      fase = "fim";
      jog.forEach(j => { if (!j.chegou) j.chegou = posicao(j); });
      const [a, b] = jog;
      const venc = a.chegou <= b.chegou ? a : b;
      Motor.tim();
      Motor.falar(`O jogador ${venc.n}, do carro ${venc.cor}, ganhou!` + (venc.chegou === 1 ? " E chegou em primeiro lugar na corrida!" : ""));
      const detalhe = jog.map(j => `${j.emoji} Jogador ${j.n}: ${MEDALHA(j.chegou)} ${j.chegou}º lugar`).join(" · ") + ` · ⏱️ ${relogio()}`;
      setTimeout(() => { if (vivo()) T.fim(`${venc.emoji} Jogador ${venc.n} venceu!`, "🏆", detalhe, () => corrida(area, op), () => JOGOS.find(j => j.id === "carros").iniciar(area)); }, 1200);
    }
    function alternarPausa() { if (fase !== "fim") { pausado = !pausado; T.pausa.textContent = pausado ? "▶️" : "⏸️"; } }

    // ----- Desenho -----
    const ctx = T.ctx;
    const misturar = (a, b, f) => { const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16)); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * f)).join(",")})`; };
    // Cor misturada com a névoa (guardada em cache: a tela dividida desenha a estrada duas vezes)
    const cacheNevoa = new Map();
    const nevoa = (c, f) => {
      const q = Math.round(f * 64), k = c + q;
      let r = cacheNevoa.get(k);
      if (!r) { r = misturar(c.replace("#", ""), tema.nevoa.replace("#", ""), q / 64); cacheNevoa.set(k, r); }
      return r;
    };
    const poligono = (pts, cor) => { ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fill(); };
    function projetar(p, camX, camY, camZ, W, H) {
      const cx = (p.x || 0) - camX, cy = p.y - camY, cz = p.z - camZ;
      p.escala = PROF / cz;
      p.sx = Math.round(W / 2 + p.escala * cx * W / 2);
      p.sy = Math.round(H / 2 - p.escala * cy * H / 2);
      p.sw = Math.round(p.escala * LARGURA * W / 2);
      p.cz = cz;
    }
    const virandoDe = e => (e.esq && !e.dir ? "esq" : e.dir && !e.esq ? "dir" : "reto");
    function desenhar() {
      const W = T.tam.w, H = T.tam.h;
      if (!W || !H) return;
      if (!DOIS) { desenharVista(jog[0], W, H); return; }
      // Tela dividida: cada metade é uma "vista" recortada, com a câmera do seu carro
      ctx.fillStyle = "#1d1d2b"; ctx.fillRect(0, 0, W, H);
      dividir(W, H).forEach(([vx, vy, vw, vh], k) => {
        ctx.save();
        ctx.beginPath(); ctx.rect(vx, vy, vw, vh); ctx.clip();
        ctx.translate(vx, vy);
        desenharVista(jog[k], vw, vh);
        ctx.restore();
      });
    }
    // Desenha a estrada vista da câmera do jogador `j`, num retângulo W × H (já transladado)
    function desenharVista(j, W, H) {
      const { pos, x } = j;
      // Céu e morros (com paralaxe nas curvas)
      const gc = ctx.createLinearGradient(0, 0, 0, H * 0.6);
      gc.addColorStop(0, tema.ceu[0]); gc.addColorStop(1, tema.ceu[1]);
      ctx.fillStyle = gc; ctx.fillRect(0, 0, W, H);
      if (tema.noite) { ctx.fillStyle = "#fff"; for (let i = 0; i < 50; i++) ctx.fillRect(((i * 97 + j.ceuDesl * 300) % W + W) % W, (i * 53) % (H * 0.45), 2, 2); ctx.fillStyle = "#f4f1c9"; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.16, 22, 0, 7); ctx.fill(); }
      else { ctx.fillStyle = "#fff6b0"; ctx.beginPath(); ctx.arc(W * 0.8, H * 0.15, 26, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.85)"; for (let i = 0; i < 4; i++) { const cx = ((i * 260 - j.ceuDesl * 400) % (W + 200) + W + 200) % (W + 200) - 100, cy = 40 + (i % 2) * 40; ctx.beginPath(); ctx.ellipse(cx, cy, 50, 16, 0, 0, 7); ctx.ellipse(cx + 26, cy - 10, 30, 16, 0, 0, 7); ctx.fill(); } }
      const segJ = segDe(pos + CAM), pj = ((pos + CAM) % SEG) / SEG;
      const yJ = segJ.p1.y + (segJ.p2.y - segJ.p1.y) * pj;
      const horiz = H / 2 + yJ / 30;
      [[tema.morros[0], 0.5, 70], [tema.morros[1], 1, 40]].forEach(([cor, par, amp]) => {
        ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(0, H);
        for (let i = 0; i <= W; i += 8) ctx.lineTo(i, horiz - amp * 0.5 - amp * 0.5 * Math.sin((i + j.morroDesl * 900 * par) / 90) - amp * 0.3 * Math.sin((i + j.morroDesl * 600 * par) / 37));
        ctx.lineTo(W, H); ctx.fill();
      });
      // Estrada: de perto para longe, cortando o que fica atrás dos morros (maxy)
      const base = segDe(pos), pBase = (pos % SEG) / SEG;
      let maxy = H, dx = -(base.curva * pBase), xc = 0;
      for (let n = 0; n < VISTA; n++) {
        const s = segs[(base.i + n) % N], volta = s.i < base.i ? VOLTA : 0;
        s.nevoa = Math.min(1, n / VISTA * 1.4);
        s.p1.x = 0; s.p2.x = 0;
        projetar(s.p1, x * LARGURA - xc, yJ + ALT_CAMERA, pos - volta, W, H);
        projetar(s.p2, x * LARGURA - xc - dx, yJ + ALT_CAMERA, pos - volta, W, H);
        xc += dx; dx += s.curva;
        s.clip = maxy;
        if (s.p1.cz <= PROF || s.p2.sy >= s.p1.sy || s.p2.sy >= maxy) continue;
        const { sx: x1, sy: y1, sw: w1 } = s.p1, { sx: x2, sy: y2, sw: w2 } = s.p2;
        const f = s.nevoa ** 2;
        const cor = c => (f > 0.02 ? nevoa(c, f) : c);
        ctx.fillStyle = cor(tema.grama[s.cor]); ctx.fillRect(0, y2, W, y1 - y2 + 1);
        const z1 = w1 / Math.max(6, 2 * FAIXAS), z2 = w2 / Math.max(6, 2 * FAIXAS);
        poligono([x1 - w1 - z1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - z2, y2], cor(tema.zebra[s.cor]));
        poligono([x1 + w1 + z1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + z2, y2], cor(tema.zebra[s.cor]));
        poligono([x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2], cor(tema.pista[s.cor]));
        if (s.largada) {
          const q = 8;
          for (let k = 0; k < q; k++) poligono([x1 - w1 + 2 * w1 * k / q, y1, x1 - w1 + 2 * w1 * (k + 1) / q, y1, x2 - w2 + 2 * w2 * (k + 1) / q, y2, x2 - w2 + 2 * w2 * k / q, y2], (k + s.i) % 2 ? "#111" : "#fff");
        } else if (s.cor) {
          const l1 = w1 / 32, l2 = w2 / 32;
          for (let k = 1; k < FAIXAS; k++) {
            const a1 = x1 - w1 + 2 * w1 * k / FAIXAS, a2 = x2 - w2 + 2 * w2 * k / FAIXAS;
            poligono([a1 - l1, y1, a1 + l1, y1, a2 + l2, y2, a2 - l2, y2], cor(tema.faixa));
          }
        }
        maxy = y1;
      }
      // Enfeites e carros, de longe para perto (cortados atrás dos morros)
      const coisa = (imagem, larguraMundo, escala, sx, sy, clip) => {
        const w = imagem.width * (larguraMundo / imagem.width) * escala * W / 2, h = w * imagem.height / imagem.width;
        const dxp = sx - w / 2, dyp = sy - h;
        const corte = Math.max(0, dyp + h - clip);
        if (corte >= h || w < 1) return;
        ctx.drawImage(imagem, 0, 0, imagem.width, imagem.height * (1 - corte / h), dxp, dyp, w, h - corte);
      };
      const carroNaPista = (imagem, s, z, xr) => {
        const pr = (z % SEG) / SEG;
        const esc = s.p1.escala + (s.p2.escala - s.p1.escala) * pr;
        const sx = s.p1.sx + (s.p2.sx - s.p1.sx) * pr + esc * xr * LARGURA * W / 2;
        const sy = s.p1.sy + (s.p2.sy - s.p1.sy) * pr;
        coisa(imagem, 560, esc, sx, sy, s.clip);
      };
      // O outro jogador (tela dividida) aparece como mais um carro na estrada
      const outros = [], atras = [];
      if (DOIS) jog.forEach(o => {
        if (o === j) return;
        const z = ((o.pos + CAM) % VOLTA + VOLTA) % VOLTA, d = ((o.pos - pos) % VOLTA + VOLTA) % VOLTA;
        (d < VOLTA / 2 ? outros : atras).push({ o, z, s: segDe(z), img: o.sprites[virandoDe(o.ent)] });
      });
      for (let n = VISTA - 1; n > 0; n--) {
        const s = segs[(base.i + n) % N];
        if (!s.p1.escala || s.p1.cz <= PROF) continue;
        s.enfeites.forEach(e => coisa(img(e.tipo), TAM_ENFEITE[e.tipo] || 1000, s.p1.escala, s.p1.sx + s.p1.escala * e.x * LARGURA * W / 2, s.p1.sy, s.clip));
        rivais.forEach(r => { if (segDe(r.z) === s) carroNaPista(r.img, s, r.z, r.x); });
        outros.forEach(c => { if (c.s === s) carroNaPista(c.img, s, c.z, c.o.x); });
      }
      // O seu carro
      const im = j.sprites[virandoDe(j.ent)];
      const cw = Math.min(W * 0.36, 260), ch = cw * im.height / im.width;
      const balanca = (j.sacode ? (Math.random() - 0.5) * 6 : 0) + Math.sin(tempo * 30) * (j.vel / VMAX) * 1.2;
      ctx.drawImage(im, W / 2 - cw / 2, H - ch - 8 + balanca, cw, ch);
      // O outro jogador logo atrás (entre a câmera e o seu carro) fica na frente do desenho
      atras.forEach(c => { if (c.s.p1.escala && c.s.p1.cz > PROF) carroNaPista(c.img, c.s, c.z, c.o.x); });
      // Contagem regressiva e mensagens
      const p = posicao(j);
      if (p < j.ultPos && fase === "correndo" && !j.chegou) Motor.nota(990, { dur: 0.12, tipo: "triangle", vol: 0.08 });
      j.ultPos = p;
      if (fase === "largada") {
        const n = Math.ceil(contagem);
        texto(n > 3 ? "Prepare-se!" : String(n), n > 3 ? 40 : 110, n === 1 ? "#2a9d55" : n === 2 ? "#ffc21a" : "#e63946", W, H);
      } else if (fase === "correndo" && contagem > -1.2) texto("JÁ!", 110, "#2a9d55", W, H);
      else if (DOIS && j.chegou) texto(`${MEDALHA(j.chegou)} ${j.chegou}º lugar!`, 48, "#ffd60a", W, H);
      if (DOIS) placarVista(j, W);
      if (pausado) texto("⏸️ Pausa", 50, "#fff", W, H);
    }
    // Tela dividida: placar de cada jogador no topo da sua metade
    function placarVista(j, W) {
      const lugar = lugarDe(j);
      const t = `${j.emoji} Jogador ${j.n} · ${MEDALHA(lugar)} ${lugar}º de ${TOTAL_CARROS} · Volta ${Math.min(j.voltas + 1, TOTAL_VOLTAS)}/${TOTAL_VOLTAS}`;
      let tam = 17;
      ctx.font = `bold ${tam}px Fredoka, sans-serif`;
      let l = ctx.measureText(t).width;
      if (l > W - 40) { tam = Math.max(12, Math.floor(tam * (W - 40) / l)); ctx.font = `bold ${tam}px Fredoka, sans-serif`; l = ctx.measureText(t).width; }
      const pw = l + 24, ph = tam + 16, px = W / 2 - pw / 2, py = 8;
      ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.beginPath(); ctx.roundRect(px, py, pw, ph, ph / 2); ctx.fill();
      ctx.strokeStyle = j.hex; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = "#222"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(t, W / 2, py + ph / 2 + 1);
    }
    function texto(t, tamanho, cor, W, H) {
      ctx.font = `bold ${Math.min(tamanho, W / 6)}px Fredoka, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 8; ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.strokeText(t, W / 2, H * 0.38);
      ctx.fillStyle = cor; ctx.fillText(t, W / 2, H * 0.38);
    }

    // ----- Laço -----
    let ultimo = performance.now(), infoAnt = "";
    function laco(t) {
      if (!vivo()) { T.desligar(); roncos.forEach(r => r.parar()); return; }
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      if (DOIS) lerControles();
      if (!pausado) atualizar(dt);
      jog.forEach((j, i) => {
        const quieto = pausado || !Motor.somLigado() || (fase === "fim" && j.vel < VMAX * 0.05);
        roncos[i].tocar(quieto ? null : j.vel / VMAX, !!(j.ent.acel || (NIVEL.auto && fase === "correndo" && !j.ent.freio)));
      });
      desenhar();
      let inf;
      if (DOIS) inf = `👥 Corrida a dois|${jog.map(j => `${j.emoji} ${lugarDe(j)}º`).join(" ")}|⏱️ ${relogio()}`;
      else {
        const j = jog[0], lugar = posicao(j);
        const kmh = Math.round(j.vel / VMAX * 220 * NIVEL.max);
        inf = `🏁 Volta ${Math.min(j.voltas + 1, TOTAL_VOLTAS)}/${TOTAL_VOLTAS}|${["", "🥇", "🥈", "🥉"][lugar] || "🚗"} ${lugar}º de ${TOTAL_CARROS}|💨 ${kmh} km/h|⏱️ ${relogio()}`;
      }
      if (inf !== infoAnt) { infoAnt = inf; T.mostrarInfo(inf.split("|")); }
      requestAnimationFrame(laco);
    }
    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.CARROS_TESTE) {
      window.CARROS_TESTE = {
        estado: () => ({ fase, VOLTA, jog: jog.map(j => ({ n: j.n, pos: j.pos, x: j.x, vel: j.vel, voltas: j.voltas, chegou: j.chegou, lugar: lugarDe(j) })) }),
        levar: (k, voltas, pos) => { jog[k].voltas = voltas; jog[k].pos = pos; },
      };
    }
    requestAnimationFrame(laco);
    if (DOIS) Motor.falar("Corrida a dois! Jogador 1 usa o primeiro controle ou as setas. Jogador 2 usa o segundo controle ou as letras W A S D.");
    else Motor.falar(NIVEL.auto ? "Corrida! O carro acelera sozinho: use as setas para virar." : "Corrida! Acelere, faça as curvas e passe os outros carros!");
  }

  // =====================================================================
  // 🏙️ Cidade (vista de cima)
  // =====================================================================
  function cidade(area, op) {
    const NIVEL = { facil: { vmax: 150, auto: false }, normal: { vmax: 210, auto: false }, dificil: { vmax: 270, auto: false } }[op.nivel] || { vmax: 210 };
    const sessao = Motor.sessaoAtual();
    let pausado = false;
    const T = montarTela(area, { aoPausar: () => { pausado = !pausado; T.pausa.textContent = pausado ? "▶️" : "⏸️"; } });
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(T.tela);
    const ctx = T.ctx;

    // ----- Mapa: ruas de 2 ladrilhos a cada 6; quarteirões com prédios, casas e praças -----
    const L = 48, CEL = 6, NT = 38, MUNDO = NT * L;
    const ehRua = i => i % CEL < 2;
    const rua = (cx, cy) => cx >= 0 && cy >= 0 && cx < NT && cy < NT && (ehRua(cx) || ehRua(cy));
    const noMundo = (x, y) => rua(Math.floor(x / L), Math.floor(y / L));
    const mapa = document.createElement("canvas");
    mapa.width = mapa.height = MUNDO;
    {
      const m = mapa.getContext("2d");
      m.fillStyle = "#6f7a83"; m.fillRect(0, 0, MUNDO, MUNDO);
      const rnd = Motor.aleatorio;
      for (let by = 0; by < NT; by += CEL) for (let bx = 0; bx < NT; bx += CEL) {
        const x0 = (bx + 2) * L, y0 = (by + 2) * L, t = (CEL - 2) * L;
        if (bx + 2 >= NT || by + 2 >= NT) continue;
        // calçada
        m.fillStyle = "#cfd4d8"; m.fillRect(x0, y0, t, t);
        const tipo = Motor.sortear(["predios", "predios", "casas", "casas", "praca"]);
        if (tipo === "praca") {
          m.fillStyle = "#6cc35a"; m.fillRect(x0 + 8, y0 + 8, t - 16, t - 16);
          m.fillStyle = "#e9d8a6"; m.fillRect(x0 + t / 2 - 8, y0 + 8, 16, t - 16); m.fillRect(x0 + 8, y0 + t / 2 - 8, t - 16, 16);
          m.fillStyle = "#4fc3f7"; m.beginPath(); m.arc(x0 + t / 2, y0 + t / 2, 22, 0, 7); m.fill();
          for (let k = 0; k < 10; k++) { const ax = x0 + 24 + rnd(0, t - 48), ay = y0 + 24 + rnd(0, t - 48); if (Math.abs(ax - x0 - t / 2) < 20 || Math.abs(ay - y0 - t / 2) < 20) continue; m.fillStyle = "#2f8f3a"; m.beginPath(); m.arc(ax, ay, 12, 0, 7); m.fill(); m.fillStyle = "#3fae4a"; m.beginPath(); m.arc(ax - 3, ay - 3, 7, 0, 7); m.fill(); }
        } else {
          const n = tipo === "predios" ? 2 : 3, lado = (t - 16) / n;
          for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
            const px = x0 + 8 + i * lado + 3, py = y0 + 8 + j * lado + 3, ld = lado - 6;
            if (tipo === "predios") {
              const cor = Motor.sortear(["#8d99ae", "#b56576", "#6d597a", "#457b9d", "#e5989b", "#a3b18a"]);
              m.fillStyle = "rgba(0,0,0,.25)"; m.fillRect(px + 6, py + 6, ld, ld);
              m.fillStyle = cor; m.fillRect(px, py, ld, ld);
              m.fillStyle = "rgba(255,255,255,.18)"; m.fillRect(px, py, ld, 6);
              m.fillStyle = "rgba(0,0,0,.18)"; m.fillRect(px + ld / 2 - 10, py + ld / 2 - 10, 20, 20);
              m.fillStyle = "#cfe9ff"; for (let k = 0; k < 4; k++) m.fillRect(px + 8 + k * (ld - 16) / 4, py + ld - 12, 6, 6);
            } else {
              m.fillStyle = "#8bd17c"; m.fillRect(px, py, ld, ld);
              const cor = Motor.sortear(["#e63946", "#f77f00", "#9b5de5", "#2a9d55", "#8d5524"]);
              m.fillStyle = cor; m.fillRect(px + 8, py + 8, ld - 16, ld - 16);
              m.fillStyle = "rgba(0,0,0,.2)"; m.fillRect(px + 8 + (ld - 16) / 2, py + 8, (ld - 16) / 2, ld - 16);
            }
          }
        }
      }
      // faixas no meio das ruas e faixas de pedestre
      m.strokeStyle = "#ffd60a"; m.lineWidth = 2; m.setLineDash([12, 12]);
      for (let i = 0; i < NT; i += CEL) {
        m.beginPath(); m.moveTo(0, (i + 1) * L); m.lineTo(MUNDO, (i + 1) * L); m.stroke();
        m.beginPath(); m.moveTo((i + 1) * L, 0); m.lineTo((i + 1) * L, MUNDO); m.stroke();
      }
      m.setLineDash([]);
      m.fillStyle = "#6f7a83";
      for (let j = 0; j < NT; j += CEL) for (let i = 0; i < NT; i += CEL) m.fillRect(i * L, j * L, 2 * L, 2 * L); // cruzamentos sem faixa
      m.fillStyle = "rgba(255,255,255,.85)";
      for (let j = 0; j < NT; j += CEL) for (let i = 0; i < NT; i += CEL) {
        for (let k = 0; k < 6; k++) {
          if (i + 2 < NT) m.fillRect((i + 2) * L + 2, j * L + 6 + k * 15, 8, 9);
          if (i - 1 >= 0) m.fillRect(i * L - 10, j * L + 6 + k * 15, 8, 9);
          if (j + 2 < NT) m.fillRect(i * L + 6 + k * 15, (j + 2) * L + 2, 9, 8);
          if (j - 1 >= 0) m.fillRect(i * L + 6 + k * 15, j * L - 10, 9, 8);
        }
      }
    }

    // ----- Semáforos: em cada cruzamento, verde para um sentido de cada vez -----
    const CICLO = 9, AMARELO = 2;
    const sinal = (i, j, eixo, t) => {
      const f = ((t + (i * 7 + j * 3) % CICLO) % (2 * CICLO));
      const horizontalVerde = f < CICLO;
      const fimFase = horizontalVerde ? CICLO - f : 2 * CICLO - f;
      const meu = eixo === "h" ? horizontalVerde : !horizontalVerde;
      return meu ? (fimFase < AMARELO ? "amarelo" : "verde") : "vermelho";
    };

    // ----- Jogador -----
    const meuCarro = CORES[op.cor] || CORES.vermelho;
    const eu = { x: (CEL * 3 + 0.5) * L, y: (CEL * 3 + 1.5) * L + L * 0, ang: 0, v: 0 };
    let tempo = 0, entregas = 0, moedas = 0, avisoSinal = 0, cruzamentoAnt = null;
    // ----- Trânsito: carros andando nas faixas da direita, virando nos cruzamentos -----
    const DIRS = { L: [1, 0], O: [-1, 0], S: [0, 1], N: [0, -1] };
    const faixaDe = (d, k) => (d === "L" ? (k + 1.5) * L : d === "O" ? (k + 0.5) * L : d === "N" ? (k + 1.5) * L : (k + 0.5) * L);
    const transito = [];
    const coresT = ["#2f80ed", "#ffc21a", "#2a9d55", "#9b5de5", "#e0e0e0", "#333", "#f77f00", "#8d5524"];
    for (let k = 0; k < 16; k++) {
      const d = Motor.sortear(["L", "O", "S", "N"]), r = CEL * Motor.aleatorio(0, Math.floor((NT - 2) / CEL));
      const ao = Motor.aleatorio(0, NT - 1) * L + L / 2;
      const c = d === "L" || d === "O" ? { x: ao, y: faixaDe(d, r) } : { x: faixaDe(d, r), y: ao };
      const tipo = k % 7 === 0 ? "onibus" : k % 5 === 0 ? "taxi" : "carro";
      transito.push({ ...c, d, ang: Math.atan2(DIRS[d][1], DIRS[d][0]), v: 0, vmax: tipo === "onibus" ? 70 : 90 + Math.random() * 30, cor: tipo === "taxi" ? "#ffd60a" : tipo === "onibus" ? "#e63946" : Motor.sortear(coresT), tipo, decidiu: null });
    }

    // ----- Missão: buscar o 📦 e levar até a 🏠 -----
    const pontoRua = () => {
      for (;;) {
        const i = CEL * Motor.aleatorio(0, Math.floor((NT - 2) / CEL)), k = Motor.aleatorio(2, NT - 3);
        if (k % CEL < 2) continue;
        return Math.random() < 0.5 ? { x: k * L + L / 2, y: i * L + L } : { x: i * L + L, y: k * L + L / 2 };
      }
    };
    let missao = { fase: "buscar", alvo: pontoRua() };
    const longe = () => { let p; do p = pontoRua(); while (Math.hypot(p.x - eu.x, p.y - eu.y) < MUNDO * 0.35); return p; };
    missao.alvo = longe();
    const estrelas = Array.from({ length: 25 }, () => ({ ...pontoRua(), pega: false }));

    function atualizar(dt) {
      tempo += dt;
      // ----- Carro do jogador: acelera, freia/ré, vira conforme a velocidade -----
      const e = T.ent;
      if (e.acel) eu.v += 260 * dt;
      else if (e.freio) eu.v -= (eu.v > 0 ? 420 : 160) * dt;
      else eu.v -= Math.sign(eu.v) * Math.min(Math.abs(eu.v), 140 * dt);
      eu.v = Math.max(-80, Math.min(NIVEL.vmax, eu.v));
      const giro = (e.dir ? 1 : 0) - (e.esq ? 1 : 0);
      eu.ang += giro * dt * 2.6 * Math.min(1, Math.abs(eu.v) / 60) * Math.sign(eu.v || 1);
      const nx = eu.x + Math.cos(eu.ang) * eu.v * dt, ny = eu.y + Math.sin(eu.ang) * eu.v * dt;
      const cantos = (x, y) => [[16, 8], [16, -8], [-16, 8], [-16, -8]].every(([a, b]) => noMundo(x + Math.cos(eu.ang) * a - Math.sin(eu.ang) * b, y + Math.sin(eu.ang) * a + Math.cos(eu.ang) * b));
      if (cantos(nx, ny)) { eu.x = nx; eu.y = ny; }
      else if (cantos(nx, eu.y)) { eu.x = nx; eu.v *= 0.9; }
      else if (cantos(eu.x, ny)) { eu.y = ny; eu.v *= 0.9; }
      else { if (Math.abs(eu.v) > 60) Motor.ruido({ dur: 0.12, vol: 0.18, freq: 500 }); eu.v *= -0.3; }
      // ----- Sinal vermelho: entrou num cruzamento no vermelho? A voz explica -----
      const ci = Math.floor(eu.x / L), cj = Math.floor(eu.y / L);
      const noCruz = ehRua(ci) && ehRua(cj);
      if (noCruz) {
        const id = `${ci - ci % CEL},${cj - cj % CEL}`;
        if (cruzamentoAnt !== id) {
          cruzamentoAnt = id;
          const eixo = Math.abs(Math.cos(eu.ang)) > Math.abs(Math.sin(eu.ang)) ? "h" : "v";
          if (Math.abs(eu.v) > 40 && sinal(ci - ci % CEL, cj - cj % CEL, eixo, tempo) === "vermelho" && tempo - avisoSinal > 6) {
            avisoSinal = tempo;
            Motor.falar("Opa! O sinal estava vermelho. No vermelho a gente para e espera o verde!");
          }
        }
      } else cruzamentoAnt = null;
      // ----- Trânsito -----
      transito.forEach(c => {
        const [dx, dy] = DIRS[c.d];
        // cruzamento à frente e a linha de parada
        const ao = dx ? c.x : c.y, faixa = dx ? c.y : c.x;
        const sentido = dx || dy;
        const proxBloco = sentido > 0 ? Math.ceil((ao + 1) / (CEL * L)) * CEL : Math.floor((ao - 1) / (CEL * L)) * CEL;
        const entrada = sentido > 0 ? proxBloco * L - 4 : (proxBloco + 2) * L + 4;
        const dist = (entrada - ao) * sentido;
        let alvo = c.vmax;
        const indoCruz = dist > 0 && dist < 70;
        if (indoCruz && sinal(proxBloco, proxBloco, dx ? "h" : "v", tempo) !== "verde" && !c.dentro) alvo = dist < 6 ? 0 : Math.min(alvo, dist * 1.4);
        // carro (ou o jogador) logo à frente na mesma faixa
        const frente = [...transito, { x: eu.x, y: eu.y, eu: true }].some(o => {
          if (o === c) return false;
          const rx = (o.x - c.x) * dx + (o.y - c.y) * dy, ry = Math.abs((o.x - c.x) * dy - (o.y - c.y) * dx);
          return rx > 0 && rx < (o.eu ? 60 : 50) && ry < 18;
        });
        if (frente) alvo = 0;
        c.v += Math.max(-300 * dt, Math.min(120 * dt, alvo - c.v));
        // dentro do cruzamento: decide virar (só uma vez por cruzamento)
        const bi = Math.floor(c.x / L), bj = Math.floor(c.y / L);
        c.dentro = ehRua(bi) && ehRua(bj);
        if (c.dentro) {
          const id = `${bi - bi % CEL},${bj - bj % CEL}`;
          if (c.decidiu !== id) {
            c.decidiu = id;
            const opcoes = ["reto", "reto", "esq", "dir"];
            c.vira = Motor.sortear(opcoes);
            const base = { L: { esq: "N", dir: "S" }, O: { esq: "S", dir: "N" }, N: { esq: "O", dir: "L" }, S: { esq: "L", dir: "O" } }[c.d];
            c.novo = c.vira === "reto" ? null : base[c.vira];
            c.bi = bi - bi % CEL; c.bj = bj - bj % CEL;
            // não vira para fora do mapa
            if (c.novo) { const [ndx, ndy] = DIRS[c.novo]; const tx = c.bi + ndx * CEL, ty = c.bj + ndy * CEL; if (tx < 0 || ty < 0 || tx >= NT - 1 || ty >= NT - 1) c.novo = null; }
          }
          if (c.novo) {
            const [ndx, ndy] = DIRS[c.novo];
            const coord = ndx ? faixaDe(c.novo, c.bj) : faixaDe(c.novo, c.bi);
            const atual = ndx ? c.y : c.x; // vira quando chega na faixa nova
            const passo = (dx || dy) * c.v * dt;
            if ((coord - atual) * (dx || dy) <= Math.abs(passo) + 0.5 || Math.abs(coord - (dx ? c.x : c.y)) < 1) {
              if (ndx) c.y = coord; else c.x = coord;
              if (dx) c.x = ndx ? c.x : faixaDe(c.novo, c.bi); else c.y = ndy ? c.y : faixaDe(c.novo, c.bj);
              c.d = c.novo; c.novo = null;
            }
          }
        }
        const [ex, ey] = DIRS[c.d];
        c.x += ex * c.v * dt; c.y += ey * c.v * dt;
        // fim do mapa: dá meia-volta pela outra faixa
        if (c.x < L || c.y < L || c.x > MUNDO - L || c.y > MUNDO - L) {
          const vira = { L: "O", O: "L", N: "S", S: "N" }[c.d];
          if (ex) c.y = faixaDe(vira, Math.floor(c.y / L) - (Math.floor(c.y / L) % CEL)); else c.x = faixaDe(vira, Math.floor(c.x / L) - (Math.floor(c.x / L) % CEL));
          c.x = Math.max(L + 1, Math.min(MUNDO - L - 1, c.x)); c.y = Math.max(L + 1, Math.min(MUNDO - L - 1, c.y));
          c.d = vira;
        }
        const alvoAng = Math.atan2(DIRS[c.d][1], DIRS[c.d][0]);
        let da = alvoAng - c.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
        c.ang += da * Math.min(1, dt * 8);
        // encostou no jogador: os dois param (sem estragos)
        if (Math.hypot(c.x - eu.x, c.y - eu.y) < 28) {
          const a = Math.atan2(eu.y - c.y, eu.x - c.x);
          if (cantos(eu.x + Math.cos(a) * 4, eu.y + Math.sin(a) * 4)) { eu.x += Math.cos(a) * 4; eu.y += Math.sin(a) * 4; }
          if (Math.abs(eu.v) > 50) { Motor.nota(330, { dur: 0.15, tipo: "square", vol: 0.06 }); }
          eu.v *= 0.4;
        }
      });
      // ----- Estrelas e missão -----
      estrelas.forEach(s => { if (!s.pega && Math.hypot(s.x - eu.x, s.y - eu.y) < 26) { s.pega = true; moedas++; Motor.nota(1046, { dur: 0.12, tipo: "triangle", vol: 0.1 }); } });
      if (Math.hypot(missao.alvo.x - eu.x, missao.alvo.y - eu.y) < 36 && Math.abs(eu.v) < 90) {
        if (missao.fase === "buscar") {
          missao = { fase: "levar", alvo: longe() };
          Motor.tim(); Motor.falar("Pegou a encomenda! Agora leve até a casinha. Siga a seta!");
        } else {
          entregas++; moedas += 5;
          Motor.comemorar(T.tela); Motor.tim();
          Motor.falar(`Entregue! Você já fez ${entregas} ${entregas === 1 ? "entrega" : "entregas"}! Vamos buscar outra encomenda.`);
          missao = { fase: "buscar", alvo: longe() };
        }
      }
      if (Math.abs(eu.v) > 5) Motor.nota(60 + Math.abs(eu.v) * 0.3, { dur: 0.05, tipo: "sawtooth", vol: 0.01 });
    }

    // ----- Desenho -----
    function desenhar() {
      const W = T.tam.w, H = T.tam.h;
      if (!W || !H) return;
      const zoom = Math.min(W, H) / (L * 7.5);
      const cx = eu.x + Math.cos(eu.ang) * eu.v * 0.25, cy = eu.y + Math.sin(eu.ang) * eu.v * 0.25;
      ctx.fillStyle = "#5aa84a"; ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
      ctx.drawImage(mapa, 0, 0);
      // semáforos (um em cada canto de cruzamento, com a cor de cada sentido)
      const vx0 = cx - W / 2 / zoom - L, vx1 = cx + W / 2 / zoom + L, vy0 = cy - H / 2 / zoom - L, vy1 = cy + H / 2 / zoom + L;
      for (let j = 0; j < NT; j += CEL) for (let i = 0; i < NT; i += CEL) {
        const x0 = i * L, y0 = j * L;
        if (x0 < vx0 - 2 * L || x0 > vx1 || y0 < vy0 - 2 * L || y0 > vy1) continue;
        const cor = s => (s === "verde" ? "#2bd65a" : s === "amarelo" ? "#ffd60a" : "#ff3b3b");
        const sh = cor(sinal(i, j, "h", tempo)), sv = cor(sinal(i, j, "v", tempo));
        [[x0 - 12, y0 + 2 * L + 4, sh], [x0 + 2 * L + 4, y0 - 12, sv], [x0 + 2 * L + 4, y0 + 2 * L + 4, sh], [x0 - 12, y0 - 12, sv]].forEach(([px, py, c]) => {
          ctx.fillStyle = "#222"; ctx.beginPath(); ctx.roundRect(px - 2, py - 2, 12, 12, 3); ctx.fill();
          ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px + 4, py + 4, 4, 0, 7); ctx.fill();
          ctx.fillStyle = c.replace(")", ",.25)").replace("rgb", "rgba"); // brilho (só no formato rgb)
        });
      }
      // estrelas e alvo da missão
      ctx.font = "22px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      estrelas.forEach(s => { if (!s.pega) ctx.fillText("⭐", s.x, s.y + Math.sin(tempo * 4 + s.x) * 2); });
      const pulsa = 1 + Math.sin(tempo * 5) * 0.12;
      ctx.save(); ctx.translate(missao.alvo.x, missao.alvo.y); ctx.scale(pulsa, pulsa);
      ctx.fillStyle = missao.fase === "buscar" ? "rgba(255,214,10,.45)" : "rgba(43,214,90,.45)";
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fill();
      ctx.font = "30px sans-serif"; ctx.fillText(missao.fase === "buscar" ? "📦" : "🏠", 0, 0);
      ctx.restore();
      // carros
      transito.forEach(c => { if (c.x < vx0 || c.x > vx1 || c.y < vy0 || c.y > vy1) return; ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang); carroDeCima(ctx, c.cor, c.tipo === "onibus" ? 64 : 36, c.tipo === "onibus" ? 20 : 18, c.tipo); ctx.restore(); });
      ctx.save(); ctx.translate(eu.x, eu.y); ctx.rotate(eu.ang); carroDeCima(ctx, meuCarro, 38, 19);
      if (missao.fase === "levar") { ctx.font = "14px sans-serif"; ctx.fillText("📦", -4, 0); }
      ctx.restore();
      ctx.restore();
      // seta para o alvo, na borda da tela
      const ax = missao.alvo.x - cx, ay = missao.alvo.y - cy, ang = Math.atan2(ay, ax), dist = Math.hypot(ax, ay);
      if (dist * zoom > Math.min(W, H) * 0.35) {
        const r = Math.min(W, H) * 0.38;
        ctx.save(); ctx.translate(W / 2 + Math.cos(ang) * r, H / 2 + Math.sin(ang) * r); ctx.rotate(ang);
        ctx.fillStyle = missao.fase === "buscar" ? "#ffc21a" : "#2bd65a"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-12, -18); ctx.lineTo(-4, 0); ctx.lineTo(-12, 18); ctx.closePath(); ctx.stroke(); ctx.fill();
        ctx.restore();
      }
      if (pausado) { ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.font = "bold 40px Fredoka, sans-serif"; ctx.textAlign = "center"; ctx.fillText("⏸️ Pausa", W / 2, H / 2); }
    }

    let ultimo = performance.now(), infoAnt = "";
    const ronco = somDeMotor();
    function laco(t) {
      if (!vivo()) { T.desligar(); ronco.parar(); return; }
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      if (!pausado) atualizar(dt);
      ronco.tocar(pausado || !Motor.somLigado() ? null : Math.abs(eu.v) / NIVEL.vmax, !!(T.ent.acel || T.ent.freio && eu.v < 0));
      desenhar();
      const dist = Math.round(Math.hypot(missao.alvo.x - eu.x, missao.alvo.y - eu.y) / 12);
      const inf = `${missao.fase === "buscar" ? "📦 Buscar" : "🏠 Entregar"}: ${dist} m|✅ ${entregas} entregas|⭐ ${moedas}`;
      if (inf !== infoAnt) { infoAnt = inf; T.mostrarInfo(inf.split("|")); }
      requestAnimationFrame(laco);
    }
    requestAnimationFrame(laco);
    Motor.falar("Passeio na cidade! Siga a seta amarela para buscar a encomenda. E atenção aos semáforos!");
  }
})();
