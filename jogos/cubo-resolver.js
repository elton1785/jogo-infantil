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

  // 18 giros: cada face × (horário, anti-horário, duplo)
  const MOVS = LISTA_FACES.flatMap(face => [1, -1, 2].map(vezes => ({ face, vezes })));
  const idxMov = mv => LISTA_FACES.indexOf(mv.face) * 3 + (mv.vezes === 1 ? 0 : mv.vezes === -1 ? 1 : 2);

  // ---------- Resolvedor (método das camadas) ----------
  // `pecas`: [{ home: [x, y, z], rot: matriz }] (o estado atual do cubo). Devolve
  // { ok, etapas: [{ nome, texto, movs }] } com os giros de cada etapa do método.
  function resolver(N, pecas) {
    const m = (N - 1) / 2;
    const homes = pecas.map(p => p.home);
    const P = homes.length;
    // Tabela: giro × peça × rotação atual → nova rotação
    const tab = MOVS.map(mv => {
      const f = FACES[mv.face], k = "xyz".indexOf(f.eixo), M = matriz(f.eixo, grausDe(mv));
      return homes.map(h => Int8Array.from(ROTS, (R) => {
        const pos = aplicarV(R, h);
        return pos[k] === f.lado * m ? idxRot(mult(M, R)) : idxRot(R);
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
    const naVista = (alg, v) => alg.split(" ").map(t => (VISTAS[v][t[0]] || t[0]) + t.slice(1)).join(" ");
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
