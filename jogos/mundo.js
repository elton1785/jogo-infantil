// Mundo de Blocos: construir e explorar um mundo 3D de blocos (WebGL puro, sem bibliotecas).
// Jogo original, inspirado nos jogos de blocos — sem nomes nem texturas de marca registrada.
// Dois jeitos:
// - 🧱 Clássico (como os antigos): mundo menor, texturas 16×16 pixeladas, luz "chapada",
//   sempre de dia, poucos tipos de bloco.
// - 🌳 Novo: texturas 32×32 em alta definição com mipmaps, sombrinha nos cantos (oclusão de
//   ambiente), biomas (planície, floresta, deserto, montanha com neve), flores, minérios,
//   dia e noite com sol e lua, nuvens e bichinhos (porcos e ovelhas) passeando.
// Controles no toque: joystick à esquerda; arrastar o dedo gira a visão; TOCAR num bloco coloca
// o bloco escolhido ali; SEGURAR num bloco quebra. Botões: pular, voar, mochila.
// No computador: clique para capturar o mouse, WASD, espaço, Shift, botão esquerdo quebra,
// direito coloca, 1–9 escolhe o bloco, F voa, E abre a mochila.
// - 🗡️ Sobrevivência: o mundo do Novo (com cavernas), mas começa com a mochila vazia: quebrar
//   recolhe o bloco, colocar gasta. 10 corações de vida (voltam aos poucos; queda alta machuca).
//   Blocos duros demoram mais (picareta e machado ajudam). Receitas: tábuas, ferramentas, tochas,
//   vidro e tijolos. À noite aparecem gosmas e zumbis (somem de dia; tochas impedem que apareçam
//   perto). Desmaiou? Volta para o começo sem perder nada. Nas cavernas escuras elas aparecem a
//   qualquer hora: leve tochas!
// 🔦 Luz (Novo e Sobrevivência): cada bloco tem dois níveis de luz de 0 a 15 — a luz do céu (desce
//   pelas colunas abertas e se espalha para os lados perdendo 1 por bloco: a entrada da caverna
//   fica meia-luz e o fundo, escuro) e a luz das tochas (14, amarelada; ouro e diamante brilham
//   de leve). Folhas e água seguram um pouco da luz. Calculado uma vez ao abrir o mundo e, ao
//   colocar/quebrar, só a vizinhança é refeita (apaga e reacende por "inundação", como nos jogos
//   de blocos). No desenho a luz do céu é multiplicada pela luz do dia e a da tocha não (por isso a
//   noite fica escura e perto da tocha fica quente e clarinho). Sempre sobra uma luz mínima, para a
//   criança enxergar um pouco. Tocha escolhida na barra ilumina em volta do jogador.
// O mundo fica salvo no aparelho (cada modo tem o seu).
(() => {
  const M = MundoTexturas, B = M.ID;
  const MODOS = {
    classico: {
      nome: "Clássico", X: 64, Z: 64, Y: 40, agua: 17, res: 16, hd: false, ao: false, diaNoite: false, bichos: false, nevoa: 0.026,
      paleta: [B.grama, B.terra, B.pedra, B.pedregulho, B.tabuas, B.tronco, B.folhas, B.areia, B.cascalho, B.vidro, B.tijolo,
        B.la, B.la + 1, B.la + 2, B.la + 3, B.la + 4, B.la + 8, B.ouro, B.florAmarela, B.florVermelha],
    },
    novo: {
      nome: "Novo", X: 96, Z: 96, Y: 48, agua: 20, res: 32, hd: true, ao: true, diaNoite: true, bichos: true, nevoa: 0.019, cavernas: true, luz: true,
      paleta: [B.grama, B.terra, B.pedra, B.pedregulho, B.tabuas, B.tronco, B.folhas, B.areia, B.cascalho, B.vidro, B.tijolo, B.neve,
        ...Array.from({ length: 9 }, (_, i) => B.la + i), B.ouro, B.diamante, B.carvao, B.agua, B.cacto, B.florAmarela, B.florVermelha, B.gramaAlta, B.tocha],
    },
  };
  MODOS.sobrevivencia = { ...MODOS.novo, nome: "Sobrevivência", sobrevivencia: true };
  // Sobrevivência: quanto tempo (s) para quebrar cada bloco com a mão; a ferramenta certa ajuda
  const DUREZA = {};
  [B.terra, B.grama, B.areia, B.cascalho, B.neve, B.folhas].forEach(b => { DUREZA[b] = 0.5; });
  for (let i = 0; i < 9; i++) DUREZA[B.la + i] = 0.45;
  [B.florAmarela, B.florVermelha, B.gramaAlta, B.tocha].forEach(b => { DUREZA[b] = 0.12; });
  DUREZA[B.vidro] = 0.35; DUREZA[B.cacto] = 0.4;
  [B.tronco, B.tabuas].forEach(b => { DUREZA[b] = 1.1; });
  [B.pedra, B.pedregulho, B.tijolo, B.carvao].forEach(b => { DUREZA[b] = 1.7; });
  [B.ouro, B.diamante].forEach(b => { DUREZA[b] = 2.4; });
  const MADEIRA = new Set([B.tronco, B.tabuas]), PEDRA = new Set([B.pedra, B.pedregulho, B.tijolo, B.carvao, B.ouro, B.diamante]);
  // O que cai ao quebrar (o resto cai ele mesmo)
  const CAI = { [B.grama]: B.terra, [B.pedra]: B.pedregulho, [B.gramaAlta]: 0 };
  // Receitas: o que precisa → o que dá. Ferramentas ficam guardadas (não são blocos).
  const RECEITAS = [
    { nome: "4 Tábuas", icone: "🪵", precisa: { [B.tronco]: 1 }, da: { [B.tabuas]: 4 } },
    { nome: "4 Tochas", icone: "🔥", precisa: { [B.carvao]: 1, [B.tabuas]: 1 }, da: { [B.tocha]: 4 }, dica: "iluminam a noite e as cavernas" },
    { nome: "Machado", icone: "🪓", precisa: { [B.tabuas]: 3 }, ferramenta: "machado", dica: "quebra madeira rapidinho" },
    { nome: "Picareta", icone: "⛏️", precisa: { [B.pedregulho]: 3, [B.tabuas]: 2 }, ferramenta: "picareta", dica: "quebra pedra rapidinho" },
    { nome: "Espada", icone: "🗡️", precisa: { [B.pedregulho]: 2, [B.tabuas]: 1 }, ferramenta: "espada", dica: "afasta as criaturas mais rápido" },
    { nome: "Vidro", icone: "🪟", precisa: { [B.areia]: 2 }, da: { [B.vidro]: 1 } },
    { nome: "2 Tijolos", icone: "🧱", precisa: { [B.terra]: 2 }, da: { [B.tijolo]: 2 } },
  ];
  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4 58 18 32 32 6 18Z" fill="#6cbf3f"/><path d="M6 18 32 32v28L6 46Z" fill="#8a5f3c"/><path d="M58 18 32 32v28l26-14Z" fill="#6e4a2e"/><path d="M6 18 32 32 58 18v6l-4 2v-2l-4 2v3l-4 2v-3l-5 3v2l-4 2-5-3v3l-4-2v-3l-5-3v2l-4-2v-3l-4-2v3l-3-2Z" fill="#5aa836"/><path d="M32 4 58 18 32 32 6 18Z" fill="none" stroke="#3d7a24" stroke-width="1.5"/><g fill="#7ad04a"><rect x="20" y="13" width="4" height="2"/><rect x="36" y="20" width="4" height="2"/><rect x="30" y="9" width="3" height="2"/></g><g fill="#5c3d22"><rect x="12" y="34" width="4" height="3"/><rect x="20" y="44" width="3" height="3"/><rect x="42" y="40" width="4" height="3"/><rect x="48" y="30" width="3" height="3"/></g></svg>';

  JOGOS.push({
    id: "mundo", teclas: true,
    nome: "Mundo de Blocos",
    icone: ICONE,
    faixas: ["6-8", "8-10"],
    iniciar(area) {
      Motor.escolherModo(area, [
        { icone: "🧱", rotulo: "Clássico (antigo)", iniciar: () => jogo(area, "classico") },
        { icone: "🌳", rotulo: "Novo (alta definição)", iniciar: () => jogo(area, "novo") },
        { icone: "🗡️", rotulo: "Sobrevivência", iniciar: () => jogo(area, "sobrevivencia") },
      ]);
    },
  });

  // ---------- Matrizes (colunas, como o WebGL) ----------
  const mat = {
    mult(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
    persp(fov, asp, n, f) { const t = 1 / Math.tan(fov / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); },
    rotX(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); },
    rotY(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); },
    trans(x, y, z) { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); },
  };

  // ---------- Ruído (para o terreno) ----------
  function criarRuido(seed) {
    const h = (x, z) => { let n = Math.imul(x, 374761393) + Math.imul(z, 668265263) + Math.imul(seed, 982451653); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
    const suave = t => t * t * (3 - 2 * t);
    const ruido = (x, z) => {
      const x0 = Math.floor(x), z0 = Math.floor(z), fx = suave(x - x0), fz = suave(z - z0);
      const a = h(x0, z0), b = h(x0 + 1, z0), c = h(x0, z0 + 1), d = h(x0 + 1, z0 + 1);
      return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
    };
    const fbm = (x, z, oit = 4) => { let s = 0, amp = 1, tot = 0; for (let i = 0; i < oit; i++) { s += ruido(x, z) * amp; tot += amp; amp *= 0.5; x *= 2; z *= 2; } return s / tot; };
    return { ruido, fbm, h };
  }

  // ---------- Geração do mundo ----------
  function gerar(cfg, seed) {
    const { X, Y, Z, agua } = cfg;
    const w = new Uint8Array(X * Y * Z);
    const I = (x, y, z) => (y * Z + z) * X + x;
    const R = criarRuido(seed), rnd = M.aleatorio(seed);
    const bioma = [], alt = [];
    for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
      let h, bi = "planicie";
      if (!cfg.hd) h = Math.round(agua + 1 + (R.fbm(x / 34, z / 34) - 0.45) * 16);
      else {
        const b = R.fbm(x / 80 + 50, z / 80 + 50, 2), mont = R.fbm(x / 55 + 9, z / 55 + 3, 3);
        h = agua + 1 + (R.fbm(x / 40, z / 40) - 0.45) * 14;
        if (mont > 0.58) { h += (mont - 0.58) * 70; bi = "montanha"; }
        else if (b < 0.38) bi = "deserto";
        else if (b > 0.6) bi = "floresta";
        h = Math.round(h);
      }
      h = Math.max(3, Math.min(Y - 8, h));
      alt.push(h); bioma.push(bi);
      for (let y = 0; y <= Math.max(h, agua); y++) {
        let b = 0;
        if (y === 0) b = B.rochaMae;
        else if (y < h - 3) {
          b = B.pedra;
          const r = rnd();
          if (r < 0.012) b = B.carvao;
          else if (cfg.hd && y < agua - 6 && r < 0.016) b = B.ouro;
          else if (cfg.hd && y < 8 && r < 0.019) b = B.diamante;
        } else if (y < h) b = bi === "deserto" || h <= agua + 1 ? B.areia : bi === "montanha" && h > agua + 14 ? B.pedra : B.terra;
        else if (y === h) {
          if (h < agua) b = rnd() < 0.3 ? B.cascalho : B.areia;
          else if (bi === "deserto" || h <= agua + 1) b = B.areia;
          else if (bi === "montanha" && h > agua + 18) b = B.neve;
          else if (bi === "montanha" && h > agua + 13) b = rnd() < 0.5 ? B.pedra : B.pedregulho;
          else b = B.grama;
        } else if (y <= agua) b = B.agua;
        w[I(x, y, z)] = b;
      }
    }
    // Cavernas: "minhocas" que escavam túneis no subsolo (algumas começam perto da superfície)
    if (cfg.cavernas) {
      const ehAgua = (x, y, z) => y < Y && w[I(x, y, z)] === B.agua;
      for (let k = 0; k < Math.round(X * Z / 380); k++) {
        let x = 4 + rnd() * (X - 8), z = 4 + rnd() * (Z - 8);
        const h = alt[Math.floor(z) * X + Math.floor(x)];
        let y = k % 4 === 0 ? h - 1 : 4 + rnd() * Math.max(2, h - 8);
        let yaw = rnd() * 6.28, pitch = (rnd() - 0.5) * 0.6;
        const passos = 50 + Math.floor(rnd() * 70);
        for (let p = 0; p < passos; p++) {
          const r = 1.2 + rnd() * 1.3;
          for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy + dz * dz > r * r) continue;
            const cx = Math.floor(x + dx), cy = Math.floor(y + dy), cz = Math.floor(z + dz);
            if (cx < 1 || cz < 1 || cx >= X - 1 || cz >= Z - 1 || cy < 2 || cy >= Y - 1) continue;
            if (ehAgua(cx, cy + 1, cz) || ehAgua(cx + 1, cy, cz) || ehAgua(cx - 1, cy, cz) || ehAgua(cx, cy, cz + 1) || ehAgua(cx, cy, cz - 1)) continue;
            const b = w[I(cx, cy, cz)];
            if (b && b !== B.rochaMae && b !== B.agua) w[I(cx, cy, cz)] = 0;
          }
          yaw += (rnd() - 0.5) * 0.8; pitch = Math.max(-0.6, Math.min(0.6, pitch + (rnd() - 0.5) * 0.4));
          x += Math.cos(yaw) * Math.cos(pitch); z += Math.sin(yaw) * Math.cos(pitch); y += Math.sin(pitch) * 0.8;
          if (y < 3) pitch = 0.3;
        }
      }
    }
    const no = (x, z) => x >= 2 && z >= 2 && x < X - 2 && z < Z - 2;
    const por = (x, y, z, b) => { if (x >= 0 && z >= 0 && x < X && z < Z && y < Y && !w[I(x, y, z)]) w[I(x, y, z)] = b; };
    // Árvores, cactos, flores e grama alta
    for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
      const h = alt[z * X + x], bi = bioma[z * X + x], topo = w[I(x, h, z)];
      if (w[I(x, h + 1, z)]) continue;
      if (topo === B.grama && no(x, z)) {
        const chance = !cfg.hd ? 0.012 : bi === "floresta" ? 0.05 : bi === "montanha" ? 0.008 : 0.006;
        const r = rnd();
        if (r < chance) {
          const tronco = 4 + Math.floor(rnd() * 3);
          for (let k = 1; k <= tronco; k++) w[I(x, h + k, z)] = B.tronco;
          for (let dy = tronco - 2; dy <= tronco + 1; dy++) {
            const raio = dy >= tronco ? 1 : 2;
            for (let dz = -raio; dz <= raio; dz++) for (let dx = -raio; dx <= raio; dx++) {
              if (Math.abs(dx) === raio && Math.abs(dz) === raio && (dy === tronco + 1 || rnd() < 0.5)) continue;
              por(x + dx, h + dy, z + dz, B.folhas);
            }
          }
        } else if (r < chance + (cfg.hd ? (bi === "planicie" ? 0.07 : 0.03) : 0)) por(x, h + 1, z, B.gramaAlta);
        else if (r < chance + (cfg.hd ? 0.09 : 0.012)) por(x, h + 1, z, rnd() < 0.5 ? B.florAmarela : B.florVermelha);
      } else if (topo === B.areia && bi === "deserto" && h > agua + 1 && no(x, z) && rnd() < 0.008) {
        const altura = 1 + Math.floor(rnd() * 3);
        for (let k = 1; k <= altura; k++) w[I(x, h + k, z)] = B.cacto;
      }
    }
    return w;
  }

  // ---------- Salvar (comprimido: repetições seguidas) ----------
  function comprimir(w) {
    const out = [];
    for (let i = 0; i < w.length;) { const v = w[i]; let n = 1; while (n < 255 && w[i + n] === v) n++; out.push(v, n); i += n; }
    let s = ""; for (let i = 0; i < out.length; i += 8192) s += String.fromCharCode.apply(null, out.slice(i, i + 8192));
    return btoa(s);
  }
  function descomprimir(txt, tam) {
    const s = atob(txt), w = new Uint8Array(tam);
    let p = 0; for (let i = 0; i < s.length; i += 2) { const v = s.charCodeAt(i), n = s.charCodeAt(i + 1); w.fill(v, p, p + n); p += n; }
    return w;
  }

  // ---------- O jogo ----------
  function jogo(area, modoId) {
    const cfg = MODOS[modoId];
    const { X, Y, Z } = cfg;
    const CHAVE = `mundo-${modoId}`;
    const sessao = Motor.sessaoAtual();

    // Tela
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "mundo-tela";
    const canvas = document.createElement("canvas");
    canvas.className = "mundo-canvas";
    tela.appendChild(canvas);
    area.appendChild(tela);
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);

    const gl = canvas.getContext("webgl", { antialias: cfg.hd, alpha: false, preserveDrawingBuffer: false });
    if (!gl) {
      tela.innerHTML = '<div class="aviso">Este aparelho não consegue mostrar o mundo em 3D. 😢</div>';
      return;
    }

    // Shaders: textura × luz da face (e sombrinha) × luz, com névoa. uCor (alfa > 0) desenha cor lisa.
    // aN = (luz do céu, luz da tocha) de 0 a 1 (nível/15). A do céu é multiplicada pela luz do dia
    // (uLuz); a da tocha não, e é amarelada e pisca de leve (uPisca). uMao: tocha na mão (posição e
    // nível). uMin: luz mínima (para nunca ficar preto total). uHalo: desenha um brilho redondo.
    const vs = `attribute vec3 aP; attribute vec2 aT; attribute float aL; attribute vec2 aN;
      uniform mat4 uM; uniform vec3 uDesl; uniform float uLuz; uniform float uPisca; uniform vec4 uMao; uniform float uMin;
      varying vec2 vT; varying vec3 vC; varying float vD;
      void main() {
        vec3 w = aP + uDesl;
        vec4 p = uM * vec4(w, 1.0); gl_Position = p; vT = aT; vD = p.w;
        float ceu = pow(0.8, (1.0 - aN.x) * 15.0) * uLuz;
        float t = aN.y > 0.01 ? pow(0.86, (1.0 - aN.y) * 15.0) : 0.0;
        if (uMao.w > 0.0) { float m = uMao.w - distance(w, uMao.xyz); if (m > 0.0) t = max(t, pow(0.86, 15.0 - m)); }
        vec3 cor = max(vec3(ceu), t * uPisca * vec3(1.12, 0.9, 0.6));
        vC = max(cor, uMin * vec3(0.85, 0.92, 1.15)) * aL;
      }`;
    const fs = `precision mediump float;
      uniform sampler2D uTex; uniform vec3 uNevoa; uniform float uDens; uniform vec4 uCor; uniform float uAlfa; uniform float uHalo;
      varying vec2 vT; varying vec3 vC; varying float vD;
      void main() {
        float f = clamp(exp(-pow(vD * uDens, 2.0)), 0.0, 1.0);
        if (uHalo > 0.5) {
          float d = length(vT * 2.0 - 1.0), a = max(0.0, 1.0 - d);
          gl_FragColor = vec4(uCor.rgb * a * a * uCor.a * f, 1.0);
          return;
        }
        vec4 c = uCor.a > 0.0 ? uCor : texture2D(uTex, vT);
        if (c.a < 0.45) discard;
        gl_FragColor = vec4(mix(uNevoa, c.rgb * vC, f), c.a * uAlfa);
      }`;
    const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    const A = { P: gl.getAttribLocation(prog, "aP"), T: gl.getAttribLocation(prog, "aT"), L: gl.getAttribLocation(prog, "aL"), N: gl.getAttribLocation(prog, "aN") };
    const U = {}; ["uM", "uDesl", "uTex", "uLuz", "uNevoa", "uDens", "uCor", "uAlfa", "uPisca", "uMao", "uMin", "uHalo"].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
    [A.P, A.T, A.L, A.N].forEach(a => gl.enableVertexAttribArray(a));
    gl.uniform1f(U.uPisca, 1); gl.uniform4fv(U.uMao, [0, 0, 0, 0]); gl.uniform1f(U.uMin, 0); gl.uniform1f(U.uHalo, 0);

    // Atlas de texturas
    const atlas = M.criarAtlas(cfg.res);
    const texAtlas = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texAtlas);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (cfg.hd) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR); }
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.uniform1i(U.uTex, 0);
    const uv = (t, a, b) => M.uv(atlas, t, a, b);

    // ---------- Estado salvo ----------
    let salvo = null;
    try { salvo = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { /* sem armazenamento */ }
    let seed = (salvo && salvo.seed) || Math.floor(Math.random() * 1e9);
    let mundo = salvo && salvo.mundo ? descomprimir(salvo.mundo, X * Y * Z) : gerar(cfg, seed);
    const I = (x, y, z) => (y * Z + z) * X + x;
    const pegar = (x, y, z) => (x < 0 || z < 0 || x >= X || z >= Z || y >= Y ? 0 : y < 0 ? B.rochaMae : mundo[I(x, y, z)]);
    const sobrev = !!cfg.sobrevivencia;
    // Sobrevivência: quantidade de cada bloco (inv[id]) e ferramentas (inv.picareta...)
    const inv = (sobrev && salvo && salvo.inv) || {};
    let vida = (sobrev && salvo && salvo.vida) || 20, ultimoDano = -99, derrotadas = (salvo && salvo.derrotadas) || 0;
    let hotbar = (salvo && salvo.hotbar) || (sobrev ? Array(9).fill(0) : cfg.paleta.slice(0, 9));
    const temBloco = b => !sobrev || (inv[b] || 0) > 0;
    function ganhar(b, n = 1) {
      if (!b) return;
      const novo = !inv[b];
      inv[b] = (inv[b] || 0) + n;
      if (novo && !hotbar.includes(b)) { const vago = hotbar.indexOf(0); if (vago >= 0) hotbar[vago] = b; }
      mudou = true;
    }
    let escolhido = 0, tempoDia = (salvo && salvo.tempoDia) || (sobrev ? 0.22 : 0.3), mudou = false;

    // ---------- Malhas por pedaço (16 × 16 colunas) ----------
    const CH = 16, NCX = X / CH, NCZ = Z / CH;
    const pedacos = Array.from({ length: NCX * NCZ }, () => ({ opaco: gl.createBuffer(), agua: gl.createBuffer(), nO: 0, nA: 0, sujo: true }));
    // Faces: normal, origem, eixo u (horizontal da textura), eixo v (para cima na textura), luz, lado da textura
    const FACES = [
      { n: [0, 1, 0], o: [0, 1, 1], u: [1, 0, 0], v: [0, 0, -1], luz: 1, lado: 0 },
      { n: [0, -1, 0], o: [0, 0, 0], u: [1, 0, 0], v: [0, 0, 1], luz: 0.5, lado: 2 },
      { n: [1, 0, 0], o: [1, 0, 1], u: [0, 0, -1], v: [0, 1, 0], luz: 0.8, lado: 1 },
      { n: [-1, 0, 0], o: [0, 0, 0], u: [0, 0, 1], v: [0, 1, 0], luz: 0.8, lado: 1 },
      { n: [0, 0, 1], o: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], luz: 0.64, lado: 1 },
      { n: [0, 0, -1], o: [1, 0, 0], u: [-1, 0, 0], v: [0, 1, 0], luz: 0.64, lado: 1 },
    ];
    const AO = [0.48, 0.64, 0.8, 1];
    const fazOcl = (x, y, z) => (M.opaco(pegar(x, y, z)) ? 1 : 0);

    function construir(cx, cz) {
      const p = pedacos[cz * NCX + cx];
      const op = [], ag = [];
      const vert = (arr, x, y, z, t, a, b, l, lc, lb) => { const [s, q] = uv(t, a, b); arr.push(x, y, z, s, q, l, lc, lb); };
      // Luz suave num canto: média das (até 4) casas transparentes que encostam nele
      const luzCanto = (x, y, z, ok) => {
        if (!ok) return null;
        if (y >= Y) return 15 * 16;
        if (x < 0 || z < 0 || x >= X || z >= Z || y < 0) return null;
        const i = I(x, y, z); return luzCeu[i] * 16 + luzBloco[i];
      };
      for (let y = 0; y < Y; y++) for (let z = cz * CH; z < cz * CH + CH; z++) for (let x = cx * CH; x < cx * CH + CH; x++) {
        const b = mundo[I(x, y, z)];
        if (!b) continue;
        const def = M.BLOCOS[b];
        if (def.tipo === "cruz") {
          const t = M.tex(b, 0), e = 0.15;
          // a tocha brilha sozinha (chama acesa mesmo à noite)
          const tocha = comLuz && b === B.tocha;
          const lc = comLuz ? luzCeu[I(x, y, z)] / 15 : 1, lb = tocha ? 1 : comLuz ? luzBloco[I(x, y, z)] / 15 : 0;
          [[[e, e], [1 - e, 1 - e]], [[e, 1 - e], [1 - e, e]]].forEach(([[x0, z0], [x1, z1]]) => {
            const c = [[x0, z0, 0, 0], [x1, z1, 1, 0], [x1, z1, 1, 1], [x0, z0, 0, 1]].map(([px, pz, a, bb]) => [x + px, y + bb * 0.95, z + pz, a, bb]);
            [0, 1, 2, 0, 2, 3].forEach(k => vert(op, c[k][0], c[k][1], c[k][2], t, c[k][3], c[k][4], tocha ? 1.3 : 0.95, lc, lb));
          });
          continue;
        }
        const brilho = comLuz ? EMITE[b] : 0;
        const ehAgua = def.tipo === "agua";
        const arr = ehAgua ? ag : op;
        const aguaAcima = ehAgua && pegar(x, y + 1, z) === B.agua;
        FACES.forEach(F => {
          const nb = pegar(x + F.n[0], y + F.n[1], z + F.n[2]);
          if (ehAgua) { if (nb === B.agua || M.opaco(nb)) return; }
          else if (M.opaco(nb) || (nb === b && def.tipo)) return;
          const t = M.tex(b, F.lado);
          const cantos = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([a, bb]) => {
            let px = x + F.o[0] + a * F.u[0] + bb * F.v[0], py = y + F.o[1] + a * F.u[1] + bb * F.v[1], pz = z + F.o[2] + a * F.u[2] + bb * F.v[2];
            if (ehAgua && !aguaAcima && py > y + 0.5) py -= 0.12; // a superfície da água fica um pouco abaixo
            let l = F.luz, lc = 1, lb = 0;
            if (cfg.ao) {
              const nx = x + F.n[0], ny = y + F.n[1], nz = z + F.n[2];
              const du = F.u.map(c => (a ? c : -c)), dv = F.v.map(c => (bb ? c : -c));
              const s1 = fazOcl(nx + du[0], ny + du[1], nz + du[2]), s2 = fazOcl(nx + dv[0], ny + dv[1], nz + dv[2]);
              const cc = fazOcl(nx + du[0] + dv[0], ny + du[1] + dv[1], nz + du[2] + dv[2]);
              if (!ehAgua) l *= AO[s1 && s2 ? 0 : 3 - (s1 + s2 + cc)];
              if (comLuz) {
                let sc = 0, sb = 0, n = 0;
                [luzCanto(nx, ny, nz, true), luzCanto(nx + du[0], ny + du[1], nz + du[2], !s1), luzCanto(nx + dv[0], ny + dv[1], nz + dv[2], !s2),
                  luzCanto(nx + du[0] + dv[0], ny + du[1] + dv[1], nz + du[2] + dv[2], !cc && !(s1 && s2))].forEach(v => { if (v !== null) { sc += v >> 4; sb += v & 15; n++; } });
                if (n) { lc = sc / n / 15; lb = sb / n / 15; }
                if (brilho) lb = Math.max(lb, brilho / 15); // ouro e diamante brilham de leve
              }
            }
            return [px, py, pz, a, bb, l, lc, lb];
          });
          // Diagonal do quadrado escolhida para a sombra ficar suave
          const tom = c => c[5] * (0.3 + c[6] + c[7]);
          const ordem = tom(cantos[0]) + tom(cantos[2]) < tom(cantos[1]) + tom(cantos[3]) ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
          ordem.forEach(k => vert(arr, cantos[k][0], cantos[k][1], cantos[k][2], t, cantos[k][3], cantos[k][4], cantos[k][5], cantos[k][6], cantos[k][7]));
        });
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, p.opaco); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(op), gl.STATIC_DRAW); p.nO = op.length / 8;
      gl.bindBuffer(gl.ARRAY_BUFFER, p.agua); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ag), gl.STATIC_DRAW); p.nA = ag.length / 8;
      p.sujo = false;
    }
    const sujar = (x, z) => {
      const marca = (a, b) => { if (a >= 0 && b >= 0 && a < X && b < Z) pedacos[Math.floor(b / CH) * NCX + Math.floor(a / CH)].sujo = true; };
      marca(x, z); marca(x - 1, z); marca(x + 1, z); marca(x, z - 1); marca(x, z + 1);
      if (cfg.ao) { marca(x - 1, z - 1); marca(x + 1, z + 1); marca(x - 1, z + 1); marca(x + 1, z - 1); }
    };

    // ---------- Luz (Novo e Sobrevivência): níveis 0–15 do céu e das tochas ----------
    const comLuz = !!cfg.luz, XZ = X * Z;
    const luzCeu = new Uint8Array(comLuz ? X * Y * Z : 0), luzBloco = new Uint8Array(comLuz ? X * Y * Z : 0);
    const EMITE = new Uint8Array(256); EMITE[B.tocha] = 14; EMITE[B.ouro] = 5; EMITE[B.diamante] = 6;
    // Quanto cada bloco segura de luz (além de 1 por passo); 15 = não deixa passar (blocos opacos)
    const ABSORVE = new Uint8Array(256);
    M.BLOCOS.forEach((d, b) => { if (b) ABSORVE[b] = M.opaco(b) ? 15 : d.tipo === "folha" ? 1 : d.tipo === "agua" ? 2 : 0; });
    // Filas circulares: FILA (índices a espalhar) e REM (índice*16 + nível a apagar)
    const MASC = (1 << 20) - 1, FILA = new Int32Array(comLuz ? MASC + 1 : 0), REM = new Int32Array(comLuz ? MASC + 1 : 0);
    let fi = 0, ff = 0, ri = 0, rf = 0, mnX = 0, mxX = 0, mnZ = 0, mxZ = 0;
    const tocou = i => { const x = i % X, z = ((i / X) | 0) % Z; if (x < mnX) mnX = x; if (x > mxX) mxX = x; if (z < mnZ) mnZ = z; if (z > mxZ) mxZ = z; };
    // Vizinho de i na direção d (0 +x, 1 -x, 2 +z, 3 -z, 4 cima, 5 baixo), ou -1 fora do mundo
    const viz = (i, d) => {
      switch (d) {
        case 0: return i % X < X - 1 ? i + 1 : -1;
        case 1: return i % X > 0 ? i - 1 : -1;
        case 2: return ((i / X) | 0) % Z < Z - 1 ? i + X : -1;
        case 3: return ((i / X) | 0) % Z > 0 ? i - X : -1;
        case 4: return i + XZ < X * Y * Z ? i + XZ : -1;
        default: return i >= XZ ? i - XZ : -1;
      }
    };
    // Espalha a luz pela fila (só aumenta níveis). No céu, descer a partir do 15 não perde nada.
    function espalhar(L, ceu, marcar) {
      while (fi !== ff) {
        const i = FILA[fi]; fi = (fi + 1) & MASC;
        const lv = L[i];
        if (lv <= 1) continue;
        for (let d = 0; d < 6; d++) {
          const j = viz(i, d);
          if (j < 0) continue;
          const a = ABSORVE[mundo[j]];
          if (a >= 15) continue;
          const nv = lv - a - (ceu && d === 5 && lv === 15 ? 0 : 1);
          if (nv > L[j]) { L[j] = nv; FILA[ff] = j; ff = (ff + 1) & MASC; if (marcar) tocou(j); }
        }
      }
    }
    // Apaga a luz que vinha de um lugar (fila REM) e devolve à FILA as bordas que ainda têm luz própria
    function apagar(L, ceu) {
      while (ri !== rf) {
        const e = REM[ri]; ri = (ri + 1) & MASC;
        const i = e >> 4, lv = e & 15;
        for (let d = 0; d < 6; d++) {
          const j = viz(i, d);
          if (j < 0) continue;
          const ln = L[j];
          if (!ln) continue;
          if (ln < lv || (ceu && d === 5 && lv === 15)) {
            const em = ceu ? 0 : EMITE[mundo[j]];
            L[j] = em; tocou(j);
            REM[rf] = (j << 4) | ln; rf = (rf + 1) & MASC;
            if (em) { FILA[ff] = j; ff = (ff + 1) & MASC; }
          } else { FILA[ff] = j; ff = (ff + 1) & MASC; }
        }
      }
    }
    // Calcula a luz do mundo inteiro (ao abrir ou criar um mundo)
    function calcularLuz() {
      if (!comLuz) return;
      const t0 = performance.now();
      luzCeu.fill(0); luzBloco.fill(0);
      fi = ff = 0;
      // 1) desce pelas colunas
      for (let c = 0; c < XZ; c++) {
        let l = 15;
        for (let y = Y - 1; y >= 0; y--) {
          const i = y * XZ + c, a = ABSORVE[mundo[i]];
          l = (l === 15 ? 15 : l - 1) - a;
          if (l <= 0) break;
          luzCeu[i] = l;
        }
      }
      // 2) começa a espalhar só das bordas iluminadas que têm vizinho mais escuro
      for (let i = 0; i < luzCeu.length; i++) {
        const l = luzCeu[i];
        if (l < 2) continue;
        for (let d = 0; d < 6; d++) {
          if (d === 4) continue;
          const j = viz(i, d);
          if (j >= 0 && ABSORVE[mundo[j]] < 15 && luzCeu[j] < l - 1) { FILA[ff] = i; ff = (ff + 1) & MASC; break; }
        }
      }
      espalhar(luzCeu, true, false);
      // 3) tochas e minérios que brilham
      fi = ff = 0;
      for (let i = 0; i < mundo.length; i++) { const em = EMITE[mundo[i]]; if (em) { luzBloco[i] = em; FILA[ff] = i; ff = (ff + 1) & MASC; } }
      espalhar(luzBloco, false, false);
      tempoLuz = Math.round(performance.now() - t0);
    }
    let tempoLuz = 0;
    // Um bloco mudou em (x, y, z): refaz só a luz da vizinhança e marca os pedaços tocados
    function luzMudou(x, y, z) {
      if (!comLuz) return;
      const i = I(x, y, z);
      mnX = mxX = x; mnZ = mxZ = z;
      [[luzCeu, true], [luzBloco, false]].forEach(([L, ceu]) => {
        fi = ff = ri = rf = 0;
        const velho = L[i];
        if (velho) { L[i] = 0; REM[rf++] = (i << 4) | velho; }
        apagar(L, ceu);
        const em = ceu ? 0 : EMITE[mundo[i]];
        if (em > L[i]) { L[i] = em; FILA[ff] = i; ff = (ff + 1) & MASC; }
        for (let d = 0; d < 6; d++) { const j = viz(i, d); if (j >= 0 && L[j]) { FILA[ff] = j; ff = (ff + 1) & MASC; } }
        // no alto do mundo, o céu está logo acima
        if (ceu && y === Y - 1 && ABSORVE[mundo[i]] < 15) { L[i] = 15 - ABSORVE[mundo[i]]; FILA[ff] = i; ff = (ff + 1) & MASC; }
        espalhar(L, ceu, true);
      });
      // pedaços onde a luz mudou (com 1 bloco de folga, porque os cantos olham os vizinhos)
      for (let cz = Math.max(0, Math.floor((mnZ - 1) / CH)); cz <= Math.min(NCZ - 1, Math.floor((mxZ + 1) / CH)); cz++)
        for (let cx = Math.max(0, Math.floor((mnX - 1) / CH)); cx <= Math.min(NCX - 1, Math.floor((mxX + 1) / CH)); cx++) pedacos[cz * NCX + cx].sujo = true;
    }
    // Luz num ponto [céu, tocha] (0–15); fora do mundo, acima: céu aberto
    const luzEm = (x, y, z) => {
      if (!comLuz || y >= Y) return [15, 0];
      if (x < 0 || z < 0 || x >= X || z >= Z || y < 0) return [0, 0];
      const i = I(x, y, z); return [luzCeu[i], luzBloco[i]];
    };
    calcularLuz();

    // ---------- Jogador ----------
    const LARG = 0.3, ALT = 1.8, OLHO = 1.62;
    const jog = { x: X / 2 + 0.5, y: Y - 2, z: Z / 2 + 0.5, vx: 0, vy: 0, vz: 0, yaw: 0, pitch: -0.2, chao: false, voando: false };
    function alturaLivre(x, z) { for (let y = Y - 1; y > 0; y--) if (M.solido(pegar(x, y, z)) || pegar(x, y, z) === B.agua) return y + 1; return 1; }
    function nascer() {
      // Procura terra firme perto do meio
      for (let r = 0; r < 30; r++) for (let k = 0; k < 16; k++) {
        const x = Math.floor(X / 2 + Math.cos(k * 0.4) * r), z = Math.floor(Z / 2 + Math.sin(k * 0.4) * r);
        const h = alturaLivre(x, z);
        if (pegar(x, h - 1, z) !== B.agua) { Object.assign(jog, { x: x + 0.5, y: h, z: z + 0.5 }); return; }
      }
      jog.y = alturaLivre(Math.floor(jog.x), Math.floor(jog.z));
    }
    if (salvo && salvo.jog) Object.assign(jog, salvo.jog, { vx: 0, vy: 0, vz: 0 }); else nascer();

    const bate = (x, y, z, l = LARG, a = ALT) => {
      if (x - l < 0 || z - l < 0 || x + l > X || z + l > Z) return true;
      for (let by = Math.floor(y); by <= Math.floor(y + a - 0.001); by++)
        for (let bz = Math.floor(z - l); bz <= Math.floor(z + l - 0.001); bz++)
          for (let bx = Math.floor(x - l); bx <= Math.floor(x + l - 0.001); bx++)
            if (M.solido(pegar(bx, by, bz))) return true;
      return false;
    };
    const naAgua = () => pegar(Math.floor(jog.x), Math.floor(jog.y + 0.4), Math.floor(jog.z)) === B.agua;

    // ---------- Entrada ----------
    const ent = { jx: 0, jz: 0, px: 0, pz: 0, pular: false, descer: false, padPular: false, padDescer: false, teclas: new Set() };
    function fisica(dt) {
      const k = ent.teclas;
      let fx = ent.jx + ent.px + (k.has("d") ? 1 : 0) - (k.has("a") ? 1 : 0);
      let fz = ent.jz + ent.pz + (k.has("w") || k.has("arrowup") ? 1 : 0) - (k.has("s") || k.has("arrowdown") ? 1 : 0);
      // Controle remoto: ⬅️ ➡️ viram o corpo
      jog.yaw += ((k.has("arrowright") ? 1 : 0) - (k.has("arrowleft") ? 1 : 0)) * 2.2 * dt;
      const mag = Math.hypot(fx, fz); if (mag > 1) { fx /= mag; fz /= mag; }
      const agua = naAgua();
      const vel = jog.voando ? 9 : agua ? 2.6 : 4.4;
      const s = Math.sin(jog.yaw), c = Math.cos(jog.yaw);
      const alvoX = (s * fz + c * fx) * vel, alvoZ = (-c * fz + s * fx) * vel;
      const suav = Math.min(1, dt * (jog.chao || jog.voando ? 14 : 4));
      jog.vx += (alvoX - jog.vx) * suav; jog.vz += (alvoZ - jog.vz) * suav;
      const pular = ent.pular || ent.padPular || k.has(" "), descer = ent.descer || ent.padDescer || k.has("shift");
      if (jog.voando) jog.vy = (pular ? 7 : 0) - (descer ? 7 : 0);
      else if (agua) { jog.vy = Math.max(jog.vy - 9 * dt, -2.5); if (pular) jog.vy = 3.2; }
      else { jog.vy = Math.max(jog.vy - 28 * dt, -40); if (pular && jog.chao) jog.vy = 8.4; }
      // Move eixo por eixo, parando nos blocos
      const nx = jog.x + jog.vx * dt;
      if (!bate(nx, jog.y, jog.z)) jog.x = nx;
      else {
        // Pulo automático em degrau de 1 bloco (como nos celulares)
        if (jog.chao && !jog.voando && Math.abs(fx) + Math.abs(fz) > 0.3 && !bate(nx, jog.y + 1.05, jog.z) && !bate(jog.x, jog.y + 1.05, jog.z)) jog.vy = 8.4;
        jog.vx = 0;
      }
      const nz = jog.z + jog.vz * dt;
      if (!bate(jog.x, jog.y, nz)) jog.z = nz;
      else {
        if (jog.chao && !jog.voando && Math.abs(fx) + Math.abs(fz) > 0.3 && !bate(jog.x, jog.y + 1.05, nz) && !bate(jog.x, jog.y + 1.05, jog.z)) jog.vy = 8.4;
        jog.vz = 0;
      }
      const ny = jog.y + jog.vy * dt;
      const estavaNoChao = jog.chao;
      jog.chao = false;
      if (!bate(jog.x, ny, jog.z)) jog.y = ny;
      else { if (jog.vy < 0) { jog.chao = true; jog.y = Math.max(jog.y - 0.5, Math.floor(ny) + 1); } jog.vy = 0; }
      // Altura da queda: do ponto mais alto até tocar o chão (na água não machuca)
      if (estavaNoChao && !jog.chao) jog.alturaQueda = jog.y;
      if (!jog.chao) jog.alturaQueda = Math.max(jog.alturaQueda || jog.y, jog.y);
      if (agua || jog.voando) jog.alturaQueda = jog.y;
      if (jog.chao && !estavaNoChao && sobrev) { const q = (jog.alturaQueda || jog.y) - jog.y; if (q > 3.6) machucar(Math.round(q - 3), null); }
      if (jog.chao) jog.alturaQueda = jog.y;
      if (jog.voando && jog.y > Y + 6) jog.y = Y + 6;
      if (jog.y < -5) nascer(); // caiu para fora do mundo
    }

    // Direção do olhar e raio que sai do olho passando por um ponto da tela (-1..1)
    const olho = () => [jog.x, jog.y + OLHO, jog.z];
    const FOV = 1.2;
    function direcao(sx = 0, sy = 0) {
      const cp = Math.cos(jog.pitch), sp = Math.sin(jog.pitch), s = Math.sin(jog.yaw), c = Math.cos(jog.yaw);
      const f = [s * cp, sp, -c * cp], dir = [c, 0, s], cima = [-s * sp, cp, c * sp];
      const t = Math.tan(FOV / 2), asp = canvas.width / canvas.height;
      const d = f.map((v, i) => v + dir[i] * sx * t * asp + cima[i] * sy * t);
      const n = Math.hypot(...d); return d.map(v => v / n);
    }
    // Percorre os blocos ao longo do raio (DDA) até achar um bloco que dá para mexer
    function mirar(o, d, max = 7) {
      let x = Math.floor(o[0]), y = Math.floor(o[1]), z = Math.floor(o[2]);
      const passo = d.map(v => (v > 0 ? 1 : -1));
      const tD = d.map(v => Math.abs(1 / (v || 1e-9)));
      const tM = [0, 1, 2].map(i => ((d[i] > 0 ? Math.floor(o[i]) + 1 - o[i] : o[i] - Math.floor(o[i]))) * tD[i]);
      let normal = [0, 0, 0], t = 0;
      while (t <= max) {
        const b = pegar(x, y, z);
        if (b && b !== B.agua) return { x, y, z, n: normal, b, t };
        const i = tM[0] < tM[1] ? (tM[0] < tM[2] ? 0 : 2) : (tM[1] < tM[2] ? 1 : 2);
        t = tM[i]; tM[i] += tD[i];
        if (i === 0) x += passo[0]; else if (i === 1) y += passo[1]; else z += passo[2];
        normal = [0, 0, 0]; normal[i] = -passo[i];
      }
      return null;
    }

    // Tempo para quebrar o bloco (o Criativo quebra rapidinho; a Sobrevivência depende do bloco)
    function tempoQuebra(b) {
      if (!sobrev) return 0.38;
      let t = DUREZA[b] || 0.8;
      if (MADEIRA.has(b) && inv.machado) t *= 0.35;
      if (PEDRA.has(b) && inv.picareta) t *= 0.3;
      return t;
    }
    function quebrar(alvo) {
      if (!alvo || M.BLOCOS[alvo.b].fixo) { if (alvo) Motor.nota(120, { dur: 0.08, tipo: "square", vol: 0.05 }); return false; }
      if (sobrev) {
        // Recolhe o bloco (folhas, às vezes)
        const cai = alvo.b in CAI ? CAI[alvo.b] : alvo.b;
        if (alvo.b !== B.folhas || Math.random() < 0.35) ganhar(cai);
        const cima = pegar(alvo.x, alvo.y + 1, alvo.z);
        if (M.BLOCOS[cima]?.tipo === "cruz" && cima !== B.gramaAlta) ganhar(cima);
        desenharBarra();
      }
      tochas.delete(`${alvo.x},${alvo.y},${alvo.z}`); tochas.delete(`${alvo.x},${alvo.y + 1},${alvo.z}`);
      mundo[I(alvo.x, alvo.y, alvo.z)] = 0;
      const plantaEmCima = M.BLOCOS[pegar(alvo.x, alvo.y + 1, alvo.z)]?.tipo === "cruz";
      if (plantaEmCima) mundo[I(alvo.x, alvo.y + 1, alvo.z)] = 0;
      // Água em volta escorre para o buraco (um pouquinho)
      if ([[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]].some(([dx, dy, dz]) => pegar(alvo.x + dx, alvo.y + dy, alvo.z + dz) === B.agua)) mundo[I(alvo.x, alvo.y, alvo.z)] = B.agua;
      luzMudou(alvo.x, alvo.y, alvo.z);
      if (plantaEmCima) luzMudou(alvo.x, alvo.y + 1, alvo.z);
      sujar(alvo.x, alvo.z); mudou = true;
      Motor.ruido({ dur: 0.09, vol: 0.18, freq: alvo.b === B.vidro ? 2600 : 700 });
      return true;
    }
    function colocar(alvo) {
      if (!alvo) return false;
      const x = alvo.x + alvo.n[0], y = alvo.y + alvo.n[1], z = alvo.z + alvo.n[2];
      const b = hotbar[escolhido];
      if (!b || !temBloco(b)) { avisar(sobrev ? "Sua mochila não tem esse bloco. Quebre blocos para recolher!" : "Escolha um bloco"); return false; }
      if (x < 0 || z < 0 || x >= X || z >= Z || y < 1 || y >= Y) return false;
      const atual = pegar(x, y, z);
      if (atual && atual !== B.agua && M.BLOCOS[atual].tipo !== "cruz") return false;
      if (M.BLOCOS[b].tipo === "cruz" && !M.solido(pegar(x, y - 1, z))) return false;
      if (M.solido(b) && x + 1 > jog.x - LARG && x < jog.x + LARG && z + 1 > jog.z - LARG && z < jog.z + LARG && y + 1 > jog.y && y < jog.y + ALT) return false;
      if (bichos.some(a => x + 1 > a.x - 0.45 && x < a.x + 0.45 && z + 1 > a.z - 0.45 && z < a.z + 0.45 && y + 1 > a.y && y < a.y + 1)) return false;
      if (atual === B.tocha) tochas.delete(`${x},${y},${z}`);
      mundo[I(x, y, z)] = b;
      if (b === B.tocha) tochas.add(`${x},${y},${z}`);
      luzMudou(x, y, z);
      if (sobrev) { inv[b]--; desenharBarra(); }
      sujar(x, z); mudou = true;
      Motor.nota(220 + (b % 7) * 30, { dur: 0.07, tipo: "triangle", vol: 0.12 });
      return true;
    }
    // Tochas do mundo (criaturas não aparecem perto delas)
    const tochas = new Set();
    function lerTochas() {
      tochas.clear();
      for (let i = 0; i < mundo.length; i++) if (mundo[i] === B.tocha) { const x = i % X, z = Math.floor(i / X) % Z, y = Math.floor(i / (X * Z)); tochas.add(`${x},${y},${z}`); }
    }
    lerTochas();
    const pertoDeTocha = (x, y, z) => [...tochas].some(t => { const [a, b, c] = t.split(",").map(Number); return Math.abs(a - x) + Math.abs(c - z) < 10 && Math.abs(b - y) < 6; });

    // ---------- Vida (Sobrevivência) ----------
    function machucar(n, de) {
      if (!sobrev || vida <= 0) return;
      vida = Math.max(0, vida - n);
      ultimoDano = relogio;
      Motor.ruido({ dur: 0.15, vol: 0.25, freq: 300 });
      dano.classList.remove("ativo"); void dano.offsetWidth; dano.classList.add("ativo");
      if (de) { const a = Math.atan2(jog.z - de.z, jog.x - de.x); jog.vx = Math.cos(a) * 7; jog.vz = Math.sin(a) * 7; jog.vy = 5; }
      desenharVida();
      if (vida <= 0) desmaiar();
    }
    function desmaiar() {
      if (noite()) desmaiouNaNoite = true;
      const caixa = document.createElement("div");
      caixa.className = "mundo-mochila menu";
      caixa.innerHTML = `<div class="mundo-mochila-titulo">😵 Você desmaiou!</div><div class="mundo-desmaio">Não se preocupe: você volta para o começo com tudo o que tinha na mochila.</div>`;
      const b = Object.assign(document.createElement("button"), { className: "chip jogar", textContent: "🌅 Voltar" });
      b.addEventListener("click", () => { caixa.remove(); vida = 20; desenharVida(); nascer(); bichos.splice(0, bichos.length, ...bichos.filter(a => !a.hostil)); });
      caixa.appendChild(b);
      caixa.addEventListener("pointerdown", e => e.stopPropagation());
      hud.appendChild(caixa);
      Motor.falar("Ops, você desmaiou! Toque em voltar.");
    }

    // ---------- Bichinhos (só no Novo) e criaturas da noite (Sobrevivência) ----------
    const bichos = [];
    if (cfg.bichos) {
      const r = M.aleatorio(seed + 7);
      for (let k = 0; k < 8; k++) {
        const x = 4 + Math.floor(r() * (X - 8)), z = 4 + Math.floor(r() * (Z - 8)), h = alturaLivre(x, z);
        if (pegar(x, h - 1, z) !== B.grama) continue;
        bichos.push({ tipo: k % 2 ? "ovelha" : "porco", x: x + 0.5, y: h, z: z + 0.5, yaw: r() * 6.3, vy: 0, anda: 0, pausa: r() * 3, fase: 0, chao: false });
      }
    }
    const ALTURA = { porco: 1, ovelha: 1, zumbi: 1.9, gosma: 0.85 };
    const noite = () => Math.sin(tempoDia * Math.PI * 2) < -0.08;
    let proximaCriatura = 0;
    // Lugar escuro (caverna funda ou noite) e longe da luz das tochas?
    const ceuAqui = (x, y, z) => luzEm(x, y, z)[0];
    const escuroAli = (x, y, z) => !comLuz || luzEm(x, y, z)[1] < 6;
    const noSubsolo = () => comLuz && ceuAqui(Math.floor(jog.x), Math.floor(jog.y + 1), Math.floor(jog.z)) < 7;
    let avisouCaverna = false;
    function criaturasDaNoite(dt) {
      // Aparecem à noite (ou a qualquer hora nas cavernas escuras), longe da vista e longe das
      // tochas; com o sol batendo somem numa fumacinha
      const caverna = noSubsolo();
      if ((noite() || caverna) && relogio > proximaCriatura && bichos.filter(a => a.hostil).length < (caverna && !noite() ? 4 : 6)) {
        proximaCriatura = relogio + 3 + Math.random() * 4;
        const ang = Math.random() * 6.28, d = (caverna ? 8 : 11) + Math.random() * 10;
        const x = Math.floor(jog.x + Math.cos(ang) * d), z = Math.floor(jog.z + Math.sin(ang) * d);
        if (x > 1 && z > 1 && x < X - 2 && z < Z - 2) {
          let y = -1;
          if (caverna) {
            // procura um chão escuro perto da altura do jogador, com lugar para ficar em pé
            for (let k = 0; k < 14 && y < 0; k++) {
              const yy = Math.floor(jog.y) + (k % 2 ? -1 : 1) * Math.ceil(k / 2);
              if (yy > 1 && yy < Y - 2 && !M.solido(pegar(x, yy, z)) && !M.solido(pegar(x, yy + 1, z)) && pegar(x, yy, z) !== B.agua && M.solido(pegar(x, yy - 1, z)) && ceuAqui(x, yy, z) < 5) y = yy;
            }
          }
          if (y < 0 && noite()) y = alturaLivre(x, z);
          if (y > 0 && M.solido(pegar(x, y - 1, z)) && escuroAli(x, y, z) && !pertoDeTocha(x, y, z)) {
            const tipo = Math.random() < 0.6 ? "zumbi" : "gosma";
            bichos.push({ tipo, hostil: true, vida: tipo === "zumbi" ? 10 : 6, x: x + 0.5, y, z: z + 0.5, yaw: 0, vy: 0, anda: 0, pausa: 0, fase: 0, chao: false, pulo: 0, golpe: 0 });
          }
        }
      }
      // de dia, só as que estão no claro do céu vão embora (nas cavernas elas ficam)
      if (!noite()) for (let i = bichos.length - 1; i >= 0; i--) {
        const a = bichos[i];
        if (a.hostil && (!comLuz || ceuAqui(Math.floor(a.x), Math.floor(a.y + 0.5), Math.floor(a.z)) >= 8) && Math.random() < dt * 0.4) { fumaca(a); bichos.splice(i, 1); }
      }
      // primeira vez num lugar bem escuro: dica da tocha
      if (caverna && !avisouCaverna && luzEm(Math.floor(jog.x), Math.floor(jog.y + 1), Math.floor(jog.z))[1] < 4 && ceuAqui(Math.floor(jog.x), Math.floor(jog.y + 1), Math.floor(jog.z)) < 4) {
        avisouCaverna = true;
        Motor.falar("Está escuro aqui na caverna! Coloque tochas para iluminar. Escolha a tocha na barra e ela ilumina em volta de você.");
        avisar("🔦 Escuro! Coloque tochas");
      }
    }
    function fumaca(a) { Motor.ruido({ dur: 0.2, vol: 0.12, freq: 1800 }); }
    function atacar(a) {
      const forca = inv.espada ? 5 : 3;
      a.vida -= forca;
      const ang = Math.atan2(a.z - jog.z, a.x - jog.x);
      a.empurra = [Math.cos(ang) * 6, Math.sin(ang) * 6]; a.vy = 4;
      Motor.nota(180, { dur: 0.1, tipo: "square", vol: 0.1 });
      if (a.vida <= 0) {
        bichos.splice(bichos.indexOf(a), 1); fumaca(a); derrotadas++; mudou = true;
        avisar(a.tipo === "zumbi" ? "💨 O zumbi fugiu!" : "💨 A gosma sumiu!");
      }
    }
    function moverBichos(dt) {
      if (sobrev) criaturasDaNoite(dt);
      bichos.forEach(a => {
        if (a.hostil) {
          // vai na sua direção (se estiver perto); a gosma anda aos pulinhos
          const dx = jog.x - a.x, dz = jog.z - a.z, dist = Math.hypot(dx, dz);
          a.anda = dist < 18 ? 1 : 0; a.pausa = 0;
          if (dist < 18) a.yaw = Math.atan2(dx, -dz);
          if (a.tipo === "gosma" && a.chao && dist < 18 && relogio > a.pulo) { a.vy = 6.5; a.pulo = relogio + 1 + Math.random(); }
          if (dist < 0.95 && Math.abs(jog.y - a.y) < 1.6 && relogio > a.golpe) { a.golpe = relogio + 1.1; machucar(a.tipo === "zumbi" ? 3 : 2, a); }
        } else {
          if (a.pausa > 0) { a.pausa -= dt; if (a.pausa <= 0) { a.anda = 1 + Math.random() * 3; a.yaw += (Math.random() - 0.5) * 2.5; } }
          else { a.anda -= dt; if (a.anda <= 0) a.pausa = 1 + Math.random() * 4; }
        }
        if (a.empurra) {
          const [ex, ez] = a.empurra;
          if (!bate(a.x + ex * dt, a.y, a.z + ez * dt, 0.4, 0.95)) { a.x += ex * dt; a.z += ez * dt; }
          a.empurra = Math.hypot(ex, ez) > 0.5 ? [ex * 0.85, ez * 0.85] : null;
        }
        const v = a.anda > 0 ? (a.tipo === "zumbi" ? 1.7 : a.tipo === "gosma" ? (a.chao ? 0 : 2.4) : 1.3) : 0;
        const dx = Math.sin(a.yaw) * v * dt, dz = -Math.cos(a.yaw) * v * dt;
        const livre = (x, y, z) => !bate(x, y, z, 0.4, 0.95) && (a.hostil || pegar(Math.floor(x), Math.floor(y - 0.5), Math.floor(z)) !== B.agua);
        if (v) {
          if (livre(a.x + dx, a.y, a.z + dz)) { a.x += dx; a.z += dz; a.fase += dt * 9; }
          else if (a.chao && livre(a.x + dx, a.y + 1.05, a.z + dz)) a.vy = 6.5;
          else a.yaw += 1.6;
        }
        a.vy = Math.max(a.vy - 24 * dt, -20);
        const ny = a.y + a.vy * dt;
        a.chao = false;
        if (!bate(a.x, ny, a.z, 0.4, 0.95)) a.y = ny; else { if (a.vy < 0) a.chao = true; a.vy = 0; }
        if (a.y < 0) a.y = alturaLivre(Math.floor(a.x), Math.floor(a.z));
      });
    }
    // Monta os bichos com caixas (corpo, cabeça e 4 patas que balançam)
    const bufBichos = gl.createBuffer();
    function malhaBichos() {
      const out = [];
      const caixa = (a, cx, cy, cz, sx, sy, sz, texs, pivo, ang) => {
        const s = Math.sin(a.yaw), c = Math.cos(a.yaw);
        const ponto = (lx, ly, lz) => {
          if (pivo) { const dy = ly - pivo, ca = Math.cos(ang), sa = Math.sin(ang); const ny = dy * ca - lz * sa, nz = dy * sa + lz * ca; ly = pivo + ny; lz = nz; }
          lz += cz; lx += cx;
          return [a.x + lx * c - lz * s, a.y + ly, a.z + lx * s + lz * c];
        };
        FACES.forEach((F, fi) => {
          const t = texs[fi] ?? texs[1];
          const cs = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => {
            const l = [0, 1, 2].map(i => (F.o[i] + u * F.u[i] + v * F.v[i] - 0.5) * [sx, sy, sz][i]);
            return [...ponto(l[0], cy + l[1] + sy / 2, l[2]), u, v];
          });
          [0, 1, 2, 0, 2, 3].forEach(k => { const [p, q] = uv(t, cs[k][3], cs[k][4]); out.push(cs[k][0], cs[k][1], cs[k][2], p, q, F.luz, a.lc, a.lb); });
        });
      };
      bichos.forEach(a => {
        const T = M.T, balanca = Math.sin(a.fase) * 0.6;
        const [lc, lb] = luzEm(Math.floor(a.x), Math.floor(a.y + 0.5), Math.floor(a.z));
        a.lc = lc / 15; a.lb = lb / 15;
        if (a.tipo === "zumbi") {
          // corpo de gente, braços esticados para a frente
          [[-0.13, 1], [0.13, -1]].forEach(([lx, s]) => caixa(a, lx, 0, 0, 0.24, 0.75, 0.24, [T.zumbiCalca], 0.75, balanca * s));
          caixa(a, 0, 0.75, 0, 0.5, 0.7, 0.28, [T.zumbiRoupa]);
          caixa(a, 0, 1.45, 0, 0.45, 0.45, 0.45, [T.zumbiPele, T.zumbiPele, T.zumbiPele, T.zumbiPele, T.zumbiPele, T.zumbiCara]);
          [-0.36, 0.36].forEach(lx => caixa(a, lx, 1.12, -0.3, 0.2, 0.2, 0.62, [T.zumbiPele]));
          return;
        }
        if (a.tipo === "gosma") {
          const estica = a.chao ? 1 : 1.15;
          caixa(a, 0, 0, 0, 0.8 / Math.sqrt(estica), 0.8 * estica, 0.8 / Math.sqrt(estica), [T.gosma, T.gosma, T.gosma, T.gosma, T.gosma, T.gosmaCara]);
          return;
        }
        const porco = a.tipo === "porco", pele = porco ? M.T.porcoPele : M.T.la + 4, cara = porco ? M.T.porcoCara : M.T.ovelhaCara;
        const perna = porco ? M.T.porcoPele : M.T.ovelhaPele;
        caixa(a, 0, 0.35, 0, 0.6, 0.45, 0.9, [pele, pele, pele, pele, pele, pele], null, 0);
        caixa(a, 0, 0.5, -0.55, 0.45, 0.42, 0.38, [pele, pele, pele, pele, pele, cara], null, 0);
        [[-0.17, -0.3, 1], [0.17, -0.3, -1], [-0.17, 0.3, -1], [0.17, 0.3, 1]].forEach(([lx, lz, sinal]) =>
          caixa(a, lx, 0, lz, 0.18, 0.36, 0.18, [perna], 0.36, balanca * sinal));
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, bufBichos);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(out), gl.DYNAMIC_DRAW);
      return out.length / 8;
    }
    function bichoNoRaio(o, d, max) {
      let melhor = null;
      bichos.forEach(a => {
        const min = [a.x - 0.45, a.y, a.z - 0.45], mx = [a.x + 0.45, a.y + (ALTURA[a.tipo] || 1), a.z + 0.45];
        let t0 = 0, t1 = max;
        for (let i = 0; i < 3; i++) {
          const inv = 1 / (d[i] || 1e-9); let ta = (min[i] - o[i]) * inv, tb = (mx[i] - o[i]) * inv;
          if (ta > tb) [ta, tb] = [tb, ta];
          t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        }
        if (t0 <= t1 && (!melhor || t0 < melhor.t)) melhor = { a, t: t0 };
      });
      return melhor;
    }

    // ---------- Nuvens, sol e lua, contorno do bloco ----------
    const bufNuvens = gl.createBuffer(); let nNuvens = 0;
    {
      const R = criarRuido(seed + 3), v = [], CEL = 8, PER = 16;
      for (let i = -24; i < X / CEL + 24; i++) for (let j = -24; j < Z / CEL + 24; j++) {
        const pi = ((i % PER) + PER) % PER, pj = ((j % PER) + PER) % PER;
        if (R.h(pi, pj) < 0.72) continue;
        const x0 = i * CEL, z0 = j * CEL, x1 = x0 + CEL, z1 = z0 + CEL, y = Y + 14;
        [[x0, z0], [x1, z0], [x1, z1], [x0, z0], [x1, z1], [x0, z1]].forEach(([x, z]) => v.push(x, y, z, 0, 0, 1, 1, 0));
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, bufNuvens); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW); nNuvens = v.length / 8;
    }
    const bufExtra = gl.createBuffer();
    function desenharExtra(dados, modo, cor, alfa = 1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufExtra);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dados), gl.DYNAMIC_DRAW);
      atributos();
      gl.uniform4fv(U.uCor, cor); gl.uniform1f(U.uAlfa, alfa);
      gl.drawArrays(modo, 0, dados.length / 8);
      gl.uniform4fv(U.uCor, [0, 0, 0, 0]); gl.uniform1f(U.uAlfa, 1);
    }
    const atributos = () => {
      gl.vertexAttribPointer(A.P, 3, gl.FLOAT, false, 32, 0);
      gl.vertexAttribPointer(A.T, 2, gl.FLOAT, false, 32, 12);
      gl.vertexAttribPointer(A.L, 1, gl.FLOAT, false, 32, 20);
      gl.vertexAttribPointer(A.N, 2, gl.FLOAT, false, 32, 24);
    };
    function contorno(x, y, z) {
      const e = 0.003, a = [x - e, y - e, z - e], b = [x + 1 + e, y + 1 + e, z + 1 + e], v = [];
      const P = (i, j, k) => [[a[0], b[0]][i], [a[1], b[1]][j], [a[2], b[2]][k]];
      const ar = [[0, 0, 0, 1, 0, 0], [0, 1, 0, 1, 1, 0], [0, 0, 1, 1, 0, 1], [0, 1, 1, 1, 1, 1], [0, 0, 0, 0, 1, 0], [1, 0, 0, 1, 1, 0], [0, 0, 1, 0, 1, 1], [1, 0, 1, 1, 1, 1], [0, 0, 0, 0, 0, 1], [1, 0, 0, 1, 0, 1], [0, 1, 0, 0, 1, 1], [1, 1, 0, 1, 1, 1]];
      ar.forEach(([i, j, k, l, m, n]) => { v.push(...P(i, j, k), 0, 0, 1, 1, 0, ...P(l, m, n), 0, 0, 1, 1, 0); });
      return v;
    }

    // ---------- Desenho ----------
    let alvoTela = null; // bloco destacado (mira do mouse ou dedo segurando)
    const misturar = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
    function desenhar() {
      const dpr = Math.min(window.devicePixelRatio || 1, cfg.hd ? 2 : 1.25);
      const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      // Luz do dia (o Clássico é sempre de dia)
      const ang = tempoDia * Math.PI * 2, alto = Math.sin(ang);
      const luz = cfg.diaNoite ? Math.max(comLuz ? 0.2 : 0.28, Math.min(1, 0.35 + alto * 1.3)) : 1;
      const tarde = cfg.diaNoite ? Math.max(0, 1 - Math.abs(alto) * 4) : 0;
      let ceu = cfg.diaNoite ? misturar([0.05, 0.08, 0.18], [0.55, 0.78, 1], Math.max(0, Math.min(1, alto * 2 + 0.3))) : [0.6, 0.8, 1];
      ceu = misturar(ceu, [0.98, 0.6, 0.38], tarde * 0.5);
      if (naAgua() && pegar(Math.floor(jog.x), Math.floor(jog.y + OLHO), Math.floor(jog.z)) === B.agua) ceu = [0.1, 0.25, 0.6];
      gl.clearColor(ceu[0], ceu[1], ceu[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.uniform3fv(U.uNevoa, ceu);
      gl.uniform1f(U.uDens, naAgua() && pegar(Math.floor(jog.x), Math.floor(jog.y + OLHO), Math.floor(jog.z)) === B.agua ? 0.12 : cfg.nevoa);
      gl.uniform1f(U.uLuz, luz);
      gl.uniform4fv(U.uCor, [0, 0, 0, 0]); gl.uniform1f(U.uAlfa, 1);
      gl.uniform3fv(U.uDesl, [0, 0, 0]);
      const [ex, ey, ez] = olho();
      // Chama: a luz das tochas tremula de leve; tocha escolhida na barra ilumina em volta
      const pisca = comLuz ? 0.93 + 0.04 * Math.sin(relogio * 9.1) + 0.03 * Math.sin(relogio * 23.7 + 1.3) : 1;
      gl.uniform1f(U.uPisca, pisca);
      gl.uniform1f(U.uMin, comLuz ? 0.13 : 0);
      const tochaNaMao = comLuz && hotbar[escolhido] === B.tocha && temBloco(B.tocha);
      gl.uniform4fv(U.uMao, tochaNaMao ? [ex, ey - 0.3, ez, 12.5] : [0, 0, 0, 0]);
      const vista = mat.mult(mat.rotX(-jog.pitch), mat.mult(mat.rotY(jog.yaw), mat.trans(-ex, -ey, -ez)));
      const proj = mat.persp(FOV, w / h, 0.05, 400);
      const mvp = mat.mult(proj, vista);
      gl.uniformMatrix4fv(U.uM, false, mvp);
      gl.bindTexture(gl.TEXTURE_2D, texAtlas);

      // Sol e lua (cor lisa, sem névoa), bem longe
      if (cfg.diaNoite) {
        gl.uniform1f(U.uDens, 0); gl.uniform1f(U.uLuz, 1);
        const astro = (dx, dy, tam, cor) => {
          const c = [ex + dx * 150, ey + dy * 150, ez - 40];
          const q = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]].flatMap(([a, b]) => [c[0] - dy * b * tam, c[1] + dx * b * tam, c[2] + a * tam, 0, 0, 1, 1, 0]);
          desenharExtra(q, gl.TRIANGLES, cor);
        };
        gl.depthMask(false);
        if (alto > -0.2) astro(Math.cos(ang), alto, 9, [1, 0.93, 0.55, 1]);
        if (alto < 0.2) astro(-Math.cos(ang), -alto, 6, [0.92, 0.94, 1, 1]);
        gl.depthMask(true);
        gl.uniform1f(U.uDens, naAgua() ? 0.12 : cfg.nevoa); gl.uniform1f(U.uLuz, luz);
      }

      // Pedaços opacos (as folhas e o vidro são "furados" pelo discard)
      pedacos.forEach((p, i) => {
        if (p.sujo) construir(i % NCX, Math.floor(i / NCX));
        if (!p.nO) return;
        gl.bindBuffer(gl.ARRAY_BUFFER, p.opaco); atributos(); gl.drawArrays(gl.TRIANGLES, 0, p.nO);
      });
      // Bichinhos
      if (bichos.length) { const n = malhaBichos(); atributos(); gl.drawArrays(gl.TRIANGLES, 0, n); }
      // Contorno do bloco mirado
      if (alvoTela) { gl.uniform1f(U.uLuz, 1); desenharExtra(contorno(alvoTela.x, alvoTela.y, alvoTela.z), gl.LINES, [0.05, 0.05, 0.05, 1]); gl.uniform1f(U.uLuz, luz); }
      // Água e nuvens (transparentes, por último)
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      pedacos.forEach(p => { if (!p.nA) return; gl.bindBuffer(gl.ARRAY_BUFFER, p.agua); atributos(); gl.drawArrays(gl.TRIANGLES, 0, p.nA); });
      // Brilho das tochas (halo que soma luz; mais forte no escuro)
      if (comLuz && tochas.size) {
        const cp = Math.cos(jog.pitch), sp = Math.sin(jog.pitch), sy = Math.sin(jog.yaw), cy = Math.cos(jog.yaw);
        const dir = [cy, 0, sy], cima = [-sy * sp, cp, cy * sp];
        const grande = [], miolo = [];
        const quad = (arr, c, r) => [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]].forEach(([a, b]) => {
          const u = (a * 2 - 1) * r, v = (b * 2 - 1) * r;
          arr.push(c[0] + dir[0] * u + cima[0] * v, c[1] + dir[1] * u + cima[1] * v, c[2] + dir[2] * u + cima[2] * v, a, b, 1, 1, 0);
        });
        let k = 0;
        for (const t of tochas) {
          const [tx, ty, tz] = t.split(",").map(Number);
          const dx = tx + 0.5 - ex, dy = ty + 0.7 - ey, dz = tz + 0.5 - ez;
          if (dx * dx + dy * dy + dz * dz > 34 * 34) continue;
          const f = Math.sin(relogio * 7 + tx * 1.7 + tz * 2.3) * 0.06 + Math.sin(relogio * 17 + ty) * 0.04;
          const c = [tx + 0.5, ty + 0.72, tz + 0.5];
          quad(grande, c, 1.25 + f * 4); quad(miolo, c, 0.32 + f);
          if (++k > 60) break;
        }
        if (grande.length) {
          const escuro = 1 - Math.min(1, luz) * 0.75;
          gl.blendFunc(gl.ONE, gl.ONE); gl.uniform1f(U.uHalo, 1);
          desenharExtra(grande, gl.TRIANGLES, [1, 0.62, 0.25, 0.42 * escuro]);
          desenharExtra(miolo, gl.TRIANGLES, [1, 0.9, 0.55, 0.85]);
          gl.uniform1f(U.uHalo, 0); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
      }
      gl.uniform1f(U.uDens, 0.006);
      gl.uniform3fv(U.uDesl, [((relogio * 1.2) % 128) - 128, 0, 0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, bufNuvens); atributos();
      gl.uniform4fv(U.uCor, [1, 1, 1, 1]); gl.uniform1f(U.uAlfa, 0.78);
      gl.drawArrays(gl.TRIANGLES, 0, nNuvens);
      gl.uniform4fv(U.uCor, [0, 0, 0, 0]); gl.uniform1f(U.uAlfa, 1); gl.uniform3fv(U.uDesl, [0, 0, 0]);
      gl.depthMask(true); gl.disable(gl.BLEND);
    }

    // ---------- Interface (HUD) ----------
    const hud = document.createElement("div");
    hud.className = "mundo-hud";
    tela.appendChild(hud);
    const mira = Object.assign(document.createElement("div"), { className: "mundo-mira", textContent: "+" });
    const anel = Object.assign(document.createElement("div"), { className: "mundo-anel" });
    const topo = Object.assign(document.createElement("div"), { className: "mundo-topo" });
    const barra = Object.assign(document.createElement("div"), { className: "mundo-barra" });
    const base = Object.assign(document.createElement("div"), { className: "mundo-joy" });
    const bolinha = Object.assign(document.createElement("div"), { className: "mundo-joy-bola" });
    base.appendChild(bolinha);
    const botoesDir = Object.assign(document.createElement("div"), { className: "mundo-botoes" });
    const aviso = Object.assign(document.createElement("div"), { className: "mundo-aviso" });
    hud.append(mira, anel, topo, base, botoesDir, barra, aviso);
    const btn = (txt, rot, cls = "") => { const b = document.createElement("button"); b.className = "mundo-btn " + cls; b.textContent = txt; b.setAttribute("aria-label", rot); return b; };
    let avisoTimer = null;
    const avisar = txt => { aviso.textContent = txt; aviso.classList.add("visivel"); clearTimeout(avisoTimer); avisoTimer = setTimeout(() => aviso.classList.remove("visivel"), 1600); };

    const icones = {};
    const iconeDe = b => (icones[b] = icones[b] || M.icone(atlas, b));
    function desenharBarra() {
      barra.innerHTML = "";
      hotbar.forEach((b, i) => {
        const s = document.createElement("button");
        s.className = "mundo-slot" + (i === escolhido ? " ativo" : "") + (b && !temBloco(b) ? " vazio" : "");
        s.setAttribute("aria-label", b ? M.BLOCOS[b].nome : "Vazio");
        s.innerHTML = b ? `<img alt="" src="${iconeDe(b)}">` + (sobrev ? `<b class="qtd">${inv[b] || 0}</b>` : "") : "";
        s.addEventListener("pointerdown", e => { e.stopPropagation(); escolhido = i; desenharBarra(); if (b) avisar(M.BLOCOS[b].nome); });
        barra.appendChild(s);
      });
    }
    // Corações (Sobrevivência)
    const vidaEl = Object.assign(document.createElement("div"), { className: "mundo-vida" });
    const dano = Object.assign(document.createElement("div"), { className: "mundo-dano" });
    hud.append(vidaEl, dano);
    // Meta da Sobrevivência: passar 3 noites sem desmaiar (fica guardado no aparelho)
    const META_NOITES = 3;
    let noites = 0, desmaiouNaNoite = false, venceu = false;
    try { noites = parseInt(localStorage.getItem("mundo-noites"), 10) || 0; } catch (e) { /* ok */ }
    venceu = noites >= META_NOITES;
    const metaEl = Object.assign(document.createElement("div"), { className: "mundo-meta" });
    if (sobrev) hud.appendChild(metaEl);
    const desenharMeta = () => { metaEl.textContent = venceu ? `🏆 ${noites} ${noites === 1 ? "noite" : "noites"}` : `🌙 Noites: ${noites} de ${META_NOITES}`; };
    desenharMeta();
    function noiteVencida() {
      if (desmaiouNaNoite) { desmaiouNaNoite = false; Motor.falar("Amanheceu! Desta vez não valeu, você desmaiou. Tente a próxima noite!"); return; }
      noites++;
      try { localStorage.setItem("mundo-noites", String(noites)); } catch (e) { /* ok */ }
      desenharMeta();
      if (typeof Placar !== "undefined") Placar.recorde("mundo", "noites", noites);
      if (!venceu && noites >= META_NOITES) {
        venceu = true;
        desenharMeta();
        const caixa = document.createElement("div");
        caixa.className = "mundo-mochila menu";
        caixa.innerHTML = `<div class="mundo-mochila-titulo">🏆 Você sobreviveu ${META_NOITES} noites!</div><div class="mundo-desmaio">Você é um sobrevivente de verdade! Pode continuar explorando e construindo: as noites continuam contando.</div>`;
        const b = Object.assign(document.createElement("button"), { className: "chip jogar", textContent: "⛏️ Continuar" });
        b.addEventListener("click", () => caixa.remove());
        caixa.appendChild(b);
        caixa.addEventListener("pointerdown", e => e.stopPropagation());
        hud.appendChild(caixa);
        Motor.comemorar(caixa); Motor.tim();
        Motor.falar(`Parabéns! Você sobreviveu ${META_NOITES} noites!`, { importante: true });
        return;
      }
      const f = META_NOITES - noites;
      Motor.falar(venceu ? `Amanheceu! Você já sobreviveu ${noites} noites!` : `Amanheceu! Você sobreviveu à noite! Falta${f > 1 ? "m" : ""} ${f}.`);
    }
    function desenharVida() {
      if (!sobrev) { vidaEl.hidden = true; return; }
      vidaEl.textContent = Array.from({ length: 10 }, (_, i) => (vida >= (i + 1) * 2 ? "❤️" : vida === i * 2 + 1 ? "💔" : "🤍")).join("");
    }
    desenharBarra();
    desenharVida();

    const bVoar = btn("🕊️", "Voar"), bMochila = btn("🎒", "Mochila"), bMenu = btn("⚙️", "Opções");
    topo.append(bMochila, ...(sobrev ? [] : [bVoar]), bMenu, Motor.botaoSom());
    const bPular = btn("⬆️", "Pular", "grande"), bDescer = btn("⬇️", "Descer");
    botoesDir.append(bDescer, bPular);
    const segurar = (b, liga) => {
      b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); liga(true); b.classList.add("apertado"); try { b.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } });
      ["pointerup", "pointercancel"].forEach(ev => b.addEventListener(ev, () => { liga(false); b.classList.remove("apertado"); }));
    };
    segurar(bPular, v => { ent.pular = v; });
    segurar(bDescer, v => { ent.descer = v; });
    const atualizarVoo = () => { bVoar.classList.toggle("ativo", jog.voando); bDescer.style.visibility = jog.voando ? "visible" : "hidden"; };
    const alternarVoo = () => { if (sobrev) return; jog.voando = !jog.voando; jog.vy = 0; atualizarVoo(); avisar(jog.voando ? "🕊️ Voando! ⬆️ sobe, ⬇️ desce" : "🚶 Andando"); };
    bVoar.addEventListener("click", alternarVoo);
    atualizarVoo();

    // Mochila: todos os blocos do modo; o escolhido vai para o espaço ativo da barra
    function abrirMochila() {
      if (hud.querySelector(".mundo-mochila")) return;
      const caixa = document.createElement("div");
      caixa.className = "mundo-mochila";
      const t = Object.assign(document.createElement("div"), { className: "mundo-mochila-titulo", textContent: "🎒 Escolha um bloco" });
      const grade = document.createElement("div");
      grade.className = "mundo-mochila-grade";
      const lista = sobrev ? cfg.paleta.filter(b => inv[b] > 0) : cfg.paleta;
      if (sobrev && !lista.length) grade.innerHTML = `<div class="mundo-desmaio">Sua mochila está vazia. Segure o dedo num bloco para quebrar e recolher!</div>`;
      lista.forEach(b => {
        const s = document.createElement("button");
        s.className = "mundo-slot";
        s.innerHTML = `<img alt="" src="${iconeDe(b)}"><small></small>` + (sobrev ? `<b class="qtd">${inv[b]}</b>` : "");
        s.querySelector("small").textContent = M.BLOCOS[b].nome;
        s.addEventListener("click", () => {
          const ja = hotbar.indexOf(b);
          if (ja >= 0) escolhido = ja; else hotbar[escolhido] = b;
          desenharBarra(); caixa.remove(); avisar(M.BLOCOS[b].nome); mudou = true;
        });
        grade.appendChild(s);
      });
      const fechar = Object.assign(document.createElement("button"), { className: "chip", textContent: "✖️ Fechar" });
      fechar.addEventListener("click", () => caixa.remove());
      caixa.append(t, grade);
      if (sobrev) {
        // Ferramentas e receitas
        const ferr = ["machado", "picareta", "espada"].filter(f => inv[f]).map(f => ({ machado: "🪓", picareta: "⛏️", espada: "🗡️" })[f]).join(" ");
        const tf = Object.assign(document.createElement("div"), { className: "mundo-mochila-titulo menor", textContent: `🛠️ Receitas ${ferr ? "· você tem " + ferr : ""}` });
        const rec = document.createElement("div");
        rec.className = "mundo-receitas";
        RECEITAS.forEach(r => {
          if (r.ferramenta && inv[r.ferramenta]) return;
          const pode = Object.entries(r.precisa).every(([b, n]) => (inv[b] || 0) >= n);
          const bt = document.createElement("button");
          bt.className = "mundo-receita" + (pode ? "" : " falta");
          const custo = Object.entries(r.precisa).map(([b, n]) => `${n} ${M.BLOCOS[b].nome.toLowerCase()}`).join(" + ");
          bt.innerHTML = `<span class="ic"></span><span><b></b><small></small></span>`;
          bt.querySelector(".ic").textContent = r.icone;
          bt.querySelector("b").textContent = r.nome;
          bt.querySelector("small").textContent = custo + (r.dica ? ` · ${r.dica}` : "");
          bt.addEventListener("click", () => {
            if (!pode) { Motor.falar(`Para fazer ${r.nome.toLowerCase()} você precisa de ${custo}.`); return; }
            Object.entries(r.precisa).forEach(([b, n]) => { inv[b] -= n; });
            if (r.ferramenta) inv[r.ferramenta] = 1;
            Object.entries(r.da || {}).forEach(([b, n]) => ganhar(+b, n));
            mudou = true; Motor.tim(); Motor.falar(`Você fez ${r.nome.toLowerCase()}!`);
            caixa.remove(); desenharBarra(); abrirMochila();
          });
          rec.appendChild(bt);
        });
        caixa.append(tf, rec);
      }
      caixa.append(fechar);
      caixa.addEventListener("pointerdown", e => e.stopPropagation());
      hud.appendChild(caixa);
    }
    bMochila.addEventListener("click", abrirMochila);

    function abrirMenu() {
      if (hud.querySelector(".mundo-mochila")) return;
      const caixa = document.createElement("div");
      caixa.className = "mundo-mochila menu";
      caixa.addEventListener("pointerdown", e => e.stopPropagation());
      const t = Object.assign(document.createElement("div"), { className: "mundo-mochila-titulo", textContent: `⚙️ Mundo ${cfg.nome}` });
      const acoes = document.createElement("div");
      acoes.className = "mundo-menu-acoes";
      const chip = (txt, fn) => { const b = Object.assign(document.createElement("button"), { className: "chip", textContent: txt }); b.addEventListener("click", fn); acoes.appendChild(b); return b; };
      if (cfg.diaNoite) {
        chip("☀️ Dia", () => { tempoDia = 0.3; caixa.remove(); });
        chip("🌙 Noite", () => { tempoDia = 0.8; caixa.remove(); });
      }
      chip("🏠 Voltar ao começo", () => { nascer(); caixa.remove(); });
      let certeza = false;
      const novo = chip("🌍 Criar outro mundo", () => {
        if (!certeza) { certeza = true; novo.textContent = "⚠️ Toque de novo: o mundo atual some!"; return; }
        seed = Math.floor(Math.random() * 1e9);
        mundo = gerar(cfg, seed);
        calcularLuz(); lerTochas();
        pedacos.forEach(p => { p.sujo = true; });
        nascer(); mudou = true; salvar(); caixa.remove();
        Motor.falar("Um mundo novinho!");
      });
      chip("✖️ Fechar", () => caixa.remove());
      caixa.append(t, acoes);
      hud.appendChild(caixa);
    }
    bMenu.addEventListener("click", abrirMenu);

    // Bicho tocado: criatura leva um golpe; ovelha dá lã (na Sobrevivência); porco faz oinc
    function tocarBicho(a) {
      if (a.hostil) return atacar(a);
      if (a.tipo === "ovelha" && sobrev && relogio - (a.tosquiada || -99) > 30) { a.tosquiada = relogio; ganhar(B.la + 4); desenharBarra(); avisar("🐑 Você ganhou lã!"); }
      Motor.falar(a.tipo === "porco" ? "Oinc oinc!" : "Méééé!");
      a.vy = 5;
    }

    // ---------- Toque: joystick (esquerda), olhar (arrastar), colocar (tocar), quebrar (segurar) ----------
    const dedos = new Map();
    const QUEBRA_MS = 380;
    const naTela = e => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)]; };
    function alvoNoPonto(e) {
      const d = direcao(...naTela(e)), o = olho();
      const bloco = mirar(o, d), bicho = cfg.bichos ? bichoNoRaio(o, d, 7) : null;
      if (bicho && (!bloco || bicho.t < bloco.t)) return { bicho: bicho.a };
      return bloco;
    }
    hud.addEventListener("pointerdown", e => {
      // No computador o mouse é capturado (clique) e usa os botões do mouse; aqui só toque e caneta
      if (e.target.closest("button") || document.pointerLockElement === canvas || e.pointerType === "mouse") return;
      e.preventDefault();
      try { hud.setPointerCapture(e.pointerId); } catch (er) { /* ok */ }
      const r = hud.getBoundingClientRect();
      const esquerda = e.clientX - r.left < r.width * 0.38 && e.clientY - r.top > r.height * 0.35;
      if (esquerda && ![...dedos.values()].some(d => d.tipo === "joy")) {
        dedos.set(e.pointerId, { tipo: "joy", cx: e.clientX, cy: e.clientY });
        base.classList.add("ativo");
        Object.assign(base.style, { left: e.clientX - r.left + "px", top: e.clientY - r.top + "px" });
        bolinha.style.transform = "translate(-50%, -50%)";
        return;
      }
      const d = { tipo: "olhar", x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t0: performance.now(), moveu: false, ev: e };
      d.timer = setInterval(() => {
        if (d.moveu || !vivo()) return;
        const passou = performance.now() - d.t0;
        const alvoAgora = passou > 120 ? alvoNoPonto(d.ev) : null;
        const precisa = alvoAgora && !alvoAgora.bicho ? tempoQuebra(alvoAgora.b) * 1000 + 120 : QUEBRA_MS;
        if (passou > 120) {
          alvoTela = alvoAgora && !alvoAgora.bicho ? alvoAgora : null;
          anel.style.left = d.ev.clientX - r.left + "px"; anel.style.top = d.ev.clientY - r.top + "px";
          anel.style.setProperty("--p", Math.min(1, (passou - 120) / (precisa - 120)));
          anel.classList.add("ativo");
        }
        if (passou > precisa) {
          if (alvoAgora && !alvoAgora.bicho) quebrar(alvoAgora);
          else if (alvoAgora && alvoAgora.bicho && alvoAgora.bicho.hostil) atacar(alvoAgora.bicho);
          d.t0 = performance.now() - 120; d.quebrou = true; // segurando: continua quebrando
        }
      }, 30);
      dedos.set(e.pointerId, d);
    });
    hud.addEventListener("pointermove", e => {
      const d = dedos.get(e.pointerId);
      if (!d) return;
      if (d.tipo === "joy") {
        let dx = e.clientX - d.cx, dy = e.clientY - d.cy;
        const n = Math.hypot(dx, dy), max = 50;
        if (n > max) { dx = dx / n * max; dy = dy / n * max; }
        bolinha.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        ent.jx = dx / max; ent.jz = -dy / max;
        return;
      }
      d.ev = e;
      if (!d.moveu && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 12) { d.moveu = true; anel.classList.remove("ativo"); alvoTela = null; }
      if (d.moveu) {
        jog.yaw += (e.clientX - d.x) * 0.006;
        jog.pitch = Math.max(-1.5, Math.min(1.5, jog.pitch - (e.clientY - d.y) * 0.006));
      }
      d.x = e.clientX; d.y = e.clientY;
    });
    const soltar = e => {
      const d = dedos.get(e.pointerId);
      if (!d) return;
      dedos.delete(e.pointerId);
      if (d.tipo === "joy") { ent.jx = 0; ent.jz = 0; base.classList.remove("ativo"); bolinha.style.transform = "translate(-50%, -50%)"; return; }
      clearInterval(d.timer);
      anel.classList.remove("ativo"); alvoTela = null;
      if (!d.moveu && !d.quebrou && performance.now() - d.t0 < QUEBRA_MS) {
        const alvo = alvoNoPonto(d.ev);
        if (alvo && alvo.bicho) tocarBicho(alvo.bicho);
        else if (!colocar(alvo) && !alvo) avisar("Toque num bloco para colocar outro ao lado. Segure para quebrar!");
      }
    };
    hud.addEventListener("pointerup", soltar);
    hud.addEventListener("pointercancel", soltar);
    hud.addEventListener("contextmenu", e => e.preventDefault());

    // ---------- Computador: mouse capturado + teclado ----------
    canvas.addEventListener("click", () => { if (matchMedia("(pointer: fine)").matches && canvas.requestPointerLock) canvas.requestPointerLock(); });
    hud.addEventListener("click", e => { if (!e.target.closest("button") && matchMedia("(pointer: fine)").matches && canvas.requestPointerLock && !hud.querySelector(".mundo-mochila")) canvas.requestPointerLock(); });
    const mouseMove = e => {
      if (document.pointerLockElement !== canvas) return;
      jog.yaw += e.movementX * 0.0025;
      jog.pitch = Math.max(-1.5, Math.min(1.5, jog.pitch - e.movementY * 0.0025));
    };
    const mouseDown = e => {
      if (document.pointerLockElement !== canvas) return;
      const alvo = mirar(olho(), direcao());
      const bicho = cfg.bichos ? bichoNoRaio(olho(), direcao(), 7) : null;
      if (bicho && (!alvo || bicho.t < alvo.t)) { tocarBicho(bicho.a); return; }
      if (e.button === 0) { if (sobrev) segurandoMouse = true; else quebrar(alvo); } else if (e.button === 2) colocar(alvo);
    };
    // OK do controle remoto (Enter): tocar coloca o bloco na mira; segurar quebra
    let okDesde = 0, okTimer = null;
    const teclaDesce = e => {
      if (!vivo() || e.doControle) return; // o controle de videogame é lido direto (lerControle)
      const k = e.key.toLowerCase();
      if (k === "enter") {
        e.preventDefault();
        if (e.repeat || okDesde) return;
        okDesde = performance.now();
        okTimer = null;
        return;
      }
      if (/^[1-9]$/.test(k)) { escolhido = +k - 1; desenharBarra(); return; }
      if (k === "f") return alternarVoo();
      if (k === "e") return hud.querySelector(".mundo-mochila") ? hud.querySelector(".mundo-mochila").remove() : abrirMochila();
      ent.teclas.add(k);
      if (k === " ") e.preventDefault();
    };
    let segurandoMouse = false;
    const mouseUp = e => { if (e.button === 0) segurandoMouse = false; };
    document.addEventListener("mouseup", mouseUp);
    // Quebrar segurando, mirando o meio da tela (mouse, controle de videogame, controle remoto)
    let quebraAlvo = null, quebraTempo = 0;
    function quebraNoMeio(segurando, dt) {
      if (!segurando) { quebraAlvo = null; quebraTempo = 0; if (!dedos.size) anel.classList.remove("ativo"); return; }
      const a = mirar(olho(), direcao());
      const chave = a && `${a.x},${a.y},${a.z}`;
      if (chave !== quebraAlvo) { quebraAlvo = chave; quebraTempo = 0; }
      if (!a) { anel.classList.remove("ativo"); return; }
      quebraTempo += dt;
      const precisa = tempoQuebra(a.b);
      Object.assign(anel.style, { left: "50%", top: "50%" });
      anel.style.setProperty("--p", Math.min(1, quebraTempo / precisa));
      anel.classList.add("ativo");
      if (quebraTempo >= precisa) { quebrar(a); quebraAlvo = null; quebraTempo = 0; }
    }
    const teclaSobe = e => {
      if (e.doControle) return;
      const k = e.key.toLowerCase();
      if (k === "enter" && okDesde) { if (performance.now() - okDesde < 250) colocar(mirar(olho(), direcao())); okDesde = 0; return; }
      ent.teclas.delete(k);
    };
    const roda = e => { if (document.pointerLockElement !== canvas) return; escolhido = (escolhido + (e.deltaY > 0 ? 1 : 8)) % 9; desenharBarra(); };
    const lockMudou = () => { mira.classList.toggle("visivel", document.pointerLockElement === canvas); };
    const semMenu = e => { if (document.pointerLockElement === canvas) e.preventDefault(); };
    const eventos = [["mousemove", mouseMove], ["mousedown", mouseDown], ["keydown", teclaDesce], ["keyup", teclaSobe],
      ["wheel", roda], ["pointerlockchange", lockMudou], ["contextmenu", semMenu]];
    eventos.forEach(([nome, fn]) => document.addEventListener(nome, fn));

    // ---------- Salvar ----------
    function salvar() {
      if (!mudou && salvo) return;
      try {
        localStorage.setItem(CHAVE, JSON.stringify({ seed, mundo: comprimir(mundo), hotbar, tempoDia, inv, vida, derrotadas, jog: { x: jog.x, y: jog.y, z: jog.z, yaw: jog.yaw, pitch: jog.pitch, voando: jog.voando } }));
        mudou = false; salvo = true;
      } catch (e) { /* sem espaço: segue sem salvar */ }
    }
    const escondeu = () => { if (document.visibilityState === "hidden") salvar(); };
    document.addEventListener("visibilitychange", escondeu);
    eventos.push(["visibilitychange", escondeu]);
    function encerrar() {
      salvar();
      eventos.forEach(([nome, fn]) => document.removeEventListener(nome, fn));
      dedos.forEach(d => clearInterval(d.timer));
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      const perder = gl.getExtension("WEBGL_lose_context");
      if (perder) perder.loseContext(); // libera a memória de vídeo (o iPhone tem limite)
    }

    // ---------- Controle de videogame (lido direto, a cada quadro) ----------
    // Alavanca esquerda anda, direita olha; A pula (e sobe voando), B volta ao menu (pelo app),
    // RT coloca, LT quebra (segurando, continua), Y voa, X mochila, LB/RB trocam o bloco,
    // direcional ⬇️ desce voando.
    const antes = {};
    let padQuebra = false;
    function lerControle(dt) {
      const p = Controle.pad();
      if (!p) { ent.px = ent.pz = 0; ent.padPular = ent.padDescer = false; padQuebra = false; return; }
      const borda = (i, fn) => { const v = p.botao(i); if (v && !antes[i]) fn(); antes[i] = v; };
      if (hud.querySelector(".mundo-mochila")) { [3, 2, 4, 5, 6, 7].forEach(i => { antes[i] = p.botao(i); }); padQuebra = false; return; }
      ent.px = p.eixo(0); ent.pz = -p.eixo(1);
      jog.yaw += p.eixo(2) * 2.6 * dt;
      jog.pitch = Math.max(-1.5, Math.min(1.5, jog.pitch - p.eixo(3) * 2 * dt));
      ent.padPular = p.botao(0); ent.padDescer = p.botao(13);
      borda(3, alternarVoo);
      borda(2, abrirMochila);
      borda(4, () => { escolhido = (escolhido + 8) % 9; desenharBarra(); avisar(M.BLOCOS[hotbar[escolhido]].nome); });
      borda(5, () => { escolhido = (escolhido + 1) % 9; desenharBarra(); avisar(M.BLOCOS[hotbar[escolhido]].nome); });
      const bichoNaMira = () => { const b = bichos.length ? bichoNoRaio(olho(), direcao(), 7) : null, a = mirar(olho(), direcao()); return b && (!a || b.t < a.t) ? b.a : null; };
      borda(7, () => { const b = bichoNaMira(); if (b) tocarBicho(b); else colocar(mirar(olho(), direcao())); });
      if (p.botao(6) && !antes[6]) { const b = bichoNaMira(); if (b) { tocarBicho(b); antes[6] = true; return; } }
      padQuebra = p.botao(6) && !bichoNaMira();
      antes[6] = p.botao(6);
    }

    // ---------- Laço principal ----------
    let ultimo = performance.now(), relogio = 0, ultimoSalvo = 0;
    function laco(t) {
      if (!vivo()) { encerrar(); return; }
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t; relogio += dt;
      if (!hud.querySelector(".mundo-mochila")) {
        fisica(dt);
        if (cfg.bichos) moverBichos(dt);
        if (cfg.diaNoite) {
          const antes = noite();
          tempoDia = (tempoDia + dt / 480) % 1; // um dia inteiro em 8 minutos
          if (sobrev && noite() && !antes) { Motor.falar("Está anoitecendo! Faça uma casinha ou coloque tochas: elas iluminam e as criaturas não chegam perto."); avisar("🌙 Anoiteceu: cuidado com as criaturas!"); }
          if (sobrev && !noite() && antes) { avisar("☀️ Amanheceu!"); noiteVencida(); }
        }
        // vida volta aos pouquinhos se ninguém machucar por um tempo
        if (sobrev && vida < 20 && vida > 0 && relogio - ultimoDano > 6 && Math.floor(relogio / 3) !== Math.floor((relogio - dt) / 3)) { vida++; desenharVida(); }
      }
      lerControle(dt);
      quebraNoMeio((segurandoMouse && document.pointerLockElement === canvas) || padQuebra || (okDesde && performance.now() - okDesde > 250), dt);
      // Mira no meio da tela: mouse capturado, controle de videogame ou controle remoto
      const comMira = document.pointerLockElement === canvas || Controle.ativo();
      mira.classList.toggle("visivel", comMira);
      if (comMira && !dedos.size) alvoTela = mirar(olho(), direcao());
      desenhar();
      if (relogio - ultimoSalvo > 20) { ultimoSalvo = relogio; salvar(); }
      requestAnimationFrame(laco);
    }
    requestAnimationFrame(laco);
    Motor.falar(sobrev
      ? `Sobrevivência! A meta é passar ${META_NOITES} noites sem desmaiar. Sua mochila começa vazia: segure o dedo nos blocos para recolher. Faça tábuas e ferramentas na mochila, e prepare-se para a noite!`
      : cfg.hd
      ? "Mundo novo! Ande com o joystick, arraste para olhar, toque para colocar um bloco e segure para quebrar."
      : "Mundo clássico! Ande com o joystick, arraste para olhar, toque para colocar um bloco e segure para quebrar.");

    // Gancho para testes automáticos
    if (window.MUNDO_TESTE) window.MUNDO_TESTE = { jog, pegar, mirar, direcao, olho, colocar, quebrar, bichos, salvar, ent, cfg, inv, hora: t => { tempoDia = t; }, vida: () => vida, abrirMochila,
      luzEm, tempoLuz: () => tempoLuz, tochas, hotbar, escolher: i => { escolhido = i; desenharBarra(); },
      // põe um bloco direto (sem as regras do jogo), atualizando a luz e as malhas
      por: (x, y, z, b) => { if (pegar(x, y, z) === B.tocha) tochas.delete(`${x},${y},${z}`); mundo[I(x, y, z)] = b; if (b === B.tocha) tochas.add(`${x},${y},${z}`); const t0 = performance.now(); luzMudou(x, y, z); sujar(x, z); return performance.now() - t0; },
      bloco: () => mundo, I, X, Y, Z, calcularLuz, luzTudo: () => [luzCeu.slice(), luzBloco.slice()] };
  }
})();
