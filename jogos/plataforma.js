// Super Pulo: jogo de plataforma com rolagem lateral. O Pipo corre, pula em cima dos bichos
// bravos, bate nos blocos ❓ por baixo para ganhar moedas e chega até a bandeira.
// Mapas das fases em texto (uma linha por fileira de blocos, 14 fileiras):
//   #  chão          B  tijolo (quebra ao bater por baixo)   ?  bloco de moeda
//   X  pedra         P  cano (2 de largura)                  =  tábua (só pisa por cima)
//   o  moeda         S  começo do herói                      K  ponto seguro (bandeirinha)
//   E  caracol       M  cogumelo bravo                       F  bandeira de chegada
//   e / m  bicho que só aparece no modo normal
//   ~  buraco no modo normal; no modo fácil vira chão
// Física em "blocos por segundo": aceleração, atrito, gravidade, pulo variável (segurar = mais
// alto), coyote time (ainda dá para pular logo depois de sair da beirada) e pulo guardado.
(() => {
  const LINHAS = 14;
  const FASES = [
    {
      nome: "Campo Feliz", icone: "🌳", mapa: [
        "",
        "",
        "",
        "",
        "                                          ?",
        "",
        "                                                              oooo",
        "                             oooo       o o o",
        "             ?B?B?    oo        X       =====             ? ?    X",
        "                               XX                 PP            XX",
        "                      PP      XXX                 PP  oooo     XXX",
        "  S   oooo            PP     XXXX   K             PP          XXXX   F",
        "##########################################################################",
        "##########################################################################",
      ],
    },
    {
      nome: "Vale dos Bichos", icone: "🐌", mapa: [
        "",
        "",
        "",
        "",
        "",
        "",
        "                                                                          oo                oooo",
        "",
        "          ooo   ?B?     ooo                     ooo       B?B?B          X  X         ?        X",
        "                                                ===               oo    XX  XX                XX",
        "                                  PP                                   XXX  XXX              XXX",
        "  S  ooo           E           M  PP   E    K           M    e        XXXX  XXXX K  E   m   XXXX   F",
        "###########~~###########   #####################   ###############~~######  ###########################",
        "###########~~###########   #####################   ###############~~######  ###########################",
      ],
    },
    {
      nome: "Montanha Alta", icone: "⛰️", mapa: [
        "",
        "",
        "                      ?                                    ooooo",
        "                                                           =====                                          ooooo",
        "                                                                                                          =====",
        "                    oooo",
        "                    ====                              ====                                                                                oooo",
        "",
        "                             B?B   oo                                         oo  ???                  X            ?B?                      X",
        "               ====                PP       ooo  BB?B                         PP             ooo      XX                      oo            XX",
        "                                   PP                                   PP    PP             ===     XXX                                   XXX",
        "  S  oooo   E                 M    PP  E  K            E  e         M   PP E  PP      K             XXXX    E     m   e K           M     XXXX   F",
        "################ ~~~~~~~ ###################   ##############~~~###########################       ############################~~######################",
        "################ ~~~~~~~ ###################   ##############~~~###########################       ############################~~######################",
      ],
    },
  ];

  // Física (blocos e segundos)
  const F = {
    corrida: 6.4, acelChao: 40, acelAr: 26, atritoChao: 34, atritoAr: 6,
    pulo: 18.5, gSegura: 38, gSolta: 105, gCai: 60, quedaMax: 19,
    coyote: 0.1, guardado: 0.14, quique: 13, quiqueAlto: 17,
  };
  const SOLIDOS = "#B?XPu";
  const VEL_BICHO = { E: 1.25, M: 2.0 };

  const ler = (k, padrao) => { try { const v = localStorage.getItem(k); return v === null ? padrao : v; } catch (e) { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sem armazenamento */ } };
  const liberadas = () => Math.min(FASES.length, Math.max(1, +ler("plataforma-fase", 1) || 1));
  const estrelasSalvas = () => { try { return JSON.parse(ler("plataforma-estrelas", "{}")) || {}; } catch (e) { return {}; } };

  JOGOS.push({
    id: "plataforma", teclas: true,
    nome: "Super Pulo",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="plat-recorte"><rect x="2" y="2" width="60" height="60" rx="12"/></clipPath></defs><g clip-path="url(#plat-recorte)"><rect x="2" y="2" width="60" height="60" fill="#8fd3ff"/><ellipse cx="18" cy="50" rx="18" ry="10" fill="#6cbf5a"/><rect x="2" y="50" width="60" height="12" rx="0" fill="#b9773c"/><rect x="2" y="50" width="60" height="5" fill="#5cc23f"/><rect x="38" y="16" width="16" height="16" rx="3" fill="#ffc93c" stroke="#9a6b00" stroke-width="2"/><text x="46" y="29" font-size="13" font-weight="bold" text-anchor="middle" fill="#fff" stroke="#9a6b00" stroke-width=".8" font-family="sans-serif">?</text><circle cx="46" cy="8" r="4" fill="#ffd60a" stroke="#c99400" stroke-width="1.5"/><g transform="rotate(-8 20 34)"><rect x="13" y="36" width="5" height="10" rx="2.5" fill="#374a6d" transform="rotate(25 15 37)"/><rect x="21" y="36" width="5" height="10" rx="2.5" fill="#374a6d" transform="rotate(-30 23 37)"/><rect x="12" y="25" width="16" height="14" rx="5" fill="#2a9df4"/><circle cx="20" cy="19" r="8" fill="#f5c193"/><path d="M12 18a8 8 0 0 1 16-1c-4-2-9-2-16 1z" fill="#6b3e1f"/><circle cx="23" cy="19" r="1.6" fill="#222"/><path d="M19 23q3 2 6 0" stroke="#7a3b2e" stroke-width="1.2" fill="none"/></g></g></svg>',
    faixas: ["5-6", "6-8", "8-10"],
    iniciar(area, faixa) {
      const id = (faixa && faixa.id) || "6-8";
      menu(area, id);
    },
  });

  // ---------- Tela de escolha de fase ----------
  function menu(area, faixaId) {
    const chaveModo = "plataforma-modo-" + faixaId;
    let modo = ler(chaveModo, faixaId === "5-6" ? "facil" : "normal");
    area.innerHTML = "";
    const caixa = document.createElement("div");
    caixa.className = "plat-menu";
    const titulo = document.createElement("div");
    titulo.className = "plat-titulo";
    titulo.textContent = "🦘 Super Pulo";
    const chips = document.createElement("div");
    chips.className = "plat-chips";
    const bFacil = document.createElement("button"), bNormal = document.createElement("button");
    bFacil.textContent = "🐢 Fácil";
    bNormal.textContent = "🐇 Normal";
    const marcar = () => { bFacil.className = "chip" + (modo === "facil" ? " ativo" : ""); bNormal.className = "chip" + (modo === "normal" ? " ativo" : ""); };
    bFacil.addEventListener("click", () => { modo = "facil"; gravar(chaveModo, modo); marcar(); Motor.falar("Modo fácil: bichos devagar e menos buracos."); });
    bNormal.addEventListener("click", () => { modo = "normal"; gravar(chaveModo, modo); marcar(); Motor.falar("Modo normal!"); });
    marcar();
    chips.append(bFacil, bNormal);
    const fases = document.createElement("div");
    fases.className = "plat-fases";
    const lib = liberadas(), est = estrelasSalvas();
    FASES.forEach((f, i) => {
      const b = document.createElement("button");
      b.className = "plat-fase" + (i < lib ? "" : " trancada");
      b.innerHTML = `<span class="plat-fase-icone"></span><span class="plat-fase-nome"></span><span class="plat-fase-estrelas"></span>`;
      b.querySelector(".plat-fase-icone").textContent = i < lib ? f.icone : "🔒";
      b.querySelector(".plat-fase-nome").textContent = `Fase ${i + 1}`;
      const e = est[i + 1] || 0;
      b.querySelector(".plat-fase-estrelas").textContent = i < lib ? "⭐".repeat(e) + "☆".repeat(3 - e) : f.nome;
      b.addEventListener("click", () => {
        if (i >= lib) { Motor.animar(b, "balanca"); Motor.falar("Termine a fase anterior para abrir esta!"); return; }
        jogo(area, faixaId, i, modo);
      });
      fases.appendChild(b);
    });
    caixa.append(titulo, chips, fases);
    area.appendChild(caixa);
    Motor.falar("Super Pulo! Escolha uma fase.");
  }

  // ---------- O jogo ----------
  function jogo(area, faixaId, faseIdx, modo) {
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const facil = modo === "facil";

    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "plat-tela";
    area.appendChild(tela);

    const topo = document.createElement("div");
    topo.className = "plat-topo";
    const info = document.createElement("div");
    info.className = "plat-info";
    const pVidas = document.createElement("span"), pMoedas = document.createElement("span"), pTempo = document.createElement("span"), pFase = document.createElement("span");
    info.append(pVidas, pMoedas, pTempo, pFase);
    const pausa = document.createElement("button");
    pausa.className = "chip";
    pausa.addEventListener("click", () => alternarPausa());
    topo.append(info, pausa, Motor.botaoSom());

    const palco = document.createElement("div");
    palco.className = "plat-palco";
    const canvas = document.createElement("canvas");
    canvas.className = "plat-canvas";
    palco.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    // Controles de toque: ⬅️ ➡️ num só "pad" (dá para escorregar o dedo de um lado para o outro)
    const controles = document.createElement("div");
    controles.className = "plat-controles";
    const pad = document.createElement("div");
    pad.className = "plat-pad";
    pad.innerHTML = '<span class="plat-seta" aria-label="Esquerda">⬅️</span><span class="plat-seta" aria-label="Direita">➡️</span>';
    const bPulo = document.createElement("button");
    bPulo.className = "plat-pulo";
    bPulo.innerHTML = "⬆️<small>Pular</small>";
    bPulo.setAttribute("aria-label", "Pular");
    controles.append(pad, bPulo);
    tela.append(topo, palco, controles);

    // ---------- Estado ----------
    let mapa, W, moedas, bichos, marcos, bandeira, particulas, inicio;
    let heroi, vidas, pegas, totalMoedas, tempo, pausado, situacao, timerSit, cam, pontoSeguro, ultimoT, camY;
    let T = 32, vistaL = 10, vistaA = 12, dpr = 1, margemBaixo = 0;
    const entrada = { esq: false, dir: false, pulo: false, guardado: 0 };
    const teclas = { esq: false, dir: false, pulo: false };
    const toquesPad = new Map(), toquesPulo = new Set();

    function montarFase() {
      const linhas = FASES[faseIdx].mapa;
      W = Math.max(...linhas.map(l => l.length)) + 2;
      mapa = Array.from({ length: LINHAS }, (_, y) => Array.from({ length: W }, (_, x) => (linhas[y] || "")[x] || " "));
      moedas = []; bichos = []; marcos = []; particulas = []; bandeira = null;
      for (let y = 0; y < LINHAS; y++) for (let x = 0; x < W; x++) {
        const c = mapa[y][x];
        if (c === "~") { mapa[y][x] = facil ? "#" : " "; continue; }
        if ("#B?XP= ".includes(c)) continue;
        mapa[y][x] = " ";
        if (c === "o") moedas.push({ x: x + 0.5, y: y + 0.5, pega: false });
        else if (c === "S") inicio = { x: x + 0.15, y: y + 1 };
        else if (c === "K") marcos.push({ x, y: y + 1, ativo: false });
        else if (c === "F") bandeira = { x, y: y + 1 };
        else if ("EMem".includes(c)) {
          if (facil && (c === "e" || c === "m")) continue;
          const t = c.toUpperCase();
          bichos.push({ t, x: x + 0.1, y: y + 1 - (t === "E" ? 0.7 : 0.8), w: 0.8, h: t === "E" ? 0.7 : 0.8, vx: -VEL_BICHO[t] * (facil ? 0.55 : 1), vy: 0, vivo: true, morto: 0, ativo: false });
        }
      }
      totalMoedas = moedas.length + mapa.flat().filter(c => c === "?").length;
    }

    function comecarFase() {
      montarFase();
      vidas = 3; pegas = 0; tempo = 0;
      pontoSeguro = { ...inicio };
      novoHeroi();
      situacao = "jogando"; pausado = false;
      tela.querySelector(".plat-fim")?.remove();
      cam = Math.max(0, heroi.x - vistaL * 0.35);
      camY = alvoCamY();
      atualizarInfo();
      ultimoT = performance.now();
      requestAnimationFrame(laco);
      Motor.falar(faseIdx === 0 ? "Fase 1! Corra, pule e pegue as moedas!" : `Fase ${faseIdx + 1}! Pule em cima dos bichos!`);
    }

    function novoHeroi() {
      heroi = { x: pontoSeguro.x, y: pontoSeguro.y - 0.92, w: 0.7, h: 0.92, vx: 0, vy: 0, noChao: false, coyote: 0, pulando: false, dir: 1, passo: 0, invencivel: 1.2 };
    }

    // ---------- Mapa ----------
    const tile = (x, y) => (x < 0 || x >= W ? "#" : y < 0 || y >= LINHAS ? " " : mapa[y][x]);
    const solido = (x, y) => (y >= LINHAS ? false : SOLIDOS.includes(tile(x, y)));

    // Move um corpo com colisão (primeiro na horizontal, depois na vertical). Devolve os choques.
    function mover(c, dt, umaMao = true) {
      const choque = { x: 0, cabeca: null, chao: false };
      // Horizontal
      c.x += c.vx * dt;
      const y0 = Math.floor(c.y + 0.01), y1 = Math.floor(c.y + c.h - 0.01);
      if (c.vx > 0) {
        const tx = Math.floor(c.x + c.w);
        for (let ty = y0; ty <= y1; ty++) if (solido(tx, ty)) { c.x = tx - c.w - 0.0001; choque.x = 1; break; }
      } else if (c.vx < 0) {
        const tx = Math.floor(c.x);
        for (let ty = y0; ty <= y1; ty++) if (solido(tx, ty)) { c.x = tx + 1.0001; choque.x = -1; break; }
      }
      // Vertical
      const baseAntes = c.y + c.h;
      c.y += c.vy * dt;
      const x0 = Math.floor(c.x + 0.01), x1 = Math.floor(c.x + c.w - 0.01);
      if (c.vy > 0) {
        const ty = Math.floor(c.y + c.h);
        for (let tx = x0; tx <= x1; tx++) {
          const t = tile(tx, ty);
          const tabua = umaMao && t === "=" && baseAntes <= ty + 0.02;
          if (solido(tx, ty) || tabua) { c.y = ty - c.h; c.vy = 0; choque.chao = true; break; }
        }
      } else if (c.vy < 0) {
        const ty = Math.floor(c.y);
        const bate = [];
        for (let tx = x0; tx <= x1; tx++) if (solido(tx, ty)) bate.push(tx);
        if (bate.length) {
          // Cantinho: se bateu só de raspão na quina, escorrega para o lado e continua subindo
          if (bate.length === 1 && c === heroi) {
            const tx = bate[0];
            const sobraEsq = c.x + c.w - tx, sobraDir = tx + 1 - c.x;
            if (sobraEsq < 0.24 && !solido(tx - 1, ty)) { c.x = tx - c.w - 0.001; return choque; }
            if (sobraDir < 0.24 && !solido(tx + 1, ty)) { c.x = tx + 1.001; return choque; }
          }
          c.y = ty + 1;
          c.vy = 0;
          // O bloco que bateu é o mais perto do meio da cabeça
          const meio = c.x + c.w / 2;
          choque.cabeca = { x: bate.reduce((a, b) => (Math.abs(b + 0.5 - meio) < Math.abs(a + 0.5 - meio) ? b : a)), y: ty };
        }
      }
      return choque;
    }

    function baterBloco({ x, y }) {
      const t = mapa[y][x];
      if (t === "?") {
        mapa[y][x] = "u";
        pegas++;
        particulas.push({ tipo: "moeda", x: x + 0.5, y: y - 0.3, vy: -9, vida: 0.55 });
        somMoeda();
        atualizarInfo();
      } else if (t === "B") {
        mapa[y][x] = " ";
        for (let i = 0; i < 4; i++) particulas.push({ tipo: "caco", x: x + 0.25 + (i % 2) * 0.5, y: y + 0.25 + Math.floor(i / 2) * 0.5, vx: (i % 2 ? 1 : -1) * (2 + Math.random() * 2), vy: -8 - (i < 2 ? 3 : 0), vida: 1.2, giro: Math.random() * 6 });
        Motor.ruido({ dur: 0.18, vol: 0.25, freq: 900 });
      } else {
        Motor.nota(120, { dur: 0.08, tipo: "square", vol: 0.08 });
      }
      if (t === "B" || t === "?") {
        // Bicho em cima do bloco batido cai fora
        bichos.forEach(b => { if (b.vivo && b.x + b.w > x && b.x < x + 1 && Math.abs(b.y + b.h - y) < 0.1) matarBicho(b, true); });
      }
    }

    const somMoeda = () => { Motor.nota(988, { dur: 0.08, tipo: "square", vol: 0.07 }); Motor.nota(1319, { dur: 0.22, tipo: "square", vol: 0.07, inicio: 0.07 }); };

    function matarBicho(b, virado) {
      b.vivo = false;
      b.morto = virado ? 2 : 0.6;
      b.virado = virado;
      if (virado) { b.vy = -8; b.vx = 1.5; }
      Motor.nota(330, { dur: 0.15, tipo: "square", vol: 0.12, ate: 110 });
    }

    // ---------- Atualização ----------
    function atualizar(dt) {
      tempo += dt;
      const h = heroi;
      const esq = teclas.esq || [...toquesPad.values()].includes(-1);
      const dir = teclas.dir || [...toquesPad.values()].includes(1);
      const segura = teclas.pulo || toquesPulo.size > 0;
      if (situacao === "jogando") {
        const alvo = ((dir ? 1 : 0) - (esq ? 1 : 0)) * F.corrida;
        const aproxima = (v, a, d) => (v < a ? Math.min(a, v + d) : Math.max(a, v - d));
        if (alvo) { h.vx = aproxima(h.vx, alvo, (h.noChao ? F.acelChao * (Math.sign(h.vx) !== Math.sign(alvo) ? 1.6 : 1) : F.acelAr) * dt); h.dir = Math.sign(alvo); }
        else h.vx = aproxima(h.vx, 0, (h.noChao ? F.atritoChao : F.atritoAr) * dt);
        h.coyote = h.noChao ? F.coyote : h.coyote - dt;
        entrada.guardado -= dt;
        if (entrada.guardado > 0 && h.coyote > 0) {
          h.vy = -F.pulo; h.pulando = true; h.noChao = false; h.coyote = 0; entrada.guardado = 0;
          Motor.nota(300, { dur: 0.16, tipo: "square", vol: 0.06, ate: 700 });
        }
        const g = h.vy < 0 ? (segura && h.pulando ? F.gSegura : F.gSolta) : F.gCai;
        h.vy = Math.min(F.quedaMax, h.vy + g * dt);
        if (h.vy >= 0) h.pulando = false;
        // Passos pequenos para não atravessar blocos
        const n = Math.max(1, Math.ceil(Math.max(Math.abs(h.vx), Math.abs(h.vy)) * dt / 0.3));
        h.noChao = false;
        for (let i = 0; i < n; i++) {
          const c = mover(h, dt / n);
          if (c.chao) h.noChao = true;
          if (c.cabeca) { baterBloco(c.cabeca); h.pulando = false; break; }
        }
        if (h.noChao && Math.abs(h.vx) > 0.2) h.passo += Math.abs(h.vx) * dt * 2.2;
        else if (h.noChao) h.passo = 0;
        if (h.invencivel > 0) h.invencivel -= dt;

        // Moedas
        moedas.forEach(m => {
          if (!m.pega && Math.abs(m.x - (h.x + h.w / 2)) < 0.6 && Math.abs(m.y - (h.y + h.h / 2)) < 0.75) {
            m.pega = true; pegas++; somMoeda(); atualizarInfo();
            particulas.push({ tipo: "brilho", x: m.x, y: m.y, vida: 0.35 });
          }
        });
        // Pontos seguros
        marcos.forEach(k => {
          if (!k.ativo && h.x + h.w / 2 > k.x + 0.3) {
            k.ativo = true; pontoSeguro = { x: k.x + 0.15, y: k.y };
            [660, 880].forEach((f, i) => Motor.nota(f, { dur: 0.15, tipo: "triangle", vol: 0.15, inicio: i * 0.08 }));
          }
        });
        // Bandeira
        if (bandeira && h.x + h.w > bandeira.x + 0.35) vencer();
        // Buraco
        else if (h.y > LINHAS + 0.5) perderVida(true);
      } else if (situacao === "morrendo") {
        h.vy = Math.min(F.quedaMax, h.vy + F.gCai * 0.7 * dt);
        h.y += h.vy * dt;
        timerSit -= dt;
        if (timerSit <= 0) depoisDeMorrer();
      } else if (situacao === "vitoria") {
        timerSit -= dt;
        const chao = bandeira.y - h.h;
        if (h.y < chao) { h.y = Math.min(chao, h.y + 6 * dt); h.vx = 0; }
        else { h.vx = 3; h.x += h.vx * dt; h.passo += 3 * dt * 2.2; h.noChao = true; h.dir = 1; }
        if (timerSit <= 0 && !tela.querySelector(".plat-fim")) telaVitoria();
      }

      // Bichos
      bichos.forEach(b => {
        if (!b.vivo) {
          b.morto -= dt;
          if (b.virado) { b.vy += F.gCai * dt; b.y += b.vy * dt; b.x += b.vx * dt; }
          return;
        }
        if (!b.ativo) { if (b.x < cam + vistaL + 2) b.ativo = true; else return; }
        b.vy = Math.min(F.quedaMax, b.vy + F.gCai * dt);
        const antes = b.vx;
        const c = mover(b, dt, true);
        if (c.x) b.vx = -antes;
        // Vira na beirada para não cair no buraco
        const noChao = c.chao;
        if (noChao) {
          const frente = b.vx > 0 ? Math.floor(b.x + b.w + 0.05) : Math.floor(b.x - 0.05);
          const pe = Math.floor(b.y + b.h + 0.1);
          if (!solido(frente, pe) && tile(frente, pe) !== "=") b.vx = -b.vx;
        }
        b.passo = (b.passo || 0) + dt * 6;
        if (b.y > LINHAS + 1) b.vivo = false;
        // Encostou no herói?
        if (situacao !== "jogando") return;
        if (h.x + h.w > b.x + 0.08 && h.x < b.x + b.w - 0.08 && h.y + h.h > b.y + 0.05 && h.y < b.y + b.h) {
          const pisou = h.vy > 0 && h.y + h.h - b.y < 0.55;
          if (pisou) {
            matarBicho(b, false);
            h.y = b.y - h.h;
            h.vy = -(segura ? F.quiqueAlto : F.quique);
            h.pulando = segura;
            particulas.push({ tipo: "estrela", x: b.x + b.w / 2, y: b.y, vida: 0.4 });
          } else if (h.invencivel <= 0) perderVida(false);
        }
      });
      bichos = bichos.filter(b => b.vivo || b.morto > 0);

      // Partículas
      particulas.forEach(p => {
        p.vida -= dt;
        if (p.vy !== undefined) { p.vy += (p.tipo === "moeda" ? 22 : F.gCai) * dt; p.y += p.vy * dt; }
        if (p.vx !== undefined) p.x += p.vx * dt;
      });
      particulas = particulas.filter(p => p.vida > 0);

      // Câmera: o herói fica um pouco à esquerda do meio
      const alvoCam = Math.min(Math.max(0, W - vistaL), Math.max(0, h.x + h.w / 2 - vistaL * 0.4));
      cam += (alvoCam - cam) * Math.min(1, dt * 8);
      const alvoY = alvoCamY();
      camY = camY === null || vistaA >= LINHAS ? alvoY : camY + (alvoY - camY) * Math.min(1, dt * 5);
    }

    // Altura da câmera. Deitado, os botões ficam por cima do jogo: a câmera desce um pouco
    // (mostrando terra embaixo do mapa) para o chão aparecer acima dos botões.
    function alvoCamY() {
      if (vistaA >= LINHAS) return LINHAS - vistaA;
      const h = heroi;
      return Math.min(LINHAS - vistaA + margemBaixo, Math.max(-1, h.y + h.h / 2 - vistaA * 0.55));
    }

    function perderVida(caiu) {
      if (situacao !== "jogando") return;
      situacao = "morrendo";
      timerSit = caiu ? 1.0 : 1.3;
      heroi.vx = 0;
      heroi.vy = caiu ? 0 : -12;
      [523, 392, 262].forEach((f, i) => Motor.nota(f, { dur: 0.18, tipo: "triangle", vol: 0.2, inicio: i * 0.12 }));
      vidas--;
      atualizarInfo();
      Motor.falar(vidas > 0 ? "Ops!" : "Ops! Vamos começar de novo!");
    }

    function depoisDeMorrer() {
      if (vidas > 0) {
        novoHeroi();
        heroi.invencivel = 1.6;
        situacao = "jogando";
        cam = Math.max(0, heroi.x - vistaL * 0.4);
        camY = alvoCamY();
      } else {
        // Acabaram as vidas: a fase recomeça do zero
        comecarFaseSilencio();
      }
    }
    function comecarFaseSilencio() {
      montarFase();
      vidas = 3; pegas = 0; tempo = 0;
      pontoSeguro = { ...inicio };
      novoHeroi();
      situacao = "jogando";
      cam = 0; camY = alvoCamY();
      atualizarInfo();
    }

    function vencer() {
      situacao = "vitoria";
      timerSit = 1.6;
      heroi.vx = 0; heroi.vy = 0;
      heroi.x = bandeira.x + 0.35 - heroi.w;
      [523, 659, 784, 1047].forEach((f, i) => Motor.nota(f, { dur: 0.25, tipo: "triangle", vol: 0.2, inicio: i * 0.12 }));
    }

    function estrelasDaFase() {
      const p = totalMoedas ? pegas / totalMoedas : 1;
      return p >= 0.9 ? 3 : p >= 0.5 ? 2 : 1;
    }

    function telaVitoria() {
      const estrelas = estrelasDaFase();
      if (liberadas() < faseIdx + 2) gravar("plataforma-fase", Math.min(FASES.length, faseIdx + 2));
      const est = estrelasSalvas();
      if ((est[faseIdx + 1] || 0) < estrelas) { est[faseIdx + 1] = estrelas; gravar("plataforma-estrelas", JSON.stringify(est)); }
      const caixa = document.createElement("div");
      caixa.className = "plat-fim";
      caixa.innerHTML = '<div class="plat-fim-titulo"></div><div class="plat-fim-estrelas"></div><div class="plat-fim-dados"></div><div class="plat-fim-botoes"></div>';
      caixa.querySelector(".plat-fim-titulo").textContent = `🏁 Fase ${faseIdx + 1} completa!`;
      caixa.querySelector(".plat-fim-estrelas").textContent = "⭐".repeat(estrelas) + "☆".repeat(3 - estrelas);
      caixa.querySelector(".plat-fim-dados").textContent = `🪙 ${pegas} de ${totalMoedas} · ⏱️ ${relogio(tempo)}`;
      const botoes = caixa.querySelector(".plat-fim-botoes");
      const botao = (txt, cls, fn) => { const b = document.createElement("button"); b.className = "chip " + cls; b.textContent = txt; b.addEventListener("click", fn); botoes.appendChild(b); };
      const ultima = faseIdx === FASES.length - 1;
      if (!ultima) botao("➡️ Próxima fase", "executar", () => jogo(area, faixaId, faseIdx + 1, modo));
      botao("🔁 Jogar de novo", ultima ? "executar" : "", () => jogo(area, faixaId, faseIdx, modo));
      botao("🗺️ Fases", "", () => menu(area, faixaId));
      tela.appendChild(caixa);
      Motor.comemorar(caixa);
      Motor.tim();
      const fala = ultima ? `Você chegou ao fim de todas as fases! ${estrelas} estrelas!` : `Chegou na bandeira! ${estrelas === 3 ? "Três estrelas!" : estrelas === 2 ? "Duas estrelas!" : "Uma estrela!"}`;
      Motor.falar(fala);
    }

    const relogio = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    let ultimoSeg = -1;
    function atualizarInfo() {
      pVidas.textContent = "❤️".repeat(Math.max(0, vidas)) + "🤍".repeat(3 - Math.max(0, vidas));
      pMoedas.textContent = `🪙 ${pegas}/${totalMoedas}`;
      pTempo.textContent = `⏱️ ${relogio(tempo)}`;
      pFase.textContent = `Fase ${faseIdx + 1}`;
      pausa.textContent = pausado ? "▶️" : "⏸️";
      pausa.setAttribute("aria-label", pausado ? "Continuar" : "Pausar");
    }

    function alternarPausa(forcar) {
      if (situacao !== "jogando" && situacao !== "morrendo") return;
      const novo = forcar === undefined ? !pausado : forcar;
      if (novo === pausado) return;
      pausado = novo;
      atualizarInfo();
      if (!pausado) { ultimoT = performance.now(); requestAnimationFrame(laco); } else desenhar();
    }

    // ---------- Laço ----------
    function laco(t) {
      if (!vivo()) { limpar(); return; }
      if (pausado) return;
      const dt = Math.min(1 / 30, Math.max(0, (t - ultimoT) / 1000));
      ultimoT = t;
      atualizar(dt);
      if (Math.floor(tempo) !== ultimoSeg) { ultimoSeg = Math.floor(tempo); atualizarInfo(); }
      desenhar();
      requestAnimationFrame(laco);
    }

    // ---------- Desenho ----------
    const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };

    function desenhar() {
      const L = canvas.width / dpr, A = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ox = -cam * T, oy = -camY * T; // deslocamento do mundo
      // Céu
      const ceu = ctx.createLinearGradient(0, 0, 0, A);
      ceu.addColorStop(0, "#5fb8f5");
      ceu.addColorStop(1, "#d6f1ff");
      ctx.fillStyle = ceu;
      ctx.fillRect(0, 0, L, A);
      // Sol
      ctx.fillStyle = "rgba(255,230,120,.9)";
      ctx.beginPath(); ctx.arc(L - T * 1.6, T * 1.4 + oy * 0.05, T * 0.8, 0, 7); ctx.fill();
      // Nuvens (bem devagar)
      const chaoY = LINHAS * T - 2 * T + oy; // linha do chão na tela
      const passoN = T * 6, deslN = cam * T * 0.15, i0 = Math.floor(deslN / passoN) - 1;
      for (let i = i0; i < i0 + L / passoN + 3; i++) {
        const sem = Math.abs(Math.sin((i + 1) * 12.9898));
        nuvem(i * passoN - deslN + sem * T * 2, T * (1 + sem * 2.2) + oy * 0.2, T * (0.6 + sem * 0.4));
      }
      // Morros longe e perto (paralaxe)
      morros(cam * T * 0.3, chaoY, T * 4.5, T * 9, "#9bd88b", 1.7);
      morros(cam * T * 0.55, chaoY, T * 2.6, T * 6, "#6cc45a", 3.1);

      // Terra embaixo do mapa (aparece quando deitado), com os buracos continuando
      if (A > oy + LINHAS * T) {
        for (let x = Math.max(0, Math.floor(cam) - 1); x <= Math.min(W - 1, Math.ceil(cam + vistaL) + 1); x++) {
          if (mapa[LINHAS - 1][x] !== "#") continue;
          ctx.fillStyle = "#a8692f"; ctx.fillRect(ox + x * T, oy + LINHAS * T, T + 0.5, A);
        }
      }
      // Blocos visíveis
      const c0 = Math.max(0, Math.floor(cam) - 1), c1 = Math.min(W - 1, Math.ceil(cam + vistaL) + 1);
      for (let y = 0; y < LINHAS; y++) for (let x = c0; x <= c1; x++) {
        const t = mapa[y][x];
        if (t !== " ") desenharBloco(t, x, y, ox + x * T, oy + y * T);
      }
      // Pontos seguros
      marcos.forEach(k => {
        const px = ox + k.x * T + T * 0.45, py = oy + k.y * T;
        ctx.fillStyle = "#7a7a7a"; ctx.fillRect(px, py - T * 1.6, T * 0.1, T * 1.6);
        ctx.fillStyle = k.ativo ? "#2a9d55" : "#c9c9c9";
        ctx.beginPath(); ctx.moveTo(px + T * 0.1, py - T * 1.6); ctx.lineTo(px + T * 0.75, py - T * 1.35); ctx.lineTo(px + T * 0.1, py - T * 1.1); ctx.fill();
      });
      // Bandeira de chegada
      if (bandeira) {
        const px = ox + bandeira.x * T + T * 0.45, py = oy + bandeira.y * T, alto = T * 7.5;
        ctx.fillStyle = "#e8e8e8"; ctx.fillRect(px - T * 0.06, py - alto, T * 0.12, alto);
        ctx.fillStyle = "#ffd60a"; ctx.beginPath(); ctx.arc(px, py - alto, T * 0.2, 0, 7); ctx.fill();
        // Pano xadrez balançando
        const q = T * 0.28, onda = Math.sin(performance.now() / 200) * T * 0.08;
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
          ctx.fillStyle = (i + j) % 2 ? "#222" : "#fff";
          ctx.fillRect(px + T * 0.06 + i * q, py - alto + T * 0.2 + j * q + (i % 2 ? onda : -onda) * (i / 3), q + 0.5, q + 0.5);
        }
        ctx.fillStyle = "#8a8a8a"; rr(px - T * 0.4, py - T * 0.4, T * 0.8, T * 0.4, 3); ctx.fill();
      }
      // Moedas
      const giro = performance.now() / 220;
      moedas.forEach(m => { if (!m.pega) moeda(ox + m.x * T, oy + m.y * T, Math.abs(Math.cos(giro + m.x * 0.4))); });
      // Bichos
      bichos.forEach(b => desenharBicho(b, ox, oy));
      // Partículas
      particulas.forEach(p => {
        const px = ox + p.x * T, py = oy + p.y * T;
        if (p.tipo === "moeda") moeda(px, py, Math.abs(Math.cos(p.vida * 20)));
        else if (p.tipo === "caco") { ctx.save(); ctx.translate(px, py); ctx.rotate(p.vida * 8 + p.giro); ctx.fillStyle = "#d9733b"; ctx.fillRect(-T * 0.18, -T * 0.18, T * 0.36, T * 0.36); ctx.strokeStyle = "#8a3f1c"; ctx.strokeRect(-T * 0.18, -T * 0.18, T * 0.36, T * 0.36); ctx.restore(); }
        else if (p.tipo === "brilho" || p.tipo === "estrela") {
          ctx.globalAlpha = Math.max(0, p.vida / 0.4);
          ctx.font = `${T * 0.6}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(p.tipo === "brilho" ? "✨" : "💥", px, py - (0.4 - p.vida) * T);
          ctx.globalAlpha = 1;
        }
      });
      // Herói
      desenharHeroi(ox, oy);

      if (pausado) {
        ctx.fillStyle = "rgba(0,0,0,.45)";
        ctx.fillRect(0, 0, L, A);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.min(L / 8, 48)}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("⏸️ Pausa", L / 2, A / 2);
      }
    }

    function nuvem(x, y, r) {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7); ctx.arc(x + r * 1.1, y - r * 0.4, r * 1.15, 0, 7); ctx.arc(x + r * 2.2, y, r * 0.9, 0, 7);
      ctx.fill();
      ctx.fillRect(x, y, r * 2.2, r * 0.9);
    }

    function morros(desloc, chaoY, alt, larg, cor, semente) {
      const L = canvas.width / dpr;
      ctx.fillStyle = cor;
      const i0 = Math.floor(desloc / larg) - 1;
      for (let i = i0; i < i0 + L / larg + 3; i++) {
        const h = alt * (0.6 + 0.4 * Math.abs(Math.sin(i * semente)));
        const x = i * larg - desloc;
        ctx.beginPath();
        ctx.ellipse(x + larg / 2, chaoY, larg * 0.62, h, 0, Math.PI, 0);
        ctx.fill();
      }
      ctx.fillRect(0, chaoY - 1, L, canvas.height);
    }

    function moeda(x, y, larg) {
      const r = T * 0.3;
      ctx.fillStyle = "#c99400";
      ctx.beginPath(); ctx.ellipse(x, y, Math.max(1.5, r * larg), r, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#ffd60a";
      ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, r * 0.78 * larg), r * 0.78, 0, 0, 7); ctx.fill();
      if (larg > 0.4) { ctx.fillStyle = "#fff6b0"; ctx.fillRect(x - r * 0.12 * larg, y - r * 0.5, r * 0.24 * larg, r); }
    }

    function desenharBloco(t, x, y, px, py) {
      const s = T;
      if (t === "#") {
        const topo = tile(x, y - 1) !== "#";
        ctx.fillStyle = "#b9773c"; ctx.fillRect(px, py, s + 0.5, s + 0.5);
        ctx.fillStyle = "#9c5f2b";
        ctx.fillRect(px + s * 0.2, py + s * 0.55, s * 0.12, s * 0.12);
        ctx.fillRect(px + s * 0.65, py + s * 0.3 + (topo ? s * 0.25 : 0), s * 0.12, s * 0.12);
        if (topo) {
          ctx.fillStyle = "#5cc23f"; ctx.fillRect(px, py, s + 0.5, s * 0.3);
          ctx.fillStyle = "#86dc5c"; ctx.fillRect(px, py, s + 0.5, s * 0.1);
          ctx.fillStyle = "#5cc23f";
          for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(px + s * (0.17 + i * 0.33), py + s * 0.3, s * 0.12, 0, Math.PI); ctx.fill(); }
        }
      } else if (t === "B") {
        ctx.fillStyle = "#d9733b"; ctx.fillRect(px, py, s, s);
        ctx.strokeStyle = "#8a3f1c"; ctx.lineWidth = Math.max(1, s * 0.06);
        ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
        ctx.beginPath();
        ctx.moveTo(px, py + s / 2); ctx.lineTo(px + s, py + s / 2);
        ctx.moveTo(px + s / 2, py); ctx.lineTo(px + s / 2, py + s / 2);
        ctx.moveTo(px + s / 4, py + s / 2); ctx.lineTo(px + s / 4, py + s);
        ctx.moveTo(px + s * 0.75, py + s / 2); ctx.lineTo(px + s * 0.75, py + s);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(px + s * 0.08, py + s * 0.08, s * 0.84, s * 0.08);
      } else if (t === "?" || t === "u" || t === "X") {
        const cor = t === "?" ? "#ffc93c" : t === "u" ? "#b08458" : "#9aa5b1";
        const borda = t === "?" ? "#9a6b00" : t === "u" ? "#6e4e2e" : "#5f6b77";
        rr(px + s * 0.03, py + s * 0.03, s * 0.94, s * 0.94, s * 0.14); ctx.fillStyle = borda; ctx.fill();
        rr(px + s * 0.1, py + s * 0.1, s * 0.8, s * 0.8, s * 0.1); ctx.fillStyle = cor; ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(px + s * 0.16, py + s * 0.14, s * 0.68, s * 0.1);
        if (t === "?") {
          const pulsa = 0.8 + 0.2 * Math.sin(performance.now() / 180);
          ctx.font = `bold ${s * 0.62}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillStyle = "#9a6b00"; ctx.fillText("?", px + s / 2 + s * 0.04, py + s * 0.56 + s * 0.04);
          ctx.fillStyle = `rgba(255,255,255,${pulsa})`; ctx.fillText("?", px + s / 2, py + s * 0.56);
        } else if (t === "X") {
          ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(px + s * 0.1, py + s * 0.8, s * 0.8, s * 0.1);
        }
      } else if (t === "P") {
        const topoCano = tile(x, y - 1) !== "P";
        const esquerda = tile(x - 1, y) !== "P";
        const bx = esquerda ? px + s * 0.12 : px, bw = s * 0.88;
        ctx.fillStyle = "#2f9e44"; ctx.fillRect(bx, py, bw, s + 0.5);
        ctx.fillStyle = "rgba(255,255,255,.3)"; if (esquerda) ctx.fillRect(bx + s * 0.15, py, s * 0.15, s + 0.5);
        ctx.fillStyle = "rgba(0,0,0,.18)"; if (!esquerda) ctx.fillRect(bx + bw - s * 0.25, py, s * 0.18, s + 0.5);
        if (topoCano) {
          const lx = esquerda ? px : px, lw = s;
          ctx.fillStyle = "#1f7a33"; ctx.fillRect(lx, py, lw, s * 0.45);
          ctx.fillStyle = "#3bc25a"; ctx.fillRect(lx, py + s * 0.05, lw, s * 0.32);
          ctx.fillStyle = "rgba(255,255,255,.35)"; if (esquerda) ctx.fillRect(lx + s * 0.12, py + s * 0.08, s * 0.14, s * 0.26);
        }
      } else if (t === "=") {
        rr(px, py, s, s * 0.32, s * 0.08); ctx.fillStyle = "#8a5a2b"; ctx.fill();
        rr(px + 1, py + 1, s - 2, s * 0.22, s * 0.06); ctx.fillStyle = "#c58b4f"; ctx.fill();
        ctx.fillStyle = "#8a5a2b"; ctx.fillRect(px + s * 0.45, py + s * 0.06, s * 0.06, s * 0.14);
      }
    }

    function desenharBicho(b, ox, oy) {
      const px = ox + b.x * T, py = oy + b.y * T, w = b.w * T, h = b.h * T;
      ctx.save();
      if (!b.vivo && !b.virado) { // amassado
        ctx.translate(px + w / 2, py + h);
        ctx.scale(1.2, 0.35);
        ctx.translate(-(px + w / 2), -(py + h));
      }
      if (b.virado) { ctx.translate(px + w / 2, py + h / 2); ctx.scale(1, -1); ctx.translate(-(px + w / 2), -(py + h / 2)); }
      const olhaDir = b.vx > 0;
      if (b.t === "E") {
        // Caracol: corpo, casca em espiral e anteninhas
        const balanco = Math.sin(b.passo || 0) * T * 0.03;
        ctx.fillStyle = "#b5d86b";
        rr(px, py + h * 0.62, w, h * 0.38, h * 0.18); ctx.fill();
        const cabX = olhaDir ? px + w * 0.88 : px + w * 0.12;
        ctx.strokeStyle = "#7da53a"; ctx.lineWidth = Math.max(1.5, T * 0.05);
        ctx.beginPath();
        ctx.moveTo(cabX, py + h * 0.7); ctx.lineTo(cabX + (olhaDir ? 1 : -1) * w * 0.05, py + h * 0.2 + balanco);
        ctx.moveTo(cabX, py + h * 0.7); ctx.lineTo(cabX + (olhaDir ? -1 : 1) * w * 0.12, py + h * 0.25 - balanco);
        ctx.stroke();
        ctx.fillStyle = "#222";
        ctx.beginPath(); ctx.arc(cabX + (olhaDir ? 1 : -1) * w * 0.05, py + h * 0.2 + balanco, T * 0.06, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(cabX + (olhaDir ? -1 : 1) * w * 0.12, py + h * 0.25 - balanco, T * 0.06, 0, 7); ctx.fill();
        // Casca
        const cx = px + w * (olhaDir ? 0.4 : 0.6), cy = py + h * 0.5, r = h * 0.42;
        ctx.fillStyle = "#e07a2f"; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
        ctx.strokeStyle = "#8a3f1c"; ctx.lineWidth = Math.max(1.5, T * 0.05);
        ctx.beginPath();
        for (let a = 0; a < 10; a += 0.2) { const rr2 = r * 0.85 * (1 - a / 11); const xx = cx + Math.cos(a) * rr2, yy = cy + Math.sin(a) * rr2; a === 0 ? ctx.moveTo(xx, yy) : ctx.lineTo(xx, yy); }
        ctx.stroke();
        // Sobrancelha brava no corpo
        ctx.fillStyle = "#222";
        ctx.beginPath(); ctx.arc(cabX + (olhaDir ? w * 0.02 : -w * 0.02), py + h * 0.8, T * 0.04, 0, 7); ctx.fill();
      } else {
        // Cogumelo bravo: chapéu roxo com bolinhas, pezinhos andando
        const p = Math.sin(b.passo || 0) * w * 0.12;
        ctx.fillStyle = "#4a2c1a";
        rr(px + w * 0.15 + p, py + h * 0.82, w * 0.3, h * 0.18, h * 0.08); ctx.fill();
        rr(px + w * 0.55 - p, py + h * 0.82, w * 0.3, h * 0.18, h * 0.08); ctx.fill();
        ctx.fillStyle = "#f3dfc1";
        rr(px + w * 0.2, py + h * 0.42, w * 0.6, h * 0.45, w * 0.15); ctx.fill();
        ctx.fillStyle = "#8e44ad";
        ctx.beginPath(); ctx.ellipse(px + w / 2, py + h * 0.48, w * 0.55, h * 0.48, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#fff";
        [[0.3, 0.25, 0.09], [0.62, 0.18, 0.11], [0.82, 0.36, 0.07]].forEach(([a, c, r]) => { ctx.beginPath(); ctx.arc(px + w * a, py + h * c, w * r, 0, 7); ctx.fill(); });
        // Olhos bravos
        const ex = olhaDir ? w * 0.06 : -w * 0.06;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.ellipse(px + w * 0.38 + ex, py + h * 0.6, w * 0.08, h * 0.1, 0, 0, 7); ctx.ellipse(px + w * 0.62 + ex, py + h * 0.6, w * 0.08, h * 0.1, 0, 0, 7); ctx.fill();
        ctx.fillStyle = "#222";
        ctx.beginPath(); ctx.arc(px + w * 0.39 + ex * 1.4, py + h * 0.62, w * 0.04, 0, 7); ctx.arc(px + w * 0.63 + ex * 1.4, py + h * 0.62, w * 0.04, 0, 7); ctx.fill();
        ctx.strokeStyle = "#222"; ctx.lineWidth = Math.max(1.5, T * 0.05);
        ctx.beginPath();
        ctx.moveTo(px + w * 0.28 + ex, py + h * 0.47); ctx.lineTo(px + w * 0.46 + ex, py + h * 0.53);
        ctx.moveTo(px + w * 0.72 + ex, py + h * 0.47); ctx.lineTo(px + w * 0.54 + ex, py + h * 0.53);
        ctx.stroke();
      }
      ctx.restore();
    }

    function desenharHeroi(ox, oy) {
      const h = heroi;
      if (h.invencivel > 0 && situacao === "jogando" && Math.floor(h.invencivel * 10) % 2) return; // piscando
      const cx = ox + (h.x + h.w / 2) * T, base = oy + (h.y + h.h) * T, s = T;
      ctx.save();
      ctx.translate(cx, base);
      ctx.scale(h.dir < 0 ? -1 : 1, 1);
      if (situacao === "morrendo") ctx.rotate(Math.sin(performance.now() / 60) * 0.3);
      const noAr = !h.noChao && situacao !== "vitoria";
      const ang = noAr ? 0.7 : Math.sin(h.passo * Math.PI) * 0.7;
      const quadril = -s * 0.3;
      // Pernas
      const perna = (a, cor) => {
        ctx.save(); ctx.translate(0, quadril); ctx.rotate(a);
        ctx.fillStyle = cor; rr(-s * 0.08, 0, s * 0.16, s * 0.26, s * 0.07); ctx.fill();
        ctx.fillStyle = "#e63946"; rr(-s * 0.09, s * 0.2, s * 0.24, s * 0.1, s * 0.05); ctx.fill(); // tênis
        ctx.restore();
      };
      perna(-ang, "#2b3a67");
      // Braço de trás
      const braco = (a, cor) => {
        ctx.save(); ctx.translate(0, -s * 0.55); ctx.rotate(a);
        ctx.fillStyle = cor; rr(-s * 0.06, 0, s * 0.12, s * 0.26, s * 0.06); ctx.fill();
        ctx.fillStyle = "#f5c193"; ctx.beginPath(); ctx.arc(0, s * 0.27, s * 0.07, 0, 7); ctx.fill();
        ctx.restore();
      };
      braco(noAr ? -2.4 : ang * 0.8, "#1d7fc9");
      perna(ang, "#374a6d");
      // Corpo (blusa azul com estrela)
      ctx.fillStyle = "#2a9df4"; rr(-s * 0.2, -s * 0.62, s * 0.4, s * 0.36, s * 0.12); ctx.fill();
      ctx.fillStyle = "#ffd60a"; ctx.font = `${s * 0.2}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("★", s * 0.02, -s * 0.44);
      // Cabeça
      ctx.fillStyle = "#f5c193"; ctx.beginPath(); ctx.arc(0, -s * 0.8, s * 0.22, 0, 7); ctx.fill();
      // Cabelo com topete
      ctx.fillStyle = "#6b3e1f";
      ctx.beginPath(); ctx.arc(-s * 0.02, -s * 0.84, s * 0.22, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-s * 0.05, -s * 1.04); ctx.quadraticCurveTo(s * 0.05, -s * 1.16, s * 0.12, -s * 1.04); ctx.fill();
      ctx.beginPath(); ctx.arc(-s * 0.17, -s * 0.8, s * 0.08, 0, 7); ctx.fill();
      // Olho, bochecha e sorriso (olhando para a frente)
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(s * 0.09, -s * 0.82, s * 0.06, s * 0.075, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(s * 0.115, -s * 0.81, s * 0.035, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,120,120,.5)"; ctx.beginPath(); ctx.arc(s * 0.05, -s * 0.7, s * 0.045, 0, 7); ctx.fill();
      ctx.strokeStyle = "#7a3b2e"; ctx.lineWidth = Math.max(1, s * 0.035);
      ctx.beginPath();
      if (situacao === "morrendo") ctx.arc(s * 0.12, -s * 0.66, s * 0.05, Math.PI * 1.1, Math.PI * 1.9);
      else ctx.arc(s * 0.11, -s * 0.73, s * 0.07, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      // Braço da frente
      braco(noAr ? -2.6 : -ang * 0.8, "#2a9df4");
      ctx.restore();
    }

    // ---------- Tamanho e layout ----------
    let deitado = null;
    function ajustar() {
      if (!vivo()) return;
      const agoraDeitado = tela.clientWidth > tela.clientHeight;
      if (agoraDeitado !== deitado) { deitado = agoraDeitado; tela.classList.toggle("deitado", deitado); }
      const L = palco.clientWidth, A = palco.clientHeight;
      if (!L || !A) return;
      T = Math.max(18, Math.floor(deitado ? Math.min(A / 10.5, L / 16) : Math.min(A / 13, L / 9.5)));
      dpr = Math.min(3, window.devicePixelRatio || 1);
      Object.assign(canvas, { width: Math.round(L * dpr), height: Math.round(A * dpr) });
      Object.assign(canvas.style, { width: L + "px", height: A + "px" });
      vistaL = L / T; vistaA = A / T;
      margemBaixo = deitado ? (controles.offsetHeight + 6) / T : 0;
      camY = null;
      if (heroi) { camY = alvoCamY(); desenhar(); }
    }
    const aoRedimensionar = () => { if (!vivo()) return limpar(); ajustar(); };

    // ---------- Controles ----------
    const ladoPad = e => { const r = pad.getBoundingClientRect(); return e.clientX < r.left + r.width / 2 ? -1 : 1; };
    const pintarPad = () => { const v = [...toquesPad.values()]; pad.children[0].classList.toggle("apertado", v.includes(-1)); pad.children[1].classList.toggle("apertado", v.includes(1)); };
    pad.addEventListener("pointerdown", e => { e.preventDefault(); try { pad.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } toquesPad.set(e.pointerId, ladoPad(e)); pintarPad(); });
    pad.addEventListener("pointermove", e => { if (toquesPad.has(e.pointerId)) { toquesPad.set(e.pointerId, ladoPad(e)); pintarPad(); } });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => pad.addEventListener(ev, e => { toquesPad.delete(e.pointerId); pintarPad(); }));
    bPulo.addEventListener("pointerdown", e => {
      e.preventDefault();
      try { bPulo.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      toquesPulo.add(e.pointerId); entrada.guardado = F.guardado; bPulo.classList.add("apertado");
      if (pausado) alternarPausa(false);
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(ev => bPulo.addEventListener(ev, e => { toquesPulo.delete(e.pointerId); bPulo.classList.toggle("apertado", toquesPulo.size > 0); }));
    [pad, bPulo, canvas].forEach(el => el.addEventListener("contextmenu", e => e.preventDefault()));

    const MAPA_TECLAS = { ArrowLeft: "esq", a: "esq", A: "esq", ArrowRight: "dir", d: "dir", D: "dir", ArrowUp: "pulo", w: "pulo", W: "pulo", " ": "pulo", Enter: "pulo" };
    const aoApertar = e => {
      if (!vivo()) return limpar();
      const k = MAPA_TECLAS[e.key];
      if (e.key === "p" || e.key === "P" || e.key === "Escape") { alternarPausa(); return; }
      if (!k) return;
      e.preventDefault();
      if (k === "pulo" && !e.repeat) { entrada.guardado = F.guardado; if (pausado) alternarPausa(false); }
      teclas[k] = true;
    };
    const aoSoltar = e => { const k = MAPA_TECLAS[e.key]; if (k) teclas[k] = false; };
    const aoSair = () => { teclas.esq = teclas.dir = teclas.pulo = false; toquesPad.clear(); toquesPulo.clear(); pintarPad(); };
    const aoEsconder = () => { if (!vivo()) return limpar(); if (document.hidden) { aoSair(); alternarPausa(true); } };
    document.addEventListener("keydown", aoApertar);
    document.addEventListener("keyup", aoSoltar);
    window.addEventListener("blur", aoSair);
    window.addEventListener("resize", aoRedimensionar);
    document.addEventListener("visibilitychange", aoEsconder);
    function limpar() {
      document.removeEventListener("keydown", aoApertar);
      document.removeEventListener("keyup", aoSoltar);
      window.removeEventListener("blur", aoSair);
      window.removeEventListener("resize", aoRedimensionar);
      document.removeEventListener("visibilitychange", aoEsconder);
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.PLATAFORMA_TESTE) {
      window.PLATAFORMA_TESTE = {
        estado: () => ({ heroi: { ...heroi }, vidas, pegas, totalMoedas, situacao, bichos: bichos.map(b => ({ t: b.t, x: b.x, y: b.y, vivo: b.vivo })), bandeira, W, fase: faseIdx, tempo }),
        tile, teclas, entrada,
        pular: () => { entrada.guardado = F.guardado; },
        teleportar: (x, y, vy = 0) => { heroi.x = x; heroi.y = y; heroi.vx = 0; heroi.vy = vy; heroi.invencivel = 0; },
        semInvencivel: () => { heroi.invencivel = 0; },
      };
    }

    ajustar();
    comecarFase();
  }
})();
