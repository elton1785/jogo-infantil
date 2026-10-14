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
  const areaJogo = document.getElementById("area-jogo");
  const btnVoltar = document.getElementById("btn-voltar");

  let telaAtual = "idades";
  let faixaAtual = null;
  let noFavoritos = false; // o menu aberto é o de favoritos (para o "voltar" do jogo)

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

  function jogosDa(faixa) { return JOGOS.filter(j => j.faixas.includes(faixa.id)); }

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

  function abrirIdades() {
    Motor.novaSessao();
    listaIdades.innerHTML = "";
    const fav = criarOpcao("⭐", "Favoritos", () => { telaCheia(); abrirFavoritos(); });
    fav.classList.add("favoritos");
    listaIdades.appendChild(fav);
    FAIXAS.forEach(f => {
      const vazia = jogosDa(f).length === 0;
      listaIdades.appendChild(criarOpcao(f.icone, f.nome, () => { telaCheia(); abrirMenu(f); }, vazia));
    });
    mostrar("idades");
  }

  // Cada tela aberta entra no histórico, para o "voltar" do celular voltar uma tela
  function abrirMenu(faixa) {
    if (telaAtual === "idades") history.pushState({ tela: "menu" }, "");
    Motor.novaSessao();
    faixaAtual = faixa;
    noFavoritos = false;
    lembrar("faixa", faixa.id);
    tituloMenu.textContent = `${faixa.icone} ${faixa.nome}`;
    listaJogos.innerHTML = "";
    const jogos = jogosDa(faixa);
    if (jogos.length === 0) {
      const aviso = document.createElement("div");
      aviso.className = "aviso";
      aviso.textContent = "🚧 Jogos desta idade em breve!";
      listaJogos.appendChild(aviso);
    }
    jogos.forEach(j => listaJogos.appendChild(comEstrela(criarOpcao(j.icone, j.nome, () => abrirJogo(j)), j, faixa)));
    mostrar("menu");
  }

  function abrirFavoritos() {
    if (telaAtual === "idades") history.pushState({ tela: "menu" }, "");
    Motor.novaSessao();
    noFavoritos = true;
    lembrar("faixa", "favoritos");
    tituloMenu.textContent = "⭐ Favoritos";
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
    itens.forEach(({ jogo, faixa }) => {
      const card = criarOpcao(jogo.icone, jogo.nome, () => { faixaAtual = faixa; abrirJogo(jogo); });
      const sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = `${faixa.icone} ${faixa.nome}`;
      card.appendChild(sub);
      // Desmarcou aqui: o card sai da lista
      listaJogos.appendChild(comEstrela(card, jogo, faixa, on => { if (!on) abrirFavoritos(); }));
    });
    mostrar("menu");
  }

  function abrirJogo(jogo) {
    history.pushState({ tela: "jogo" }, "");
    Motor.novaSessao();
    areaJogo.innerHTML = "";
    mostrar("jogo");
    Motor.falar(jogo.nome);
    jogo.iniciar(areaJogo, faixaAtual);
  }

  function voltar() {
    if (telaAtual === "jogo") noFavoritos ? abrirFavoritos() : abrirMenu(faixaAtual);
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
