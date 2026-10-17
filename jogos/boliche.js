// Boliche 🎳 — pista de verdade em perspectiva (18 m até o pino da frente, tábuas, setas de mira,
// canaletas, pistas vizinhas e o fundo com o "masking"), os 10 pinos no triângulo oficial e física
// vista de cima: a bola empurra os pinos, os pinos derrubam outros pinos, caem na canaleta ou no fosso.
// Cada jogada: 1) onde ficar, 2) mirar (e o efeito, para os maiores), 3) força (barra que sobe e
// desce). A câmera acompanha a bola até os pinos. Placar oficial: 10 frames, strike (X) soma as duas
// bolas seguintes, spare (/) soma a seguinte, e o 10º frame dá bola extra. Proteção nas canaletas
// para os pequenos (como nos boliches de verdade). 1 jogador, contra o computador ou 2 jogadores.
(() => {
  const LANE = 0.53, CANAL = 0.25, R_BOLA = 0.109, R_PINO = 0.06;
  const Z_PINO1 = 18.29, Z_FOSSO = 19.35, ALT_PINO = 0.38;
  const M_BOLA = 7, M_PINO = 1.5;
  const CORES_BOLA = { azul: ["#4dabf7", "#1864ab"], vermelho: ["#ff6b6b", "#a61e1e"], roxo: ["#b197fc", "#5f3dc4"], verde: ["#69db7c", "#2b8a3e"], laranja: ["#ffa94d", "#d9480f"], rosa: ["#f783ac", "#a61e4d"] };
  const NOMES_BOLA = { azul: "Azul", vermelho: "Vermelha", roxo: "Roxa", verde: "Verde", laranja: "Laranja", rosa: "Rosa" };
  // Pinos: 1 na frente, depois 2-3, 4-5-6, 7-8-9-10 (30,48 cm entre os centros)
  const D = 0.3048, DZ = D * Math.sqrt(3) / 2;
  const POS_PINOS = [[0, 0], [-D / 2, DZ], [D / 2, DZ], [-D, 2 * DZ], [0, 2 * DZ], [D, 2 * DZ], [-1.5 * D, 3 * DZ], [-D / 2, 3 * DZ], [D / 2, 3 * DZ], [1.5 * D, 3 * DZ]];
  const NIVEIS = { facil: 0.17, medio: 0.09, dificil: 0.045 };

  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#3b2a6b"/><path d="M8 62 L24 20 H40 L56 62Z" fill="#d9a066"/><path d="M24 20 H40 L56 62 H8Z" fill="none" stroke="#b07a40" stroke-width="1"/><g fill="#fff" stroke="#999" stroke-width=".6"><path d="M26 30c-2-4-1-7 0-9 0-2-1-3 0-5 1-2 3-2 4 0 1 2 0 3 0 5 1 2 2 5 0 9z"/><path d="M36 30c-2-4-1-7 0-9 0-2-1-3 0-5 1-2 3-2 4 0 1 2 0 3 0 5 1 2 2 5 0 9z"/><path d="M31 33c-2-4-1-7 0-9 0-2-1-3 0-5 1-2 3-2 4 0 1 2 0 3 0 5 1 2 2 5 0 9z"/></g><path d="M27.5 18.5h3M37.5 18.5h3M32.5 21.5h3" stroke="#e03131" stroke-width="1.6"/><circle cx="32" cy="50" r="9" fill="#4dabf7" stroke="#1864ab" stroke-width="1.5"/><circle cx="29" cy="47" r="1.3" fill="#1d3557"/><circle cx="33" cy="46" r="1.3" fill="#1d3557"/><circle cx="31" cy="50" r="1.3" fill="#1d3557"/></svg>';

  JOGOS.push({
    id: "boliche", nome: "Boliche", icone: ICONE, teclas: true,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: "🎳", texto: "Derrube os 10 pinos! Cada vez são até 2 bolas. Derrubou todos na primeira é STRIKE; na segunda, é SPARE." },
      { figura: "⬅️➡️", texto: "Primeiro escolha onde ficar, com as setas. Depois mire: a linha mostra para onde a bola vai." },
      { figura: "💪", texto: "Por último, a força: a barra sobe e desce. Aperte quando estiver alta para a bola ir rápida e forte!" },
      { figura: "↩️", texto: "Com efeito, a bola faz uma curva perto dos pinos, como a dos jogadores de verdade. Mire entre o pino da frente e o do lado: é o melhor lugar para um strike!" },
      { figura: "🛡️", texto: "Com a proteção ligada, a bola não cai na canaleta: ela bate na barreira e volta para a pista." },
      { figura: "🏆", texto: "São 10 rodadas (frames). O strike vale 10 mais as duas próximas bolas; o spare vale 10 mais a próxima. Quem fizer mais pontos ganha!" },
      { figura: "🎮", texto: "No teclado ou controle: setas para mover e mirar, Enter (botão A) para confirmar e jogar. Q e E (LB e RB) escolhem o efeito." },
    ],
    iniciar(area, faixa) {
      const fid = (faixa && faixa.id) || "6-8";
      const perfil = typeof Album !== "undefined" ? Album.perfilAtual().nome : "";
      Motor.telaOpcoes(area, {
        chave: `boliche-${fid}`,
        padrao: { jogadores: "1", nivel: "facil", nome1: perfil === "Visitante" ? "" : perfil, nome2: "", bola: "azul", bola2: "vermelho", protecao: fid === "5-6" ? "sim" : "nao", efeito: fid === "8-10" ? "sim" : "nao" },
        opcoes: [
          { chave: "jogadores", titulo: "Quem vai jogar?", valores: [["1", "🧒 Só eu"], ["robo", "🤖 Contra o computador"], ["2", "👫 2 jogadores"]] },
          { chave: "nivel", titulo: "O computador joga", quando: op => op.jogadores === "robo", valores: [["facil", "😊 Mais ou menos"], ["medio", "🧠 Bem"], ["dificil", "🦉 Muito bem"]] },
          { chave: "nome1", tipo: "texto", titulo: op => (op.jogadores === "2" ? "Nome do jogador 1" : "Qual é o seu nome?"), dica: op => (op.jogadores === "2" ? "Jogador 1" : "Você") },
          { chave: "nome2", tipo: "texto", titulo: "Nome do jogador 2", dica: "Jogador 2", quando: op => op.jogadores === "2" },
          { chave: "bola", titulo: op => (op.jogadores === "2" ? "Bola do jogador 1" : "Escolha a sua bola"), valores: () => Object.keys(CORES_BOLA).map(k => [k, NOMES_BOLA[k], () => figuraBola(k)]) },
          { chave: "bola2", titulo: op => (op.jogadores === "2" ? "Bola do jogador 2" : "Bola do computador"), quando: op => op.jogadores !== "1", valores: op => Object.keys(CORES_BOLA).filter(k => k !== op.bola).map(k => [k, NOMES_BOLA[k], () => figuraBola(k)]) },
          { chave: "protecao", titulo: "Canaletas", valores: [["sim", "🛡️ Com proteção"], ["nao", "🎳 Canaleta de verdade"]] },
          { chave: "efeito", regra: true, titulo: "Efeito na bola (curva)", valores: [["sim", "↩️ Com efeito"], ["nao", "⬆️ Sem efeito"]] },
        ],
        aoJogar: op => partida(area, op, fid),
      });
    },
  });
  CATALOGO["boliche"] = ["acao", "Strike! Derrube os 10 pinos"];

  function figuraBola(cor) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 220;
    const c = cv.getContext("2d");
    desenharBola(c, 110, 110, 90, cor, 0.6);
    return cv;
  }
  function desenharBola(c, x, y, r, cor, giro) {
    const [claro, escuro] = CORES_BOLA[cor] || CORES_BOLA.azul;
    const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, "#fff"); g.addColorStop(0.18, claro); g.addColorStop(1, escuro);
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    // furos dos dedos girando com a bola
    const v = Math.cos(giro);
    if (v > -0.2) {
      c.fillStyle = "rgba(10,15,30,.85)";
      const oy = Math.sin(giro) * r * 0.55;
      [[-0.22, -0.12], [0.18, -0.16], [-0.02, 0.22]].forEach(([fx, fy]) => {
        c.beginPath(); c.ellipse(x + fx * r, y + oy + fy * r * Math.max(0.2, v), r * 0.1, r * 0.1 * Math.max(0.25, v), 0, 0, Math.PI * 2); c.fill();
      });
    }
    c.fillStyle = "rgba(255,255,255,.35)"; c.beginPath(); c.ellipse(x - r * 0.38, y - r * 0.45, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2); c.fill();
  }

  // Desenho do pino (0,12 m × 0,38 m), feito uma vez
  let spritePino = null;
  function pino() {
    if (spritePino) return spritePino;
    const cv = document.createElement("canvas"), W = 64, H = 200;
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    const perfil = [[0, 0.26], [0.08, 0.4], [0.22, 0.5], [0.36, 0.47], [0.5, 0.31], [0.6, 0.19], [0.66, 0.18], [0.76, 0.24], [0.86, 0.26], [0.94, 0.2], [1, 0]];
    const px = (t, w, lado) => [W / 2 + lado * w * W, H - t * (H - 2)];
    c.beginPath();
    perfil.forEach(([t, w], i) => { const [x, y] = px(t, w, 1); i ? c.lineTo(x, y) : c.moveTo(x, y); });
    perfil.slice().reverse().forEach(([t, w]) => { const [x, y] = px(t, w, -1); c.lineTo(x, y); });
    c.closePath();
    const g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "#d9dde3"); g.addColorStop(0.35, "#ffffff"); g.addColorStop(1, "#aeb4bd");
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    c.fillStyle = "#e03131"; c.fillRect(0, H - 0.62 * H, W, 6); c.fillRect(0, H - 0.69 * H, W, 6);
    c.restore();
    c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 1.2; c.stroke();
    spritePino = cv;
    return cv;
  }

  // Placar oficial: devolve, para cada frame, as marcas (X, /, -, números) e o total acumulado
  function placar(jogadas) {
    const fr = [];
    let i = 0, total = 0;
    for (let f = 0; f < 10; f++) {
      const a = jogadas[i], b = jogadas[i + 1], c = jogadas[i + 2];
      if (a === undefined) { fr.push({ marcas: [], total: null }); continue; }
      const nm = v => (v === 0 ? "-" : String(v));
      if (f < 9) {
        if (a === 10) {
          fr.push({ marcas: ["", "X"], total: b !== undefined && c !== undefined ? (total += 10 + b + c) : null });
          i += 1;
        } else {
          const m = [nm(a), b === undefined ? "" : a + b === 10 ? "/" : nm(b)];
          let t = null;
          if (b !== undefined) { if (a + b === 10) { if (c !== undefined) t = total += 10 + c; } else t = total += a + b; }
          fr.push({ marcas: m, total: t });
          i += 2;
        }
      } else {
        // 10º frame: até 3 bolas; depois de strike ou spare os pinos voltam todos
        const m = [a === 10 ? "X" : nm(a)];
        if (b !== undefined) m.push(a === 10 ? (b === 10 ? "X" : nm(b)) : a + b === 10 ? "/" : nm(b));
        if (c !== undefined) {
          const pinosNovos = (a === 10 && b === 10) || (a !== 10 && a + b === 10);
          m.push(pinosNovos ? (c === 10 ? "X" : nm(c)) : b + c === 10 ? "/" : nm(c));
        }
        const fim = b !== undefined && (a + b < 10 ? true : c !== undefined);
        fr.push({ marcas: m, total: fim ? (total += a + b + (c || 0)) : null });
      }
    }
    return fr;
  }

  function partida(area, op, fid) {
    const dois = op.jogadores === "2", robo = op.jogadores === "robo", efeitoOn = op.efeito === "sim", protecao = op.protecao === "sim";
    const pequeno = fid === "5-6";
    const jog = [{ nome: op.nome1 || (dois ? "Jogador 1" : "Você"), bola: op.bola, jogadas: [], robo: false }];
    if (dois || robo) jog.push({ nome: dois ? op.nome2 || "Jogador 2" : "Computador", bola: CORES_BOLA[op.bola2] && op.bola2 !== op.bola ? op.bola2 : op.bola === "vermelho" ? "azul" : "vermelho", jogadas: [], robo });
    let pausado = false;
    const P = Palco.criar(area, { classe: "boliche-tela", aoPausar: () => { pausado = !pausado; P.pausa.textContent = pausado ? "▶️" : "⏸️"; } });
    const ctx = P.ctx;

    // ----- Estado -----
    let vez = 0, frame = 0, bolaNoFrame = 0; // bolaNoFrame: 0, 1 (e 2 no 10º)
    let fase = "posicao", posX = 0, mira = 0, efeito = 0, forca = 0, forcaT = 0, tFase = 0;
    let pinos = [], bola = null, camZ = -2.6, camX = 0, msg = null, confete = [], tRolando = 0, rodouAte = 0;
    const novoPinos = () => POS_PINOS.map(([x, dz], i) => ({ n: i + 1, x, z: Z_PINO1 + dz, vx: 0, vz: 0, caido: false, ang: 0, dir: 0, fora: false, balanco: 0 }));
    pinos = novoPinos();
    let emPe = () => pinos.filter(p => !p.caido).length;
    let antes = 10;

    // ----- Controles de toque -----
    const bEsq = P.botao("⬅️", () => tecla("esq")), bDir = P.botao("➡️", () => tecla("dir"));
    const bEfE = P.botao("↩️<small>efeito</small>", () => tecla("efE")), bEfD = P.botao("↪️<small>efeito</small>", () => tecla("efD"));
    const bOk = P.botao("✓", () => tecla("ok"), { classe: "principal" });
    P.controles.append(bEsq, bDir, bEfE, bEfD, bOk);
    function posicionarBotoes() {
      const m = 12, b = 12;
      Object.assign(bEsq.style, { left: m + "px", bottom: b + "px" });
      Object.assign(bDir.style, { left: m + 96 + "px", bottom: b + "px" });
      Object.assign(bOk.style, { right: m + "px", bottom: b + "px", minWidth: "130px" });
      const estreito = P.W < 620; // no celular em pé, os botões de efeito ficam em cima das setas
      Object.assign(bEfE.style, { left: m + (estreito ? 0 : 210) + "px", bottom: b + (estreito ? 96 : 0) + "px" });
      Object.assign(bEfD.style, { left: m + (estreito ? 96 : 306) + "px", bottom: b + (estreito ? 96 : 0) + "px" });
    }
    posicionarBotoes();
    function atualizarBotoes() {
      const humano = !jog[vez].robo && (fase === "posicao" || fase === "mira" || fase === "forca");
      bEsq.hidden = bDir.hidden = !humano || fase === "forca";
      bEfE.hidden = bEfD.hidden = !humano || fase !== "mira" || !efeitoOn;
      bOk.hidden = !humano;
      bOk.innerHTML = fase === "forca" ? "🎳<small>Jogar!</small>" : "✓<small>Pronto</small>";
    }
    P.teclas((e, desce) => {
      if (!desce || e.repeat && !/Arrow/.test(e.key)) return;
      const k = e.key;
      if (k === "ArrowLeft" || k === "a") tecla("esq");
      else if (k === "ArrowRight" || k === "d") tecla("dir");
      else if (k === "Enter" || k === " ") { e.preventDefault(); tecla("ok"); }
      else if (k === "q") tecla("efE");
      else if (k === "e") tecla("efD");
      else if (k === "p" || k === "Escape") { pausado = !pausado; P.pausa.textContent = pausado ? "▶️" : "⏸️"; }
    });
    // tocar na pista na hora de mirar: mira naquele ponto
    P.canvas.addEventListener("pointerdown", e => {
      if (pausado || jog[vez].robo) return;
      Motor.audio();
      if (fase === "forca") { tecla("ok"); return; }
      if (fase !== "mira" && fase !== "posicao") return;
      const r = P.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const v = vista();
      if (fase === "posicao") { const xm = camX + (x - P.W / 2) / v.esc(0.5); posX = Math.max(-0.42, Math.min(0.42, xm)); return; }
      // ponto da pista tocado → ângulo até lá
      if (y <= v.hz + 2) return;
      const dz = (v.camY * v.f) / (y - v.hz), z = camZ + dz, xm = camX + (x - P.W / 2) * dz / v.f;
      if (z > 1) mira = Math.max(-0.07, Math.min(0.07, Math.atan2(xm - posX, z)));
    });

    function tecla(t) {
      if (pausado || jog[vez].robo) return;
      if (fase === "posicao") {
        if (t === "esq") posX = Math.max(-0.42, posX - 0.035);
        else if (t === "dir") posX = Math.min(0.42, posX + 0.035);
        else if (t === "ok") irPara("mira");
      } else if (fase === "mira") {
        if (t === "esq") mira = Math.max(-0.07, mira - 0.004);
        else if (t === "dir") mira = Math.min(0.07, mira + 0.004);
        else if (t === "efE" && efeitoOn) { efeito = efeito === -1 ? 0 : -1; Motor.falar(efeito ? "Curva para a esquerda" : "Sem efeito"); }
        else if (t === "efD" && efeitoOn) { efeito = efeito === 1 ? 0 : 1; Motor.falar(efeito ? "Curva para a direita" : "Sem efeito"); }
        else if (t === "ok") irPara("forca");
      } else if (fase === "forca" && t === "ok") lancar();
    }
    function irPara(f) {
      fase = f; tFase = 0;
      if (f === "forca") { forcaT = Math.random() * 2; }
      atualizarBotoes();
      if (!jog[vez].robo) Motor.falar(f === "posicao" ? "Escolha onde ficar." : f === "mira" ? "Agora mire!" : "Força! Aperte quando a barra estiver alta!");
    }
    function lancar() {
      const v = 5.2 + 4.3 * forca;
      bola = { x: posX, z: -0.3, vx: Math.sin(mira) * v, vz: Math.cos(mira) * v, giro: 0, canaleta: 0, efeito: efeitoOn ? efeito : 0 };
      antes = emPe();
      fase = "rolando"; tRolando = 0; rodouAte = 0; tFase = 0;
      atualizarBotoes();
      Motor.ruido({ dur: 0.25, vol: 0.18, freq: 300 });
    }

    // ----- Computador -----
    let planoRobo = null;
    function planejarRobo() {
      const sigma = NIVEIS[op.nivel] || NIVEIS.facil;
      const emPeL = pinos.filter(p => !p.caido);
      const alvoX = bolaNoFrame === 0 || emPeL.length === 10 ? 0.07 * (Math.random() < 0.5 ? 1 : -1) * 0.8 : emPeL.reduce((s, p) => s + p.x, 0) / emPeL.length;
      const pos = Math.max(-0.35, Math.min(0.35, alvoX * 0.4 + (Math.random() - 0.5) * 0.2));
      const erro = (Math.random() + Math.random() + Math.random() - 1.5) * sigma * 1.6;
      planoRobo = { pos, mira: Math.atan2(alvoX + erro - pos, Z_PINO1), forca: 0.55 + Math.random() * 0.4 };
    }

    // ----- Física (vista de cima) -----
    function colidir(a, b, ra, rb, ma, mb, e) {
      const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
      if (d >= ra + rb || d < 1e-6) return 0;
      const nx = dx / d, nz = dz / d;
      const vrel = (a.vx - b.vx) * nx + (a.vz - b.vz) * nz;
      const sobra = ra + rb - d;
      a.x -= nx * sobra * mb / (ma + mb); a.z -= nz * sobra * mb / (ma + mb);
      b.x += nx * sobra * ma / (ma + mb); b.z += nz * sobra * ma / (ma + mb);
      if (vrel <= 0) return 0;
      const j = (1 + e) * vrel / (1 / ma + 1 / mb);
      a.vx -= j / ma * nx; a.vz -= j / ma * nz;
      b.vx += j / mb * nx; b.vz += j / mb * nz;
      return vrel;
    }
    function derrubar(p, forcaBatida) {
      if (p.caido) return;
      p.caido = true;
      p.dir = Math.atan2(p.vx, p.vz);
      const sp = Math.hypot(p.vx, p.vz);
      if (sp < 0.6) { p.vx *= 0.6 / Math.max(sp, 0.01); p.vz *= 0.6 / Math.max(sp, 0.01); }
      somPino(forcaBatida);
    }
    let somAnt = 0;
    function somPino(f) {
      const agora = performance.now();
      if (agora - somAnt < 35) return;
      somAnt = agora;
      const vol = Math.min(0.32, 0.08 + f * 0.05);
      Motor.ruido({ dur: 0.09, vol, filtro: "bandpass", freq: 1800 + Math.random() * 1600 });
      Motor.nota(900 + Math.random() * 500, { dur: 0.05, tipo: "triangle", vol: vol * 0.4 });
    }
    function fisica(dt) {
      const b = bola;
      if (b && b.z < Z_FOSSO + 1) {
        b.vz = Math.max(0, b.vz - 0.12 * dt);
        if (b.efeito && b.z > 8 && !b.canaleta) b.vx += b.efeito * 0.95 * dt; // a bola "pega" no fim do óleo e curva
        b.x += b.vx * dt; b.z += b.vz * dt;
        b.giro += b.vz * dt / R_BOLA;
        // canaletas (ou a barreira de proteção)
        if (!b.canaleta && Math.abs(b.x) > LANE - (protecao ? R_BOLA : 0)) {
          if (protecao) { b.x = Math.sign(b.x) * (LANE - R_BOLA); b.vx = -b.vx * 0.55; Motor.ruido({ dur: 0.08, vol: 0.12, freq: 600 }); }
          else if (b.z < Z_PINO1 - 0.2) { b.canaleta = Math.sign(b.x); b.vx = 0; msg = { txt: "Canaleta!", cor: "#ffd43b", t: 1.6 }; Motor.ruido({ dur: 0.3, vol: 0.15, freq: 250 }); }
        }
        if (b.canaleta) b.x += (b.canaleta * (LANE + CANAL / 2) - b.x) * Math.min(1, dt * 10);
        else pinos.forEach(p => { if (!p.fora) { const v = colidir(b, p, R_BOLA, R_PINO, M_BOLA, M_PINO, 0.6); if (v > 0.25) derrubar(p, v); } });
      }
      // pinos
      for (let i = 0; i < pinos.length; i++) {
        const p = pinos[i];
        if (p.fora) continue;
        for (let k = i + 1; k < pinos.length; k++) {
          const q = pinos[k];
          if (q.fora) continue;
          const v = colidir(p, q, R_PINO * (p.caido ? 1.3 : 1), R_PINO * (q.caido ? 1.3 : 1), M_PINO, M_PINO, 0.45);
          if (v > 0.22) { if (p.caido || Math.hypot(p.vx, p.vz) > 0.3) derrubar(q, v); if (q.caido || Math.hypot(q.vx, q.vz) > 0.3) derrubar(p, v); }
        }
      }
      pinos.forEach(p => {
        if (p.fora) return;
        if (!p.caido) {
          // pino em pé que levou só um esbarrão: balança e fica
          if (Math.hypot(p.vx, p.vz) > 0.01) { p.balanco = Math.min(0.35, p.balanco + Math.hypot(p.vx, p.vz)); p.vx = p.vz = 0; }
          p.balanco *= Math.max(0, 1 - dt * 3);
          return;
        }
        p.ang = Math.min(Math.PI / 2, p.ang + dt * 7);
        p.x += p.vx * dt; p.z += p.vz * dt;
        const atr = Math.max(0, 1 - dt * 2.2);
        p.vx *= atr; p.vz *= atr;
        if (Math.abs(p.x) > LANE + 0.04 || p.z > Z_FOSSO || p.z < Z_PINO1 - 1.2) p.fora = true; // canaleta ou fosso
      });
    }
    const parado = () => pinos.every(p => p.fora || (Math.hypot(p.vx, p.vz) < 0.04 && (!p.caido || p.ang >= Math.PI / 2)));

    // ----- Placar e rodadas -----
    function fimDaJogada() {
      const derrubados = antes - emPe();
      const j = jog[vez];
      j.jogadas.push(derrubados);
      const ultimo = frame === 9;
      let acabouFrame = false, repor = false;
      const strike = derrubados === 10 && (bolaNoFrame === 0 || (ultimo && antes === 10));
      const spare = !strike && emPe() === 0;
      if (strike) { msg = { txt: "STRIKE!", cor: "#ffd43b", t: 2.4, grande: true }; festa(); Motor.falar("Strike!"); }
      else if (spare) { msg = { txt: "SPARE!", cor: "#69db7c", t: 2.2, grande: true }; festa(); Motor.falar("Spare!"); }
      else if (derrubados === 0 && !msg) { msg = { txt: "Ops, nenhum pino!", cor: "#fff", t: 1.6 }; Motor.falar("Nenhum pino. Tente de novo!"); }
      else if (derrubados) { msg = { txt: `${derrubados} ${derrubados === 1 ? "pino" : "pinos"}!`, cor: "#fff", t: 1.6 }; Motor.falar(`${derrubados} ${derrubados === 1 ? "pino" : "pinos"}!`); }
      if (!ultimo) {
        if (strike || bolaNoFrame === 1) acabouFrame = true;
        else bolaNoFrame = 1;
      } else {
        const js = j.jogadas.slice(-1 - bolaNoFrame);
        if (bolaNoFrame === 0) { if (strike) repor = true; bolaNoFrame = 1; }
        else if (bolaNoFrame === 1) {
          if (js[0] + js[1] >= 10) { bolaNoFrame = 2; if (emPe() === 0) repor = true; }
          else acabouFrame = true;
        } else acabouFrame = true;
      }
      const proximo = () => {
        if (!P.vivo()) return;
        if (acabouFrame) {
          bolaNoFrame = 0;
          pinos = novoPinos();
          if (vez < jog.length - 1) vez++;
          else { vez = 0; frame++; }
          if (frame > 9) return terminar();
          if (jog.length > 1) Motor.falar(`Vez de ${jog[vez].nome}!`, { naFila: true });
        } else if (repor) pinos = novoPinos();
        else pinos = pinos.filter(p => !p.caido); // o varredor tira os pinos caídos
        bola = null;
        posX = jog[vez].robo ? 0 : posX; mira = 0; efeito = 0;
        if (jog[vez].robo) planejarRobo();
        irPara(pequeno && !jog[vez].robo ? "mira" : "posicao");
      };
      fase = "resultado";
      setTimeout(proximo, msg && msg.grande ? 2300 : 1600);
    }
    function festa() {
      Palco.confete(confete, P.W / 2, P.H * 0.35, ["#ffd43b", "#ff6b6b", "#4dabf7", "#69db7c", "#fff", "#b197fc"], 90);
      Motor.comemorar(P.canvas);
      Motor.tim();
    }
    function terminar() {
      fase = "fim";
      atualizarBotoes();
      const tot = jog.map(j => { const f = placar(j.jogadas); return f[9].total || 0; });
      let titulo, medalha, fala;
      if (jog.length === 1) {
        const novo = Placar.recorde("boliche", "pontos", tot[0]);
        titulo = `${tot[0]} pontos!`; medalha = tot[0] >= 150 ? "🏆" : tot[0] >= 90 ? "🥇" : "🎳";
        fala = `Fim de jogo! Você fez ${tot[0]} pontos!` + (novo ? " É o seu recorde!" : "");
        if (novo) titulo += " Recorde!";
      } else {
        const v = tot[0] === tot[1] ? -1 : tot[0] > tot[1] ? 0 : 1;
        titulo = v < 0 ? "Empate!" : `${jog[v].nome} venceu!`;
        medalha = v < 0 ? "🤝" : jog[v].robo ? "🤖" : "🏆";
        fala = v < 0 ? "Empate! Que jogo!" : jog[v].robo ? "O computador venceu! Vamos de novo?" : `${jog[v].nome} venceu! Parabéns!`;
      }
      Motor.falar(fala);
      if (jog.length === 1 || !jog[tot[0] >= tot[1] ? 0 : 1].robo) festa();
      const det = jog.map((j, i) => `${j.nome}: ${tot[i]}`).join("  ·  ");
      setTimeout(() => P.vivo() && P.fim(titulo, medalha, det, [
        { rotulo: "🔁 Jogar de novo", principal: true, aoClicar: () => partida(area, op, fid) },
        { rotulo: "⚙️ Trocar opções", aoClicar: () => JOGOS.find(j => j.id === "boliche").iniciar(area, { id: fid }) },
      ]), 1800);
    }

    // ----- Câmera e projeção -----
    function vista() {
      // em pé (celular) a câmera fecha mais na pista, para ela não ficar fininha
      const W = P.W, H = P.H, emPeTela = W < H, f = Math.min(W * (emPeTela ? 1.75 : 1.1), H * 1.2);
      const hz = H * (emPeTela ? 0.36 : 0.3), camY = 1.3;
      const esc = z => f / Math.max(0.15, z - camZ);
      const proj = (x, y, z) => { const s = esc(z); return [W / 2 + (x - camX) * s, hz + (camY - y) * s, s]; };
      return { W, H, f, hz, camY, esc, proj };
    }

    // ----- Desenho -----
    function quad(v, x1, x2, z1, z2, cor) {
      const a = v.proj(x1, 0, z1), b = v.proj(x2, 0, z1), c = v.proj(x2, 0, z2), d = v.proj(x1, 0, z2);
      ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
    }
    function linha(v, x1, z1, x2, z2, cor, larg) {
      const a = v.proj(x1, 0, z1), b = v.proj(x2, 0, z2);
      ctx.strokeStyle = cor; ctx.lineWidth = larg; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    function pista(v, ox, principal) {
      const z0 = Math.max(camZ + 0.35, -3), zf = Z_FOSSO + 0.15;
      // aproximação (antes da linha de falta), madeira mais clara
      if (z0 < 0) quad(v, ox - LANE - CANAL - 0.1, ox + LANE + CANAL + 0.1, z0, 0, principal ? "#e8c38f" : "#b99567");
      // canaletas e beiradas
      quad(v, ox - LANE - CANAL - 0.08, ox - LANE, Math.max(z0, 0), zf, "#3a3f4a");
      quad(v, ox + LANE, ox + LANE + CANAL + 0.08, Math.max(z0, 0), zf, "#3a3f4a");
      quad(v, ox - LANE - CANAL - 0.08, ox - LANE - CANAL, Math.max(z0, 0), zf, "#5b4636");
      quad(v, ox + LANE + CANAL, ox + LANE + CANAL + 0.08, Math.max(z0, 0), zf, "#5b4636");
      if (principal && protecao) {
        [-1, 1].forEach(l => { quad(v, ox + l * (LANE + 0.01), ox + l * (LANE + 0.07), Math.max(z0, 0), zf - 0.3, "#ff6b6b"); });
      }
      // pista de madeira, com brilho do verniz
      const a = v.proj(ox - LANE, 0, Math.max(z0, 0)), bb = v.proj(ox + LANE, 0, Math.max(z0, 0)), c = v.proj(ox + LANE, 0, zf), d = v.proj(ox - LANE, 0, zf);
      const g = ctx.createLinearGradient(0, a[1], 0, c[1]);
      g.addColorStop(0, principal ? "#e9b979" : "#b8915f"); g.addColorStop(0.5, principal ? "#f2cd96" : "#c39d6c"); g.addColorStop(1, principal ? "#d9a066" : "#a7804f");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(bb[0], bb[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
      if (!principal) return;
      // tábuas
      for (let i = 1; i < 13; i++) { const x = ox - LANE + i * (2 * LANE / 13); linha(v, x, Math.max(z0, 0), x, zf, "rgba(120,70,30,.18)", 1); }
      // reflexo do teto (luzes) na pista encerada
      ctx.globalAlpha = 0.25;
      for (let z = 3; z < 18; z += 3) quad(v, ox - 0.12, ox + 0.12, z, z + 0.5, "#fff");
      ctx.globalAlpha = 1;
      // linha de falta, pontinhos e as setas de mira
      linha(v, ox - LANE, 0, ox + LANE, 0, "#c92a2a", Math.max(2, v.esc(0) * 0.012));
      for (let i = -3; i <= 3; i++) {
        const x = ox + i * 0.127, z = 4.6 + Math.abs(i) * 0.31;
        const p1 = v.proj(x, 0, z + 0.3), p2 = v.proj(x - 0.03, 0, z), p3 = v.proj(x + 0.03, 0, z);
        ctx.fillStyle = "#5c3a1e"; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.lineTo(p3[0], p3[1]); ctx.fill();
        const pp = v.proj(x, 0, 2.1); if (pp[2] > 0) { ctx.beginPath(); ctx.arc(pp[0], pp[1], Math.max(1, pp[2] * 0.012), 0, 7); ctx.fill(); }
      }
      // área dos pinos (mais clara) e o fosso escuro atrás
      quad(v, ox - LANE, ox + LANE, Z_PINO1 - 0.3, Z_FOSSO, "#f0d1a3");
    }
    function fundo(v) {
      const { W, H, hz } = v;
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#1a1236"); g.addColorStop(0.45, "#2a1d52"); g.addColorStop(1, "#140f26");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // parede do fundo: o "masking" colorido em cima dos pinos, de ponta a ponta
      const zF = Z_FOSSO + 0.6;
      const t1 = v.proj(-12, 1.85, zF), t2 = v.proj(12, 0.62, zF);
      const gm = ctx.createLinearGradient(t1[0], 0, t2[0], 0);
      ["#7048e8", "#e64980", "#f59f00", "#12b886", "#1c7ed6", "#ae3ec9", "#f76707", "#7048e8"].forEach((c, i, a) => gm.addColorStop(i / (a.length - 1), c));
      ctx.fillStyle = gm; ctx.fillRect(t1[0], t1[1], t2[0] - t1[0], t2[1] - t1[1]);
      ctx.fillStyle = "rgba(255,255,255,.18)";
      for (let i = -12; i < 12; i += 0.7) { const a = v.proj(i, 1.85, zF), b = v.proj(i + 0.35, 0.62, zF); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + (b[0] - a[0]) * 0.3, a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0] - (b[0] - a[0]) * 0.3, b[1]); ctx.fill(); }
      // estrelinhas/neon e letreiro
      const s = v.esc(zF);
      Palco.texto(ctx, "🎳 STRIKE ZONE 🎳", v.proj(0, 1.25, zF)[0], v.proj(0, 1.25, zF)[1], Math.max(10, s * 0.28), "#fff", { contorno: "rgba(60,0,80,.7)" });
      // abertura escura atrás dos pinos
      const p1 = v.proj(-12, 0.62, zF), p2 = v.proj(12, 0, zF);
      ctx.fillStyle = "#07060d"; ctx.fillRect(p1[0], p1[1], p2[0] - p1[0], p2[1] - p1[1]);
      // chão (carpete) até a câmera
      const c1 = v.proj(0, 0, zF);
      ctx.fillStyle = "#231a3d"; ctx.fillRect(0, c1[1], W, H - c1[1]);
      // luzes do teto
      for (let z = 2; z < 20; z += 3.2) for (let x = -6; x <= 6; x += 4) {
        const p = v.proj(x, 3.2, z); if (p[2] <= 0 || p[1] < -20) continue;
        ctx.fillStyle = "rgba(255,245,210,.85)"; ctx.beginPath(); ctx.ellipse(p[0], p[1], p[2] * 0.25, p[2] * 0.05, 0, 0, 7); ctx.fill();
      }
      return hz;
    }
    function desenharPino(v, p, ox = 0) {
      const [sx, sy, s] = v.proj(p.x + ox, 0, p.z);
      if (s <= 0) return;
      const im = pino(), h = ALT_PINO * s, w = 0.12 * s * 1.05;
      ctx.fillStyle = "rgba(0,0,0,.22)"; ctx.beginPath(); ctx.ellipse(sx, sy, w * 0.55, w * 0.18, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(sx, sy);
      if (p.caido) {
        const dx = Math.sin(p.dir), dz = Math.cos(p.dir), a = p.ang;
        ctx.rotate(dx * a * 1.05);
        ctx.scale(1, Math.max(0.2, 1 - Math.abs(dz) * Math.sin(a) * 0.8));
      } else if (p.balanco > 0.01) ctx.rotate(Math.sin(performance.now() / 50) * p.balanco * 0.25);
      ctx.drawImage(im, -w / 2, -h, w, h);
      ctx.restore();
    }
    function desenharBolaPista(v) {
      const b = bola || { x: posX, z: -0.35, giro: 0, canaleta: 0 };
      if (b.z > Z_FOSSO + 0.05) return; // caiu no fosso atrás dos pinos
      const y = b.canaleta ? R_BOLA - 0.06 : R_BOLA;
      const [sx, sy, s] = v.proj(b.x, y, b.z);
      if (s <= 0 || sy > v.H + 100) return;
      const g = v.proj(b.x, 0, b.z);
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(g[0], g[1], R_BOLA * s, R_BOLA * s * 0.3, 0, 0, 7); ctx.fill();
      desenharBola(ctx, sx, sy, R_BOLA * s, jog[vez].bola, b.giro);
    }
    function desenhar(dt) {
      const v = vista();
      fundo(v);
      // pistas vizinhas (com os seus pinos parados) e a sua
      [-2.1, 2.1, -4.2, 4.2].forEach(ox => { pista(v, ox, false); POS_PINOS.forEach(([x, dz]) => desenharPino(v, { x, z: Z_PINO1 + dz, caido: false, balanco: 0 }, ox)); });
      pista(v, 0, true);
      // mira: linha pontilhada até os pinos
      if ((fase === "mira" || fase === "forca") && !jog[vez].robo) {
        ctx.setLineDash([10, 10]);
        const zA = 12, xA = posX + Math.tan(mira) * zA;
        linha(v, posX, -0.2, xA, zA, "rgba(255,255,255,.85)", 3);
        ctx.setLineDash([]);
        const p = v.proj(xA, 0, zA);
        ctx.fillStyle = "#ffd43b"; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(5, p[2] * 0.05), 0, 7); ctx.fill();
        if (efeito) Palco.texto(ctx, efeito < 0 ? "↩️" : "↪️", p[0], p[1] - 26, 26);
      } else if ((fase === "mira" || fase === "forca") && jog[vez].robo) {
        // o computador pensando
      }
      // pinos e bola, de longe para perto
      const itens = pinos.filter(p => !p.fora || p.z < Z_FOSSO).map(p => ({ z: p.z, p }));
      itens.push({ z: bola ? bola.z : -0.35, bola: true });
      itens.sort((a, b) => b.z - a.z).forEach(it => (it.bola ? desenharBolaPista(v) : desenharPino(v, it.p)));
      // barra de força
      if (fase === "forca") barraForca();
      placarTela();
      mapaPinos();
      dica();
      if (msg) {
        const s = P.esc(), k = Math.min(1, msg.t * 3), pop = msg.grande ? 1 + Math.max(0, 0.4 - (2.4 - msg.t)) : 1;
        ctx.save(); ctx.globalAlpha = k; ctx.translate(P.W / 2, P.H * 0.42); ctx.scale(pop, pop);
        Palco.texto(ctx, msg.txt, 0, 0, (msg.grande ? 84 : 48) * s, msg.cor, { contorno: "rgba(20,10,40,.85)" });
        ctx.restore();
        msg.t -= dt; if (msg.t <= 0) msg = null;
      }
      Palco.desenharConfete(ctx, confete, dt);
      if (pausado) Palco.texto(ctx, "⏸️ Pausa", P.W / 2, P.H / 2, 54 * P.esc());
    }
    function barraForca() {
      const s = P.esc(), h = Math.min(P.H * 0.45, 260 * s), w = 30 * s, x = P.W - w - 24 * s, y = P.H * 0.5 - h / 2;
      Palco.caixa(ctx, x - 8 * s, y - 34 * s, w + 16 * s, h + 50 * s, 14 * s);
      const g = ctx.createLinearGradient(0, y + h, 0, y);
      g.addColorStop(0, "#69db7c"); g.addColorStop(0.6, "#ffd43b"); g.addColorStop(1, "#ff6b6b");
      ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = g; ctx.fillRect(x, y + h * (1 - forca), w, h * forca);
      Palco.texto(ctx, "💪", x + w / 2, y - 17 * s, 22 * s);
    }
    function dica() {
      if (jog[vez].robo || !["posicao", "mira", "forca"].includes(fase)) {
        if (jog[vez].robo && fase !== "fim") Palco.texto(ctx, "🤖 Vez do computador...", P.W / 2, P.H - 40 * P.esc(), 24 * P.esc());
        return;
      }
      const s = P.esc();
      const t = fase === "posicao" ? "1 · Onde ficar: ⬅️ ➡️ e ✓" : fase === "mira" ? (efeitoOn ? "2 · Mire ⬅️ ➡️ · efeito ↩️ ↪️ · ✓" : "2 · Mire: ⬅️ ➡️ ou toque na pista · ✓") : "3 · Força! Aperte quando estiver alta";
      // deitado: acima dos botões; em pé: no teto, para não cobrir a bola
      const y = P.W < P.H ? P.H * 0.3 : P.H - 112 - 30 * s;
      Palco.texto(ctx, t, P.W / 2, y, Math.min(24 * s, P.W / 20));
    }
    // Placar de papel: uma linha por jogador, 10 frames e o total
    function placarTela() {
      const s = P.esc(), estreito = P.W < 700;
      const x0 = estreito ? 8 : 74, x1 = estreito ? P.W - 8 : P.W - 140 * Math.min(1.3, s);
      const y0 = estreito ? 62 * Math.min(1.2, s) : 8;
      const tw = Math.min(x1 - x0, 900 * s), xi = estreito ? x0 : x0 + (x1 - x0 - tw) / 2;
      const nw = tw * 0.17, u = (tw - nw) / 11.7, rh = Math.max(30, Math.min(54, u * 0.95));
      jog.forEach((j, r) => {
        const y = y0 + r * (rh + 4), fr = placar(j.jogadas), ativo = r === vez && fase !== "fim";
        Palco.caixa(ctx, xi, y, tw, rh, 8, ativo ? "rgba(255,212,59,.92)" : "rgba(255,255,255,.88)");
        const tc = "#1d2333";
        ctx.fillStyle = CORES_BOLA[j.bola][0]; ctx.beginPath(); ctx.arc(xi + rh * 0.35, y + rh / 2, rh * 0.2, 0, 7); ctx.fill();
        Palco.texto(ctx, j.nome.slice(0, 10), xi + rh * 0.65, y + rh / 2, Math.min(rh * 0.38, nw / 6), tc, { alinhar: "left", contorno: null });
        let x = xi + nw;
        fr.forEach((f, i) => {
          const fw = i === 9 ? u * 1.5 : u;
          ctx.strokeStyle = "rgba(29,35,51,.35)"; ctx.lineWidth = 1; ctx.strokeRect(x, y, fw, rh);
          const nb = i === 9 ? 3 : 2, bw = fw / nb * (i === 9 ? 1 : 1);
          for (let k = 0; k < nb; k++) {
            const mk = i === 9 ? f.marcas[k] : f.marcas[k];
            const bx = i === 9 ? x + k * bw : x + (k === 0 ? 0 : fw / 2);
            if (i < 9 && k === 1 || i === 9) { ctx.strokeRect(bx, y, i === 9 ? bw : fw / 2, rh * 0.45); }
            if (mk) Palco.texto(ctx, mk, bx + (i === 9 ? bw : fw / 2) / 2, y + rh * 0.24, rh * 0.32, mk === "X" ? "#c92a2a" : mk === "/" ? "#2b8a3e" : tc, { contorno: null });
          }
          if (f.total !== null) Palco.texto(ctx, String(f.total), x + fw / 2, y + rh * 0.72, rh * 0.36, tc, { contorno: null });
          if (i === frame && ativo) { ctx.strokeStyle = "#e8590c"; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, fw - 3, rh - 3); }
          x += fw;
        });
        const tot = fr.reduce((m, f) => (f.total !== null ? f.total : m), 0);
        Palco.texto(ctx, String(tot), x + u * 0.6, y + rh / 2, rh * 0.5, "#1864ab", { contorno: null });
      });
    }
    // Triângulo dos pinos em pé (como no telão do boliche)
    function mapaPinos() {
      const s = P.esc(), estreito = P.W < 700;
      const r = 7 * s, x0 = P.W - 70 * s, y0 = estreito ? 62 * Math.min(1.2, s) + jog.length * 58 + 14 : 70 * s + 10;
      Palco.caixa(ctx, x0 - r * 6, y0 - r * 2, r * 12, r * 10, 10 * s);
      POS_PINOS.forEach(([x, dz], i) => {
        const p = pinos.find(q => q.n === i + 1);
        const emPeP = p && !p.caido;
        ctx.fillStyle = emPeP ? "#fff" : "rgba(255,255,255,.18)";
        ctx.beginPath(); ctx.arc(x0 + x / D * r * 2.6, y0 + r * 6.5 - dz / DZ * r * 2.3, r, 0, 7); ctx.fill();
      });
    }

    // ----- Laço -----
    let tSom = 0;
    P.rodar(dt => {
      if (!pausado) {
        tFase += dt;
        const j = jog[vez];
        if (j.robo && planoRobo && ["posicao", "mira", "forca"].includes(fase)) {
          if (fase === "posicao") { posX += (planoRobo.pos - posX) * Math.min(1, dt * 3); if (tFase > 1) irPara("mira"); }
          else if (fase === "mira") { mira += (planoRobo.mira - mira) * Math.min(1, dt * 3); if (tFase > 1.1) irPara("forca"); }
          else { forca = planoRobo.forca; if (tFase > 0.7) lancar(); }
        } else if (fase === "forca") {
          forcaT += dt * (pequeno ? 0.9 : 1.25);
          forca = 0.5 - 0.5 * Math.cos(forcaT * Math.PI);
        }
        if (fase === "rolando") {
          const passos = 4;
          for (let i = 0; i < passos; i++) fisica(dt / passos);
          tRolando += dt;
          // ronco da bola rolando
          tSom -= dt;
          if (bola && bola.z < Z_PINO1 && tSom <= 0) { tSom = 0.12; Motor.ruido({ dur: 0.14, vol: 0.05 + 0.04 * bola.vz / 9, freq: 140 }); }
          if (bola && bola.z > Z_FOSSO + 0.6 && !rodouAte) rodouAte = tRolando;
          if ((rodouAte && parado() && tRolando - rodouAte > 0.8) || (rodouAte && tRolando - rodouAte > 3.2) || tRolando > 12) fimDaJogada();
        }
        // câmera: atrás da linha de falta, acompanha a bola até perto dos pinos e volta
        const alvoZ = fase === "rolando" || fase === "resultado" ? Math.min(13.5, Math.max(-2.6, (bola ? Math.min(bola.z, Z_PINO1) : 0) - 3.4)) : -2.6;
        camZ += (alvoZ - camZ) * Math.min(1, dt * (fase === "rolando" ? 2.4 : 1.6));
        const alvoX = fase === "rolando" && bola ? bola.x * 0.5 : posX * 0.4;
        camX += (alvoX - camX) * Math.min(1, dt * 2);
      }
      desenhar(dt);
    });
    P.aoMedir = posicionarBotoes;
    if (jog[vez].robo) planejarRobo();
    irPara(pequeno ? "mira" : "posicao");
    Motor.falar(jog.length > 1 ? `Boliche! Começa ${jog[0].nome}.` : "Boliche! Derrube os dez pinos!", { naFila: true });
  }
})();
