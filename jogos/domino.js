// Dominó de verdade: 2 a 4 jogadores (ou duplas) contra os bichos do computador.
// Regras do dominó brasileiro: a carroça mais alta começa, carroças ficam atravessadas,
// quem bate ganha os pontos que sobraram na mão dos adversários; jogo trancado → menos pontos ganha.
// Pequenos (3 a 5 anos): partida rápida com figuras, sem tela de opções.
(() => {
  const BICHOS = [
    { emoji: "🐶", nome: "cachorro" }, { emoji: "🐱", nome: "gato" }, { emoji: "🐸", nome: "sapo" },
    { emoji: "🐵", nome: "macaco" }, { emoji: "🐰", nome: "coelho" }, { emoji: "🦆", nome: "pato" },
  ];
  // Posições das bolinhas numa grade 3×3 (0 a 8)
  const PONTOS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 2, 3, 5, 6, 8]];
  const NOMES_CARROCA = ["branco", "ás", "duque", "terno", "quadra", "quina", "sena"];

  // Jogadores em volta da mesa; nas duplas, quem senta de frente é parceiro (lugares 0+2 e 1+3)
  const VOCE = { nome: "Você", icone: "🧒" };
  const BOTS = { urso: { nome: "Urso", artigo: "o", icone: "🐻" }, raposa: { nome: "Raposa", artigo: "a", icone: "🦊" },
    panda: { nome: "Panda", artigo: "o", icone: "🐼" } };
  const MESAS = {
    "2": [VOCE, BOTS.urso],
    "3": [VOCE, BOTS.urso, BOTS.raposa],
    "4": [VOCE, BOTS.urso, BOTS.raposa, BOTS.panda],
    "duplas": [VOCE, BOTS.urso, BOTS.panda, BOTS.raposa],
  };

  // Opções da tela inicial e a escolha padrão de cada faixa
  const OPCOES = [
    { chave: "pecas", titulo: "Peças", valores: [["figuras", "🐶 Figuras"], ["numeros", "🔢 Números"], ["pontos", "⚫ Bolinhas"]] },
    { chave: "jogadores", titulo: "Jogadores", valores: [["2", "👤 2"], ["3", "👥 3"], ["4", "👥 4"], ["duplas", "🤝 Duplas"]] },
    { chave: "compra", titulo: "Comprar no monte", valores: [["sim", "🛒 Sim"], ["nao", "🚫 Não"]] },
    { chave: "meta", titulo: "Partida", valores: [["0", "1 rodada"], ["50", "Até 50 pontos"], ["100", "Até 100 pontos"]] },
    { chave: "nivel", titulo: "Computador", valores: [["facil", "😊 Fácil"], ["esperto", "🧠 Esperto"]] },
    { chave: "dicas", titulo: "Mostrar dicas", valores: [["sim", "💡 Sim"], ["nao", "🙈 Não"]] },
  ];
  const PADRAO = {
    "5-6":  { pecas: "numeros", jogadores: "2", compra: "sim", meta: "0", nivel: "facil", dicas: "sim" },
    "6-8":  { pecas: "pontos", jogadores: "2", compra: "sim", meta: "0", nivel: "facil", dicas: "sim" },
    "8-10": { pecas: "pontos", jogadores: "4", compra: "sim", meta: "50", nivel: "esperto", dicas: "nao" },
  };
  const SIMPLES = { pecas: "figuras", jogadores: "2", compra: "sim", meta: "0", nivel: "facil", dicas: "sim" };

  const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };
  const ler = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
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
      const chave = `domino-opcoes-${id}`;
      const op = { ...PADRAO[id], ...(ler(chave) || {}) };

      area.innerHTML = "";
      const caixa = document.createElement("div");
      caixa.className = "opcoes-jogo";
      OPCOES.forEach(o => {
        const grupo = document.createElement("div");
        grupo.className = "grupo-op";
        const t = document.createElement("div");
        t.className = "titulo-op";
        t.textContent = o.titulo;
        const chips = document.createElement("div");
        chips.className = "chips";
        o.valores.forEach(([valor, rotulo]) => {
          const b = document.createElement("button");
          b.className = "chip" + (op[o.chave] === valor ? " ativo" : "");
          b.textContent = rotulo;
          b.addEventListener("click", () => {
            op[o.chave] = valor;
            chips.querySelectorAll(".chip").forEach(x => x.classList.toggle("ativo", x === b));
          });
          chips.appendChild(b);
        });
        grupo.append(t, chips);
        caixa.appendChild(grupo);
      });
      const jogar = document.createElement("button");
      jogar.className = "chip jogar";
      jogar.textContent = "▶️ Jogar";
      jogar.addEventListener("click", () => { guardar(chave, op); partida(area, { ...op }); });
      caixa.appendChild(jogar);
      area.appendChild(caixa);
      Motor.falar("Escolha como quer jogar e toque em jogar!");
    },
  });

  // ---------- Uma partida (uma ou mais rodadas, até a meta de pontos) ----------
  function partida(area, op) {
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
    const nomeValor = v => op.pecas === "figuras" ? BICHOS[v].nome : NUMEROS_FALADOS[v];
    // Figuras não têm pontos: cada peça que sobra vale 1
    const valorPeca = p => (op.pecas === "figuras" ? 1 : p.a + p.b);
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

      const mesa = []; // peças viradas: { esq, dir, fe, fd, dupla }
      let vez, obrigatoria = null, passes = 0, selecionada = null, acabou = false;

      // Primeira rodada: começa quem tem a maior carroça (ou a maior peça), jogando ela
      if (quemComeca === null) {
        let melhor = null;
        jogadores.forEach(j => j.mao.forEach(p => {
          const peso = (p.a === p.b ? 100 : 0) + p.a + p.b;
          if (!melhor || peso > melhor.peso) melhor = { j, p, peso };
        }));
        vez = melhor.j.lugar;
        obrigatoria = melhor.p;
      } else vez = quemComeca;

      const pontas = () => mesa.length ? [mesa[0].esq, mesa[mesa.length - 1].dir] : null;
      // Pontas onde a peça encaixa ("esq"/"dir"); mesa vazia → "dir"
      function ladosQueCabem(p) {
        const pt = pontas();
        if (!pt) return !obrigatoria || obrigatoria === p ? ["dir"] : [];
        const l = [];
        if (p.a === pt[0] || p.b === pt[0]) l.push("esq");
        if ((p.a === pt[1] || p.b === pt[1]) && !(pt[0] === pt[1] && l.length)) l.push("dir");
        return l;
      }
      const temJogada = j => j.mao.some(p => ladosQueCabem(p).length);

      function colocar(j, p, lado) {
        j.mao.splice(j.mao.indexOf(p), 1);
        const pt = pontas();
        const reto = { esq: p.a, dir: p.b, fe: p.fa, fd: p.fb }, virado = { esq: p.b, dir: p.a, fe: p.fb, fd: p.fa };
        let peca;
        if (!pt) peca = reto;
        else if (lado === "dir") peca = p.a === pt[1] ? reto : virado;
        else peca = p.b === pt[0] ? reto : virado;
        peca.dupla = p.a === p.b;
        peca.nova = true;
        if (lado === "esq") mesa.unshift(peca); else mesa.push(peca);
        obrigatoria = null;
        passes = 0;
        Motor.ploc();
      }

      // ---------- Desenho ----------
      function metade(valor, forma) {
        const m = document.createElement("span");
        m.className = "meia";
        if (forma === "figura") m.textContent = BICHOS[valor].emoji;
        else if (forma === "numero") { m.textContent = valor; m.classList.add("num"); }
        else {
          m.classList.add("pontos");
          for (let i = 0; i < 9; i++) {
            const d = document.createElement("i");
            if (PONTOS[valor].includes(i)) d.className = "on";
            m.appendChild(d);
          }
        }
        return m;
      }

      function desenharPeca(esq, dir, fe, fd, t, { tag = "div", emPe = false } = {}) {
        const el = document.createElement(tag);
        el.className = "domino" + (emPe ? " em-pe" : "");
        el.style.setProperty("--t", t + "px");
        el.append(metade(esq, fe), metade(dir, fd));
        return el;
      }

      let alvos = [];

      function desenhar() {
        area.innerHTML = "";
        const larg = window.innerWidth - 32, alt = window.innerHeight - 112;
        const deitado = larg > alt;

        // Topo: os outros jogadores (peças na mão; quem está pensando pula), o monte e o placar
        const topo = document.createElement("div");
        topo.className = "domino-topo";
        jogadores.slice(1).forEach(j => {
          const el = document.createElement("div");
          el.className = "domino-urso" + (vez === j.lugar ? " pensando" : "") + (duplas && time(j) === 0 ? " parceiro" : "");
          el.textContent = j.icone;
          j.mao.forEach(() => { const c = document.createElement("span"); c.className = "costas"; el.appendChild(c); });
          topo.appendChild(el);
        });
        if (op.compra === "sim") {
          const comprar = document.createElement("button");
          comprar.className = "domino-monte";
          comprar.textContent = `🛒 ${monte.length}`;
          comprar.setAttribute("aria-label", "Comprar peça");
          comprar.disabled = !monte.length || vez !== 0;
          if (vez === 0 && monte.length && !temJogada(voce)) comprar.classList.add("chama");
          comprar.addEventListener("click", comprarPeca);
          topo.appendChild(comprar);
        }
        if (meta) {
          const pl = document.createElement("div");
          pl.className = "domino-placar";
          pl.textContent = placar.map((p, i) => `${duplas ? (i ? "🐻🦊" : "🧒🐼") : jogadores[i].icone} ${p}`).join(" · ") + ` / ${meta}`;
          topo.appendChild(pl);
        }

        // Mão da criança
        const mao = document.createElement("div");
        mao.className = "domino-mao" + (vez === 0 ? " minha-vez" : "");
        const porFilaMao = Math.max(1, Math.min(voce.mao.length, deitado ? 7 : 4));
        const tMao = Math.max(28, Math.min(deitado ? 56 : 72, alt * 0.13, (larg - 10 * porFilaMao) / (2 * porFilaMao + 0.4)));
        voce.mao.forEach(p => {
          const el = desenharPeca(p.a, p.b, p.fa, p.fb, tMao, { tag: "button" });
          el.setAttribute("aria-label", `${nomeValor(p.a)} e ${nomeValor(p.b)}`);
          if (vez === 0 && (dicas || obrigatoria === p) && ladosQueCabem(p).length) el.classList.add("cabe");
          if (selecionada === p) el.classList.add("selecionada");
          Motor.arrastavel(el, { alvos: () => alvos, aoSoltar: alvo => jogar(p, alvo.dataset.lado, el) });
          el.addEventListener("click", () => tocarPeca(p, el));
          mao.appendChild(el);
        });
        const filasMao = Math.ceil(voce.mao.length / Math.max(1, Math.floor(larg / (2 * tMao + 10))));

        // Mesa em "cobrinha": uma fileira vai para a direita, a seguinte volta para a esquerda.
        // Carroças ficam atravessadas (em pé), como no dominó de verdade.
        const mesaEl = document.createElement("div");
        mesaEl.className = "domino-mesa";
        const altMesa = Math.max(80, alt - 70 - filasMao * (tMao + 12) - 20);
        mesaEl.style.height = altMesa + "px";
        mesaEl.style.width = larg + "px";

        const vaga = lado => {
          const v = document.createElement("button");
          v.className = "domino vaga";
          v.dataset.lado = lado;
          v.addEventListener("click", () => { if (selecionada) jogar(selecionada, lado, null); });
          if (selecionada && ladosQueCabem(selecionada).includes(lado)) v.classList.add("escolher");
          return v;
        };
        alvos = vez !== 0 ? [] : mesa.length ? [vaga("esq"), vaga("dir")] : [vaga("dir")];
        const seq = alvos.length === 2 ? [alvos[0], ...mesa, alvos[1]] : alvos.length ? alvos : [...mesa];

        // Maior tamanho de peça que faz tudo caber
        const largura = (item, t) => (item.dupla ? t : 2 * t) + 4;
        let t = 64, filas = [];
        for (; t >= 14; t -= 2) {
          filas = [[]];
          let usado = 0;
          seq.forEach(item => {
            const w = largura(item, t);
            if (usado + w > larg - 16 && filas[filas.length - 1].length) { filas.push([]); usado = 0; }
            filas[filas.length - 1].push(item);
            usado += w;
          });
          const h = filas.reduce((s, f) => s + (f.some(x => x.dupla) ? 2 * t : t) + 6, 0);
          if (h <= altMesa - 16) break;
        }
        filas.forEach((f, i) => {
          const fila = document.createElement("div");
          fila.className = "domino-fila" + (i % 2 ? " volta" : "");
          f.forEach(item => {
            if (item instanceof HTMLElement) { item.style.setProperty("--t", t + "px"); fila.appendChild(item); return; }
            // Nas fileiras de volta, a peça aparece invertida para continuar encostando
            const el = i % 2 && !item.dupla
              ? desenharPeca(item.dir, item.esq, item.fd, item.fe, t)
              : desenharPeca(item.esq, item.dir, item.fe, item.fd, t, { emPe: item.dupla });
            if (item.nova) { el.classList.add("chegou"); item.nova = false; }
            fila.appendChild(el);
          });
          mesaEl.appendChild(fila);
        });

        area.append(topo, mesaEl, mao);
      }

      // ---------- Vez da criança ----------
      function tocarPeca(p, el) {
        if (vez !== 0) return;
        const cabe = ladosQueCabem(p);
        if (!cabe.length) {
          Motor.animar(el, "balanca");
          if (obrigatoria) Motor.falar(`Comece com a carroça de ${NOMES_CARROCA[obrigatoria.a]}!`);
          return;
        }
        if (cabe.length === 1) { jogar(p, cabe[0], el); return; }
        selecionada = p; // cabe nas duas pontas: a criança escolhe onde
        desenhar();
        Motor.falar("Em qual ponta?");
      }

      function jogar(p, lado, el) {
        if (vez !== 0) return false;
        if (!ladosQueCabem(p).includes(lado)) { if (el) Motor.animar(el, "balanca"); return false; }
        selecionada = null;
        colocar(voce, p, lado);
        if (op.pecas === "figuras") Motor.falar(Motor.maiuscula(nomeValor(lado === "esq" ? mesa[0].esq : mesa[mesa.length - 1].dir)));
        if (!voce.mao.length) fimRodada(voce);
        else proximaVez();
        return true;
      }

      function comprarPeca() {
        if (vez !== 0 || !monte.length) return;
        if (temJogada(voce)) { Motor.falar("Você já tem uma peça que encaixa!"); return; }
        voce.mao.push(monte.shift());
        ordenar(voce.mao);
        Motor.nota(600, { dur: 0.12, vol: 0.2 });
        desenhar();
        if (temJogada(voce)) Motor.falar("Essa serve! Jogue ela.");
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
          // Esperto: livra-se das peças pesadas e das carroças, e guarda peças que combinem com as pontas
          const nota = ({ p, lado }) => {
            const pt = pontas();
            const fica = !pt ? p.b : lado === "dir" ? (p.a === pt[1] ? p.b : p.a) : (p.b === pt[0] ? p.a : p.b);
            const outra = !pt ? p.a : lado === "dir" ? pt[0] : pt[1];
            const combinam = j.mao.filter(x => x !== p && [fica, outra].some(v => x.a === v || x.b === v)).length;
            return p.a + p.b + (p.a === p.b ? 4 : 0) + 2 * combinam;
          };
          escolha = jogadas.reduce((m, x) => (nota(x) > nota(m) ? x : m));
        }
        colocar(j, escolha.p, escolha.lado);
        if (!j.mao.length) fimRodada(j);
        else proximaVez();
      }

      function passar(j) {
        passes++;
        if (passes >= n) { fimRodada(null); return; }
        Motor.falar(j === voce ? "Você não tem peça. Passa a vez!" : `${quem(j, true)} passou!`);
        proximaVez(1500);
      }

      function proximaVez(espera = 900) {
        vez = (vez + 1) % n;
        desenhar();
        if (vez === 0) avisarVez();
        else Motor.depois(jogadaBot, espera);
      }

      function avisarVez() {
        if (!temJogada(voce)) {
          if (monte.length) Motor.falar("Nenhuma peça encaixa. Toque no carrinho para comprar!");
          else Motor.depois(() => passar(voce), 900);
          return;
        }
        if (obrigatoria) return Motor.falar(`Você começa! Jogue a carroça de ${NOMES_CARROCA[obrigatoria.a]}.`);
        if (!mesa.length) return Motor.falar("Você começa! Jogue qualquer peça.");
        if (!dicas) return Motor.falar("Sua vez!");
        const [e, d] = pontas();
        Motor.falar(e === d ? `Sua vez! Precisa de ${nomeValor(e)}.` : `Sua vez! Precisa de ${nomeValor(e)} ou ${nomeValor(d)}.`);
      }

      // ---------- Fim da rodada e da partida ----------
      function fimRodada(bateu) {
        acabou = true;
        vez = -1;
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
        let pontos = 0;
        if (vencedor) {
          pontos = jogadores.filter(j => time(j) !== time(vencedor)).reduce((s, j) => s + soma(j), 0);
          placar[time(vencedor)] += pontos;
          quemComeca = vencedor.lugar;
        }
        desenhar();
        Motor.falar(frase);
        Motor.depois(() => telaResultado(vencedor, frase, pontos), 2600);
      }

      function telaResultado(vencedor, frase, pontos) {
        area.innerHTML = "";
        // Time que ganhou a partida (-1: ninguém ainda / empate)
        const campeao = meta ? placar.findIndex(p => p >= meta) : vencedor ? time(vencedor) : -1;
        const terminou = !meta || campeao >= 0;
        const nos = vencedor && time(vencedor) === 0;
        const caixa = document.createElement("div");
        caixa.className = "fim";
        caixa.innerHTML = `<div class="trofeu"></div><div class="resumo"></div><div class="placar-fim"></div>`;
        const iconeTime = tm => jogadores.find(j => time(j) === tm && j !== voce).icone;
        caixa.querySelector(".trofeu").textContent = terminou
          ? (campeao < 0 ? "🤝" : campeao === 0 ? "🏆" : iconeTime(campeao))
          : (!vencedor ? "🤝" : nos ? "⭐" : vencedor.icone);
        caixa.querySelector(".resumo").textContent = frase + (pontos ? ` +${pontos} ${pontos === 1 ? "ponto" : "pontos"}` : "");
        if (meta) caixa.querySelector(".placar-fim").textContent = placar.map((p, i) => `${nomesTime[i]}: ${p}`).join(" · ");
        const botao = document.createElement("button");
        botao.className = "modo";
        botao.innerHTML = `<span class="icone"></span><span class="rotulo"></span>`;
        botao.querySelector(".icone").textContent = terminou ? "🔁" : "▶️";
        botao.querySelector(".rotulo").textContent = terminou ? "Jogar de novo" : "Próxima rodada";
        botao.addEventListener("click", () => (terminou ? partida(area, op) : rodada()));
        caixa.appendChild(botao);
        area.appendChild(caixa);

        let fala;
        if (!terminou) fala = `${frase} Vamos para a próxima rodada!`;
        else if (campeao === 0) fala = duplas ? "Você e o Panda ganharam a partida!" : "Você ganhou a partida!";
        else if (campeao < 0) fala = "Empatou! Vamos jogar de novo?";
        else fala = `${duplas ? "Urso e Raposa ganharam" : quem(jogadores[campeao], true) + " ganhou"} desta vez! Vamos jogar de novo?`;
        if (terminou && campeao === 0) { Motor.comemorar(caixa.querySelector(".trofeu")); Motor.tim(); }
        else if (nos) Motor.tim();
        Motor.falar(fala);
      }

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
