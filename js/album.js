// Álbum de figurinhas e perfis das crianças.
// - Perfis: cada criança tem nome, avatar e cor (o álbum é de cada uma). Sem perfil, usa "Visitante".
// - Ganhar: toda comemoração de acerto/vitória (Motor.comemorar, em qualquer jogo) conta um ponto;
//   a cada PONTOS_POR_PACOTE pontos a criança ganha um pacotinho com 3 figurinhas.
// - Álbum: 8 páginas temáticas com 9 figurinhas cada; as "brilhantes" ✨ são mais raras.
//   Abrir pacotinho tem animação; repetidas: 3 repetidas viram 1 figurinha que falta.
// Abre por cima de qualquer tela (classe "sobreposta": o controle da TV navega dentro dela e o
// "voltar" fecha).
const Album = (() => {
  const PONTOS_POR_PACOTE = 6;
  const PAGINAS = [
    { nome: "Bichos da fazenda", icone: "🐮", cor: "#8bd17c", figs: [["🐮", "Vaca"], ["🐷", "Porco"], ["🐔", "Galinha"], ["🐑", "Ovelha"], ["🐴", "Cavalo"], ["🦆", "Pato"], ["🐐", "Cabra"], ["🐰", "Coelho"], ["🦃", "Peru"]] },
    { nome: "Amazônia", icone: "🌳", cor: "#2a9d55", figs: [["🐆", "Onça-pintada"], ["🦜", "Arara"], ["🐬", "Boto"], ["🦥", "Preguiça"], ["🐒", "Macaco"], ["🐊", "Jacaré"], ["🐢", "Tartaruga"], ["🐍", "Sucuri"], ["🦩", "Garça"]] },
    { nome: "Fundo do mar", icone: "🐠", cor: "#48cae4", figs: [["🐠", "Peixe-palhaço"], ["🐙", "Polvo"], ["🐳", "Baleia"], ["🦈", "Tubarão"], ["🦀", "Caranguejo"], ["🐡", "Baiacu"], ["🦑", "Lula"], ["🪼", "Água-viva"], ["🦭", "Foca"]] },
    { nome: "Dinossauros", icone: "🦖", cor: "#f4a261", figs: [["🦖", "Tiranossauro"], ["🦕", "Braquiossauro"], ["🥚", "Ovo de dino"], ["🌋", "Vulcão"], ["🦴", "Fóssil"], ["🐉", "Dragão"], ["🦎", "Lagartixa"], ["🐊", "Crocodilo"], ["☄️", "Cometa"]] },
    { nome: "Espaço", icone: "🚀", cor: "#3a0ca3", figs: [["🚀", "Foguete"], ["🌍", "Terra"], ["🌙", "Lua"], ["☀️", "Sol"], ["🪐", "Saturno"], ["⭐", "Estrela"], ["👨‍🚀", "Astronauta"], ["🛸", "Disco voador"], ["🌌", "Galáxia"]] },
    { nome: "Comidas gostosas", icone: "🍉", cor: "#ff70a6", figs: [["🍉", "Melancia"], ["🍌", "Banana"], ["🍇", "Uva"], ["🍓", "Morango"], ["🥭", "Manga"], ["🍍", "Abacaxi"], ["🌽", "Milho"], ["🥕", "Cenoura"], ["🍰", "Bolo"]] },
    { nome: "Veículos", icone: "🚗", cor: "#e63946", figs: [["🚗", "Carro"], ["🚌", "Ônibus"], ["🚒", "Bombeiros"], ["🚑", "Ambulância"], ["🚜", "Trator"], ["✈️", "Avião"], ["🚂", "Trem"], ["⛵", "Barco"], ["🚁", "Helicóptero"]] },
    { nome: "Fantasia", icone: "🦄", cor: "#9b5de5", figs: [["🦄", "Unicórnio"], ["🧚", "Fada"], ["🧙", "Mago"], ["🏰", "Castelo"], ["👑", "Coroa"], ["🧜", "Sereia"], ["🌈", "Arco-íris"], ["💎", "Diamante"], ["🔮", "Bola de cristal"]] },
  ];
  // Cada figurinha: { id, e, n, pagina, brilhante } (a última de cada página é brilhante)
  const FIGS = PAGINAS.flatMap((p, pi) => p.figs.map(([e, n], i) => ({ id: pi * 9 + i, e, n, pagina: pi, brilhante: i === 8 })));
  const AVATARES = ["🐶", "🐱", "🐼", "🦊", "🐯", "🦁", "🐸", "🐵", "🐰", "🦄", "🐲", "🐧"];
  const CORES = ["#ff8fab", "#ffb703", "#8ac926", "#2ec4b6", "#4895ef", "#7b61ff", "#e05780", "#f77f00"];

  const ler = (k, padrao) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? padrao : v; } catch (e) { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem espaço */ } };

  // ---------- Perfis ----------
  const perfis = () => ler("perfis", []);
  const perfilAtual = () => perfis().find(p => p.id === ler("perfil-atual", null)) || { id: "visitante", nome: "Visitante", avatar: "🙂", cor: "#4895ef" };
  const dados = () => ler(`album-${perfilAtual().id}`, { figs: {}, pontos: 0, pacotes: 1 }); // começa com 1 pacotinho de presente
  const salvar = d => gravar(`album-${perfilAtual().id}`, d);
  const coladas = d => FIGS.filter(f => d.figs[f.id] > 0).length;

  // ---------- Ganhar pacotinhos (chamado pelo Motor.comemorar) ----------
  let avisoEl = null, avisoTimer = null;
  function ponto() {
    const d = dados();
    d.pontos = (d.pontos || 0) + 1;
    if (d.pontos >= PONTOS_POR_PACOTE) {
      d.pontos = 0; d.pacotes = (d.pacotes || 0) + 1;
      avisar(`🎁 Você ganhou um pacotinho de figurinhas! Abra no 📒 Álbum.`);
      setTimeout(() => Motor.falar("Você ganhou um pacotinho de figurinhas!", { naFila: true }), 900);
    }
    salvar(d);
    if (aoMudar) aoMudar();
  }
  function avisar(txt) {
    if (!avisoEl) { avisoEl = document.createElement("div"); avisoEl.className = "album-aviso"; document.body.appendChild(avisoEl); }
    avisoEl.textContent = txt;
    avisoEl.classList.add("visivel");
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => avisoEl.classList.remove("visivel"), 3500);
  }
  let aoMudar = null; // o App redesenha o cartão do início quando muda

  // Sorteia figurinhas: as brilhantes saem 4× menos
  function sortear(n) {
    const peso = f => (f.brilhante ? 1 : 4), total = FIGS.reduce((t, f) => t + peso(f), 0);
    return Array.from({ length: n }, () => { let r = Math.random() * total; for (const f of FIGS) { r -= peso(f); if (r <= 0) return f; } return FIGS[0]; });
  }

  // ---------- Telas (por cima de tudo) ----------
  let camada = null;
  function fechar() {
    if (!camada) return;
    camada.remove(); camada = null;
    if (history.state && history.state.tela === "album") history.back();
    if (aoMudar) aoMudar();
  }
  window.addEventListener("popstate", () => { if (camada && !(history.state && history.state.tela === "album")) { camada.remove(); camada = null; if (aoMudar) aoMudar(); } });
  function novaCamada(classe) {
    if (!camada) { history.pushState({ tela: "album" }, ""); camada = document.createElement("div"); document.body.appendChild(camada); }
    camada.className = "sobreposta album-camada " + (classe || "");
    camada.innerHTML = "";
    const fecharB = Object.assign(document.createElement("button"), { className: "canto album-fechar", textContent: "✖️" });
    fecharB.setAttribute("aria-label", "Fechar o álbum");
    fecharB.addEventListener("click", fechar);
    camada.appendChild(fecharB);
    const conteudo = document.createElement("div");
    conteudo.className = "album-conteudo";
    camada.appendChild(conteudo);
    return conteudo;
  }

  function abrir(pagina = 0) {
    const d = dados(), p = perfilAtual();
    const c = novaCamada();
    const topo = document.createElement("div");
    topo.className = "album-topo";
    topo.innerHTML = `<button class="album-perfil"><span class="av"></span><span class="nm"></span></button><div class="album-progresso"><b></b><span class="barra"><i></i></span></div>`;
    topo.querySelector(".av").textContent = p.avatar;
    topo.querySelector(".av").style.background = p.cor;
    topo.querySelector(".nm").textContent = `Álbum de ${p.nome}`;
    topo.querySelector(".album-perfil").addEventListener("click", telaPerfis);
    const n = coladas(d);
    topo.querySelector("b").textContent = `${n} de ${FIGS.length} figurinhas`;
    topo.querySelector("i").style.width = (n / FIGS.length * 100) + "%";
    const acoes = document.createElement("div");
    acoes.className = "album-acoes";
    const pac = Object.assign(document.createElement("button"), { className: "chip album-pacote" + (d.pacotes ? " tem" : ""), textContent: `🎁 Abrir pacotinho (${d.pacotes || 0})` });
    pac.addEventListener("click", () => { if (dados().pacotes) abrirPacote(); else Motor.falar("Jogue e acerte para ganhar pacotinhos de figurinhas!"); });
    const repetidas = FIGS.reduce((t, f) => t + Math.max(0, (d.figs[f.id] || 0) - 1), 0);
    const troca = Object.assign(document.createElement("button"), { className: "chip", textContent: `🔄 Trocar repetidas (${repetidas})` });
    troca.addEventListener("click", () => trocar());
    acoes.append(pac, troca);
    // Abas das páginas
    const abas = document.createElement("div");
    abas.className = "album-abas";
    PAGINAS.forEach((pg, i) => {
      const b = document.createElement("button");
      const tem = pg.figs.filter((_, k) => d.figs[i * 9 + k] > 0).length;
      b.className = "album-aba" + (i === pagina ? " ativa" : "") + (tem === 9 ? " completa" : "");
      b.style.setProperty("--cor", pg.cor);
      b.innerHTML = `<span></span><small>${tem}/9</small>`;
      b.querySelector("span").textContent = pg.icone;
      b.setAttribute("aria-label", pg.nome);
      b.addEventListener("click", () => abrir(i));
      abas.appendChild(b);
    });
    // A página: 9 espaços
    const pg = PAGINAS[pagina];
    const folha = document.createElement("div");
    folha.className = "album-folha";
    folha.style.setProperty("--cor", pg.cor);
    const titulo = Object.assign(document.createElement("div"), { className: "album-titulo-pagina", textContent: `${pg.icone} ${pg.nome}` });
    const grade = document.createElement("div");
    grade.className = "album-grade";
    FIGS.filter(f => f.pagina === pagina).forEach(f => {
      const q = d.figs[f.id] || 0;
      const s = document.createElement("button");
      s.className = "album-fig" + (q ? " colada" : "") + (f.brilhante ? " brilhante" : "");
      s.innerHTML = q ? `<span class="e"></span><span class="n"></span>${q > 1 ? `<span class="rep">×${q}</span>` : ""}` : `<span class="num">${f.id + 1}</span>`;
      if (q) { s.querySelector(".e").textContent = f.e; s.querySelector(".n").textContent = f.n; }
      s.setAttribute("aria-label", q ? f.n : `Figurinha ${f.id + 1}`);
      s.addEventListener("click", () => { if (q) { Motor.animar(s, "pula"); Motor.falar(f.n + (f.brilhante ? ", brilhante!" : "")); } else Motor.falar(`Falta a figurinha ${f.id + 1}. Jogue para ganhar pacotinhos!`); });
      grade.appendChild(s);
    });
    folha.append(titulo, grade);
    c.append(topo, acoes, abas, folha);
    if (pagina === 0 && n === 0) Motor.falar("Este é o seu álbum de figurinhas! Abra o pacotinho de presente!");
  }

  // Abrir pacotinho: 3 figurinhas viram uma de cada vez
  function abrirPacote() {
    const d = dados();
    d.pacotes--;
    const novas = sortear(3);
    const antes = { ...d.figs };
    novas.forEach(f => { d.figs[f.id] = (d.figs[f.id] || 0) + 1; });
    salvar(d);
    const c = novaCamada("pacote");
    const t = Object.assign(document.createElement("div"), { className: "album-titulo-pagina", textContent: "🎁 Toque nas figurinhas para virar!" });
    const mesa = document.createElement("div");
    mesa.className = "album-mesa";
    let viradas = 0;
    novas.forEach((f, i) => {
      const repetida = antes[f.id] > 0 || novas.slice(0, i).some(g => g.id === f.id);
      const carta = document.createElement("button");
      carta.className = "album-carta" + (f.brilhante ? " brilhante" : "");
      carta.style.setProperty("--cor", PAGINAS[f.pagina].cor);
      carta.innerHTML = `<span class="verso">⭐</span><span class="frente"><span class="e"></span><span class="n"></span><small></small></span>`;
      carta.querySelector(".e").textContent = f.e;
      carta.querySelector(".n").textContent = f.n;
      carta.querySelector("small").textContent = repetida ? "repetida" : f.brilhante ? "✨ brilhante!" : "nova!";
      carta.addEventListener("click", () => {
        if (carta.classList.contains("virada")) return;
        carta.classList.add("virada");
        Motor.tim();
        Motor.falar(`${f.n}!` + (f.brilhante ? " Brilhante!" : repetida ? " Repetida." : ""));
        if (f.brilhante || !repetida) Motor.comemorar(carta, false); // sem contar ponto
        if (++viradas === 3) setTimeout(() => colar.hidden = false, 400);
      });
      mesa.appendChild(carta);
    });
    const colar = Object.assign(document.createElement("button"), { className: "chip jogar", textContent: "📒 Colar no álbum" });
    colar.hidden = true;
    colar.addEventListener("click", () => abrir(novas[0].pagina));
    c.append(t, mesa, colar);
    Motor.falar("Toque nas figurinhas para virar!");
  }

  // 3 repetidas → 1 figurinha que falta (escolhida ao acaso)
  function trocar() {
    const d = dados();
    const reps = FIGS.flatMap(f => Array((d.figs[f.id] || 1) - 1).fill(f.id)).filter(x => x != null);
    const faltam = FIGS.filter(f => !d.figs[f.id]);
    if (!faltam.length) { Motor.falar("Seu álbum está completo! Parabéns!"); return; }
    if (reps.length < 3) { Motor.falar(`Você precisa de 3 repetidas para trocar. Você tem ${reps.length}.`); return; }
    Motor.embaralhar(reps).slice(0, 3).forEach(id => { d.figs[id]--; });
    const nova = Motor.sortear(faltam);
    d.figs[nova.id] = 1;
    salvar(d);
    Motor.tim();
    Motor.falar(`Trocou 3 repetidas por: ${nova.n}!`);
    abrir(nova.pagina);
  }

  // ---------- Perfis: escolher, criar ----------
  let paraInicio = false; // veio da página da criança: escolher/criar volta para o início
  function depoisDeEscolher() { if (paraInicio) { paraInicio = false; fechar(); } else abrir(); }
  function telaPerfis({ inicio = false } = {}) {
    paraInicio = inicio;
    const c = novaCamada("perfis");
    const t = Object.assign(document.createElement("div"), { className: "album-titulo-pagina", textContent: "👋 Quem está jogando?" });
    const lista = document.createElement("div");
    lista.className = "album-perfis";
    perfis().forEach(p => {
      const b = document.createElement("button");
      b.className = "album-cartao-perfil" + (p.id === perfilAtual().id ? " ativo" : "");
      b.innerHTML = `<span class="av"></span><span class="nm"></span><small></small>`;
      b.querySelector(".av").textContent = p.avatar; b.querySelector(".av").style.background = p.cor;
      b.querySelector(".nm").textContent = p.nome;
      const dd = ler(`album-${p.id}`, { figs: {} });
      b.querySelector("small").textContent = `📒 ${FIGS.filter(f => dd.figs[f.id] > 0).length}/${FIGS.length}`;
      b.addEventListener("click", () => {
        const escolher = () => { gravar("perfil-atual", p.id); Motor.falar(`Oi, ${p.nome}!`); depoisDeEscolher(); };
        // Sair de uma criança no modo Guiado para outra: só com a senha (senão vira brecha para o Livre)
        if (p.id !== perfilAtual().id && typeof Progresso !== "undefined" && Progresso.guiado()) {
          const voltar = paraInicio;
          if (camada) { camada.remove(); camada = null; }
          const senha = () => Progresso.comSenha(() => { Progresso.fechar(); gravar("perfil-atual", p.id); Motor.falar(`Oi, ${p.nome}!`); if (!voltar) setTimeout(() => abrir(), 50); });
          if (history.state && history.state.tela === "album") { window.addEventListener("popstate", senha, { once: true }); history.back(); } else senha();
          return;
        }
        escolher();
      });
      lista.appendChild(b);
    });
    const novo = document.createElement("button");
    novo.className = "album-cartao-perfil novo";
    novo.innerHTML = `<span class="av">➕</span><span class="nm">Nova criança</span>`;
    novo.addEventListener("click", () => criarPerfil());
    lista.appendChild(novo);
    c.append(t, lista);
    Motor.falar("Quem está jogando?");
  }
  // Criança nova: só com a senha dos pais, depois que já existe alguma criança cadastrada
  // (a primeira pode ser criada direto, para começar a usar o app)
  function criarPerfil({ inicio, semSenha } = {}) {
    if (inicio != null) paraInicio = inicio;
    if (!semSenha && perfis().length && typeof Progresso !== "undefined") {
      const voltar = paraInicio;
      const senha = () => Progresso.comSenha(() => { Progresso.fechar(); setTimeout(() => criarPerfil({ inicio: voltar, semSenha: true }), 50); });
      if (camada) { camada.remove(); camada = null; }
      if (history.state && history.state.tela === "album") { window.addEventListener("popstate", senha, { once: true }); history.back(); } else senha();
      return;
    }
    const c = novaCamada("perfis");
    let nome = "", avatar = AVATARES[0], cor = CORES[0], faixa = null;
    const t = Object.assign(document.createElement("div"), { className: "album-titulo-pagina", textContent: "✨ Nova criança" });
    const previa = document.createElement("div");
    previa.className = "album-previa";
    const desenharPrevia = () => { previa.innerHTML = `<span class="av"></span><span class="nm"></span>`; previa.querySelector(".av").textContent = avatar; previa.querySelector(".av").style.background = cor; previa.querySelector(".nm").textContent = nome || "Seu nome"; };
    desenharPrevia();
    const rotulo = txt => Object.assign(document.createElement("div"), { className: "album-rotulo", textContent: txt });
    const avs = document.createElement("div"); avs.className = "album-escolhas";
    AVATARES.forEach(a => { const b = Object.assign(document.createElement("button"), { className: "album-escolha", textContent: a }); b.addEventListener("click", () => { avatar = a; desenharPrevia(); Motor.ploc(); }); avs.appendChild(b); });
    const cores = document.createElement("div"); cores.className = "album-escolhas";
    CORES.forEach(k => { const b = Object.assign(document.createElement("button"), { className: "album-escolha cor" }); b.style.background = k; b.setAttribute("aria-label", "Cor"); b.addEventListener("click", () => { cor = k; desenharPrevia(); Motor.ploc(); }); cores.appendChild(b); });
    // Teclado na tela (funciona no toque e no controle da TV)
    const teclado = document.createElement("div"); teclado.className = "album-teclado";
    [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "⌫"].forEach(l => {
      const b = Object.assign(document.createElement("button"), { className: "album-tecla", textContent: l });
      b.addEventListener("click", () => { nome = l === "⌫" ? nome.slice(0, -1) : (nome.length < 14 ? nome + (nome ? l.toLowerCase() : l) : nome); desenharPrevia(); });
      teclado.appendChild(b);
    });
    // Idade: decide os jogos da trilha e da missão do dia (os pais mudam no menu dos pais)
    const idades = document.createElement("div"); idades.className = "album-escolhas idades";
    FAIXAS.forEach(f => {
      const b = Object.assign(document.createElement("button"), { className: "album-escolha idade" });
      b.innerHTML = `<span></span><small></small>`;
      b.querySelector("span").textContent = f.icone; b.querySelector("small").textContent = f.nome;
      b.addEventListener("click", () => { faixa = f.id; idades.querySelectorAll(".idade").forEach(x => x.classList.toggle("ativa", x === b)); Motor.ploc(); Motor.falar(f.nome); });
      idades.appendChild(b);
    });
    const ok = Object.assign(document.createElement("button"), { className: "chip jogar", textContent: "✅ Pronto" });
    ok.addEventListener("click", () => {
      if (!nome) { Motor.falar("Escreva o nome primeiro!"); return; }
      if (!faixa) { Motor.falar("Quantos anos você tem? Toque na sua idade!"); return; }
      const p = { id: "p" + Date.now(), nome, avatar, cor, faixa }; // modo: Guiado (a partir de 3 anos) até os pais mudarem
      gravar("perfis", [...perfis(), p]);
      gravar("perfil-atual", p.id);
      Motor.tim(); Motor.falar(`Oi, ${nome}!`);
      depoisDeEscolher();
    });
    c.append(t, previa, rotulo("Escolha um bichinho"), avs, rotulo("Escolha uma cor"), cores, rotulo("Escreva o nome"), teclado, rotulo("Quantos anos?"), idades, ok);
    Motor.falar("Escolha um bichinho, uma cor, escreva o seu nome e a sua idade!");
  }

  // Cartão do início: perfil, figurinhas coladas e pacotinhos para abrir
  function cartaoInicio() {
    const d = dados(), p = perfilAtual();
    const b = document.createElement("button");
    b.className = "atalho-album";
    b.innerHTML = `<span class="icone">📒</span><span class="textos"><span class="rotulo"></span><span class="desc"></span></span>${d.pacotes ? `<span class="selo-pacote">🎁 ${d.pacotes}</span>` : ""}`;
    b.querySelector(".rotulo").textContent = p.id === "visitante" ? "Álbum de figurinhas" : `Álbum de ${p.nome}`;
    b.querySelector(".desc").textContent = `${coladas(d)} de ${FIGS.length} figurinhas` + (d.pacotes ? " · pacotinho para abrir!" : "");
    b.addEventListener("click", () => abrir());
    return b;
  }

  // ---------- Para a loja e o menu dos pais (js/progresso.js) ----------
  function salvarPerfil(p) { gravar("perfis", perfis().map(x => x.id === p.id ? p : x)); }
  function darPacotes(n) { const d = dados(); d.pacotes = (d.pacotes || 0) + n; salvar(d); if (aoMudar) aoMudar(); }
  const faltando = () => { const d = dados(); return FIGS.filter(f => !d.figs[f.id]); };
  function darFigurinha(id) { const d = dados(); d.figs[id] = (d.figs[id] || 0) + 1; salvar(d); }

  return { ponto, abrir, abrirPacote, cartaoInicio, perfis, perfilAtual, salvarPerfil, telaPerfis, criarPerfil, darPacotes, faltando, darFigurinha, PAGINAS,
    aoMudar: fn => { aoMudar = fn; }, aberto: () => !!camada, fechar };
})();
