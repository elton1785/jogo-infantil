// Matemática do cubo mágico e resolvedor pelo método das camadas (o mesmo das lições).
// Usado pelo jogo do Cubo Mágico (jogos/cubo.js).
//
// Modelo: cada peça (cubinho) é identificada pela posição de origem (home) e guarda uma
// matriz de rotação. Como todo giro aplica a mesma matriz à posição e à rotação, a posição
// atual é sempre rotação × home. Eixos do CSS: x para a direita, y para baixo, z para fora.
// Cores: amarelo em cima (U), branco embaixo (D), verde na frente (F).
const CuboMat = (() => {
  // Face → normal (para fora) e giro no sentido do relógio: eixo, camada (+1/-1) e ângulo
  const FACES = {
    R: { n: [1, 0, 0], eixo: "x", lado: 1, ang: 90 },
    L: { n: [-1, 0, 0], eixo: "x", lado: -1, ang: -90 },
    U: { n: [0, -1, 0], eixo: "y", lado: -1, ang: -90 },
    D: { n: [0, 1, 0], eixo: "y", lado: 1, ang: 90 },
    F: { n: [0, 0, 1], eixo: "z", lado: 1, ang: 90 },
    B: { n: [0, 0, -1], eixo: "z", lado: -1, ang: -90 },
  };
  const LISTA_FACES = ["U", "D", "L", "R", "F", "B"];
  const OPOSTA = { U: "D", D: "U", L: "R", R: "L", F: "B", B: "F" };

  // Matriz de rotação igual à do CSS (rotateX/Y/Z com ângulo em graus)
  function matriz(eixo, graus) {
    const r = graus * Math.PI / 180, c = Math.round(Math.cos(r)), s = Math.round(Math.sin(r));
    if (eixo === "x") return [[1, 0, 0], [0, c, -s], [0, s, c]];
    if (eixo === "y") return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
  }
  const mult = (A, B) => A.map((l, i) => B[0].map((_, j) => l.reduce((t, _, k) => t + A[i][k] * B[k][j], 0)));
  const aplicarV = (M, v) => M.map(l => l[0] * v[0] + l[1] * v[1] + l[2] * v[2]);
  const transposta = M => M[0].map((_, j) => M.map(l => l[j]));
  const I = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  // Todos os giros que a notação conhece. `pega(c, m)`: a camada com coordenada c entra no giro.
  // Faces (R L U D F B), duas camadas (r l u d f b: a face + a do meio), camadas do meio
  // (M segue o L, E segue o D, S segue o F) e o cubo inteiro (x segue o R, y o U, z o F).
  const GIROS = {};
  Object.entries(FACES).forEach(([f, d]) => {
    GIROS[f] = { eixo: d.eixo, ang: d.ang, pega: (c, m) => c === d.lado * m };
    GIROS[f.toLowerCase()] = { eixo: d.eixo, ang: d.ang, pega: (c, m) => c * d.lado > -m };
  });
  GIROS.M = { eixo: "x", ang: -90, pega: (c, m) => Math.abs(c) < m };
  GIROS.E = { eixo: "y", ang: 90, pega: (c, m) => Math.abs(c) < m };
  GIROS.S = { eixo: "z", ang: 90, pega: (c, m) => Math.abs(c) < m };
  GIROS.x = { eixo: "x", ang: 90, pega: () => true };
  GIROS.y = { eixo: "y", ang: -90, pega: () => true };
  GIROS.z = { eixo: "z", ang: 90, pega: () => true };
  const grausDe = mv => GIROS[mv.face].ang * (mv.vezes === -1 ? -1 : 1) * (mv.vezes === 2 ? 2 : 1);

  // Peças (home + rotação) depois de uma sequência de giros, a partir do cubo pronto
  function estadoApos(N, movs) {
    const m = (N - 1) / 2, pecas = [];
    for (let x = -m; x <= m; x++) for (let y = -m; y <= m; y++) for (let z = -m; z <= m; z++) {
      if (Math.max(Math.abs(x), Math.abs(y), Math.abs(z)) === m) pecas.push({ home: [x, y, z], pos: [x, y, z], rot: I });
    }
    for (const mv of movs) {
      const g = GIROS[mv.face], k = "xyz".indexOf(g.eixo), M = matriz(g.eixo, grausDe(mv));
      pecas.forEach(p => { if (g.pega(p.pos[k], m)) { p.pos = aplicarV(M, p.pos); p.rot = mult(M, p.rot); } });
    }
    return pecas;
  }
  // Adesivos visíveis: [{ cor (face de origem), pos, dir }] — a cor é a letra da face no cubo pronto
  function adesivos(N, pecas) {
    const m = (N - 1) / 2, lista = [];
    pecas.forEach(p => LISTA_FACES.forEach(f => {
      const n = FACES[f].n, k = n.findIndex(v => v);
      if (p.home[k] === n[k] * m) lista.push({ cor: f, pos: aplicarV(p.rot, p.home), dir: aplicarV(p.rot, n) });
    }));
    return lista;
  }

  // "R U R' U2" → [{ face, vezes: 1 | -1 | 2 }]
  const ler = alg => alg.trim().split(/\s+/).filter(Boolean).map(m => ({ face: m[0], vezes: m.endsWith("2") ? 2 : m.endsWith("'") ? -1 : 1 }));
  const texto = mv => mv.face + (mv.vezes === 2 ? "2" : mv.vezes === -1 ? "'" : "");
  const inverso = movs => movs.slice().reverse().map(m => ({ face: m.face, vezes: m.vezes === 2 ? 2 : -m.vezes }));

  // Junta giros seguidos da mesma face (U U → U2, R R' → nada)
  function simplificar(movs) {
    const out = [];
    for (const mv of movs) {
      const ult = out[out.length - 1];
      if (ult && ult.face === mv.face) {
        const q = (((ult.vezes === 2 ? 2 : ult.vezes) + (mv.vezes === 2 ? 2 : mv.vezes)) % 4 + 4) % 4;
        out.pop();
        if (q) out.push({ face: mv.face, vezes: q === 3 ? -1 : q });
      } else out.push({ ...mv });
    }
    return out;
  }

  // As 24 rotações do cubo (matrizes de permutação com sinais e determinante 1)
  const ROTS = [];
  [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].forEach(p => {
    for (let sinais = 0; sinais < 8; sinais++) {
      const M = [0, 1, 2].map(i => [0, 1, 2].map(j => (j === p[i] ? ((sinais >> i) & 1 ? -1 : 1) : 0)));
      const det = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
      if (det === 1) ROTS.push(M);
    }
  });
  const chave = M => M.flat().join();
  const INDICE = new Map(ROTS.map((M, i) => [chave(M), i]));
  const idxRot = M => INDICE.get(chave(M));
  const I0 = idxRot(I);

  // Giros que o resolvedor conhece: os 18 das faces (cada face × horário, anti-horário, duplo)
  // e, depois deles, os de duas camadas e do meio que os algoritmos do CFOP usam (r, f, M)
  const MOVS = [...LISTA_FACES, "r", "f", "M"].flatMap(face => [1, -1, 2].map(vezes => ({ face, vezes })));
  const IDX_MOV = new Map(MOVS.map((mv, i) => [texto(mv), i]));
  const idxMov = mv => IDX_MOV.get(texto(mv));

  // ---------- Resolvedor (método das camadas) ----------
  // `pecas`: [{ home: [x, y, z], rot: matriz }] (o estado atual do cubo). Devolve
  // { ok, etapas: [{ nome, texto, movs }] } com os giros de cada etapa do método.
  // `metodo`: "camadas" (o das lições) ou "cfop" (só no 3×3: cruz, F2L, OLL e PLL em 4 olhadas)
  function resolver(N, pecas, metodo = "camadas") {
    const m = (N - 1) / 2;
    const homes = pecas.map(p => p.home);
    const P = homes.length;
    // Tabela: giro × peça × rotação atual → nova rotação
    const tab = MOVS.map(mv => {
      const g = GIROS[mv.face], k = "xyz".indexOf(g.eixo), M = matriz(g.eixo, grausDe(mv));
      return homes.map(h => Int8Array.from(ROTS, (R) => {
        const pos = aplicarV(R, h);
        return g.pega(pos[k], m) ? idxRot(mult(M, R)) : idxRot(R);
      }));
    });
    const aplicar = (s, mi) => { const n = new Int8Array(P); for (let p = 0; p < P; p++) n[p] = tab[mi][p][s[p]]; return n; };
    const aplicarSeq = (s, seq) => seq.reduce(aplicar, s);
    const pos = (s, p) => aplicarV(ROTS[s[p]], homes[p]);
    const resolvida = (s, p) => s[p] === I0;
    const amareloEmCima = (s, p) => aplicarV(ROTS[s[p]], [0, -1, 0])[1] === -1;
    const sinal = v => (v > 0 ? 1 : v < 0 ? -1 : 0);

    // No 2×2 não há centros: a referência é o canto de baixo-esquerda-trás. Viramos o cubo
    // "de mentirinha" para esse canto ficar no lugar, resolvemos, e traduzimos as faces de volta.
    let G = I;
    if (N === 2) G = pecas[homes.findIndex(h => h[0] < 0 && h[1] > 0 && h[2] < 0)].rot;
    const Gt = transposta(G);
    let s = Int8Array.from(pecas, p => idxRot(mult(Gt, p.rot)));

    // Vistas: o mesmo algoritmo olhando o cubo por outro lado (a face indicada fica na frente)
    const VISTAS = {
      F: { F: "F", R: "R", B: "B", L: "L" },
      R: { F: "R", R: "B", B: "L", L: "F" },
      B: { F: "B", R: "L", B: "F", L: "R" },
      L: { F: "L", R: "F", B: "R", L: "B" },
    };
    const naVista = (alg, v) => alg.split(" ").map(t => {
      const c = t[0], nova = VISTAS[v][c.toUpperCase()];
      return (nova ? (c === c.toUpperCase() ? nova : nova.toLowerCase()) : c) + t.slice(1);
    }).join(" ");
    const seq = alg => ler(alg).map(idxMov);

    const etapas = [];
    let atual = [];
    const fazer = alg => { const sq = typeof alg === "string" ? seq(alg) : alg; s = aplicarSeq(s, sq); atual.push(...sq); };
    const fecharEtapa = (nome, txt) => { etapas.push({ nome, texto: txt, movs: atual.map(i => MOVS[i]) }); atual = []; };

    const tipo = h => h.filter(v => v === 0).length; // 0 canto, 1 meio (aresta), 2 centro
    const pecasOnde = cond => homes.map((h, p) => p).filter(p => cond(homes[p]));
    const mantidas = [];

    // Busca em profundidade crescente numa lista de "atalhos" (algoritmos), até `pronto(s)`
    function buscar(alfabeto, pronto, maxProf) {
      const seqs = alfabeto.map(a => ({ a, sq: seq(a), ehU: /^U/.test(a) && a.split(" ").length === 1 }));
      const caminho = [];
      function dfs(st, prof, ultimoU) {
        if (pronto(st)) return true;
        if (!prof) return false;
        for (const x of seqs) {
          if (x.ehU && ultimoU) continue;
          caminho.push(x.a);
          if (dfs(aplicarSeq(st, x.sq), prof - 1, x.ehU)) return true;
          caminho.pop();
        }
        return false;
      }
      for (let d = 0; d <= maxProf; d++) if (dfs(s, d, false)) { caminho.forEach(fazer); return true; }
      return false;
    }

    if (N === 3) {
      // ---- 1. Cruz branca: cada meio branco, um de cada vez (busca com estimativa por peça) ----
      const dist = homes.map((_, p) => {
        const d = new Int8Array(24).fill(-1); d[I0] = 0; const fila = [I0];
        while (fila.length) { const r = fila.shift(); for (let mi = 0; mi < 18; mi++) { const r2 = tab[mi][p][r]; if (d[r2] < 0) { d[r2] = d[r] + 1; fila.push(r2); } } }
        return d;
      });
      const cruz = pecasOnde(h => tipo(h) === 1 && h[1] === m);
      for (const e of cruz) {
        mantidas.push(e);
        const alvos = mantidas.slice();
        const caminho = [];
        const h = st => Math.max(...alvos.map(p => dist[p][st[p]]));
        const dfs = (st, g, limite, ultFace) => {
          const est = h(st);
          if (!est) return true;
          if (g + est > limite) return false;
          for (let mi = 0; mi < 18; mi++) {
            const f = MOVS[mi].face;
            if (f === ultFace || (OPOSTA[f] === ultFace && f < ultFace)) continue;
            caminho.push(mi);
            if (dfs(aplicar(st, mi), g + 1, limite, f)) return true;
            caminho.pop();
          }
          return false;
        };
        let achou = false;
        for (let lim = 0; lim <= 9 && !achou; lim++) achou = dfs(s, 0, lim, null);
        if (!achou) return { ok: false, etapas };
        fazer(caminho);
      }
      fecharEtapa("Cruz branca", "Primeiro, a cruz branca embaixo: cada peça do meio com branco vai para baixo, combinando com a cor do centro do lado.");
      if (metodo === "cfop") return cfop();
    }

    // ---------- CFOP: F2L (pares), OLL e PLL em 4 olhadas ----------
    // Busca em profundidade crescente numa lista de itens { a: algoritmo, rot?: caso, g?: gatilho };
    // devolve os itens escolhidos (sem aplicar) ou null.
    // `maxAlgs`: quantos algoritmos (itens que não são só U) o caminho pode ter
    function procurar(itens, pronto, max, maxAlgs = Infinity) {
      const xs = itens.map(it => ({ ...it, sq: seq(it.a), ehU: /^U/.test(it.a) && it.a.split(" ").length === 1 }));
      const caminho = [];
      function dfs(st, prof, ultimoU, algs) {
        if (pronto(st)) return true;
        if (!prof) return false;
        for (const x of xs) {
          if (x.ehU && ultimoU) continue;
          if (!x.ehU && algs >= maxAlgs) continue;
          caminho.push(x);
          if (dfs(aplicarSeq(st, x.sq), prof - 1, x.ehU, algs + (x.ehU ? 0 : 1))) return true;
          caminho.pop();
        }
        return false;
      }
      for (let d = 0; d <= max; d++) if (dfs(s, d, false, 0)) return caminho.slice();
      return null;
    }
    function cfop() {
      const VISTA = (x, z) => (x > 0 ? (z > 0 ? "F" : "R") : (z > 0 ? "L" : "B"));
      const Us = ["U", "U'", "U2"].map(a => ({ a }));
      const tipo = h => h.filter(v => v === 0).length;
      const mantidas = homes.map((h, p) => p).filter(p => tipo(homes[p]) === 1 && homes[p][1] === m); // a cruz
      const casosDe = id => (typeof CUBO_AVANCADO === "undefined" ? [] : CUBO_AVANCADO.find(g => g.id === id).itens.map(it => ({ a: it.alg, rot: it })));
      const tamanho = cam => cam.reduce((t, x) => t + x.sq.length, 0);

      // ---- F2L: cada canto branco vai junto com o seu meio, como um par ----
      const SLOTS = [[1, 1], [-1, 1], [-1, -1], [1, -1]].map(([x, z]) => ({
        x, z, v: VISTA(x, z),
        canto: homes.findIndex(h => h[0] === x && h[1] === m && h[2] === z),
        meio: homes.findIndex(h => h[0] === x && h[1] === 0 && h[2] === z),
        lugar: `${z > 0 ? "frente" : "trás"}, à ${x > 0 ? "direita" : "esquerda"}`,
        cores: `${z > 0 ? "verde" : "azul"} e ${x > 0 ? "laranja" : "vermelho"}`,
      }));
      const GATILHOS = ["R U R'", "R U' R'", "R U2 R'", "F' U F", "F' U' F", "F' U2 F"];
      // A peça está encaixada em outro lugar (não em cima, nem no lugar dela)
      const presaFora = (p, q) => { const o = pos(s, p); return o[1] >= 0 && !(sinal(o[0]) === q.x && sinal(o[2]) === q.z); };
      const prontoPar = q => st => resolvida(st, q.canto) && resolvida(st, q.meio) && mantidas.every(p => resolvida(st, p));
      // Plano B (raro): o par do jeito do método das camadas, canto e depois meio
      function parPeloMetodoDasCamadas(q) {
        let o = pos(s, q.canto);
        if (o[1] > 0 && !resolvida(s, q.canto)) fazer(naVista("R U R' U'", VISTA(sinal(o[0]), sinal(o[2]))));
        for (let k = 0; k < 4; k++) { o = pos(s, q.canto); if (resolvida(s, q.canto) || (sinal(o[0]) === q.x && sinal(o[2]) === q.z)) break; fazer("U"); }
        for (let k = 0; k < 6 && !resolvida(s, q.canto); k++) fazer(naVista("R U R' U'", q.v));
        const DIREITA = "U R U' R' U' F' U F", ESQUERDA = "U' L' U L U F U' F'";
        o = pos(s, q.meio);
        if (!resolvida(s, q.meio) && o[1] === 0) fazer(naVista(DIREITA, VISTA(sinal(o[0]), sinal(o[2]))));
        if (prontoPar(q)(s)) return true;
        for (const u of ["", "U", "U2", "U'"]) for (const v of ["F", "R", "B", "L"]) for (const alg of [DIREITA, ESQUERDA]) {
          const sq = seq((u + " " + naVista(alg, v)).trim());
          if (prontoPar(q)(aplicarSeq(s, sq))) { fazer(sq); return true; }
        }
        return false;
      }
      const restantes = SLOTS.slice();
      let numPar = 0, tirou = 0;
      while (restantes.length) {
        let melhor = null;
        for (const q of restantes) {
          if (prontoPar(q)(s)) { melhor = { q, cam: [] }; break; }
          if (presaFora(q.canto, q) || presaFora(q.meio, q)) continue;
          const cam = procurar([...Us, ...GATILHOS.map(g => ({ a: naVista(g, q.v), g }))], prontoPar(q), 5);
          if (cam && (!melhor || tamanho(cam) < tamanho(melhor.cam))) melhor = { q, cam };
        }
        if (!melhor && tirou < 4) {
          // As peças dos pares que faltam estão presas em outros lugares: tira uma de lá
          tirou++;
          const q = restantes[0], presa = presaFora(q.canto, q) ? q.canto : q.meio, o = pos(s, presa);
          if (o[1] >= 0) { fazer(naVista("R U R'", VISTA(sinal(o[0]), sinal(o[2])))); continue; }
        }
        let q, txt;
        if (melhor) {
          q = melhor.q;
          melhor.cam.forEach(x => fazer(x.sq));
          const gs = [...new Set(melhor.cam.filter(x => x.g).map(x => x.g))];
          txt = melhor.cam.length
            ? `O canto branco com ${q.cores} e o seu meio se juntam em cima e descem juntos para o lugar da ${q.lugar}. Gatilhos usados: ${gs.join(", ")}.`
            : `O par branco com ${q.cores} já estava no lugar!`;
        } else {
          q = restantes[0];
          if (!parPeloMetodoDasCamadas(q)) return { ok: false, etapas };
          txt = "Este par estava escondido: colocamos primeiro o canto e depois o meio, como no método das camadas.";
        }
        if (!prontoPar(q)(s)) return { ok: false, etapas };
        restantes.splice(restantes.indexOf(q), 1);
        mantidas.push(q.canto, q.meio);
        tirou = 0;
        fecharEtapa(`F2L: par ${++numPar} de 4`, txt);
      }

      // ---- OLL e PLL: cada olhada procura o caso (com U antes e depois) entre os algoritmos ----
      const cima = homes.map((h, p) => p).filter(p => homes[p][1] === -m && tipo(homes[p]) < 2);
      const meiosCima = cima.filter(p => tipo(homes[p]) === 1), cantosCima = cima.filter(p => tipo(homes[p]) === 0);
      const olhada = (id, nome, intro, pronto, max) => {
        const cam = procurar([...Us, ...casosDe(id)], pronto, max, 1); // um algoritmo por olhada
        if (!cam) return false;
        cam.forEach(x => fazer(x.sq));
        const casos = cam.filter(x => x.rot).map(x => x.rot);
        const txt = casos.length
          ? `${intro} ${casos.map(c => `Caso ${c.nome}: ${c.reconhecer} Algoritmo: ${c.alg}.`).join(" Depois, ")}`
          : `${intro} Já estava pronto${cam.length ? ": só girar a camada de cima" : ""}!`;
        fecharEtapa(nome, txt);
        return true;
      };
      const tudo = st => st.every((r, p) => tipo(homes[p]) === 2 || r === I0);
      if (!olhada("oll1", "OLL 1: cruz amarela", "Primeira olhada da camada de cima: a cruz amarela.", st => meiosCima.every(p => amareloEmCima(st, p)), 4)) return { ok: false, etapas };
      if (!olhada("oll2", "OLL 2: face amarela", "Segunda olhada: toda a face de cima amarela.", st => cima.every(p => amareloEmCima(st, p)), 3)) return { ok: false, etapas };
      if (!olhada("pll1", "PLL 1: cantos", "Terceira olhada: os cantos de cima no lugar.", st => cantosCima.every(p => resolvida(st, p)), 4)) return { ok: false, etapas };
      if (!olhada("pll2", "PLL 2: meios", "Última olhada: os meios de cima no lugar.", tudo, 3)) return { ok: false, etapas };
      etapas.forEach(e => { e.movs = simplificar(e.movs); });
      return { ok: true, etapas };
    }

    // ---- 2. Cantos de baixo (algoritmo mágico) ----
    const MACRO_CANTO = (x, z) => (x > 0 ? (z > 0 ? "R U R' U'" : "B U B' U'") : (z > 0 ? "F U F' U'" : "L U L' U'"));
    const cantosBaixo = pecasOnde(h => tipo(h) === 0 && h[1] > 0 && !(N === 2 && h[0] < 0 && h[2] < 0));
    if (N === 2) mantidas.push(homes.findIndex(h => h[0] < 0 && h[1] > 0 && h[2] < 0));
    for (const c of cantosBaixo) {
      if (!resolvida(s, c)) {
        let p = pos(s, c);
        if (p[1] > 0) fazer(MACRO_CANTO(p[0], p[2])); // está embaixo no lugar errado: sobe
        for (let k = 0; k < 4; k++) {
          p = pos(s, c);
          if (sinal(p[0]) === sinal(homes[c][0]) && sinal(p[2]) === sinal(homes[c][2])) break;
          fazer("U");
        }
        for (let k = 0; k < 6 && !resolvida(s, c); k++) fazer(MACRO_CANTO(homes[c][0], homes[c][2]));
      }
      if (!resolvida(s, c)) return { ok: false, etapas };
      mantidas.push(c);
    }
    fecharEtapa(N === 3 ? "Cantos brancos" : "Primeira camada",
      "Agora os cantos brancos: levamos cada canto para cima do seu lugar e repetimos o algoritmo mágico, R U R linha U linha, até ele encaixar.");

    if (N === 3) {
      // ---- 3. Segunda camada ----
      const DIREITA = "U R U' R' U' F' U F", ESQUERDA = "U' L' U L U F U' F'";
      const VISTA_DO_LUGAR = (x, z) => (x > 0 ? (z > 0 ? "F" : "R") : (z > 0 ? "L" : "B"));
      for (const e of pecasOnde(h => tipo(h) === 1 && h[1] === 0)) {
        if (!resolvida(s, e)) {
          const p = pos(s, e);
          if (p[1] === 0) fazer(naVista(DIREITA, VISTA_DO_LUGAR(p[0], p[2]))); // está no meio errado: sai
          let feito = false;
          for (const u of ["", "U", "U2", "U'"]) {
            for (const v of ["F", "R", "B", "L"]) {
              for (const alg of [DIREITA, ESQUERDA]) {
                const sq = seq((u + " " + naVista(alg, v)).trim());
                const s2 = aplicarSeq(s, sq);
                if (resolvida(s2, e) && mantidas.every(q => resolvida(s2, q))) { fazer(sq); feito = true; break; }
              }
              if (feito) break;
            }
            if (feito) break;
          }
          if (!feito) return { ok: false, etapas };
        }
        mantidas.push(e);
      }
      fecharEtapa("Segunda camada", "Depois, a camada do meio: cada peça sem amarelo desce para o seu lugar, com o algoritmo para a direita ou para a esquerda.");

      // ---- 4. Cruz amarela ----
      const meiosCima = pecasOnde(h => tipo(h) === 1 && h[1] < 0);
      if (!buscar(["U", "U'", "U2", "F R U R' U' F'"], st => meiosCima.every(p => amareloEmCima(st, p)), 6)) return { ok: false, etapas };
      fecharEtapa("Cruz amarela", "Agora a cruz amarela em cima: F, R, U, R linha, U linha, F linha, até a cruz aparecer.");

      // ---- 5. Arrumar a cruz ----
      const SUNE = "R U R' U R U2 R'";
      if (!buscar(["U", "U'", "U2", ...["F", "R", "B", "L"].map(v => naVista(SUNE, v))], st => meiosCima.every(p => resolvida(st, p)), 6)) return { ok: false, etapas };
      fecharEtapa("Arrumar a cruz", "Agora as cores dos lados da cruz: R U R linha U R U2 R linha troca as peças até as cores combinarem.");
    }

    // ---- 6. Cantos de cima no lugar ----
    const cantosCima = pecasOnde(h => tipo(h) === 0 && h[1] < 0);
    const TROCA = "U R U' L' U R' U' L";
    const lugarCerto = st => cantosCima.every(p => { const q = aplicarV(ROTS[st[p]], homes[p]); return q.every((v, i) => v === homes[p][i]); });
    if (!buscar([...(N === 2 ? ["U", "U'", "U2"] : []), ...["F", "R", "B", "L"].map(v => naVista(TROCA, v))], lugarCerto, 4)) return { ok: false, etapas };
    fecharEtapa("Cantos no lugar", "Agora cada canto amarelo vai para a sua casa, mesmo que ainda esteja girado: U R U linha L linha U R linha U linha L.");

    // ---- 7. Girar os cantos ----
    const naFrenteDireita = () => cantosCima.find(p => { const q = pos(s, p); return q[0] > 0 && q[1] < 0 && q[2] > 0; });
    for (let k = 0; k < 4; k++) {
      const c = naFrenteDireita();
      for (let j = 0; j < 6 && !amareloEmCima(s, c); j++) fazer("R' D' R D");
      fazer("U");
    }
    if (!buscar(["U", "U'", "U2"], st => st.every((r, p) => tipo(homes[p]) === 2 || r === I0), 1)) return { ok: false, etapas };
    fecharEtapa("Girar os cantos", "Por último, giramos cada canto até o amarelo ficar para cima: R linha D linha R D. Embaixo parece bagunçar, mas no fim tudo volta!");

    // No 2×2, traduz as faces de volta para o cubo de verdade
    if (N === 2) {
      const real = f => LISTA_FACES.find(g => aplicarV(G, FACES[f].n).every((v, i) => v === FACES[g].n[i]));
      etapas.forEach(e => { e.movs = e.movs.map(mv => ({ face: real(mv.face), vezes: mv.vezes })); });
    }
    etapas.forEach(e => { e.movs = simplificar(e.movs); });
    return { ok: true, etapas };
  }

  return { FACES, GIROS, LISTA_FACES, matriz, mult, aplicarV, I, ler, texto, inverso, simplificar, grausDe, estadoApos, adesivos, resolver };
})();
