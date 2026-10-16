// Ludo (regras brasileiras): tabuleiro em cruz com 4 cores, dado de 6 faces.
// - Sai de casa com 6 (opção: com 1 ou 6). Tirou 6, joga de novo (opção: três 6 seguidos perde a vez).
// - Parou na casa de um adversário, ele volta para casa. Saídas e estrelas são casas seguras.
// - Barreira (opcional): dois peões da mesma cor juntos bloqueiam a passagem.
// - Depois da volta, o peão entra na reta da sua cor; para chegar ao centro é preciso o número
//   exato (opção de simplificar). Ganha quem levar os 4 peões ao centro.
// 2 a 4 jogadores; cada um pode ser pessoa ou computador (😊 Fácil / 🧠 Esperto).
// Joga-se tocando no dado e depois no peão que brilha (ou pelo controle: setas + A).
(() => {
  const CORES = [
    { nome: "vermelho", Nome: "Vermelho", emoji: "🔴", cor: "#e63946", escura: "#9d1c27", clara: "#ffc2c6" },
    { nome: "verde", Nome: "Verde", emoji: "🟢", cor: "#2a9d55", escura: "#17663a", clara: "#b5ecc9" },
    { nome: "amarelo", Nome: "Amarelo", emoji: "🟡", cor: "#ffc300", escura: "#a87b00", clara: "#fff1a8" },
    { nome: "azul", Nome: "Azul", emoji: "🔵", cor: "#1d7fd1", escura: "#0f4f86", clara: "#b6dcf7" },
  ];
  const NUM = ["zero", "um", "dois", "três", "quatro", "cinco", "seis"];
  const NIVEIS = { facil: "😊 Fácil", esperto: "🧠 Esperto" };

  // ---------- Tabuleiro (15 × 15 casas; [linha, coluna]) ----------
  // Trilha comum de 52 casas, no sentido do relógio, começando na saída do vermelho
  const TRILHO = [
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    [0, 7], [0, 8],
    [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    [7, 14], [8, 14],
    [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    [14, 7], [14, 6],
    [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    [7, 0], [6, 0],
  ];
  // Lugares: 0 em cima à esquerda, 1 em cima à direita, 2 embaixo à direita, 3 embaixo à esquerda
  const INICIO = [0, 13, 26, 39];
  const ESTRELAS = [8, 21, 34, 47];
  const SEGURAS = new Set([...INICIO, ...ESTRELAS]);
  const RETA = [
    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
    [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  ];
  const BASE = [[0, 0], [9, 0], [9, 9], [0, 9]]; // canto (x, y) de cada casa inicial
  const VAGAS = [[2, 2], [4, 2], [2, 4], [4, 4]];
  const CENTRO = [[6.6, 7.5], [7.5, 6.6], [8.4, 7.5], [7.5, 8.4]];
  // Progresso do peão: -1 em casa; 0 a 50 na trilha; 51 a 55 na reta colorida; 56 chegou ao centro
  const ULTIMA = 50, FIM = 56;
  const absoluta = (lugar, p) => (INICIO[lugar] + p) % 52;

  // ---------- Regras (funções puras) ----------
  // pecas[lugar] = [p, p, p, p]; `ativos`: lugares em jogo
  function naCasa(pecas, ativos, abs) {
    const r = [];
    ativos.forEach(l => pecas[l].forEach((p, i) => { if (p >= 0 && p <= ULTIMA && absoluta(l, p) === abs) r.push({ lugar: l, i }); }));
    return r;
  }
  // Barreira de outra cor nessa casa (2 ou mais peões da mesma cor)
  function temBarreira(pecas, ativos, abs, lugar) {
    const cont = {};
    return naCasa(pecas, ativos, abs).some(o => o.lugar !== lugar && (cont[o.lugar] = (cont[o.lugar] || 0) + 1) >= 2);
  }

  function movimentos(pecas, ativos, lugar, d, op) {
    const res = [];
    const barreira = op.barreira === "sim";
    pecas[lugar].forEach((p, i) => {
      if (p === FIM) return;
      if (p === -1) {
        if (!(d === 6 || (op.sair === "16" && d === 1))) return;
        if (barreira && temBarreira(pecas, ativos, INICIO[lugar], lugar)) return;
        res.push({ peao: i, de: -1, para: 0, capt: [] });
        return;
      }
      let para = p + d;
      if (para > FIM) { if (op.final === "exato") return; para = FIM; }
      if (barreira) {
        for (let s = p + 1; s <= Math.min(para, ULTIMA); s++) if (temBarreira(pecas, ativos, absoluta(lugar, s), lugar)) return;
      }
      let capt = [];
      if (para <= ULTIMA) {
        const abs = absoluta(lugar, para);
        if (!SEGURAS.has(abs)) capt = naCasa(pecas, ativos, abs).filter(o => o.lugar !== lugar);
      }
      res.push({ peao: i, de: p, para, capt });
    });
    return res;
  }

  // Algum adversário pode chegar nessa casa com um dado (1 a 6)?
  function ameacas(pecas, ativos, abs, lugar) {
    let n = 0;
    ativos.forEach(l => {
      if (l === lugar) return;
      pecas[l].forEach(p => {
        if (p < 0 || p > ULTIMA) return;
        const dist = (abs - absoluta(l, p) + 52) % 52;
        if (dist >= 1 && dist <= 6 && p + dist <= ULTIMA) n++;
      });
    });
    return n;
  }

  function escolherMovimento(pecas, ativos, lugar, movs, nivel, rnd = Math.random) {
    if (nivel === "facil") {
      const caps = movs.filter(m => m.capt.length);
      if (caps.length && rnd() < 0.5) return caps[Math.floor(rnd() * caps.length)];
      return movs[Math.floor(rnd() * movs.length)];
    }
    let melhor = null, nota = -Infinity;
    movs.forEach(m => {
      let v = rnd() * 0.5;
      if (m.capt.length) v += 60 + m.capt.reduce((s, o) => s + Math.max(0, pecas[o.lugar][o.i]), 0) * 0.6;
      if (m.para === FIM) v += 45;
      if (m.de === -1) v += 32;
      if (m.para > ULTIMA && m.de <= ULTIMA) v += 18; // entrou na reta: ninguém pega mais
      if (m.de >= 0 && m.de <= ULTIMA) {
        const absDe = absoluta(lugar, m.de);
        if (!SEGURAS.has(absDe) && ameacas(pecas, ativos, absDe, lugar)) v += 22 + m.de * 0.3; // foge do perigo
      }
      if (m.para <= ULTIMA) {
        const absPara = absoluta(lugar, m.para);
        if (SEGURAS.has(absPara)) v += 10;
        else {
          const depois = pecas.map(l => l.slice());
          depois[lugar][m.peao] = m.para;
          m.capt.forEach(o => { depois[o.lugar][o.i] = -1; });
          v -= ameacas(depois, ativos, absPara, lugar) * (16 + m.para * 0.3);
        }
      }
      v += m.para * 0.08;
      if (v > nota) { nota = v; melhor = m; }
    });
    return melhor;
  }

  // ---------- Desenhos ----------
  function estrela(cx, cy, r, cor) {
    const pts = [];
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r;
      pts.push((cx + Math.cos(a) * rr).toFixed(3) + "," + (cy + Math.sin(a) * rr).toFixed(3));
    }
    return `<polygon points="${pts.join(" ")}" fill="${cor}"/>`;
  }
  // Tabuleiro inteiro em SVG (viewBox 15 × 15), girado `giro` quartos de volta
  function tabuleiroSVG(giro, ativos = [0, 1, 2, 3], largura) {
    let s = `<svg viewBox="0 0 15 15" ${largura ? `style="width:${largura}px"` : ""} aria-hidden="true"><g transform="rotate(${giro * 90} 7.5 7.5)">`;
    s += '<rect width="15" height="15" fill="#fffaf0"/>';
    BASE.forEach(([x, y], l) => {
      const C = CORES[l], on = ativos.includes(l);
      s += `<rect x="${x}" y="${y}" width="6" height="6" fill="${C.cor}" opacity="${on ? 1 : 0.45}"/>`;
      s += `<rect x="${x + 0.7}" y="${y + 0.7}" width="4.6" height="4.6" rx="0.7" fill="#fffdf6"/>`;
      VAGAS.forEach(([vx, vy]) => { s += `<circle cx="${x + vx}" cy="${y + vy}" r="0.72" fill="${C.clara}" stroke="${C.cor}" stroke-width="0.12"/>`; });
    });
    TRILHO.forEach(([r, c], i) => {
      const l = INICIO.indexOf(i);
      s += `<rect x="${c + 0.03}" y="${r + 0.03}" width="0.94" height="0.94" rx="0.12" fill="${l >= 0 ? CORES[l].cor : "#fff"}" stroke="#c9b48f" stroke-width="0.05"/>`;
      if (l >= 0) s += `<circle cx="${c + 0.5}" cy="${r + 0.5}" r="0.28" fill="none" stroke="#fff" stroke-width="0.09"/>`;
      if (ESTRELAS.includes(i)) s += estrela(c + 0.5, r + 0.5, 0.36, "#b9a27a");
    });
    RETA.forEach((casas, l) => casas.forEach(([r, c]) => {
      s += `<rect x="${c + 0.03}" y="${r + 0.03}" width="0.94" height="0.94" rx="0.12" fill="${CORES[l].cor}" stroke="#c9b48f" stroke-width="0.05"/>`;
    }));
    const tri = [["6,6 6,9 7.5,7.5", 0], ["6,6 9,6 7.5,7.5", 1], ["9,6 9,9 7.5,7.5", 2], ["6,9 9,9 7.5,7.5", 3]];
    tri.forEach(([p, l]) => { s += `<polygon points="${p}" fill="${CORES[l].cor}" stroke="#fff" stroke-width="0.06"/>`; });
    s += estrela(7.5, 7.5, 0.55, "#fff");
    return s + "</g></svg>";
  }
  function peaoSVG(l, largura) {
    const C = CORES[l];
    return `<svg viewBox="0 0 40 48" ${largura ? `style="width:${largura}px"` : ""} aria-hidden="true">` +
      `<ellipse cx="20" cy="42" rx="15" ry="5.5" fill="${C.escura}"/>` +
      `<path d="M7 41 C8 31 14 28 15.5 22 L24.5 22 C26 28 32 31 33 41 Z" fill="${C.cor}" stroke="${C.escura}" stroke-width="1.6"/>` +
      `<ellipse cx="20" cy="22.5" rx="8" ry="2.6" fill="${C.cor}" stroke="${C.escura}" stroke-width="1.4"/>` +
      `<circle cx="20" cy="14" r="9.5" fill="${C.cor}" stroke="${C.escura}" stroke-width="1.6"/>` +
      `<circle cx="16.5" cy="10.5" r="3.2" fill="#fff" opacity=".65"/>` +
      `<path d="M12 37 C13 31 16 29 17 25" stroke="#fff" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/></svg>`;
  }
  const PONTOS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function dadoSVG(n, largura, cor = "#222") {
    let s = `<svg viewBox="0 0 60 60" ${largura ? `style="width:${largura}px"` : ""} aria-hidden="true"><rect x="2" y="2" width="56" height="56" rx="12" fill="#fff" stroke="#ccc" stroke-width="2"/>`;
    PONTOS[n].forEach(k => { s += `<circle cx="${15 + (k % 3) * 15}" cy="${15 + Math.floor(k / 3) * 15}" r="5.6" fill="${cor}"/>`; });
    return s + "</svg>";
  }
  // Pedacinho da trilha para as explicações: casas em linha com peões
  function trechoSVG(casas, largura = 170) {
    let s = `<svg viewBox="0 0 ${casas.length} 1.4" style="width:${largura}px" aria-hidden="true">`;
    casas.forEach((c, i) => {
      s += `<rect x="${i + 0.04}" y="0.36" width="0.92" height="0.92" rx="0.12" fill="${c.fundo || "#fff"}" stroke="#c9b48f" stroke-width="0.05"/>`;
      if (c.estrela) s += estrela(i + 0.5, 0.82, 0.34, "#b9a27a");
      (c.peoes || []).forEach((l, k, a) => {
        const dx = a.length > 1 ? (k - (a.length - 1) / 2) * 0.32 : 0;
        s += `<g transform="translate(${i + 0.14 + dx} 0.02) scale(0.018)">${peaoSVG(l).replace(/<\/?svg[^>]*>/g, "")}</g>`;
      });
      if (c.seta) s += `<text x="${i + 0.5}" y="0.3" font-size="0.36" text-anchor="middle" fill="#e63946">${c.seta}</text>`;
    });
    return s + "</svg>";
  }

  // ---------- Opções ----------
  const OPCOES = [
    { chave: "jogadores", titulo: "Jogadores", valores: [["2", "2"], ["3", "3"], ["4", "4"]] },
    { chave: "pessoas", titulo: "Quantas pessoas (o resto é computador)", valores: [["1", "🧒 1"], ["2", "👥 2"], ["3", "3"], ["4", "4"]] },
    { chave: "cor", titulo: "Cor de quem começa", valores: CORES.map((c, i) => [String(i), `${c.emoji} ${c.Nome}`]) },
    { chave: "nivel", titulo: "Computador", valores: [["facil", NIVEIS.facil], ["esperto", NIVEIS.esperto]] },
    { chave: "sair", titulo: "Sair de casa", valores: [["6", "🎲 Só com 6"], ["16", "🙂 Com 1 ou 6"]] },
    { chave: "tres6", titulo: "Três 6 seguidos", valores: [["perde", "🚫 Perde a vez"], ["nada", "🙂 Pode"]] },
    { chave: "barreira", titulo: "Barreira (2 peões juntos)", valores: [["sim", "🧱 Ninguém passa"], ["nao", "🙂 Sem barreira"]] },
    { chave: "final", titulo: "Chegar ao centro", valores: [["exato", "🎯 Número exato"], ["livre", "🙂 Sobrou, chegou"]] },
    { chave: "bonus", titulo: "Capturou ou chegou ao centro", valores: [["sim", "🎁 Joga de novo"], ["nao", "➖ Passa a vez"]] },
  ];
  const PADRAO = {
    "5-6":  { jogadores: "2", pessoas: "1", cor: "0", nivel: "facil", sair: "16", tres6: "nada", barreira: "nao", final: "livre", bonus: "nao" },
    "6-8":  { jogadores: "4", pessoas: "1", cor: "0", nivel: "facil", sair: "6", tres6: "perde", barreira: "nao", final: "exato", bonus: "nao" },
    "8-10": { jogadores: "4", pessoas: "1", cor: "0", nivel: "esperto", sair: "6", tres6: "perde", barreira: "sim", final: "exato", bonus: "sim" },
  };

  JOGOS.push({
    id: "ludo",
    nome: "Ludo",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="10" fill="#7a4a22"/><rect x="5" y="5" width="54" height="54" rx="6" fill="#fffaf0"/><rect x="5" y="5" width="22" height="22" rx="5" fill="#e63946"/><rect x="37" y="5" width="22" height="22" rx="5" fill="#2a9d55"/><rect x="37" y="37" width="22" height="22" rx="5" fill="#ffc300"/><rect x="5" y="37" width="22" height="22" rx="5" fill="#1d7fd1"/><polygon points="27,27 37,27 32,32" fill="#2a9d55"/><polygon points="37,27 37,37 32,32" fill="#ffc300"/><polygon points="27,37 37,37 32,32" fill="#1d7fd1"/><polygon points="27,27 27,37 32,32" fill="#e63946"/><rect x="38" y="38" width="17" height="17" rx="4" fill="#fff" stroke="#999" stroke-width="1"/><circle cx="42.5" cy="42.5" r="2" fill="#222"/><circle cx="46.5" cy="46.5" r="2" fill="#222"/><circle cx="50.5" cy="50.5" r="2" fill="#222"/><circle cx="16" cy="16" r="6" fill="#fff"/><circle cx="16" cy="14" r="3.4" fill="#e63946"/><path d="M11 21 Q16 15 21 21 Z" fill="#e63946"/></svg>',
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: [dadoSVG(6, 56), peaoSVG(0, 40)], texto: "Toque no dado para jogar. Para tirar um peão de casa, precisa tirar 6 (ou 1 ou 6, se escolher nas opções). Tirou 6? Joga de novo!" },
      { figura: trechoSVG([{ peoes: [0] }, {}, {}, { estrela: true }, { seta: "⬇" }]), texto: "O peão anda pela trilha no sentido do relógio, o número de casas do dado. Os peões que podem andar ficam brilhando: toque num deles." },
      { figura: [trechoSVG([{ peoes: [0] }, {}, { peoes: [3] }], 110), trechoSVG([{}, {}, { peoes: [0] }], 110)], texto: "Parou na casa de um adversário? Ele volta para a casa inicial! Nas estrelas e nas saídas coloridas ninguém é capturado." },
      { figura: trechoSVG([{ peoes: [3, 3] }, {}, { peoes: [0] }], 120), texto: "Com a barreira ligada, dois peões da mesma cor juntos formam uma barreira: ninguém passa por ela." },
      { figura: dadoSVG(6, 44) + dadoSVG(6, 44) + dadoSVG(6, 44), texto: "Com a regra dos três 6 ligada, quem tira 6 três vezes seguidas perde a vez." },
      { figura: tabuleiroSVG(0, [0, 1, 2, 3], 120), texto: "Depois de dar a volta, o peão entra na reta da sua cor e vai até o centro (na regra oficial, com o número exato). Ganha quem levar os 4 peões ao centro primeiro!" },
    ],
    iniciar(area, faixa) { opcoes(area, faixa); },
  });
  CATALOGO["ludo"] = ["mesa", "Dado, peões e muita corrida"];

  function opcoes(area, faixa) {
    const id = (faixa && faixa.id) || "6-8";
    Motor.telaOpcoes(area, {
      opcoes: OPCOES, padrao: PADRAO[id] || PADRAO["6-8"], chave: `ludo-opcoes-${id}`,
      antes: Placar.painel("ludo", { comZerar: true }),
      aoJogar: op => partida(area, op, faixa),
      // Não pode ter mais pessoas que jogadores
      aoMudar: (op, mudou) => {
        if (+op.pessoas > +op.jogadores) {
          if (mudou === "pessoas") op.jogadores = op.pessoas;
          else op.pessoas = op.jogadores;
        }
      },
    });
  }

  // ---------- Uma partida ----------
  function partida(area, op, faixa) {
    const teste = window.LUDO_TESTE || null;
    const VEL = teste && teste.rapido ? 0.06 : 1;
    const n = +op.jogadores, pessoas = Math.min(+op.pessoas, n), cor0 = +op.cor;
    const ordem = (n === 2 ? [0, 2] : n === 3 ? [0, 1, 2] : [0, 1, 2, 3]).map(k => (cor0 + k) % 4);
    const humanos = new Set(ordem.slice(0, pessoas));
    const giro = (3 - cor0 + 4) % 4; // quem começa fica embaixo à esquerda
    const so1 = pessoas === 1;
    const ehHumano = l => humanos.has(l);
    const nomeDe = l => (ehHumano(l) && so1 ? "Você" : CORES[l].Nome);
    const rotulo = l => (ehHumano(l) ? (so1 ? "🧒 Você" : "🧒 " + CORES[l].Nome) : "🤖 " + CORES[l].Nome);
    const doDe = l => (ehHumano(l) && so1 ? "seu" : `do ${CORES[l].nome}`);

    let pecas = [0, 1, 2, 3].map(() => [-1, -1, -1, -1]);
    let vez = 0, dado = 6, seis = 0, estado = "rolar", movs = [], acabou = false, ultimoAndou = null;

    const sessao = Motor.sessaoAtual();
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "ludo-tela";
    area.appendChild(tela);
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const espera = ms => new Promise(r => setTimeout(r, ms * VEL));
    const atual = () => ordem[vez];
    const minhaVez = () => !acabou && ehHumano(atual());

    let tab, cel = 20, dadoBtn, msgEl, chips = {}, els = {};

    function desenhar() {
      tela.innerHTML = "";
      const larg = tela.clientWidth, alt = tela.clientHeight, deitado = larg > alt * 1.05;
      tela.classList.toggle("deitado", deitado);

      const jog = document.createElement("div");
      jog.className = "ludo-jogadores" + (n === 2 && !deitado ? " dois" : "");
      chips = {};
      ordem.forEach(l => {
        const c = document.createElement("div");
        c.className = "ludo-jogador";
        c.style.setProperty("--cor", CORES[l].cor);
        c.style.setProperty("--clara", CORES[l].clara);
        c.innerHTML = `<span class="mini">${peaoSVG(l)}</span><span class="nome"></span><span class="qt"></span>`;
        c.querySelector(".nome").textContent = nomeDe(l);
        if (!ehHumano(l)) c.classList.add("robo"); // 🤖 pequeno sobre o peão
        chips[l] = c;
        jog.appendChild(c);
      });

      const lado = document.createElement("div");
      lado.className = "ludo-lado";
      dadoBtn = document.createElement("button");
      dadoBtn.className = "ludo-dado";
      dadoBtn.setAttribute("aria-label", "Dado");
      dadoBtn.addEventListener("click", tocarDado);
      msgEl = document.createElement("div");
      msgEl.className = "ludo-msg";
      lado.append(dadoBtn, msgEl, Motor.botaoSom());

      // Tamanho do tabuleiro: o que sobra depois dos painéis
      const L = Math.floor(deitado ? Math.min(alt - 20, larg - 200 - 150 - 40) : Math.min(larg - 20, alt - 96 - 150 - 30));
      cel = L / 15;
      tab = document.createElement("div");
      tab.className = "ludo-tabuleiro";
      Object.assign(tab.style, { width: L + "px", height: L + "px" });
      tab.innerHTML = tabuleiroSVG(giro, ordem);
      els = {};
      ordem.forEach(l => pecas[l].forEach((_, i) => {
        // div (e não button): assim o destaque do controle só passa pelos peões que podem andar
        const b = document.createElement("div");
        b.className = "ludo-peao";
        b.setAttribute("role", "button");
        b.innerHTML = peaoSVG(l);
        b.setAttribute("aria-label", `Peão ${CORES[l].nome}`);
        b.addEventListener("click", () => tocarPeao(l, i, b));
        b.addEventListener("animationend", e => { if (e.animationName === "ludo-pulo") b.classList.remove("ludo-pulo"); });
        els[`${l},${i}`] = b;
        tab.appendChild(b);
      }));
      tela.append(jog, tab, lado);
      posicionar();
      atualizar();
      pintarDado(dado);
    }

    // Centro (x, y) do peão, em casas, já com o giro do tabuleiro
    function lugarDe(l, p, i) {
      let x, y;
      if (p === -1) { x = BASE[l][0] + VAGAS[i][0]; y = BASE[l][1] + VAGAS[i][1]; }
      else if (p <= ULTIMA) { const [r, c] = TRILHO[absoluta(l, p)]; x = c + 0.5; y = r + 0.5; }
      else if (p < FIM) { const [r, c] = RETA[l][p - 51]; x = c + 0.5; y = r + 0.5; }
      else { [x, y] = CENTRO[l]; }
      for (let k = 0; k < giro; k++) [x, y] = [15 - y, x];
      return [x, y];
    }

    const JUNTOS = [[-0.22, -0.14], [0.22, -0.14], [-0.22, 0.16], [0.22, 0.16]];
    function posicionar() {
      const grupos = new Map();
      ordem.forEach(l => pecas[l].forEach((p, i) => {
        const [x, y] = lugarDe(l, p, i);
        const k = `${x.toFixed(2)},${y.toFixed(2)}`;
        if (!grupos.has(k)) grupos.set(k, []);
        grupos.get(k).push({ l, i, p, x, y });
      }));
      grupos.forEach(g => g.forEach((o, k) => {
        const el = els[`${o.l},${o.i}`];
        if (!el) return;
        const casa = o.p === -1, junto = g.length > 1;
        const w = cel * (casa ? 1.25 : junto ? 0.72 : 0.95) * (o.p === FIM ? 0.8 : 1);
        const [dx, dy] = junto ? JUNTOS[k % 4] : [0, 0];
        const x = (o.x + dx * (g.length > 4 ? 0.8 : 1)) * cel, y = (o.y + dy) * cel;
        Object.assign(el.style, { width: w + "px", height: w * 1.2 + "px", left: x - w / 2 + "px", top: y - w * 0.82 + "px", zIndex: String(10 + Math.round(y / cel * 4) + (el.classList.contains("pode") ? 200 : 0)) });
      }));
    }

    function atualizar() {
      const l = atual();
      const podem = new Set(estado === "mover" && minhaVez() ? movs.map(m => m.peao) : []);
      ordem.forEach(k => pecas[k].forEach((p, i) => {
        const el = els[`${k},${i}`];
        if (!el) return;
        el.classList.toggle("pode", k === l && podem.has(i));
        el.classList.toggle("ultimo", ultimoAndou === `${k},${i}`);
        // Controle da TV: o destaque só passa pelos peões que podem andar (e vai sozinho para o primeiro)
        el.__clicavel = k === l && podem.has(i);
        el.classList.toggle("executar", k === l && podem.has(i) && i === Math.min(...podem));
      }));
      ordem.forEach(k => {
        const c = chips[k];
        if (!c) return;
        c.classList.toggle("da-vez", !acabou && k === l);
        c.querySelector(".qt").textContent = `🏁${pecas[k].filter(p => p === FIM).length}`;
      });
      if (dadoBtn) {
        dadoBtn.style.setProperty("--cor", CORES[l].cor);
        dadoBtn.style.setProperty("--escura", CORES[l].escura);
        dadoBtn.classList.toggle("pode", estado === "rolar" && minhaVez());
        dadoBtn.classList.toggle("executar", !(estado === "mover" && minhaVez()));
        // com o controle, o dado sai do caminho enquanto se escolhe o peão
        const fora = typeof Controle !== "undefined" && Controle.ativo() && estado === "mover" && minhaVez();
        dadoBtn.disabled = fora;
        dadoBtn.__clicavel = !fora;
        dadoBtn.tabIndex = fora ? -1 : 0;
      }
      posicionar();
    }

    function mensagem(t) { if (msgEl) msgEl.textContent = t; }
    function pintarDado(v) { if (dadoBtn) dadoBtn.innerHTML = dadoSVG(v, null, CORES[atual()].escura); }

    // ---------- Turno ----------
    async function comecarVez() {
      if (!vivo() || acabou) return;
      estado = "rolar";
      seis = 0;
      atualizar();
      const l = atual();
      if (ehHumano(l)) {
        mensagem(so1 ? "Sua vez! Toque no dado 🎲" : `Vez do ${CORES[l].nome}! Toque no dado 🎲`);
        Motor.falar(so1 ? "Sua vez! Toque no dado." : `Vez do ${CORES[l].nome}! Toque no dado.`);
      } else {
        mensagem(`Vez do ${CORES[l].nome} 🤖`);
        Motor.falar(`Vez do ${CORES[l].nome}.`);
        await espera(1100);
        rolar();
      }
    }
    async function jogarDeNovo(frase) {
      if (!vivo() || acabou) return;
      estado = "rolar";
      atualizar();
      const l = atual();
      mensagem(`${frase} ${ehHumano(l) ? "Toque no dado 🎲" : ""}`);
      Motor.falar(frase, { naFila: true });
      if (!ehHumano(l)) { await espera(1300); rolar(); }
    }
    function passarVez() {
      if (!vivo() || acabou) return;
      vez = (vez + 1) % n;
      comecarVez();
    }

    function tocarDado() {
      if (acabou) return;
      if (!minhaVez()) { Motor.animar(dadoBtn, "balanca"); return; }
      if (estado === "mover") { Motor.animar(dadoBtn, "balanca"); Motor.falar("Agora escolha um peão que está brilhando!"); return; }
      if (estado === "rolar") rolar();
    }

    async function rolar() {
      if (!vivo() || acabou || estado !== "rolar") return;
      estado = "rolando";
      atualizar();
      const l = atual();
      const valor = (teste && teste.dados && teste.dados.length) ? teste.dados.shift() : Motor.aleatorio(1, 6);
      dadoBtn.classList.add("rolando");
      for (let k = 0; k < 8; k++) {
        pintarDado(Motor.aleatorio(1, 6));
        Motor.ruido({ dur: 0.04, vol: 0.18, filtro: "highpass", freq: 2200 });
        await espera(65);
        if (!vivo()) return;
      }
      dadoBtn.classList.remove("rolando");
      dado = valor;
      pintarDado(valor);
      Motor.nota(valor === 6 ? 880 : 620, { dur: 0.18, tipo: "triangle", vol: 0.22 });
      Motor.animar(dadoBtn, "pula");
      if (valor === 6) seis++; else seis = 0;
      const falaDado = Motor.maiuscula(NUM[valor]) + "!";

      if (valor === 6 && seis === 3 && op.tres6 === "perde") {
        mensagem("Três 6 seguidos: perdeu a vez! 😮");
        Motor.falar(`${falaDado} Três seis seguidos! Perdeu a vez.`);
        await espera(2200);
        return passarVez();
      }
      movs = movimentos(pecas, ordem, l, valor, op);
      if (!movs.length) {
        const preso = pecas[l].every(p => p === -1 || p === FIM);
        const frase = preso && valor !== 6 ? (op.sair === "16" ? "Precisa de 1 ou 6 para sair de casa." : "Precisa de 6 para sair de casa.") : "Não dá para andar.";
        mensagem(`${NUM[valor].toUpperCase()}: ${frase}`);
        Motor.falar(`${falaDado} ${frase}`);
        await espera(1900);
        if (!vivo()) return;
        return valor === 6 ? jogarDeNovo("Tirou seis: joga de novo!") : passarVez();
      }
      if (ehHumano(l)) {
        estado = "mover";
        mensagem(`Tirou ${valor}! Toque num peão que brilha ✨`);
        Motor.falar(movs.length > 1 && new Set(movs.map(m => m.de)).size > 1 ? `${falaDado} Escolha um peão.` : `${falaDado} Toque no peão.`);
        atualizar();
        if (teste && teste.aoEscolher) teste.aoEscolher();
      } else {
        mensagem(`Tirou ${valor}!`);
        Motor.falar(falaDado);
        await espera(900);
        if (!vivo()) return;
        executar(escolherMovimento(pecas, ordem, l, movs, op.nivel));
      }
    }

    function tocarPeao(l, i, el) {
      if (acabou) return;
      if (minhaVez() && estado === "mover" && l === atual()) {
        const m = movs.find(x => x.peao === i);
        if (m) { executar(m); return; }
        Motor.animar(el, "balanca");
        Motor.falar("Esse peão não pode andar agora. Escolha um que está brilhando!");
        return;
      }
      Motor.animar(el, "balanca");
      if (minhaVez() && estado === "rolar" && l === atual()) { Motor.falar("Primeiro toque no dado!"); Motor.animar(dadoBtn, "pula"); }
    }

    async function executar(m) {
      if (!vivo() || acabou || !m) return;
      estado = "andando";
      movs = [];
      const l = atual();
      const chave = `${l},${m.peao}`;
      ultimoAndou = chave;
      atualizar();
      if (m.de === -1) {
        pecas[l][m.peao] = 0;
        posicionar();
        Motor.animar(els[chave], "ludo-pulo");
        Motor.nota(523, { dur: 0.15, tipo: "triangle", vol: 0.25 });
        Motor.nota(784, { dur: 0.2, tipo: "triangle", vol: 0.25, inicio: 0.1 });
        Motor.falar(ehHumano(l) && so1 ? "Saiu de casa!" : `O ${CORES[l].nome} saiu de casa!`);
        await espera(500);
      } else {
        for (let p = m.de + 1; p <= m.para; p++) {
          pecas[l][m.peao] = p;
          posicionar();
          if (els[chave]) Motor.animar(els[chave], "ludo-pulo");
          Motor.nota(330 + (p - m.de) * 70, { dur: 0.1, tipo: "triangle", vol: 0.2 });
          await espera(200);
          if (!vivo()) return;
        }
      }
      if (!vivo()) return;
      let extra = false;
      if (m.capt.length) {
        m.capt.forEach(o => {
          pecas[o.lugar][o.i] = -1;
          const el = els[`${o.lugar},${o.i}`];
          if (el) { el.classList.add("voltando"); setTimeout(() => el.classList.remove("voltando"), 700); }
        });
        posicionar();
        Motor.nota(600, { dur: 0.4, vol: 0.25, ate: 150 });
        const vitima = m.capt[0].lugar;
        const fala = ehHumano(l) && so1 ? `Você capturou o peão do ${CORES[vitima].nome}! Ele volta para casa.`
          : ehHumano(vitima) && so1 ? `O ${CORES[l].nome} capturou o seu peão! Ele volta para casa.`
          : `O ${CORES[l].nome} capturou o ${CORES[vitima].nome}! Volta para casa.`;
        mensagem("Capturou! 💥 Volta para casa!");
        Motor.falar(fala);
        if (ehHumano(l)) Motor.comemorar(els[chave] || tab, false);
        await espera(1500);
        if (op.bonus === "sim") extra = true;
      }
      if (m.para === FIM) {
        Motor.tim();
        const fala = ehHumano(l) && so1 ? "Chegou ao centro!" : `O peão ${CORES[l].nome} chegou ao centro!`;
        Motor.falar(fala, { naFila: !!m.capt.length });
        mensagem("Chegou ao centro! 🏁");
        if (els[chave]) Motor.comemorar(els[chave], false);
        if (op.bonus === "sim") extra = true;
        await espera(1100);
      }
      if (!vivo()) return;
      atualizar();
      if (pecas[l].every(p => p === FIM)) return fim(l);
      if (dado === 6) return jogarDeNovo("Tirou seis: joga de novo!");
      if (extra) { seis = 0; return jogarDeNovo("Ganhou mais uma jogada!"); }
      passarVez();
    }

    // ---------- Fim ----------
    function fim(vencedor) {
      acabou = true;
      estado = "fim";
      atualizar();
      const ganhei = ehHumano(vencedor);
      Motor.tim();
      Motor.comemorar(tab, ganhei);
      let frase;
      if (so1) frase = ganhei ? "Você ganhou!" : `O ${CORES[vencedor].nome} ganhou desta vez!`;
      else frase = `O ${CORES[vencedor].nome} ganhou!`;
      mensagem("🏆 " + frase);
      let fala = frase;
      const temRobo = ordem.some(l => !ehHumano(l));
      if (so1 && temRobo) {
        const seq = Placar.resultado("ludo", ganhei ? { id: "voce", rotulo: "🧒 Você" } : { id: `robo-${op.nivel}`, rotulo: `🤖 ${NIVEIS[op.nivel]}` });
        if (seq.novaMelhorSequencia) fala += ` ${seq.sequencia} vitórias seguidas! É o seu recorde!`;
        else if (ganhei && seq.sequencia > 1) fala += ` São ${seq.sequencia} vitórias seguidas!`;
      }
      Motor.falar(fala);
      // Classificação: peões no centro, depois o quanto andaram
      const progresso = l => pecas[l].reduce((s, p) => s + p + 1, 0);
      const classif = ordem.slice().sort((a, b) => (a === vencedor ? -1 : b === vencedor ? 1 : progresso(b) - progresso(a)));
      Motor.depois(() => {
        if (!vivo()) return;
        area.innerHTML = "";
        const caixa = document.createElement("div");
        caixa.className = "fim ludo-fim";
        const trofeu = document.createElement("div");
        trofeu.className = "trofeu";
        trofeu.innerHTML = `<span class="ludo-trofeu">${peaoSVG(vencedor)}</span>🏆`;
        const resumo = document.createElement("div");
        resumo.className = "resumo";
        resumo.textContent = frase;
        const lista = document.createElement("div");
        lista.className = "ludo-classif";
        classif.forEach((l, k) => {
          const it = document.createElement("div");
          it.className = "ludo-pos";
          it.style.setProperty("--cor", CORES[l].cor);
          it.innerHTML = `<b>${k + 1}º</b><span class="mini">${peaoSVG(l)}</span><span></span><span class="qt">🏁 ${pecas[l].filter(p => p === FIM).length}</span>`;
          it.children[2].textContent = rotulo(l);
          lista.appendChild(it);
        });
        caixa.append(trofeu, resumo, lista);
        if (so1 && temRobo) caixa.appendChild(Placar.painel("ludo"));
        const botoes = document.createElement("div");
        botoes.className = "mesa-botoes ludo-botoes";
        const denovo = document.createElement("button");
        denovo.className = "modo jogar";
        denovo.innerHTML = `<span class="icone">🔁</span><span class="rotulo">Jogar de novo</span>`;
        denovo.addEventListener("click", () => partida(area, op, faixa));
        const opc = document.createElement("button");
        opc.className = "chip";
        opc.textContent = "⚙️ Opções";
        opc.addEventListener("click", () => opcoes(area, faixa));
        botoes.append(denovo, opc);
        caixa.appendChild(botoes);
        area.appendChild(caixa);
        if (ganhei || !so1) Motor.comemorar(trofeu, false);
      }, 2600 * Math.max(VEL, 0.3));
    }

    // Girou o celular: desenha de novo (o estado continua)
    let esperaTam = null;
    const aoRedimensionar = () => {
      if (!vivo()) { window.removeEventListener("resize", aoRedimensionar); return; }
      clearTimeout(esperaTam);
      esperaTam = setTimeout(() => { if (vivo() && !acabou) desenhar(); }, 200);
    };
    window.addEventListener("resize", aoRedimensionar);

    if (teste) Object.assign(teste, { estado: () => ({ pecas, vez, atual: atual(), estado, movs, acabou, dado, ordem }) });

    desenhar();
    comecarVez();
  }

  // Para testes
  if (typeof globalThis !== "undefined") globalThis.LudoTeste = { movimentos, escolherMovimento, absoluta, TRILHO, SEGURAS };
})();
