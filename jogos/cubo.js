// Cubo mágico 3D (2×2 e 3×3), feito só com CSS 3D.
// - Livre: embaralhar, girar as faces pelos botões (notação U D L R F B, ' = ao contrário),
//   arrastar o dedo na tela gira a visão; cronômetro e recorde.
// - Aprender: lições guiadas — os movimentos, desfazer, o "algoritmo mágico" e os algoritmos
//   do método das camadas. Em cada lição o cubo começa "bagunçado só um pouquinho" e a
//   criança segue o algoritmo (o próximo movimento fica destacado) até o cubo ficar pronto.
//
// Modelo: cada cubinho tem posição (x, y, z) e uma matriz de rotação 3×3. Eixos do CSS:
// x para a direita, y para baixo, z para fora da tela. Girar uma face = rotacionar 90° os
// cubinhos daquela camada (mesma conta que o rotateX/Y/Z do CSS, usada na animação).
(() => {
  // Cores (branco embaixo, amarelo em cima, verde na frente — como no método das camadas)
  const COR = { U: "#ffd500", D: "#ffffff", F: "#009b48", B: "#0046ad", R: "#ff5800", L: "#b71234" };
  const NOME = { U: "cima", D: "baixo", L: "esquerda", R: "direita", F: "frente", B: "trás" };
  // Face → normal (direção para fora) e giro: eixo, camada (+1/-1) e ângulo do sentido horário
  const FACES = {
    R: { n: [1, 0, 0], eixo: "x", lado: 1, ang: 90 },
    L: { n: [-1, 0, 0], eixo: "x", lado: -1, ang: -90 },
    U: { n: [0, -1, 0], eixo: "y", lado: -1, ang: -90 },
    D: { n: [0, 1, 0], eixo: "y", lado: 1, ang: 90 },
    F: { n: [0, 0, 1], eixo: "z", lado: 1, ang: 90 },
    B: { n: [0, 0, -1], eixo: "z", lado: -1, ang: -90 },
  };
  const LISTA_FACES = ["U", "D", "L", "R", "F", "B"];

  // Matriz de rotação igual à do CSS (rotateX/Y/Z com ângulo em graus)
  function matriz(eixo, graus) {
    const r = graus * Math.PI / 180, c = Math.round(Math.cos(r)), s = Math.round(Math.sin(r));
    if (eixo === "x") return [[1, 0, 0], [0, c, -s], [0, s, c]];
    if (eixo === "y") return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
  }
  const mult = (A, B) => A.map((l, i) => B[0].map((_, j) => l.reduce((t, _, k) => t + A[i][k] * B[k][j], 0)));
  const aplicarV = (M, v) => M.map(l => l[0] * v[0] + l[1] * v[1] + l[2] * v[2]);
  const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

  // "R U R' U2" → [{ face, vezes: 1 | -1 | 2 }]
  const ler = alg => alg.trim().split(/\s+/).filter(Boolean).map(m => ({ face: m[0], vezes: m.endsWith("2") ? 2 : m.endsWith("'") ? -1 : 1 }));
  const texto = mv => mv.face + (mv.vezes === 2 ? "2" : mv.vezes === -1 ? "'" : "");
  const inverso = movs => movs.slice().reverse().map(m => ({ face: m.face, vezes: m.vezes === 2 ? 2 : -m.vezes }));
  const falarMov = mv => `${NOME[mv.face]}${mv.vezes === -1 ? " ao contrário" : mv.vezes === 2 ? " duas vezes" : ""}`;

  // ---------- Lições ----------
  const LICOES = [
    { titulo: "Os movimentos", icone: "🔤", tipo: "notacao",
      texto: "Cada letra é uma face: U é cima, D é baixo, L esquerda, R direita, F frente e B trás. A letra sozinha gira no sentido do relógio; com o tracinho, gira ao contrário. Faça os movimentos que eu pedir!" },
    { titulo: "Desfaça!", icone: "↩️", tipo: "desfazer",
      texto: "Eu vou bagunçar o cubo com poucos movimentos. Para desfazer, faça os movimentos ao contrário e de trás para frente!" },
    { titulo: "O algoritmo mágico", icone: "✨", tipo: "repetir", alg: "R U R' U'", vezes: 6,
      texto: "Este é o algoritmo mais famoso: R, U, R linha, U linha. Repita ele 6 vezes e veja a mágica: o cubo volta a ficar pronto!" },
    { titulo: "Canto branco", icone: "⬜", alg: "R U R' U'",
      texto: "Para colocar um canto branco no lugar, usamos o algoritmo mágico. Às vezes é preciso repetir até o canto encaixar." },
    { titulo: "Meio: para a direita", icone: "➡️", alg: "U R U' R' U' F' U F",
      texto: "Na segunda camada, esta sequência leva a peça de cima para o meio, do lado direito." },
    { titulo: "Meio: para a esquerda", icone: "⬅️", alg: "U' L' U L U F U' F'",
      texto: "Este é o espelho do anterior: leva a peça de cima para o meio, do lado esquerdo." },
    { titulo: "Cruz amarela", icone: "➕", alg: "F R U R' U' F'",
      texto: "Para fazer a cruz amarela em cima: frente, e o algoritmo mágico dentro dela, e frente ao contrário." },
    { titulo: "Arrumar a cruz", icone: "🔁", alg: "R U R' U R U2 R'",
      texto: "Este algoritmo troca as peças da cruz amarela de lugar, até as cores dos lados combinarem." },
    { titulo: "Cantos no lugar", icone: "📍", alg: "U R U' L' U R' U' L",
      texto: "Este algoritmo troca três cantos amarelos de lugar, até cada um ficar na sua casa." },
    { titulo: "Girar os cantos", icone: "🌀", alg: "R' D' R D",
      texto: "Para girar um canto amarelo, repetimos R linha, D linha, R, D. Parece que bagunça, mas no final tudo volta!" },
  ];

  JOGOS.push({
    id: "cubo",
    nome: "Cubo Mágico",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><polygon points="32,3 59,17.5 59,46.5 32,61 5,46.5 5,17.5" fill="#151515" stroke="#151515" stroke-width="2" stroke-linejoin="round"/><polygon points="6.9,17.5 14.0,13.7 21.1,17.5 14.0,21.3" fill="#ffd500"/><polygon points="15.9,22.3 23.0,18.5 30.1,22.3 23.0,26.2" fill="#ffd500"/><polygon points="24.9,27.2 32.0,23.3 39.1,27.2 32.0,31.0" fill="#ffd500"/><polygon points="15.9,12.7 23.0,8.8 30.1,12.7 23.0,16.5" fill="#ffd500"/><polygon points="24.9,17.5 32.0,13.7 39.1,17.5 32.0,21.3" fill="#ffd500"/><polygon points="33.9,22.3 41.0,18.5 48.1,22.3 41.0,26.2" fill="#ffd500"/><polygon points="24.9,7.8 32.0,4.0 39.1,7.8 32.0,11.7" fill="#ffd500"/><polygon points="33.9,12.7 41.0,8.8 48.1,12.7 41.0,16.5" fill="#ffd500"/><polygon points="42.9,17.5 50.0,13.7 57.1,17.5 50.0,21.3" fill="#ffd500"/><polygon points="5.9,19.0 13.1,22.8 13.1,30.5 5.9,26.7" fill="#009b48"/><polygon points="5.9,28.7 13.1,32.5 13.1,40.1 5.9,36.3" fill="#009b48"/><polygon points="5.9,38.4 13.1,42.2 13.1,49.8 5.9,46.0" fill="#009b48"/><polygon points="14.9,23.9 22.1,27.7 22.1,35.3 14.9,31.5" fill="#009b48"/><polygon points="14.9,33.5 22.1,37.3 22.1,45.0 14.9,41.2" fill="#009b48"/><polygon points="14.9,43.2 22.1,47.0 22.1,54.6 14.9,50.8" fill="#009b48"/><polygon points="23.9,28.7 31.1,32.5 31.1,40.1 23.9,36.3" fill="#009b48"/><polygon points="23.9,38.4 31.1,42.2 31.1,49.8 23.9,46.0" fill="#009b48"/><polygon points="23.9,48.0 31.1,51.8 31.1,59.5 23.9,55.7" fill="#009b48"/><polygon points="32.9,32.5 40.1,28.7 40.1,36.3 32.9,40.1" fill="#ff5800"/><polygon points="32.9,42.2 40.1,38.4 40.1,46.0 32.9,49.8" fill="#ff5800"/><polygon points="32.9,51.8 40.1,48.0 40.1,55.7 32.9,59.5" fill="#ff5800"/><polygon points="41.9,27.7 49.1,23.9 49.1,31.5 41.9,35.3" fill="#ff5800"/><polygon points="41.9,37.3 49.1,33.5 49.1,41.2 41.9,45.0" fill="#ff5800"/><polygon points="41.9,47.0 49.1,43.2 49.1,50.8 41.9,54.6" fill="#ff5800"/><polygon points="50.9,22.8 58.1,19.0 58.1,26.7 50.9,30.5" fill="#ff5800"/><polygon points="50.9,32.5 58.1,28.7 58.1,36.3 50.9,40.1" fill="#ff5800"/><polygon points="50.9,42.2 58.1,38.4 58.1,46.0 50.9,49.8" fill="#ff5800"/></svg>',
    faixas: ["6-8", "8-10"],
    iniciar(area, faixa) {
      const id = (faixa && faixa.id) || "8-10";
      const modos = [
        { icone: "🧊", rotulo: "2×2 livre", iniciar: () => livre(area, 2) },
        { icone: "🧊", rotulo: "3×3 livre", iniciar: () => livre(area, 3) },
        { icone: "📘", rotulo: "Aprender", iniciar: () => listaLicoes(area) },
      ];
      Motor.escolherModo(area, id === "6-8" ? [modos[0], modos[2], modos[1]] : [modos[1], modos[2], modos[0]]);
    },
  });

  // ---------- O cubo (modelo + desenho + animação) ----------
  function criarCubo(cena, N) {
    const m = (N - 1) / 2; // coordenadas vão de -m a +m
    const cubinhos = [];
    const orbita = document.createElement("div");
    orbita.className = "cubo-orbita";
    cena.appendChild(orbita);
    let S = 40, vista = { x: -28, y: -38 };

    for (let x = -m; x <= m; x++) for (let y = -m; y <= m; y++) for (let z = -m; z <= m; z++) {
      if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) < m) continue; // miolo invisível
      const el = document.createElement("div");
      el.className = "cubinho";
      // Faces do cubinho: coloridas só as que ficam do lado de fora no cubo pronto
      [["R", "rotateY(90deg)"], ["L", "rotateY(-90deg)"], ["U", "rotateX(90deg)"], ["D", "rotateX(-90deg)"], ["F", ""], ["B", "rotateY(180deg)"]].forEach(([f, rot]) => {
        const n = FACES[f].n, fora = (n[0] && x === n[0] * m) || (n[1] && y === n[1] * m) || (n[2] && z === n[2] * m);
        const face = document.createElement("div");
        face.className = "face-cubinho";
        face.dataset.rot = rot;
        if (fora) {
          face.style.setProperty("--cor", COR[f]);
          face.classList.add("colorida");
          // Letra no centro de cada face (só no 3×3), para ligar a face ao botão
          if (N === 3 && [x, y, z].filter(v => v === 0).length === 2) face.dataset.letra = f;
        }
        el.appendChild(face);
      });
      orbita.appendChild(el);
      cubinhos.push({ el, pos: [x, y, z], rot: I, cores: null, x0: [x, y, z] });
    }

    function posicionar(c) {
      const R = c.rot, [x, y, z] = c.pos;
      c.el.style.transform = `translate3d(${x * S}px, ${y * S}px, ${z * S}px) matrix3d(${R[0][0]},${R[1][0]},${R[2][0]},0,${R[0][1]},${R[1][1]},${R[2][1]},0,${R[0][2]},${R[1][2]},${R[2][2]},0,0,0,0,1)`;
    }
    function medir() {
      const r = cena.getBoundingClientRect();
      S = Math.floor(Math.min(r.width, r.height) / (N * 1.9));
      orbita.style.setProperty("--s", S + "px");
      cubinhos.forEach(c => {
        Object.assign(c.el.style, { width: S + "px", height: S + "px", left: -S / 2 + "px", top: -S / 2 + "px" });
        c.el.querySelectorAll(".face-cubinho").forEach(f => { f.style.transform = `${f.dataset.rot} translateZ(${S / 2}px)`; });
        posicionar(c);
      });
      girarVista(0, 0);
    }
    function girarVista(dx, dy) {
      vista.y += dx; vista.x = Math.max(-80, Math.min(80, vista.x - dy));
      orbita.style.transform = `rotateX(${vista.x}deg) rotateY(${vista.y}deg)`;
    }

    // Arrastar o dedo na cena gira a visão do cubo
    let arrasto = null;
    cena.addEventListener("pointerdown", e => { arrasto = [e.clientX, e.clientY]; try { cena.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } });
    cena.addEventListener("pointermove", e => {
      if (!arrasto) return;
      girarVista((e.clientX - arrasto[0]) * 0.5, (e.clientY - arrasto[1]) * 0.5);
      arrasto = [e.clientX, e.clientY];
    });
    const soltar = () => { arrasto = null; };
    cena.addEventListener("pointerup", soltar);
    cena.addEventListener("pointercancel", soltar);

    // Fila de movimentos: cada um anima a camada girando e depois atualiza o modelo
    const fila = [];
    let rodando = false;
    function girar(mv, ms = 260) {
      return new Promise(resolve => { fila.push({ mv, ms, resolve }); if (!rodando) proximo(); });
    }
    function proximo() {
      const item = fila.shift();
      if (!item) { rodando = false; return; }
      rodando = true;
      const { mv, ms, resolve } = item, f = FACES[mv.face];
      const graus = f.ang * (mv.vezes === -1 ? -1 : 1) * (mv.vezes === 2 ? 2 : 1);
      const k = f.eixo === "x" ? 0 : f.eixo === "y" ? 1 : 2;
      const daCamada = cubinhos.filter(c => c.pos[k] === f.lado * m);
      const fim = () => {
        const M = matriz(f.eixo, graus);
        daCamada.forEach(c => {
          c.pos = aplicarV(M, c.pos).map(v => Math.round(v * 2) / 2);
          c.rot = mult(M, c.rot);
          orbita.appendChild(c.el);
          posicionar(c);
        });
        camada.remove();
        resolve();
        proximo();
      };
      const camada = document.createElement("div");
      camada.className = "cubo-camada";
      orbita.appendChild(camada);
      daCamada.forEach(c => camada.appendChild(c.el));
      if (!ms) { fim(); return; }
      camada.style.transition = `transform ${ms}ms ease-in-out`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        camada.style.transform = `rotate${f.eixo.toUpperCase()}(${graus}deg)`;
      }));
      let feito = false;
      const uma = () => { if (!feito) { feito = true; fim(); } };
      camada.addEventListener("transitionend", uma, { once: true });
      setTimeout(uma, ms + 120); // garantia se o transitionend não vier
    }

    // Pronto = em cada direção, todas as faces coloridas viradas para lá têm a mesma cor
    function pronto() {
      const porDirecao = {};
      for (const c of cubinhos) {
        for (const f of LISTA_FACES) {
          const n0 = FACES[f].n, x0 = c.x0;
          const fora = (n0[0] && x0[0] === n0[0] * m) || (n0[1] && x0[1] === n0[1] * m) || (n0[2] && x0[2] === n0[2] * m);
          if (!fora) continue;
          const d = aplicarV(c.rot, n0).join();
          (porDirecao[d] = porDirecao[d] || new Set()).add(f);
        }
      }
      return Object.values(porDirecao).every(s => s.size === 1);
    }

    const ocupado = () => rodando || fila.length > 0;
    return { medir, girar, pronto, ocupado, girarVista };
  }

  // Botões das faces: U U' D D' ... (com a cor da face)
  function botoesFaces(aoTocar) {
    const caixa = document.createElement("div");
    caixa.className = "cubo-botoes";
    const porTexto = {};
    LISTA_FACES.forEach(f => [1, -1].forEach(v => {
      const mv = { face: f, vezes: v };
      const b = document.createElement("button");
      b.className = "botao-face";
      b.style.setProperty("--cor", COR[f]);
      b.textContent = texto(mv);
      b.setAttribute("aria-label", falarMov(mv));
      b.addEventListener("click", () => aoTocar(mv, b));
      caixa.appendChild(b);
      porTexto[texto(mv)] = b;
    }));
    return { caixa, porTexto };
  }

  function montarTela(area, N) {
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "cubo-tela";
    const topo = document.createElement("div");
    topo.className = "cubo-topo";
    const cena = document.createElement("div");
    cena.className = "cubo-cena";
    tela.append(topo, cena);
    area.appendChild(tela);
    const cubo = criarCubo(cena, N);
    return { tela, topo, cena, cubo };
  }

  const recordeDe = N => { try { return +localStorage.getItem(`cubo-recorde-${N}`) || 0; } catch (e) { return 0; } };
  const formatar = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

  // ---------- Modo livre ----------
  function livre(area, N) {
    const { tela, topo, cubo } = montarTela(area, N);
    const historico = [];
    let embaralhado = false, inicio = 0, jogadas = 0, relogio = null;

    const info = document.createElement("div");
    info.className = "cubo-info";
    const atualizar = () => {
      const t = inicio ? formatar(Date.now() - inicio) : "0:00";
      info.textContent = `⏱️ ${t} · ${jogadas} mov.` + (recordeDe(N) ? ` · 🏆 ${formatar(recordeDe(N))}` : "");
    };
    const chip = (txt, fn) => { const b = document.createElement("button"); b.className = "chip"; b.textContent = txt; b.addEventListener("click", fn); return b; };
    topo.append(info,
      chip("🎲 Embaralhar", embaralhar),
      chip("↩️ Desfazer", () => { if (cubo.ocupado() || !historico.length) return; const mv = historico.pop(); jogadas++; cubo.girar(inverso([mv])[0]); atualizar(); }),
      chip("⏪ Voltar tudo", voltarTudo));
    const { caixa } = botoesFaces(mv => {
      if (cubo.ocupado()) return;
      historico.push(mv);
      if (embaralhado && !inicio) { inicio = Date.now(); relogio = setInterval(() => { if (!document.contains(info)) clearInterval(relogio); else atualizar(); }, 500); }
      jogadas++;
      atualizar();
      cubo.girar(mv).then(conferir);
    });
    tela.appendChild(caixa);
    cubo.medir();
    atualizar();

    async function embaralhar() {
      if (cubo.ocupado()) return;
      clearInterval(relogio);
      inicio = 0; jogadas = 0; embaralhado = false;
      const movs = [];
      let ultima = null;
      for (let i = 0; i < (N === 2 ? 11 : 22); i++) {
        const f = Motor.sortear(LISTA_FACES.filter(x => x !== ultima));
        ultima = f;
        movs.push({ face: f, vezes: Motor.sortear([1, -1, 2]) });
      }
      historico.push(...movs);
      Motor.falar("Embaralhando!");
      for (const mv of movs) await cubo.girar(mv, 90);
      embaralhado = true;
      atualizar();
      Motor.falar("Pronto! O tempo começa no primeiro movimento.");
    }

    async function voltarTudo() {
      if (cubo.ocupado() || !historico.length) return;
      clearInterval(relogio);
      inicio = 0; embaralhado = false;
      const volta = inverso(historico.splice(0));
      Motor.falar("Voltando todos os movimentos, do último para o primeiro!");
      for (const mv of volta) await cubo.girar(mv, 140);
      jogadas = 0;
      atualizar();
    }

    function conferir() {
      if (!embaralhado || !cubo.pronto()) return;
      embaralhado = false;
      clearInterval(relogio);
      const tempo = Date.now() - inicio;
      const recorde = !recordeDe(N) || tempo < recordeDe(N);
      if (recorde) { try { localStorage.setItem(`cubo-recorde-${N}`, tempo); } catch (e) { /* ok */ } }
      atualizar();
      Motor.comemorar(tela.querySelector(".cubo-cena"));
      Motor.tim();
      Motor.falar(`Você resolveu o cubo em ${formatar(tempo).replace(":", " minutos e ")} segundos!` + (recorde ? " É o seu recorde!" : ""));
      historico.length = 0;
      inicio = 0;
    }

    Motor.falar(`Cubo ${N} por ${N}. Arraste o dedo para girar o cubo e use os botões para girar as faces. Toque em embaralhar para começar!`);
  }

  // ---------- Lições ----------
  function listaLicoes(area) {
    area.innerHTML = "";
    const caixa = document.createElement("div");
    caixa.className = "modos pequenos";
    LICOES.forEach((l, i) => {
      const b = document.createElement("button");
      b.className = "modo";
      b.innerHTML = `<span class="icone"></span><span class="rotulo"></span>`;
      b.querySelector(".icone").textContent = l.icone;
      b.querySelector(".rotulo").textContent = `${i + 1}. ${l.titulo}`;
      b.addEventListener("click", () => licao(area, i));
      caixa.appendChild(b);
    });
    area.appendChild(caixa);
    Motor.falar("Escolha uma lição!");
  }

  function licao(area, i) {
    const L = LICOES[i];
    const { tela, topo, cubo } = montarTela(area, 3);
    const titulo = document.createElement("div");
    titulo.className = "cubo-info";
    titulo.textContent = `${L.icone} ${i + 1}. ${L.titulo}`;
    const algEl = document.createElement("div");
    algEl.className = "cubo-alg";
    const chip = (txt, fn) => { const b = document.createElement("button"); b.className = "chip"; b.textContent = txt; b.addEventListener("click", fn); return b; };
    const acoes = document.createElement("div");
    acoes.className = "cubo-acoes";
    topo.append(titulo, algEl, acoes);

    let esperados = [], passo = 0, livreAqui = false, demo = false;
    const { caixa, porTexto } = botoesFaces((mv, botao) => {
      if (cubo.ocupado() || demo) return;
      if (!livreAqui) {
        const certo = esperados[passo];
        if (!certo || texto(certo) !== texto(mv)) {
          Motor.animar(botao, "balanca");
          if (certo) Motor.falar(`Agora é ${texto(certo).replace("'", " linha")}: ${falarMov(certo)}.`);
          return;
        }
        passo++;
        marcar();
      }
      cubo.girar(mv).then(depoisDoMovimento);
    });
    tela.appendChild(caixa);
    cubo.medir();

    // Destaca no algoritmo o próximo movimento e no painel o botão certo
    function marcar() {
      algEl.innerHTML = "";
      if (livreAqui) return;
      const voltas = L.tipo === "repetir" ? ` (volta ${Math.min(L.vezes, Math.floor(passo / ler(L.alg).length) + 1)} de ${L.vezes})` : "";
      const mostrar = L.tipo === "repetir" ? ler(L.alg) : esperados;
      const base = L.tipo === "repetir" ? passo % mostrar.length : passo;
      mostrar.forEach((mv, k) => {
        const s = document.createElement("span");
        s.className = "mov" + (k < base ? " feito" : k === base && passo < esperados.length ? " agora" : "");
        s.textContent = texto(mv);
        algEl.appendChild(s);
      });
      if (voltas) algEl.appendChild(Object.assign(document.createElement("span"), { className: "voltas", textContent: voltas }));
      Object.values(porTexto).forEach(b => b.classList.remove("proximo"));
      const prox = esperados[passo];
      if (prox) {
        // U2 se faz com dois U
        const b = porTexto[texto({ face: prox.face, vezes: prox.vezes === -1 ? -1 : 1 })];
        if (b) b.classList.add("proximo");
      }
    }

    // Movimentos com "2" viram dois movimentos simples (os botões só têm giro de 90°)
    const simples = movs => movs.flatMap(mv => (mv.vezes === 2 ? [{ face: mv.face, vezes: 1 }, { face: mv.face, vezes: 1 }] : [mv]));

    async function comecar() {
      passo = 0; livreAqui = false;
      if (L.tipo === "notacao") {
        esperados = Array.from({ length: 6 }, () => ({ face: Motor.sortear(LISTA_FACES), vezes: Motor.sortear([1, -1]) }));
        marcar();
        pedir();
      } else if (L.tipo === "desfazer") {
        const k = Motor.sortear([1, 2, 2, 3]);
        const movs = [];
        for (let j = 0; j < k; j++) movs.push({ face: Motor.sortear(LISTA_FACES.filter(f => !movs.length || f !== movs[movs.length - 1].face)), vezes: Motor.sortear([1, -1]) });
        for (const mv of movs) await cubo.girar(mv, 350);
        livreAqui = true;
        algEl.textContent = `Eu fiz: ${movs.map(texto).join(" ")} — desfaça!`;
        Object.values(porTexto).forEach(b => b.classList.remove("proximo"));
        Motor.falar(`Eu fiz ${movs.map(m => texto(m).replace("'", " linha")).join(", ")}. Desfaça!`);
        esperados = [];
      } else if (L.tipo === "repetir") {
        esperados = simples(Array.from({ length: L.vezes }, () => ler(L.alg)).flat());
        marcar();
        Motor.falar(L.texto);
      } else {
        // Bagunça só o que o algoritmo arruma (o inverso dele), sem animação lenta
        for (const mv of inverso(ler(L.alg))) await cubo.girar(mv, 0);
        esperados = simples(ler(L.alg));
        marcar();
        Motor.falar(L.texto + " Siga o algoritmo!");
      }
    }

    function pedir() {
      const mv = esperados[passo];
      if (mv) Motor.falar(`Faça ${texto(mv).replace("'", " linha")}: ${falarMov(mv)}.`);
    }

    function depoisDoMovimento() {
      if (L.tipo === "notacao") {
        if (passo < esperados.length) { Motor.ploc(); pedir(); return; }
        return concluir("Muito bem! Você já conhece os movimentos!");
      }
      if (L.tipo === "desfazer") {
        if (cubo.pronto()) concluir("Isso! Você desfez a bagunça!");
        return;
      }
      if (L.tipo === "repetir" && passo % ler(L.alg).length === 0 && passo < esperados.length) {
        Motor.falar(`Volta ${passo / ler(L.alg).length} pronta!`);
      }
      if (passo === esperados.length) concluir(cubo.pronto() ? "Pronto! O cubo voltou ao começo. É assim que um algoritmo funciona!" : "Algoritmo completo!");
    }

    function concluir(fala) {
      Object.values(porTexto).forEach(b => b.classList.remove("proximo"));
      Motor.comemorar(tela.querySelector(".cubo-cena"));
      Motor.tim();
      Motor.falar(fala);
      acoes.innerHTML = "";
      acoes.append(chip("🔁 De novo", () => licao(area, i)),
        ...(i + 1 < LICOES.length ? [chip("➡️ Próxima lição", () => licao(area, i + 1))] : []),
        chip("📘 Lições", () => listaLicoes(area)));
    }

    // Assistir: o cubo faz o algoritmo sozinho, devagar, e depois volta para a criança tentar
    async function assistir() {
      if (cubo.ocupado() || demo || !esperados.length || livreAqui) return;
      demo = true;
      const falta = esperados.slice(passo);
      Motor.falar("Olhe com atenção!");
      for (const mv of falta) {
        Object.values(porTexto).forEach(b => b.classList.toggle("proximo", b.textContent === texto(mv)));
        await cubo.girar(mv, 650);
        await new Promise(r => setTimeout(r, 250));
      }
      // Desfaz para a criança tentar
      for (const mv of inverso(falta)) await cubo.girar(mv, 0);
      demo = false;
      marcar();
      Motor.falar("Agora é a sua vez!");
    }

    acoes.append(chip("👀 Assistir", assistir), chip("🔁 Recomeçar", () => licao(area, i)), chip("📘 Lições", () => listaLicoes(area)));
    if (L.tipo === "notacao" || L.tipo === "desfazer") Motor.falar(L.texto);
    Motor.depois(comecar, L.tipo === "notacao" || L.tipo === "desfazer" ? 4500 : 300);
  }
})();
