// Lig 4: grade de 7 colunas × 6 linhas; as peças caem até o fundo da coluna escolhida.
// Ganha quem fizer 4 em linha (horizontal, vertical ou diagonal).
// Joga-se tocando na coluna, ou arrastando a peça por cima do tabuleiro e soltando; no
// computador também pelas setas e Enter (ou números 1 a 7).
// Contra o computador (😊 Fácil; 🧠 Médio: minimax profundidade 4; 🦉 Difícil: profundidade 6,
// com poda alfa-beta e colunas do centro primeiro) ou 2 jogadores no mesmo aparelho.
(() => {
  const COLS = 7, LINS = 6;
  const OPCOES = [
    { chave: "modo", titulo: "Jogar contra", valores: [["robo", "🤖 Computador"], ["dois", "👥 2 jogadores"]] },
    { chave: "nivel", titulo: "Computador", valores: [["facil", "😊 Fácil"], ["medio", "🧠 Médio"], ["dificil", "🦉 Difícil"]] },
    { chave: "comeca", titulo: "Quem começa", valores: [["revezar", "🔄 Revezar"], ["eu", "🧒 Sempre você"], ["robo", "🤖 Sempre o outro"]] },
  ];
  const PADRAO = {
    "6-8":  { modo: "robo", nivel: "facil", comeca: "revezar" },
    "8-10": { modo: "robo", nivel: "medio", comeca: "revezar" },
  };
  const NIVEIS = { facil: "😊 Fácil", medio: "🧠 Médio", dificil: "🦉 Difícil" };
  const PROFUNDIDADE = { medio: 4, dificil: 6 };
  const ORDEM = [3, 2, 4, 1, 5, 0, 6]; // centro primeiro: a poda alfa-beta corta mais cedo
  const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]];

  // ---------- Regras e computador (funções puras, testadas em Node) ----------
  // Tabuleiro: array de 42 (linha 0 = topo) com 0 (vazia), 1 (vermelho) ou 2 (amarelo)
  const novo = () => new Array(COLS * LINS).fill(0);
  // Linha onde a peça para na coluna c (-1 se a coluna está cheia)
  function linhaLivre(t, c) {
    for (let r = LINS - 1; r >= 0; r--) if (!t[r * COLS + c]) return r;
    return -1;
  }
  // Sequência de 4 ou mais passando por (r, c): devolve as casas, ou null
  function linhaQuatro(t, r, c) {
    const q = t[r * COLS + c];
    if (!q) return null;
    for (const [dr, dc] of DIRS) {
      const casas = [r * COLS + c];
      for (const s of [1, -1]) {
        let rr = r + dr * s, cc = c + dc * s;
        while (rr >= 0 && rr < LINS && cc >= 0 && cc < COLS && t[rr * COLS + cc] === q) { casas.push(rr * COLS + cc); rr += dr * s; cc += dc * s; }
      }
      if (casas.length >= 4) return casas;
    }
    return null;
  }

  // Todas as janelas de 4 casas em linha (69), para a avaliação
  const JANELAS = [];
  for (let r = 0; r < LINS; r++) for (let c = 0; c < COLS; c++) {
    for (const [dr, dc] of DIRS) {
      const rf = r + 3 * dr, cf = c + 3 * dc;
      if (rf < 0 || rf >= LINS || cf < 0 || cf >= COLS) continue;
      JANELAS.push([0, 1, 2, 3].map(k => (r + k * dr) * COLS + c + k * dc));
    }
  }
  function avaliar(t, eu) {
    const ele = 3 - eu;
    let s = 0;
    for (let r = 0; r < LINS; r++) { const v = t[r * COLS + 3]; if (v === eu) s += 3; else if (v === ele) s -= 3; }
    for (const j of JANELAS) {
      let m = 0, o = 0;
      for (const i of j) { if (t[i] === eu) m++; else if (t[i] === ele) o++; }
      if (m && o) continue;
      if (m === 3) s += 5; else if (m === 2) s += 2;
      if (o === 3) s -= 4; else if (o === 2) s -= 1;
    }
    return s;
  }
  // Negamax com poda alfa-beta. Vitória vale mais quanto mais cedo.
  function negamax(t, vez, prof, alfa, beta) {
    if (prof === 0) return avaliar(t, vez);
    let melhor = -Infinity, jogou = false;
    for (const c of ORDEM) {
      const r = linhaLivre(t, c);
      if (r < 0) continue;
      jogou = true;
      t[r * COLS + c] = vez;
      const v = linhaQuatro(t, r, c) ? 100000 + prof : -negamax(t, 3 - vez, prof - 1, -beta, -alfa);
      t[r * COLS + c] = 0;
      if (v > melhor) melhor = v;
      if (v > alfa) alfa = v;
      if (alfa >= beta) break;
    }
    return jogou ? melhor : 0; // tabuleiro cheio: empate
  }
  const colunasLivres = t => ORDEM.filter(c => linhaLivre(t, c) >= 0);
  // Colunas onde `quem` faz 4 já nesta jogada
  const ganhaEm = (t, quem) => colunasLivres(t).filter(c => { const tt = t.slice(), r = linhaLivre(tt, c); tt[r * COLS + c] = quem; return linhaQuatro(tt, r, c); });

  function escolherJogada(t0, vez, nivel, rnd = Math.random) {
    const t = t0.slice();
    const livresC = colunasLivres(t);
    if (nivel === "facil") {
      const ganhar = ganhaEm(t, vez), bloquear = ganhaEm(t, 3 - vez);
      if (ganhar.length && rnd() < 0.7) return ganhar[0];
      if (bloquear.length && rnd() < 0.45) return bloquear[0];
      // Ao acaso, com preferência pelo meio
      const pesos = livresC.map(c => 4 - Math.abs(3 - c));
      let x = rnd() * pesos.reduce((a, b) => a + b, 0);
      for (let k = 0; k < livresC.length; k++) { x -= pesos[k]; if (x < 0) return livresC[k]; }
      return livresC[0];
    }
    const prof = PROFUNDIDADE[nivel] || 4;
    let melhor = -Infinity, lista = [];
    for (const c of livresC) {
      const r = linhaLivre(t, c);
      t[r * COLS + c] = vez;
      const v = linhaQuatro(t, r, c) ? 1e6 : -negamax(t, 3 - vez, prof - 1, -Infinity, Infinity);
      t[r * COLS + c] = 0;
      if (v > melhor) { melhor = v; lista = [c]; } else if (v === melhor) lista.push(c);
    }
    return lista[Math.floor(rnd() * lista.length)];
  }

  JOGOS.push({
    id: "lig4", teclas: true,
    nome: "Lig 4",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="3" y="10" width="58" height="50" rx="8" fill="#1d4ed8"/><rect x="3" y="54" width="58" height="6" rx="3" fill="#163ca8"/><g fill="#dbeafe"><circle cx="13" cy="20" r="5"/><circle cx="25.5" cy="20" r="5"/><circle cx="38.5" cy="20" r="5"/><circle cx="51" cy="20" r="5"/><circle cx="13" cy="32" r="5"/><circle cx="25.5" cy="32" r="5"/><circle cx="51" cy="32" r="5"/><circle cx="13" cy="44" r="5"/><circle cx="51" cy="44" r="5"/></g><g fill="#e63946" stroke="#fff" stroke-width="1.5"><circle cx="13" cy="44" r="5"/><circle cx="25.5" cy="44" r="5"/><circle cx="38.5" cy="44" r="5"/><circle cx="51" cy="44" r="5"/></g><g fill="#ffd60a"><circle cx="38.5" cy="32" r="5"/><circle cx="25.5" cy="32" r="5"/></g><circle cx="38.5" cy="5.5" r="5" fill="#ffd60a"/></svg>',
    faixas: ["6-8", "8-10"],
    iniciar(area, faixa) { opcoes(area, faixa); },
  });

  function opcoes(area, faixa) {
    const id = (faixa && faixa.id) || "6-8";
    Motor.telaOpcoes(area, {
      opcoes: OPCOES, padrao: PADRAO[id] || PADRAO["6-8"], chave: `lig4-opcoes-${id}`,
      antes: Placar.painel("lig4", { comZerar: true }),
      aoJogar: op => partida(area, op, faixa),
    });
  }

  function partida(area, op, faixa) {
    const contraRobo = op.modo === "robo";
    // 1 = vermelho (você / jogador 1), 2 = amarelo (computador / jogador 2)
    const nome = q => (contraRobo ? (q === 1 ? "🧒 Você" : `🤖 ${NIVEIS[op.nivel]}`) : (q === 1 ? "Vermelho" : "Amarelo"));
    const placar = { 1: 0, 2: 0, empate: 0 };
    let t, vez, acabou, ocupado, rodadas = 0, comecou = 2, coluna = 3, ultima = -1, vence = null;
    let tab, faixaEl, mao, buracos = [], lados = {}, cel = 50, arrastando = false;

    const sessao = Motor.sessaoAtual();
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "lig4-tela";
    area.appendChild(tela);
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const daVez = () => !acabou && !ocupado && (!contraRobo || vez === 1);

    function desenhar() {
      tela.innerHTML = "";
      const larg = tela.clientWidth, alt = tela.clientHeight, deitado = larg > alt;
      tela.classList.toggle("deitado", deitado);

      const info = document.createElement("div");
      info.className = "lig4-info";
      lados = {};
      [1, "empate", 2].forEach(q => {
        const el = document.createElement("div");
        el.className = "lig4-lado";
        el.innerHTML = '<span class="ficha"></span><span class="nome"></span><span class="qt"></span>';
        const f = el.querySelector(".ficha");
        if (q === "empate") f.textContent = "🤝"; else f.classList.add("lig4-peca", "p" + q);
        el.querySelector(".nome").textContent = q === "empate" ? "Empates" : nome(q);
        lados[q] = el;
        info.appendChild(el);
      });
      info.appendChild(Motor.botaoSom());

      cel = Math.floor(deitado ? Math.min((alt - 24) / (LINS + 1), (larg - 270) / COLS) : Math.min((larg - 24) / COLS, (alt - 200) / (LINS + 1), 84));
      tab = document.createElement("div");
      tab.className = "lig4-tab";
      tab.style.setProperty("--cel", cel + "px");
      faixaEl = document.createElement("div");
      faixaEl.className = "lig4-faixa";
      mao = document.createElement("div");
      mao.className = "lig4-peca lig4-mao";
      faixaEl.appendChild(mao);
      const grade = document.createElement("div");
      grade.className = "lig4-grade";
      buracos = [];
      for (let i = 0; i < COLS * LINS; i++) {
        const b = document.createElement("div");
        b.className = "lig4-buraco";
        buracos.push(b);
        grade.appendChild(b);
      }
      tab.append(faixaEl, grade);
      ligarToques();
      tela.append(info, tab);
      atualizar();
    }

    function atualizar() {
      buracos.forEach((b, i) => {
        b.classList.toggle("mira", daVez() && i % COLS === coluna);
        const v = t[i];
        let p = b.firstChild;
        if (!v) { if (p) p.remove(); return; }
        if (!p) { p = document.createElement("div"); b.appendChild(p); }
        p.className = `lig4-peca p${v}` + (vence && vence.includes(i) ? " vence" : "") + (i === ultima && !vence ? " ultima" : "");
      });
      Object.entries(lados).forEach(([q, el]) => {
        el.querySelector(".qt").textContent = placar[q];
        el.classList.toggle("da-vez", !acabou && String(vez) === q);
      });
      mao.className = `lig4-peca lig4-mao p${vez}` + (acabou ? " escondida" : "") + (ocupado && !contraRobo ? " escondida" : "");
      mao.style.left = coluna * cel + "px";
    }

    // ---------- Toque e arraste ----------
    function colunaEm(x) {
      const r = tab.getBoundingClientRect();
      const pad = (r.width - COLS * cel) / 2;
      return Math.max(0, Math.min(COLS - 1, Math.floor((x - r.left - pad) / cel)));
    }
    function mirar(c) {
      if (c === coluna) return;
      coluna = c;
      Motor.nota(700 + c * 30, { dur: 0.03, vol: 0.05 });
      atualizar();
    }
    function ligarToques() {
      tab.addEventListener("pointerdown", e => {
        if (!daVez()) return;
        arrastando = true;
        try { tab.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        mirar(colunaEm(e.clientX));
      });
      tab.addEventListener("pointermove", e => {
        if (arrastando || (e.pointerType === "mouse" && daVez())) mirar(colunaEm(e.clientX));
      });
      tab.addEventListener("pointerup", e => {
        if (!arrastando) return;
        arrastando = false;
        const r = tab.getBoundingClientRect();
        // Soltou bem longe do tabuleiro: desiste
        if (e.clientY < r.top - cel * 1.5 || e.clientY > r.bottom + cel) return;
        soltar(colunaEm(e.clientX));
      });
      tab.addEventListener("pointercancel", () => { arrastando = false; });
    }

    function soltar(c) {
      if (!daVez()) return;
      if (linhaLivre(t, c) < 0) { Motor.animar(mao, "balanca"); Motor.falar("Essa coluna está cheia!"); return; }
      jogar(c);
    }

    // ---------- Jogadas ----------
    function jogar(c) {
      const r = linhaLivre(t, c);
      coluna = c;
      t[r * COLS + c] = vez;
      ultima = r * COLS + c;
      ocupado = true;
      atualizar();
      // Peça cai da faixa de cima até a casa
      const p = buracos[ultima].firstChild;
      const dur = 160 + r * 55;
      if (p && p.animate) {
        p.animate([
          { transform: `translateY(${-(r + 1) * cel - 8}px)` },
          { transform: "translateY(0)", offset: 0.75 },
          { transform: `translateY(${-cel * 0.12}px)`, offset: 0.88 },
          { transform: "translateY(0)" },
        ], { duration: dur / 0.75, easing: "ease-in" });
      }
      Motor.depois(() => Motor.nota(260 - r * 15, { dur: 0.12, tipo: "triangle", vol: 0.3 }), dur);
      Motor.depois(() => depoisDeCair(r, c), dur / 0.75 + 40);
    }

    function depoisDeCair(r, c) {
      ocupado = false;
      const linha = linhaQuatro(t, r, c);
      if (linha) return fim(vez, linha);
      if (!colunasLivres(t).length) return fim(null);
      vez = 3 - vez;
      atualizar();
      if (contraRobo && vez === 2) vezDoRobo();
      else if (!contraRobo) Motor.falar(`Vez do ${vez === 1 ? "vermelho" : "amarelo"}!`);
    }

    // O computador pensa, leva a peça até a coluna e solta
    function vezDoRobo() {
      ocupado = true;
      atualizar();
      setTimeout(() => { // deixa a tela mostrar a vez antes do cálculo
        if (!vivo() || acabou) return;
        const c = escolherJogada(t, 2, op.nivel);
        Motor.depois(() => { coluna = c; atualizar(); }, 300);
        Motor.depois(() => { ocupado = false; if (!acabou) jogar(c); }, 750);
      }, 60);
    }

    function fim(ganhou, linha) {
      acabou = true;
      vence = linha;
      placar[ganhou || "empate"]++;
      atualizar();
      if (ganhou) { Motor.tim(); if (!contraRobo || ganhou === 1) Motor.comemorar(tab); }
      else Motor.nota(330, { dur: 0.3, tipo: "triangle", vol: 0.2 });
      let frase;
      if (!ganhou) frase = "Empate! O tabuleiro encheu.";
      else if (contraRobo) frase = ganhou === 1 ? "Você ganhou! Quatro em linha!" : "O computador ganhou desta vez!";
      else frase = `O ${ganhou === 1 ? "vermelho" : "amarelo"} ganhou!`;
      let fala = frase;
      if (contraRobo) {
        const seq = Placar.resultado("lig4", !ganhou ? null
          : ganhou === 1 ? { id: "voce", rotulo: "🧒 Você" } : { id: `robo-${op.nivel}`, rotulo: `🤖 ${NIVEIS[op.nivel]}` });
        if (seq.novaMelhorSequencia) fala += ` ${seq.sequencia} vitórias seguidas! É o seu recorde!`;
        else if (ganhou === 1 && seq.sequencia > 1) fala += ` São ${seq.sequencia} vitórias seguidas!`;
      }
      Motor.falar(fala);
      Motor.depois(() => {
        if (!vivo()) return;
        const caixa = document.createElement("div");
        caixa.className = "mesa-fim";
        const titulo = document.createElement("div");
        titulo.className = "titulo-fim";
        titulo.textContent = (ganhou ? (contraRobo && ganhou === 2 ? "🤖 " : "🏆 ") : "🤝 ") + frase;
        const detalhe = document.createElement("div");
        detalhe.className = "pontos-fim";
        detalhe.textContent = `🔴 ${placar[1]} × ${placar[2]} 🟡` + (placar.empate ? ` · 🤝 ${placar.empate}` : "");
        caixa.append(titulo, detalhe);
        if (contraRobo) caixa.appendChild(Placar.painel("lig4"));
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
      }, 1800);
    }

    function rodada() {
      rodadas++;
      t = novo();
      acabou = false; ocupado = false; ultima = -1; vence = null; coluna = 3;
      if (op.comeca === "eu") vez = 1;
      else if (op.comeca === "robo") vez = 2;
      else vez = rodadas === 1 ? 1 : 3 - comecou;
      comecou = vez;
      desenhar();
      if (contraRobo && vez === 2) { Motor.falar("O computador começa!"); vezDoRobo(); }
      else if (contraRobo) Motor.falar(rodadas === 1 ? "Faça quatro em linha! Toque numa coluna ou arraste a peça." : "Sua vez de começar!");
      else Motor.falar(`Começa o ${vez === 1 ? "vermelho" : "amarelo"}!`);
    }

    // Teclado do computador: setas escolhem a coluna; Enter, espaço ou seta para baixo soltam
    const aoTeclar = e => {
      if (!vivo()) { document.removeEventListener("keydown", aoTeclar); return; }
      if (!daVez()) return;
      const n = +e.key;
      if (n >= 1 && n <= COLS) { e.preventDefault(); mirar(n - 1); soltar(n - 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); mirar(Math.max(0, coluna - 1)); }
      else if (e.key === "ArrowRight") { e.preventDefault(); mirar(Math.min(COLS - 1, coluna + 1)); }
      else if (["Enter", " ", "ArrowDown"].includes(e.key)) { e.preventDefault(); soltar(coluna); }
    };
    document.addEventListener("keydown", aoTeclar);

    // Girou o celular: desenha de novo
    let espera = null;
    const aoRedimensionar = () => {
      if (!vivo()) { window.removeEventListener("resize", aoRedimensionar); return; }
      clearTimeout(espera);
      espera = setTimeout(() => { if (vivo() && !tela.querySelector(".mesa-fim")) desenhar(); }, 200);
    };
    window.addEventListener("resize", aoRedimensionar);

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.LIG4_TESTE) window.LIG4_TESTE = { estado: () => ({ t: t.slice(), vez, acabou, ocupado, placar }), soltar };

    rodada();
  }

  // Para testes
  if (typeof globalThis !== "undefined") globalThis.Lig4Teste = { novo, linhaLivre, linhaQuatro, escolherJogada, avaliar, COLS, LINS };
})();
