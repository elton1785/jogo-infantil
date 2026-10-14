// Pintura — pintura livre, colorir desenhos e pintar letras/números (inclusive o nome da criança).
(() => {
  const CORES = ["#e63946", "#f77f00", "#ffd60a", "#2a9d55", "#277da1", "#7b2cbf", "#ff70a6", "#8d5524", "#222222", "#ffffff"];
  const NOMES_COR = { "#e63946": "vermelho", "#f77f00": "laranja", "#ffd60a": "amarelo", "#2a9d55": "verde", "#277da1": "azul",
    "#7b2cbf": "roxo", "#ff70a6": "rosa", "#8d5524": "marrom", "#222222": "preto", "#ffffff": "branco" };

  // Paleta de cores; `aoEscolher(cor)` é chamado ao tocar. Devolve o elemento.
  function paleta(aoEscolher, cores = CORES, extras = []) {
    const el = document.createElement("div");
    el.className = "paleta";
    const botoes = [];
    const marcar = b => { botoes.forEach(x => x.classList.remove("ativa")); b.classList.add("ativa"); };
    cores.forEach((cor, i) => {
      const b = document.createElement("button");
      b.className = "cor";
      b.style.background = cor;
      b.setAttribute("aria-label", NOMES_COR[cor] || cor);
      b.addEventListener("click", () => { marcar(b); aoEscolher(cor); if (NOMES_COR[cor]) Motor.falar(Motor.maiuscula(NOMES_COR[cor])); });
      el.appendChild(b);
      botoes.push(b);
      if (i === 0) b.classList.add("ativa");
    });
    extras.forEach(({ icone, rotulo, aoClicar, marcavel }) => {
      const b = document.createElement("button");
      b.className = "cor ferramenta";
      b.textContent = icone;
      b.setAttribute("aria-label", rotulo);
      b.addEventListener("click", () => { if (marcavel) marcar(b); aoClicar(); });
      el.appendChild(b);
      if (marcavel) botoes.push(b);
    });
    return el;
  }

  // Canvas que ocupa `caixa` com nitidez em telas de alta densidade
  function criarCanvas(caixa) {
    const c = document.createElement("canvas");
    caixa.appendChild(c);
    const r = caixa.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    c.style.width = r.width + "px";
    c.style.height = r.height + "px";
    const ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);
    return { c, ctx, w: r.width, h: r.height };
  }

  // Desenhar com o dedo. `estilo()` → { cor, largura, borracha } ; `aoTerminar` após cada traço.
  function pincel({ c, ctx }, estilo, { aoTocar, aoTerminar } = {}) {
    c.style.touchAction = "none";
    let ultimo = null;
    const pos = e => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    c.addEventListener("pointerdown", e => {
      try { c.setPointerCapture(e.pointerId); } catch (err) { /* ponteiro já liberado */ }
      const p = pos(e);
      if (aoTocar && aoTocar(p)) return; // ex.: carimbo — não desenha traço
      ultimo = p;
      tracar(p, p);
    });
    c.addEventListener("pointermove", e => { if (!ultimo) return; const p = pos(e); tracar(ultimo, p); ultimo = p; });
    const fim = () => { if (ultimo && aoTerminar) aoTerminar(); ultimo = null; };
    c.addEventListener("pointerup", fim);
    c.addEventListener("pointercancel", fim);

    function tracar(a, b) {
      const { cor, largura, borracha } = estilo();
      ctx.globalCompositeOperation = borracha ? "destination-out" : "source-over";
      ctx.strokeStyle = cor;
      ctx.lineWidth = largura;
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x + 0.01, b.y);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
  }

  // ---------- Pintura livre ----------
  function pinturaLivre(area) {
    let cor = CORES[0], largura = 18, borracha = false, arcoIris = false, carimbo = null, matiz = 0;
    const CARIMBOS = ["⭐", "❤️", "🌸", "🐶", "🦋", "☀️", "🌈", "🐟"];

    const quadro = document.createElement("div");
    quadro.className = "quadro";
    area.appendChild(quadro);
    let tela = null;
    const ligarPincel = () => pincel(tela, () => {
      if (arcoIris) { matiz = (matiz + 4) % 360; return { cor: `hsl(${matiz} 90% 55%)`, largura, borracha: false }; }
      return { cor, largura, borracha };
    }, {
      aoTocar: p => {
        if (!carimbo) return false;
        tela.ctx.font = `${largura * 3.5}px serif`;
        tela.ctx.textAlign = "center";
        tela.ctx.textBaseline = "middle";
        tela.ctx.fillText(carimbo, p.x, p.y);
        Motor.ploc();
        return true;
      },
    });

    const modoPincel = () => { borracha = false; arcoIris = false; carimbo = null; };
    const barra = paleta(c => { modoPincel(); cor = c; }, CORES, [
      { icone: "🌈", rotulo: "Arco-íris", marcavel: true, aoClicar: () => { modoPincel(); arcoIris = true; Motor.falar("Arco-íris!"); } },
      { icone: "⭐", rotulo: "Carimbos", marcavel: true, aoClicar: () => {
        modoPincel();
        carimbo = CARIMBOS[(CARIMBOS.indexOf(carimbo) + 1) % CARIMBOS.length] || CARIMBOS[0];
        barra.querySelector('[aria-label="Carimbos"]').textContent = carimbo;
      } },
      { icone: "🧽", rotulo: "Borracha", marcavel: true, aoClicar: () => { modoPincel(); borracha = true; } },
      { icone: "➖", rotulo: "Pincel fino", aoClicar: () => { largura = 8; } },
      { icone: "➕", rotulo: "Pincel grosso", aoClicar: () => { largura = 30; } },
      { icone: "🗑️", rotulo: "Limpar", aoClicar: () => { tela.ctx.clearRect(0, 0, tela.w, tela.h); } },
      { icone: "💾", rotulo: "Salvar", aoClicar: () => salvar(tela.c) },
    ]);
    area.appendChild(barra);
    tela = criarCanvas(quadro);
    ligarPincel();
    Motor.falar("Vamos pintar! Escolha uma cor e pinte com o dedo.");
  }

  function salvar(canvas) {
    // Fundo branco na imagem salva
    const copia = document.createElement("canvas");
    copia.width = canvas.width;
    copia.height = canvas.height;
    const ctx = copia.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, copia.width, copia.height);
    ctx.drawImage(canvas, 0, 0);
    const a = document.createElement("a");
    a.href = copia.toDataURL("image/png");
    a.download = "meu-desenho.png";
    a.click();
    Motor.falar("Desenho salvo!");
  }

  // ---------- Colorir desenhos (tocar nas partes) ----------
  // Cada desenho: SVG 200x200; elementos com class="r" são regiões pintáveis.
  const DESENHOS = [
    { nome: "casa", svg: `
      <rect class="r" x="0" y="160" width="200" height="40"/>
      <circle class="r" cx="170" cy="30" r="18"/>
      <rect class="r" x="125" y="45" width="16" height="35"/>
      <polygon class="r" points="30,95 100,40 170,95"/>
      <rect class="r" x="40" y="95" width="120" height="70"/>
      <rect class="r" x="88" y="120" width="26" height="45"/>
      <rect class="r" x="52" y="108" width="26" height="24"/>
      <rect class="r" x="124" y="108" width="26" height="24"/>` },
    { nome: "peixe", svg: `
      <rect class="r" x="0" y="0" width="200" height="200"/>
      <polygon class="r" points="150,100 190,65 190,135"/>
      <ellipse class="r" cx="95" cy="100" rx="65" ry="42"/>
      <polygon class="r" points="85,60 110,35 120,62"/>
      <circle class="r" cx="60" cy="90" r="9"/>
      <path class="r" d="M100 70 Q115 100 100 130 Q125 100 100 70Z"/>
      <circle class="r" cx="30" cy="40" r="8"/><circle class="r" cx="45" cy="20" r="5"/>` },
    { nome: "flor", svg: `
      <rect class="r" x="95" y="100" width="10" height="70"/>
      <ellipse class="r" cx="75" cy="140" rx="20" ry="9"/>
      <ellipse class="r" cx="125" cy="130" rx="20" ry="9"/>
      <circle class="r" cx="100" cy="45" r="22"/><circle class="r" cx="135" cy="70" r="22"/>
      <circle class="r" cx="122" cy="108" r="22"/><circle class="r" cx="78" cy="108" r="22"/>
      <circle class="r" cx="65" cy="70" r="22"/>
      <circle class="r" cx="100" cy="78" r="18"/>
      <polygon class="r" points="70,170 130,170 122,198 78,198"/>` },
    { nome: "borboleta", svg: `
      <ellipse class="r" cx="62" cy="70" rx="45" ry="40"/><ellipse class="r" cx="138" cy="70" rx="45" ry="40"/>
      <ellipse class="r" cx="70" cy="135" rx="32" ry="30"/><ellipse class="r" cx="130" cy="135" rx="32" ry="30"/>
      <circle class="r" cx="60" cy="70" r="14"/><circle class="r" cx="140" cy="70" r="14"/>
      <ellipse class="r" cx="100" cy="105" rx="10" ry="55"/>
      <path class="l" d="M96 52 Q85 25 70 20 M104 52 Q115 25 130 20"/>` },
    { nome: "carro", svg: `
      <rect class="r" x="0" y="165" width="200" height="35"/>
      <polygon class="r" points="55,95 75,60 135,60 155,95"/>
      <rect class="r" x="20" y="95" width="165" height="50" rx="12"/>
      <polygon class="r" points="68,92 82,68 102,68 102,92"/><polygon class="r" points="108,92 108,68 130,68 145,92"/>
      <circle class="r" cx="55" cy="148" r="22"/><circle class="r" cx="150" cy="148" r="22"/>
      <circle class="r" cx="55" cy="148" r="9"/><circle class="r" cx="150" cy="148" r="9"/>
      <rect class="r" x="172" y="105" width="13" height="12"/>` },
    { nome: "arco-íris", svg: `
      <path class="r" d="M10 150 A90 90 0 0 1 190 150 L176 150 A76 76 0 0 0 24 150Z"/>
      <path class="r" d="M24 150 A76 76 0 0 1 176 150 L162 150 A62 62 0 0 0 38 150Z"/>
      <path class="r" d="M38 150 A62 62 0 0 1 162 150 L148 150 A48 48 0 0 0 52 150Z"/>
      <path class="r" d="M52 150 A48 48 0 0 1 148 150 L134 150 A34 34 0 0 0 66 150Z"/>
      <path class="r" d="M66 150 A34 34 0 0 1 134 150 L120 150 A20 20 0 0 0 80 150Z"/>
      <path class="r" d="M5 165 a18 18 0 0 1 20 -25 a22 22 0 0 1 40 5 a15 15 0 0 1 5 20Z"/>
      <path class="r" d="M130 165 a18 18 0 0 1 20 -25 a22 22 0 0 1 40 5 a15 15 0 0 1 5 20Z"/>` },
    { nome: "sorvete", svg: `
      <polygon class="r" points="70,110 130,110 100,195"/>
      <circle class="r" cx="100" cy="95" r="32"/>
      <circle class="r" cx="78" cy="65" r="26"/><circle class="r" cx="122" cy="65" r="26"/>
      <circle class="r" cx="100" cy="38" r="24"/>
      <circle class="r" cx="100" cy="10" r="9"/>` },
    { nome: "canoa no rio", svg: `
      <rect class="r" x="0" y="0" width="200" height="120"/>
      <circle class="r" cx="160" cy="35" r="20"/>
      <rect class="r" x="0" y="120" width="200" height="80"/>
      <polygon class="r" points="40,115 100,30 100,115"/>
      <rect class="r" x="100" y="25" width="5" height="95"/>
      <path class="r" d="M20 120 L180 120 Q160 150 100 150 Q40 150 20 120Z"/>
      <polygon class="r" points="10,120 25,80 40,120"/>` },
  ];

  const ARTIGO = { casa: "a", peixe: "o", flor: "a", borboleta: "a", carro: "o", "arco-íris": "o", sorvete: "o", "canoa no rio": "a" };

  function colorir(area) {
    let cor = CORES[0], indice = Motor.aleatorio(0, DESENHOS.length - 1);
    const folha = document.createElement("div");
    folha.className = "folha";
    area.appendChild(folha);

    function mostrar() {
      const d = DESENHOS[indice % DESENHOS.length];
      folha.innerHTML = `<svg viewBox="-4 -4 208 208" class="desenho">${d.svg}</svg>`;
      folha.querySelectorAll(".r").forEach(r => r.addEventListener("click", () => {
        r.style.fill = cor;
        Motor.ploc();
      }));
      Motor.falar(`Vamos colorir ${ARTIGO[d.nome]} ${d.nome}!`);
    }

    area.appendChild(paleta(c => { cor = c; }, CORES, [
      { icone: "✅", rotulo: "Pronto", aoClicar: () => { Motor.comemorar(folha); Motor.tim(); Motor.falar(`Que lindo! ${Motor.elogio()}`); } },
      { icone: "➡️", rotulo: "Outro desenho", aoClicar: () => { indice++; mostrar(); } },
    ]));
    mostrar();
  }

  // ---------- Pintar letras e números ----------
  const FALA = { A: "á", B: "bê", C: "cê", D: "dê", E: "é", F: "éfe", G: "gê", H: "agá", I: "í", J: "jóta", K: "cá",
    L: "éle", M: "ême", N: "êne", O: "ó", P: "pê", Q: "quê", R: "érre", S: "ésse", T: "tê", U: "ú", V: "vê", W: "dáblio",
    X: "xis", Y: "ípsilon", Z: "zê" };
  const falaDe = ch => FALA[ch] || FALA[ch.normalize("NFD")[0]] || ch;

  function lerNome() {
    try { return localStorage.getItem("nome-crianca") || ""; } catch (e) { return ""; }
  }

  function pintarSimbolos(area, simbolos, titulo) {
    const s = Motor.sessaoAtual();
    let i = 0, cor = CORES[4];
    const quadro = document.createElement("div");
    quadro.className = "quadro quadro-letra";
    area.appendChild(quadro);
    area.appendChild(paleta(c => { cor = c; }, CORES.slice(0, 8), [
      { icone: "➡️", rotulo: "Próxima", aoClicar: () => { i++; desenhar(); } },
    ]));

    let tela = null, pontos = [], concluido = false;

    function desenhar() {
      quadro.innerHTML = "";
      concluido = false;
      const ch = simbolos[i % simbolos.length];
      const guia = criarCanvas(quadro);
      tela = criarCanvas(quadro);
      tela.c.classList.add("tinta");
      const tam = Math.min(guia.w, guia.h) * 0.85;
      const fonte = `bold ${tam}px "Comic Sans MS", "Chalkboard SE", sans-serif`;
      // Guia: a letra clarinha com contorno pontilhado
      Object.assign(guia.ctx, { font: fonte, textAlign: "center", textBaseline: "middle" });
      guia.ctx.fillStyle = "#e9e4d8";
      guia.ctx.fillText(ch, guia.w / 2, guia.h / 2 + tam * 0.05);
      guia.ctx.setLineDash([10, 8]);
      guia.ctx.lineWidth = 3;
      guia.ctx.strokeStyle = "#b9b1a0";
      guia.ctx.strokeText(ch, guia.w / 2, guia.h / 2 + tam * 0.05);

      // Pontos de amostra dentro da letra (para medir quanto já foi pintado)
      const passo = 8;
      const dados = guia.ctx.getImageData(0, 0, guia.c.width, guia.c.height).data;
      const dpr = guia.c.width / guia.w;
      pontos = [];
      for (let y = 0; y < guia.h; y += passo) for (let x = 0; x < guia.w; x += passo) {
        const k = (Math.floor(y * dpr) * guia.c.width + Math.floor(x * dpr)) * 4;
        if (dados[k + 3] > 0 && dados[k] === 0xe9) pontos.push([Math.floor(x * dpr), Math.floor(y * dpr)]);
      }

      const largura = Math.max(18, tam * 0.11);
      pincel(tela, () => ({ cor, largura }), { aoTerminar: conferir });
      Motor.falar(`${titulo ? titulo + ". " : ""}Pinte ${/\d/.test(ch) ? "o número" : "a letra"} ${falaDe(ch)}!`);
    }

    function conferir() {
      if (concluido) return;
      const dados = tela.ctx.getImageData(0, 0, tela.c.width, tela.c.height).data;
      const pintados = pontos.filter(([x, y]) => dados[(y * tela.c.width + x) * 4 + 3] > 0).length;
      if (pintados / pontos.length < 0.8) return;
      concluido = true;
      const ch = simbolos[i % simbolos.length];
      Motor.comemorar(quadro);
      Motor.tim();
      Motor.falar(`${Motor.maiuscula(falaDe(ch))}! ${Motor.elogio()}`).then(() => {
        if (s !== Motor.sessaoAtual()) return;
        i++;
        if (titulo && i % simbolos.length === 0) Motor.falar(`Você pintou o nome ${titulo}!`).then(() => Motor.depois(desenhar, 600));
        else Motor.depois(desenhar, 600);
      });
    }

    desenhar();
  }

  function meuNome(area) {
    const nome = lerNome();
    if (nome) return pintarSimbolos(area, [...nome.toUpperCase().replace(/[^A-ZÀ-Ú]/g, "")], Motor.maiuscula(nome.toLowerCase()));
    // Um adulto digita o nome uma vez; fica guardado neste aparelho
    const caixa = document.createElement("div");
    caixa.className = "pedir-nome";
    caixa.innerHTML = `<label>Nome da criança (para um adulto digitar):</label><input maxlength="12" autocomplete="off"><button class="modo"><span class="icone">✅</span><span class="rotulo">Pronto</span></button>`;
    const input = caixa.querySelector("input");
    caixa.querySelector("button").addEventListener("click", () => {
      const n = input.value.trim();
      if (!n) return input.focus();
      try { localStorage.setItem("nome-crianca", n); } catch (e) {}
      area.innerHTML = "";
      meuNome(area);
    });
    area.appendChild(caixa);
    input.focus();
  }

  const VOGAIS = ["A", "E", "I", "O", "U"];
  const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const NUMEROS = "0123456789".split("");

  JOGOS.push({
    id: "pintura", nome: "Pintura Livre", icone: "🖌️", faixas: ["1-2", "2-3", "3-4", "4-5", "5-6", "6-8", "8-10"],
    iniciar: area => pinturaLivre(area),
  });

  JOGOS.push({
    id: "colorir", nome: "Colorir Desenhos", icone: "🖍️", faixas: ["2-3", "3-4", "4-5", "5-6"],
    iniciar: area => colorir(area),
  });

  JOGOS.push({
    id: "pintar-letras", nome: "Pintar Letras", icone: "✍️", faixas: ["3-4", "4-5", "5-6"],
    iniciar(area, faixa) {
      const modos = [
        { icone: "🅰️", rotulo: "Vogais",   iniciar: () => pintarSimbolos(area, VOGAIS) },
        { icone: "🔤", rotulo: "Alfabeto", iniciar: () => pintarSimbolos(area, ALFABETO) },
        { icone: "🔢", rotulo: "Números",  iniciar: () => pintarSimbolos(area, NUMEROS) },
        { icone: "😊", rotulo: "Meu nome", iniciar: () => meuNome(area) },
      ];
      Motor.escolherModo(area, faixa && faixa.id === "3-4" ? [modos[0], modos[2], modos[3]] : modos);
    },
  });
})();
