// Batalha Naval: mar 10×10 (linhas A–J, colunas 1–10) ou 8×8, frota clássica (porta-aviões 5,
// encouraçado 4, cruzador 3, submarino 3, destróier 2; no 8×8 sem o porta-aviões). Os navios não
// encostam um no outro (nem na diagonal). Tiros alternados: "água", "acertou", "afundou o ___";
// opção de atirar de novo ao acertar. Contra o computador (😊 Fácil: tiros ao acaso; 🧠 Esperto:
// caça os vizinhos depois de acertar, segue a linha do navio e usa paridade/probabilidade para
// procurar) ou 2 jogadores no mesmo aparelho, com a tela "passe o aparelho" escondendo o mar.
// Em pé no celular aparece um mar por vez (botão para trocar); deitado/tablet/TV, os dois lado a lado.
(() => {
  const ID = "batalha-naval";
  const LETRAS = "ABCDEFGHIJ";
  const FALA_LETRA = { A: "á", B: "bê", C: "cê", D: "dê", E: "é", F: "éfe", G: "gê", H: "agá", I: "i", J: "jota" };
  const TIPOS = {
    porta: { nome: "porta-aviões", tam: 5, cor: "#8fa3b8" },
    enc: { nome: "encouraçado", tam: 4, cor: "#6c7a89" },
    cru: { nome: "cruzador", tam: 3, cor: "#2a9d8f" },
    sub: { nome: "submarino", tam: 3, cor: "#f4c430" },
    des: { nome: "destróier", tam: 2, cor: "#e76f51" },
  };
  const FROTAS = { 10: ["porta", "enc", "cru", "sub", "des"], 8: ["enc", "cru", "sub", "des"] };
  const NIVEIS = { facil: "😊 Fácil", esperto: "🧠 Esperto" };
  const OPCOES = [
    { chave: "modo", titulo: "Jogar contra", valores: [["robo", "🤖 Computador"], ["dois", "👥 2 jogadores"]] },
    { chave: "nivel", titulo: "Computador", valores: [["facil", NIVEIS.facil], ["esperto", NIVEIS.esperto]] },
    { chave: "tamanho", titulo: "Tamanho do mar", valores: [["10", "🌊 10×10 · 5 navios"], ["8", "🏝️ 8×8 · 4 navios"]] },
    { chave: "extra", titulo: "Acertou um navio", valores: [["sim", "🎯 Atira de novo"], ["nao", "🔄 Passa a vez"]] },
  ];
  const PADRAO = {
    "6-8": { modo: "robo", nivel: "facil", tamanho: "8", extra: "sim" },
    "8-10": { modo: "robo", nivel: "esperto", tamanho: "10", extra: "nao" },
  };

  // ---------- Regras (funções puras) ----------
  const vazio = (n, v) => Array.from({ length: n }, () => Array(n).fill(v));
  const dentro = (n, r, c) => r >= 0 && c >= 0 && r < n && c < n;
  const coord = (r, c) => LETRAS[r] + (c + 1);
  const coordFalada = (r, c) => `${FALA_LETRA[LETRAS[r]]} ${c + 1}`;
  const celulasDe = (r, c, tam, horiz) => Array.from({ length: tam }, (_, k) => [r + (horiz ? 0 : k), c + (horiz ? k : 0)]);

  // O navio cabe aqui sem sair do mar e sem encostar (nem na diagonal) em outro?
  function cabe(mapa, n, r, c, tam, horiz) {
    for (const [rr, cc] of celulasDe(r, c, tam, horiz)) {
      if (!dentro(n, rr, cc)) return false;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const a = rr + dr, b = cc + dc;
        if (dentro(n, a, b) && mapa[a][b] >= 0) return false;
      }
    }
    return true;
  }
  function novoJogador(n, nome) {
    return { n, nome, navios: [], mapa: vazio(n, -1), tiros: vazio(n, null), disparos: 0, acertos: 0 };
  }
  function colocar(j, tipo, r, c, horiz) {
    const t = TIPOS[tipo];
    const nav = { tipo, nome: t.nome, tam: t.tam, r, c, horiz, celulas: celulasDe(r, c, t.tam, horiz), acertos: 0, afundado: false };
    const i = j.navios.length;
    j.navios.push(nav);
    nav.celulas.forEach(([a, b]) => { j.mapa[a][b] = i; });
    return nav;
  }
  function tirarUltimo(j) {
    const nav = j.navios.pop();
    if (nav) nav.celulas.forEach(([a, b]) => { j.mapa[a][b] = -1; });
    return nav;
  }
  function sortearFrota(j, tipos, rnd = Math.random) {
    for (let tent = 0; tent < 300; tent++) {
      j.navios = []; j.mapa = vazio(j.n, -1);
      let ok = true;
      for (const tipo of tipos) {
        const tam = TIPOS[tipo].tam, op = [];
        for (let r = 0; r < j.n; r++) for (let c = 0; c < j.n; c++) for (const h of [true, false]) if (cabe(j.mapa, j.n, r, c, tam, h)) op.push([r, c, h]);
        if (!op.length) { ok = false; break; }
        const [r, c, h] = op[Math.floor(rnd() * op.length)];
        colocar(j, tipo, r, c, h);
      }
      if (ok) return true;
    }
    return false;
  }

  // Tiro no mar de `def`. tiros: null | "agua" | "fogo" | "afundado" | "cerca" (em volta de um navio
  // afundado: ali não pode ter navio, porque eles não encostam).
  function atirar(def, r, c) {
    const t = def.tiros;
    if (t[r][c]) return null;
    const i = def.mapa[r][c];
    if (i < 0) { t[r][c] = "agua"; return { tipo: "agua" }; }
    t[r][c] = "fogo";
    const nav = def.navios[i];
    nav.acertos++;
    if (nav.acertos < nav.tam) return { tipo: "acertou", navio: nav };
    nav.afundado = true;
    nav.celulas.forEach(([a, b]) => { t[a][b] = "afundado"; });
    nav.celulas.forEach(([a, b]) => {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const x = a + dr, y = b + dc;
        if (dentro(def.n, x, y) && !t[x][y]) t[x][y] = "cerca";
      }
    });
    return { tipo: "afundou", navio: nav, fim: def.navios.every(v => v.afundado) };
  }

  // Tiro do computador no mar de `def`. Só usa o que um jogador de verdade saberia: os tiros já
  // dados e quais navios já afundaram.
  function tiroRobo(def, nivel, rnd = Math.random) {
    const n = def.n, t = def.tiros;
    const livre = (r, c) => dentro(n, r, c) && !t[r][c];
    const sortear = l => l[Math.floor(rnd() * l.length)];
    const livres = [], feridos = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!t[r][c]) livres.push([r, c]);
      else if (t[r][c] === "fogo") feridos.push([r, c]);
    }
    const viz4 = ([r, c]) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => livre(a, b));
    if (nivel === "facil") {
      // ao acaso; de vez em quando tenta do lado de um acerto
      if (feridos.length && rnd() < 0.3) { const v = feridos.flatMap(viz4); if (v.length) return sortear(v); }
      return sortear(livres);
    }
    // Esperto, modo "alvo": termina o navio que já foi acertado
    if (feridos.length) {
      const chave = ([r, c]) => r * n + c;
      const fer = new Set(feridos.map(chave));
      const grupo = [feridos[0]], visto = new Set([chave(feridos[0])]);
      for (let k = 0; k < grupo.length; k++) {
        const [r, c] = grupo[k];
        [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(p => {
          if (dentro(n, p[0], p[1]) && fer.has(chave(p)) && !visto.has(chave(p))) { visto.add(chave(p)); grupo.push(p); }
        });
      }
      let cand = [];
      if (grupo.length >= 2) {
        const horiz = grupo[0][0] === grupo[1][0];
        const ord = grupo.slice().sort((a, b) => (horiz ? a[1] - b[1] : a[0] - b[0]));
        const [p, u] = [ord[0], ord[ord.length - 1]];
        cand = (horiz ? [[p[0], p[1] - 1], [u[0], u[1] + 1]] : [[p[0] - 1, p[1]], [u[0] + 1, u[1]]]).filter(([a, b]) => livre(a, b));
      }
      if (!cand.length) cand = grupo.flatMap(viz4);
      if (cand.length) return sortear(cand);
    }
    // Modo "caça": casa onde mais cabem os navios que faltam, numa grade de paridade
    const tams = def.navios.filter(v => !v.afundado).map(v => v.tam);
    const dens = vazio(n, 0);
    tams.forEach(L => {
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) for (const h of [true, false]) {
        const cs = celulasDe(r, c, L, h);
        if (cs.every(([a, b]) => livre(a, b))) cs.forEach(([a, b]) => { dens[a][b]++; });
      }
    });
    const passo = Math.max(2, Math.min(...tams, 9));
    const melhores = lista => {
      let m = 0, l = [];
      lista.forEach(([r, c]) => { const d = dens[r][c]; if (d > m) { m = d; l = [[r, c]]; } else if (d === m && d > 0) l.push([r, c]); });
      return l;
    };
    const par = melhores(livres.filter(([r, c]) => (r + c) % passo === 0));
    if (par.length) return sortear(par);
    const qualquer = melhores(livres);
    return sortear(qualquer.length ? qualquer : livres);
  }

  // ---------- Desenhos ----------
  // Navio em SVG: deitado com a proa para a direita; em pé, girado 90°.
  function navioSVG(tipo, tam, horiz) {
    const w = tam * 100, cor = TIPOS[tipo].cor, borda = "#26323f";
    let s = "";
    if (tipo === "sub") {
      s += `<rect x="8" y="30" width="${w - 16}" height="52" rx="26" fill="${cor}" stroke="${borda}" stroke-width="5"/>`;
      s += `<rect x="${w * 0.42}" y="12" width="${Math.max(44, w * 0.16)}" height="28" rx="9" fill="${cor}" stroke="${borda}" stroke-width="5"/>`;
      s += `<path d="M${w * 0.42 + 14} 12 V3 H${w * 0.42 + 32}" fill="none" stroke="${borda}" stroke-width="5" stroke-linecap="round"/>`;
      for (let k = 1; k < tam; k++) s += `<circle cx="${k * 100 - 22}" cy="56" r="9" fill="#9ad1ff" stroke="${borda}" stroke-width="3"/>`;
    } else {
      const a = tipo === "porta" ? 16 : 20, b = 100 - a;
      s += `<path d="M10 ${a} H${w - 50} Q${w - 6} ${a + 6} ${w - 4} 50 Q${w - 6} ${b - 6} ${w - 50} ${b} H10 Q3 50 10 ${a} Z" fill="${cor}" stroke="${borda}" stroke-width="5" stroke-linejoin="round"/>`;
      if (tipo === "porta") {
        s += `<path d="M24 50 H${w - 60}" stroke="#fff" stroke-width="5" stroke-dasharray="22 16"/>`;
        s += `<rect x="${w * 0.6}" y="${a + 2}" width="54" height="26" rx="6" fill="#d9e2ec" stroke="${borda}" stroke-width="4"/>`;
        s += `<path d="M${w * 0.25} 58 l14 -6 l-14 -6 l-4 6z M${w * 0.25 - 10} 52 h22" fill="#fff" stroke="#fff" stroke-width="3"/>`;
      } else {
        const cab = Math.max(60, w * 0.26), cx = w * 0.42 - cab / 2;
        s += `<rect x="${cx}" y="${a - 6}" width="${cab}" height="${b - a + 12}" rx="10" fill="#e9eef3" stroke="${borda}" stroke-width="4"/>`;
        s += `<rect x="${cx + cab * 0.25}" y="${a + 6}" width="${cab * 0.5}" height="${b - a - 12}" rx="6" fill="#9ad1ff" stroke="${borda}" stroke-width="3"/>`;
        if (tipo === "des") s += `<rect x="${cx - 26}" y="38" width="20" height="24" rx="4" fill="#3a3a3a"/>`;
        const torres = tipo === "enc" ? [w * 0.72, w * 0.16] : tipo === "cru" ? [w * 0.75] : [];
        torres.forEach(x => {
          s += `<path d="M${x} 50 H${x + 46}" stroke="${borda}" stroke-width="7" stroke-linecap="round"/>`;
          s += `<circle cx="${x}" cy="50" r="15" fill="#e9eef3" stroke="${borda}" stroke-width="4"/>`;
        });
      }
    }
    const conteudo = horiz ? s : `<g transform="translate(100,0) rotate(90)">${s}</g>`;
    const vb = horiz ? `0 0 ${w} 100` : `0 0 100 ${w}`;
    return `<svg viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true">${conteudo}</svg>`;
  }
  const miniNavio = tipo => `<svg viewBox="0 0 ${TIPOS[tipo].tam * 100} 100" aria-hidden="true" style="aspect-ratio:${TIPOS[tipo].tam}">${navioSVG(tipo, TIPOS[tipo].tam, true).replace(/^<svg[^>]*>|<\/svg>$/g, "")}</svg>`;

  const el = (tag, classe, texto) => {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  };
  const botao = (texto, aoClicar, classe = "chip") => {
    const b = el("button", classe, texto);
    b.addEventListener("click", aoClicar);
    return b;
  };

  // ---------- Ajuda ----------
  const G = (linhas, extra = {}) => Ajuda.grade(linhas, {
    "~": { fundo: "#5fb4f0" }, N: { fundo: "#6c7a89" }, x: { fundo: "#6c7a89", txt: "🔥" },
    o: { fundo: "#5fb4f0", txt: "•", cor: "#fff" }, X: { fundo: "#ffb703", txt: "🔥" }, ...extra,
  }, { fundo: "#5fb4f0", borda: "#1d3557" });
  const AJUDA = [
    { figura: G(["NNNNN~", "~~~~~~", "~N~~NN", "~N~~~~", "~N~NN~"]),
      texto: "Cada um esconde a sua frota no mar: porta-aviões (5 casas), encouraçado (4), cruzador (3), submarino (3) e destróier (2). Os navios nunca encostam um no outro." },
    { figura: "🎲", texto: "Os navios já vêm arrumados. Toque em Sortear de novo para mudar, ou em Eu arrumo para escolher o lugar de cada um (o botão Girar deixa o navio em pé ou deitado)." },
    { figura: "👆", texto: "Na sua vez, toque numa casa do mar do outro. Cada casa tem um nome: a letra da linha e o número da coluna, como B5." },
    { figura: G(["~o~", "~x~", "~~~"]), texto: "Não tinha navio? Água! 💦 Tinha um pedaço de navio? Acertou! 🔥" },
    { figura: "💥", texto: "Acertou todas as casas de um navio? Afundou! A voz diz qual navio foi. Em volta dele aparecem pontinhos: ali não pode ter outro navio." },
    { figura: "🎯", texto: "Nas opções você escolhe: quem acerta atira de novo, ou a vez sempre passa para o outro." },
    { figura: "🏆", texto: "Quem afundar todos os navios do outro primeiro ganha!" },
    { figura: "👥", texto: "Com 2 jogadores no mesmo aparelho, a tela esconde o mar na troca de vez: passe o aparelho e só olhe quando for a sua vez." },
  ];

  JOGOS.push({
    id: ID, nome: "Batalha Naval", icone: "🚢",
    faixas: ["6-8", "8-10"],
    ajuda: AJUDA,
    iniciar(area, faixa) { opcoes(area, faixa); },
  });
  CATALOGO[ID] = ["mesa", "Ache os navios: B5, água ou acertou?"];

  function opcoes(area, faixa) {
    const id = faixa && PADRAO[faixa.id] ? faixa.id : "8-10";
    Motor.telaOpcoes(area, {
      opcoes: OPCOES, padrao: PADRAO[id], chave: `naval-opcoes-${id}`,
      antes: Placar.painel(ID, { comZerar: true }),
      aoJogar: op => partida(area, op, faixa),
    });
  }

  // ---------- Partida ----------
  function partida(area, op, faixa) {
    const n = +op.tamanho === 8 ? 8 : 10;
    const tipos = FROTAS[n];
    const contraRobo = op.modo === "robo";
    const extra = op.extra === "sim";
    const nivel = NIVEIS[op.nivel] ? op.nivel : "facil";
    const nomes = contraRobo ? ["Você", "Computador"] : ["Jogador 1", "Jogador 2"];
    const sessao = Motor.sessaoAtual();
    area.innerHTML = "";
    const tela = el("div", "naval-tela");
    area.appendChild(tela);
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const esperar = ms => new Promise(res => setTimeout(res, ms));

    let J, vez, fase, ocupado, acabou, vencedor, quemArruma, manual, horizManual, vendo, passeDepois;
    let layout = "em-pe", blocos = {}, statusEl = null, ultimo = null;
    const eu = () => (contraRobo ? 0 : vez); // de quem é a tela agora

    function comecar() {
      J = [novoJogador(n, nomes[0]), novoJogador(n, nomes[1])];
      vez = 0; ocupado = false; acabou = false; vencedor = null; ultimo = null; vendo = "alvo";
      if (contraRobo) { sortearFrota(J[1], tipos); arrumar(0); } else passe(0, "arrumar");
    }

    // ----- Medidas: escolhe o arranjo que deixa as casas maiores -----
    function medir() {
      const W = tela.clientWidth, H = tela.clientHeight, N = n + 1;
      const nb = fase === "batalha" || fase === "fim" ? 2 : 1;
      const bloco = 46; // título do mar + margens
      let cel, lay;
      if (W < H * 1.05) {
        const baixo = fase === "arrumar" ? 210 : 72;
        lay = "em-pe";
        cel = Math.min((W - 16) / N, (H - 76 - baixo - bloco) / N);
      } else {
        const lado = Math.min((W - 190 - 14 - 16 * nb - 14 * (nb - 1) - (nb === 1 ? 230 : 0)) / (nb * N), (H - bloco) / N);
        const topo = nb === 1 ? 0 : Math.min((W - 16 * nb - 20) / (nb * N), (H - 80 - bloco) / N);
        lay = topo > lado ? "topo" : "lado";
        cel = Math.max(topo, lado);
      }
      return { lay, cel: Math.max(18, Math.min(58, Math.floor(cel))) };
    }

    // ----- Desenho geral da tela -----
    function render() {
      if (!vivo()) return;
      tela.innerHTML = "";
      if (fase === "passe") return desenharPasse();
      const m = medir();
      layout = m.lay;
      tela.className = `naval-tela ${layout} fase-${fase}`;
      tela.style.setProperty("--cel", m.cel + "px");
      tela.style.setProperty("--n", n + 1);
      const lateral = el("div", "naval-lateral");
      const canto = el("div", "naval-canto");
      canto.appendChild(Motor.botaoSom());
      statusEl = el("div", "naval-status");
      const botoes = el("div", "naval-botoes");
      const palco = el("div", "naval-palco");
      lateral.append(canto, statusEl, botoes);
      tela.append(lateral, palco);
      blocos = {};
      if (fase === "arrumar") montarArrumar(palco, botoes);
      else montarBatalha(palco, botoes);
    }

    // ----- Tabuleiro -----
    // modo: "meu" (navios à mostra), "alvo" (só os afundados), "arrumar" (posicionar)
    function tabuleiro(j, modo, titulo, clicavel) {
      const bloco = el("div", `naval-bloco naval-${modo}`);
      const cab = el("div", "naval-cab");
      cab.appendChild(el("span", "naval-titulo", titulo));
      const mini = el("span", "naval-mini");
      cab.appendChild(mini);
      const grade = el("div", "naval-grade");
      grade.appendChild(el("div", "naval-agua"));
      grade.appendChild(el("div", "naval-rot canto-rot"));
      for (let c = 0; c < n; c++) {
        const r = el("div", "naval-rot", String(c + 1));
        r.style.gridArea = `1 / ${c + 2}`;
        grade.appendChild(r);
      }
      for (let r = 0; r < n; r++) {
        const l = el("div", "naval-rot", LETRAS[r]);
        l.style.gridArea = `${r + 2} / 1`;
        grade.appendChild(l);
      }
      const camadaNavios = el("div", "naval-navios");
      grade.appendChild(camadaNavios);
      const cels = [];
      for (let r = 0; r < n; r++) {
        cels.push([]);
        for (let c = 0; c < n; c++) {
          const d = el("div", "naval-cel");
          d.style.gridArea = `${r + 2} / ${c + 2}`;
          d.setAttribute("aria-label", coord(r, c));
          if (clicavel) {
            d.classList.add("clicavel");
            d.addEventListener("click", () => clicavel(r, c, d));
            if (modo === "arrumar") {
              d.addEventListener("mouseenter", () => fantasma(r, c));
              d.addEventListener("focus", () => fantasma(r, c));
            }
          }
          grade.appendChild(d);
          cels[r].push(d);
        }
      }
      bloco.append(cab, grade);
      const tab = { bloco, grade, cels, j, modo, mini, camadaNavios };
      atualizarTab(tab);
      return tab;
    }

    function atualizarTab(tab) {
      const { j, modo, cels, camadaNavios, mini } = tab;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const d = cels[r][c], t = j.tiros[r][c] || "";
        if (d.dataset.t !== t) d.dataset.t = t;
        d.classList.toggle("ultimo", !!ultimo && ultimo.j === j && ultimo.r === r && ultimo.c === c);
      }
      camadaNavios.innerHTML = "";
      j.navios.forEach(v => {
        const mostrar = modo !== "alvo" || v.afundado || acabou;
        if (!mostrar) return;
        const e = el("div", "naval-navio" + (v.afundado ? " afundado" : "") + (modo === "alvo" && !v.afundado ? " revelado" : ""));
        e.style.gridArea = `${v.r + 2} / ${v.c + 2} / span ${v.horiz ? 1 : v.tam} / span ${v.horiz ? v.tam : 1}`;
        e.innerHTML = navioSVG(v.tipo, v.tam, v.horiz);
        camadaNavios.appendChild(e);
      });
      // frota em miniatura (afundados riscados)
      if (modo !== "arrumar") {
        mini.innerHTML = "";
        j.navios.forEach(v => {
          const s = el("span", "naval-mini-navio" + (v.afundado ? " afundado" : ""));
          s.innerHTML = miniNavio(v.tipo);
          s.title = v.nome;
          mini.appendChild(s);
        });
      }
    }

    function setStatus(texto, classe = "") {
      if (!statusEl) return;
      statusEl.textContent = texto;
      statusEl.className = "naval-status " + classe;
    }

    // ----- Arrumar os navios -----
    function arrumar(p) {
      quemArruma = p;
      sortearFrota(J[p], tipos);
      manual = false; horizManual = true;
      fase = "arrumar";
      render();
      Motor.falar(contraRobo ? "Estes são os seus navios! Toque em sortear de novo para mudar, ou em eu arrumo para colocar cada um. Quando estiver bom, toque em pronto!"
        : `${nomes[p]}, estes são os seus navios. Quando estiver bom, toque em pronto!`);
    }

    function montarArrumar(palco, botoes) {
      const j = J[quemArruma];
      const completo = j.navios.length === tipos.length;
      const proximo = completo ? null : tipos[j.navios.length];
      const titulo = contraRobo ? "🚢 Seu mar" : `🚢 Mar do ${nomes[quemArruma]}`;
      const tab = tabuleiro(j, "arrumar", titulo, manual && !completo ? colocarManual : null);
      blocos.meu = tab;
      tab.bloco.classList.add("ativo");
      palco.appendChild(tab.bloco);

      const lista = el("div", "naval-frota");
      tipos.forEach((tipo, i) => {
        const item = el("div", "naval-frota-item" + (manual && i < j.navios.length ? " posto" : "") + (tipo === proximo ? " atual" : ""));
        const fig = el("span", "naval-frota-fig");
        fig.innerHTML = miniNavio(tipo);
        const txt = el("span", "naval-frota-txt");
        txt.append(el("b", "", TIPOS[tipo].nome[0].toUpperCase() + TIPOS[tipo].nome.slice(1)), el("small", "", `${TIPOS[tipo].tam} casas`));
        item.append(fig, txt);
        lista.appendChild(item);
      });
      palco.appendChild(lista);

      if (manual && !completo) {
        setStatus(`👆 Toque onde vai ficar o ${TIPOS[proximo].nome} (${TIPOS[proximo].tam} casas, ${horizManual ? "deitado" : "em pé"}).`, "vez");
        botoes.append(
          botao("🔄 Girar", () => { horizManual = !horizManual; render(); }),
          botao("↩️ Desfazer", desfazer),
        );
      } else if (manual) {
        setStatus("✅ Todos os navios no mar! Toque em Pronto.", "vez");
        botoes.appendChild(botao("↩️ Desfazer", desfazer));
      } else {
        setStatus(contraRobo ? "🚢 Estes são os seus navios. Gostou do lugar?" : `🚢 ${nomes[quemArruma]}: estes são os seus navios (não deixe o outro ver!).`, "vez");
        botoes.appendChild(botao("✋ Eu arrumo", () => { manual = true; j.navios = []; j.mapa = vazio(n, -1); render(); Motor.falar(`Toque onde vai ficar o ${TIPOS[tipos[0]].nome}.`); }));
      }
      botoes.appendChild(botao("🎲 Sortear de novo", () => { manual = false; sortearFrota(j, tipos); Motor.ploc(); render(); }));
      const pronto = botao("✅ Pronto!", prontoArrumar, "chip executar");
      pronto.disabled = !completo;
      botoes.appendChild(pronto);
    }

    function fantasma(r, c) {
      const tab = blocos.meu;
      if (!tab || fase !== "arrumar" || !manual) return;
      const j = J[quemArruma];
      if (j.navios.length >= tipos.length) return;
      const tam = TIPOS[tipos[j.navios.length]].tam;
      let f = tab.grade.querySelector(".naval-fantasma");
      if (!f) { f = el("div", "naval-fantasma"); tab.grade.appendChild(f); }
      const ok = cabe(j.mapa, n, r, c, tam, horizManual);
      f.classList.toggle("ruim", !ok);
      const rs = horizManual ? 1 : Math.min(tam, n - r), cs = horizManual ? Math.min(tam, n - c) : 1;
      f.style.gridArea = `${r + 2} / ${c + 2} / span ${rs} / span ${cs}`;
    }

    function colocarManual(r, c, d) {
      const j = J[quemArruma];
      const tipo = tipos[j.navios.length];
      if (!tipo) return;
      if (!cabe(j.mapa, n, r, c, TIPOS[tipo].tam, horizManual)) {
        Motor.animar(d, "balanca");
        Motor.falar("Aí não cabe! O navio não pode sair do mar nem encostar em outro navio.");
        return;
      }
      colocar(j, tipo, r, c, horizManual);
      Motor.ploc();
      render();
      const prox = tipos[j.navios.length];
      Motor.falar(prox ? `Agora o ${TIPOS[prox].nome}, de ${TIPOS[prox].tam} casas.` : "Pronto! Todos os navios estão no mar.");
    }

    function desfazer() {
      const j = J[quemArruma];
      if (!tirarUltimo(j)) return;
      Motor.ploc();
      render();
    }

    function prontoArrumar() {
      if (J[quemArruma].navios.length !== tipos.length) return;
      if (contraRobo) {
        fase = "batalha"; vez = 0; vendo = "alvo";
        render();
        Motor.falar(`Vamos jogar! Procure os navios do computador: toque numa casa do mar dele.${extra ? " Se acertar, atira de novo!" : ""}`);
      } else if (quemArruma === 0) passe(1, "arrumar");
      else passe(0, "batalha");
    }

    // ----- Tela "passe o aparelho" -----
    function passe(p, depois) {
      fase = "passe";
      vez = depois === "batalha" ? p : vez;
      quemArruma = p;
      passeDepois = depois;
      render();
      Motor.falar(`Passe o aparelho para o ${nomes[p]}!`);
    }
    function desenharPasse() {
      const p = quemArruma, depois = passeDepois;
      tela.className = "naval-tela fase-passe";
      const caixa = el("div", "naval-passe");
      caixa.style.setProperty("--cor", p === 0 ? "#1d7fd1" : "#e63946");
      caixa.appendChild(el("div", "naval-passe-fig", "🙈"));
      caixa.appendChild(el("div", "naval-passe-titulo", `Passe o aparelho para o ${nomes[p]}`));
      caixa.appendChild(el("div", "naval-passe-sub", depois === "arrumar" ? "Hora de arrumar os seus navios. O outro jogador não pode olhar!" : "Sua vez de atirar! Só olhe a tela quando estiver com o aparelho."));
      caixa.appendChild(botao(`👍 Sou o ${nomes[p]}, pronto!`, () => {
        if (depois === "arrumar") arrumar(p);
        else { fase = "batalha"; vez = p; vendo = "alvo"; render(); Motor.falar(`${nomes[p]}, sua vez! Toque numa casa do mar do outro.`); }
      }, "chip executar"));
      tela.appendChild(caixa);
    }

    // ----- Batalha -----
    function montarBatalha(palco, botoes) {
      const meuJ = J[eu()], outroJ = J[1 - eu()];
      const tituloAlvo = contraRobo ? "🎯 Computador" : `🎯 ${nomes[1 - eu()]}`;
      const tituloMeu = contraRobo ? "🚢 Seu mar" : `🚢 ${nomes[eu()]} (você)`;
      blocos.alvo = tabuleiro(outroJ, "alvo", tituloAlvo, fase === "batalha" ? tocar : null);
      blocos.meu = tabuleiro(meuJ, "meu", tituloMeu, null);
      palco.append(blocos.alvo.bloco, blocos.meu.bloco);
      if (layout === "em-pe") {
        const troca = botao("", () => mostrar(vendo === "alvo" ? "meu" : "alvo"), "chip naval-troca");
        blocos.troca = troca;
        botoes.appendChild(troca);
      }
      const placar = el("div", "naval-placar");
      blocos.placar = placar;
      botoes.appendChild(placar);
      // controle da TV: o destaque começa no meio do mar a atacar
      if (fase === "batalha") { const m = Math.floor((n - 1) / 2); blocos.alvo.cels[m][m].classList.add("executar"); }
      mostrar(vendo);
      atualizarPlacar();
      if (fase === "fim") setStatus(textoFim(), "fim");
      else if (ocupado && contraRobo) setStatus("🤖 Vez do computador...", "robo");
      else setStatus(`🎯 ${contraRobo ? "Sua vez" : nomes[vez] + ", sua vez"}! Toque numa casa do mar ${contraRobo ? "do computador" : "do outro"}.`, "vez");
    }

    function mostrar(qual) {
      vendo = qual;
      if (!blocos.alvo) return;
      blocos.alvo.bloco.classList.toggle("ativo", qual === "alvo");
      blocos.meu.bloco.classList.toggle("ativo", qual === "meu");
      if (blocos.troca) blocos.troca.textContent = qual === "alvo" ? "👀 Ver o meu mar" : `🎯 Ver o mar ${contraRobo ? "do computador" : "do outro"}`;
    }

    function atualizarPlacar() {
      if (!blocos.placar) return;
      const a = J[eu()];
      const restam = J[1 - eu()].navios.filter(v => !v.afundado).length;
      blocos.placar.textContent = `🎯 ${a.disparos} tiros · 🔥 ${a.acertos} acertos · 🚢 faltam ${restam}`;
    }

    function atualizarTudo() {
      if (blocos.alvo) atualizarTab(blocos.alvo);
      if (blocos.meu) atualizarTab(blocos.meu);
      atualizarPlacar();
    }

    // Explosão ou espirro d'água na casa
    function efeito(tab, r, c, res) {
      const d = tab && tab.cels[r] && tab.cels[r][c];
      if (d) {
        const f = el("span", res.tipo === "agua" ? "naval-espirro" : "naval-boom", res.tipo === "agua" ? "💦" : "💥");
        d.appendChild(f);
        setTimeout(() => f.remove(), 1100);
        if (res.tipo === "afundou") Motor.animar(tab.grade, "naval-treme");
      }
      if (res.tipo === "agua") {
        Motor.ruido({ dur: 0.45, vol: 0.22, filtro: "bandpass", freq: 1400 });
        Motor.nota(700, { dur: 0.3, tipo: "sine", vol: 0.12, ate: 260 });
      } else {
        Motor.ruido({ dur: 0.6, vol: 0.45, filtro: "lowpass", freq: 700 });
        Motor.nota(160, { dur: 0.5, tipo: "triangle", vol: 0.35, ate: 45 });
        if (res.tipo === "afundou") Motor.nota(90, { dur: 0.9, tipo: "sine", vol: 0.3, ate: 40, inicio: 0.25 });
      }
    }

    function frase(res, r, c, doRobo) {
      const nomeNav = res.navio && res.navio.nome;
      if (res.tipo === "agua") return [`${coord(r, c)}: água! 💦`, `${coordFalada(r, c)}: água!`];
      if (res.tipo === "acertou") {
        if (doRobo) return [`${coord(r, c)}: acertou o seu ${nomeNav}! 🔥`, `${coordFalada(r, c)}: acertou o seu ${nomeNav}!`];
        return [`${coord(r, c)}: acertou! 🔥`, `${coordFalada(r, c)}: acertou!`];
      }
      return [`${coord(r, c)}: afundou o ${doRobo ? "seu " : ""}${nomeNav}! 💥`, `${coordFalada(r, c)}: afundou o ${doRobo ? "seu " : ""}${nomeNav}!`];
    }

    async function tocar(r, c, d) {
      if (fase !== "batalha" || ocupado || acabou) return;
      if (contraRobo && vez !== 0) return;
      if (layout === "em-pe" && vendo !== "alvo") { mostrar("alvo"); return; }
      const def = J[1 - vez], atk = J[vez];
      const t = def.tiros[r][c];
      if (t === "cerca") { Motor.animar(d, "balanca"); Motor.falar("Aí não pode ter navio: os navios nunca encostam um no outro."); return; }
      if (t) { Motor.animar(d, "balanca"); Motor.falar(`Você já atirou em ${coordFalada(r, c)}. Escolha outra casa.`); return; }
      ocupado = true;
      const res = atirar(def, r, c);
      atk.disparos++;
      if (res.tipo !== "agua") atk.acertos++;
      ultimo = { j: def, r, c };
      atualizarTudo();
      efeito(blocos.alvo, r, c, res);
      const [txt, fala] = frase(res, r, c, false);
      setStatus(txt, res.tipo === "agua" ? "agua" : "fogo");
      if (res.tipo === "afundou") Motor.comemorar(d);
      if (res.fim) { await Promise.all([Motor.falar(fala), esperar(900)]); if (vivo()) fim(vez); return; }
      const deNovo = res.tipo !== "agua" && extra;
      await Promise.all([Motor.falar(fala + (deNovo ? " Atire de novo!" : "")), esperar(800)]);
      if (!vivo() || acabou) return;
      if (deNovo) {
        ocupado = false;
        setStatus(`${txt} Atire de novo!`, "fogo");
        return;
      }
      if (contraRobo) { vez = 1; vezDoRobo(); return; }
      await esperar(900);
      if (!vivo()) return;
      ocupado = false;
      passe(1 - vez, "batalha");
    }

    async function vezDoRobo() {
      ocupado = true;
      setStatus("🤖 Vez do computador...", "robo");
      if (layout === "em-pe") mostrar("meu");
      await esperar(900);
      while (vivo() && !acabou) {
        const [r, c] = tiroRobo(J[0], nivel);
        const res = atirar(J[0], r, c);
        J[1].disparos++;
        if (res.tipo !== "agua") J[1].acertos++;
        ultimo = { j: J[0], r, c };
        atualizarTudo();
        efeito(blocos.meu, r, c, res);
        const [txt, fala] = frase(res, r, c, true);
        setStatus(`🤖 ${txt}`, "robo");
        await Promise.all([Motor.falar(`O computador atirou em ${fala}`), esperar(1100)]);
        if (!vivo()) return;
        if (res.fim) { fim(1); return; }
        if (res.tipo === "agua" || !extra) break;
        await esperar(500);
      }
      if (!vivo() || acabou) return;
      await esperar(400);
      if (!vivo()) return;
      vez = 0; ocupado = false;
      if (layout === "em-pe") mostrar("alvo");
      setStatus("🎯 Sua vez! Toque numa casa do mar do computador.", "vez");
      Motor.falar("Sua vez!", { naFila: true });
    }

    function textoFim() {
      if (contraRobo) return vencedor === 0 ? "🏆 Você afundou todos os navios!" : "🤖 O computador afundou todos os seus navios!";
      return `🏆 ${nomes[vencedor]} afundou todos os navios!`;
    }

    function fim(quem) {
      acabou = true; vencedor = quem; ocupado = false;
      fase = "fim";
      vendo = contraRobo ? (quem === 0 ? "alvo" : "meu") : "alvo";
      render();
      const ganhei = !contraRobo || quem === 0;
      Motor.tim();
      if (ganhei && blocos.alvo) Motor.comemorar(blocos.alvo.grade);
      let fala = contraRobo ? (quem === 0 ? "Você ganhou! Afundou todos os navios do computador!" : "O computador ganhou desta vez! Vamos tentar de novo?")
        : `${nomes[quem]} ganhou! Afundou todos os navios!`;
      if (contraRobo) {
        const seq = Placar.resultado(ID, quem === 0 ? { id: "voce", rotulo: "🧒 Você" } : { id: `robo-${nivel}`, rotulo: `🤖 ${NIVEIS[nivel]}` });
        if (seq.novaMelhorSequencia) fala += ` ${seq.sequencia} vitórias seguidas! É o seu recorde!`;
        else if (quem === 0 && seq.sequencia > 1) fala += ` São ${seq.sequencia} vitórias seguidas!`;
      }
      Motor.falar(fala);
      Motor.depois(() => {
        if (!vivo()) return;
        const caixa = el("div", "mesa-fim naval-fim");
        caixa.appendChild(el("div", "titulo-fim", textoFim()));
        const a = J[quem];
        const pct = a.disparos ? Math.round((a.acertos / a.disparos) * 100) : 0;
        caixa.appendChild(el("div", "pontos-fim", `${contraRobo && quem === 1 ? "🤖" : "🎯"} ${a.disparos} tiros · ${pct}% de pontaria`));
        if (contraRobo) caixa.appendChild(Placar.painel(ID));
        const bs = el("div", "mesa-botoes");
        bs.append(botao("🔁 Jogar de novo", comecar, "chip executar"), botao("👀 Ver o mar", () => caixa.remove()), botao("⚙️ Opções", () => opcoes(area, faixa)));
        caixa.appendChild(bs);
        tela.appendChild(caixa);
      }, 1600);
    }

    // Girou o aparelho: desenha de novo
    let espera = null;
    const aoRedimensionar = () => {
      if (!vivo()) { window.removeEventListener("resize", aoRedimensionar); return; }
      clearTimeout(espera);
      espera = setTimeout(() => {
        if (!vivo()) return;
        const temFim = tela.querySelector(".naval-fim");
        if (temFim) return;
        render();
      }, 200);
    };
    window.addEventListener("resize", aoRedimensionar);

    if (window.NAVAL_TESTE) window.NAVAL_TESTE = { estado: () => ({ J, vez, fase, ocupado, acabou, vencedor, layout, vendo }) };
    comecar();
  }

  if (typeof globalThis !== "undefined") globalThis.NavalTeste = { cabe, sortearFrota, atirar, tiroRobo, novoJogador, FROTAS, TIPOS };
})();
