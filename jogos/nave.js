// Nave Espacial: a nave 🚀 lá embaixo defende o planeta dos alienígenas, que descem em bloco
// andando de um lado para o outro e atiram de vez em quando. Os escudos protegem, mas se
// gastam. De vez em quando passa uma nave-mãe 🛸 lá em cima que vale muitos pontos.
// A nave atira sozinha (para os pequenos) ou pelo botão 🔥; move arrastando o dedo,
// pelos botões ⬅️ ➡️ (segurar) ou pelas setas do teclado.
(() => {
  const W = 400; // largura lógica do campo (a altura se ajusta à tela)
  const TIPOS = [
    { emoji: "👽", pontos: 30 },
    { emoji: "👾", pontos: 20 },
    { emoji: "🐙", pontos: 10 },
  ];
  const recorde = () => { try { return +localStorage.getItem("nave-recorde") || 0; } catch (e) { return 0; } };

  JOGOS.push({
    id: "nave", teclas: true,
    nome: "Nave Espacial",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="10" fill="#10172a"/><g fill="#fff"><circle cx="10" cy="40" r="1.2"/><circle cx="54" cy="30" r="1.2"/><circle cx="20" cy="26" r="1"/><circle cx="48" cy="48" r="1"/></g><g fill="#7ae582" stroke="#151515" stroke-width="1.5"><path d="M12 8 h14 v4 h4 v6 h-22 v-6 h4z"/><path d="M36 8 h14 v4 h4 v6 h-22 v-6 h4z"/></g><g fill="#151515"><rect x="15" y="12" width="3" height="3"/><rect x="21" y="12" width="3" height="3"/><rect x="39" y="12" width="3" height="3"/><rect x="45" y="12" width="3" height="3"/></g><rect x="31" y="24" width="2.5" height="9" rx="1" fill="#ffd60a"/><path d="M32 38 c-5 5 -6 12 -6 16 h12 c0 -4 -1 -11 -6 -16z" fill="#e9ecef" stroke="#151515" stroke-width="1.5"/><path d="M26 50 l-6 6 h6z M38 50 l6 6 h-6z" fill="#e63946" stroke="#151515" stroke-width="1.2"/><circle cx="32" cy="47" r="2.6" fill="#00b4d8"/><path d="M29 56 l3 5 l3 -5z" fill="#f77f00"/></svg>',
    faixas: ["6-8", "8-10"],
    iniciar(area, faixa) {
      Motor.telaOpcoes(area, {
        opcoes: [
          { titulo: "Tiro", chave: "tiro", valores: [["sozinho", "🤖 Atira sozinha"], ["botao", "🔥 No botão"]] },
          { titulo: "Velocidade", chave: "vel", valores: [["devagar", "🐢 Devagar"], ["normal", "🐇 Normal"], ["rapido", "🚀 Rápido"]] },
        ],
        padrao: faixa === "8-10" ? { tiro: "botao", vel: "normal" } : { tiro: "sozinho", vel: "devagar" },
        chave: `nave-opcoes-${faixa}`,
        aoJogar: op => jogo(area, op),
      });
    },
  });

  function jogo(area, op) {
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const VEL = { devagar: 0.7, normal: 1, rapido: 1.3 }[op.vel];
    let aliens, bloco, tiros, tirosAliens, escudos, maeNave, explosoes, nave, pontos, onda, vidas;
    let pausado, acabou, ultimoT, proxTiro, proxTiroAlien, proxMae, invencivelAte, aviso, avisoAte;
    let segurando = 0; // -1 esquerda, 1 direita (botões)
    const teclas = {};

    // ---------- Tela ----------
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "nave-tela";
    area.appendChild(tela);
    const deitado = tela.clientWidth > tela.clientHeight;
    tela.classList.toggle("deitado", deitado);

    const lateral = document.createElement("div");
    lateral.className = "nave-lateral";
    const info = document.createElement("div");
    info.className = "nave-info";
    const pausa = document.createElement("button");
    pausa.className = "chip";
    pausa.addEventListener("click", () => alternarPausa());
    const botoesTopo = document.createElement("div");
    botoesTopo.className = "nave-botoes-topo";
    botoesTopo.append(pausa, Motor.botaoSom());
    lateral.append(info, botoesTopo);
    const canvas = document.createElement("canvas");
    canvas.className = "nave-campo";
    const controles = document.createElement("div");
    controles.className = "nave-controles";
    tela.append(lateral, canvas, controles);

    const larg = tela.clientWidth, alt = tela.clientHeight;
    const dispL = deitado ? larg - 2 * 200 : larg - 8;
    const dispA = deitado ? alt - 8 : alt - 100 - 100;
    const H = Math.round(Math.max(380, Math.min(560, W * dispA / dispL)));
    const esc = Math.min(dispL / W, dispA / H);
    const dpr = window.devicePixelRatio || 1;
    Object.assign(canvas, { width: Math.round(W * esc * dpr), height: Math.round(H * esc * dpr) });
    Object.assign(canvas.style, { width: Math.round(W * esc) + "px", height: Math.round(H * esc) + "px" });
    const ctx = canvas.getContext("2d");
    ctx.scale(esc * dpr, esc * dpr);
    const NAVE_Y = H - 30, ESCUDO_Y = H - 92, CEL = 31; // CEL: espaço de cada alien no bloco
    const LIMITE = ESCUDO_Y - 6; // se os aliens chegarem aqui, invadiram!
    // Estrelas em 3 camadas (as mais longe andam mais devagar)
    const estrelas = Array.from({ length: 70 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, c: i % 3 }));

    // ---------- Regras ----------
    function novaOnda() {
      const linhas = 4 + (onda > 2 ? 1 : 0), cols = 7;
      aliens = [];
      for (let r = 0; r < linhas; r++) for (let c = 0; c < cols; c++) {
        const tipo = r === 0 ? 0 : r < 3 ? 1 : 2;
        aliens.push({ c, r, tipo });
      }
      const largBloco = cols * CEL;
      bloco = { x: (W - largBloco) / 2, y: 46 + Math.min(onda - 1, 4) * 8, dir: 1, cols, total: aliens.length };
      tiros = []; tirosAliens = []; explosoes = [];
      escudos = [];
      const n = 4, bw = 44, esp = (W - n * bw) / (n + 1);
      for (let k = 0; k < n; k++) {
        // Escudo em pedacinhos de 4×4 (com um arco embaixo)
        for (let i = 0; i < 11; i++) for (let j = 0; j < 6; j++) {
          if (j >= 4 && i >= 3 && i <= 7) continue;
          if (j === 0 && (i === 0 || i === 10)) continue;
          escudos.push({ x: esp + k * (bw + esp) + i * 4, y: ESCUDO_Y + j * 4 });
        }
      }
      proxTiroAlien = performance.now() + 1800;
      aviso = `Onda ${onda}!`; avisoAte = performance.now() + 1500;
    }
    const posAlien = a => ({ x: bloco.x + a.c * CEL + CEL / 2, y: bloco.y + a.r * CEL + CEL / 2 });
    // Velocidade do bloco: mais rápido a cada onda e conforme sobram menos aliens
    const velBloco = () => VEL * (22 + onda * 5) * (1 + 2.2 * (1 - aliens.length / bloco.total));

    function atirar() {
      if (pausado || acabou || tiros.length >= 3) return;
      tiros.push({ x: nave.x, y: NAVE_Y - 18 });
      Motor.nota(880, { dur: 0.07, vol: 0.06, tipo: "square", ate: 440 });
    }

    function explodir(x, y, cor) { explosoes.push({ x, y, cor, ini: performance.now() }); }

    function acertarEscudo(x, y, r) {
      let bateu = false;
      for (let k = escudos.length - 1; k >= 0; k--) {
        const e = escudos[k];
        if (x + r > e.x && x - r < e.x + 4 && y + 4 > e.y && y - 4 < e.y + 4) {
          // Some o pedacinho atingido e alguns vizinhos (o escudo vai se desgastando)
          escudos.splice(k, 1);
          bateu = true;
          break;
        }
      }
      if (bateu) for (let k = escudos.length - 1; k >= 0; k--) {
        const e = escudos[k];
        if (Math.abs(e.x - x) < 6 && Math.abs(e.y - y) < 6 && Math.random() < 0.45) escudos.splice(k, 1);
      }
      return bateu;
    }

    function perderVida() {
      vidas--;
      explodir(nave.x, NAVE_Y, "#ffb703");
      Motor.ruido({ dur: 0.5, vol: 0.3, freq: 500 });
      tirosAliens = [];
      atualizarInfo();
      if (vidas <= 0) return fim();
      invencivelAte = performance.now() + 2000;
      Motor.falar(vidas === 1 ? "Ops! Última nave!" : "Ops! Cuidado!");
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
      // Estrelas
      estrelas.forEach(s => { s.y += (8 + s.c * 14) * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } });
      // Nave
      const dir = segurando || ((teclas.ArrowRight ? 1 : 0) - (teclas.ArrowLeft ? 1 : 0));
      if (dir) moverNave(nave.x + dir * 230 * dt);
      if (op.tiro === "sozinho" && t >= proxTiro) { atirar(); proxTiro = t + 520; }
      // Tiros da nave
      tiros.forEach(s => { s.y -= 420 * dt; });
      tiros = tiros.filter(s => {
        if (s.y < -10) return false;
        for (let k = 0; k < aliens.length; k++) {
          const p = posAlien(aliens[k]);
          if (Math.abs(s.x - p.x) < 13 && Math.abs(s.y - p.y) < 13) {
            const tipo = TIPOS[aliens[k].tipo];
            pontos += tipo.pontos;
            explodir(p.x, p.y, ["#7ae582", "#c77dff", "#ff8fab"][aliens[k].tipo]);
            aliens.splice(k, 1);
            Motor.nota(300 + Math.random() * 200, { dur: 0.1, vol: 0.12, tipo: "square", ate: 120 });
            atualizarInfo();
            return false;
          }
        }
        if (maeNave && Math.abs(s.x - maeNave.x) < 18 && Math.abs(s.y - maeNave.y) < 12) {
          const bonus = Motor.sortear([100, 150, 200, 300]);
          pontos += bonus;
          explodir(maeNave.x, maeNave.y, "#ffd60a");
          explosoes.push({ x: maeNave.x, y: maeNave.y + 18, texto: `+${bonus}`, ini: t });
          maeNave = null;
          Motor.tim();
          Motor.falar(`Nave-mãe! Mais ${bonus} pontos!`);
          atualizarInfo();
          return false;
        }
        return true;
      });
      // Bloco de aliens: anda de lado; ao bater na borda, desce e volta
      if (aliens.length) {
        const cs = aliens.map(a => a.c), rs = aliens.map(a => a.r);
        const minX = bloco.x + Math.min(...cs) * CEL, maxX = bloco.x + (Math.max(...cs) + 1) * CEL;
        bloco.x += bloco.dir * velBloco() * dt;
        if ((bloco.dir > 0 && maxX >= W - 6) || (bloco.dir < 0 && minX <= 6)) {
          bloco.dir *= -1;
          bloco.y += 18;
          Motor.nota(110, { dur: 0.08, vol: 0.1, tipo: "triangle" });
        }
        const fundo = bloco.y + (Math.max(...rs) + 1) * CEL;
        // Aliens passando pelos escudos apagam o que tocam
        if (fundo > ESCUDO_Y) aliens.forEach(a => { const p = posAlien(a); escudos = escudos.filter(e => Math.abs(e.x + 2 - p.x) > 12 || Math.abs(e.y + 2 - p.y) > 12); });
        if (fundo >= LIMITE + 40) { vidas = 0; atualizarInfo(); explodir(nave.x, NAVE_Y, "#ffb703"); return fim(true); }
        // Tiros dos aliens: sai do alien mais baixo de uma coluna sorteada
        if (t >= proxTiroAlien) {
          const colunas = [...new Set(cs)];
          const c = Motor.sortear(colunas);
          const baixo = aliens.filter(a => a.c === c).sort((a, b) => b.r - a.r)[0];
          const p = posAlien(baixo);
          tirosAliens.push({ x: p.x, y: p.y + 10 });
          proxTiroAlien = t + Math.max(450, (1700 - onda * 120) / VEL) * (0.6 + Math.random() * 0.8);
        }
      }
      tirosAliens.forEach(s => { s.y += 150 * VEL * dt; });
      tirosAliens = tirosAliens.filter(s => {
        if (s.y > H + 10) return false;
        if (acertarEscudo(s.x, s.y, 2)) return false;
        if (t >= invencivelAte && Math.abs(s.x - nave.x) < 15 && s.y > NAVE_Y - 14 && s.y < NAVE_Y + 14) { perderVida(); return false; }
        return true;
      });
      if (acabou) return;
      // Nave-mãe
      if (!maeNave && t >= proxMae && aliens.length) {
        const d = Math.random() < 0.5 ? 1 : -1;
        maeNave = { x: d > 0 ? -24 : W + 24, y: 22, d };
        Motor.nota(660, { dur: 0.6, vol: 0.06, tipo: "sine", ate: 990 });
      }
      if (maeNave) {
        maeNave.x += maeNave.d * 70 * dt;
        if (maeNave.x < -30 || maeNave.x > W + 30) { maeNave = null; proxMae = t + 15000 + Math.random() * 10000; }
      }
      if (!maeNave && proxMae < t) proxMae = t + 15000 + Math.random() * 10000;
      // Onda vencida
      if (!aliens.length) {
        pontos += 100;
        onda++;
        maeNave = null;
        Motor.tim();
        Motor.falar(`${Motor.elogio()} Onda ${onda}!`);
        novaOnda();
        atualizarInfo();
      }
      desenhar(t);
      requestAnimationFrame(laco);
    }

    function moverNave(x) { nave.x = Math.max(18, Math.min(W - 18, x)); }

    // ---------- Desenho ----------
    function desenhar(t = performance.now()) {
      ctx.fillStyle = "#0b1026";
      ctx.fillRect(0, 0, W, H);
      estrelas.forEach(s => {
        ctx.fillStyle = ["rgba(255,255,255,.35)", "rgba(255,255,255,.6)", "#fff"][s.c];
        ctx.fillRect(s.x, s.y, 1 + s.c * 0.6, 1 + s.c * 0.6);
      });
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      // Aliens (balançam um pouquinho)
      ctx.font = "25px sans-serif";
      const passo = Math.floor(t / 400) % 2;
      aliens.forEach(a => {
        const p = posAlien(a);
        ctx.fillText(TIPOS[a.tipo].emoji, p.x, p.y + (passo ? 1.5 : -1.5));
      });
      // Nave-mãe
      if (maeNave) { ctx.font = "28px sans-serif"; ctx.fillText("🛸", maeNave.x, maeNave.y); }
      // Escudos (os tiros da nave passam por eles; os dos aliens e os próprios aliens os gastam)
      ctx.fillStyle = "#38b000";
      escudos.forEach(e => ctx.fillRect(e.x, e.y, 4, 4));
      // Tiros
      ctx.fillStyle = "#ffd60a";
      tiros.forEach(s => { ctx.fillRect(s.x - 1.5, s.y - 6, 3, 12); });
      ctx.fillStyle = "#ff5d8f";
      tirosAliens.forEach(s => {
        ctx.beginPath();
        const z = Math.floor(s.y / 6) % 2 ? 2 : -2; // zigue-zague
        ctx.moveTo(s.x, s.y - 7); ctx.lineTo(s.x + z, s.y - 2); ctx.lineTo(s.x - z, s.y + 2); ctx.lineTo(s.x, s.y + 7);
        ctx.strokeStyle = "#ff5d8f"; ctx.lineWidth = 2.5; ctx.stroke();
      });
      // Nave (pisca enquanto está protegida)
      if (!acabou && (t >= invencivelAte || Math.floor(t / 120) % 2)) {
        ctx.save();
        ctx.translate(nave.x, NAVE_Y);
        ctx.fillStyle = "rgba(255,140,0,.7)";
        ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(0, 18 + Math.random() * 6); ctx.lineTo(5, 12); ctx.fill(); // fogo
        ctx.rotate(-Math.PI / 4);
        ctx.font = "30px sans-serif";
        ctx.fillText("🚀", 0, 0);
        ctx.restore();
      }
      // Explosões
      explosoes = explosoes.filter(e => t - e.ini < 500);
      explosoes.forEach(e => {
        const k = (t - e.ini) / 500;
        if (e.texto) {
          ctx.fillStyle = "#ffd60a"; ctx.font = "bold 16px sans-serif"; ctx.globalAlpha = 1 - k;
          ctx.fillText(e.texto, e.x, e.y - k * 14); ctx.globalAlpha = 1; return;
        }
        ctx.fillStyle = e.cor; ctx.globalAlpha = 1 - k;
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.fillRect(e.x + Math.cos(a) * 18 * k - 2, e.y + Math.sin(a) * 18 * k - 2, 4, 4); }
        ctx.globalAlpha = 1;
      });
      // Linha do chão
      ctx.fillStyle = "rgba(122,229,130,.5)";
      ctx.fillRect(0, H - 8, W, 2);
      if (pausado && !acabou) faixaTexto("⏸️ Pausa");
      else if (aviso && t < avisoAte) faixaTexto(aviso);
    }
    function faixaTexto(txt) {
      const y = H * 0.5;
      ctx.fillStyle = "rgba(0,0,0,.55)";
      ctx.fillRect(0, y - 22, W, 44);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(txt, W / 2, y);
    }
    function atualizarInfo() {
      info.innerHTML = "";
      [["Pontos", pontos], ["Onda", onda], ["Vidas", "🚀".repeat(Math.max(0, vidas)) || "–"], ["🏆", Math.max(recorde(), pontos)]].forEach(([r, v]) => {
        const d = document.createElement("div");
        d.innerHTML = "<span></span><b></b>";
        d.querySelector("span").textContent = r;
        d.querySelector("b").textContent = v;
        info.appendChild(d);
      });
      pausa.textContent = pausado ? "▶️ Continuar" : "⏸️ Pausar";
    }

    // ---------- Controles ----------
    // Botões ⬅️ ➡️: segurar mantém a nave andando
    const botaoMover = (icone, rotulo, d) => {
      const b = document.createElement("button");
      b.className = "nave-botao";
      b.textContent = icone;
      b.setAttribute("aria-label", rotulo);
      b.addEventListener("pointerdown", e => { e.preventDefault(); segurando = d; try { b.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => b.addEventListener(ev, () => { if (segurando === d) segurando = 0; }));
      return b;
    };
    const fogo = document.createElement("button");
    fogo.className = "nave-botao fogo";
    fogo.textContent = "🔥";
    fogo.setAttribute("aria-label", "Atirar");
    fogo.addEventListener("pointerdown", e => { e.preventDefault(); atirar(); });
    controles.append(botaoMover("⬅️", "Esquerda", -1));
    if (op.tiro === "botao") controles.append(fogo);
    controles.append(botaoMover("➡️", "Direita", 1));

    // Arrastar o dedo no campo move a nave (o quanto o dedo andar); tocar atira (no modo botão)
    let toque = null;
    canvas.addEventListener("pointerdown", e => {
      toque = { x: e.clientX, inicioX: e.clientX, t: performance.now() };
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
    });
    canvas.addEventListener("pointermove", e => {
      if (!toque || pausado || acabou) return;
      moverNave(nave.x + (e.clientX - toque.x) / esc * 1.2);
      toque.x = e.clientX;
    });
    canvas.addEventListener("pointerup", e => {
      if (toque && op.tiro === "botao" && Math.abs(e.clientX - toque.inicioX) < 12 && performance.now() - toque.t < 350) atirar();
      toque = null;
    });
    canvas.addEventListener("pointercancel", () => { toque = null; });

    const tecla = e => {
      if (!vivo()) { document.removeEventListener("keydown", tecla); document.removeEventListener("keyup", solta); return; }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); teclas[e.key] = true; }
      else if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter") { e.preventDefault(); atirar(); }
      else if (e.key === "p") alternarPausa();
    };
    const solta = e => { teclas[e.key] = false; };
    document.addEventListener("keydown", tecla);
    document.addEventListener("keyup", solta);

    // ---------- Começo e fim ----------
    function comecar() {
      nave = { x: W / 2 };
      pontos = 0; onda = 1; vidas = 3; pausado = false; acabou = false; maeNave = null;
      const agora = performance.now();
      proxTiro = agora + 800; invencivelAte = 0; proxMae = agora + 12000 + Math.random() * 8000;
      tela.querySelector(".nave-fim")?.remove();
      novaOnda();
      atualizarInfo();
      ultimoT = agora;
      requestAnimationFrame(laco);
    }

    function fim(invadiram = false) {
      acabou = true;
      const novoRecorde = pontos > recorde();
      if (novoRecorde) { try { localStorage.setItem("nave-recorde", pontos); } catch (e) { /* ok */ } }
      atualizarInfo();
      desenhar();
      const caixa = document.createElement("div");
      caixa.className = "nave-fim";
      caixa.innerHTML = `<div class="titulo-fim"></div><div class="pontos-fim"></div>`;
      caixa.querySelector(".titulo-fim").textContent = novoRecorde ? "🏆 Novo recorde!" : invadiram ? "Os aliens chegaram!" : "Fim de jogo!";
      caixa.querySelector(".pontos-fim").textContent = `${pontos} pontos · onda ${onda}`;
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
    if (window.NAVE_TESTE) window.NAVE_TESTE = {
      estado: () => ({ nave: nave.x, aliens: aliens.map(posAlien), tirosAliens, pontos, onda, vidas, acabou, escudos: escudos.length, mae: !!maeNave, W, H }),
      moverPara: moverNave, atirar,
      segurar: d => { segurando = d; },
      quaseLimpar: n => { aliens.splice(0, Math.max(0, aliens.length - n)); },
      chamarMae: () => { proxMae = 0; },
      invencivel: () => { invencivelAte = Infinity; },
    };

    comecar();
    Motor.falar(op.tiro === "sozinho"
      ? "Defenda o planeta! Arraste o dedo para mover a nave. Ela atira sozinha!"
      : "Defenda o planeta! Arraste o dedo para mover a nave e toque no fogo para atirar!");
  }
})();
