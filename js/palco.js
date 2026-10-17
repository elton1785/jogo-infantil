// Palco de tela inteira para os jogos desenhados em canvas (boliche, sinuca, pingue-pongue,
// pescaria, avião, supermercado): o desenho ocupa a tela toda, com ⏸️ e 🔊 no canto de cima à
// direita (a seta de voltar do app fica por cima, no canto esquerdo). O jogo desenha o placar no
// próprio canvas, em coordenadas de CSS (P.W × P.H); o tamanho acompanha a tela.
// P.controles: camada para botões de toque. P.fim(...): janela de fim de partida.
const Palco = (() => {
  const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

  function criar(area, { classe = "", aoPausar } = {}) {
    area.innerHTML = "";
    const tela = el("div", "palco-tela " + classe);
    const canvas = el("canvas", "palco-canvas");
    const topo = el("div", "palco-topo");
    const pausa = el("button", "chip", "⏸️");
    pausa.setAttribute("aria-label", "Pausar");
    if (aoPausar) pausa.addEventListener("click", aoPausar); else pausa.hidden = true;
    topo.append(pausa, Motor.botaoSom());
    const controles = el("div", "palco-controles");
    tela.append(canvas, controles, topo);
    area.appendChild(tela);
    const ctx = canvas.getContext("2d");
    const sessao = Motor.sessaoAtual();
    const P = {
      tela, canvas, ctx, controles, pausa, W: 0, H: 0, dpr: 1,
      vivo: () => sessao === Motor.sessaoAtual() && document.contains(tela),
      // escala dos textos e do placar: cresce em tela grande (PC/TV), diminui no celular
      esc: () => Math.max(0.75, Math.min(2.2, Math.min(P.W, P.H * 1.7) / 680)),
      aoMedir: null,
    };
    const medir = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      P.W = tela.clientWidth; P.H = tela.clientHeight; P.dpr = dpr;
      canvas.width = Math.round(P.W * dpr); canvas.height = Math.round(P.H * dpr);
      Object.assign(canvas.style, { width: P.W + "px", height: P.H + "px" });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      tela.classList.toggle("deitado", P.W > P.H);
      if (P.aoMedir) P.aoMedir();
    };
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(tela);
    // laço de desenho: chama passo(dt) a cada quadro enquanto o jogo estiver aberto
    P.rodar = passo => {
      let ultimo = performance.now();
      const laco = t => {
        if (!P.vivo()) { obs.disconnect(); return; }
        const dt = Math.min(0.05, (t - ultimo) / 1000);
        ultimo = t;
        ctx.setTransform(P.dpr, 0, 0, P.dpr, 0, 0);
        passo(dt);
        requestAnimationFrame(laco);
      };
      requestAnimationFrame(laco);
    };
    // botão de toque grande; `segurar`: chama aoApertar(true/false) ao apertar e soltar
    P.botao = (rotulo, aoApertar, { classe: c = "", segurar = false } = {}) => {
      const b = el("button", "palco-botao " + c);
      b.innerHTML = rotulo;
      if (segurar) {
        const liga = v => { b.classList.toggle("apertado", v); aoApertar(v); };
        b.addEventListener("pointerdown", e => { e.preventDefault(); Motor.audio(); try { b.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } liga(true); });
        ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => b.addEventListener(ev, () => liga(false)));
      } else b.addEventListener("click", () => { Motor.audio(); aoApertar(); });
      b.addEventListener("contextmenu", e => e.preventDefault());
      return b;
    };
    // janela de fim: título, medalha, detalhe (texto ou elemento) e botões [{ rotulo, aoClicar, principal }]
    P.fim = (titulo, medalha, detalhe, botoes) => {
      const caixa = el("div", "arcade-fim palco-fim");
      caixa.append(el("div", "medalha-fim", medalha), el("div", "titulo-fim", titulo));
      if (typeof detalhe === "string") caixa.appendChild(el("div", "detalhe-fim", detalhe));
      else if (detalhe) caixa.appendChild(detalhe);
      botoes.forEach(({ rotulo, aoClicar, principal }) => {
        const b = el("button", "chip" + (principal ? " executar" : ""), rotulo);
        b.addEventListener("click", () => { caixa.remove(); aoClicar(); });
        caixa.appendChild(b);
      });
      tela.appendChild(caixa);
      return caixa;
    };
    // teclas do jogo (setas, Enter...): fn(e, desceu) — tira o ouvinte quando o jogo fecha
    P.teclas = fn => {
      const d = e => { if (!P.vivo()) return tirar(); fn(e, true); };
      const s = e => { if (!P.vivo()) return tirar(); fn(e, false); };
      const tirar = () => { document.removeEventListener("keydown", d); document.removeEventListener("keyup", s); };
      document.addEventListener("keydown", d);
      document.addEventListener("keyup", s);
    };
    return P;
  }

  // Textos com contorno (placar e avisos desenhados no canvas)
  function texto(c, t, x, y, tam, cor = "#fff", { alinhar = "center", contorno = "rgba(10,15,30,.8)", base = "middle", peso = "bold" } = {}) {
    c.font = `${peso} ${tam}px Fredoka, sans-serif`;
    c.textAlign = alinhar; c.textBaseline = base; c.lineJoin = "round";
    if (contorno) { c.lineWidth = Math.max(2, tam * 0.16); c.strokeStyle = contorno; c.strokeText(t, x, y); }
    c.fillStyle = cor; c.fillText(t, x, y);
  }
  // Caixa arredondada escura (fundo do placar)
  function caixa(c, x, y, w, h, r, cor = "rgba(15,20,35,.78)") {
    c.fillStyle = cor; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  }
  // Confete simples: lista de partículas, atualizada e desenhada por quem chama
  function confete(lista, x, y, cores, n = 60, forca = 1) {
    for (let i = 0; i < n; i++) lista.push({ x, y, vx: (Math.random() - 0.5) * 520 * forca, vy: -(120 + Math.random() * 380) * forca, r: Math.random() * 6, vr: (Math.random() - 0.5) * 12, cor: Motor.sortear(cores), w: 6 + Math.random() * 6, h: 3 + Math.random() * 3, vida: 1.6 + Math.random() });
  }
  function desenharConfete(c, lista, dt) {
    for (let i = lista.length - 1; i >= 0; i--) {
      const p = lista[i];
      p.vy += 520 * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.vida -= dt;
      if (p.vida <= 0) { lista.splice(i, 1); continue; }
      c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.globalAlpha = Math.min(1, p.vida * 2);
      c.fillStyle = p.cor; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
    }
  }
  // Leitura do 1º controle de videogame (null se não houver)
  const pad = (i = 0) => (typeof Controle !== "undefined" ? Controle.pads()[i] || null : null);

  return { criar, texto, caixa, confete, desenharConfete, pad };
})();
