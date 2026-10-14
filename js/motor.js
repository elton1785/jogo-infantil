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

  function falar(texto) {
    return new Promise(resolve => {
      if (!("speechSynthesis" in window)) return resolve();
      speechSynthesis.cancel();
      const f = new SpeechSynthesisUtterance(texto);
      f.lang = "pt-BR";
      if (vozPt) f.voice = vozPt;
      f.rate = 0.9;
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
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Uma nota. `ate`: frequência final (para efeitos como o tambor que "cai").
  function nota(freq, { dur = 0.5, tipo = "sine", vol = 0.3, inicio = 0, ate } = {}) {
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
  function embaralhar(lista) {
    const l = [...lista];
    for (let i = l.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [l[i], l[j]] = [l[j], l[i]];
    }
    return l;
  }

  function sortear(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
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
    el.classList.remove(classe);
    void el.offsetWidth; // reinicia a animação
    el.classList.add(classe);
  }

  function comemorar(el) {
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
    let salvo = null;
    try { salvo = JSON.parse(localStorage.getItem(chave)); } catch (e) { /* sem armazenamento */ }
    const op = { ...padrao, ...(salvo || {}) };
    area.innerHTML = "";
    const caixa = document.createElement("div");
    caixa.className = "opcoes-jogo";
    if (antes) caixa.appendChild(antes);
    const botoes = []; // [chave, valor, botão]
    const marcar = () => botoes.forEach(([k, v, b]) => b.classList.toggle("ativo", op[k] === v));
    opcoes.forEach(o => {
      const grupo = document.createElement("div");
      grupo.className = "grupo-op";
      const t = document.createElement("div");
      t.className = "titulo-op";
      t.textContent = o.titulo;
      const chips = document.createElement("div");
      chips.className = "chips";
      o.valores.forEach(([valor, rotulo]) => {
        const b = document.createElement("button");
        b.className = "chip" + (op[o.chave] === valor ? " ativo" : "");
        b.textContent = rotulo;
        b.addEventListener("click", () => {
          op[o.chave] = valor;
          if (aoMudar) aoMudar(op, o.chave);
          marcar();
        });
        botoes.push([o.chave, valor, b]);
        chips.appendChild(b);
      });
      grupo.append(t, chips);
      caixa.appendChild(grupo);
    });
    const jogar = document.createElement("button");
    jogar.className = "chip jogar";
    jogar.textContent = "▶️ Jogar";
    jogar.addEventListener("click", () => {
      try { localStorage.setItem(chave, JSON.stringify(op)); } catch (e) { /* sem armazenamento */ }
      aoJogar({ ...op });
    });
    caixa.appendChild(jogar);
    area.appendChild(caixa);
    falar("Escolha como quer jogar e toque em jogar!");
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
      b.querySelector(".icone").textContent = m.icone;
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
    caixa.innerHTML = `<div class="trofeu">🏆</div><div class="estrelas"></div><div class="resumo"></div>`;
    caixa.querySelector(".estrelas").textContent = "⭐".repeat(Math.max(1, Math.round((acertos / total) * 5)));
    caixa.querySelector(".resumo").textContent = `Acertou ${acertos} de ${total} de primeira!`;
    const denovo = document.createElement("button");
    denovo.className = "modo";
    denovo.innerHTML = `<span class="icone">🔁</span><span class="rotulo">Jogar de novo</span>`;
    denovo.addEventListener("click", () => { area.innerHTML = ""; jogarDeNovo(); });
    caixa.appendChild(denovo);
    area.appendChild(caixa);
    comemorar(caixa.querySelector(".trofeu"));
    tim();
    falar(`Parabéns! Você acertou ${acertos} de ${total} de primeira!`);
  }

  function criarPlacar(area, rodada) {
    const placar = document.createElement("div");
    placar.className = "placar";
    const atualizar = feitas => { placar.textContent = `⭐ ${feitas} / ${rodada}`; };
    if (rodada) { area.appendChild(placar); atualizar(0); }
    return atualizar;
  }

  // Quiz genérico. `gerar()` devolve uma pergunta nova:
  //   { pergunta: "texto falado", opcoes: [itens], certa: item,
  //     mostrar?: el => {...},   // desenha o enunciado acima das opções
  //     aoFalar?: () => {...} }  // roda depois que a pergunta é falada (ex.: tocar um som)
  // Errar não tem castigo: o cartão balança e a pergunta se repete.
  // `rodada`: nº de perguntas até o troféu (crianças maiores); sem ela, o jogo não acaba.
  function modoQuiz(cfg) {
    const { area, gerar, desenhar, aoAcertar, rodada, classeEnunciado = "" } = cfg;
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
    let ultimo = null;
    modoQuiz({
      ...resto,
      gerar() {
        const alvo = sortear(itens.filter(i => i !== ultimo));
        ultimo = alvo;
        const outros = embaralhar(itens.filter(i => i !== alvo)).slice(0, opcoes - 1);
        return { pergunta: pergunta(alvo), opcoes: [alvo, ...outros], certa: alvo };
      },
    });
  }

  // Montar: tocar (ou arrastar) as peças — sílabas, letras, números — na ordem certa.
  // gerar() → { pecas: ["LU","A"], extras: ["BA"], palavra: "lua", anuncio: "texto falado",
  //             mostrar?: el => {...}, falarPeca?: peca => "texto" }
  function modoMontar(cfg) {
    const { area, gerar, rodada } = cfg;
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
    const { area, gerar, rodada } = cfg;
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
    novaSessao, sessaoAtual, depois, falar, tocarSom, nota, ruido, ploc, tim,
    embaralhar, sortear, aleatorio, maiuscula, elogio, ehPequeno, opcoesNumericas,
    animar, comemorar, criarCartao, desenharTexto, botaoCanto, telaFim, arrastavel, comEmoji, comTexto,
    telaOpcoes, escolherModo, modoExplorar, modoQuiz, modoCade, modoMontar, modoArrastar, vocabulario,
  };
})();
