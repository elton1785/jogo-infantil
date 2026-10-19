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
  function somDeMotor(lado = 0, formula = false) {
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
        // 4 marchas (8 no carro de fórmula, que grita bem mais agudo): a rotação sobe em cada uma e cai na troca
        const nm = formula === "rally" ? 6 : formula ? 8 : 4, m = Math.min(nm - 1, Math.floor(pv * nm)), rot = pv * nm - m;
        const f = formula === "rally" ? 52 + m * 11 + rot * 95 + (acelerando && pv < 0.05 ? 16 : 0) : formula ? 70 + m * 9 + rot * 120 + (acelerando && pv < 0.05 ? 20 : 0) : 42 + m * 10 + rot * 62 + (acelerando && pv < 0.05 ? 12 : 0);
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
      { figura: "🎮", texto: "No controle: A ou RT acelera, LT freia, Y é a buzina. No Rally, X é o freio de mão (para fazer os grampos de lado). No Grande Prêmio, X abre o DRS quando ele estiver liberado." },
      { figura: "⛽🛑", texto: "Os botões da direita aceleram e freiam (segurando o freio, dá ré). No modo fácil o carro acelera sozinho." },
      { figura: "🥇", texto: "Você escolhe quantas voltas! Passe os outros carros e não saia da pista, que na grama o carro fica lento. Cada pista tem o seu traçado." },
      { figura: "🏎️🏟️", texto: "No Grande Prêmio, os carros são de fórmula e as pistas têm o traçado e as curvas de verdade: Interlagos (anti-horário, com subidas e descidas), Mônaco (nas ruas, com muros e o túnel) e Monza (retas enormes e chicanes). O mapa da pista mostra onde cada carro está." },
      { figura: "🛑", texto: "No Grande Prêmio, as placas 150, 100 e 50 avisam a curva fechada: freie antes dela! Fora da pista tem brita (o carro quase para) e, em Mônaco, o muro." },
      { figura: "🟢", texto: "Na zona de DRS (a placa verde na reta), se você estiver a menos de 1 segundo do carro da frente, a asa traseira abre e o carro corre mais. Frear fecha a asa." },
      { figura: "🚦🔴", texto: "Na largada, as 5 luzes vermelhas acendem uma por uma. Quando ficam verdes, é JÁ!" },
      { figura: "🚙💨", texto: "No Rally, você corre sozinho contra o relógio, em especiais na Finlândia (terra e saltos), na Suécia (neve) ou nos Sertões (terra vermelha). O navegador fala as curvas antes: o número é o tamanho da curva, de 1 (bem fechada) a 6 (quase reta). No salto, mantenha o carro reto!" },
      { figura: "🚙🪨", texto: "Off-road 4x4 não é corrida: é um desafio de trilha, visto de lado. Passe pelos obstáculos (subida de pedra, atoleiro, rio, valeta, tronco, duna, descida) sem capotar. Use o 4x4 (força nas quatro rodas) e a reduzida (mais força, menos velocidade). Atolou? Use o guincho. No rio, entre devagar, senão o motor afoga!" },
      { figura: "⏱️", texto: "No Rally, cada especial tem parciais: verde é na frente do líder, vermelho é atrás. No fim, a classificação geral soma os tempos de todas as especiais." },
      { figura: "⚡", texto: "Na corrida comum, passe por cima das setas amarelas na pista para ganhar turbo e correr mais que todo mundo!" },
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
    jalapao: "Jalapão (dunas e rios)", lencois: "Lençóis Maranhenses (dunas e lagoas)", caatinga: "Sertão (caatinga e pedras)",
    finlandia: "Finlândia (terra e saltos)", suecia: "Suécia (neve e gelo)", sertoes: "Sertões (Brasil)",
    interlagos: "Interlagos (São Paulo)", monaco: "Mônaco (ruas da cidade)", monza: "Monza (a mais rápida)" };
  function escolhas(area, faixa) {
    const fid = (faixa && faixa.id) || "6-8";
    const perfil = typeof Album !== "undefined" ? Album.perfilAtual().nome : "";
    const corrida_ = op => op.modo === "corrida" || op.modo === "gp", gp = op => op.modo === "gp", comum = op => op.modo === "corrida", rally = op => op.modo === "rally", off = op => op.modo === "offroad";
    const dois = op => corrida_(op) && op.jogadores === "2";
    const cores = (exceto, formula) => Object.keys(CORES).filter(k => k !== exceto).map(k => [k, NOMES_COR[k], () => figuraCarro(k, formula)]);
    Motor.telaOpcoes(area, {
      chave: `carros-${fid}`,
      padrao: { modo: "corrida", jogadores: "1", cor: "vermelho", cor2: "azul", pista: "campo", circuito: "interlagos", etapa: "finlandia", trilha: "jalapao", especiais: "2", voltas: "3", nivel: fid === "5-6" ? "facil" : "normal", nome1: perfil === "Visitante" ? "" : perfil, nome2: "" },
      opcoes: [
        { chave: "modo", titulo: "O que vamos fazer?", valores: [["corrida", "Corrida", op => figuraCena("campo", [CORES[op.cor]])], ["gp", "Grande Prêmio", op => figuraCena("interlagos", [CORES[op.cor]], false, true)], ["rally", "Rally", op => figuraCena("finlandia", [CORES[op.cor]], false, "rally")], ["offroad", "Off-road 4x4", op => figuraCena("jalapao", [CORES[op.cor]], false, "jeep")], ["cidade", "Passear na cidade", op => figuraCidade(op.cor)]] },
        { chave: "jogadores", titulo: "Quantos jogadores?", quando: corrida_, valores: [["1", "1 jogador", op => figuraCena("campo", [CORES[op.cor]])], ["2", "2 jogadores", () => figuraCena("campo", [CORES.vermelho, CORES.azul], true)]] },
        { chave: "nome1", tipo: "texto", quando: op => corrida_(op) || rally(op) || off(op), titulo: op => (dois(op) ? "Nome do jogador 1" : "Qual é o nome do piloto?"), dica: op => (dois(op) ? "Jogador 1" : "Você") },
        { chave: "nome2", tipo: "texto", quando: dois, titulo: "Nome do jogador 2", dica: "Jogador 2" },
        { chave: "cor", titulo: op => (dois(op) ? "Carro do jogador 1" : "Escolha o seu carro"), valores: op => cores(undefined, gp(op) ? true : rally(op) ? "rally" : off(op) ? "jeep" : false) },
        { chave: "cor2", titulo: "Carro do jogador 2", quando: dois, valores: op => cores(op.cor, gp(op)) },
        { chave: "pista", titulo: "Escolha a pista", quando: comum, valores: () => Object.keys(TEMAS).filter(k => !TEMAS[k].gp && !TEMAS[k].rally && !TEMAS[k].off).map(k => [k, NOMES_PISTA[k], () => figuraCena(k, [])]) },
        { chave: "etapa", titulo: "Onde vai ser o rally?", quando: rally, valores: () => Object.keys(TEMAS).filter(k => TEMAS[k].rally).map(k => [k, NOMES_PISTA[k], () => figuraCena(k, [], false, "rally")]) },
        { chave: "trilha", titulo: "Onde vai ser a trilha 4x4?", quando: off, valores: () => Object.keys(TEMAS).filter(k => TEMAS[k].off).map(k => [k, NOMES_PISTA[k], () => figuraCena(k, [], false, "jeep")]) },
        { chave: "especiais", titulo: "Quantas especiais?", quando: rally, valores: [["1", "⏱️ 1 especial"], ["2", "⏱️ 2 especiais"], ["3", "⏱️ 3 especiais"]] },
        { chave: "circuito", titulo: "Escolha o autódromo", quando: gp, valores: () => Object.keys(TEMAS).filter(k => TEMAS[k].gp).map(k => [k, NOMES_PISTA[k], () => figuraCena(k, [], false, true)]) },
        { chave: "voltas", titulo: "Quantas voltas?", quando: corrida_, valores: op => (gp(op) ? ["3", "5", "8"] : ["1", "3", "5"]).map(v => [v, `${v} ${v === "1" ? "volta" : "voltas"}`]) },
        { chave: "nivel", titulo: "Jeito de dirigir", valores: [["facil", "🐢 Fácil"], ["normal", "🐇 Normal"], ["dificil", "🚀 Rápido"]] },
      ],
      aoJogar: op => op.modo === "offroad" ? Desafio4x4.iniciar(area, { ...op, fid }, () => escolhas(area, faixa)) : (op.modo === "cidade" ? cidade : corrida)(area, { ...op, fid, pista: op.modo === "gp" ? op.circuito : op.modo === "rally" ? op.etapa : op.modo === "offroad" ? op.trilha : op.pista, jogadores: op.modo === "rally" || op.modo === "offroad" ? "1" : op.jogadores, especial: 1, acum: null, ral: null }),
    });
  }
  // Figuras dos cartões: o carro de verdade, a pista com a paisagem e a cidade vista de cima
  function figuraCarro(cor, formula) {
    const cv = (formula === "jeep" ? jeepDeTras : formula === "rally" ? carroRally : formula ? formulaDeTras : carroDeTras)(CORES[cor]);
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
      if (carro) { const im = (formula === "jeep" ? jeepDeTras : formula === "rally" ? carroRally : formula ? formulaDeTras : carroDeTras)(carro), cw = Math.min(w * 0.6, 130), ch = cw * im.height / im.width; c.drawImage(im, w / 2 - cw / 2, H - ch - 4, cw, ch); }
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
  function montarTela(area, { aoPausar, dois = false, acao = null }) {
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
      if (acao) dir.prepend(botao(acao, alvo, "acao", "acao"));
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
    // 1 jogador: Enter/↑/RT aceleram, ↓/LT freiam, X (espaço) é a ação do modo (freio de mão no rally,
    // DRS no Grande Prêmio) e Y (tecla y) é a buzina
    const MAPA = { ArrowLeft: "esq", ArrowRight: "dir", ArrowUp: "acel", ArrowDown: "freio", Enter: "acel", c: "acel", z: "freio", " ": acao ? "acao" : "acel", y: "buzina", a: "esq", d: "dir", w: "acel", s: "freio" };
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
  // Carro de rally visto de trás (hatch de competição): pneus de terra largos com cravos, paralamas
  // bem alargados, cabine estreita e alta, vidro pequeno com a faixa RALLY e o número, asa enorme no
  // teto com pescoço de cisne, tomada de ar e antena, lanternas finas, difusor, escape no meio,
  // lameiros grandes e barro respingado
  function carroRally(cor, curva = 0, freio = false, fase = 0) {
    const W = 232, H = 152, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    c.translate(W / 2, H);
    const sk = curva * 9, escuro = clarear(cor, -0.45), claro = clarear(cor, 0.32);
    const gs = c.createRadialGradient(0, 0, 10, 0, 0, 116);
    gs.addColorStop(0, "rgba(0,0,0,.55)"); gs.addColorStop(1, "rgba(0,0,0,0)");
    c.save(); c.translate(0, -6); c.scale(1, 0.13); c.fillStyle = gs; c.beginPath(); c.arc(0, 0, 116, 0, 7); c.fill(); c.restore();
    // pneus de terra: largos, cravos grandes e barro
    [-1, 1].forEach(l => {
      const px = l < 0 ? -110 : 72;
      c.fillStyle = "#141416"; c.beginPath(); c.roundRect(px, -52, 38, 48, 9); c.fill();
      c.fillStyle = "#2c2c31";
      for (let y = -50 + (fase % 2) * 6, k = 0; y < -8; y += 12, k++) { c.fillRect(px + 3 + (k % 2) * 8, y, 12, 6); c.fillRect(px + 21 - (k % 2) * 8, y + 6, 12, 6); }
      c.fillStyle = "rgba(110,72,38,.55)"; c.fillRect(px, -18, 38, 14);
      c.fillStyle = "#f1f3f5"; c.beginPath(); c.ellipse(l * 94 - l * curva * 3, -28, 4.5, 13, 0, 0, 7); c.fill(); // aro branco aparecendo
    });
    // parte de baixo: larga, com os paralamas alargados por cima das rodas
    const baixo = () => {
      c.beginPath();
      c.moveTo(-106, -20); c.lineTo(-108, -50); c.quadraticCurveTo(-106, -70, -84, -70); c.lineTo(-70, -68);
      c.lineTo(70, -68); c.lineTo(84, -70); c.quadraticCurveTo(106, -70, 108, -50); c.lineTo(106, -20);
      c.quadraticCurveTo(105, -12, 94, -12); c.lineTo(-94, -12); c.quadraticCurveTo(-105, -12, -106, -20); c.closePath();
    };
    const gb = c.createLinearGradient(0, -70, 0, -12);
    gb.addColorStop(0, claro); gb.addColorStop(0.45, cor); gb.addColorStop(1, escuro);
    c.fillStyle = gb; baixo(); c.fill();
    c.save(); baixo(); c.clip();
    c.fillStyle = "#fff"; c.beginPath(); c.moveTo(-108, -46); c.lineTo(108, -54); c.lineTo(108, -44); c.lineTo(-108, -36); c.fill();  // faixa branca da pintura
    c.fillStyle = "#1d1d22"; c.fillRect(-110, -27, 220, 16);                                                                        // saia preta
    c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(-110, -70, 22, 60); c.fillRect(88, -70, 22, 60);                                  // volume dos paralamas
    c.restore();
    c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 2.5; baixo(); c.stroke();
    // cabine estreita e alta
    const cab = () => { c.beginPath(); c.moveTo(-68, -68); c.lineTo(-54 + sk, -110); c.quadraticCurveTo(-52 + sk, -116, -44 + sk, -116); c.lineTo(44 + sk, -116); c.quadraticCurveTo(52 + sk, -116, 54 + sk, -110); c.lineTo(68, -68); c.closePath(); };
    const gc = c.createLinearGradient(0, -116, 0, -68); gc.addColorStop(0, claro); gc.addColorStop(1, cor);
    c.fillStyle = gc; cab(); c.fill(); c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 2; cab(); c.stroke();
    // vidro de trás pequeno, a faixa RALLY no alto e o número
    c.fillStyle = "#15191f"; c.beginPath(); c.moveTo(-42 + sk, -108); c.lineTo(42 + sk, -108); c.lineTo(52 + sk, -76); c.lineTo(-52 + sk, -76); c.closePath(); c.fill();
    const v = c.createLinearGradient(0, -106, 0, -78); v.addColorStop(0, "#9fc9ec"); v.addColorStop(1, "#1f3550");
    c.fillStyle = v; c.beginPath(); c.moveTo(-38 + sk, -100); c.lineTo(38 + sk, -100); c.lineTo(48 + sk, -79); c.lineTo(-48 + sk, -79); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.3)"; c.beginPath(); c.moveTo(-18 + sk, -100); c.lineTo(-6 + sk, -100); c.lineTo(-20 + sk, -79); c.lineTo(-32 + sk, -79); c.closePath(); c.fill();
    c.fillStyle = "#fff"; c.fillRect(-42 + sk, -108, 84, 9);
    c.fillStyle = "#c92a2a"; c.font = "bold 8px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("RALLY", sk, -103.5);
    c.fillStyle = "#fff"; c.beginPath(); c.roundRect(22 + sk, -96, 20, 15, 3); c.fill();
    c.fillStyle = "#111"; c.font = "bold 12px sans-serif"; c.fillText("7", 32 + sk, -88);
    // lanternas finas de LED nos cantos
    [-1, 1].forEach(l => {
      const x = l < 0 ? -100 : 92;
      if (freio) { const g = c.createRadialGradient(x + 4, -56, 2, x + 4, -56, 26); g.addColorStop(0, "rgba(255,70,50,.8)"); g.addColorStop(1, "rgba(255,40,30,0)"); c.fillStyle = g; c.fillRect(x - 24, -84, 56, 56); }
      c.fillStyle = freio ? "#ff5a4a" : "#b3170f"; c.beginPath(); c.roundRect(x, -66, 8, 22, 3); c.fill();
      c.fillStyle = freio ? "#fff" : "#ff8a80"; c.fillRect(x + 3, -63, 2, 16);
    });
    // difusor, escape no meio e a fita de reboque
    c.fillStyle = "#0f0f12"; c.fillRect(-60, -24, 120, 10);
    c.strokeStyle = "#2b2b31"; c.lineWidth = 2; for (let x = -48; x <= 48; x += 16) { c.beginPath(); c.moveTo(x, -24); c.lineTo(x, -14); c.stroke(); }
    c.fillStyle = "#c9d0d6"; c.beginPath(); c.arc(0, -19, 7, 0, 7); c.fill(); c.fillStyle = "#111"; c.beginPath(); c.arc(0, -19, 4.5, 0, 7); c.fill();
    c.fillStyle = "#e63946"; c.fillRect(-72, -30, 8, 12);
    // asa enorme no teto, com pescoço de cisne e placas laterais altas; tomada de ar e antena
    c.fillStyle = "#1b1b1f"; c.fillRect(-42 + sk, -132, 6, 18); c.fillRect(36 + sk, -132, 6, 18);
    const ga = c.createLinearGradient(0, -142, 0, -128); ga.addColorStop(0, claro); ga.addColorStop(1, escuro);
    c.fillStyle = ga; c.beginPath(); c.roundRect(-88 + sk, -142, 176, 13, 4); c.fill();
    c.fillStyle = "#1b1b1f"; c.fillRect(-92 + sk, -148, 7, 26); c.fillRect(85 + sk, -148, 7, 26);
    c.fillStyle = "#fff"; c.fillRect(-60 + sk, -139, 120, 3);
    c.fillStyle = escuro; c.beginPath(); c.moveTo(-14 + sk, -116); c.lineTo(14 + sk, -116); c.lineTo(10 + sk, -121); c.lineTo(-10 + sk, -121); c.fill();
    c.strokeStyle = "#222"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(28 + sk, -116); c.lineTo(33 + sk, -150); c.stroke();
    // lameiros grandes atrás das rodas e o barro
    [-1, 1].forEach(l => {
      const px = l < 0 ? -110 : 72;
      c.fillStyle = "#c92a2a"; c.beginPath(); c.roundRect(px + 1, -22, 36, 20, 2); c.fill();
      c.fillStyle = "#fff"; c.font = "bold 8px sans-serif"; c.textAlign = "center"; c.fillText("RALLY", px + 19, -11);
    });
    c.fillStyle = "rgba(110,72,38,.55)";
    for (let i = 0; i < 40; i++) { const x = -100 + ((i * 41) % 200), y = -14 - ((i * 17) % 30); c.beginPath(); c.arc(x, y, 1.2 + (i % 3) * 0.9, 0, 7); c.fill(); }
    return cv;
  }
  // Jipe 4x4 de trilha visto de trás: carroceria alta e quadrada (suspensão levantada), pneus enormes
  // de cravo para fora da lataria, estepe na porta de trás, rack no teto com galões e a barra de
  // faróis, snorkel subindo pelo lado, antena com bandeirinha, para-choque de aço e muito barro
  function jeepDeTras(cor, curva = 0, freio = false, fase = 0) {
    const W = 236, H = 176, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    c.translate(W / 2, H);
    const sk = curva * 7, escuro = clarear(cor, -0.45), claro = clarear(cor, 0.3);
    const gs = c.createRadialGradient(0, 0, 10, 0, 0, 118);
    gs.addColorStop(0, "rgba(0,0,0,.55)"); gs.addColorStop(1, "rgba(0,0,0,0)");
    c.save(); c.translate(0, -6); c.scale(1, 0.13); c.fillStyle = gs; c.beginPath(); c.arc(0, 0, 118, 0, 7); c.fill(); c.restore();
    // eixo e suspensão aparecendo embaixo (o jipe é alto)
    c.fillStyle = "#26262a"; c.fillRect(-80, -40, 160, 10);
    c.fillStyle = "#f77f00"; c.fillRect(-62, -52, 8, 22); c.fillRect(54, -52, 8, 22); // molas/amortecedores
    // pneus enormes de cravo
    [-1, 1].forEach(l => {
      const px = l < 0 ? -116 : 72;
      c.fillStyle = "#121214"; c.beginPath(); c.roundRect(px, -66, 44, 62, 12); c.fill();
      c.fillStyle = "#2a2a2f";
      for (let y = -63 + (fase % 2) * 7, k = 0; y < -8; y += 14, k++) { c.fillRect(px + 3 + (k % 2) * 10, y, 14, 8); c.fillRect(px + 25 - (k % 2) * 10, y + 7, 14, 8); }
      c.fillStyle = "rgba(110,72,38,.6)"; c.fillRect(px, -24, 44, 20);
    });
    // carroceria quadrada
    const corpo = () => { c.beginPath(); c.moveTo(-90, -40); c.lineTo(-92, -112); c.quadraticCurveTo(-92, -122, -82, -124); c.lineTo(82, -124); c.quadraticCurveTo(92, -122, 92, -112); c.lineTo(90, -40); c.closePath(); };
    const gb = c.createLinearGradient(0, -124, 0, -40); gb.addColorStop(0, claro); gb.addColorStop(0.5, cor); gb.addColorStop(1, escuro);
    c.fillStyle = gb; corpo(); c.fill();
    c.save(); corpo(); c.clip();
    c.fillStyle = "rgba(0,0,0,.22)"; c.fillRect(-94, -126, 14, 90); c.fillRect(80, -126, 14, 90);
    c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(-94, -52, 188, 14); // faixa de borracha embaixo
    c.restore();
    c.strokeStyle = "rgba(0,0,0,.45)"; c.lineWidth = 2.5; corpo(); c.stroke();
    // vidro de trás e o reflexo
    c.fillStyle = "#15191f"; c.beginPath(); c.roundRect(-66 + sk, -118, 132, 30, 5); c.fill();
    const v = c.createLinearGradient(0, -116, 0, -90); v.addColorStop(0, "#9fc9ec"); v.addColorStop(1, "#1f3550");
    c.fillStyle = v; c.beginPath(); c.roundRect(-62 + sk, -115, 124, 24, 4); c.fill();
    c.fillStyle = "rgba(255,255,255,.3)"; c.fillRect(-36 + sk, -115, 10, 24);
    // lanternas quadradas
    [-1, 1].forEach(l => {
      const x = l < 0 ? -86 : 74;
      if (freio) { const g = c.createRadialGradient(x + 6, -76, 2, x + 6, -76, 28); g.addColorStop(0, "rgba(255,70,50,.8)"); g.addColorStop(1, "rgba(255,40,30,0)"); c.fillStyle = g; c.fillRect(x - 24, -106, 60, 60); }
      c.fillStyle = freio ? "#ff5a4a" : "#b3170f"; c.fillRect(x, -86, 12, 20);
      c.fillStyle = "#f8c537"; c.fillRect(x, -66, 12, 6);
    });
    // estepe na porta de trás
    c.fillStyle = "#121214"; c.beginPath(); c.arc(0, -72, 30, 0, 7); c.fill();
    c.strokeStyle = "#2a2a2f"; c.lineWidth = 5; c.setLineDash([6, 5]); c.beginPath(); c.arc(0, -72, 26, 0, 7); c.stroke(); c.setLineDash([]);
    c.fillStyle = "#adb5bd"; c.beginPath(); c.arc(0, -72, 14, 0, 7); c.fill();
    c.fillStyle = "#6c757d"; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; c.beginPath(); c.arc(Math.cos(a) * 8, -72 + Math.sin(a) * 8, 2, 0, 7); c.fill(); }
    // para-choque de aço com o gancho e a placa
    c.fillStyle = "#3a3d42"; c.fillRect(-98, -42, 196, 16);
    c.fillStyle = "#55595f"; c.fillRect(-98, -42, 196, 4);
    c.fillStyle = "#e63946"; c.fillRect(-8, -32, 16, 10);
    c.fillStyle = "#fff"; c.fillRect(-60, -38, 34, 10); c.fillStyle = "#1d6fb8"; c.fillRect(-60, -38, 34, 3);
    // rack do teto com os galões e a barra de faróis
    c.fillStyle = "#26262a"; c.fillRect(-84 + sk, -134, 168, 5); c.fillRect(-80 + sk, -134, 4, 10); c.fillRect(76 + sk, -134, 4, 10);
    [["#c92a2a", -70], ["#2a9d55", -46], ["#c92a2a", 40]].forEach(([g, x]) => { c.fillStyle = g; c.beginPath(); c.roundRect(x + sk, -152, 20, 18, 3); c.fill(); c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(x + sk + 8, -156, 5, 4); });
    c.fillStyle = "#1b1b1f"; c.fillRect(-20 + sk, -146, 52, 12);
    for (let k = 0; k < 4; k++) { c.fillStyle = "#fff6c2"; c.beginPath(); c.arc(-13 + sk + k * 13, -140, 4, 0, 7); c.fill(); }
    // snorkel subindo pelo lado direito e a antena com a bandeirinha
    c.fillStyle = "#1b1b1f"; c.fillRect(92, -132, 8, 70); c.fillRect(86, -136, 16, 8);
    c.strokeStyle = "#222"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-84 + sk, -124); c.lineTo(-88 + sk, -172); c.stroke();
    c.fillStyle = "#f77f00"; c.beginPath(); c.moveTo(-88 + sk, -172); c.lineTo(-70 + sk, -167); c.lineTo(-88 + sk, -162); c.fill();
    // lameiros e o barro por todo lado
    [-1, 1].forEach(l => { const px = l < 0 ? -116 : 72; c.fillStyle = "#1b1b1f"; c.fillRect(px + 2, -20, 40, 18); c.fillStyle = "#f77f00"; c.fillRect(px + 2, -20, 40, 4); });
    c.fillStyle = "rgba(110,72,38,.6)";
    for (let i = 0; i < 60; i++) { const x = -96 + ((i * 41) % 192), y = -26 - ((i * 23) % 60) * (i % 3 ? 0.5 : 1); c.beginPath(); c.arc(x, y, 1.2 + (i % 4) * 0.8, 0, 7); c.fill(); }
    return cv;
  }
  // Carro de fórmula visto de trás (Grande Prêmio), desenhado de trás para a frente:
  // rodas e asa dianteiras lá na frente, pneus traseiros enormes, assoalho e difusor com a luz
  // vermelha, pontões, capa do motor alta e estreita com a entrada de ar sobre o capacete, o halo,
  // a barbatana e a asa traseira com dois planos, placas laterais e o número
  function formulaDeTras(cor, curva = 0, freio = false, fase = 0) {
    const W = 230, H = 134, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    c.translate(W / 2, H);
    const sk = curva * 7; // a parte de cima inclina um pouco na curva
    const escuro = clarear(cor, -0.45), claro = clarear(cor, 0.35);
    // sombra no chão
    const gs = c.createRadialGradient(0, 0, 10, 0, 0, 118);
    gs.addColorStop(0, "rgba(0,0,0,.55)"); gs.addColorStop(1, "rgba(0,0,0,0)");
    c.save(); c.translate(0, -5); c.scale(1, 0.12); c.fillStyle = gs; c.beginPath(); c.arc(0, 0, 118, 0, 7); c.fill(); c.restore();
    // ---- lá na frente: rodas dianteiras (menores e mais altas) e a asa dianteira
    [-1, 1].forEach(l => {
      const x = l * 60 + l * curva * 2;
      c.fillStyle = "#151518"; c.beginPath(); c.roundRect(x - 13, -74, 26, 26, 6); c.fill();
      c.fillStyle = "rgba(255,255,255,.1)"; c.fillRect(x - 10, -72, 3, 22);
    });
    c.fillStyle = escuro; c.beginPath(); c.roundRect(-84, -52, 168, 5, 2); c.fill();
    c.fillStyle = cor; [-1, 1].forEach(l => c.fillRect(l < 0 ? -88 : 82, -60, 6, 14));
    // ---- braços da suspensão traseira
    c.strokeStyle = "#202024"; c.lineWidth = 4;
    [-1, 1].forEach(l => { c.beginPath(); c.moveTo(l * 26, -40); c.lineTo(l * 72, -44); c.moveTo(l * 26, -22); c.lineTo(l * 72, -20); c.stroke(); });
    // ---- assoalho largo e difusor com canais
    c.fillStyle = "#18181c"; c.beginPath(); c.roundRect(-78, -16, 156, 10, 3); c.fill();
    c.fillStyle = "#222228"; c.beginPath(); c.moveTo(-46, -6); c.lineTo(46, -6); c.lineTo(36, -30); c.lineTo(-36, -30); c.closePath(); c.fill();
    c.strokeStyle = "#3b3b44"; c.lineWidth = 2;
    for (let x = -27; x <= 27; x += 13.5) { c.beginPath(); c.moveTo(x, -7); c.lineTo(x * 0.78, -29); c.stroke(); }
    // ---- pneus traseiros enormes
    [-1, 1].forEach(l => {
      const px = l < 0 ? -114 : 68;
      const gp = c.createLinearGradient(px, 0, px + 46, 0);
      gp.addColorStop(0, "#0b0b0d"); gp.addColorStop(0.45, "#2f2f33"); gp.addColorStop(1, "#0b0b0d");
      c.fillStyle = gp; c.beginPath(); c.roundRect(px, -64, 46, 60, 10); c.fill();
      c.fillStyle = "rgba(0,0,0,.55)"; for (let y = -60 + fase * 6; y < -8; y += 12) c.fillRect(px + 5, y, 36, 2.5);
      c.fillStyle = "rgba(255,255,255,.13)"; c.fillRect(px + 7, -61, 4, 54);
      c.fillStyle = "#ffd43b"; c.fillRect(l < 0 ? px + 41 : px + 1, -54, 4, 40); // faixa do pneu (composto)
    });
    // ---- asinha baixa entre as rodas
    c.fillStyle = "#1d1d22"; c.beginPath(); c.roundRect(-58, -44, 116, 6, 2); c.fill();
    // ---- pontões laterais, com a cor da equipe
    [-1, 1].forEach(l => {
      const x0 = l < 0 ? -66 : 30;
      const gp = c.createLinearGradient(0, -56, 0, -24); gp.addColorStop(0, claro); gp.addColorStop(1, escuro);
      c.fillStyle = gp; c.beginPath(); c.roundRect(x0, -54, 36, 30, [14, 14, 4, 4]); c.fill();
    });
    // ---- capacete e halo (atrás da capa do motor)
    c.fillStyle = "#f8f9fa"; c.beginPath(); c.arc(sk * 0.8, -84, 13, Math.PI, 0); c.lineTo(13 + sk * 0.8, -76); c.lineTo(-13 + sk * 0.8, -76); c.fill();
    c.fillStyle = claro; c.fillRect(-13 + sk * 0.8, -88, 26, 4);
    c.strokeStyle = "#141418"; c.lineWidth = 5; c.lineCap = "round";
    c.beginPath(); c.moveTo(-20 + sk * 0.8, -72); c.quadraticCurveTo(sk * 0.8, -104, 20 + sk * 0.8, -72); c.stroke(); c.lineCap = "butt";
    // ---- capa do motor alta e estreita (com faixa branca), entrada de ar e barbatana
    const capa = () => { c.beginPath(); c.moveTo(-26, -24); c.lineTo(-16 + sk * 0.6, -74); c.quadraticCurveTo(sk, -80, 16 + sk * 0.6, -74); c.lineTo(26, -24); c.closePath(); };
    const g = c.createLinearGradient(-26, 0, 26, 0);
    g.addColorStop(0, escuro); g.addColorStop(0.3, cor); g.addColorStop(0.55, claro); g.addColorStop(1, escuro);
    c.fillStyle = g; capa(); c.fill();
    c.save(); capa(); c.clip(); c.fillStyle = "rgba(255,255,255,.85)"; c.fillRect(-4 + sk * 0.3, -80, 8, 60); c.restore();
    c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 2; capa(); c.stroke();
    // entrada de ar triangular sobre o capacete
    c.fillStyle = escuro; c.beginPath(); c.moveTo(-11 + sk, -86); c.lineTo(11 + sk, -86); c.lineTo(7 + sk, -104); c.lineTo(-7 + sk, -104); c.closePath(); c.fill();
    c.fillStyle = "#0e0e10"; c.beginPath(); c.roundRect(-6 + sk, -102, 12, 8, 3); c.fill();
    // barbatana até a asa
    c.fillStyle = cor; c.beginPath(); c.moveTo(-2 + sk, -104); c.lineTo(2 + sk, -104); c.lineTo(2, -78); c.lineTo(-2, -78); c.fill();
    // ---- caixa de câmbio e a luz vermelha (pisca forte ao frear)
    c.fillStyle = "#2a2a30"; c.beginPath(); c.roundRect(-12, -36, 24, 14, 3); c.fill();
    c.fillStyle = freio ? "#ff2a2a" : "#8a1414"; c.fillRect(-8, -33, 16, 7);
    if (freio) { const gl = c.createRadialGradient(0, -30, 2, 0, -30, 34); gl.addColorStop(0, "rgba(255,60,60,.75)"); gl.addColorStop(1, "rgba(255,60,60,0)"); c.fillStyle = gl; c.fillRect(-34, -64, 68, 68); }
    // ---- asa traseira: suporte central, plano principal, aba de cima e placas dos lados com o número
    c.fillStyle = "#1a1a1e"; c.fillRect(-4, -116, 8, 40);
    const ga = c.createLinearGradient(0, -124, 0, -110);
    ga.addColorStop(0, clarear(cor, 0.2)); ga.addColorStop(1, escuro);
    c.fillStyle = ga; c.beginPath(); c.roundRect(-80, -122, 160, 10, 3); c.fill();
    c.fillStyle = "#1d1d22"; c.beginPath(); c.roundRect(-78, -110, 156, 6, 2); c.fill();
    c.fillStyle = "rgba(255,255,255,.7)"; c.fillRect(-76, -120, 152, 2);
    [-1, 1].forEach(l => {
      const x = l < 0 ? -90 : 80;
      c.fillStyle = cor; c.beginPath(); c.roundRect(x, -130, 10, 46, 3); c.fill();
      c.fillStyle = escuro; c.fillRect(x, -96, 10, 12);
    });
    c.fillStyle = "#fff"; c.font = "bold 11px sans-serif"; c.textAlign = "center";
    c.fillText(String((parseInt(cor.slice(1, 3), 16) % 30) + 1), -85, -112);
    return cv;
  }

  // Sprites dos carros da corrida guardados prontos (cor × virando × freio × fase da roda × fórmula)
  const spritesCarro = new Map();
  let formulaNaPista = false, rallyNaPista = false, jeepNaPista = false; // a corrida aberta é Grande Prêmio / Rally / Off-road
  const spriteCarro = (cor, vira, freio, fase) => {
    const k = (formulaNaPista ? "f" : jeepNaPista ? "j" : rallyNaPista ? "r" : "") + cor + vira + (freio ? 1 : 0) + fase;
    let s = spritesCarro.get(k);
    if (!s) { s = (formulaNaPista ? formulaDeTras : jeepNaPista ? jeepDeTras : rallyNaPista ? carroRally : carroDeTras)(cor, vira === "esq" ? -1 : vira === "dir" ? 1 : 0, freio, fase); spritesCarro.set(k, s); }
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
    // Rally: estradas de terra/neve, estreitas, sem faixas pintadas
    finlandia: { ceu: ["#5b9be0", "#dcecf8"], grama: ["#5a8f3c", "#548a37"], zebra: ["#b49567", "#a88b5f"], pista: ["#9c7a52", "#957349"], faixa: "#9c7a52", acost: "#b49567", nevoa: "#dcecf8", morros: ["#6f9a5a", "#4f7f3d"], coisas: ["pinheiro", "pinheiro", "torcida", "casa-vermelha"], rally: true, largura: 1450 },
    suecia: { ceu: ["#9fb3c8", "#e8eef5"], grama: ["#f2f6fb", "#e7eef7"], zebra: ["#ffffff", "#f1f5fa"], pista: ["#d3dbe4", "#cad3dd"], faixa: "#d3dbe4", acost: "#ffffff", nevoa: "#e8eef5", morros: ["#dfe9f5", "#c9d8ea"], coisas: ["pinheiro-neve", "pinheiro-neve", "torcida", "banco-neve"], rally: true, largura: 1450 },
    sertoes: { ceu: ["#4aa3e0", "#fbe3b0"], grama: ["#c9a46a", "#c29d63"], zebra: ["#c98a55", "#bf8050"], pista: ["#b5653a", "#ad5f35"], faixa: "#b5653a", acost: "#c98a55", nevoa: "#f6dcb0", morros: ["#c49a6c", "#a8805a"], coisas: ["mandacaru", "pedra", "torcida", "mandacaru"], rally: true, largura: 1450 },
    // Off-road 4x4: sem estrada; só a trilha marcada no terreno aberto
    jalapao: { ceu: ["#3f9be0", "#fde2b8"], grama: ["#d9a560", "#d39f5a"], zebra: ["#d9a560", "#d39f5a"], pista: ["#c58a4c", "#bf8547"], faixa: "#c58a4c", acost: "#d9a560", nevoa: "#f6d9a8", morros: ["#c58a4a", "#b47a3d"], coisas: ["capim", "buriti", "cupinzeiro", "pedra"], off: true, largura: 2300 },
    lencois: { ceu: ["#3aa0e6", "#e9f6ff"], grama: ["#f4efe2", "#efe8d8"], zebra: ["#f4efe2", "#efe8d8"], pista: ["#e2d8c4", "#dbd0bb"], faixa: "#e2d8c4", acost: "#f4efe2", nevoa: "#eef6fb", morros: ["#f1ece0", "#e3dccb"], coisas: ["lagoa", "capim", "arbusto", "lagoa"], off: true, largura: 2300 },
    caatinga: { ceu: ["#4aa3e0", "#fbe3b0"], grama: ["#b99a6a", "#b39466"], zebra: ["#b99a6a", "#b39466"], pista: ["#a5835a", "#9f7d55"], faixa: "#a5835a", acost: "#b99a6a", nevoa: "#f3dcb4", morros: ["#a8805a", "#94704d"], coisas: ["mandacaru", "pedra", "arbusto", "cupinzeiro"], off: true, largura: 2300 },
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
    } else if (tipo === "boxes") {
      // garagens dos boxes: portas abertas com o carro e os mecânicos, cada uma com a cor da equipe
      pronto(360, 170);
      sombra(180, 170, 170);
      c.fillStyle = "#e9ecef"; c.fillRect(0, 20, 360, 150);
      c.fillStyle = "#ced4da"; c.fillRect(0, 10, 360, 14);
      for (let k = 0; k < 3; k++) {
        const x = 12 + k * 118, cor = Motor.sortear(["#e10600", "#00d2be", "#ff8700", "#1e41ff", "#006f62", "#f596c8", "#ffd700"]);
        c.fillStyle = cor; c.fillRect(x, 28, 100, 16);
        c.fillStyle = "#2b2f36"; c.fillRect(x, 48, 100, 120);
        c.fillStyle = "#3a4049"; c.fillRect(x + 4, 136, 92, 32);
        c.fillStyle = cor; c.fillRect(x + 30, 122, 40, 16); c.fillRect(x + 22, 136, 56, 6);
        c.fillStyle = "#111"; c.fillRect(x + 16, 120, 14, 24); c.fillRect(x + 70, 120, 14, 24);
        [x + 10, x + 90].forEach(mx => { c.fillStyle = cor; c.fillRect(mx - 6, 110, 12, 30); c.fillStyle = "#f1c27d"; c.beginPath(); c.arc(mx, 104, 6, 0, 7); c.fill(); c.fillStyle = "#fff"; c.fillRect(mx - 7, 97, 14, 4); });
      }
    } else if (tipo === "muro") {
      // muro dos boxes com a faixa de propaganda e a tela de proteção por cima
      pronto(300, 90);
      c.fillStyle = "#dee2e6"; c.fillRect(0, 40, 300, 50);
      c.fillStyle = Motor.sortear(["#e63946", "#1d6fb8", "#2a9d55", "#111"]); c.fillRect(0, 48, 300, 26);
      c.fillStyle = "#fff"; c.font = "bold 22px sans-serif"; c.textAlign = "center"; c.fillText(Motor.sortear(["CORRIDA", "VELOCIDADE", "BRASIL", "PÓDIO", "ACELERA!"]), 150, 69);
      c.strokeStyle = "rgba(60,60,60,.55)"; c.lineWidth = 1;
      for (let x = 0; x <= 300; x += 10) { c.beginPath(); c.moveTo(x, 2); c.lineTo(x, 40); c.stroke(); }
      c.fillStyle = "#868e96"; for (let x = 0; x <= 300; x += 60) c.fillRect(x, 0, 4, 40);
    } else if (tipo === "guardrail") {
      // guard-rail das ruas de Mônaco, com a faixa vermelha e branca embaixo
      pronto(240, 70);
      c.fillStyle = "#adb5bd"; for (let x = 10; x < 240; x += 50) c.fillRect(x, 20, 6, 50);
      const g = c.createLinearGradient(0, 14, 0, 42); g.addColorStop(0, "#f8f9fa"); g.addColorStop(1, "#868e96");
      c.fillStyle = g; c.fillRect(0, 14, 240, 28);
      for (let x = 0; x < 240; x += 20) { c.fillStyle = (x / 20) % 2 ? "#fff" : "#e63946"; c.fillRect(x, 44, 20, 12); }
    } else if (tipo.startsWith("freio:")) {
      // placa de frenagem: 150, 100 e 50 metros antes da curva fechada
      pronto(110, 200);
      sombra(55, 30, 200);
      c.fillStyle = "#555"; c.fillRect(50, 100, 10, 100);
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(5, 5, 100, 98, 10); c.fill();
      c.strokeStyle = "#111"; c.lineWidth = 6; c.stroke();
      c.fillStyle = "#111"; c.font = "bold 46px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(tipo.slice(6), 55, 56, 90);
    } else if (tipo.startsWith("nome:")) {
      // placa com o nome da curva
      pronto(420, 150);
      sombra(210, 160, 150);
      c.fillStyle = "#666"; c.fillRect(60, 70, 10, 80); c.fillRect(350, 70, 10, 80);
      c.fillStyle = "#14213d"; c.beginPath(); c.roundRect(4, 6, 412, 72, 12); c.fill();
      c.fillStyle = "#ffd60a"; c.fillRect(4, 70, 412, 8);
      c.fillStyle = "#fff"; c.font = "bold 36px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(tipo.slice(5).toUpperCase(), 210, 40, 390);
    } else if (tipo === "drs") {
      pronto(160, 190);
      sombra(80, 40, 190);
      c.fillStyle = "#555"; c.fillRect(75, 90, 10, 100);
      c.fillStyle = "#111"; c.beginPath(); c.roundRect(4, 4, 152, 90, 12); c.fill();
      c.fillStyle = "#3cff78"; c.font = "bold 52px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("DRS", 80, 50);
    } else if (tipo === "portico") {
      // pórtico da largada por cima da pista, com as luzes e a bandeira quadriculada
      pronto(800, 300);
      c.fillStyle = "#3a3f47"; c.fillRect(22, 40, 22, 260); c.fillRect(756, 40, 22, 260);
      c.fillStyle = "#2b2f36"; c.fillRect(10, 30, 780, 64);
      c.fillStyle = "#fff"; c.fillRect(10, 30, 780, 5);
      for (let k = 0; k < 5; k++) { const x = 330 + k * 46; c.fillStyle = "#111"; c.fillRect(x - 17, 40, 34, 48); c.fillStyle = "#4a1214"; c.beginPath(); c.arc(x, 54, 10, 0, 7); c.arc(x, 75, 10, 0, 7); c.fill(); }
      c.fillStyle = "#fff"; c.font = "bold 30px sans-serif"; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText("LARGADA", 46, 63);
      for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? "#111" : "#fff"; c.fillRect(600 + k * 20, 42, 20, 22); c.fillStyle = k % 2 ? "#fff" : "#111"; c.fillRect(600 + k * 20, 64, 20, 22); }
    } else if (tipo === "tunel") {
      // entrada do túnel de Mônaco: o hotel por cima e a boca escura onde a pista entra
      pronto(900, 520);
      c.fillStyle = "#ead9c0"; c.fillRect(0, 0, 900, 520);
      for (let y = 20; y < 290; y += 50) for (let x = 24; x < 880; x += 60) { c.fillStyle = "#7aa6c2"; c.fillRect(x, y, 32, 30); c.fillStyle = "#2f6b3a"; c.fillRect(x - 6, y, 5, 30); c.fillRect(x + 33, y, 5, 30); c.fillStyle = "#fff"; c.fillRect(x - 7, y + 30, 46, 4); }
      c.fillStyle = "#c9b393"; c.fillRect(0, 300, 900, 22);
      c.fillStyle = "#0d0d11"; c.beginPath(); c.moveTo(120, 520); c.lineTo(120, 390); c.quadraticCurveTo(450, 310, 780, 390); c.lineTo(780, 520); c.closePath(); c.fill();
      c.fillStyle = "rgba(255,214,120,.85)"; for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(200 + k * 83, 404 - Math.sin(k / 6 * Math.PI) * 30, 5, 0, 7); c.fill(); }
    } else if (tipo === "parede-tunel") {
      // parede do túnel com a fileira de luzes amarelas lá em cima
      pronto(120, 360);
      c.fillStyle = "#2c2c33"; c.fillRect(0, 0, 120, 360);
      c.fillStyle = "#ffe8a3"; c.fillRect(8, 8, 104, 10);
      const g = c.createLinearGradient(0, 18, 0, 140); g.addColorStop(0, "rgba(255,232,163,.4)"); g.addColorStop(1, "rgba(255,232,163,0)");
      c.fillStyle = g; c.fillRect(0, 18, 120, 122);
      c.fillStyle = "#3a3a42"; c.fillRect(0, 300, 120, 60);
      c.fillStyle = "#c9ccd1"; c.fillRect(0, 288, 120, 12);
    } else if (tipo === "predio-dia") {
      // prédio de Mônaco: fachada clarinha, janelas com venezianas verdes, varandas e o toldo da loja
      const h = 260 + Math.floor(Math.random() * 3) * 50;
      pronto(170, h);
      c.fillStyle = Motor.sortear(["#f2d9b5", "#e8c4a0", "#f4e6c8", "#e7c9b0", "#f0d0c0", "#f6efe2"]); c.fillRect(0, 10, 170, h - 10);
      c.fillStyle = "#b5523a"; c.fillRect(-2, 0, 174, 12);
      c.fillStyle = "rgba(0,0,0,.1)"; c.fillRect(132, 10, 38, h - 10);
      for (let y = 26; y < h - 50; y += 40) for (let x = 14; x < 150; x += 40) { c.fillStyle = "#5d7f95"; c.fillRect(x, y, 22, 26); c.fillStyle = "#2f6b4a"; c.fillRect(x - 5, y, 4, 26); c.fillRect(x + 23, y, 4, 26); c.fillStyle = "#fff"; c.fillRect(x - 6, y + 26, 34, 4); }
      c.fillStyle = Motor.sortear(["#e63946", "#2f80ed", "#2a9d55", "#f77f00"]); c.fillRect(0, h - 40, 170, 12);
      c.fillStyle = "#3a3a3a"; c.fillRect(18, h - 28, 134, 28);
    } else if (tipo === "torcida") {
      // público do rally atrás da fita, com bandeiras e os braços para cima
      pronto(320, 150);
      sombra(160, 150, 150);
      for (let r = 0; r < 3; r++) for (let x = 12 + r * 6; x < 310; x += 14) {
        const y = 52 + r * 24;
        c.fillStyle = Motor.sortear(["#e63946", "#ffd60a", "#2f80ed", "#2a9d55", "#fff", "#f77f00", "#111"]); c.fillRect(x - 5, y + 6, 10, 16);
        c.fillStyle = Motor.sortear(["#f1c27d", "#c68642", "#8d5524", "#ffdbac"]); c.beginPath(); c.arc(x, y + 2, 4.5, 0, 7); c.fill();
        if (Math.random() < 0.3) { c.strokeStyle = "#f1c27d"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 4, y + 8); c.lineTo(x - 8, y - 6); c.moveTo(x + 4, y + 8); c.lineTo(x + 8, y - 6); c.stroke(); }
      }
      [[40, "#2f80ed"], [170, "#ffd60a"], [270, "#e63946"]].forEach(([x, cor]) => { c.fillStyle = "#555"; c.fillRect(x, 6, 3, 50); c.fillStyle = cor; c.beginPath(); c.moveTo(x + 3, 8); c.lineTo(x + 34, 16); c.lineTo(x + 3, 26); c.fill(); });
      c.fillStyle = "#777"; for (let x = 4; x < 320; x += 78) c.fillRect(x, 112, 4, 38);
      for (let x = 0; x < 320; x += 20) { c.fillStyle = (x / 20) % 2 ? "#fff" : "#e63946"; c.fillRect(x, 118, 20, 6); }
    } else if (tipo === "casa-vermelha") {
      // casa de madeira vermelha com as beiradas brancas (Finlândia)
      pronto(220, 180);
      sombra(110, 100, 180);
      c.fillStyle = "#a61e1e"; c.fillRect(20, 70, 180, 106);
      c.fillStyle = "rgba(0,0,0,.12)"; for (let x = 24; x < 200; x += 8) c.fillRect(x, 70, 2, 106);
      c.fillStyle = "#fff"; c.fillRect(16, 70, 6, 106); c.fillRect(198, 70, 6, 106);
      c.fillStyle = "#3b3f45"; c.beginPath(); c.moveTo(6, 74); c.lineTo(110, 10); c.lineTo(214, 74); c.fill();
      [[44, 96], [140, 96]].forEach(([x, y]) => { c.fillStyle = "#fff"; c.fillRect(x - 3, y - 3, 40, 36); c.fillStyle = "#7fb0d4"; c.fillRect(x, y, 34, 30); c.fillStyle = "#fff"; c.fillRect(x + 16, y, 2, 30); });
      c.fillStyle = "#5a3418"; c.fillRect(96, 128, 28, 48);
    } else if (tipo === "banco-neve") {
      // monte de neve na beira da estrada (segura o carro, como na Suécia)
      pronto(260, 70);
      const g = c.createLinearGradient(0, 10, 0, 70); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#c9d8ea");
      c.fillStyle = g; c.beginPath(); c.moveTo(0, 70); c.quadraticCurveTo(40, 8, 130, 14); c.quadraticCurveTo(220, 8, 260, 70); c.fill();
      c.fillStyle = "rgba(160,190,220,.45)"; c.beginPath(); c.ellipse(170, 50, 60, 12, 0, 0, 7); c.fill();
    } else if (tipo === "mandacaru") {
      pronto(120, 230);
      sombra(60, 40, 230);
      const col = (x, y, w, h) => { const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, "#5f9a4a"); g.addColorStop(1, "#2f6a2f"); c.fillStyle = g; c.beginPath(); c.roundRect(x, y, w, h, w / 2); c.fill(); };
      col(48, 30, 24, 198); col(14, 70, 18, 80); col(88, 50, 18, 90);
      c.fillStyle = "#4a8a3c"; c.fillRect(26, 130, 26, 14); c.fillRect(70, 118, 22, 14);
      c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 1; for (let x = 54; x < 70; x += 5) { c.beginPath(); c.moveTo(x, 36); c.lineTo(x, 224); c.stroke(); }
    } else if (tipo === "pedra") {
      pronto(160, 100);
      sombra(80, 70, 100);
      c.fillStyle = "#8a7d6d"; c.beginPath(); c.moveTo(10, 96); c.lineTo(28, 40); c.lineTo(70, 14); c.lineTo(118, 22); c.lineTo(150, 60); c.lineTo(152, 96); c.fill();
      c.fillStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.moveTo(30, 44); c.lineTo(70, 18); c.lineTo(84, 40); c.lineTo(46, 60); c.fill();
      c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.moveTo(118, 22); c.lineTo(150, 60); c.lineTo(152, 96); c.lineTo(110, 96); c.fill();
    } else if (tipo === "cuidado") {
      // placa de perigo: curva fechada ou salto logo à frente
      pronto(120, 200);
      sombra(60, 30, 200);
      c.fillStyle = "#555"; c.fillRect(55, 96, 10, 104);
      c.fillStyle = "#111"; c.beginPath(); c.moveTo(60, 2); c.lineTo(118, 104); c.lineTo(2, 104); c.closePath(); c.fill();
      c.fillStyle = "#ffd60a"; c.beginPath(); c.moveTo(60, 14); c.lineTo(106, 96); c.lineTo(14, 96); c.closePath(); c.fill();
      c.fillStyle = "#111"; c.font = "bold 50px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("!", 60, 66);
    } else if (tipo.startsWith("arco:")) {
      // arco inflável da largada e da chegada da especial, por cima da estrada
      pronto(900, 420);
      const coluna = x => { const g = c.createLinearGradient(x, 0, x + 70, 0); g.addColorStop(0, "#c92a2a"); g.addColorStop(0.5, "#ff6b6b"); g.addColorStop(1, "#a51d1d"); c.fillStyle = g; c.beginPath(); c.roundRect(x, 90, 70, 330, 30); c.fill(); };
      coluna(20); coluna(810);
      const g = c.createLinearGradient(0, 10, 0, 110); g.addColorStop(0, "#ff6b6b"); g.addColorStop(1, "#a51d1d");
      c.fillStyle = g; c.beginPath(); c.roundRect(10, 10, 880, 110, 50); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.roundRect(160, 30, 580, 70, 14); c.fill();
      for (let k = 0; k < 10; k++) { c.fillStyle = k % 2 ? "#111" : "#fff"; c.fillRect(40 + (k % 5) * 18, 40 + Math.floor(k / 5) * 18, 18, 18); c.fillStyle = k % 2 ? "#fff" : "#111"; c.fillRect(770 + (k % 5) * 18 - 30, 40 + Math.floor(k / 5) * 18, 18, 18); }
      c.fillStyle = "#c92a2a"; c.font = "bold 54px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(tipo.slice(5), 450, 67, 560);
    } else if (tipo === "capim") {
      // capim dourado do Jalapão / touceiras de capim
      pronto(140, 90);
      for (let i = 0; i < 26; i++) { const x = 10 + i * 4.8, h = 40 + (i * 37 % 40); c.strokeStyle = i % 3 ? "#d9a13a" : "#b8862c"; c.lineWidth = 3; c.beginPath(); c.moveTo(70 + (x - 70) * 0.4, 90); c.quadraticCurveTo(x, 90 - h * 0.6, x + (i % 2 ? 6 : -6), 90 - h); c.stroke(); }
    } else if (tipo === "cupinzeiro") {
      // cupinzeiro do cerrado: torre de terra dura feita pelos cupins
      pronto(100, 150);
      sombra(50, 40, 150);
      const g = c.createLinearGradient(20, 0, 80, 0); g.addColorStop(0, "#c98a50"); g.addColorStop(1, "#8a5a30");
      c.fillStyle = g; c.beginPath(); c.moveTo(14, 150); c.quadraticCurveTo(20, 60, 44, 10); c.quadraticCurveTo(58, 4, 64, 30); c.quadraticCurveTo(80, 80, 88, 150); c.fill();
      c.fillStyle = "rgba(0,0,0,.18)"; [[40, 60], [56, 90], [34, 110]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 5, 3, 0, 0, 7); c.fill(); });
    } else if (tipo === "buriti") {
      // palmeira buriti, que cresce perto da água (veredas)
      pronto(180, 260);
      sombra(90, 40, 260);
      c.fillStyle = "#7a5a3a"; c.fillRect(84, 70, 12, 190);
      c.strokeStyle = "rgba(0,0,0,.2)"; c.lineWidth = 2; for (let y = 80; y < 255; y += 12) { c.beginPath(); c.moveTo(84, y); c.lineTo(96, y + 3); c.stroke(); }
      for (let k = 0; k < 11; k++) { const a = Math.PI + k / 10 * Math.PI; c.strokeStyle = k % 2 ? "#3f8a3a" : "#56a84a"; c.lineWidth = 7; c.beginPath(); c.moveTo(90, 70); c.lineTo(90 + Math.cos(a) * 80, 70 + Math.sin(a) * 60 + 20); c.stroke(); }
      c.fillStyle = "#8a4a2a"; [[82, 82], [96, 84], [89, 90]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill(); });
    } else if (tipo === "lagoa") {
      // lagoa de água da chuva entre as dunas (Lençóis Maranhenses)
      pronto(300, 60);
      const g = c.createLinearGradient(0, 0, 0, 60); g.addColorStop(0, "#5bc0de"); g.addColorStop(1, "#1f8fb8");
      c.fillStyle = g; c.beginPath(); c.ellipse(150, 36, 146, 22, 0, 0, 7); c.fill();
      c.fillStyle = "rgba(255,255,255,.5)"; c.fillRect(60, 30, 40, 2); c.fillRect(160, 40, 60, 2);
    } else if (tipo === "arbusto") {
      pronto(120, 80);
      sombra(60, 50, 80);
      [[40, 52, 24], [72, 46, 28], [56, 34, 22]].forEach(([x, y, r]) => bola(x, y, r, "#9aa860", "#5f6a34"));
    } else if (tipo.startsWith("baliza:")) {
      // bandeira do waypoint: o carro tem que passar entre as duas
      pronto(110, 300);
      sombra(20, 14, 300);
      c.fillStyle = "#ddd"; c.fillRect(16, 10, 6, 290);
      c.fillStyle = "#f77f00"; c.beginPath(); c.moveTo(22, 12); c.lineTo(104, 30); c.lineTo(22, 90); c.fill();
      c.fillStyle = "#fff"; c.font = "bold 34px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(tipo.slice(7), 50, 46);
    } else if (tipo === "iate") {
      // iate no porto de Mônaco
      pronto(300, 170);
      c.fillStyle = "#1d6fb8"; c.fillRect(0, 140, 300, 30);
      c.fillStyle = "#fff"; c.beginPath(); c.moveTo(8, 108); c.lineTo(292, 108); c.lineTo(262, 146); c.lineTo(30, 146); c.fill();
      c.fillStyle = "#f1f3f5"; c.fillRect(60, 80, 170, 28); c.fillRect(100, 56, 100, 24);
      c.fillStyle = "#2b3a55"; c.fillRect(70, 88, 150, 10); c.fillRect(110, 62, 80, 8);
      c.fillStyle = "#adb5bd"; c.fillRect(148, 14, 4, 42);
      c.fillStyle = "rgba(255,255,255,.6)"; c.fillRect(0, 152, 300, 3);
    }
    return cv;
  }
  const TAM_ENFEITE = { capim: 900, cupinzeiro: 800, buriti: 1500, lagoa: 2400, arbusto: 800, baliza: 700, torcida: 2200, "casa-vermelha": 2000, "banco-neve": 1500, mandacaru: 900, pedra: 900, cuidado: 520, boxes: 2600, muro: 1500, guardrail: 1100, freio: 520, nome: 1700, drs: 650, "parede-tunel": 700, "predio-dia": 1900, iate: 2200, arquibancada: 2400, pneus: 650, "faixa-gp": 1200, bandeira: 1000, arvore: 1300, pinheiro: 900, "pinheiro-neve": 900, coqueiro: 1300, "guarda-sol": 900, predio: 1800, poste: 500, placa: 1100, flores: 700, boneco: 650 };

  // Os autódromos de verdade: ficha (cartão antes da largada) e a apresentação do narrador
  const INFO_GP = {
    interlagos: { nome: "Interlagos", local: "📍 São Paulo · Brasil", km: "4,3 km", curvas: 15, sentido: "anti-horário",
      fala: "Bem-vindos a Interlagos, em São Paulo! A pista tem quatro quilômetros e trezentos metros e é corrida no sentido anti-horário, com muitas subidas e descidas. Logo depois da largada vem o S do Senna!" },
    monaco: { nome: "Mônaco", local: "📍 Monte Carlo · Mônaco", km: "3,3 km", curvas: 19, sentido: "horário",
      fala: "Bem-vindos a Mônaco! A corrida é nas ruas da cidade, entre prédios, muros e o porto cheio de iates. É a pista mais estreita e mais lenta: tem o grampo do Grand Hotel e um túnel!" },
    monza: { nome: "Monza", local: "📍 Monza · Itália", km: "5,8 km", curvas: 11, sentido: "horário",
      fala: "Bem-vindos a Monza, na Itália, o Templo da Velocidade! Tem retas enormes, onde os carros passam de trezentos e cinquenta quilômetros por hora. Freie bem nas chicanes!" },
  };
  // Rally: as três etapas (ficha da especial e a apresentação do navegador)
  const INFO_RALLY = {
    jalapao: { nome: "Jalapão", piso: "dunas, rios e areia fofa", fala: "Off-road no Jalapão, em Tocantins! Dunas alaranjadas, rios de água limpinha, capim dourado e muita areia fofa. Aqui não tem estrada: siga a trilha e passe entre as bandeiras laranja!" },
    lencois: { nome: "Lençóis Maranhenses", piso: "dunas brancas e lagoas", fala: "Off-road nos Lençóis Maranhenses! Um mar de dunas de areia branquinha, com lagoas de água da chuva entre elas. Siga a trilha e passe entre as bandeiras laranja!" },
    caatinga: { nome: "Sertão", piso: "caatinga, pedras e leito de rio seco", fala: "Off-road no sertão! Caatinga, cactos, pedras soltas e leitos de rio seco. Siga a trilha e passe entre as bandeiras laranja, que mostram o caminho!" },
    finlandia: { nome: "Rally da Finlândia", piso: "terra rápida e saltos", fala: "Rally da Finlândia! Estradas de terra no meio da floresta de pinheiros, muito rápidas e cheias de saltos, com lagos por todo lado." },
    suecia: { nome: "Rally da Suécia", piso: "neve e gelo", fala: "Rally da Suécia! A estrada é de neve e gelo e o carro escorrega muito. Os montes de neve na beira da estrada seguram o carro." },
    sertoes: { nome: "Rally dos Sertões", piso: "terra vermelha e poeira", fala: "Rally dos Sertões, no Brasil! Terra vermelha, muita poeira, pedras e cactos mandacaru na beira da estrada." },
  };
  const NUM_NOTA = ["", "um", "dois", "três", "quatro", "cinco", "seis"];
  function corrida(area, op) {
    const tema = TEMAS[op.pista] || TEMAS.campo;
    formulaNaPista = !!tema.gp;
    rallyNaPista = !!tema.rally || !!tema.off;
    jeepNaPista = !!tema.off;
    const NIVEL = { facil: { max: 0.82, rivais: 0.7, auto: true }, normal: { max: 1, rivais: 0.86, auto: false }, dificil: { max: 1.12, rivais: 0.97, auto: false } }[op.nivel] || { max: 1, rivais: 0.86 };
    const sessao = Motor.sessaoAtual();
    let pausado = false;
    const OFF = !!tema.off;          // off-road: terreno aberto, trilha, waypoints
    const RALLY = !!tema.rally || OFF; // o off-road usa toda a parte do rally (relógio, navegador, fantasmas)
    const GRIP = { finlandia: 1, suecia: 1.12, sertoes: 1, jalapao: 1.05, lencois: 1.08, caatinga: 1 }[op.pista] || 1; // rally: o carro escorrega (na neve, mais)
    const ESPECIAL = op.especial || 1, TOTAL_ESP = Math.max(1, Math.min(3, parseInt(op.especiais, 10) || 2));
    const DOIS = op.jogadores === "2" && !RALLY; // corrida a dois, com a tela dividida
    const T = montarTela(area, { dois: DOIS, aoPausar: () => alternarPausa(), acao: tema.rally ? "<span>🅧</span><small>freio de mão</small>" : tema.gp ? "<span>🟢</span><small>DRS</small>" : null });
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
    };
    // Grande Prêmio: o traçado de verdade, curva por curva, com o nome de cada uma:
    // [nome, entrada, meio, saída, curva (+ direita, − esquerda), subida, extras]
    // extras: drs (reta com DRS), tunel (Mônaco), porto (iates de um lado)
    const CIRCUITOS = {
      // Interlagos: anti-horário (quase tudo para a esquerda), descida até o S do Senna e a subida dos boxes
      interlagos: [
        ["Reta dos Boxes", 30, 380, 20, 0, -15, { drs: 1, reta: 1 }],
        ["S do Senna", 10, 14, 8, -6.5, -12], ["S do Senna", 8, 12, 10, 5.5, -8],
        ["Curva do Sol", 25, 50, 25, -2.8, -6],
        ["Reta Oposta", 20, 420, 20, 0, -12, { drs: 1 }],
        ["Descida do Lago", 12, 20, 12, -4.5, -14],
        ["", 10, 60, 10, 0, 4],
        ["Ferradura", 15, 30, 15, 3.5, 8], ["Laranjinha", 10, 14, 10, 4, 4],
        ["", 10, 40, 10, 0, 0],
        ["Pinheirinho", 10, 14, 10, -5, -2], ["Bico de Pato", 8, 10, 8, 7.5, -6],
        ["", 10, 50, 10, 0, -6],
        ["Mergulho", 12, 24, 12, -3.6, -22], ["Junção", 10, 14, 10, -5, 4],
        ["Subida dos Boxes", 25, 260, 25, -1, 48], ["Arquibancadas", 15, 30, 15, -1.8, 8],
      ],
      // Mônaco: nas ruas, estreita, muros dos dois lados, o grampo do Grand Hotel e o túnel
      monaco: [
        ["Reta dos Boxes", 20, 140, 20, 0.3, 0, { drs: 1, reta: 1 }],
        ["Sainte Dévote", 6, 10, 6, 6.5, 6], ["Beau Rivage", 15, 180, 15, -0.7, 45],
        ["Massenet", 10, 22, 10, -4.2, 6], ["Cassino", 8, 12, 8, 4.5, 0],
        ["", 10, 60, 10, 0, -14],
        ["Mirabeau", 6, 10, 6, 6.5, -10], ["Grand Hotel", 5, 14, 5, -9.5, -6],
        ["", 6, 30, 6, 0, -4], ["Portier", 6, 10, 6, 6, -6],
        ["Túnel", 15, 200, 15, 0.7, 0, { tunel: 1 }],
        ["Chicane do Porto", 5, 6, 5, -6.5, 0], ["Chicane do Porto", 5, 6, 5, 6.5, 0],
        ["", 10, 70, 10, 0, 0, { porto: 1 }],
        ["Tabac", 8, 12, 8, -4.5, 0, { porto: 1 }],
        ["Piscina", 6, 8, 6, 4.5, 0, { porto: 1 }], ["Piscina", 6, 8, 6, -4.5, 0, { porto: 1 }],
        ["", 8, 40, 8, 0, 0], ["Rascasse", 6, 14, 6, 7, 0], ["Anthony Noghès", 6, 10, 6, 5.5, 0],
      ],
      // Monza: o Templo da Velocidade, retas enormes e as chicanes
      monza: [
        ["Reta dos Boxes", 30, 380, 20, 0, 0, { drs: 1, reta: 1 }],
        ["Variante del Rettifilo", 6, 6, 6, 6.5, 0], ["Variante del Rettifilo", 6, 6, 6, -6.5, 0],
        ["Curva Grande", 30, 90, 30, 1.6, 0],
        ["", 20, 120, 20, 0, 0],
        ["Variante della Roggia", 6, 6, 6, -5.5, 0], ["Variante della Roggia", 6, 6, 6, 5.5, 0],
        ["Lesmo 1", 10, 16, 10, 4.2, 0], ["Lesmo 2", 10, 14, 10, 4.8, 0],
        ["Serraglio", 20, 260, 20, -0.3, -6],
        ["Variante Ascari", 8, 8, 8, -4.5, 0], ["Variante Ascari", 8, 8, 8, 4.5, 0], ["Variante Ascari", 8, 8, 8, -3, 0],
        ["Reta Oposta", 20, 320, 20, 0, 6, { drs: 1 }],
        ["Parabólica", 20, 50, 40, 3.6, 0],
      ],
    };
    const GP = !!tema.gp && !!CIRCUITOS[op.pista];
    // Rally: notas do navegador (curvas com grau 1 a 6, saltos e água) e a especial em si
    const notas = [], waypoints = []; // off-road: os waypoints da etapa
    function gerarEspecial() {
      let st = ([...op.pista].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) + ESPECIAL * 977) >>> 0;
      const rnd = () => { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; };
      const PR = { finlandia: { saltos: 0.42, agua: 0.12, sobe: 28 }, suecia: { saltos: 0.15, agua: 0, sobe: 16 }, sertoes: { saltos: 0.25, agua: 0, sobe: 22 } }[op.pista] || { saltos: 0.2, agua: 0, sobe: 20 };
      trecho(15, 70, 10, 0, 0);
      // off-road: dunas, areia fofa/lama, rios, buracos e pedras na trilha, curvas abertas
      while (OFF && segs.length < 2900) {
        const r = rnd(), sobe = op.pista === "caatinga" ? 22 : 55;
        if (r < 0.2) {
          const n0 = segs.length;
          trecho(18, 8, 18, 0, sobe * (0.7 + rnd() * 0.5)); trecho(18, 8, 18, 0, -sobe * (0.7 + rnd() * 0.5));
          notas.push({ ini: n0, fim: n0 + 20, tipo: "duna" });
        } else if (r < 0.3 && op.pista !== "caatinga") {
          trecho(8, 10, 5, 0, -6);
          const n0 = segs.length;
          trecho(3, 14, 3, 0, 0);
          for (let n = n0; n < segs.length; n++) segs[n].agua = true;
          notas.push({ ini: n0, fim: segs.length - 1, tipo: "agua" });
          trecho(5, 10, 8, 0, 6);
        } else if (r < 0.42) {
          const n0 = segs.length;
          trecho(4, 16, 4, (rnd() - 0.5) * 2, 0);
          for (let n = n0; n < segs.length; n++) segs[n].lama = true;
          notas.push({ ini: n0, fim: segs.length - 1, tipo: "lama" });
        } else if (r < 0.52) {
          const n0 = segs.length;
          trecho(4, 2, 2, 0, 12); segs[segs.length - 1].salto = true; trecho(2, 2, 6, 0, -12);
          notas.push({ ini: n0, fim: segs.length - 1, tipo: "salto" });
        } else if (r < 0.62) {
          const n0 = segs.length, ld = rnd() < 0.5 ? -1 : 1;
          trecho(8, 20, 8, 0, (rnd() - 0.5) * 10);
          segs[n0 + 18].pedra = ld;
          notas.push({ ini: n0 + 10, fim: n0 + 20, tipo: "pedra", lado: ld });
        } else {
          const grau = 2 + Math.floor(rnd() * 5), lado = rnd() < 0.5 ? -1 : 1, longa = rnd() < 0.35;
          const len = [0, 10, 18, 22, 28, 34, 40][grau] * (longa ? 2 : 1);
          const n0 = segs.length;
          trecho(Math.round(len * 0.4) + 4, Math.round(len), Math.round(len * 0.4) + 4, lado * [0, 8.5, 6, 4.6, 3.4, 2.4, 1.5][grau], (rnd() - 0.5) * 20);
          notas.push({ ini: n0, fim: segs.length - 1, tipo: "curva", grau, lado, longa });
          trecho(6, 20 + Math.floor(rnd() * 50), 6, 0, (rnd() - 0.5) * 16);
        }
      }
      while (!OFF && segs.length < 2900) {
        if (rnd() < 0.3) {
          const f = 30 + Math.floor(rnd() * 110);
          if (rnd() < PR.saltos) {
            trecho(10, 10, 6, 0, 0);
            const n0 = segs.length;
            trecho(8, 3, 2, 0, PR.sobe * (0.8 + rnd() * 0.6));
            segs[segs.length - 1].salto = true;
            trecho(2, 2, 10, 0, -PR.sobe * (0.9 + rnd() * 0.5));
            notas.push({ ini: n0, fim: segs.length - 1, tipo: "salto" });
            trecho(10, f, 10, 0, 0);
          } else if (PR.agua && rnd() < PR.agua * 2.5) {
            trecho(10, 14, 5, 0, 0);
            const n0 = segs.length;
            trecho(2, 8, 2, 0, 0);
            for (let n = n0; n < segs.length; n++) segs[n].agua = true;
            notas.push({ ini: n0, fim: segs.length - 1, tipo: "agua" });
            trecho(5, f, 10, 0, (rnd() - 0.5) * 16);
          } else trecho(15, f, 15, 0, (rnd() - 0.5) * PR.sobe);
        } else {
          const grau = 1 + Math.floor(rnd() * 6), lado = rnd() < 0.5 ? -1 : 1, longa = grau > 2 && rnd() < 0.25;
          const len = [0, 10, 14, 18, 22, 28, 34][grau] * (longa ? 2.2 : 1);
          const n0 = segs.length;
          trecho(Math.round(len * 0.4) + 4, Math.round(len), Math.round(len * 0.4) + 4, lado * [0, 8.5, 6.5, 5, 3.8, 2.6, 1.6][grau], (rnd() - 0.5) * PR.sobe * 0.6);
          notas.push({ ini: n0, fim: segs.length - 1, tipo: "curva", grau, lado, longa });
          if (rnd() < 0.35) trecho(2, 3, 2, 0, 0); else trecho(6, 10 + Math.floor(rnd() * 40), 6, 0, (rnd() - 0.5) * PR.sobe * 0.5);
        }
      }
      trecho(10, 90, 10, 0, 0);
      // o texto de cada nota, como um navegador de verdade: "Esquerda três longa", "Grampo direita",
      // "fecha" quando a curva aperta, e "e" quando uma curva emenda na outra
      const ACAO = { duna: "Duna! Acelera na subida!", lama: op.pista === "caatinga" ? "Leito de rio seco, areia fofa! Acelera firme!" : "Areia fofa! Acelera firme!", pedra: n => `Pedra na ${n.lado < 0 ? "esquerda" : "direita"}! Desvia!`, salto: OFF ? "Buraco! Segura!" : "Salto! Segura reto!", agua: op.pista === "lencois" ? "Lagoa! Passa devagar!" : OFF ? "Rio! Passa devagar!" : "Água! Passa reto!" };
      const txt = n => n.tipo !== "curva" ? (typeof ACAO[n.tipo] === "function" ? ACAO[n.tipo](n) : ACAO[n.tipo]) : (n.grau === 1 ? `Grampo ${n.lado < 0 ? "esquerda" : "direita"}` : `${n.lado < 0 ? "Esquerda" : "Direita"} ${NUM_NOTA[n.grau]}`) + (n.longa ? " longa" : "");
      notas.forEach((n, i) => {
        n.texto = (n.tipo === "curva" && n.grau <= 2 ? "Cuidado! " : "") + txt(n) + (n.tipo === "curva" && n.grau === 1 && !OFF ? ", freio de mão!" : "");
        if (n.tipo !== "curva") return; // dunas, rios, pedras: cada aviso sozinho
        const prox = notas[i + 1];
        if (prox && prox.tipo === "curva" && n.tipo === "curva" && prox.lado === n.lado && prox.grau < n.grau && prox.ini - n.fim < 20) n.texto += ", fecha";
        if (prox && prox.ini - n.fim < 16 && !n.junta) { n.texto += ` e ${txt(prox).toLowerCase()}`; prox.junta = true; }
      });
    }
    const curvas = []; // curvas com nome: { nome, ini, fim, curva }
    if (GP) {
      CIRCUITOS[op.pista].forEach(([nome, e, f, sa, cv, sub, ex = {}]) => {
        const n0 = segs.length;
        trecho(e, f, sa, cv, sub);
        for (let n = n0; n < segs.length; n++) { const sg = segs[n]; if (ex.tunel) sg.tunel = true; if (ex.porto) sg.porto = true; if (ex.reta) sg.reta = true; }
        if (ex.drs) { segs[n0 + e].drsIni = true; for (let n = n0 + e; n < n0 + e + f - 10; n++) segs[n].drs = true; }
        if (nome && Math.abs(cv) >= 1) {
          const ult = curvas[curvas.length - 1];
          if (ult && ult.nome === nome && ult.fim >= n0 - 1) ult.fim = segs.length - 1, ult.curva = Math.sign(ult.curva) * Math.max(Math.abs(ult.curva), Math.abs(cv)), ult.chicane = true;
          else curvas.push({ nome, ini: n0, fim: segs.length - 1, curva: cv });
        }
      });
    } else if (RALLY) gerarEspecial();
    else (TRACADOS[op.pista] || TRACADOS.campo).forEach(t => trecho(...t));
    trecho(30, 30, 40, 0, ultimaY() / -SEG); // volta à altura do começo
    const N = segs.length, VOLTA = N * SEG;
    const MURO = op.pista === "monaco"; // Mônaco: muro dos dois lados, sem área de escape
    segs.forEach(sg => { sg.zebra = !GP && !RALLY; if (MURO) sg.parede = true; if (op.pista === "suecia") sg.banco = true; });
    if (GP) curvas.forEach(cu => {
      for (let n = cu.ini - 4; n <= cu.fim + 4; n++) segs[(n + N) % N].zebra = true;
      if (!MURO && Math.abs(cu.curva) >= 2.5) for (let n = cu.ini + 4; n <= cu.fim + 10; n++) segs[(n + N) % N].brita = true;
    });
    // Largada e chegada (quadriculado)
    segs[2].largada = true; segs[3].largada = true;
    // Faixas de turbo ⚡ nas retas, numa das 3 faixas da pista: passar por cima dá um empurrão
    for (let n = 45; !GP && !RALLY && n < N - 30; n += 50 + Math.floor(Math.random() * 35)) {
      if ([0, 1, 2, 3].some(k => Math.abs(segs[n + k].curva) > 1.5)) continue;
      const tx = [-2 / 3, 0, 2 / 3][Math.floor(Math.random() * 3)];
      for (let k = 0; k < 4; k++) segs[n + k].turbo = tx;
    }
    // Enfeites dos dois lados
    const imagens = {};
    const img = tipo => (imagens[tipo] = imagens[tipo] || desenharEnfeite(tipo));
    // tamanho de cada enfeite no mundo (o pórtico e a boca do túnel têm a largura da pista)
    const tamDe = t => (t === "portico" ? LARGURA * 2.4 : t.startsWith("arco:") ? LARGURA * 2.7 : t === "tunel" ? LARGURA * 3 : TAM_ENFEITE[t] || TAM_ENFEITE[t.split(":")[0]] || 1000);
    const por = (n, tipo, x, solido = true) => segs[(n + N) % N].enfeites.push({ tipo, x, solido });
    if (GP) {
      por(3, "portico", 0, false);
      for (let n = 0; n < N; n++) {
        const sg = segs[n], r = Math.random();
        if (sg.tunel) { if (!segs[(n - 1 + N) % N].tunel) por(n, "tunel", 0, false); por(n, "parede-tunel", -1.3, false); por(n, "parede-tunel", 1.3, false); continue; }
        if (sg.reta) {
          // reta dos boxes: muro, garagens das equipes do lado esquerdo e a arquibancada do outro
          if (n % 3 === 0) por(n, "muro", -1.3);
          if (n % 7 === 0) por(n, "boxes", -2.6);
          if (n % 9 === 4) por(n, "arquibancada", 2.7);
          continue;
        }
        if (MURO) {
          if (n % 3 === 0) { por(n, "guardrail", -1.3, false); por(n, "guardrail", 1.3, false); }
          if (n % 4 === 1) por(n, "predio-dia", -(2.1 + r * 0.5));
          if (sg.porto) { if (n % 6 === 2) por(n, "iate", 2.9); }
          else if (n % 4 === 3) por(n, "predio-dia", 2.1 + r * 0.5);
          if (n % 23 === 0) por(n, "coqueiro", sg.porto ? -1.7 : 1.7);
        } else {
          // parque: árvores (Monza é cheia delas), pneus por fora das curvas e torcida
          if (n % (op.pista === "monza" ? 2 : 4) === 0) por(n, Math.random() < 0.8 ? "arvore" : "pinheiro", (r < 0.5 ? -1 : 1) * (2.6 + Math.random() * 1.2));
          if (n % 17 === 0) por(n, "faixa-gp", (r < 0.5 ? -1 : 1) * 2.1);
        }
      }
      // em cada curva com nome: placa com o nome, arquibancada e pneus por fora, placas de frenagem antes das fechadas
      curvas.forEach(cu => {
        const fora = cu.curva > 0 ? -1 : 1;
        por(cu.ini - 22, "nome:" + cu.nome, -fora * 2.3);
        if (!MURO) { por(cu.ini + 2, "arquibancada", fora * 2.9); por(cu.ini + 6, "pneus", fora * 2); por(cu.ini + 14, "pneus", fora * 2); }
        if (Math.abs(cu.curva) >= 5.5) [["150", 36], ["100", 24], ["50", 12]].forEach(([m, d]) => por(cu.ini - d, "freio:" + m, fora * 1.55));
      });
      segs.forEach((sg, n) => { if (sg.drsIni) por(n, "drs", 1.6); });
    }
    // Rally: floresta colada na estrada (Finlândia), montes de neve (Suécia), cactos e pedras (Sertões),
    // o arco da largada e o da chegada, público nos saltos e nas curvas fechadas, placas de perigo
    if (RALLY) {
      let st = 12345 + ESPECIAL;
      const rnd = () => { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; };
      por(3, "arco:LARGADA", 0, false);
      por(N - 8, "arco:CHEGADA", 0, false);
      if (OFF) {
        // waypoints: um par de bandeiras a cada trecho; pedras soltas na trilha (o navegador avisa)
        for (let n = 260, k = 1; n < N - 120; n += 300 + Math.floor(rnd() * 60), k++) {
          while (n < N - 120 && Math.abs(segs[n].curva) > 0.5) n++;
          waypoints.push({ n, num: k });
          por(n, "baliza:" + k, -0.62, false); por(n, "baliza:" + k, 0.62, false);
        }
        segs.forEach((sg, n) => { if (sg.pedra) por(n, "pedra", sg.pedra * 0.45); });
      }
      for (let n = 10; n < N - 12; n++) {
        const lado = rnd() < 0.5 ? -1 : 1;
        if (OFF) {
          // terreno aberto: nada colado na trilha, coisas espalhadas mais longe
          if (n % 4 === 0) { const t = Motor.sortear(tema.coisas); por(n, t, lado * (1.6 + rnd() * 2.2), !["lagoa", "capim", "arbusto"].includes(t)); }
          if (n % 7 === 3) por(n, op.pista === "lencois" ? "lagoa" : op.pista === "jalapao" ? "capim" : "arbusto", -lado * (1.4 + rnd() * 1.5), false);
          if (op.pista === "jalapao" && n % 31 === 5) por(n, "buriti", lado * (2.8 + rnd()));
          if (op.pista === "caatinga" && n % 9 === 2) por(n, "mandacaru", lado * (2 + rnd() * 1.6));
        } else if (op.pista === "finlandia") {
          if (n % 2 === 0) por(n, rnd() < 0.85 ? "pinheiro" : "arvore", lado * (1.55 + rnd() * 1.4));
          if (n % 3 === 0) por(n, "pinheiro", -lado * (2 + rnd() * 1.5));
          if (n % 97 === 40) por(n, "casa-vermelha", lado * 3.4);
        } else if (op.pista === "suecia") {
          if (n % 2 === 0) { por(n, "banco-neve", -1.32, false); por(n, "banco-neve", 1.32, false); }
          if (n % 3 === 0) por(n, "pinheiro-neve", lado * (2 + rnd() * 1.4));
        } else {
          if (n % 5 === 0) por(n, "mandacaru", lado * (1.7 + rnd() * 1.8));
          if (n % 9 === 4) por(n, "pedra", lado * (1.5 + rnd() * 1));
          if (n % 13 === 6) por(n, rnd() < 0.5 ? "arvore" : "pedra", -lado * (2.4 + rnd()));
        }
      }
      notas.forEach(nt => {
        if (OFF) { if (nt.tipo === "agua" || nt.tipo === "duna") por(nt.ini + 2, "torcida", 2.7); return; }
        const fora = nt.tipo === "curva" ? -nt.lado : 1;
        if (nt.tipo === "salto") { por(nt.fim, "torcida", 2.4); por(nt.fim + 2, "torcida", -2.5); por(nt.ini - 24, "cuidado", 1.6); }
        else if (nt.tipo === "agua") { por(nt.ini + 3, "torcida", 2.5); }
        else if (nt.grau <= 2) { por(nt.ini - 20, "cuidado", fora * 1.6); if (rnd() < 0.6) por(nt.ini + 4, "torcida", fora * 2.6); }
      });
    }
    for (let n = 20; !GP && !RALLY && n < N - 10; n += 3 + Math.floor(Math.random() * 4)) {
      const lado = Math.random() < 0.5 ? -1 : 1, tipo = Motor.sortear(tema.coisas);
      // a arquibancada é grande: fica mais longe da pista
      segs[n].enfeites.push({ tipo, x: lado * (tipo === "arquibancada" ? 2.3 + Math.random() * 0.8 : 1.35 + Math.random() * 1.4) });
      if (Math.random() < 0.35) segs[n].enfeites.push({ tipo: Motor.sortear(tema.coisas), x: -lado * (1.4 + Math.random() * 1.6) });
    }

    // ----- Jogadores (1 ou 2, tela dividida) e adversários -----
    const VMAX = (SEG / (1 / 60)) * NIVEL.max * (GP ? 1.2 : RALLY ? 1.05 : 1);
    const KMH = { interlagos: 320, monaco: 290, monza: 350, finlandia: 200, suecia: 190, sertoes: 195, jalapao: 150, lencois: 140, caatinga: 160 }[op.pista] || 220; // velocidade máxima no velocímetro
    const CAM = ALT_CAMERA * PROF; // o carro do jogador fica esta distância à frente da câmera
    const EMOJI_COR = { vermelho: "🔴", azul: "🔵", amarelo: "🟡", verde: "🟢", rosa: "🩷", laranja: "🟠" };
    const cor1 = CORES[op.cor] ? op.cor : "vermelho", cor2 = CORES[op.cor2] && op.cor2 !== cor1 ? op.cor2 : cor1 === "azul" ? "laranja" : "azul";
    const novoJogador = (n, cor, ent) => {
      const hex = CORES[cor];
      return {
        n, cor, hex, tec: ent, ent, emoji: EMOJI_COR[cor], turbo: 0, aviso: null, tFim: 0,
        nome: (n === 1 ? op.nome1 : op.nome2) || (DOIS ? `Jogador ${n}` : "Você"),
        giro: 0, inclina: 0, parts: [],
        pos: 0, x: 0, vel: 0, voltas: 0, ceuDesl: 0, morroDesl: 0, sacode: 0, ultPos: 99, chegou: 0,
      };
    };
    const jog = DOIS ? [novoJogador(1, cor1, T.ent), novoJogador(2, cor2, T.ent2)] : [novoJogador(1, cor1, T.ent)];
    if (DOIS) { jog[0].x = -0.5; jog[1].x = 0.5; }
    const roncos = jog.map((j, i) => somDeMotor(DOIS ? (i ? 0.6 : -0.6) : 0, RALLY ? "rally" : !!tema.gp));
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
    // Grande Prêmio (1 jogador): 10 carros no grid, em fila dupla; você larga em 6º e os da frente são mais rápidos
    const SLOT = 5;
    if (GP && !DOIS) {
      const EQUIPES = ["#e10600", "#00d2be", "#ff8700", "#1e41ff", "#006f62", "#f596c8", "#b6babd", "#2b4562", "#ffd700", "#900000", "#6cd3bf"].filter(h => h !== jog[0].hex);
      rivais.length = 0;
      for (let slot = 0, k = 0; slot < 10; slot++) {
        if (slot === SLOT) continue;
        let z = CAM + (SLOT - slot) * 1.5 * SEG, voltas = 0;
        if (z < 0) { z += VOLTA; voltas = -1; }
        rivais.push({ cor: EQUIPES[k], nome: nomesRivais[k], tFim: 0, x: slot % 2 ? 0.45 : -0.45, z, voltas, vel: VMAX * NIVEL.rivais * (1.04 - slot * 0.013), chegou: 0 });
        k++;
      }
      jog[0].x = SLOT % 2 ? 0.45 : -0.45;
    }
    if (RALLY) rivais.length = 0; // no rally, um carro de cada vez na estrada: a disputa é no relógio
    // Rally: tempo ideal da especial (andando no limite de cada curva) para os tempos dos outros pilotos e as parciais
    const tPref = [];
    let rallyRivais = null;
    if (RALLY) {
      const lim = c => (c > 0 ? Math.min(1, 1 / (c * 0.28 * GRIP) - 0.04) : 1);
      let t = 0;
      for (let n = 0; n < N; n++) { let c = 0; for (let k = 0; k < 5; k++) c = Math.max(c, Math.abs(segs[(n + k) % N].curva)); t += SEG / (VMAX * lim(c)) * 1.06; tPref.push(t); }
      const tIdeal = t, faixa = { facil: [1.12, 1.45], normal: [1.04, 1.3], dificil: [1, 1.18] }[op.nivel] || [1.04, 1.3];
      if (!op.ral) {
        const nomes = Motor.embaralhar(NOMES_PILOTOS.filter(nm => nm.toLowerCase() !== (op.nome1 || "").toLowerCase())).slice(0, 7);
        const cores = ["#e10600", "#1e41ff", "#ffd700", "#00d2be", "#ff8700", "#2a9d55", "#b6babd"];
        op.ral = nomes.map((nome, k) => ({ nome, hex: cores[k], hab: k / 6 }));
      }
      rallyRivais = op.ral.map(r => ({ ...r, tempo: tIdeal * (faixa[0] + r.hab * (faixa[1] - faixa[0])) * (0.98 + Math.random() * 0.04) }));
    }
    const SPLITS = RALLY ? [Math.floor(N / 3), Math.floor(N * 2 / 3)] : [];
    // Rally: os outros pilotos aparecem como "fantasmas" (transparentes, sem batida), cada um no
    // ritmo exato do tempo que vai fazer: dá para ver quem está na frente e passar por eles
    if (RALLY) rallyRivais.forEach(r => rivais.push({ cor: r.hex, nome: r.nome, tFim: 0, x: 0, z: CAM, voltas: 0, vel: 0, chegou: 0, fantasma: true, T: r.tempo }));
    function moverFantasma(r, dt) {
      if (fase !== "correndo") { r.z = CAM; return; }
      const ti = tempo * (tPref[N - 1] / r.T);
      if (ti >= tPref[N - 9]) { r.oculto = true; r.voltas = 1; r.z = CAM; return; } // já cruzou a chegada
      let lo = 0, hi = N - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (tPref[m] < ti) lo = m + 1; else hi = m; }
      const t0 = lo ? tPref[lo - 1] : 0, fr = Math.max(0, Math.min(1, (ti - t0) / (tPref[lo] - t0 || 1)));
      const z = CAM + (lo + fr) * SEG;
      r.freando = z - r.z < (r.vel || 0) * dt * 0.97;
      r.vel = dt > 0 ? (z - r.z) / dt : 0; r.v = r.vel;
      r.z = z;
      const sg = segDe(z);
      r.x += ((-Math.sign(sg.curva) * Math.min(0.45, Math.abs(sg.curva) * 0.08)) - r.x) * Math.min(1, dt * 1.5); // corta por dentro da curva
    }
    jog.forEach(j => { j.tVolta = 0; j.melhor = 0; j.ultima = 0; j.drs = false; });
    const TOTAL_CARROS = rivais.length + jog.length;
    let tempo = 0, fase = "largada", contagem = RALLY ? 5.6 : 3.6, chegada = 0, primeiraChegada = 0;
    // Grande Prêmio: antes das luzes, o narrador apresenta o autódromo (com o cartão na tela)
    let esperaIntro = (GP || RALLY) && !DOIS;
    // relógio da prova: continua depois que você chega, para cada carro ter o seu tempo de chegada
    let relogioProva = 0;
    const TOTAL_VOLTAS = RALLY ? 1 : Math.max(1, Math.min(10, parseInt(op.voltas, 10) || 3)); // escolhido nas opções (o rally é uma especial)
    const segDe = z => segs[Math.floor(((z % VOLTA) + VOLTA) % VOLTA / SEG) % N];
    const progresso = (v, z) => v * VOLTA + z;
    const posicao = j => {
      const meu = progresso(j.voltas, j.pos + CAM); // o carro fica CAM à frente da câmera
      return 1 + rivais.filter(r => progresso(r.voltas, r.z) > meu).length + jog.filter(o => o !== j && progresso(o.voltas, o.pos + CAM) > meu).length;
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
          acao: t.acao || p.botao(2), buzina: t.buzina || p.botao(3),
        };
      });
      // Start do 2º controle pausa (o do 1º já chega como a tecla "p")
      const st = !!(ps[1] && ps[1].botao(9));
      if (st && !startAnt) alternarPausa();
      startAnt = st;
    }

    function moverJogador(j, dt) {
      if (j.ent.buzina && !j.buzinou) { Motor.nota(330, { dur: 0.35, tipo: "square", vol: 0.07 }); Motor.nota(415, { dur: 0.35, tipo: "square", vol: 0.05 }); }
      j.buzinou = !!j.ent.buzina;
      const seg = segDe(j.pos + CAM), pv = j.vel / VMAX;
      const corre = fase === "correndo" && !j.chegou;
      if (DOIS && j.chegou) {
        // Já cruzou a chegada: segue devagar pela sua faixa, sem atrapalhar quem ainda corre
        j.vel += (VMAX * 0.45 - j.vel) * Math.min(1, dt);
        j.x += ((j.n === 1 ? -0.6 : 0.6) - j.x) * Math.min(1, dt * 1.5);
      } else {
        // Direção: vira mais rápido quando anda; nas curvas a força puxa para fora
        const dx = dt * 2.2 * pv * (j.ar > 0 ? 0.15 : 1); // no ar (salto) o volante quase não faz nada
        if (corre && j.ent.esq) j.x -= dx;
        if (corre && j.ent.dir) j.x += dx;
        // fórmula gruda mais no chão (asas), mas nas curvas fechadas só passa freando antes
        j.x -= dx * pv * seg.curva * 0.28 * (GP ? 0.7 : RALLY ? GRIP : 1);
        if (RALLY) {
          // freio de mão: trava as rodas de trás, a traseira escorrega e o carro "gira" para dentro da
          // curva (é assim que os pilotos fazem os grampos)
          const puxaFreioMao = j.ent.acao && pv > 0.12 && !(j.ar > 0);
          if (puxaFreioMao) {
            const lado = j.ent.esq ? -1 : j.ent.dir ? 1 : Math.sign(seg.curva);
            j.x += lado * dt * 1.7 * pv; j.vel -= VMAX * 0.42 * dt;
            if (!j.ultDerrapa || tempo - j.ultDerrapa > 0.35) { j.ultDerrapa = tempo; Motor.ruido({ dur: 0.35, vol: 0.12, filtro: "highpass", freq: 1500 }); }
          }
          // de lado nas curvas (o carro escorrega na terra e na neve; com o freio de mão, bem mais)
          j.drift = (j.drift || 0) + ((seg.curva * pv * 0.045 + (puxaFreioMao ? (j.ent.esq ? -0.25 : j.ent.dir ? 0.25 : Math.sign(seg.curva) * 0.25) : 0)) - (j.drift || 0)) * Math.min(1, dt * 4);
          // salto: passou na lombada rápido, o carro voa um pouco
          if (seg.salto && j.saltoSeg !== seg.i && pv > 0.5) { j.saltoSeg = seg.i; j.ar = j.arTotal = 0.25 + pv * 0.6; }
          if (j.ar > 0) { j.ar -= dt; if (j.ar <= 0) { j.tremor = 0.5; Motor.ruido({ dur: 0.25, vol: 0.25, freq: 180 }); if (j.arTotal > 0.7) avisar(j, "🪂 QUE SALTO!", "#ffd60a", 1.2); } }
          // água: freia um pouco e espirra
          if (seg.lama) { if (j.vel > VMAX * 0.55) j.vel -= VMAX * 0.7 * dt; j.x += Math.sin(tempo * 3.1) * dt * 0.5; j.enlameado = 0.5; }
          j.enlameado = Math.max(0, (j.enlameado || 0) - dt);
          if (seg.agua) { if (j.vel > VMAX * (OFF ? 0.35 : 0.45)) j.vel -= VMAX * 0.5 * dt; j.molhou = 0.6; if (!j.ultAgua || tempo - j.ultAgua > 1) { j.ultAgua = tempo; Motor.ruido({ dur: 0.6, vol: 0.25, filtro: "highpass", freq: 900 }); } }
          // monte de neve: segura o carro, mas ele perde velocidade
          if (seg.banco && Math.abs(j.x) > 1.12) { j.x = Math.sign(j.x) * 1.12; j.vel -= VMAX * 0.5 * dt; j.tremor = 0.3; }
          j.molhou = Math.max(0, (j.molhou || 0) - dt); j.tremor = Math.max(0, (j.tremor || 0) - dt);
        }
        let acelera = corre && (j.ent.acel || (NIVEL.auto && !j.ent.freio));
        j.freioAuto = false;
        if ((GP || RALLY) && corre) {
          // a curva mais fechada logo à frente e a velocidade que dá para fazer nela
          let cmax = 0;
          for (let k = 0; k < 34; k++) cmax = Math.max(cmax, Math.abs(segDe(j.pos + CAM + k * SEG).curva));
          const limite = cmax > 0 ? Math.min(1, 1 / (cmax * 0.28 * (GP ? 0.7 : GRIP)) - 0.04) : 1;
          // no fácil, o carro freia sozinho antes das curvas fechadas
          if (NIVEL.auto && pv > limite) { acelera = false; j.vel -= VMAX * 0.9 * dt; j.freioAuto = true; }
          else if (!RALLY && pv > limite + 0.06 && j.voltas === 0 && !j.ent.freio && (!j.ultFreio || tempo - j.ultFreio > 4)) { j.ultFreio = tempo; avisar(j, "🛑 FREIE!", "#ff4d6d", 1); }
          // DRS: ao entrar na zona, abre se o carro da frente estiver a menos de 1 segundo
          if (seg.drsIni && j.zonaDrs !== seg.i) {
            j.zonaDrs = seg.i;
            const zj = j.pos + CAM, frente = [...rivais.map(r => r.z), ...jog.filter(o => o !== j).map(o => o.pos + CAM)].map(z => ((z - zj) % VOLTA + VOLTA) % VOLTA).filter(d => d > 0);
            const gap = frente.length ? Math.min(...frente) / Math.max(j.vel, VMAX * 0.3) : 9;
            // como na Fórmula 1: o DRS só vale a partir da 2ª volta, e o piloto aperta o botão para abrir
            j.drsPode = gap < 1 && j.voltas >= 1;
            if (j.drsPode) { avisar(j, "🟢 DRS LIBERADO! APERTE", "#3cff78", 1.6); Motor.nota(520, { dur: 0.25, tipo: "triangle", vol: 0.08, ate: 900 }); if (!DOIS && !j.falouBotaoDrs) { j.falouBotaoDrs = true; Motor.falar("DRS liberado! Aperte o botão do DRS para abrir a asa!"); } }
            else if (!j.explicouDrs && !DOIS && j.voltas >= 1) { j.explicouDrs = true; Motor.falar("Zona de DRS! Chegue a menos de um segundo do carro da frente, e a asa traseira abre na próxima reta."); }
          }
          if (j.drsPode && seg.drs && !j.drs && (j.ent.acao || NIVEL.auto)) { j.drs = true; avisar(j, "🟢 DRS ABERTO!", "#3cff78", 1.2); Motor.ruido({ dur: 0.2, vol: 0.1, filtro: "highpass", freq: 3000 }); }
          if (!seg.drs || j.ent.freio) { j.drs = false; if (!seg.drs) j.drsPode = false; }
        }
        if (acelera) j.vel += VMAX / 5 * dt * (j.drs ? 1.4 : 1);
        else if (j.ent.freio) j.vel -= VMAX * dt;
        else j.vel -= VMAX / 5 * dt;
        if (fase === "fim") j.vel -= VMAX / 3 * dt;
        // Fora da pista: mais devagar e sacudindo (na brita do autódromo, o carro quase para)
        if (OFF && Math.abs(j.x) > 1.05) { if (j.vel > VMAX * 0.55) j.vel -= VMAX * 0.6 * dt; j.sacode = 0.6; } // fora da trilha: terreno ruim, mas dá para cortar
        else if (Math.abs(j.x) > 1.05) { if (seg.brita) { if (j.vel > VMAX / 7) j.vel -= VMAX * 1.1 * dt; } else if (j.vel > VMAX / 4) j.vel -= VMAX / 1.6 * dt; j.sacode = 1.5; } else j.sacode = 0;
        // Mônaco: encostou no muro, raspa e perde velocidade
        if (seg.parede && Math.abs(j.x) > 1.1) { j.x = Math.sign(j.x) * 1.1; j.vel -= VMAX * 0.9 * dt; j.sacode = 1.5; if (!j.ultMuro || tempo - j.ultMuro > 0.5) { j.ultMuro = tempo; Motor.ruido({ dur: 0.15, vol: 0.18, freq: 1800 }); } }
        // Bateu num enfeite da beira
        seg.enfeites.forEach(e => { if (e.solido !== false && Math.abs(j.x - e.x) < 0.35 && (Math.abs(e.x) > 1 || e.tipo === "pedra")) { j.vel = VMAX / 5; j.x = e.x > 0 ? e.x - 0.5 : e.x + 0.5; Motor.ruido({ dur: 0.15, vol: 0.2, freq: 400 }); } });
        // Turbo: passou por cima da faixa ⚡ e ganha velocidade além do normal por um tempinho
        if (corre && seg.turbo !== undefined && Math.abs(j.x - seg.turbo) < 0.34) {
          if (j.turbo <= 0) { Motor.nota(260, { dur: 0.6, tipo: "sawtooth", vol: 0.05, ate: 1000 }); avisar(j, "⚡ TURBO!", "#ffd60a", 1.1); }
          j.turbo = 1.6;
        }
        if (j.turbo > 0) { j.turbo -= dt; if (corre) j.vel += VMAX * 0.9 * dt; }
        // Encostou num adversário (ou no outro jogador, que está na frente): perde velocidade
        rivais.forEach(r => {
          if (r.fantasma) return;
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
      const teto = VMAX * (j.turbo > 0 ? 1.3 : 1) * (j.drs ? 1.1 : 1);
      if (j.vel > teto) j.vel = Math.max(teto, j.vel - VMAX * 0.5 * dt);
      j.vel = Math.max(0, j.vel);
      j.pos += j.vel * dt;
      if (j.pos >= VOLTA) { j.pos -= VOLTA; j.voltas++; novaVolta(j); }
      j.ceuDesl += seg.curva * pv * dt * 0.012;
      j.morroDesl += seg.curva * pv * dt * 0.025;
    }

    function atualizar(dt) {
      if (fase === "largada" && esperaIntro) { if (jog.some(j => j.ent.acel)) esperaIntro = false; return; } // tocar em acelerar pula a apresentação
      if (fase === "largada") {
        const antes = Math.ceil(contagem), luzesAntes = luzesAcesas();
        contagem -= dt;
        if (RALLY && Math.ceil(contagem) !== antes && contagem > 0) Motor.nota(660, { dur: 0.12, tipo: "square", vol: 0.07 }); // o relógio da largada apita a cada segundo
        if (Math.ceil(contagem) !== antes && contagem > 0 && antes <= (RALLY ? 5 : 3)) Motor.falar(String(Math.ceil(contagem)));
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
        if (r.fantasma) return moverFantasma(r, dt);
        const sr = segDe(r.z);
        let fator = 1 - Math.min(0.25, Math.abs(sr.curva) * 0.05);
        if (GP) { let c = 0; for (let k = 0; k < 7; k++) c = Math.max(c, Math.abs(segDe(r.z + k * SEG).curva)); fator = (c > 0 ? Math.min(1, 1.05 / (c * 0.196)) : 1) * (sr.drs ? 1.04 : 1); }
        const alvo = r.vel * fator * (r.chegou ? 0.4 : 1);
        if (GP) r.v = (r.v || 0) + Math.max(-VMAX * dt, Math.min(VMAX / 4.6 * dt, alvo - (r.v || 0))); // aceleram e freiam como carro de verdade
        else r.v = (r.v || 0) + (alvo - (r.v || 0)) * Math.min(1, dt * 1.2);
        r.freando = alvo < r.v - VMAX * 0.02; // só para acender as lanternas no desenho
        // desvia de quem está logo à frente (e dos jogadores)
        const frente = [...rivais.filter(o => o !== r), ...carrosJog].find(o => { const d = ((o.z - r.z) % VOLTA + VOLTA) % VOLTA; return d > 0 && d < SEG * 6 && Math.abs(o.x - r.x) < 0.5 && (o.v ?? o.vel) < r.v; });
        if (frente) r.x += (r.x > frente.x ? 1 : -1) * dt * 0.9;
        r.x = Math.max(-0.8, Math.min(0.8, r.x));
        r.z += r.v * dt;
        if (r.z >= VOLTA) { r.z -= VOLTA; r.voltas++; if (r.voltas >= TOTAL_VOLTAS && !r.chegou) { r.chegou = ++chegada; r.tFim = relogioProva; } }
      });
      // Off-road: passou pelo waypoint? entre as bandeiras vale; fora delas, 10 segundos de castigo
      if (OFF && fase === "correndo" && !jog[0].chegou) {
        const j = jog[0], sn = segDe(j.pos + CAM).i, wp = waypoints[j.wp || 0];
        if (wp && sn >= wp.n && sn < wp.n + 40) {
          j.wp = (j.wp || 0) + 1;
          if (Math.abs(j.x) < 0.75) { j.wpOk = (j.wpOk || 0) + 1; avisar(j, `✅ WAYPOINT ${wp.num}/${waypoints.length}`, "#3cff78", 1.4); Motor.nota(880, { dur: 0.15, tipo: "triangle", vol: 0.1 }); Motor.nota(1320, { dur: 0.2, tipo: "triangle", vol: 0.1, inicio: 0.1 }); }
          else { tempo += 10; avisar(j, "❌ WAYPOINT +10 s", "#ff6b6b", 2); Motor.falar("Perdemos o waypoint! Dez segundos de castigo. Passe entre as bandeiras!", { naFila: true }); }
        }
      }
      // Rally: o navegador canta a próxima nota uns 2,5 s antes; nas parciais, compara com o líder
      if (RALLY && fase === "correndo" && !jog[0].chegou) {
        const j = jog[0], zc = j.pos + CAM;
        const nt = notas.find(n => !n.chamada && !n.junta && n.ini * SEG > zc - SEG * 4);
        if (nt && nt.ini * SEG - zc < Math.max(SEG * 22, j.vel * 2.6)) { nt.chamada = true; Motor.falar(nt.texto); j.nota = nt; }
        if (j.nota && zc > (j.nota.fim + 6) * SEG) j.nota = null;
        const sn = segDe(zc).i, lider = Math.min(...rallyRivais.map(r => r.tempo));
        SPLITS.forEach((sp, k) => {
          if (j[`p${k}`] === undefined && sn >= sp && sn < sp + 50) {
            const dif = tempo - lider * (tPref[sp] / tPref[N - 1]);
            j[`p${k}`] = dif;
            const txt = `${dif <= 0 ? "−" : "+"}${Math.abs(dif).toFixed(1).replace(".", ",")}`;
            avisar(j, `⏱️ PARCIAL ${k + 1}: ${txt}`, dif <= 0 ? "#3cff78" : "#ff6b6b", 2.4);
            Motor.falar(dif <= 0 ? "Parcial: na frente do líder!" : `Parcial: ${Math.max(1, Math.round(dif))} segundo${Math.round(dif) > 1 ? "s" : ""} atrás do líder.`, { naFila: true });
          }
        });
      }
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
        ...jog.map(j => ({ nome: j.nome, hex: j.hex, prog: progresso(j.voltas, j.pos + CAM), tempo: j.tFim || 0, j })),
      ].sort((a, b) => (a.tempo && b.tempo ? a.tempo - b.tempo : a.tempo ? -1 : b.tempo ? 1 : b.prog - a.prog));
    }
    const tempoTxt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")},${Math.floor(t * 10 % 10)}`;
    const tempoFalado = t => (t >= 60 ? `${Math.floor(t / 60)} minuto${t >= 120 ? "s" : ""} e ` : "") + `${Math.floor(t % 60)} segundos`;
    const avisar = (j, txt, cor, dur = 1.4) => { j.aviso = { txt, cor, t: dur, dur }; };
    function novaVolta(j) {
      if (fase !== "correndo" || j.chegou) return;
      const tv = tempo - j.tVolta;
      j.tVolta = tempo; j.ultima = tv;
      const recorde = GP && j.melhor && tv < j.melhor;
      if (!j.melhor || tv < j.melhor) j.melhor = tv;
      if (recorde && j.voltas < TOTAL_VOLTAS) { setTimeout(() => { if (vivo()) avisar(j, `🟣 VOLTA MAIS RÁPIDA! ${tempoTxt(tv)}`, "#c77dff", 2.2); }, 2100); if (!DOIS) Motor.falar(`Volta mais rápida! ${tempoFalado(tv)}.`, { naFila: true }); }
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
        avisar(j, (ultima ? "🏁 ÚLTIMA VOLTA!" : `VOLTA ${j.voltas + 1}`) + (GP ? ` · ${tempoTxt(tv)}` : ""), ultima ? "#ff4d6d" : "#fff", 2);
        if (ultima) { Motor.nota(660, { dur: 0.15, tipo: "triangle", vol: 0.1 }); Motor.nota(880, { dur: 0.3, tipo: "triangle", vol: 0.1, inicio: 0.15 }); }
        Motor.falar(DOIS ? `${msg}, ${j.nome}!` : msg + "!");
      }
    }
    function fimRally() {
      fase = "fim";
      const meu = tempo, nome = op.nome1 || "Você", hexJ = jog[0].hex;
      const daEspecial = [...rallyRivais.map(r => ({ nome: r.nome, hex: r.hex, tempo: r.tempo })), { nome, hex: hexJ, tempo: meu, j: true }].sort((a, b) => a.tempo - b.tempo);
      const posEsp = daEspecial.findIndex(c => c.j) + 1;
      const acum = { ...(op.acum || {}) };
      daEspecial.forEach(c => { acum[c.j ? "__eu" : c.nome] = (acum[c.j ? "__eu" : c.nome] || 0) + c.tempo; });
      const geral = daEspecial.map(c => ({ ...c, total: acum[c.j ? "__eu" : c.nome] })).sort((a, b) => a.total - b.total);
      const posGeral = geral.findIndex(c => c.j) + 1, ultima = ESPECIAL >= TOTAL_ESP;
      const chave = `carros-rally-${op.pista}-${ESPECIAL}`;
      let rec = 0; try { rec = +localStorage.getItem(chave) || 0; } catch (e) { /* ok */ }
      const novo = !rec || meu < rec;
      if (novo) { try { localStorage.setItem(chave, meu); } catch (e) { /* ok */ } }
      Motor.tim();
      const lider = geral[0].total;
      const ESP = OFF ? "etapa" : "especial", PROVA = OFF ? "do off-road" : "do rally";
      Motor.falar(`Fim da ${ESP} ${ESPECIAL}! Seu tempo foi ${tempoFalado(meu)}, o ${posEsp}º melhor tempo.` + (OFF && jog[0].wp ? ` Você passou em ${jog[0].wpOk || 0} de ${waypoints.length} waypoints.` : "") + (ultima ? (posGeral === 1 ? ` Você é o campeão ${PROVA}!` : ` Fim ${PROVA}: você terminou em ${posGeral}º lugar no geral!`) : ` Na classificação geral, você está em ${posGeral}º.`) + (novo ? ` É o seu melhor tempo nesta ${ESP}!` : ""));
      const lista = geral.map(c => ({ nome: c.nome, hex: c.hex, tempo: c.total, j: c.j, txt: c.total === lider ? tempoTxt(c.total) : `+${tempoTxt(c.total - lider)}` }));
      const titulo = ultima ? (posGeral === 1 ? (OFF ? "Campeão do off-road!" : "Campeão do rally!") : `${posGeral}º no geral!`) : `${OFF ? "Etapa" : "Especial"} ${ESPECIAL} de ${TOTAL_ESP}`;
      const proxima = ultima ? () => corrida(area, { ...op, especial: 1, acum: null, ral: null }) : () => corrida(area, { ...op, especial: ESPECIAL + 1, acum });
      setTimeout(() => { if (vivo()) T.fim(titulo, ultima ? MEDALHA(posGeral) : "⏱️", `⏱️ ${tempoTxt(meu)} · ${posEsp}º nesta ${OFF ? "etapa" : "especial"}` + (OFF ? ` · 🚩 ${jog[0].wpOk || 0}/${waypoints.length}` : "") + (novo ? " · 🏆 recorde!" : ""), proxima, opcoes, lista, ultima ? (OFF ? "🔁 Correr de novo" : "🔁 Correr o rally de novo") : (OFF ? "▶️ Próxima etapa" : "▶️ Próxima especial")); }, 1200);
    }
    function fimUmJogador() {
      if (RALLY) return fimRally();
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
    // Rally: Finlândia com lagos e pinheirais, Suécia na neve, Sertões com as chapadas de topo reto
    CAMADAS.finlandia = () => [
      [0.25, camada(c => serra(c, ["#9db9d6", "#c3d6ea"], 70, 30, [2, 5, 9]))],
      [0.5, camada(c => { c.fillStyle = "#4f86b8"; c.fillRect(0, TH - PE - 22, TW, 30); c.fillStyle = "rgba(255,255,255,.35)"; for (let k = 0; k < 60; k++) c.fillRect(Math.random() * TW, TH - PE - 20 + Math.random() * 26, 10 + Math.random() * 20, 1.5); const y = serra(c, ["#4f7f3d", "#3f6f33"], 30, 16, [3, 7]); bosque(c, y, "#2f5f2a", true); })],
      [1, camada(c => { const y = serra(c, ["#4f8a3a", "#548a37"], 14, 10, [4, 9]); bosque(c, y, "#2b5a28", true); })],
    ];
    CAMADAS.suecia = CAMADAS.neve;
    CAMADAS.jalapao = () => [
      [0.25, camada(c => { c.fillStyle = "#c98a50"; for (let x = 0; x < TW; x += 300) { c.beginPath(); c.moveTo(x, TH - PE); c.lineTo(x + 50, TH - PE - 95); c.lineTo(x + 230, TH - PE - 100); c.lineTo(x + 280, TH - PE); c.fill(); } c.fillStyle = "rgba(255,255,255,.15)"; for (let x = 0; x < TW; x += 300) c.fillRect(x + 50, TH - PE - 100, 180, 7); })],
      [0.5, camada(c => serra(c, ["#f0b060", "#e09a48"], 34, 26, [2, 5]))],
      [1, camada(c => { const y = serra(c, ["#d9a560", "#d39f5a"], 12, 8, [4, 9]); bosque(c, y, "#6f8a3a"); })],
    ];
    CAMADAS.lencois = () => [
      [0.25, camada(c => serra(c, ["#ece6d6", "#f6f1e6"], 60, 34, [3, 7]))],
      [0.5, camada(c => { const y = serra(c, ["#fbf8f0", "#ece5d4"], 40, 28, [4, 9]); c.fillStyle = "#3fb0d8"; for (let x = 60; x < TW; x += 240) { c.beginPath(); c.ellipse(x, TH - PE - 4, 50, 7, 0, 0, 7); c.fill(); } })],
      [1, camada(c => serra(c, ["#f4efe2", "#efe8d8"], 14, 10, [5, 11]))],
    ];
    CAMADAS.caatinga = () => CAMADAS.sertoes();
    CAMADAS.sertoes = () => [
      [0.25, camada(c => { c.fillStyle = "#c79a74"; for (let x = 0; x < TW; x += 260) { c.beginPath(); c.moveTo(x, TH - PE); c.lineTo(x + 40, TH - PE - 110); c.lineTo(x + 190, TH - PE - 110); c.lineTo(x + 240, TH - PE); c.fill(); } c.fillStyle = "rgba(255,255,255,.18)"; for (let x = 0; x < TW; x += 260) c.fillRect(x + 40, TH - PE - 110, 150, 8); })],
      [0.5, camada(c => { const y = serra(c, ["#b08a5a", "#a07a4c"], 30, 18, [3, 7]); bosque(c, y, "#7d8a4a"); })],
      [1, camada(c => serra(c, ["#c29d63", "#b8935a"], 10, 8, [4, 9]))],
    ];
    const camadas = (CAMADAS[op.pista] || CAMADAS.campo)();
    const corChao = { jalapao: "#d39f5a", lencois: "#efe8d8", caatinga: "#b39466", finlandia: "#548a37", suecia: "#e7eef7", sertoes: "#c29d63", campo: "#55a645", praia: "#ebcd80", noite: "#263426", neve: "#e8f0fa", interlagos: "#47923a", monaco: "#9a9fa6", monza: "#56a843" }[op.pista] || "#55a645";
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
    const POEIRA = { jalapao: ["#e0b070", "#c98f4f", "#b07a40"], lencois: ["#f6f1e4", "#e6dcc8", "#fff"], caatinga: ["#b99a6a", "#8a6a4a", "#a5835a"], finlandia: ["#8a6a3a", "#4f7f3d", "#a08560"], suecia: ["#fff", "#e8f0fa", "#dfe9f5"], sertoes: ["#b5653a", "#c98a55", "#8a4a2a"], campo: ["#6b4a2a", "#4f9a3c", "#8a6a3a"], praia: ["#e8cf8a", "#d9b86a", "#f3e0a8"], noite: ["#3a3a30", "#2b3a2b", "#4a4a44"], neve: ["#fff", "#dfe9f5", "#cfdcea"] }[op.pista] || ["#6b4a2a"];
    function particulas(j, W, H, cx, cyBase, cw, ch) {
      const ps = j.parts, dt = dtQuadro, pv = j.vel / VMAX, e = cw / 260;
      if (dt > 0) {
        const acel = j.ent.acel || (NIVEL.auto && fase === "correndo" && !j.ent.freio);
        if (RALLY && pv > 0.12 && !(j.ar > 0)) {
          const cores = j.molhou > 0 ? ["#e6f2f7", "#b9d3dc"] : j.enlameado > 0 ? ["#6b4a2a", "#8a6236"] : { finlandia: ["#b49a72", "#a0855c"], suecia: ["#ffffff", "#e8f0fa"], sertoes: ["#c98a55", "#b5653a"], jalapao: ["#e0b070", "#c98f4f"], lencois: ["#f6f1e4", "#e6dcc8"], caatinga: ["#b99a6a", "#a5835a"] }[op.pista];
          for (let k = 0; k < (j.molhou > 0 ? 4 : 2); k++) { const l = Math.random() < 0.5 ? -1 : 1; ps.push({ f: 1, cor: Motor.sortear(cores), x: cx + l * cw * (0.3 + Math.random() * 0.15), y: cyBase - ch * 0.08, vx: l * (40 + Math.random() * 90) * e, vy: (j.molhou > 0 ? -(60 + Math.random() * 120) : (10 + Math.random() * 30)) * e, r: (6 + Math.random() * 6) * e, cres: (j.molhou > 0 ? 20 : 70) * e, a: j.molhou > 0 ? 0.8 : 0.32 * Math.min(1, pv * 1.4), vida: 0.7 + Math.random() * 0.5 }); }
        }
        if (acel && pv < 0.85 && !j.chegou && Math.random() < 0.6) ps.push({ f: 1, x: cx - cw * 0.25 + (Math.random() - 0.5) * 4 * e, y: cyBase - ch * 0.15, vx: (Math.random() - 0.5) * 30 * e, vy: (20 + Math.random() * 30) * e, r: 3 * e, cres: 16 * e, a: 0.22, vida: 0.7 + Math.random() * 0.3 });
        if (j.turbo > 0) for (let k = -1; k <= 1; k += 2) ps.push({ f: 2, x: cx + k * cw * 0.2 + (Math.random() - 0.5) * 3 * e, y: cyBase - ch * 0.17, vx: (Math.random() - 0.5) * 24 * e, vy: (60 + Math.random() * 60) * e, r: (5 + Math.random() * 3) * e, cres: -10 * e, a: 1, vida: 0.22 });
        if (Math.abs(j.x) > 1.05 && pv > 0.08) for (let k = 0; k < 3; k++) {
          const l = Math.random() < 0.5 ? -1 : 1;
          ps.push({ f: 0, x: cx + l * cw * 0.38, y: cyBase - 6 * e, vx: l * (30 + Math.random() * 120) * e, vy: -(80 + Math.random() * 160) * e * (0.5 + pv), r: (2 + Math.random() * 4) * e, cor: Motor.sortear(POEIRA), a: 1, vida: 0.5 + Math.random() * 0.3 });
        }
        if (ps.length > (RALLY ? 120 : 70)) ps.splice(0, ps.length - (RALLY ? 120 : 70));
      }
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.vida -= dt; if (p.vida <= 0) { ps.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.f === 2) { p.r = Math.max(0.5, p.r + p.cres * dt); ctx.globalAlpha = Math.min(1, p.vida * 6); ctx.fillStyle = p.vida > 0.12 ? "#ffd60a" : "#ff6a00"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
        else if (p.f) { p.r += p.cres * dt; ctx.globalAlpha = p.a * Math.min(1, p.vida * 1.5); ctx.fillStyle = p.cor || (tema.noite ? "#9a9ab8" : "#e8e8ec"); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
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
      const noTunel = !!segJ.tunel;
      if (noTunel) { ctx.fillStyle = "#121216"; ctx.fillRect(0, 0, W, H); }
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
        ctx.fillStyle = cor(s.tunel ? "#26262c" : tema.grama[s.cor]); ctx.fillRect(0, y2, W, y1 - y2);
        const z1 = w1 / Math.max(6, 2 * FAIXAS), z2 = w2 / Math.max(6, 2 * FAIXAS);
        // acostamento (cascalho/areia) por fora da zebra; no Grande Prêmio: brita larga por fora das
        // curvas, calçada em Mônaco, e grama nas retas
        if (OFF) { /* terreno aberto: sem acostamento */ }
        else if (RALLY) { const a1 = w1 * 0.1, a2 = w2 * 0.1; poligono([x1 - w1 - a1, y1, x1 + w1 + a1, y1, x2 + w2 + a2, y2, x2 - w2 - a2, y2], cor(tonsAcost[s.cor])); }
        else if (!GP) { const a1 = z1 + w1 * 0.16, a2 = z2 + w2 * 0.16; poligono([x1 - w1 - a1, y1, x1 + w1 + a1, y1, x2 + w2 + a2, y2, x2 - w2 - a2, y2], cor(tonsAcost[s.cor])); }
        else if (s.tunel) { const a1 = w1 * 0.12, a2 = w2 * 0.12; poligono([x1 - w1 - a1, y1, x1 + w1 + a1, y1, x2 + w2 + a2, y2, x2 - w2 - a2, y2], cor("#3a3a42")); }
        else if (MURO) { const a1 = w1 * 0.14, a2 = w2 * 0.14; poligono([x1 - w1 - a1, y1, x1 + w1 + a1, y1, x2 + w2 + a2, y2, x2 - w2 - a2, y2], cor(s.cor ? "#c4c8cd" : "#bcc0c5")); }
        else if (s.brita) { const a1 = w1 * 0.7, a2 = w2 * 0.7; poligono([x1 - w1 - a1, y1, x1 + w1 + a1, y1, x2 + w2 + a2, y2, x2 - w2 - a2, y2], cor(s.cor ? "#d9c9a0" : "#d2c196")); }
        if (s.zebra) {
          poligono([x1 - w1 - z1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - z2, y2], cor(tema.zebra[s.cor]));
          poligono([x1 + w1 + z1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + z2, y2], cor(tema.zebra[s.cor]));
        }
        poligono([x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2], cor(s.agua ? (s.cor ? "#6f8f9a" : "#7d9ca6") : s.lama ? (op.pista === "lencois" ? "#e9e2d0" : s.cor ? "#8a6236" : "#825c32") : tonsPista[s.tom][s.cor]));
        // linhas brancas contínuas da beira (só perto, onde aparecem)
        // rally: os sulcos das rodas na terra/neve
        if (RALLY && n < 130 && !s.agua) [-0.42, 0.42].forEach(k => { const c1 = x1 + k * w1, c2 = x2 + k * w2, m1 = w1 * 0.07, m2 = w2 * 0.07; poligono([c1 - m1, y1, c1 + m1, y1, c2 + m2, y2, c2 - m2, y2], cor(op.pista === "suecia" ? "#b9c4d0" : "rgba(60,35,15,.25)")); });
        if (n < 110 && !RALLY) {
          const b1 = w1 * 0.93, b2 = w2 * 0.93, e1 = w1 / 70, e2 = w2 / 70, cb = cor(tema.noite ? "#d8d8e0" : "#f4f4f4");
          poligono([x1 - b1 - e1, y1, x1 - b1 + e1, y1, x2 - b2 + e2, y2, x2 - b2 - e2, y2], cb);
          poligono([x1 + b1 - e1, y1, x1 + b1 + e1, y1, x2 + b2 + e2, y2, x2 + b2 - e2, y2], cb);
        }
        if (s.drsIni) poligono([x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2], cor("#e9ecef")); // linha onde começa o DRS
        if (s.largada) {
          const q = 8;
          for (let k = 0; k < q; k++) poligono([x1 - w1 + 2 * w1 * k / q, y1, x1 - w1 + 2 * w1 * (k + 1) / q, y1, x2 - w2 + 2 * w2 * (k + 1) / q, y2, x2 - w2 + 2 * w2 * k / q, y2], (k + s.i) % 2 ? "#111" : "#fff");
        } else if (s.cor && !RALLY) {
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
        s.enfeites.forEach(e => coisa(img(e.tipo), tamDe(e.tipo), s.p1.escala, s.p1.sx + s.p1.escala * e.x * LARGURA * W / 2, s.p1.sy, s.clip));
        rivais.forEach(r => {
          if (r.oculto || segDe(r.z) !== s) return;
          if (r.fantasma) ctx.globalAlpha = 0.55;
          carroNaPista(spriteCarro(r.cor, s.curva > 1 ? "dir" : s.curva < -1 ? "esq" : "reto", r.freando, Math.floor(r.z / 400) % 2), s, r.z, r.x);
          ctx.globalAlpha = 1;
          if (r.fantasma) {
            // o nome do piloto em cima do fantasma (quando está perto)
            const pr = (r.z % SEG) / SEG, e2 = s.p1.escala + (s.p2.escala - s.p1.escala) * pr, larg = e2 * 560 * W / 2;
            if (larg > 26) {
              const sx = s.p1.sx + (s.p2.sx - s.p1.sx) * pr + e2 * r.x * LARGURA * W / 2, sy = s.p1.sy + (s.p2.sy - s.p1.sy) * pr - larg * 0.68 - 8;
              if (sy < s.clip) {
                const tam = Math.max(11, Math.min(18, larg * 0.09));
                ctx.font = `bold ${tam}px Fredoka, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
                const tw = ctx.measureText(r.nome).width + 14;
                ctx.fillStyle = "rgba(15,20,35,.75)"; ctx.beginPath(); ctx.roundRect(sx - tw / 2, sy - tam * 0.75, tw, tam * 1.5, tam * 0.6); ctx.fill();
                ctx.fillStyle = r.cor; ctx.fillRect(sx - tw / 2 + 4, sy - tam * 0.45, 3, tam * 0.9);
                ctx.fillStyle = "#fff"; ctx.fillText(r.nome, sx + 2, sy); ctx.textBaseline = "alphabetic";
              }
            }
          }
        });
        outros.forEach(c => { if (c.s === s) carroNaPista(c.img, s, c.z, c.o.x); });
      }
      // O seu carro
      // (rodas girando conforme a velocidade, lanternas fortes ao frear, inclina um pouco nas curvas)
      const vira = virandoDe(j.ent), pvJ = j.vel / VMAX;
      if (j.vel > 1) j.giro += dtQuadro * (3 + 12 * pvJ);
      j.inclina += (((vira === "dir") - (vira === "esq")) * pvJ - j.inclina) * Math.min(1, dtQuadro * 6);
      const im = spriteCarro(j.hex, vira, (j.ent.freio || j.freioAuto) && j.vel > 1, Math.floor(j.giro) % 2);
      const cw = Math.min(W * 0.36, 260), ch = cw * im.height / im.width;
      const quica = OFF && j.vel > 1 ? Math.sin(tempo * 17) * 2.5 * pvJ + (Math.random() - 0.5) * 3 * pvJ : 0; // suspensão do jipe trabalhando
      const balanca = quica + (j.tremor > 0 ? (Math.random() - 0.5) * 14 * j.tremor : 0) + (j.sacode ? (Math.random() - 0.5) * 6 : 0) + Math.sin(tempo * 30) * pvJ * 1.2;
      const voo = j.ar > 0 ? Math.sin(Math.PI * (1 - j.ar / j.arTotal)) * ch * 0.45 : 0; // salto: o carro sobe
      const fundoCarro = H - 8 + balanca - voo;
      if (voo > 1) { ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(W / 2, H - 10, cw * 0.42, cw * 0.06, 0, 0, 7); ctx.fill(); }
      if (fundo.farol) {
        ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.5;
        ctx.drawImage(fundo.farol, W / 2 - cw * 1.3 + j.inclina * cw * 0.3, horiz + (fundoCarro - ch * 0.5 - horiz) * 0.15, cw * 2.6, (fundoCarro - ch * 0.5 - horiz) * 0.85);
        ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
      }
      ctx.save(); ctx.translate(W / 2, fundoCarro); ctx.rotate(-j.inclina * 0.035 + (j.drift || 0));
      ctx.drawImage(im, -cw / 2, -ch, cw, ch);
      ctx.restore();
      particulas(j, W, H, W / 2, fundoCarro, cw, ch);
      if (noTunel) { ctx.fillStyle = "rgba(10,10,20,.28)"; ctx.fillRect(0, 0, W, H); } // dentro do túnel fica tudo mais escuro
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
      if (p < j.ultPos && j.ultPos < 99 && fase === "correndo" && !j.chegou) {
        Motor.nota(990, { dur: 0.12, tipo: "triangle", vol: 0.08 });
        if (!j.ultAviso || tempo - j.ultAviso > 1.6) { avisar(j, `ULTRAPASSOU! ${p}º`, "#8cff9e", 1.2); j.ultAviso = tempo; }
      }
      // Grande Prêmio: o narrador conta quem passou quem (sem falar toda hora)
      const notaPerto = RALLY && notas.some(n => !n.chamada && !n.junta && n.ini * SEG - (j.pos + CAM) < Math.max(SEG * 30, j.vel * 3.5));
      if ((GP || RALLY) && !DOIS && !notaPerto && fase === "correndo" && !j.chegou && j.ultPos < 99 && p !== j.ultPos && (!j.ultNarra || tempo - j.ultNarra > 5)) {
        const meu = progresso(j.voltas, j.pos + CAM), outros = rivais.map(r => ({ n: r.nome, d: progresso(r.voltas, r.z) - meu }));
        if (p < j.ultPos) { const q = outros.filter(o => o.d < 0).sort((a, b) => b.d - a.d)[0]; if (q) { j.ultNarra = tempo; Motor.falar(`Você passou ${q.n}! Agora está em ${p}º lugar!`); } }
        else { const q = outros.filter(o => o.d > 0).sort((a, b) => a.d - b.d)[0]; if (q) { j.ultNarra = tempo; Motor.falar(`${q.n} passou você! Vamos buscar!`); } }
      }
      j.ultPos = p;
      const s = Math.max(0.75, Math.min(2.2, Math.min(W, H * 1.7) / 680)); // tudo cresce em tela grande
      if (GP && fase === "correndo" && contagem <= -1.2 && !j.chegou) nomeDaCurva(j, W, s);
      if (RALLY && fase === "largada" && esperaIntro) cartaoRally(W, H, s);
      else if (GP && fase === "largada" && esperaIntro) cartaoCircuito(W, H, s);
      else if (RALLY && fase === "largada") relogioLargada(W, H, s);
      else if (fase === "largada") semaforo(W, H, s, luzesAcesas(), false);
      else if (fase === "correndo" && contagem > -1.2) { if (RALLY) { relogioLargada(W, H, s); texto("VAI!", 120 * s, "#2a9d55", W, H); } else { semaforo(W, H, s, 5, true); texto("JÁ!", 120 * s, "#2a9d55", W, H); } }
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
    // Grande Prêmio: a curva que vem (ou em que você está), com a seta do lado; na 1ª volta a voz fala o nome
    function nomeDaCurva(j, W, s) {
      const i = segDe(j.pos + CAM).i, cu = curvas.find(c => i >= c.ini - 28 && i <= c.fim);
      if (!cu) return;
      if (j.voltas === 0 && !DOIS && cu !== j.curvaFalada) { j.curvaFalada = cu; Motor.falar(cu.nome); }
      const t = `${cu.curva < 0 ? "↰" : "↱"} ${cu.nome.toUpperCase()}`;
      ctx.font = `bold ${17 * s}px Fredoka, sans-serif`;
      const w = ctx.measureText(t).width + 30 * s, x = W / 2 - w / 2, y = 10 * s;
      ctx.fillStyle = "rgba(20,33,61,.86)"; ctx.beginPath(); ctx.roundRect(x, y, w, 32 * s, 16 * s); ctx.fill();
      ctx.fillStyle = "#ffd60a"; ctx.fillRect(x + 14 * s, y + 28 * s, w - 28 * s, 3 * s);
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(t, W / 2, y + 16 * s);
      ctx.textBaseline = "alphabetic";
    }
    // Antes da largada: o cartão do autódromo, como na transmissão, enquanto o narrador apresenta
    function cartaoCircuito(W, H, s) {
      const inf = INFO_GP[op.pista], w = Math.min(W - 40, 460 * s), h = 178 * s, x = W / 2 - w / 2, y = H * 0.14;
      ctx.fillStyle = "rgba(15,20,35,.88)"; ctx.beginPath(); ctx.roundRect(x, y, w, h, 18 * s); ctx.fill();
      ctx.fillStyle = "#e10600"; ctx.fillRect(x, y + 18 * s, 7 * s, h - 36 * s);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#ffd60a"; ctx.font = `bold ${15 * s}px Fredoka, sans-serif`; ctx.fillText("GRANDE PRÊMIO", x + 22 * s, y + 30 * s);
      ctx.fillStyle = "#fff"; ctx.font = `bold ${30 * s}px Fredoka, sans-serif`; ctx.fillText(inf.nome, x + 22 * s, y + 64 * s, w * 0.55);
      ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.font = `bold ${15 * s}px Fredoka, sans-serif`;
      [inf.local, `📏 ${inf.km} · ${inf.curvas} curvas`, `🔄 sentido ${inf.sentido}`, `🏁 ${TOTAL_VOLTAS} voltas · você larga em ${SLOT + 1}º`].forEach((l, k) => ctx.fillText(l, x + 22 * s, y + (90 + k * 22) * s, w * 0.6));
      const m = Math.min(h - 30 * s, w * 0.36);
      mapaPista(x + w - m - 16 * s, y + (h - m) / 2, m, null);
    }
    // Mapa da pista: o desenho do traçado (feito somando as curvas) e um pontinho para cada carro
    const MAPA = (() => {
      if (!GP && !RALLY) return null;
      let a = 0, px = 0, py = 0;
      const tot = segs.reduce((t, sg) => t + sg.curva, 0), k = GP ? (Math.PI * 2) / Math.abs(tot || 1) : 0.007;
      const pts = segs.map(sg => { a += sg.curva * k; px += Math.sin(a); py -= Math.cos(a); return [px, py]; });
      // corrige o pedacinho que sobra para o desenho fechar certinho
      const [ex, ey] = pts[pts.length - 1];
      if (GP) pts.forEach((q, i) => { q[0] -= ex * (i + 1) / pts.length; q[1] -= ey * (i + 1) / pts.length; });
      const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]);
      const x0 = Math.min(...xs), y0 = Math.min(...ys), tam = Math.max(Math.max(...xs) - x0, Math.max(...ys) - y0) || 1;
      return pts.map(([qx, qy]) => [(qx - x0) / tam, (qy - y0) / tam, (Math.max(...xs) - x0) / tam, (Math.max(...ys) - y0) / tam]);
    })();
    function mapaPista(x, y, m, j) {
      if (!MAPA) return;
      const [, , lw, lh] = MAPA[0], ox = x + (m - lw * m) / 2, oy = y + (m - lh * m) / 2;
      const ponto = z => { const q = MAPA[Math.floor(((z % VOLTA) + VOLTA) % VOLTA / SEG) % N]; return [ox + q[0] * m, oy + q[1] * m]; };
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      [["rgba(0,0,0,.55)", 7], ["#e9ecef", 3]].forEach(([c, lwd]) => {
        ctx.strokeStyle = c; ctx.lineWidth = lwd; ctx.beginPath();
        for (let i = 0; i <= (GP ? N : N - 1); i += 3) { const q = MAPA[i % N]; i ? ctx.lineTo(ox + q[0] * m, oy + q[1] * m) : ctx.moveTo(ox + q[0] * m, oy + q[1] * m); }
        if (GP) ctx.closePath();
        ctx.stroke();
      });
      const [lx, ly] = ponto(3 * SEG); ctx.fillStyle = "#e10600"; ctx.fillRect(lx - 4, ly - 4, 8, 8);
      if (RALLY) { const [fx, fy] = ponto((N - 8) * SEG); ctx.fillStyle = "#fff"; ctx.fillRect(fx - 4, fy - 4, 8, 8); ctx.fillStyle = "#111"; ctx.fillRect(fx - 4, fy - 4, 4, 4); ctx.fillRect(fx, fy, 4, 4); }
      if (!j) return;
      rivais.forEach(r => { const [qx, qy] = ponto(r.z); ctx.fillStyle = r.cor; ctx.beginPath(); ctx.arc(qx, qy, 3.5, 0, 7); ctx.fill(); });
      jog.forEach(o => { const [qx, qy] = ponto(o.pos + CAM); ctx.fillStyle = o.hex; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(qx, qy, o === j ? 6 : 4.5, 0, 7); ctx.fill(); ctx.stroke(); });
      ctx.lineCap = "butt";
    }
    // Rally: o relógio da largada (5, 4, 3, 2, 1 e a luz verde)
    function relogioLargada(W, H, s) {
      const w = 150 * s, h = 120 * s, x = W / 2 - w / 2, y = H * 0.1, n = Math.max(0, Math.ceil(contagem));
      ctx.fillStyle = "rgba(15,18,28,.9)"; ctx.beginPath(); ctx.roundRect(x, y, w, h, 16 * s); ctx.fill();
      ctx.strokeStyle = "#555"; ctx.lineWidth = 3 * s; ctx.stroke();
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = n ? "#ff4d4d" : "#3cff78"; ctx.font = `bold ${80 * s}px Fredoka, sans-serif`;
      ctx.fillText(n ? String(n) : "●", W / 2, y + h * 0.55);
      ctx.textBaseline = "alphabetic";
    }
    function cartaoRally(W, H, s) {
      const inf = INFO_RALLY[op.pista], w = Math.min(W - 40, 460 * s), h = 170 * s, x = W / 2 - w / 2, y = H * 0.14;
      ctx.fillStyle = "rgba(15,20,35,.9)"; ctx.beginPath(); ctx.roundRect(x, y, w, h, 18 * s); ctx.fill();
      ctx.fillStyle = "#f77f00"; ctx.fillRect(x, y + 18 * s, 7 * s, h - 36 * s);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#ffd60a"; ctx.font = `bold ${15 * s}px Fredoka, sans-serif`; ctx.fillText(`${OFF ? "ETAPA" : "ESPECIAL"} ${ESPECIAL} DE ${TOTAL_ESP}`, x + 22 * s, y + 30 * s);
      ctx.fillStyle = "#fff"; ctx.font = `bold ${28 * s}px Fredoka, sans-serif`; ctx.fillText(inf.nome, x + 22 * s, y + 62 * s, w * 0.6);
      ctx.fillStyle = "rgba(255,255,255,.82)"; ctx.font = `bold ${15 * s}px Fredoka, sans-serif`;
      const lider = rallyRivais.slice().sort((a, b) => a.tempo - b.tempo)[0];
      [`🛣️ ${inf.piso}`, `👻 ${rallyRivais.length} pilotos correndo junto`, `⏱️ tempo para bater: ${tempoTxt(lider.tempo)}`].forEach((l, k) => ctx.fillText(l, x + 22 * s, y + (92 + k * 24) * s, w * 0.6));
      const m = Math.min(h - 30 * s, w * 0.34);
      mapaPista(x + w - m - 16 * s, y + (h - m) / 2, m, null);
    }
    // Rally: o cartão da nota do navegador (seta da curva e o número, como no painel de verdade)
    function cartaoNota(j, W, H, s) {
      const nt = j.nota;
      if (!nt) return;
      const w = 210 * s, h = 70 * s, x = W / 2 - w / 2, y = W < 600 ? H * 0.34 : 10 * s; // celular em pé: no céu, abaixo do placar
      ctx.fillStyle = "rgba(15,20,35,.88)"; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14 * s); ctx.fill();
      ctx.save(); ctx.translate(x + 38 * s, y + h / 2);
      ctx.strokeStyle = nt.tipo === "curva" && nt.grau <= 2 ? "#ff4d4d" : "#ffd60a"; ctx.lineWidth = 6 * s; ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (nt.tipo === "curva") {
        const l = nt.lado, k = (7 - nt.grau) / 6; // quanto mais fechada, mais a seta dobra
        ctx.beginPath(); ctx.moveTo(0, 20 * s); ctx.quadraticCurveTo(0, -14 * s, l * 22 * k * s, -14 * s - (1 - k) * 8 * s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(l * 22 * k * s - l * 8 * s, -22 * s - (1 - k) * 8 * s); ctx.lineTo(l * 22 * k * s, -14 * s - (1 - k) * 8 * s); ctx.lineTo(l * 22 * k * s - l * 8 * s, -6 * s - (1 - k) * 8 * s); ctx.stroke();
      } else { ctx.font = `${34 * s}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText({ salto: OFF ? "🕳️" : "⛰️", agua: "💦", duna: "🏜️", lama: "🟫", pedra: "🪨" }[nt.tipo] || "⚠️", 0, 0); }
      ctx.restore();
      ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff";
      ctx.font = `bold ${nt.tipo === "curva" ? 40 * s : 22 * s}px Fredoka, sans-serif`;
      ctx.fillText(nt.tipo === "curva" ? (nt.grau === 1 ? "G" : String(nt.grau)) : ({ salto: OFF ? "BURACO" : "SALTO", agua: OFF ? (op.pista === "lencois" ? "LAGOA" : "RIO") : "ÁGUA", duna: "DUNA", lama: "AREIA FOFA", pedra: "PEDRA" }[nt.tipo] || ""), x + 74 * s, y + h * 0.42, w - 84 * s);
      if (nt.tipo === "curva") { ctx.font = `bold ${12 * s}px Fredoka, sans-serif`; ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillText((nt.grau === 1 ? "GRAMPO" : nt.lado < 0 ? "ESQUERDA" : "DIREITA") + (nt.longa ? " · LONGA" : ""), x + 74 * s, y + h * 0.78, w - 84 * s); }
      ctx.textBaseline = "alphabetic";
    }
    function painelRally(j, W, H, s) {
      const x0 = 70, y0 = 8, pw = 176 * s, ph = 82 * s;
      ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
      ctx.fillStyle = "rgba(15,20,35,.8)"; ctx.beginPath(); ctx.roundRect(x0, y0, pw, ph, 14 * s); ctx.fill();
      ctx.fillStyle = "#f77f00"; ctx.fillRect(x0, y0 + 10 * s, 5 * s, ph - 20 * s);
      ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = `bold ${13 * s}px Fredoka, sans-serif`; ctx.fillText(`${OFF ? "ETAPA" : "ESPECIAL"} ${ESPECIAL}/${TOTAL_ESP}`, x0 + 16 * s, y0 + 22 * s);
      ctx.fillStyle = "#fff"; ctx.font = `bold ${34 * s}px Fredoka, sans-serif`; ctx.fillText(tempoTxt(tempo), x0 + 14 * s, y0 + 58 * s, pw - 24 * s);
      const fr = Math.min(1, (segDe(j.pos + CAM).i) / N);
      ctx.fillStyle = "rgba(255,255,255,.2)"; ctx.fillRect(x0 + 16 * s, y0 + 68 * s, pw - 32 * s, 5 * s);
      ctx.fillStyle = "#f77f00"; ctx.fillRect(x0 + 16 * s, y0 + 68 * s, (pw - 32 * s) * fr, 5 * s);
      SPLITS.forEach((sp, k) => { ctx.fillStyle = "#fff"; ctx.fillRect(x0 + 16 * s + (pw - 32 * s) * sp / N - 1, y0 + 66 * s, 2, 9 * s); });
      // parciais e o tempo do líder
      const by = y0 + ph + 6 * s, bh = 46 * s, lider = Math.min(...rallyRivais.map(r => r.tempo));
      ctx.fillStyle = "rgba(15,20,35,.72)"; ctx.beginPath(); ctx.roundRect(x0, by, pw, bh, 10 * s); ctx.fill();
      ctx.font = `bold ${13 * s}px Fredoka, sans-serif`;
      SPLITS.forEach((sp, k) => { const d = j[`p${k}`]; ctx.fillStyle = d === undefined ? "rgba(255,255,255,.45)" : d <= 0 ? "#3cff78" : "#ff6b6b"; ctx.fillText(`P${k + 1} ${d === undefined ? "--" : (d <= 0 ? "−" : "+") + Math.abs(d).toFixed(1).replace(".", ",")}`, x0 + 10 * s + k * (pw / 2), by + 19 * s); });
      ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillText(`🏆 LÍDER ${tempoTxt(lider)}`, x0 + 10 * s, by + 38 * s, pw - 20 * s);
      // posição agora, contando os fantasmas que já passaram e os que ficaram para trás
      if (fase === "correndo") {
        const py = by + bh + 6 * s, lugar = lugarDe(j);
        ctx.fillStyle = "rgba(15,20,35,.72)"; ctx.beginPath(); ctx.roundRect(x0, py, pw, 30 * s, 10 * s); ctx.fill();
        ctx.fillStyle = lugar === 1 ? "#ffd60a" : "#fff"; ctx.font = `bold ${15 * s}px Fredoka, sans-serif`;
        ctx.fillText(`📍 AGORA: ${lugar}º de ${TOTAL_CARROS}`, x0 + 10 * s, py + 20 * s, pw - 20 * s);
      }
      // Off-road: os waypoints e a seta do GPS apontando para a próxima bandeira
      if (OFF && fase === "correndo") {
        const gy = by + bh + 42 * s, wp = waypoints[j.wp || 0];
        ctx.fillStyle = "rgba(15,20,35,.72)"; ctx.beginPath(); ctx.roundRect(x0, gy, pw, 44 * s, 10 * s); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = `bold ${14 * s}px Fredoka, sans-serif`; ctx.textAlign = "left";
        ctx.fillText(`🚩 ${j.wpOk || 0}/${waypoints.length} waypoints`, x0 + 48 * s, gy + 18 * s, pw - 56 * s);
        if (wp) {
          const dz = (wp.n * SEG - (j.pos + CAM)), dist = Math.max(0, Math.round(dz / 20));
          ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = `bold ${12 * s}px Fredoka, sans-serif`; ctx.fillText(`próximo: ${dist} m`, x0 + 48 * s, gy + 36 * s, pw - 56 * s);
          const ang = Math.atan2(-j.x * LARGURA, Math.max(400, dz) * 0.35);
          ctx.save(); ctx.translate(x0 + 24 * s, gy + 22 * s); ctx.rotate(ang);
          ctx.fillStyle = "#f77f00"; ctx.beginPath(); ctx.moveTo(0, -15 * s); ctx.lineTo(10 * s, 10 * s); ctx.lineTo(0, 5 * s); ctx.lineTo(-10 * s, 10 * s); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }
      // velocímetro com a marcha, e o mapa da especial
      const R = 46 * s, cx = W - R - 14, cy = 66 + R, pv = j.vel / VMAX, frac = Math.min(1, pv);
      ctx.fillStyle = "rgba(15,20,35,.78)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.lineCap = "round"; ctx.lineWidth = 7 * s;
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc(cx, cy, R - 9 * s, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
      ctx.strokeStyle = frac > 0.8 ? "#ffd60a" : "#3cff78"; ctx.beginPath(); ctx.arc(cx, cy, R - 9 * s, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * Math.max(0.01, frac))); ctx.stroke();
      ctx.lineCap = "butt"; ctx.textAlign = "center";
      ctx.fillStyle = "#fff"; ctx.font = `bold ${28 * s}px Fredoka, sans-serif`; ctx.fillText(String(Math.round(pv * KMH * NIVEL.max)), cx, cy + 8 * s);
      ctx.fillStyle = "rgba(255,255,255,.65)"; ctx.font = `bold ${12 * s}px Fredoka, sans-serif`; ctx.fillText(`km/h · ${1 + Math.min(5, Math.floor(pv * 6))}ª`, cx, cy + 26 * s);
      const m = Math.min(130 * s, W * 0.22), my = cy + R + 10 * s;
      if (my + m < H - 150) { ctx.fillStyle = "rgba(15,20,35,.6)"; ctx.beginPath(); ctx.roundRect(W - m - 18, my - 4, m + 8, m + 8, 12 * s); ctx.fill(); mapaPista(W - m - 14, my, m, j); }
      if (fase === "correndo" && contagem <= -1.2) cartaoNota(j, W, H, s);
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
      if (RALLY) return painelRally(j, W, H, s);
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
      ctx.fillText(`⏱ ${GP ? tempoTxt(Math.max(0, tempo - j.tVolta)) : relogio()}`, xd, y0 + 68 * s);
      // Grande Prêmio: a melhor volta e quanto falta para alcançar o carro da frente
      let extra = 0;
      if (GP) {
        const zj = progresso(j.voltas, j.pos + CAM);
        let alvo = null, dmin = Infinity;
        rivais.forEach(r => { const d = progresso(r.voltas, r.z) - zj; if (d > 0 && d < dmin) { dmin = d; alvo = r.nome; } });
        jog.forEach(o => { if (o === j) return; const d = progresso(o.voltas, o.pos + CAM) - zj; if (d > 0 && d < dmin) { dmin = d; alvo = o.nome; } });
        const bh = 44 * s, by = y0 + ph + 6 * s;
        ctx.fillStyle = "rgba(15,20,35,.72)"; ctx.beginPath(); ctx.roundRect(x0, by, pw, bh, 10 * s); ctx.fill();
        ctx.textAlign = "left"; ctx.font = `bold ${13 * s}px Fredoka, sans-serif`;
        ctx.fillStyle = j.melhor ? "#c77dff" : "rgba(255,255,255,.55)"; ctx.fillText(`🟣 MELHOR ${j.melhor ? tempoTxt(j.melhor) : "--:--"}`, x0 + 10 * s, by + 18 * s);
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.fillText(alvo && !j.chegou ? `▲ ${alvo.toUpperCase()} +${(dmin / Math.max(j.vel, VMAX * 0.3)).toFixed(1).replace(".", ",")}s` : "🏁 NA FRENTE!", x0 + 10 * s, by + 36 * s, pw - 20 * s);
        extra = bh + 6 * s;
      }
      // classificação (só se couber)
      const lh = 24 * s, lista = classificacao();
      if (H > ph + extra + lista.length * lh + 120 && W > 300) {
        let y = y0 + ph + 8 * s + extra;
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
      const kmh = Math.round(j.vel / VMAX * KMH * NIVEL.max), frac = Math.min(1, j.vel / (VMAX * 1.3));
      ctx.fillStyle = "rgba(15,20,35,.78)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
      ctx.lineCap = "round"; ctx.lineWidth = 7 * s;
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc(cx, cy, R - 9 * s, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
      ctx.strokeStyle = j.turbo > 0 ? "#ff8a00" : frac > 0.72 ? "#ffd60a" : "#3cff78";
      ctx.beginPath(); ctx.arc(cx, cy, R - 9 * s, Math.PI * 0.75, Math.PI * (0.75 + 1.5 * Math.max(0.01, frac))); ctx.stroke();
      ctx.lineCap = "butt";
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.font = `bold ${28 * s}px Fredoka, sans-serif`;
      ctx.fillText(String(kmh), cx, cy + 8 * s);
      const zonaDrs = GP && segDe(j.pos + CAM).drs;
      ctx.fillStyle = j.turbo > 0 ? "#ffd60a" : j.drs ? "#3cff78" : zonaDrs ? "rgba(255,255,255,.45)" : "rgba(255,255,255,.65)"; ctx.font = `bold ${12 * s}px Fredoka, sans-serif`;
      ctx.fillText(j.turbo > 0 ? "⚡ TURBO" : j.drs ? "🟢 DRS" : j.drsPode ? "DRS: APERTE!" : zonaDrs ? "DRS ⚪" : GP ? `km/h · ${1 + Math.min(7, Math.floor(j.vel / VMAX * 8))}ª` : "km/h", cx, cy + 26 * s);
      // mapa da pista embaixo do velocímetro (se couber)
      const m = Math.min(130 * s, W * 0.22), my = cy + R + 10 * s;
      if (GP && my + m < H - 150 && !DOIS) { ctx.fillStyle = "rgba(15,20,35,.6)"; ctx.beginPath(); ctx.roundRect(W - m - 18, my - 4, m + 8, m + 8, 12 * s); ctx.fill(); mapaPista(W - m - 14, my, m, j); }
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
        if (RALLY && !quieto && !j.ent.acel && j.vel > VMAX * 0.45 && Math.random() < 0.05) Motor.ruido({ dur: 0.05, vol: 0.12, filtro: "highpass", freq: 2500 }); // estalo do escapamento ao tirar o pé
        roncos[i].tocar(quieto ? null : j.vel / VMAX, !!(j.ent.acel || (NIVEL.auto && fase === "correndo" && !j.ent.freio)));
      });
      desenhar(); // o placar é desenhado na própria tela (posição, volta, classificação e velocímetro)
      requestAnimationFrame(laco);
    }
    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.CARROS_TESTE) {
      window.CARROS_TESTE = {
        estado: () => ({ fase, VOLTA, tunel: segs.findIndex(sg => sg.tunel), jog: jog.map(j => ({ n: j.n, pos: j.pos, x: j.x, vel: j.vel, voltas: j.voltas, chegou: j.chegou, lugar: lugarDe(j) })) }),
        levar: (k, voltas, pos) => { jog[k].voltas = voltas; jog[k].pos = pos; },
      };
    }
    requestAnimationFrame(laco);
    if (RALLY) {
      const fim = () => { esperaIntro = false; };
      Motor.falar(INFO_RALLY[op.pista].fala + ` ${OFF ? "Etapa" : "Especial"} ${ESPECIAL} de ${TOTAL_ESP}.` + (ESPECIAL === 1 ? " Eu sou o seu navegador e vou falando as curvas antes de elas chegarem: o número é o tamanho da curva. Um é bem fechada, seis é quase reta. Quando eu disser salto, segure o carro reto! Os carros transparentes são os outros pilotos, cada um no ritmo do seu tempo: passe na frente deles!" + (OFF ? " A seta laranja do GPS mostra onde fica a próxima bandeira. Se passar fora delas, são dez segundos de castigo!" : "") : " Vamos lá!") + " A largada é no relógio!").then(fim);
      setTimeout(fim, 26000);
    } else if (GP && !DOIS) {
      const fim = () => { esperaIntro = false; };
      Motor.falar(INFO_GP[op.pista].fala + ` São ${TOTAL_VOLTAS} voltas e você larga em sexto. Freie quando aparecerem as placas cento e cinquenta, cem e cinquenta. Atenção às luzes!`).then(fim);
      setTimeout(fim, 22000);
    } else if (DOIS) Motor.falar(`Corrida a dois! ${jog[0].nome} usa o primeiro controle ou as setas. ${jog[1].nome} usa o segundo controle ou as letras W A S D.` + (GP ? " Freie antes das curvas fechadas!" : " Passe nas setas amarelas para ganhar turbo!"));
    else {
      Motor.falar((tema.gp ? `Grande Prêmio de ${NOMES_PISTA[op.pista].split(" (")[0]}! ${TOTAL_VOLTAS} voltas. ` : `Corrida de ${TOTAL_VOLTAS} ${TOTAL_VOLTAS === 1 ? "volta" : "voltas"}! `) +
      (NIVEL.auto ? "O carro acelera sozinho: use as setas para virar." : "Acelere, faça as curvas e passe os outros carros!") + " Passe nas setas amarelas para ganhar turbo!");
    }
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
