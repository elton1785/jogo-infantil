// Trilha (moinho): tabuleiro de 3 quadrados com 24 pontos e 9 peças para cada jogador.
// - Colocar: cada um coloca uma peça por vez num ponto livre.
// - Mover: depois de colocar as 9, anda uma peça para um ponto vizinho livre (pelas linhas).
// - Voar (opcional): quem fica com 3 peças pode levar uma peça para qualquer ponto livre.
// - Fez trilha (3 peças na mesma linha)? Tira uma peça do adversário — mas não de uma trilha
//   formada, a não ser que todas as peças dele estejam em trilha.
// - Perde quem ficar com 2 peças ou sem jogada. Muitas jogadas sem ninguém tirar peça: empate.
// Contra o computador (😊 Fácil, 🧠 Médio, 🦉 Difícil: minimax raso) ou 2 jogadores no mesmo aparelho.
(() => {
  // Pontos (x, y) numa grade 7 × 7
  const PONTOS = [
    [0, 0], [3, 0], [6, 0],
    [1, 1], [3, 1], [5, 1],
    [2, 2], [3, 2], [4, 2],
    [0, 3], [1, 3], [2, 3], [4, 3], [5, 3], [6, 3],
    [2, 4], [3, 4], [4, 4],
    [1, 5], [3, 5], [5, 5],
    [0, 6], [3, 6], [6, 6],
  ];
  const TRILHAS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23],
    [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7], [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23],
  ];
  const VIZ = PONTOS.map(() => []);
  TRILHAS.forEach(([a, b, c]) => { VIZ[a].push(b); VIZ[b].push(a, c); VIZ[c].push(b); });
  const DO_PONTO = PONTOS.map((_, i) => TRILHAS.filter(l => l.includes(i)));
  const LIMITE_EMPATE = 60; // meias-jogadas seguidas na fase de mover sem ninguém tirar peça

  // ---------- Regras (funções puras) ----------
  // Estado: { t: [24 × null|0|1], mao: [n0, n1] }
  const outro = p => 1 - p;
  const conta = (t, p) => t.reduce((s, q) => s + (q === p ? 1 : 0), 0);
  const emTrilha = (t, i) => t[i] !== null && DO_PONTO[i].some(l => l.every(k => t[k] === t[i]));
  function fase(e, p, voo) {
    if (e.mao[p] > 0) return "colocar";
    return voo && conta(e.t, p) === 3 ? "voar" : "mover";
  }
  // Peças do adversário de `p` que podem ser tiradas
  function tiraveis(t, p) {
    const delas = [...t.keys()].filter(i => t[i] === outro(p));
    const livres = delas.filter(i => !emTrilha(t, i));
    return livres.length ? livres : delas;
  }
  // Jogadas sem a parte de tirar: { de: -1 | ponto, para }
  function jogadasBase(e, p, voo) {
    const f = fase(e, p, voo), res = [];
    const vazios = [...e.t.keys()].filter(i => e.t[i] === null);
    if (f === "colocar") vazios.forEach(i => res.push({ de: -1, para: i }));
    else e.t.forEach((q, i) => {
      if (q !== p) return;
      (f === "voar" ? vazios : VIZ[i].filter(k => e.t[k] === null)).forEach(k => res.push({ de: i, para: k }));
    });
    return res;
  }
  function aplicarBase(e, j, p) {
    const t = e.t.slice(), mao = e.mao.slice();
    if (j.de === -1) mao[p]--; else t[j.de] = null;
    t[j.para] = p;
    return { t, mao };
  }
  // Jogadas completas: { de, para, tira } (tira = -1 se não fez trilha)
  function jogadas(e, p, voo) {
    const res = [];
    jogadasBase(e, p, voo).forEach(j => {
      const n = aplicarBase(e, j, p);
      if (emTrilha(n.t, j.para)) {
        const tv = tiraveis(n.t, p);
        if (tv.length) { tv.forEach(k => res.push({ ...j, tira: k })); return; }
      }
      res.push({ ...j, tira: -1 });
    });
    return res;
  }
  function aplicar(e, j, p) {
    const n = aplicarBase(e, j, p);
    if (j.tira >= 0) n.t[j.tira] = null;
    return n;
  }
  // Perdeu? (na vez de `p`): menos de 3 peças (contando as da mão) ou sem jogada
  function perdeu(e, p, voo) {
    if (conta(e.t, p) + e.mao[p] < 3) return true;
    return !jogadasBase(e, p, voo).length;
  }

  // ---------- Computador ----------
  // Busca rápida (negamax com poda alfa-beta), mexendo num tabuleiro só e desfazendo cada jogada.
  // Tabuleiro da busca: -1 vazio, 0 ou 1.
  function avaliarR(t, mao, cnt, p, voo) {
    const q = 1 - p;
    let v = 12 * (cnt[p] + mao[p] - cnt[q] - mao[q]);
    for (const l of TRILHAS) {
      let a = 0, b = 0;
      for (const k of l) { if (t[k] === p) a++; else if (t[k] === q) b++; }
      if (a === 3) v += 3; else if (b === 3) v -= 3;
      else if (a === 2 && b === 0) v += 2.2; else if (b === 2 && a === 0) v -= 2.6;
    }
    if (!mao[p] && !mao[q]) v += 0.35 * (mobilidade(t, p, cnt, voo) - mobilidade(t, q, cnt, voo));
    for (const k of [4, 10, 13, 19]) { if (t[k] === p) v += 0.4; else if (t[k] === q) v -= 0.4; }
    return v;
  }
  function mobilidade(t, p, cnt, voo) {
    if (voo && cnt[p] === 3) return 6;
    let n = 0;
    for (let i = 0; i < 24; i++) if (t[i] === p) for (const k of VIZ[i]) if (t[k] === -1) n++;
    return n;
  }
  const formaTrilhaR = (t, i, p) => DO_PONTO[i].some(l => t[l[0]] === p && t[l[1]] === p && t[l[2]] === p);
  function tiraveisR(t, p) {
    const q = 1 - p, livres = [], todas = [];
    for (let i = 0; i < 24; i++) if (t[i] === q) { todas.push(i); if (!formaTrilhaR(t, i, q)) livres.push(i); }
    return livres.length ? livres : todas;
  }
  // Jogadas base na busca: lista de [de, para]
  function baseR(t, mao, cnt, p, voo) {
    const r = [];
    if (mao[p] > 0) { for (let i = 0; i < 24; i++) if (t[i] === -1) r.push([-1, i]); return r; }
    const voa = voo && cnt[p] === 3;
    for (let i = 0; i < 24; i++) {
      if (t[i] !== p) continue;
      if (voa) { for (let k = 0; k < 24; k++) if (t[k] === -1) r.push([i, k]); }
      else for (const k of VIZ[i]) if (t[k] === -1) r.push([i, k]);
    }
    return r;
  }
  let nos = 0;
  function negamaxR(t, mao, cnt, p, prof, alfa, beta, voo) {
    nos++;
    if (cnt[p] + mao[p] < 3) return -1000 - prof;
    const bs = baseR(t, mao, cnt, p, voo);
    if (!bs.length) return -1000 - prof;
    if (prof === 0) return avaliarR(t, mao, cnt, p, voo);
    const q = 1 - p;
    let melhor = -Infinity;
    // jogadas que fazem trilha primeiro (cortam mais na poda)
    const ordem = [], resto = [];
    for (const b of bs) {
      if (b[0] >= 0) t[b[0]] = -1;
      t[b[1]] = p;
      (formaTrilhaR(t, b[1], p) ? ordem : resto).push(b);
      t[b[1]] = -1;
      if (b[0] >= 0) t[b[0]] = p;
    }
    for (const [de, para] of ordem.concat(resto)) {
      if (de >= 0) t[de] = -1; else { mao[p]--; cnt[p]++; }
      t[para] = p;
      let tv = formaTrilhaR(t, para, p) ? tiraveisR(t, p) : [];
      if (!tv.length) tv = [-1];
      for (const k of tv) {
        if (k >= 0) { t[k] = -1; cnt[q]--; }
        const v = -negamaxR(t, mao, cnt, q, prof - 1, -beta, -alfa, voo);
        if (k >= 0) { t[k] = q; cnt[q]++; }
        if (v > melhor) melhor = v;
        if (v > alfa) alfa = v;
        if (alfa >= beta) break;
      }
      t[para] = -1;
      if (de >= 0) t[de] = p; else { mao[p]++; cnt[p]--; }
      if (alfa >= beta) break;
    }
    return melhor;
  }
  const PROF = { facil: 1, medio: 2, dificil: 3 };
  function escolherJogada(e, p, nivel, voo, rnd = Math.random) {
    const js = jogadas(e, p, voo);
    const sorte = l => l[Math.floor(rnd() * l.length)];
    if (nivel === "facil" && rnd() < 0.55) {
      const trilha = js.filter(j => j.tira >= 0);
      return trilha.length && rnd() < 0.6 ? sorte(trilha) : sorte(js);
    }
    let prof = PROF[nivel] || 2;
    if (nivel === "dificil" && js.length <= 12) prof = 4; // poucas jogadas: pensa mais longe
    const t = e.t.map(x => (x === null ? -1 : x)), mao = e.mao.slice();
    const cnt = [0, 1].map(k => t.filter(x => x === k).length);
    const q = 1 - p;
    let melhorV = -Infinity, melhor = null;
    const lista = js.slice().sort(() => rnd() - 0.5).sort((a, b) => (b.tira >= 0) - (a.tira >= 0));
    for (const j of lista) {
      if (j.de >= 0) t[j.de] = -1; else { mao[p]--; cnt[p]++; }
      t[j.para] = p;
      if (j.tira >= 0) { t[j.tira] = -1; cnt[q]--; }
      const v = -negamaxR(t, mao, cnt, q, prof - 1, -Infinity, -melhorV + 0.25, voo) + rnd() * 0.25;
      if (j.tira >= 0) { t[j.tira] = q; cnt[q]++; }
      t[j.para] = -1;
      if (j.de >= 0) t[j.de] = p; else { mao[p]++; cnt[p]--; }
      if (v > melhorV) { melhorV = v; melhor = j; }
    }
    return melhor || sorte(js);
  }

  // ---------- Desenhos ----------
  const PCT = v => 7 + v * (86 / 6); // coordenada da grade → % do tabuleiro
  const CORES = {
    coloridas: [{ nome: "Vermelhas", cor: "#e63946", escura: "#8f1d27", brilho: "#ff9aa2" }, { nome: "Azuis", cor: "#1d7fd1", escura: "#0e4677", brilho: "#9fd0ff" }],
    classicas: [{ nome: "Claras", cor: "#f5ead2", escura: "#a68a5b", brilho: "#ffffff" }, { nome: "Escuras", cor: "#3b2a20", escura: "#120b07", brilho: "#8a6a55" }],
  };
  function linhasSVG(cor = "#4a2c12", larg = 1.7) {
    const p = i => `${PCT(PONTOS[i][0])},${PCT(PONTOS[i][1])}`;
    let s = "";
    [[0, 2, 23, 21], [3, 5, 20, 18], [6, 8, 17, 15]].forEach(q => { s += `<polygon points="${q.map(p).join(" ")}" fill="none" stroke="${cor}" stroke-width="${larg}" stroke-linejoin="round"/>`; });
    [[1, 7], [16, 22], [9, 11], [12, 14]].forEach(([a, b]) => { s += `<line x1="${PCT(PONTOS[a][0])}" y1="${PCT(PONTOS[a][1])}" x2="${PCT(PONTOS[b][0])}" y2="${PCT(PONTOS[b][1])}" stroke="${cor}" stroke-width="${larg}" stroke-linecap="round"/>`; });
    return s;
  }
  // Tabuleiro pequeno para as explicações: `pecas` = { ponto: "v" | "a" }, `linha`: trilha destacada,
  // `seta`: [de, para]
  function miniSVG({ pecas = {}, linha, seta, x = {} } = {}, largura = 120) {
    let s = `<svg viewBox="0 0 100 100" style="width:${largura}px" aria-hidden="true"><rect x="1" y="1" width="98" height="98" rx="9" fill="#d9a066" stroke="#8b5a2b" stroke-width="2"/>${linhasSVG("#5a3415", 1.6)}`;
    PONTOS.forEach(([a, b]) => { s += `<circle cx="${PCT(a)}" cy="${PCT(b)}" r="2.2" fill="#5a3415"/>`; });
    if (linha) s += `<line x1="${PCT(PONTOS[linha[0]][0])}" y1="${PCT(PONTOS[linha[0]][1])}" x2="${PCT(PONTOS[linha[2]][0])}" y2="${PCT(PONTOS[linha[2]][1])}" stroke="#ffd60a" stroke-width="7" stroke-linecap="round" opacity=".9"/>`;
    Object.entries(pecas).forEach(([i, c]) => {
      const [a, b] = PONTOS[i], cor = c === "v" ? "#e63946" : "#1d7fd1";
      s += `<circle cx="${PCT(a)}" cy="${PCT(b)}" r="6.3" fill="${cor}" stroke="#fff" stroke-width="1.5"/>`;
    });
    Object.keys(x).forEach(i => { const [a, b] = PONTOS[i]; s += `<path d="M${PCT(a) - 5} ${PCT(b) - 5}L${PCT(a) + 5} ${PCT(b) + 5}M${PCT(a) + 5} ${PCT(b) - 5}L${PCT(a) - 5} ${PCT(b) + 5}" stroke="#222" stroke-width="2.6" stroke-linecap="round"/>`; });
    if (seta) {
      const [a, b] = PONTOS[seta[0]], [c, d] = PONTOS[seta[1]];
      s += `<line x1="${PCT(a)}" y1="${PCT(b)}" x2="${PCT(c)}" y2="${PCT(d)}" stroke="#2a9d55" stroke-width="3" stroke-dasharray="4 3"/><circle cx="${PCT(c)}" cy="${PCT(d)}" r="5" fill="none" stroke="#2a9d55" stroke-width="2.5"/>`;
    }
    return s + "</svg>";
  }

  // ---------- Opções ----------
  const OPCOES = [
    { chave: "modo", titulo: "Jogar contra", valores: [["robo", "🤖 Computador"], ["dois", "👥 2 jogadores"]] },
    { chave: "nivel", titulo: "Computador", valores: [["facil", "😊 Fácil"], ["medio", "🧠 Médio"], ["dificil", "🦉 Difícil"]] },
    { chave: "voo", titulo: "Com 3 peças", valores: [["sim", "🦋 Pode voar"], ["nao", "🚶 Só anda"]] },
    { chave: "comeca", titulo: "Quem começa", valores: [["revezar", "🔄 Revezar"], ["eu", "🧒 Sempre você"], ["robo", "🤖 Sempre o outro"]] },
    { chave: "pecas", titulo: "Peças", valores: [["coloridas", "🔴 🔵 Coloridas"], ["classicas", "⚪ ⚫ Clássicas"]] },
    { chave: "dicas", titulo: "Mostrar jogadas", valores: [["sim", "💡 Sim"], ["nao", "🙈 Não"]] },
  ];
  const PADRAO = {
    "6-8":  { modo: "robo", nivel: "facil", voo: "sim", comeca: "revezar", pecas: "coloridas", dicas: "sim" },
    "8-10": { modo: "robo", nivel: "medio", voo: "sim", comeca: "revezar", pecas: "coloridas", dicas: "sim" },
  };
  const NIVEIS = { facil: "😊 Fácil", medio: "🧠 Médio", dificil: "🦉 Difícil" };

  JOGOS.push({
    id: "trilha",
    nome: "Trilha",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="10" fill="#d9a066" stroke="#8b5a2b" stroke-width="3"/><g fill="none" stroke="#5a3415" stroke-width="2.6"><rect x="9" y="9" width="46" height="46"/><rect x="18" y="18" width="28" height="28"/><rect x="26" y="26" width="12" height="12"/><path d="M32 9V26M32 38V55M9 32H26M38 32H55"/></g><path d="M9 9H55" stroke="#ffd60a" stroke-width="6" stroke-linecap="round" opacity=".85"/><circle cx="9" cy="9" r="5.5" fill="#e63946" stroke="#fff" stroke-width="1.5"/><circle cx="32" cy="9" r="5.5" fill="#e63946" stroke="#fff" stroke-width="1.5"/><circle cx="55" cy="9" r="5.5" fill="#e63946" stroke="#fff" stroke-width="1.5"/><circle cx="18" cy="46" r="5.5" fill="#1d7fd1" stroke="#fff" stroke-width="1.5"/><circle cx="46" cy="32" r="5.5" fill="#1d7fd1" stroke="#fff" stroke-width="1.5"/><circle cx="32" cy="55" r="5.5" fill="#1d7fd1" stroke="#fff" stroke-width="1.5"/></svg>',
    faixas: ["6-8", "8-10"],
    ajuda: [
      { figura: miniSVG({ pecas: { 0: "v", 4: "a", 10: "v", 19: "a" } }), texto: "Cada um tem 9 peças. Primeiro, um de cada vez coloca uma peça num ponto livre do tabuleiro." },
      { figura: miniSVG({ pecas: { 0: "v", 1: "v", 2: "v", 13: "a", 19: "a" }, linha: [0, 1, 2] }), texto: "Três peças suas na mesma linha formam uma trilha! Aí você tira uma peça do adversário (que não esteja numa trilha dele)." },
      { figura: miniSVG({ pecas: { 9: "v", 4: "a", 21: "v" }, seta: [9, 10] }), texto: "Depois de colocar as 9 peças, cada um anda uma peça por vez para um ponto vizinho livre, seguindo as linhas. Abrir e fechar a trilha faz uma trilha nova!" },
      { figura: miniSVG({ pecas: { 0: "v", 16: "v", 23: "v", 4: "a", 12: "a" }, seta: [23, 6] }), texto: "Quem fica com só 3 peças pode voar: leva uma peça para qualquer ponto livre (dá para desligar nas opções)." },
      { figura: miniSVG({ pecas: { 0: "v", 1: "v", 22: "a", 19: "a" } }), texto: "Perde quem ficar com só 2 peças ou sem nenhuma jogada. Toque numa peça e depois no ponto para onde ela vai." },
    ],
    iniciar(area, faixa) { opcoes(area, faixa); },
  });
  CATALOGO["trilha"] = ["mesa", "Faça trilhas de 3 e tire peças"];

  function opcoes(area, faixa) {
    const id = (faixa && faixa.id) || "6-8";
    Motor.telaOpcoes(area, {
      opcoes: OPCOES, padrao: PADRAO[id] || PADRAO["6-8"], chave: `trilha-opcoes-${id}`,
      antes: Placar.painel("trilha", { comZerar: true }),
      aoJogar: op => partida(area, op, faixa, 1),
    });
  }

  // ---------- Uma partida ----------
  let quemComecou = 1;
  function partida(area, op, faixa, rodada) {
    const teste = window.TRILHA_TESTE || null;
    const VEL = teste && teste.rapido ? 0.06 : 1;
    const contraRobo = op.modo === "robo";
    const voo = op.voo === "sim";
    const dicas = op.dicas === "sim";
    const C = CORES[op.pecas] || CORES.coloridas;
    const nome = p => (contraRobo ? (p === 0 ? "🧒 Você" : `🤖 ${NIVEIS[op.nivel]}`) : C[p].nome);
    const falaNome = p => (contraRobo ? (p === 0 ? "você" : "o computador") : `as ${C[p].nome.toLowerCase()}`);

    let e = { t: Array(24).fill(null), mao: [9, 9] };
    let vez;
    if (op.comeca === "eu") vez = 0;
    else if (op.comeca === "robo") vez = 1;
    else vez = rodada === 1 ? 0 : outro(quemComecou);
    quemComecou = vez;
    let estado = "jogar"; // jogar | tirar | robo | fim
    let sel = -1, ultima = null, semTirar = 0, novaTrilha = null, acabou = false;
    const avisos = { mover: false, voar: [false, false] };

    const sessao = Motor.sessaoAtual();
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "trilha-tela";
    area.appendChild(tela);
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const espera = ms => new Promise(r => setTimeout(r, ms * VEL));
    const humano = p => !contraRobo || p === 0;
    const minhaVez = () => !acabou && humano(vez) && (estado === "jogar" || estado === "tirar");

    let tab, pontos = [], pecasEl = [], camada, lados = [], msgEl;

    function desenhar() {
      tela.innerHTML = "";
      tela.style.setProperty("--c0", C[0].cor); tela.style.setProperty("--e0", C[0].escura); tela.style.setProperty("--b0", C[0].brilho);
      tela.style.setProperty("--c1", C[1].cor); tela.style.setProperty("--e1", C[1].escura); tela.style.setProperty("--b1", C[1].brilho);
      const larg = tela.clientWidth, alt = tela.clientHeight, deitado = larg > alt * 1.05;
      tela.classList.toggle("deitado", deitado);

      const info = document.createElement("div");
      info.className = "trilha-info";
      lados = [0, 1].map(p => {
        const el = document.createElement("div");
        el.className = `trilha-lado j${p}`;
        el.innerHTML = `<span class="trilha-peca p${p} mini"></span><span class="nome"></span><span class="mao"></span><span class="qt"></span>`;
        el.querySelector(".nome").textContent = nome(p);
        info.appendChild(el);
        return el;
      });
      const baixo = document.createElement("div");
      baixo.className = "trilha-baixo";
      msgEl = document.createElement("div");
      msgEl.className = "trilha-msg";
      baixo.append(msgEl, Motor.botaoSom());
      if (deitado) info.appendChild(baixo);

      const L = Math.floor(deitado ? Math.min(alt - 8, larg - 250) : Math.min(larg - 8, alt - 96 - 90 - 20, 640));
      tab = document.createElement("div");
      tab.className = "trilha-tabuleiro";
      Object.assign(tab.style, { width: L + "px", height: L + "px" });
      tab.style.setProperty("--tam", Math.round(L * 0.125) + "px");
      tab.innerHTML = `<svg class="linhas" viewBox="0 0 100 100" aria-hidden="true">${linhasSVG()}<g class="trilhas-feitas"></g></svg>`;
      camada = tab.querySelector(".trilhas-feitas");
      pontos = []; pecasEl = [];
      PONTOS.forEach(([x, y], i) => {
        const b = document.createElement("button");
        b.className = "trilha-ponto";
        b.style.left = PCT(x) + "%";
        b.style.top = PCT(y) + "%";
        b.setAttribute("aria-label", `Ponto ${i + 1}`);
        const area = document.createElement("span");
        area.className = "area";
        b.appendChild(area);
        const pc = document.createElement("span");
        pc.className = "trilha-peca";
        // as cores vão na própria peça (a cópia que segue o dedo ao arrastar fica fora do tabuleiro)
        [0, 1].forEach(p => { pc.style.setProperty("--c" + p, C[p].cor); pc.style.setProperty("--e" + p, C[p].escura); pc.style.setProperty("--b" + p, C[p].brilho); });
        b.appendChild(pc);
        Motor.arrastavel(pc, {
          alvos: () => (sel === i ? pontos.filter((_, k) => destinos().includes(k)) : []),
          aoComecar: () => { if (sel !== i) { sel = i; atualizar(); } },
          aoSoltar: alvo => { const k = pontos.indexOf(alvo); if (!destinos().includes(k)) return false; moverHumano(i, k); return true; },
        });
        b.addEventListener("click", () => tocar(i));
        pontos.push(b); pecasEl.push(pc);
        tab.appendChild(b);
      });
      tela.append(info, tab);
      if (!deitado) tela.appendChild(baixo);
      atualizar();
    }

    // Peças que podem se mexer e para onde (na vez da pessoa)
    const base = () => jogadasBase(e, vez, voo);
    const podemMexer = () => [...new Set(base().filter(j => j.de >= 0).map(j => j.de))];
    const destinos = () => (fase(e, vez, voo) === "colocar" ? base().map(j => j.para) : sel >= 0 ? base().filter(j => j.de === sel).map(j => j.para) : []);

    function atualizar() {
      const f = fase(e, vez, voo);
      const meu = minhaVez();
      const podem = meu && estado === "jogar" && f !== "colocar" ? podemMexer() : [];
      const dest = meu && estado === "jogar" ? destinos() : [];
      const tv = meu && estado === "tirar" ? tiraveis(e.t, vez) : [];
      pontos.forEach((b, i) => {
        const q = e.t[i];
        const pc = pecasEl[i];
        pc.className = "trilha-peca" + (q === null ? " vazia" : ` p${q}`) + (q !== null && emTrilha(e.t, i) ? " em-trilha" : "");
        pc.disabled = !(podem.includes(i));
        b.classList.toggle("ocupado", q !== null);
        b.classList.toggle("destino", dest.includes(i) && (dicas || sel >= 0 || f !== "colocar"));
        b.classList.toggle("dica", dicas && dest.includes(i) && f === "colocar");
        b.classList.toggle("pode", dicas && podem.includes(i) && sel < 0);
        b.classList.toggle("sel", sel === i);
        b.classList.toggle("tiravel", tv.includes(i));
        b.classList.toggle("ultima", !!ultima && (ultima.para === i || ultima.de === i));
      });
      // Trilhas formadas
      let s = "";
      TRILHAS.forEach(l => {
        const q = e.t[l[0]];
        if (q === null || !l.every(k => e.t[k] === q)) return;
        const [a, b] = PONTOS[l[0]], [c, d] = PONTOS[l[2]];
        const nova = novaTrilha && novaTrilha.join() === l.join();
        s += `<line class="${nova ? "nova" : ""}" x1="${PCT(a)}" y1="${PCT(b)}" x2="${PCT(c)}" y2="${PCT(d)}" stroke="#ffd60a" />`;
      });
      camada.innerHTML = s;
      lados.forEach((el, p) => {
        el.classList.toggle("da-vez", !acabou && vez === p);
        el.querySelector(".mao").innerHTML = e.mao[p] ? `<i class="p${p}"></i>`.repeat(e.mao[p]) : "";
        el.querySelector(".qt").textContent = `${conta(e.t, p)} no tabuleiro`;
      });
    }
    function mensagem(t) { if (msgEl) msgEl.textContent = t; }

    function instrucao() {
      const f = fase(e, vez, voo);
      if (estado === "tirar") return "Trilha! ⭐ Toque numa peça do adversário para tirar.";
      if (!humano(vez)) return "O computador está pensando… 🤔";
      const quem = contraRobo ? "Sua vez" : `Vez das ${C[vez].nome.toLowerCase()}`;
      if (f === "colocar") return `${quem}: coloque uma peça (${e.mao[vez]} na mão).`;
      if (f === "voar") return `${quem}: toque numa peça e voe para qualquer ponto livre 🦋`;
      return sel >= 0 ? "Agora toque no ponto para onde ela vai." : `${quem}: toque numa peça para mover.`;
    }

    // ---------- Toques ----------
    function tocar(i) {
      if (!minhaVez()) { Motor.animar(pontos[i], "balanca"); return; }
      const f = fase(e, vez, voo);
      if (estado === "tirar") {
        if (tiraveis(e.t, vez).includes(i)) { tirar(i); return; }
        Motor.animar(pontos[i], "balanca");
        if (e.t[i] === outro(vez)) Motor.falar("Essa está numa trilha: escolha outra peça.");
        else Motor.falar("Toque numa peça do adversário.");
        return;
      }
      if (f === "colocar") {
        if (e.t[i] !== null) { Motor.animar(pontos[i], "balanca"); return; }
        fazer({ de: -1, para: i });
        return;
      }
      if (e.t[i] === vez) {
        if (sel === i) { sel = -1; atualizar(); mensagem(instrucao()); return; }
        if (!podemMexer().includes(i)) { Motor.animar(pontos[i], "balanca"); Motor.falar("Essa peça não tem para onde ir."); return; }
        sel = i;
        Motor.ploc();
        atualizar();
        mensagem(instrucao());
        return;
      }
      if (sel >= 0 && destinos().includes(i)) { moverHumano(sel, i); return; }
      Motor.animar(pontos[i], "balanca");
      if (sel >= 0 && e.t[i] === null) Motor.falar(f === "voar" ? "Escolha um ponto livre." : "Só dá para andar até um ponto vizinho livre, seguindo a linha.");
    }
    function moverHumano(de, para) { sel = -1; fazer({ de, para }); }

    // Faz a parte de colocar/mover; se formou trilha, pede para tirar (pessoa) ou já tira (computador)
    function fazer(j, tiraRobo = -1) {
      const p = vez;
      const antes = j.de;
      e = aplicarBase(e, j, p);
      ultima = j;
      sel = -1;
      novaTrilha = null;
      Motor.nota(p === 0 ? 520 : 392, { dur: 0.14, tipo: "triangle", vol: 0.25 });
      atualizar();
      const pc = pecasEl[j.para];
      if (antes >= 0) deslizar(antes, j.para);
      else pc.animate([{ transform: "scale(1.7)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 260, easing: "ease-out" });
      const fez = DO_PONTO[j.para].find(l => l.every(k => e.t[k] === p));
      if (fez && tiraveis(e.t, p).length) {
        novaTrilha = fez;
        atualizar();
        Motor.tim();
        if (humano(p)) {
          estado = "tirar";
          atualizar();
          mensagem(instrucao());
          Motor.comemorar(pontos[fez[1]], false);
          Motor.falar(contraRobo ? "Trilha! Escolha uma peça do computador para tirar." : `Trilha das ${C[p].nome.toLowerCase()}! Escolha uma peça para tirar.`);
          if (teste && teste.aoTirar) teste.aoTirar();
        } else {
          Motor.falar("O computador fez trilha!");
          Motor.depois(() => tirar(tiraRobo >= 0 ? tiraRobo : tiraveis(e.t, p)[0]), 1300 * VEL);
        }
        return;
      }
      if (!e.mao[0] && !e.mao[1] && antes >= 0) semTirar++;
      proximo();
    }

    function tirar(i) {
      const p = vez;
      const el = pecasEl[i];
      estado = "animando";
      atualizar();
      Motor.nota(700, { dur: 0.35, vol: 0.22, ate: 180 });
      el.classList.add("saindo");
      Motor.depois(() => {
        el.classList.remove("saindo");
        e.t[i] = null;
        semTirar = 0;
        if (contraRobo) Motor.falar(p === 1 ? "Tirou uma peça sua!" : "Você tirou uma peça do computador!", { naFila: true });
        else Motor.falar(`As ${C[p].nome.toLowerCase()} tiraram uma peça!`, { naFila: true });
        proximo();
      }, 450 * Math.max(VEL, 0.4));
    }

    function deslizar(de, para) {
      const a = pontos[de].getBoundingClientRect(), b = pontos[para].getBoundingClientRect();
      pecasEl[para].animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(1.12)` }, { transform: "none" }], { duration: 380, easing: "ease-in-out" });
    }

    function proximo() {
      if (!vivo()) return;
      vez = outro(vez);
      estado = "jogar";
      sel = -1;
      atualizar();
      if (perdeu(e, vez, voo)) return fim(outro(vez), conta(e.t, vez) + e.mao[vez] < 3 ? "pecas" : "preso");
      if (semTirar >= LIMITE_EMPATE) return fim(null, "empate");
      // Avisos de fase
      let aviso = "";
      if (!e.mao[0] && !e.mao[1] && !avisos.mover) { avisos.mover = true; aviso = "Todas as peças foram colocadas! Agora é mover para um ponto vizinho. "; }
      if (fase(e, vez, voo) === "voar" && !avisos.voar[vez]) {
        avisos.voar[vez] = true;
        aviso += contraRobo ? (vez === 0 ? "Você tem só 3 peças: agora pode voar! " : "O computador tem só 3 peças e agora pode voar! ") : `As ${C[vez].nome.toLowerCase()} têm 3 peças e podem voar! `;
      }
      mensagem(instrucao());
      if (humano(vez)) {
        if (aviso) Motor.falar(aviso + (contraRobo ? "Sua vez!" : `Vez das ${C[vez].nome.toLowerCase()}!`), { naFila: true });
        else if (!contraRobo) Motor.falar(`Vez das ${C[vez].nome.toLowerCase()}!`, { naFila: true });
        if (teste && teste.aoJogar) teste.aoJogar();
      } else {
        if (aviso) Motor.falar(aviso, { naFila: true });
        vezDoRobo();
      }
    }

    function vezDoRobo() {
      estado = "robo";
      atualizar();
      Motor.depois(() => {
        if (!vivo() || acabou) return;
        const j = escolherJogada(e, 1, op.nivel, voo);
        if (j.de >= 0) {
          // mostra a peça que vai andar
          pontos[j.de].classList.add("sel");
          Motor.depois(() => { if (vivo() && !acabou) fazer({ de: j.de, para: j.para }, j.tira); }, 550 * VEL);
        } else fazer({ de: -1, para: j.para }, j.tira);
      }, 800 * VEL);
    }

    // ---------- Fim ----------
    function fim(vencedor, motivo) {
      acabou = true;
      estado = "fim";
      atualizar();
      let frase;
      if (vencedor === null) frase = "Empate! Muitas jogadas sem ninguém tirar peça.";
      else if (contraRobo) frase = vencedor === 0 ? "Você ganhou!" : "O computador ganhou desta vez!";
      else frase = `As ${C[vencedor].nome.toLowerCase()} ganharam!`;
      const porque = vencedor === null ? "" : motivo === "preso"
        ? (contraRobo ? (vencedor === 0 ? "O computador ficou sem jogada." : "Você ficou sem jogada.") : `As ${C[outro(vencedor)].nome.toLowerCase()} ficaram sem jogada.`)
        : (contraRobo ? (vencedor === 0 ? "O computador ficou com 2 peças." : "Você ficou com 2 peças.") : `As ${C[outro(vencedor)].nome.toLowerCase()} ficaram com 2 peças.`);
      mensagem("🏁 " + frase);
      const ganhei = vencedor !== null && humano(vencedor) && contraRobo;
      if (vencedor !== null && (ganhei || !contraRobo)) { Motor.tim(); Motor.comemorar(tab); }
      let fala = `${porque} ${frase}`;
      if (contraRobo) {
        const seq = Placar.resultado("trilha", vencedor === null ? null
          : vencedor === 0 ? { id: "voce", rotulo: "🧒 Você" } : { id: `robo-${op.nivel}`, rotulo: `🤖 ${NIVEIS[op.nivel]}` });
        if (seq.novaMelhorSequencia) fala += ` ${seq.sequencia} vitórias seguidas! É o seu recorde!`;
        else if (ganhei && seq.sequencia > 1) fala += ` São ${seq.sequencia} vitórias seguidas!`;
      }
      Motor.falar(fala);
      Motor.depois(() => {
        if (!vivo()) return;
        area.innerHTML = "";
        const caixa = document.createElement("div");
        caixa.className = "fim trilha-fim";
        const trofeu = document.createElement("div");
        trofeu.className = "trofeu";
        trofeu.textContent = vencedor === null ? "🤝" : contraRobo ? (ganhei ? "🏆" : "🤖") : "🏆";
        if (vencedor !== null && !contraRobo) {
          const pc = document.createElement("span");
          pc.className = `trilha-peca p${vencedor} trofeu-peca`;
          pc.style.setProperty("--c" + vencedor, C[vencedor].cor);
          pc.style.setProperty("--e" + vencedor, C[vencedor].escura);
          pc.style.setProperty("--b" + vencedor, C[vencedor].brilho);
          trofeu.prepend(pc);
        }
        const resumo = document.createElement("div");
        resumo.className = "resumo";
        resumo.textContent = frase;
        const motivoEl = document.createElement("div");
        motivoEl.className = "trilha-motivo";
        motivoEl.textContent = porque;
        caixa.append(trofeu, resumo);
        if (porque) caixa.appendChild(motivoEl);
        if (contraRobo) caixa.appendChild(Placar.painel("trilha"));
        const botoes = document.createElement("div");
        botoes.className = "mesa-botoes trilha-botoes";
        const denovo = document.createElement("button");
        denovo.className = "modo jogar";
        denovo.innerHTML = `<span class="icone">🔁</span><span class="rotulo">Jogar de novo</span>`;
        denovo.addEventListener("click", () => partida(area, op, faixa, rodada + 1));
        const opc = document.createElement("button");
        opc.className = "chip";
        opc.textContent = "⚙️ Opções";
        opc.addEventListener("click", () => opcoes(area, faixa));
        botoes.append(denovo, opc);
        caixa.appendChild(botoes);
        area.appendChild(caixa);
        if (ganhei || (!contraRobo && vencedor !== null)) Motor.comemorar(trofeu, false);
      }, 2600 * Math.max(VEL, 0.3));
    }

    // Girou o celular: desenha de novo
    let esperaTam = null;
    const aoRedimensionar = () => {
      if (!vivo()) { window.removeEventListener("resize", aoRedimensionar); return; }
      clearTimeout(esperaTam);
      esperaTam = setTimeout(() => { if (vivo() && !acabou) { desenhar(); mensagem(instrucao()); } }, 200);
    };
    window.addEventListener("resize", aoRedimensionar);

    if (teste) Object.assign(teste, { estado: () => ({ e, vez, estado, sel, acabou, fase: fase(e, vez, voo) }) });

    desenhar();
    mensagem(instrucao());
    if (!humano(vez)) { Motor.falar("O computador começa!"); vezDoRobo(); }
    else if (contraRobo) Motor.falar(rodada === 1 ? "Você começa! Toque num ponto para colocar uma peça. Faça trilhas de três!" : "Sua vez de começar!");
    else Motor.falar(`Começam as ${C[vez].nome.toLowerCase()}!`);
    if (humano(vez) && teste && teste.aoJogar) teste.aoJogar();
  }

  // Para testes
  if (typeof globalThis !== "undefined") globalThis.TrilhaTeste = { jogadas, aplicar, perdeu, escolherJogada, emTrilha, tiraveis, VIZ, TRILHAS };
})();
