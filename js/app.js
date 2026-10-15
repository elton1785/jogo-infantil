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

  function telaCheia() {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }

  function mostrar(id) {
    telaAtual = id;
    telas.forEach(t => t.classList.toggle("ativa", t.id === id));
    btnVoltar.style.display = id === "idades" ? "none" : "block";
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

  function voltar() {
    if (telaAtual === "jogo") noFavoritos ? abrirFavoritos() : abrirMenu(noLivre ? LIVRE : faixaAtual);
    else abrirIdades();
  }

  // Botão 🏠 e "voltar" do celular fazem a mesma coisa: voltam uma tela.
  window.addEventListener("popstate", () => { if (telaAtual !== "idades") voltar(); });
  btnVoltar.addEventListener("click", () => {
    if (history.state && history.state.tela) history.back(); // o popstate acima faz a navegação
    else voltar();
  });

  abrirIdades();
  const ultima = FAIXAS.find(f => f.id === lembrado("faixa"));
  if (lembrado("faixa") === "favoritos") abrirFavoritos();
  else if (lembrado("faixa") === "livre") abrirMenu(LIVRE);
  else if (ultima) abrirMenu(ultima);
})();

// App instalável e offline (PWA). Só funciona em https ou localhost — abrindo o
// arquivo direto ou por http na rede local, o jogo roda normal, só não instala.
// Quando há versão nova, aparece o botão "Atualizar" (só fora dos jogos).
// No menu ficam o número da versão e o botão "Procurar atualização".
if ("serviceWorker" in navigator) {
  const botao = document.getElementById("btn-atualizar");
  const rodape = document.getElementById("rodape-versao");
  const numVersao = document.getElementById("num-versao");
  const procurarBtn = document.getElementById("btn-procurar");
  let atualizando = false;

  // Pergunta ao service worker que controla a página qual é a versão
  // (versões antigas não respondem: aí o botão aparece sem o número)
  function mostrarVersao() {
    const sw = navigator.serviceWorker.controller;
    if (!sw) return;
    rodape.hidden = false;
    const canal = new MessageChannel();
    canal.port1.onmessage = e => { numVersao.textContent = `Versão ${e.data}`; };
    sw.postMessage("versao", [canal.port2]);
  }
  mostrarVersao();

  navigator.serviceWorker.register("sw.js").then(reg => {
    // Só é atualização se já havia uma versão rodando (na 1ª instalação não há o que avisar)
    const avisar = () => {
      if (!reg.waiting || !navigator.serviceWorker.controller) return false;
      botao.hidden = false;
      return true;
    };
    avisar();

    // Botão do menu: procura agora e diz o resultado
    procurarBtn.addEventListener("click", async () => {
      procurarBtn.disabled = true;
      procurarBtn.textContent = "⏳ Procurando...";
      try { await reg.update(); } catch (e) { /* sem internet */ }
      const nova = reg.installing;
      if (nova) await new Promise(r => { nova.addEventListener("statechange", () => { if (nova.state !== "installing") r(); }); setTimeout(r, 15000); });
      procurarBtn.textContent = avisar() ? "🆕 Tem versão nova!" : navigator.onLine ? "✅ Já é a mais nova" : "📵 Sem internet";
      setTimeout(() => { procurarBtn.textContent = "🔄 Procurar atualização"; procurarBtn.disabled = false; }, 3000);
    });
    reg.addEventListener("updatefound", () => {
      const nova = reg.installing;
      if (nova) nova.addEventListener("statechange", () => { if (nova.state === "installed") avisar(); });
    });
    botao.addEventListener("click", () => {
      if (!reg.waiting) return location.reload();
      atualizando = true;
      botao.textContent = "⏳ Atualizando...";
      reg.waiting.postMessage("atualizar");
      // Se a troca demorar (versão antiga ainda ocupada), recarrega mesmo assim
      setTimeout(() => location.reload(), 4000);
    });
    // Procura versão nova ao voltar para o app e a cada 30 minutos
    const procurar = () => reg.update().catch(() => {}).then(avisar);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") procurar(); });
    setInterval(procurar, 30 * 60 * 1000);
  }).catch(() => {});

  navigator.serviceWorker.addEventListener("controllerchange", () => { if (atualizando) location.reload(); });
}
