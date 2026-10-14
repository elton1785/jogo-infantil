// Cubo mágico 3D (2×2 e 3×3), feito só com CSS 3D. A matemática e o resolvedor estão em
// jogos/cubo-resolver.js (CuboMat).
// - Livre: embaralhar, girar as faces pelos botões (notação U D L R F B, ' = ao contrário),
//   arrastar o dedo na tela gira a visão; cronômetro e recorde. "🤖 Resolver" mostra a
//   solução pelo método das camadas, etapa por etapa: assistindo ou fazendo junto.
// - Aprender: lições guiadas — os movimentos, desfazer, o "algoritmo mágico" e os algoritmos
//   do método das camadas. Em cada lição o cubo começa "bagunçado só um pouquinho" e a
//   criança segue o algoritmo (o próximo movimento fica destacado) até o cubo ficar pronto.
// - Demonstrações: conheça o cubo, os movimentos, cada algoritmo em ação e a resolução
//   completa (3×3 e 2×2), com a voz explicando.
(() => {
  const { FACES, LISTA_FACES, matriz, mult, aplicarV, I, ler, texto, inverso, grausDe, resolver } = CuboMat;
  // Cores (branco embaixo, amarelo em cima, verde na frente — como no método das camadas)
  const COR = { U: "#ffd500", D: "#ffffff", F: "#009b48", B: "#0046ad", R: "#ff5800", L: "#b71234" };
  const NOME = { U: "cima", D: "baixo", L: "esquerda", R: "direita", F: "frente", B: "trás" };
  const falarMov = mv => `${NOME[mv.face]}${mv.vezes === -1 ? " ao contrário" : mv.vezes === 2 ? " duas vezes" : ""}`;
  const dizer = mv => texto(mv).replace("'", " linha"); // "R'" → "R linha" (para a voz)
  const esperar = ms => new Promise(r => setTimeout(r, ms));

  // Ícone: cubo em perspectiva (n × n adesivos), topo amarelo, frente verde, lado laranja
  function svgCubo(n) {
    const face = (o, u, v, cor) => {
      let s = "";
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const g = 0.1 / n;
        const [a0, a1, b0, b1] = [i / n + g, (i + 1) / n - g, j / n + g, (j + 1) / n - g];
        const pts = [[a0, b0], [a1, b0], [a1, b1], [a0, b1]].map(([a, b]) => `${(o[0] + a * u[0] + b * v[0]).toFixed(1)},${(o[1] + a * u[1] + b * v[1]).toFixed(1)}`);
        s += `<polygon points="${pts.join(" ")}" fill="${cor}"/>`;
      }
      return s;
    };
    return '<svg viewBox="0 0 64 64" aria-hidden="true"><polygon points="32,3 59,17.5 59,46.5 32,61 5,46.5 5,17.5" fill="#151515" stroke="#151515" stroke-width="2" stroke-linejoin="round"/>' +
      face([5, 17.5], [27, -14.5], [27, 14.5], COR.U) + face([5, 17.5], [27, 14.5], [0, 29], COR.F) + face([32, 32], [27, -14.5], [0, 29], COR.R) + "</svg>";
  }

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

  // ---------- Demonstrações ----------
  const DEMOS = [
    { titulo: "Conheça o cubo", icone: "🧩", iniciante: true, fazer: demoConheca },
    { titulo: "Os movimentos", icone: "🔄", iniciante: true, fazer: demoMovimentos },
    { titulo: "Os 7 passos (3×3)", icone: "🪜", iniciante: true, fazer: area => demoResolucao(area, 3) },
    { titulo: "Resolvendo o 2×2", icone: svgCubo(2), fazer: area => demoResolucao(area, 2) },
    { titulo: "Os algoritmos", icone: "✨", fazer: area => demoAlgoritmo(area, 2) },
  ];

  JOGOS.push({
    id: "cubo",
    nome: "Cubo Mágico",
    icone: svgCubo(3),
    faixas: ["6-8", "8-10"],
    iniciar(area, faixa) {
      const id = (faixa && faixa.id) || "8-10";
      const m2 = { icone: svgCubo(2), rotulo: "2×2 livre", iniciar: () => livre(area, 2) };
      const m3 = { icone: svgCubo(3), rotulo: "3×3 livre", iniciar: () => livre(area, 3) };
      const aprender = { icone: "📘", rotulo: "Aprender", iniciar: () => listaLicoes(area) };
      const demos = { icone: "🎬", rotulo: "Demonstrações", iniciar: () => listaDemos(area) };
      Motor.escolherModo(area, id === "6-8" ? [m2, demos, aprender, m3] : [m3, demos, aprender, m2]);
    },
  });

  // ---------- O cubo (modelo + desenho + animação) ----------
  function criarCubo(cena, N) {
    const m = (N - 1) / 2; // coordenadas vão de -m a +m
    const cubinhos = [];
    const orbita = document.createElement("div");
    orbita.className = "cubo-orbita";
    cena.appendChild(orbita);
    let S = 40;
    const vista = { x: -28, y: -38 };
    const naFace = (h, f) => { const n = FACES[f].n; return (n[0] && h[0] === n[0] * m) || (n[1] && h[1] === n[1] * m) || (n[2] && h[2] === n[2] * m); };

    for (let x = -m; x <= m; x++) for (let y = -m; y <= m; y++) for (let z = -m; z <= m; z++) {
      if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) < m) continue; // miolo invisível
      const el = document.createElement("div");
      el.className = "cubinho";
      // Faces do cubinho: coloridas só as que ficam do lado de fora no cubo pronto
      [["R", "rotateY(90deg)"], ["L", "rotateY(-90deg)"], ["U", "rotateX(90deg)"], ["D", "rotateX(-90deg)"], ["F", ""], ["B", "rotateY(180deg)"]].forEach(([f, rot]) => {
        const face = document.createElement("div");
        face.className = "face-cubinho";
        face.dataset.rot = rot;
        if (naFace([x, y, z], f)) {
          face.style.setProperty("--cor", COR[f]);
          face.classList.add("colorida");
          // Letra no centro de cada face (só no 3×3), para ligar a face ao botão
          if (N === 3 && [x, y, z].filter(v => v === 0).length === 2) face.dataset.letra = f;
        }
        el.appendChild(face);
      });
      orbita.appendChild(el);
      cubinhos.push({ el, pos: [x, y, z], rot: I, home: [x, y, z] });
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
      const graus = grausDe(mv);
      const k = f.eixo === "x" ? 0 : f.eixo === "y" ? 1 : 2;
      const daCamada = cubinhos.filter(c => c.pos[k] === f.lado * m);
      const camada = document.createElement("div");
      camada.className = "cubo-camada";
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
      for (const c of cubinhos) for (const f of LISTA_FACES) {
        if (!naFace(c.home, f)) continue;
        const d = aplicarV(c.rot, FACES[f].n).join();
        (porDirecao[d] = porDirecao[d] || new Set()).add(f);
      }
      return Object.values(porDirecao).every(s => s.size === 1);
    }

    // Destaca alguns cubinhos (os outros ficam apagados); `quais(c)` recebe { home, pos }
    function destacar(quais) {
      orbita.classList.toggle("focando", !!quais);
      cubinhos.forEach(c => c.el.classList.toggle("destaque", !!quais && quais(c)));
    }
    // Volta ao cubo pronto, sem animação
    function zerar() {
      cubinhos.forEach(c => { c.pos = c.home.slice(); c.rot = I; posicionar(c); });
    }

    const ocupado = () => rodando || fila.length > 0;
    const estado = () => cubinhos.map(c => ({ home: c.home, rot: c.rot }));
    return { N, medir, girar, pronto, ocupado, girarVista, destacar, zerar, estado };
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
    const marcarProximo = mv => {
      Object.values(porTexto).forEach(b => b.classList.remove("proximo"));
      // Giro duplo (U2) se faz com dois giros simples
      if (mv) porTexto[texto({ face: mv.face, vezes: mv.vezes === -1 ? -1 : 1 })].classList.add("proximo");
    };
    return { caixa, porTexto, marcarProximo };
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

  const chip = (txt, fn) => { const b = document.createElement("button"); b.className = "chip"; b.textContent = txt; b.addEventListener("click", fn); return b; };
  // Algoritmo em "fichas", com as já feitas em verde e a atual destacada
  function mostrarAlg(el, movs, atual, janela = 0) {
    el.innerHTML = "";
    const ini = janela ? Math.max(0, Math.min(atual - 3, movs.length - janela)) : 0;
    const fim = janela ? Math.min(movs.length, ini + janela) : movs.length;
    if (ini > 0) el.appendChild(Object.assign(document.createElement("span"), { className: "voltas", textContent: "…" }));
    for (let k = ini; k < fim; k++) {
      const s = document.createElement("span");
      s.className = "mov" + (k < atual ? " feito" : k === atual ? " agora" : "");
      s.textContent = texto(movs[k]);
      el.appendChild(s);
    }
    if (fim < movs.length) el.appendChild(Object.assign(document.createElement("span"), { className: "voltas", textContent: `… +${movs.length - fim}` }));
  }

  // Embaralha com giros aleatórios (sem repetir a mesma face seguida)
  function embaralhamento(N) {
    const movs = [];
    let ultima = null;
    for (let i = 0; i < (N === 2 ? 11 : 22); i++) {
      const f = Motor.sortear(LISTA_FACES.filter(x => x !== ultima));
      ultima = f;
      movs.push({ face: f, vezes: Motor.sortear([1, -1, 2]) });
    }
    return movs;
  }

  // ---------- Guia de resolução (🤖 Resolver) ----------
  // Mostra a solução do método das camadas etapa por etapa. Dois jeitos:
  // "assistir" (o cubo faz sozinho, devagar) e "fazer" (a criança aperta o botão destacado).
  function criarGuia({ caixa, cubo, botoes, etapas, modo = "assistir", podeFazer = true, aoFim, aoSair }) {
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(caixa);
    // Cada etapa vira uma lista de giros simples (U2 = U U) para dar para fazer pelos botões
    const lista = etapas.map(e => ({ ...e, passos: e.movs.flatMap(mv => (mv.vezes === 2 ? [{ face: mv.face, vezes: 1 }, { face: mv.face, vezes: 1 }] : [mv])) }));
    let et = 0, passo = 0, pausado = false, rodando = false, acabou = false;

    caixa.innerHTML = "";
    caixa.className = "cubo-guia";
    const titulo = document.createElement("div");
    titulo.className = "guia-titulo";
    const explica = document.createElement("div");
    explica.className = "guia-texto";
    const alg = document.createElement("div");
    alg.className = "cubo-alg";
    const ctrl = document.createElement("div");
    ctrl.className = "cubo-acoes";
    caixa.append(titulo, explica, alg, ctrl);

    function desenhar() {
      const e = lista[et];
      if (!e) return;
      titulo.textContent = `Passo ${et + 1} de ${lista.length}: ${e.nome}`;
      explica.textContent = e.texto;
      mostrarAlg(alg, e.passos, passo, 14);
      ctrl.innerHTML = "";
      if (acabou) return;
      if (modo === "assistir") {
        ctrl.append(chip(pausado ? "▶️ Continuar" : "⏸️ Pausar", () => { pausado = !pausado; desenhar(); if (!pausado) tocar(); }));
        if (podeFazer) ctrl.append(chip("👆 Eu faço", () => { modo = "fazer"; pausado = true; desenhar(); marcar(); Motor.falar("Agora é você! Aperte o botão que está piscando."); }));
      } else {
        ctrl.append(chip("🤖 Fazer sozinho", () => { modo = "assistir"; pausado = false; botoes.marcarProximo(null); desenhar(); tocar(); }),
          chip("⏭️ Pular esta etapa", pularEtapa));
      }
      ctrl.append(chip("✖️ Sair", sair));
    }
    const marcar = () => botoes.marcarProximo(modo === "fazer" && !acabou ? lista[et].passos[passo] : null);

    // Anuncia a etapa atual; as que já vieram prontas são anunciadas e puladas
    async function anunciar() {
      while (et < lista.length && !lista[et].passos.length) {
        desenhar();
        explica.textContent = "Este passo já está pronto!";
        await Motor.falar(`Passo ${et + 1}: ${lista[et].nome}. Este passo já está pronto!`);
        if (!vivo()) return;
        et++;
      }
      if (et >= lista.length) { terminar(); return; }
      const e = lista[et];
      desenhar();
      await Motor.falar(`Passo ${et + 1}: ${e.nome}. ${e.texto}`);
    }

    function avancar() {
      passo++;
      if (passo >= lista[et].passos.length) {
        et++; passo = 0;
        if (et >= lista.length) return terminar();
        return "nova etapa";
      }
      return "";
    }

    // Assistir: toca os giros da etapa, anunciando cada etapa nova
    async function tocar() {
      if (rodando || acabou) return;
      rodando = true;
      while (vivo() && modo === "assistir" && !pausado && !acabou) {
        if (passo === 0) { await anunciar(); if (!vivo() || acabou || pausado || modo !== "assistir") break; await esperar(400); }
        await cubo.girar(lista[et].passos[passo], 420);
        if (!vivo()) break;
        const r = avancar();
        if (r === "nova etapa") { Motor.tim(); await esperar(700); }
        if (!acabou) mostrarAlg(alg, lista[et].passos, passo, 14);
        await esperar(110);
      }
      rodando = false;
    }

    async function pularEtapa() {
      if (cubo.ocupado()) return;
      const falta = lista[et].passos.slice(passo);
      for (const mv of falta) await cubo.girar(mv, 120);
      et++; passo = 0;
      if (et >= lista.length) return terminar();
      await anunciar();
      if (!acabou) marcar();
    }

    // Eu faço: confere o botão apertado
    function tentar(mv, botao) {
      if (acabou || modo !== "fazer" || cubo.ocupado()) return;
      const certo = lista[et].passos[passo];
      if (texto(certo) !== texto(mv)) {
        Motor.animar(botao, "balanca");
        Motor.falar(`Agora é ${dizer(certo)}: ${falarMov(certo)}.`);
        return;
      }
      cubo.girar(mv).then(async () => {
        const r = avancar();
        if (acabou) return;
        if (r === "nova etapa") { Motor.tim(); await anunciar(); }
        if (acabou) return;
        mostrarAlg(alg, lista[et].passos, passo, 14);
        marcar();
      });
    }

    function terminar() {
      acabou = true;
      botoes.marcarProximo(null);
      titulo.textContent = "🎉 Cubo resolvido!";
      explica.textContent = "Esses foram os passos do método das camadas.";
      alg.innerHTML = "";
      ctrl.innerHTML = "";
      ctrl.append(chip("✖️ Fechar", sair));
      Motor.comemorar(caixa);
      Motor.tim();
      Motor.falar("Pronto! O cubo está resolvido!");
      if (aoFim) aoFim();
    }

    function sair() {
      acabou = true; pausado = true;
      botoes.marcarProximo(null);
      if (aoSair) aoSair();
    }

    desenhar();
    if (modo === "assistir") tocar();
    else anunciar().then(() => { if (!acabou) marcar(); });
    return { tentar, ativo: () => !acabou };
  }

  const recordeDe = N => { try { return +localStorage.getItem(`cubo-recorde-${N}`) || 0; } catch (e) { return 0; } };
  const formatar = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

  // ---------- Modo livre ----------
  function livre(area, N) {
    const { tela, topo, cubo } = montarTela(area, N);
    const historico = [];
    let embaralhado = false, inicio = 0, jogadas = 0, relogio = null, guia = null;

    const info = document.createElement("div");
    info.className = "cubo-info";
    const atualizar = () => {
      const t = inicio ? formatar(Date.now() - inicio) : "0:00";
      info.textContent = `⏱️ ${t} · ${jogadas} mov.` + (recordeDe(N) ? ` · 🏆 ${formatar(recordeDe(N))}` : "");
    };
    const barra = document.createElement("div");
    barra.className = "cubo-acoes";
    barra.append(info,
      chip("🎲 Embaralhar", embaralhar),
      chip("↩️ Desfazer", () => { if (guia || cubo.ocupado() || !historico.length) return; const mv = historico.pop(); jogadas++; cubo.girar(inverso([mv])[0]); atualizar(); }),
      chip("⏪ Voltar tudo", voltarTudo),
      chip("🤖 Resolver", abrirGuia));
    const guiaEl = document.createElement("div");
    topo.append(barra, guiaEl);

    const botoes = botoesFaces((mv, b) => {
      if (guia && guia.ativo()) { guia.tentar(mv, b); return; }
      if (cubo.ocupado()) return;
      historico.push(mv);
      if (embaralhado && !inicio) { inicio = Date.now(); relogio = setInterval(() => { if (!document.contains(info)) clearInterval(relogio); else atualizar(); }, 500); }
      jogadas++;
      atualizar();
      cubo.girar(mv).then(conferir);
    });
    tela.appendChild(botoes.caixa);
    cubo.medir();
    atualizar();

    async function embaralhar() {
      if (guia || cubo.ocupado()) return;
      clearInterval(relogio);
      inicio = 0; jogadas = 0; embaralhado = false;
      const movs = embaralhamento(N);
      historico.push(...movs);
      Motor.falar("Embaralhando!");
      for (const mv of movs) await cubo.girar(mv, 90);
      embaralhado = true;
      atualizar();
      Motor.falar("Pronto! O tempo começa no primeiro movimento.");
    }

    async function voltarTudo() {
      if (guia || cubo.ocupado() || !historico.length) return;
      clearInterval(relogio);
      inicio = 0; embaralhado = false;
      const volta = inverso(historico.splice(0));
      Motor.falar("Voltando todos os movimentos, do último para o primeiro!");
      for (const mv of volta) await cubo.girar(mv, 140);
      jogadas = 0;
      atualizar();
    }

    function abrirGuia() {
      if (guia || cubo.ocupado()) return;
      if (cubo.pronto()) { Motor.falar("O cubo já está resolvido! Toque em embaralhar primeiro."); return; }
      const r = resolver(N, cubo.estado());
      if (!r.ok) { Motor.falar("Não consegui encontrar a solução. Tente embaralhar de novo."); return; }
      clearInterval(relogio);
      inicio = 0; embaralhado = false;
      barra.style.display = "none";
      guia = criarGuia({
        caixa: guiaEl, cubo, botoes, etapas: r.etapas,
        aoFim: () => { historico.length = 0; },
        aoSair: () => { guia = null; guiaEl.innerHTML = ""; guiaEl.className = ""; barra.style.display = ""; historico.length = 0; jogadas = 0; atualizar(); },
      });
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

    Motor.falar(`Cubo ${N} por ${N}. Arraste o dedo para girar o cubo e use os botões para girar as faces. Toque em embaralhar para começar, e em resolver para eu te ensinar!`);
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
          if (certo) Motor.falar(`Agora é ${dizer(certo)}: ${falarMov(certo)}.`);
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
        Motor.falar(`Eu fiz ${movs.map(dizer).join(", ")}. Desfaça!`);
        esperados = [];
      } else if (L.tipo === "repetir") {
        esperados = simples(Array.from({ length: L.vezes }, () => ler(L.alg)).flat());
        marcar();
        Motor.falar(L.texto);
      } else {
        // Bagunça só o que o algoritmo arruma (o inverso dele), sem animação
        for (const mv of inverso(ler(L.alg))) await cubo.girar(mv, 0);
        esperados = simples(ler(L.alg));
        marcar();
        Motor.falar(L.texto + " Siga o algoritmo!");
      }
    }

    function pedir() {
      const mv = esperados[passo];
      if (mv) Motor.falar(`Faça ${dizer(mv)}: ${falarMov(mv)}.`);
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
        await esperar(250);
      }
      for (const mv of inverso(falta)) await cubo.girar(mv, 0);
      demo = false;
      marcar();
      Motor.falar("Agora é a sua vez!");
    }

    acoes.append(chip("👀 Assistir", assistir), chip("🔁 Recomeçar", () => licao(area, i)), chip("📘 Lições", () => listaLicoes(area)));
    if (L.tipo === "notacao" || L.tipo === "desfazer") Motor.falar(L.texto);
    Motor.depois(comecar, L.tipo === "notacao" || L.tipo === "desfazer" ? 4500 : 300);
  }

  // ---------- Demonstrações ----------
  function listaDemos(area) {
    area.innerHTML = "";
    const caixa = document.createElement("div");
    caixa.className = "modos pequenos";
    DEMOS.forEach(d => {
      const b = document.createElement("button");
      b.className = "modo";
      b.innerHTML = `<span class="icone"></span><span class="rotulo"></span>`;
      if (d.icone.startsWith("<svg")) b.querySelector(".icone").innerHTML = d.icone;
      else b.querySelector(".icone").textContent = d.icone;
      b.querySelector(".rotulo").textContent = d.titulo + (d.iniciante ? " ⭐" : "");
      b.addEventListener("click", () => d.fazer(area));
      caixa.appendChild(b);
    });
    area.appendChild(caixa);
    Motor.falar("Demonstrações! As com estrelinha são para quem está começando.");
  }

  // Tela de demonstração: cubo + legenda + botões; `vivo()` para parar se a criança sair
  function telaDemo(area, N, titulo) {
    const t = montarTela(area, N);
    const sessao = Motor.sessaoAtual();
    const tituloEl = document.createElement("div");
    tituloEl.className = "cubo-info";
    tituloEl.textContent = titulo;
    const legenda = document.createElement("div");
    legenda.className = "guia-texto legenda";
    const algEl = document.createElement("div");
    algEl.className = "cubo-alg";
    const acoes = document.createElement("div");
    acoes.className = "cubo-acoes";
    t.topo.append(tituloEl, legenda, algEl, acoes);
    t.cubo.medir();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(legenda);
    // Fala e mostra a legenda; espera a fala terminar
    const narrar = async txt => { if (!vivo()) return; legenda.textContent = txt; await Motor.falar(txt); await esperar(300); };
    const fim = refazer => {
      acoes.innerHTML = "";
      acoes.append(chip("🔁 De novo", refazer), chip("🎬 Demonstrações", () => listaDemos(area)));
    };
    acoes.append(chip("🎬 Demonstrações", () => listaDemos(area)));
    return { ...t, legenda, algEl, acoes, vivo, narrar, fim };
  }

  async function demoConheca(area) {
    const d = telaDemo(area, 3, "🧩 Conheça o cubo");
    const { cubo, narrar, vivo } = d;
    const zeros = c => c.home.filter(v => v === 0).length;
    // Gira a visão devagar enquanto apresenta
    const giro = setInterval(() => { if (!vivo()) clearInterval(giro); else cubo.girarVista(0.6, 0); }, 30);
    await narrar("Este é o cubo mágico. Ele tem 6 faces, e cada face tem uma cor.");
    cubo.destacar(c => zeros(c) === 2);
    await narrar("Estes são os centros. Cada face tem um centro, e ele nunca sai do lugar: é o centro que diz qual é a cor da face.");
    cubo.destacar(c => zeros(c) === 1);
    await narrar("Estes são os meios. Cada meio tem duas cores.");
    cubo.destacar(c => zeros(c) === 0);
    await narrar("E estes são os cantos. Cada canto tem três cores.");
    clearInterval(giro);
    cubo.destacar(null);
    if (!vivo()) return;
    await narrar("Agora veja: quando giramos as faces, as peças trocam de lugar, mas os centros continuam no mesmo lugar.");
    cubo.destacar(c => zeros(c) === 2);
    for (const mv of ler("R U R' U'")) { if (!vivo()) return; await cubo.girar(mv, 700); await esperar(200); }
    cubo.destacar(null);
    await narrar("Resolver o cubo é colocar cada meio e cada canto no lugar certo, combinando com os centros.");
    if (vivo()) d.fim(() => demoConheca(area));
  }

  async function demoMovimentos(area) {
    const d = telaDemo(area, 3, "🔄 Os movimentos");
    const { cubo, narrar, vivo, algEl } = d;
    await narrar("Cada movimento tem uma letra. A letra sozinha gira a face no sentido do relógio, olhando de frente para ela. Com o tracinho, gira ao contrário.");
    const k = f => "xyz".indexOf(FACES[f].eixo);
    for (const f of ["R", "L", "U", "D", "F", "B"]) {
      if (!vivo()) return;
      // Destaca a camada que vai girar
      cubo.destacar(c => c.pos[k(f)] === FACES[f].lado);
      mostrarAlg(algEl, [{ face: f, vezes: 1 }, { face: f, vezes: -1 }], 0);
      await narrar(`${f} é a face da ${NOME[f]}.`);
      await cubo.girar({ face: f, vezes: 1 }, 900);
      mostrarAlg(algEl, [{ face: f, vezes: 1 }, { face: f, vezes: -1 }], 1);
      await narrar(`${f} linha: ao contrário.`);
      await cubo.girar({ face: f, vezes: -1 }, 900);
      await esperar(300);
    }
    cubo.destacar(null);
    algEl.innerHTML = "";
    await narrar("E o 2 depois da letra, como R2, quer dizer girar duas vezes.");
    if (vivo()) d.fim(() => demoMovimentos(area));
  }

  // Cada algoritmo: o cubo começa no caso em que ele é usado e o algoritmo é feito devagar
  async function demoAlgoritmo(area, i) {
    const L = LICOES[i];
    const d = telaDemo(area, 3, `✨ ${L.titulo}`);
    const { cubo, narrar, vivo, algEl, acoes } = d;
    const movs = ler(L.alg);
    const vezes = L.tipo === "repetir" ? L.vezes : 1;
    const todos = Array.from({ length: vezes }, () => movs).flat();
    acoes.innerHTML = "";
    const algs = LICOES.map((l, j) => [l, j]).filter(([l]) => l.alg);
    const pos = algs.findIndex(([, j]) => j === i);
    if (pos > 0) acoes.append(chip("⏮️ Anterior", () => demoAlgoritmo(area, algs[pos - 1][1])));
    if (pos < algs.length - 1) acoes.append(chip("⏭️ Próximo", () => demoAlgoritmo(area, algs[pos + 1][1])));
    acoes.append(chip("🎬 Demonstrações", () => listaDemos(area)));
    if (L.tipo !== "repetir") for (const mv of inverso(movs)) await cubo.girar(mv, 0);
    mostrarAlg(algEl, todos, 0, 16);
    await narrar(L.texto);
    for (let k = 0; k < todos.length; k++) {
      if (!vivo()) return;
      mostrarAlg(algEl, todos, k, 16);
      await cubo.girar(todos[k], 650);
      await esperar(200);
    }
    mostrarAlg(algEl, todos, todos.length, 16);
    if (vivo()) { Motor.tim(); await narrar(cubo.pronto() ? "Pronto! Viu como o algoritmo arrumou o cubo?" : "Pronto!"); }
  }

  // Resolução completa: embaralha e mostra todos os passos do método das camadas
  async function demoResolucao(area, N) {
    const d = telaDemo(area, N, N === 3 ? "🪜 Os 7 passos" : "🧊 Resolvendo o 2×2");
    const { cubo, narrar, vivo, legenda, algEl, acoes } = d;
    const botoes = { marcarProximo: () => {} };
    await narrar(N === 3
      ? "Vou embaralhar o cubo e resolver pelo método das camadas, que tem 7 passos. Preste atenção em cada um!"
      : "O cubo 2 por 2 só tem cantos. Vou embaralhar e resolver em 3 passos.");
    for (const mv of embaralhamento(N)) { if (!vivo()) return; await cubo.girar(mv, 100); }
    const r = resolver(N, cubo.estado());
    if (!r.ok || !vivo()) return;
    legenda.remove(); algEl.remove(); acoes.innerHTML = "";
    const guiaEl = document.createElement("div");
    d.topo.appendChild(guiaEl);
    criarGuia({ caixa: guiaEl, cubo, botoes, etapas: r.etapas, podeFazer: false, aoSair: () => listaDemos(area) });
  }
})();
