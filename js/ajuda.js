// "❓ Como jogar": explicação ilustrada dos jogos que têm regras. Um jogo ganha a explicação
// quando tem o campo `ajuda` (os textos ficam em jogos/como-jogar.js):
//   ajuda: [{ figura, texto }, ...]   ou   ajuda: faixa => [...] (ou null: sem explicação)
// `figura`: emoji, SVG, ou uma lista delas (mostradas lado a lado com uma setinha entre elas).
// Para desenhar figuras: Ajuda.grade (tabuleiro em miniatura), Ajuda.domino e Ajuda.torres.
// O App mostra o botão ❓ na tela inicial do jogo e abre a explicação sozinho na 1ª vez.
const Ajuda = (() => {
  // ---------- Figuras ----------
  // Tabuleiro: `linhas` são textos, um caractere por casa; `legenda` diz como desenhar cada
  // caractere: { fundo, txt, cor, redondo }. "." (ou o que não estiver na legenda) é casa vazia.
  // `opcoes`: { fundo (cor das casas vazias), borda, cel (tamanho), linha: [[r, c], ...] }
  // (`linha` desenha um traço passando pelas casas, para mostrar "3 em linha" etc.)
  function grade(linhas, legenda = {}, opcoes = {}) {
    const { fundo = "#f3efe3", borda = "#6b5b45", cel = 22, linha } = opcoes;
    const L = linhas.length, C = Math.max(...linhas.map(l => [...l].length));
    const w = C * cel + 4, h = L * cel + 4;
    let s = `<svg viewBox="0 0 ${w} ${h}" style="width:${Math.min(w * 1.6, 220)}px" aria-hidden="true"><rect x="0" y="0" width="${w}" height="${h}" rx="5" fill="${borda}"/>`;
    linhas.forEach((l, r) => [...l].forEach((ch, c) => {
      const d = legenda[ch] || {};
      const x = 2 + c * cel, y = 2 + r * cel;
      const cor = d.fundo || (typeof fundo === "function" ? fundo(r, c) : fundo);
      if (d.redondo) {
        s += `<rect x="${x + 1}" y="${y + 1}" width="${cel - 2}" height="${cel - 2}" rx="3" fill="${typeof fundo === "function" ? fundo(r, c) : fundo}"/>`;
        s += `<circle cx="${x + cel / 2}" cy="${y + cel / 2}" r="${cel * 0.38}" fill="${d.redondo}"${d.contorno ? ` stroke="${d.contorno}" stroke-width="1.5"` : ""}/>`;
      } else s += `<rect x="${x + 1}" y="${y + 1}" width="${cel - 2}" height="${cel - 2}" rx="3" fill="${cor}"/>`;
      if (d.txt) s += `<text x="${x + cel / 2}" y="${y + cel / 2 + cel * 0.24}" font-size="${cel * 0.66}" font-weight="bold" text-anchor="middle" fill="${d.cor || "#333"}" font-family="sans-serif">${d.txt}</text>`;
    }));
    if (linha) {
      const p = linha.map(([r, c]) => `${2 + c * cel + cel / 2},${2 + r * cel + cel / 2}`).join(" ");
      s += `<polyline points="${p}" fill="none" stroke="#e63946" stroke-width="${cel * 0.22}" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>`;
    }
    return s + "</svg>";
  }

  // Pedra de dominó deitada (a | b). `destaque`: contorno colorido.
  const PONTOS = { 0: [], 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function domino(a, b, { destaque } = {}) {
    const metade = (n, ox) => PONTOS[n].map(k => `<circle cx="${ox + 6 + (k % 3) * 8}" cy="${6 + Math.floor(k / 3) * 8}" r="2.3" fill="#222"/>`).join("");
    return `<svg viewBox="-2 -2 60 32" style="width:96px" aria-hidden="true"><rect x="0" y="0" width="56" height="28" rx="5" fill="#fffdf6" stroke="${destaque || "#3a3a3a"}" stroke-width="${destaque ? 3 : 2}"/><line x1="28" y1="3" x2="28" y2="25" stroke="#3a3a3a" stroke-width="1.5"/><g transform="translate(0 2)">${metade(a, 0)}${metade(b, 28)}</g></svg>`;
  }

  // Torre de Hanói: `torres` = [[3, 2, 1], [], []] (tamanhos dos discos, de baixo para cima)
  function torres(lista) {
    const CORES = ["#ffd60a", "#f77f00", "#e63946", "#2a9d55", "#277da1"];
    let s = '<svg viewBox="0 0 120 60" style="width:170px" aria-hidden="true"><rect x="2" y="52" width="116" height="6" rx="3" fill="#8d5524"/>';
    lista.forEach((t, i) => {
      const cx = 20 + i * 40;
      s += `<rect x="${cx - 1.5}" y="12" width="3" height="40" rx="1.5" fill="#a0673a"/>`;
      t.forEach((d, k) => { const w = 8 + d * 7; s += `<rect x="${cx - w / 2}" y="${44 - k * 8}" width="${w}" height="7" rx="3" fill="${CORES[d - 1]}"/>`; });
    });
    return s + "</svg>";
  }

  // ---------- Janela ----------
  const vistas = () => { try { return JSON.parse(localStorage.getItem("ajuda-vista")) || []; } catch (e) { return []; } };
  const jaViu = jogo => vistas().includes(jogo.id);
  function marcarVista(jogo) {
    try { localStorage.setItem("ajuda-vista", JSON.stringify([...new Set([...vistas(), jogo.id])])); } catch (e) { /* ok */ }
  }

  function figuraHTML(f) {
    const parte = x => (String(x).startsWith("<svg") ? x : `<span class="ajuda-emoji">${x}</span>`);
    return Array.isArray(f) ? f.map(parte).join('<span class="ajuda-seta">➜</span>') : parte(f);
  }

  // Passos da explicação do jogo para a faixa (null se não tiver)
  function passosDe(jogo, faixa) {
    const a = typeof jogo.ajuda === "function" ? jogo.ajuda(faixa) : jogo.ajuda;
    return a && a.length ? a : null;
  }

  // Abre a explicação por cima do jogo; lê os passos em voz alta (tocar num passo lê só ele)
  function abrir(jogo, passos, onde) {
    fechar();
    marcarVista(jogo);
    const fundo = document.createElement("div");
    fundo.className = "ajuda-fundo";
    const caixa = document.createElement("div");
    caixa.className = "ajuda-caixa";
    const titulo = document.createElement("div");
    titulo.className = "ajuda-titulo";
    titulo.textContent = `❓ Como jogar: ${jogo.nome}`;
    const lista = document.createElement("div");
    lista.className = "ajuda-passos";
    const itens = passos.map((p, i) => {
      const el = document.createElement("button");
      el.className = "ajuda-passo";
      el.innerHTML = `<span class="ajuda-num">${i + 1}</span><span class="ajuda-figura">${figuraHTML(p.figura)}</span><span class="ajuda-texto"></span>`;
      el.querySelector(".ajuda-texto").textContent = p.texto;
      el.addEventListener("click", () => { lerDe(i, true); });
      lista.appendChild(el);
      return el;
    });
    const acoes = document.createElement("div");
    acoes.className = "ajuda-acoes";
    const ouvir = document.createElement("button");
    ouvir.className = "chip";
    ouvir.textContent = "🔊 Ouvir tudo";
    ouvir.addEventListener("click", () => lerDe(0));
    const ok = document.createElement("button");
    ok.className = "chip jogar";
    ok.textContent = "✅ Entendi, vamos jogar!";
    ok.addEventListener("click", () => { fechar(); Motor.falar("Vamos jogar!"); });
    acoes.append(ouvir, ok);
    caixa.append(titulo, lista, acoes);
    fundo.appendChild(caixa);
    fundo.addEventListener("click", e => { if (e.target === fundo) fechar(); });
    (onde || document.body).appendChild(fundo);

    // Leitura: destaca o passo que está sendo lido. Cada leitura nova cancela a anterior.
    let leitura = 0;
    async function lerDe(i, soEste) {
      const minha = ++leitura;
      for (let k = i; k < itens.length; k++) {
        if (minha !== leitura || !document.contains(fundo)) return;
        itens.forEach((el, j) => el.classList.toggle("lendo", j === k));
        itens[k].scrollIntoView({ block: "nearest", behavior: "smooth" });
        await Motor.falar(passos[k].texto);
        if (soEste) break;
      }
      if (minha === leitura) itens.forEach(el => el.classList.remove("lendo"));
    }
    fundo.pararLeitura = () => { leitura++; };
    Motor.falar(`Como jogar ${jogo.nome}.`).then(() => { if (document.contains(fundo)) lerDe(0); });
  }

  function fechar() {
    const abertas = document.querySelectorAll(".ajuda-fundo");
    abertas.forEach(f => { if (f.pararLeitura) f.pararLeitura(); f.remove(); });
    if (abertas.length && "speechSynthesis" in window) speechSynthesis.cancel();
  }
  const aberta = () => !!document.querySelector(".ajuda-fundo");

  return { grade, domino, torres, passosDe, abrir, fechar, aberta, jaViu };
})();
