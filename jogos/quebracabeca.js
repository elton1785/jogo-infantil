// Quebra-cabeça — a figura é cortada em peças; arrastar (ou tocar na peça e depois no lugar).
// Pequenos: um bicho grande em 2 a 4 peças quadradas. Maiores: cenas desenhadas (fazenda, fundo do
// mar...) ou uma foto tirada na hora (📷), em até 7×7 peças, quadradas ou DE ENCAIXE (com pontas e
// buracos, como as de verdade). Cada peça é desenhada num canvas e encaixa na posição exata.
(() => {
  // Faixas sem escolha de tamanho: [colunas, linhas]
  const FIXOS = { "3-4": [2, 1], "4-5": [2, 2] };
  // Faixas que escolhem o tamanho
  const OPCOES = {
    "5-6":  [[2, 2], [3, 2], [3, 3]],
    "6-8":  [[3, 3], [4, 4], [5, 5], [6, 6]],
    "8-10": [[4, 4], [5, 5], [6, 6], [7, 7]],
  };
  const FIGS = ["🐶", "🐱", "🦁", "🐸", "🐼", "🦊", "🐵", "🐯", "🐮", "🐷", "🦄", "🐙", "🍉", "🚗", "🏠", "🌻"];
  const FUNDOS = ["#ffd6a5", "#caffbf", "#9bf6ff", "#bdb2ff", "#ffc6ff", "#fdffb6"];
  const S = 600; // lado do desenho (em pixels do canvas)

  // ---------- Cenas desenhadas ----------
  // `fundo(ctx)` pinta o cenário; `itens`: [emoji, x, y, tamanho] em frações do lado.
  const ceu = (ctx, cima, baixo, chao, corChao) => {
    const g = ctx.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, cima);
    g.addColorStop(1, baixo);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    if (chao) { ctx.fillStyle = corChao; ctx.fillRect(0, S * chao, S, S); }
  };
  const bolinhas = (ctx, cor, n, raio, semente) => {
    ctx.fillStyle = cor;
    for (let i = 0; i < n; i++) {
      const x = ((i * 97 + semente * 31) % 100) / 100 * S, y = ((i * 57 + semente * 13) % 100) / 100 * S;
      ctx.beginPath();
      ctx.arc(x, y, raio * (0.5 + ((i * 7) % 5) / 8), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const CENAS = [
    { nome: "a fazenda", fundo: c => ceu(c, "#7cc6fe", "#c9ecff", 0.62, "#8bd17c"),
      itens: [["☀️", .85, .13, .17], ["☁️", .22, .12, .16], ["☁️", .55, .2, .12], ["🏡", .27, .5, .3], ["🌳", .68, .45, .26],
        ["🐮", .2, .8, .2], ["🐷", .5, .76, .16], ["🐔", .82, .7, .13], ["🐑", .76, .89, .17], ["🌻", .05, .66, .1], ["🐶", .45, .93, .12]] },
    { nome: "o fundo do mar", fundo: c => { ceu(c, "#48cae4", "#023e8a", 0.88, "#e9c46a"); bolinhas(c, "rgba(255,255,255,.35)", 18, 9, 2); },
      itens: [["🐠", .2, .18, .16], ["🐬", .68, .14, .22], ["🐙", .45, .45, .22], ["🐟", .85, .42, .14], ["🐢", .16, .55, .2],
        ["🦈", .75, .66, .2], ["🦀", .3, .9, .13], ["🐚", .6, .93, .09], ["🪸", .9, .86, .16], ["🐡", .5, .2, .12], ["🪼", .1, .85, .14]] },
    { nome: "o espaço", fundo: c => { ceu(c, "#03045e", "#240046"); bolinhas(c, "#fff", 50, 2.5, 5); },
      itens: [["🌍", .25, .25, .26], ["🌙", .82, .14, .16], ["🪐", .72, .5, .26], ["🚀", .3, .68, .24], ["⭐", .55, .15, .1],
        ["👽", .88, .85, .14], ["🛸", .58, .86, .17], ["☄️", .1, .9, .12], ["🌟", .1, .5, .1], ["👨‍🚀", .55, .48, .14]] },
    { nome: "a floresta", fundo: c => ceu(c, "#a8dadc", "#e9f5db", 0.6, "#52b788"),
      itens: [["🌴", .12, .38, .3], ["🦒", .38, .42, .3], ["🐘", .72, .62, .28], ["🦜", .82, .16, .14], ["🐒", .55, .18, .15],
        ["🦁", .2, .8, .22], ["🐍", .48, .88, .13], ["🌿", .92, .9, .12], ["☀️", .12, .1, .14], ["🦓", .82, .38, .17]] },
    { nome: "a cidade", fundo: c => { ceu(c, "#ffafcc", "#bde0fe", 0.72, "#6c757d"); c.fillStyle = "#fff"; for (let x = 20; x < S; x += 80) c.fillRect(x, S * .85, 40, 6); },
      itens: [["🏢", .15, .42, .3], ["🏫", .48, .48, .26], ["🏥", .82, .42, .26], ["☁️", .3, .1, .14], ["🌤️", .8, .1, .15],
        ["🚗", .2, .8, .16], ["🚌", .58, .8, .2], ["🚲", .88, .93, .12], ["🚦", .35, .62, .12], ["🌳", .68, .62, .14], ["✈️", .55, .14, .12]] },
    { nome: "a praia", fundo: c => { ceu(c, "#ffbe0b", "#ffe8a3", 0.45, "#0096c7"); c.fillStyle = "#f4d58d"; c.fillRect(0, S * .7, S, S * .3); },
      itens: [["☀️", .8, .15, .2], ["🐦", .3, .14, .1], ["⛵", .25, .52, .2], ["🐳", .7, .55, .18], ["🌴", .9, .62, .26],
        ["⛱️", .2, .8, .22], ["🏰", .55, .84, .18], ["🦀", .82, .93, .11], ["🏐", .38, .93, .1], ["🍦", .07, .95, .09]] },
    { nome: "a festa", fundo: c => { ceu(c, "#ffc8dd", "#fff1e6", 0.7, "#cdb4db"); bolinhas(c, "rgba(255,255,255,.6)", 25, 6, 9); },
      itens: [["🎈", .12, .2, .2], ["🎈", .88, .2, .18], ["🎉", .5, .12, .16], ["🎂", .5, .55, .32], ["🎁", .15, .8, .2],
        ["🧸", .85, .75, .2], ["🍰", .4, .9, .12], ["🧁", .65, .9, .12], ["🪅", .28, .45, .14], ["🍭", .75, .45, .12]] },
    { nome: "o jardim", fundo: c => ceu(c, "#bde0fe", "#ffffff", 0.55, "#95d5b2"),
      itens: [["🌈", .5, .2, .4], ["🦋", .15, .3, .14], ["🐝", .85, .33, .12], ["🌷", .12, .7, .16], ["🌻", .4, .66, .2],
        ["🌸", .7, .72, .15], ["🐞", .28, .9, .1], ["🐌", .58, .92, .12], ["🍄", .9, .85, .14], ["🐦", .9, .12, .1]] },
  ];

  const fonteEmoji = px => `${px}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;

  function novoCanvas() {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    return { c, ctx };
  }

  function desenharCena(cena) {
    const { c, ctx } = novoCanvas();
    cena.fundo(ctx);
    cena.itens.forEach(([e, x, y, t]) => { ctx.font = fonteEmoji(t * S); ctx.fillText(e, x * S, y * S); });
    return c.toDataURL();
  }

  function desenharEmoji(emoji) {
    const { c, ctx } = novoCanvas();
    ctx.fillStyle = Motor.sortear(FUNDOS);
    ctx.fillRect(0, 0, S, S);
    ctx.font = fonteEmoji(S * 0.78);
    ctx.fillText(emoji, S / 2, S * 0.54);
    return c.toDataURL();
  }

  // Foto escolhida/tirada: recorta o quadrado do meio
  function desenharFoto(arquivo) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const { c, ctx } = novoCanvas();
        const l = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - l) / 2, (img.height - l) / 2, l, l, 0, 0, S, S);
        URL.revokeObjectURL(img.src);
        resolve(c.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(arquivo);
    });
  }

  // ---------- Peças ----------
  // Cada encontro entre duas peças vizinhas sorteia quem tem a ponta (+1) e quem tem o buraco (-1).
  // No modo "encaixe" o contorno das peças segue esses encontros, como um quebra-cabeça de verdade.
  function sortearEncontros(cols, rows) {
    const s = () => (Math.random() < 0.5 ? 1 : -1);
    return {
      h: Array.from({ length: rows }, () => Array.from({ length: cols }, s)), // entre a linha r-1 e r
      v: Array.from({ length: rows }, () => Array.from({ length: cols }, s)), // entre a coluna c-1 e c
    };
  }
  // Lados da peça (c, r): 0 reto, +1 ponta para fora, -1 buraco
  function ladosDa(c, r, cols, rows, enc) {
    return {
      cima: r > 0 ? -enc.h[r][c] : 0,
      baixo: r < rows - 1 ? enc.h[r + 1][c] : 0,
      esq: c > 0 ? -enc.v[r][c] : 0,
      dir: c < cols - 1 ? enc.v[r][c + 1] : 0,
    };
  }
  // Um lado de P a Q com a ponta (t = +1) ou o buraco (t = -1) no meio; N aponta para fora
  function lado(ctx, P, Q, N, t) {
    if (!t) { ctx.lineTo(Q[0], Q[1]); return; }
    const L = Math.hypot(Q[0] - P[0], Q[1] - P[1]);
    const pt = (u, v) => [P[0] + (Q[0] - P[0]) * u + N[0] * v * L * t, P[1] + (Q[1] - P[1]) * u + N[1] * v * L * t];
    const curva = (a, b, c) => { const [x1, y1] = pt(...a), [x2, y2] = pt(...b), [x3, y3] = pt(...c); ctx.bezierCurveTo(x1, y1, x2, y2, x3, y3); };
    ctx.lineTo(...pt(0.36, 0));
    curva([0.40, 0], [0.43, 0.10], [0.39, 0.18]);
    curva([0.33, 0.31], [0.67, 0.31], [0.61, 0.18]);
    curva([0.57, 0.10], [0.60, 0], [0.64, 0]);
    ctx.lineTo(Q[0], Q[1]);
  }
  function caminhoPeca(ctx, x, y, w, h, l) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    lado(ctx, [x, y], [x + w, y], [0, -1], l.cima);
    lado(ctx, [x + w, y], [x + w, y + h], [1, 0], l.dir);
    lado(ctx, [x + w, y + h], [x, y + h], [0, 1], l.baixo);
    lado(ctx, [x, y + h], [x, y], [-1, 0], l.esq);
    ctx.closePath();
  }

  JOGOS.push({
    id: "quebra-cabeca",
    nome: "Quebra-cabeça",
    icone: "🧩",
    faixas: ["3-4", "4-5", "5-6", "6-8", "8-10"],
    iniciar(area, faixa) {
      const id = faixa && faixa.id;
      if (FIXOS[id] || !OPCOES[id]) return comecar({ tam: FIXOS[id] || [2, 2], simples: true, estilo: "quadrado", guia: true });
      // Maiores: tamanho, tipo de peça (quadrada ou de encaixe) e a figura clarinha de ajuda
      const tamanhos = OPCOES[id];
      Motor.telaOpcoes(area, {
        chave: `quebra-opcoes-${id}`,
        padrao: { tam: tamanhos[0].join("x"), estilo: id === "5-6" ? "quadrado" : "encaixe", guia: id === "8-10" ? "nao" : "sim" },
        opcoes: [
          { chave: "tam", titulo: "Quantas peças?", valores: tamanhos.map(([c, r]) => [`${c}x${r}`, `${c * r} peças (${c}×${r})`]) },
          { chave: "estilo", titulo: "Tipo de peça", valores: [["quadrado", "⬜ Quadradas"], ["encaixe", "🧩 De encaixe, como as de verdade"]] },
          { chave: "guia", regra: true, titulo: "Figura clarinha no tabuleiro", valores: [["sim", "💡 Sim"], ["nao", "🙈 Não"]] },
        ],
        aoJogar: op => comecar({ tam: op.tam.split("x").map(Number), simples: false, estilo: op.estilo, guia: op.guia === "sim" }),
      });

      // `simples`: figura de um bicho, peças grandes (para os pequenos)
      function comecar({ tam: [cols, rows], simples, estilo, guia }) {
        const encaixe = estilo === "encaixe";
        let ultima = null;

        function proxima() {
          if (simples) {
            const emoji = Motor.sortear(FIGS.filter(f => f !== ultima));
            ultima = emoji;
            return { img: desenharEmoji(emoji), nome: "o quebra-cabeça" };
          }
          const cena = Motor.sortear(CENAS.filter(c => c !== ultima));
          ultima = cena;
          return { img: desenharCena(cena), nome: cena.nome };
        }

        function jogo(figura = proxima()) {
          const fonte = new Image();
          const s = Motor.sessaoAtual();
          fonte.onload = () => { if (s === Motor.sessaoAtual()) montar(figura, fonte); };
          fonte.src = figura.img;
        }

        function montar({ img, nome }, fonte) {
          area.innerHTML = "";
          const total = cols * rows;
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          // Tamanho do tabuleiro: ao lado da bandeja (deitado) ou acima dela (em pé),
          // descontando a faixa de cima (🏠) e a de baixo
          // Celular deitado: usa a altura toda e desvia do 🏠 pela esquerda
          const curto = window.innerWidth > window.innerHeight && window.innerHeight < 520;
          const padEsq = curto ? 84 : 0;
          const larg = window.innerWidth - 32 - padEsq, alt = window.innerHeight - (curto ? 40 : 180);
          const deitado = larg > alt;
          const lado = Math.floor(Math.min(deitado
            ? Math.min(alt, larg * 0.58, (larg - 28) / (1 + 1 / cols))
            : Math.min(larg, alt * 0.6, (alt - 50) / (1 + 1 / rows)), simples ? 400 : 600));
          const w = lado / cols, h = lado / rows;
          const m = encaixe ? Math.ceil(Math.max(w, h) * 0.34) : 0; // espaço das pontas em volta
          const enc = sortearEncontros(cols, rows);
          let restantes = total, selecionada = null;

          // Desenha a peça (c, r) num canvas: recorte da figura, contorno e um leve relevo
          function canvasPeca(c, r, escala = 1) {
            const cv = document.createElement("canvas");
            const W = (w + 2 * m) * escala, H = (h + 2 * m) * escala;
            cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
            Object.assign(cv.style, { width: W + "px", height: H + "px" });
            const ctx = cv.getContext("2d");
            ctx.scale(dpr * escala, dpr * escala);
            const l = encaixe ? ladosDa(c, r, cols, rows, enc) : { cima: 0, baixo: 0, esq: 0, dir: 0 };
            caminhoPeca(ctx, m, m, w, h, l);
            ctx.save();
            ctx.clip();
            const k = S / lado;
            ctx.drawImage(fonte, (c * w - m) * k, (r * h - m) * k, (w + 2 * m) * k, (h + 2 * m) * k, 0, 0, w + 2 * m, h + 2 * m);
            // relevo: luz em cima à esquerda, sombra embaixo à direita
            const g = ctx.createLinearGradient(m, m, m + w, m + h);
            g.addColorStop(0, "rgba(255,255,255,.22)"); g.addColorStop(0.5, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(0,0,0,.16)");
            ctx.fillStyle = g; ctx.fillRect(0, 0, w + 2 * m, h + 2 * m);
            ctx.restore();
            caminhoPeca(ctx, m, m, w, h, l);
            ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = Math.max(1, 1.6 / escala); ctx.stroke();
            return cv;
          }

          // Tabuleiro: o contorno de cada peça (e a figura clarinha, se pedida)
          const tabuleiro = document.createElement("div");
          tabuleiro.className = "tabuleiro" + (encaixe ? " encaixe" : "");
          Object.assign(tabuleiro.style, { width: lado + "px", height: lado + "px", gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` });
          if (guia) { tabuleiro.classList.add("com-guia"); tabuleiro.style.setProperty("--guia", `url(${img})`); }
          const guiaCv = document.createElement("canvas");
          guiaCv.className = "guia-pecas";
          guiaCv.width = guiaCv.height = Math.round(lado * dpr);
          Object.assign(guiaCv.style, { width: lado + "px", height: lado + "px" });
          {
            const g = guiaCv.getContext("2d");
            g.scale(dpr, dpr);
            g.strokeStyle = "rgba(0,0,0,.22)"; g.lineWidth = 1.2; g.setLineDash(encaixe ? [] : [4, 4]);
            for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
              caminhoPeca(g, c * w, r * h, w, h, encaixe ? ladosDa(c, r, cols, rows, enc) : { cima: 0, baixo: 0, esq: 0, dir: 0 });
              g.stroke();
            }
          }
          tabuleiro.appendChild(guiaCv);
          const encaixadas = document.createElement("div");
          encaixadas.className = "encaixadas";
          tabuleiro.appendChild(encaixadas);

          // Casas transparentes: tocar numa casa com a peça escolhida (toque ou controle da TV)
          const casas = [];
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const casa = document.createElement("button");
            casa.className = "casa";
            casa.dataset.pos = `${c},${r}`;
            casa.setAttribute("aria-label", `Lugar ${r * cols + c + 1}`);
            casa.addEventListener("click", () => {
              if (!selecionada) return;
              if (!encaixar(selecionada.peca, selecionada.pos, casa.dataset.pos)) Motor.animar(selecionada.peca, "balanca");
            });
            tabuleiro.appendChild(casa);
            casas.push(casa);
          }

          // Bandeja: as peças embaralhadas, menores; nos grandes só algumas por vez
          const pilha = [];
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) pilha.push([c, r]);
          const pilhaEmb = Motor.embaralhar(pilha);
          const lugarBandeja = deitado ? Math.min(larg - lado - 28, 460) : larg;
          // A figura para consultar (só nos maiores) também ocupa espaço ao lado/abaixo do tabuleiro
          const ladoMini = simples ? 0 : Math.round(Math.max(84, Math.min(deitado ? 170 : 120, deitado ? alt * 0.4 : (alt - lado) * 0.4)));
          const altBandeja = deitado ? alt - (simples ? 0 : ladoMini + 24) : alt - lado - (simples ? 0 : ladoMini + 12) - 30;
          let escalaB = Math.min(1, (lugarBandeja - 10) / (w + 2 * m + 12));
          if (!simples) escalaB = Math.min(escalaB, Math.max(0.5, 110 / (w + 2 * m)));
          const tamB = (w + 2 * m) * escalaB + 12, altB = (h + 2 * m) * escalaB + 12;
          const naBandeja = Math.max(1, Math.floor(lugarBandeja / tamB) * Math.max(1, Math.floor(altBandeja / altB)));
          const visiveis = Math.min(total, naBandeja, 12);

          const lateral = document.createElement("div");
          lateral.className = "lateral-quebra";
          const bandeja = document.createElement("div");
          bandeja.className = "bandeja";
          bandeja.style.maxWidth = lugarBandeja + "px";
          if (!simples) {
            // A figura inteira, grande, para consultar; tocar amplia
            const topoLat = document.createElement("div");
            topoLat.className = "topo-lateral";
            const mini = document.createElement("button");
            mini.className = "mini-figura";
            mini.setAttribute("aria-label", "Ver a figura grande");
            Object.assign(mini.style, { backgroundImage: `url(${img})`, width: ladoMini + "px", height: ladoMini + "px" });
            mini.addEventListener("click", () => {
              const grande = document.createElement("div");
              grande.className = "figura-grande";
              grande.style.backgroundImage = `url(${img})`;
              grande.addEventListener("click", () => grande.remove());
              area.appendChild(grande);
              Motor.falar("Esta é a figura que você vai montar. Toque para fechar.");
            });
            const resta = document.createElement("div");
            resta.className = "resta";
            // 📷 Montar uma foto tirada agora (ou da galeria)
            const entrada = document.createElement("input");
            entrada.type = "file";
            entrada.accept = "image/*";
            entrada.hidden = true;
            entrada.addEventListener("change", () => {
              const arq = entrada.files && entrada.files[0];
              if (!arq) return;
              const s = Motor.sessaoAtual();
              desenharFoto(arq).then(foto => {
                if (s !== Motor.sessaoAtual()) return;
                jogo({ img: foto, nome: "a sua foto" });
              }).catch(() => Motor.falar("Não consegui abrir essa foto."));
            });
            const foto = Object.assign(document.createElement("button"), { className: "chip", textContent: "📷 Foto" });
            foto.setAttribute("aria-label", "Montar uma foto");
            foto.addEventListener("click", () => entrada.click());
            const info = document.createElement("div");
            info.className = "info-lateral";
            info.append(resta, foto, entrada);
            topoLat.append(mini, info);
            lateral.append(topoLat);
          }
          lateral.appendChild(bandeja);
          const atualizarResta = () => { const el = lateral.querySelector(".resta"); if (el) el.textContent = `🧩 faltam ${restantes}`; };

          // Arrastar: a peça segue o dedo no tamanho real e gruda se chegar perto do lugar certo
          function arrastar(peca, pos, ev) {
            const [c, r] = pos.split(",").map(Number);
            const x0 = ev.clientX, y0 = ev.clientY;
            const rp = peca.getBoundingClientRect();
            const fx = (ev.clientX - rp.left) / rp.width, fy = (ev.clientY - rp.top) / rp.height; // onde pegou na peça
            let voando = null;
            const mover = e => {
              if (!voando) {
                if (Math.hypot(e.clientX - x0, e.clientY - y0) < 8) return;
                voando = canvasPeca(c, r);
                voando.className = "peca-voando";
                document.body.appendChild(voando);
                peca.style.visibility = "hidden";
                peca._arrastou = true;
              }
              const W = w + 2 * m, H = h + 2 * m;
              voando.style.left = e.clientX - fx * W + "px";
              voando.style.top = e.clientY - fy * H + "px";
            };
            const soltar = e => {
              peca.removeEventListener("pointermove", mover);
              peca.removeEventListener("pointerup", soltar);
              peca.removeEventListener("pointercancel", soltar);
              if (!voando) return;
              const rt = tabuleiro.getBoundingClientRect(), rv = voando.getBoundingClientRect();
              const cx = rv.left + rv.width / 2 - rt.left, cy = rv.top + rv.height / 2 - rt.top;
              const perto = Math.hypot(cx - (c + 0.5) * w, cy - (r + 0.5) * h) < Math.min(w, h) * (encaixe ? 0.38 : 0.48);
              voando.remove();
              peca.style.visibility = "";
              if (perto) encaixar(peca, pos, pos);
              else {
                // soltou no tabuleiro mas fora do lugar: balança; fora do tabuleiro: só volta
                const noTab = cx >= 0 && cy >= 0 && cx <= lado && cy <= lado;
                if (noTab) { Motor.animar(peca, "balanca"); Motor.nota(200, { dur: 0.1, tipo: "square", vol: 0.05 }); }
              }
            };
            try { peca.setPointerCapture(ev.pointerId); } catch (er) { /* ok */ }
            peca.addEventListener("pointermove", mover);
            peca.addEventListener("pointerup", soltar);
            peca.addEventListener("pointercancel", soltar);
          }

          function novaPeca() {
            if (!pilhaEmb.length) return;
            const [c, r] = pilhaEmb.shift();
            const pos = `${c},${r}`;
            const peca = document.createElement("button");
            peca.className = "peca-quebra" + (encaixe ? " encaixe" : "");
            peca.setAttribute("aria-label", "Peça");
            peca.dataset.pos = pos;
            peca.appendChild(canvasPeca(c, r, escalaB));
            peca.addEventListener("pointerdown", e => { if (e.pointerId !== 99) arrastar(peca, pos, e); });
            peca.addEventListener("click", () => {
              if (peca._arrastou) { peca._arrastou = false; return; }
              bandeja.querySelectorAll(".selecionada").forEach(x => x.classList.remove("selecionada"));
              selecionada = { peca, pos };
              peca.classList.add("selecionada");
              tabuleiro.classList.add("escolhendo");
            });
            bandeja.appendChild(peca);
          }

          function encaixar(peca, pos, onde) {
            peca.classList.remove("selecionada");
            selecionada = null;
            tabuleiro.classList.remove("escolhendo");
            if (onde !== pos) return false;
            const [c, r] = pos.split(",").map(Number);
            const cv = canvasPeca(c, r);
            cv.className = "peca-encaixada";
            Object.assign(cv.style, { left: c * w - m + "px", top: r * h - m + "px" });
            encaixadas.appendChild(cv);
            casas[r * cols + c].disabled = true;
            peca.remove();
            Motor.ploc();
            restantes--;
            novaPeca();
            atualizarResta();
            if (restantes === 0) {
              tabuleiro.classList.add("completo");
              Motor.comemorar(tabuleiro);
              Motor.tim();
              const fala = simples ? `${Motor.elogio()} Você montou o quebra-cabeça!` : `${Motor.elogio()} Você montou ${nome}!`;
              Motor.falar(fala).then(() => Motor.depois(() => Motor.telaFim(area, 1, 1, () => jogo(), {
                texto: simples ? "Você montou o quebra-cabeça! 🧩" : `Você montou ${nome}! 🧩`, fala: "Parabéns!", botao: "Outro quebra-cabeça",
              }), 1200));
            }
            return true;
          }

          for (let i = 0; i < visiveis; i++) novaPeca();
          atualizarResta();

          const mesa = document.createElement("div");
          mesa.className = "mesa" + (curto ? " curta" : "");
          mesa.style.paddingLeft = padEsq + "px";
          mesa.append(tabuleiro, lateral);
          area.appendChild(mesa);

          Motor.falar(simples
            ? "Monte o quebra-cabeça! Arraste cada peça para o lugar certo."
            : `Vamos montar ${nome}! São ${total} peças.` + (encaixe ? " Repare nas pontinhas e nos buraquinhos de cada peça!" : ""));
        }

        jogo();
      }
    },
  });
})();
