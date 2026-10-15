// Come-Come do Labirinto: o Comilão (uma bolinha amarela comilona) anda pelo labirinto comendo
// pontinhos e fugindo dos fantasmas. As 4 cerejas 🍒 deixam os fantasmas azuis e assustados por
// alguns segundos: aí dá para comê-los e eles voltam para a casinha. Comer todos os pontinhos
// passa de fase (e tudo fica um pouco mais rápido). O túnel dos lados atravessa o labirinto.
// Controles: deslizar o dedo no tabuleiro, cruz de botões grandes e setas do teclado. A direção
// escolhida fica "guardada": o Comilão vira assim que a esquina permitir.
(() => {
  // Mapas: # parede · . pontinho · o cereja · - porta da casinha · G casinha · P início · espaço vazio
  // A linha com espaços nas pontas é o túnel que atravessa de um lado para o outro.
  const MAPAS = [
    [
      "###################",
      "#........#........#",
      "#o##.###.#.###.##o#",
      "#.................#",
      "#.##.#.#####.#.##.#",
      "#....#...#...#....#",
      "####.### # ###.####",
      "####.#       #.####",
      "####.# ##-## #.####",
      "    .  #GGG#  .    ",
      "####.# ##### #.####",
      "####.#       #.####",
      "####.# ##### #.####",
      "#........#........#",
      "#.##.###.#.###.##.#",
      "#o.#.....P.....#.o#",
      "##.#.#.#####.#.#.##",
      "#....#...#...#....#",
      "#.######.#.######.#",
      "#.................#",
      "###################",
    ],
    [
      "###################",
      "#o.......#.......o#",
      "#.##.###.#.###.##.#",
      "#.................#",
      "#.##.#.#####.#.##.#",
      "#....#...#...#....#",
      "####.###.#.###.####",
      "####.#.......#.####",
      "    ...##-##...    ",
      "####.#.#GGG#.#.####",
      "####.#.#####.#.####",
      "####.#.......#.####",
      "####.#.#####.#.####",
      "#........#........#",
      "#.##.###.#.###.##.#",
      "#..#.....P.....#..#",
      "##.#.#.#####.#.#.##",
      "#....#...#...#....#",
      "#.######.#.######.#",
      "#o...............o#",
      "###################",
    ],
    [
      "###################",
      "#.....#.....#.....#",
      "#o###.#.###.#.###o#",
      "#.................#",
      "#.###.##.#.##.###.#",
      "#...#....#....#...#",
      "###.#.#######.#.###",
      "###.#.........#.###",
      "###.#.##-##.#.#.###",
      "   ...#GGG#.#...   ",
      "###.#.#####.#.#.###",
      "###.#.........#.###",
      "###.#.#######.#.###",
      "#........#........#",
      "#.###.##.#.##.###.#",
      "#o..#....P....#..o#",
      "###.#.#.###.#.#.###",
      "#.....#.....#.....#",
      "#.#######.#######.#",
      "#.................#",
      "###################",
    ],
  ];
  const W = 19, H = 21;
  const CORES_PAREDE = ["#3a6df0", "#22a865", "#9b4fe8"];
  const DIRS = { cima: [0, -1], baixo: [0, 1], esquerda: [-1, 0], direita: [1, 0] };
  const OPOSTO = { cima: "baixo", baixo: "cima", esquerda: "direita", direita: "esquerda" };
  const ORDEM = ["cima", "esquerda", "baixo", "direita"];
  // Fantasmas: cada um com seu jeito. `solta`: segundos até sair da casinha; `canto`: para onde
  // vão quando estão "passeando".
  const FANTASMAS = {
    vermelho: { nome: "Pimenta", cor: "#ff4040", jeito: "persegue", canto: [W - 2, 0] },
    rosa: { nome: "Rosinha", cor: "#ff8ad8", jeito: "corta", canto: [1, 0] },
    ciano: { nome: "Bolha", cor: "#3fe0e8", jeito: "aleatorio", canto: [W - 2, H - 1] },
    laranja: { nome: "Laranjinha", cor: "#ffa53d", jeito: "alterna", canto: [1, H - 1] },
  };
  const MODOS = {
    facil: { fantasmas: [["vermelho", 0], ["ciano", 5]], vel: 4.9, velF: 3.4, susto: 9 },
    normal: { fantasmas: [["vermelho", 0], ["rosa", 2], ["ciano", 6], ["laranja", 10]], vel: 5.4, velF: 4.9, susto: 7 },
  };
  const recorde = () => { try { return +localStorage.getItem("labirinto-recorde") || 0; } catch (e) { return 0; } };

  JOGOS.push({
    id: "labirinto", teclas: true,
    nome: "Come-Come do Labirinto",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#0d1430"/><path d="M8 8h48M8 56h48" stroke="#3a6df0" stroke-width="5" stroke-linecap="round"/><circle cx="34" cy="32" r="3" fill="#ffe8b0"/><circle cx="46" cy="32" r="3" fill="#ffe8b0"/><circle cx="56" cy="32" r="3" fill="#ffe8b0"/><path d="M22 32 L33 25 A13 13 0 1 0 33 39 Z" fill="#ffd60a" stroke="#c99a00" stroke-width="1.5"/><circle cx="20" cy="24" r="2" fill="#151515"/><path d="M40 52v-9a7 7 0 0 1 14 0v9l-2.3-2-2.4 2-2.3-2-2.4 2-2.3-2z" fill="#ff4040"/><circle cx="44.5" cy="43" r="2" fill="#fff"/><circle cx="50" cy="43" r="2" fill="#fff"/></svg>',
    faixas: ["6-8", "8-10"],
    iniciar(area) {
      Motor.escolherModo(area, [
        { icone: "🐢", rotulo: "Fácil", iniciar: () => jogo(area, "facil") },
        { icone: "🐇", rotulo: "Normal", iniciar: () => jogo(area, "normal") },
      ]);
    },
  });

  function jogo(area, modo) {
    const M = MODOS[modo];
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    let mapa, fundo, restantes, jogador, fantasmas, porta, saida, casaY, distSaida;
    let pontos, vidas, fase, agora, inicioVida, sustoAte, combo, situacao, tSituacao, popups;
    let pausado, acabou, ultimoT, waka = 0, avisouCereja;

    // ---------- Tela ----------
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "lab-tela";
    area.appendChild(tela);
    const deitado = tela.clientWidth > tela.clientHeight;
    tela.classList.toggle("deitado", deitado);

    const barra = document.createElement("div");
    barra.className = "lab-barra";
    const info = document.createElement("div");
    info.className = "lab-info";
    const pausa = document.createElement("button");
    pausa.className = "chip";
    pausa.addEventListener("click", alternarPausa);
    barra.append(info, pausa, Motor.botaoSom());

    const canvas = document.createElement("canvas");
    canvas.className = "lab-tabuleiro";
    const cruz = document.createElement("div");
    cruz.className = "lab-cruz";
    tela.append(barra, canvas, cruz);

    const larg = tela.clientWidth, alt = tela.clientHeight;
    const cel = Math.max(10, Math.floor(deitado
      ? Math.min((alt - 8) / H, (larg - 170 - 230) / W)
      : Math.min((larg - 4) / W, (alt - 96 - 214) / H)));
    const LW = W * cel, LH = H * cel;
    const dpr = window.devicePixelRatio || 1;
    Object.assign(canvas, { width: LW * dpr, height: LH * dpr });
    Object.assign(canvas.style, { width: LW + "px", height: LH + "px" });
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // ---------- Mapa ----------
    const wrap = x => ((x % W) + W) % W;
    const casa = (x, y) => (y < 0 || y >= H ? "#" : mapa[y][wrap(x)]);
    const anda = (x, y) => !"#-G".includes(casa(x, y));

    function carregarMapa() {
      const m = MAPAS[(fase - 1) % MAPAS.length];
      mapa = m.map(l => [...l]);
      restantes = 0;
      mapa.forEach((l, y) => l.forEach((ch, x) => {
        if (ch === "." || ch === "o") restantes++;
        if (ch === "-") porta = { x, y };
      }));
      saida = { x: porta.x, y: porta.y - 1 };
      casaY = porta.y + 1;
      // Distância de cada casa até a saída da casinha (os "olhos" usam para voltar)
      distSaida = mapa.map(l => l.map(() => Infinity));
      distSaida[saida.y][saida.x] = 0;
      const fila = [[saida.x, saida.y]];
      while (fila.length) {
        const [x, y] = fila.shift();
        for (const d of ORDEM) {
          const nx = wrap(x + DIRS[d][0]), ny = y + DIRS[d][1];
          if (anda(nx, ny) && distSaida[ny][nx] === Infinity) { distSaida[ny][nx] = distSaida[y][x] + 1; fila.push([nx, ny]); }
        }
      }
      desenharFundo();
    }

    // Paredes desenhadas uma vez numa tela escondida: "canos" grossos com pontas arredondadas
    function desenharFundo() {
      fundo = document.createElement("canvas");
      Object.assign(fundo, { width: LW * dpr, height: LH * dpr });
      const c = fundo.getContext("2d");
      c.scale(dpr, dpr);
      c.fillStyle = "#0d1430";
      c.fillRect(0, 0, LW, LH);
      const cor = CORES_PAREDE[(fase - 1) % CORES_PAREDE.length];
      const parede = (x, y) => x >= 0 && x < W && y >= 0 && y < H && mapa[y][x] === "#";
      const g = cel * 0.62, m = (cel - g) / 2;
      c.fillStyle = cor;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!parede(x, y)) continue;
        c.beginPath();
        c.roundRect ? c.roundRect(x * cel + m, y * cel + m, g, g, g * 0.35) : c.rect(x * cel + m, y * cel + m, g, g);
        c.fill();
        if (parede(x + 1, y)) c.fillRect(x * cel + cel / 2, y * cel + m, cel, g);
        if (parede(x, y + 1)) c.fillRect(x * cel + m, y * cel + cel / 2, g, cel);
        if (parede(x + 1, y) && parede(x, y + 1) && parede(x + 1, y + 1)) c.fillRect(x * cel + cel / 2, y * cel + cel / 2, cel, cel);
      }
      // Brilho por cima das paredes
      c.strokeStyle = "rgba(255,255,255,.25)";
      c.lineWidth = Math.max(1, cel * 0.06);
      c.strokeRect(1, 1, LW - 2, LH - 2);
      // Porta da casinha
      c.fillStyle = "#ff9ecf";
      c.fillRect(porta.x * cel, porta.y * cel + cel * 0.4, cel, cel * 0.2);
    }

    // ---------- Personagens ----------
    function posicionar() {
      let px = 9, py = 15;
      MAPAS[(fase - 1) % MAPAS.length].forEach((l, y) => { const x = l.indexOf("P"); if (x >= 0) { px = x; py = y; } });
      jogador = { x: px, y: py, dir: null, quer: null, olhar: "esquerda", boca: 0 };
      fantasmas = M.fantasmas.map(([id, solta], i) => {
        const f = { ...FANTASMAS[id], id, solta, dir: "esquerda", assustado: false };
        if (solta === 0) Object.assign(f, { x: saida.x, y: saida.y, estado: "normal" });
        else Object.assign(f, { x: porta.x + [0, -1, 1, 0][i % 4], y: casaY, estado: "casa" });
        return f;
      });
      sustoAte = 0;
      combo = 0;
      popups = [];
    }

    const multFase = () => Math.min(1.45, 1 + 0.08 * (fase - 1));
    const assustados = () => agora < sustoAte;

    // Anda `dist` casas, parando em cada centro de casa para decidir a direção
    function andar(e, dist, decidir) {
      for (let n = 0; dist > 1e-6 && n < 12; n++) {
        const noCentro = Math.abs(e.x - Math.round(e.x)) < 1e-6 && Math.abs(e.y - Math.round(e.y)) < 1e-6;
        if (noCentro) {
          e.x = Math.round(e.x); e.y = Math.round(e.y);
          decidir(e);
          if (!e.dir) return;
          const [dx, dy] = DIRS[e.dir];
          const passo = Math.min(dist, 1);
          e.x += dx * passo; e.y += dy * passo;
          dist -= passo;
        } else {
          const [dx, dy] = DIRS[e.dir];
          const alvo = dx > 0 ? Math.ceil(e.x) : dx < 0 ? Math.floor(e.x) : dy > 0 ? Math.ceil(e.y) : Math.floor(e.y);
          const d = Math.abs(alvo - (dx ? e.x : e.y));
          const passo = Math.min(dist, d);
          if (dx) e.x = passo === d ? alvo : e.x + dx * passo;
          else e.y = passo === d ? alvo : e.y + dy * passo;
          dist -= passo;
        }
        if (e.x < -0.5) e.x += W;
        if (e.x >= W - 0.5) e.x -= W;
      }
    }

    function decidirJogador(j) {
      if (j.quer && anda(j.x + DIRS[j.quer][0], j.y + DIRS[j.quer][1])) j.dir = j.quer;
      else if (j.dir && !anda(j.x + DIRS[j.dir][0], j.y + DIRS[j.dir][1])) j.dir = null;
      if (j.dir) j.olhar = j.dir;
    }

    function alvoDe(f) {
      const jx = Math.round(jogador.x), jy = Math.round(jogador.y);
      const ciclo = agora - inicioVida;
      const passeando = ciclo < 5 || (ciclo - 5) % 25 >= 20; // começo calmo e pausas para passear
      if (passeando) return f.canto;
      if (f.jeito === "corta") {
        const [dx, dy] = DIRS[jogador.dir || jogador.olhar];
        return [jx + 4 * dx, jy + 4 * dy];
      }
      if (f.jeito === "alterna" && Math.floor(ciclo / 6) % 2) return f.canto;
      return [jx, jy];
    }

    function decidirFantasma(f) {
      if (f.estado === "olhos") {
        if (f.x === saida.x && f.y === saida.y) { f.estado = "entrando"; f.dir = null; return; }
        let melhor = null, menor = Infinity;
        for (const d of ORDEM) {
          const nx = wrap(f.x + DIRS[d][0]), ny = f.y + DIRS[d][1];
          if (anda(nx, ny) && distSaida[ny][nx] < menor) { menor = distSaida[ny][nx]; melhor = d; }
        }
        f.dir = melhor;
        return;
      }
      const opcoes = ORDEM.filter(d => d !== OPOSTO[f.dir] && anda(f.x + DIRS[d][0], f.y + DIRS[d][1]));
      if (!opcoes.length) { f.dir = OPOSTO[f.dir]; return; }
      if (f.assustado || f.jeito === "aleatorio") { f.dir = Motor.sortear(opcoes); return; }
      const [tx, ty] = alvoDe(f);
      let menor = Infinity;
      opcoes.forEach(d => {
        const nx = f.x + DIRS[d][0], ny = f.y + DIRS[d][1];
        const dist = (nx - tx) ** 2 + (ny - ty) ** 2;
        if (dist < menor) { menor = dist; f.dir = d; }
      });
    }

    // Movimento "de roteiro" dentro da casinha (sair e entrar)
    function irPara(f, x, y, dist) {
      const dx = x - f.x, dy = y - f.y;
      if (Math.abs(dx) > 1e-6) { const p = Math.min(dist, Math.abs(dx)); f.x += Math.sign(dx) * p; dist -= p; }
      if (dist > 0 && Math.abs(dy) > 1e-6) { const p = Math.min(dist, Math.abs(dy)); f.y += Math.sign(dy) * p; dist -= p; }
      return Math.abs(f.x - x) < 1e-6 && Math.abs(f.y - y) < 1e-6;
    }

    function moverFantasma(f, dt) {
      const vel = M.velF * multFase();
      if (f.estado === "casa") {
        if (agora - inicioVida >= f.solta) f.estado = "saindo";
      } else if (f.estado === "saindo") {
        const passo = 2.6 * dt;
        if (Math.abs(f.x - porta.x) > 1e-6) irPara(f, porta.x, f.y, passo);
        else if (irPara(f, saida.x, saida.y, passo)) {
          f.x = saida.x; f.y = saida.y;
          f.estado = "normal";
          f.dir = Math.random() < 0.5 ? "esquerda" : "direita";
        }
      } else if (f.estado === "entrando") {
        if (irPara(f, porta.x, casaY, 6 * dt)) { f.assustado = false; f.estado = "saindo"; }
      } else if (f.estado === "olhos") {
        andar(f, 11 * dt, decidirFantasma);
      } else {
        andar(f, (f.assustado ? 0.55 : 1) * vel * dt, decidirFantasma);
      }
    }

    function assustar() {
      sustoAte = agora + Math.max(3, M.susto - (fase - 1) * 0.8);
      combo = 0;
      fantasmas.forEach(f => {
        if (f.estado === "olhos" || f.estado === "entrando") return;
        f.assustado = true;
        if (f.estado === "normal" && f.dir) {
          const [dx, dy] = DIRS[f.dir];
          // Dá meia-volta (se estiver bem no centro de uma casa, só se a casa de trás estiver livre)
          const centro = Number.isInteger(f.x) && Number.isInteger(f.y);
          if (!centro || anda(f.x - dx, f.y - dy)) f.dir = OPOSTO[f.dir];
        }
      });
      [523, 659, 784, 1046].forEach((fr, i) => Motor.nota(fr, { dur: 0.12, tipo: "square", vol: 0.06, inicio: i * 0.06 }));
      if (!avisouCereja) { avisouCereja = true; Motor.falar("Os fantasmas ficaram com medo! Pegue eles!"); }
    }

    // ---------- Laço do jogo ----------
    function atualizar(dt) {
      agora += dt;
      popups = popups.filter(p => p.ate > agora);
      if (situacao === "pronto") {
        if (agora - tSituacao > 1.8) { situacao = "jogando"; inicioVida = agora; }
        return;
      }
      if (situacao === "morrendo") {
        if (agora - tSituacao > 1.6) {
          vidas--;
          atualizarInfo();
          if (vidas <= 0) return fim();
          posicionar();
          situacao = "pronto"; tSituacao = agora;
          Motor.falar(vidas === 1 ? "Última vida! Você consegue!" : "Vamos de novo!");
        }
        return;
      }
      if (situacao === "passou") {
        if (agora - tSituacao > 2.4) {
          fase++;
          carregarMapa();
          posicionar();
          situacao = "pronto"; tSituacao = agora;
          atualizarInfo();
        }
        return;
      }
      // Jogando
      const ax = jogador.x, ay = jogador.y;
      andar(jogador, M.vel * multFase() * dt, decidirJogador);
      let mov = Math.abs(jogador.x - ax) + Math.abs(jogador.y - ay);
      if (mov > W / 2) mov = 0.1; // atravessou o túnel
      jogador.boca += mov;
      comer();
      if (situacao !== "jogando") return;
      if (!assustados()) fantasmas.forEach(f => { f.assustado = false; });
      fantasmas.forEach(f => moverFantasma(f, dt));
      encontros();
    }

    function comer() {
      const x = wrap(Math.round(jogador.x)), y = Math.round(jogador.y);
      const ch = mapa[y][x];
      if (ch !== "." && ch !== "o") return;
      mapa[y][x] = " ";
      restantes--;
      if (ch === ".") {
        pontos += 10;
        waka = 1 - waka;
        Motor.nota(waka ? 520 : 390, { dur: 0.07, tipo: "triangle", vol: 0.07 });
      } else {
        pontos += 50;
        assustar();
      }
      atualizarInfo();
      if (restantes <= 0) {
        situacao = "passou"; tSituacao = agora;
        pontos += 100 * fase;
        atualizarInfo();
        Motor.tim();
        Motor.falar(`${Motor.elogio()} Fase ${fase + 1}!`);
      }
    }

    function encontros() {
      for (const f of fantasmas) {
        if (f.estado !== "normal" && f.estado !== "saindo") continue;
        let dx = Math.abs(f.x - jogador.x);
        dx = Math.min(dx, W - dx);
        if (dx + Math.abs(f.y - jogador.y) > 0.65) continue;
        if (f.assustado) {
          const valor = 200 * 2 ** combo;
          combo = Math.min(combo + 1, 3);
          pontos += valor;
          popups.push({ x: f.x, y: f.y, txt: String(valor), ate: agora + 1 });
          f.assustado = false;
          f.estado = "olhos";
          // Encaixa o fantasma no centro mais próximo para os olhos poderem decidir o caminho
          f.x = Math.round(f.x); f.y = Math.round(f.y);
          if (f.x >= W) f.x -= W;
          Motor.nota(300, { dur: 0.25, tipo: "square", vol: 0.07, ate: 1200 });
          atualizarInfo();
        } else {
          situacao = "morrendo"; tSituacao = agora;
          [494, 440, 392, 349, 294].forEach((fr, i) => Motor.nota(fr, { dur: 0.22, tipo: "triangle", vol: 0.12, inicio: i * 0.18 }));
          return;
        }
      }
    }

    function laco(t) {
      if (!vivo() || pausado || acabou) return;
      const dt = Math.min(0.05, Math.max(0, (t - ultimoT) / 1000));
      ultimoT = t;
      atualizar(dt);
      desenhar();
      if (!acabou) requestAnimationFrame(laco);
    }

    // ---------- Desenho ----------
    function desenhar() {
      ctx.drawImage(fundo, 0, 0, LW, LH);
      if (situacao === "passou" && Math.floor((agora - tSituacao) * 5) % 2) {
        ctx.fillStyle = "rgba(255,255,255,.35)";
        ctx.fillRect(0, 0, LW, LH);
      }
      // Pontinhos e cerejas
      const pulso = 1 + 0.12 * Math.sin(agora * 8);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const ch = mapa[y][x];
        if (ch === ".") {
          ctx.fillStyle = "#ffe8b0";
          ctx.beginPath();
          ctx.arc((x + 0.5) * cel, (y + 0.5) * cel, Math.max(1.6, cel * 0.12), 0, Math.PI * 2);
          ctx.fill();
        } else if (ch === "o") {
          ctx.font = `${Math.round(cel * 0.95 * pulso)}px sans-serif`;
          ctx.fillText("🍒", (x + 0.5) * cel, (y + 0.55) * cel);
        }
      }
      fantasmas.forEach(desenharFantasma);
      desenharJogador();
      // Pontos de fantasma comido
      ctx.font = `bold ${Math.round(cel * 0.7)}px sans-serif`;
      popups.forEach(p => {
        ctx.fillStyle = "#7df9ff";
        ctx.fillText(p.txt, (p.x + 0.5) * cel, (p.y + 0.5 - (1 - (p.ate - agora)) * 0.8) * cel);
      });
      if (situacao === "pronto") faixa("Prepare-se!", "#ffd60a");
      if (situacao === "passou") faixa(`⭐ Fase ${fase + 1}!`, "#7dff9b");
      if (pausado && !acabou) {
        ctx.fillStyle = "rgba(0,0,0,.55)";
        ctx.fillRect(0, 0, LW, LH);
        faixa("⏸️ Pausa", "#fff");
      }
    }

    function faixa(texto, cor) {
      const y = (casaY + 2.5) * cel;
      ctx.fillStyle = "rgba(13,20,48,.85)";
      ctx.fillRect(0, y - cel * 0.9, LW, cel * 1.8);
      ctx.fillStyle = cor;
      ctx.font = `bold ${Math.round(cel * 1.2)}px sans-serif`;
      ctx.fillText(texto, LW / 2, y + cel * 0.05);
    }

    function desenharJogador() {
      const j = jogador, r = cel * 0.47;
      let a = 0.05 + 0.3 * Math.abs(Math.sin(j.boca * Math.PI)); // abertura da boca (fração de meia volta)
      let raio = r;
      if (situacao === "morrendo") {
        const p = Math.min(1, (agora - tSituacao) / 1.3);
        a = 0.2 + 0.8 * p;
        raio = r * (1 - 0.6 * p);
      } else if (!j.dir && situacao === "jogando") a = 0.2;
      const desenhaEm = x => {
        ctx.save();
        ctx.translate((x + 0.5) * cel, (j.y + 0.5) * cel);
        if (j.olhar === "esquerda") ctx.scale(-1, 1);
        else ctx.rotate({ direita: 0, baixo: Math.PI / 2, cima: -Math.PI / 2 }[j.olhar]);
        ctx.fillStyle = "#ffd60a";
        ctx.strokeStyle = "#c99a00";
        ctx.lineWidth = Math.max(1, cel * 0.06);
        ctx.beginPath();
        if (a >= 0.99) ctx.arc(0, 0, 0.01, 0, 0.01);
        else { ctx.moveTo(0, 0); ctx.arc(0, 0, raio, a * Math.PI, (2 - a) * Math.PI); ctx.closePath(); }
        ctx.fill();
        ctx.stroke();
        if (a < 0.8) {
          ctx.fillStyle = "#151515";
          ctx.beginPath();
          ctx.arc(raio * 0.12, -raio * 0.52, Math.max(1.2, raio * 0.13), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };
      desenhaEm(j.x);
      // No túnel aparece pela metade dos dois lados
      if (j.x > W - 1) desenhaEm(j.x - W);
      if (j.x < 0) desenhaEm(j.x + W);
    }

    function desenharFantasma(f) {
      const px = (f.x + 0.5) * cel;
      const balanco = f.estado === "casa" ? Math.sin(agora * 5 + f.solta) * 0.15 : 0;
      const py = (f.y + 0.5 + balanco) * cel, r = cel * 0.46;
      const olhos = f.estado === "olhos" || f.estado === "entrando";
      if (!olhos) {
        const resta = sustoAte - agora;
        const piscando = f.assustado && resta < 2 && Math.floor(resta * 6) % 2 === 0;
        ctx.fillStyle = f.assustado ? (piscando ? "#ffffff" : "#2a49ff") : f.cor;
        ctx.beginPath();
        ctx.arc(px, py - r * 0.1, r, Math.PI, 0);
        const base = py + r * 0.9, n = 6, passo = (2 * r) / n, onda = Math.floor(agora * 8) % 2;
        ctx.lineTo(px + r, base);
        for (let i = 1; i <= n; i++) ctx.lineTo(px + r - i * passo, base - ((i + onda) % 2 ? r * 0.28 : 0));
        ctx.closePath();
        ctx.fill();
        if (f.assustado) {
          ctx.fillStyle = piscando ? "#ff3b3b" : "#ffe8b0";
          ctx.strokeStyle = ctx.fillStyle;
          [-1, 1].forEach(s => { ctx.beginPath(); ctx.arc(px + s * r * 0.35, py - r * 0.25, r * 0.13, 0, Math.PI * 2); ctx.fill(); });
          ctx.lineWidth = Math.max(1, r * 0.1);
          ctx.beginPath();
          for (let i = 0; i <= 4; i++) ctx.lineTo(px - r * 0.5 + i * r * 0.25, py + r * 0.3 + (i % 2 ? -r * 0.12 : 0));
          ctx.stroke();
          return;
        }
      }
      const [dx, dy] = DIRS[f.dir || "baixo"];
      [-1, 1].forEach(s => {
        const ex = px + s * r * 0.38, ey = py - r * 0.2;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(ex, ey, r * 0.27, r * 0.33, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#1d3bd1";
        ctx.beginPath();
        ctx.arc(ex + dx * r * 0.13, ey + dy * r * 0.15, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function atualizarInfo() {
      info.innerHTML = "";
      [["Pontos", pontos], ["Vidas", "💛".repeat(Math.max(0, vidas))], ["Fase", fase], ["🏆", Math.max(recorde(), pontos)]].forEach(([r, v]) => {
        const d = document.createElement("div");
        d.innerHTML = "<span></span><b></b>";
        d.querySelector("span").textContent = r;
        d.querySelector("b").textContent = v || "–";
        info.appendChild(d);
      });
      pausa.textContent = pausado ? "▶️ Continuar" : "⏸️ Pausar";
    }

    // ---------- Controles ----------
    function querer(dir) {
      if (acabou || pausado) return;
      jogador.quer = dir;
      // Meia-volta é na hora; as outras curvas ficam guardadas até a próxima esquina
      if (jogador.dir && dir === OPOSTO[jogador.dir]) { jogador.dir = dir; jogador.olhar = dir; }
    }

    function alternarPausa() {
      if (acabou) return;
      pausado = !pausado;
      atualizarInfo();
      desenhar();
      if (!pausado) { ultimoT = performance.now(); requestAnimationFrame(laco); }
    }

    const botao = (icone, rotulo, dir) => {
      const b = document.createElement("button");
      b.className = `lab-botao lab-${dir}`;
      b.textContent = icone;
      b.setAttribute("aria-label", rotulo);
      b.addEventListener("pointerdown", e => { e.preventDefault(); querer(dir); });
      return b;
    };
    cruz.append(botao("⬆️", "Para cima", "cima"), botao("⬅️", "Para a esquerda", "esquerda"),
      botao("➡️", "Para a direita", "direita"), botao("⬇️", "Para baixo", "baixo"));

    // Deslizar o dedo no tabuleiro (cada deslizada escolhe uma direção; dá para emendar várias)
    let toque = null;
    canvas.addEventListener("pointerdown", e => { toque = { x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } });
    canvas.addEventListener("pointermove", e => {
      if (!toque) return;
      const dx = e.clientX - toque.x, dy = e.clientY - toque.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
      querer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "direita" : "esquerda") : (dy > 0 ? "baixo" : "cima"));
      toque = { x: e.clientX, y: e.clientY };
    });
    ["pointerup", "pointercancel"].forEach(ev => canvas.addEventListener(ev, () => { toque = null; }));

    const teclas = e => {
      if (!vivo()) { document.removeEventListener("keydown", teclas); return; }
      const mapaTeclas = { ArrowUp: "cima", ArrowDown: "baixo", ArrowLeft: "esquerda", ArrowRight: "direita", w: "cima", s: "baixo", a: "esquerda", d: "direita" };
      if (mapaTeclas[e.key]) { e.preventDefault(); querer(mapaTeclas[e.key]); }
      else if (e.key === "p" || e.key === " " || e.key === "Escape") { e.preventDefault(); alternarPausa(); }
    };
    document.addEventListener("keydown", teclas);

    // ---------- Começo e fim ----------
    function comecar() {
      pontos = 0; vidas = 3; fase = 1; agora = 0; inicioVida = 0; pausado = false; acabou = false; avisouCereja = false;
      tela.querySelector(".lab-fim")?.remove();
      carregarMapa();
      posicionar();
      situacao = "pronto"; tSituacao = 0;
      atualizarInfo();
      ultimoT = performance.now();
      requestAnimationFrame(laco);
    }

    function fim() {
      acabou = true;
      situacao = "fim";
      const novoRecorde = pontos > recorde();
      if (novoRecorde) { try { localStorage.setItem("labirinto-recorde", pontos); } catch (e) { /* ok */ } }
      atualizarInfo();
      desenhar();
      const caixa = document.createElement("div");
      caixa.className = "lab-fim";
      caixa.innerHTML = `<div class="titulo-fim"></div><div class="pontos-fim"></div>`;
      caixa.querySelector(".titulo-fim").textContent = novoRecorde ? "🏆 Novo recorde!" : "Fim de jogo!";
      caixa.querySelector(".pontos-fim").textContent = `${pontos} pontos · chegou na fase ${fase}`;
      const b = document.createElement("button");
      b.className = "chip executar";
      b.textContent = "🔁 Jogar de novo";
      b.addEventListener("click", comecar);
      caixa.appendChild(b);
      tela.appendChild(caixa);
      if (novoRecorde) { Motor.comemorar(caixa); Motor.tim(); }
      Motor.falar(novoRecorde ? `Novo recorde! ${pontos} pontos!` : `Fim de jogo! Você fez ${pontos} pontos.`);
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.LABIRINTO_TESTE) {
      window.LABIRINTO_TESTE = {
        estado: () => ({
          mapa: mapa.map(l => l.join("")), jogador: { ...jogador }, situacao, pontos, vidas, fase, restantes, acabou,
          fantasmas: fantasmas.map(f => ({ id: f.id, x: f.x, y: f.y, estado: f.estado, assustado: f.assustado })),
        }),
        querer,
        // Deixa só `n` pontinhos (para testar a passagem de fase sem esperar)
        deixar(n) {
          let k = 0;
          mapa.forEach(l => l.forEach((ch, x) => { if (ch === "." && k++ >= n) l[x] = " "; }));
          restantes = mapa.flat().filter(ch => ch === "." || ch === "o").length;
        },
      };
    }

    comecar();
    Motor.falar("Coma todos os pontinhos e fuja dos fantasmas! As cerejas deixam os fantasmas com medo.");
  }

  // Para testes em Node
  if (typeof globalThis !== "undefined") globalThis.LabirintoTeste = { MAPAS, W, H };
})();
