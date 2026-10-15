// Robô Programador — monta um programa (sequência de comandos) e o robô executa até a estrela.
// - 5 a 6 anos: setas (⬆️⬇️⬅️➡️), cada uma anda uma casa naquela direção.
// - 6 a 8 anos: setas + moedas para pegar antes da estrela.
// - 8 a 10 anos: comandos "de robô": andar para a frente, virar à esquerda, virar à direita.
// Tocar num comando do programa faz ele repetir (×2, ×3, ×4): é a ideia de laço (repetição).
// Estrelas: 3 se usar o mínimo de comandos possível (calculado pelo jogo para cada fase).
(() => {
  const DIR = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // cima, direita, baixo, esquerda
  const SETA = ["⬆️", "➡️", "⬇️", "⬅️"];
  const CONFIG = {
    "5-6":  { modo: "setas", moedas: 0 },
    "6-8":  { modo: "setas", moedas: 2 },
    "8-10": { modo: "robo", moedas: 2 },
  };
  const COMANDOS = {
    setas: [0, 1, 2, 3].map(d => ({ id: `s${d}`, icone: SETA[d], nome: ["cima", "direita", "baixo", "esquerda"][d] })),
    robo: [{ id: "andar", icone: svgCmd("andar"), nome: "andar", rotulo: "andar" }, { id: "esq", icone: svgCmd("esq"), nome: "virar à esquerda", rotulo: "esquerda" }, { id: "dir", icone: svgCmd("dir"), nome: "virar à direita", rotulo: "direita" }],
  };
  // Ícones do modo "robô": andar para a frente e virar no lugar. Virar à esquerda é girar ao
  // contrário do relógio (seta azul que termina apontando para a esquerda); à direita, no
  // sentido do relógio (laranja). Não usamos ↩️ ↪️, que parecem "desfazer".
  function svgCmd(tipo) {
    if (tipo === "andar") return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 42V14" stroke="#2a9d55" stroke-width="7" stroke-linecap="round"/><path d="M11 20 24 5 37 20Z" fill="#2a9d55" stroke="#2a9d55" stroke-width="3" stroke-linejoin="round"/></svg>';
    const esq = tipo === "esq", cor = esq ? "#277da1" : "#f77f00";
    const arco = esq ? "M11 26A13 13 0 1 0 24 13" : "M37 26A13 13 0 1 1 24 13";
    const ponta = esq ? "15,13 26,4.5 26,21.5" : "33,13 22,4.5 22,21.5";
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="${arco}" fill="none" stroke="${cor}" stroke-width="6" stroke-linecap="round"/><polygon points="${ponta}" fill="${cor}" stroke="${cor}" stroke-width="2" stroke-linejoin="round"/><text x="24" y="31" font-size="13" text-anchor="middle">🤖</text></svg>`;
  }
  const pintarIcone = (el, c) => { if (c.icone.startsWith("<svg")) el.innerHTML = c.icone; else el.textContent = c.icone; };
  const MAX_VEZES = 4;
  const nivelSalvo = id => { try { return +localStorage.getItem(`robo-nivel-${id}`) || 1; } catch (e) { return 1; } };
  const salvarNivel = (id, n) => { try { localStorage.setItem(`robo-nivel-${id}`, n); } catch (e) { /* ok */ } };

  // Um passo de um comando: devolve o novo estado { x, y, d } (sem checar parede)
  function passo(st, cmd) {
    if (cmd === "esq") return { ...st, d: (st.d + 3) % 4 };
    if (cmd === "dir") return { ...st, d: (st.d + 1) % 4 };
    const d = cmd === "andar" ? st.d : +cmd.slice(1);
    return { x: st.x + DIR[d][0], y: st.y + DIR[d][1], d: cmd === "andar" ? st.d : d };
  }

  // Menor número de comandos (fichas) para resolver: busca com custo 1 por ficha nova.
  // Estado: posição, direção, moedas pegas, último comando e quantas vezes ele já repetiu.
  function minimo(fase) {
    const { n, pedras, moedas, inicio, estrela, modo } = fase;
    const livre = (x, y) => x >= 0 && y >= 0 && x < n && y < n && !pedras.has(`${x},${y}`);
    const cmds = COMANDOS[modo].map(c => c.id);
    const todas = (1 << moedas.length) - 1;
    const chave = s => `${s.x},${s.y},${s.d},${s.m},${s.u},${s.v}`;
    let fila = [{ x: inicio.x, y: inicio.y, d: inicio.d, m: 0, u: "", v: 0 }];
    const visto = new Set([chave(fila[0])]);
    // Busca em camadas de custo 0 (repetir o mesmo comando) e custo 1 (ficha nova)
    for (let custo = 0; custo < 40 && fila.length; custo++) {
      const proxima = [];
      const camada = fila.slice();
      for (let i = 0; i < camada.length; i++) {
        const s = camada[i];
        if (s.m === todas && s.x === estrela.x && s.y === estrela.y && s.u) return custo;
        for (const c of cmds) {
          const mesmo = c === s.u && s.v < MAX_VEZES;
          const p = passo(s, c);
          if (!livre(p.x, p.y)) continue;
          const k = moedas.findIndex(q => q.x === p.x && q.y === p.y);
          const novo = { ...p, m: k >= 0 ? s.m | (1 << k) : s.m, u: c, v: mesmo ? s.v + 1 : 1 };
          const ch = chave(novo);
          if (visto.has(ch)) continue;
          visto.add(ch);
          if (mesmo) camada.push(novo); else proxima.push(novo);
        }
      }
      fila = proxima;
    }
    return null;
  }

  // Fase aleatória, com caminho garantido; cresce com o nível
  function gerarFase(nivel, cfg) {
    const n = Math.min(4 + Math.floor((nivel - 1) / 3), 7);
    for (let tentativa = 0; tentativa < 200; tentativa++) {
      const ocupadas = new Set();
      const sorteio = () => { let p; do { p = { x: Motor.aleatorio(0, n - 1), y: Motor.aleatorio(0, n - 1) }; } while (ocupadas.has(`${p.x},${p.y}`)); ocupadas.add(`${p.x},${p.y}`); return p; };
      const inicio = { ...sorteio(), d: cfg.modo === "robo" ? Motor.aleatorio(0, 3) : 0 };
      const estrela = sorteio();
      if (Math.abs(estrela.x - inicio.x) + Math.abs(estrela.y - inicio.y) < Math.min(2 + nivel, n)) continue;
      // Moedas a partir do nível 2 (uma, depois duas)
      const qtdMoedas = cfg.moedas && nivel > 1 ? Math.min(cfg.moedas, 1 + Math.floor(nivel / 4)) : 0;
      const moedas = Array.from({ length: qtdMoedas }, sorteio);
      const pedras = new Set();
      const qtd = Math.min(Math.floor(n * n * 0.12) + Math.floor(nivel / 2), Math.floor(n * n * 0.3));
      for (let i = 0; i < qtd; i++) { const p = sorteio(); pedras.add(`${p.x},${p.y}`); }
      const fase = { n, pedras, moedas, inicio, estrela, modo: cfg.modo };
      const min = minimo(fase);
      if (min && min >= Math.min(2 + Math.floor(nivel / 2), 6) && min <= 12) return { ...fase, min };
    }
    return null;
  }

  JOGOS.push({
    id: "robo",
    nome: "Robô Programador",
    icone: "🤖",
    faixas: ["5-6", "6-8", "8-10"],
    iniciar(area, faixa) {
      const id = (faixa && faixa.id) || "6-8";
      const cfg = CONFIG[id] || CONFIG["6-8"];
      let nivel = nivelSalvo(id);
      let fase, programa, rodando, robo, pegas;

      function novaFase() {
        fase = gerarFase(nivel, cfg) || gerarFase(Math.max(1, nivel - 2), cfg) || gerarFase(1, cfg);
        programa = [];
        reiniciarRobo();
        desenhar();
        Motor.falar(nivel === 1
          ? (cfg.modo === "robo"
            ? "Programe o robô até a estrela! Ele anda para a frente e vira para a esquerda ou para a direita. Toque nos comandos e depois no play."
            : "Programe o robô até a estrela! Toque nas setas para montar o caminho e depois no play.")
          : `Nível ${nivel}!` + (fase.moedas.length ? " Pegue as moedas antes da estrela!" : ""));
      }
      function reiniciarRobo() { robo = { ...fase.inicio }; pegas = new Set(); rodando = false; }

      let celula = 40, tab, roboEl, progEl;

      function desenhar() {
        area.innerHTML = "";
        const tela = document.createElement("div");
        tela.className = "robo-tela";
        area.appendChild(tela);
        const larg = tela.clientWidth, alt = tela.clientHeight;
        const deitado = larg > alt;
        tela.classList.toggle("deitado", deitado);

        const topo = document.createElement("div");
        topo.className = "robo-topo";
        const info = document.createElement("div");
        info.className = "cubo-info";
        info.textContent = `🤖 Nível ${nivel}` + (fase.moedas.length ? ` · 🪙 ${pegas.size}/${fase.moedas.length}` : "");
        topo.appendChild(info);

        // Tabuleiro
        const lado = Math.floor(Math.min(deitado ? alt - 70 : larg, deitado ? larg * 0.5 : alt * 0.5) / fase.n) * fase.n;
        celula = lado / fase.n;
        tab = document.createElement("div");
        tab.className = "robo-tabuleiro";
        Object.assign(tab.style, { width: lado + "px", height: lado + "px", gridTemplateColumns: `repeat(${fase.n}, 1fr)`, gridTemplateRows: `repeat(${fase.n}, 1fr)`, fontSize: celula * 0.62 + "px" });
        for (let y = 0; y < fase.n; y++) for (let x = 0; x < fase.n; x++) {
          const c = document.createElement("div");
          c.className = "robo-casa";
          if (fase.pedras.has(`${x},${y}`)) c.textContent = "🪨";
          else if (fase.estrela.x === x && fase.estrela.y === y) c.textContent = "⭐";
          else {
            const k = fase.moedas.findIndex(q => q.x === x && q.y === y);
            if (k >= 0 && !pegas.has(k)) c.textContent = "🪙";
          }
          tab.appendChild(c);
        }
        roboEl = document.createElement("div");
        roboEl.className = "robo-boneco";
        roboEl.textContent = "🤖";
        // Seta mostrando para onde o robô está virado (no modo "robô")
        // O robô fica sempre em pé; só a setinha gira mostrando para onde ele vai andar
        if (cfg.modo === "robo") { const s = document.createElement("span"); s.className = "robo-seta"; s.innerHTML = '<span class="robo-frente">▲</span>'; roboEl.appendChild(s); }
        Object.assign(roboEl.style, { width: celula + "px", height: celula + "px" });
        tab.appendChild(roboEl);
        posicionarRobo(false);

        // Programa: as fichas; tocar numa ficha faz ela repetir (×2, ×3, ×4, ×1...)
        const painel = document.createElement("div");
        painel.className = "robo-painel";
        progEl = document.createElement("div");
        progEl.className = "robo-programa";
        desenharPrograma();
        const cmds = document.createElement("div");
        cmds.className = "robo-comandos";
        COMANDOS[cfg.modo].forEach(c => {
          const b = document.createElement("button");
          b.className = "robo-cmd";
          pintarIcone(b, c);
          if (c.rotulo) { b.classList.add("com-rotulo"); b.appendChild(Object.assign(document.createElement("small"), { textContent: c.rotulo })); }
          b.setAttribute("aria-label", c.nome);
          b.addEventListener("click", () => {
            if (rodando) return;
            if (programa.length >= 16) { Motor.falar("O programa está cheio! Use as repetições."); return; }
            programa.push({ cmd: c.id, vezes: 1 });
            Motor.ploc();
            desenharPrograma();
          });
          cmds.appendChild(b);
        });
        const acoes = document.createElement("div");
        acoes.className = "robo-acoes";
        const botao = (txt, rotulo, fn, classe = "") => { const b = document.createElement("button"); b.className = "chip " + classe; b.textContent = txt; b.setAttribute("aria-label", rotulo); b.addEventListener("click", fn); return b; };
        acoes.append(
          botao("⌫", "Apagar o último", () => { if (rodando) return; programa.pop(); desenharPrograma(); }),
          botao("🗑️", "Limpar", () => { if (rodando) return; programa = []; reiniciarRobo(); desenhar(); }),
          botao("▶️ Executar", "Executar", executar, "executar"),
          botao("❓", "Como jogar", () => { const j = JOGOS.find(x => x.id === "robo"); const p = Ajuda.passosDe(j, faixa); if (p) Ajuda.abrir(j, p); }));
        painel.append(progEl, cmds, acoes);
        tela.append(topo, tab, painel);
      }

      function desenharPrograma(atual = -1) {
        progEl.innerHTML = "";
        if (!programa.length) {
          progEl.textContent = "Toque nos comandos para montar o programa";
          progEl.classList.add("vazio");
          return;
        }
        progEl.classList.remove("vazio");
        programa.forEach((p, i) => {
          const b = document.createElement("button");
          b.className = "robo-ficha" + (i === atual ? " agora" : "");
          pintarIcone(b, COMANDOS[cfg.modo].find(c => c.id === p.cmd));
          if (p.vezes > 1) { const v = document.createElement("span"); v.className = "vezes"; v.textContent = `×${p.vezes}`; b.appendChild(v); }
          b.setAttribute("aria-label", "Tocar para repetir mais vezes");
          b.addEventListener("click", () => {
            if (rodando) return;
            p.vezes = p.vezes % MAX_VEZES + 1;
            Motor.nota(500 + p.vezes * 80, { dur: 0.08, vol: 0.15 });
            if (p.vezes === 2 && !desenharPrograma.dica) { desenharPrograma.dica = true; Motor.falar("Repetir duas vezes! Toque de novo para repetir mais."); }
            desenharPrograma();
          });
          progEl.appendChild(b);
        });
      }

      // O ângulo da setinha é acumulado (+90 ou -90 a cada giro): assim, de "esquerda" para
      // "cima" ela gira 90° no sentido do relógio, e não 270° para o lado contrário.
      let angulo = 0, dVisto = 0;
      function posicionarRobo(animar = true) {
        roboEl.style.transition = animar ? "left .35s ease, top .35s ease, transform .3s ease" : "none";
        Object.assign(roboEl.style, { left: robo.x * celula + "px", top: robo.y * celula + "px" });
        const giro = (robo.d - dVisto + 4) % 4;
        angulo = animar ? angulo + (giro === 3 ? -90 : giro * 90) : robo.d * 90;
        dVisto = robo.d;
        const seta = roboEl.querySelector(".robo-seta");
        if (seta) { seta.style.transition = roboEl.style.transition; seta.style.transform = `rotate(${angulo}deg)`; }
      }

      async function executar() {
        if (rodando) return;
        if (!programa.length) { Motor.falar("Monte o programa primeiro!"); return; }
        reiniciarRobo();
        desenhar();
        rodando = true;
        const sessao = Motor.sessaoAtual();
        const esperar = ms => new Promise(r => setTimeout(r, ms));
        for (let i = 0; i < programa.length; i++) {
          for (let v = 0; v < programa[i].vezes; v++) {
            if (sessao !== Motor.sessaoAtual()) return;
            desenharPrograma(i);
            const p = passo(robo, programa[i].cmd);
            const bateu = p.x < 0 || p.y < 0 || p.x >= fase.n || p.y >= fase.n || fase.pedras.has(`${p.x},${p.y}`);
            if (bateu) {
              Motor.animar(roboEl, "balanca");
              Motor.nota(160, { dur: 0.3, tipo: "square", vol: 0.15 });
              await Motor.falar("Ops! O robô bateu. Arrume o programa e tente de novo!");
              rodando = false;
              desenharPrograma();
              return;
            }
            robo = p;
            posicionarRobo();
            Motor.ploc();
            const k = fase.moedas.findIndex(q => q.x === robo.x && q.y === robo.y);
            if (k >= 0 && !pegas.has(k)) {
              pegas.add(k);
              tab.children[robo.y * fase.n + robo.x].textContent = "";
              Motor.tim();
              area.querySelector(".robo-topo .cubo-info").textContent = `🤖 Nível ${nivel} · 🪙 ${pegas.size}/${fase.moedas.length}`;
            }
            await esperar(450);
          }
        }
        rodando = false;
        desenharPrograma();
        const naEstrela = robo.x === fase.estrela.x && robo.y === fase.estrela.y;
        if (naEstrela && pegas.size === fase.moedas.length) return venceu();
        if (naEstrela) Motor.falar("Chegou na estrela, mas faltou pegar moedas!");
        else Motor.falar("Quase! O robô parou antes da estrela. Continue o programa!");
      }

      function venceu() {
        const usadas = programa.length;
        const estrelas = usadas <= fase.min ? 3 : usadas <= fase.min + 2 ? 2 : 1;
        Motor.comemorar(roboEl);
        Motor.tim();
        Motor.falar(estrelas === 3
          ? `Perfeito! Você usou só ${usadas} comandos, o menor programa possível!`
          : `Muito bem! Você usou ${usadas} comandos. Dá para fazer com ${fase.min}: tente usar as repetições!`);
        nivel++;
        salvarNivel(id, nivel);
        const info = area.querySelector(".robo-topo");
        const res = document.createElement("div");
        res.className = "cubo-info";
        res.textContent = "⭐".repeat(estrelas) + ` ${usadas} comandos (mínimo ${fase.min})`;
        const prox = document.createElement("button");
        prox.className = "chip executar";
        prox.textContent = "➡️ Próximo nível";
        prox.addEventListener("click", novaFase);
        const denovo = document.createElement("button");
        denovo.className = "chip";
        denovo.textContent = "🔁 Tentar de novo";
        denovo.addEventListener("click", () => { nivel--; salvarNivel(id, nivel); programa = []; reiniciarRobo(); desenhar(); });
        info.append(res, denovo, prox);
      }

      novaFase();
    },
  });

  // Para testes
  if (typeof globalThis !== "undefined") globalThis.RoboTeste = { minimo, gerarFase, CONFIG };
})();
