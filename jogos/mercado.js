// Supermercado 🛒 — fazer as compras de verdade: a lista (com figuras e quantidades), o corredor com
// as seções (hortifrúti, padaria, frios, mercearia, bebidas, limpeza), prateleiras com etiqueta de
// preço e o carrinho que anda pelo corredor. Com a lista completa, no caixa os produtos passam
// pela esteira e pelo leitor ("bip!"), o visor soma o total e a criança paga com notas e moedas de
// real; o caixa dá o troco (ou a criança calcula, nos maiores) e sai o cupom fiscal.
// Toque: setas para andar e tocar no produto. Teclado/controle: ⬅️ ➡️ andam, ⬆️ ⬇️ escolhem a
// prateleira, Enter pega o produto da frente.
(() => {
  // preço em centavos
  const SECOES = [
    { nome: "Hortifrúti", icone: "🥬", cor: "#2f9e44", madeira: true, itens: [
      ["🍌", "Banana", 690, "cacho de banana"], ["🍎", "Maçã", 250], ["🍊", "Laranja", 150], ["🍉", "Melancia", 1500], ["🥕", "Cenoura", 120],
      ["🍅", "Tomate", 130], ["🥔", "Batata", 90], ["🍇", "Uva", 990, "cacho de uva"], ["🥑", "Abacate", 450], ["🍍", "Abacaxi", 750], ["🥦", "Brócolis", 590], ["🍋", "Limão", 60]] },
    { nome: "Padaria", icone: "🍞", cor: "#e67700", madeira: true, itens: [
      ["🍞", "Pão de forma", 890], ["🥖", "Pão francês", 120], ["🥐", "Croissant", 400], ["🍰", "Bolo", 1800, "pedaço de bolo"], ["🍪", "Biscoito", 350, "pacote de biscoito"], ["🥯", "Rosca", 650], ["🧁", "Cupcake", 550], ["🍩", "Sonho", 450]] },
    { nome: "Frios e laticínios", icone: "🧀", cor: "#1c7ed6", itens: [
      ["🥛", "Leite", 520, "caixa de leite"], ["🧀", "Queijo", 1290], ["🧈", "Manteiga", 1150], ["🥚", "Ovos", 1090, "dúzia de ovos"], ["🍦", "Sorvete", 1990, "pote de sorvete"], ["🍗", "Frango", 1690], ["🥩", "Carne", 3290], ["🐟", "Peixe", 2490]] },
    { nome: "Mercearia", icone: "🥫", cor: "#c2255c", itens: [
      ["🍚", "Arroz", 650, "pacote de arroz"], ["🫘", "Feijão", 800, "pacote de feijão"], ["🍝", "Macarrão", 490, "pacote de macarrão"], ["☕", "Café", 1690, "pacote de café"], ["🍫", "Chocolate", 650, "barra de chocolate"],
      ["🍯", "Mel", 1400, "pote de mel"], ["🧂", "Sal", 250], ["🍬", "Bala", 300, "pacote de bala"], ["🥫", "Molho de tomate", 380, "lata de molho"], ["🌽", "Milho", 420, "lata de milho"]] },
    { nome: "Bebidas", icone: "🧃", cor: "#7048e8", itens: [
      ["🧃", "Suco", 450, "caixinha de suco"], ["💧", "Água", 200, "garrafa de água"], ["🥤", "Refrigerante", 850], ["🥥", "Água de coco", 590], ["🍵", "Chá", 390, "caixa de chá"]] },
    { nome: "Limpeza e higiene", icone: "🧼", cor: "#0b7285", itens: [
      ["🧼", "Sabonete", 280], ["🧻", "Papel higiênico", 1290, "pacote de papel higiênico"], ["🪥", "Escova de dente", 690], ["🧽", "Esponja", 190], ["🧴", "Xampu", 1490]] },
  ];
  const NOTAS = [10000, 5000, 2000, 1000, 500, 200];
  const MOEDAS = [100, 50, 25, 10, 5];
  // "caixa de leite" → "caixas de leite", "pão de forma" → "pães de forma", "banana" → "bananas"
  function plural(fala) {
    const [p, ...resto] = fala.split(" ");
    const w = p.toLowerCase();
    const pl = w === "pão" ? "pães" : /s$/.test(w) ? w : /ão$/.test(w) ? w.replace(/ão$/, "ões") : /l$/.test(w) ? w.replace(/l$/, "is") : /[rz]$/.test(w) ? w + "es" : w + "s";
    return [pl, ...resto].join(" ");
  }
  // "um" ou "uma" (pela palavra principal)
  const FEMININO = /^(banana|maçã|laranja|melancia|cenoura|batata|uva|caixa|caixinha|garrafa|lata|barra|dúzia|rosca|esponja|escova|carne|água|bala)(?![a-záéíóúãõâêôç])/i;
  const artigo = fala => (FEMININO.test(fala) ? "uma" : "um");
  const reais = v => "R$ " + (v / 100).toFixed(2).replace(".", ",");
  function falado(v) {
    const r = Math.floor(v / 100), c = v % 100, p = [];
    if (r) p.push(`${r} ${r === 1 ? "real" : "reais"}`);
    if (c) p.push(`${c} centavos`);
    return p.join(" e ") || "zero reais";
  }
  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#ffe8cc"/><path d="M8 14h8l6 26h28l6-20H20" fill="none" stroke="#e8590c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 22h32l-4 14H24z" fill="#ffa94d" opacity=".55"/><circle cx="26" cy="48" r="4.5" fill="#495057"/><circle cx="46" cy="48" r="4.5" fill="#495057"/><text x="30" y="33" font-size="12">🍎</text><text x="40" y="31" font-size="11">🥛</text></svg>';

  JOGOS.push({
    id: "mercado", nome: "Supermercado", icone: ICONE, teclas: true,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: "📝", texto: "Veja a lista de compras: tem a figura e quantos de cada coisa você precisa pegar." },
      { figura: "⬅️🛒➡️", texto: "Ande com o carrinho pelo corredor e toque no produto da lista para colocar no carrinho. Cada seção tem uma placa em cima." },
      { figura: "🏷️", texto: "A etiqueta amarela mostra o preço de cada produto." },
      { figura: "🧑‍💼", texto: "Pegou tudo? Vá para o caixa: os produtos passam no leitor, bip!, e o visor mostra o total." },
      { figura: "💵🪙", texto: "Pague com as notas e moedas da sua carteira. Deu mais? O caixa devolve o troco!" },
      { figura: "🧾", texto: "No fim sai o cupom com tudo o que você comprou." },
      { figura: "🎮", texto: "No teclado ou controle: ⬅️ ➡️ andam, ⬆️ ⬇️ escolhem a prateleira e Enter (botão A) pega o produto." },
    ],
    iniciar(area, faixa) {
      const fid = (faixa && faixa.id) || "6-8";
      Motor.telaOpcoes(area, {
        chave: `mercado-${fid}`,
        padrao: { lista: fid === "5-6" ? "curta" : fid === "6-8" ? "media" : "longa", centavos: fid === "8-10" ? "sim" : "nao", troco: fid === "8-10" ? "eu" : "caixa" },
        opcoes: [
          { chave: "lista", titulo: "Tamanho da lista", valores: [["curta", "📝 Curta (3 coisas)"], ["media", "🗒️ Média (5 coisas)"], ["longa", "📜 Longa (7 coisas)"]] },
          { chave: "centavos", titulo: "Preços", valores: [["nao", "💵 Redondos (só reais)"], ["sim", "🪙 Com centavos"]] },
          { chave: "troco", titulo: "O troco", valores: [["caixa", "🧑‍💼 O caixa calcula"], ["eu", "🧮 Eu calculo"]] },
        ],
        aoJogar: op => compras(area, op, fid),
      });
    },
  });
  CATALOGO["mercado"] = ["numeros", "Faça as compras e pague no caixa"];

  function compras(area, op, fid) {
    const pequeno = fid === "5-6", centavos = op.centavos === "sim";
    const preco = it => (centavos ? it[2] : Math.max(100, Math.ceil(it[2] / 100) * 100));
    let pausado = false;
    const P = Palco.criar(area, { classe: "mercado-tela", aoPausar: () => { pausado = !pausado; P.pausa.textContent = pausado ? "▶️" : "⏸️"; } });
    const ctx = P.ctx;

    // ----- Lista de compras: produtos de seções diferentes -----
    const N = { curta: 3, media: 5, longa: 7 }[op.lista] || 5;
    const todos = SECOES.flatMap((s, si) => s.itens.map(it => ({ e: it[0], nome: it[1], preco: preco(it), fala: it[3] || it[1].toLowerCase(), secao: si })));
    const lista = [];
    const ordem = Motor.embaralhar(todos);
    for (const it of ordem) {
      if (lista.length >= N) break;
      if (lista.some(l => l.secao === it.secao) && lista.length < SECOES.length) continue;
      lista.push({ ...it, qtd: !pequeno && Math.random() < 0.35 ? 2 : 1, pegos: 0 });
    }
    // ----- Corredor: cada seção é uma estante de 4 colunas × 3 prateleiras -----
    const COLS = 4, NIV = 3;
    const slots = []; // { secao, col, niv, item }
    SECOES.forEach((s, si) => {
      const itens = todos.filter(t => t.secao === si);
      const quero = lista.filter(l => l.secao === si);
      // os da lista sempre aparecem; o resto completa a estante
      const fila = [...quero.map(q => itens.find(t => t.e === q.e)), ...Motor.embaralhar(itens.filter(t => !quero.some(q => q.e === t.e)))];
      const pos = Motor.embaralhar([...Array(COLS * NIV).keys()]);
      for (let k = 0; k < COLS * NIV; k++) slots.push({ secao: si, col: pos[k] % COLS, niv: Math.floor(pos[k] / COLS), item: fila[k % fila.length] });
    });
    const carrinho = []; // { e, nome, preco }
    let camX = 0, andar = 0, nivelSel = 1, voando = [], fase = "corredor", dicaT = 0, aviso = null, confete = [];

    // medidas (dependem da tela)
    let u, larguraSecao, totalL, yPrat;
    function medir() {
      u = Math.max(70, Math.min(P.H * 0.15, P.W / 4.6, 160));
      larguraSecao = u * COLS + u * 0.6;
      totalL = larguraSecao * SECOES.length;
      yPrat = [0.36, 0.53, 0.7].map(f => P.H * f); // base de cada prateleira
      posicionarBotoes();
    }
    const xSlot = s => s.secao * larguraSecao + u * 0.3 + s.col * u + u / 2;
    const carroX = () => camX + P.W / 2;

    // ----- Botões -----
    const bEsq = P.botao("⬅️", v => { andar = v ? -1 : andar === -1 ? 0 : andar; }, { segurar: true });
    const bDir = P.botao("➡️", v => { andar = v ? 1 : andar === 1 ? 0 : andar; }, { segurar: true });
    const bCaixa = P.botao("🧑‍💼<small>Ir para o caixa</small>", () => irAoCaixa(), { classe: "principal" });
    P.controles.append(bEsq, bDir, bCaixa);
    function posicionarBotoes() {
      Object.assign(bEsq.style, { left: "12px", bottom: "12px" });
      Object.assign(bDir.style, { left: "108px", bottom: "12px" });
      Object.assign(bCaixa.style, { right: "12px", bottom: "12px" });
    }
    const completa = () => lista.every(l => l.pegos >= l.qtd);
    function atualizarBotoes() {
      bEsq.hidden = bDir.hidden = fase !== "corredor";
      bCaixa.hidden = fase !== "corredor" || !completa();
    }
    P.teclas((e, desce) => {
      if (fase !== "corredor" || pausado) return;
      const k = e.key;
      if (k === "ArrowLeft") andar = desce ? -1 : andar === -1 ? 0 : andar;
      else if (k === "ArrowRight") andar = desce ? 1 : andar === 1 ? 0 : andar;
      else if (!desce) return;
      else if (k === "ArrowUp") nivelSel = Math.max(0, nivelSel - 1);
      else if (k === "ArrowDown") nivelSel = Math.min(NIV - 1, nivelSel + 1);
      else if (k === "Enter" || k === " ") { e.preventDefault(); if (completa()) irAoCaixa(); else pegarFrente(); }
    });
    P.canvas.addEventListener("pointerdown", e => {
      if (fase !== "corredor" || pausado) return;
      Motor.audio();
      const r = P.canvas.getBoundingClientRect(), x = e.clientX - r.left + camX, y = e.clientY - r.top;
      const s = slots.find(s => Math.abs(xSlot(s) - x) < u * 0.5 && y < yPrat[s.niv] && y > yPrat[s.niv] - u * 0.95);
      if (s) pegar(s);
    });
    function frente() {
      const cx = carroX();
      let melhor = null, d = Infinity;
      slots.forEach(s => { if (s.niv === nivelSel) { const dd = Math.abs(xSlot(s) - cx); if (dd < d) { d = dd; melhor = s; } } });
      return d < u * 0.7 ? melhor : null;
    }
    function pegarFrente() { const s = frente(); if (s) pegar(s); }
    function pegar(s) {
      const it = s.item, l = lista.find(q => q.e === it.e);
      if (!l) { aviso = { txt: "Não está na lista!", t: 1.4 }; Motor.falar(`${it.nome}? Isso não está na lista!`); Motor.nota(220, { dur: 0.15, tipo: "triangle", vol: 0.1 }); return; }
      if (l.pegos >= l.qtd) { aviso = { txt: "Já pegou!", t: 1.2 }; Motor.falar(`Já pegou ${l.qtd === 1 ? "o" : "os"} ${l.nome.toLowerCase()}!`); return; }
      l.pegos++;
      const x0 = xSlot(s) - camX, y0 = yPrat[s.niv] - u * 0.4;
      voando.push({ e: it.e, x0, y0, t: 0 });
      carrinho.push({ e: it.e, nome: it.nome, preco: it.preco });
      Motor.nota(660, { dur: 0.1, tipo: "triangle", vol: 0.12 });
      Motor.falar(`${it.nome}, ${falado(it.preco)}.` + (completa() ? " Pronto, pegou tudo! Vamos para o caixa!" : ""));
      if (completa()) { Palco.confete(confete, P.W / 2, P.H * 0.4, ["#ffd43b", "#69db7c", "#4dabf7", "#ff8787"], 50); Motor.comemorar(P.canvas); }
      atualizarBotoes();
    }

    // ----- Desenho do corredor -----
    function desenharCorredor(dt) {
      const W = P.W, H = P.H;
      // parede e chão
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#f8f9fa"); g.addColorStop(0.75, "#e9ecef"); g.addColorStop(0.751, "#dee2e6"); g.addColorStop(1, "#ced4da");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // piso de lajotas (desliza com o carrinho)
      ctx.strokeStyle = "rgba(0,0,0,.08)"; ctx.lineWidth = 2;
      const yp = H * 0.75, lt = u * 0.9;
      for (let x = -((camX * 1.2) % lt) - lt; x < W + lt; x += lt) { ctx.beginPath(); ctx.moveTo(x, yp); ctx.lineTo(x - (W / 2 - x) * 0.4, H); ctx.stroke(); }
      for (let y = yp + 18; y < H; y += (y - yp) * 0.45 + 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // luzes do teto
      for (let x = -((camX * 0.5) % 260) - 260; x < W + 260; x += 260) { ctx.fillStyle = "rgba(255,255,255,.95)"; ctx.fillRect(x, 4, 150, 10); ctx.fillStyle = "rgba(255,250,220,.25)"; ctx.fillRect(x - 20, 14, 190, 30); }
      // estantes
      SECOES.forEach((s, si) => {
        const x0 = si * larguraSecao - camX;
        if (x0 > W || x0 + larguraSecao < 0) return;
        const xi = x0 + u * 0.3, wi = u * COLS, top = yPrat[0] - u * 1.1, base = yPrat[2] + u * 0.22;
        // placa pendurada da seção
        ctx.strokeStyle = "#868e96"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xi + wi * 0.25, 0); ctx.lineTo(xi + wi * 0.25, top - u * 0.62); ctx.moveTo(xi + wi * 0.75, 0); ctx.lineTo(xi + wi * 0.75, top - u * 0.62); ctx.stroke();
        Palco.caixa(ctx, xi + wi * 0.06, top - u * 0.72, wi * 0.88, u * 0.5, 12, s.cor);
        Palco.texto(ctx, `${s.icone} ${s.nome}`, xi + wi / 2, top - u * 0.47, Math.min(u * 0.26, wi * 0.08), "#fff", { contorno: "rgba(0,0,0,.25)" });
        // fundo e laterais da estante
        ctx.fillStyle = s.madeira ? "#c08a50" : "#adb5bd"; ctx.fillRect(xi - 8, top, wi + 16, base - top);
        ctx.fillStyle = s.madeira ? "#e6b980" : "#dee2e6"; ctx.fillRect(xi, top + 6, wi, base - top - 6);
        ctx.fillStyle = "rgba(0,0,0,.06)";
        for (let c = 1; c < COLS; c++) ctx.fillRect(xi + c * u - 1, top + 6, 2, base - top);
        // prateleiras com a faixa de preços
        yPrat.forEach(y => {
          ctx.fillStyle = s.madeira ? "#8d5a2b" : "#868e96"; ctx.fillRect(xi - 6, y, wi + 12, u * 0.08);
          ctx.fillStyle = "#fff"; ctx.fillRect(xi - 6, y + u * 0.08, wi + 12, u * 0.14);
        });
      });
      // produtos e etiquetas
      const sel = fase === "corredor" ? frente() : null;
      slots.forEach(s => {
        const x = xSlot(s) - camX;
        if (x < -u || x > W + u) return;
        const y = yPrat[s.niv], it = s.item, naLista = lista.find(l => l.e === it.e);
        if (s === sel) { ctx.fillStyle = "rgba(255,212,59,.45)"; ctx.beginPath(); ctx.roundRect(x - u * 0.46, y - u * 0.92, u * 0.92, u * 0.92, 12); ctx.fill(); ctx.strokeStyle = "#f08c00"; ctx.lineWidth = 3; ctx.stroke(); }
        // vários do mesmo produto, um atrás do outro
        ctx.font = `${u * 0.5}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.globalAlpha = 0.55; ctx.fillText(it.e, x - u * 0.14, y - u * 0.16); ctx.fillText(it.e, x + u * 0.16, y - u * 0.18);
        ctx.globalAlpha = 1; ctx.font = `${u * 0.56}px sans-serif`; ctx.fillText(it.e, x, y - u * 0.08);
        // etiqueta de preço amarela
        const tw = u * 0.78;
        ctx.fillStyle = "#ffd43b"; ctx.fillRect(x - tw / 2, y + u * 0.085, tw, u * 0.13);
        Palco.texto(ctx, reais(it.preco), x, y + u * 0.152, u * 0.12, "#1d2333", { contorno: null });
        if (naLista && naLista.pegos < naLista.qtd && pequeno) { ctx.font = `${u * 0.22}px sans-serif`; ctx.fillText("⭐", x + u * 0.36, y - u * 0.7); }
      });
      desenharCarrinho(W / 2, H * 0.97, u * 1.5, dt);
      // produtos voando até o carrinho
      for (let i = voando.length - 1; i >= 0; i--) {
        const v = voando[i]; v.t += dt * 2.2;
        const t = Math.min(1, v.t), x = v.x0 + (W / 2 - v.x0) * t, y = v.y0 + (H * 0.84 - v.y0) * t - Math.sin(t * Math.PI) * u * 1.2;
        ctx.font = `${u * 0.5 * (1 - t * 0.4)}px sans-serif`; ctx.textAlign = "center"; ctx.fillText(v.e, x, y);
        if (v.t >= 1) voando.splice(i, 1);
      }
      desenharLista();
      const s = P.esc();
      if (aviso) { Palco.texto(ctx, aviso.txt, W / 2, H * 0.22, 36 * s, "#fff"); aviso.t -= dt; if (aviso.t <= 0) aviso = null; }
      dicaT += dt;
      if (dicaT < 6 || completa()) Palco.texto(ctx, completa() ? "Tudo no carrinho! Vá para o caixa 🧑‍💼" : "Ande ⬅️ ➡️ e toque no produto da lista", W / 2, H * 0.765, Math.min(19 * s, W / 24), "#fff");
    }
    function desenharCarrinho(cx, by, w, dt) {
      const h = w * 0.62, bob = andar ? Math.sin(performance.now() / 70) * 2 : 0;
      ctx.save(); ctx.translate(cx, by + bob);
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.55, 8, 0, 0, 7); ctx.fill();
      // rodas
      ctx.fillStyle = "#343a40";
      [-0.38, 0.38].forEach(f => { ctx.beginPath(); ctx.arc(f * w, -10, 10, 0, 7); ctx.fill(); });
      // cesto com grade
      const top = -h - 16, bot = -24;
      ctx.beginPath(); ctx.moveTo(-w / 2, top); ctx.lineTo(w / 2, top); ctx.lineTo(w * 0.42, bot); ctx.lineTo(-w * 0.42, bot); ctx.closePath();
      ctx.fillStyle = "rgba(208,214,222,.35)"; ctx.fill();
      // produtos dentro (os primeiros ficam no fundo)
      ctx.save(); ctx.clip();
      ctx.font = `${w * 0.2}px sans-serif`; ctx.textAlign = "center";
      carrinho.forEach((p, i) => { const col = i % 5, lin = Math.floor(i / 5); ctx.fillText(p.e, -w * 0.36 + col * w * 0.18, bot - 6 - lin * w * 0.13); });
      ctx.restore();
      ctx.strokeStyle = "#868e96"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-w / 2, top); ctx.lineTo(w / 2, top); ctx.lineTo(w * 0.42, bot); ctx.lineTo(-w * 0.42, bot); ctx.closePath(); ctx.stroke();
      ctx.lineWidth = 1.5;
      for (let k = 1; k < 8; k++) { const f = k / 8; ctx.beginPath(); ctx.moveTo(-w / 2 + w * f, top); ctx.lineTo(-w * 0.42 + w * 0.84 * f, bot); ctx.stroke(); }
      for (let k = 1; k < 4; k++) { const y = top + (bot - top) * k / 4, ww = w / 2 - (w / 2 - w * 0.42) * k / 4; ctx.beginPath(); ctx.moveTo(-ww, y); ctx.lineTo(ww, y); ctx.stroke(); }
      // alça
      ctx.strokeStyle = "#e8590c"; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-w * 0.45, top - 18); ctx.lineTo(w * 0.45, top - 18); ctx.stroke();
      ctx.strokeStyle = "#868e96"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w * 0.42, top - 18); ctx.lineTo(-w * 0.46, top); ctx.moveTo(w * 0.42, top - 18); ctx.lineTo(w * 0.46, top); ctx.stroke();
      ctx.lineCap = "butt";
      ctx.restore();
    }
    // Lista de compras de papel (canto esquerdo, embaixo da seta de voltar)
    function desenharLista() {
      const s = Math.min(1.5, P.esc()), lh = 30 * s, w = 190 * s, x = 10, y = 70;
      const h = 40 * s + lista.length * lh;
      ctx.save();
      ctx.fillStyle = "#fffdf2"; ctx.shadowColor = "rgba(0,0,0,.25)"; ctx.shadowBlur = 8;
      ctx.fillRect(x, y, w, h); ctx.restore();
      ctx.strokeStyle = "rgba(220,60,60,.4)"; ctx.beginPath(); ctx.moveTo(x + 26 * s, y); ctx.lineTo(x + 26 * s, y + h); ctx.stroke();
      Palco.texto(ctx, "📝 Lista", x + w / 2, y + 18 * s, 18 * s, "#1d2333", { contorno: null });
      lista.forEach((l, i) => {
        const yy = y + 40 * s + i * lh + lh / 2, ok = l.pegos >= l.qtd;
        ctx.strokeStyle = "rgba(29,111,184,.18)"; ctx.beginPath(); ctx.moveTo(x, yy + lh / 2); ctx.lineTo(x + w, yy + lh / 2); ctx.stroke();
        ctx.font = `${20 * s}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(l.e, x + 42 * s, yy);
        const t = `${l.qtd > 1 ? l.qtd + "× " : ""}${l.nome}`;
        Palco.texto(ctx, t.length > 13 ? t.slice(0, 12) + "…" : t, x + 58 * s, yy, 14 * s, ok ? "#868e96" : "#1d2333", { alinhar: "left", contorno: null });
        if (l.qtd > 1 && !ok) Palco.texto(ctx, `${l.pegos}/${l.qtd}`, x + w - 8 * s, yy, 12 * s, "#e8590c", { alinhar: "right", contorno: null });
        if (ok) { ctx.strokeStyle = "#2b8a3e"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 56 * s, yy); ctx.lineTo(x + w - 10 * s, yy); ctx.stroke(); Palco.texto(ctx, "✅", x + w - 14 * s, yy, 14 * s, "#000", { contorno: null }); }
      });
    }

    // ----- Caixa -----
    let esteira = [], passados = 0, totalCaixa = 0, tBip = 0, painel = null;
    function irAoCaixa() {
      if (!completa() || fase !== "corredor") return;
      fase = "caixa"; andar = 0;
      atualizarBotoes();
      esteira = carrinho.map((p, i) => ({ ...p, x: -i * 0.17 - 0.1, passou: false }));
      passados = 0; totalCaixa = 0; tBip = 0.8;
      Motor.falar("Vamos passar as compras no caixa!");
    }
    function desenharCaixa(dt) {
      const W = P.W, H = P.H, s = P.esc();
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#e7f5ff"); g.addColorStop(0.6, "#d0ebff"); g.addColorStop(0.601, "#ced4da"); g.addColorStop(1, "#adb5bd");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // placa do caixa
      Palco.caixa(ctx, W * 0.5 - 110 * s, 70, 220 * s, 44 * s, 12, "#e8590c");
      Palco.texto(ctx, "🧑‍💼 CAIXA 1", W * 0.5, 70 + 22 * s, 24 * s);
      // balcão e esteira
      const by = H * 0.62, bh = H * 0.1;
      ctx.fillStyle = "#495057"; ctx.fillRect(0, by, W, bh);
      ctx.fillStyle = "#212529"; ctx.fillRect(0, by - 10, W * 0.62, 14);
      ctx.strokeStyle = "#343a40"; ctx.lineWidth = 3;
      const off = (performance.now() / 8) % 30;
      for (let x = -30 + off; x < W * 0.62; x += 30) { ctx.beginPath(); ctx.moveTo(x, by - 10); ctx.lineTo(x, by + 4); ctx.stroke(); }
      ctx.fillStyle = "#868e96"; ctx.fillRect(0, by + bh, W, H - by - bh);
      // leitor (vidro com luz vermelha)
      const lx = W * 0.66;
      ctx.fillStyle = "#212529"; ctx.fillRect(lx - 40 * s, by - 16, 80 * s, 18);
      ctx.fillStyle = tBip > 0.5 ? "rgba(255,40,40,.6)" : "rgba(255,40,40,.25)"; ctx.fillRect(lx - 34 * s, by - 14, 68 * s, 6);
      // caixa registradora com o visor
      const rx = W * 0.8, ry = by - 150 * s;
      ctx.fillStyle = "#343a40"; ctx.beginPath(); ctx.roundRect(rx - 80 * s, ry, 160 * s, 150 * s, 12); ctx.fill();
      ctx.fillStyle = "#0b3d20"; ctx.fillRect(rx - 68 * s, ry + 14 * s, 136 * s, 44 * s);
      Palco.texto(ctx, reais(totalCaixa), rx, ry + 36 * s, 26 * s, "#8ce99a", { contorno: null });
      ctx.fillStyle = "#adb5bd";
      for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) ctx.fillRect(rx - 60 * s + j * 32 * s, ry + 70 * s + i * 24 * s, 24 * s, 18 * s);
      // produtos andando na esteira até o leitor
      esteira.forEach(p => {
        const x = p.x * W;
        if (x < -60 || x > W + 60 || p.ensacado) return;
        ctx.font = `${70 * s}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillText(p.e, x, by - 12);
        if (p.passou && p.tag > 0) { Palco.texto(ctx, reais(p.preco), x, by + bh * 0.5, 22 * s, "#ffd43b"); p.tag -= dt; } // preço que acabou de passar no leitor
      });
      // sacola
      ctx.font = `${90 * s}px sans-serif`; ctx.textAlign = "center"; ctx.fillText("🛍️", W * 0.93, by - 6);
      Palco.desenharConfete(ctx, confete, dt);
      if (!pausado && fase === "caixa") {
        tBip -= dt;
        const proximo = esteira.find(p => !p.passou);
        // cada produto anda até o leitor, sem passar o da frente; depois de passar, vai para a sacola
        let frenteX = Infinity;
        esteira.forEach(p => {
          if (p.passou) p.x += dt * 0.5;
          else p.x = Math.min(0.66, frenteX - 0.13, p.x + dt * 0.35);
          if (p.x > 0.92) p.ensacado = true;
          frenteX = p.x;
        });
        if (proximo && proximo.x >= 0.66 && tBip <= 0) {
          proximo.passou = true; proximo.tag = 1.2; totalCaixa += proximo.preco; passados++; tBip = 0.7;
          Motor.nota(1850, { dur: 0.12, tipo: "square", vol: 0.08 });
        }
        if (!proximo && esteira.every(p => p.ensacado || p.x > 0.7)) { fase = "pagar"; abrirPagamento(); }
      }
    }
    // ----- Pagamento: carteira com notas e moedas -----
    function abrirPagamento() {
      const total = totalCaixa;
      Motor.falar(`O total deu ${falado(total)}. Pague com o dinheiro da carteira!`);
      painel = document.createElement("div");
      painel.className = "mercado-pagar";
      painel.innerHTML = `<div class="mp-total">Total: <b>${reais(total)}</b></div><div class="mp-dado">Você deu: <b>R$ 0,00</b></div><div class="mp-mao"></div><div class="mp-carteira"></div><div class="mp-acoes"></div>`;
      const mao = painel.querySelector(".mp-mao"), cart = painel.querySelector(".mp-carteira"), acoes = painel.querySelector(".mp-acoes");
      let dado = [];
      const soma = () => dado.reduce((a, b) => a + b, 0);
      const pecaEl = v => { const e = document.createElement("button"); e.className = NOTAS.includes(v) ? `nota n${v / 100}` : `moeda m${v}`; e.textContent = NOTAS.includes(v) ? reais(v).replace(",00", "") : v === 100 ? "1 real" : `${v}¢`; return e; };
      const valores = [...NOTAS.filter(v => !pequeno || v <= 2000), ...(centavos ? MOEDAS : [100])];
      valores.forEach(v => {
        const b = pecaEl(v);
        b.addEventListener("click", () => { dado.push(v); pintar(); Motor.nota(520, { dur: 0.06, vol: 0.1 }); Motor.falar(falado(soma())); });
        cart.appendChild(b);
      });
      const pagar = Object.assign(document.createElement("button"), { className: "chip jogar", textContent: "✓ Pagar" });
      const limpar = Object.assign(document.createElement("button"), { className: "chip", textContent: "↩️ Pegar de volta" });
      limpar.addEventListener("click", () => { dado = []; pintar(); });
      pagar.addEventListener("click", () => {
        if (soma() < total) { Motor.falar(`Ainda falta ${falado(total - soma())}!`); painel.querySelector(".mp-dado").classList.add("falta"); setTimeout(() => painel && painel.querySelector(".mp-dado").classList.remove("falta"), 500); return; }
        receber(soma(), total);
      });
      acoes.append(limpar, pagar);
      function pintar() {
        mao.innerHTML = "";
        dado.forEach((v, i) => { const e = pecaEl(v); e.classList.add("pequena"); e.addEventListener("click", () => { dado.splice(i, 1); pintar(); }); mao.appendChild(e); });
        painel.querySelector(".mp-dado b").textContent = reais(soma());
        painel.querySelector(".mp-dado").classList.toggle("ok", soma() >= total);
      }
      P.controles.appendChild(painel);
    }
    function receber(pago, total) {
      const troco = pago - total;
      painel.remove(); painel = null;
      if (troco > 0 && op.troco === "eu") return perguntarTroco(pago, total, troco);
      concluir(pago, total, troco);
    }
    function perguntarTroco(pago, total, troco) {
      const q = document.createElement("div");
      q.className = "mercado-pagar mercado-troco";
      q.innerHTML = `<div class="mp-total">Você deu <b>${reais(pago)}</b> e a compra deu <b>${reais(total)}</b>.</div><div class="mp-pergunta">Qual é o troco?</div><div class="mp-opcoes"></div>`;
      const passo = centavos ? 50 : 100;
      const opcoes = Motor.embaralhar([troco, troco + passo, Math.max(passo, troco - passo) === troco ? troco + 2 * passo : Math.max(passo, troco - passo)]);
      Motor.falar(`Você deu ${falado(pago)}. Qual é o troco?`);
      opcoes.forEach(v => {
        const b = Object.assign(document.createElement("button"), { className: "chip", textContent: reais(v) });
        b.addEventListener("click", () => {
          if (v === troco) { q.remove(); concluir(pago, total, troco); }
          else { b.classList.add("errado"); Motor.falar(`Hum, conte de novo! De ${falado(total)} até ${falado(pago)}.`); }
        });
        q.querySelector(".mp-opcoes").appendChild(b);
      });
      P.controles.appendChild(q);
    }
    function concluir(pago, total, troco) {
      fase = "fim";
      Motor.tim();
      Palco.confete(confete, P.W / 2, P.H * 0.4, ["#ffd43b", "#69db7c", "#4dabf7", "#ff8787", "#fff"], 80);
      Motor.comemorar(P.canvas);
      Motor.falar(troco > 0 ? `Muito bem! O troco é ${falado(troco)}. Obrigado e volte sempre!` : "Pagou certinho, sem troco! Obrigado e volte sempre!");
      // troco em notas e moedas, como o caixa entrega
      const pecas = [];
      let r = troco;
      [...NOTAS, ...MOEDAS].forEach(v => { while (r >= v) { pecas.push(v); r -= v; } });
      const det = document.createElement("div");
      det.className = "mercado-fim";
      if (troco > 0) {
        const t = document.createElement("div"); t.className = "mf-troco";
        t.innerHTML = `<div>Troco: <b>${reais(troco)}</b></div>`;
        const ps = document.createElement("div"); ps.className = "mp-mao";
        pecas.forEach(v => { const e = document.createElement("span"); e.className = (NOTAS.includes(v) ? `nota n${v / 100}` : `moeda m${v}`) + " pequena"; e.textContent = NOTAS.includes(v) ? reais(v).replace(",00", "") : v === 100 ? "1 real" : `${v}¢`; ps.appendChild(e); });
        t.appendChild(ps); det.appendChild(t);
      }
      // cupom fiscal
      const cupom = document.createElement("pre");
      cupom.className = "cupom";
      const linha = (a, b) => a.padEnd(22).slice(0, 22) + b.padStart(10);
      const agrup = {};
      carrinho.forEach(p => { agrup[p.nome] = agrup[p.nome] || { n: 0, preco: p.preco }; agrup[p.nome].n++; });
      cupom.textContent = ["   SUPERMERCADO BRINCAR", "      CUPOM DE COMPRA", "--------------------------------",
        ...Object.entries(agrup).map(([nm, a]) => linha(`${a.n}x ${nm}`, reais(a.n * a.preco))),
        "--------------------------------", linha("TOTAL", reais(total)), linha("PAGO", reais(pago)), linha("TROCO", reais(troco)),
        "--------------------------------", "   OBRIGADO, VOLTE SEMPRE!"].join("\n");
      det.appendChild(cupom);
      setTimeout(() => P.vivo() && P.fim("Compras feitas!", "🛒", det, [
        { rotulo: "📝 Nova lista", principal: true, aoClicar: () => compras(area, op, fid) },
        { rotulo: "⚙️ Trocar opções", aoClicar: () => JOGOS.find(j => j.id === "mercado").iniciar(area, { id: fid }) },
      ]), 1400);
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.MERCADO_TESTE) window.MERCADO_TESTE = { pegarTudo: () => lista.forEach(l => { while (l.pegos < l.qtd) pegar(slots.find(s => s.item.e === l.e)); }), lista: () => lista.map(l => l.e + l.qtd) };
    P.aoMedir = medir;
    medir();
    atualizarBotoes();
    camX = -P.W / 2 + u * 2.5;
    P.rodar(dt => {
      if (!pausado && fase === "corredor" && andar) {
        camX = Math.max(-P.W / 2 + u * 0.8, Math.min(totalL - P.W / 2 - u * 0.5, camX + andar * u * 4.2 * dt));
      }
      if (fase === "corredor") desenharCorredor(dt);
      else desenharCaixa(dt);
      if (fase === "corredor") Palco.desenharConfete(ctx, confete, dt);
      if (pausado) Palco.texto(ctx, "⏸️ Pausa", P.W / 2, P.H / 2, 54 * P.esc());
    });
    Motor.falar(`Vamos às compras! A lista tem ${lista.map(l => (l.qtd > 1 ? `${l.qtd} ${plural(l.fala)}` : `${artigo(l.fala)} ${l.fala}`)).join(", ")}.`);
  }
})();
