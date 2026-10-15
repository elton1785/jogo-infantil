// Mundo de Blocos — os blocos e as texturas (pixel art desenhada por código, tudo original).
// Duas resoluções: Clássico 16×16 (pixelado, como os jogos antigos) e Novo 32×32 (alta
// definição: grão fino, relevo nos tijolos, tábuas e pedras). No modo Novo cada textura fica
// num espaço 64×64 com borda repetida em volta, para os mipmaps não misturarem texturas vizinhas.
const MundoTexturas = (() => {
  const COLS = 8;
  // Índices das texturas no atlas
  const T = {
    pedra: 0, gramaTopo: 1, gramaLado: 2, terra: 3, pedregulho: 4, tabuas: 5, troncoLado: 6, troncoTopo: 7,
    folhas: 8, areia: 9, agua: 10, vidro: 11, tijolo: 12, rochaMae: 13, neveTopo: 14, neveLado: 15,
    la: 16, // 16..24: vermelha, amarela, azul, verde, branca, rosa, laranja, roxa, preta
    ouro: 25, diamante: 26, carvao: 27, florAmarela: 28, florVermelha: 29, gramaAlta: 30, cactoLado: 31,
    cactoTopo: 32, porcoPele: 33, porcoCara: 34, ovelhaCara: 35, cascalho: 36, ovelhaPele: 37,
    zumbiPele: 38, zumbiCara: 39, zumbiRoupa: 40, gosma: 41, gosmaCara: 42, tocha: 43, zumbiCalca: 44,
  };
  const LAS = [["vermelha", [200, 45, 45]], ["amarela", [235, 200, 40]], ["azul", [45, 80, 200]], ["verde", [70, 150, 50]],
    ["branca", [235, 235, 235]], ["rosa", [240, 140, 175]], ["laranja", [235, 125, 35]], ["roxa", [130, 60, 180]], ["preta", [35, 35, 40]]];

  // Blocos: faces [cima, lado, baixo]; tipo: undefined (sólido e opaco), "folha" e "vidro"
  // (sólidos com furos), "agua" (transparente, não colide), "cruz" (planta: dois planos em X)
  const BLOCOS = [null,
    { nome: "Pedra", f: [T.pedra] },                                        // 1
    { nome: "Grama", f: [T.gramaTopo, T.gramaLado, T.terra] },              // 2
    { nome: "Terra", f: [T.terra] },                                        // 3
    { nome: "Pedregulho", f: [T.pedregulho] },                              // 4
    { nome: "Tábuas", f: [T.tabuas] },                                      // 5
    { nome: "Tronco", f: [T.troncoTopo, T.troncoLado, T.troncoTopo] },      // 6
    { nome: "Folhas", f: [T.folhas], tipo: "folha" },                       // 7
    { nome: "Areia", f: [T.areia] },                                        // 8
    { nome: "Água", f: [T.agua], tipo: "agua" },                            // 9
    { nome: "Vidro", f: [T.vidro], tipo: "vidro" },                         // 10
    { nome: "Tijolos", f: [T.tijolo] },                                     // 11
    { nome: "Rocha do fundo", f: [T.rochaMae], fixo: true },                // 12
    { nome: "Neve", f: [T.neveTopo, T.neveLado, T.terra] },                 // 13
    ...LAS.map(([n], i) => ({ nome: `Lã ${n}`, f: [T.la + i] })),           // 14..22
    { nome: "Ouro", f: [T.ouro] },                                          // 23
    { nome: "Diamante", f: [T.diamante] },                                  // 24
    { nome: "Carvão", f: [T.carvao] },                                      // 25
    { nome: "Flor amarela", f: [T.florAmarela], tipo: "cruz" },             // 26
    { nome: "Flor vermelha", f: [T.florVermelha], tipo: "cruz" },           // 27
    { nome: "Grama alta", f: [T.gramaAlta], tipo: "cruz" },                 // 28
    { nome: "Cacto", f: [T.cactoTopo, T.cactoLado, T.cactoTopo] },          // 29
    { nome: "Cascalho", f: [T.cascalho] },                                  // 30
    { nome: "Tocha", f: [T.tocha], tipo: "cruz" },                          // 31 (afasta as criaturas da noite)
  ];
  const ID = { ar: 0, pedra: 1, grama: 2, terra: 3, pedregulho: 4, tabuas: 5, tronco: 6, folhas: 7, areia: 8, agua: 9, vidro: 10,
    tijolo: 11, rochaMae: 12, neve: 13, la: 14, ouro: 23, diamante: 24, carvao: 25, florAmarela: 26, florVermelha: 27,
    gramaAlta: 28, cacto: 29, cascalho: 30, tocha: 31 };
  // Textura de cada face: 0 cima, 1 lado, 2 baixo
  const tex = (b, lado) => { const f = BLOCOS[b].f; return f.length === 1 ? f[0] : f[lado]; };
  const opaco = b => b > 0 && !BLOCOS[b].tipo;
  const solido = b => b > 0 && BLOCOS[b].tipo !== "agua" && BLOCOS[b].tipo !== "cruz";

  function aleatorio(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  // ---------- Pintura ----------
  // Os desenhos usam coordenadas "lógicas" de 0 a 16 (u, v); cada textura é pintada com N×N pixels.
  // `hd`: relevo (bordas claras em cima/esquerda e escuras embaixo/direita) e grão mais fino.
  function pintarTextura(i, N, hd) {
    const buf = new Uint8ClampedArray(N * N * 4);
    const r = aleatorio(i * 977 + 13);
    const K = N / 16;
    const px = (x, y, c, a = 255) => {
      x = ((x % N) + N) % N; y = ((y % N) + N) % N;
      const k = (y * N + x) * 4;
      buf[k] = c[0]; buf[k + 1] = c[1]; buf[k + 2] = c[2]; buf[k + 3] = a;
    };
    // Ponto de 1 "pixel lógico" (no HD vira um quadradinho de 2×2 com variação)
    const ponto = (u, v, c, a = 255) => { for (let dy = 0; dy < K; dy++) for (let dx = 0; dx < K; dx++) px(Math.floor(u) * K + dx, Math.floor(v) * K + dy, hd ? varia(c, 0.06) : c, a); };
    const varia = (c, q) => { const f = 1 + (r() - 0.5) * q; return c.map(v => v * f); };
    const cada = fn => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) fn((x + 0.5) / K, (y + 0.5) / K, x, y); };
    const encher = (c, q) => cada((u, v, x, y) => px(x, y, varia(c, q)));
    // Relevo de um retângulo (em coordenadas lógicas): claro em cima/esquerda, escuro embaixo/direita
    const relevo = (u0, v0, u1, v1, forca = 0.16) => {
      if (!hd) return;
      cada((u, v, x, y) => {
        if (u < u0 || u >= u1 || v < v0 || v >= v1) return;
        const k = (y * N + x) * 4;
        let f = 1;
        if (u - u0 < 0.5 || v - v0 < 0.5) f = 1 + forca;
        else if (u1 - u < 0.5 || v1 - v < 0.5) f = 1 - forca;
        for (let j = 0; j < 3; j++) buf[k + j] = buf[k + j] * f;
      });
    };
    const pedra = () => {
      encher([128, 128, 128], hd ? 0.12 : 0.16);
      for (let k = 0; k < 9; k++) { const u = Math.floor(r() * 15), v = Math.floor(r() * 16); ponto(u, v, [100, 100, 100]); ponto(u + 1, v, [104, 104, 104]); }
      if (hd) for (let k = 0; k < 5; k++) { const u = r() * 14, v = r() * 14; ponto(u, v, [150, 150, 150]); }
    };
    const terra = () => {
      encher([134, 96, 67], 0.2);
      for (let k = 0; k < 14; k++) ponto(Math.floor(r() * 16), Math.floor(r() * 16), r() < 0.5 ? [105, 74, 50] : [160, 120, 88]);
      if (hd) for (let k = 0; k < 6; k++) ponto(r() * 16, r() * 16, [150, 140, 130]); // pedrinhas
    };
    const grama = [92, 160, 52];
    const pinturas = {
      [T.pedra]: pedra,
      [T.gramaTopo]: () => { encher(grama, 0.22); for (let k = 0; k < 20; k++) ponto(Math.floor(r() * 16), Math.floor(r() * 16), r() < 0.5 ? [70, 130, 40] : [120, 190, 70]); },
      [T.terra]: terra,
      [T.gramaLado]: () => {
        terra();
        const fim = Array.from({ length: 16 }, () => 3 + (r() < 0.45 ? 1 : 0) + (r() < 0.2 ? 1 : 0));
        cada((u, v, x, y) => { if (v < fim[Math.floor(u)]) px(x, y, varia(fim[Math.floor(u)] - v < 0.6 && hd ? grama.map(c => c * 0.8) : grama, 0.22)); });
      },
      [T.pedregulho]: () => {
        const pts = Array.from({ length: 9 }, () => [r() * 16, r() * 16, 95 + r() * 60]);
        cada((u, v, x, y) => {
          const ds = pts.map(([u0, v0, c]) => {
            const du = Math.min(Math.abs(u - u0), 16 - Math.abs(u - u0)), dv = Math.min(Math.abs(v - v0), 16 - Math.abs(v - v0));
            return [Math.hypot(du, dv), c, u - u0, v - v0];
          }).sort((a, b) => a[0] - b[0]);
          const borda = ds[1][0] - ds[0][0] < 1.1;
          let c = borda ? 68 : ds[0][1] + (r() - 0.5) * 14 - ds[0][0] * 3;
          if (hd && !borda) c += (-ds[0][2] - ds[0][3]) * 2.2; // luz de cima-esquerda: pedras arredondadas
          px(x, y, [c, c, c]);
        });
      },
      [T.tabuas]: () => {
        cada((u, v, x, y) => {
          const fileira = Math.floor(v / 4), tom = 1 + (aleatorio(fileira + 5)() - 0.5) * 0.12, junta = (fileira * 7 + 3) % 16;
          let c = [168 * tom, 134 * tom, 82 * tom];
          if (v % 4 >= 3) c = [112, 86, 52];
          else if (Math.floor(u) === junta) c = [125, 96, 60];
          else c = varia(hd ? c.map(q => q * (1 + 0.05 * Math.sin(u * 1.7 + fileira * 3))) : c, 0.08); // veios da madeira
          px(x, y, c);
        });
        for (let f = 0; f < 4; f++) relevo(0, f * 4, 16, f * 4 + 3, 0.12);
      },
      [T.troncoLado]: () => {
        const escuras = [1, 5, 9, 12, 14];
        cada((u, v, x, y) => px(x, y, escuras.includes(Math.floor(u)) && r() < 0.85 ? [70, 54, 34] : varia([104, 82, 52], 0.18)));
      },
      [T.troncoTopo]: () => cada((u, v, x, y) => {
        const d = Math.max(Math.abs(u - 8), Math.abs(v - 8));
        px(x, y, d > 7 ? varia([104, 82, 52], 0.15) : Math.floor(d) % 2 ? varia([178, 144, 92], 0.06) : varia([150, 118, 74], 0.06));
      }),
      [T.folhas]: () => cada((u, v, x, y) => {
        const buraco = aleatorio(Math.floor(u) * 31 + Math.floor(v) * 7 + 3)() < (hd ? 0.07 : 0.16);
        if (buraco) px(x, y, [0, 0, 0], 0); else px(x, y, varia(r() < 0.3 ? [45, 110, 30] : [70, 150, 45], 0.25));
      }),
      [T.areia]: () => { encher([220, 208, 160], 0.08); for (let k = 0; k < 16; k++) ponto(Math.floor(r() * 16), Math.floor(r() * 16), [195, 180, 130]); },
      [T.agua]: () => cada((u, v, x, y) => {
        const onda = hd ? Math.sin(u * 0.9 + v * 0.5) + Math.sin(u * 0.35 - v * 1.1) > 1.3 : (Math.floor(u) + Math.floor(v) * 2) % 8 === 0;
        px(x, y, onda ? [110, 160, 235] : varia([45, 95, 205], 0.06), 185);
      }),
      [T.vidro]: () => cada((u, v, x, y) => {
        const borda = u < 1 || v < 1 || u > 15 || v > 15;
        const fu = Math.floor(u), fv = Math.floor(v);
        const brilho = (fu - fv === 4 && fu > 5 && fu < 11) || (fu - fv === 6 && fu > 8 && fu < 12);
        px(x, y, borda ? [205, 228, 236] : [255, 255, 255], borda || brilho ? 255 : 0);
      }),
      [T.tijolo]: () => {
        cada((u, v, x, y) => {
          const fileira = Math.floor(v / 4), desl = fileira % 2 ? 4 : 0;
          const massa = v % 4 >= 3 || (u + desl) % 8 >= 7;
          px(x, y, massa ? varia([190, 182, 170], 0.05) : varia([152, 64, 48], 0.14));
        });
        for (let f = 0; f < 4; f++) for (let k = -1; k < 3; k++) { const u0 = k * 8 - (f % 2 ? 4 : 0); relevo(Math.max(0, u0), f * 4, Math.min(16, u0 + 7), f * 4 + 3, 0.18); }
      },
      [T.rochaMae]: () => cada((u, v, x, y) => { const c = [38, 62, 88, 110][Math.floor(aleatorio(Math.floor(u) * 17 + Math.floor(v) * 131)() * 4)]; px(x, y, varia([c, c, c], 0.08)); }),
      [T.neveTopo]: () => encher([238, 244, 250], 0.05),
      [T.neveLado]: () => {
        terra();
        const fim = Array.from({ length: 16 }, () => 3 + (r() < 0.5 ? 1 : 0));
        cada((u, v, x, y) => { if (v < fim[Math.floor(u)]) px(x, y, varia([238, 244, 250], 0.05)); });
      },
      [T.porcoPele]: () => encher([238, 160, 160], 0.06),
      [T.porcoCara]: () => {
        encher([238, 160, 160], 0.05);
        [[3, 5], [11, 5]].forEach(([u, v]) => { ponto(u, v, [255, 255, 255]); ponto(u + 1, v, [30, 30, 30]); ponto(u, v + 1, [255, 255, 255]); ponto(u + 1, v + 1, [30, 30, 30]); });
        for (let v = 9; v < 13; v++) for (let u = 5; u < 11; u++) ponto(u, v, [222, 120, 130]);
        [[6, 10], [9, 10], [6, 11], [9, 11]].forEach(([u, v]) => ponto(u, v, [120, 50, 60]));
      },
      [T.ovelhaCara]: () => {
        encher([228, 228, 228], 0.06);
        for (let v = 3; v < 15; v++) for (let u = 3; u < 13; u++) ponto(u, v, [215, 190, 170]);
        [[4, 7], [10, 7]].forEach(([u, v]) => { ponto(u, v, [255, 255, 255]); ponto(u + 1, v, [30, 30, 30]); });
        ponto(7, 11, [200, 140, 140]); ponto(8, 11, [200, 140, 140]);
      },
      [T.ovelhaPele]: () => encher([215, 190, 170], 0.05),
      [T.cascalho]: () => cada((u, v, x, y) => {
        const cel = Math.floor(u / 2) * 8 + Math.floor(v / 2);
        const c = [[130, 122, 118], [100, 95, 92], [155, 148, 140], [118, 104, 96]][Math.floor(aleatorio(cel + 99)() * 4)];
        const sombra = hd && (u % 2 > 1.5 || v % 2 > 1.5) ? 0.82 : 1;
        px(x, y, varia(c.map(q => q * sombra), 0.1));
      }),
      [T.cactoLado]: () => {
        cada((u, v, x, y) => {
          const fu = Math.floor(u);
          let c = varia([60, 135, 45], 0.1);
          if (fu === 0 || fu === 15) c = [35, 90, 30]; else if (fu % 5 === 2) c = [45, 110, 35]; else if (fu % 5 === 0) c = [85, 160, 60];
          px(x, y, c);
        });
        for (let k = 0; k < 6; k++) ponto(1 + Math.floor(r() * 14), Math.floor(r() * 16), [230, 225, 170]);
      },
      [T.cactoTopo]: () => cada((u, v, x, y) => { const d = Math.max(Math.abs(u - 8), Math.abs(v - 8)); px(x, y, d > 7 ? [35, 90, 30] : varia(d > 3.5 ? [70, 145, 50] : [95, 170, 70], 0.06)); }),
    };
    LAS.forEach(([, c], k) => {
      pinturas[T.la + k] = () => cada((u, v, x, y) => {
        const fu = Math.floor(u * (hd ? 2 : 1)), fv = Math.floor(v * (hd ? 2 : 1));
        const fio = ((fu + fv) % 4 === 0 || (fu - fv + 64) % 4 === 0) ? 0.9 : 1;
        px(x, y, varia(c.map(q => q * fio), 0.08));
      });
    });
    const minerio = cor => () => {
      pedra();
      for (let k = 0; k < 5; k++) {
        const u = 1 + Math.floor(r() * 13), v = 1 + Math.floor(r() * 13);
        ponto(u, v, cor); ponto(u + 1, v, cor.map(q => q * 0.85)); ponto(u, v + 1, cor.map(q => q * 0.8)); ponto(u + 1, v + 1, cor.map(q => Math.min(255, q * 1.15)));
      }
    };
    pinturas[T.ouro] = minerio([245, 205, 60]);
    pinturas[T.diamante] = minerio([95, 225, 225]);
    pinturas[T.carvao] = minerio([35, 35, 35]);
    const vazio = () => cada((u, v, x, y) => px(x, y, [0, 0, 0], 0));
    const flor = (petala, miolo) => () => {
      vazio();
      for (let v = 7; v < 16; v++) ponto(7, v, [60, 130, 40]);
      [[6, 11], [5, 10], [8, 12], [9, 11]].forEach(([u, v]) => ponto(u, v, [70, 150, 45]));
      [[0, -2], [-2, 0], [2, 0], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [-1, 0], [1, 0], [0, 1]].forEach(([du, dv]) => ponto(7 + du, 5 + dv, varia(petala, 0.1)));
      ponto(7, 5, miolo);
    };
    pinturas[T.florAmarela] = flor([245, 215, 40], [235, 140, 30]);
    pinturas[T.florVermelha] = flor([220, 40, 45], [60, 30, 20]);
    pinturas[T.gramaAlta] = () => {
      vazio();
      for (let k = 0; k < (hd ? 14 : 9); k++) {
        const u = 1 + r() * 14, alto = 6 + Math.floor(r() * 9), inc = r() < 0.5 ? -1 : 1;
        for (let y = 0; y < alto * K; y++) px(Math.floor(u * K) + (y > alto * K * 0.6 ? inc : 0), N - 1 - y, varia([80, 155, 50], 0.2));
      }
    };
    // Criaturas da noite (Sobrevivência): zumbi e gosma, e a tocha
    pinturas[T.zumbiPele] = () => encher([92, 160, 92], 0.1);
    pinturas[T.zumbiCara] = () => {
      encher([92, 160, 92], 0.08);
      [[3, 6], [10, 6]].forEach(([u, v]) => { ponto(u, v, [20, 30, 20]); ponto(u + 1, v, [20, 30, 20]); ponto(u, v + 1, [20, 30, 20]); ponto(u + 1, v + 1, [20, 30, 20]); });
      for (let u = 5; u < 11; u++) ponto(u, 11, [50, 90, 50]);
    };
    pinturas[T.zumbiRoupa] = () => encher([40, 150, 160], 0.1);
    pinturas[T.zumbiCalca] = () => encher([60, 60, 140], 0.1);
    pinturas[T.gosma] = () => cada((u, v, x, y) => { const borda = u < 1.5 || v < 1.5 || u > 14.5 || v > 14.5; px(x, y, varia(borda ? [60, 170, 70] : [110, 220, 110], 0.08), 230); });
    pinturas[T.gosmaCara] = () => {
      cada((u, v, x, y) => px(x, y, varia([110, 220, 110], 0.08), 230));
      [[4, 5], [10, 5]].forEach(([u, v]) => { ponto(u, v, [20, 40, 20]); ponto(u + 1, v, [20, 40, 20]); ponto(u, v + 1, [20, 40, 20]); ponto(u + 1, v + 1, [20, 40, 20]); });
      ponto(7, 10, [40, 90, 40]); ponto(8, 10, [40, 90, 40]);
    };
    pinturas[T.tocha] = () => {
      vazio();
      for (let v = 7; v < 16; v++) { ponto(7, v, [110, 80, 45]); ponto(8, v, [90, 64, 36]); }
      [[7, 6, [255, 200, 40]], [8, 6, [255, 160, 30]], [7, 5, [255, 230, 120]], [8, 5, [255, 120, 20]], [7, 4, [255, 250, 200]]].forEach(([u, v, c]) => ponto(u, v, c));
    };
    (pinturas[i] || (() => encher([255, 0, 255], 0)))();
    return buf;
  }

  // Atlas: N = 16 (clássico) ou 32 (HD). Cada espaço tem S pixels: a textura no meio e, no HD,
  // uma borda de N/2 repetindo a própria textura (para os mipmaps).
  function criarAtlas(N = 16) {
    const g = N > 16 ? N / 2 : 0, S = N + 2 * g;
    const cv = document.createElement("canvas");
    cv.width = cv.height = S * COLS;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(cv.width, cv.height);
    for (let i = 0; i < 45; i++) {
      const buf = pintarTextura(i, N, N > 16);
      const ox = (i % COLS) * S, oy = Math.floor(i / COLS) * S;
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const tx = ((x - g) % N + N) % N, ty = ((y - g) % N + N) % N;
        const a = (ty * N + tx) * 4, b = ((oy + y) * cv.width + ox + x) * 4;
        for (let j = 0; j < 4; j++) img.data[b + j] = buf[a + j];
      }
    }
    ctx.putImageData(img, 0, 0);
    cv.N = N; cv.S = S; cv.g = g;
    return cv;
  }

  // Coordenadas de textura de um canto (a, b ∈ {0, 1}; b = 1 é o alto da textura)
  function uv(atlas, t, a, b) {
    const { N, S, g } = atlas, L = S * COLS, E = 0.02;
    return [((t % COLS) * S + g + E + a * (N - 2 * E)) / L, (Math.floor(t / COLS) * S + g + E + (1 - b) * (N - 2 * E)) / L];
  }

  // Ícone do bloco em perspectiva (para a barra e a mochila), como imagem
  function icone(atlas, b, tam = 56) {
    const cv = document.createElement("canvas");
    cv.width = cv.height = tam;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = atlas.N > 16;
    const { N, S, g } = atlas;
    const tile = t => [(t % COLS) * S + g, Math.floor(t / COLS) * S + g];
    const face = (t, m, escurece) => {
      const [sx, sy] = tile(t);
      c.setTransform(...m);
      c.drawImage(atlas, sx, sy, N, N, 0, 0, N, N);
      if (escurece) { c.globalCompositeOperation = "source-atop"; c.fillStyle = `rgba(0,0,0,${escurece})`; c.fillRect(0, 0, N, N); c.globalCompositeOperation = "source-over"; }
    };
    if (BLOCOS[b].tipo === "cruz") {
      const [sx, sy] = tile(tex(b, 0));
      c.drawImage(atlas, sx, sy, N, N, tam * 0.1, tam * 0.1, tam * 0.8, tam * 0.8);
    } else {
      const k = tam / (2 * N);
      face(tex(b, 1), [k, k / 2, 0, k, 0, tam / 4], 0.18);
      face(tex(b, 1), [k, -k / 2, 0, k, tam / 2, tam / 2], 0.34);
      face(tex(b, 0), [k, -k / 2, k, k / 2, 0, tam / 4], 0);
    }
    return cv.toDataURL();
  }

  return { BLOCOS, ID, T, tex, opaco, solido, criarAtlas, uv, icone, aleatorio };
})();
