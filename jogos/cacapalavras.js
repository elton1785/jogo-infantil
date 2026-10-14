// Caça-palavras — achar as palavras escondidas na grade passando o dedo por cima
// (ou tocando na primeira e na última letra). Cada palavra tem figura e a voz fala o nome.
(() => {
  // Direções [dx, dy]: → ↓ ↘ ↗
  const DIRECOES = {
    "5-6":  { lado: 6,  quantas: 4, dirs: [[1, 0]] },
    "6-8":  { lado: 8,  quantas: 6, dirs: [[1, 0], [0, 1]] },
    "8-10": { lado: 10, quantas: 8, dirs: [[1, 0], [0, 1], [1, 1], [1, -1]] },
  };
  const LETRAS_SOLTAS = "AAABCDEEFGILMNOOPRSTUV";
  const CORES = ["#ffadad", "#ffd6a5", "#fdffb6", "#caffbf", "#9bf6ff", "#a0c4ff", "#bdb2ff", "#ffc6ff"];

  // Na grade as letras ficam sem acento (como nas revistinhas): MAÇÃ → MACA
  const semAcento = t => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

  // Banco de palavras: as da trilha de leitura e, para os maiores, as figuras com nomes longos
  function banco(faixa) {
    const curtas = PALAVRAS.filter(p => p.silabas.length === 2).map(p => ({ palavra: p.palavra, emoji: p.emoji }));
    if (faixa === "5-6") return curtas;
    const todas = PALAVRAS.map(p => ({ palavra: p.palavra, emoji: p.emoji }));
    if (faixa === "6-8") return todas;
    return [...todas, ...FIGURAS.map(f => ({ palavra: f.nome, emoji: f.emoji }))];
  }

  // Tenta esconder as palavras; devolve null se não couberem (aí sorteia de novo)
  function montarGrade(lado, palavras, dirs) {
    const grade = Array.from({ length: lado }, () => Array(lado).fill(null));
    const colocadas = [];
    for (const p of palavras) {
      const letras = semAcento(p.palavra);
      let ok = false;
      for (let tentativa = 0; tentativa < 200 && !ok; tentativa++) {
        const [dx, dy] = Motor.sortear(dirs);
        const x0 = Motor.aleatorio(0, lado - 1), y0 = Motor.aleatorio(0, lado - 1);
        const x1 = x0 + dx * (letras.length - 1), y1 = y0 + dy * (letras.length - 1);
        if (x1 < 0 || x1 >= lado || y1 < 0 || y1 >= lado) continue;
        let cabe = true;
        for (let i = 0; i < letras.length && cabe; i++) {
          const atual = grade[y0 + dy * i][x0 + dx * i];
          if (atual && atual !== letras[i]) cabe = false;
        }
        if (!cabe) continue;
        for (let i = 0; i < letras.length; i++) grade[y0 + dy * i][x0 + dx * i] = letras[i];
        colocadas.push({ ...p, letras });
        ok = true;
      }
      if (!ok) return null;
    }
    for (const linha of grade) for (let x = 0; x < lado; x++) if (!linha[x]) linha[x] = Motor.sortear([...LETRAS_SOLTAS]);
    return { grade, colocadas };
  }

  // Escolhe palavras que não estejam umas dentro das outras (PATO / SAPATO)
  function escolherPalavras(lista, quantas, lado) {
    const escolhidas = [];
    for (const p of Motor.embaralhar(lista)) {
      const l = semAcento(p.palavra);
      if (l.length > lado) continue;
      if (escolhidas.some(e => { const o = semAcento(e.palavra); return o.includes(l) || l.includes(o); })) continue;
      escolhidas.push(p);
      if (escolhidas.length === quantas) break;
    }
    return escolhidas;
  }

  JOGOS.push({
    id: "caca-palavras",
    nome: "Caça-palavras",
    icone: "🔎",
    faixas: ["5-6", "6-8", "8-10"],
    iniciar(area, faixa) {
      const cfg = DIRECOES[faixa && faixa.id] || DIRECOES["6-8"];
      const lista = banco(faixa && faixa.id);

      function jogo() {
        area.innerHTML = "";
        let montado = null;
        while (!montado) montado = montarGrade(cfg.lado, escolherPalavras(lista, cfg.quantas, cfg.lado), cfg.dirs);
        const { grade, colocadas } = montado;
        const n = cfg.lado;
        let achadas = 0, corVez = 0;

        // Tamanho: grade ao lado da lista (deitado) ou acima dela (em pé)
        const larg = window.innerWidth - 32, alt = window.innerHeight - 112;
        const deitado = larg > alt;
        const ladoPx = Math.min(deitado ? Math.min(alt, larg * 0.62) : Math.min(larg, alt * 0.62), 620);
        const cel = ladoPx / n;

        const tab = document.createElement("div");
        tab.className = "caca-grade";
        Object.assign(tab.style, { width: ladoPx + "px", height: ladoPx + "px", gridTemplateColumns: `repeat(${n}, 1fr)`, fontSize: cel * 0.55 + "px" });
        const celulas = grade.map((linha, y) => linha.map((letra, x) => {
          const el = document.createElement("div");
          el.className = "caca-letra";
          el.textContent = letra;
          el.dataset.x = x;
          el.dataset.y = y;
          tab.appendChild(el);
          return el;
        }));

        const listaEl = document.createElement("div");
        listaEl.className = "caca-lista";
        colocadas.forEach(p => {
          const b = document.createElement("button");
          b.className = "caca-palavra";
          b.innerHTML = `<span class="fig"></span><span class="txt"></span>`;
          b.querySelector(".fig").textContent = p.emoji;
          b.querySelector(".txt").textContent = p.palavra.toUpperCase();
          b.addEventListener("click", () => { Motor.animar(b, "pula"); Motor.falar(p.palavra); });
          p.botao = b;
          listaEl.appendChild(b);
        });

        // ---------- Selecionar com o dedo ----------
        const celulaEm = (cx, cy) => {
          const r = tab.getBoundingClientRect();
          const x = Math.floor((cx - r.left) / cel), y = Math.floor((cy - r.top) / cel);
          return x >= 0 && x < n && y >= 0 && y < n ? { x, y } : null;
        };

        // Linha reta do início até perto do dedo, presa às 8 direções
        function linha(a, b) {
          const dx = b.x - a.x, dy = b.y - a.y;
          if (!dx && !dy) return [a];
          const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
          const sx = Math.round(Math.cos(ang)), sy = Math.round(Math.sin(ang));
          let len = Math.max(Math.abs(dx), Math.abs(dy));
          while (len > 0 && (a.x + sx * len < 0 || a.x + sx * len >= n || a.y + sy * len < 0 || a.y + sy * len >= n)) len--;
          return Array.from({ length: len + 1 }, (_, i) => ({ x: a.x + sx * i, y: a.y + sy * i }));
        }

        let inicio = null, caminho = [], arrastou = false, primeiroToque = null;
        const marcar = cs => {
          tab.querySelectorAll(".marcando").forEach(e => e.classList.remove("marcando"));
          cs.forEach(c => celulas[c.y][c.x].classList.add("marcando"));
        };

        function conferir(cs) {
          marcar([]);
          if (cs.length < 2) return;
          const texto = cs.map(c => grade[c.y][c.x]).join("");
          const inverso = [...texto].reverse().join("");
          const p = colocadas.find(p => !p.achada && (p.letras === texto || p.letras === inverso));
          if (!p) {
            cs.forEach(c => Motor.animar(celulas[c.y][c.x], "balanca"));
            return;
          }
          p.achada = true;
          achadas++;
          const cor = CORES[corVez++ % CORES.length];
          cs.forEach(c => { const e = celulas[c.y][c.x]; e.classList.add("achada"); e.style.background = cor; });
          p.botao.classList.add("achada");
          p.botao.style.background = cor;
          Motor.tim();
          Motor.comemorar(p.botao);
          if (achadas === colocadas.length) {
            Motor.falar(p.palavra).then(() => Motor.falar(`${Motor.elogio()} Você achou todas as palavras!`))
              .then(() => Motor.depois(jogo, 1500));
          } else {
            Motor.falar(p.palavra);
          }
        }

        tab.addEventListener("pointerdown", e => {
          const c = celulaEm(e.clientX, e.clientY);
          if (!c) return;
          try { tab.setPointerCapture(e.pointerId); } catch (err) { /* ponteiro já liberado */ }
          inicio = c;
          arrastou = false;
          caminho = [c];
          marcar(primeiroToque ? linha(primeiroToque, c) : caminho);
        });
        tab.addEventListener("pointermove", e => {
          if (!inicio) return;
          const c = celulaEm(e.clientX, e.clientY);
          if (!c || (c.x === inicio.x && c.y === inicio.y && !arrastou)) return;
          arrastou = true;
          primeiroToque = null;
          caminho = linha(inicio, c);
          marcar(caminho);
        });
        const soltar = () => {
          if (!inicio) return;
          const c = inicio;
          inicio = null;
          if (arrastou) return conferir(caminho);
          // Toque simples: 1º toque marca o começo, 2º toque marca o fim
          if (!primeiroToque) {
            primeiroToque = c;
            marcar([c]);
            return;
          }
          const cs = linha(primeiroToque, c);
          primeiroToque = null;
          conferir(cs);
        };
        tab.addEventListener("pointerup", soltar);
        tab.addEventListener("pointercancel", () => { inicio = null; primeiroToque = null; marcar([]); });

        const mesa = document.createElement("div");
        mesa.className = "mesa";
        mesa.append(tab, listaEl);
        area.appendChild(mesa);
        Motor.falar(`Ache as ${NUMEROS_FALADOS[colocadas.length] || colocadas.length} palavras escondidas! Passe o dedo por cima das letras.`);
      }

      jogo();
    },
  });
})();
