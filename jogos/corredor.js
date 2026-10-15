// Corrida dos Bichos: o bicho escolhido (dino, onça, caramelo ou capivara — desenhados em
// jogos/corredor-personagens.js) corre sozinho e a criança faz ele pular os cactos (segurar = pulo
// mais alto) e abaixar para passar por baixo dos pássaros. Os pontos são os metros corridos mais
// as estrelas pegas no ar; a velocidade aumenta aos poucos. Tem dia e noite.
// Controles: tocar em qualquer lugar da pista pula; botões ⬆️ Pular e ⬇️ Abaixar; no computador,
// espaço/seta para cima pula e seta para baixo abaixa.
(() => {
  // Mundo em "unidades": a pista mostra pelo menos 320 unidades de largura e 210 de altura.
  const DINO_X = 36, DINO_L = 46, DINO_A = 46, DINO_A_BAIXO = 26;
  const PULO = 560;            // velocidade inicial do pulo (unidades/s, para cima)
  const G_SEGURA = 1350;       // gravidade enquanto o dedo segura (pulo mais alto)
  const G = 2300;              // gravidade normal
  const UNID_POR_METRO = 22;
  const VELOCIDADES = { calmo: 165, normal: 215, rapido: 275 };
  const FOLGA = { calmo: 1.35, normal: 1.12, rapido: 1 };  // distância extra entre obstáculos
  const recorde = () => { try { return +localStorage.getItem("corredor-recorde") || 0; } catch (e) { return 0; } };

  JOGOS.push({
    id: "corredor", teclas: true,
    nome: "Corrida dos Bichos",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="50" cy="13" r="7" fill="#ffd166"/><rect x="0" y="50" width="64" height="14" fill="#e9c46a"/><path d="M0 50h64" stroke="#8d6e3f" stroke-width="2"/><g fill="#2a9d55" stroke="#1b6b3a" stroke-width="1.5"><rect x="47" y="30" width="8" height="21" rx="4"/><rect x="41" y="34" width="5" height="10" rx="2.5"/><rect x="56" y="31" width="5" height="9" rx="2.5"/></g><g fill="#43aa8b" stroke="#1d5c4a" stroke-width="1.5"><path d="M8 40c2-9 9-13 16-13h4v-9c0-5 4-8 9-8h4c4 0 6 3 6 6v3c0 2-2 3-4 3h-6v4l4 2-2 3-3-1v7c0 6-4 10-9 11l2 6h-5l-2-5-4 0 1 5h-5l-1-6c-3-1-5-4-6-6z"/></g><circle cx="38" cy="15" r="1.8" fill="#151515"/></svg>',
    faixas: ["5-6", "6-8", "8-10"],
    iniciar(area) { opcoes(area); },
  });

  // ---------- Escolha do personagem e da velocidade (com o bicho correndo na prévia) ----------
  const CHAVE = "corredor-opcoes", PADRAO = { personagem: "dino", modo: "normal" };
  function opcoes(area) {
    let salvo = {};
    try { salvo = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch (e) { /* ok */ }
    let escolhido = (CORREDORES[salvo.personagem] && salvo.personagem) || PADRAO.personagem;
    const previa = document.createElement("canvas");
    previa.className = "corredor-previa";
    const LW = 150, LH = 70, dpr = window.devicePixelRatio || 1;
    Object.assign(previa, { width: LW * 2 * dpr, height: LH * 2 * dpr });
    const pc = previa.getContext("2d");
    const t0 = performance.now();
    (function animar() {
      if (!document.contains(previa) && performance.now() - t0 > 1000) return;
      const t = (performance.now() - t0) / 1000;
      pc.setTransform(2 * dpr, 0, 0, 2 * dpr, 0, 0);
      pc.clearRect(0, 0, LW, LH);
      pc.fillStyle = "#e9c46a"; pc.fillRect(0, LH - 10, LW, 10);
      pc.fillStyle = "#8d6e3f"; pc.fillRect(0, LH - 10, LW, 1.5);
      for (let i = 0; i < 6; i++) pc.fillRect(((i * 31 - t * 90) % LW + LW) % LW, LH - 5 + (i % 2) * 2, 4, 1.5);
      pc.save(); pc.translate(LW / 2 + 4, LH - 10);
      sombra(pc, 0);
      CORREDORES[escolhido].desenhar(pc, { fi: t * 20, correndo: true, t, piscando: t % 3 < 0.12 });
      pc.restore();
      requestAnimationFrame(animar);
    })();
    Motor.telaOpcoes(area, {
      chave: CHAVE, padrao: PADRAO, antes: previa,
      opcoes: [
        { chave: "personagem", titulo: "Quem vai correr?", valores: Object.entries(CORREDORES).map(([id, c]) => [id, c.nome]) },
        { chave: "modo", titulo: "Velocidade", valores: [["calmo", "🐢 Calmo"], ["normal", "🐇 Normal"], ["rapido", "🚀 Rápido"]] },
      ],
      aoMudar: (op, chave) => { if (chave === "personagem") { escolhido = op.personagem; Motor.falar(`Vai correr ${CORREDORES[escolhido].fala}!`); } },
      aoJogar: op => jogo(area, op.modo, CORREDORES[op.personagem] ? op.personagem : "dino"),
    });
  }
  // Sombra no chão: menor e mais clara quanto mais alto o bicho está
  function sombra(c, h) {
    const f = Math.max(0.35, 1 - h / 90);
    c.fillStyle = `rgba(0,0,0,${0.22 * f})`;
    c.beginPath(); c.ellipse(-3, 0, 20 * f, 3 * f, 0, 0, Math.PI * 2); c.fill();
  }

  function jogo(area, modo, personagem = "dino") {
    const bicho = CORREDORES[personagem];
    let fi = 0; // fase da passada
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    let fase, dino, obst, estrelinhas, nuvens, metros, estrelas, distProx, ultimoT, pausado, segurando, abaixar,
      pularAte, marco, avisouPassaro, fimEm, tempo, rodando = false;

    // ---------- Tela ----------
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "arcade-tela";
    area.appendChild(tela);
    const topo = document.createElement("div");
    topo.className = "arcade-topo";
    const info = document.createElement("div");
    info.className = "arcade-info";
    const pausa = document.createElement("button");
    pausa.className = "chip";
    pausa.setAttribute("aria-label", "Pausar");
    pausa.addEventListener("click", () => alternarPausa());
    topo.append(info, pausa, Motor.botaoSom());
    const meio = document.createElement("div");
    meio.className = "arcade-meio";
    const palco = document.createElement("div");
    palco.className = "arcade-palco";
    const canvas = document.createElement("canvas");
    palco.appendChild(canvas);
    const controles = document.createElement("div");
    controles.className = "arcade-controles";
    meio.append(palco, controles);
    tela.append(topo, meio);
    const ctx = canvas.getContext("2d");

    // Tamanho: a escala garante pelo menos 320 unidades de largura (para ver os obstáculos chegando)
    let largC = 0, altC = 0, escala = 1, W = 360, H = 210, CHAO = 180;
    function medir() {
      const deitado = tela.clientWidth > tela.clientHeight;
      tela.classList.toggle("deitado", deitado);
      largC = palco.clientWidth; altC = palco.clientHeight;
      if (!largC || !altC) return;
      const dpr = window.devicePixelRatio || 1;
      Object.assign(canvas, { width: Math.round(largC * dpr), height: Math.round(altC * dpr) });
      Object.assign(canvas.style, { width: largC + "px", height: altC + "px" });
      escala = Math.min(altC / 210, largC / 320);
      W = largC / escala; H = altC / escala;
      CHAO = H - Math.min(40, H * 0.16);
      ctx.setTransform(dpr * escala, 0, 0, dpr * escala, 0, 0);
      if (fase) desenhar();
    }
    const obs = new ResizeObserver(() => { if (vivo()) medir(); else obs.disconnect(); });
    obs.observe(palco);

    // ---------- Regras ----------
    const velocidade = () => VELOCIDADES[modo] * (1 + Math.min(0.85, metros / 1800));
    const pontos = () => Math.floor(metros) + estrelas * 10;
    const noChao = () => dino.h <= 0;
    // Caixa de colisão do dino (um pouco menor que o desenho, para ser justo)
    function caixaDino() {
      const a = dino.abaixado ? DINO_A_BAIXO : DINO_A;
      return { x1: DINO_X + 10, x2: DINO_X + DINO_L - 8, b: dino.h + 3, t: dino.h + a - 7 };
    }

    function criarObstaculo() {
      const v = velocidade();
      const podePassaro = metros > 300 && Math.random() < Math.min(0.4, 0.2 + metros / 4000);
      let o;
      if (podePassaro) {
        // Alturas: baixo (pular), alto (passa por baixo correndo) e, depois de 500 m, médio (abaixar!)
        const alturas = [3, 64];
        if (metros > 500) alturas.push(30, 30);
        o = { tipo: "passaro", x: W + 30, w: 42, a: 30, base: Motor.sortear(alturas), extra: 25 };
      } else {
        // Cactos: 1 a 3 juntos (grupos maiores só mais longe), pequenos ou grandes
        const maxN = metros < 150 ? 1 : metros < 600 ? 2 : 3;
        const n = Motor.aleatorio(1, maxN);
        const grande = Math.random() < (metros < 100 ? 0.25 : 0.5);
        const cw = grande ? 22 : 18;
        o = { tipo: "cacto", x: W + 30, n, w: n * cw, a: grande ? 46 : 32, base: 0, extra: 0, cw };
      }
      obst.push(o);
      // Distância até o próximo: cresce com a velocidade (o pulo cobre mais chão quando corre mais)
      distProx = o.w + v * (0.78 + Math.random() * 0.9) * FOLGA[modo] + 70;
      // Às vezes uma estrela no meio do caminho, no ar
      if (Math.random() < 0.4) {
        estrelinhas.push({ x: o.x + o.w + distProx * 0.5, h: Motor.aleatorio(38, 78), pega: false });
      }
    }

    function apertarPular() {
      if (fase === "pronto") { iniciarCorrida(); }
      if (fase !== "correndo" || pausado) return;
      segurando = true;
      if (noChao()) pular();
      else pularAte = tempo + 0.14; // apertou um pouquinho antes de cair: pula ao tocar o chão
    }
    function soltarPular() { segurando = false; }
    function pular() {
      dino.vy = PULO; dino.h = 0.01; dino.noPulo = 0; pularAte = 0;
      Motor.nota(380, { dur: 0.14, tipo: "square", vol: 0.06, ate: 760 });
    }

    function passo(dt) {
      tempo += dt;
      const v = velocidade();
      const dx = v * dt;
      metros += dx / UNID_POR_METRO;
      // Dino
      dino.abaixado = abaixar;
      fi += dt * velocidade() * 0.1; // a passada acompanha a velocidade
      if (!noChao() || dino.vy > 0) {
        dino.noPulo += dt;
        let g = segurando && dino.vy > 0 && dino.noPulo < 0.4 ? G_SEGURA : G;
        if (abaixar) g *= 2.4; // abaixar no ar faz descer rápido
        dino.vy -= g * dt;
        dino.h += dino.vy * dt;
        if (dino.h <= 0) { dino.h = 0; dino.vy = 0; if (pularAte && tempo <= pularAte) pular(); }
      }
      // Obstáculos e estrelas
      obst.forEach(o => { o.x -= dx + (o.extra || 0) * dt; });
      obst = obst.filter(o => o.x + o.w > -20);
      estrelinhas.forEach(s => { s.x -= dx; });
      estrelinhas = estrelinhas.filter(s => s.x > -20 && !s.pega);
      distProx -= dx;
      if (distProx <= 0) criarObstaculo();
      // Nuvens (bem devagar: paralaxe)
      nuvens.forEach(n => { n.x -= dx * n.vel; if (n.x < -60) { n.x = W + Motor.aleatorio(0, 120); n.y = Motor.aleatorio(10, Math.max(20, CHAO - 120)); } });
      // Colisões
      const d = caixaDino();
      for (const o of obst) {
        const ins = o.tipo === "cacto" ? 4 : 5;
        const c = { x1: o.x + ins, x2: o.x + o.w - ins, b: o.base + ins, t: o.base + o.a - ins };
        if (d.x1 < c.x2 && d.x2 > c.x1 && d.b < c.t && d.t > c.b) return bater();
      }
      for (const s of estrelinhas) {
        if (d.x1 - 6 < s.x + 10 && d.x2 + 6 > s.x - 10 && d.b - 6 < s.h + 10 && d.t + 6 > s.h - 10) {
          s.pega = true; estrelas++;
          Motor.nota(988, { dur: 0.12, tipo: "triangle", vol: 0.15 });
          Motor.nota(1319, { dur: 0.2, tipo: "triangle", vol: 0.15, inicio: 0.08 });
        }
      }
      // Marcos e avisos
      const m = Math.floor(metros / 500);
      if (m > marco) { marco = m; Motor.tim(); Motor.falar(`${m * 500} metros!`); }
      if (!avisouPassaro && metros > 300) { avisouPassaro = true; Motor.falar("Cuidado com os pássaros!"); }
      if (metros > 500 && avisouPassaro === true) { avisouPassaro = 2; Motor.depois(() => Motor.falar("Abaixe para passar por baixo dos pássaros!", { naFila: true }), 1200); }
    }

    function laco(t) {
      if (!vivo()) { rodando = false; return; }
      if (pausado || fase !== "correndo") { rodando = false; desenhar(); return; }
      const dt = Math.min(0.05, (t - ultimoT) / 1000); // limite: aba voltou do fundo, celular lento
      ultimoT = t;
      passo(dt);
      desenhar();
      atualizarInfo();
      requestAnimationFrame(laco);
    }
    function rodar() {
      if (rodando) return;
      rodando = true;
      ultimoT = performance.now();
      requestAnimationFrame(laco);
    }

    // ---------- Desenho ----------
    const mistura = (a, b, f) => {
      const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16));
      return `rgb(${pa.map((x, i) => Math.round(x + (pb[i] - x) * f)).join(",")})`;
    };
    // 0 = dia, 1 = noite. A noite chega perto do fim de cada 900 m.
    function noite() {
      const p = (metros % 900) / 900;
      if (p < 0.62) return 0;
      if (p < 0.68) return (p - 0.62) / 0.06;
      if (p < 0.94) return 1;
      return 1 - (p - 0.94) / 0.06;
    }
    const ceuEstrelas = Array.from({ length: 40 }, () => [Math.random(), Math.random() * 0.7, Math.random() * 1.2 + 0.4]);
    function emoji(txt, x, y, tam, viraX = false, sx = 1, sy = 1, rot = 0) {
      ctx.save();
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      ctx.scale(viraX ? -sx : sx, sy);
      ctx.font = `${tam}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    }

    function desenhar() {
      if (!largC) return;
      const n = noite();
      const yc = h => CHAO - h; // altura acima do chão → y na tela
      // Céu
      const ceu = ctx.createLinearGradient(0, 0, 0, CHAO);
      ceu.addColorStop(0, mistura("62b6f0", "0b1b3a", n));
      ceu.addColorStop(1, mistura("d8f1ff", "34507f", n));
      ctx.fillStyle = ceu;
      ctx.fillRect(0, 0, W, CHAO);
      if (n > 0) {
        ctx.fillStyle = `rgba(255,255,255,${0.9 * n})`;
        ceuEstrelas.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * W, y * CHAO, r, 0, 7); ctx.fill(); });
      }
      // Sol e lua
      ctx.globalAlpha = 1 - n;
      ctx.fillStyle = "#ffd166";
      ctx.beginPath(); ctx.arc(W - 46, 40, 20, 0, 7); ctx.fill();
      ctx.globalAlpha = n;
      ctx.fillStyle = "#f1f1d8";
      ctx.beginPath(); ctx.arc(W - 46, 40, 16, 0, 7); ctx.fill();
      ctx.fillStyle = mistura("62b6f0", "0b1b3a", n);
      ctx.beginPath(); ctx.arc(W - 39, 35, 14, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
      // Morros lá longe (paralaxe lenta)
      const desl = metros * UNID_POR_METRO;
      ctx.fillStyle = mistura("9fd8a4", "24425a", n);
      ctx.beginPath(); ctx.moveTo(0, CHAO);
      for (let x = 0; x <= W + 10; x += 10) {
        const X = x + desl * 0.12;
        ctx.lineTo(x, CHAO - 26 - 18 * Math.sin(X / 70) - 10 * Math.sin(X / 23 + 1));
      }
      ctx.lineTo(W, CHAO); ctx.fill();
      // Nuvens
      ctx.fillStyle = `rgba(255,255,255,${0.9 - 0.6 * n})`;
      nuvens.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 11 * c.s, 0, 7); ctx.arc(c.x + 14 * c.s, c.y - 6 * c.s, 14 * c.s, 0, 7);
        ctx.arc(c.x + 30 * c.s, c.y, 11 * c.s, 0, 7); ctx.rect(c.x, c.y, 30 * c.s, 11 * c.s); ctx.fill();
      });
      // Chão (areia com pedrinhas que andam junto com a pista)
      ctx.fillStyle = mistura("e9c46a", "5a5a7a", n);
      ctx.fillRect(0, CHAO, W, H - CHAO);
      ctx.fillStyle = mistura("8d6e3f", "2c2c44", n);
      ctx.fillRect(0, CHAO, W, 2);
      for (let i = 0; i < 26; i++) {
        const x = ((i * 53 - desl) % (W + 60) + W + 60) % (W + 60) - 30;
        ctx.fillRect(x, CHAO + 6 + (i * 7) % (H - CHAO - 10), 3 + (i % 3) * 3, 2);
      }
      // Estrelas para pegar
      estrelinhas.forEach(s => emoji("⭐", s.x, yc(s.h), 22, false, 1 + 0.1 * Math.sin(tempo * 8), 1 + 0.1 * Math.sin(tempo * 8)));
      // Obstáculos
      obst.forEach(o => {
        if (o.tipo === "cacto") {
          for (let i = 0; i < o.n; i++) emoji("🌵", o.x + o.cw * (i + 0.5), yc(o.a / 2 + 1), o.a * 1.12);
        } else {
          const asa = 0.75 + 0.25 * Math.abs(Math.sin(tempo * 9));
          emoji("🦅", o.x + o.w / 2, yc(o.base + o.a / 2), 38, false, 1, asa);
        }
      });
      // O bicho escolhido (desenhado com as pernas animadas) e a sombra dele no chão
      ctx.save();
      ctx.translate(DINO_X + DINO_L / 2, CHAO);
      sombra(ctx, dino.h);
      ctx.translate(0, -dino.h);
      const pisca = fase !== "fim" && tempo % 3.4 > 3.28;
      bicho.desenhar(ctx, { fi, t: tempo, correndo: fase === "correndo", noAr: !noChao(), abaixado: dino.abaixado && noChao(), morto: fase === "fim", piscando: pisca });
      ctx.restore();
      if (fase === "fim") emoji("💥", DINO_X + DINO_L + 2, yc(dino.h + 30), 30);
      // Mensagens
      if (fase === "pronto") faixa("👆 Toque para começar!");
      else if (pausado) faixa("⏸️ Pausa");
    }
    function faixa(txt) {
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(0, CHAO / 2 - 26, W, 52);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.min(28, W / 14)}px "Comic Sans MS", sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(txt, W / 2, CHAO / 2 + 1);
    }

    let infoAnt = "";
    function atualizarInfo() {
      const txt = `📏 ${Math.floor(metros)} m|⭐ ${estrelas}|🏆 ${Math.max(recorde(), fase === "fim" ? pontos() : 0)}`;
      if (txt === infoAnt) return;
      infoAnt = txt;
      info.innerHTML = "";
      txt.split("|").forEach(p => { const s = document.createElement("span"); s.textContent = p; info.appendChild(s); });
      pausa.textContent = pausado ? "▶️" : "⏸️";
    }

    function alternarPausa() {
      if (fase !== "correndo") return;
      pausado = !pausado;
      segurando = false; abaixar = false;
      pausa.textContent = pausado ? "▶️" : "⏸️";
      pausa.setAttribute("aria-label", pausado ? "Continuar" : "Pausar");
      if (pausado) desenhar(); else rodar();
    }

    // ---------- Controles ----------
    const botao = (rotulo, aoApertar, aoSoltar) => {
      const b = document.createElement("button");
      b.className = "arcade-botao";
      b.textContent = rotulo;
      b.addEventListener("pointerdown", e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } aoApertar(); });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => b.addEventListener(ev, aoSoltar));
      b.addEventListener("contextmenu", e => e.preventDefault());
      return b;
    };
    controles.append(
      botao("⬆️ Pular", apertarPular, soltarPular),
      botao("⬇️ Abaixar", () => { if (fase === "pronto") iniciarCorrida(); abaixar = true; }, () => { abaixar = false; }));

    // Tocar em qualquer lugar da pista = pular (ou recomeçar, na tela de fim)
    canvas.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (fase === "fim") { if (performance.now() - fimEm > 1000) comecar(); return; }
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      apertarPular();
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => canvas.addEventListener(ev, soltarPular));
    canvas.addEventListener("contextmenu", e => e.preventDefault());

    // Teclado (computador)
    const teclaDesce = e => {
      if (!vivo()) { tirarTeclas(); return; }
      if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        if (e.repeat) return;
        if (fase === "fim") { if (performance.now() - fimEm > 1000) comecar(); return; }
        apertarPular();
      } else if (e.key === "ArrowDown") { e.preventDefault(); if (fase === "pronto") iniciarCorrida(); abaixar = true; }
      else if (e.key === "p" || e.key === "Escape") alternarPausa();
    };
    const teclaSobe = e => {
      if (!vivo()) { tirarTeclas(); return; }
      if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") soltarPular();
      else if (e.key === "ArrowDown") abaixar = false;
    };
    const escondeu = () => { if (!vivo()) { tirarTeclas(); return; } if (document.hidden && fase === "correndo" && !pausado) alternarPausa(); };
    function tirarTeclas() {
      document.removeEventListener("keydown", teclaDesce);
      document.removeEventListener("keyup", teclaSobe);
      document.removeEventListener("visibilitychange", escondeu);
    }
    document.addEventListener("keydown", teclaDesce);
    document.addEventListener("keyup", teclaSobe);
    document.addEventListener("visibilitychange", escondeu);

    // ---------- Começo e fim ----------
    function comecar() {
      fase = "pronto";
      dino = { h: 0, vy: 0, noPulo: 0, abaixado: false };
      obst = []; estrelinhas = [];
      nuvens = Array.from({ length: 4 }, (_, i) => ({ x: i * 110 + 40, y: 20 + (i * 37) % 70, s: 0.8 + (i % 3) * 0.25, vel: 0.12 + (i % 2) * 0.08 }));
      metros = 0; estrelas = 0; distProx = 260; pausado = false; segurando = false; abaixar = false;
      pularAte = 0; marco = 0; avisouPassaro = false; tempo = 0; infoAnt = "";
      tela.querySelector(".arcade-fim")?.remove();
      atualizarInfo();
      desenhar();
    }
    function iniciarCorrida() {
      if (fase !== "pronto") return;
      fase = "correndo";
      rodar();
    }

    function bater() {
      fase = "fim";
      fimEm = performance.now();
      segurando = false; abaixar = false;
      Motor.ruido({ dur: 0.35, vol: 0.35, freq: 700 });
      Motor.nota(300, { dur: 0.4, tipo: "sawtooth", vol: 0.08, ate: 90 });
      const p = pontos();
      const novoRecorde = p > recorde();
      if (novoRecorde) { try { localStorage.setItem("corredor-recorde", p); } catch (e) { /* ok */ } }
      desenhar();
      atualizarInfo();
      const caixa = document.createElement("div");
      caixa.className = "arcade-fim";
      caixa.innerHTML = `<div class="titulo-fim"></div><div class="pontos-fim"></div><div class="detalhe-fim"></div>`;
      caixa.querySelector(".titulo-fim").textContent = novoRecorde ? "🏆 Novo recorde!" : "💥 Ops!";
      caixa.querySelector(".pontos-fim").textContent = `${p} pontos`;
      caixa.querySelector(".detalhe-fim").textContent = `📏 ${Math.floor(metros)} m · ⭐ ${estrelas} · 🏆 ${recorde()}`;
      const b = document.createElement("button");
      b.className = "chip executar";
      b.textContent = "🔁 Jogar de novo";
      b.addEventListener("click", comecar);
      caixa.appendChild(b);
      tela.appendChild(caixa);
      if (novoRecorde) { Motor.comemorar(caixa); Motor.tim(); }
      Motor.falar(novoRecorde ? `Novo recorde! ${p} pontos!` : `Ops! Você correu ${Math.floor(metros)} metros!`);
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.CORREDOR_TESTE) {
      window.CORREDOR_TESTE = {
        estado: () => ({ fase, dino: { ...dino }, obst: obst.map(o => ({ ...o })), metros, estrelas, pontos: pontos(), v: velocidade(), W, CHAO, escala, DINO_X, DINO_L }),
        apertar: apertarPular, soltar: soltarPular, abaixar: v => { abaixar = v; }, comecar, iniciar: iniciarCorrida,
        irPara: m => { metros = m; },
      };
    }

    medir();
    comecar();
    Motor.falar(`Toque para ${bicho.fala} pular os cactos!`);
  }
})();
