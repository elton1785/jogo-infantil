// Motor compartilhado por todos os jogos: voz, sons, animações e modos prontos.
// Scripts comuns (sem módulos) para funcionar abrindo o index.html direto, sem servidor.

const FAIXAS = [
  { id: "1-2",  nome: "1 a 2 anos",  icone: "🍼" },
  { id: "2-3",  nome: "2 a 3 anos",  icone: "🧸" },
  { id: "3-4",  nome: "3 a 4 anos",  icone: "🎨" },
  { id: "4-5",  nome: "4 a 5 anos",  icone: "🔤" },
  { id: "5-6",  nome: "5 a 6 anos",  icone: "📖" },
  { id: "6-8",  nome: "6 a 8 anos",  icone: "✏️" },
  { id: "8-10", nome: "8 a 10 anos", icone: "🌎" },
];

const JOGOS = [];

const Motor = (() => {
  // Cada entrada/saída de jogo abre uma nova sessão; callbacks de sessões antigas são ignorados.
  let sessao = 0;
  let audioAtual = null;
  let vozPt = null;

  function escolherVoz() {
    const vozes = speechSynthesis.getVoices();
    vozPt = vozes.find(v => v.lang === "pt-BR") || vozes.find(v => v.lang.startsWith("pt")) || null;
  }
  if ("speechSynthesis" in window) {
    escolherVoz();
    speechSynthesis.onvoiceschanged = escolherVoz;
  }

  function novaSessao() {
    sessao++;
    protegida = null;
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (audioAtual) audioAtual.pause();
    return sessao;
  }

  function sessaoAtual() { return sessao; }

  // setTimeout que não dispara se a criança já saiu do jogo
  function depois(fn, ms) {
    const s = sessao;
    setTimeout(() => { if (s === sessao) fn(); }, ms);
  }

  // Volume do app (voz e efeitos), de 0 a 1, escolhido na área dos pais. O volume do aparelho o
  // navegador não deixa mudar: este é um ajuste dentro dele.
  let volume = 1;
  try { const v = parseFloat(localStorage.getItem("volume")); if (v > 0 && v <= 1) volume = v; } catch (e) { /* ok */ }
  let mestre = null; // ganho geral dos efeitos (Web Audio)
  function definirVolume(v) {
    volume = Math.max(0.05, Math.min(1, v));
    try { localStorage.setItem("volume", String(volume)); } catch (e) { /* ok */ }
    if (mestre) mestre.gain.value = volume;
  }

  // Som ligado/desligado (voz e efeitos), guardado no aparelho
  let mudo = false;
  try { mudo = localStorage.getItem("som") === "desligado"; } catch (e) { /* ok */ }
  const somLigado = () => !mudo;
  function alternarSom() {
    mudo = !mudo;
    try { localStorage.setItem("som", mudo ? "desligado" : "ligado"); } catch (e) { /* ok */ }
    if (mudo && "speechSynthesis" in window) speechSynthesis.cancel();
    return !mudo;
  }
  // Botão 🔊/🔇 para pôr nos jogos
  function botaoSom() {
    const b = document.createElement("button");
    b.className = "chip botao-som";
    const pintar = () => { b.textContent = mudo ? "🔇" : "🔊"; b.setAttribute("aria-label", mudo ? "Ligar o som" : "Desligar o som"); };
    pintar();
    b.addEventListener("click", () => { alternarSom(); pintar(); if (!mudo) falar("Som ligado!"); });
    return b;
  }

  // Fala o texto. `naFila: true` espera a fala anterior terminar em vez de cortá-la
  // (ex.: o computador anunciando pontos e logo em seguida "sua vez").
  // `importante: true`: ninguém corta esta fala (as falas seguintes esperam). Usada na recompensa,
  // para a próxima pergunta não engolir o "você ganhou 3 estrelas".
  let ultimaFala = Promise.resolve(), protegida = null;
  function falar(texto, { naFila = false, importante = false } = {}) {
    if (importante) {
      const p = falar(texto, { naFila: true });
      protegida = p;
      p.then(() => { if (protegida === p) protegida = null; });
      return p;
    }
    if (naFila || protegida) {
      const s = sessao;
      ultimaFala = ultimaFala.then(() => (s === sessao ? falarAgora(texto) : null));
      return ultimaFala;
    }
    ultimaFala = falarAgora(texto);
    return ultimaFala;
  }
  function falarAgora(texto) {
    return new Promise(resolve => {
      if (mudo) return setTimeout(resolve, 250);
      if (!("speechSynthesis" in window)) return resolve();
      speechSynthesis.cancel();
      const f = new SpeechSynthesisUtterance(texto);
      f.lang = "pt-BR";
      if (vozPt) f.voice = vozPt;
      f.rate = 0.9;
      f.volume = volume;
      f.pitch = 1.2;
      // Alguns aparelhos não disparam onend; o limite de tempo evita travar o jogo.
      const limite = setTimeout(resolve, 1500 + texto.length * 110);
      f.onend = f.onerror = () => { clearTimeout(limite); resolve(); };
      speechSynthesis.speak(f);
    });
  }

  // Toca sons/<arquivo>; se o arquivo não existir, a voz fala o texto reserva.
  function tocarSom(arquivo, textoReserva) {
    return new Promise(resolve => {
      if (audioAtual) audioAtual.pause();
      if (mudo) return setTimeout(resolve, 250);
      const a = new Audio(`sons/${arquivo}`);
      audioAtual = a;
      a.onended = resolve;
      a.play().catch(() => (textoReserva ? falar(textoReserva) : Promise.resolve()).then(resolve));
    });
  }

  // ---------- Sons sintetizados (sem arquivos) ----------
  let ctx = null;
  function audio() {
    if (!ctx) {
      // iPhone: som de "player" toca mesmo com a chave do silencioso (Safari 16.4+); quem cala é o 🔇 do app
      try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { /* ok */ }
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      // Todos os efeitos passam por um volume geral: quem liga em ctx.destination liga nele
      mestre = ctx.createGain();
      mestre.gain.value = volume;
      mestre.connect(ctx.destination);
      try { Object.defineProperty(ctx, "destination", { value: mestre }); } catch (e) { /* ok */ }
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Uma nota. `ate`: frequência final (para efeitos como o tambor que "cai").
  function nota(freq, { dur = 0.5, tipo = "sine", vol = 0.3, inicio = 0, ate } = {}) {
    if (mudo) return;
    const a = audio();
    if (!a) return;
    const t = a.currentTime + inicio;
    const o = a.createOscillator(), g = a.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(freq, t);
    if (ate) o.frequency.exponentialRampToValueAtTime(ate, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function ruido({ dur = 0.2, vol = 0.3, filtro = "lowpass", freq = 1000, inicio = 0 } = {}) {
    if (mudo) return;
    const a = audio();
    if (!a) return;
    const t = a.currentTime + inicio;
    const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource();
    src.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = filtro;
    f.frequency.value = freq;
    const g = a.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(a.destination);
    src.start(t);
  }

  const ploc = () => nota(400, { dur: 0.15, vol: 0.4, ate: 1400 });
  // Musiquinha curta de acerto
  const tim = () => [523, 659, 784].forEach((f, i) => nota(f, { dur: 0.25, tipo: "triangle", vol: 0.2, inicio: i * 0.09 }));

  // ---------- Utilidades ----------
  // Variedade: cada lista fixa de conteúdo (bichos, objetos, palavras...) lembra o que saiu há
  // pouco, e o sorteio seguinte prefere o que não saiu. Sem isso, listas pequenas repetem quase
  // tudo de uma rodada para a outra. Listas de números e listas novas (montadas na hora) não lembram.
  const recentes = new WeakMap();
  const lembra = lista => Array.isArray(lista) && lista.length >= 3 && typeof lista[0] !== "number";
  const memoriaDe = lista => Math.min(6, Math.floor(lista.length / 2));
  function lembrarSaida(lista, itens) {
    const r = (recentes.get(lista) || []).filter(x => !itens.includes(x));
    r.push(...itens);
    recentes.set(lista, r.slice(-memoriaDe(lista)));
  }
  function embaralhar(lista) {
    let l = [...lista];
    for (let i = l.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [l[i], l[j]] = [l[j], l[i]];
    }
    if (!lembra(lista)) return l;
    // O que saiu há pouco vai para o fim (quem usa .slice(0, n) pega primeiro o que não saiu)
    const r = recentes.get(lista) || [];
    if (r.length) l = [...l.filter(x => !r.includes(x)), ...r.filter(x => l.includes(x))];
    lembrarSaida(lista, l.slice(0, Math.max(1, Math.min(memoriaDe(lista), Math.ceil(lista.length / 4)))));
    return l;
  }

  function sortear(lista) {
    if (!lembra(lista)) return lista[Math.floor(Math.random() * lista.length)];
    const r = recentes.get(lista) || [];
    const livres = lista.filter(x => !r.includes(x));
    const item = (livres.length ? livres : lista)[Math.floor(Math.random() * (livres.length || lista.length))];
    lembrarSaida(lista, [item]);
    return item;
  }
  const aleatorio = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const maiuscula = t => t[0].toUpperCase() + t.slice(1);

  const ELOGIOS = ["Muito bem!", "Isso mesmo!", "Parabéns!", "Que legal!", "Você acertou!"];
  function elogio() { return sortear(ELOGIOS); }

  // Opções numéricas: a certa + vizinhas plausíveis (nunca abaixo de `min`).
  // Devolve { certa, opcoes } prontos para o modoQuiz. `formatar` muda o texto do cartão.
  function opcoesNumericas(valor, { quantas = 3, min = 0, formatar = String, vizinhos } = {}) {
    const candidatos = vizinhos || [valor - 1, valor + 1, valor - 2, valor + 2, valor + 3];
    const outros = embaralhar([...new Set(candidatos)].filter(n => n >= min && n !== valor)).slice(0, quantas - 1);
    const certa = { nome: formatar(valor), valor };
    return { certa, opcoes: [certa, ...outros.map(n => ({ nome: formatar(n), valor: n }))] };
  }

  // Faixas dos menores usam menos opções por pergunta
  const ehPequeno = faixa => !faixa || ["1-2", "2-3"].includes(faixa.id);

  function animar(el, classe) {
    if (classe === "balanca" && typeof Progresso !== "undefined") Progresso.erro(); // resposta errada
    el.classList.remove(classe);
    void el.offsetWidth; // reinicia a animação
    el.classList.add(classe);
  }

  // Comemoração de acerto/vitória. Conta um ponto para o álbum de figurinhas (js/album.js),
  // a não ser com `contar = false`.
  function comemorar(el, contar = true) {
    if (contar && typeof Album !== "undefined") Album.ponto();
    if (contar && typeof Progresso !== "undefined") Progresso.acerto();
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("div");
      s.className = "estrela";
      s.textContent = ["⭐", "✨", "🌟"][i % 3];
      const ang = (Math.PI * 2 * i) / 12;
      s.style.left = cx - 20 + "px";
      s.style.top = cy - 20 + "px";
      s.style.setProperty("--dx", Math.cos(ang) * 160 + "px");
      s.style.setProperty("--dy", Math.sin(ang) * 160 + "px");
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1300);
    }
  }

  // Cartão grande clicável. Por padrão desenha item.emoji; jogos podem passar `desenhar`.
  function criarCartao(item, desenhar) {
    const b = document.createElement("button");
    b.className = "cartao";
    b.setAttribute("aria-label", item.nome);
    if (desenhar) desenhar(item, b);
    else b.textContent = item.emoji;
    return b;
  }

  // Conteúdo do cartão (palavra, número, letra ou figura) do maior tamanho que cabe nele.
  // Palavras longas, como "Rio de Janeiro", quebram linha entre as palavras, sem cortar no meio.
  // Figuras e números ocupam boa parte do cartão (antes ficavam com 1/4 dele no celular).
  function ajustarTexto(el) {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    const palavra = el.classList.contains("palavra");
    let lo = 14, hi = palavra ? Math.min(140, h * 0.58, w * 0.9) : Math.min(230, h * 0.64, w * 0.86); // a busca garante que cabe
    while (hi - lo > 1) {
      const meio = (lo + hi) / 2;
      el.style.fontSize = meio + "px";
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) hi = meio; else lo = meio;
    }
    el.style.fontSize = Math.max(14, lo * (palavra ? 0.9 : 0.94)) + "px"; // uma folguinha para não encostar na borda
  }
  // Cartões com desenho próprio (bolinha de cor, pizza, letra + figura) já têm o tamanho certo
  const tamanhoProprio = c => c.classList.contains("com-figura") || !!c.querySelector("svg, img, canvas, .bolinha");
  // Os cartões de uma mesma grade ficam todos com o mesmo tamanho (o do conteúdo mais comprido)
  function ajustarTextos(raiz) {
    requestAnimationFrame(() => {
      const grades = new Set([...raiz.querySelectorAll(".grade > .cartao")].map(c => c.parentElement));
      grades.forEach(g => {
        const cs = [...g.querySelectorAll(":scope > .cartao")].filter(c => !tamanhoProprio(c));
        if (!cs.length) return;
        cs.forEach(ajustarTexto);
        const menor = Math.min(...cs.map(c => parseFloat(c.style.fontSize) || 99));
        cs.forEach(c => { c.style.fontSize = menor + "px"; });
      });
    });
  }
  // Cartões novos na tela (qualquer jogo, qualquer modo): ajusta sozinho
  let esperaCartoes = null;
  new MutationObserver(ms => {
    if (!ms.some(m => [...m.addedNodes].some(n => n.nodeType === 1 && (n.matches(".cartao, .grade") || n.querySelector?.(".grade > .cartao"))))) return;
    clearTimeout(esperaCartoes);
    esperaCartoes = setTimeout(() => ajustarTextos(document), 30);
  }).observe(document.documentElement, { childList: true, subtree: true });
  // Girou a tela: ajusta de novo
  let esperaAjuste = null;
  window.addEventListener("resize", () => { clearTimeout(esperaAjuste); esperaAjuste = setTimeout(() => ajustarTextos(document), 200); });

  // Desenho de cartão só com texto (números, sílabas, nomes). `classe`: numero | palavra | letra
  function desenharTexto(classe) {
    return (item, b) => { b.textContent = item.nome; b.classList.add(classe); };
  }

  // ---------- Arrastar com o dedo ----------
  // `alvos()`: elementos onde a peça pode ser solta. `aoSoltar(alvo)` devolve true se aceitou;
  // senão a peça volta ao lugar. Um toque sem arrastar continua sendo um clique normal.
  // `aoComecar()` / `aoTerminar()` (opcionais): quando o arraste começa e quando termina.
  function arrastavel(el, { alvos, aoSoltar, aoComecar, aoTerminar }) {
    el.classList.add("arrastavel");
    el.style.touchAction = "none";
    // Depois de um arraste, o navegador ainda dispara um "click": ignoramos esse.
    el.addEventListener("click", e => {
      if (el._arrastou) { e.stopImmediatePropagation(); el._arrastou = false; }
    }, true);

    const alvoEm = (x, y) => alvos().find(a => {
      const b = a.getBoundingClientRect();
      return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
    }) || null;

    el.addEventListener("pointerdown", ev => {
      if (el.disabled) return;
      const r = el.getBoundingClientRect();
      const x0 = ev.clientX, y0 = ev.clientY;
      let fantasma = null, sobre = null;
      try { el.setPointerCapture(ev.pointerId); } catch (e) { /* ponteiro já liberado */ }

      const mover = e => {
        if (!fantasma) {
          if (Math.hypot(e.clientX - x0, e.clientY - y0) < 8) return; // ainda é um toque
          fantasma = el.cloneNode(true);
          fantasma.classList.add("fantasma");
          Object.assign(fantasma.style, { width: r.width + "px", height: r.height + "px" });
          document.body.appendChild(fantasma);
          el.style.opacity = "0.3";
          if (aoComecar) aoComecar();
        }
        fantasma.style.left = r.left + e.clientX - x0 + "px";
        fantasma.style.top = r.top + e.clientY - y0 + "px";
        const novo = alvoEm(e.clientX, e.clientY);
        if (novo !== sobre) {
          if (sobre) sobre.classList.remove("sobre");
          if (novo) novo.classList.add("sobre");
          sobre = novo;
        }
      };

      const soltar = e => {
        el.removeEventListener("pointermove", mover);
        el.removeEventListener("pointerup", soltar);
        el.removeEventListener("pointercancel", soltar);
        if (sobre) sobre.classList.remove("sobre");
        if (!fantasma) return; // foi só um toque
        el._arrastou = true;
        const alvo = e.type === "pointerup" ? alvoEm(e.clientX, e.clientY) : null;
        const f = fantasma;
        if (alvo && aoSoltar(alvo)) {
          f.remove();
          el.style.opacity = "";
          return;
        }
        if (aoTerminar) aoTerminar();
        // Não encaixou: volta deslizando
        f.style.transition = "left .25s, top .25s";
        f.style.left = r.left + "px";
        f.style.top = r.top + "px";
        setTimeout(() => { f.remove(); el.style.opacity = ""; }, 260);
      };

      el.addEventListener("pointermove", mover);
      el.addEventListener("pointerup", soltar);
      el.addEventListener("pointercancel", soltar);
    });
  }

  function botaoCanto(classe, icone, rotulo, aoClicar) {
    const b = document.createElement("button");
    b.className = `canto ${classe}`;
    b.textContent = icone;
    b.setAttribute("aria-label", rotulo);
    b.addEventListener("click", aoClicar);
    return b;
  }

  // ---------- Tela de opções (jogos de mesa) ----------
  // `opcoes`: [{ chave, titulo, valores: [[valor, rotulo], ...] }]. A escolha fica guardada no
  // aparelho em `chave`. `antes`: elemento mostrado no topo (ex.: placar). `aoJogar(op)` ao tocar em Jogar.
  // `aoMudar(op, chave)`: pode ajustar outras opções que não combinam com a escolhida.
  function telaOpcoes(area, { opcoes, padrao, chave, antes, aoJogar, aoMudar }) {
    // As escolhas aparecem uma de cada vez, em cartões grandes com figura (como num videogame);
    // no fim, a tela "Tudo pronto!" mostra o que foi escolhido (toque para trocar), as regras
    // e o botão Jogar. Cada opção: { chave, titulo, valores, regra, quando, tipo, sugestoes, dica, fala }
    //  - valores: [[valor, rótulo, figura?]] ou (op) => lista; o emoji do começo do rótulo vira a figura.
    //    figura: emoji, "<svg...", elemento ou (op) => um desses.
    //  - regra: true → não vira passo; fica como chips na tela final (regras de jogo, dicas...).
    //  - quando: (op) => false pula a opção (ex.: nível do computador com 2 jogadores).
    //  - tipo: "texto" → nome digitado no teclado da tela (dá para usar o controle de videogame).
    //  - titulo pode ser (op) => texto.
    let salvo = null;
    try { salvo = JSON.parse(localStorage.getItem(chave)); } catch (e) { /* sem armazenamento */ }
    const op = { ...padrao, ...(salvo || {}) };
    const tituloDe = o => (typeof o.titulo === "function" ? o.titulo(op) : o.titulo);
    const valoresDe = o => (typeof o.valores === "function" ? o.valores(op) : o.valores || []);
    const vale = o => !o.quando || o.quando(op);
    const passos = opcoes.filter(o => !o.regra), regras = opcoes.filter(o => o.regra);
    const guardar = () => { try { localStorage.setItem(chave, JSON.stringify(op)); } catch (e) { /* sem armazenamento */ } };
    // se a opção guardada não existe mais na lista (ex.: cor igual à do outro time), fica com a primeira
    const conferir = o => { if (o.tipo === "texto") return; const vs = valoresDe(o); if (vs.length && !vs.some(v => v[0] === op[o.chave])) op[o.chave] = vs[0][0]; };
    const mudar = (o, v) => { op[o.chave] = v; if (aoMudar) aoMudar(op, o.chave); };
    const figuraDe = (v, emoji) => { const f = typeof v[2] === "function" ? v[2](op) : v[2]; return f != null ? f : emoji; };
    const porFigura = (ic, f) => {
      if (f && typeof f !== "string") ic.appendChild(f);
      else if (f && f.startsWith("<svg")) ic.innerHTML = f;
      else ic.textContent = f || "";
    };

    function passo(i, paraResumo) {
      while (i < passos.length && !vale(passos[i])) i++;
      if (i >= passos.length) return resumo();
      const o = passos[i], depois = () => (paraResumo ? resumo() : passo(i + 1));
      area.innerHTML = "";
      const caixa = document.createElement("div");
      caixa.className = "modos passo-tela";
      const t = document.createElement("div");
      t.className = "passo-titulo";
      t.textContent = tituloDe(o);
      caixa.appendChild(t);
      if (o.tipo === "texto") {
        caixa.classList.add("passo-texto");
        const dica = typeof o.dica === "function" ? o.dica(op) : o.dica || "";
        caixa.appendChild(teclado({ valor: op[o.chave] || "", dica, sugestoes: o.sugestoes, aoPronto: v => { mudar(o, v); falar(v || dica ? `${v || dica}!` : "Tudo bem!"); depois(); } }));
        area.appendChild(caixa);
        falar(o.fala || tituloDe(o));
        return;
      }
      conferir(o);
      const vs = valoresDe(o);
      if (vs.length > 6) caixa.classList.add("muitos");
      vs.forEach(v => {
        const [valor, rotulo] = v, [emoji, texto] = separarEmoji(rotulo);
        const b = document.createElement("button");
        b.className = "modo" + (op[o.chave] === valor ? " ativo" : "");
        b.innerHTML = `<span class="icone"></span><span class="rotulo"></span>`;
        const ic = b.querySelector(".icone");
        let f = figuraDe(v, emoji), rot = texto;
        // sem emoji e começando com número ("50 pontos", "3"): o número vira a figura
        if (!f && /^\d/.test(texto)) { f = texto.match(/^[\d×x]+/)[0]; rot = texto.slice(f.length).trim(); ic.classList.add("numero"); }
        porFigura(ic, f);
        b.querySelector(".rotulo").textContent = rot;
        b.addEventListener("click", () => { mudar(o, valor); falar(texto); depois(); });
        caixa.appendChild(b);
      });
      area.appendChild(caixa);
      falar(o.fala || tituloDe(o));
    }

    function resumo() {
      area.innerHTML = "";
      const caixa = document.createElement("div");
      caixa.className = "opcoes-jogo resumo-opcoes";
      const t = document.createElement("div");
      t.className = "passo-titulo";
      t.textContent = "Tudo pronto!";
      caixa.appendChild(t);
      if (antes) caixa.appendChild(antes);
      const lista = document.createElement("div");
      lista.className = "resumo-escolhas";
      passos.forEach((o, i) => {
        if (!vale(o)) return;
        let fig, texto;
        if (o.tipo === "texto") { fig = "✏️"; texto = op[o.chave] || (typeof o.dica === "function" ? o.dica(op) : o.dica) || "—"; }
        else {
          conferir(o);
          const v = valoresDe(o).find(x => x[0] === op[o.chave]);
          if (!v) return;
          const [emoji, tx] = separarEmoji(v[1]);
          texto = tx;
          fig = figuraDe(v, emoji) || (/^\d/.test(tx) ? tx.match(/^[\d×x]+/)[0] : "⚙️");
        }
        const b = document.createElement("button");
        b.className = "resumo-item";
        b.innerHTML = `<span class="icone"></span><span class="textos"><small></small><b></b></span>`;
        porFigura(b.querySelector(".icone"), fig);
        b.querySelector("small").textContent = tituloDe(o);
        b.querySelector("b").textContent = texto;
        b.addEventListener("click", () => passo(i, true));
        lista.appendChild(b);
      });
      caixa.appendChild(lista);
      // regras do jogo: chips, como antes (mudam na hora)
      const regs = regras.filter(vale);
      if (regs.length) {
        const r = document.createElement("div");
        r.className = "resumo-regras";
        const h = document.createElement("div");
        h.className = "resumo-regras-titulo";
        h.textContent = "⚙️ Regras e ajudas";
        r.appendChild(h);
        const botoes = [];
        const marcar = () => botoes.forEach(([k, v, b]) => b.classList.toggle("ativo", op[k] === v));
        regs.forEach(o => {
          conferir(o);
          const grupo = document.createElement("div");
          grupo.className = "grupo-op";
          const tt = document.createElement("div");
          tt.className = "titulo-op";
          tt.textContent = tituloDe(o);
          const chips = document.createElement("div");
          chips.className = "chips";
          valoresDe(o).forEach(([valor, rotulo]) => {
            const b = document.createElement("button");
            b.className = "chip";
            b.textContent = rotulo;
            b.addEventListener("click", () => { mudar(o, valor); marcar(); });
            botoes.push([o.chave, valor, b]);
            chips.appendChild(b);
          });
          grupo.append(tt, chips);
          r.appendChild(grupo);
        });
        marcar();
        caixa.appendChild(r);
      }
      const jogar = document.createElement("button");
      jogar.className = "chip jogar";
      jogar.textContent = "▶️ Jogar";
      jogar.addEventListener("click", () => { guardar(); aoJogar({ ...op }); });
      caixa.appendChild(jogar);
      area.appendChild(caixa);
      falar("Tudo pronto! Toque em jogar!");
    }
    passo(0);
  }
  // "🐢 Fácil" → ["🐢", "Fácil"]; "🔴 🔵 Coloridas" → ["🔴 🔵", "Coloridas"]; "50 pontos" → ["", "50 pontos"]
  function separarEmoji(rotulo) {
    const txt = String(rotulo);
    const m = txt.match(/^(?:(?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:️|‍\p{Extended_Pictographic})*️?\s*|[0-9#*]️⃣\s*)+/u);
    if (!m) return ["", txt];
    return [m[0].trim(), txt.slice(m[0].length).trim()];
  }

  // Teclado na tela para escrever um nome (toque, mouse, controle de videogame ou o teclado do
  // computador). Devolve o elemento; aoPronto(texto) quando aperta ✓ (vazio = usa a dica).
  function teclado({ valor = "", dica = "", sugestoes, max = 12, aoPronto }) {
    const caixa = document.createElement("div");
    caixa.className = "teclado";
    const visor = document.createElement("div");
    visor.className = "teclado-visor";
    caixa.appendChild(visor);
    const ok = document.createElement("button");
    ok.className = "chip jogar";
    const pintar = () => {
      visor.textContent = valor || dica || " ";
      visor.classList.toggle("vazio", !valor);
      ok.textContent = "✓ Pronto";
    };
    const por = letra => {
      if (valor.length >= max) return;
      if (letra === " ") { if (valor && !valor.endsWith(" ")) valor += " "; }
      else valor += !valor || valor.endsWith(" ") ? letra.toLocaleUpperCase("pt-BR") : letra.toLocaleLowerCase("pt-BR");
      pintar();
    };
    const apagar = () => { valor = valor.slice(0, -1); pintar(); };
    if (sugestoes && sugestoes.length) {
      const sg = document.createElement("div");
      sg.className = "teclado-sugestoes";
      sugestoes.forEach(nm => {
        const b = document.createElement("button");
        b.className = "chip";
        b.textContent = nm;
        b.addEventListener("click", () => { valor = separarEmoji(nm)[1].slice(0, max); pintar(); falar(valor); });
        sg.appendChild(b);
      });
      caixa.appendChild(sg);
    }
    ["QWERTYUIOP", "ASDFGHJKLÇ", "ZXCVBNM", "ÁÉÍÓÚÃÕÂÊÔ"].forEach(l => {
      const ln = document.createElement("div");
      ln.className = "teclado-linha";
      [...l].forEach(ch => {
        const b = document.createElement("button");
        b.className = "tecla";
        b.textContent = ch;
        b.addEventListener("click", () => { por(ch); falar(ch.toLowerCase()); });
        ln.appendChild(b);
      });
      caixa.appendChild(ln);
    });
    const fim = document.createElement("div");
    fim.className = "teclado-linha";
    const apg = document.createElement("button");
    apg.className = "tecla larga";
    apg.textContent = "⌫ Apagar";
    apg.addEventListener("click", apagar);
    const esp = document.createElement("button");
    esp.className = "tecla espaco";
    esp.textContent = "espaço";
    esp.addEventListener("click", () => por(" "));
    ok.addEventListener("click", () => { document.removeEventListener("keydown", fisico); aoPronto(valor.trim()); });
    fim.append(apg, esp, ok);
    caixa.appendChild(fim);
    // o teclado do computador também escreve
    const fisico = e => {
      if (!document.contains(caixa)) { document.removeEventListener("keydown", fisico); return; }
      if (e.doControle || e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === "Backspace") { e.preventDefault(); apagar(); }
      else if (e.key.length === 1 && /[\p{L} ]/u.test(e.key)) { e.preventDefault(); por(e.key); }
    };
    document.addEventListener("keydown", fisico);
    pintar();
    return caixa;
  }

  // ---------- Modos prontos ----------

  // Tela com ícones grandes para escolher o modo do jogo (ex.: 👆 Explorar / ❓ Cadê?).
  // `pequenos`: botões menores, para listas longas (ex.: tabuada do 2 ao 10).
  function escolherModo(area, modos, { pequenos = false } = {}) {
    if (modos.length === 1) return modos[0].iniciar();
    area.innerHTML = "";
    const caixa = document.createElement("div");
    caixa.className = "modos" + (pequenos ? " pequenos" : "");
    modos.forEach(m => {
      const b = document.createElement("button");
      b.className = "modo";
      b.innerHTML = `<span class="icone"></span><span class="rotulo"></span>`;
      const icone = String(m.icone);
      if (icone.startsWith("<svg")) b.querySelector(".icone").innerHTML = icone; // desenho do próprio jogo
      else b.querySelector(".icone").textContent = icone;
      b.querySelector(".rotulo").textContent = m.rotulo;
      b.addEventListener("click", () => { area.innerHTML = ""; m.iniciar(); });
      caixa.appendChild(b);
    });
    area.appendChild(caixa);
  }

  // Explorar: grade de itens; tocar faz o item pular e chama aoTocar(item).
  // `emOrdem`: mostra os itens na sequência (ex.: alfabeto) em vez de sortear.
  function modoExplorar({ area, itens, porTela = 4, desenhar, aoTocar, emOrdem = false }) {
    const grade = document.createElement("div");
    grade.className = `grade g${porTela}`;
    let fila = [];

    function montar() {
      if (fila.length === 0) fila = emOrdem ? [...itens] : embaralhar(itens);
      grade.innerHTML = "";
      fila.splice(0, porTela).forEach(item => {
        const c = criarCartao(item, desenhar);
        c.addEventListener("click", () => { animar(c, "pula"); aoTocar(item, c); });
        grade.appendChild(c);
      });
      ajustarTextos(grade);
    }

    area.appendChild(grade);
    if (itens.length > porTela) area.appendChild(botaoCanto("proximo", "➡️", "Outros", montar));
    montar();
  }

  // Tela de fim de rodada com troféu e botão para jogar de novo.
  function telaFim(area, acertos, total, jogarDeNovo) {
    area.innerHTML = "";
    const caixa = document.createElement("div");
    caixa.className = "fim";
    // As estrelas (1 a 3) aparecem no quadro de recompensa (js/progresso.js), logo abaixo
    caixa.innerHTML = `<div class="trofeu">🏆</div><div class="resumo"></div>`;
    caixa.querySelector(".resumo").textContent = `Acertou ${acertos} de ${total} de primeira!`;
    const denovo = document.createElement("button");
    denovo.className = "modo";
    denovo.innerHTML = `<span class="icone">🔁</span><span class="rotulo">Jogar de novo</span>`;
    denovo.addEventListener("click", () => { area.innerHTML = ""; jogarDeNovo(); });
    caixa.appendChild(denovo);
    area.appendChild(caixa);
    comemorar(caixa.querySelector(".trofeu"), false); // o ponto do álbum vem logo abaixo
    if (typeof Album !== "undefined") Album.ponto();
    if (typeof Progresso !== "undefined") Progresso.fimDeRodada(acertos, total, caixa); // quadro de recompensa
    tim();
    falar(`Parabéns! Você acertou ${acertos} de ${total} de primeira!`);
  }

  // Quantas fases tem uma rodada quando o jogo não diz: todo jogo de perguntas tem começo, meio e fim
  // (a criança vê "Fase 3 de 6" e sabe quando acaba). Pela idade do jogo aberto.
  function rodadaPadrao() {
    const f = typeof Progresso !== "undefined" && Progresso.faixaAtual();
    const id = f && f.id;
    return ["1-2", "2-3"].includes(id) ? 5 : ["3-4", "4-5"].includes(id) ? 6 : 8;
  }
  // Placar de fases: "Fase 3 de 6" e as bolinhas das fases feitas
  function criarPlacar(area, rodada) {
    const placar = document.createElement("div");
    placar.className = "placar fases";
    const atualizar = feitas => {
      placar.innerHTML = `<span class="fase-txt">Fase <b>${Math.min(feitas + 1, rodada)}</b> de ${rodada}</span><span class="fase-pontos">${
        Array.from({ length: rodada }, (_, i) => `<i class="${i < feitas ? "feita" : i === feitas ? "atual" : ""}"></i>`).join("")}</span>`;
    };
    if (rodada) { area.appendChild(placar); atualizar(0); }
    return atualizar;
  }
  // Para jogos com repetição própria (contar, esconde-esconde): fases com placar e troféu no fim.
  // `fase(dePrimeira)` ao terminar cada fase; devolve true quando a rodada acabou (o troféu já abriu).
  function fases(area, jogarDeNovo, total = rodadaPadrao()) {
    let feitas = 0, certas = 0;
    const atualizar = criarPlacar(area, total);
    return dePrimeira => {
      feitas++; if (dePrimeira !== false) certas++;
      atualizar(feitas);
      if (feitas < total) return false;
      depois(() => telaFim(area, certas, total, jogarDeNovo), 300);
      return true;
    };
  }

  // Quiz genérico. `gerar()` devolve uma pergunta nova:
  //   { pergunta: "texto falado", opcoes: [itens], certa: item,
  //     mostrar?: el => {...},   // desenha o enunciado acima das opções
  //     aoFalar?: () => {...} }  // roda depois que a pergunta é falada (ex.: tocar um som)
  // Errar não tem castigo: o cartão balança e a pergunta se repete.
  // `rodada`: nº de perguntas até o troféu (crianças maiores); sem ela, o jogo não acaba.
  function modoQuiz(cfg) {
    const { area, gerar, desenhar, aoAcertar, classeEnunciado = "" } = cfg;
    const rodada = cfg.rodada || rodadaPadrao();
    const s = sessao;
    const enunciado = document.createElement("div");
    enunciado.className = `enunciado ${classeEnunciado}`;
    const grade = document.createElement("div");
    let atual = null, bloqueado = false, errou = false, feitas = 0, dePrimeira = 0;

    const perguntar = () => falar(atual.pergunta).then(() => {
      if (s === sessao && atual.aoFalar) atual.aoFalar();
    });

    function nova() {
      bloqueado = false;
      errou = false;
      atual = gerar();
      enunciado.innerHTML = "";
      enunciado.style.display = atual.mostrar ? "" : "none";
      if (atual.mostrar) atual.mostrar(enunciado);
      grade.className = `grade g${atual.opcoes.length}`;
      grade.innerHTML = "";
      // `perguntaCom(ordem)`: pergunta que cita as opções na ordem em que aparecem na tela
      const ordem = embaralhar(atual.opcoes);
      if (atual.perguntaCom) atual.pergunta = atual.perguntaCom(ordem);
      ordem.forEach(item => {
        const c = criarCartao(item, desenhar);
        c.addEventListener("click", () => responder(item, c));
        grade.appendChild(c);
      });
      ajustarTextos(grade);
      perguntar();
    }

    async function responder(item, cartao) {
      if (bloqueado) return;
      if (item === atual.certa) {
        bloqueado = true;
        feitas++;
        if (!errou) dePrimeira++;
        atualizarPlacar(feitas);
        cartao.classList.add("certo");
        animar(cartao, "pula");
        comemorar(cartao);
        tim();
        if (aoAcertar) await aoAcertar(item, atual);
        if (s !== sessao) return;
        await falar(elogio());
        if (rodada && feitas >= rodada) depois(() => telaFim(area, dePrimeira, rodada, () => modoQuiz(cfg)), 300);
        else depois(nova, 600);
      } else {
        errou = true;
        cartao.classList.add("errado");
        animar(cartao, "balanca");
        perguntar();
      }
    }

    area.appendChild(enunciado);
    area.appendChild(grade);
    area.appendChild(botaoCanto("repetir", "🔊", "Repetir pergunta", perguntar));
    const atualizarPlacar = criarPlacar(area, rodada);
    nova();
  }

  // Cadê?: a voz pede um item da lista, a criança escolhe entre `opcoes` cartões.
  function modoCade({ itens, opcoes = 2, pergunta, ...resto }) {
    const ultimos = []; // não repete os últimos pedidos (metade da lista, até 6)
    modoQuiz({
      ...resto,
      gerar() {
        const fora = ultimos.slice(-Math.min(6, Math.floor(itens.length / 2)));
        const livres = itens.filter(i => !fora.includes(i));
        const alvo = livres[Math.floor(Math.random() * livres.length)] || sortear(itens);
        ultimos.push(alvo);
        const outros = embaralhar(itens.filter(i => i !== alvo)).slice(0, opcoes - 1);
        return { pergunta: pergunta(alvo), opcoes: [alvo, ...outros], certa: alvo };
      },
    });
  }

  // Montar: tocar (ou arrastar) as peças — sílabas, letras, números — na ordem certa.
  // gerar() → { pecas: ["LU","A"], extras: ["BA"], palavra: "lua", anuncio: "texto falado",
  //             mostrar?: el => {...}, falarPeca?: peca => "texto" }
  function modoMontar(cfg) {
    const { area, gerar } = cfg;
    const rodada = cfg.rodada || rodadaPadrao();
    const s = sessao;
    const enunciado = document.createElement("div");
    enunciado.className = "enunciado";
    const grade = document.createElement("div");
    grade.className = "grade pecas";
    let atual = null, feitas = 0, dePrimeira = 0;

    function nova() {
      atual = gerar();
      let proxima = 0, errou = false;
      enunciado.innerHTML = "";
      if (atual.mostrar) {
        const fig = document.createElement("span");
        fig.className = "grande";
        atual.mostrar(fig);
        enunciado.appendChild(fig);
      }
      const caixa = document.createElement("span");
      caixa.className = "lacunas";
      const lacunas = atual.pecas.map(() => {
        const l = document.createElement("span");
        l.className = "lacuna";
        l.textContent = " ";
        caixa.appendChild(l);
        return l;
      });
      enunciado.appendChild(caixa);

      grade.innerHTML = "";
      // Coloca a peça na próxima lacuna; devolve false se não for a peça certa
      function tentar(peca, c) {
        if (c.disabled || proxima >= atual.pecas.length) return false;
        if (peca !== atual.pecas[proxima]) {
          errou = true;
          animar(c, "balanca");
          return false;
        }
        lacunas[proxima].textContent = peca;
        animar(lacunas[proxima], "pula");
        c.disabled = true;
        c.style.visibility = "hidden";
        proxima++;
        if (proxima < atual.pecas.length) {
          ploc();
          if (atual.falarPeca) falar(atual.falarPeca(peca));
          return true;
        }
        terminou();
        return true;
      }
      async function terminou() {
        feitas++;
        if (!errou) dePrimeira++;
        atualizarPlacar(feitas);
        comemorar(enunciado);
        tim();
        await falar(`${atual.palavra}! ${elogio()}`);
        if (s !== sessao) return;
        if (rodada && feitas >= rodada) depois(() => telaFim(area, dePrimeira, rodada, () => modoMontar(cfg)), 300);
        else depois(nova, 600);
      }
      embaralhar([...atual.pecas, ...atual.extras]).forEach(peca => {
        const c = criarCartao({ nome: peca }, desenharTexto("palavra"));
        // Arrastar até a próxima lacuna também vale
        arrastavel(c, { alvos: () => lacunas.slice(proxima, proxima + 1), aoSoltar: () => tentar(peca, c) });
        c.addEventListener("click", () => tentar(peca, c));
        grade.appendChild(c);
      });
      falar(atual.anuncio);
    }

    area.appendChild(enunciado);
    area.appendChild(grade);
    area.appendChild(botaoCanto("repetir", "🔊", "Repetir", () => falar(atual.anuncio)));
    const atualizarPlacar = criarPlacar(area, rodada);
    nova();
  }

  // Arrastar: soltar cada peça no alvo certo (comida no bicho, objeto no lugar...).
  // Também dá para tocar na peça e depois no alvo — mais fácil para os menores.
  // gerar() → { alvos: [{ id, nome, desenhar(el) }], pecas: [{ alvo: id, nome, desenhar(el) }],
  //             anuncio, aoAcertar?(peca, alvo) → texto, aoErrar?(peca, alvo) → texto }
  function modoArrastar(cfg) {
    const { area, gerar } = cfg;
    const rodada = cfg.rodada || rodadaPadrao();
    const s = sessao;
    const zonaAlvos = document.createElement("div");
    zonaAlvos.className = "zona-alvos";
    const zonaPecas = document.createElement("div");
    zonaPecas.className = "zona-pecas";
    let atual = null, feitas = 0, dePrimeira = 0;

    function nova() {
      atual = gerar();
      let errou = false, restantes = atual.pecas.length, selecionada = null;
      zonaAlvos.innerHTML = "";
      zonaPecas.innerHTML = "";

      const elsAlvo = atual.alvos.map(a => {
        const el = document.createElement("button");
        el.className = "alvo";
        el.dataset.id = a.id;
        el.innerHTML = `<span class="figura-alvo"></span><span class="dentro"></span>`;
        a.desenhar(el.firstChild);
        el.addEventListener("click", () => { if (selecionada) tentar(selecionada.p, selecionada.b, el); });
        zonaAlvos.appendChild(el);
        return el;
      });

      function tentar(p, b, el) {
        const alvo = atual.alvos.find(a => a.id === el.dataset.id);
        b.classList.remove("selecionada");
        selecionada = null;
        if (p.alvo !== alvo.id) {
          errou = true;
          animar(el, "balanca");
          animar(b, "balanca");
          if (atual.aoErrar) falar(atual.aoErrar(p, alvo));
          return false;
        }
        b.disabled = true;
        b.style.visibility = "hidden";
        const mini = document.createElement("span");
        mini.className = "mini-peca";
        p.desenhar(mini);
        el.querySelector(".dentro").appendChild(mini);
        animar(el, "pula");
        ploc();
        restantes--;
        const fala = atual.aoAcertar ? atual.aoAcertar(p, alvo) : "";
        if (restantes > 0) { if (fala) falar(fala); return true; }
        feitas++;
        if (!errou) dePrimeira++;
        atualizarPlacar(feitas);
        comemorar(zonaAlvos);
        tim();
        (async () => {
          if (fala) await falar(fala);
          if (s !== sessao) return;
          await falar(elogio());
          if (rodada && feitas >= rodada) depois(() => telaFim(area, dePrimeira, rodada, () => modoArrastar(cfg)), 300);
          else depois(nova, 700);
        })();
        return true;
      }

      embaralhar(atual.pecas).forEach(p => {
        const b = document.createElement("button");
        b.className = "peca-solta";
        b.setAttribute("aria-label", p.nome);
        p.desenhar(b);
        arrastavel(b, { alvos: () => elsAlvo, aoSoltar: el => tentar(p, b, el) });
        b.addEventListener("click", () => {
          zonaPecas.querySelectorAll(".selecionada").forEach(x => x.classList.remove("selecionada"));
          selecionada = { p, b };
          b.classList.add("selecionada");
          animar(b, "pula");
        });
        zonaPecas.appendChild(b);
      });
      falar(atual.anuncio);
    }

    area.appendChild(zonaAlvos);
    area.appendChild(zonaPecas);
    area.appendChild(botaoCanto("repetir", "🔊", "Repetir", () => falar(atual.anuncio)));
    const atualizarPlacar = criarPlacar(area, rodada);
    nova();
  }

  // Desenhos simples para o modoArrastar
  const comEmoji = emoji => el => { el.textContent = emoji; };
  const comTexto = texto => el => { el.textContent = texto; el.classList.add("texto-peca"); };

  // Jogo de vocabulário pronto (Explorar + Cadê?) a partir de uma lista de itens
  // { emoji, nome, artigo, fala? }. Devolve o objeto para JOGOS.push.
  function vocabulario({ itens, desenhar, fala, pergunta, ...jogo }) {
    const falaPadrao = i => `${maiuscula(i.artigo)} ${i.nome}!`;
    return {
      ...jogo,
      iniciar(area, faixa) {
        escolherModo(area, [
          {
            icone: "👆", rotulo: "Explorar",
            iniciar: () => modoExplorar({
              area, itens, porTela: 4, desenhar,
              aoTocar: i => falar(i.fala || (fala || falaPadrao)(i)),
            }),
          },
          {
            icone: "❓", rotulo: "Cadê?",
            iniciar: () => modoCade({
              area, itens, desenhar, opcoes: ehPequeno(faixa) ? 2 : 3,
              pergunta: pergunta || (i => `Cadê ${i.artigo} ${i.nome}?`),
            }),
          },
        ]);
      },
    };
  }

  return {
    novaSessao, sessaoAtual, depois, falar, fases, rodadaPadrao, definirVolume, volume: () => volume, teclado, separarEmoji, tocarSom, somLigado, audio, alternarSom, botaoSom, ajustarTextos, nota, ruido, ploc, tim,
    embaralhar, sortear, aleatorio, maiuscula, elogio, ehPequeno, opcoesNumericas,
    animar, comemorar, criarCartao, desenharTexto, botaoCanto, telaFim, arrastavel, comEmoji, comTexto,
    telaOpcoes, escolherModo, modoExplorar, modoQuiz, modoCade, modoMontar, modoArrastar, vocabulario,
  };
})();
