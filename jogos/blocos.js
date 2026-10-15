// Encaixa Blocos (estilo Tetris): peças de 4 quadradinhos caem; girar e mover para completar
// linhas, que somem e dão pontos. A cada 10 linhas o nível sobe e as peças caem mais rápido.
// Controles: botões grandes, gestos no tabuleiro (tocar gira, arrastar move, arrastar para
// baixo derruba) e setas do teclado no computador.
(() => {
  const COLS = 10, LINHAS = 20;
  const PECAS = {
    I: { m: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], cor: "#00b4d8" },
    O: { m: [[1, 1], [1, 1]], cor: "#ffd60a" },
    T: { m: [[0, 1, 0], [1, 1, 1], [0, 0, 0]], cor: "#9b5de5" },
    S: { m: [[0, 1, 1], [1, 1, 0], [0, 0, 0]], cor: "#2a9d55" },
    Z: { m: [[1, 1, 0], [0, 1, 1], [0, 0, 0]], cor: "#e63946" },
    J: { m: [[1, 0, 0], [1, 1, 1], [0, 0, 0]], cor: "#277da1" },
    L: { m: [[0, 0, 1], [1, 1, 1], [0, 0, 0]], cor: "#f77f00" },
  };
  const PONTOS_LINHAS = [0, 100, 300, 500, 800];
  const VELOCIDADES = { devagar: 1000, normal: 750, rapido: 480 };
  const girarM = m => m[0].map((_, i) => m.map(l => l[i]).reverse()); // sentido do relógio
  const recorde = () => { try { return +localStorage.getItem("blocos-recorde") || 0; } catch (e) { return 0; } };

  JOGOS.push({
    id: "blocos",
    nome: "Encaixa Blocos",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><g stroke="#151515" stroke-width="2"><rect x="8" y="40" width="12" height="12" rx="2" fill="#2a9d55"/><rect x="20" y="40" width="12" height="12" rx="2" fill="#2a9d55"/><rect x="20" y="28" width="12" height="12" rx="2" fill="#2a9d55"/><rect x="32" y="28" width="12" height="12" rx="2" fill="#2a9d55"/><rect x="32" y="40" width="12" height="12" rx="2" fill="#f77f00"/><rect x="44" y="40" width="12" height="12" rx="2" fill="#f77f00"/><rect x="44" y="28" width="12" height="12" rx="2" fill="#f77f00"/><rect x="44" y="16" width="12" height="12" rx="2" fill="#f77f00"/><rect x="14" y="4" width="12" height="12" rx="2" fill="#9b5de5"/><rect x="26" y="4" width="12" height="12" rx="2" fill="#9b5de5"/><rect x="38" y="4" width="12" height="12" rx="2" fill="#9b5de5"/><rect x="26" y="16" width="12" height="12" rx="2" fill="#9b5de5"/></g></svg>',
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
    let grade, peca, proxima, saco, pontos, linhas, nivel, acumulado, ultimoT, pausado, acabou, travaEm, apagando;

    // ---------- Tela ----------
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "blocos-tela";
    area.appendChild(tela);
    const deitado = tela.clientWidth > tela.clientHeight;
    tela.classList.toggle("deitado", deitado);

    const lateral = document.createElement("div");
    lateral.className = "blocos-lateral";
    const info = document.createElement("div");
    info.className = "blocos-info";
    const proxCanvas = document.createElement("canvas");
    proxCanvas.className = "blocos-proxima";
    const pausa = document.createElement("button");
    pausa.className = "chip";
    pausa.addEventListener("click", () => { if (!acabou) { pausado = !pausado; atualizarInfo(); if (!pausado) { ultimoT = performance.now(); requestAnimationFrame(laco); } } });
    lateral.append(proxCanvas, info, pausa, Motor.botaoSom());

    const canvas = document.createElement("canvas");
    canvas.className = "blocos-tabuleiro";
    const controles = document.createElement("div");
    controles.className = "blocos-controles";
    tela.append(lateral, canvas, controles);

    // Tamanho das casas: o tabuleiro ocupa o espaço que sobra
    const larg = tela.clientWidth, alt = tela.clientHeight;
    const cel = Math.floor(deitado
      ? Math.min((alt - 8) / LINHAS, (larg - 380) / COLS)
      : Math.min((alt - 200) / LINHAS, (larg - 120) / COLS));
    const dpr = window.devicePixelRatio || 1;
    Object.assign(canvas, { width: COLS * cel * dpr, height: LINHAS * cel * dpr });
    Object.assign(canvas.style, { width: COLS * cel + "px", height: LINHAS * cel + "px" });
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const pc = Math.max(14, Math.floor(cel * 0.8));
    Object.assign(proxCanvas, { width: 4 * pc * dpr, height: 4 * pc * dpr });
    Object.assign(proxCanvas.style, { width: 4 * pc + "px", height: 4 * pc + "px" });
    const pctx = proxCanvas.getContext("2d");
    pctx.scale(dpr, dpr);

    // ---------- Regras ----------
    function sortear() {
      if (!saco.length) saco = Motor.embaralhar(Object.keys(PECAS)); // as 7 aparecem antes de repetir
      const t = saco.pop();
      return { t, m: PECAS[t].m, x: Math.floor((COLS - PECAS[t].m[0].length) / 2), y: t === "I" ? -1 : 0 };
    }
    const cabe = (m, x, y) => m.every((l, i) => l.every((v, j) => !v || (x + j >= 0 && x + j < COLS && y + i < LINHAS && (y + i < 0 || !grade[y + i][x + j]))));

    function nova() {
      peca = proxima || sortear();
      proxima = sortear();
      travaEm = 0;
      if (!cabe(peca.m, peca.x, peca.y)) fim();
      desenharProxima();
    }

    function mover(dx) {
      if (!ativo()) return;
      if (cabe(peca.m, peca.x + dx, peca.y)) { peca.x += dx; adiarTrava(); desenhar(); }
    }
    function girar() {
      if (!ativo()) return;
      const m = girarM(peca.m);
      // Se bater na parede ou em outra peça, tenta empurrar um pouco para o lado ou para cima
      for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]]) {
        if (cabe(m, peca.x + dx, peca.y + dy)) { peca.m = m; peca.x += dx; peca.y += dy; adiarTrava(); Motor.nota(660, { dur: 0.05, vol: 0.08 }); desenhar(); return; }
      }
    }
    function descer() {
      if (!ativo()) return false;
      if (cabe(peca.m, peca.x, peca.y + 1)) { peca.y++; travaEm = 0; return true; }
      return false;
    }
    function derrubar() {
      if (!ativo()) return;
      let n = 0;
      while (cabe(peca.m, peca.x, peca.y + 1)) { peca.y++; n++; }
      pontos += 2 * n;
      travar();
    }
    // Encostou no chão: dá um tempinho para ainda deslizar a peça antes de travar
    function adiarTrava() { if (travaEm) travaEm = performance.now(); }

    function travar() {
      peca.m.forEach((l, i) => l.forEach((v, j) => { if (v && peca.y + i >= 0) grade[peca.y + i][peca.x + j] = peca.t; }));
      if (peca.y < 0 && peca.m.some((l, i) => l.some(v => v) && peca.y + i < 0)) return fim();
      Motor.ploc();
      const cheias = grade.map((l, i) => (l.every(Boolean) ? i : -1)).filter(i => i >= 0);
      if (cheias.length) {
        // As linhas completas piscam e somem
        apagando = { linhas: cheias, ate: performance.now() + 260 };
        pontos += PONTOS_LINHAS[cheias.length] * nivel;
        linhas += cheias.length;
        Motor.tim();
        if (cheias.length === 4) Motor.falar("Quatro linhas! Incrível!");
        const novoNivel = Math.floor(linhas / 10) + 1;
        if (novoNivel > nivel) { nivel = novoNivel; Motor.depois(() => Motor.falar(`Nível ${nivel}!`), 400); }
        peca = null;
      } else nova();
      atualizarInfo();
    }

    const ativo = () => peca && !pausado && !acabou && !apagando;
    const intervalo = () => Math.max(70, VELOCIDADES[velocidade] * Math.pow(0.85, nivel - 1));

    // ---------- Laço do jogo ----------
    function laco(t) {
      if (!vivo() || pausado || acabou) return;
      const dt = t - ultimoT;
      ultimoT = t;
      if (apagando) {
        if (t >= apagando.ate) {
          grade = grade.filter((_, i) => !apagando.linhas.includes(i));
          while (grade.length < LINHAS) grade.unshift(Array(COLS).fill(null));
          apagando = null;
          nova();
        }
      } else if (peca) {
        acumulado += dt;
        if (acumulado >= intervalo()) {
          acumulado = 0;
          if (!descer()) {
            if (!travaEm) travaEm = t;
          }
        }
        if (travaEm && !cabe(peca.m, peca.x, peca.y + 1) && t - travaEm > 450) travar();
        else if (travaEm && cabe(peca.m, peca.x, peca.y + 1)) travaEm = 0;
      }
      desenhar();
      requestAnimationFrame(laco);
    }

    // ---------- Desenho ----------
    function bloco(c, x, y, tam, cor, fantasma = false) {
      const p = tam * 0.08, r = tam * 0.18;
      c.beginPath();
      c.roundRect ? c.roundRect(x + p, y + p, tam - 2 * p, tam - 2 * p, r) : c.rect(x + p, y + p, tam - 2 * p, tam - 2 * p);
      if (fantasma) { c.strokeStyle = cor; c.lineWidth = 2; c.globalAlpha = 0.6; c.stroke(); c.globalAlpha = 1; return; }
      c.fillStyle = cor;
      c.fill();
      c.fillStyle = "rgba(255,255,255,.28)"; // brilho em cima
      c.fillRect(x + p * 2, y + p * 2, tam - 4 * p, tam * 0.18);
    }
    function desenhar() {
      ctx.fillStyle = "#1b263b";
      ctx.fillRect(0, 0, COLS * cel, LINHAS * cel);
      ctx.strokeStyle = "rgba(255,255,255,.05)";
      for (let i = 1; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i * cel, 0); ctx.lineTo(i * cel, LINHAS * cel); ctx.stroke(); }
      for (let i = 1; i < LINHAS; i++) { ctx.beginPath(); ctx.moveTo(0, i * cel); ctx.lineTo(COLS * cel, i * cel); ctx.stroke(); }
      const piscar = apagando && Math.floor(performance.now() / 60) % 2;
      grade.forEach((l, i) => l.forEach((t, j) => {
        if (!t) return;
        bloco(ctx, j * cel, i * cel, cel, apagando && apagando.linhas.includes(i) && piscar ? "#ffffff" : PECAS[t].cor);
      }));
      if (peca) {
        // Sombra: onde a peça vai cair
        let gy = peca.y;
        while (cabe(peca.m, peca.x, gy + 1)) gy++;
        peca.m.forEach((l, i) => l.forEach((v, j) => { if (v && gy + i >= 0) bloco(ctx, (peca.x + j) * cel, (gy + i) * cel, cel, PECAS[peca.t].cor, true); }));
        peca.m.forEach((l, i) => l.forEach((v, j) => { if (v && peca.y + i >= 0) bloco(ctx, (peca.x + j) * cel, (peca.y + i) * cel, cel, PECAS[peca.t].cor); }));
      }
      if (pausado && !acabou) {
        ctx.fillStyle = "rgba(0,0,0,.55)";
        ctx.fillRect(0, 0, COLS * cel, LINHAS * cel);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${cel * 1.2}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("⏸️ Pausa", COLS * cel / 2, LINHAS * cel / 2);
      }
    }
    function desenharProxima() {
      pctx.clearRect(0, 0, 4 * pc, 4 * pc);
      const m = proxima.m, ox = (4 - m[0].length) / 2, oy = (4 - m.length) / 2;
      m.forEach((l, i) => l.forEach((v, j) => { if (v) bloco(pctx, (ox + j) * pc, (oy + i) * pc, pc, PECAS[proxima.t].cor); }));
    }
    function atualizarInfo() {
      info.innerHTML = "";
      [["Pontos", pontos], ["Linhas", linhas], ["Nível", nivel], ["🏆", Math.max(recorde(), pontos)]].forEach(([r, v]) => {
        const d = document.createElement("div");
        d.innerHTML = "<span></span><b></b>";
        d.querySelector("span").textContent = r;
        d.querySelector("b").textContent = v;
        info.appendChild(d);
      });
      pausa.textContent = pausado ? "▶️ Continuar" : "⏸️ Pausar";
    }

    // ---------- Controles ----------
    // Botões: segurar ⬅️ ➡️ ⬇️ repete o movimento
    const botao = (icone, rotulo, acao, repete) => {
      const b = document.createElement("button");
      b.className = "blocos-botao";
      b.textContent = icone;
      b.setAttribute("aria-label", rotulo);
      let timer = null;
      const parar = () => { clearTimeout(timer); clearInterval(timer); timer = null; };
      b.addEventListener("pointerdown", e => {
        e.preventDefault();
        acao();
        if (repete) timer = setTimeout(() => { timer = setInterval(() => { if (vivo()) acao(); else parar(); }, 70); }, 220);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, parar));
      return b;
    };
    // Como nos jogos de celular: polegar esquerdo move (⬅️ ⬇️ ➡️), polegar direito gira e derruba.
    // Em pé ficam nos cantos de baixo; deitado, um de cada lado do tabuleiro.
    const padEsq = document.createElement("div"), padDir = document.createElement("div");
    padEsq.className = "blocos-pad esquerdo";
    padDir.className = "blocos-pad direito";
    const bGirar = botao("", "Girar", girar);
    bGirar.classList.add("girar");
    bGirar.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M37 26A13 13 0 1 1 24 13" fill="none" stroke="#9b5de5" stroke-width="6" stroke-linecap="round"/><polygon points="33,13 22,4.5 22,21.5" fill="#9b5de5" stroke="#9b5de5" stroke-width="2" stroke-linejoin="round"/></svg>';
    padEsq.append(
      botao("⬅️", "Esquerda", () => mover(-1), true),
      botao("⬇️", "Descer", () => { if (descer()) { pontos++; desenhar(); } }, true),
      botao("➡️", "Direita", () => mover(1), true));
    padDir.append(botao("⏬", "Derrubar", derrubar), bGirar);
    controles.append(padEsq, padDir);

    // Gestos no tabuleiro: tocar gira, arrastar para o lado move, arrastar para baixo derruba
    let toque = null;
    canvas.addEventListener("pointerdown", e => { toque = { x: e.clientX, y: e.clientY, t: performance.now(), movX: 0, desceu: 0 }; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } });
    canvas.addEventListener("pointermove", e => {
      if (!toque) return;
      const dx = e.clientX - toque.x - toque.movX * cel;
      if (Math.abs(dx) > cel * 0.9) { const s = Math.sign(dx); mover(s); toque.movX += s; }
      const dy = e.clientY - toque.y - toque.desceu * cel;
      if (dy > cel * 0.9 && Math.abs(e.clientX - toque.x) < cel * 1.5) { if (descer()) { pontos++; desenhar(); } toque.desceu++; }
    });
    canvas.addEventListener("pointerup", e => {
      if (!toque) return;
      const dx = e.clientX - toque.x, dy = e.clientY - toque.y, dt = performance.now() - toque.t;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 300) girar();
      else if (dy > cel * 3 && dt < 250 && !toque.movX) derrubar(); // puxada rápida para baixo
      toque = null;
    });
    canvas.addEventListener("pointercancel", () => { toque = null; });

    // Teclado (computador)
    const teclas = e => {
      if (!vivo()) { document.removeEventListener("keydown", teclas); return; }
      const acoes = { ArrowLeft: () => mover(-1), ArrowRight: () => mover(1), ArrowUp: girar, ArrowDown: () => { if (descer()) { pontos++; desenhar(); } }, " ": derrubar };
      if (acoes[e.key]) { e.preventDefault(); acoes[e.key](); }
    };
    document.addEventListener("keydown", teclas);

    // ---------- Começo e fim ----------
    function comecar() {
      grade = Array.from({ length: LINHAS }, () => Array(COLS).fill(null));
      saco = []; proxima = null; pontos = 0; linhas = 0; nivel = 1; acumulado = 0; pausado = false; acabou = false; apagando = null;
      tela.querySelector(".blocos-fim")?.remove();
      nova();
      atualizarInfo();
      ultimoT = performance.now();
      requestAnimationFrame(laco);
    }

    function fim() {
      acabou = true;
      peca = null;
      const novoRecorde = pontos > recorde();
      if (novoRecorde) { try { localStorage.setItem("blocos-recorde", pontos); } catch (e) { /* ok */ } }
      atualizarInfo();
      desenhar();
      const caixa = document.createElement("div");
      caixa.className = "blocos-fim";
      caixa.innerHTML = `<div class="titulo-fim"></div><div class="pontos-fim"></div>`;
      caixa.querySelector(".titulo-fim").textContent = novoRecorde ? "🏆 Novo recorde!" : "Fim de jogo!";
      caixa.querySelector(".pontos-fim").textContent = `${pontos} pontos · ${linhas} linhas`;
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
    if (window.BLOCOS_TESTE) window.BLOCOS_TESTE = { estado: () => ({ grade, peca, pontos, linhas, acabou }), mover, girar, derrubar };

    comecar();
    Motor.falar("Gire e encaixe as peças para completar linhas! Toque no tabuleiro para girar e arraste para mover.");
  }
})();
