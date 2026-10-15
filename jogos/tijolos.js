// Quebra-Tijolos: a bolinha rebate na raquete e quebra os tijolos coloridos lá em cima.
// O ângulo da bolinha depende de onde ela bate na raquete (no meio sobe reto, na ponta sai
// inclinada). Alguns tijolos precisam de 2 batidas. Poderes caem às vezes: 🟩 raquete maior,
// ⚪ bolinha extra e 🐢 bolinha mais lenta. Arrastar o dedo em qualquer lugar move a raquete.
(() => {
  const W = 400;              // largura lógica do campo (a altura se ajusta à tela)
  const COLS = 10, TH = 16;   // tijolos por linha e altura de cada tijolo
  const MARGEM = 8;
  const CORES = ["#e63946", "#f77f00", "#ffd60a", "#2a9d55", "#00b4d8", "#4361ee", "#9b5de5", "#f15bb5"];
  const VELOCIDADES = { devagar: 210, normal: 260, rapido: 320 }; // unidades por segundo na fase 1
  const PODERES = [
    { tipo: "grande", icone: "🟩", cor: "#2a9d55", fala: "Raquete grande!" },
    { tipo: "multi", icone: "⚪", cor: "#4361ee", fala: "Mais bolinhas!" },
    { tipo: "lenta", icone: "🐢", cor: "#f77f00", fala: "Bolinha devagar!" },
  ];
  // Desenhos das fases: cada letra é um tijolo ("1" = 1 batida, "2" = 2 batidas, "." = vazio)
  const FASES = [
    ["1111111111", "1111111111", "1111111111", "1111111111", "1111111111"],
    ["....11....", "...1111...", "..111111..", ".11111111.", "1111111111", "1111111111"],
    ["2.2.2.2.2.", ".1.1.1.1.1", "1.1.1.1.1.", ".1.1.1.1.1", "1.1.1.1.1.", ".2.2.2.2.2"],
    [".11....11.", "1111..1111", "1111111111", "1111111111", ".11111111.", "..111111..", "...1111...", "....11...."],
    ["2222222222", "1........1", "1.111111.1", "1.122221.1", "1.111111.1", "1........1", "2222222222"],
    ["1.1.11.1.1", "2121111212", "1111221111", "1212112121", "2222222222", "1111111111"],
    ["....22....", "...2112...", "..211112..", ".21111112.", "2111111112", ".21111112.", "..211112..", "...2112..."],
  ];
  const recorde = () => { try { return +localStorage.getItem("tijolos-recorde") || 0; } catch (e) { return 0; } };

  JOGOS.push({
    id: "tijolos", teclas: true,
    nome: "Quebra-Tijolos",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="10" fill="#1b263b"/><g stroke="#151515" stroke-width="1.5"><rect x="6" y="8" width="16" height="8" rx="2" fill="#e63946"/><rect x="24" y="8" width="16" height="8" rx="2" fill="#f77f00"/><rect x="42" y="8" width="16" height="8" rx="2" fill="#ffd60a"/><rect x="6" y="18" width="16" height="8" rx="2" fill="#2a9d55"/><rect x="42" y="18" width="16" height="8" rx="2" fill="#00b4d8"/><rect x="15" y="28" width="16" height="8" rx="2" fill="#9b5de5"/></g><path d="M36 28 L30 46" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/><circle cx="29" cy="48" r="4" fill="#fff"/><rect x="16" y="53" width="30" height="6" rx="3" fill="#f77f00"/></svg>',
    faixas: ["6-8", "8-10"],
    iniciar(area) {
      Motor.escolherModo(area, [
        { icone: "🐢", rotulo: "Devagar", iniciar: () => jogo(area, "devagar") },
        { icone: "🐇", rotulo: "Normal", iniciar: () => jogo(area, "normal") },
        { icone: "🚀", rotulo: "Rápido", iniciar: () => jogo(area, "rapido") },
      ]);
    },
  });

  function jogo(area, velocidade) {
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    let tijolos, bolas, poderes, raquete, pontos, fase, vidas, pausado, acabou, ultimoT, grandeAte, lentaAte, faixas, aviso;
    const teclas = {};

    // ---------- Tela ----------
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "tijolos-tela";
    area.appendChild(tela);
    const deitado = tela.clientWidth > tela.clientHeight;
    tela.classList.toggle("deitado", deitado);

    const lateral = document.createElement("div");
    lateral.className = "tijolos-lateral";
    const info = document.createElement("div");
    info.className = "tijolos-info";
    const pausa = document.createElement("button");
    pausa.className = "chip";
    pausa.addEventListener("click", () => alternarPausa());
    const botoes = document.createElement("div");
    botoes.className = "tijolos-botoes";
    botoes.append(pausa, Motor.botaoSom());
    lateral.append(info, botoes);
    const canvas = document.createElement("canvas");
    canvas.className = "tijolos-campo";
    tela.append(lateral, canvas);

    // Tamanho: largura lógica fixa (W); a altura acompanha o formato da tela
    const larg = tela.clientWidth, alt = tela.clientHeight;
    const dispL = deitado ? larg - 2 * 200 : larg - 8;
    const dispA = deitado ? alt - 8 : alt - 100;
    const H = Math.round(Math.max(360, Math.min(540, W * dispA / dispL)));
    const esc = Math.min(dispL / W, dispA / H);
    const dpr = window.devicePixelRatio || 1;
    Object.assign(canvas, { width: Math.round(W * esc * dpr), height: Math.round(H * esc * dpr) });
    Object.assign(canvas.style, { width: Math.round(W * esc) + "px", height: Math.round(H * esc) + "px" });
    const ctx = canvas.getContext("2d");
    ctx.scale(esc * dpr, esc * dpr);
    const TW = (W - 2 * MARGEM) / COLS;
    const TOPO = Math.round(34 + (H - 360) * 0.2); // em campos altos os tijolos descem um pouco
    const RAQ_Y = H - 34, RAQ_H = 12, RAIO = 7;

    // ---------- Regras ----------
    const velBase = () => Math.min(VELOCIDADES[velocidade] + (fase - 1) * 14, VELOCIDADES[velocidade] + 120);
    const velAtual = () => velBase() * (performance.now() < lentaAte ? 0.62 : 1);
    const largRaquete = () => (velocidade === "devagar" ? 84 : 72) * (performance.now() < grandeAte ? 1.6 : 1);

    function montarFase() {
      const desenho = FASES[(fase - 1) % FASES.length];
      const extra = Math.floor((fase - 1) / FASES.length); // depois da última fase, tijolos mais fortes
      tijolos = [];
      desenho.forEach((linha, r) => linha.split("").forEach((ch, c) => {
        if (ch === ".") return;
        const vida = Math.min(3, +ch + extra);
        tijolos.push({ x: MARGEM + c * TW, y: TOPO + r * (TH + 4), w: TW, h: TH, vida, max: vida, cor: CORES[r % CORES.length] });
      }));
      poderes = [];
      novaBolaPresa();
    }
    function novaBolaPresa() {
      bolas = [{ x: raquete.x, y: RAQ_Y - RAIO - 1, vx: 0, vy: 0, presa: true }];
      aviso = "Toque para lançar!";
    }
    function lancar() {
      if (pausado || acabou) return;
      const b = bolas.find(b => b.presa);
      if (!b) return;
      b.presa = false;
      const ang = (Math.random() * 0.5 - 0.25); // um pouquinho inclinada
      const v = velAtual();
      b.vx = v * Math.sin(ang); b.vy = -v * Math.cos(ang);
      aviso = null;
      Motor.nota(520, { dur: 0.08, vol: 0.12 });
    }
    function moverRaquete(x) {
      const meia = largRaquete() / 2;
      raquete.x = Math.max(meia, Math.min(W - meia, x));
      bolas.forEach(b => { if (b.presa) b.x = raquete.x; });
    }

    // A bolinha anda em passinhos curtos (no máximo 3 unidades), primeiro em x e depois em y,
    // para nunca atravessar um tijolo mesmo bem rápida.
    function moverBola(b, dt) {
      const dist = Math.hypot(b.vx, b.vy) * dt;
      const n = Math.max(1, Math.ceil(dist / 3));
      for (let k = 0; k < n; k++) {
        b.x += b.vx * dt / n;
        if (b.x < RAIO) { b.x = RAIO; b.vx = Math.abs(b.vx); quique(); }
        if (b.x > W - RAIO) { b.x = W - RAIO; b.vx = -Math.abs(b.vx); quique(); }
        let t = bater(b);
        if (t) { b.vx = b.x < t.x + t.w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); b.x += Math.sign(b.vx) * 0.5; }
        b.y += b.vy * dt / n;
        if (b.y < RAIO) { b.y = RAIO; b.vy = Math.abs(b.vy); quique(); }
        t = bater(b);
        if (t) { b.vy = b.y < t.y + t.h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); b.y += Math.sign(b.vy) * 0.5; }
        // Raquete
        const meia = largRaquete() / 2;
        if (b.vy > 0 && b.y + RAIO >= RAQ_Y && b.y - RAIO <= RAQ_Y + RAQ_H && b.x >= raquete.x - meia - RAIO && b.x <= raquete.x + meia + RAIO) {
          const rel = Math.max(-1, Math.min(1, (b.x - raquete.x) / meia));
          const ang = rel * 1.05; // até uns 60 graus
          const v = velAtual();
          b.vx = v * Math.sin(ang); b.vy = -v * Math.cos(ang);
          b.y = RAQ_Y - RAIO;
          Motor.nota(330, { dur: 0.06, vol: 0.12, tipo: "square" });
        }
        if (b.y - RAIO > H) { b.fora = true; return; }
      }
    }
    function quique() { Motor.nota(880, { dur: 0.03, vol: 0.05 }); }
    // Procura um tijolo encostando na bolinha; se achar, ele leva uma batida
    function bater(b) {
      for (const t of tijolos) {
        const cx = Math.max(t.x, Math.min(b.x, t.x + t.w)), cy = Math.max(t.y, Math.min(b.y, t.y + t.h));
        if ((b.x - cx) ** 2 + (b.y - cy) ** 2 < RAIO * RAIO) { acertar(t); return t; }
      }
      return null;
    }
    function acertar(t) {
      t.vida--;
      if (t.vida > 0) { Motor.nota(440, { dur: 0.05, vol: 0.12, tipo: "triangle" }); pontos += 5; return; }
      tijolos.splice(tijolos.indexOf(t), 1);
      pontos += 10 * t.max;
      faixas.push({ x: t.x + t.w / 2, y: t.y + t.h / 2, cor: t.cor, ate: performance.now() + 300 });
      Motor.nota(600 + Math.random() * 300, { dur: 0.07, vol: 0.12, tipo: "square" });
      if (Math.random() < 0.14 && poderes.length < 3) poderes.push({ ...Motor.sortear(PODERES), x: t.x + t.w / 2, y: t.y });
      atualizarInfo();
    }
    function pegarPoder(p) {
      const agora = performance.now();
      if (p.tipo === "grande") { grandeAte = agora + 15000; moverRaquete(raquete.x); }
      else if (p.tipo === "lenta") {
        lentaAte = agora + 10000;
        bolas.forEach(b => { if (!b.presa) { const f = velAtual() / Math.hypot(b.vx, b.vy); b.vx *= f; b.vy *= f; } });
      } else if (p.tipo === "multi") {
        const base = bolas.find(b => !b.presa) || bolas[0];
        for (const s of [-1, 1]) {
          if (bolas.length >= 6) break;
          const v = velAtual(), ang = s * 0.6;
          bolas.push({ x: base.presa ? raquete.x : base.x, y: base.presa ? RAQ_Y - RAIO - 1 : base.y, vx: v * Math.sin(ang), vy: -v * Math.cos(ang) });
        }
      }
      pontos += 25;
      Motor.tim();
      Motor.falar(p.fala);
      atualizarInfo();
    }

    function alternarPausa() {
      if (acabou) return;
      pausado = !pausado;
      atualizarInfo();
      if (!pausado) { ultimoT = performance.now(); requestAnimationFrame(laco); } else desenhar();
    }

    // ---------- Laço do jogo ----------
    function laco(t) {
      if (!vivo() || pausado || acabou) return;
      const dt = Math.min(0.05, (t - ultimoT) / 1000);
      ultimoT = t;
      // Teclado: ← → seguradas
      const dirT = (teclas.ArrowRight ? 1 : 0) - (teclas.ArrowLeft ? 1 : 0);
      if (dirT) moverRaquete(raquete.x + dirT * 380 * dt);
      if (raquete.grande !== t < grandeAte) { raquete.grande = t < grandeAte; moverRaquete(raquete.x); }
      // Fim da bolinha lenta: volta à velocidade normal
      if (lentaAte && t >= lentaAte) {
        lentaAte = 0;
        bolas.forEach(b => { if (!b.presa) { const f = velAtual() / Math.hypot(b.vx, b.vy); b.vx *= f; b.vy *= f; } });
      }
      bolas.forEach(b => {
        if (b.presa) return;
        moverBola(b, dt);
        // Evita ficar quicando reto de um lado para o outro para sempre
        if (Math.abs(b.vy) < velAtual() * 0.25) { b.vy = Math.sign(b.vy || -1) * velAtual() * 0.3; const f = velAtual() / Math.hypot(b.vx, b.vy); b.vx *= f; b.vy *= f; }
      });
      bolas = bolas.filter(b => !b.fora);
      poderes.forEach(p => {
        p.y += 110 * dt;
        const meia = largRaquete() / 2;
        if (p.y + 10 >= RAQ_Y && p.y - 10 <= RAQ_Y + RAQ_H && Math.abs(p.x - raquete.x) <= meia + 10) { p.pego = true; pegarPoder(p); }
      });
      poderes = poderes.filter(p => !p.pego && p.y < H + 20);
      if (!bolas.length) {
        vidas--;
        Motor.nota(220, { dur: 0.25, vol: 0.2, tipo: "sawtooth", ate: 110 });
        atualizarInfo();
        if (vidas <= 0) return fim();
        grandeAte = 0; lentaAte = 0; poderes = [];
        novaBolaPresa();
        Motor.falar(vidas === 1 ? "Ops! Última vida!" : "Ops! Tente de novo!");
      }
      if (!tijolos.length) {
        pontos += 100;
        fase++;
        Motor.tim();
        Motor.falar(`${Motor.elogio()} Fase ${fase}!`);
        grandeAte = 0; lentaAte = 0;
        montarFase();
        aviso = `Fase ${fase}! Toque para lançar!`;
        atualizarInfo();
      }
      desenhar(t);
      requestAnimationFrame(laco);
    }

    // ---------- Desenho ----------
    function redondo(x, y, w, h, r) {
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
    }
    function desenhar(t = performance.now()) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#1b263b"); g.addColorStop(1, "#0d1b2a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      tijolos.forEach(b => {
        redondo(b.x + 1.5, b.y, b.w - 3, b.h, 4);
        ctx.fillStyle = b.max > 1 && b.vida === b.max ? "#adb5bd" : b.cor;
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.3)";
        ctx.fillRect(b.x + 4, b.y + 2, b.w - 8, 3);
        if (b.max > 1) {
          ctx.strokeStyle = b.vida === b.max ? "#495057" : "rgba(0,0,0,.45)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          if (b.vida < b.max) { // rachadura
            ctx.moveTo(b.x + b.w * 0.3, b.y); ctx.lineTo(b.x + b.w * 0.45, b.y + b.h * 0.5); ctx.lineTo(b.x + b.w * 0.6, b.y + b.h * 0.4); ctx.lineTo(b.x + b.w * 0.7, b.y + b.h);
          } else { ctx.roundRect ? ctx.roundRect(b.x + 3, b.y + 1.5, b.w - 6, b.h - 3, 3) : ctx.rect(b.x + 3, b.y + 1.5, b.w - 6, b.h - 3); }
          ctx.stroke();
        }
      });
      // Pedacinhos dos tijolos quebrados
      faixas = faixas.filter(f => f.ate > t);
      faixas.forEach(f => {
        const k = 1 - (f.ate - t) / 300;
        ctx.fillStyle = f.cor; ctx.globalAlpha = 1 - k;
        for (let i = 0; i < 6; i++) { const a = i * 1.05; ctx.fillRect(f.x + Math.cos(a) * 22 * k - 2, f.y + Math.sin(a) * 22 * k - 2, 4, 4); }
        ctx.globalAlpha = 1;
      });
      // Poderes caindo
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      poderes.forEach(p => {
        redondo(p.x - 13, p.y - 11, 26, 22, 8);
        ctx.fillStyle = p.cor; ctx.fill();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke();
        ctx.font = "15px sans-serif";
        ctx.fillText(p.icone, p.x, p.y + 1);
      });
      // Raquete
      const w = largRaquete();
      const gr = ctx.createLinearGradient(0, RAQ_Y, 0, RAQ_Y + RAQ_H);
      gr.addColorStop(0, t < grandeAte ? "#52c45f" : "#ffb703"); gr.addColorStop(1, t < grandeAte ? "#2a9d55" : "#f77f00");
      redondo(raquete.x - w / 2, RAQ_Y, w, RAQ_H, 6);
      ctx.fillStyle = gr; ctx.fill();
      // Bolinhas
      bolas.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, RAIO, 0, 7);
        ctx.fillStyle = t < lentaAte ? "#ffd8a8" : "#ffffff"; ctx.fill();
        ctx.beginPath(); ctx.arc(b.x - 2, b.y - 2, 2, 0, 7); ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fill();
      });
      if (pausado && !acabou) faixaTexto("⏸️ Pausa");
      else if (aviso && bolas.some(b => b.presa) && !acabou) faixaTexto(aviso);
    }
    function faixaTexto(txt) {
      const y = H * 0.62;
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(0, y - 22, W, 44);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(txt, W / 2, y);
    }
    function atualizarInfo() {
      info.innerHTML = "";
      [["Pontos", pontos], ["Fase", fase], ["Vidas", "❤️".repeat(Math.max(0, vidas)) || "–"], ["🏆", Math.max(recorde(), pontos)]].forEach(([r, v]) => {
        const d = document.createElement("div");
        d.innerHTML = "<span></span><b></b>";
        d.querySelector("span").textContent = r;
        d.querySelector("b").textContent = v;
        info.appendChild(d);
      });
      pausa.textContent = pausado ? "▶️ Continuar" : "⏸️ Pausar";
    }

    // ---------- Controles ----------
    // Arrastar o dedo em qualquer lugar da tela move a raquete (o quanto o dedo andar);
    // um toque rápido sem arrastar lança a bolinha.
    let toque = null;
    tela.addEventListener("pointerdown", e => {
      if (e.target.closest("button")) return;
      toque = { x: e.clientX, y: e.clientY, inicioX: e.clientX, t: performance.now() };
      try { tela.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    });
    tela.addEventListener("pointermove", e => {
      if (!toque || pausado || acabou) return;
      moverRaquete(raquete.x + (e.clientX - toque.x) / esc * 1.15);
      toque.x = e.clientX;
    });
    tela.addEventListener("pointerup", e => {
      if (!toque) return;
      if (Math.abs(e.clientX - toque.inicioX) < 12 && performance.now() - toque.t < 400) lancar();
      toque = null;
    });
    tela.addEventListener("pointercancel", () => { toque = null; });

    const tecla = e => {
      if (!vivo()) { document.removeEventListener("keydown", tecla); document.removeEventListener("keyup", solta); return; }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); teclas[e.key] = true; }
      else if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") { e.preventDefault(); lancar(); }
      else if (e.key === "p") alternarPausa();
    };
    const solta = e => { teclas[e.key] = false; };
    document.addEventListener("keydown", tecla);
    document.addEventListener("keyup", solta);

    // ---------- Começo e fim ----------
    function comecar() {
      raquete = { x: W / 2 };
      pontos = 0; fase = 1; vidas = 3; pausado = false; acabou = false; grandeAte = 0; lentaAte = 0; faixas = [];
      tela.querySelector(".tijolos-fim")?.remove();
      montarFase();
      atualizarInfo();
      ultimoT = performance.now();
      requestAnimationFrame(laco);
    }

    function fim() {
      acabou = true;
      const novoRecorde = pontos > recorde();
      if (novoRecorde) { try { localStorage.setItem("tijolos-recorde", pontos); } catch (e) { /* ok */ } }
      atualizarInfo();
      desenhar();
      const caixa = document.createElement("div");
      caixa.className = "tijolos-fim";
      caixa.innerHTML = `<div class="titulo-fim"></div><div class="pontos-fim"></div>`;
      caixa.querySelector(".titulo-fim").textContent = novoRecorde ? "🏆 Novo recorde!" : "Fim de jogo!";
      caixa.querySelector(".pontos-fim").textContent = `${pontos} pontos · fase ${fase}`;
      const b = document.createElement("button");
      b.className = "chip executar";
      b.textContent = "🔁 Jogar de novo";
      b.addEventListener("click", comecar);
      caixa.appendChild(b);
      tela.appendChild(caixa);
      if (novoRecorde) { Motor.comemorar(caixa); Motor.tim(); }
      Motor.falar(novoRecorde ? `Novo recorde! ${pontos} pontos!` : `Fim de jogo! Você fez ${pontos} pontos.`);
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.TIJ_TESTE) window.TIJ_TESTE = {
      estado: () => ({ bolas, tijolos: tijolos.length, raquete: raquete.x, largura: largRaquete(), pontos, fase, vidas, acabou, poderes: poderes.length, W, H }),
      moverPara: moverRaquete, lancar,
      quaseLimpar: n => { tijolos.splice(0, Math.max(0, tijolos.length - n)); },
      poder: tipo => pegarPoder(PODERES.find(p => p.tipo === tipo)),
    };

    comecar();
    Motor.falar("Arraste o dedo para mover a raquete e quebre todos os tijolos! Toque para lançar a bolinha.");
  }
})();
