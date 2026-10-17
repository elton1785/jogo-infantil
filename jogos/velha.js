// Jogo da Velha: 3 em linha (horizontal, vertical ou diagonal) ganha.
// Contra o computador (😊 Fácil: joga ao acaso e às vezes bloqueia; 🧠 Médio: ganha e bloqueia,
// mas nem sempre pensa longe; 🦉 Impossível: minimax, nunca perde) ou 2 jogadores no mesmo aparelho.
// Peças ❌ ⭕ ou bichinhos 🐶 🐱. Placar da sessão (rodadas seguidas) e placar geral contra o computador.
(() => {
  const OPCOES = [
    { chave: "modo", titulo: "Jogar contra", valores: [["robo", "🤖 Computador"], ["dois", "👥 2 jogadores"]] },
    { chave: "nivel", quando: op => op.modo !== "dois", titulo: "Computador", valores: [["facil", "😊 Fácil"], ["medio", "🧠 Médio"], ["impossivel", "🦉 Impossível"]] },
    { chave: "pecas", titulo: "Peças", valores: [["xo", "❌ ⭕"], ["bichos", "🐶 🐱"]] },
    { chave: "comeca", regra: true, titulo: "Quem começa", valores: [["revezar", "🔄 Revezar"], ["eu", "🧒 Sempre você"], ["robo", "🤖 Sempre o outro"]] },
  ];
  const PADRAO = {
    "4-5":  { modo: "robo", nivel: "facil", pecas: "bichos", comeca: "revezar" },
    "5-6":  { modo: "robo", nivel: "facil", pecas: "xo", comeca: "revezar" },
    "6-8":  { modo: "robo", nivel: "medio", pecas: "xo", comeca: "revezar" },
    "8-10": { modo: "robo", nivel: "medio", pecas: "xo", comeca: "revezar" },
  };
  const NIVEIS = { facil: "😊 Fácil", medio: "🧠 Médio", impossivel: "🦉 Impossível" };
  const PECAS = {
    // X vermelho e O azul desenhados (os emojis ❌ ⭕ são os dois vermelhos)
    xo: {
      x: "❌", o: "⭕", nx: "do xis", no: "da bolinha",
      desenho: {
        x: '<svg viewBox="0 0 100 100" aria-label="xis"><path d="M24 24L76 76M76 24L24 76" stroke="#e63946" stroke-width="17" stroke-linecap="round"/></svg>',
        o: '<svg viewBox="0 0 100 100" aria-label="bolinha"><circle cx="50" cy="50" r="29" fill="none" stroke="#1d7fd1" stroke-width="16"/></svg>',
      },
    },
    bichos: { x: "🐶", o: "🐱", nx: "do cachorrinho", no: "do gatinho" },
  };
  const LINHAS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

  // ---------- Regras e computador (funções puras, testadas em Node) ----------
  // Tabuleiro: array de 9 com null, "x" ou "o"
  const outro = q => (q === "x" ? "o" : "x");
  function vencedor(t) {
    for (const l of LINHAS) {
      const [a, b, c] = l;
      if (t[a] && t[a] === t[b] && t[a] === t[c]) return { quem: t[a], linha: l };
    }
    return null;
  }
  const livres = t => [...t.keys()].filter(i => !t[i]);

  // Negamax: valor para quem vai jogar (+ ganha, − perde, 0 empate); ganhar cedo vale mais.
  // A profundidade sai do próprio tabuleiro (casas ocupadas), então dá para guardar os valores já calculados.
  const memoria = new Map();
  function negamax(t, vez) {
    const chave = t.map(q => q || "-").join("") + vez;
    if (memoria.has(chave)) return memoria.get(chave);
    let melhor;
    if (vencedor(t)) melhor = -(10 - t.filter(Boolean).length); // quem jogou antes ganhou
    else {
      const ls = livres(t);
      melhor = ls.length ? -Infinity : 0;
      for (const i of ls) {
        t[i] = vez;
        const v = -negamax(t, outro(vez));
        t[i] = null;
        if (v > melhor) melhor = v;
      }
    }
    memoria.set(chave, melhor);
    return melhor;
  }
  function melhoresJogadas(t, vez) {
    const tt = t.slice();
    let melhor = -Infinity, lista = [];
    for (const i of livres(tt)) {
      tt[i] = vez;
      const v = -negamax(tt, outro(vez));
      tt[i] = null;
      if (v > melhor) { melhor = v; lista = [i]; } else if (v === melhor) lista.push(i);
    }
    return lista;
  }
  // Casas que completam 3 em linha para `quem`
  const ganhaEm = (t, quem) => livres(t).filter(i => { const tt = t.slice(); tt[i] = quem; return vencedor(tt); });
  const sortear = (l, rnd) => l[Math.floor(rnd() * l.length)];

  function escolherJogada(t, vez, nivel, rnd = Math.random) {
    const ls = livres(t);
    const ganhar = ganhaEm(t, vez), bloquear = ganhaEm(t, outro(vez));
    if (nivel === "impossivel") return sortear(melhoresJogadas(t, vez), rnd);
    if (nivel === "medio") {
      if (ganhar.length) return sortear(ganhar, rnd);
      if (bloquear.length) return sortear(bloquear, rnd);
      return rnd() < 0.55 ? sortear(melhoresJogadas(t, vez), rnd) : sortear(ls, rnd);
    }
    // Fácil: quase sempre ao acaso; às vezes ganha ou bloqueia
    if (ganhar.length && rnd() < 0.5) return sortear(ganhar, rnd);
    if (bloquear.length && rnd() < 0.4) return sortear(bloquear, rnd);
    return sortear(ls, rnd);
  }

  JOGOS.push({
    id: "velha",
    nome: "Jogo da Velha",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#fffdf6"/><path d="M23 7V57M41 7V57M7 23H57M7 41H57" stroke="#5a6b7d" stroke-width="4" stroke-linecap="round"/><path d="M8.5 8.5 L17.5 17.5 M17.5 8.5 L8.5 17.5 M27.5 27.5 L36.5 36.5 M36.5 27.5 L27.5 36.5 M45.5 45.5 L54.5 54.5 M54.5 45.5 L45.5 54.5" stroke="#e63946" stroke-width="4.5" stroke-linecap="round"/><circle cx="50" cy="14" r="5.5" fill="none" stroke="#1d7fd1" stroke-width="4"/><circle cx="14" cy="50" r="5.5" fill="none" stroke="#1d7fd1" stroke-width="4"/><path d="M8 8 L56 56" stroke="#ffd60a" stroke-width="3" stroke-linecap="round" opacity=".75"/></svg>',
    faixas: ["4-5", "5-6", "6-8", "8-10"],
    iniciar(area, faixa) { opcoes(area, faixa); },
  });

  function opcoes(area, faixa) {
    const id = (faixa && faixa.id) || "6-8";
    Motor.telaOpcoes(area, {
      opcoes: OPCOES, padrao: PADRAO[id] || PADRAO["6-8"], chave: `velha-opcoes-${id}`,
      antes: Placar.painel("velha", { comZerar: true }),
      aoJogar: op => partida(area, op, faixa),
    });
  }

  function partida(area, op, faixa) {
    const contraRobo = op.modo === "robo";
    const P = PECAS[op.pecas] || PECAS.xo;
    // "x" é sempre você (ou o jogador 1); "o" é o computador (ou o jogador 2)
    const nome = q => (contraRobo ? (q === "x" ? "🧒 Você" : `🤖 ${NIVEIS[op.nivel]}`) : (q === "x" ? "Jogador 1" : "Jogador 2"));
    const placar = { x: 0, o: 0, empate: 0 };
    let t, vez, acabou, ocupado, rodadas = 0, ultimaJogada = -1, comecou = "o";
    let casas = [], tab, lados = {};

    const sessao = Motor.sessaoAtual();
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "velha-tela";
    area.appendChild(tela);
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const daVez = () => !acabou && !ocupado && (!contraRobo || vez === "x");

    function desenhar() {
      tela.innerHTML = "";
      const larg = tela.clientWidth, alt = tela.clientHeight, deitado = larg > alt;
      tela.classList.toggle("deitado", deitado);

      const info = document.createElement("div");
      info.className = "velha-info";
      lados = {};
      ["x", "empate", "o"].forEach(q => {
        const el = document.createElement("div");
        el.className = "velha-lado";
        el.innerHTML = '<span class="peca"></span><span class="nome"></span><span class="qt"></span>';
        pintarPeca(el.querySelector(".peca"), q === "empate" ? null : q);
        el.querySelector(".nome").textContent = q === "empate" ? "Empates" : nome(q);
        lados[q] = el;
        info.appendChild(el);
      });
      info.appendChild(Motor.botaoSom());

      const lado = Math.floor(deitado ? Math.min(alt - 16, larg - 260) : Math.min(larg - 16, alt - 230, 520));
      tab = document.createElement("div");
      tab.className = "velha-tabuleiro";
      Object.assign(tab.style, { width: lado + "px", height: lado + "px", fontSize: lado / 3 * 0.6 + "px" });
      casas = [];
      for (let i = 0; i < 9; i++) {
        const b = document.createElement("button");
        b.className = "velha-casa";
        b.addEventListener("click", () => tocar(i));
        casas.push(b);
        tab.appendChild(b);
      }
      tela.append(info, tab);
      atualizar();
    }

    // Desenho da peça (ou emoji); null = vazia ("🤝" no placar de empates)
    function pintarPeca(el, q) {
      if (el.dataset.q === String(q)) return;
      el.dataset.q = String(q);
      if (!q) el.textContent = el.classList.contains("peca") ? "🤝" : "";
      else if (P.desenho) el.innerHTML = P.desenho[q];
      else el.textContent = P[q];
    }

    function miniPeca(q) {
      const s = document.createElement("span");
      s.className = "velha-mini";
      pintarPeca(s, q);
      return s;
    }

    function atualizar() {
      const v = vencedor(t);
      casas.forEach((b, i) => {
        pintarPeca(b, t[i]);
        b.className = "velha-casa" + (t[i] ? " " + t[i] : "") + (i === ultimaJogada ? " nova" : "")
          + (v && v.linha.includes(i) ? " vence" : "") + (!t[i] && daVez() ? " livre" : "");
      });
      Object.entries(lados).forEach(([q, el]) => {
        el.querySelector(".qt").textContent = placar[q];
        el.classList.toggle("da-vez", !acabou && q === vez);
      });
      tab.querySelector(".velha-risco")?.remove();
      if (v) riscar(v.linha);
    }

    // Risco animado sobre a linha vencedora
    function riscar(linha) {
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 3 3");
      svg.classList.add("velha-risco");
      const centro = i => [i % 3 + 0.5, Math.floor(i / 3) + 0.5];
      const [x1, y1] = centro(linha[0]), [x2, y2] = centro(linha[2]);
      const dx = (x2 - x1) * 0.18, dy = (y2 - y1) * 0.18; // passa um pouco das pontas
      const l = document.createElementNS(ns, "line");
      Object.entries({ x1: x1 - dx, y1: y1 - dy, x2: x2 + dx, y2: y2 + dy }).forEach(([k, v]) => l.setAttribute(k, v));
      l.setAttribute("pathLength", "1");
      svg.appendChild(l);
      tab.appendChild(svg);
    }

    function tocar(i) {
      if (!daVez()) return;
      if (t[i]) { Motor.animar(casas[i], "balanca"); return; }
      jogar(i);
    }

    function jogar(i) {
      t[i] = vez;
      ultimaJogada = i;
      Motor.nota(vez === "x" ? 520 : 390, { dur: 0.15, tipo: "triangle", vol: 0.25 });
      const v = vencedor(t);
      if (v || !livres(t).length) return fim(v);
      vez = outro(vez);
      atualizar();
      if (contraRobo && vez === "o") vezDoRobo();
      else if (!contraRobo) Motor.falar(`Vez ${vez === "x" ? P.nx : P.no}!`);
    }

    function vezDoRobo() {
      ocupado = true;
      atualizar();
      Motor.depois(() => {
        ocupado = false;
        if (acabou) return;
        jogar(escolherJogada(t, "o", op.nivel));
      }, 650);
    }

    function fim(v) {
      acabou = true;
      const ganhou = v ? v.quem : null;
      placar[ganhou || "empate"]++;
      atualizar();
      if (v) { Motor.tim(); if (!contraRobo || ganhou === "x") Motor.comemorar(tab); }
      else Motor.nota(330, { dur: 0.3, tipo: "triangle", vol: 0.2 });
      let frase;
      if (!ganhou) frase = "Deu velha! Empate!";
      else if (contraRobo) frase = ganhou === "x" ? "Você ganhou!" : "O computador ganhou desta vez!";
      else frase = `${P[ganhou] === "❌" ? "O xis" : P[ganhou] === "⭕" ? "A bolinha" : ganhou === "x" ? "O cachorrinho" : "O gatinho"} ganhou!`;
      let fala = frase;
      if (contraRobo) {
        const seq = Placar.resultado("velha", !ganhou ? null
          : ganhou === "x" ? { id: "voce", rotulo: "🧒 Você" } : { id: `robo-${op.nivel}`, rotulo: `🤖 ${NIVEIS[op.nivel]}` });
        if (seq.novaMelhorSequencia) fala += ` ${seq.sequencia} vitórias seguidas! É o seu recorde!`;
        else if (ganhou === "x" && seq.sequencia > 1) fala += ` São ${seq.sequencia} vitórias seguidas!`;
      }
      Motor.falar(fala);
      Motor.depois(() => {
        if (!vivo()) return;
        const caixa = document.createElement("div");
        caixa.className = "mesa-fim";
        const titulo = document.createElement("div");
        titulo.className = "titulo-fim";
        titulo.textContent = (ganhou ? (contraRobo && ganhou === "o" ? "🤖 " : "🏆 ") : "🤝 ") + frase;
        const detalhe = document.createElement("div");
        detalhe.className = "pontos-fim";
        detalhe.append(miniPeca("x"), ` ${placar.x} × ${placar.o} `, miniPeca("o"), placar.empate ? ` · 🤝 ${placar.empate}` : "");
        caixa.append(titulo, detalhe);
        if (contraRobo) caixa.appendChild(Placar.painel("velha"));
        const botoes = document.createElement("div");
        botoes.className = "mesa-botoes";
        const denovo = document.createElement("button");
        denovo.className = "chip executar";
        denovo.textContent = "🔁 Jogar de novo";
        denovo.addEventListener("click", rodada);
        const opc = document.createElement("button");
        opc.className = "chip";
        opc.textContent = "⚙️ Opções";
        opc.addEventListener("click", () => opcoes(area, faixa));
        botoes.append(denovo, opc);
        caixa.appendChild(botoes);
        tela.appendChild(caixa);
      }, 1500);
    }

    function rodada() {
      rodadas++;
      t = Array(9).fill(null);
      acabou = false; ocupado = false; ultimaJogada = -1;
      if (op.comeca === "eu") vez = "x";
      else if (op.comeca === "robo") vez = "o";
      else vez = rodadas === 1 ? "x" : outro(comecou);
      comecou = vez;
      desenhar();
      if (contraRobo && vez === "o") { Motor.falar("O computador começa!"); vezDoRobo(); }
      else if (contraRobo) Motor.falar(rodadas === 1 ? "Você começa! Faça três em linha." : "Sua vez de começar!");
      else Motor.falar(`Começa a vez ${vez === "x" ? P.nx : P.no}!`);
    }

    // Girou o celular: desenha de novo
    let espera = null;
    const aoRedimensionar = () => {
      if (!vivo()) { window.removeEventListener("resize", aoRedimensionar); return; }
      clearTimeout(espera);
      espera = setTimeout(() => { if (vivo() && !acabou) desenhar(); }, 200);
    };
    window.addEventListener("resize", aoRedimensionar);

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.VELHA_TESTE) window.VELHA_TESTE = { estado: () => ({ t, vez, acabou, placar, ocupado }) };

    rodada();
  }

  // Para testes
  if (typeof globalThis !== "undefined") globalThis.VelhaTeste = { vencedor, melhoresJogadas, escolherJogada, LINHAS };
})();
