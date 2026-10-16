// Inglês — palavras e frases simples com voz em inglês (en-US). As instruções continuam em
// português (Motor.falar) e a palavra é dita com a voz inglesa: "Em inglês, cachorro é... dog!".
// Modos: Explorar, Ouvir e tocar ("Where is the cat?"), Memória inglês ↔ figura, Soletrar
// (montar a palavra com letras) e Completar frases (6 a 10 anos).
(() => {
  const ID = "ingles";

  // ---------- Voz em inglês ----------
  let vozEn = null;
  function acharVoz() {
    if (!("speechSynthesis" in window)) return;
    const vs = speechSynthesis.getVoices();
    vozEn = vs.find(v => v.lang === "en-US") || vs.find(v => /^en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
  }
  if ("speechSynthesis" in window) {
    acharVoz();
    speechSynthesis.addEventListener("voiceschanged", acharVoz);
  }
  // O aparelho listou as vozes e nenhuma é inglesa (comum em celulares só com português):
  // aí a palavra é dita pela voz brasileira lendo a pronúncia aproximada ("dog" → "dóg").
  // Se a lista ainda está vazia (vozes carregando), tenta en-US mesmo assim.
  function semVozEn() {
    if (!("speechSynthesis" in window)) return true;
    if (!vozEn) acharVoz();
    return !vozEn && speechSynthesis.getVoices().length > 0;
  }
  // Nomes das letras em inglês (para soletrar), escritos do jeito que a voz brasileira lê
  const LETRAS = { A: "êi", B: "bí", C: "sí", D: "dí", E: "í", F: "éf", G: "djí", H: "êitch", I: "ái", J: "djêi", K: "kêi", L: "él", M: "ém",
    N: "én", O: "ôu", P: "pí", Q: "kiú", R: "ár", S: "és", T: "tí", U: "iú", V: "ví", W: "dâbliu", X: "éks", Y: "uái", Z: "zí" };
  // Palavras das perguntas e frases que não estão nos temas
  const PRON_EXTRA = {
    where: "uér", is: "íz", are: "ár", the: "dâ", a: "â", number: "nâm-ber", find: "fáind", listen: "lí-sen", my: "mái", name: "nêim",
    how: "ráu", you: "iú", "i'm": "áim", i: "ái", fine: "fáin", thank: "thénk", like: "láik", love: "lâv", bananas: "ba-né-nas", am: "ém",
    years: "íars", old: "ôuld", sky: "skái", have: "rév", hands: "rénds", see: "sí", this: "dís", open: "ôu-pen", your: "iór", touch: "tâtch",
    today: "tu-dêi", good: "gud", morning: "mór-ning", night: "náit", afternoon: "éf-ter-nún", dogs: "dógs", ana: "ána",
  };
  let PRON = null; // montado na primeira vez (os temas ficam mais abaixo)
  function pronuncia(texto) {
    if (!PRON) {
      PRON = new Map(Object.entries(PRON_EXTRA));
      TEMAS.forEach(t => t.itens.forEach(i => PRON.set(i.en.toLowerCase().replace(/[.?!]/g, "").trim(), i.pron)));
    }
    const limpa = s => s.toLowerCase().replace(/[.,?!]/g, "").trim();
    const tudo = PRON.get(limpa(texto));
    const r = tudo || texto.split(/\s+/).map(p => {
      const nua = p.replace(/[.,?!]/g, ""), resto = p.slice(nua.length);
      if (/^[A-Z]$/.test(nua)) return LETRAS[nua] + resto;
      const w = PRON.get(nua.toLowerCase());
      return (w || nua) + resto;
    }).join(" ");
    return r.replace(/-/g, "");
  }
  // Fala em inglês: respeita o som desligado e corta a fala anterior. Sem voz inglesa no
  // aparelho, a voz brasileira lê a pronúncia aproximada.
  function falarIngles(texto, { devagar = false } = {}) {
    if (Motor.somLigado() && semVozEn()) return Motor.falar(pronuncia(texto));
    return new Promise(resolve => {
      if (!Motor.somLigado()) return setTimeout(resolve, 250);
      if (!("speechSynthesis" in window)) return resolve();
      if (!vozEn) acharVoz();
      speechSynthesis.cancel();
      const f = new SpeechSynthesisUtterance(texto);
      f.lang = "en-US";
      if (vozEn) f.voice = vozEn;
      f.rate = devagar ? 0.7 : 0.85;
      f.pitch = 1.1;
      const limite = setTimeout(resolve, 1500 + texto.length * 120);
      f.onend = f.onerror = () => { clearTimeout(limite); resolve(); };
      speechSynthesis.speak(f);
    });
  }
  // Sequência de falas misturando português e inglês: [["pt", "Em inglês, gato é..."], ["en", "cat"]].
  // Um toque novo cancela a sequência anterior.
  let vez = 0;
  async function dizer(...partes) {
    const minha = ++vez, s = Motor.sessaoAtual();
    for (const [lingua, texto] of partes) {
      if (minha !== vez || s !== Motor.sessaoAtual()) return;
      await (lingua === "en" ? falarIngles(texto) : Motor.falar(texto));
    }
  }

  // ---------- Utilidades ----------
  function el(tag, classe, html) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function botao(classe, html, aoClicar, rotulo) {
    const b = el("button", classe, html);
    if (rotulo) b.setAttribute("aria-label", rotulo);
    b.addEventListener("click", aoClicar);
    return b;
  }
  const ler = (k, padrao) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? padrao : v; } catch (e) { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };
  const nivelDe = faixa => ({ "4-5": 0, "5-6": 1, "6-8": 2, "8-10": 3 }[faixa && faixa.id] ?? 3);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- Palavras ----------
  // { en, pt, art (artigo em português), emoji | cor | numero | dia, pron (pronúncia aproximada) }
  const NUM_EN = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];
  const NUM_PT = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove", "vinte"];
  const NUM_PRON = ["", "uân", "tchú", "thrí", "fór", "fáiv", "síks", "séven", "êit", "náin", "tén", "iléven", "tuélv", "thêr-tín", "fór-tín", "fif-tín", "siks-tín", "séven-tín", "êi-tín", "náin-tín", "tuén-ti"];
  const CORES_NUM = ["#e63946", "#f77f00", "#2a9d55", "#1e88e5", "#8e44ad", "#d6336c"];

  const TEMAS = [
    {
      id: "cores", nome: "Cores", en: "Colors", icone: "🎨",
      pergunta: i => `Where is ${i.en}?`, ajuda: i => `Onde está o ${i.pt}?`,
      itens: [
        { en: "red", pt: "vermelho", cor: "#e63946", pron: "réd" },
        { en: "blue", pt: "azul", cor: "#1e88e5", pron: "blú" },
        { en: "yellow", pt: "amarelo", cor: "#fdd835", pron: "iélou" },
        { en: "green", pt: "verde", cor: "#43a047", pron: "grín" },
        { en: "orange", pt: "laranja", cor: "#fb8c00", pron: "órindj" },
        { en: "purple", pt: "roxo", cor: "#8e44ad", pron: "pâr-pol" },
        { en: "pink", pt: "rosa", cor: "#f48fb1", pron: "pínk" },
        { en: "black", pt: "preto", cor: "#222222", pron: "blék" },
        { en: "white", pt: "branco", cor: "#ffffff", pron: "uáit" },
        { en: "brown", pt: "marrom", cor: "#8d5524", pron: "bráun" },
        { en: "gray", pt: "cinza", cor: "#9e9e9e", pron: "grêi" },
      ],
    },
    {
      id: "numeros", nome: "Números", en: "Numbers", icone: "🔢",
      pergunta: i => `Where is number ${i.en}?`, ajuda: i => `Onde está o número ${i.pt}?`,
      itens: NUM_EN.slice(1).map((en, k) => ({ en, pt: NUM_PT[k + 1], numero: k + 1, pron: NUM_PRON[k + 1] })),
    },
    {
      id: "bichos", nome: "Bichos", en: "Animals", icone: "🐶",
      itens: [
        { en: "dog", pt: "cachorro", art: "o", emoji: "🐶", pron: "dóg" },
        { en: "cat", pt: "gato", art: "o", emoji: "🐱", pron: "két" },
        { en: "bird", pt: "passarinho", art: "o", emoji: "🐦", pron: "bârd" },
        { en: "fish", pt: "peixe", art: "o", emoji: "🐟", pron: "fích" },
        { en: "cow", pt: "vaca", art: "a", emoji: "🐄", pron: "káu" },
        { en: "horse", pt: "cavalo", art: "o", emoji: "🐴", pron: "hórs" },
        { en: "pig", pt: "porco", art: "o", emoji: "🐷", pron: "píg" },
        { en: "duck", pt: "pato", art: "o", emoji: "🦆", pron: "dâk" },
        { en: "lion", pt: "leão", art: "o", emoji: "🦁", pron: "láion" },
        { en: "monkey", pt: "macaco", art: "o", emoji: "🐒", pron: "mân-ki" },
        { en: "elephant", pt: "elefante", art: "o", emoji: "🐘", pron: "é-le-fant" },
        { en: "frog", pt: "sapo", art: "o", emoji: "🐸", pron: "fróg" },
        { en: "rabbit", pt: "coelho", art: "o", emoji: "🐰", pron: "ré-bit" },
        { en: "bear", pt: "urso", art: "o", emoji: "🐻", pron: "bér" },
        { en: "chicken", pt: "galinha", art: "a", emoji: "🐔", pron: "tchí-ken" },
        { en: "turtle", pt: "tartaruga", art: "a", emoji: "🐢", pron: "târ-tol" },
      ],
    },
    {
      id: "frutas", nome: "Frutas", en: "Fruits", icone: "🍎",
      itens: [
        { en: "apple", pt: "maçã", art: "a", emoji: "🍎", pron: "é-pol" },
        { en: "banana", pt: "banana", art: "a", emoji: "🍌", pron: "ba-né-na" },
        { en: "grape", pt: "uva", art: "a", emoji: "🍇", pron: "grêip" },
        { en: "orange", pt: "laranja", art: "a", emoji: "🍊", pron: "órindj" },
        { en: "watermelon", pt: "melancia", art: "a", emoji: "🍉", pron: "uó-ter-mé-lon" },
        { en: "strawberry", pt: "morango", art: "o", emoji: "🍓", pron: "stró-bé-ri" },
        { en: "pineapple", pt: "abacaxi", art: "o", emoji: "🍍", pron: "páin-é-pol" },
        { en: "mango", pt: "manga", art: "a", emoji: "🥭", pron: "mén-gou" },
        { en: "lemon", pt: "limão", art: "o", emoji: "🍋", pron: "lé-mon" },
        { en: "pear", pt: "pera", art: "a", emoji: "🍐", pron: "pér" },
        { en: "coconut", pt: "coco", art: "o", emoji: "🥥", pron: "kôu-ko-nat" },
        { en: "cherry", pt: "cereja", art: "a", emoji: "🍒", pron: "tché-ri" },
      ],
    },
    {
      id: "familia", nome: "Família", en: "Family", icone: "👨‍👩‍👧",
      itens: [
        { en: "mother", pt: "mãe", art: "a", emoji: "👩", pron: "mâ-der" },
        { en: "father", pt: "pai", art: "o", emoji: "👨", pron: "fá-der" },
        { en: "sister", pt: "irmã", art: "a", emoji: "👧", pron: "sís-ter" },
        { en: "brother", pt: "irmão", art: "o", emoji: "👦", pron: "brâ-der" },
        { en: "baby", pt: "bebê", art: "o", emoji: "👶", pron: "bêi-bi" },
        { en: "grandmother", pt: "avó", art: "a", emoji: "👵", pron: "grén-mâ-der" },
        { en: "grandfather", pt: "avô", art: "o", emoji: "👴", pron: "grén-fá-der" },
        { en: "family", pt: "família", art: "a", emoji: "👨‍👩‍👧‍👦", pron: "fé-mi-li" },
      ],
    },
    {
      id: "corpo", nome: "Corpo", en: "Body", icone: "👃",
      itens: [
        { en: "eye", pt: "olho", art: "o", emoji: "👁️", pron: "ái" },
        { en: "ear", pt: "orelha", art: "a", emoji: "👂", pron: "ír" },
        { en: "nose", pt: "nariz", art: "o", emoji: "👃", pron: "nôuz" },
        { en: "mouth", pt: "boca", art: "a", emoji: "👄", pron: "máuth" },
        { en: "hand", pt: "mão", art: "a", emoji: "✋", pron: "hénd" },
        { en: "foot", pt: "pé", art: "o", emoji: "🦶", pron: "fút" },
        { en: "leg", pt: "perna", art: "a", emoji: "🦵", pron: "lég" },
        { en: "arm", pt: "braço", art: "o", emoji: "💪", pron: "árm" },
        { en: "tooth", pt: "dente", art: "o", emoji: "🦷", pron: "túth" },
        { en: "tongue", pt: "língua", art: "a", emoji: "👅", pron: "tâng" },
        { en: "hair", pt: "cabelo", art: "o", emoji: "💇", pron: "hér" },
      ],
    },
    {
      id: "escola", nome: "Escola", en: "School", icone: "🎒",
      itens: [
        { en: "pencil", pt: "lápis", art: "o", emoji: "✏️", pron: "pén-sol" },
        { en: "book", pt: "livro", art: "o", emoji: "📕", pron: "búk" },
        { en: "backpack", pt: "mochila", art: "a", emoji: "🎒", pron: "bék-pék" },
        { en: "scissors", pt: "tesoura", art: "a", emoji: "✂️", pron: "sí-zors", plural: true },
        { en: "ruler", pt: "régua", art: "a", emoji: "📏", pron: "rú-ler" },
        { en: "crayon", pt: "giz de cera", art: "o", emoji: "🖍️", pron: "krêi-on" },
        { en: "notebook", pt: "caderno", art: "o", emoji: "📓", pron: "nôut-búk" },
        { en: "teacher", pt: "professora", art: "a", emoji: "🧑‍🏫", pron: "tí-tcher" },
        { en: "school", pt: "escola", art: "a", emoji: "🏫", pron: "skúl" },
        { en: "computer", pt: "computador", art: "o", emoji: "💻", pron: "kom-piú-ter" },
      ],
    },
    {
      id: "frases", nome: "Cumprimentos", en: "Hello!", curto: "Olá · Hello!", icone: "👋",
      pergunta: i => `Find: ${i.en}`, ajuda: i => `Ache: ${i.pt}!`,
      itens: [
        { en: "hello", pt: "olá", emoji: "🙋", pron: "rê-lou" },
        { en: "good morning", pt: "bom dia", emoji: "🌅", pron: "gud mór-ning" },
        { en: "good afternoon", pt: "boa tarde", emoji: "🌤️", pron: "gud éf-ter-nún" },
        { en: "good night", pt: "boa noite", emoji: "🌙", pron: "gud náit" },
        { en: "goodbye", pt: "tchau", emoji: "👋", pron: "gud-bái" },
        { en: "please", pt: "por favor", emoji: "🙏", pron: "plíz" },
        { en: "thank you", pt: "obrigado", emoji: "💝", pron: "thénk iú" },
        { en: "sorry", pt: "desculpa", emoji: "😔", pron: "só-ri" },
        { en: "yes", pt: "sim", emoji: "👍", pron: "iés" },
        { en: "no", pt: "não", emoji: "👎", pron: "nôu" },
        { en: "How are you?", pt: "como você está?", emoji: "🙂", pron: "ráu ár iú" },
        { en: "I'm fine", pt: "eu estou bem", emoji: "😀", pron: "áim fáin" },
        { en: "My name is...", pt: "meu nome é...", emoji: "📛", pron: "mái nêim íz" },
        { en: "I like...", pt: "eu gosto de...", emoji: "❤️", pron: "ái láik" },
        { en: "I love you", pt: "eu te amo", emoji: "🥰", pron: "ái lâv iú" },
      ],
    },
    {
      id: "dias", nome: "Dias da semana", en: "Days", curto: "Dias · Days", icone: "📅",
      pergunta: i => `Where is ${i.en}?`, ajuda: i => `Onde está ${i.art} ${i.pt}?`,
      itens: [
        { en: "Sunday", pt: "domingo", art: "o", dia: "SUN", pron: "sân-dei" },
        { en: "Monday", pt: "segunda-feira", art: "a", dia: "MON", pron: "mân-dei" },
        { en: "Tuesday", pt: "terça-feira", art: "a", dia: "TUE", pron: "tiúz-dei" },
        { en: "Wednesday", pt: "quarta-feira", art: "a", dia: "WED", pron: "uénz-dei" },
        { en: "Thursday", pt: "quinta-feira", art: "a", dia: "THU", pron: "thârz-dei" },
        { en: "Friday", pt: "sexta-feira", art: "a", dia: "FRI", pron: "frái-dei" },
        { en: "Saturday", pt: "sábado", art: "o", dia: "SAT", pron: "sé-ter-dei" },
      ],
    },
  ];
  const DIA_CORES = ["#ef476f", "#f78c6b", "#e0a800", "#06b98a", "#118ab2", "#7b5cd6", "#e05cb3"];
  const perguntaEn = (tema, i) => (tema.pergunta ? tema.pergunta(i) : `Where ${i.plural ? "are" : "is"} the ${i.en}?`);
  const perguntaPt = (tema, i) => (tema.ajuda ? tema.ajuda(i) : `Onde está ${i.art} ${i.pt}?`);
  // Itens do tema para a idade (números até 10 para os menores)
  const itensDe = (tema, nivel) => (tema.id === "numeros" && nivel < 2 ? tema.itens.slice(0, 10) : tema.itens);

  // Figura grande de cada palavra
  function figura(i) {
    if (i.cor) return `<span class="en-bola" style="--c:${i.cor}"></span>`;
    if (i.numero) return `<span class="en-numero" style="--c:${CORES_NUM[i.numero % CORES_NUM.length]}">${i.numero}</span>`;
    if (i.dia) return `<span class="en-dia" style="--c:${DIA_CORES[["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].indexOf(i.dia)]}"><i></i><b>${i.dia}</b></span>`;
    return `<span class="en-emoji">${i.emoji}</span>`;
  }
  // null = ninguém mexeu: mostra a pronúncia sozinho quando o aparelho não tem voz inglesa
  let mostrarPron = ler("ingles-pron", null);
  const pronLigada = () => (mostrarPron == null ? semVozEn() : mostrarPron);
  // Cartão: figura + palavra em inglês (+ português e pronúncia, se pedidos)
  function cartao(i, { palavra = true, pt = false, pron = false, soPalavra = false } = {}) {
    const c = el("button", "cartao com-figura en-cartao" + (soPalavra ? " so-palavra" : ""));
    c.setAttribute("aria-label", i.en);
    let h = soPalavra ? "" : `<span class="en-fig">${figura(i)}</span>`;
    if (palavra || soPalavra) h += `<b class="en-pal">${esc(i.en)}</b>`;
    if (pt) h += `<small class="en-pt">${esc(i.pt)}</small>`;
    if (pron) h += `<small class="en-pron">🗣️ ${esc(i.pron)}</small>`;
    c.innerHTML = h;
    return c;
  }

  // Palavras compridas ("grandmother", "seventeen") diminuem até caber, sem quebrar no meio
  function encaixar(raiz) {
    requestAnimationFrame(() => raiz.querySelectorAll(".en-pal, .en-palavra-grande, .en-frase-txt > b").forEach(e => {
      e.style.fontSize = "";
      let t = parseFloat(getComputedStyle(e).fontSize), n = 0;
      while ((e.scrollWidth > e.clientWidth + 1 || e.getBoundingClientRect().right > innerWidth - 8) && t > 15 && n++ < 40) { t -= 2; e.style.fontSize = t + "px"; }
    }));
  }
  let esperaEncaixe = null;
  window.addEventListener("resize", () => { clearTimeout(esperaEncaixe); esperaEncaixe = setTimeout(() => { const t = document.querySelector(".en-tela"); if (t) encaixar(t); }, 250); });

  // Estrutura das telas: topo (desviando do 🏠) + conteúdo
  function montarTela(area, titulo, classe = "") {
    area.innerHTML = "";
    const tela = el("div", "en-tela " + classe);
    const topo = el("div", "en-topo");
    const tit = el("div", "en-titulo", titulo);
    const chips = el("div", "en-chips");
    topo.append(tit, chips);
    tela.appendChild(topo);
    area.appendChild(tela);
    return { tela, topo, tit, chips };
  }
  const tituloTema = t => `<span class="en-tema-ic">${t.icone}</span><span><b>${esc(t.en)}</b><small>${esc(t.nome)}</small></span>`;

  // ---------- 👆 Explorar ----------
  function explorar(area, faixa, tema) {
    const nivel = nivelDe(faixa);
    const itens = itensDe(tema, nivel);
    const porTela = nivel === 0 ? 4 : 6;
    const { tela, chips } = montarTela(area, tituloTema(tema));
    const grade = el("div", "grade en-grade en-g" + porTela);
    tela.appendChild(grade);
    let pagina = 0, ultimoTocado = null;
    const paginas = Math.ceil(itens.length / porTela);
    const bPron = botao("chip en-chip-pron" + (pronLigada() ? " ativo" : ""), "🗣️ Pronúncia", () => {
      mostrarPron = !pronLigada();
      gravar("ingles-pron", mostrarPron);
      bPron.classList.toggle("ativo", mostrarPron);
      desenhar();
      Motor.falar(mostrarPron ? "Pronúncia aproximada ligada, para os pais lerem junto." : "Pronúncia escondida.");
    }, "Mostrar a pronúncia aproximada");
    chips.appendChild(bPron);
    if (paginas > 1) chips.appendChild(botao("chip en-mais", "➡️ Mais", () => { pagina = (pagina + 1) % paginas; desenhar(); Motor.ploc(); }, "Outras palavras"));
    function desenhar() {
      grade.innerHTML = "";
      itens.slice(pagina * porTela, pagina * porTela + porTela).forEach(i => {
        const c = cartao(i, { pt: true, pron: pronLigada() });
        c.addEventListener("click", () => {
          Motor.animar(c, "pula");
          if (ultimoTocado === i) dizer(["en", i.en]);
          else dizer(["pt", `Em inglês, ${i.pt} é...`], ["en", i.en]);
          ultimoTocado = i;
        });
        grade.appendChild(c);
      });
      encaixar(grade);
    }
    desenhar();
    Motor.falar("Toque nas figuras para ouvir em inglês!");
  }

  // ---------- 👂 Ouvir e tocar ----------
  function quiz(area, faixa, tema) {
    const nivel = nivelDe(faixa);
    const itens = itensDe(tema, nivel);
    const nOpcoes = nivel < 2 ? 3 : 4;
    const RODADA = 8;
    const tipos = nivel < 2 ? ["ouvir"] : nivel === 2 ? ["ouvir", "ouvir", "ler"] : ["ouvir", "ler", "escolher"];
    const { tela, chips } = montarTela(area, tituloTema(tema), "en-quiz");
    const placar = el("span", "chip en-placar");
    chips.append(placar, botao("chip", "🔊", () => perguntar(), "Repetir"));
    const enun = el("div", "en-enun");
    const grade = el("div", "grade");
    tela.append(enun, grade);
    let feitas = 0, dePrimeira = 0, ajudaPt = true, atual = null, bloqueado = false, errou = false, ultimo = null;

    function perguntar(comAjuda) {
      const q = atual;
      if (q.tipo === "ouvir") {
        const partes = [["en", perguntaEn(tema, q.alvo)]];
        if (comAjuda) partes.push(["pt", perguntaPt(tema, q.alvo)]);
        return dizer(...partes);
      }
      if (q.tipo === "ler") return dizer(["pt", "Leia a palavra em inglês e toque na figura certa!"]);
      return dizer(["pt", `Como se diz ${q.alvo.pt} em inglês? Toque na palavra certa!`]);
    }
    function nova() {
      bloqueado = false;
      errou = false;
      let alvo;
      do { alvo = Motor.sortear(itens); } while (alvo === ultimo && itens.length > 1);
      ultimo = alvo;
      const outros = Motor.embaralhar(itens.filter(i => i !== alvo && i.en !== alvo.en)).slice(0, nOpcoes - 1);
      atual = { alvo, tipo: Motor.sortear(tipos), opcoes: Motor.embaralhar([alvo, ...outros]) };
      enun.innerHTML = "";
      enun.className = "en-enun en-tipo-" + atual.tipo;
      if (atual.tipo === "ouvir") {
        const b = botao("en-ouvir", `<span class="en-orelha">👂</span><span><b>Listen!</b><small>Escute e toque</small></span>`, () => perguntar(true), "Ouvir de novo");
        enun.appendChild(b);
      } else if (atual.tipo === "ler") {
        enun.innerHTML = `<b class="en-palavra-grande">${esc(alvo.en)}</b>`;
      } else {
        // A figura do enunciado também fala (o nome em português)
        enun.appendChild(botao("en-fig-grande", figura(alvo), () => perguntar(), alvo.pt));
      }
      grade.className = `grade g${atual.opcoes.length} en-grade-quiz`;
      grade.innerHTML = "";
      atual.opcoes.forEach(i => {
        const c = atual.tipo === "escolher" ? cartao(i, { soPalavra: true }) : cartao(i, { palavra: false });
        c.addEventListener("click", () => responder(i, c));
        grade.appendChild(c);
      });
      placar.textContent = `⭐ ${feitas} / ${RODADA}`;
      encaixar(tela);
      perguntar(ajudaPt);
      ajudaPt = false;
    }
    function responder(i, c) {
      if (bloqueado) return;
      const q = atual;
      if (i === q.alvo) {
        bloqueado = true;
        feitas++;
        if (!errou) dePrimeira++;
        placar.textContent = `⭐ ${feitas} / ${RODADA}`;
        c.classList.add("certo");
        if (q.tipo !== "escolher") { c.insertAdjacentHTML("beforeend", `<b class="en-pal">${esc(i.en)}</b>`); encaixar(c); }
        Motor.animar(c, "pula");
        Motor.comemorar(c);
        Motor.tim();
        const s = Motor.sessaoAtual();
        dizer(["en", `Yes! ${i.en}!`], ["pt", `${Motor.elogio()} ${Motor.maiuscula(i.pt)}.`]).then(() => {
          if (s !== Motor.sessaoAtual() || q !== atual) return;
          if (feitas >= RODADA) Motor.depois(() => Motor.telaFim(area, dePrimeira, RODADA, () => quiz(area, faixa, tema)), 300);
          else Motor.depois(nova, 500);
        });
        return;
      }
      errou = true;
      c.classList.add("errado");
      Motor.animar(c, "balanca");
      if (q.tipo === "ouvir") dizer(["pt", "Esse é"], ["en", i.en], ["pt", "Tente de novo!"], ["en", perguntaEn(tema, q.alvo)], ["pt", perguntaPt(tema, q.alvo)]);
      else dizer(["pt", "Esse é"], ["en", i.en], ["pt", "Tente de novo!"]);
    }
    nova();
  }

  // ---------- 🃏 Memória inglês ↔ figura ----------
  function memoria(area, faixa, tema) {
    const nivel = nivelDe(faixa);
    const pares = [3, 4, 6, 6][nivel];
    const { tela, chips } = montarTela(area, tituloTema(tema), "en-memoria");
    const info = el("span", "chip en-placar");
    chips.appendChild(info);
    const escolhidos = Motor.embaralhar(itensDe(tema, nivel)).slice(0, pares);
    const cartas = Motor.embaralhar(escolhidos.flatMap(i => [{ i, lado: "fig" }, { i, lado: "pal" }]));
    const grade = el("div", `grade g${cartas.length} memoria en-memo`);
    tela.appendChild(grade);
    let aberta = null, travado = false, achados = 0, jogadas = 0;
    const pintarInfo = () => { info.textContent = `🃏 ${achados} / ${pares}`; };
    pintarInfo();
    cartas.forEach(carta => {
      const c = el("button", "cartao com-figura virada en-carta");
      c.innerHTML = '<span class="en-verso">?</span>';
      c.setAttribute("aria-label", "carta");
      c.addEventListener("click", () => {
        if (travado || !c.classList.contains("virada")) return;
        c.classList.remove("virada");
        c.innerHTML = carta.lado === "fig" ? `<span class="en-fig">${figura(carta.i)}</span>` : `<b class="en-pal">${esc(carta.i.en)}</b>`;
        c.classList.toggle("lado-palavra", carta.lado === "pal");
        encaixar(c);
        Motor.ploc();
        // Toda carta aberta fala: a palavra em inglês ou o nome da figura em português
        dizer(carta.lado === "pal" ? ["en", carta.i.en] : ["pt", Motor.maiuscula(carta.i.pt)]);
        if (!aberta) { aberta = { c, carta }; return; }
        jogadas++;
        const anterior = aberta;
        aberta = null;
        if (anterior.carta.i === carta.i) {
          achados++;
          pintarInfo();
          [anterior.c, c].forEach(x => { x.classList.add("certo"); Motor.animar(x, "pula"); });
          Motor.comemorar(c);
          Motor.tim();
          if (achados === pares) {
            const s = Motor.sessaoAtual();
            dizer(["en", carta.i.en], ["pt", `Você achou todos os pares em ${jogadas} jogadas!`]).then(() => {
              if (s === Motor.sessaoAtual()) Motor.depois(() => Motor.telaFim(area, pares, pares, () => memoria(area, faixa, tema)), 300);
            });
          } else dizer(["en", carta.i.en], ["pt", `${Motor.maiuscula(carta.i.pt)}!`]);
        } else {
          travado = true;
          Motor.depois(() => {
            [anterior.c, c].forEach(x => { x.classList.add("virada"); x.classList.remove("lado-palavra"); x.innerHTML = '<span class="en-verso">?</span>'; });
            travado = false;
          }, 1300);
        }
      });
      grade.appendChild(c);
    });
    Motor.falar("Ache os pares: a figura e a palavra em inglês!");
  }

  // ---------- 🔤 Soletrar: montar a palavra com letras ----------
  // (Montado aqui, e não com Motor.modoMontar, porque as letras e a palavra pronta são ditas
  // com a voz em inglês.)
  function soletrar(area, faixa, tema) {
    const nivel = nivelDe(faixa);
    const max = nivel === 2 ? 5 : 9;
    const soLetras = itensDe(tema, nivel).filter(i => /^[a-z]+$/i.test(i.en));
    let lista = soLetras.filter(i => i.en.length <= max);
    // Tema sem palavras curtas (dias da semana): aceita as do tema até 9 letras
    if (lista.length < 3) lista = soLetras.filter(i => i.en.length <= 9);
    if (lista.length < 3) lista = TEMAS.find(t => t.id === "bichos").itens.filter(i => i.en.length <= max);
    const RODADA = 5;
    let feitas = 0, dePrimeira = 0, ultimo = null;
    const { tela, chips } = montarTela(area, tituloTema(tema), "en-soletrar");
    const placar = el("span", "chip en-placar");
    let atual = null;
    chips.append(placar, botao("chip", "🔊", () => anunciar(), "Repetir"));
    const enun = el("div", "enunciado en-enun-montar");
    const grade = el("div", "grade pecas en-pecas");
    tela.append(enun, grade);
    const anunciar = () => dizer(["pt", `Escreva em inglês: ${atual.pt}.`], ["en", atual.en]);
    function nova() {
      let item;
      do { item = Motor.sortear(lista); } while (item === ultimo && lista.length > 1);
      ultimo = item;
      atual = item;
      const letras = [...item.en.toUpperCase()];
      const ALFA = "ABCDEFGHIJKLMNOPRSTUVWY";
      const extras = Motor.embaralhar([...ALFA].filter(l => !letras.includes(l))).slice(0, nivel === 2 ? 2 : 3);
      let prox = 0, erros = 0;
      enun.innerHTML = "";
      const fig = el("span", "en-fig-montar", figura(item));
      fig.addEventListener("click", () => dizer(["en", item.en]));
      const direita = el("div", "en-montar-dir");
      const modelo = el("div", "en-modelo", nivel === 2 ? esc(item.en.toUpperCase()) : "");
      const caixa = el("span", "lacunas");
      const lacunas = letras.map(() => { const l = el("span", "lacuna", " "); caixa.appendChild(l); return l; });
      direita.append(modelo, caixa);
      enun.append(fig, direita);
      grade.innerHTML = "";
      function tentar(letra, c) {
        if (c.disabled || prox >= letras.length) return false;
        if (letra !== letras[prox]) {
          erros++;
          Motor.animar(c, "balanca");
          dizer(["en", letra]);
          if (erros >= 2 && !modelo.textContent) modelo.textContent = item.en.toUpperCase();
          return false;
        }
        lacunas[prox].textContent = letra;
        Motor.animar(lacunas[prox], "pula");
        c.disabled = true;
        c.style.visibility = "hidden";
        prox++;
        if (prox < letras.length) { Motor.ploc(); dizer(["en", letra]); return true; }
        feitas++;
        if (!erros) dePrimeira++;
        placar.textContent = `⭐ ${feitas} / ${RODADA}`;
        Motor.comemorar(enun);
        Motor.tim();
        const s = Motor.sessaoAtual();
        dizer(["en", letras.join(", ")], ["en", item.en], ["pt", Motor.elogio()]).then(() => {
          if (s !== Motor.sessaoAtual() || atual !== item) return;
          if (feitas >= RODADA) Motor.depois(() => Motor.telaFim(area, dePrimeira, RODADA, () => soletrar(area, faixa, tema)), 300);
          else Motor.depois(nova, 500);
        });
        return true;
      }
      Motor.embaralhar([...letras, ...extras]).forEach(letra => {
        const c = Motor.criarCartao({ nome: letra }, Motor.desenharTexto("palavra"));
        Motor.arrastavel(c, { alvos: () => lacunas.slice(prox, prox + 1), aoSoltar: () => tentar(letra, c) });
        c.addEventListener("click", () => tentar(letra, c));
        grade.appendChild(c);
      });
      placar.textContent = `⭐ ${feitas} / ${RODADA}`;
      anunciar();
    }
    nova();
  }

  // ---------- 💬 Completar frases ----------
  const FRASES = [
    { f: "Good ___!", c: "morning", o: ["cat", "red", "night"], e: "🌅", pt: "Bom dia!" },
    { f: "Good ___!", c: "night", o: ["apple", "blue", "morning"], e: "🌙", pt: "Boa noite!" },
    { f: "My ___ is Ana.", c: "name", o: ["dog", "red", "hand"], e: "📛", pt: "Meu nome é Ana." },
    { f: "How ___ you?", c: "are", o: ["dog", "red", "is"], e: "🙂", pt: "Como você está?" },
    { f: "I'm ___, thank you.", c: "fine", o: ["book", "dog", "four"], e: "😀", pt: "Estou bem, obrigado." },
    { f: "I ___ bananas.", c: "like", o: ["dog", "red", "two"], e: "🍌❤️", pt: "Eu gosto de bananas." },
    { f: "I am ___ years old.", c: "seven", o: ["blue", "cat", "hello"], e: "🎂", pt: "Eu tenho sete anos.", extra: "7" },
    { f: "The apple is ___.", c: "red", o: ["dog", "two", "blue"], e: "🍎", pt: "A maçã é vermelha." },
    { f: "The sky is ___.", c: "blue", o: ["cat", "three", "pink"], e: "☁️", pt: "O céu é azul." },
    { f: "The frog is ___.", c: "green", o: ["book", "hello", "yellow"], e: "🐸", pt: "O sapo é verde." },
    { f: "The banana is ___.", c: "yellow", o: ["nose", "six", "black"], e: "🍌", pt: "A banana é amarela." },
    { f: "I have two ___.", c: "hands", o: ["red", "hello", "nose"], e: "🙌", pt: "Eu tenho duas mãos." },
    { f: "I see a ___.", c: "cat", o: ["red", "two", "hello"], e: "🐱", pt: "Eu vejo um gato." },
    { f: "This is my ___.", c: "mother", o: ["apple", "blue", "ten"], e: "👩", pt: "Esta é a minha mãe." },
    { f: "This is my ___.", c: "father", o: ["banana", "green", "nine"], e: "👨", pt: "Este é o meu pai." },
    { f: "Thank ___!", c: "you", o: ["red", "cat", "book"], e: "🙏", pt: "Obrigado!" },
    { f: "I ___ you!", c: "love", o: ["red", "dog", "two"], e: "🥰", pt: "Eu te amo!" },
    { f: "Open your ___.", c: "book", o: ["red", "dog", "seven"], e: "📖", pt: "Abra o seu livro." },
    { f: "Touch your ___.", c: "nose", o: ["banana", "blue", "one"], e: "👃", pt: "Toque no seu nariz." },
    { f: "Today is ___.", c: "Monday", o: ["apple", "green", "hello"], e: "📅", pt: "Hoje é segunda-feira." },
    { f: "___, how are you?", c: "Hello", o: ["Apple", "Red", "Five"], e: "👋", pt: "Olá, como você está?" },
    { f: "I have ___ dogs.", c: "three", o: ["red", "cat", "hello"], e: "🐶🐶🐶", pt: "Eu tenho três cachorros." },
  ];
  function completar(area, faixa) {
    const nivel = nivelDe(faixa);
    const nOp = nivel === 3 ? 4 : 3;
    const RODADA = 8;
    const { tela, chips } = montarTela(area, '<span class="en-tema-ic">💬</span><span><b>Sentences</b><small>Completar frases</small></span>', "en-quiz en-frases");
    const placar = el("span", "chip en-placar");
    chips.append(placar, botao("chip", "🔊", () => perguntar(), "Repetir"));
    const enun = el("div", "en-enun frase");
    const grade = el("div", "grade");
    tela.append(enun, grade);
    let feitas = 0, dePrimeira = 0, atual = null, bloqueado = false, errou = false, ultimo = null, primeira = true;
    const falada = q => q.f.replace("___", "...");
    function perguntar() {
      return dizer(...(primeira ? [["pt", "Complete a frase em inglês!"]] : []), ["en", falada(atual)]);
    }
    function nova() {
      bloqueado = false;
      errou = false;
      let q;
      do { q = Motor.sortear(FRASES); } while (q === ultimo);
      ultimo = q;
      atual = q;
      const ops = Motor.embaralhar([q.c, ...Motor.embaralhar(q.o).slice(0, nOp - 1)]);
      enun.innerHTML = `<span class="en-frase-emoji">${q.e}${q.extra ? `<b>${q.extra}</b>` : ""}</span><span class="en-frase-txt"><b>${esc(q.f).replace("___", '<span class="en-lacuna">?</span>')}</b><small>${esc(q.pt)}</small></span>`;
      grade.className = `grade g${ops.length} en-grade-palavras`;
      grade.innerHTML = "";
      ops.forEach(w => {
        const c = cartao({ en: w }, { soPalavra: true });
        c.addEventListener("click", () => responder(w, c));
        grade.appendChild(c);
      });
      placar.textContent = `⭐ ${feitas} / ${RODADA}`;
      encaixar(tela);
      perguntar();
      primeira = false;
    }
    function responder(w, c) {
      if (bloqueado) return;
      const q = atual;
      if (w === q.c) {
        bloqueado = true;
        feitas++;
        if (!errou) dePrimeira++;
        placar.textContent = `⭐ ${feitas} / ${RODADA}`;
        c.classList.add("certo");
        enun.querySelector(".en-lacuna").textContent = w;
        enun.querySelector(".en-lacuna").classList.add("cheia");
        Motor.animar(c, "pula");
        Motor.comemorar(c);
        Motor.tim();
        const s = Motor.sessaoAtual();
        dizer(["en", q.f.replace("___", w)], ["pt", `${Motor.elogio()} ${q.pt}`]).then(() => {
          if (s !== Motor.sessaoAtual() || q !== atual) return;
          if (feitas >= RODADA) Motor.depois(() => Motor.telaFim(area, dePrimeira, RODADA, () => completar(area, faixa)), 300);
          else Motor.depois(nova, 500);
        });
        return;
      }
      errou = true;
      c.classList.add("errado");
      Motor.animar(c, "balanca");
      dizer(["en", w], ["pt", "Hum, não combina. Leia de novo!"], ["en", falada(q)]);
    }
    nova();
  }

  // ---------- Menus ----------
  function escolherTema(area, faixa, iniciar) {
    Motor.escolherModo(area, TEMAS.map(t => ({
      icone: t.icone, rotulo: t.curto || `${t.nome} · ${t.en}`,
      iniciar: () => iniciar(t),
    })), { pequenos: true });
    { const mm = area.querySelector(":scope > .modos"); if (mm) mm.classList.add("en-modos"); }
    Motor.falar("Escolha um tema!");
  }

  const ICONE = `<svg viewBox="0 0 76 50" aria-hidden="true"><rect width="76" height="50" rx="7" fill="#b22234"/>${[1, 3, 5].map(k => `<rect y="${k * 50 / 7}" width="76" height="${50 / 7}" fill="#fff"/>`).join("")}<rect width="32" height="${50 * 4 / 7}" rx="5" fill="#3c3b6e"/>${[0, 1, 2].map(r => [0, 1, 2, 3].map(c => `<circle cx="${5 + c * 7.3}" cy="${5 + r * 8.5}" r="1.9" fill="#fff"/>`).join("")).join("")}</svg>`;

  JOGOS.push({
    id: ID, nome: "Inglês", icone: ICONE,
    faixas: ["4-5", "5-6", "6-8", "8-10"],
    ajuda: faixa => [
      { figura: ["🐶", "dog"], texto: "Toque na figura para ouvir a palavra em inglês. Em inglês, cachorro é dog!" },
      { figura: ["👂", "🐱"], texto: "Em Ouvir e tocar, escute a pergunta em inglês, como Where is the cat?, e toque na figura certa." },
      { figura: ["🍎", "apple"], texto: "Na Memória, ache os pares: a figura e a palavra em inglês." },
      ...(nivelDe(faixa) >= 2 ? [
        { figura: ["🐸", "F", "R", "O", "G"], texto: "Em Soletrar, toque nas letras na ordem certa para escrever a palavra." },
        { figura: "💬", texto: "Em Completar frases, escolha a palavra que falta na frase." },
      ] : []),
      { figura: "🗣️", texto: "Para os pais: o botão Pronúncia mostra como se fala, do jeito que a gente escreve em português." },
    ],
    iniciar(area, faixa) {
      const nivel = nivelDe(faixa);
      const comTema = fn => () => escolherTema(area, faixa, t => fn(area, faixa, t));
      Motor.escolherModo(area, [
        { icone: "👆", rotulo: "Explorar", iniciar: comTema(explorar) },
        { icone: "👂", rotulo: "Ouvir e tocar", iniciar: comTema(quiz) },
        { icone: "🃏", rotulo: "Memória", iniciar: comTema(memoria) },
        ...(nivel >= 2 ? [
          { icone: "🔤", rotulo: "Soletrar", iniciar: comTema(soletrar) },
          { icone: "💬", rotulo: "Completar frases", iniciar: () => completar(area, faixa) },
        ] : []),
      ]);
    { const mm = area.querySelector(":scope > .modos"); if (mm) mm.classList.add("en-modos"); }
    },
  });
  CATALOGO[ID] = ["leitura", "Palavras e frases em inglês"];
})();
