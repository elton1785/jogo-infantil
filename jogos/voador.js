// Passarinho Voador: cada toque faz o passarinho bater as asas e subir; a gravidade puxa para
// baixo. É preciso passar pelas aberturas entre os troncos verdes: cada passagem vale 1 ponto.
// Encostar no tronco, no chão ou no teto termina a partida. Medalhas: 🥉 10, 🥈 20, 🥇 40.
// Controles: tocar em qualquer lugar da tela; no computador, espaço ou seta para cima.
(() => {
  // Mundo em "unidades": pelo menos 270 de largura e 400 de altura visíveis.
  const PASSARO_X = 80, RAIO = 13;
  const G = 1150, BATER = 340, QUEDA_MAX = 520;
  const TRONCO_L = 54;
  const DIFICULDADES = {
    facil: { abertura: 158, vel: 105, espaco: 215, salto: 120 },
    normal: { abertura: 132, vel: 130, espaco: 200, salto: 170 },
    dificil: { abertura: 112, vel: 155, espaco: 190, salto: 230 },
  };
  const MEDALHAS = [[40, "🥇", "ouro"], [20, "🥈", "prata"], [10, "🥉", "bronze"]];
  const recorde = () => { try { return +localStorage.getItem("voador-recorde") || 0; } catch (e) { return 0; } };

  JOGOS.push({
    id: "voador", teclas: true,
    nome: "Passarinho Voador",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="10" fill="#8fd3f4"/><rect x="0" y="54" width="64" height="10" fill="#7cc36a"/><g fill="#2a9d55" stroke="#1b6b3a" stroke-width="2"><rect x="44" y="-2" width="14" height="20"/><rect x="41" y="14" width="20" height="7" rx="2"/><rect x="44" y="42" width="14" height="14"/><rect x="41" y="38" width="20" height="7" rx="2"/></g><ellipse cx="22" cy="30" rx="13" ry="11" fill="#ffd60a" stroke="#c99700" stroke-width="2"/><path d="M12 30c-4-6 2-9 8-5" fill="#ffe45c" stroke="#c99700" stroke-width="2"/><circle cx="27" cy="26" r="2.2" fill="#151515"/><path d="M34 29l7 2-7 3z" fill="#f77f00"/></svg>',
    faixas: ["6-8", "8-10"],
    iniciar(area) {
      Motor.escolherModo(area, [
        { icone: "🐢", rotulo: "Fácil", iniciar: () => jogo(area, "facil") },
        { icone: "🐇", rotulo: "Normal", iniciar: () => jogo(area, "normal") },
        { icone: "🚀", rotulo: "Difícil", iniciar: () => jogo(area, "dificil") },
      ]);
    },
  });

  function jogo(area, dificuldade) {
    const D = DIFICULDADES[dificuldade];
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    let fase, ave, troncos, nuvens, pontos, distProx, ultimoT, pausado, fimEm, tempo, desl, rodando = false;

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
    pausa.textContent = "⏸️";
    pausa.setAttribute("aria-label", "Pausar");
    pausa.addEventListener("click", () => alternarPausa());
    topo.append(info, pausa, Motor.botaoSom());
    const meio = document.createElement("div");
    meio.className = "arcade-meio";
    const palco = document.createElement("div");
    palco.className = "arcade-palco";
    const canvas = document.createElement("canvas");
    palco.appendChild(canvas);
    meio.appendChild(palco);
    tela.append(topo, meio);
    const ctx = canvas.getContext("2d");

    let largC = 0, altC = 0, escala = 1, W = 270, H = 400, CHAO = 350;
    function medir() {
      tela.classList.toggle("deitado", tela.clientWidth > tela.clientHeight);
      largC = palco.clientWidth; altC = palco.clientHeight;
      if (!largC || !altC) return;
      const dpr = window.devicePixelRatio || 1;
      Object.assign(canvas, { width: Math.round(largC * dpr), height: Math.round(altC * dpr) });
      Object.assign(canvas.style, { width: largC + "px", height: altC + "px" });
      escala = Math.min(altC / 400, largC / 270);
      W = largC / escala; H = altC / escala;
      CHAO = H - 46;
      ctx.setTransform(dpr * escala, 0, 0, dpr * escala, 0, 0);
      if (fase === "pronto") ave.y = CHAO * 0.45;
      if (fase) desenhar();
    }
    const obs = new ResizeObserver(() => { if (vivo()) medir(); else obs.disconnect(); });
    obs.observe(palco);

    // ---------- Regras ----------
    function novoTronco(x = W + 20) {
      const meio = D.abertura / 2, min = 50 + meio, max = CHAO - 40 - meio;
      const ant = troncos.length ? troncos[troncos.length - 1].c : CHAO * 0.45;
      // A abertura nova não fica longe demais da anterior (dá tempo de subir/descer)
      const c = Math.max(min, Math.min(max, ant + (Math.random() * 2 - 1) * D.salto));
      troncos.push({ x, c, passou: false });
      distProx = D.espaco + TRONCO_L;
    }

    function bater() {
      if (fase === "pronto") { fase = "voando"; rodar(); }
      if (fase !== "voando" || pausado) return;
      ave.vy = -BATER;
      Motor.nota(520, { dur: 0.1, tipo: "triangle", vol: 0.1, ate: 900 });
    }

    function passo(dt) {
      tempo += dt;
      if (fase === "caindo") {
        // Depois de bater: cai até o chão e então mostra o fim
        ave.vy = Math.min(QUEDA_MAX * 1.4, ave.vy + G * 1.4 * dt);
        ave.y += ave.vy * dt;
        if (ave.y + RAIO >= CHAO) { ave.y = CHAO - RAIO; mostrarFim(); }
        return;
      }
      const dx = D.vel * dt;
      desl += dx;
      ave.vy = Math.min(QUEDA_MAX, ave.vy + G * dt);
      ave.y += ave.vy * dt;
      troncos.forEach(t => { t.x -= dx; });
      troncos = troncos.filter(t => t.x + TRONCO_L > -10);
      distProx -= dx;
      if (distProx <= 0) novoTronco();
      nuvens.forEach(n => { n.x -= dx * n.vel; if (n.x < -70) { n.x = W + Motor.aleatorio(0, 80); n.y = Motor.aleatorio(20, Math.max(30, CHAO * 0.5)); } });
      // Pontos: passou do tronco
      troncos.forEach(t => {
        if (!t.passou && t.x + TRONCO_L < PASSARO_X - RAIO) {
          t.passou = true; pontos++;
          Motor.ploc();
          atualizarInfo();
          const m = MEDALHAS.find(([n]) => n === pontos);
          if (m) { Motor.tim(); Motor.falar(`${pontos} pontos! Medalha de ${m[2]}!`); }
        }
      });
      // Colisões: chão, teto e troncos (o círculo do passarinho é um pouco menor que o desenho)
      if (ave.y + RAIO >= CHAO) { ave.y = CHAO - RAIO; return perder(); }
      if (ave.y - RAIO <= 0) return perder();
      for (const t of troncos) {
        const meio = D.abertura / 2;
        for (const [y1, y2] of [[-100, t.c - meio], [t.c + meio, CHAO]]) {
          const px = Math.max(t.x + 2, Math.min(PASSARO_X, t.x + TRONCO_L - 2));
          const py = Math.max(y1, Math.min(ave.y, y2));
          if ((PASSARO_X - px) ** 2 + (ave.y - py) ** 2 < (RAIO - 1) ** 2) return perder();
        }
      }
    }

    function laco(t) {
      if (!vivo()) { rodando = false; return; }
      if (pausado || (fase !== "voando" && fase !== "caindo")) { rodando = false; desenhar(); return; }
      let dt = Math.min(0.05, (t - ultimoT) / 1000);
      ultimoT = t;
      // Passos pequenos: a física fica igual em telas de 60 Hz ou 120 Hz
      while (dt > 0 && (fase === "voando" || fase === "caindo")) { const p = Math.min(dt, 1 / 120); passo(p); dt -= p; }
      desenhar();
      if (fase === "voando" || fase === "caindo") requestAnimationFrame(laco); else rodando = false;
    }
    function rodar() {
      if (rodando) return;
      rodando = true;
      ultimoT = performance.now();
      requestAnimationFrame(laco);
    }
    // Antes do primeiro toque o passarinho fica flutuando no lugar
    function lacoPronto(t) {
      if (!vivo() || fase !== "pronto") return;
      tempo = t / 1000;
      ave.y = CHAO * 0.45 + Math.sin(tempo * 4) * 6;
      desenhar();
      requestAnimationFrame(lacoPronto);
    }

    // ---------- Desenho ----------
    function emoji(txt, x, y, tam, rot = 0, viraX = false) {
      ctx.save();
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      if (viraX) ctx.scale(-1, 1);
      ctx.font = `${tam}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, 0, 0);
      ctx.restore();
    }
    function morros(cor, base, amp, onda, vel, fase0) {
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.moveTo(0, CHAO);
      for (let x = 0; x <= W + 10; x += 8) {
        const X = x + desl * vel;
        ctx.lineTo(x, CHAO - base - amp * Math.sin(X / onda + fase0) - amp * 0.4 * Math.sin(X / (onda * 0.37) + 2));
      }
      ctx.lineTo(W, CHAO); ctx.fill();
    }
    function tronco(x, y1, y2, ponta) {
      // ponta: "baixo" (tronco de cima) ou "cima" (tronco de baixo)
      const g = ctx.createLinearGradient(x, 0, x + TRONCO_L, 0);
      g.addColorStop(0, "#3fae5a"); g.addColorStop(0.35, "#7ddc7a"); g.addColorStop(1, "#24803c");
      ctx.fillStyle = g;
      ctx.strokeStyle = "#145a2a"; ctx.lineWidth = 2;
      ctx.fillRect(x + 4, y1, TRONCO_L - 8, y2 - y1);
      ctx.strokeRect(x + 4, y1, TRONCO_L - 8, y2 - y1);
      const yp = ponta === "baixo" ? y2 - 20 : y1;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, yp, TRONCO_L, 20, 5) : ctx.rect(x, yp, TRONCO_L, 20);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.25)";
      ctx.fillRect(x + 10, Math.max(y1, -10), 5, y2 - Math.max(y1, -10) - (ponta === "baixo" ? 22 : 0));
    }
    function desenhar() {
      if (!largC) return;
      const ceu = ctx.createLinearGradient(0, 0, 0, CHAO);
      ceu.addColorStop(0, "#5ec2f2"); ceu.addColorStop(1, "#d9f4ff");
      ctx.fillStyle = ceu;
      ctx.fillRect(0, 0, W, CHAO);
      // Sol
      ctx.fillStyle = "rgba(255,230,120,.45)";
      ctx.beginPath(); ctx.arc(W - 50, 60, 34, 0, 7); ctx.fill();
      ctx.fillStyle = "#ffd166";
      ctx.beginPath(); ctx.arc(W - 50, 60, 24, 0, 7); ctx.fill();
      // Nuvens
      ctx.fillStyle = "rgba(255,255,255,.92)";
      nuvens.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 13 * c.s, 0, 7); ctx.arc(c.x + 16 * c.s, c.y - 8 * c.s, 16 * c.s, 0, 7);
        ctx.arc(c.x + 34 * c.s, c.y, 13 * c.s, 0, 7); ctx.rect(c.x, c.y, 34 * c.s, 13 * c.s); ctx.fill();
      });
      // Morros (dois planos, paralaxe)
      morros("#a8dcae", 70, 22, 90, 0.15, 0);
      morros("#7cc775", 30, 16, 60, 0.35, 1.7);
      // Troncos
      const meio = D.abertura / 2;
      troncos.forEach(t => { tronco(t.x, -10, t.c - meio, "baixo"); tronco(t.x, t.c + meio, CHAO, "cima"); });
      // Chão com grama e listras que andam
      ctx.fillStyle = "#e3c67a";
      ctx.fillRect(0, CHAO, W, H - CHAO);
      ctx.fillStyle = "#5cb85c";
      ctx.fillRect(0, CHAO, W, 10);
      ctx.fillStyle = "#4a9e4a";
      for (let x = -((desl) % 24); x < W; x += 24) { ctx.beginPath(); ctx.moveTo(x, CHAO + 10); ctx.lineTo(x + 12, CHAO + 10); ctx.lineTo(x + 6, CHAO + 4); ctx.fill(); }
      ctx.fillStyle = "#c9a85c";
      for (let x = -((desl) % 40); x < W; x += 40) ctx.fillRect(x, CHAO + 22, 18, 3);
      // Passarinho: inclina para cima ao subir e para baixo ao cair; o emoji olha para a esquerda
      const rot = fase === "pronto" ? 0 : Math.max(-0.45, Math.min(1.2, ave.vy / 480));
      emoji("🐤", PASSARO_X, ave.y, 36, rot, true);
      // Mensagens e pontos grandes
      if (fase === "voando" || fase === "caindo" || fase === "fim") {
        ctx.font = `bold 44px "Comic Sans MS", sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "top";
        ctx.lineWidth = 6; ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.fillStyle = "#fff";
        ctx.strokeText(pontos, W / 2, 16); ctx.fillText(pontos, W / 2, 16);
      }
      if (fase === "pronto") faixa("👆 Toque para voar!");
      else if (pausado) faixa("⏸️ Pausa");
    }
    function faixa(txt) {
      const y = CHAO * 0.25;
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(0, y - 26, W, 52);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.min(28, W / 11)}px "Comic Sans MS", sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(txt, W / 2, y + 1);
    }

    function atualizarInfo() {
      info.innerHTML = "";
      [`🌳 ${pontos}`, `🏆 ${Math.max(recorde(), fase === "fim" ? pontos : 0)}`].forEach(p => { const s = document.createElement("span"); s.textContent = p; info.appendChild(s); });
    }

    function alternarPausa() {
      if (fase !== "voando") return;
      pausado = !pausado;
      pausa.textContent = pausado ? "▶️" : "⏸️";
      pausa.setAttribute("aria-label", pausado ? "Continuar" : "Pausar");
      if (pausado) desenhar(); else rodar();
    }

    // ---------- Controles ----------
    canvas.addEventListener("pointerdown", e => {
      e.preventDefault();
      if (fase === "fim") { if (performance.now() - fimEm > 1000) comecar(); return; }
      if (pausado) { alternarPausa(); return; } // tocar na tela também continua
      bater();
    });
    canvas.addEventListener("contextmenu", e => e.preventDefault());
    const tecla = e => {
      if (!vivo()) { tirarTeclas(); return; }
      if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") {
        e.preventDefault();
        if (e.repeat) return;
        if (fase === "fim") { if (performance.now() - fimEm > 1000) comecar(); return; }
        if (pausado) { alternarPausa(); return; }
        bater();
      } else if (e.key === "p" || e.key === "Escape") alternarPausa();
    };
    const escondeu = () => { if (!vivo()) { tirarTeclas(); return; } if (document.hidden && fase === "voando" && !pausado) alternarPausa(); };
    function tirarTeclas() {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("visibilitychange", escondeu);
    }
    document.addEventListener("keydown", tecla);
    document.addEventListener("visibilitychange", escondeu);

    // ---------- Começo e fim ----------
    function comecar() {
      fase = "pronto";
      ave = { y: CHAO * 0.45, vy: 0 };
      troncos = [];
      nuvens = Array.from({ length: 5 }, (_, i) => ({ x: i * 90 + 20, y: 30 + (i * 53) % 140, s: 0.7 + (i % 3) * 0.25, vel: 0.15 + (i % 2) * 0.1 }));
      pontos = 0; pausado = false; tempo = 0; desl = 0;
      // Troncos já na tela (em telas largas o primeiro não demora a chegar)
      let x = PASSARO_X + 300;
      for (; x < W + 20; x += D.espaco + TRONCO_L) novoTronco(x);
      distProx = x - (W + 20);
      pausa.textContent = "⏸️";
      tela.querySelector(".arcade-fim")?.remove();
      atualizarInfo();
      desenhar();
      requestAnimationFrame(lacoPronto);
    }

    function perder() {
      fase = "caindo";
      fimEm = performance.now();
      Motor.ruido({ dur: 0.25, vol: 0.3, freq: 900 });
      Motor.nota(500, { dur: 0.5, tipo: "triangle", vol: 0.12, ate: 120 });
      if (ave.vy < 0) ave.vy = 0;
    }

    function mostrarFim() {
      fase = "fim";
      fimEm = performance.now();
      const novoRecorde = pontos > recorde();
      if (novoRecorde) { try { localStorage.setItem("voador-recorde", pontos); } catch (e) { /* ok */ } }
      atualizarInfo();
      desenhar();
      const m = MEDALHAS.find(([n]) => pontos >= n);
      const caixa = document.createElement("div");
      caixa.className = "arcade-fim";
      caixa.innerHTML = `<div class="titulo-fim"></div><div class="medalha-fim"></div><div class="pontos-fim"></div><div class="detalhe-fim"></div>`;
      caixa.querySelector(".titulo-fim").textContent = novoRecorde ? "🏆 Novo recorde!" : "Ops! Fim de voo!";
      caixa.querySelector(".medalha-fim").textContent = m ? m[1] : "🐤";
      caixa.querySelector(".pontos-fim").textContent = `${pontos} ${pontos === 1 ? "ponto" : "pontos"}`;
      const prox = [...MEDALHAS].reverse().find(([n]) => pontos < n);
      caixa.querySelector(".detalhe-fim").textContent = `🏆 Recorde: ${recorde()}` + (prox ? ` · ${prox[1]} com ${prox[0]}` : "");
      const b = document.createElement("button");
      b.className = "chip executar";
      b.textContent = "🔁 Jogar de novo";
      b.addEventListener("click", comecar);
      caixa.appendChild(b);
      tela.appendChild(caixa);
      if (novoRecorde || m) { Motor.comemorar(caixa); Motor.tim(); }
      Motor.falar(m ? `Você ganhou a medalha de ${m[2]}! ${pontos} pontos!` : novoRecorde ? `Novo recorde! ${pontos} pontos!` : `Ops! Você fez ${pontos} ${pontos === 1 ? "ponto" : "pontos"}. Tente de novo!`);
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.VOADOR_TESTE) {
      window.VOADOR_TESTE = {
        estado: () => ({ fase, ave: { ...ave }, troncos: troncos.map(t => ({ ...t })), pontos, W, H, CHAO, abertura: D.abertura, PASSARO_X, RAIO, TRONCO_L }),
        bater, comecar,
      };
    }

    fase = null;
    ave = { y: 150, vy: 0 };
    medir();
    comecar();
    Motor.falar("Toque para voar! Passe entre os troncos.");
  }
})();
