// Bichinho Virtual: a criança escolhe um bichinho (cachorro, gato, coelho, dinossauro ou panda),
// dá um nome e cuida dele: comida (ensina alimentação saudável), banho com espuma, escovar os
// dentes, dormir (apagar a luz), brincar de jogar a bolinha e ir ao médico quando fica dodói.
// O tempo passa também com o app fechado, mas devagar e sem castigo: ele nunca morre e, com o app
// fechado, só fica com fome/sujinho até um limite (não adoece). De noite ele fica com sono.
// Estrela do dia por cuidar (3 cuidados diferentes no dia) e conquistas.
(() => {
  const CHAVE = "bichinho-estado";
  const NECESSIDADES = [
    { id: "barriga", icone: "🍎", nome: "Barriga" },
    { id: "limpeza", icone: "🛁", nome: "Limpeza" },
    { id: "energia", icone: "😴", nome: "Energia" },
    { id: "diversao", icone: "🎾", nome: "Diversão" },
    { id: "saude", icone: "❤️", nome: "Saúde" },
  ];

  // ---------- Desenho dos bichinhos (SVG) ----------
  const TIPOS = {
    cachorro: { nome: "Cachorro", corpo: "#d9a066", claro: "#f8e2c2", escuro: "#8b5a2b", nomes: ["Bob", "Thor", "Pipoca", "Caramelo", "Mel", "Bidu"] },
    gato: { nome: "Gato", corpo: "#f4a261", claro: "#fde7cf", escuro: "#c4672a", nomes: ["Mimi", "Luna", "Bigode", "Nina", "Fofinho", "Tigrinho"] },
    coelho: { nome: "Coelho", corpo: "#f4eef8", claro: "#ffffff", escuro: "#d5c6e0", nomes: ["Pompom", "Floquinho", "Nevinha", "Pulinho", "Algodão", "Lua"] },
    dino: { nome: "Dinossauro", corpo: "#7bc96f", claro: "#dff5cf", escuro: "#4b9b45", nomes: ["Rex", "Dino", "Tico", "Verdinho", "Bubu", "Zezé"] },
    panda: { nome: "Panda", corpo: "#fbfbfb", claro: "#ffffff", escuro: "#2f2f38", nomes: ["Bambu", "Pandinha", "Bolinha", "Lili", "Tobias", "Fumaça"] },
  };
  const ORDEM = ["cachorro", "gato", "coelho", "dino", "panda"];

  function svgBicho(tipo) {
    const T = TIPOS[tipo];
    const C = T.corpo, L = T.claro, E = T.escuro;
    const panda = tipo === "panda", dino = tipo === "dino";
    const bracos = panda ? E : C, pes = panda ? E : (tipo === "coelho" ? L : C);
    let rabo = "", atras = "", frente = "", focinho = "", extra = "", palpebra = C;
    if (tipo === "cachorro") {
      rabo = `<path class="bv-rabo" style="transform-origin:146px 168px" d="M146 168 q30 -6 30 -40" fill="none" stroke="${C}" stroke-width="11" stroke-linecap="round"/>`;
      frente = `<ellipse cx="55" cy="86" rx="16" ry="33" fill="${E}" transform="rotate(18 55 86)"/><ellipse cx="145" cy="86" rx="16" ry="33" fill="${E}" transform="rotate(-18 145 86)"/>`;
      extra = `<ellipse cx="121" cy="76" rx="15" ry="13" fill="${L}" opacity=".9"/>`;
      focinho = `<ellipse cx="100" cy="99" rx="23" ry="16" fill="${L}"/><ellipse cx="100" cy="91" rx="8.5" ry="6" fill="#2b2233"/><ellipse cx="97" cy="89" rx="2.5" ry="1.5" fill="#fff" opacity=".7"/>`;
    } else if (tipo === "gato") {
      rabo = `<path class="bv-rabo" style="transform-origin:148px 172px" d="M148 172 q42 2 34 -46 q-3 -14 8 -16" fill="none" stroke="${C}" stroke-width="10" stroke-linecap="round"/>`;
      atras = `<path d="M56 62 L62 14 L96 40 Z" fill="${C}"/><path d="M144 62 L138 14 L104 40 Z" fill="${C}"/><path d="M64 52 L67 26 L86 41 Z" fill="#ffb3c7"/><path d="M136 52 L133 26 L114 41 Z" fill="#ffb3c7"/>`;
      extra = `<path d="M92 36 l3 14 M100 34 v15 M108 36 l-3 14" stroke="${E}" stroke-width="4" stroke-linecap="round"/>`;
      focinho = `<ellipse cx="100" cy="100" rx="19" ry="12" fill="${L}"/><path d="M94 92 L106 92 L100 99 Z" fill="#ff7b9c"/><g stroke="#7a5a48" stroke-width="2" stroke-linecap="round" opacity=".7"><path d="M78 98 l-24 -4 M78 103 l-24 3 M122 98 l24 -4 M122 103 l24 3"/></g>`;
    } else if (tipo === "coelho") {
      rabo = `<circle cx="150" cy="178" r="13" fill="#fff" stroke="${E}" stroke-width="2"/>`;
      atras = `<g class="bv-orelhas"><ellipse cx="78" cy="26" rx="14" ry="40" fill="${C}" stroke="${E}" stroke-width="2" transform="rotate(-10 78 26)"/><ellipse cx="78" cy="28" rx="7" ry="30" fill="#ffb3c7" transform="rotate(-10 78 28)"/><ellipse cx="122" cy="26" rx="14" ry="40" fill="${C}" stroke="${E}" stroke-width="2" transform="rotate(10 122 26)"/><ellipse cx="122" cy="28" rx="7" ry="30" fill="#ffb3c7" transform="rotate(10 122 28)"/></g>`;
      focinho = `<ellipse cx="100" cy="99" rx="17" ry="11" fill="${L}"/><ellipse cx="100" cy="93" rx="6" ry="4.5" fill="#ff8fab"/>`;
    } else if (dino) {
      rabo = `<path class="bv-rabo" style="transform-origin:142px 172px" d="M140 160 q44 6 56 -16 q-6 30 -54 40 z" fill="${C}"/>`;
      atras = `<g fill="#f4a261"><path d="M74 42 L80 18 L92 38 Z"/><path d="M92 34 L100 8 L108 34 Z"/><path d="M108 38 L120 18 L126 42 Z"/><path d="M146 118 L166 112 L152 132 Z"/><path d="M150 140 L172 140 L154 156 Z"/></g>`;
      focinho = `<ellipse cx="100" cy="100" rx="26" ry="15" fill="${L}"/><circle cx="93" cy="94" r="2.6" fill="#2f5e2b"/><circle cx="107" cy="94" r="2.6" fill="#2f5e2b"/>`;
      extra = `<g fill="${E}" opacity=".5"><circle cx="70" cy="58" r="4"/><circle cx="132" cy="60" r="5"/><circle cx="125" cy="48" r="3"/></g>`;
    } else if (panda) {
      atras = `<circle cx="58" cy="44" r="18" fill="${E}"/><circle cx="142" cy="44" r="18" fill="${E}"/>`;
      extra = `<ellipse cx="81" cy="82" rx="14" ry="18" fill="${E}" transform="rotate(28 81 82)"/><ellipse cx="119" cy="82" rx="14" ry="18" fill="${E}" transform="rotate(-28 119 82)"/>`;
      focinho = `<ellipse cx="100" cy="100" rx="19" ry="12" fill="#fff"/><ellipse cx="100" cy="93" rx="8" ry="5.5" fill="${E}"/>`;
      palpebra = E;
    }
    const cabeca = dino
      ? `<ellipse cx="100" cy="80" rx="56" ry="48" fill="${C}"/>`
      : `<circle cx="100" cy="80" r="50" fill="${C}"/>`;
    const brilhoOlho = panda ? `<circle cx="82" cy="80" r="9.5" fill="#fff"/><circle cx="118" cy="80" r="9.5" fill="#fff"/>` : "";
    return `<svg class="bv-svg" viewBox="0 0 200 210" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
<ellipse cx="100" cy="203" rx="64" ry="7" fill="rgba(0,0,0,.14)"/>
<g class="bv-respira">
${rabo}
<g class="bv-corpo">
<ellipse cx="100" cy="152" rx="54" ry="45" fill="${C}"/>
<ellipse cx="100" cy="162" rx="33" ry="29" fill="${L}"/>
<ellipse class="bv-braco esq" cx="55" cy="148" rx="12" ry="20" fill="${bracos}" transform="rotate(25 55 148)"/>
<ellipse class="bv-braco dir" cx="145" cy="148" rx="12" ry="20" fill="${bracos}" transform="rotate(-25 145 148)"/>
<ellipse cx="73" cy="194" rx="18" ry="10" fill="${pes}"/><ellipse cx="127" cy="194" rx="18" ry="10" fill="${pes}"/>
</g>
<g class="bv-cabeca">
${atras}${cabeca}${extra}${frente}
${brilhoOlho}
<g class="olhos-abertos"><g class="olho"><circle cx="82" cy="80" r="8" fill="#2b2233"/><circle cx="79.5" cy="76.5" r="3" fill="#fff"/></g><g class="olho"><circle cx="118" cy="80" r="8" fill="#2b2233"/><circle cx="115.5" cy="76.5" r="3" fill="#fff"/></g></g>
<g class="palpebras" fill="${palpebra}"><path d="M71 81 a11 11 0 0 1 22 0 z"/><path d="M107 81 a11 11 0 0 1 22 0 z"/></g>
<g class="olhos-fechados" fill="none" stroke="#2b2233" stroke-width="3.4" stroke-linecap="round"><path d="M74 80 q8 7 16 0"/><path d="M110 80 q8 7 16 0"/></g>
<g class="olhos-felizes" fill="none" stroke="#2b2233" stroke-width="3.6" stroke-linecap="round"><path d="M74 83 q8 -10 16 0"/><path d="M110 83 q8 -10 16 0"/></g>
<g class="sobrancelhas" fill="none" stroke="#2b2233" stroke-width="3" stroke-linecap="round"><path d="M73 64 l15 5"/><path d="M127 64 l-15 5"/></g>
<path class="lagrima" d="M88 90 q5 9 0 12 q-5 -3 0 -12 z" fill="#7cc6fe"/>
<g class="bochechas"><ellipse cx="68" cy="99" rx="8" ry="5"/><ellipse cx="132" cy="99" rx="8" ry="5"/></g>
${focinho}
<g class="boca boca-sorriso"><path d="M89 106 q11 10 22 0" fill="none" stroke="#4a2b2b" stroke-width="3.2" stroke-linecap="round"/>${tipo === "coelho" ? `<rect x="95.5" y="110" width="9" height="8" rx="2" fill="#fff" stroke="#d5c6e0"/>` : ""}</g>
<path class="boca boca-triste" d="M90 113 q10 -8 20 0" fill="none" stroke="#4a2b2b" stroke-width="3.2" stroke-linecap="round"/>
<g class="boca boca-aberta"><path d="M86 104 q14 22 28 0 z" fill="#7a2e3a"/><ellipse cx="100" cy="113" rx="7" ry="4" fill="#ff8fa3"/></g>
<g class="boca boca-comendo"><ellipse class="mastiga" cx="100" cy="109" rx="9" ry="7" fill="#7a2e3a"/></g>
<ellipse class="boca boca-o" cx="100" cy="110" rx="5" ry="6" fill="#7a2e3a"/>
<g class="boca boca-dentes"><rect x="80" y="101" width="40" height="22" rx="10" fill="#7a2e3a"/><rect x="84" y="102.5" width="32" height="7" rx="3" fill="#fff"/><rect x="85" y="115" width="30" height="6.5" rx="3" fill="#fff"/>
<g class="manchas" fill="#c9b458"><circle class="mancha" cx="88" cy="106" r="2.6"/><circle class="mancha" cx="100" cy="105" r="2.6"/><circle class="mancha" cx="111" cy="106.5" r="2.6"/><circle class="mancha" cx="90" cy="118" r="2.6"/><circle class="mancha" cx="101" cy="118.5" r="2.6"/><circle class="mancha" cx="110" cy="118" r="2.6"/></g></g>
<g class="doente-extra"><g transform="rotate(-25 124 46)"><rect x="110" y="40" width="30" height="11" rx="5" fill="#f6c89f" stroke="#d9a066"/><circle cx="121" cy="45.5" r="1.3" fill="#c98f5a"/><circle cx="129" cy="45.5" r="1.3" fill="#c98f5a"/></g></g>
</g>
<g class="bv-sujeira" fill="#8d6e4f"><ellipse cx="66" cy="62" rx="9" ry="6"/><circle cx="74" cy="56" r="3"/><ellipse cx="134" cy="96" rx="7" ry="5"/><ellipse cx="80" cy="150" rx="10" ry="7"/><circle cx="90" cy="145" r="3.5"/><ellipse cx="128" cy="172" rx="9" ry="6"/><ellipse cx="62" cy="178" rx="7" ry="5"/></g>
</g>
</svg>`;
  }

  // ---------- Estado guardado no aparelho ----------
  const hojeChave = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const ontemChave = () => { const d = new Date(); d.setDate(d.getDate() - 1); return hojeChave(d); };
  const noite = () => { const h = new Date().getHours(); return h >= 20 || h < 6; };
  const limitar = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

  function estadoVazio() {
    return { bichos: {}, atual: null, estrelas: 0, dias: {}, seguidos: 0, ultimaEstrela: null, conquistas: [], cont: {} };
  }
  function carregar() {
    let e = null;
    try { e = JSON.parse(localStorage.getItem(CHAVE)); } catch (er) { e = null; }
    if (!e || typeof e !== "object" || !e.bichos) e = estadoVazio();
    e = { ...estadoVazio(), ...e };
    Object.values(e.bichos).forEach(b => NECESSIDADES.forEach(n => { if (typeof b[n.id] !== "number" || isNaN(b[n.id])) b[n.id] = 80; }));
    // só os últimos 30 dias de registro
    const chaves = Object.keys(e.dias).sort();
    chaves.slice(0, Math.max(0, chaves.length - 30)).forEach(k => delete e.dias[k]);
    return e;
  }
  function salvar(e) { try { localStorage.setItem(CHAVE, JSON.stringify(e)); } catch (er) { /* sem armazenamento */ } }

  function novoBicho(tipo, nome) {
    return { tipo, nome, barriga: 85, limpeza: 90, energia: 85, diversao: 75, saude: 100, doente: false, dormindo: false, ultimo: Date.now(), criado: Date.now() };
  }

  // Tempo que passou com o app fechado: bem devagar e com piso (nunca vira castigo)
  function passarTempoFora(b) {
    const agora = Date.now();
    const horas = Math.min(72, Math.max(0, (agora - (b.ultimo || agora)) / 3600000));
    b.ultimo = agora;
    if (horas < 0.03) return;
    const PISO = 30;
    const cai = (k, porHora) => { if (b[k] > PISO) b[k] = Math.max(PISO, b[k] - porHora * horas); };
    cai("barriga", 4); cai("limpeza", 3); cai("diversao", 4);
    if (b.dormindo) {
      b.energia = limitar(b.energia + 15 * horas);
      if (b.energia >= 99) b.dormindo = false; // acordou descansado
    } else cai("energia", 2.5);
  }

  // ---------- Comidas ----------
  const COMIDAS = [
    { emoji: "🍎", nome: "maçã", barriga: 20, saude: 6, fala: "Maçã! Fruta é gostosa e faz bem!", fruta: true },
    { emoji: "🍌", nome: "banana", barriga: 22, saude: 5, fala: "Banana dá muita energia!", fruta: true },
    { emoji: "🥕", nome: "cenoura", barriga: 16, saude: 7, fala: "Cenoura faz bem para os olhos!", fruta: true },
    { emoji: "🥦", nome: "brócolis", barriga: 16, saude: 8, fala: "Brócolis deixa a gente forte!", fruta: true },
    { emoji: "🍇", nome: "uva", barriga: 15, saude: 5, fala: "Uvinhas! Que delícia!", fruta: true },
    { emoji: "🍉", nome: "melancia", barriga: 15, saude: 5, fala: "Melancia é fresquinha e tem muita água!", fruta: true },
    { emoji: "🍛", nome: "arroz e feijão", barriga: 32, saude: 6, fala: "Arroz e feijão! Comida de verdade!" },
    { emoji: "🐟", nome: "peixe", barriga: 26, saude: 6, fala: "Peixe faz bem para crescer!" },
    { emoji: "🥛", nome: "leite", barriga: 14, saude: 5, fala: "Leite ajuda a deixar os ossos fortes!" },
    { emoji: "🍰", nome: "bolo", barriga: 10, saude: 0, diversao: 6, doce: true, fala: "Hum, bolo! Doce é gostoso, mas só um pouquinho." },
    { emoji: "🍭", nome: "pirulito", barriga: 4, saude: 0, diversao: 6, doce: true, fala: "Pirulito! Só um, tá? Depois escovar os dentes!" },
  ];

  const CONQUISTAS = [
    { id: "estrela1", icone: "⭐", nome: "Primeira estrela do dia" },
    { id: "dias3", icone: "📅", nome: "3 dias seguidos cuidando" },
    { id: "dias7", icone: "🗓️", nome: "7 dias seguidos cuidando" },
    { id: "frutas10", icone: "🍎", nome: "10 frutas e verduras" },
    { id: "banhos5", icone: "🛁", nome: "5 banhos" },
    { id: "dentes5", icone: "🪥", nome: "Dentes limpinhos 5 vezes" },
    { id: "bolas20", icone: "🎾", nome: "20 bolinhas jogadas" },
    { id: "sonecas3", icone: "🌙", nome: "3 vezes dormindo bem" },
    { id: "medico", icone: "🩺", nome: "Foi ao médico" },
    { id: "amigos2", icone: "🐾", nome: "2 bichinhos" },
  ];

  JOGOS.push({
    id: "bichinho", nome: "Bichinho Virtual", icone: "🐶",
    faixas: ["3-4", "4-5", "5-6", "6-8", "8-10"],
    ajuda: [
      { figura: svgBicho("cachorro"), texto: "Escolha o seu bichinho e dê um nome para ele." },
      { figura: "🍎", texto: "As barrinhas mostram o que ele precisa: comida, banho, sono, brincadeira e saúde." },
      { figura: "🥦", texto: "Frutas e verduras dão mais saúde. Doce, só um pouquinho!" },
      { figura: "🧽", texto: "No banho, esfregue o bichinho com o dedo para fazer espuma. Depois, enxágue!" },
      { figura: "🌙", texto: "De noite ele fica com sono: apague a luz para ele dormir." },
      { figura: "⭐", texto: "Cuide dele todo dia para ganhar estrelas e conquistas. Ele sente sua falta, mas espera você voltar!" },
    ],
    iniciar(area, faixa) { inicio(area, faixa); },
  });
  CATALOGO["bichinho"] = ["descobrir", "Cuide do seu bichinho todo dia"];

  // ---------- Telas de início ----------
  function inicio(area, faixa) {
    const est = carregar();
    Object.values(est.bichos).forEach(passarTempoFora);
    salvar(est);
    const meus = ORDEM.filter(t => est.bichos[t]);
    if (!meus.length) return escolherTipo(area, faixa, est);
    const modos = meus.map(t => ({ icone: svgBicho(t), rotulo: est.bichos[t].nome, iniciar: () => { est.atual = t; salvar(est); cuidar(area, faixa, t); } }));
    if (meus.length < ORDEM.length) modos.push({ icone: "➕", rotulo: "Novo bichinho", iniciar: () => escolherTipo(area, faixa, est) });
    modos.push({ icone: "🏆", rotulo: "Conquistas", iniciar: () => telaConquistas(area, faixa, () => inicio(area, faixa)) });
    Motor.escolherModo(area, modos, { pequenos: modos.length > 4 });
    Motor.falar(meus.length === 1 ? `O ${est.bichos[meus[0]].nome} está esperando você!` : "Quem você quer cuidar hoje?");
  }

  function escolherTipo(area, faixa, est) {
    const livres = ORDEM.filter(t => !est.bichos[t]);
    const modos = livres.map(t => ({ icone: svgBicho(t), rotulo: TIPOS[t].nome, iniciar: () => telaNome(area, faixa, t) }));
    if (Object.keys(est.bichos).length) modos.push({ icone: "⬅️", rotulo: "Voltar", iniciar: () => inicio(area, faixa) });
    // escolherModo com uma só opção já abriria direto: aqui sempre mostramos a escolha
    if (modos.length === 1) modos.push({ icone: "⬅️", rotulo: "Voltar", iniciar: () => inicio(area, faixa) });
    Motor.escolherModo(area, modos, { pequenos: modos.length > 4 });
    Motor.falar("Escolha o seu bichinho!");
  }

  function telaConquistas(area, faixa, aoVoltar) {
    const est = carregar();
    area.innerHTML = "";
    const tela = div("bv-conq-tela");
    const caixa = div("bv-conq");
    caixa.append(div("bv-conq-titulo", `🏆 Conquistas · ⭐ ${est.estrelas} estrela${est.estrelas === 1 ? "" : "s"}`));
    const grade = div("bv-conq-grade");
    CONQUISTAS.forEach(c => {
      const tem = est.conquistas.includes(c.id);
      const d = div("bv-medalha" + (tem ? " ganhou" : ""));
      d.append(div("bv-medalha-icone", c.icone), div("bv-medalha-nome", c.nome));
      grade.appendChild(d);
    });
    caixa.appendChild(grade);
    const voltar = botao("⬅️ Voltar", () => (aoVoltar || (() => inicio(area, faixa)))(), "chip jogar");
    caixa.appendChild(voltar);
    tela.appendChild(caixa);
    area.appendChild(tela);
    const n = est.conquistas.length;
    Motor.falar(n ? `Você já tem ${n} conquista${n === 1 ? "" : "s"} e ${est.estrelas} estrela${est.estrelas === 1 ? "" : "s"}!` : "Cuide do seu bichinho para ganhar conquistas!");
  }

  // ---------- Dar o nome ----------
  function telaNome(area, faixa, tipo) {
    area.innerHTML = "";
    const T = TIPOS[tipo];
    let nome = "";
    const tela = div("bv-nome-tela");
    const esq = div("bv-nome-esq");
    const fig = div("bv-nome-fig");
    fig.innerHTML = svgBicho(tipo);
    fig.dataset.humor = "feliz";
    const pergunta = div("bv-nome-pergunta", "Qual vai ser o nome?");
    const caixaNome = div("bv-nome-caixa", "");
    const sug = div("bv-sugestoes");
    T.nomes.forEach(n => sug.appendChild(botao(n, () => { nome = n; pintar(); Motor.falar(n); }, "chip")));
    esq.append(fig, pergunta, caixaNome, sug);
    const dir = div("bv-nome-dir");
    const teclado = div("bv-teclado");
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(l => teclado.appendChild(botao(l, () => {
      if (nome.length >= 12) return Motor.animar(caixaNome, "balanca");
      nome = nome ? nome + l.toLowerCase() : l;
      pintar(); Motor.ploc();
    }, "bv-letra")));
    teclado.appendChild(botao("⌫", () => { nome = nome.slice(0, -1); pintar(); }, "bv-letra bv-apagar"));
    const pronto = botao("✔️ Pronto", () => {
      const final = nome.trim();
      if (!final) { Motor.animar(caixaNome, "balanca"); Motor.falar("Escreva um nome ou escolha um dos nomes!"); return; }
      const est = carregar();
      est.bichos[tipo] = novoBicho(tipo, final);
      est.atual = tipo;
      if (Object.keys(est.bichos).length >= 2 && !est.conquistas.includes("amigos2")) est.conquistas.push("amigos2");
      salvar(est);
      cuidar(area, faixa, tipo, true);
    }, "chip jogar bv-pronto");
    const voltar = botao("⬅️ Outro bichinho", () => escolherTipo(area, faixa, carregar()), "chip bv-voltar-nome");
    const linhaBotoes = div("bv-nome-botoes");
    linhaBotoes.append(voltar, pronto);
    dir.append(teclado, linhaBotoes);
    tela.append(esq, dir);
    area.appendChild(tela);
    function pintar() {
      caixaNome.textContent = nome || " ";
      caixaNome.classList.toggle("vazia", !nome);
    }
    pintar();
    Motor.falar(`Que ${T.nome.toLowerCase()} fofo! Qual vai ser o nome dele? Escolha um nome ou escreva.`);
  }

  // ---------- Peças ----------
  function div(classe, texto) { const d = document.createElement("div"); d.className = classe; if (texto !== undefined) d.textContent = texto; return d; }
  function botao(texto, aoClicar, classe = "chip") {
    const b = document.createElement("button");
    b.className = classe;
    b.textContent = texto;
    b.addEventListener("click", aoClicar);
    return b;
  }

  // ---------- Sons ----------
  const N = (f, o) => Motor.nota(f, o);
  const som = {
    risada: () => [880, 990, 880, 1046, 880].forEach((f, i) => N(f, { dur: 0.09, tipo: "triangle", vol: 0.12, inicio: i * 0.09 })),
    nhac: () => { Motor.ruido({ dur: 0.07, vol: 0.18, filtro: "bandpass", freq: 1800 }); Motor.ruido({ dur: 0.07, vol: 0.16, filtro: "bandpass", freq: 1500, inicio: 0.22 }); Motor.ruido({ dur: 0.07, vol: 0.14, filtro: "bandpass", freq: 1700, inicio: 0.44 }); },
    bolha: () => N(500 + Math.random() * 500, { dur: 0.08, vol: 0.12, ate: 1400 }),
    agua: () => Motor.ruido({ dur: 1.2, vol: 0.12, filtro: "highpass", freq: 2500 }),
    bocejo: () => N(520, { dur: 0.9, tipo: "triangle", vol: 0.1, ate: 260 }),
    quica: () => N(180, { dur: 0.15, vol: 0.25, ate: 90 }),
    escova: () => Motor.ruido({ dur: 0.12, vol: 0.1, filtro: "bandpass", freq: 4000 }),
    triste: () => { N(440, { dur: 0.3, tipo: "triangle", vol: 0.1, ate: 380 }); N(380, { dur: 0.4, tipo: "triangle", vol: 0.1, inicio: 0.3, ate: 300 }); },
    ninar: (vivo) => {
      // Brilha, brilha, estrelinha, bem baixinho
      const ms = [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60];
      const ds = [1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 2];
      let i = 0;
      (function proxima() {
        if (i >= ms.length || !vivo()) return;
        N(440 * Math.pow(2, (ms[i] - 69) / 12), { dur: ds[i] * 0.55, tipo: "sine", vol: 0.07 });
        setTimeout(proxima, ds[i] * 600);
        i++;
      })();
    },
  };

  // ---------- Cuidar (tela principal) ----------
  function cuidar(area, faixa, tipo, novo) {
    area.innerHTML = "";
    const est = carregar();
    const b = est.bichos[tipo];
    if (!b) return inicio(area, faixa);
    passarTempoFora(b);
    const sessao = Motor.sessaoAtual();
    const tela = div("bv-tela");
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const T = TIPOS[tipo];

    // topo
    const topo = div("bv-topo");
    const elNome = div("bv-nome", b.nome);
    const bEstrelas = botao(`⭐ ${est.estrelas}`, () => Motor.falar(`Você tem ${est.estrelas} estrela${est.estrelas === 1 ? "" : "s"}! Cuide do ${b.nome} todo dia para ganhar mais.`), "chip bv-estrelas");
    const bConq = botao("🏆", () => { salvarTudo(); telaConquistas(area, faixa, () => cuidar(area, faixa, tipo)); }, "chip");
    bConq.setAttribute("aria-label", "Conquistas");
    const bTrocar = botao("🐾", () => { salvarTudo(); inicio(area, faixa); }, "chip");
    bTrocar.setAttribute("aria-label", "Outros bichinhos");
    topo.append(elNome, bEstrelas, bConq, bTrocar);

    // barrinhas
    const barras = div("bv-barras");
    const elBarras = {};
    NECESSIDADES.forEach(n => {
      const item = div("bv-barra");
      item.title = n.nome;
      const trilho = div("bv-trilho"), cheio = div("bv-cheio");
      trilho.appendChild(cheio);
      item.append(div("bv-barra-icone", n.icone), trilho);
      item.addEventListener("click", () => falarBarra(n));
      barras.appendChild(item);
      elBarras[n.id] = { item, cheio };
    });

    // quarto
    const quarto = div("bv-quarto");
    const janela = div("bv-janela");
    janela.innerHTML = `<div class="bv-astro"></div><div class="bv-nuvem"></div>`;
    const tapete = div("bv-tapete");
    const planta = div("bv-planta", "🪴");
    const prateleira = div("bv-prateleira", "🧸 📚 🚂");
    const bicho = div("bv-bicho");
    bicho.innerHTML = svgBicho(tipo);
    bicho.setAttribute("role", "button");
    bicho.setAttribute("aria-label", `Fazer carinho no ${b.nome}`);
    const balao = div("bv-balao");
    const efeitos = div("bv-efeitos");
    const escuro = div("bv-escuro");
    escuro.innerHTML = `<div class="bv-lua">🌙</div>`;
    quarto.append(janela, prateleira, planta, tapete, bicho, escuro, efeitos, balao);

    const painel = div("bv-painel");
    tela.append(topo, barras, quarto, painel);
    area.appendChild(tela);

    // ---------- humor ----------
    let humorTemp = null, humorAte = 0, modo = "normal";
    function humorBase() {
      if (b.dormindo) return "dormindo";
      if (b.doente) return "doente";
      const menor = Math.min(b.barriga, b.limpeza, b.energia, b.diversao);
      if (menor < 25) return "triste";
      if (b.energia < 35 || (noite() && b.energia < 70)) return "sono";
      return "feliz";
    }
    function humor() { return humorTemp && performance.now() < humorAte ? humorTemp : humorBase(); }
    function mostrarHumor(h, ms) { humorTemp = h; humorAte = performance.now() + ms; pintar(); }
    function pintar() {
      const h = humor();
      bicho.dataset.humor = h;
      bicho.style.setProperty("--sujo", String(limitar((60 - b.limpeza) / 50, 0, 0.9)));
      NECESSIDADES.forEach(n => {
        const v = b[n.id];
        const e = elBarras[n.id];
        e.cheio.style.width = Math.max(4, v) + "%";
        e.cheio.style.background = v > 60 ? "#3bb273" : v > 30 ? "#f7c548" : "#ff7b54";
        e.item.classList.toggle("baixa", v <= 30);
      });
      quarto.classList.toggle("noite", noite());
      quarto.classList.toggle("apagado", b.dormindo);
      bEstrelas.textContent = `⭐ ${est.estrelas}`;
    }

    // ---------- fala ----------
    let ultimaFala = 0, falaTimer = null;
    function dizer(texto, { voz = true } = {}) {
      balao.textContent = texto;
      balao.classList.add("ativo");
      Motor.animar(balao, "bv-surge");
      clearTimeout(falaTimer);
      falaTimer = setTimeout(() => balao.classList.remove("ativo"), 2600 + texto.length * 60);
      if (voz) Motor.falar(texto);
      ultimaFala = performance.now();
    }
    function falarBarra(n) {
      const v = Math.round(b[n.id]);
      const txt = {
        barriga: v > 70 ? "Minha barriga está cheinha!" : v > 35 ? "Já dá para comer alguma coisa." : "Estou com fome!",
        limpeza: v > 70 ? "Estou limpinho e cheiroso!" : v > 35 ? "Estou um pouco sujinho." : "Estou muito sujinho! Quero banho!",
        energia: v > 70 ? "Estou cheio de energia!" : v > 35 ? "Estou ficando cansado." : "Estou com muito sono...",
        diversao: v > 70 ? "Estou muito feliz!" : v > 35 ? "Vamos brincar um pouquinho?" : "Estou entediado... Vamos brincar?",
        saude: b.doente ? "Estou dodói... Me leva ao médico?" : v > 70 ? "Estou com muita saúde!" : "Preciso comer bem e ficar limpinho.",
      }[n.id];
      Motor.animar(elBarras[n.id].item, "pula");
      dizer(txt);
    }
    function falaNecessidade() {
      if (b.dormindo) return null;
      if (b.doente) return "Estou dodói... Me leva ao médico?";
      const op = [
        [b.barriga, "Estou com fome!"],
        [b.limpeza, "Estou sujinho! Quero tomar banho."],
        [b.energia, "Estou com sono..."],
        [b.diversao, "Vamos brincar?"],
      ].sort((x, y) => x[0] - y[0]);
      if (op[0][0] < 45) return op[0][1];
      if (noite() && b.energia < 70) return "Já é noite... estou com soninho.";
      return Motor.sortear(["Eu gosto muito de você!", "Que dia gostoso!", "Você é meu melhor amigo!", "Me faz um carinho?", "Hoje eu estou feliz!"]);
    }

    // ---------- registro dos cuidados, estrela do dia e conquistas ----------
    function registrar(acao) {
      const hoje = hojeChave();
      const dia = est.dias[hoje] || (est.dias[hoje] = { acoes: [] });
      if (!dia.acoes.includes(acao)) dia.acoes.push(acao);
      if (dia.acoes.length >= 3 && est.ultimaEstrela !== hoje) {
        est.seguidos = est.ultimaEstrela === ontemChave() ? (est.seguidos || 0) + 1 : 1;
        est.ultimaEstrela = hoje;
        est.estrelas++;
        ganhar("estrela1");
        if (est.seguidos >= 3) ganhar("dias3");
        if (est.seguidos >= 7) ganhar("dias7");
        Motor.depois(() => {
          Motor.comemorar(bEstrelas);
          Motor.tim();
          Motor.falar(`Você ganhou a estrela do dia por cuidar do ${b.nome}!`, { naFila: true });
        }, 1600);
      }
      salvarTudo();
    }
    function contar(k, alvo, conquista) {
      est.cont[k] = (est.cont[k] || 0) + 1;
      if (est.cont[k] >= alvo) ganhar(conquista);
    }
    function ganhar(id) {
      if (est.conquistas.includes(id)) return;
      est.conquistas.push(id);
      const c = CONQUISTAS.find(x => x.id === id);
      if (!c) return;
      Motor.depois(() => {
        const aviso = div("bv-aviso-conq", `${c.icone} ${c.nome}!`);
        tela.appendChild(aviso);
        Motor.comemorar(aviso);
        Motor.falar(`Nova conquista: ${c.nome}!`, { naFila: true });
        setTimeout(() => aviso.remove(), 3500);
      }, 2400);
    }
    function salvarTudo() {
      b.ultimo = Date.now();
      // outros bichinhos podem ter mudado em outra tela: salva só este e o placar
      const atual = carregar();
      atual.bichos[tipo] = b;
      atual.atual = tipo;
      ["estrelas", "dias", "seguidos", "ultimaEstrela", "conquistas", "cont"].forEach(k => { atual[k] = est[k]; });
      salvar(atual);
    }
    function mudar(k, d) { b[k] = limitar(b[k] + d); }

    // ---------- efeitos ----------
    function efeito(texto, x, y, classe = "bv-sobe") {
      const s = div("bv-efeito " + classe, texto);
      s.style.left = x + "px"; s.style.top = y + "px";
      efeitos.appendChild(s);
      setTimeout(() => s.remove(), 1600);
      return s;
    }
    function centroBicho(fy = 0.5) {
      const rq = quarto.getBoundingClientRect(), rb = bicho.getBoundingClientRect();
      return [rb.left - rq.left + rb.width / 2, rb.top - rq.top + rb.height * fy];
    }
    const ANIMS = ["bv-pulinho", "bv-pulao", "bv-treme", "bv-espreguica", "balanca"];
    function animarBicho(classe) {
      ANIMS.forEach(c => { if (c !== classe) bicho.classList.remove(c); });
      Motor.animar(bicho, classe);
    }
    function coracoes(n = 3) {
      const [x, y] = centroBicho(0.25);
      for (let i = 0; i < n; i++) setTimeout(() => efeito("💖", x + (Math.random() * 80 - 40), y), i * 150);
    }

    // carinho (tocar no bichinho)
    let ultimoCarinho = 0;
    bicho.addEventListener("click", e => {
      const jaFoi = performance.now() - (bicho._tocou || 0) < 600; // o pointerdown já esfregou
      if (modo === "banho") { if (!jaFoi) { const [x, y] = centroBicho(0.45); esfregar(null, null, x + Math.random() * 120 - 60, y + Math.random() * 120 - 60); } return; }
      if (modo === "dentes") { if (!jaFoi) escovar(); return; }
      if (modo !== "normal") return;
      if (b.dormindo) { dizer("Shhh... ele está dormindo.", { voz: true }); return; }
      if (performance.now() - ultimoCarinho < 800) return;
      ultimoCarinho = performance.now();
      mudar("diversao", 3);
      mostrarHumor(b.doente ? "doente" : "rindo", 1600);
      animarBicho("bv-pulinho");
      som.risada();
      coracoes(2);
      dizer(b.doente ? "Obrigado pelo carinho..." : Motor.sortear(["Hihihi! Cócegas!", "Eu adoro carinho!", "Hehe! Mais!", "Que gostoso!"]));
      pintar();
    });

    // ---------- painel de ações ----------
    const ACOES = [
      { id: "comer", icone: "🍎", nome: "Comer", cor: "#ff8c8c", fazer: () => painelComida() },
      { id: "banho", icone: "🛁", nome: "Banho", cor: "#7cc6fe", fazer: () => painelBanho() },
      { id: "dentes", icone: "🪥", nome: "Dentes", cor: "#a0e7e5", fazer: () => painelDentes() },
      { id: "dormir", icone: "😴", nome: "Dormir", cor: "#b8a1ff", fazer: () => dormir() },
      { id: "brincar", icone: "🎾", nome: "Brincar", cor: "#b5e48c", fazer: () => painelBrincar() },
      { id: "medico", icone: "🩺", nome: "Médico", cor: "#ffd166", fazer: () => painelMedico() },
    ];
    function botaoAcao(icone, nome, cor, aoClicar, extra = "") {
      const bt = document.createElement("button");
      bt.className = "bv-acao " + extra;
      bt.style.setProperty("--cor", cor);
      bt.innerHTML = `<span class="bv-acao-icone"></span><span class="bv-acao-nome"></span>`;
      bt.firstChild.textContent = icone;
      bt.lastChild.textContent = nome;
      bt.addEventListener("click", aoClicar);
      return bt;
    }
    function painelPrincipal() {
      modo = "normal";
      quarto.classList.remove("modo-banho", "modo-dentes", "modo-brincar", "modo-medico");
      efeitos.querySelectorAll(".bv-doutor").forEach(d => d.remove());
      bola.style.display = "none";
      humorTemp = humorTemp === "dentes" ? null : humorTemp;
      painel.className = "bv-painel principal";
      painel.innerHTML = "";
      ACOES.forEach(a => {
        const bt = botaoAcao(a.icone, a.nome, a.cor, a.fazer);
        if (a.id === "medico" && b.doente) bt.classList.add("chama");
        painel.appendChild(bt);
      });
      pintar();
    }
    function painelCom(classe, botoes) {
      painel.className = "bv-painel " + classe;
      painel.innerHTML = "";
      botoes.forEach(x => painel.appendChild(x));
    }
    const botaoPronto = (aoClicar, texto = "Pronto") => botaoAcao("✔️", texto, "#8be0a4", aoClicar, "pronto");

    // ----- comer -----
    let docesRecentes = 0, ultimoDoce = 0;
    function painelComida() {
      if (b.dormindo) return;
      modo = "comer";
      const lista = div("bv-comidas");
      COMIDAS.forEach(c => {
        const bt = document.createElement("button");
        bt.className = "bv-comida";
        bt.textContent = c.emoji;
        bt.setAttribute("aria-label", c.nome);
        bt.addEventListener("click", () => darComida(c, bt));
        Motor.arrastavel(bt, { alvos: () => [bicho], aoSoltar: () => { darComida(c, bt, true); return true; } });
        lista.appendChild(bt);
      });
      painelCom("comida", [lista, botaoPronto(painelPrincipal, "Fechar")]);
      dizer(b.barriga > 90 ? "Estou cheinho, mas posso beliscar uma fruta!" : "O que vamos comer? Frutas e verduras são as melhores!");
    }
    let comendo = false;
    function darComida(c, bt, arrastou) {
      if (comendo || !vivo()) return;
      if (b.barriga >= 96) { mostrarHumor("feliz", 800); animarBicho("balanca"); dizer("Estou cheio! Obrigado!"); return; }
      if (c.doce && (performance.now() - ultimoDoce < 5 * 60 * 1000) && docesRecentes >= 1) {
        animarBicho("balanca");
        dizer("Já comi doce agora há pouco. Que tal uma fruta?");
        return;
      }
      comendo = true;
      // a comida voa até a boca
      const voo = div("bv-voando", c.emoji);
      const rb = bt.getBoundingClientRect(), [bx, by] = centroBicho(0.5);
      const rq = quarto.getBoundingClientRect();
      const ini = arrastou ? [bx + rq.left, by + rq.top - 20] : [rb.left + rb.width / 2, rb.top + rb.height / 2];
      const fim = [bx + rq.left, by + rq.top];
      Object.assign(voo.style, { left: ini[0] + "px", top: ini[1] + "px" });
      document.body.appendChild(voo);
      requestAnimationFrame(() => requestAnimationFrame(() => { Object.assign(voo.style, { left: fim[0] + "px", top: fim[1] + "px", transform: "translate(-50%,-50%) scale(.4)" }); }));
      setTimeout(() => {
        voo.remove();
        if (!vivo()) return;
        mostrarHumor("comendo", 1400);
        som.nhac();
        mudar("barriga", c.barriga); mudar("saude", c.saude); if (c.diversao) mudar("diversao", c.diversao);
        if (c.doce) { docesRecentes++; ultimoDoce = performance.now(); }
        if (c.fruta) contar("frutas", 10, "frutas10");
        const [x, y] = centroBicho(0.55);
        ["✨", c.saude >= 6 ? "💪" : "😋"].forEach((e, i) => setTimeout(() => efeito(e, x + (i ? 40 : -40), y), i * 200));
        Motor.depois(() => { mostrarHumor("rindo", 900); dizer(c.fala); comendo = false; }, 1300);
        registrar("comer");
        pintar();
      }, 520);
    }

    // ----- banho -----
    let espumas = [], esfregou = 0;
    function painelBanho() {
      if (b.dormindo) return;
      modo = "banho";
      quarto.classList.add("modo-banho");
      const esf = botaoAcao("🧽", "Esfregar", "#7cc6fe", () => { const [x, y] = centroBicho(0.45); esfregar(null, null, x + Math.random() * 120 - 60, y + Math.random() * 120 - 60); });
      const enx = botaoAcao("🚿", "Enxaguar", "#4cc9f0", enxaguar);
      painelCom("banho", [esf, enx, botaoPronto(() => { limparEspuma(); painelPrincipal(); })]);
      dizer("Hora do banho! Esfregue com o dedo para fazer espuma!");
    }
    function esfregar(cx, cy, qx, qy) {
      if (modo !== "banho") return;
      const rq = quarto.getBoundingClientRect();
      const x = qx !== undefined ? qx : cx - rq.left, y = qy !== undefined ? qy : cy - rq.top;
      if (espumas.length < 40) {
        const s = div("bv-espuma");
        const tam = 22 + Math.random() * 30;
        Object.assign(s.style, { left: x + "px", top: y + "px", width: tam + "px", height: tam + "px" });
        efeitos.appendChild(s);
        espumas.push(s);
      }
      if (Math.random() < 0.35) som.bolha();
      esfregou++;
      mudar("limpeza", 2.2);
      if (Math.random() < 0.25) bolhaSobe(x, y);
      if (esfregou % 12 === 0) { mostrarHumor("rindo", 900); dizer(Motor.sortear(["Que espuminha gostosa!", "Hihi, faz cócegas!", "Esfrega mais!"]), { voz: esfregou % 24 === 0 }); }
      pintar();
    }
    function bolhaSobe(x, y) {
      const bo = div("bv-bolha");
      bo.style.left = x + "px"; bo.style.top = y + "px";
      bo.style.setProperty("--dx", (Math.random() * 80 - 40) + "px");
      bo.addEventListener("pointerdown", () => { som.bolha(); bo.classList.add("estoura"); setTimeout(() => bo.remove(), 200); });
      efeitos.appendChild(bo);
      setTimeout(() => bo.remove(), 3000);
    }
    function limparEspuma() { espumas.forEach(s => s.remove()); espumas = []; }
    function enxaguar() {
      if (modo !== "banho") return;
      som.agua();
      quarto.classList.add("chuveiro");
      const [x] = centroBicho(0.5);
      for (let i = 0; i < 26; i++) {
        const g = div("bv-gota", "💧");
        g.style.left = (x + Math.random() * 160 - 80) + "px";
        g.style.animationDelay = (Math.random() * 0.8) + "s";
        efeitos.appendChild(g);
        setTimeout(() => g.remove(), 1800);
      }
      setTimeout(() => {
        quarto.classList.remove("chuveiro");
        const tinha = espumas.length;
        limparEspuma();
        if (!vivo()) return;
        if (tinha >= 6 || b.limpeza > 85) {
          b.limpeza = 100;
          mudar("diversao", 6);
          contar("banhos", 5, "banhos5");
          registrar("banho");
          mostrarHumor("rindo", 1500);
          const [cx, cy] = centroBicho(0.4);
          for (let i = 0; i < 5; i++) setTimeout(() => efeito("✨", cx + Math.random() * 140 - 70, cy + Math.random() * 100 - 50), i * 120);
          dizer("Estou limpinho e cheiroso! Obrigado!");
          Motor.depois(painelPrincipal, 1600);
        } else {
          dizer("Faltou espuma! Esfregue mais um pouquinho.");
        }
        pintar();
      }, 1700);
    }
    // esfregar arrastando o dedo
    let esfregando = null;
    quarto.addEventListener("pointerdown", e => {
      if (modo !== "banho" && modo !== "dentes") return;
      esfregando = { x: e.clientX, y: e.clientY, d: 0 };
      if (e.pointerId !== 99) { try { quarto.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } }
      mostrarFerramenta(e);
      const rb = bicho.getBoundingClientRect();
      if (e.pointerId !== 99 && e.clientX > rb.left && e.clientX < rb.right && e.clientY > rb.top && e.clientY < rb.bottom) {
        if (modo === "banho") esfregar(e.clientX, e.clientY); else escovar();
        bicho._tocou = performance.now();
      }
    });
    quarto.addEventListener("pointermove", e => {
      if (modo === "banho" || modo === "dentes") mostrarFerramenta(e);
      if (!esfregando) return;
      esfregando.d += Math.hypot(e.clientX - esfregando.x, e.clientY - esfregando.y);
      esfregando.x = e.clientX; esfregando.y = e.clientY;
      const rb = bicho.getBoundingClientRect();
      const dentro = e.clientX > rb.left && e.clientX < rb.right && e.clientY > rb.top && e.clientY < rb.bottom;
      if (esfregando.d > 34 && dentro) {
        esfregando.d = 0;
        if (modo === "banho") esfregar(e.clientX, e.clientY); else escovar();
      }
    });
    const pararEsfregar = () => { esfregando = null; ferramenta.classList.remove("ativa"); };
    quarto.addEventListener("pointerup", pararEsfregar);
    quarto.addEventListener("pointercancel", pararEsfregar);
    const ferramenta = div("bv-ferramenta");
    quarto.appendChild(ferramenta);
    function mostrarFerramenta(e) {
      const rq = quarto.getBoundingClientRect();
      ferramenta.textContent = modo === "banho" ? "🧽" : "🪥";
      ferramenta.style.left = (e.clientX - rq.left) + "px";
      ferramenta.style.top = (e.clientY - rq.top) + "px";
      ferramenta.classList.toggle("ativa", !!esfregando);
    }

    // ----- dentes -----
    let manchas = [], escovadas = 0;
    function painelDentes() {
      if (b.dormindo) return;
      modo = "dentes";
      quarto.classList.add("modo-dentes");
      manchas = [...bicho.querySelectorAll(".mancha")];
      manchas.forEach(m => m.classList.remove("limpa"));
      escovadas = 0;
      humorTemp = "dentes"; humorAte = Infinity; pintar();
      const esc = botaoAcao("🪥", "Escovar", "#a0e7e5", escovar);
      painelCom("dentes", [esc, botaoPronto(() => { humorTemp = null; painelPrincipal(); })]);
      dizer("Abra a boca! Escove os dentinhos para tirar a sujeira.");
    }
    function escovar() {
      if (modo !== "dentes") return;
      som.escova();
      escovadas++;
      animarBicho("bv-treme");
      const [x, y] = centroBicho(0.52);
      if (Math.random() < 0.5) efeito("🫧", x + Math.random() * 60 - 30, y, "bv-sobe pequeno");
      if (escovadas % 2 === 0) {
        const m = manchas.find(mm => !mm.classList.contains("limpa"));
        if (m) m.classList.add("limpa");
        if (!manchas.some(mm => !mm.classList.contains("limpa"))) {
          modo = "pronto";
          mudar("saude", 8);
          contar("dentes", 5, "dentes5");
          registrar("dentes");
          docesRecentes = 0;
          for (let i = 0; i < 6; i++) setTimeout(() => efeito("✨", x + Math.random() * 100 - 50, y + Math.random() * 40 - 20), i * 100);
          Motor.tim();
          dizer("Dentes brilhando! Que sorriso lindo!");
          Motor.depois(() => { humorTemp = null; mostrarHumor("rindo", 1500); painelPrincipal(); }, 1800);
        }
      }
    }

    // ----- dormir -----
    let zzzTimer = null;
    function dormir() {
      if (b.energia >= 92 && !noite()) {
        animarBicho("balanca");
        dizer("Ainda não estou com sono! Vamos brincar?");
        return;
      }
      b.dormindo = true;
      modo = "dormir";
      som.bocejo();
      painelCom("dormir", [botaoAcao("💡", "Acender a luz", "#ffd166", () => acordar(true))]);
      dizer("Boa noite! Vou dormir um pouquinho.");
      Motor.depois(() => som.ninar(() => b.dormindo && vivo()), 1800);
      clearInterval(zzzTimer);
      zzzTimer = setInterval(() => {
        if (!vivo() || !b.dormindo) return clearInterval(zzzTimer);
        const [x, y] = centroBicho(0.2);
        efeito(Motor.sortear(["💤", "Z", "z"]), x + 30, y, "bv-zzz");
      }, 900);
      salvarTudo();
      pintar();
    }
    function acordar(pelaLuz) {
      clearInterval(zzzTimer);
      const descansou = b.energia >= 80;
      b.dormindo = false;
      if (descansou) { contar("sonecas", 3, "sonecas3"); registrar("dormir"); }
      painelPrincipal();
      mostrarHumor(descansou ? "rindo" : "sono", 1500);
      animarBicho("bv-espreguica");
      dizer(descansou ? "Bom dia! Dormi muito bem!" : pelaLuz ? "Ah, ainda estou com soninho..." : "Acordei!");
      salvarTudo();
    }

    // ----- brincar -----
    let jogadas = 0, voando = false;
    function painelBrincar() {
      if (b.dormindo) return;
      if (b.energia < 15) { mostrarHumor("sono", 1200); dizer("Estou cansado demais para brincar... Vamos dormir?"); return; }
      if (b.doente) { dizer("Estou dodói... Primeiro vamos ao médico?"); return; }
      modo = "brincar";
      jogadas = 0;
      quarto.classList.add("modo-brincar");
      const jogar = (fx, fy) => () => { const rq = quarto.getBoundingClientRect(); jogarBola(rq.width * fx, rq.height * fy); };
      painelCom("brincar", [
        botaoAcao("⬅️", "Pra lá", "#b5e48c", jogar(0.16, 0.62)),
        botaoAcao("⬆️", "Pra cima", "#b5e48c", jogar(0.5, 0.18)),
        botaoAcao("➡️", "Pra cá", "#b5e48c", jogar(0.84, 0.62)),
        botaoPronto(() => { bola.style.display = "none"; painelPrincipal(); }),
      ]);
      bola.style.display = "block";
      posBolaNoBicho();
      dizer("Jogue a bolinha! Toque no quarto ou nas setas.");
    }
    const bola = div("bv-bola", "🎾");
    bola.style.display = "none";
    quarto.appendChild(bola);
    function posBolaNoBicho() {
      const [x, y] = centroBicho(0.85);
      bola.style.left = (x + 50) + "px"; bola.style.top = y + "px";
    }
    quarto.addEventListener("click", e => {
      if (modo !== "brincar" || e.target.closest(".bv-bicho")) return;
      const rq = quarto.getBoundingClientRect();
      jogarBola(e.clientX - rq.left, e.clientY - rq.top);
    });
    function animarPonto(el, de, ate, ms, altura) {
      return new Promise(res => {
        const t0 = performance.now();
        (function f() {
          if (!vivo()) return res();
          const p = Math.min(1, (performance.now() - t0) / ms);
          const x = de[0] + (ate[0] - de[0]) * p;
          const y = de[1] + (ate[1] - de[1]) * p - Math.sin(p * Math.PI) * altura;
          el.style.left = x + "px"; el.style.top = y + "px";
          if (p < 1) requestAnimationFrame(f); else res();
        })();
      });
    }
    async function jogarBola(x, y) {
      if (voando || modo !== "brincar") return;
      voando = true;
      const rq = quarto.getBoundingClientRect();
      x = limitar(x, 30, rq.width - 30); y = limitar(y, 30, rq.height - 30);
      const de = [parseFloat(bola.style.left) || 0, parseFloat(bola.style.top) || 0];
      await animarPonto(bola, de, [x, y], 650, 90);
      if (!vivo()) return;
      som.quica();
      // o bichinho corre até a bola e pula para pegar
      const [bx] = centroBicho(0.5);
      const dx = x - bx + (parseFloat(bicho.dataset.dx) || 0);
      bicho.dataset.dx = String(dx);
      bicho.style.transform = `translateX(${dx}px)`;
      mostrarHumor("rindo", 1400);
      await new Promise(r => setTimeout(r, 520));
      if (!vivo()) return;
      animarBicho(y < rq.height * 0.4 ? "bv-pulao" : "bv-pulinho");
      await new Promise(r => setTimeout(r, 380));
      if (!vivo()) return;
      bola.style.display = "none";
      som.risada();
      // volta para o meio com a bolinha
      bicho.dataset.dx = "0";
      bicho.style.transform = "";
      await new Promise(r => setTimeout(r, 560));
      if (!vivo()) return;
      bola.style.display = modo === "brincar" ? "block" : "none";
      posBolaNoBicho();
      coracoes(1);
      jogadas++;
      mudar("diversao", 12); mudar("energia", -3); mudar("barriga", -2);
      contar("bolas", 20, "bolas20");
      if (jogadas === 1) registrar("brincar");
      pintar();
      voando = false;
      if (b.energia < 15 || jogadas >= 6) {
        dizer(jogadas >= 6 ? "Ufa! Foi muito divertido! Vamos descansar um pouco." : "Cansei! Foi muito divertido!");
        bola.style.display = "none";
        Motor.depois(painelPrincipal, 1500);
      } else dizer(Motor.sortear(["Peguei!", "De novo! De novo!", "Que divertido!", "Joga mais!"]), { voz: jogadas % 2 === 1 });
    }

    // ----- médico -----
    function painelMedico() {
      if (b.dormindo) return;
      modo = "medico";
      quarto.classList.add("modo-medico");
      const passos = b.doente
        ? [["🌡️", "Termômetro", "Vamos medir a febre. Um pouquinho quente!"], ["🩺", "Escutar", "Tum tum, tum tum. O coração está forte!"], ["🥄", "Remédio", "O médico deu o remédio certo. Remédio, só com um adulto!"], ["🩹", "Curativo", "Um curativo e um abraço!"]]
        : [["🌡️", "Termômetro", "Sem febre!"], ["🩺", "Escutar", "Tum tum, tum tum. Tudo certinho!"]];
      let passo = 0;
      const doutor = div("bv-doutor", "🧑‍⚕️");
      efeitos.appendChild(doutor);
      const botoes = passos.map(([ic, nome, fala], i) => {
        const bt = botaoAcao(ic, nome, "#ffd166", () => {
          if (i !== passo) { Motor.animar(botoes[passo], "pn-pulo"); Motor.animar(bt, "balanca"); return; }
          passo++;
          bt.disabled = true;
          bt.classList.add("feito");
          const [x, y] = centroBicho(0.35);
          efeito(ic, x, y, "bv-ferramenta-uso");
          if (ic === "🩺") { N(80, { dur: 0.15, vol: 0.4 }); N(70, { dur: 0.15, vol: 0.35, inicio: 0.25 }); }
          else Motor.ploc();
          dizer(fala);
          if (passo < passos.length) Motor.animar(botoes[passo], "pn-pulo");
          else Motor.depois(curou, 1800);
        });
        return bt;
      });
      if (botoes[0]) botoes[0].classList.add("chama");
      const sair = botaoPronto(() => { if (b.doente) dizer("Tudo bem. Quando quiser, a gente volta ao médico."); painelPrincipal(); }, "Fechar");
      painelCom("medico", [...botoes, sair]);
      dizer(b.doente ? "Vamos cuidar do dodói! Toque nos instrumentos do médico, um de cada vez." : "Vamos fazer um check-up!");
      function curou() {
        if (modo !== "medico") return;
        doutor.remove();
        const estava = b.doente;
        b.doente = false;
        b.saude = estava ? 100 : limitar(b.saude + 5);
        if (estava) { mudar("energia", 10); ganhar("medico"); }
        registrar("medico");
        mostrarHumor("rindo", 1800);
        coracoes(4);
        Motor.tim();
        dizer(estava ? "Sarei! Obrigado por cuidar de mim!" : "Está tudo bem! Você cuida muito bem de mim!");
        Motor.depois(painelPrincipal, 1500);
      }
    }

    // ---------- o tempo passando com o app aberto ----------
    let ultimoTique = performance.now(), ultimoSalvo = 0;
    const tique = setInterval(() => {
      if (!vivo()) { clearInterval(tique); clearInterval(zzzTimer); return; }
      const agora = performance.now();
      const s = Math.min(5, (agora - ultimoTique) / 1000);
      ultimoTique = agora;
      const PISO = 8;
      const cai = (k, v) => { if (b[k] > PISO) b[k] = Math.max(PISO, b[k] - v * s); };
      if (b.dormindo) {
        b.energia = limitar(b.energia + 4 * s);
        cai("barriga", 0.01);
        if (b.energia >= 100) acordar(false);
      } else {
        cai("barriga", 0.045); cai("limpeza", 0.03); cai("diversao", 0.05);
        cai("energia", noite() ? 0.06 : 0.03);
      }
      if (b.barriga < 20 || b.limpeza < 20) b.saude = Math.max(15, b.saude - 0.04 * s);
      else if (!b.doente) b.saude = limitar(b.saude + 0.03 * s);
      if (!b.doente && b.saude < 35) {
        b.doente = true;
        som.triste();
        dizer("Ai... estou dodói. Me leva ao médico?");
        if (modo === "normal") painelPrincipal();
      }
      pintar();
      if (modo === "normal" && !b.dormindo && agora - ultimaFala > 22000) {
        const f = falaNecessidade();
        if (f) { dizer(f, { voz: agora - ultimaFala > 40000 || b.doente || /fome|sono|sujinho|brincar/.test(f) }); if (/sono|soninho/.test(f)) som.bocejo(); }
      }
      if (agora - ultimoSalvo > 5000) { ultimoSalvo = agora; salvarTudo(); }
    }, 1000);

    // ---------- começo ----------
    painelPrincipal();
    if (b.dormindo) {
      modo = "dormir";
      painelCom("dormir", [botaoAcao("💡", "Acender a luz", "#ffd166", () => acordar(true))]);
      zzzTimer = setInterval(() => {
        if (!vivo() || !b.dormindo) return clearInterval(zzzTimer);
        const [x, y] = centroBicho(0.2);
        efeito(Motor.sortear(["💤", "Z", "z"]), x + 30, y, "bv-zzz");
      }, 900);
    }
    pintar();
    salvarTudo();
    Motor.depois(() => {
      if (novo) { mostrarHumor("rindo", 1500); dizer(`Oi! Meu nome é ${b.nome}! Vamos ser amigos?`); }
      else if (b.dormindo) dizer(`O ${b.nome} está dormindo. Shhh...`);
      else { const f = falaNecessidade(); dizer(`Oi! Que bom que você voltou! ${f && !/gosto|dia|amigo|carinho|feliz/.test(f) ? f : ""}`.trim()); }
    }, 500);
  }
})();
