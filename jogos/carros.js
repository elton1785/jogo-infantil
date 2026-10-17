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
    // alto-falante de celular quase não toca graves: um "rosnado" mais agudo leva o ronco até ele
    const o3 = a.createOscillator(), g3 = a.createGain();
    o3.type = "square"; g3.gain.value = 0.22;
    o3.connect(g3).connect(filtro);
    const lfo = a.createOscillator(), lfoG = a.createGain();
    lfoG.gain.value = 0.35;
    lfo.connect(lfoG).connect(pulso.gain);
    [o1, o2, o3, lfo].forEach(o => o.start(t0));
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
        o3.frequency.setTargetAtTime(f * 3.01, t, 0.06);
        lfo.frequency.setTargetAtTime(f / 2, t, 0.06);
        filtro.frequency.setTargetAtTime(650 + pv * 1500 + (acelerando ? 450 : 0), t, 0.08);
        saida.gain.setTargetAtTime((0.07 + pv * 0.06) * (acelerando ? 1.25 : 0.85), t, 0.08);
      },
      parar() {
        if (parado) return;
        parado = true;
        document.removeEventListener("visibilitychange", aoEsconder);
        const t = a.currentTime;
        saida.gain.setTargetAtTime(0, t, 0.05);
        [o1, o2, o3, lfo].forEach(o => { try { o.stop(t + 0.4); } catch (e) { /* ok */ } });
      },
    };
  }

  JOGOS.push({
    id: "carros", teclas: true,
    nome: "Pé na Estrada",
    icone: ICONE,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: "🏁🏎️🏙️", texto: "Escolha: corrida contra outros carros, Grande Prêmio com carros de fórmula nos autódromos, ou passear pela cidade fazendo entregas." },
      { figura: "⬅️➡️", texto: "Os botões da esquerda viram o carro. No controle de videogame, use o direcional." },
      { figura: "⛽🛑", texto: "Os botões da direita aceleram e freiam (segurando o freio, dá ré). No modo fácil o carro acelera sozinho." },
      { figura: "🥇", texto: "Você escolhe quantas voltas! Passe os outros carros e não saia da pista, que na grama o carro fica lento. Cada pista tem o seu traçado." },
      { figura: "🏎️🏟️", texto: "No Grande Prêmio, os carros são de fórmula e as pistas são autódromos: Interlagos (com morros), Mônaco (ruas estreitas) e Monza (a mais rápida)." },
      { figura: "🚦🔴", texto: "Na largada, as 5 luzes vermelhas acendem uma por uma. Quando ficam verdes, é JÁ!" },
      { figura: "⚡", texto: "Passe por cima das setas amarelas na pista para ganhar turbo e correr mais que todo mundo!" },
      { figura: "👥🎮🎮", texto: "Corrida a dois: a tela se divide e cada um tem a sua estrada e os seus botões. Jogador 1 usa o 1º controle (ou as setas e Enter); jogador 2 usa o 2º controle (ou W A S D e F)." },
      { figura: "📦➜🏠", texto: "Na cidade, siga a seta: busque a encomenda e leve até a casinha. Pegue as estrelas pelo caminho!" },
      { figura: "🚦", texto: "Respeite os semáforos: no vermelho a gente para e espera o verde, como os outros carros." },
    ],
    iniciar(area, faixa) { escolhas(area, faixa); },
  });

  // ---------- Escolhas, uma tela de cada vez, com figuras (Motor.telaOpcoes) ----------
  // modo → jogadores → nome do piloto (teclado da tela) → carro de cada jogador → pista → jeito de dirigir.
  const NOMES_PILOTOS = ["Tico", "Bia", "Léo", "Duda", "Juca", "Nina", "Caio", "Lara", "Zeca", "Malu", "Davi", "Iara", "Rafa", "Teca", "Gabi", "Beto", "Lulu", "Theo", "Mel", "Dudu"];
  const NOMES_COR = { vermelho: "Vermelho", azul: "Azul", amarelo: "Amarelo", verde: "Verde", rosa: "Rosa", laranja: "Laranja" };
  const NOMES_PISTA = { campo: "Campo", praia: "Praia", noite: "Cidade à noite", neve: "Neve",
    interlagos: "Interlagos (São Paulo)", monaco: "Mônaco (ruas da cidade)", monza: "Monza (a mais rápida)" };
  function escolhas(area, faixa) {
    const fid = (faixa && faixa.id) || "6-8";
    const perfil = typeof Album !== "undefined" ? Album.perfilAtual().nome : "";
    const corrida_ = op => op.modo === "corrida" || op.modo === "gp", gp = op => op.modo === "gp", comum = op => op.modo === "corrida";
    const dois = op => corrida_(op) && op.jogadores === "2";
    const cores = (exceto, formula) => Object.keys(CORES).filter(k => k !== exceto).map(k => [k, NOMES_COR[k], () => figuraCarro(k, formula)]);
    Motor.telaOpcoes(area, {
      chave: `carros-${fid}`,
      padrao: { modo: "corrida", jogadores: "1", cor: "vermelho", cor2: "azul", pista: "campo", circuito: "interlagos", voltas: "3", nivel: fid === "5-6" ? "facil" : "normal", nome1: perfil === "Visitante" ? "" : perfil, nome2: "" },
      opcoes: [
        { chave: "modo", titulo: "O que vamos fazer?", valores: [["corrida", "Corrida", op => figuraCena("campo", [CORES[op.cor]])], ["gp", "Grande Prêmio", op => figuraCena("interlagos", [CORES[op.cor]], false, true)], ["cidade", "Passear na cidade", op => figuraCidade(op.cor)]] },
        { chave: "jogadores", titulo: "Quantos jogadores?", quando: corrida_, valores: [["1", "1 jogador", op => figuraCena("campo", [CORES[op.cor]])], ["2", "2 jogadores", () => figuraCena("campo", [CORES.vermelho, CORES.azul], true)]] },
        { chave: "nome1", tipo: "texto", quando: corrida_, titulo: op => (dois(op) ? "Nome do jogador 1" : "Qual é o nome do piloto?"), dica: op => (dois(op) ? "Jogador 1" : "Você") },
        { chave: "nome2", tipo: "texto", quando: dois, titulo: "Nome do jogador 2", dica: "Jogador 2" },
        { chave: "cor", titulo: op => (dois(op) ? "Carro do jogador 1" : "Escolha o seu carro"), valores: op => cores(undefined, gp(op)) },
        { chave: "cor2", titulo: "Carro do jogador 2", quando: dois, valores: op => cores(op.cor, gp(op)) },
        { chave: "pista", titulo: "Escolha a pista", quando: comum, valores: () => Object.keys(TEMAS).filter(k => !TEMAS[k].gp).map(k => [k, NOMES_PISTA[k], () => figuraCena(k, [])]) },
        { chave: "circuito", titulo: "Escolha o autódromo", quando: gp, valores: () => Object.keys(TEMAS).filter(k => TEMAS[k].gp).map(k => [k, NOMES_PISTA[k], () => figuraCena(k, [], false, true)]) },
        { chave: "voltas", titulo: "Quantas voltas?", quando: corrida_, valores: op => (gp(op) ? ["3", "5", "8"] : ["1", "3", "5"]).map(v => [v, `${v} ${v === "1" ? "volta" : "voltas"}`]) },
        { chave: "nivel", titulo: "Jeito de dirigir", valores: [["facil", "🐢 Fácil"], ["normal", "🐇 Normal"], ["dificil", "🚀 Rápido"]] },
      ],
      aoJogar: op => (op.modo === "cidade" ? cidade : corrida)(area, { ...op, fid, pista: op.modo === "gp" ? op.circuito : op.pista }),
    });
  }
  // Figuras dos cartões: o carro de verdade, a pista com a paisagem e a cidade vista de cima
  function figuraCarro(cor, formula) {
    const cv = (formula ? formulaDeTras : carroDeTras)(CORES[cor]);
    cv.className = "fig-carro";
    return cv;
  }
  function figuraCena(pista, carros, dividida = false, formula = false) {
    const W = 240, H = 150, cv = document.createElement("canvas");
    cv.width = W; cv.height = H; cv.className = "fig-cena";
    const c = cv.getContext("2d"), tm = TEMAS[pista];
    const metade = (x0, w, carro) => {
      c.save(); c.beginPath(); c.rect(x0, 0, w, H); c.clip(); c.translate(x0, 0);
      const hz = H * 0.48, g = c.createLinearGradient(0, 0, 0, hz);
      g.addColorStop(0, tm.ceu[0]); g.addColorStop(1, tm.ceu[1]);
      c.fillStyle = g; c.fillRect(0, 0, w, hz);
      if (tm.noite) { c.fillStyle = "#fff"; for (let i = 0; i < 14; i++) c.fillRect((i * 37) % w, (i * 23) % (hz * 0.8), 1.5, 1.5); }
      c.fillStyle = tm.morros[0];
      c.beginPath(); c.ellipse(w * 0.2, hz, w * 0.32, H * 0.2, 0, Math.PI, 0); c.ellipse(w * 0.78, hz, w * 0.36, H * 0.24, 0, Math.PI, 0); c.fill();
      c.fillStyle = tm.grama[0]; c.fillRect(0, hz, w, H - hz);
      const rua = (lx, cor) => { c.fillStyle = cor; c.beginPath(); c.moveTo(w / 2 - lx * w * 0.06, hz); c.lineTo(w / 2 + lx * w * 0.06, hz); c.lineTo(w / 2 + lx * w * 0.62, H); c.lineTo(w / 2 - lx * w * 0.62, H); c.fill(); };
      rua(1.22, tm.zebra[0]); rua(1.08, tm.zebra[1]); rua(1, tm.pista[0]);
      c.strokeStyle = tm.faixa; c.lineWidth = 3; c.setLineDash([10, 10]);
      c.beginPath(); c.moveTo(w / 2, hz + 4); c.lineTo(w / 2, H); c.stroke(); c.setLineDash([]);
      // enfeites dos dois lados
      [[0.12, 0.62, 0.34], [0.88, 0.66, 0.38], [0.3, 0.52, 0.18], [0.72, 0.53, 0.2]].forEach(([fx, fy, tam], i) => {
        const im = desenharEnfeite(tm.coisas[i % tm.coisas.length]), hh = H * tam, ww = hh * im.width / im.height;
        c.drawImage(im, fx * w - ww / 2, fy * H - hh * 0.6, ww, hh);
      });
      if (carro) { const im = (formula ? formulaDeTras : carroDeTras)(carro), cw = Math.min(w * 0.6, 130), ch = cw * im.height / im.width; c.drawImage(im, w / 2 - cw / 2, H - ch - 4, cw, ch); }
      c.restore();
    };
    if (dividida) { metade(0, W / 2 - 2, carros[0]); metade(W / 2 + 2, W / 2 - 2, carros[1]); c.fillStyle = "#1d1d2b"; c.fillRect(W / 2 - 2, 0, 4, H); }
    else metade(0, W, carros[0]);
    return cv;
  }
  function figuraCidade(cor) {
    const W = 240, H = 150, cv = document.createElement("canvas");
    cv.width = W; cv.height = H; cv.className = "fig-cena";
    const c = cv.getContext("2d");
    c.fillStyle = "#7cc36a"; c.fillRect(0, 0, W, H);
    c.fillStyle = "#5c5c66"; c.fillRect(0, 58, W, 40); c.fillRect(150, 0, 40, H);
    c.strokeStyle = "#ffd60a"; c.lineWidth = 2; c.setLineDash([8, 8]);
    c.beginPath(); c.moveTo(0, 78); c.lineTo(150, 78); c.moveTo(190, 78); c.lineTo(W, 78); c.moveTo(170, 0); c.lineTo(170, 58); c.moveTo(170, 98); c.lineTo(170, H); c.stroke(); c.setLineDash([]);
    [[10, 8, "#e9c46a"], [62, 10, "#90caf9"], [10, 108, "#f4a261"], [80, 110, "#ff8fab"], [200, 8, "#b39ddb"], [200, 110, "#e9c46a"]].forEach(([x, y, k]) => {
      c.fillStyle = "rgba(0,0,0,.2)"; c.fillRect(x + 4, y + 4, 40, 36);
      c.fillStyle = k; c.fillRect(x, y, 40, 36);
      c.fillStyle = "rgba(255,255,255,.7)"; for (let i = 0; i < 3; i++) for (let jj = 0; jj < 2; jj++) c.fillRect(x + 6 + i * 12, y + 6 + jj * 14, 7, 8);
    });
    c.save(); c.translate(80, 78); carroDeCima(c, CORES[cor] || CORES.vermelho, 44, 22); c.restore();
    c.font = "26px sans-serif"; c.textAlign = "center"; c.fillText("📦", 215, 84);
    return cv;
  }

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
      b.addEventListener("pointerdown", e => { e.preventDefault(); Motor.audio(); try { b.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } liga(true); });
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
    // `lista`: classificação final [{ nome, hex, j }] (j = jogador, fica destacado)
    const fim = (titulo, medalha, detalhe, aoDeNovo, aoOpcoes, lista, rotuloDeNovo = "🔁 Correr de novo") => {
      const caixa = document.createElement("div");
      caixa.className = "arcade-fim" + (lista ? " carros-fim" : "");
      caixa.innerHTML = `<div class="medalha-fim"></div><div class="titulo-fim"></div><div class="detalhe-fim"></div>`;
      caixa.querySelector(".medalha-fim").textContent = medalha;
      caixa.querySelector(".titulo-fim").textContent = titulo;
      caixa.querySelector(".detalhe-fim").textContent = detalhe;
      if (lista) {
        const ol = document.createElement("ol");
        ol.className = "carros-classif";
        const montar = () => { ol.innerHTML = ""; (typeof lista === "function" ? lista() : lista).forEach((c, i) => {
          const li = document.createElement("li");
          if (c.j) li.className = "eu";
          li.style.setProperty("--cor", c.hex);
          li.innerHTML = `<b></b><i></i><span></span><small></small><em></em>`;
          li.querySelector("b").textContent = i + 1;
          li.querySelector("span").textContent = c.nome;
          li.querySelector("small").textContent = c.txt || "";
          if (!c.tempo && c.txt) li.classList.add("correndo");
          li.querySelector("em").textContent = c.tempo ? ["🥇", "🥈", "🥉"][i] || "" : "";
          ol.appendChild(li);
        }); };
        montar();
        // os carros de trás ainda estão chegando: a lista vai ganhando os tempos
        if (typeof lista === "function") { const iv = setInterval(() => { if (!document.contains(ol)) clearInterval(iv); else montar(); }, 300); }
        caixa.appendChild(ol);
      }
      const b = Object.assign(document.createElement("button"), { className: "chip executar", textContent: rotuloDeNovo });
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
  // Carro visto de trás (corrida), num canvas próprio; `curva` -1..1 inclina para o lado,
  // `freio` acende forte as lanternas e `fase` (0/1) mexe os sulcos dos pneus e a calota (rodas girando)
  function carroDeTras(cor, curva = 0, freio = false, fase = 0) {
    const W = 220, H = 130, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    c.translate(W / 2, H);
    const sk = curva * 10;
    // sombra no chão (mais escura no meio)
    const gs = c.createRadialGradient(0, 0, 10, 0, 0, 108);
    gs.addColorStop(0, "rgba(0,0,0,.5)"); gs.addColorStop(1, "rgba(0,0,0,0)");
    c.save(); c.translate(0, -7); c.scale(1, 0.14); c.fillStyle = gs; c.beginPath(); c.arc(0, 0, 108, 0, 7); c.fill(); c.restore();
    // pneus com sulcos e uma pontinha da calota aparecendo do lado de fora
    [-1, 1].forEach(l => {
      const px = l < 0 ? -100 : 70;
      const gp = c.createLinearGradient(px, 0, px + 30, 0);
      gp.addColorStop(0, "#111"); gp.addColorStop(0.5, "#2e2e2e"); gp.addColorStop(1, "#111");
      c.fillStyle = gp; c.beginPath(); c.roundRect(px, -44, 30, 40, 7); c.fill();
      c.fillStyle = "rgba(0,0,0,.55)";
      for (let y = -42 + fase * 4; y < -6; y += 8) c.fillRect(px + 4, y, 22, 2);
      const hx = l * 101 - l * curva * 3;
      c.fillStyle = "#9aa3ad"; c.beginPath(); c.ellipse(hx, -24, 4, 13, 0, 0, 7); c.fill();
      c.strokeStyle = "#5b636c"; c.lineWidth = 1.5; c.beginPath();
      for (let k = 0; k < 3; k++) { const a = (k / 3 + fase / 6) * Math.PI * 2; c.moveTo(hx, -24); c.lineTo(hx + Math.cos(a) * 3, -24 + Math.sin(a) * 11); }
      c.stroke();
    });
    // carroceria: degradê de cima (luz do céu) para baixo
    const corpo = () => {
      c.beginPath();
      c.moveTo(-96, -22); c.lineTo(-92, -58); c.quadraticCurveTo(-88, -66, -76, -68);
      c.lineTo(-56 + sk, -70); c.lineTo(-40 + sk, -104); c.lineTo(40 + sk, -104); c.lineTo(56 + sk, -70);
      c.lineTo(76, -68); c.quadraticCurveTo(88, -66, 92, -58); c.lineTo(96, -22); c.quadraticCurveTo(96, -14, 86, -14);
      c.lineTo(-86, -14); c.quadraticCurveTo(-96, -14, -96, -22); c.closePath();
    };
    const g = c.createLinearGradient(0, -104, 0, -14);
    g.addColorStop(0, clarear(cor, 0.35)); g.addColorStop(0.42, clarear(cor, 0.05)); g.addColorStop(0.5, cor); g.addColorStop(1, clarear(cor, -0.4));
    c.fillStyle = g; corpo(); c.fill();
    // brilho lateral (volume) e contorno
    c.save(); corpo(); c.clip();
    const gl = c.createLinearGradient(-96, 0, 96, 0);
    gl.addColorStop(0, "rgba(0,0,0,.28)"); gl.addColorStop(0.18, "rgba(0,0,0,0)"); gl.addColorStop(0.82, "rgba(0,0,0,0)"); gl.addColorStop(1, "rgba(0,0,0,.28)");
    c.fillStyle = gl; c.fillRect(-100, -110, 200, 100);
    c.fillStyle = "rgba(255,255,255,.35)"; c.fillRect(-90, -66, 180, 2.5);   // vinco de luz na tampa
    c.fillStyle = "rgba(0,0,0,.55)"; c.fillRect(-100, -26, 200, 14);          // para-choque/difusor
    c.restore();
    c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 3; corpo(); c.stroke();
    // vidro de trás com moldura e reflexo do céu
    c.fillStyle = "#1a1f26";
    c.beginPath(); c.moveTo(-37 + sk, -101); c.lineTo(37 + sk, -101); c.lineTo(50 + sk, -72); c.lineTo(-50 + sk, -72); c.closePath(); c.fill();
    const v = c.createLinearGradient(0, -98, 0, -74);
    v.addColorStop(0, "#bfe3ff"); v.addColorStop(0.45, "#5f8fbf"); v.addColorStop(1, "#1f3550");
    c.fillStyle = v;
    c.beginPath(); c.moveTo(-34 + sk, -98); c.lineTo(34 + sk, -98); c.lineTo(46 + sk, -74); c.lineTo(-46 + sk, -74); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.38)";
    c.beginPath(); c.moveTo(-14 + sk, -98); c.lineTo(2 + sk, -98); c.lineTo(-14 + sk, -74); c.lineTo(-30 + sk, -74); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(8 + sk, -98); c.lineTo(13 + sk, -98); c.lineTo(-1 + sk, -74); c.lineTo(-6 + sk, -74); c.closePath(); c.fill();
    // aerofólio com sombra embaixo
    c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(-82, -68, 164, 4);
    c.fillStyle = clarear(cor, -0.5); c.fillRect(-70, -70, 6, 8); c.fillRect(64, -70, 6, 8);
    const ga = c.createLinearGradient(0, -77, 0, -68);
    ga.addColorStop(0, clarear(cor, 0.1)); ga.addColorStop(1, clarear(cor, -0.55));
    c.fillStyle = ga; c.beginPath(); c.roundRect(-86, -77, 172, 9, 3); c.fill();
    // lanternas: acesas fracas, ou fortes com brilho ao frear (e a luz de freio no aerofólio)
    if (freio) {
      [-69, 69].forEach(x => {
        const gb = c.createRadialGradient(x, -50, 4, x, -50, 30);
        gb.addColorStop(0, "rgba(255,70,50,.75)"); gb.addColorStop(1, "rgba(255,40,30,0)");
        c.fillStyle = gb; c.fillRect(x - 32, -82, 64, 64);
      });
    }
    [[-86, -56], [52, -56]].forEach(([x, y]) => {
      c.fillStyle = "#3a0606"; c.beginPath(); c.roundRect(x - 1, y - 1, 36, 14, 5); c.fill();
      const gt = c.createLinearGradient(0, y, 0, y + 12);
      gt.addColorStop(0, freio ? "#ff9a8a" : "#e0302a"); gt.addColorStop(1, freio ? "#ff2a1a" : "#7a0e0e");
      c.fillStyle = gt; c.beginPath(); c.roundRect(x, y, 34, 12, 4); c.fill();
      c.fillStyle = freio ? "#fff" : "#ff8a80"; c.fillRect(x + 6, y + 3, 22, freio ? 5 : 3);
    });
    if (freio) { c.fillStyle = "#ff3b2b"; c.fillRect(-16 + sk, -77, 32, 3); c.fillStyle = "#fff"; c.fillRect(-10 + sk, -76, 20, 1); }
    // placa e escapamentos cromados
    c.fillStyle = "rgba(0,0,0,.35)"; c.beginPath(); c.roundRect(-26, -46, 52, 20, 3); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.roundRect(-24, -44, 48, 16, 3); c.fill();
    c.fillStyle = "#1d6fb8"; c.fillRect(-24, -44, 48, 4);
    c.fillStyle = "#333"; c.font = "bold 10px sans-serif"; c.textAlign = "center"; c.fillText("BR 2026", 0, -31);
    [-62, -48].forEach(x => {
      c.fillStyle = "#c9d0d6"; c.beginPath(); c.ellipse(x, -19, 6, 5, 0, 0, 7); c.fill();
      c.fillStyle = "#222"; c.beginPath(); c.ellipse(x, -19, 3.6, 3, 0, 0, 7); c.fill();
    });
    return cv;
  }
  // Carro de fórmula visto de trás (Grande Prêmio): rodas grandes de fora, asa traseira alta,
  // capa do motor estreita com a barbatana, o capacete do piloto e o halo, e a luz vermelha no meio
  function formulaDeTras(cor, curva = 0, freio = false, fase = 0) {
    const W = 220, H = 130, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    c.translate(W / 2, H);
    const sk = curva * 8;
    const gs = c.createRadialGradient(0, 0, 10, 0, 0, 112);
    gs.addColorStop(0, "rgba(0,0,0,.5)"); gs.addColorStop(1, "rgba(0,0,0,0)");
    c.save(); c.translate(0, -6); c.scale(1, 0.13); c.fillStyle = gs; c.beginPath(); c.arc(0, 0, 112, 0, 7); c.fill(); c.restore();
    // braços da suspensão
    c.strokeStyle = "#222"; c.lineWidth = 4;
    [-1, 1].forEach(l => { c.beginPath(); c.moveTo(l * 30, -36); c.lineTo(l * 70, -40); c.moveTo(l * 30, -22); c.lineTo(l * 70, -22); c.stroke(); });
    // pneus traseiros largos, de fora da carroceria
    [-1, 1].forEach(l => {
      const px = l < 0 ? -110 : 66;
      const gp = c.createLinearGradient(px, 0, px + 44, 0);
      gp.addColorStop(0, "#0d0d0d"); gp.addColorStop(0.5, "#2e2e2e"); gp.addColorStop(1, "#0d0d0d");
      c.fillStyle = gp; c.beginPath(); c.roundRect(px, -60, 44, 56, 9); c.fill();
      c.fillStyle = "rgba(0,0,0,.6)"; for (let y = -56 + fase * 5; y < -8; y += 10) c.fillRect(px + 5, y, 34, 2);
      c.fillStyle = "rgba(255,255,255,.12)"; c.fillRect(px + 6, -58, 4, 50);
    });
    // difusor
    c.fillStyle = "#1b1b1f"; c.beginPath(); c.moveTo(-52, -8); c.lineTo(52, -8); c.lineTo(42, -28); c.lineTo(-42, -28); c.closePath(); c.fill();
    c.strokeStyle = "#3a3a40"; c.lineWidth = 2; for (let x = -30; x <= 30; x += 15) { c.beginPath(); c.moveTo(x, -9); c.lineTo(x * 0.85, -27); c.stroke(); }
    // pontões laterais
    [-1, 1].forEach(l => { c.fillStyle = clarear(cor, -0.2); c.beginPath(); c.roundRect(l < 0 ? -64 : 36, -46, 28, 22, 8); c.fill(); });
    // capacete e halo (ficam atrás da capa do motor)
    c.fillStyle = "#f8f9fa"; c.beginPath(); c.arc(sk, -80, 14, Math.PI, 0); c.lineTo(14 + sk, -70); c.lineTo(-14 + sk, -70); c.fill();
    c.fillStyle = clarear(cor, -0.35); c.fillRect(-14 + sk, -84, 28, 5);
    c.strokeStyle = "#1d1d22"; c.lineWidth = 5; c.beginPath(); c.moveTo(-18 + sk, -68); c.quadraticCurveTo(sk, -98, 18 + sk, -68); c.stroke();
    // capa do motor estreita com degradê
    const corpo = () => { c.beginPath(); c.moveTo(-36, -24); c.quadraticCurveTo(-40, -50, -20 + sk, -70); c.lineTo(20 + sk, -70); c.quadraticCurveTo(40, -50, 36, -24); c.closePath(); };
    const g = c.createLinearGradient(0, -72, 0, -24);
    g.addColorStop(0, clarear(cor, 0.35)); g.addColorStop(0.5, cor); g.addColorStop(1, clarear(cor, -0.4));
    c.fillStyle = g; corpo(); c.fill();
    c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 2; corpo(); c.stroke();
    // entrada de ar e barbatana
    c.fillStyle = clarear(cor, -0.25); c.beginPath(); c.roundRect(-8 + sk, -98, 16, 30, 6); c.fill();
    c.fillStyle = "#111"; c.beginPath(); c.roundRect(-5 + sk, -95, 10, 7, 3); c.fill();
    c.fillStyle = clarear(cor, 0.1); c.beginPath(); c.moveTo(-2 + sk, -100); c.lineTo(2 + sk, -100); c.lineTo(2, -62); c.lineTo(-2, -62); c.fill();
    // asa traseira: suportes, dois planos e as placas dos lados
    c.fillStyle = "#222"; c.fillRect(-7, -112, 4, 46); c.fillRect(3, -112, 4, 46);
    const ga = c.createLinearGradient(0, -122, 0, -108);
    ga.addColorStop(0, clarear(cor, 0.15)); ga.addColorStop(1, clarear(cor, -0.55));
    c.fillStyle = ga; c.beginPath(); c.roundRect(-84, -122, 168, 12, 3); c.fill();
    c.fillStyle = "#1d1d22"; c.beginPath(); c.roundRect(-82, -108, 164, 6, 2); c.fill();
    c.fillStyle = clarear(cor, -0.5); c.fillRect(-88, -126, 7, 30); c.fillRect(81, -126, 7, 30);
    // luz vermelha do meio (forte ao frear)
    c.fillStyle = freio ? "#ff2a2a" : "#7a1010"; c.fillRect(-7, -34, 14, 7);
    if (freio) { const gl = c.createRadialGradient(0, -30, 2, 0, -30, 30); gl.addColorStop(0, "rgba(255,60,60,.7)"); gl.addColorStop(1, "rgba(255,60,60,0)"); c.fillStyle = gl; c.fillRect(-30, -60, 60, 60); }
    return cv;
  }

  // Sprites dos carros da corrida guardados prontos (cor × virando × freio × fase da roda × fórmula)
  const spritesCarro = new Map();
  let formulaNaPista = false; // a corrida aberta é Grande Prêmio
  const spriteCarro = (cor, vira, freio, fase) => {
    const k = (formulaNaPista ? "f" : "") + cor + vira + (freio ? 1 : 0) + fase;
    let s = spritesCarro.get(k);
    if (!s) { s = (formulaNaPista ? formulaDeTras : carroDeTras)(cor, vira === "esq" ? -1 : vira === "dir" ? 1 : 0, freio, fase); spritesCarro.set(k, s); }
    return s;
  };
  // Carro visto de cima (cidade): x para a frente
  // (o desenho fica pronto num canvas guardado; a sombra é desenhada à parte, sempre para o mesmo lado)
  const spritesCima = new Map();
  function spriteDeCima(cor, comprimento, largura, tipo) {
    const ES = 3, M = 3, cv = document.createElement("canvas");
    cv.width = (comprimento + M * 2) * ES; cv.height = (largura + M * 2) * ES;
    const c = cv.getContext("2d");
    c.scale(ES, ES); c.translate(comprimento / 2 + M, largura / 2 + M);
    const L = comprimento / 2, Wd = largura / 2;
    // rodas aparecendo nos cantos
    c.fillStyle = "#151515";
    const ro = tipo === "onibus" ? [L - 9, -L + 7] : [L * 0.55, -L * 0.55];
    ro.forEach(x => { c.fillRect(x - 3.5, -Wd - 1, 7, 3); c.fillRect(x - 3.5, Wd - 2, 7, 3); });
    // lataria com volume (laterais mais escuras, meio com luz)
    const g = c.createLinearGradient(0, -Wd, 0, Wd);
    g.addColorStop(0, clarear(cor, -0.35)); g.addColorStop(0.25, cor); g.addColorStop(0.5, clarear(cor, 0.22)); g.addColorStop(0.75, cor); g.addColorStop(1, clarear(cor, -0.35));
    c.fillStyle = g; c.beginPath(); c.roundRect(-L, -Wd, comprimento, largura, tipo === "onibus" ? 4 : 7); c.fill();
    c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 0.8; c.stroke();
    const vidro = (x, y, w, h, r) => {
      const gv = c.createLinearGradient(x, y, x + w, y + h);
      gv.addColorStop(0, "#9fd3ff"); gv.addColorStop(0.5, "#2c4f73"); gv.addColorStop(1, "#1a2c40");
      c.fillStyle = gv; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
    };
    if (tipo === "onibus") {
      for (let x = -L + 6; x < L - 8; x += 9) { vidro(x, -Wd + 1.5, 6.5, 3, 1); vidro(x, Wd - 4.5, 6.5, 3, 1); }
      vidro(L - 6, -Wd + 2, 4, largura - 4, 1);
      c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(-L + 4, -Wd + 6, comprimento - 12, largura - 12);   // teto claro
      c.fillStyle = "#bfc6cc"; c.fillRect(-L * 0.3, -3, 10, 6); c.fillRect(L * 0.25, -3, 8, 6);             // ar-condicionado
      c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(-L * 0.3, 2, 10, 1); c.fillRect(L * 0.25, 2, 8, 1);
    } else {
      vidro(L * 0.15, -Wd + 2.5, L * 0.45, largura - 5, 3);   // para-brisa
      vidro(-L * 0.75, -Wd + 3, L * 0.3, largura - 6, 2);     // vidro de trás
      c.fillStyle = "rgba(255,255,255,.45)"; c.fillRect(L * 0.3, -Wd + 3.5, 1.5, largura - 7); // reflexo
      const gt = c.createLinearGradient(0, -Wd, 0, Wd);
      gt.addColorStop(0, clarear(cor, 0.05)); gt.addColorStop(0.4, clarear(cor, 0.4)); gt.addColorStop(1, clarear(cor, -0.1));
      c.fillStyle = gt; c.beginPath(); c.roundRect(-L * 0.42, -Wd + 3, L * 0.55, largura - 6, 3); c.fill(); // teto
      c.fillStyle = clarear(cor, -0.3); c.fillRect(L * 0.12, -Wd - 1.5, 2.5, 2); c.fillRect(L * 0.12, Wd - 0.5, 2.5, 2); // retrovisores
      if (tipo === "taxi") { c.fillStyle = "#fff"; c.fillRect(-L * 0.2, -3, 6, 6); c.fillStyle = "#222"; c.fillRect(-L * 0.2 + 1, -1, 4, 2); }
      c.strokeStyle = "rgba(0,0,0,.2)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(L * 0.72, -Wd + 3); c.lineTo(L * 0.72, Wd - 3); c.stroke(); // capô
    }
    c.fillStyle = "#fff6b0"; c.fillRect(L - 2, -Wd + 2, 2, 4); c.fillRect(L - 2, Wd - 6, 2, 4);
    c.fillStyle = "#ff3b3b"; c.fillRect(-L, -Wd + 2, 2, 4); c.fillRect(-L, Wd - 6, 2, 4);
    return { cv, ES, M };
  }
  // Carro visto de cima (cidade): x para a frente
  function carroDeCima(c, cor, comprimento = 36, largura = 18, tipo = "carro") {
    const k = cor + comprimento + "x" + largura + tipo;
    let s = spritesCima.get(k);
    if (!s) { s = spriteDeCima(cor, comprimento, largura, tipo); spritesCima.set(k, s); }
    c.drawImage(s.cv, -comprimento / 2 - s.M, -largura / 2 - s.M, comprimento + s.M * 2, largura + s.M * 2);
  }
  // Sombra do carro de cima: desenhada antes de girar, para cair sempre para o mesmo lado (sol fixo)
  function sombraDeCima(c, x, y, ang, comprimento, largura) {
    c.save(); c.translate(x + 4, y + 5); c.rotate(ang);
    c.fillStyle = "rgba(0,0,0,.28)"; c.beginPath(); c.roundRect(-comprimento / 2 - 1, -largura / 2 - 1, comprimento + 2, largura + 2, 7); c.fill();
    c.restore();
  }

  // =====================================================================
  // 🏁 Corrida (estrada em 3D por segmentos)
  // =====================================================================
  const TEMAS = {
    campo: { ceu: ["#3d8fe0", "#bfe6ff"], grama: ["#5fb34a", "#56a843"], zebra: ["#e63946", "#fff"], pista: ["#6b6b6b", "#666666"], faixa: "#fff", acost: "#a39a80", nevoa: "#bfe6ff", morros: ["#7cc36a", "#5aa84a"], coisas: ["arvore", "arvore", "pinheiro", "placa", "flores"] },
    praia: { ceu: ["#1fa2ff", "#d9f6ff"], grama: ["#f2d58c", "#ebcd80"], zebra: ["#ff8a00", "#fff"], pista: ["#707070", "#6a6a6a"], faixa: "#fff", acost: "#d8bd78", nevoa: "#d9f6ff", morros: ["#4fc3f7", "#29a3d8"], coisas: ["coqueiro", "coqueiro", "guarda-sol", "placa"] },
    noite: { ceu: ["#0b1030", "#2b2d6e"], grama: ["#2b3a2b", "#263426"], zebra: ["#ffd60a", "#333"], pista: ["#3b3b44", "#36363f"], faixa: "#ffd60a", acost: "#25252c", nevoa: "#20224d", morros: ["#1b1d45", "#14163a"], coisas: ["predio", "predio", "poste", "predio"], noite: true },
    // Autódromos do Grande Prêmio (carros de fórmula): zebras vermelho e branco, arquibancadas, pneus
    interlagos: { ceu: ["#4a90d9", "#d4e9fb"], grama: ["#4f9d3a", "#47923a"], zebra: ["#e63946", "#fff"], pista: ["#505056", "#4b4b51"], faixa: "#fff", acost: "#8a8f96", nevoa: "#d4e9fb", morros: ["#8fb07a", "#6f9a5a"], coisas: ["arquibancada", "arquibancada", "pneus", "faixa-gp", "bandeira", "arvore"], gp: true },
    monaco: { ceu: ["#2f8fe8", "#d6efff"], grama: ["#a3a8ae", "#9a9fa6"], zebra: ["#e63946", "#fff"], pista: ["#46464d", "#424249"], faixa: "#fff", acost: "#c9ccd1", nevoa: "#d6efff", morros: ["#4fc3f7", "#29a3d8"], coisas: ["predio", "predio", "arquibancada", "faixa-gp", "pneus", "coqueiro"], gp: true, largura: 1650 },
    monza: { ceu: ["#3d8fe0", "#d5ecff"], grama: ["#5fb34a", "#56a843"], zebra: ["#e63946", "#fff"], pista: ["#55555b", "#505056"], faixa: "#fff", acost: "#a39a80", nevoa: "#d5ecff", morros: ["#7cc36a", "#5aa84a"], coisas: ["arvore", "arvore", "arquibancada", "faixa-gp", "pneus", "bandeira"], gp: true },
    neve: { ceu: ["#8fb8d8", "#eef6ff"], grama: ["#f4f8ff", "#e8f0fa"], zebra: ["#2f80ed", "#fff"], pista: ["#7a7f86", "#757a81"], faixa: "#fff", acost: "#b9c3ce", nevoa: "#eef6ff", morros: ["#dfe9f5", "#c9d8ea"], coisas: ["pinheiro-neve", "pinheiro-neve", "boneco", "placa"] },
  };
  // Enfeites da beira da pista: [largura, altura] no mundo e o desenho
  function desenharEnfeite(tipo) {
    const cv = document.createElement("canvas"), c = cv.getContext("2d");
    const pronto = (w, h) => { cv.width = w; cv.height = h; return c; };
    // sombra no chão, no pé do enfeite
    const sombra = (x, rx, h) => { c.fillStyle = "rgba(0,0,0,.22)"; c.beginPath(); c.ellipse(x, h - 4, rx, 6, 0, 0, 7); c.fill(); };
    // bola com luz em cima à esquerda (copa de árvore, neve)
    const bola = (x, y, r, claro, escuro) => {
      const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      g.addColorStop(0, claro); g.addColorStop(1, escuro);
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    };
    if (tipo === "arvore") {
      pronto(160, 200);
      sombra(80, 56, 200);
      const gt = c.createLinearGradient(70, 0, 90, 0); gt.addColorStop(0, "#8f5a2c"); gt.addColorStop(1, "#5a3416");
      c.fillStyle = gt; c.fillRect(70, 120, 20, 78);
      [[80, 84, 62, "#4fae47", "#2a6e28"], [50, 106, 40, "#5cbc52", "#2f7a2c"], [112, 106, 40, "#56b44d", "#2c722a"], [80, 56, 44, "#7ad66e", "#3f9a3a"]].forEach(([x, y, r, a, b]) => bola(x, y, r, a, b));
      c.fillStyle = "rgba(255,255,255,.18)"; [[62, 40, 8], [92, 62, 6], [44, 92, 6]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); });
    } else if (tipo === "pinheiro" || tipo === "pinheiro-neve") {
      pronto(120, 220);
      sombra(60, 46, 220);
      c.fillStyle = "#6b3e1f"; c.fillRect(52, 180, 16, 38);
      [[0, 190], [12, 140], [24, 92]].forEach(([d, y], i) => {
        c.fillStyle = ["#1f6b3a", "#26804a", "#2f9a58"][i]; c.beginPath(); c.moveTo(60, y - 90 + d); c.lineTo(110 - d, y); c.lineTo(10 + d, y); c.fill();
        c.fillStyle = "rgba(0,30,10,.3)"; c.beginPath(); c.moveTo(60, y - 90 + d); c.lineTo(110 - d, y); c.lineTo(60, y); c.fill(); // lado na sombra
      });
      if (tipo === "pinheiro-neve") {
        [[60, 34, 18], [60, 80, 26], [60, 128, 34]].forEach(([x, y, w]) => { c.fillStyle = "#fff"; c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x + w, y + 8); c.lineTo(x - w, y + 8); c.fill(); c.fillStyle = "#d6e4f2"; c.beginPath(); c.moveTo(x, y - 14); c.lineTo(x + w, y + 8); c.lineTo(x, y + 8); c.fill(); });
      }
    } else if (tipo === "coqueiro") {
      pronto(180, 240);
      sombra(84, 40, 240);
      c.strokeStyle = "#8d5a2b"; c.lineWidth = 14; c.lineCap = "round"; c.beginPath(); c.moveTo(80, 240); c.quadraticCurveTo(70, 140, 100, 60); c.stroke();
      c.strokeStyle = "rgba(60,30,10,.45)"; c.lineWidth = 2; // anéis do tronco
      for (let t = 0.1; t < 0.95; t += 0.09) { const x = (1 - t) ** 2 * 80 + 2 * (1 - t) * t * 70 + t * t * 100, y = (1 - t) ** 2 * 240 + 2 * (1 - t) * t * 140 + t * t * 60; c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x + 7, y - 2); c.stroke(); }
      [[-70, 20], [-50, -30], [10, -50], [60, -20], [75, 30]].forEach(([dx, dy], i) => {
        c.strokeStyle = i % 2 ? "#2f9a3a" : "#3db04a"; c.lineWidth = 12; c.beginPath(); c.moveTo(100, 60); c.quadraticCurveTo(100 + dx * 0.5, 60 + dy - 20, 100 + dx, 60 + dy + 20); c.stroke();
        c.strokeStyle = "rgba(0,60,10,.45)"; c.lineWidth = 2; c.stroke();
      });
      [[94, 70], [106, 72]].forEach(([x, y]) => bola(x, y, 8, "#9a6a3a", "#4a2a10"));
    } else if (tipo === "guarda-sol") {
      pronto(160, 160);
      sombra(80, 60, 160);
      c.fillStyle = "#ddd"; c.fillRect(77, 50, 6, 108);
      ["#e63946", "#fff", "#2f80ed", "#fff", "#ffc21a"].forEach((cor, i) => { c.fillStyle = cor; c.beginPath(); c.moveTo(80, 10); c.arc(80, 60, 76, Math.PI + i * Math.PI / 5, Math.PI + (i + 1) * Math.PI / 5); c.fill(); });
      const gs = c.createLinearGradient(4, 0, 156, 0); gs.addColorStop(0, "rgba(255,255,255,.2)"); gs.addColorStop(1, "rgba(0,0,0,.25)");
      c.fillStyle = gs; c.beginPath(); c.moveTo(80, 10); c.arc(80, 60, 76, Math.PI, 0); c.fill();
    } else if (tipo === "predio") {
      const h = 220 + Math.floor(Math.random() * 3) * 60;
      pronto(150, h);
      const base = ["#3b3f6b", "#4a3b6b", "#2f4b5b"][Math.floor(Math.random() * 3)];
      const gp = c.createLinearGradient(0, 0, 150, 0); gp.addColorStop(0, clarear(base, 0.15)); gp.addColorStop(0.7, base); gp.addColorStop(1, clarear(base, -0.4));
      c.fillStyle = gp; c.fillRect(0, 6, 150, h - 6);
      c.fillStyle = clarear(base, -0.3); c.fillRect(-1, 0, 152, 8); // beiral do topo
      c.fillStyle = "#ff3b3b"; c.fillRect(70, 0, 6, 4);             // luz do topo
      for (let y = 18; y < h - 26; y += 26) for (let x = 14; x < 140; x += 30) {
        const acesa = Math.random() < 0.6;
        c.fillStyle = "#15182e"; c.fillRect(x - 1, y - 1, 18, 16);
        c.fillStyle = acesa ? Motor.sortear(["#ffe680", "#ffd36b", "#fff3b0"]) : "#262b52"; c.fillRect(x, y, 16, 14);
        if (acesa) { c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(x, y + 9, 16, 5); }
      }
      c.fillStyle = "#1a1d33"; c.fillRect(56, h - 24, 38, 24); c.fillStyle = "#ffe680"; c.fillRect(60, h - 20, 30, 18); // portaria
    } else if (tipo === "poste") {
      pronto(60, 240);
      sombra(30, 14, 240);
      const gp = c.createLinearGradient(26, 0, 34, 0); gp.addColorStop(0, "#888"); gp.addColorStop(1, "#3a3a3a");
      c.fillStyle = gp; c.fillRect(26, 20, 8, 220); c.fillStyle = "#555"; c.fillRect(26, 20, 30, 6); c.fillRect(22, 226, 16, 14);
      const gl = c.createRadialGradient(54, 32, 2, 54, 32, 28); gl.addColorStop(0, "rgba(255,246,176,.9)"); gl.addColorStop(1, "rgba(255,246,176,0)");
      c.fillStyle = gl; c.fillRect(24, 2, 36, 60);
      c.fillStyle = "#333"; c.fillRect(44, 24, 20, 5);
      c.fillStyle = "#fffbe0"; c.beginPath(); c.ellipse(54, 31, 8, 4, 0, 0, 7); c.fill();
    } else if (tipo === "placa") {
      pronto(200, 150);
      sombra(100, 80, 150);
      c.fillStyle = "#777"; c.fillRect(30, 60, 10, 90); c.fillRect(160, 60, 10, 90);
      c.fillStyle = "#555"; c.fillRect(37, 60, 3, 90); c.fillRect(167, 60, 3, 90);
      c.fillStyle = "#1d6fb8"; c.beginPath(); c.roundRect(2, 4, 196, 74, 12); c.fill();
      const gp = c.createLinearGradient(0, 8, 0, 72); gp.addColorStop(0, "#fff"); gp.addColorStop(1, "#dfe7ef");
      c.fillStyle = gp; c.beginPath(); c.roundRect(8, 10, 184, 62, 8); c.fill();
      c.fillStyle = "#1d6fb8"; c.font = "bold 34px sans-serif"; c.textAlign = "center"; c.fillText(Motor.sortear(["VAI! 🏁", "ÉÉÉ! 🚗", "TURBO ⚡", "UAU! ⭐"]), 100, 54);
    } else if (tipo === "flores") {
      pronto(120, 60);
      c.fillStyle = "#2f8a3a"; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(10 + i * 12, 44 + (i % 2) * 6, 9, 5, 0, 0, 7); c.fill(); }
      for (let i = 0; i < 9; i++) { const x = 10 + i * 12, y = 30 + (i % 2) * 14; bola(x, y, 7, "#fff", ["#ff70a6", "#ffd60a", "#d8d8ff"][i % 3]); c.fillStyle = "#ffb703"; c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill(); }
    } else if (tipo === "arquibancada") {
      // degraus com a torcida colorida, cobertura e bandeirinhas
      pronto(320, 190);
      sombra(160, 150, 190);
      c.fillStyle = "#6c757d"; c.fillRect(24, 34, 6, 150); c.fillRect(290, 34, 6, 150); c.fillRect(157, 34, 6, 150);
      for (let r = 0; r < 6; r++) {
        const y = 56 + r * 21, x0 = 26 - r * 3, x1 = 294 + r * 3;
        c.fillStyle = r % 2 ? "#8a939d" : "#9aa3ad"; c.fillRect(x0, y, x1 - x0, 21);
        c.fillStyle = "rgba(0,0,0,.18)"; c.fillRect(x0, y + 17, x1 - x0, 4);
        for (let x = x0 + 7; x < x1 - 4; x += 10) {
          c.fillStyle = Motor.sortear(["#e63946", "#ffd60a", "#2f80ed", "#2a9d55", "#fff", "#ff70a6", "#f77f00"]);
          c.fillRect(x - 4, y + 7, 8, 9);
          c.fillStyle = Motor.sortear(["#f1c27d", "#c68642", "#8d5524", "#ffdbac"]); c.beginPath(); c.arc(x, y + 5, 3.5, 0, 7); c.fill();
        }
      }
      c.fillStyle = "#5c636a"; c.fillRect(18, 186 - 12, 284, 12);
      const gt = c.createLinearGradient(0, 18, 0, 40); gt.addColorStop(0, "#f1f3f5"); gt.addColorStop(1, "#adb5bd");
      c.fillStyle = gt; c.beginPath(); c.moveTo(4, 40); c.lineTo(316, 40); c.lineTo(300, 18); c.lineTo(20, 18); c.fill();
      ["#e63946", "#2f80ed", "#ffd60a", "#2a9d55", "#e63946"].forEach((cor, i) => { const x = 40 + i * 60; c.fillStyle = "#333"; c.fillRect(x, 2, 2, 18); c.fillStyle = cor; c.beginPath(); c.moveTo(x + 2, 3); c.lineTo(x + 18, 8); c.lineTo(x + 2, 13); c.fill(); });
    } else if (tipo === "pneus") {
      // barreira de pneus: pilhas pretas com uma faixa vermelha e branca
      pronto(180, 90);
      sombra(90, 84, 90);
      for (let col = 0; col < 5; col++) for (let lin = 0; lin < 3; lin++) {
        const x = 20 + col * 35, y = 76 - lin * 22;
        c.fillStyle = "#1b1b1f"; c.beginPath(); c.ellipse(x, y, 17, 11, 0, 0, 7); c.fill();
        c.fillStyle = lin === 2 ? (col % 2 ? "#e63946" : "#fff") : "#2d2d33"; c.beginPath(); c.ellipse(x, y - 2, 17, 8, 0, 0, 7); c.fill();
        c.fillStyle = "#111"; c.beginPath(); c.ellipse(x, y - 3, 7, 4, 0, 0, 7); c.fill();
      }
    } else if (tipo === "faixa-gp") {
      // faixa do autódromo (sem marcas), em vermelho e branco
      pronto(260, 140);
      sombra(130, 110, 140);
      c.fillStyle = "#666"; c.fillRect(30, 70, 9, 70); c.fillRect(221, 70, 9, 70);
      c.fillStyle = "#e63946"; c.beginPath(); c.roundRect(2, 6, 256, 70, 10); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(10, 14, 240, 54, 6); c.fill();
      for (let k = 0; k < 6; k++) { c.fillStyle = k % 2 ? "#111" : "#fff"; c.fillRect(12 + k * 6, 16, 6, 25); c.fillStyle = k % 2 ? "#fff" : "#111"; c.fillRect(12 + k * 6, 41, 6, 25); }
      c.fillStyle = "#c1121f"; c.font = "bold 30px sans-serif"; c.textAlign = "center";
      c.fillText(Motor.sortear(["GRANDE PRÊMIO", "VELOCIDADE", "PÓDIO 🏆", "VAI! 🏁", "ÚLTIMA VOLTA?"]), 140, 52, 190);
    } else if (tipo === "bandeira") {
      // mastro com a bandeira quadriculada
      pronto(90, 210);
      sombra(20, 14, 210);
      c.fillStyle = "#adb5bd"; c.fillRect(16, 10, 6, 198);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? "#111" : "#fff"; c.fillRect(22 + i * 11, 12 + j * 11 + Math.sin(i * 0.9) * 3, 11, 11); }
    } else if (tipo === "boneco") {
      pronto(100, 150);
      sombra(50, 40, 150);
      [[50, 110, 38], [50, 58, 26]].forEach(([x, y, r]) => { bola(x, y, r, "#fff", "#c8d8ea"); });
      c.fillStyle = "#222"; c.fillRect(30, 20, 40, 10); c.fillRect(38, 0, 24, 22);
      c.fillStyle = "#f77f00"; c.beginPath(); c.moveTo(50, 60); c.lineTo(70, 64); c.lineTo(50, 66); c.fill();
      c.fillStyle = "#222"; c.beginPath(); c.arc(42, 52, 3, 0, 7); c.arc(58, 52, 3, 0, 7); c.fill();
      c.strokeStyle = "#e63946"; c.lineWidth = 7; c.beginPath(); c.moveTo(28, 82); c.lineTo(72, 82); c.stroke();
    }
    return cv;
  }
  const TAM_ENFEITE = { arquibancada: 2400, pneus: 650, "faixa-gp": 1200, bandeira: 1000, arvore: 1300, pinheiro: 900, "pinheiro-neve": 900, coqueiro: 1300, "guarda-sol": 900, predio: 1800, poste: 500, placa: 1100, flores: 700, boneco: 650 };

  function corrida(area, op) {
    const tema = TEMAS[op.pista] || TEMAS.campo;
    formulaNaPista = !!tema.gp;
    const NIVEL = { facil: { max: 0.82, rivais: 0.7, auto: true }, normal: { max: 1, rivais: 0.86, auto: false }, dificil: { max: 1.12, rivais: 0.97, auto: false } }[op.nivel] || { max: 1, rivais: 0.86 };
    const sessao = Motor.sessaoAtual();
    let pausado = false;
    const DOIS = op.jogadores === "2"; // corrida a dois, com a tela dividida
    const T = montarTela(area, { dois: DOIS, aoPausar: () => alternarPausa() });
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(T.tela);

    // ----- Pista: segmentos com curva e altura -----
    const SEG = 200, LARGURA = tema.largura || 2000, FAIXAS = 3, ZEBRA = 3, VISTA = 180, ALT_CAMERA = 1000, FOV = 100;
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
    // Cada pista tem o seu traçado: [entrada, meio, saída da curva, curva (+ direita), subida]
    const TRACADOS = {
      campo: [[15, 30, 15, 0, 0], [25, 40, 25, 2, 20], [20, 20, 20, 0, -20], [25, 30, 25, -3, 0], [15, 25, 15, 0, 40], [25, 35, 25, 4, -20], [20, 15, 20, -2, -20], [15, 20, 15, 2, 20], [25, 40, 25, -4, 0], [20, 30, 20, 0, -40]],
      // praia: plana, curvas longas à beira-mar
      praia: [[20, 40, 20, 0, 0], [40, 60, 40, 2, 0], [20, 40, 20, 0, 5], [40, 70, 40, -2.5, 0], [20, 30, 20, 0, -5], [30, 50, 30, 3, 0], [30, 40, 30, -1.5, 0], [20, 30, 20, 0, 0]],
      // cidade à noite: quarteirões, curvas fechadas de esquina
      noite: [[15, 25, 15, 0, 0], [8, 10, 8, 5, 0], [15, 30, 15, 0, 0], [8, 10, 8, -5, 0], [10, 20, 10, 0, 0], [8, 12, 8, 5, 0], [8, 12, 8, 5, 0], [15, 25, 15, 0, 0], [8, 10, 8, -5, 0], [12, 20, 12, 0, 0], [8, 10, 8, -5, 0]],
      // neve: montanha, sobe e desce
      neve: [[15, 25, 15, 0, 30], [20, 30, 20, 3, -30], [15, 20, 15, 0, 40], [25, 30, 25, -3, -40], [15, 25, 15, 2, 30], [20, 25, 20, -2, -30], [20, 30, 20, 0, 20]],
      // Interlagos: largada em descida, o "S" logo depois, curva longa, reta oposta, miolo e a subida até a reta
      interlagos: [[15, 30, 15, 0, -10], [8, 10, 8, -5, -10], [8, 10, 8, 5, -5], [25, 40, 25, -2.5, 0], [20, 60, 20, 0, -5], [12, 15, 12, -4, -10], [10, 15, 10, 4, 10], [10, 15, 10, -3, 0], [10, 12, 10, 4, 5], [12, 20, 12, -3, 10], [30, 40, 30, -1.5, 30]],
      // Mônaco: ruas estreitas, curvas lentas, o grampo e o túnel (reta)
      monaco: [[12, 20, 12, 0, 0], [6, 8, 6, 5, 5], [10, 15, 10, 0, 10], [6, 8, 6, -4, 0], [8, 10, 8, 6, -5], [6, 8, 6, -6, -5], [12, 25, 12, 0, -5], [6, 8, 6, -5, 0], [6, 8, 6, 5, 0], [10, 15, 10, 0, 0], [6, 8, 6, -5, 0], [8, 15, 8, 0, 0]],
      // Monza: retas enormes e chicanes (a pista mais rápida)
      monza: [[20, 80, 20, 0, 0], [6, 6, 6, -5, 0], [6, 6, 6, 5, 0], [25, 40, 25, 2, 0], [20, 60, 20, 0, 0], [25, 35, 25, 2.5, 0], [20, 70, 20, 0, 0], [6, 6, 6, -4, 0], [6, 6, 6, 4, 0], [30, 50, 30, 2, 0], [20, 60, 20, 0, 0]],
    };
    (TRACADOS[op.pista] || TRACADOS.campo).forEach(t => trecho(...t));
    trecho(30, 30, 40, 0, ultimaY() / -SEG); // volta à altura do começo
    const N = segs.length, VOLTA = N * SEG;
    // Largada e chegada (quadriculado)
    segs[2].largada = true; segs[3].largada = true;
    // Faixas de turbo ⚡ nas retas, numa das 3 faixas da pista: passar por cima dá um empurrão
    for (let n = 45; n < N - 30; n += 50 + Math.floor(Math.random() * 35)) {
      if ([0, 1, 2, 3].some(k => Math.abs(segs[n + k].curva) > 1.5)) continue;
      const tx = [-2 / 3, 0, 2 / 3][Math.floor(Math.random() * 3)];
      for (let k = 0; k < 4; k++) segs[n + k].turbo = tx;
    }
    // Enfeites dos dois lados
    const imagens = {};
    const img = tipo => (imagens[tipo] = imagens[tipo] || desenharEnfeite(tipo));
    for (let n = 20; n < N - 10; n += 3 + Math.floor(Math.random() * 4)) {
      const lado = Math.random() < 0.5 ? -1 : 1, tipo = Motor.sortear(tema.coisas);
      // a arquibancada é grande: fica mais longe da pista
      segs[n].enfeites.push({ tipo, x: lado * (tipo === "arquibancada" ? 2.3 + Math.random() * 0.8 : 1.35 + Math.random() * 1.4) });
      if (Math.random() < 0.35) segs[n].enfeites.push({ tipo: Motor.sortear(tema.coisas), x: -lado * (1.4 + Math.random() * 1.6) });
    }

    // ----- Jogadores (1 ou 2, tela dividida) e adversários -----
    const VMAX = (SEG / (1 / 60)) * NIVEL.max;
    const CAM = ALT_CAMERA * PROF; // o carro do jogador fica esta distância à frente da câmera
    const EMOJI_COR = { vermelho: "🔴", azul: "🔵", amarelo: "🟡", verde: "🟢", rosa: "🩷", laranja: "🟠" };
    const cor1 = CORES[op.cor] ? op.cor : "vermelho", cor2 = CORES[op.cor2] && op.cor2 !== cor1 ? op.cor2 : cor1 === "azul" ? "laranja" : "azul";
    const novoJogador = (n, cor, ent) => {
      const hex = CORES[cor];
      return {
        n, cor, hex, tec: ent, ent, emoji: EMOJI_COR[cor], turbo: 0, aviso: null, tFim: 0,
        nome: (n === 1 ? op.nome1 : op.nome2) || (DOIS ? `Jogador ${n}` : "Você"),
        giro: 0, inclina: 0, parts: [],
        pos: 0, x: 0, vel: 0, voltas: 0, ceuDesl: 0, morroDesl: 0, sacode: 0, ultPos: 9, chegou: 0,
      };
    };
    const jog = DOIS ? [novoJogador(1, cor1, T.ent), novoJogador(2, cor2, T.ent2)] : [novoJogador(1, cor1, T.ent)];
    if (DOIS) { jog[0].x = -0.5; jog[1].x = 0.5; }
    const roncos = jog.map((j, i) => somDeMotor(DOIS ? (i ? 0.6 : -0.6) : 0));
    const usadas = jog.map(j => j.hex);
    const outrasCores = Object.values(CORES).filter(c => !usadas.includes(c));
    // Os adversários ganham nomes sorteados (diferentes dos nomes dos jogadores)
    const nomesRivais = Motor.embaralhar(NOMES_PILOTOS.filter(nm => !jog.some(j => j.nome.toLowerCase() === nm.toLowerCase())));
    const rivais = outrasCores.slice(0, DOIS ? 4 : 5).map((cor, k) => ({
      cor, nome: nomesRivais[k], tFim: 0,
      // largada: dois atrás do jogador (ainda na volta "-1") e os outros na frente
      x: [-0.5, 0.5][k % 2], z: k < 2 ? VOLTA - (k + 1) * 4 * SEG : (k - 1) * 4 * SEG, voltas: k < 2 ? -1 : 0,
      vel: VMAX * NIVEL.rivais * (0.93 + k * 0.025), chegou: 0,
    }));
    const TOTAL_CARROS = rivais.length + jog.length;
    let tempo = 0, fase = "largada", contagem = 3.6, chegada = 0, primeiraChegada = 0;
    // relógio da prova: continua depois que você chega, para cada carro ter o seu tempo de chegada
    let relogioProva = 0;
    const TOTAL_VOLTAS = Math.max(1, Math.min(10, parseInt(op.voltas, 10) || 3)); // escolhido nas opções
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
      const ps = typeof Controle !== "undefined" ? Controle.pads() : []; // (const global não fica em window)
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
        // Turbo: passou por cima da faixa ⚡ e ganha velocidade além do normal por um tempinho
        if (corre && seg.turbo !== undefined && Math.abs(j.x - seg.turbo) < 0.34) {
          if (j.turbo <= 0) { Motor.nota(260, { dur: 0.6, tipo: "sawtooth", vol: 0.05, ate: 1000 }); avisar(j, "⚡ TURBO!", "#ffd60a", 1.1); }
          j.turbo = 1.6;
        }
        if (j.turbo > 0) { j.turbo -= dt; if (corre) j.vel += VMAX * 0.9 * dt; }
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
      // acima da velocidade máxima só com turbo; quando ele acaba, volta aos poucos
      const teto = VMAX * (j.turbo > 0 ? 1.3 : 1);
      if (j.vel > teto) j.vel = Math.max(teto, j.vel - VMAX * 0.5 * dt);
      j.vel = Math.max(0, j.vel);
      j.pos += j.vel * dt;
      if (j.pos >= VOLTA) { j.pos -= VOLTA; j.voltas++; novaVolta(j); }
      j.ceuDesl += seg.curva * pv * dt * 0.012;
      j.morroDesl += seg.curva * pv * dt * 0.025;
    }

    function atualizar(dt) {
      if (fase === "largada") {
        const antes = Math.ceil(contagem), luzesAntes = luzesAcesas();
        contagem -= dt;
        if (Math.ceil(contagem) !== antes && contagem > 0 && antes <= 3) Motor.falar(String(Math.ceil(contagem)));
        if (luzesAcesas() > luzesAntes) Motor.nota(440, { dur: 0.18, tipo: "square", vol: 0.07 }); // semáforo: uma luz por vez
        if (contagem <= 0) { fase = "correndo"; Motor.nota(880, { dur: 0.5, tipo: "square", vol: 0.1 }); Motor.falar("Já!"); }
        return;
      }
      if (fase === "correndo" && contagem > -1.2) contagem -= dt; // o "JÁ!" fica um pouquinho na tela
      tempo += fase === "correndo" ? dt : 0;
      relogioProva += dt;
      let pvMax = 0;
      jog.forEach(j => { const antes = j.pos; moverJogador(j, dt); if (antes !== j.pos) pvMax = Math.max(pvMax, j.vel / VMAX); });
      // Adversários: aceleram até a sua velocidade, freiam um pouco nas curvas e desviam
      const carrosJog = jog.map(j => ({ x: j.x, z: j.pos + CAM, v: j.vel }));
      rivais.forEach(r => {
        const sr = segDe(r.z), alvo = r.vel * (1 - Math.min(0.25, Math.abs(sr.curva) * 0.05)) * (r.chegou ? 0.4 : 1);
        r.v = (r.v || 0) + (alvo - (r.v || 0)) * Math.min(1, dt * 1.2);
        r.freando = alvo < r.v - VMAX * 0.02; // só para acender as lanternas no desenho
        // desvia de quem está logo à frente (e dos jogadores)
        const frente = [...rivais.filter(o => o !== r), ...carrosJog].find(o => { const d = ((o.z - r.z) % VOLTA + VOLTA) % VOLTA; return d > 0 && d < SEG * 6 && Math.abs(o.x - r.x) < 0.5 && (o.v ?? o.vel) < r.v; });
        if (frente) r.x += (r.x > frente.x ? 1 : -1) * dt * 0.9;
        r.x = Math.max(-0.8, Math.min(0.8, r.x));
        r.z += r.v * dt;
        if (r.z >= VOLTA) { r.z -= VOLTA; r.voltas++; if (r.voltas >= TOTAL_VOLTAS && !r.chegou) { r.chegou = ++chegada; r.tFim = relogioProva; } }
      });
      // 2 jogadores: depois que o primeiro chega, o outro tem um tempinho para terminar
      if (DOIS && fase === "correndo" && primeiraChegada && tempo - primeiraChegada > 25) terminarDois();
    }
    const MEDALHA = l => (l === 1 ? "🥇" : l === 2 ? "🥈" : l === 3 ? "🥉" : "🏁");
    // Semáforo da largada (como na Fórmula 1): as 5 luzes vermelhas acendem uma a uma e, ao apagar, é largada
    function luzesAcesas() { return Math.max(0, Math.min(5, Math.floor((3.6 - contagem - 0.3) / 0.6) + 1)); }
    // Classificação: quem já chegou (pela ordem e o tempo de chegada) e depois quem anda mais à frente.
    // `tempo` só existe para quem já cruzou a chegada.
    function classificacao() {
      return [
        ...rivais.map(r => ({ nome: r.nome, hex: r.cor, prog: progresso(r.voltas, r.z), tempo: r.tFim || 0, j: null })),
        ...jog.map(j => ({ nome: j.nome, hex: j.hex, prog: progresso(j.voltas, j.pos), tempo: j.tFim || 0, j })),
      ].sort((a, b) => (a.tempo && b.tempo ? a.tempo - b.tempo : a.tempo ? -1 : b.tempo ? 1 : b.prog - a.prog));
    }
    const tempoTxt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")},${Math.floor(t * 10 % 10)}`;
    const avisar = (j, txt, cor, dur = 1.4) => { j.aviso = { txt, cor, t: dur, dur }; };
    function novaVolta(j) {
      if (fase !== "correndo" || j.chegou) return;
      if (j.voltas >= TOTAL_VOLTAS) {
        j.chegou = posicao(j);
        j.tFim = relogioProva;
        if (!DOIS) { fimUmJogador(); return; }
        Motor.tim();
        avisar(j, `🏁 ${j.chegou}º lugar!`, "#ffd60a", 3);
        Motor.falar(`${j.nome} chegou em ${j.chegou}º lugar!`);
        if (jog.every(o => o.chegou)) terminarDois();
        else if (!primeiraChegada) primeiraChegada = tempo;
      } else {
        Motor.tim();
        const ultima = j.voltas === TOTAL_VOLTAS - 1, msg = ultima ? "Última volta" : `Volta ${j.voltas + 1}`;
        avisar(j, ultima ? "🏁 ÚLTIMA VOLTA!" : `VOLTA ${j.voltas + 1}`, ultima ? "#ff4d6d" : "#fff", 2);
        if (ultima) { Motor.nota(660, { dur: 0.15, tipo: "triangle", vol: 0.1 }); Motor.nota(880, { dur: 0.3, tipo: "triangle", vol: 0.1, inicio: 0.15 }); }
        Motor.falar(DOIS ? `${msg}, ${j.nome}!` : msg + "!");
      }
    }
    function fimUmJogador() {
      fase = "fim";
      const lugar = jog[0].chegou;
      const t = relogio();
      const chave = `carros-recorde-${op.pista}` + (TOTAL_VOLTAS === 3 ? "" : `-${TOTAL_VOLTAS}v`); // recorde por pista e número de voltas
      let rec = 0; try { rec = +localStorage.getItem(chave) || 0; } catch (e) { /* ok */ }
      const novo = !rec || tempo < rec;
      if (novo) { try { localStorage.setItem(chave, tempo); } catch (e) { /* ok */ } }
      Motor.tim();
      const quem = op.nome1 ? `${op.nome1}, você` : "Você";
      Motor.falar(lugar === 1 ? `${quem} ganhou a corrida! Primeiro lugar!` : `${quem} chegou em ${lugar}º lugar! Muito bem!` + (novo ? " É o seu melhor tempo!" : ""));
      setTimeout(() => { if (vivo()) T.fim(lugar === 1 ? "Você venceu!" : `${lugar}º lugar!`, MEDALHA(lugar), `⏱️ ${t}` + (novo ? " · 🏆 melhor tempo!" : ""), () => corrida(area, op), opcoes, listaFinal); }, 1200);
    }
    function terminarDois() {
      fase = "fim";
      jog.forEach(j => { if (!j.chegou) j.chegou = posicao(j); });
      const [a, b] = jog;
      const venc = a.chegou <= b.chegou ? a : b;
      Motor.tim();
      Motor.falar(`${venc.nome}, do carro ${venc.cor}, ganhou!` + (venc.chegou === 1 ? " E chegou em primeiro lugar na corrida!" : ""));
      setTimeout(() => { if (vivo()) T.fim(`${venc.emoji} ${venc.nome} venceu!`, "🏆", `⏱️ ${relogio()}`, () => corrida(area, op), opcoes, listaFinal); }, 1200);
    }
    const opcoes = () => JOGOS.find(j => j.id === "carros").iniciar(area, { id: op.fid });
    // classificação do fim: com o tempo de cada um (quem ainda não chegou aparece "chegando...")
    const listaFinal = () => classificacao().map(c => ({ ...c, txt: c.tempo ? tempoTxt(c.tempo) : "chegando..." }));
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
    // Cor em hex um pouco mais clara/escura (o asfalto varia de leve de um trecho para outro)
    const tomHex = (hex, f) => "#" + clarear(hex, f).match(/\d+/g).map(v => (+v).toString(16).padStart(2, "0")).join("");
    const tonsPista = [0, 0.035, -0.03, 0.015].map(f => tema.pista.map(c => tomHex(c, f)));
    const tonsAcost = [tomHex(tema.acost, -0.06), tema.acost];
    segs.forEach(s => { s.tom = (s.i * 7 + (s.i >> 3)) % 4; });
    let dtQuadro = 0; // tempo do último quadro (para as partículas; 0 na pausa)

    // ----- Cenário desenhado uma vez só (canvas fora da tela) -----
    // Nuvens fofinhas: branco em cima, azulado embaixo
    const nuvens = tema.noite ? [] : [0, 1, 2].map(k => {
      const cv = document.createElement("canvas"); cv.width = 200; cv.height = 80;
      const c = cv.getContext("2d");
      const bolas = [[50, 52, 24], [86, 40, 32], [124, 46, 26], [154, 56, 18], [100, 58, 22]].slice(0, 3 + k);
      c.fillStyle = "#c9dcef"; bolas.forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); });
      c.fillStyle = "#fff"; bolas.forEach(([x, y, r]) => { c.beginPath(); c.arc(x - 2, y - 6, r * 0.88, 0, 7); c.fill(); });
      return cv;
    });
    // Camadas de montanhas/morros/prédios que se repetem (encaixam nas pontas) para a paralaxe
    const TW = 1024, TH = 220, PE = 30; // PE = parte de baixo lisa, que fica abaixo do horizonte
    const sorte = Motor.aleatorio;
    const camada = desenho => {
      const cv = document.createElement("canvas"); cv.width = TW; cv.height = TH;
      const c = cv.getContext("2d");
      desenho(c);
      return cv;
    };
    // Serra: alturas que repetem a cada TW (só harmônicos inteiros), com degradê e, se pedir, neve no pico
    const serra = (c, cores, alt, amp, harm, neve) => {
      const fases = harm.map(() => Math.random() * 7);
      const y = x => TH - PE - alt - harm.reduce((t, n, i) => t + Math.sin(x / TW * Math.PI * 2 * n + fases[i]) * amp / (i + 1), 0);
      const g = c.createLinearGradient(0, TH - PE - alt - amp * 1.5, 0, TH);
      g.addColorStop(0, cores[0]); g.addColorStop(1, cores[1]);
      c.beginPath(); c.moveTo(0, TH);
      for (let x = 0; x <= TW; x += 4) c.lineTo(x, y(x));
      c.lineTo(TW, TH); c.closePath();
      c.fillStyle = g; c.fill();
      if (neve) {
        c.save(); c.clip();
        const topo = TH - PE - alt - amp * 0.35;
        c.fillStyle = "#fff"; c.beginPath(); c.moveTo(0, 0);
        for (let x = 0; x <= TW; x += 16) c.lineTo(x, topo + Math.sin(x * 0.21) * 6 + (x % 32 ? 6 : 0));
        c.lineTo(TW, 0); c.closePath(); c.fill();
        c.restore();
      }
      return y;
    };
    // Silhueta de prédios com janelinhas acesas (cidade à noite)
    const skyline = (c, cor, altMax, janelas) => {
      for (let x = 0; x < TW;) {
        const w = Math.min(TW - x, 30 + sorte(0, 40)), h = 40 + Math.random() * altMax;
        c.fillStyle = cor; c.fillRect(x, TH - PE - h, w, h + PE);
        c.fillStyle = janelas;
        for (let yy = TH - PE - h + 6; yy < TH - PE - 4; yy += 9) for (let xx = x + 4; xx < x + w - 5; xx += 7) if (Math.random() < 0.28) c.fillRect(xx, yy, 3, 4);
        x += w + (Math.random() < 0.3 ? sorte(4, 14) : 0);
      }
    };
    // Arvorezinhas/pinheiros pequenos sobre a linha de um morro
    const bosque = (c, y, cor, pinheiro) => {
      c.fillStyle = cor;
      for (let x = 6; x < TW - 6; x += 9 + Math.random() * 22) {
        const b = y(x) + 3, r = 5 + Math.random() * 5;
        c.beginPath();
        if (pinheiro) { c.moveTo(x, b - r * 3.2); c.lineTo(x + r, b); c.lineTo(x - r, b); } else c.arc(x, b - r * 0.6, r, 0, 7);
        c.fill();
      }
    };
    const CAMADAS = {
      campo: () => [
        [0.25, camada(c => serra(c, ["#a8c3e2", "#c9dcef"], 90, 50, [2, 5, 9], false))],
        [0.5, camada(c => { const y = serra(c, ["#8fd07a", "#69b257"], 48, 26, [3, 7]); bosque(c, y, "#4c9a40"); })],
        [1, camada(c => { const y = serra(c, ["#63b250", "#55a645"], 18, 14, [4, 9]); bosque(c, y, "#3f8a36"); })],
      ],
      praia: () => [
        [0.25, camada(c => serra(c, ["#6f9fbf", "#9cc4dc"], 112, 28, [3, 6, 11]))],
        [0.5, camada(c => {
          const g = c.createLinearGradient(0, TH - PE - 100, 0, TH); g.addColorStop(0, "#1785c4"); g.addColorStop(1, "#4fc3f7");
          c.fillStyle = g; c.fillRect(0, TH - PE - 100, TW, PE + 100);
          c.fillStyle = "rgba(255,255,255,.7)"; for (let k = 0; k < 160; k++) c.fillRect(Math.random() * TW, TH - PE - 96 + Math.random() * 124, 6 + Math.random() * 14, 1.5);
        })],
        [1, camada(c => serra(c, ["#f3d998", "#ebcd80"], 0, 4, [5, 13]))],
      ],
      noite: () => [
        [0.25, camada(c => skyline(c, "#272b62", 110, "rgba(255,230,128,.45)"))],
        [0.5, camada(c => skyline(c, "#1a1d47", 70, "rgba(255,230,128,.8)"))],
        [1, camada(c => serra(c, ["#1c2238", "#263426"], 10, 8, [3, 8]))],
      ],
      neve: () => [
        [0.25, camada(c => serra(c, ["#9fb6d2", "#c3d4e8"], 110, 60, [2, 5, 9, 17], true))],
        [0.5, camada(c => { const y = serra(c, ["#eef4fb", "#d5e2f0"], 40, 22, [3, 7]); bosque(c, y, "#5b7d8c", true); })],
        [1, camada(c => { const y = serra(c, ["#f6f9ff", "#e8f0fa"], 14, 10, [4, 11]); bosque(c, y, "#3f6474", true); })],
      ],
    };
    // Autódromos: Interlagos com a cidade grande ao fundo, Mônaco com o mar e os prédios, Monza no parque
    CAMADAS.interlagos = () => [
      [0.25, camada(c => skyline(c, "#9fb3cc", 120, "rgba(255,255,255,.35)"))],
      [0.5, camada(c => { const y = serra(c, ["#8fb07a", "#6f9a5a"], 40, 24, [3, 7]); bosque(c, y, "#4c7a3a"); })],
      [1, camada(c => serra(c, ["#55a040", "#47923a"], 14, 10, [4, 9]))],
    ];
    CAMADAS.monaco = () => [
      [0.25, camada(c => serra(c, ["#6f9fbf", "#9cc4dc"], 120, 40, [3, 6, 11]))],
      [0.5, camada(c => skyline(c, "#c9b8a6", 80, "rgba(255,255,255,.45)"))],
      [1, camada(c => {
        const g = c.createLinearGradient(0, TH - PE - 60, 0, TH); g.addColorStop(0, "#1785c4"); g.addColorStop(1, "#4fc3f7");
        c.fillStyle = g; c.fillRect(0, TH - PE - 60, TW, PE + 60);
        c.fillStyle = "rgba(255,255,255,.75)"; for (let k = 0; k < 120; k++) c.fillRect(Math.random() * TW, TH - PE - 56 + Math.random() * 80, 6 + Math.random() * 12, 1.5);
      })],
    ];
    CAMADAS.monza = CAMADAS.campo;
    const camadas = (CAMADAS[op.pista] || CAMADAS.campo)();
    const corChao = { campo: "#55a645", praia: "#ebcd80", noite: "#263426", neve: "#e8f0fa", interlagos: "#47923a", monaco: "#9a9fa6", monza: "#56a843" }[op.pista] || "#55a645";
    // Névoa do horizonte: faixa de 1 pixel de largura, esticada
    const nevoaHoriz = (() => {
      const cv = document.createElement("canvas"); cv.width = 1; cv.height = 64;
      const c = cv.getContext("2d"), g = c.createLinearGradient(0, 0, 0, 64), n = tema.nevoa;
      const rgba = a => `rgba(${n.match(/\w\w/g).map(h => parseInt(h, 16)).join(",")},${a})`;
      g.addColorStop(0, rgba(0)); g.addColorStop(0.75, rgba(tema.noite ? 0.3 : 0.45)); g.addColorStop(1, rgba(0.15));
      c.fillStyle = g; c.fillRect(0, 0, 1, 64);
      return cv;
    })();
    // Céu (degradê, sol ou lua com brilho), vinheta da velocidade e luz dos faróis: um por tamanho de vista
    const cacheVista = new Map();
    const fundoDe = (W, H) => {
      const k = W + "x" + H;
      let f = cacheVista.get(k);
      if (f) return f;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const ceu = document.createElement("canvas"); ceu.width = Math.ceil(W * dpr); ceu.height = Math.ceil(H * 0.75 * dpr);
      const c = ceu.getContext("2d"); c.scale(dpr, dpr);
      const gc = c.createLinearGradient(0, 0, 0, H * 0.6);
      gc.addColorStop(0, tema.ceu[0]); gc.addColorStop(1, tema.ceu[1]);
      c.fillStyle = gc; c.fillRect(0, 0, W, H);
      const sx = W * 0.8, sy = H * 0.15;
      const gb = c.createRadialGradient(sx, sy, 10, sx, sy, 110);
      gb.addColorStop(0, tema.noite ? "rgba(244,241,201,.35)" : "rgba(255,250,210,.8)"); gb.addColorStop(1, "rgba(255,250,210,0)");
      c.fillStyle = gb; c.fillRect(sx - 110, sy - 110, 220, 220);
      c.fillStyle = tema.noite ? "#f4f1c9" : "#fffbe0"; c.beginPath(); c.arc(sx, sy, tema.noite ? 22 : 26, 0, 7); c.fill();
      if (tema.noite) { c.fillStyle = "rgba(180,170,120,.35)"; [[-7, -5, 6], [6, 4, 4], [-2, 9, 3]].forEach(([dx, dy, r]) => { c.beginPath(); c.arc(sx + dx, sy + dy, r, 0, 7); c.fill(); }); }
      const vinheta = document.createElement("canvas"); vinheta.width = Math.max(8, Math.ceil(W / 4)); vinheta.height = Math.max(8, Math.ceil(H / 4));
      const cvn = vinheta.getContext("2d"), wv = vinheta.width, hv = vinheta.height;
      const gv = cvn.createRadialGradient(wv / 2, hv * 0.55, Math.min(wv, hv) * 0.3, wv / 2, hv * 0.55, Math.hypot(wv, hv) * 0.6);
      gv.addColorStop(0, "rgba(0,0,0,0)"); gv.addColorStop(1, "rgba(0,0,0,.6)");
      cvn.fillStyle = gv; cvn.fillRect(0, 0, wv, hv);
      let farol = null;
      if (tema.noite) {
        farol = document.createElement("canvas"); farol.width = 256; farol.height = 256;
        const cf = farol.getContext("2d"), gf = cf.createLinearGradient(0, 256, 0, 0);
        gf.addColorStop(0, "rgba(255,240,180,.55)"); gf.addColorStop(1, "rgba(255,240,180,0)");
        cf.fillStyle = gf; cf.beginPath(); cf.moveTo(88, 256); cf.lineTo(168, 256); cf.lineTo(256, 0); cf.lineTo(0, 0); cf.closePath(); cf.fill();
      }
      f = { ceu, vinheta, farol };
      if (cacheVista.size > 3) cacheVista.clear();
      cacheVista.set(k, f);
      return f;
    };
    // Partículas da vista de um jogador: fumaça do escapamento e terra/grama/areia/neve voando
    const POEIRA = { campo: ["#6b4a2a", "#4f9a3c", "#8a6a3a"], praia: ["#e8cf8a", "#d9b86a", "#f3e0a8"], noite: ["#3a3a30", "#2b3a2b", "#4a4a44"], neve: ["#fff", "#dfe9f5", "#cfdcea"] }[op.pista] || ["#6b4a2a"];
    function particulas(j, W, H, cx, cyBase, cw, ch) {
      const ps = j.parts, dt = dtQuadro, pv = j.vel / VMAX, e = cw / 260;
      if (dt > 0) {
        const acel = j.ent.acel || (NIVEL.auto && fase === "correndo" && !j.ent.freio);
        if (acel && pv < 0.85 && !j.chegou && Math.random() < 0.6) ps.push({ f: 1, x: cx - cw * 0.25 + (Math.random() - 0.5) * 4 * e, y: cyBase - ch * 0.15, vx: (Math.random() - 0.5) * 30 * e, vy: (20 + Math.random() * 30) * e, r: 3 * e, cres: 16 * e, a: 0.22, vida: 0.7 + Math.random() * 0.3 });
        if (j.turbo > 0) for (let k = -1; k <= 1; k += 2) ps.push({ f: 2, x: cx + k * cw * 0.2 + (Math.random() - 0.5) * 3 * e, y: cyBase - ch * 0.17, vx: (Math.random() - 0.5) * 24 * e, vy: (60 + Math.random() * 60) * e, r: (5 + Math.random() * 3) * e, cres: -10 * e, a: 1, vida: 0.22 });
        if (Math.abs(j.x) > 1.05 && pv > 0.08) for (let k = 0; k < 3; k++) {
          const l = Math.random() < 0.5 ? -1 : 1;
          ps.push({ f: 0, x: cx + l * cw * 0.38, y: cyBase - 6 * e, vx: l * (30 + Math.random() * 120) * e, vy: -(80 + Math.random() * 160) * e * (0.5 + pv), r: (2 + Math.random() * 4) * e, cor: Motor.sortear(POEIRA), a: 1, vida: 0.5 + Math.random() * 0.3 });
        }
        if (ps.length > 70) ps.splice(0, ps.length - 70);
      }
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.vida -= dt; if (p.vida <= 0) { ps.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.f === 2) { p.r = Math.max(0.5, p.r + p.cres * dt); ctx.globalAlpha = Math.min(1, p.vida * 6); ctx.fillStyle = p.vida > 0.12 ? "#ffd60a" : "#ff6a00"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
        else if (p.f) { p.r += p.cres * dt; ctx.globalAlpha = p.a * Math.min(1, p.vida * 1.5); ctx.fillStyle = tema.noite ? "#9a9ab8" : "#e8e8ec"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
        else { p.vy += 600 * e * dt; ctx.globalAlpha = Math.min(1, p.vida * 3); ctx.fillStyle = p.cor; ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r); }
      }
      ctx.globalAlpha = 1;
    }
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
      const fundo = fundoDe(W, H);
      ctx.fillStyle = tema.ceu[1]; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(fundo.ceu, 0, 0, W, H * 0.75);
      if (tema.noite) { ctx.fillStyle = "#fff"; for (let i = 0; i < 50; i++) ctx.fillRect(((i * 97 + j.ceuDesl * 300) % W + W) % W, (i * 53) % (H * 0.45), i % 5 ? 1.5 : 2.5, i % 5 ? 1.5 : 2.5); }
      const esc = Math.max(0.6, Math.min(1.6, H / 520));
      nuvens.forEach((nv, i) => {
        const e2 = esc * (0.7 + (i % 3) * 0.3), larg = W + 400;
        const cx = (((i * 337 - j.ceuDesl * 400 * (0.7 + (i % 3) * 0.2)) % larg) + larg) % larg - 200, cy = H * (0.05 + (i % 3) * 0.08);
        ctx.drawImage(nv, cx, cy, nv.width * e2 * 0.8, nv.height * e2 * 0.8);
      });
      if (nuvens.length) { const nv = nuvens[1], larg = W + 400, cx = (((900 - j.ceuDesl * 300) % larg) + larg) % larg - 200; ctx.drawImage(nv, cx, H * 0.1, nv.width * esc * 0.6, nv.height * esc * 0.6); }
      const segJ = segDe(pos + CAM), pj = ((pos + CAM) % SEG) / SEG;
      const yJ = segJ.p1.y + (segJ.p2.y - segJ.p1.y) * pj;
      const horiz = H / 2 + yJ / 30;
      // Montanhas em camadas (as de longe andam menos nas curvas) e a névoa do horizonte
      const baseY = horiz + PE * esc, tw = TW * esc, th = TH * esc;
      camadas.forEach(([par, cv], k) => {
        const desl = j.morroDesl * 900 * par * (k ? 1 : 0.6);
        for (let x = -(((desl % tw) + tw) % tw); x < W; x += tw) ctx.drawImage(cv, x, baseY - th, tw + 1, th);
        if (k === 0) ctx.drawImage(nevoaHoriz, 0, baseY - th * 0.55, W, th * 0.55 - PE * esc * 0.5);
      });
      ctx.fillStyle = corChao; ctx.fillRect(0, baseY - 1, W, H - baseY + 1);
      ctx.drawImage(nevoaHoriz, 0, horiz - 40 * esc, W, 44 * esc);
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
        ctx.fillStyle = cor(tema.grama[s.cor]); ctx.fillRect(0, y2, W, y1 - y2);
        const z1 = w1 / Math.max(6, 2 * FAIXAS), z2 = w2 / Math.max(6, 2 * FAIXAS);
        // acostamento (cascalho/areia) por fora da zebra
        const a1 = z1 + w1 * 0.16, a2 = z2 + w2 * 0.16;
        poligono([x1 - w1 - a1, y1, x1 + w1 + a1, y1, x2 + w2 + a2, y2, x2 - w2 - a2, y2], cor(tonsAcost[s.cor]));
        poligono([x1 - w1 - z1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - z2, y2], cor(tema.zebra[s.cor]));
        poligono([x1 + w1 + z1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + z2, y2], cor(tema.zebra[s.cor]));
        poligono([x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2], cor(tonsPista[s.tom][s.cor]));
        // linhas brancas contínuas da beira (só perto, onde aparecem)
        if (n < 110) {
          const b1 = w1 * 0.93, b2 = w2 * 0.93, e1 = w1 / 70, e2 = w2 / 70, cb = cor(tema.noite ? "#d8d8e0" : "#f4f4f4");
          poligono([x1 - b1 - e1, y1, x1 - b1 + e1, y1, x2 - b2 + e2, y2, x2 - b2 - e2, y2], cb);
          poligono([x1 + b1 - e1, y1, x1 + b1 + e1, y1, x2 + b2 + e2, y2, x2 + b2 - e2, y2], cb);
        }
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
        if (s.turbo !== undefined && n < 120) {
          // setas amarelas e laranja, alternando a cada pedaço (parecem correr para a frente)
          const c1 = x1 + s.turbo * w1, c2 = x2 + s.turbo * w2, m1 = w1 * 0.22, m2 = w2 * 0.22;
          poligono([c1 - m1, y1, c1 + m1, y1, c2 + m2, y2, c2 - m2, y2], cor(s.i % 2 ? "#ffd60a" : "#ff8a00"));
          const p1 = y1 - (y1 - y2) * 0.15, p2 = y2 + (y1 - y2) * 0.15, cm = (c1 + c2) / 2, mm = (m1 + m2) / 2;
          if (y1 - y2 > 3) poligono([cm - mm * 0.75, p1, cm, p2, cm + mm * 0.75, p1, cm, p1 - (p1 - p2) * 0.45], cor("#fff6c2"));
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
        (d < VOLTA / 2 ? outros : atras).push({ o, z, s: segDe(z), img: spriteCarro(o.hex, virandoDe(o.ent), o.ent.freio && o.vel > 1, Math.floor(o.giro) % 2) });
      });
      for (let n = VISTA - 1; n > 0; n--) {
        const s = segs[(base.i + n) % N];
        if (!s.p1.escala || s.p1.cz <= PROF) continue;
        s.enfeites.forEach(e => coisa(img(e.tipo), TAM_ENFEITE[e.tipo] || 1000, s.p1.escala, s.p1.sx + s.p1.escala * e.x * LARGURA * W / 2, s.p1.sy, s.clip));
        rivais.forEach(r => { if (segDe(r.z) === s) carroNaPista(spriteCarro(r.cor, s.curva > 1 ? "dir" : s.curva < -1 ? "esq" : "reto", r.freando, Math.floor(r.z / 400) % 2), s, r.z, r.x); });
        outros.forEach(c => { if (c.s === s) carroNaPista(c.img, s, c.z, c.o.x); });
      }
      // O seu carro
      // (rodas girando conforme a velocidade, lanternas fortes ao frear, inclina um pouco nas curvas)
      const vira = virandoDe(j.ent), pvJ = j.vel / VMAX;
      if (j.vel > 1) j.giro += dtQuadro * (3 + 12 * pvJ);
      j.inclina += (((vira === "dir") - (vira === "esq")) * pvJ - j.inclina) * Math.min(1, dtQuadro * 6);
      const im = spriteCarro(j.hex, vira, j.ent.freio && j.vel > 1, Math.floor(j.giro) % 2);
      const cw = Math.min(W * 0.36, 260), ch = cw * im.height / im.width;
      const balanca = (j.sacode ? (Math.random() - 0.5) * 6 : 0) + Math.sin(tempo * 30) * pvJ * 1.2;
      const fundoCarro = H - 8 + balanca;
      if (fundo.farol) {
        ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5;
        ctx.drawImage(fundo.farol, W / 2 - cw * 1.3 + j.inclina * cw * 0.3, horiz + (fundoCarro - ch * 0.5 - horiz) * 0.15, cw * 2.6, (fundoCarro - ch * 0.5 - horiz) * 0.85);
        ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      }
      ctx.save(); ctx.translate(W / 2, fundoCarro); ctx.rotate(-j.inclina * 0.035);
      ctx.drawImage(im, -cw / 2, -ch, cw, ch);
      ctx.restore();
      particulas(j, W, H, W / 2, fundoCarro, cw, ch);
      // sensação de velocidade: risquinhos nas laterais e cantos escurecendo
      if (pvJ > 0.45) ctx.globalAlpha = Math.min(1, (pvJ - 0.45) / 0.55) * 0.8, ctx.drawImage(fundo.vinheta, 0, 0, W, H), ctx.globalAlpha = 1;
      if (pvJ > 0.72 && dtQuadro > 0) {
        const k = (pvJ - 0.72) / 0.28, R = Math.max(W, H);
        ctx.strokeStyle = `rgba(255,255,255,${0.35 * k})`; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (Math.random() - 0.5) * 1.1 + (i % 2 ? Math.PI : 0), r0 = R * (0.35 + Math.random() * 0.3), l = R * (0.05 + 0.1 * k * Math.random());
          ctx.moveTo(W / 2 + Math.cos(a) * r0, horiz + Math.sin(a) * r0 * 0.6); ctx.lineTo(W / 2 + Math.cos(a) * (r0 + l), horiz + Math.sin(a) * (r0 + l) * 0.6);
        }
        ctx.stroke();
      }
      // O outro jogador logo atrás (entre a câmera e o seu carro) fica na frente do desenho
      atras.forEach(c => { if (c.s.p1.escala && c.s.p1.cz > PROF) carroNaPista(c.img, c.s, c.z, c.o.x); });
      // Ultrapassagem: som e aviso (com folga, para não repetir quando dois carros andam lado a lado)
      const p = posicao(j);
      if (p < j.ultPos && j.ultPos < 9 && fase === "correndo" && !j.chegou) {
        Motor.nota(990, { dur: 0.12, tipo: "triangle", vol: 0.08 });
        if (!j.ultAviso || tempo - j.ultAviso > 1.6) { avisar(j, `ULTRAPASSOU! ${p}º`, "#8cff9e", 1.2); j.ultAviso = tempo; }
      }
      j.ultPos = p;
      const s = Math.max(0.75, Math.min(2.2, Math.min(W, H * 1.7) / 680)); // tudo cresce em tela grande
      if (fase === "largada") semaforo(W, H, s, luzesAcesas(), false);
      else if (fase === "correndo" && contagem > -1.2) { semaforo(W, H, s, 5, true); texto("JÁ!", 120 * s, "#2a9d55", W, H); }
      else if (DOIS && j.chegou && !j.aviso) texto(`${MEDALHA(j.chegou)} ${j.chegou}º lugar!`, 52 * s, "#ffd60a", W, H);
      if (j.aviso) {
        const av = j.aviso, pop = 1 + 0.35 * Math.max(0, 1 - (av.dur - av.t) * 6);
        ctx.save(); ctx.translate(W / 2, H * 0.3); ctx.scale(pop, pop); ctx.globalAlpha = Math.min(1, av.t * 3);
        ctx.font = `bold ${Math.min(52 * s, W / 9)}px Fredoka, sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
        ctx.lineWidth = 9 * s; ctx.strokeStyle = "rgba(10,15,30,.75)"; ctx.strokeText(av.txt, 0, 0);
        ctx.fillStyle = av.cor; ctx.fillText(av.txt, 0, 0);
        ctx.restore();
        av.t -= dtQuadro; if (av.t <= 0) j.aviso = null;
      }
      painel(j, W, H, s);
      if (pausado) texto("⏸️ Pausa", 50 * s, "#fff", W, H);
    }
    // Semáforo da largada: 5 luzes; ao apagar as vermelhas, ficam verdes (JÁ!)
    function semaforo(W, H, s, acesas, verde) {
      const r = 16 * s, gap = 10 * s, w = 5 * r * 2 + 4 * gap + 28 * s, h = r * 2 + 24 * s, x = W / 2 - w / 2, y = H * 0.12;
      ctx.fillStyle = "rgba(15,18,28,.88)"; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14 * s); ctx.fill();
      ctx.strokeStyle = "#555"; ctx.lineWidth = 2 * s; ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const cx = x + 14 * s + r + i * (2 * r + gap), cy = y + h / 2, liga = verde || i < acesas;
        if (liga) { ctx.fillStyle = verde ? "rgba(60,255,120,.35)" : "rgba(255,40,40,.35)"; ctx.beginPath(); ctx.arc(cx, cy, r * 1.5, 0, 7); ctx.fill(); }
        ctx.fillStyle = !liga ? "#3a1416" : verde ? "#3cff78" : "#ff2a2a";
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
        if (liga) { ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.3, 0, 7); ctx.fill(); }
      }
      if (!verde && fase === "largada" && acesas === 0) texto("Prepare-se!", 44 * s, "#fff", W, H);
    }
    // Placar de cada vista: posição bem grande, volta e tempo; classificação na lateral (como na
    // Fórmula 1) e o velocímetro do outro lado
    function painel(j, W, H, s) {
      const lugar = lugarDe(j), x0 = j.n === 1 ? 70 : 12, y0 = DOIS && j.n === 2 ? 10 : 8;
      const pw = 172 * s, ph = 76 * s;
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "rgba(15,20,35,.78)"; ctx.beginPath(); ctx.roundRect(x0, y0, pw, ph, 14 * s); ctx.fill();
      ctx.fillStyle = j.hex; ctx.fillRect(x0, y0 + 10 * s, 5 * s, ph - 20 * s);
      ctx.textAlign = "left"; ctx.fillStyle = lugar === 1 ? "#ffd60a" : "#fff";
      ctx.font = `bold ${56 * s}px Fredoka, sans-serif`;
      const tl = String(lugar);
      ctx.fillText(tl, x0 + 14 * s, y0 + 58 * s);
      const lw = ctx.measureText(tl).width;
      ctx.font = `bold ${22 * s}px Fredoka, sans-serif`;
      ctx.fillText("º", x0 + 15 * s + lw, y0 + 34 * s);
      ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = `bold ${16 * s}px Fredoka, sans-serif`;
      ctx.fillText(`de ${TOTAL_CARROS}`, x0 + 15 * s + lw, y0 + 58 * s);
      const xd = x0 + 92 * s;
      ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = `bold ${13 * s}px Fredoka, sans-serif`;
      ctx.fillText("VOLTA", xd, y0 + 24 * s);
      ctx.fillStyle = "#fff"; ctx.font = `bold ${26 * s}px Fredoka, sans-serif`;
      ctx.fillText(`${Math.min(j.voltas + 1, TOTAL_VOLTAS)}/${TOTAL_VOLTAS}`, xd, y0 + 48 * s);
      ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = `bold ${15 * s}px Fredoka, sans-serif`;
      ctx.fillText(`⏱ ${relogio()}`, xd, y0 + 68 * s);
      // classificação (só se couber)
      const lh = 24 * s, lista = classificacao();
      if (H > ph + lista.length * lh + 120 && W > 300) {
        let y = y0 + ph + 8 * s;
        lista.forEach((c, i) => {
          const eu = c.j === j, outro = c.j && c.j !== j, w = pw * (eu ? 1 : 0.92);
          ctx.fillStyle = eu ? "#ffd60a" : outro ? "rgba(255,255,255,.88)" : "rgba(15,20,35,.72)";
          ctx.beginPath(); ctx.roundRect(x0, y, w, lh - 3 * s, 7 * s); ctx.fill();
          ctx.fillStyle = c.hex; ctx.fillRect(x0 + 30 * s, y + 4 * s, 5 * s, lh - 11 * s);
          ctx.fillStyle = eu || outro ? "#1d2333" : "#fff"; ctx.font = `bold ${15 * s}px Fredoka, sans-serif`;
          ctx.textAlign = "center"; ctx.fillText(String(i + 1), x0 + 15 * s, y + lh * 0.66);
          ctx.textAlign = "left"; ctx.fillText(c.nome.toUpperCase().slice(0, c.tempo ? 7 : 12), x0 + 42 * s, y + lh * 0.66);
          if (c.tempo) { ctx.textAlign = "right"; ctx.font = `bold ${11 * s}px Fredoka, sans-serif`; ctx.fillText(tempoTxt(c.tempo), x0 + w - 7 * s, y + lh * 0.64); } // já chegou: o tempo dele
          y += lh;
        });
      }
      // velocímetro
      const R = 46 * s, cx = W - R - 14, cy = (DOIS && j.n === 1 ? 14 : 66) + R;
      const kmh = Math.round(j.vel / VMAX * 220 * NIVEL.max), frac = Math.min(1, j.vel / (VMAX * 1.3));
      ctx.fillStyle = "rgba(15,20,35,.78)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.lineCap = "round"; ctx.lineWidth = 7 * s;
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc(cx, cy, R - 9 * s, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
      ctx.strokeStyle = j.turbo > 0 ? "#ff8a00" : frac > 0.72 ? "#ffd60a" : "#3cff78";
      ctx.beginPath(); ctx.arc(cx, cy, R - 9 * s, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * Math.max(0.01, frac))); ctx.stroke();
      ctx.lineCap = "butt";
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `bold ${28 * s}px Fredoka, sans-serif`;
      ctx.fillText(String(kmh), cx, cy + 8 * s);
      ctx.fillStyle = j.turbo > 0 ? "#ffd60a" : "rgba(255,255,255,.65)"; ctx.font = `bold ${12 * s}px Fredoka, sans-serif`;
      ctx.fillText(j.turbo > 0 ? "⚡ TURBO" : "km/h", cx, cy + 26 * s);
    }
    function texto(t, tamanho, cor, W, H) {
      ctx.font = `bold ${Math.min(tamanho, W / 6)}px Fredoka, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 8; ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.strokeText(t, W / 2, H * 0.38);
      ctx.fillStyle = cor; ctx.fillText(t, W / 2, H * 0.38);
    }

    // ----- Laço -----
    let ultimo = performance.now();
    function laco(t) {
      if (!vivo()) { T.desligar(); roncos.forEach(r => r.parar()); return; }
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      if (DOIS) lerControles();
      if (!pausado) atualizar(dt);
      dtQuadro = pausado ? 0 : dt;
      jog.forEach((j, i) => {
        const quieto = pausado || !Motor.somLigado() || (fase === "fim" && j.vel < VMAX * 0.05);
        roncos[i].tocar(quieto ? null : j.vel / VMAX, !!(j.ent.acel || (NIVEL.auto && fase === "correndo" && !j.ent.freio)));
      });
      desenhar(); // o placar é desenhado na própria tela (posição, volta, classificação e velocímetro)
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
    if (DOIS) Motor.falar(`Corrida a dois! ${jog[0].nome} usa o primeiro controle ou as setas. ${jog[1].nome} usa o segundo controle ou as letras W A S D. Passe nas setas amarelas para ganhar turbo!`);
    else Motor.falar((tema.gp ? `Grande Prêmio de ${NOMES_PISTA[op.pista].split(" (")[0]}! ${TOTAL_VOLTAS} voltas. ` : `Corrida de ${TOTAL_VOLTAS} ${TOTAL_VOLTAS === 1 ? "volta" : "voltas"}! `) +
      (NIVEL.auto ? "O carro acelera sozinho: use as setas para virar." : "Acelere, faça as curvas e passe os outros carros!") + " Passe nas setas amarelas para ganhar turbo!");
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
      // grama com pontinhos de tons diferentes
      const gramado = (c, x, y, w, h) => {
        c.fillStyle = "#7cc96c"; c.fillRect(x, y, w, h);
        for (let k = 0; k < w * h / 40; k++) { c.fillStyle = k % 2 ? "rgba(40,110,40,.18)" : "rgba(255,255,255,.12)"; c.fillRect(x + Math.random() * w, y + Math.random() * h, 2, 2); }
      };
      // árvore vista de cima: sombra caindo para a direita e copa com luz em cima à esquerda
      const arvoreCima = (c, x, y, r) => {
        c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.arc(x + r * 0.5, y + r * 0.6, r, 0, 7); c.fill();
        const g = c.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
        g.addColorStop(0, "#6fd060"); g.addColorStop(1, "#22702a");
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
        c.fillStyle = "rgba(255,255,255,.15)"; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, 7); c.fill();
      };
      for (let by = 0; by < NT; by += CEL) for (let bx = 0; bx < NT; bx += CEL) {
        const x0 = (bx + 2) * L, y0 = (by + 2) * L, t = (CEL - 2) * L;
        if (bx + 2 >= NT || by + 2 >= NT) continue;
        // calçada com lajotas e meio-fio
        m.fillStyle = "#cfd4d8"; m.fillRect(x0, y0, t, t);
        m.fillStyle = "rgba(0,0,0,.06)";
        for (let k = 12; k < t; k += 12) { m.fillRect(x0 + k, y0, 1, t); m.fillRect(x0, y0 + k, t, 1); }
        m.strokeStyle = "#9aa1a8"; m.lineWidth = 3; m.strokeRect(x0 + 1.5, y0 + 1.5, t - 3, t - 3);
        const tipo = Motor.sortear(["predios", "predios", "casas", "casas", "praca"]);
        m.save(); m.beginPath(); m.rect(x0, y0, t, t); m.clip(); // sombras não saem do quarteirão
        if (tipo === "praca") {
          gramado(m, x0 + 8, y0 + 8, t - 16, t - 16);
          m.fillStyle = "#e9d8a6"; m.fillRect(x0 + t / 2 - 8, y0 + 8, 16, t - 16); m.fillRect(x0 + 8, y0 + t / 2 - 8, t - 16, 16);
          m.fillStyle = "rgba(0,0,0,.08)"; m.fillRect(x0 + t / 2 + 6, y0 + 8, 2, t - 16); m.fillRect(x0 + 8, y0 + t / 2 + 6, t - 16, 2);
          // chafariz: borda de pedra, água com degradê e o jato no meio
          const fx = x0 + t / 2, fy = y0 + t / 2;
          m.fillStyle = "rgba(0,0,0,.2)"; m.beginPath(); m.arc(fx + 3, fy + 4, 26, 0, 7); m.fill();
          m.fillStyle = "#bfc4c9"; m.beginPath(); m.arc(fx, fy, 26, 0, 7); m.fill();
          const ga = m.createRadialGradient(fx - 6, fy - 6, 2, fx, fy, 21);
          ga.addColorStop(0, "#9be4ff"); ga.addColorStop(1, "#2a8fd0");
          m.fillStyle = ga; m.beginPath(); m.arc(fx, fy, 21, 0, 7); m.fill();
          m.fillStyle = "rgba(255,255,255,.8)"; m.beginPath(); m.arc(fx, fy, 5, 0, 7); m.fill();
          m.strokeStyle = "rgba(255,255,255,.5)"; m.lineWidth = 1.5; m.beginPath(); m.arc(fx, fy, 11, 0, 7); m.stroke();
          for (let k = 0; k < 10; k++) { const ax = x0 + 24 + rnd(0, t - 48), ay = y0 + 24 + rnd(0, t - 48); if (Math.abs(ax - x0 - t / 2) < 20 || Math.abs(ay - y0 - t / 2) < 20) continue; arvoreCima(m, ax, ay, 12); }
          m.fillStyle = "#8d5a2b"; [[x0 + t / 2 - 22, y0 + 30], [x0 + t / 2 + 14, y0 + t - 38]].forEach(([bx, by]) => { m.fillRect(bx, by, 8, 16); m.fillStyle = "#6b3e1f"; m.fillRect(bx, by, 2, 16); m.fillStyle = "#8d5a2b"; }); // bancos
        } else {
          const n = tipo === "predios" ? 2 : 3, lado = (t - 16) / n;
          const lotes = [];
          for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) lotes.push({ px: x0 + 8 + i * lado + 3, py: y0 + 8 + j * lado + 3, ld: lado - 6, alt: tipo === "predios" ? 10 + Math.random() * 18 : 6 });
          if (tipo === "casas") lotes.forEach(({ px, py, ld }) => gramado(m, px, py, ld, ld));
          // primeiro as sombras (sol no alto à esquerda: caem para baixo e para a direita)
          m.fillStyle = "rgba(0,0,0,.28)";
          lotes.forEach(({ px, py, ld, alt }) => {
            const a = tipo === "casas" ? 8 : 0, x = px + a, y = py + a, l = ld - a * 2;
            m.beginPath(); m.moveTo(x + l, y); m.lineTo(x + l + alt, y + alt); m.lineTo(x + l + alt, y + l + alt); m.lineTo(x + alt, y + l + alt); m.lineTo(x, y + l); m.lineTo(x + l, y + l); m.closePath(); m.fill();
          });
          lotes.forEach(({ px, py, ld, alt }) => {
            if (tipo === "predios") {
              const cor = Motor.sortear(["#8d99ae", "#b56576", "#6d597a", "#457b9d", "#e5989b", "#a3b18a"]);
              // parede de baixo aparecendo (dá a ideia de altura), com janelas
              const pa = Math.round(alt * 0.45);
              m.fillStyle = clarear(cor, -0.35); m.fillRect(px, py + ld - pa, ld, pa);
              m.fillStyle = "#cfe9ff"; for (let k = 0; k < 5; k++) m.fillRect(px + 5 + k * (ld - 10) / 5, py + ld - pa + 2, 5, Math.max(2, pa - 4));
              // telhado: mureta clara, miolo em degradê e coisas em cima
              const ty = py, th = ld - pa;
              m.fillStyle = clarear(cor, 0.3); m.fillRect(px, ty, ld, th);
              const gt = m.createLinearGradient(px, ty, px + ld, ty + th);
              gt.addColorStop(0, clarear(cor, 0.08)); gt.addColorStop(1, clarear(cor, -0.18));
              m.fillStyle = gt; m.fillRect(px + 4, ty + 4, ld - 8, th - 8);
              m.fillStyle = "rgba(0,0,0,.18)"; m.fillRect(px + 4, ty + 4, ld - 8, 2); m.fillRect(px + 4, ty + 4, 2, th - 8);
              const extra = Math.random();
              if (extra < 0.4) { // caixa d'água
                const cx = px + ld * 0.7, cy = ty + th * 0.3;
                m.fillStyle = "rgba(0,0,0,.25)"; m.beginPath(); m.arc(cx + 3, cy + 3, 8, 0, 7); m.fill();
                const gc = m.createRadialGradient(cx - 3, cy - 3, 1, cx, cy, 8); gc.addColorStop(0, "#f2f4f6"); gc.addColorStop(1, "#8f99a3");
                m.fillStyle = gc; m.beginPath(); m.arc(cx, cy, 8, 0, 7); m.fill();
              } else if (extra < 0.7) { // heliponto
                const cx = px + ld / 2, cy = ty + th / 2;
                m.strokeStyle = "rgba(255,255,255,.7)"; m.lineWidth = 2; m.beginPath(); m.arc(cx, cy, Math.min(ld, th) * 0.28, 0, 7); m.stroke();
                m.fillStyle = "rgba(255,255,255,.75)"; m.font = `bold ${Math.round(th * 0.3)}px sans-serif`; m.textAlign = "center"; m.textBaseline = "middle"; m.fillText("H", cx, cy + 1);
              }
              m.fillStyle = "#d9dde1"; m.fillRect(px + 8, ty + th - 18, 12, 9); m.fillRect(px + 24, ty + th - 18, 12, 9); // ar-condicionado
              m.fillStyle = "rgba(0,0,0,.3)"; m.fillRect(px + 8, ty + th - 9, 12, 2); m.fillRect(px + 24, ty + th - 9, 12, 2);
            } else {
              // casa: telhado de quatro águas (cada lado com uma luz) e chaminé
              const cor = Motor.sortear(["#e63946", "#f77f00", "#9b5de5", "#2a9d55", "#8d5524"]);
              const x = px + 8, y = py + 8, l = ld - 16, r = l * 0.22;
              const agua = (pts, f) => { m.fillStyle = clarear(cor, f); m.beginPath(); m.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) m.lineTo(pts[k], pts[k + 1]); m.closePath(); m.fill(); };
              agua([x, y, x + l, y, x + l - r, y + l / 2, x + r, y + l / 2], 0.25);   // de cima (no sol)
              agua([x, y + l, x + l, y + l, x + l - r, y + l / 2, x + r, y + l / 2], -0.25); // de baixo
              agua([x, y, x + r, y + l / 2, x, y + l], 0.08);
              agua([x + l, y, x + l - r, y + l / 2, x + l, y + l], -0.38);
              m.strokeStyle = "rgba(0,0,0,.25)"; m.lineWidth = 1; m.beginPath(); m.moveTo(x + r, y + l / 2); m.lineTo(x + l - r, y + l / 2); m.stroke();
              m.fillStyle = "#7a5a4a"; m.fillRect(x + l * 0.68, y + l * 0.12, 6, 6); m.fillStyle = "rgba(0,0,0,.3)"; m.fillRect(x + l * 0.68 + 6, y + l * 0.12 + 2, 3, 6);
              arvoreCima(m, px + 5, py + ld - 5, 5);
            }
          });
        }
        m.restore();
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
      // textura do asfalto (pontinhos claros e escuros, manchas de óleo no meio das faixas)
      for (let k = 0; k < 26000; k++) {
        const x = Math.random() * MUNDO, y = Math.random() * MUNDO;
        if (!noMundo(x, y)) continue;
        m.fillStyle = k % 2 ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.08)"; m.fillRect(x, y, 2, 2);
      }
      m.fillStyle = "rgba(0,0,0,.06)";
      for (let k = 0; k < 160; k++) { const x = Math.random() * MUNDO, y = Math.random() * MUNDO; if (noMundo(x, y)) { m.beginPath(); m.ellipse(x, y, 6 + Math.random() * 8, 4 + Math.random() * 4, Math.random() * 3, 0, 7); m.fill(); } }
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
    // Meta do passeio: 5 entregas (3 para 5 a 6 anos); no fim, tela de conclusão com tempo e estrelas
    const META = op.fid === "5-6" ? 3 : 5;
    let terminou = false;
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
          if (entregas >= META) { concluir(); return; }
          const faltam = META - entregas;
          Motor.falar(`Entregue! Falta${faltam > 1 ? "m" : ""} ${faltam} ${faltam === 1 ? "entrega" : "entregas"}. Vamos buscar outra encomenda!`);
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
      transito.forEach(c => {
        if (c.x < vx0 || c.x > vx1 || c.y < vy0 || c.y > vy1) return;
        const cp = c.tipo === "onibus" ? 64 : 36, lg = c.tipo === "onibus" ? 20 : 18;
        sombraDeCima(ctx, c.x, c.y, c.ang, cp, lg);
        ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.ang); carroDeCima(ctx, c.cor, cp, lg, c.tipo);
        if (c.v < c.vmax * 0.5 && c.v > 0) { ctx.fillStyle = "rgba(255,40,40,.45)"; ctx.fillRect(-cp / 2 - 4, -lg / 2 + 1, 5, 6); ctx.fillRect(-cp / 2 - 4, lg / 2 - 7, 5, 6); } // freando
        ctx.restore();
      });
      sombraDeCima(ctx, eu.x, eu.y, eu.ang, 38, 19);
      ctx.save(); ctx.translate(eu.x, eu.y); ctx.rotate(eu.ang); carroDeCima(ctx, meuCarro, 38, 19);
      if (T.ent.freio && eu.v > 0) { ctx.fillStyle = "rgba(255,40,40,.55)"; ctx.fillRect(-23, -8.5, 6, 6); ctx.fillRect(-23, 2.5, 6, 6); ctx.fillStyle = "#ff8080"; ctx.fillRect(-19, -7.5, 2, 4); ctx.fillRect(-19, 3.5, 2, 4); }
      else if (eu.v < -5) { ctx.fillStyle = "#fff"; ctx.fillRect(-19, -2, 2, 4); } // luz de ré
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

    // Fez todas as entregas: para o carro e mostra o resultado (recorde: estrelas pegas no caminho)
    function concluir() {
      terminou = true; eu.v = 0;
      const seg = Math.round(tempo), t = `${Math.floor(seg / 60)}:${String(seg % 60).padStart(2, "0")}`;
      const novo = typeof Placar !== "undefined" && Placar.recorde("carros", `entregas-${META}`, moedas);
      Motor.falar(`Parabéns! Você fez as ${META} entregas em ${Math.floor(seg / 60) ? Math.floor(seg / 60) + " minutos e " : ""}${seg % 60} segundos!`);
      setTimeout(() => { if (vivo()) T.fim(`${META} entregas feitas!`, "📦", `⏱️ ${t} · ⭐ ${moedas}` + (novo ? " · 🏆 recorde de estrelas!" : ""),
        () => cidade(area, op), () => JOGOS.find(j => j.id === "carros").iniciar(area, { id: op.fid }), null, "🔁 Passear de novo"); }, 900);
    }

    let ultimo = performance.now(), infoAnt = "";
    const ronco = somDeMotor();
    function laco(t) {
      if (!vivo()) { T.desligar(); ronco.parar(); return; }
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t;
      if (!pausado && !terminou) atualizar(dt);
      ronco.tocar(pausado || !Motor.somLigado() ? null : Math.abs(eu.v) / NIVEL.vmax, !!(T.ent.acel || T.ent.freio && eu.v < 0));
      desenhar();
      const dist = Math.round(Math.hypot(missao.alvo.x - eu.x, missao.alvo.y - eu.y) / 12);
      const inf = `${missao.fase === "buscar" ? "📦 Buscar" : "🏠 Entregar"}: ${dist} m|✅ ${entregas} de ${META} entregas|⭐ ${moedas}`;
      if (inf !== infoAnt) { infoAnt = inf; T.mostrarInfo(inf.split("|")); }
      requestAnimationFrame(laco);
    }
    requestAnimationFrame(laco);
    Motor.falar(`Passeio na cidade! Faça ${META} entregas. Siga a seta amarela para buscar a encomenda. E atenção aos semáforos!`);
  }
})();
