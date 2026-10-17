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
  const painel = document.getElementById("painel-crianca");
  const tituloIdades = document.getElementById("titulo-idades");
  const rodapeInicio = document.getElementById("rodape-inicio");
  const cabecalho = document.getElementById("cabecalho-jogo");
  const areaJogo = document.getElementById("area-jogo");
  const btnVoltar = document.getElementById("btn-voltar");
  const btnAjuda = document.getElementById("btn-ajuda");

  let telaAtual = "idades";
  let faixaAtual = null;
  let noFavoritos = false; // o menu aberto é o de favoritos (para o "voltar" do jogo)
  let doInicio = false; // o jogo foi aberto pela tela de início (missão, continuar): o "voltar" volta para ela
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
  // A tela aberta nesta aba (início, menu ou jogo): recarregar a página (F5) volta para ela
  function guardarOnde(onde) {
    try { sessionStorage.setItem("onde", JSON.stringify(onde)); } catch (e) {}
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
  // Botões de canto: ⛶ fica no canto de cima, à direita, no início e nos menus. Dentro do jogo, só
  // nas telas de escolha (embaixo do 🏠, onde o canto está livre) e fora da tela cheia; durante a
  // partida, sair da tela cheia mostra por alguns segundos o aviso "Voltar para a tela cheia".
  const btnInicio = document.getElementById("btn-inicio");
  const avisoTelaCheia = document.getElementById("aviso-tela-cheia");
  let noInicioDoJogo = false; // o jogo está numa tela de escolha (modos, opções)
  function mostrarBotaoTelaCheia() {
    const noJogo = telaAtual === "jogo";
    btnTelaCheia.hidden = !podeTelaCheia || (noJogo && (!noInicioDoJogo || !!document.fullscreenElement));
    btnTelaCheia.classList.toggle("no-jogo", noJogo);
    btnInicio.hidden = !(noJogo && noInicioDoJogo);
  }
  let tempoAviso = null;
  avisoTelaCheia.addEventListener("click", () => { avisoTelaCheia.hidden = true; querTelaCheia = true; telaCheia(true); });
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
      clearTimeout(tempoAviso);
      avisoTelaCheia.hidden = ligada || telaAtual !== "jogo" || noInicioDoJogo;
      if (!avisoTelaCheia.hidden) tempoAviso = setTimeout(() => { avisoTelaCheia.hidden = true; }, 5000);
      mostrarBotaoTelaCheia();
    });
  }

  function mostrar(id) {
    telaAtual = id;
    if (id !== "jogo") noInicioDoJogo = false;
    telas.forEach(t => t.classList.toggle("ativa", t.id === id));
    btnVoltar.style.display = id === "idades" ? "none" : "flex";
    mostrarBotaoTelaCheia();
    if (id !== "jogo") { Ajuda.fechar(); btnAjuda.hidden = true; cabecalho.hidden = true; Progresso.sair(); }
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

  // ---------- Progresso no cartão (js/progresso.js): estrelas, passo da trilha, nível, cadeado ----------
  function decorar(card, jogo, faixa) {
    const s = Progresso.situacao(jogo, faixa);
    if (s.estrelas || s.tipo === "licao" || s.tipo === "desafio") {
      const e = document.createElement("span");
      e.className = "estrelas-card";
      e.innerHTML = [0, 1, 2].map(i => `<i class="${i < s.estrelas ? "on" : ""}">★</i>`).join("");
      e.setAttribute("aria-label", `${s.estrelas} de 3 estrelas`);
      card.querySelector(".textos").appendChild(e);
    }
    const selo = s.passo || (s.nivel && NOMES_NIVEL[s.nivel]);
    if (selo) {
      const b = document.createElement("span");
      b.className = "selo-card" + (s.nivel ? " nivel-" + s.nivel : "");
      b.textContent = selo;
      card.appendChild(b);
    }
    if (!s.aberto) {
      card.classList.add("trancado");
      const c = document.createElement("span");
      c.className = "cadeado";
      c.textContent = "🔒";
      card.appendChild(c);
    }
    return card;
  }
  // Abre o jogo se ele estiver aberto; trancado, o cartão balança e a voz diz o que falta
  function tentarAbrir(jogo, faixa, card, abrir) {
    const s = Progresso.situacao(jogo, faixa);
    if (!s.aberto) {
      if (card) Motor.animar(card, "balanca");
      Motor.falar(s.motivo);
      return false;
    }
    abrir();
    return true;
  }

  // Jogo aberto direto da tela de início (missão do dia, continuar): o "voltar" volta para o início
  function abrirDoInicio(jogo, faixa) {
    faixaAtual = faixa; noFavoritos = false; noLivre = false; doInicio = true;
    abrirJogo(jogo);
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

  // Tela de início: selos do app, a criança que está jogando, atalhos e as idades.
  // Criança no modo Guiado: missão do dia e Parque no lugar da lista de idades (a idade é a do perfil).
  const novo = (tag, classe, texto) => { const e = document.createElement(tag); if (classe) e.className = classe; if (texto != null) e.textContent = texto; return e; };
  function abrirIdades() {
    Motor.novaSessao();
    guardarOnde({ t: "idades" });
    selos.innerHTML = "";
    [["🎮", `${JOGOS.length} jogos`], ["🔊", "Com voz"], ["📴", "Sem internet"], ["🚫", "Sem anúncios"], ["🕹️", "Controle na TV"]].forEach(([i, t]) => {
      selos.appendChild(novo("span", "selo", `${i} ${t}`));
    });
    const p = Album.perfilAtual(), guiado = Progresso.guiado(p), faixaP = guiado ? FAIXAS.find(f => f.id === p.faixa) : null;
    atalhos.innerHTML = "";
    painel.innerHTML = "";
    // Quem está jogando (tocar troca a criança), moedas e estrelas
    const quem = novo("button", "painel-crianca");
    quem.innerHTML = `<span class="av"></span><span class="textos"><b></b><small></small></span><span class="prog-moedas"></span>`;
    quem.querySelector(".av").textContent = p.avatar;
    quem.querySelector(".av").style.background = p.cor;
    quem.querySelector("b").textContent = p.id === "visitante" ? "Quem está jogando?" : `Oi, ${p.nome}!`;
    quem.querySelector("small").textContent = p.id === "visitante" ? "Toque para escolher ou criar" : `${guiado ? "🧭 " + faixaP.nome : "🌟 Livre: tudo aberto"} · ⭐ ${Progresso.totalEstrelas()} · toque para ver`;
    quem.querySelector(".prog-moedas").textContent = `🪙 ${Progresso.moedas()}`;
    quem.addEventListener("click", () => { telaCheia(); Progresso.paginaCrianca(); });
    painel.appendChild(quem);
    if (guiado) painel.appendChild(blocoMissao(faixaP));

    const [uid, ufx] = (lembrado("ultimo") || "").split("|");
    const ultJogo = JOGOS.find(j => j.id === uid), ultFaixa = FAIXAS.find(f => f.id === ufx);
    if (ultJogo && ultFaixa) {
      const c = cartaoJogo(ultJogo, () => { telaCheia(); tentarAbrir(ultJogo, ultFaixa, c, () => abrirDoInicio(ultJogo, ultFaixa)); }, `▶️ Continuar · ${ultFaixa.nome}`);
      c.classList.add("continuar");
      atalhos.appendChild(c);
    }
    if (guiado) {
      const todos = novo("button", "atalho-fav atalho-trilhas");
      todos.innerHTML = `<span class="icone">🗺️</span><span class="textos"><span class="rotulo">Meus jogos</span><span class="desc"></span></span>`;
      todos.querySelector(".desc").textContent = `Trilhas, desafios e brincadeiras de ${faixaP.nome}`;
      todos.addEventListener("click", () => { telaCheia(); abrirMenu(faixaP); });
      atalhos.appendChild(todos);
    }
    atalhos.appendChild(Album.cartaoInicio());
    const loja = novo("button", "atalho-fav atalho-loja");
    loja.innerHTML = `<span class="icone">🛍️</span><span class="textos"><span class="rotulo">Loja</span><span class="desc"></span></span>`;
    loja.querySelector(".desc").textContent = `🪙 ${Progresso.moedas()} moedas · figurinhas e enfeites`;
    loja.addEventListener("click", () => { telaCheia(); Progresso.loja(); });
    atalhos.appendChild(loja);
    const nFav = favoritos().length;
    const fav = document.createElement("button");
    fav.className = "atalho-fav";
    fav.innerHTML = `<span class="icone">⭐</span><span class="textos"><span class="rotulo">Favoritos</span><span class="desc"></span></span>`;
    fav.querySelector(".desc").textContent = nFav ? `${nFav} ${nFav === 1 ? "jogo guardado" : "jogos guardados"}` : "Toque na ⭐ de um jogo";
    fav.addEventListener("click", () => { telaCheia(); abrirFavoritos(); });
    atalhos.appendChild(fav);

    listaIdades.innerHTML = "";
    tituloIdades.hidden = guiado;
    if (!guiado) [LIVRE, ...FAIXAS].forEach(f => {
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
    rodapeInicio.innerHTML = "";
    rodapeInicio.appendChild(Progresso.botaoPais());
    mostrar("idades");
  }

  // 🎯 Missão do dia (3 cartões) e o 🎡 Parque, que abre quando ela termina
  function blocoMissao(faixa) {
    const m = Progresso.missao();
    const box = novo("section", "missao" + (m && m.completa ? " completa" : ""));
    if (!m || !m.ids.length) return box;
    const cab = novo("div", "missao-cab");
    cab.append(novo("h2", "missao-titulo", m.completa ? "🎉 Missão de hoje cumprida!" : "🎯 Missão de hoje"), novo("span", "missao-conta", `${m.feitos.length} de ${m.ids.length}`));
    const grade = novo("div", "missao-grade");
    m.ids.forEach(id => {
      const jogo = JOGOS.find(j => j.id === id);
      if (!jogo) return;
      const tp = TIPOS_ATIVIDADE[tipoDe(jogo)];
      const c = cartaoJogo(jogo, () => { telaCheia(); tentarAbrir(jogo, faixa, c, () => abrirDoInicio(jogo, faixa)); }, `${tp.icone} ${tp.nome}`);
      decorar(c, jogo, faixa);
      if (m.feitos.includes(id)) { c.classList.add("feito"); c.appendChild(novo("span", "feito-marca", "✅")); }
      grade.appendChild(c);
    });
    const info = Progresso.infoParque(faixa.id);
    if (!m.completa) box.append(cab, novo("p", "missao-dica", info ? "Faça as 3 atividades para abrir o 🎡 Parque de diversões!" : "Faça as 3 atividades e ganhe 5 moedas extras!"), grade);
    else box.append(cab, grade);
    if (info) {
      const pq = novo("button", "parque-cartao" + (info.aberto ? " aberto" : ""));
      pq.innerHTML = `<span class="icone">🎡</span><span class="textos"><b>Parque de diversões</b><small></small></span><span class="estado"></span>`;
      pq.querySelector("small").textContent = info.aberto ? "Corridas, futebol, sinuca, pescaria…" : info.acabou ? info.texto : "Abre quando você cumprir a missão!";
      pq.querySelector(".estado").textContent = info.aberto ? info.texto : info.acabou ? "🌙" : `🔒 ${info.texto}`;
      pq.addEventListener("click", () => {
        telaCheia();
        if (!info.aberto) { Motor.animar(pq, "balanca"); Motor.falar(info.acabou ? "O tempo do Parque de hoje acabou. Amanhã tem mais!" : "Cumpra a missão do dia para abrir o Parque!"); return; }
        abrirMenu(faixa, "parque");
      });
      box.appendChild(pq);
    }
    return box;
  }

  // Lista de jogos separada por tipo de atividade: 📚 Aprender (uma trilha por matéria, na ordem de
  // ensino), 🧠 Desafios (do fácil ao difícil), 🎨 Brincar à vontade e 🎡 Parque de diversões.
  // `faixaDe(jogo)`: a idade em que o jogo abre (no Livre, cada jogo tem a sua).
  function porTipo(jogos, cartao, faixaDe) {
    listaJogos.innerHTML = "";
    const grade = lista => { const g = novo("div", "grade-jogos"); lista.forEach(j => g.appendChild(cartao(j))); return g; };
    ORDEM_TIPOS.forEach(t => {
      const daqui = jogos.filter(j => tipoDe(j) === t);
      if (!daqui.length) return;
      const tp = TIPOS_ATIVIDADE[t];
      const secao = novo("section", "secao-cat secao-tipo");
      secao.id = "secao-" + t;
      secao.style.setProperty("--cor", tp.cor);
      secao.appendChild(novo("h2", "secao-titulo", `${tp.icone} ${tp.nome}`));
      if (t === "parque") {
        const info = Progresso.infoParque(faixaDe(daqui[0]).id);
        if (info) secao.appendChild(novo("p", "secao-frase", info.aberto ? `🔓 ${info.texto}` : info.acabou ? `🌙 ${info.texto}` : `🔒 Abre depois da missão do dia (${info.texto})`));
      }
      if (t === "licao") {
        // Uma trilha por matéria; o que não estiver em trilha nenhuma vai no fim
        const usados = new Set();
        TRILHAS.forEach(tr => {
          const lista = tr.jogos.map(id => daqui.find(j => j.id === id)).filter(Boolean);
          if (!lista.length) return;
          lista.forEach(j => usados.add(j));
          const sub = novo("div", "sub-trilha");
          sub.style.setProperty("--cor", tr.cor);
          const feitas = lista.filter(j => Progresso.estrelasDe(j, faixaDe(j))).length;
          sub.append(novo("h3", "sub-trilha-titulo", `${tr.icone} ${tr.nome}`), novo("span", "sub-trilha-conta", `✅ ${feitas} de ${lista.length}`));
          secao.append(sub, grade(lista));
        });
        const resto = daqui.filter(j => !usados.has(j));
        if (resto.length) secao.appendChild(grade(resto));
      } else if (t === "desafio") {
        secao.appendChild(grade(daqui.slice().sort((a, b) => (NIVEL_DESAFIO[a.id] || 1) - (NIVEL_DESAFIO[b.id] || 1))));
      } else secao.appendChild(grade(daqui));
      listaJogos.appendChild(secao);
    });
  }

  // Cada tela aberta entra no histórico, para o "voltar" do celular voltar uma tela
  function abrirMenu(faixa, rolarPara) {
    if (telaAtual === "idades") history.pushState({ tela: "menu" }, "");
    Motor.novaSessao();
    faixaAtual = faixa;
    noFavoritos = false;
    doInicio = false;
    noLivre = faixa === LIVRE;
    lembrar("faixa", faixa.id);
    guardarOnde({ t: "menu", f: faixa.id });
    tituloMenu.textContent = `${faixa.icone} ${faixa === LIVRE ? "Livre: todos os jogos" : faixa.nome}`;
    const jogos = jogosDa(faixa);
    subMenu.textContent = jogos.length ? `${jogos.length} jogos · ${(IDADES[faixa.id] || {}).texto || ""}` : "";
    document.getElementById("menu").style.setProperty("--cor-idade", (IDADES[faixa.id] || {}).cor || "#4895ef");
    const faixaDe = j => (faixa === LIVRE ? faixaDoJogo(j) : faixa);
    porTipo(jogos, j => {
      const fx = faixaDe(j);
      const c = cartaoJogo(j, () => tentarAbrir(j, fx, c, () => { faixaAtual = fx; abrirJogo(j); }));
      return comEstrela(decorar(c, j, fx), j, fx);
    }, faixaDe);
    if (jogos.length === 0) {
      const aviso = document.createElement("div");
      aviso.className = "aviso";
      aviso.textContent = "🚧 Jogos desta idade em breve!";
      listaJogos.appendChild(aviso);
    }
    document.getElementById("rolagem-menu").scrollTop = 0;
    mostrar("menu");
    const alvo = rolarPara && document.getElementById("secao-" + rolarPara);
    // Depois do destaque automático do controle da TV (que rola até o primeiro cartão)
    if (alvo) setTimeout(() => {
      const rol = document.getElementById("rolagem-menu");
      rol.scrollTop += alvo.getBoundingClientRect().top - rol.getBoundingClientRect().top - 90;
    }, 200);
  }

  function abrirFavoritos() {
    if (telaAtual === "idades") history.pushState({ tela: "menu" }, "");
    Motor.novaSessao();
    noFavoritos = true;
    doInicio = false;
    noLivre = false;
    lembrar("faixa", "favoritos");
    guardarOnde({ t: "menu", f: "favoritos" });
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
      const card = decorar(cartaoJogo(jogo, () => tentarAbrir(jogo, faixa, card, () => { faixaAtual = faixa; abrirJogo(jogo); }), `${faixa.icone} ${faixa.nome}`), jogo, faixa);
      // Desmarcou aqui: o card sai da lista
      grade.appendChild(comEstrela(card, jogo, faixa, on => { if (!on) abrirFavoritos(); }));
    });
    mostrar("menu");
  }

  function abrirJogo(jogo) {
    jogoAtual = jogo;
    if (faixaAtual) lembrar("ultimo", `${jogo.id}|${faixaAtual.id}`);
    if (faixaAtual) guardarOnde({ t: "jogo", f: doInicio ? "inicio" : noFavoritos ? "favoritos" : noLivre ? "livre" : faixaAtual.id, j: jogo.id, fx: faixaAtual.id });
    history.pushState({ tela: "jogo" }, "");
    Motor.novaSessao();
    [...areaJogo.childNodes].forEach(n => ignorar.add(n)); // telas do jogo anterior não entram no caminho
    pilha = [];
    areaJogo.innerHTML = "";
    mostrar("jogo");
    Motor.falar(jogo.nome);
    Progresso.entrar(jogo, faixaAtual);
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
      noInicioDoJogo = inicial;
      mostrarBotaoTelaCheia();
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
    if (telaAtual === "jogo") doInicio ? abrirIdades() : noFavoritos ? abrirFavoritos() : abrirMenu(noLivre ? LIVRE : faixaAtual);
    else abrirIdades();
  }

  // Botão 🏠 e "voltar" do celular fazem a mesma coisa: voltam uma tela.
  // Dentro do jogo, primeiro refaz o caminho pelas telas de escolha (o histórico continua no jogo).
  window.addEventListener("popstate", () => {
    if (telaAtual === "jogo" && voltarNoJogo()) { history.pushState({ tela: "jogo" }, ""); return; }
    if (telaAtual !== "idades") voltar();
  });
  // 🏠 Início: sai do jogo direto para a tela inicial
  btnInicio.addEventListener("click", () => { Ajuda.fechar(); abrirIdades(); });
  btnVoltar.addEventListener("click", () => {
    if (telaAtual === "jogo" && voltarNoJogo()) return;
    if (history.state && history.state.tela) history.back(); // o popstate acima faz a navegação
    else voltar();
  });

  // O cartão do álbum mostra os pacotinhos novos: redesenha o início quando o álbum muda
  Album.aoMudar(() => { if (telaAtual === "idades") abrirIdades(); });
  Progresso.aoMudar(() => { if (telaAtual === "idades") abrirIdades(); });

  // Abertura: recarregou a página (F5)? Volta para a mesma tela (e o mesmo jogo). Abriu o app de
  // novo? Vai para o último menu de idade usado (criança no modo Guiado: fica no início).
  const abrirMenuDe = id => {
    const f = FAIXAS.find(x => x.id === id);
    if (id === "favoritos") abrirFavoritos();
    else if (id === "livre") abrirMenu(LIVRE);
    else if (f) abrirMenu(f);
  };
  let onde = null;
  try { onde = JSON.parse(sessionStorage.getItem("onde")); } catch (e) {}
  abrirIdades();
  if (onde) {
    if (onde.t !== "idades") abrirMenuDe(onde.f);
    const j = onde.t === "jogo" && JOGOS.find(x => x.id === onde.j), fx = FAIXAS.find(x => x.id === onde.fx);
    if (j && fx && onde.f === "inicio" && Progresso.situacao(j, fx).aberto) abrirDoInicio(j, fx);
    else if (j && fx && telaAtual === "menu" && Progresso.situacao(j, fx).aberto) { faixaAtual = fx; abrirJogo(j); }
  } else if (!Progresso.guiado()) abrirMenuDe(lembrado("faixa")); // no Guiado, abre no início (missão do dia)
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
