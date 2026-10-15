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
      nome: "Novo", X: 96, Z: 96, Y: 48, agua: 20, res: 32, hd: true, ao: true, diaNoite: true, bichos: true, nevoa: 0.019,
      paleta: [B.grama, B.terra, B.pedra, B.pedregulho, B.tabuas, B.tronco, B.folhas, B.areia, B.cascalho, B.vidro, B.tijolo, B.neve,
        ...Array.from({ length: 9 }, (_, i) => B.la + i), B.ouro, B.diamante, B.carvao, B.agua, B.cacto, B.florAmarela, B.florVermelha, B.gramaAlta],
    },
  };
  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4 58 18 32 32 6 18Z" fill="#6cbf3f"/><path d="M6 18 32 32v28L6 46Z" fill="#8a5f3c"/><path d="M58 18 32 32v28l26-14Z" fill="#6e4a2e"/><path d="M6 18 32 32 58 18v6l-4 2v-2l-4 2v3l-4 2v-3l-5 3v2l-4 2-5-3v3l-4-2v-3l-5-3v2l-4-2v-3l-4-2v3l-3-2Z" fill="#5aa836"/><path d="M32 4 58 18 32 32 6 18Z" fill="none" stroke="#3d7a24" stroke-width="1.5"/><g fill="#7ad04a"><rect x="20" y="13" width="4" height="2"/><rect x="36" y="20" width="4" height="2"/><rect x="30" y="9" width="3" height="2"/></g><g fill="#5c3d22"><rect x="12" y="34" width="4" height="3"/><rect x="20" y="44" width="3" height="3"/><rect x="42" y="40" width="4" height="3"/><rect x="48" y="30" width="3" height="3"/></g></svg>';

  JOGOS.push({
    id: "mundo",
    nome: "Mundo de Blocos",
    icone: ICONE,
    faixas: ["6-8", "8-10"],
    iniciar(area) {
      Motor.escolherModo(area, [
        { icone: "🧱", rotulo: "Clássico (antigo)", iniciar: () => jogo(area, "classico") },
        { icone: "🌳", rotulo: "Novo (alta definição)", iniciar: () => jogo(area, "novo") },
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
    const no = (x, z) => x >= 2 && z >= 2 && x < X - 2 && z < Z - 2;
    const por = (x, y, z, b) => { if (x >= 0 && z >= 0 && x < X && z < Z && y < Y && !w[I(x, y, z)]) w[I(x, y, z)] = b; };
    // Árvores, cactos, flores e grama alta
    for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
      const h = alt[z * X + x], bi = bioma[z * X + x], topo = w[I(x, h, z)];
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

    // Shaders: textura × luz da face × luz do dia, com névoa. uCor (alfa > 0) desenha cor lisa.
    const vs = `attribute vec3 aP; attribute vec2 aT; attribute float aL;
      uniform mat4 uM; uniform vec3 uDesl; varying vec2 vT; varying float vL; varying float vD;
      void main() { vec4 p = uM * vec4(aP + uDesl, 1.0); gl_Position = p; vT = aT; vL = aL; vD = p.w; }`;
    const fs = `precision mediump float;
      uniform sampler2D uTex; uniform float uLuz; uniform vec3 uNevoa; uniform float uDens; uniform vec4 uCor; uniform float uAlfa;
      varying vec2 vT; varying float vL; varying float vD;
      void main() {
        vec4 c = uCor.a > 0.0 ? uCor : texture2D(uTex, vT);
        if (c.a < 0.45) discard;
        float f = exp(-pow(vD * uDens, 2.0));
        gl_FragColor = vec4(mix(uNevoa, c.rgb * vL * uLuz, clamp(f, 0.0, 1.0)), c.a * uAlfa);
      }`;
    const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    const A = { P: gl.getAttribLocation(prog, "aP"), T: gl.getAttribLocation(prog, "aT"), L: gl.getAttribLocation(prog, "aL") };
    const U = {}; ["uM", "uDesl", "uTex", "uLuz", "uNevoa", "uDens", "uCor", "uAlfa"].forEach(n => { U[n] = gl.getUniformLocation(prog, n); });
    [A.P, A.T, A.L].forEach(a => gl.enableVertexAttribArray(a));

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
    let hotbar = (salvo && salvo.hotbar) || cfg.paleta.slice(0, 9);
    let escolhido = 0, tempoDia = (salvo && salvo.tempoDia) || 0.3, mudou = false;

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
      const vert = (arr, x, y, z, t, a, b, l) => { const [s, q] = uv(t, a, b); arr.push(x, y, z, s, q, l); };
      for (let y = 0; y < Y; y++) for (let z = cz * CH; z < cz * CH + CH; z++) for (let x = cx * CH; x < cx * CH + CH; x++) {
        const b = mundo[I(x, y, z)];
        if (!b) continue;
        const def = M.BLOCOS[b];
        if (def.tipo === "cruz") {
          const t = M.tex(b, 0), e = 0.15;
          [[[e, e], [1 - e, 1 - e]], [[e, 1 - e], [1 - e, e]]].forEach(([[x0, z0], [x1, z1]]) => {
            const c = [[x0, z0, 0, 0], [x1, z1, 1, 0], [x1, z1, 1, 1], [x0, z0, 0, 1]].map(([px, pz, a, bb]) => [x + px, y + bb * 0.95, z + pz, a, bb]);
            [0, 1, 2, 0, 2, 3].forEach(k => vert(op, c[k][0], c[k][1], c[k][2], t, c[k][3], c[k][4], 0.95));
          });
          continue;
        }
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
            let l = F.luz;
            if (cfg.ao && !ehAgua) {
              const nx = x + F.n[0], ny = y + F.n[1], nz = z + F.n[2];
              const du = F.u.map(c => (a ? c : -c)), dv = F.v.map(c => (bb ? c : -c));
              const s1 = fazOcl(nx + du[0], ny + du[1], nz + du[2]), s2 = fazOcl(nx + dv[0], ny + dv[1], nz + dv[2]);
              const cc = fazOcl(nx + du[0] + dv[0], ny + du[1] + dv[1], nz + du[2] + dv[2]);
              l *= AO[s1 && s2 ? 0 : 3 - (s1 + s2 + cc)];
            }
            return [px, py, pz, a, bb, l];
          });
          // Diagonal do quadrado escolhida para a sombra ficar suave
          const ordem = cantos[0][5] + cantos[2][5] < cantos[1][5] + cantos[3][5] ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
          ordem.forEach(k => vert(arr, cantos[k][0], cantos[k][1], cantos[k][2], t, cantos[k][3], cantos[k][4], cantos[k][5]));
        });
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, p.opaco); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(op), gl.STATIC_DRAW); p.nO = op.length / 6;
      gl.bindBuffer(gl.ARRAY_BUFFER, p.agua); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ag), gl.STATIC_DRAW); p.nA = ag.length / 6;
      p.sujo = false;
    }
    const sujar = (x, z) => {
      const marca = (a, b) => { if (a >= 0 && b >= 0 && a < X && b < Z) pedacos[Math.floor(b / CH) * NCX + Math.floor(a / CH)].sujo = true; };
      marca(x, z); marca(x - 1, z); marca(x + 1, z); marca(x, z - 1); marca(x, z + 1);
      if (cfg.ao) { marca(x - 1, z - 1); marca(x + 1, z + 1); marca(x - 1, z + 1); marca(x + 1, z - 1); }
    };

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
    const ent = { jx: 0, jz: 0, pular: false, descer: false, teclas: new Set() };
    function fisica(dt) {
      const k = ent.teclas;
      let fx = ent.jx + (k.has("d") ? 1 : 0) - (k.has("a") ? 1 : 0);
      let fz = ent.jz + (k.has("w") ? 1 : 0) - (k.has("s") ? 1 : 0);
      const mag = Math.hypot(fx, fz); if (mag > 1) { fx /= mag; fz /= mag; }
      const agua = naAgua();
      const vel = jog.voando ? 9 : agua ? 2.6 : 4.4;
      const s = Math.sin(jog.yaw), c = Math.cos(jog.yaw);
      const alvoX = (s * fz + c * fx) * vel, alvoZ = (-c * fz + s * fx) * vel;
      const suav = Math.min(1, dt * (jog.chao || jog.voando ? 14 : 4));
      jog.vx += (alvoX - jog.vx) * suav; jog.vz += (alvoZ - jog.vz) * suav;
      const pular = ent.pular || k.has(" "), descer = ent.descer || k.has("shift");
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
      jog.chao = false;
      if (!bate(jog.x, ny, jog.z)) jog.y = ny;
      else { if (jog.vy < 0) { jog.chao = true; jog.y = Math.max(jog.y - 0.5, Math.floor(ny) + 1); } jog.vy = 0; }
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

    function quebrar(alvo) {
      if (!alvo || M.BLOCOS[alvo.b].fixo) { if (alvo) Motor.nota(120, { dur: 0.08, tipo: "square", vol: 0.05 }); return false; }
      mundo[I(alvo.x, alvo.y, alvo.z)] = 0;
      if (M.BLOCOS[pegar(alvo.x, alvo.y + 1, alvo.z)]?.tipo === "cruz") mundo[I(alvo.x, alvo.y + 1, alvo.z)] = 0;
      // Água em volta escorre para o buraco (um pouquinho)
      if ([[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]].some(([dx, dy, dz]) => pegar(alvo.x + dx, alvo.y + dy, alvo.z + dz) === B.agua)) mundo[I(alvo.x, alvo.y, alvo.z)] = B.agua;
      sujar(alvo.x, alvo.z); mudou = true;
      Motor.ruido({ dur: 0.09, vol: 0.18, freq: alvo.b === B.vidro ? 2600 : 700 });
      return true;
    }
    function colocar(alvo) {
      if (!alvo) return false;
      const x = alvo.x + alvo.n[0], y = alvo.y + alvo.n[1], z = alvo.z + alvo.n[2];
      const b = hotbar[escolhido];
      if (x < 0 || z < 0 || x >= X || z >= Z || y < 1 || y >= Y) return false;
      const atual = pegar(x, y, z);
      if (atual && atual !== B.agua && M.BLOCOS[atual].tipo !== "cruz") return false;
      if (M.BLOCOS[b].tipo === "cruz" && !M.solido(pegar(x, y - 1, z))) return false;
      if (M.solido(b) && x + 1 > jog.x - LARG && x < jog.x + LARG && z + 1 > jog.z - LARG && z < jog.z + LARG && y + 1 > jog.y && y < jog.y + ALT) return false;
      if (bichos.some(a => x + 1 > a.x - 0.45 && x < a.x + 0.45 && z + 1 > a.z - 0.45 && z < a.z + 0.45 && y + 1 > a.y && y < a.y + 1)) return false;
      mundo[I(x, y, z)] = b;
      sujar(x, z); mudou = true;
      Motor.nota(220 + (b % 7) * 30, { dur: 0.07, tipo: "triangle", vol: 0.12 });
      return true;
    }

    // ---------- Bichinhos (só no Novo) ----------
    const bichos = [];
    if (cfg.bichos) {
      const r = M.aleatorio(seed + 7);
      for (let k = 0; k < 8; k++) {
        const x = 4 + Math.floor(r() * (X - 8)), z = 4 + Math.floor(r() * (Z - 8)), h = alturaLivre(x, z);
        if (pegar(x, h - 1, z) !== B.grama) continue;
        bichos.push({ tipo: k % 2 ? "ovelha" : "porco", x: x + 0.5, y: h, z: z + 0.5, yaw: r() * 6.3, vy: 0, anda: 0, pausa: r() * 3, fase: 0, chao: false });
      }
    }
    function moverBichos(dt) {
      bichos.forEach(a => {
        if (a.pausa > 0) { a.pausa -= dt; if (a.pausa <= 0) { a.anda = 1 + Math.random() * 3; a.yaw += (Math.random() - 0.5) * 2.5; } }
        else { a.anda -= dt; if (a.anda <= 0) a.pausa = 1 + Math.random() * 4; }
        const v = a.anda > 0 ? 1.3 : 0;
        const dx = Math.sin(a.yaw) * v * dt, dz = -Math.cos(a.yaw) * v * dt;
        const livre = (x, y, z) => !bate(x, y, z, 0.4, 0.95) && pegar(Math.floor(x), Math.floor(y - 0.5), Math.floor(z)) !== B.agua;
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
          [0, 1, 2, 0, 2, 3].forEach(k => { const [p, q] = uv(t, cs[k][3], cs[k][4]); out.push(cs[k][0], cs[k][1], cs[k][2], p, q, F.luz); });
        });
      };
      bichos.forEach(a => {
        const porco = a.tipo === "porco", pele = porco ? M.T.porcoPele : M.T.la + 4, cara = porco ? M.T.porcoCara : M.T.ovelhaCara;
        const perna = porco ? M.T.porcoPele : M.T.ovelhaPele;
        const balanca = Math.sin(a.fase) * 0.6;
        caixa(a, 0, 0.35, 0, 0.6, 0.45, 0.9, [pele, pele, pele, pele, pele, pele], null, 0);
        caixa(a, 0, 0.5, -0.55, 0.45, 0.42, 0.38, [pele, pele, pele, pele, pele, cara], null, 0);
        [[-0.17, -0.3, 1], [0.17, -0.3, -1], [-0.17, 0.3, -1], [0.17, 0.3, 1]].forEach(([lx, lz, sinal]) =>
          caixa(a, lx, 0, lz, 0.18, 0.36, 0.18, [perna], 0.36, balanca * sinal));
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, bufBichos);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(out), gl.DYNAMIC_DRAW);
      return out.length / 6;
    }
    function bichoNoRaio(o, d, max) {
      let melhor = null;
      bichos.forEach(a => {
        const min = [a.x - 0.45, a.y, a.z - 0.45], mx = [a.x + 0.45, a.y + 1, a.z + 0.45];
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
        [[x0, z0], [x1, z0], [x1, z1], [x0, z0], [x1, z1], [x0, z1]].forEach(([x, z]) => v.push(x, y, z, 0, 0, 1));
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, bufNuvens); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW); nNuvens = v.length / 6;
    }
    const bufExtra = gl.createBuffer();
    function desenharExtra(dados, modo, cor, alfa = 1) {
      gl.bindBuffer(gl.ARRAY_BUFFER, bufExtra);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dados), gl.DYNAMIC_DRAW);
      atributos();
      gl.uniform4fv(U.uCor, cor); gl.uniform1f(U.uAlfa, alfa);
      gl.drawArrays(modo, 0, dados.length / 6);
      gl.uniform4fv(U.uCor, [0, 0, 0, 0]); gl.uniform1f(U.uAlfa, 1);
    }
    const atributos = () => {
      gl.vertexAttribPointer(A.P, 3, gl.FLOAT, false, 24, 0);
      gl.vertexAttribPointer(A.T, 2, gl.FLOAT, false, 24, 12);
      gl.vertexAttribPointer(A.L, 1, gl.FLOAT, false, 24, 20);
    };
    function contorno(x, y, z) {
      const e = 0.003, a = [x - e, y - e, z - e], b = [x + 1 + e, y + 1 + e, z + 1 + e], v = [];
      const P = (i, j, k) => [[a[0], b[0]][i], [a[1], b[1]][j], [a[2], b[2]][k]];
      const ar = [[0, 0, 0, 1, 0, 0], [0, 1, 0, 1, 1, 0], [0, 0, 1, 1, 0, 1], [0, 1, 1, 1, 1, 1], [0, 0, 0, 0, 1, 0], [1, 0, 0, 1, 1, 0], [0, 0, 1, 0, 1, 1], [1, 0, 1, 1, 1, 1], [0, 0, 0, 0, 0, 1], [1, 0, 0, 1, 0, 1], [0, 1, 0, 0, 1, 1], [1, 1, 0, 1, 1, 1]];
      ar.forEach(([i, j, k, l, m, n]) => { v.push(...P(i, j, k), 0, 0, 1, ...P(l, m, n), 0, 0, 1); });
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
      const luz = cfg.diaNoite ? Math.max(0.28, Math.min(1, 0.35 + alto * 1.3)) : 1;
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
          const q = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]].flatMap(([a, b]) => [c[0] - dy * b * tam, c[1] + dx * b * tam, c[2] + a * tam, 0, 0, 1]);
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
        s.className = "mundo-slot" + (i === escolhido ? " ativo" : "");
        s.setAttribute("aria-label", M.BLOCOS[b].nome);
        s.innerHTML = `<img alt="" src="${iconeDe(b)}">`;
        s.addEventListener("pointerdown", e => { e.stopPropagation(); escolhido = i; desenharBarra(); avisar(M.BLOCOS[b].nome); });
        barra.appendChild(s);
      });
    }
    desenharBarra();

    const bVoar = btn("🕊️", "Voar"), bMochila = btn("🎒", "Mochila"), bMenu = btn("⚙️", "Opções");
    topo.append(bMochila, bVoar, bMenu, Motor.botaoSom());
    const bPular = btn("⬆️", "Pular", "grande"), bDescer = btn("⬇️", "Descer");
    botoesDir.append(bDescer, bPular);
    const segurar = (b, liga) => {
      b.addEventListener("pointerdown", e => { e.preventDefault(); e.stopPropagation(); liga(true); b.classList.add("apertado"); try { b.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } });
      ["pointerup", "pointercancel"].forEach(ev => b.addEventListener(ev, () => { liga(false); b.classList.remove("apertado"); }));
    };
    segurar(bPular, v => { ent.pular = v; });
    segurar(bDescer, v => { ent.descer = v; });
    const atualizarVoo = () => { bVoar.classList.toggle("ativo", jog.voando); bDescer.style.visibility = jog.voando ? "visible" : "hidden"; };
    const alternarVoo = () => { jog.voando = !jog.voando; jog.vy = 0; atualizarVoo(); avisar(jog.voando ? "🕊️ Voando! ⬆️ sobe, ⬇️ desce" : "🚶 Andando"); };
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
      cfg.paleta.forEach(b => {
        const s = document.createElement("button");
        s.className = "mundo-slot";
        s.innerHTML = `<img alt="" src="${iconeDe(b)}"><small></small>`;
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
      caixa.append(t, grade, fechar);
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
        pedacos.forEach(p => { p.sujo = true; });
        nascer(); mudou = true; salvar(); caixa.remove();
        Motor.falar("Um mundo novinho!");
      });
      chip("✖️ Fechar", () => caixa.remove());
      caixa.append(t, acoes);
      hud.appendChild(caixa);
    }
    bMenu.addEventListener("click", abrirMenu);

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
        if (passou > 120) {
          const alvo = alvoNoPonto(d.ev);
          alvoTela = alvo && !alvo.bicho ? alvo : null;
          anel.style.left = d.ev.clientX - r.left + "px"; anel.style.top = d.ev.clientY - r.top + "px";
          anel.style.setProperty("--p", Math.min(1, (passou - 120) / (QUEBRA_MS - 120)));
          anel.classList.add("ativo");
        }
        if (passou > QUEBRA_MS) {
          const alvo = alvoNoPonto(d.ev);
          if (alvo && !alvo.bicho) quebrar(alvo);
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
        if (alvo && alvo.bicho) { Motor.falar(alvo.bicho.tipo === "porco" ? "Oinc oinc!" : "Méééé!"); alvo.bicho.vy = 5; }
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
      if (bicho && (!alvo || bicho.t < alvo.t)) { Motor.falar(bicho.a.tipo === "porco" ? "Oinc!" : "Méé!"); return; }
      if (e.button === 0) quebrar(alvo); else if (e.button === 2) colocar(alvo);
    };
    const teclaDesce = e => {
      if (!vivo()) return;
      const k = e.key.toLowerCase();
      if (/^[1-9]$/.test(k)) { escolhido = +k - 1; desenharBarra(); return; }
      if (k === "f") return alternarVoo();
      if (k === "e") return hud.querySelector(".mundo-mochila") ? hud.querySelector(".mundo-mochila").remove() : abrirMochila();
      ent.teclas.add(k);
      if (k === " ") e.preventDefault();
    };
    const teclaSobe = e => ent.teclas.delete(e.key.toLowerCase());
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
        localStorage.setItem(CHAVE, JSON.stringify({ seed, mundo: comprimir(mundo), hotbar, tempoDia, jog: { x: jog.x, y: jog.y, z: jog.z, yaw: jog.yaw, pitch: jog.pitch, voando: jog.voando } }));
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

    // ---------- Laço principal ----------
    let ultimo = performance.now(), relogio = 0, ultimoSalvo = 0;
    function laco(t) {
      if (!vivo()) { encerrar(); return; }
      const dt = Math.min(0.05, (t - ultimo) / 1000);
      ultimo = t; relogio += dt;
      if (!hud.querySelector(".mundo-mochila")) {
        fisica(dt);
        if (cfg.bichos) moverBichos(dt);
        if (cfg.diaNoite) tempoDia = (tempoDia + dt / 480) % 1; // um dia inteiro em 8 minutos
      }
      if (document.pointerLockElement === canvas) { const a = mirar(olho(), direcao()); alvoTela = a; }
      desenhar();
      if (relogio - ultimoSalvo > 20) { ultimoSalvo = relogio; salvar(); }
      requestAnimationFrame(laco);
    }
    requestAnimationFrame(laco);
    Motor.falar(cfg.hd
      ? "Mundo novo! Ande com o joystick, arraste para olhar, toque para colocar um bloco e segure para quebrar."
      : "Mundo clássico! Ande com o joystick, arraste para olhar, toque para colocar um bloco e segure para quebrar.");

    // Gancho para testes automáticos
    if (window.MUNDO_TESTE) window.MUNDO_TESTE = { jog, pegar, mirar, direcao, olho, colocar, quebrar, bichos, salvar, ent, cfg };
  }
})();
