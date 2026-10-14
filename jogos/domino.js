// Dominó de verdade: 2 a 4 jogadores (ou duplas) contra os bichos do computador.
// Regras do dominó brasileiro: a carroça mais alta começa, carroças ficam atravessadas,
// quem bate ganha os pontos que sobraram na mão dos adversários; jogo trancado → menos pontos ganha.
// Tipo "Pontas de 5": a cada jogada, se a soma das pontas for 5, 10, 15, 20... quem jogou marca a soma.
// Pequenos (3 a 5 anos): partida rápida com figuras, sem tela de opções.
//
// Pontas de 5 com carroça no centro: a mesa abre em 4 pontas (cima e baixo depois dos dois lados).
// Jogar é por toque (tocar na peça; se couber em mais de uma ponta, tocar na seta). Arrastar até
// os botões das pontas também funciona, mas no iPhone arrastar perto da borda de baixo fecha o app.
(() => {
  const BICHOS = [
    { emoji: "🐶", nome: "cachorro" }, { emoji: "🐱", nome: "gato" }, { emoji: "🐸", nome: "sapo" },
    { emoji: "🐵", nome: "macaco" }, { emoji: "🐰", nome: "coelho" }, { emoji: "🦆", nome: "pato" },
  ];
  // Posições das bolinhas numa grade 3×3 (0 a 8)
  const PONTOS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
  const NOMES_CARROCA = ["branco", "ás", "duque", "terno", "quadra", "quina", "sena"];
  const T_MIN = 26; // menor tamanho das peças na mesa; abaixo disso a mesa rola em vez de encolher

  // Jogadores em volta da mesa; nas duplas, quem senta de frente é parceiro (lugares 0+2 e 1+3)
  const VOCE = { id: "voce", nome: "Você", icone: "🧒" };
  const BOTS = { urso: { id: "urso", nome: "Urso", artigo: "o", icone: "🐻" }, raposa: { id: "raposa", nome: "Raposa", artigo: "a", icone: "🦊" },
    panda: { id: "panda", nome: "Panda", artigo: "o", icone: "🐼" } };
  const MESAS = {
    "2": [VOCE, BOTS.urso],
    "3": [VOCE, BOTS.urso, BOTS.raposa],
    "4": [VOCE, BOTS.urso, BOTS.raposa, BOTS.panda],
    "duplas": [VOCE, BOTS.urso, BOTS.panda, BOTS.raposa],
  };

  // Opções da tela inicial e a escolha padrão de cada faixa
  const OPCOES = [
    { chave: "tipo", titulo: "Tipo de jogo", valores: [["normal", "🎯 Tradicional"], ["cinco", "5️⃣ Pontas de 5"]] },
    { chave: "pecas", titulo: "Peças", valores: [["figuras", "🐶 Bichinhos"], ["numeros", "🔢 Números"], ["pontos", "⚫ Bolinhas"]] },
    { chave: "jogadores", titulo: "Jogadores", valores: [["2", "👤 2"], ["3", "👥 3"], ["4", "👥 4"], ["duplas", "🤝 Duplas"]] },
    { chave: "compra", titulo: "Comprar no monte", valores: [["sim", "🛒 Sim"], ["nao", "🚫 Não"]] },
    { chave: "meta", titulo: "Partida", valores: [["0", "1 rodada"], ["50", "50 pontos"], ["100", "100 pontos"], ["200", "200 pontos"]] },
    { chave: "nivel", titulo: "Computador", valores: [["facil", "😊 Fácil"], ["esperto", "🧠 Esperto"]] },
    { chave: "dicas", titulo: "Mostrar dicas", valores: [["sim", "💡 Sim"], ["nao", "🙈 Não"]] },
    { chave: "tempo", titulo: "Tempo para jogar", valores: [["20", "⏱️ 20 segundos"], ["0", "♾️ Sem limite"]] },
  ];
  const PADRAO = {
    "5-6":  { tipo: "normal", pecas: "numeros", jogadores: "2", compra: "sim", meta: "0", nivel: "facil", dicas: "sim", tempo: "0" },
    "6-8":  { tipo: "normal", pecas: "pontos", jogadores: "2", compra: "sim", meta: "0", nivel: "facil", dicas: "sim", tempo: "20" },
    "8-10": { tipo: "normal", pecas: "pontos", jogadores: "4", compra: "sim", meta: "50", nivel: "esperto", dicas: "nao", tempo: "20" },
  };
  // Recordes de pontos numa rodada (os pontos não se comparam entre tipos de jogo/peça)
  const RECORDES = { "rodada-cinco": "recorde pontas de 5", "rodada-pontos": "recorde de pontos ⚫",
    "rodada-numeros": "recorde de pontos 🔢", "rodada-figuras": "recorde de peças 🐶" };
  const SIMPLES = { tipo: "normal", pecas: "figuras", jogadores: "2", compra: "sim", meta: "0", nivel: "facil", dicas: "sim", tempo: "0" };

  // "o Urso" / "O Urso" / "você"
  const quem = (j, maiusc) => j.nome === "Você" ? (maiusc ? "Você" : "você") : `${maiusc ? j.artigo.toUpperCase() : j.artigo} ${j.nome}`;

  JOGOS.push({
    id: "domino",
    nome: "Dominó",
    icone: "🎲",
    faixas: ["3-4", "4-5", "5-6", "6-8", "8-10"],
    iniciar(area, faixa) {
      const id = (faixa && faixa.id) || "6-8";
      if (!PADRAO[id]) return partida(area, SIMPLES);
      Motor.telaOpcoes(area, {
        opcoes: OPCOES, padrao: PADRAO[id], chave: `domino-opcoes-${id}`,
        antes: Placar.painel("domino", { recordes: RECORDES, comZerar: true }),
        aoJogar: op => partida(area, op),
        // Bichinhos não têm valor para somar: com eles o jogo é o tradicional
        aoMudar: (op, mudou) => {
          if (mudou === "pecas" && op.pecas === "figuras") op.tipo = "normal";
          if (mudou === "tipo" && op.tipo === "cinco" && op.pecas === "figuras") op.pecas = "pontos";
        },
      });
    },
  });

  // ---------- Uma partida (uma ou mais rodadas, até a meta de pontos) ----------
  function partida(area, opcoes) {
    const op = { ...opcoes };
    // Bichinhos não têm valor para somar: com eles o jogo é sempre o tradicional
    const cinco = op.tipo === "cinco" && op.pecas !== "figuras";
    const jogadores = MESAS[op.jogadores].map((j, i) => ({ ...j, lugar: i, mao: [] }));
    const n = jogadores.length;
    const voce = jogadores[0];
    const duplas = op.jogadores === "duplas";
    const time = j => (duplas ? j.lugar % 2 : j.lugar);
    const nomesTime = duplas ? ["Você e o Panda", "Urso e Raposa"] : jogadores.map(j => j.nome);
    const placar = Array(duplas ? 2 : n).fill(0);
    const meta = +op.meta;
    const max = op.pecas === "figuras" ? 5 : 6;
    const dicas = op.dicas === "sim";
    const limite = +op.tempo || 0; // segundos para a criança jogar (0 = sem limite)
    const nomeValor = v => op.pecas === "figuras" ? BICHOS[v].nome : NUMEROS_FALADOS[v];
    // Figuras não têm pontos: cada peça que sobra vale 1
    const valorPeca = p => (op.pecas === "figuras" ? 1 : p.a + p.b);
    const recordeChave = `rodada-${cinco ? "cinco" : op.pecas}`;
    let quemComeca = null; // quem venceu a rodada anterior

    rodada();

    function rodada() {
      // ---------- Peças e distribuição ----------
      const todas = [];
      for (let a = 0; a <= max; a++) for (let b = a; b <= max; b++) {
        const forma = () => op.pecas === "numeros" ? (Math.random() < 0.5 ? "numero" : "pontos") : op.pecas === "figuras" ? "figura" : "pontos";
        todas.push({ a, b, fa: forma(), fb: forma() });
      }
      const monte = Motor.embaralhar(todas);
      const porMao = Math.min(7, Math.floor(todas.length / n));
      const ordenar = m => m.sort((x, y) => x.a - y.a || x.b - y.b);
      jogadores.forEach(j => { j.mao = ordenar(monte.splice(0, porMao)); });
      if (op.compra !== "sim") monte.length = 0; // sem compra, o que sobra fica fora do jogo

      // ---------- Mesa ----------
      // A primeira peça fica no centro. Dela saem os "braços": esquerda e direita e, nas Pontas de 5
      // quando o centro é carroça, também cima e baixo (abrem depois que os dois lados têm peça).
      // Cada peça de um braço guarda o valor que encosta (perto) e o que fica na ponta (longe).
      let centro = null;
      const bracos = { esq: [], dir: [], cima: [], baixo: [] };
      const daRodada = Array(placar.length).fill(0); // pontos feitos nesta rodada (para o recorde)
      let vez, obrigatoria = null, passes = 0, selecionada = null, acabou = false;

      // Começa quem tem a maior carroça, jogando ela (na primeira rodada, e sempre nas Pontas de 5,
      // para a mesa abrir em 4 pontas). Senão, quem venceu a rodada anterior, com qualquer peça.
      if (quemComeca === null || cinco) {
        let melhor = null;
        jogadores.forEach(j => j.mao.forEach(p => {
          const peso = (p.a === p.b ? 100 : 0) + p.a + p.b;
          if (!melhor || peso > melhor.peso) melhor = { j, p, peso };
        }));
        vez = melhor.j.lugar;
        obrigatoria = melhor.p;
      } else vez = quemComeca;

      const spinner = () => cinco && centro && centro.dupla;
      // Pontas onde dá para jogar agora
      function pontasAbertas() {
        if (!centro) return [];
        const l = ["esq", "dir"];
        if (spinner() && bracos.esq.length && bracos.dir.length) l.push("cima", "baixo");
        return l;
      }
      const ultima = lado => bracos[lado][bracos[lado].length - 1];
      function valorPonta(lado) {
        if (bracos[lado].length) return ultima(lado).longe;
        return lado === "dir" ? centro.b : centro.a;
      }

      // Pontas onde a peça encaixa; mesa vazia → "centro"
      function ladosQueCabem(p) {
        if (!centro) return !obrigatoria || obrigatoria === p ? ["centro"] : [];
        const l = pontasAbertas().filter(lado => p.a === valorPonta(lado) || p.b === valorPonta(lado));
        // No jogo tradicional, pontas iguais dão no mesmo: não precisa perguntar onde
        if (!cinco && l.length === 2 && valorPonta("esq") === valorPonta("dir")) return [l[0]];
        return l;
      }
      const temJogada = j => j.mao.some(p => ladosQueCabem(p).length);

      // Como a peça fica ao entrar naquela ponta
      function virar(p, lado) {
        const v = valorPonta(lado), reto = p.a === v;
        return { perto: reto ? p.a : p.b, longe: reto ? p.b : p.a, fp: reto ? p.fa : p.fb, fl: reto ? p.fb : p.fa, dupla: p.a === p.b };
      }

      // Soma das pontas (Pontas de 5). `extra`: { lado, peca } para simular uma jogada.
      // Carroça na ponta conta as duas metades. Com o centro carroça (4 pontas), ele conta
      // enquanto um dos lados ainda estiver vazio.
      function somaPontas(extra) {
        const braco = l => (extra && extra.lado === l ? [...bracos[l], extra.peca] : bracos[l]);
        const ponta = l => { const b = braco(l), t = b[b.length - 1]; return t.dupla ? 2 * t.longe : t.longe; };
        if (spinner()) {
          const e = braco("esq").length, d = braco("dir").length;
          if (!e && !d) return 2 * centro.a;
          if (!e || !d) return 2 * centro.a + ponta(e ? "esq" : "dir");
          return ["esq", "dir", "cima", "baixo"].reduce((s, l) => s + (braco(l).length ? ponta(l) : 0), 0);
        }
        const lado = (l, v) => (braco(l).length ? ponta(l) : centro.dupla ? 2 * v : v);
        return lado("esq", centro.a) + lado("dir", centro.b);
      }
      // Quantos pontos a jogada faria (0 se a soma não for múltiplo de 5)
      function pontosDaJogada(p, lado) {
        if (!cinco) return 0;
        const s = lado === "centro" ? p.a + p.b : somaPontas({ lado, peca: virar(p, lado) });
        return s && s % 5 === 0 ? s : 0;
      }
      const melhoresPontos = p => Math.max(0, ...ladosQueCabem(p).map(l => pontosDaJogada(p, l)));

      // Coloca a peça; devolve os pontos marcados nas pontas (Pontas de 5)
      function colocar(j, p, lado) {
        const ganhou = pontosDaJogada(p, lado);
        j.mao.splice(j.mao.indexOf(p), 1);
        if (lado === "centro") centro = { a: p.a, b: p.b, fa: p.fa, fb: p.fb, dupla: p.a === p.b, nova: true };
        else bracos[lado].push({ ...virar(p, lado), nova: true });
        obrigatoria = null;
        passes = 0;
        Motor.ploc();
        if (ganhou) {
          placar[time(j)] += ganhou;
          daRodada[time(j)] += ganhou;
          Motor.depois(() => Motor.tim(), 150);
        }
        return ganhou;
      }

      // ---------- Desenho ----------
      // Bolinhas: o desenho padrão é da metade em pé; na pedra deitada, gira (a sena fica em 2 fileiras de 3)
      const girar = i => (i % 3) * 3 + (2 - Math.floor(i / 3));
      function metade(valor, forma, deitada) {
        const m = document.createElement("span");
        m.className = "meia";
        if (forma === "figura") m.textContent = BICHOS[valor].emoji;
        else if (forma === "numero") { m.textContent = valor; m.classList.add("num"); }
        else {
          m.classList.add("pontos");
          const pos = PONTOS[valor].map(i => (deitada ? girar(i) : i));
          for (let i = 0; i < 9; i++) {
            const d = document.createElement("i");
            if (pos.includes(i)) d.className = "on";
            m.appendChild(d);
          }
        }
        return m;
      }

      // Pedra com as metades na ordem da tela (esquerda→direita ou cima→baixo)
      function desenharPeca(v1, v2, f1, f2, t, { tag = "div", emPe = false } = {}) {
        const el = document.createElement(tag);
        el.className = "domino" + (emPe ? " em-pe" : "");
        el.style.setProperty("--t", t + "px");
        el.append(metade(v1, f1, !emPe), metade(v2, f2, !emPe));
        return el;
      }

      let alvos = [];         // zonas na mesa onde a peça tocada/arrastada pode ser solta
      let zonas = {};         // lado → retângulo (na mesa) onde a próxima peça daquela ponta ficaria
      let mesaAtual = null;
      let ultimoPonto = null; // { pontos, j } para mostrar o "+10" na tela

      function desenhar() {
        area.innerHTML = "";
        const tela = document.createElement("div");
        tela.className = "domino-jogo";
        area.appendChild(tela);
        const larg = tela.clientWidth;
        const deitado = larg > tela.clientHeight;
        const minhaVez = vez === 0 && !acabou;

        // Topo: os outros jogadores (peças na mão; quem está pensando pula), o monte e o placar
        const topo = document.createElement("div");
        topo.className = "domino-topo";
        jogadores.slice(1).forEach(j => {
          const el = document.createElement("div");
          el.className = "domino-urso" + (vez === j.lugar ? " pensando" : "") + (duplas && time(j) === 0 ? " parceiro" : "");
          el.textContent = j.icone;
          const qt = document.createElement("span");
          qt.className = "qt";
          qt.textContent = j.mao.length;
          el.appendChild(qt);
          topo.appendChild(el);
        });
        if (op.compra === "sim") {
          const comprar = document.createElement("button");
          comprar.className = "domino-monte";
          comprar.textContent = `🛒 ${monte.length}`;
          comprar.setAttribute("aria-label", "Comprar peça");
          comprar.disabled = !monte.length || !minhaVez;
          if (minhaVez && monte.length && !temJogada(voce)) comprar.classList.add("chama");
          comprar.addEventListener("click", comprarPeca);
          topo.appendChild(comprar);
        }
        if (meta || cinco) {
          const pl = document.createElement("div");
          pl.className = "domino-placar";
          pl.textContent = placar.map((p, i) => `${duplas ? (i ? "🐻🦊" : "🧒🐼") : jogadores[i].icone} ${p}`).join(" · ") + (meta ? ` / ${meta}` : "");
          topo.appendChild(pl);
        }
        // Relógio da vez da criança: barra que esvazia
        if (minhaVez && prazo) {
          const resta = Math.max(0, prazo - Date.now());
          const rel = document.createElement("div");
          rel.className = "relogio" + (resta <= 5000 ? " pouco" : "");
          rel.innerHTML = `<span class="seg"></span><div class="trilho"><div class="barra"></div></div>`;
          rel.querySelector(".seg").textContent = `⏱️ ${Math.ceil(resta / 1000)}`;
          Object.assign(rel.querySelector(".barra").style, { width: (resta / (limite * 1000)) * 100 + "%", animationDuration: resta + "ms" });
          topo.appendChild(rel);
        }

        // Mesa, com a soma das pontas e o "+10" no canto
        const mesaEl = document.createElement("div");
        mesaEl.className = "domino-mesa";
        const info = document.createElement("div");
        info.className = "info-pontas sobre-mesa";
        if (cinco && centro) {
          const s = somaPontas();
          info.textContent = `Soma ${s}` + (s && s % 5 === 0 ? " ✨" : "");
        }
        if (ultimoPonto) {
          const f = document.createElement("div");
          f.className = "fez-pontos";
          f.textContent = `${ultimoPonto.j.icone} +${ultimoPonto.pontos}`;
          info.appendChild(f);
        }

        // Mão da criança: tamanho fixo (não encolhe ao comprar)
        const mao = document.createElement("div");
        mao.className = "domino-mao" + (minhaVez ? " minha-vez" : "");
        const porFila = deitado ? 8 : 5;
        const tMao = Math.max(30, Math.min(deitado ? 40 : 44, (larg - 10 * porFila) / (2 * porFila + 0.4)));
        voce.mao.forEach(p => {
          const el = desenharPeca(p.a, p.b, p.fa, p.fb, tMao, { tag: "button" });
          el.setAttribute("aria-label", `${nomeValor(p.a)} e ${nomeValor(p.b)}`);
          const cabe = minhaVez && ladosQueCabem(p).length;
          if (cabe && (dicas || obrigatoria === p)) {
            el.classList.add("cabe");
            const ganha = cinco && melhoresPontos(p);
            if (ganha) { const g = document.createElement("span"); g.className = "ganha"; g.textContent = `+${ganha}`; el.appendChild(g); }
          }
          if (selecionada === p) el.classList.add("selecionada");
          Motor.arrastavel(el, {
            alvos: () => alvos,
            aoSoltar: alvo => jogar(p, alvo.dataset.lado, el),
            // Ao começar a arrastar, a mesa mostra onde a peça encaixa
            aoComecar: () => { if (vez === 0 && !acabou) mostrarZonas(p); },
            aoTerminar: () => { if (vez === 0 && !acabou) mostrarZonas(selecionada); },
          });
          el.addEventListener("click", () => tocarPeca(p, el));
          mao.appendChild(el);
        });

        tela.append(topo, mesaEl, mao);
        // Pontas onde dá para jogar agora: as da peça tocada, ou (com dicas) as de qualquer peça da mão
        const jogaveis = new Set(!minhaVez ? [] : selecionada ? ladosQueCabem(selecionada)
          : dicas ? voce.mao.flatMap(ladosQueCabem) : []);
        desenharMesa(mesaEl, jogaveis);
        mesaEl.appendChild(info);
        mesaAtual = mesaEl;
        mostrarZonas(minhaVez ? selecionada : null);
      }

      // Zonas piscando na mesa, no lugar exato onde a peça `p` pode entrar (tocar ou soltar nelas)
      function mostrarZonas(p) {
        if (!mesaAtual) return;
        mesaAtual.querySelectorAll(".alvo-mesa").forEach(z => z.remove());
        alvos = [];
        if (!p) return;
        ladosQueCabem(p).forEach(lado => {
          const z = zonas[lado];
          if (!z) return;
          const el = document.createElement("button");
          el.className = "alvo-mesa";
          el.dataset.lado = lado;
          el.setAttribute("aria-label", "Jogar aqui");
          Object.assign(el.style, { left: z.x + "px", top: z.y + "px", width: z.w + "px", height: z.h + "px" });
          const ganha = pontosDaJogada(p, lado);
          if (ganha) { const g = document.createElement("span"); g.className = "ganha"; g.textContent = `+${ganha}`; el.appendChild(g); }
          el.addEventListener("click", () => jogar(p, lado, null));
          mesaAtual.appendChild(el);
          alvos.push(el);
        });
      }

      // ---------- Mesa no formato do dominó ----------
      // A carroça do centro fica atravessada; os braços seguem reto e, ao chegar na borda,
      // dobram (sempre no sentido do relógio). Cada ponta aberta ganha uma peça "fantasma"
      // no fim: é a zona onde a próxima peça entra. Escolhe o maior tamanho em que tudo cabe.
      function montarMesa(u, W, H) {
        const rects = [];
        const livre = r => r.x >= -W / 2 && r.x + r.w <= W / 2 && r.y >= -H / 2 && r.y + r.h <= H / 2 &&
          !rects.some(o => r.x < o.x + o.w - 0.5 && o.x < r.x + r.w - 0.5 && r.y < o.y + o.h - 0.5 && o.y < r.y + r.h - 0.5);
        // Retângulo pelo centro (cx, cy): deitado (2u × u) ou em pé (u × 2u)
        const ret = (cx, cy, deitado) => {
          const w = deitado ? 2 * u : u, h = deitado ? u : 2 * u;
          return { x: cx - w / 2, y: cy - h / 2, w, h };
        };

        // Carroça no centro fica em pé (atravessada); outra peça no centro fica deitada
        const rc = { ...ret(0, 0, !centro.dupla), peca: centro, d: [1, 0] };
        rects.push(rc);
        const inicio = {
          esq: { H: [-rc.w / 2, 0], d: [-1, 0] }, dir: { H: [rc.w / 2, 0], d: [1, 0] },
          cima: { H: [0, -rc.h / 2], d: [0, -1] }, baixo: { H: [0, rc.h / 2], d: [0, 1] },
        };
        const abertas = pontasAbertas();
        for (const lado of ["esq", "dir", "cima", "baixo"]) {
          let [hx, hy] = inicio[lado].H, [dx, dy] = inicio[lado].d;
          const pecas = abertas.includes(lado) ? [...bracos[lado], { fantasma: lado, dupla: false }] : bracos[lado];
          for (const peca of pecas) {
            const horiz = dx !== 0;
            // Reto: carroça atravessada (ocupa u no sentido do braço), as outras ao comprido (2u)
            const passo = peca.dupla ? u : 2 * u;
            const deitada = peca.dupla ? !horiz : horiz;
            let r = { ...ret(hx + dx * passo / 2, hy + dy * passo / 2, deitada), peca, d: [dx, dy] };
            // Segue reto se, depois desta pedra, ainda sobrar espaço para fazer a curva
            const folga = { x: r.x + Math.min(0, dx) * u, y: r.y + Math.min(0, dy) * u, w: r.w + Math.abs(dx) * u, h: r.h + Math.abs(dy) * u };
            if (livre(r) && livre(folga)) { hx += dx * passo; hy += dy * passo; }
            else {
              // Dobra: a 1ª metade continua na linha e a pedra segue na nova direção
              // (tenta no sentido do relógio; se não der, no outro)
              const qx = hx + dx * u / 2, qy = hy + dy * u / 2;
              const curva = (ex, ey) => ({ ...ret(qx + ex * u / 2, qy + ey * u / 2, ex !== 0), peca, d: [ex, ey] });
              r = [curva(-dy, dx), curva(dy, -dx)].find(livre);
              if (!r) return null;
              [dx, dy] = r.d;
              hx = qx + dx * 1.5 * u; hy = qy + dy * 1.5 * u;
            }
            rects.push(r);
          }
        }
        return rects;
      }

      function desenharMesa(mesaEl, jogaveis) {
        const MW = mesaEl.clientWidth, MH = mesaEl.clientHeight;
        zonas = {};
        if (!centro) {
          // Mesa vazia: a zona é o meio da mesa
          const u = Math.min(30, Math.floor(MH / 2.5));
          zonas.centro = { x: MW / 2 - u, y: MH / 2 - u / 2, w: 2 * u, h: u };
          return;
        }
        const W = MW - 12, H = MH - 12;
        let u = Math.min(30, Math.floor(H / 2.2)), rects = null;
        for (; u >= 9 && !(rects = montarMesa(u, W, H)); u--);
        if (!rects) { u = 9; rects = montarMesa(u, 1e6, 1e6); } // não coube: desenha assim mesmo
        // Centraliza o desenho na mesa
        const minX = Math.min(...rects.map(r => r.x)), maxX = Math.max(...rects.map(r => r.x + r.w));
        const minY = Math.min(...rects.map(r => r.y)), maxY = Math.max(...rects.map(r => r.y + r.h));
        const ox = MW / 2 - (minX + maxX) / 2, oy = MH / 2 - (minY + maxY) / 2;
        // Destaca na mesa só as pontas onde dá para jogar agora
        const pontasAtuais = new Set([...jogaveis].filter(l => l !== "centro").map(l => (bracos[l].length ? ultima(l) : centro)));
        rects.forEach(r => {
          const p = r.peca, emPe = r.h > r.w;
          if (p.fantasma) { zonas[p.fantasma] = { x: ox + r.x, y: oy + r.y, w: r.w, h: r.h }; return; }
          let el;
          if (p === centro) el = desenharPeca(p.a, p.b, p.fa, p.fb, u, { emPe });
          else {
            // Metades na ordem da tela: o "perto" vem primeiro no sentido do braço
            const ida = r.d[0] + r.d[1] > 0;
            el = ida ? desenharPeca(p.perto, p.longe, p.fp, p.fl, u, { emPe }) : desenharPeca(p.longe, p.perto, p.fl, p.fp, u, { emPe });
          }
          el.classList.add("na-mesa");
          Object.assign(el.style, { left: ox + r.x + "px", top: oy + r.y + "px" });
          if (pontasAtuais.has(p)) el.classList.add("na-ponta");
          if (p.nova) { el.classList.add("chegou"); p.nova = false; }
          mesaEl.appendChild(el);
        });
      }

      // ---------- Tempo para jogar ----------
      // Na vez da criança, um relógio de `limite` segundos; se acabar, o jogo joga por ela.
      let prazo = 0, relogio = 0;
      function iniciarRelogio() {
        if (!limite || vez !== 0 || acabou) return;
        prazo = Date.now() + limite * 1000;
        const meu = ++relogio;
        let ultimoBip = null;
        const tique = () => {
          if (meu !== relogio || vez !== 0 || acabou) return;
          const resta = prazo - Date.now();
          if (resta <= 0) { tempoEsgotado(); return; }
          const seg = Math.ceil(resta / 1000);
          const rel = area.querySelector(".relogio");
          if (rel) { rel.querySelector(".seg").textContent = `⏱️ ${seg}`; rel.classList.toggle("pouco", resta <= 5000); }
          if (resta <= 5000 && seg !== ultimoBip) { ultimoBip = seg; Motor.nota(880, { dur: 0.08, vol: 0.15 }); }
          Motor.depois(tique, 200);
        };
        tique();
      }
      const pararRelogio = () => { relogio++; prazo = 0; };

      function tempoEsgotado() {
        if (vez !== 0 || acabou) return;
        pararRelogio();
        selecionada = null;
        // Compra o que precisar e joga a melhor peça (a que faz mais pontos; senão a mais pesada)
        while (!temJogada(voce) && monte.length) voce.mao.push(monte.shift());
        ordenar(voce.mao);
        const jogadas = [];
        voce.mao.forEach(p => ladosQueCabem(p).forEach(lado => jogadas.push({ p, lado })));
        Motor.falar("Acabou o tempo! Joguei por você.");
        if (!jogadas.length) { Motor.depois(() => passar(voce), 1200); desenhar(); return; }
        const valor = ({ p, lado }) => 100 * pontosDaJogada(p, lado) + p.a + p.b;
        const j = jogadas.reduce((m, x) => (valor(x) > valor(m) ? x : m));
        Motor.depois(() => jogar(j.p, j.lado, null), 1200);
      }

      // ---------- Vez da criança ----------
      function tocarPeca(p, el) {
        if (vez !== 0 || acabou) return;
        const cabe = ladosQueCabem(p);
        if (!cabe.length) {
          Motor.animar(el, "balanca");
          if (obrigatoria) Motor.falar(`Comece com a carroça de ${NOMES_CARROCA[obrigatoria.a]}!`);
          return;
        }
        if (cabe.length === 1) { jogar(p, cabe[0], el); return; }
        selecionada = p; // cabe em mais de uma ponta: a mesa mostra onde, e a criança escolhe
        desenhar();
        Motor.falar("Em qual ponta? Toque ou arraste até a ponta que está piscando.");
      }

      function jogar(p, lado, el) {
        if (vez !== 0 || acabou) return false;
        if (!ladosQueCabem(p).includes(lado)) { if (el) Motor.animar(el, "balanca"); return false; }
        selecionada = null;
        pararRelogio();
        const ganhou = colocar(voce, p, lado);
        ultimoPonto = ganhou ? { pontos: ganhou, j: voce } : null;
        if (ganhou) Motor.falar(`${ganhou} pontos!`);
        else if (op.pecas === "figuras") Motor.falar(Motor.maiuscula(nomeValor(lado === "centro" ? p.b : valorPonta(lado))));
        if (!voce.mao.length) fimRodada(voce);
        else proximaVez(ganhou ? 1600 : 900);
        return true;
      }

      function comprarPeca() {
        if (vez !== 0 || !monte.length || acabou) return;
        if (temJogada(voce)) { Motor.falar("Você já tem uma peça que encaixa!"); return; }
        voce.mao.push(monte.shift());
        ordenar(voce.mao);
        Motor.nota(600, { dur: 0.12, vol: 0.2 });
        desenhar();
        if (temJogada(voce)) Motor.falar("Essa serve! Toque nela para jogar.");
        else if (monte.length) Motor.falar("Ainda não serve. Compre outra!");
        else passar(voce);
      }

      // ---------- Vez do computador ----------
      function jogadaBot() {
        if (acabou) return;
        const j = jogadores[vez];
        while (!temJogada(j) && monte.length) j.mao.push(monte.shift());
        const jogadas = [];
        j.mao.forEach(p => ladosQueCabem(p).forEach(lado => jogadas.push({ p, lado })));
        if (!jogadas.length) { passar(j); return; }
        let escolha;
        if (op.nivel === "facil") escolha = Motor.sortear(jogadas);
        else {
          // Esperto: marca pontos quando dá, livra-se das peças pesadas e das carroças,
          // e guarda peças que combinem com as pontas
          const nota = ({ p, lado }) => {
            const novaPonta = lado === "centro" ? [p.a, p.b] : [virar(p, lado).longe];
            const outras = pontasAbertas().filter(l => l !== lado).map(valorPonta);
            const valores = [...novaPonta, ...outras];
            const combinam = j.mao.filter(x => x !== p && valores.some(v => x.a === v || x.b === v)).length;
            return 4 * pontosDaJogada(p, lado) + p.a + p.b + (p.a === p.b ? 4 : 0) + 2 * combinam;
          };
          escolha = jogadas.reduce((m, x) => (nota(x) > nota(m) ? x : m));
        }
        const ganhou = colocar(j, escolha.p, escolha.lado);
        ultimoPonto = ganhou ? { pontos: ganhou, j } : null;
        if (ganhou) Motor.falar(`${quem(j, true)} fez ${ganhou}!`);
        if (!j.mao.length) fimRodada(j);
        else proximaVez(ganhou ? 1600 : 900);
      }

      function passar(j) {
        passes++;
        if (passes >= n) { fimRodada(null); return; }
        ultimoPonto = null;
        Motor.falar(j === voce ? "Você não tem peça. Passa a vez!" : `${quem(j, true)} passou!`);
        proximaVez(1500);
      }

      function proximaVez(espera = 900) {
        vez = (vez + 1) % n;
        desenhar();
        if (vez === 0) Motor.depois(avisarVez, ultimoPonto ? 900 : 0);
        else Motor.depois(jogadaBot, espera);
      }

      function avisarVez() {
        if (vez !== 0 || acabou) return;
        if (temJogada(voce) || monte.length) { iniciarRelogio(); desenhar(); }
        if (!temJogada(voce)) {
          if (monte.length) Motor.falar("Nenhuma peça encaixa. Toque no carrinho para comprar!");
          else Motor.depois(() => passar(voce), 900);
          return;
        }
        if (obrigatoria) return Motor.falar(`Você começa! Toque na carroça de ${NOMES_CARROCA[obrigatoria.a]}.`);
        if (!centro) return Motor.falar("Você começa! Toque numa peça.");
        if (!dicas) return Motor.falar("Sua vez!");
        const valores = [...new Set(pontasAbertas().map(valorPonta))].map(nomeValor);
        Motor.falar(`Sua vez! Precisa de ${valores.length > 1 ? valores.slice(0, -1).join(", ") + " ou " + valores[valores.length - 1] : valores[0]}.`);
      }

      // ---------- Fim da rodada e da partida ----------
      function fimRodada(bateu) {
        const soma = j => j.mao.reduce((s, p) => s + valorPeca(p), 0);
        let vencedor = bateu, frase;
        if (bateu) frase = `${quem(bateu, true)} bateu!`;
        else {
          // Trancado: ganha quem (ou a dupla que) tem menos pontos na mão
          const somaTime = tm => jogadores.filter(j => time(j) === tm).reduce((s, j) => s + soma(j), 0);
          const times = [...new Set(jogadores.map(time))];
          const menor = Math.min(...times.map(somaTime));
          const empatados = times.filter(tm => somaTime(tm) === menor);
          vencedor = empatados.length === 1 ? jogadores.find(j => time(j) === empatados[0]) : null;
          if (!vencedor) frase = "O jogo trancou! Empatou.";
          else if (duplas) frase = `O jogo trancou! ${nomesTime[time(vencedor)]} têm menos pontos.`;
          else frase = `O jogo trancou! ${quem(vencedor, true)} tem menos pontos.`;
        }
        // Batida: ganha os pontos que sobraram na mão dos adversários.
        // Trancado: ganha a diferença (ex.: ele ficou com 20, eu com 10 → eu ganho 10).
        let pontos = 0;
        if (vencedor) {
          const adversarios = jogadores.filter(j => time(j) !== time(vencedor));
          const deles = adversarios.reduce((s, j) => s + soma(j), 0);
          if (bateu) pontos = deles;
          else if (duplas) pontos = deles - jogadores.filter(j => time(j) === time(vencedor)).reduce((s, j) => s + soma(j), 0);
          else pontos = deles - adversarios.length * soma(vencedor); // diferença para cada adversário
          placar[time(vencedor)] += pontos;
          daRodada[time(vencedor)] += pontos;
        }

        // A conta da rodada, separada: o que a batida fez na mesa (Pontas de 5, já marcado na hora)
        // e o que veio das pedras que ficaram na mão
        const conta = [];
        const naMesa = bateu && cinco && ultimoPonto && ultimoPonto.j === bateu ? ultimoPonto.pontos : 0;
        if (naMesa) conta.push(["🎯 Batida na mesa", naMesa]);
        if (vencedor) {
          const adv = jogadores.filter(j => time(j) !== time(vencedor));
          const deQuem = duplas ? `de ${nomesTime[time(adv[0])]}` : adv.length === 1 ? `${adv[0] === voce ? "da sua mão" : (adv[0].artigo === "a" ? "da " : "do ") + adv[0].nome}` : "dos adversários";
          const coisa = op.pecas === "figuras" ? "Peças" : "Pedras";
          conta.push([bateu ? `✋ ${coisa} ${deQuem}` : `✋ Diferença das ${coisa.toLowerCase()} na mão`, pontos]);
        }
        let fala = frase;
        if (vencedor && naMesa) fala += ` Fez ${naMesa} na mesa e ganhou mais ${pontos} das pedras!`;
        else if (vencedor && pontos) fala += ` Ganhou ${pontos} ${op.pecas === "figuras" ? (pontos === 1 ? "ponto" : "pontos") : "das pedras"}!`;
        terminarRodada(vencedor, frase, conta, fala);
      }

      function terminarRodada(vencedor, frase, conta, fala) {
        pararRelogio();
        acabou = true;
        vez = -1;
        if (vencedor) quemComeca = vencedor.lugar;
        const novoRecorde = Placar.recorde("domino", recordeChave, daRodada[0]);
        desenhar();
        Motor.falar(fala);
        Motor.depois(() => telaResultado(vencedor, frase, conta, novoRecorde), 3200);
      }

      function telaResultado(vencedor, frase, conta, novoRecorde) {
        area.innerHTML = "";
        // Time que ganhou a partida (-1: ninguém ainda / empate). Com meta, a partida acaba no fim
        // da rodada em que alguém chegou nela, e ganha quem estiver na frente (empatados: mais uma rodada).
        const maior = Math.max(...placar), sozinho = placar.filter(p => p === maior).length === 1;
        const campeao = meta
          ? (maior >= meta && sozinho ? placar.indexOf(maior) : -1)
          : cinco ? maiorPlacar() : vencedor ? time(vencedor) : -1;
        const terminou = !meta || campeao >= 0;
        const nos = vencedor && time(vencedor) === 0;
        const caixa = document.createElement("div");
        caixa.className = "fim";
        caixa.innerHTML = `<div class="trofeu"></div><div class="resumo"></div><div class="maos-fim"></div><div class="conta-rodada"></div><div class="placar-fim"></div>`;
        const iconeTime = tm => jogadores.find(j => time(j) === tm && j !== voce).icone;
        caixa.querySelector(".trofeu").textContent = terminou
          ? (campeao < 0 ? "🤝" : campeao === 0 ? "🏆" : iconeTime(campeao))
          : (!vencedor ? "🤝" : nos ? "⭐" : vencedor.icone);
        caixa.querySelector(".resumo").textContent = frase;

        // As pedras que sobraram: na batida, as dos adversários (que foram para quem bateu);
        // no jogo fechado, as de todo mundo, com quanto cada um ficou e quem levou
        const trancou = jogadores.every(j => j.mao.length);
        const mostrar = trancou ? jogadores : jogadores.filter(j => vencedor && time(j) !== time(vencedor));
        const maosEl = caixa.querySelector(".maos-fim");
        mostrar.forEach(j => {
          const linha = document.createElement("div");
          linha.className = "mao-fim" + (trancou && vencedor && time(j) === time(vencedor) ? " levou" : "");
          const nome = document.createElement("span");
          nome.className = "nome";
          nome.textContent = `${j.icone} ${j.nome}`;
          const pecas = document.createElement("span");
          pecas.className = "pecas";
          j.mao.forEach(p => pecas.appendChild(desenharPeca(p.a, p.b, p.fa, p.fb, 22)));
          if (!j.mao.length) pecas.textContent = "sem pedras";
          const soma = document.createElement("b");
          soma.className = "soma";
          const total = j.mao.reduce((t, p) => t + valorPeca(p), 0);
          soma.textContent = (linha.classList.contains("levou") ? "🏆 " : "") + total + (op.pecas === "figuras" ? (total === 1 ? " peça" : " peças") : "");
          linha.append(nome, pecas, soma);
          maosEl.appendChild(linha);
        });
        const contaEl = caixa.querySelector(".conta-rodada");
        const linha = (rotulo, valor, classe = "") => {
          const l = document.createElement("div");
          l.className = "linha-conta " + classe;
          l.innerHTML = `<span></span><b></b>`;
          l.querySelector("span").textContent = rotulo;
          l.querySelector("b").textContent = `+${valor}`;
          contaEl.appendChild(l);
        };
        conta.forEach(([r, v]) => linha(r, v));
        if (conta.length > 1) linha("Total", conta.reduce((s, [, v]) => s + v, 0), "total");
        if (meta || cinco) caixa.querySelector(".placar-fim").textContent = placar.map((p, i) => `${nomesTime[i]}: ${p}`).join(" · ");
        const botao = document.createElement("button");
        botao.className = "modo";
        botao.innerHTML = `<span class="icone"></span><span class="rotulo"></span>`;
        botao.querySelector(".icone").textContent = terminou ? "🔁" : "▶️";
        botao.querySelector(".rotulo").textContent = terminou ? "Jogar de novo" : "Próxima rodada";
        botao.addEventListener("click", () => (terminou ? partida(area, opcoes) : rodada()));
        if (novoRecorde) {
          const r = document.createElement("div");
          r.className = "novo-recorde";
          r.textContent = `⭐ Novo recorde: ${daRodada[0]}!`;
          caixa.appendChild(r);
        }

        // Fim da partida: conta no placar geral
        let seq = null;
        if (terminou) {
          const ganhador = campeao < 0 ? null
            : campeao === 0 ? { id: "voce", rotulo: "🧒 Você" }
            : duplas ? { id: "urso-raposa", rotulo: "🐻🦊 Urso e Raposa" }
            : { id: jogadores[campeao].id, rotulo: `${jogadores[campeao].icone} ${jogadores[campeao].nome}` };
          seq = Placar.resultado("domino", ganhador);
          caixa.appendChild(Placar.painel("domino", { recordes: RECORDES }));
        }
        caixa.appendChild(botao);
        area.appendChild(caixa);

        let fala;
        if (!terminou) fala = `${frase} Vamos para a próxima rodada!`;
        else if (campeao === 0) fala = duplas ? "Você e o Panda ganharam a partida!" : "Você ganhou a partida!";
        else if (campeao < 0) fala = "Empatou! Vamos jogar de novo?";
        else fala = `${duplas ? "Urso e Raposa ganharam" : quem(jogadores[campeao], true) + " ganhou"} desta vez! Vamos jogar de novo?`;
        if (novoRecorde) fala += ` Novo recorde: ${daRodada[0]} ${op.pecas === "figuras" ? "peças" : "pontos"}!`;
        if (seq && seq.novaMelhorSequencia) fala += ` ${seq.sequencia} vitórias seguidas! É o seu recorde!`;
        else if (seq && seq.sequencia > 1) fala += ` São ${seq.sequencia} vitórias seguidas!`;
        if (terminou && campeao === 0) { Motor.comemorar(caixa.querySelector(".trofeu")); Motor.tim(); }
        else if (nos) Motor.tim();
        Motor.falar(fala);
      }

      // Pontas de 5 em uma rodada só: ganha quem fez mais pontos (empate → -1)
      function maiorPlacar() {
        const m = Math.max(...placar);
        return placar.filter(p => p === m).length > 1 ? -1 : placar.indexOf(m);
      }

      // Girou o celular ou mudou o tamanho da tela: desenha de novo (até a rodada acabar)
      let espera = null;
      const sessao = Motor.sessaoAtual();
      const aoRedimensionar = () => {
        if (acabou || sessao !== Motor.sessaoAtual()) { window.removeEventListener("resize", aoRedimensionar); return; }
        clearTimeout(espera);
        espera = setTimeout(() => { if (!acabou && area.querySelector(".domino-jogo")) desenhar(); }, 200);
      };
      window.addEventListener("resize", aoRedimensionar);

      desenhar();
      if (vez === 0) avisarVez();
      else {
        const j = jogadores[vez];
        Motor.falar(obrigatoria ? `${quem(j, true)} tem a carroça de ${NOMES_CARROCA[obrigatoria.a]} e começa!` : `${quem(j, true)} começa!`);
        Motor.depois(jogadaBot, 2200);
      }
    }
  }
})();
