// Sinuca 🎱 — Bola 8 com mesa vista de cima (feltro, tabelas de madeira com os diamantes, 6 caçapas)
// e física de verdade: atrito no pano, colisões entre bolas, tabelas e caçapas. Taco com mira (linha
// guia com a "bola fantasma" e para onde a bola atingida vai) e força (puxa a barra e solta).
// Regras da Bola 8: abertura no triângulo; a mesa fica "aberta" até alguém encaçapar e ficar com as
// lisas (1-7) ou listradas (9-15); quem encaçapa a sua joga de novo; falta (branca na caçapa, não
// acertar nada ou acertar primeiro a bola do outro) dá "bola na mão" ao adversário; a 8 é a última:
// encaçapar a 8 antes da hora (ou com falta) perde a partida. Treino livre para os pequenos.
(() => {
  const L = 2.54, M = 1.27, R = 0.0286; // mesa (m) e raio da bola
  const CACAPAS = [[0, 0, 0.062], [L / 2, -0.012, 0.058], [L, 0, 0.062], [0, M, 0.062], [L / 2, M + 0.012, 0.058], [L, M, 0.062]];
  const COR = { 1: "#ffd43b", 2: "#1c7ed6", 3: "#e03131", 4: "#7048e8", 5: "#f76707", 6: "#2f9e44", 7: "#862e2e", 8: "#1a1a1a" };
  const corDe = n => COR[n > 8 ? n - 8 : n];
  const MESAS = { verde: ["#1f8a4c", "#14653a", "Verde"], azul: ["#1f6fb2", "#154e80", "Azul"], vermelha: ["#b02a37", "#7d1d27", "Vermelha"], roxa: ["#6741d9", "#4a2b9e", "Roxa"] };
  const ERRO = { facil: 0.06, medio: 0.028, dificil: 0.011 };
  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#7a4a24"/><rect x="8" y="8" width="48" height="48" rx="6" fill="#1f8a4c"/><circle cx="10" cy="10" r="4" fill="#111"/><circle cx="54" cy="10" r="4" fill="#111"/><circle cx="10" cy="54" r="4" fill="#111"/><circle cx="54" cy="54" r="4" fill="#111"/><circle cx="36" cy="28" r="6" fill="#1a1a1a"/><circle cx="36" cy="28" r="2.6" fill="#fff"/><text x="36" y="30" font-size="4" text-anchor="middle" font-family="sans-serif" font-weight="bold">8</text><circle cx="44" cy="22" r="5" fill="#ffd43b"/><circle cx="44" cy="35" r="5" fill="#e03131"/><circle cx="20" cy="42" r="5" fill="#fff"/><path d="M5 60 L18 46" stroke="#e9c46a" stroke-width="3" stroke-linecap="round"/></svg>';

  JOGOS.push({
    id: "sinuca", nome: "Sinuca", icone: ICONE, teclas: true,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: "🎯", texto: "Arraste o dedo na mesa (ou use ⬅️ ➡️) para mirar. A linha mostra para onde a branca vai e para onde a bola atingida corre." },
      { figura: "💪", texto: "Força: puxe a barra do lado para baixo e solte para dar a tacada. No teclado ou controle, ⬆️ ⬇️ escolhem a força e Enter (A) dá a tacada." },
      { figura: "🎱", texto: "Bola 8: quem encaçapar primeiro fica com as lisas (1 a 7) ou com as listradas (9 a 15). Encaçapou a sua? Joga de novo!" },
      { figura: "⚪", texto: "Falta: a branca cair na caçapa, não acertar nenhuma bola ou acertar primeiro a bola do outro. Aí o outro ganha a bola na mão e coloca a branca onde quiser." },
      { figura: "⚫", texto: "A bola 8 é a última! Quem encaçapar a 8 depois de todas as suas ganha. Encaçapar a 8 antes da hora perde a partida." },
      { figura: "🧒", texto: "No treino livre não tem regra: é só encaçapar todas as bolas com o menor número de tacadas." },
    ],
    iniciar(area, faixa) {
      const fid = (faixa && faixa.id) || "6-8";
      const perfil = typeof Album !== "undefined" ? Album.perfilAtual().nome : "";
      Motor.telaOpcoes(area, {
        chave: `sinuca-${fid}`,
        padrao: { modo: fid === "5-6" ? "treino" : "robo", nivel: "facil", nome1: perfil === "Visitante" ? "" : perfil, nome2: "", mesa: "verde", guia: fid === "8-10" ? "curta" : "longa" },
        opcoes: [
          { chave: "modo", titulo: "Como vamos jogar?", valores: [["treino", "🧒 Treino livre"], ["robo", "🤖 Bola 8 contra o computador"], ["dois", "👫 Bola 8 com 2 jogadores"]] },
          { chave: "nivel", titulo: "O computador joga", quando: op => op.modo === "robo", valores: [["facil", "😊 Mais ou menos"], ["medio", "🧠 Bem"], ["dificil", "🦉 Muito bem"]] },
          { chave: "nome1", tipo: "texto", titulo: op => (op.modo === "dois" ? "Nome do jogador 1" : "Qual é o seu nome?"), dica: op => (op.modo === "dois" ? "Jogador 1" : "Você") },
          { chave: "nome2", tipo: "texto", titulo: "Nome do jogador 2", dica: "Jogador 2", quando: op => op.modo === "dois" },
          { chave: "mesa", titulo: "A cor da mesa", valores: () => Object.entries(MESAS).map(([id, m]) => [id, m[2], () => figuraMesa(id)]) },
          { chave: "guia", regra: true, titulo: "Linha de mira", valores: [["longa", "📏 Longa (mostra o caminho)"], ["curta", "🎯 Curta (mais difícil)"]] },
        ],
        aoJogar: op => partida(area, op, fid),
      });
    },
  });
  CATALOGO["sinuca"] = ["mesa", "Bola 8 com taco, mira e caçapas"];

  function figuraMesa(id) {
    const cv = document.createElement("canvas"); cv.width = 260; cv.height = 150;
    const c = cv.getContext("2d");
    desenharMesa(c, { x: 10, y: 10, k: 240 / (L + 0.24), rot: false }, id);
    return cv;
  }
  // Mesa: madeira, tabelas, diamantes, feltro e caçapas. `t`: transformação (x, y, escala k)
  function desenharMesa(c, t, mesa) {
    const [f1, f2] = MESAS[mesa] || MESAS.verde, k = t.k, B = 0.12; // borda de madeira
    c.save(); c.translate(t.x + B * k, t.y + B * k);
    // madeira
    const gw = c.createLinearGradient(0, -B * k, 0, (M + B) * k);
    gw.addColorStop(0, "#8a5a2b"); gw.addColorStop(0.5, "#6b4220"); gw.addColorStop(1, "#5a3518");
    c.fillStyle = gw; c.beginPath(); c.roundRect(-B * k, -B * k, (L + 2 * B) * k, (M + 2 * B) * k, 0.06 * k); c.fill();
    // tabelas (borracha forrada)
    c.fillStyle = f2; c.fillRect(-0.04 * k, -0.04 * k, (L + 0.08) * k, (M + 0.08) * k);
    // feltro com luz no meio
    const gf = c.createRadialGradient(L / 2 * k, M / 2 * k, 0.1 * k, L / 2 * k, M / 2 * k, L * 0.7 * k);
    gf.addColorStop(0, f1); gf.addColorStop(1, f2);
    c.fillStyle = gf; c.fillRect(0, 0, L * k, M * k);
    // linha de cabeceira e marcas
    c.strokeStyle = "rgba(255,255,255,.18)"; c.lineWidth = 1;
    c.beginPath(); c.moveTo(L * 0.25 * k, 0); c.lineTo(L * 0.25 * k, M * k); c.stroke();
    c.fillStyle = "rgba(255,255,255,.3)"; c.beginPath(); c.arc(L * 0.75 * k, M / 2 * k, 0.008 * k, 0, 7); c.fill();
    // diamantes
    c.fillStyle = "#f1e3c6";
    for (let i = 1; i < 8; i++) if (i !== 4) [[-0.075, -1], [M + 0.075, 1]].forEach(([y]) => { c.beginPath(); c.arc(L * i / 8 * k, y * k, 0.012 * k, 0, 7); c.fill(); });
    for (let i = 1; i < 4; i++) [-0.075, L + 0.075].forEach(x => { c.beginPath(); c.arc(x * k, M * i / 4 * k, 0.012 * k, 0, 7); c.fill(); });
    // caçapas
    CACAPAS.forEach(([x, y, r]) => {
      c.fillStyle = "#2b2b2b"; c.beginPath(); c.arc(x * k, y * k, (r + 0.012) * k, 0, 7); c.fill();
      c.fillStyle = "#050505"; c.beginPath(); c.arc(x * k, y * k, r * k, 0, 7); c.fill();
    });
    c.restore();
  }
  function desenharBolaS(c, x, y, r, n, giro = 0) {
    c.save(); c.translate(x, y);
    if (n === 0) { c.fillStyle = "#fbfbf5"; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); }
    else {
      const listrada = n > 8;
      c.fillStyle = listrada ? "#fbfbf5" : corDe(n); c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
      if (listrada) { c.save(); c.beginPath(); c.arc(0, 0, r, 0, 7); c.clip(); c.fillStyle = corDe(n); c.fillRect(-r, -r * 0.55, 2 * r, r * 1.1); c.restore(); }
      // círculo com o número
      const ox = Math.cos(giro) * r * 0.25, oy = Math.sin(giro) * r * 0.25;
      c.fillStyle = "#fff"; c.beginPath(); c.arc(ox, oy, r * 0.48, 0, 7); c.fill();
      if (r > 6) { c.fillStyle = "#111"; c.font = `bold ${r * 0.62}px Fredoka, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(n), ox, oy + r * 0.04); }
    }
    // brilho e sombra (volume)
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
    g.addColorStop(0, "rgba(255,255,255,.75)"); g.addColorStop(0.3, "rgba(255,255,255,0)"); g.addColorStop(0.8, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.35)");
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    c.restore();
  }

  function partida(area, op, fid) {
    const treino = op.modo === "treino", robo = op.modo === "robo";
    const jog = [{ nome: op.nome1 || (op.modo === "dois" ? "Jogador 1" : "Você"), grupo: null, robo: false }];
    if (!treino) jog.push({ nome: robo ? "Computador" : op.nome2 || "Jogador 2", grupo: null, robo });
    let pausado = false;
    const P = Palco.criar(area, { classe: "sinuca-tela", aoPausar: () => { pausado = !pausado; P.pausa.textContent = pausado ? "▶️" : "⏸️"; } });
    const ctx = P.ctx;

    // ----- Bolas: triângulo com a 8 no meio (lisa e listrada nos cantos de trás) -----
    let bolas = [];
    function arrumar() {
      bolas = [{ n: 0, x: L * 0.25, y: M / 2, vx: 0, vy: 0, fora: false, giro: 0 }];
      // posições do triângulo (coluna a coluna): 4 = meio (a 8), 10 e 14 = cantos de trás (uma lisa e uma listrada)
      const lisas = Motor.embaralhar([1, 2, 3, 4, 5, 6, 7]), listradas = Motor.embaralhar([9, 10, 11, 12, 13, 14, 15]);
      const tri = Array(15);
      tri[4] = 8; tri[10] = lisas.pop(); tri[14] = listradas.pop();
      const resto = Motor.embaralhar([...lisas, ...listradas]);
      for (let i = 0; i < 15; i++) if (tri[i] === undefined) tri[i] = resto.pop();
      let i = 0;
      const x0 = L * 0.75, d = 2 * R + 0.0005;
      for (let col = 0; col < 5; col++) for (let lin = 0; lin <= col; lin++) {
        bolas.push({ n: tri[i++], x: x0 + col * d * Math.cos(Math.PI / 6), y: M / 2 + (lin - col / 2) * d + (Math.random() - 0.5) * 0.0004, vx: 0, vy: 0, fora: false, giro: Math.random() * 6 });
      }
    }
    arrumar();
    const branca = () => bolas[0];

    // ----- Estado da partida -----
    let vez = 0, mesaAberta = true, fase = "mirar", angulo = 0, forca = 0.5, arrastandoForca = false, puxada = 0;
    let bolaNaMao = false, tacadas = 0, primeiraBatida = null, encacapadas = [], msg = null, tAnim = 0, confete = [], fim = false;
    let animTaco = 0, batida = null; // animação da tacada e a velocidade que a branca vai receber
    // ----- Geometria da tela: mesa deitada (tela larga) ou em pé (celular em pé) -----
    let T = { x: 0, y: 0, k: 1, rot: false };
    function medir() {
      const B = 0.12, rot = P.H > P.W * 1.1;
      const largura = L + 2 * B, altura = M + 2 * B;
      const aw = P.W - (rot ? 20 : 150), ah = P.H - (rot ? 270 : 110);
      const k = rot ? Math.min(aw / altura, ah / largura) : Math.min(aw / largura, ah / altura);
      const w = (rot ? altura : largura) * k, h = (rot ? largura : altura) * k;
      T = { x: (P.W - w) / 2 - (rot ? 0 : 40), y: (rot ? 130 : 64) + (ah - h) / 2, k, rot, w, h };
      posicionarBotoes();
    }
    // mesa (m) → tela (px) e o contrário
    const B = 0.12;
    const tela = (x, y) => (T.rot ? [T.x + (B + M - y) * T.k, T.y + (B + x) * T.k] : [T.x + (B + x) * T.k, T.y + (B + y) * T.k]);
    const mesa = (sx, sy) => (T.rot ? [(sy - T.y) / T.k - B, M - ((sx - T.x) / T.k - B)] : [(sx - T.x) / T.k - B, (sy - T.y) / T.k - B]);

    // ----- Botões e barra de força -----
    const bTacada = P.botao("🎱<small>Tacada!</small>", () => tacar(), { classe: "principal" });
    const bOk = P.botao("✓<small>Pronto</small>", () => confirmarBranca(), { classe: "principal" });
    P.controles.append(bTacada, bOk);
    function posicionarBotoes() {
      Object.assign(bTacada.style, { right: "12px", bottom: "12px", minWidth: "120px" });
      Object.assign(bOk.style, { right: "12px", bottom: "12px", minWidth: "120px" });
    }
    function atualizarBotoes() {
      const humano = !jog[vez].robo && !fim;
      bTacada.hidden = !(humano && fase === "mirar" && !bolaNaMao);
      bOk.hidden = !(humano && bolaNaMao && fase === "mirar");
    }
    // barra de força (lado direito ou embaixo)
    const barra = () => (T.rot ? { x: 20, y: P.H - 70, w: P.W - 170, h: 46, vertical: false } : { x: P.W - 70, y: 112, w: 50, h: Math.min(P.H - 260, 380), vertical: true });

    // ----- Entradas -----
    let arrastando = null;
    P.canvas.addEventListener("pointerdown", e => {
      if (pausado || fim || jog[vez].robo || fase !== "mirar") return;
      Motor.audio();
      const r = P.canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
      const b = barra();
      if (!bolaNaMao && sx >= b.x - 10 && sx <= b.x + b.w + 10 && sy >= b.y - 10 && sy <= b.y + b.h + 10) { arrastando = "forca"; definirForca(sx, sy); }
      else if (bolaNaMao) { arrastando = "branca"; moverBranca(sx, sy); }
      else { arrastando = "mira"; mirar(sx, sy); }
      try { P.canvas.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
    });
    P.canvas.addEventListener("pointermove", e => {
      if (!arrastando) return;
      const r = P.canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
      if (arrastando === "forca") definirForca(sx, sy);
      else if (arrastando === "branca") moverBranca(sx, sy);
      else mirar(sx, sy);
    });
    P.canvas.addEventListener("pointerup", () => { if (arrastando === "forca" && puxada > 0.04) tacar(); arrastando = null; puxada = 0; });
    function definirForca(sx, sy) {
      const b = barra();
      puxada = b.vertical ? Math.max(0, Math.min(1, (sy - b.y) / b.h)) : Math.max(0, Math.min(1, (sx - b.x) / b.w));
      forca = Math.max(0.05, puxada);
    }
    function mirar(sx, sy) {
      const [x, y] = mesa(sx, sy), w = branca();
      if (Math.hypot(x - w.x, y - w.y) > 0.02) angulo = Math.atan2(y - w.y, x - w.x);
    }
    function moverBranca(sx, sy) {
      const [x, y] = mesa(sx, sy), w = branca();
      const lim = tacadas === 0 ? L * 0.25 : L - R; // na abertura, só atrás da linha de cabeceira
      const nx = Math.max(R, Math.min(lim, x)), ny = Math.max(R, Math.min(M - R, y));
      if (bolas.some(b => b !== w && !b.fora && Math.hypot(b.x - nx, b.y - ny) < 2 * R + 0.002)) return;
      w.x = nx; w.y = ny;
    }
    P.teclas((e, d) => {
      if (!d || pausado || fim || jog[vez].robo || fase !== "mirar") return;
      const k = e.key, w = branca();
      if (bolaNaMao) {
        const passo = 0.03, [sx, sy] = tela(w.x, w.y);
        const dx = (k === "ArrowRight") - (k === "ArrowLeft"), dy = (k === "ArrowDown") - (k === "ArrowUp");
        if (dx || dy) { moverBranca(sx + dx * passo * T.k * 2, sy + dy * passo * T.k * 2); e.preventDefault(); }
        if (k === "Enter" || k === " ") { e.preventDefault(); confirmarBranca(); }
        return;
      }
      const fino = e.repeat ? 0.02 : 0.006;
      if (k === "ArrowLeft") angulo -= fino;
      else if (k === "ArrowRight") angulo += fino;
      else if (k === "ArrowUp") forca = Math.min(1, forca + 0.05);
      else if (k === "ArrowDown") forca = Math.max(0.05, forca - 0.05);
      else if (k === "Enter" || k === " ") { e.preventDefault(); tacar(); }
    });
    function confirmarBranca() { bolaNaMao = false; atualizarBotoes(); Motor.falar("Agora mire e dê a tacada!"); }

    // ----- Tacada e física -----
    function tacar() {
      if (fase !== "mirar" || bolaNaMao || fim) return;
      const v = 0.6 + forca * 5.4, w = branca();
      animTaco = 0.12;
      batida = { vx: Math.cos(angulo) * v, vy: Math.sin(angulo) * v }; // sai quando o taco encostar na branca
      fase = "rolando"; tacadas++; primeiraBatida = null; encacapadas = []; puxada = 0;
      atualizarBotoes();
    }
    let somT = 0;
    function somBola(v) { const a = performance.now(); if (a - somT < 25) return; somT = a; Motor.ruido({ dur: 0.04, vol: Math.min(0.3, 0.04 + v * 0.06), filtro: "bandpass", freq: 3000 + Math.random() * 800 }); }
    function fisica(dt) {
      const vivas = bolas.filter(b => !b.fora);
      vivas.forEach(b => {
        const v = Math.hypot(b.vx, b.vy);
        if (v > 0) {
          const nv = Math.max(0, v - (0.22 + v * 0.12) * dt); // atrito do pano
          b.vx *= nv / v; b.vy *= nv / v;
          b.x += b.vx * dt; b.y += b.vy * dt; b.giro += v * dt / R * 0.5;
        }
      });
      // bola com bola
      for (let i = 0; i < vivas.length; i++) for (let j = i + 1; j < vivas.length; j++) {
        const a = vivas[i], b = vivas[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d >= 2 * R || d === 0) continue;
        const nx = dx / d, ny = dy / d, sob = (2 * R - d) / 2;
        a.x -= nx * sob; a.y -= ny * sob; b.x += nx * sob; b.y += ny * sob;
        const vr = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (vr <= 0) continue;
        const j2 = vr * 0.97;
        a.vx -= j2 * nx; a.vy -= j2 * ny; b.vx += j2 * nx; b.vy += j2 * ny;
        if (primeiraBatida === null && (a.n === 0 || b.n === 0)) primeiraBatida = a.n === 0 ? b.n : a.n;
        somBola(vr);
      }
      // caçapas e tabelas
      vivas.forEach(b => {
        for (const [px, py, pr] of CACAPAS) if (Math.hypot(b.x - px, b.y - py) < pr) { cair(b); return; }
        let bateu = 0;
        if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * 0.78; bateu = Math.abs(b.vx); }
        if (b.x > L - R) { b.x = L - R; b.vx = -Math.abs(b.vx) * 0.78; bateu = Math.abs(b.vx); }
        if (b.y < R) { b.y = R; b.vy = Math.abs(b.vy) * 0.78; bateu = Math.abs(b.vy); }
        if (b.y > M - R) { b.y = M - R; b.vy = -Math.abs(b.vy) * 0.78; bateu = Math.abs(b.vy); }
        if (bateu > 0.15) Motor.ruido({ dur: 0.05, vol: Math.min(0.15, bateu * 0.05), freq: 500 });
      });
    }
    function cair(b) {
      b.fora = true; b.vx = b.vy = 0;
      encacapadas.push(b.n);
      Motor.ruido({ dur: 0.18, vol: 0.2, freq: 220 });
      Motor.nota(160, { dur: 0.12, tipo: "sine", vol: 0.15 });
    }
    const parado = () => bolas.every(b => b.fora || Math.hypot(b.vx, b.vy) < 0.004);

    // ----- Regras ao fim de cada tacada -----
    const grupoDe = n => (n < 8 ? "lisas" : n > 8 ? "listradas" : "oito");
    const restam = g => bolas.filter(b => !b.fora && b.n !== 0 && grupoDe(b.n) === g).length;
    function fimDaTacada() {
      bolas.forEach(b => { if (!b.fora) { b.vx = b.vy = 0; } });
      const j = jog[vez], outro = jog[1 - vez];
      const caiuBranca = encacapadas.includes(0), caiu8 = encacapadas.includes(8);
      const minhas = encacapadas.filter(n => n !== 0 && n !== 8);
      if (caiuBranca) { const w = branca(); w.fora = false; w.x = L * 0.25; w.y = M / 2; w.vx = w.vy = 0; while (bolas.some(b => b !== w && !b.fora && Math.hypot(b.x - w.x, b.y - w.y) < 2 * R)) w.y += 0.03; }
      if (treino) {
        if (caiuBranca) dizer("A branca caiu! Ela volta para a mesa.");
        else if (encacapadas.length) dizer(encacapadas.length > 1 ? `Encaçapou ${encacapadas.length} bolas!` : "Encaçapou!", true);
        if (bolas.every(b => b.n === 0 || b.fora)) return terminar(0, `Todas as bolas em ${tacadas} tacadas!`);
        return proximaTacada(false);
      }
      // Bola 8
      if (caiu8) {
        const pode = j.grupo && restam(j.grupo) === 0 && !caiuBranca;
        return terminar(pode ? vez : 1 - vez, pode ? `${j.nome} encaçapou a 8!` : `${j.nome} encaçapou a 8 antes da hora...`);
      }
      let falta = caiuBranca || primeiraBatida === null;
      if (!falta && !mesaAberta && j.grupo && primeiraBatida !== null) {
        const g = grupoDe(primeiraBatida);
        if (g !== j.grupo && !(g === "oito" && restam(j.grupo) === 0)) falta = true;
      }
      // a mesa estava aberta: quem encaçapou (sem falta) fica com o grupo
      if (mesaAberta && !falta && minhas.length) {
        const g = grupoDe(minhas[0]);
        if (minhas.every(n => grupoDe(n) === g) || tacadas > 1) {
          j.grupo = g; outro.grupo = g === "lisas" ? "listradas" : "lisas"; mesaAberta = false;
          dizer(`${j.nome} fica com as ${g}!`, true);
        }
      }
      const acertouMinha = !falta && minhas.some(n => mesaAberta || grupoDe(n) === j.grupo);
      if (falta) {
        dizer(caiuBranca ? `Falta! A branca caiu. Bola na mão para ${outro.nome}.` : primeiraBatida === null ? `Falta! Não acertou nenhuma bola. Bola na mão para ${outro.nome}.` : `Falta! Acertou primeiro a bola do outro. Bola na mão para ${outro.nome}.`);
        vez = 1 - vez; bolaNaMao = true;
      } else if (acertouMinha) {
        if (!msg) dizer("Encaçapou! Joga de novo!", true);
      } else { vez = 1 - vez; if (!msg) dizer(`Vez de ${jog[vez].nome}.`); }
      proximaTacada(true);
    }
    function proximaTacada(anunciar) {
      fase = "mirar"; forca = Math.min(forca, 0.7);
      atualizarBotoes();
      if (jog[vez].robo) setTimeout(() => P.vivo() && !fim && jogarRobo(), 1100);
    }
    function dizer(t, festa) {
      msg = { txt: t, t: 2.6 };
      Motor.falar(t);
      if (festa) { Motor.tim(); }
    }
    function terminar(venc, motivo) {
      fim = true; fase = "fim"; atualizarBotoes();
      const titulo = treino ? "Mesa limpa!" : `${jog[venc].nome} venceu!`;
      if (treino || !jog[venc].robo) { Palco.confete(confete, P.W / 2, P.H * 0.35, ["#ffd43b", "#69db7c", "#4dabf7", "#ff8787", "#fff"], 90); Motor.comemorar(P.canvas); }
      if (treino) Placar.recorde("sinuca", "treino", 100 - tacadas);
      Motor.falar(`${motivo} ${treino ? "Muito bem!" : jog[venc].robo ? "O computador venceu. Vamos de novo?" : `Parabéns, ${jog[venc].nome}!`}`);
      setTimeout(() => P.vivo() && P.fim(titulo, treino || !jog[venc].robo ? "🏆" : "🤖", motivo, [
        { rotulo: "🔁 Jogar de novo", principal: true, aoClicar: () => partida(area, op, fid) },
        { rotulo: "⚙️ Trocar opções", aoClicar: () => JOGOS.find(j => j.id === "sinuca").iniciar(area, { id: fid }) },
      ]), 1600);
    }

    // ----- Computador: procura a melhor bola e caçapa (a "bola fantasma") -----
    function caminhoLivre(x1, y1, x2, y2, ignorar) {
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      return bolas.every(b => {
        if (b.fora || ignorar.includes(b)) return true;
        const t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / (len * len)));
        return Math.hypot(x1 + dx * t - b.x, y1 + dy * t - b.y) > 2 * R + 0.004;
      });
    }
    function jogarRobo() {
      const j = jog[vez], w = branca();
      if (bolaNaMao) { // coloca a branca num lugar bom: perto do centro, livre
        for (let k = 0; k < 40; k++) { const x = 0.3 + Math.random() * (L - 0.6), y = 0.2 + Math.random() * (M - 0.4); if (!bolas.some(b => b !== w && !b.fora && Math.hypot(b.x - x, b.y - y) < 4 * R)) { w.x = x; w.y = y; break; } }
        bolaNaMao = false;
      }
      const alvos = bolas.filter(b => !b.fora && b.n !== 0 && (j.grupo ? (restam(j.grupo) ? grupoDe(b.n) === j.grupo : b.n === 8) : b.n !== 8));
      let melhor = null;
      alvos.forEach(b => CACAPAS.forEach(([px, py]) => {
        const dx = px - b.x, dy = py - b.y, d = Math.hypot(dx, dy);
        const gx = b.x - dx / d * 2 * R, gy = b.y - dy / d * 2 * R; // bola fantasma
        const ax = gx - w.x, ay = gy - w.y, da = Math.hypot(ax, ay);
        const corte = Math.acos(Math.max(-1, Math.min(1, (ax * dx + ay * dy) / (da * d))));
        if (corte > 1.25) return;
        if (!caminhoLivre(w.x, w.y, gx, gy, [w, b]) || !caminhoLivre(b.x, b.y, px, py, [b])) return;
        const nota = corte * 2 + da * 0.4 + d * 0.5;
        if (!melhor || nota < melhor.nota) melhor = { nota, ang: Math.atan2(ay, ax), f: Math.min(1, 0.25 + (da + d) * 0.22 + corte * 0.2) };
      }));
      if (!melhor) { const b = alvos.sort((a, c) => Math.hypot(a.x - w.x, a.y - w.y) - Math.hypot(c.x - w.x, c.y - w.y))[0] || bolas.find(x => !x.fora && x.n); melhor = { ang: Math.atan2(b.y - w.y, b.x - w.x), f: 0.55 }; }
      const erro = (Math.random() + Math.random() - 1) * (ERRO[op.nivel] || ERRO.facil);
      // gira o taco devagar até a mira e dá a tacada
      const alvoA = melhor.ang + erro, ini = angulo, dif = Math.atan2(Math.sin(alvoA - ini), Math.cos(alvoA - ini));
      let t = 0;
      const passo = () => {
        if (!P.vivo() || fim) return;
        t += 0.05; angulo = ini + dif * Math.min(1, t);
        forca = 0.3 + (melhor.f - 0.3) * Math.min(1, t);
        if (t < 1) setTimeout(passo, 40); else setTimeout(() => { forca = melhor.f; tacar(); }, 500);
      };
      passo();
    }

    // ----- Desenho -----
    function desenhar(dt) {
      const W = P.W, H = P.H, s = P.esc();
      // fundo: sala escura com luz em cima da mesa
      const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, "#3b2f2a"); g.addColorStop(1, "#120e0c");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // mesa (desenhada deitada; em pé gira)
      ctx.save();
      if (T.rot) { ctx.translate(T.x + T.w, T.y); ctx.rotate(Math.PI / 2); desenharMesa(ctx, { x: 0, y: 0, k: T.k }, op.mesa); }
      else desenharMesa(ctx, { x: T.x, y: T.y, k: T.k }, op.mesa);
      ctx.restore();
      const w = branca(), r = R * T.k;
      // sombras e bolas
      bolas.forEach(b => { if (b.fora) return; const [x, y] = tela(b.x, b.y); ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(x + r * 0.25, y + r * 0.3, r, r * 0.9, 0, 0, 7); ctx.fill(); });
      bolas.forEach(b => { if (b.fora) return; const [x, y] = tela(b.x, b.y); desenharBolaS(ctx, x, y, r, b.n, b.giro); });
      // mira e taco
      if ((fase === "mirar" || animTaco > 0) && !fim && !bolaNaMao) desenharMira();
      if (bolaNaMao && !jog[vez].robo) { const [x, y] = tela(w.x, w.y); ctx.strokeStyle = "#ffd43b"; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, 7); ctx.stroke(); ctx.setLineDash([]); Palco.texto(ctx, "✋ Arraste a branca e toque em ✓", W / 2, T.rot ? 60 : H - 30, Math.min(22 * s, W / 20)); }
      desenharForca();
      placar();
      Palco.desenharConfete(ctx, confete, dt);
      if (msg) { Palco.texto(ctx, msg.txt, W / 2, T.rot ? H * 0.5 : T.y + T.h / 2, Math.min(30 * s, W / 20), "#fff"); msg.t -= dt; if (msg.t <= 0) msg = null; }
      if (pausado) Palco.texto(ctx, "⏸️ Pausa", W / 2, H / 2, 54 * s);
    }
    function desenharMira() {
      const w = branca(), [wx, wy] = tela(w.x, w.y), r = R * T.k;
      const dx = Math.cos(angulo), dy = Math.sin(angulo);
      // primeira bola no caminho (ou a tabela)
      let tMin = Infinity, alvo = null;
      bolas.forEach(b => {
        if (b.fora || b === w) return;
        const ox = b.x - w.x, oy = b.y - w.y, proj = ox * dx + oy * dy;
        if (proj <= 0) return;
        const perp2 = ox * ox + oy * oy - proj * proj, rr = 4 * R * R;
        if (perp2 > rr) return;
        const t = proj - Math.sqrt(rr - perp2);
        if (t < tMin) { tMin = t; alvo = b; }
      });
      const tParede = Math.min(dx > 0 ? (L - R - w.x) / dx : dx < 0 ? (R - w.x) / dx : Infinity, dy > 0 ? (M - R - w.y) / dy : dy < 0 ? (R - w.y) / dy : Infinity);
      const curta = op.guia === "curta";
      const t = Math.min(tMin, tParede, curta ? 0.35 : Infinity);
      const fx = w.x + dx * t, fy = w.y + dy * t, [sx, sy] = tela(fx, fy);
      if (!jog[vez].robo) {
        ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(sx, sy); ctx.stroke(); ctx.setLineDash([]);
        if (alvo && tMin <= t + 1e-6) {
          // bola fantasma e direção da bola atingida
          ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 7); ctx.stroke();
          if (!curta) {
            const nx = alvo.x - fx, ny = alvo.y - fy, nd = Math.hypot(nx, ny), [ax, ay] = tela(alvo.x, alvo.y), [bx, by] = tela(alvo.x + nx / nd * 0.45, alvo.y + ny / nd * 0.45);
            ctx.strokeStyle = "rgba(255,212,59,.9)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
          }
        }
      }
      // taco (recua com a força e avança na tacada)
      const recuo = (animTaco > 0 ? animTaco / 0.12 * forca : forca) * 0.25 + 0.02;
      const [c1x, c1y] = tela(w.x - dx * (R + recuo), w.y - dy * (R + recuo)), [c2x, c2y] = tela(w.x - dx * (R + recuo + 1.45), w.y - dy * (R + recuo + 1.45));
      const gt = ctx.createLinearGradient(c1x, c1y, c2x, c2y);
      gt.addColorStop(0, "#f1f3f5"); gt.addColorStop(0.03, "#2b6cb0"); gt.addColorStop(0.05, "#e9c46a"); gt.addColorStop(0.65, "#c08a50"); gt.addColorStop(0.7, "#222"); gt.addColorStop(1, "#5c3a1e");
      ctx.strokeStyle = gt; ctx.lineCap = "round";
      ctx.lineWidth = Math.max(3, r * 0.55); ctx.beginPath(); ctx.moveTo(c1x, c1y); ctx.lineTo(c2x, c2y); ctx.stroke();
      ctx.lineCap = "butt";
    }
    function desenharForca() {
      if (fim || jog[vez].robo && fase !== "mirar") return;
      const b = barra(), s = P.esc();
      Palco.caixa(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 12, "rgba(0,0,0,.45)");
      const gF = b.vertical ? ctx.createLinearGradient(0, b.y, 0, b.y + b.h) : ctx.createLinearGradient(b.x, 0, b.x + b.w, 0);
      gF.addColorStop(0, "#69db7c"); gF.addColorStop(0.6, "#ffd43b"); gF.addColorStop(1, "#ff6b6b");
      ctx.fillStyle = gF;
      if (b.vertical) ctx.fillRect(b.x, b.y, b.w, b.h * forca); else ctx.fillRect(b.x, b.y, b.w * forca, b.h);
      Palco.texto(ctx, "💪", b.vertical ? b.x + b.w / 2 : b.x - 18, b.vertical ? b.y + b.h + 24 : b.y + b.h / 2, 22 * Math.min(1.3, s));
      if (b.vertical) Palco.texto(ctx, "puxe ⬇️", b.x + b.w / 2, b.y - 20, 13 * Math.min(1.3, s));
    }
    function placar() {
      const s = Math.min(1.4, P.esc()), W = P.W;
      const lin = jog.map((j, i) => {
        const g = j.grupo, falta = g ? restam(g) : null;
        return { j, i, txt: treino ? `🎱 Tacadas: ${tacadas}` : `${j.nome}${g ? ` · ${g === "lisas" ? "lisas" : "listradas"} (${falta === 0 ? "agora a 8!" : falta})` : ""}` };
      });
      // no celular em pé o placar fica embaixo dos botões de cima
      const estreito = W < 700, bw = estreito ? W - 16 : Math.min(W - 150, 560 * s), bx = estreito ? 8 : W / 2 - bw / 2;
      lin.forEach((l, k) => {
        const y = (estreito ? 62 : 8) + k * 30 * s, ativo = l.i === vez && !fim;
        Palco.caixa(ctx, bx, y, bw, 26 * s, 10, ativo ? "rgba(255,212,59,.95)" : "rgba(255,255,255,.85)");
        Palco.texto(ctx, (ativo && !treino ? "▶ " : "") + l.txt, bx + 12, y + 13 * s, 15 * s, "#1d2333", { alinhar: "left", contorno: null });
        // bolinhas que faltam do grupo
        if (l.j.grupo) {
          const ns = bolas.filter(b => !b.fora && b.n && grupoDe(b.n) === l.j.grupo).map(b => b.n);
          ns.forEach((n, i) => desenharBolaS(ctx, bx + bw - 14 - i * 22 * s, y + 13 * s, 9 * s, n));
        }
      });
    }

    if (window.SINUCA_TESTE) window.SINUCA_TESTE = { estado: () => ({ fase, vez, bolaNaMao, batida: !!batida, animTaco, branca: (({ x, y, vx, vy, fora }) => ({ x, y, vx, vy, fora }))(branca()), mov: bolas.filter(b => !b.fora && Math.hypot(b.vx, b.vy) > 0.004).map(b => b.n) }) };
    P.aoMedir = medir;
    medir();
    bolaNaMao = true;
    atualizarBotoes();
    P.rodar(dt => {
      if (!pausado) {
        if (animTaco > 0) animTaco = Math.max(0, animTaco - dt);
        if (animTaco <= 0 && batida) {
          const w = branca(); w.vx = batida.vx; w.vy = batida.vy; batida = null;
          Motor.ruido({ dur: 0.05, vol: 0.12 + forca * 0.2, filtro: "bandpass", freq: 2200 });
        }
        if (fase === "rolando") {
          for (let i = 0; i < 10; i++) fisica(dt / 10);
          tAnim += dt;
          if (parado() && animTaco <= 0 && !batida) { tAnim = 0; fimDaTacada(); }
        }
      }
      desenhar(dt);
    });
    Motor.falar(treino ? "Treino de sinuca! Coloque a branca, mire e dê a tacada!" : `Bola oito! Começa ${jog[0].nome}: coloque a branca atrás da linha e dê a tacada de abertura!`);
    if (jog[vez].robo) jogarRobo();
  }
})();
