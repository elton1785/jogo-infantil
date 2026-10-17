// Navegação: escolha da idade (ou ⭐ Favoritos) → menu de jogos → jogo.
// Favoritos: a estrelinha de cada card guarda o jogo junto com a idade em que foi marcado
// (o mesmo jogo muda conforme a idade); ficam no aparelho.
//
// Para criar um jogo novo: crie jogos/<nome>.js chamando JOGOS.push({...}) e
// inclua o <script> no index.html antes do app.js. Formato:
//   JOGOS.push({
//     id: "cores", nome: "Cores", icone: "🎨",
//     faixas: ["2-3", "3-4"],          // ids de FAIXAS (js/motor.js)
//     iniciar(area) { ... },            // desenha o jogo dentro de `area`
//   });

const App = (() => {
  const telas = document.querySelectorAll(".tela");
  const listaIdades = document.getElementById("lista-idades");
  const listaJogos = document.getElementById("lista-jogos");
  const tituloMenu = document.getElementById("titulo-menu");
  const subMenu = document.getElementById("sub-menu");
  const atalhos = document.getElementById("atalhos");
  const selos = document.getElementById("selos");
  const cabecalho = document.getElementById("cabecalho-jogo");
  const areaJogo = document.getElementById("area-jogo");
  const btnVoltar = document.getElementById("btn-voltar");
  const btnAjuda = document.getElementById("btn-ajuda");

  let telaAtual = "idades";
  let faixaAtual = null;
  let noFavoritos = false; // o menu aberto é o de favoritos (para o "voltar" do jogo)
  // "Livre": todos os jogos, sem escolher idade. Cada jogo abre na idade mais alta dele
  // (a versão mais completa); o "voltar" do jogo volta para o menu Livre.
  const LIVRE = { id: "livre", nome: "Livre", icone: "🌟" };
  let noLivre = false;
  const faixaDoJogo = j => FAIXAS.find(f => f.id === j.faixas[j.faixas.length - 1]);
  let jogoAtual = null;
  // Controle da TV: a partida de um jogo com `teclas` usa as setas (fora das telas de escolha)
  Controle.usarTeclasDoJogo(() => telaAtual === "jogo" && !!(jogoAtual && jogoAtual.teclas) &&
    !areaJogo.querySelector(":scope > .modos, :scope > .opcoes-jogo, :scope > .plat-menu, :scope > .fim"));

  function lembrar(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) {}
  }
  function lembrado(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }

  // Tela cheia: entra no primeiro toque, clique ou tecla depois de abrir o app (o navegador só deixa
  // entrar depois de um gesto). Quem sai (Esc ou botão) fica sem tela cheia até ligar de novo no botão
  // ou abrir o app outra vez.
  const btnTelaCheia = document.getElementById("btn-tela-cheia");
  const podeTelaCheia = !!(document.documentElement.requestFullscreen && document.fullscreenEnabled);
  let querTelaCheia = true;
  function telaCheia(forcar) {
    const el = document.documentElement;
    if (!podeTelaCheia || document.fullscreenElement || !(forcar || querTelaCheia)) return;
    el.requestFullscreen().catch(() => {});
  }
  if (podeTelaCheia) {
    const primeiroGesto = e => {
      if (e.key === "Escape") return;
      ["pointerdown", "keydown"].forEach(t => window.removeEventListener(t, primeiroGesto, true));
      if (e.target && e.target.closest && e.target.closest("#btn-tela-cheia")) return; // o botão cuida disso
      telaCheia();
    };
    ["pointerdown", "keydown"].forEach(t => window.addEventListener(t, primeiroGesto, true));
    btnTelaCheia.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      else { querTelaCheia = true; telaCheia(true); }
    });
    document.addEventListener("fullscreenchange", () => {
      const ligada = !!document.fullscreenElement;
      btnTelaCheia.classList.toggle("ligada", ligada);
      btnTelaCheia.setAttribute("aria-label", ligada ? "Sair da tela cheia" : "Tela cheia");
      if (!ligada) querTelaCheia = false; // saiu (Esc, botão ou gesto do celular)
    });
  }

  function mostrar(id) {
    telaAtual = id;
    telas.forEach(t => t.classList.toggle("ativa", t.id === id));
    btnVoltar.style.display = id === "idades" ? "none" : "flex";
    btnTelaCheia.hidden = !podeTelaCheia || id === "jogo";
    if (id !== "jogo") { Ajuda.fechar(); btnAjuda.hidden = true; cabecalho.hidden = true; }
  }

  function criarOpcao(icone, rotulo, aoClicar, vazia) {
    const b = document.createElement("button");
    b.className = "opcao" + (vazia ? " vazia" : "");
    b.innerHTML = `<span class="icone"></span><span class="rotulo"></span>`;
    // Ícone: emoji, ou desenho SVG do próprio jogo (para jogos que não têm emoji, como dominó e damas)
    if (icone.startsWith("<svg")) b.querySelector(".icone").innerHTML = icone;
    else b.querySelector(".icone").textContent = icone;
    b.querySelector(".rotulo").textContent = rotulo;
    b.addEventListener("click", aoClicar);
    return b;
  }

  function jogosDa(faixa) { return faixa === LIVRE ? JOGOS.slice() : JOGOS.filter(j => j.faixas.includes(faixa.id)); }

  // ---------- Cartões do catálogo (cor da categoria, ícone num círculo, nome e frase) ----------
  const catDe = jogo => CATEGORIAS[(CATALOGO[jogo.id] || [])[0]] || CATEGORIAS.descobrir;
  function cartaoJogo(jogo, aoClicar, sub) {
    const cat = catDe(jogo);
    const b = document.createElement("button");
    b.className = "cartao-jogo";
    b.style.setProperty("--cor", cat.cor);
    b.style.setProperty("--claro", cat.claro);
    b.innerHTML = `<span class="icone"></span><span class="textos"><span class="rotulo"></span><span class="desc"></span></span>`;
    const ic = b.querySelector(".icone");
    if (jogo.icone.startsWith("<svg")) ic.innerHTML = jogo.icone; else ic.textContent = jogo.icone;
    b.querySelector(".rotulo").textContent = jogo.nome;
    b.querySelector(".desc").textContent = sub || (CATALOGO[jogo.id] || [])[1] || "";
    b.setAttribute("aria-label", jogo.nome);
    b.addEventListener("click", aoClicar);
    return b;
  }

  // ---------- Favoritos: lista de "idDoJogo|idDaFaixa" ----------
  function favoritos() {
    try { return JSON.parse(localStorage.getItem("favoritos")) || []; } catch (e) { return []; }
  }
  const chaveFav = (jogo, faixa) => `${jogo.id}|${faixa.id}`;
  function alternarFavorito(jogo, faixa) {
    const lista = favoritos(), k = chaveFav(jogo, faixa);
    const nova = lista.includes(k) ? lista.filter(x => x !== k) : [...lista, k];
    lembrar("favoritos", JSON.stringify(nova));
    return nova.includes(k);
  }

  // Estrelinha no canto do card: tocar marca/desmarca sem abrir o jogo
  function comEstrela(card, jogo, faixa, aoMudar) {
    const estrela = document.createElement("span");
    estrela.className = "estrela-fav";
    estrela.setAttribute("role", "button");
    const pintar = on => {
      estrela.textContent = "⭐";
      estrela.classList.toggle("ativa", on);
      estrela.setAttribute("aria-label", on ? "Tirar dos favoritos" : "Guardar nos favoritos");
    };
    pintar(favoritos().includes(chaveFav(jogo, faixa)));
    estrela.addEventListener("click", e => {
      e.stopPropagation();
      const on = alternarFavorito(jogo, faixa);
      pintar(on);
      Motor.animar(estrela, "pula");
      Motor.falar(on ? `${jogo.nome} nos favoritos!` : "Tirei dos favoritos.");
      if (aoMudar) aoMudar(on);
    });
    card.appendChild(estrela);
    return card;
  }

  // Tela de início: selos do app, atalhos (continuar o último jogo, favoritos) e as idades
  function abrirIdades() {
    Motor.novaSessao();
    selos.innerHTML = "";
    [["🎮", `${JOGOS.length} jogos`], ["🔊", "Com voz"], ["📴", "Sem internet"], ["🚫", "Sem anúncios"], ["🕹️", "Controle na TV"]].forEach(([i, t]) => {
      const el = document.createElement("span");
      el.className = "selo";
      el.textContent = `${i} ${t}`;
      selos.appendChild(el);
    });
    atalhos.innerHTML = "";
    const [uid, ufx] = (lembrado("ultimo") || "").split("|");
    const ultJogo = JOGOS.find(j => j.id === uid), ultFaixa = FAIXAS.find(f => f.id === ufx);
    if (ultJogo && ultFaixa) {
      const c = cartaoJogo(ultJogo, () => { telaCheia(); faixaAtual = ultFaixa; noFavoritos = false; abrirMenu(ultFaixa); abrirJogo(ultJogo); }, `▶️ Continuar · ${ultFaixa.nome}`);
      c.classList.add("continuar");
      atalhos.appendChild(c);
    }
    atalhos.appendChild(Album.cartaoInicio());
    const nFav = favoritos().length;
    const fav = document.createElement("button");
    fav.className = "atalho-fav";
    fav.innerHTML = `<span class="icone">⭐</span><span class="textos"><span class="rotulo">Favoritos</span><span class="desc"></span></span>`;
    fav.querySelector(".desc").textContent = nFav ? `${nFav} ${nFav === 1 ? "jogo guardado" : "jogos guardados"}` : "Toque na ⭐ de um jogo";
    fav.addEventListener("click", () => { telaCheia(); abrirFavoritos(); });
    atalhos.appendChild(fav);

    listaIdades.innerHTML = "";
    [LIVRE, ...FAIXAS].forEach(f => {
      const n = jogosDa(f).length, info = IDADES[f.id] || {};
      const b = document.createElement("button");
      b.className = "cartao-idade" + (n ? "" : " vazia") + (f === LIVRE ? " livre" : "");
      b.style.setProperty("--cor", info.cor || "#4895ef");
      b.innerHTML = `<span class="icone"></span><span class="rotulo"></span><span class="desc"></span><span class="conta"></span>`;
      b.querySelector(".icone").textContent = f.icone;
      b.querySelector(".rotulo").textContent = f.nome;
      b.querySelector(".desc").textContent = info.texto || "";
      b.querySelector(".conta").textContent = n ? `${n} jogos` : "em breve";
      b.addEventListener("click", () => { telaCheia(); abrirMenu(f); });
      listaIdades.appendChild(b);
    });
    mostrar("idades");
  }

  // Lista de jogos separada por categoria (cada uma com a sua cor)
  function porCategoria(jogos, cartao) {
    listaJogos.innerHTML = "";
    ORDEM_CATEGORIAS.forEach(c => {
      const daqui = jogos.filter(j => (CATALOGO[j.id] || ["descobrir"])[0] === c);
      if (!daqui.length) return;
      const cat = CATEGORIAS[c];
      const secao = document.createElement("section");
      secao.className = "secao-cat";
      secao.style.setProperty("--cor", cat.cor);
      const h = document.createElement("h2");
      h.className = "secao-titulo";
      h.textContent = `${cat.icone} ${cat.nome}`;
      const grade = document.createElement("div");
      grade.className = "grade-jogos";
      daqui.forEach(j => grade.appendChild(cartao(j)));
      secao.append(h, grade);
      listaJogos.appendChild(secao);
    });
  }

  // Cada tela aberta entra no histórico, para o "voltar" do celular voltar uma tela
  function abrirMenu(faixa) {
    if (telaAtual === "idades") history.pushState({ tela: "menu" }, "");
    Motor.novaSessao();
    faixaAtual = faixa;
    noFavoritos = false;
    noLivre = faixa === LIVRE;
    lembrar("faixa", faixa.id);
    tituloMenu.textContent = `${faixa.icone} ${faixa === LIVRE ? "Livre: todos os jogos" : faixa.nome}`;
    const jogos = jogosDa(faixa);
    subMenu.textContent = jogos.length ? `${jogos.length} jogos · ${(IDADES[faixa.id] || {}).texto || ""}` : "";
    document.getElementById("menu").style.setProperty("--cor-idade", (IDADES[faixa.id] || {}).cor || "#4895ef");
    porCategoria(jogos, j => {
      const fx = faixa === LIVRE ? faixaDoJogo(j) : faixa;
      return comEstrela(cartaoJogo(j, () => { faixaAtual = fx; abrirJogo(j); }), j, fx);
    });
    if (jogos.length === 0) {
      const aviso = document.createElement("div");
      aviso.className = "aviso";
      aviso.textContent = "🚧 Jogos desta idade em breve!";
      listaJogos.appendChild(aviso);
    }
    listaJogos.scrollTop = 0;
    mostrar("menu");
  }

  function abrirFavoritos() {
    if (telaAtual === "idades") history.pushState({ tela: "menu" }, "");
    Motor.novaSessao();
    noFavoritos = true;
    noLivre = false;
    lembrar("faixa", "favoritos");
    tituloMenu.textContent = "⭐ Favoritos";
    subMenu.textContent = "Os jogos que você guardou";
    document.getElementById("menu").style.setProperty("--cor-idade", "#f4a300");
    listaJogos.innerHTML = "";
    const itens = favoritos().map(k => {
      const [id, fid] = k.split("|");
      return { jogo: JOGOS.find(j => j.id === id), faixa: FAIXAS.find(f => f.id === fid) };
    }).filter(x => x.jogo && x.faixa);
    if (!itens.length) {
      const aviso = document.createElement("div");
      aviso.className = "aviso";
      aviso.textContent = "Toque na ⭐ de um jogo para guardar ele aqui!";
      listaJogos.appendChild(aviso);
    }
    const grade = document.createElement("div");
    grade.className = "grade-jogos";
    listaJogos.appendChild(grade);
    itens.forEach(({ jogo, faixa }) => {
      const card = cartaoJogo(jogo, () => { faixaAtual = faixa; abrirJogo(jogo); }, `${faixa.icone} ${faixa.nome}`);
      // Desmarcou aqui: o card sai da lista
      grade.appendChild(comEstrela(card, jogo, faixa, on => { if (!on) abrirFavoritos(); }));
    });
    mostrar("menu");
  }

  function abrirJogo(jogo) {
    jogoAtual = jogo;
    if (faixaAtual) lembrar("ultimo", `${jogo.id}|${faixaAtual.id}`);
    history.pushState({ tela: "jogo" }, "");
    Motor.novaSessao();
    [...areaJogo.childNodes].forEach(n => ignorar.add(n)); // telas do jogo anterior não entram no caminho
    pilha = [];
    areaJogo.innerHTML = "";
    mostrar("jogo");
    Motor.falar(jogo.nome);
    jogo.iniciar(areaJogo, faixaAtual);
    prepararAjuda(jogo, faixaAtual);
  }

  // ---------- ❓ Como jogar ----------
  // O botão ❓ aparece na tela inicial do jogo (escolha de modo ou de opções), onde o canto de
  // cima está livre; `ajudaSempre` nos jogos sem tela inicial. Na 1ª vez a explicação abre sozinha.
  let observador = null;
  function prepararAjuda(jogo, faixa) {
    if (observador) observador.disconnect();
    const passos = Ajuda.passosDe(jogo, faixa);
    btnAjuda.hidden = true;
    btnAjuda.onclick = () => Ajuda.abrir(jogo, passos);
    const conferir = () => {
      const inicial = telaAtual === "jogo" && !!areaJogo.querySelector(":scope > .modos, :scope > .opcoes-jogo, :scope > .plat-menu");
      btnAjuda.hidden = !passos || telaAtual !== "jogo" || !(jogo.ajudaSempre || inicial);
      mostrarCabecalho(jogo, inicial);
    };
    observador = new MutationObserver(conferir);
    observador.observe(areaJogo, { childList: true });
    conferir();
    if (passos && !Ajuda.jaViu(jogo)) Motor.depois(() => Ajuda.abrir(jogo, passos), 900);
  }

  // Cabeçalho com o ícone, o nome e a frase do jogo, na tela de escolher o modo/opções
  function mostrarCabecalho(jogo, visivel) {
    cabecalho.hidden = !visivel;
    if (!visivel) return;
    const cat = catDe(jogo);
    cabecalho.style.setProperty("--cor", cat.cor);
    cabecalho.innerHTML = `<span class="icone"></span><span class="textos"><b></b><small></small></span>`;
    const ic = cabecalho.querySelector(".icone");
    if (jogo.icone.startsWith("<svg")) ic.innerHTML = jogo.icone; else ic.textContent = jogo.icone;
    cabecalho.querySelector("b").textContent = jogo.nome;
    cabecalho.querySelector("small").textContent = (CATALOGO[jogo.id] || [])[1] || "";
  }

  // ---------- Voltar dentro do jogo ----------
  // Telas de escolha do jogo (modos, opções, temas) por onde a criança passou: o voltar refaz o
  // caminho uma de cada vez (Inglês → Explorar → Cores, e o voltar leva a Explorar, depois ao Inglês,
  // depois à lista de jogos). Guarda o próprio elemento da tela, com os seus cliques, quando o jogo
  // o tira da área para mostrar a tela seguinte.
  const MENU = ".modos, .opcoes-jogo, .plat-menu";
  let pilha = [];
  const ignorar = new WeakSet(); // telas tiradas pelo próprio voltar (ou ao trocar de jogo)
  const assinatura = el => el.className + "|" + el.textContent;
  new MutationObserver(registros => {
    registros.forEach(r => r.removedNodes.forEach(n => {
      if (n.nodeType === 1 && !ignorar.has(n) && n.matches(MENU) && !areaJogo.contains(n)) pilha.push(n);
    }));
    // O jogo voltou sozinho a uma tela já guardada (ex.: "Opções" no fim da partida): o caminho para ali
    const atual = [...areaJogo.children].find(e => e.matches(MENU));
    if (atual) {
      const s = assinatura(atual), i = pilha.findIndex(n => assinatura(n) === s);
      if (i >= 0) pilha.length = i;
    }
  }).observe(areaJogo, { childList: true });
  function voltarNoJogo() {
    const tela = pilha.pop();
    if (!tela) return false;
    Ajuda.fechar();
    [...areaJogo.childNodes].forEach(n => ignorar.add(n));
    Motor.novaSessao(); // para sons, falas e laços da tela que sai
    areaJogo.replaceChildren(tela);
    return true;
  }

  function voltar() {
    if (telaAtual === "jogo") noFavoritos ? abrirFavoritos() : abrirMenu(noLivre ? LIVRE : faixaAtual);
    else abrirIdades();
  }

  // Botão 🏠 e "voltar" do celular fazem a mesma coisa: voltam uma tela.
  // Dentro do jogo, primeiro refaz o caminho pelas telas de escolha (o histórico continua no jogo).
  window.addEventListener("popstate", () => {
    if (telaAtual === "jogo" && voltarNoJogo()) { history.pushState({ tela: "jogo" }, ""); return; }
    if (telaAtual !== "idades") voltar();
  });
  btnVoltar.addEventListener("click", () => {
    if (telaAtual === "jogo" && voltarNoJogo()) return;
    if (history.state && history.state.tela) history.back(); // o popstate acima faz a navegação
    else voltar();
  });

  // O cartão do álbum mostra os pacotinhos novos: redesenha o início quando o álbum muda
  Album.aoMudar(() => { if (telaAtual === "idades") abrirIdades(); });

  abrirIdades();
  const ultima = FAIXAS.find(f => f.id === lembrado("faixa"));
  if (lembrado("faixa") === "favoritos") abrirFavoritos();
  else if (lembrado("faixa") === "livre") abrirMenu(LIVRE);
  else if (ultima) abrirMenu(ultima);
})();

// Puxar a tela para baixo (no início e nos menus): procura versão nova e já instala.
// Sem service worker (arquivo aberto direto), só recarrega a página.
const Puxar = (() => {
  const aviso = document.getElementById("puxar");
  const seta = aviso.querySelector(".seta");
  const texto = aviso.querySelector(".texto");
  const LIMITE = 70; // quanto puxar (já com a resistência) para valer
  let procurar = async () => { location.reload(); return "recarregando"; };
  let inicioY = null, ocupado = false, pronto = false;
  const posicionar = y => { aviso.style.transform = `translate(-50%, calc(-110% + ${y}px))`; };
  function esconder() {
    aviso.classList.remove("puxando", "pronto", "girando");
    aviso.style.transform = "";
    pronto = false;
  }
  async function executar() {
    ocupado = true;
    aviso.classList.remove("puxando", "pronto");
    aviso.classList.add("girando");
    seta.textContent = "🔄";
    texto.textContent = "Procurando versão nova...";
    posicionar(LIMITE);
    const r = await procurar();
    aviso.classList.remove("girando");
    seta.textContent = { nova: "🆕", ok: "✅", off: "📵" }[r] || "⏳";
    texto.textContent = { nova: "Atualizando...", ok: "Você já tem a versão mais nova!", off: "Sem internet agora" }[r] || "Carregando...";
    if (r === "ok" || r === "off") setTimeout(() => { esconder(); ocupado = false; }, 2200);
  }
  document.querySelectorAll(".tela .rolagem").forEach(rol => {
    rol.addEventListener("touchstart", e => {
      inicioY = !ocupado && rol.scrollTop <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null;
    }, { passive: true });
    rol.addEventListener("touchmove", e => {
      if (inicioY == null) return;
      const d = (e.touches[0].clientY - inicioY) * 0.5; // resistência: o aviso anda menos que o dedo
      if (d <= 4 || rol.scrollTop > 0) { esconder(); return; }
      aviso.classList.add("puxando");
      seta.textContent = "⬇️";
      pronto = d >= LIMITE;
      aviso.classList.toggle("pronto", pronto);
      texto.textContent = pronto ? "Solte para atualizar" : "Puxe para procurar versão nova";
      posicionar(Math.min(d, LIMITE + 20));
    }, { passive: true });
    const soltar = () => {
      if (inicioY == null) return;
      inicioY = null;
      if (pronto) executar(); else esconder();
    };
    rol.addEventListener("touchend", soltar);
    rol.addEventListener("touchcancel", soltar);
  });
  // A função de procurar devolve "nova" (e instala), "ok" (já é a mais nova) ou "off" (sem internet)
  return { definir(fn) { procurar = fn; } };
})();

// App instalável e offline (PWA). Só funciona em https ou localhost — abrindo o
// arquivo direto ou por http na rede local, o jogo roda normal, só não instala.
// Quando há versão nova, aparece o aviso "Nova versão!" (só fora dos jogos): tocar nele ou
// puxar a tela para baixo atualiza.
if ("serviceWorker" in navigator) {
  const botao = document.getElementById("btn-atualizar");
  let atualizando = false;

  navigator.serviceWorker.register("sw.js").then(reg => {
    // Só é atualização se já havia uma versão rodando (na 1ª instalação não há o que avisar)
    const avisar = () => {
      if (!reg.waiting || !navigator.serviceWorker.controller) return false;
      botao.hidden = false;
      return true;
    };
    avisar();
    function instalar() {
      if (!reg.waiting) return location.reload();
      atualizando = true;
      botao.textContent = "⏳ Atualizando...";
      reg.waiting.postMessage("atualizar");
      // Se a troca demorar (versão antiga ainda ocupada), recarrega mesmo assim
      setTimeout(() => location.reload(), 4000);
    }
    Puxar.definir(async () => {
      try { await reg.update(); } catch (e) { /* sem internet */ }
      const nova = reg.installing;
      if (nova) await new Promise(r => { nova.addEventListener("statechange", () => { if (nova.state !== "installing") r(); }); setTimeout(r, 15000); });
      if (avisar()) { instalar(); return "nova"; }
      return navigator.onLine ? "ok" : "off";
    });
    reg.addEventListener("updatefound", () => {
      const nova = reg.installing;
      if (nova) nova.addEventListener("statechange", () => { if (nova.state === "installed") avisar(); });
    });
    botao.addEventListener("click", instalar);
    // Procura versão nova ao voltar para o app e a cada 30 minutos
    const procurar = () => reg.update().catch(() => {}).then(avisar);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") procurar(); });
    setInterval(procurar, 30 * 60 * 1000);
  }).catch(() => {});

  navigator.serviceWorker.addEventListener("controllerchange", () => { if (atualizando) location.reload(); });
}
