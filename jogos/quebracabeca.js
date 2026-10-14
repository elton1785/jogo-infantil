// Quebra-cabeça — a figura é cortada em peças; arrastar (ou tocar) cada peça até o lugar.
// Pequenos: um bicho grande em 2 a 4 peças. Maiores: cenas desenhadas (fazenda, fundo do mar...)
// em até 6×6 peças, ou uma foto tirada na hora (📷).
(() => {
  // Faixas sem escolha de tamanho: [colunas, linhas]
  const FIXOS = { "3-4": [2, 1], "4-5": [2, 2] };
  // Faixas que escolhem o tamanho
  const OPCOES = {
    "5-6":  [[2, 2], [3, 2], [3, 3]],
    "6-8":  [[3, 3], [4, 4], [5, 5]],
    "8-10": [[4, 4], [5, 5], [6, 6]],
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

  JOGOS.push({
    id: "quebra-cabeca",
    nome: "Quebra-cabeça",
    icone: "🧩",
    faixas: ["3-4", "4-5", "5-6", "6-8", "8-10"],
    iniciar(area, faixa) {
      const id = faixa && faixa.id;
      if (FIXOS[id] || !OPCOES[id]) return comecar(FIXOS[id] || [2, 2], true);
      Motor.escolherModo(area, OPCOES[id].map(([c, r]) => ({
        icone: `${c}×${r}`, rotulo: `${c * r} peças`, iniciar: () => comecar([c, r], false),
      })));

      // `simples`: figura de um bicho com guia clarinha no tabuleiro (para os pequenos)
      function comecar([cols, rows], simples) {
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
          area.innerHTML = "";
          const { img, nome } = figura;
          const total = cols * rows;
          // Tamanho do tabuleiro: ao lado da bandeja (deitado) ou acima dela (em pé)
          const larg = window.innerWidth - 32, alt = window.innerHeight - 112;
          const deitado = larg > alt;
          const lado = Math.min(deitado ? Math.min(alt, larg * 0.55) : Math.min(larg, alt * 0.6), simples ? 380 : 560);
          const w = lado / cols, h = lado / rows;
          let restantes = total, selecionada = null;

          // Um pedaço da figura na posição (c, r)
          function recorte(c, r) {
            const el = document.createElement("span");
            el.className = "recorte";
            Object.assign(el.style, {
              width: w + "px", height: h + "px", backgroundImage: `url(${img})`,
              backgroundSize: `${lado}px ${lado}px`, backgroundPosition: `${-c * w}px ${-r * h}px`,
            });
            return el;
          }

          const tabuleiro = document.createElement("div");
          tabuleiro.className = "tabuleiro";
          Object.assign(tabuleiro.style, { width: lado + "px", height: lado + "px", gridTemplateColumns: `repeat(${cols}, 1fr)` });
          if (simples) {
            tabuleiro.classList.add("com-guia");
            tabuleiro.style.setProperty("--guia", `url(${img})`);
          }

          const casas = [];
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
            const casa = document.createElement("button");
            casa.className = "casa";
            casa.dataset.pos = `${c},${r}`;
            casa.addEventListener("click", () => { if (selecionada) encaixar(selecionada.peca, selecionada.pos, casa); });
            tabuleiro.appendChild(casa);
            casas.push(casa);
          }

          // Peças a colocar. Nos grandes, só algumas ficam na bandeja; as outras saem da pilha aos poucos.
          const pilha = [];
          for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) pilha.push([c, r]);
          const pilhaEmb = Motor.embaralhar(pilha);
          const naBandeja = deitado
            ? Math.max(1, Math.floor((Math.min(larg - lado - 28, 440) / (w + 10))) * Math.floor((alt - 90) / (h + 10)))
            : Math.max(1, Math.floor(larg / (w + 10)) * Math.max(1, Math.floor((alt - lado - 40) / (h + 10))));
          const visiveis = Math.min(total, Math.max(2, naBandeja), 12);

          const lateral = document.createElement("div");
          lateral.className = "lateral-quebra";
          const bandeja = document.createElement("div");
          bandeja.className = "bandeja";
          bandeja.style.maxWidth = (deitado ? Math.min(larg - lado - 28, 440) : larg) + "px";
          if (!simples) {
            // Miniatura da figura inteira, para consultar
            const mini = document.createElement("div");
            mini.className = "mini-figura";
            mini.style.backgroundImage = `url(${img})`;
            const resta = document.createElement("div");
            resta.className = "resta";
            lateral.append(mini, resta);
          }
          lateral.appendChild(bandeja);
          const atualizarResta = () => {
            const el = lateral.querySelector(".resta");
            if (el) el.textContent = `🧩 ${restantes}`;
          };

          function novaPeca() {
            if (!pilhaEmb.length) return;
            const [c, r] = pilhaEmb.shift();
            const peca = document.createElement("button");
            peca.className = "peca-quebra";
            const pos = `${c},${r}`;
            peca.appendChild(recorte(c, r));
            Motor.arrastavel(peca, { alvos: () => casas, aoSoltar: casa => encaixar(peca, pos, casa) });
            peca.addEventListener("click", () => {
              bandeja.querySelectorAll(".selecionada").forEach(x => x.classList.remove("selecionada"));
              selecionada = { peca, pos };
              peca.classList.add("selecionada");
            });
            bandeja.appendChild(peca);
          }

          function encaixar(peca, pos, casa) {
            peca.classList.remove("selecionada");
            selecionada = null;
            if (casa.dataset.pos !== pos || casa.firstChild) {
              Motor.animar(peca, "balanca");
              return false;
            }
            const [c, r] = pos.split(",").map(Number);
            casa.appendChild(recorte(c, r));
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
              Motor.falar(fala).then(() => Motor.depois(() => jogo(), 1800));
            }
            return true;
          }

          for (let i = 0; i < visiveis; i++) novaPeca();
          atualizarResta();

          const mesa = document.createElement("div");
          mesa.className = "mesa";
          mesa.append(tabuleiro, lateral);
          area.appendChild(mesa);

          if (!simples) {
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
            area.append(entrada, Motor.botaoCanto("repetir", "📷", "Usar uma foto", () => entrada.click()));
          }

          Motor.falar(simples
            ? "Monte o quebra-cabeça! Arraste cada peça para o lugar certo."
            : `Vamos montar ${nome}! São ${total} peças.`);
        }

        jogo();
      }
    },
  });
})();
