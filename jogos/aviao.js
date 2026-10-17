// Piloto de Avião ✈️ — voar entre capitais do Brasil. Decolagem (acelerar na pista e puxar para cima),
// voo de cruzeiro com a paisagem da rota passando lá embaixo (floresta e rio, cerrado, serra, mar e
// praia, cidade), argolas para seguir e ganhar estrelas, nuvens, tempestades com raios e bandos de
// pássaros para desviar, e o pouso: alinhar com a pista e descer devagar (torto ou rápido demais,
// arremete e tenta de novo, como na vida real). Mapa do Brasil com a rota e uma curiosidade da
// cidade de chegada. Câmera atrás do avião, que inclina nas curvas.
(() => {
  // Contorno simplificado do Brasil (longitude, latitude) e as cidades nas posições reais
  const BRASIL = [[-73.9, -7.5], [-73.2, -6], [-72.6, -4.6], [-70, -4.2], [-69.9, -1.2], [-69.5, 1], [-67.4, 2.1], [-66.9, 1.2], [-64, 2.1], [-63.4, 3.9], [-60.7, 5.2], [-59.9, 3.9], [-58.2, 1.6], [-56, 1.9], [-54, 2.3], [-51.6, 4.2], [-50, 1.8], [-49.9, 0], [-48.5, -1.2], [-44.3, -2.5], [-41, -2.9], [-38.5, -3.7], [-35.2, -5.4], [-34.8, -7.1], [-35, -9], [-37, -11], [-38.5, -13], [-39, -15], [-39.2, -17.7], [-40.3, -20.3], [-41.9, -22.8], [-43.2, -23], [-46.3, -24], [-48.5, -26], [-48.6, -28.5], [-50, -31], [-52.1, -32.2], [-53.4, -33.7], [-53.6, -32.5], [-55.6, -30.9], [-57.6, -30.2], [-56, -28.1], [-54.6, -25.6], [-54.3, -24], [-55.6, -22.6], [-57.9, -22.1], [-58, -20], [-57.6, -18], [-58.4, -16.3], [-60.2, -15.1], [-60.5, -13.5], [-62, -12.8], [-65.3, -10.9], [-66.8, -9.8], [-68.6, -11], [-70.5, -11], [-72.4, -10]];
  const CIDADES = {
    manaus: { nome: "Manaus", lon: -60.02, lat: -3.1 }, belem: { nome: "Belém", lon: -48.5, lat: -1.45 }, boavista: { nome: "Boa Vista", lon: -60.67, lat: 2.82 },
    brasilia: { nome: "Brasília", lon: -47.9, lat: -15.8 }, rio: { nome: "Rio de Janeiro", lon: -43.2, lat: -22.9 }, saopaulo: { nome: "São Paulo", lon: -46.63, lat: -23.55 },
    salvador: { nome: "Salvador", lon: -38.5, lat: -12.97 }, recife: { nome: "Recife", lon: -34.9, lat: -8.05 }, fortaleza: { nome: "Fortaleza", lon: -38.54, lat: -3.72 },
    portoalegre: { nome: "Porto Alegre", lon: -51.2, lat: -30.03 }, floripa: { nome: "Florianópolis", lon: -48.55, lat: -27.6 },
  };
  // Rotas: paisagem em trechos (fração do caminho) e a curiosidade de quem chega
  const ROTAS = {
    "manaus-belem": { de: "manaus", para: "belem", km: 1300, paisagem: [["cidade", 0.06], ["floresta", 0.4], ["rio", 0.45], ["floresta", 0.92], ["cidade", 1]],
      chegada: "Belém fica pertinho de onde o rio Amazonas encontra o mar. É famosa pelo açaí e pelo mercado Ver-o-Peso!", partida: "Saindo de Manaus, no coração da floresta amazônica!" },
    "manaus-boavista": { de: "manaus", para: "boavista", km: 660, paisagem: [["cidade", 0.06], ["rio", 0.25], ["floresta", 0.7], ["cerrado", 0.93], ["cidade", 1]],
      chegada: "Boa Vista é a única capital do Brasil que fica todinha ao norte da linha do Equador!", partida: "Saindo de Manaus em direção ao norte!" },
    "brasilia-rio": { de: "brasilia", para: "rio", km: 930, paisagem: [["cidade", 0.07], ["cerrado", 0.45], ["serra", 0.85], ["mar", 0.93], ["cidade", 1]],
      chegada: "O Rio de Janeiro tem o Cristo Redentor, o Pão de Açúcar e praias famosas. Já foi a capital do Brasil!", partida: "Saindo de Brasília, a capital do Brasil!" },
    "saopaulo-salvador": { de: "saopaulo", para: "salvador", km: 1450, paisagem: [["cidade", 0.1], ["serra", 0.35], ["praia", 0.8], ["mar", 0.93], ["cidade", 1]],
      chegada: "Salvador foi a primeira capital do Brasil e tem um elevador gigante, o Elevador Lacerda, que liga a cidade baixa à cidade alta!", partida: "Saindo de São Paulo, a maior cidade do Brasil!" },
    "recife-fortaleza": { de: "recife", para: "fortaleza", km: 630, paisagem: [["cidade", 0.08], ["praia", 0.5], ["cerrado", 0.7], ["praia", 0.93], ["cidade", 1]],
      chegada: "Fortaleza tem praias lindas e venta muito: é ótima para soltar pipa e para o kitesurf!", partida: "Saindo de Recife, a Veneza brasileira, cheia de rios e pontes!" },
    "portoalegre-floripa": { de: "portoalegre", para: "floripa", km: 380, paisagem: [["cidade", 0.1], ["serra", 0.55], ["praia", 0.85], ["mar", 0.94], ["cidade", 1]],
      chegada: "Florianópolis fica numa ilha e tem mais de quarenta praias!", partida: "Saindo de Porto Alegre, lá no sul do Brasil!" },
  };
  const CORES = { azul: ["#1c7ed6", "Azul"], vermelho: ["#e03131", "Vermelho"], verde: ["#2f9e44", "Verde"], laranja: ["#f76707", "Laranja"], roxo: ["#7048e8", "Roxo"] };
  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#74c0fc"/><path d="M2 46h60v16H2z" fill="#2f9e44"/><ellipse cx="18" cy="20" rx="10" ry="4" fill="#fff"/><ellipse cx="46" cy="14" rx="8" ry="3" fill="#fff"/><path d="M10 34 L54 34 L46 30 H18Z" fill="#dee2e6"/><ellipse cx="32" cy="32" rx="7" ry="7" fill="#fff" stroke="#adb5bd"/><path d="M32 18 L35 30 H29Z" fill="#1c7ed6"/><circle cx="22" cy="36" r="3" fill="#868e96"/><circle cx="42" cy="36" r="3" fill="#868e96"/></svg>';

  JOGOS.push({
    id: "aviao", nome: "Piloto de Avião", icone: ICONE, teclas: true,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: "🛫", texto: "Na pista, segure ACELERAR até a barra ficar verde. Depois puxe para cima ⬆️ e o avião decola!" },
      { figura: "⬅️➡️⬆️⬇️", texto: "No ar, as setas viram o avião para os lados e sobem ou descem. No celular, arraste o dedo na tela como se fosse o manche." },
      { figura: "⭐", texto: "Passe por dentro das argolas douradas para ganhar estrelas. Elas mostram o caminho!" },
      { figura: "⛈️🐦", texto: "Desvie das nuvens escuras de tempestade (o avião balança!) e dos bandos de pássaros." },
      { figura: "🛬", texto: "Para pousar: alinhe com a pista e desça devagar. Torto ou rápido demais, o piloto arremete: sobe e tenta de novo." },
      { figura: "🗺️", texto: "O mapa mostra o Brasil, a sua rota e onde o avião está. Na chegada você descobre uma curiosidade da cidade!" },
    ],
    iniciar(area, faixa) {
      const fid = (faixa && faixa.id) || "6-8";
      Motor.telaOpcoes(area, {
        chave: `aviao-${fid}`,
        padrao: { rota: "manaus-belem", cor: "azul", pouso: fid === "5-6" ? "auto" : "eu" },
        opcoes: [
          { chave: "rota", titulo: "Para onde vamos voar?", valores: () => Object.entries(ROTAS).map(([id, r]) => [id, `${CIDADES[r.de].nome} → ${CIDADES[r.para].nome}`, () => figuraRota(id)]) },
          { chave: "cor", titulo: "A cor do seu avião", valores: () => Object.entries(CORES).map(([id, [hex, nm]]) => [id, nm, () => figuraAviao(hex)]) },
          { chave: "pouso", titulo: "Decolar e pousar", valores: [["auto", "🤖 Piloto automático ajuda"], ["eu", "🧑‍✈️ Eu piloto tudo"]] },
        ],
        aoJogar: op => voo(area, op, fid),
      });
    },
  });
  CATALOGO["aviao"] = ["descobrir", "Voe entre as capitais do Brasil"];

  // ----- Mapa do Brasil -----
  function desenharMapa(c, x, y, w, h, rota, progresso) {
    const lon0 = -74.5, lon1 = -34, lat0 = 5.8, lat1 = -34.2;
    const k = Math.min(w / (lon1 - lon0), h / (lat0 - lat1)), ox = x + (w - (lon1 - lon0) * k) / 2, oy = y + (h - (lat0 - lat1) * k) / 2;
    const p = (lon, lat) => [ox + (lon - lon0) * k, oy + (lat0 - lat) * k];
    c.fillStyle = "#69db7c"; c.strokeStyle = "#2b8a3e"; c.lineWidth = 1.5;
    c.beginPath(); BRASIL.forEach(([lo, la], i) => { const [px, py] = p(lo, la); i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.closePath(); c.fill(); c.stroke();
    if (!rota) return;
    const r = ROTAS[rota], a = CIDADES[r.de], b = CIDADES[r.para], [ax, ay] = p(a.lon, a.lat), [bx, by] = p(b.lon, b.lat);
    c.setLineDash([5, 4]); c.strokeStyle = "#1d3557"; c.lineWidth = 2.5; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.setLineDash([]);
    [[ax, ay, "#e03131"], [bx, by, "#1c7ed6"]].forEach(([px, py, cor]) => { c.fillStyle = cor; c.beginPath(); c.arc(px, py, Math.max(3, w * 0.03), 0, 7); c.fill(); });
    if (progresso != null) {
      const px = ax + (bx - ax) * progresso, py = ay + (by - ay) * progresso;
      c.save(); c.translate(px, py); c.rotate(Math.atan2(by - ay, bx - ax) + Math.PI / 2);
      c.font = `${Math.max(12, w * 0.12)}px sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.rotate(-Math.PI / 4); c.fillText("✈️", 0, 0); c.restore();
    }
  }
  function figuraRota(id) {
    const cv = document.createElement("canvas"); cv.width = 240; cv.height = 200;
    const c = cv.getContext("2d");
    c.fillStyle = "#a5d8ff"; c.beginPath(); c.roundRect(0, 0, 240, 200, 18); c.fill();
    desenharMapa(c, 10, 8, 220, 184, id, null);
    return cv;
  }
  function figuraAviao(hex) {
    const cv = document.createElement("canvas"); cv.width = 240; cv.height = 150;
    const c = cv.getContext("2d");
    const g = c.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, "#74c0fc"); g.addColorStop(1, "#d0ebff");
    c.fillStyle = g; c.beginPath(); c.roundRect(0, 0, 240, 150, 18); c.fill();
    c.save(); c.translate(120, 82); desenharAviao(c, 150, hex, 0.12, 0); c.restore();
    return cv;
  }
  // Avião visto de trás: fuselagem, asas com motores, cauda com a cor escolhida
  function desenharAviao(c, w, cor, inclina, chama) {
    c.save(); c.rotate(inclina);
    const r = w * 0.13;
    // asas
    c.fillStyle = "#ced4da"; c.strokeStyle = "#868e96"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-w / 2, r * 0.4); c.lineTo(-r * 0.6, -r * 0.1); c.lineTo(r * 0.6, -r * 0.1); c.lineTo(w / 2, r * 0.4); c.lineTo(w / 2 - 6, r * 0.62); c.lineTo(-w / 2 + 6, r * 0.62); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = cor; c.fillRect(-w / 2 + 2, r * 0.36, 10, r * 0.24); c.fillRect(w / 2 - 12, r * 0.36, 10, r * 0.24);
    // motores
    [-1, 1].forEach(l => {
      const ex = l * w * 0.24;
      c.fillStyle = "#adb5bd"; c.beginPath(); c.arc(ex, r * 0.75, r * 0.42, 0, 7); c.fill();
      c.fillStyle = "#343a40"; c.beginPath(); c.arc(ex, r * 0.75, r * 0.3, 0, 7); c.fill();
      if (chama) { c.fillStyle = `rgba(255,${150 + Math.random() * 80 | 0},60,.5)`; c.beginPath(); c.arc(ex, r * 0.75, r * 0.22 * (0.8 + Math.random() * 0.4), 0, 7); c.fill(); }
    });
    // estabilizador horizontal
    c.fillStyle = "#dee2e6"; c.beginPath(); c.moveTo(-w * 0.2, -r * 0.55); c.lineTo(w * 0.2, -r * 0.55); c.lineTo(w * 0.18, -r * 0.42); c.lineTo(-w * 0.18, -r * 0.42); c.fill();
    // fuselagem
    const g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    g.addColorStop(0, "#fff"); g.addColorStop(1, "#ced4da");
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill();
    c.strokeStyle = cor; c.lineWidth = r * 0.22; c.beginPath(); c.arc(0, 0, r * 0.82, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
    // cauda (leme) com a cor do avião
    c.fillStyle = cor; c.beginPath(); c.moveTo(-r * 0.22, -r * 0.6); c.lineTo(-r * 0.12, -r * 2.6); c.lineTo(r * 0.12, -r * 2.6); c.lineTo(r * 0.22, -r * 0.6); c.closePath(); c.fill();
    c.fillStyle = "#fff"; c.font = `${r * 0.5}px sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("★", 0, -r * 1.7);
    c.restore();
  }

  function voo(area, op, fid) {
    const rota = ROTAS[op.rota] || ROTAS["manaus-belem"], auto = op.pouso === "auto", cor = (CORES[op.cor] || CORES.azul)[0];
    const pequeno = fid === "5-6";
    let pausado = false;
    const P = Palco.criar(area, { classe: "aviao-tela", aoPausar: () => { pausado = !pausado; P.pausa.textContent = pausado ? "▶️" : "⏸️"; } });
    const ctx = P.ctx;
    const COMP = pequeno ? 16000 : 21000;   // comprimento do voo (unidades do mundo)
    const VEL = 320;                        // velocidade de cruzeiro
    // estado do avião
    const av = { x: 0, h: 0, z: 0, vel: 0, incl: 0, vh: 0 };
    let fase = "pista", estrelas = 0, conforto = 3, tempoFase = 0, msg = null, sacode = 0, flash = 0, branco = 0, tentativas = 0;
    let entX = 0, entY = 0, acel = false, confete = [];
    const objetos = [];
    let zPista = null; // pista de chegada (z)
    // ----- Objetos do caminho -----
    function gerarObjetos() {
      let x = 0;
      for (let z = 1600; z < COMP - 1800; z += 520 + Math.random() * 260) {
        const t = z / COMP, r = Math.random();
        if (r < 0.5) { x = Math.max(-260, Math.min(260, x + (Math.random() - 0.5) * 220)); objetos.push({ tipo: "argola", x, h: 140 + Math.random() * 160, z }); }
        else if (r < 0.75) objetos.push({ tipo: "nuvem", x: (Math.random() - 0.5) * 900, h: 180 + Math.random() * 260, z, s: 0.8 + Math.random() * 0.8 });
        else if (r < 0.9 && t > 0.15) objetos.push({ tipo: "tempestade", x: (Math.random() - 0.5) * 600, h: 150 + Math.random() * 200, z, s: 1 + Math.random() * 0.5 });
        else if (t > 0.1) objetos.push({ tipo: "passaros", x: (Math.random() - 0.5) * 500, h: 100 + Math.random() * 180, z, vx: (Math.random() < 0.5 ? -1 : 1) * 40 });
      }
    }
    gerarObjetos();
    const paisagemEm = z => { const t = Math.max(0, Math.min(1, z / COMP)); return (rota.paisagem.find(([, ate]) => t <= ate) || rota.paisagem[rota.paisagem.length - 1])[0]; };
    const CHAO = { floresta: ["#1e6b30", "#24793a"], rio: ["#2b8a3e", "#2f9e44"], cerrado: ["#a9b84c", "#b5c25a"], serra: ["#4c8a3a", "#58994a"], mar: ["#1971c2", "#1c7ed6"], praia: ["#2f9e44", "#37a84d"], cidade: ["#868e96", "#909aa3"] };
    const rioX = z => Math.sin(z * 0.0009) * 260 + Math.sin(z * 0.00031) * 180;

    // ----- Entradas -----
    const bAcel = P.botao("🛫<small>ACELERAR</small>", v => { acel = v; }, { segurar: true, classe: "principal" });
    P.controles.appendChild(bAcel);
    const posicionar = () => Object.assign(bAcel.style, { right: "14px", bottom: "14px", minWidth: "150px", minHeight: "100px" });
    posicionar();
    const teclasDown = {};
    P.teclas((e, d) => {
      const k = e.key;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", " "].includes(k)) { teclasDown[k] = d; if (d) e.preventDefault(); }
    });
    // arrastar o dedo: como um manche (o quanto afastou do ponto onde tocou)
    let toque = null;
    P.canvas.addEventListener("pointerdown", e => { Motor.audio(); toque = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, id: e.pointerId }; try { P.canvas.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } });
    P.canvas.addEventListener("pointermove", e => { if (toque && e.pointerId === toque.id) { toque.x = e.clientX; toque.y = e.clientY; } });
    ["pointerup", "pointercancel"].forEach(t => P.canvas.addEventListener(t, () => { toque = null; }));
    function lerEntrada() {
      let ix = (teclasDown.ArrowRight ? 1 : 0) - (teclasDown.ArrowLeft ? 1 : 0);
      let iy = (teclasDown.ArrowUp ? 1 : 0) - (teclasDown.ArrowDown ? 1 : 0);
      if (toque) { const k = Math.min(P.W, P.H) * 0.18; ix += Math.max(-1, Math.min(1, (toque.x - toque.x0) / k)); iy += Math.max(-1, Math.min(1, (toque.y0 - toque.y) / k)); }
      entX = Math.max(-1, Math.min(1, ix)); entY = Math.max(-1, Math.min(1, iy));
    }

    // ----- Fases -----
    function dizer(t, falar = true) { msg = { txt: t, t: 2.6 }; if (falar) Motor.falar(t); }
    function atualizar(dt) {
      lerEntrada();
      tempoFase += dt;
      const acelera = acel || teclasDown.Enter || teclasDown[" "];
      if (fase === "pista") {
        if (acelera || (auto && tempoFase > 2.5)) av.vel = Math.min(VEL, av.vel + 95 * dt);
        else av.vel = Math.max(0, av.vel - 40 * dt);
        if (av.vel > VEL * 0.72 && (entY > 0.3 || (auto && av.vel > VEL * 0.85))) { fase = "subindo"; tempoFase = 0; bAcel.hidden = true; Motor.falar("Decolamos! Vamos voar!"); }
        else if (av.vel > VEL * 0.72 && !msg) dizer("Agora puxe para cima! ⬆️");
      } else if (fase === "subindo") {
        av.vel = Math.min(VEL, av.vel + 40 * dt);
        av.h += (90 + 60 * Math.max(0, entY)) * dt;
        if (av.h > 160) { fase = "cruzeiro"; tempoFase = 0; Motor.falar(`Estamos voando para ${CIDADES[rota.para].nome}! Passe nas argolas douradas.`); }
      } else if (fase === "cruzeiro" || fase === "aproximacao") {
        av.vel += (VEL - av.vel) * dt;
        av.incl += (entX * 0.55 - av.incl) * Math.min(1, dt * 3);
        av.x += av.incl * 420 * dt;
        av.x = Math.max(-700, Math.min(700, av.x));
        const alvoH = fase === "aproximacao" && auto ? altitudeIdeal() : null;
        if (alvoH !== null) av.vh = (alvoH - av.h) * 1.4;
        else av.vh += (entY * 130 - av.vh) * Math.min(1, dt * 3);
        if (alvoH !== null && Math.abs(entX) < 0.1) av.incl += (-av.x * 0.002 - av.incl) * Math.min(1, dt * 2); // automático alinha com a pista
        av.h = Math.max(fase === "aproximacao" ? 0 : 60, Math.min(520, av.h + av.vh * dt));
        if (fase === "cruzeiro" && !arremetendo && av.z > COMP - 2600) { fase = "aproximacao"; zPista = av.z + 2600; tempoFase = 0; dizer(auto ? "Chegando! O piloto automático ajuda no pouso. Alinhe com a pista!" : "Chegando! Alinhe com a pista e desça devagar!"); }
        if (fase === "aproximacao") verificarPouso();
      } else if (fase === "pousado") {
        av.vel = Math.max(0, av.vel - 120 * dt); av.incl *= 0.9; av.x *= 0.98;
      }
      av.z += av.vel * dt;
      // objetos: passou por eles?
      objetos.forEach(o => {
        if (o.passou || o.z > av.z) return;
        o.passou = true;
        const dx = o.x - av.x, dh = o.h - av.h;
        if (o.tipo === "argola" && Math.hypot(dx, dh) < 60) { estrelas++; Motor.nota(1320, { dur: 0.15, tipo: "triangle", vol: 0.12 }); Motor.nota(1760, { dur: 0.2, tipo: "triangle", vol: 0.1, inicio: 0.08 }); o.pegou = 1; }
        else if (o.tipo === "nuvem" && Math.hypot(dx, dh) < 120 * o.s) branco = 0.7;
        else if (o.tipo === "tempestade" && Math.hypot(dx, dh) < 140 * o.s) { sacode = 1.6; flash = 0.3; conforto = Math.max(0, conforto - 1); Motor.ruido({ dur: 0.9, vol: 0.3, freq: 120 }); dizer("Turbulência! Desvie das nuvens escuras!"); }
        else if (o.tipo === "passaros" && Math.hypot(dx, dh) < 70) { sacode = 0.8; conforto = Math.max(0, conforto - 1); dizer("Cuidado com os pássaros!"); }
      });
      objetos.forEach(o => { if (o.tipo === "passaros") o.x += o.vx * dt; });
      sacode = Math.max(0, sacode - dt); flash = Math.max(0, flash - dt); branco = Math.max(0, branco - dt);
    }
    // descida ideal até a pista (rampa de 3 graus, como a dos aviões de verdade)
    const altitudeIdeal = () => Math.max(0, (zPista - av.z) * 0.07);
    // encostou no chão: dentro da pista, alinhado e devagar = pouso; senão, arremete
    function verificarPouso() {
      if (av.h > 1) { if (av.z > zPista + 1100) arremeter("Passou da pista! Vamos arremeter e tentar de novo."); return; }
      if (av.z < zPista - 30) return arremeter("Ainda não chegou na pista! Arremeter!");
      if (Math.abs(av.x) > 110) return arremeter("Torto! Tem que alinhar com a pista. Arremeter!");
      if (av.vh < -95) return arremeter("Desceu rápido demais! Arremeter e tentar de novo.");
      pousar();
    }
    let arremetendo = false;
    function arremeter(t) {
      tentativas++;
      dizer(t);
      fase = "cruzeiro"; arremetendo = true; av.h = Math.max(av.h, 40); av.vh = 120;
      setTimeout(() => { if (P.vivo() && fase === "cruzeiro") { arremetendo = false; fase = "aproximacao"; zPista = av.z + 2600; dizer("Vamos tentar de novo: alinhe e desça devagar."); } }, 3000);
    }
    function pousar() {
      fase = "pousado"; av.h = 0; av.vh = 0; tempoFase = 0;
      Motor.ruido({ dur: 0.4, vol: 0.2, freq: 300 });
      Motor.tim();
      Palco.confete(confete, P.W / 2, P.H * 0.35, ["#ffd43b", "#69db7c", "#4dabf7", "#ff8787", "#fff"], 80);
      Motor.comemorar(P.canvas);
      Motor.falar(`Pousamos em ${CIDADES[rota.para].nome}! ${rota.chegada}`);
      setTimeout(() => {
        if (!P.vivo()) return;
        const det = document.createElement("div");
        det.className = "aviao-fim";
        const cv = document.createElement("canvas"); cv.width = 260; cv.height = 220;
        desenharMapa(cv.getContext("2d"), 10, 10, 240, 200, op.rota, 1);
        const tx = document.createElement("p"); tx.textContent = rota.chegada;
        const st = document.createElement("div"); st.className = "detalhe-fim"; st.textContent = `⭐ ${estrelas} estrelas · ${"😊".repeat(conforto) || "😵"} conforto · ${rota.km} km`;
        det.append(cv, tx, st);
        P.fim(`Bem-vindo a ${CIDADES[rota.para].nome}!`, "🛬", det, [
          { rotulo: "🔁 Voar de novo", principal: true, aoClicar: () => voo(area, op, fid) },
          { rotulo: "🗺️ Outra rota", aoClicar: () => JOGOS.find(j => j.id === "aviao").iniciar(area, { id: fid }) },
        ]);
      }, 2200);
    }

    // ----- Projeção e desenho -----
    function vista() {
      const W = P.W, H = P.H, f = Math.min(W, H * 1.4) * 0.9, hz = H * 0.42;
      const camZ = av.z - 260, camY = av.h + 70, camX = av.x * 0.85;
      const proj = (x, y, z) => { const dz = z - camZ; if (dz < 5) return null; const s = f / dz; return [W / 2 + (x - camX) * s, hz + (camY - y) * s, s]; };
      return { W, H, f, hz, camZ, camY, camX, proj };
    }
    function desenhar(dt) {
      const v = vista(), { W, H, hz } = v;
      ctx.save();
      // o mundo inclina junto com o avião (e balança na turbulência)
      const tremor = sacode > 0 ? (Math.random() - 0.5) * 10 * sacode : 0;
      ctx.translate(W / 2 + tremor, H * 0.5 + tremor); ctx.rotate(-av.incl * 0.5); ctx.translate(-W / 2, -H * 0.5);
      const D = Math.hypot(W, H);
      // céu
      const g = ctx.createLinearGradient(0, hz - H, 0, hz);
      g.addColorStop(0, "#1864ab"); g.addColorStop(0.6, "#4dabf7"); g.addColorStop(1, "#d0ebff");
      ctx.fillStyle = g; ctx.fillRect(-D, hz - D * 1.5, W + 2 * D, D * 1.5);
      ctx.fillStyle = "rgba(255,250,210,.9)"; ctx.beginPath(); ctx.arc(W * 0.8, hz - H * 0.28, Math.min(W, H) * 0.05, 0, 7); ctx.fill();
      // chão em faixas (de longe para perto)
      const BAND = 120, zIni = Math.floor((v.camZ + 30) / BAND) * BAND;
      const tipoLonge = paisagemEm(v.camZ + 9000);
      ctx.fillStyle = CHAO[tipoLonge][0]; ctx.fillRect(-D, hz, W + 2 * D, D * 1.5);
      // montanhas no horizonte (serra) / névoa
      const tipoPerto = paisagemEm(av.z);
      if (tipoLonge === "serra" || tipoPerto === "serra") {
        ctx.fillStyle = "#5c8f4d";
        for (let i = -3; i < 9; i++) { const mx = ((i * 230 - v.camX * 0.05) % (W + 460)) - 230; ctx.beginPath(); ctx.moveTo(mx - 160, hz + 1); ctx.lineTo(mx, hz - 70 - (i % 3) * 25); ctx.lineTo(mx + 160, hz + 1); ctx.fill(); }
      }
      for (let z = zIni + 60 * BAND; z >= zIni; z -= BAND) {
        const a = v.proj(0, 0, z + BAND), b = v.proj(0, 0, z);
        if (!a || !b) continue;
        const tp = paisagemEm(z), cores = CHAO[tp];
        ctx.fillStyle = cores[(Math.floor(z / BAND) & 1)];
        ctx.fillRect(-D, a[1], W + 2 * D, b[1] - a[1] + 1);
        // rio / litoral / pista
        if (tp === "rio") faixaChao(v, z, BAND, rioX(z) - 140, rioX(z) + 140, rioX(z + BAND) - 140, rioX(z + BAND) + 140, "#1c7ed6");
        if (tp === "praia") { faixaChao(v, z, BAND, 300, 5000, 300, 5000, "#1971c2"); faixaChao(v, z, BAND, 230, 300, 230, 300, "#ffe8a3"); }
      }
      // pista de decolagem e de pouso
      pista(v, 0);
      if (zPista) pista(v, zPista);
      // coisas no chão: árvores, prédios (de longe para perto)
      decoracao(v);
      // objetos no ar, de longe para perto
      objetos.filter(o => o.z > v.camZ + 20 && o.z < v.camZ + 7000).sort((a, b) => b.z - a.z).forEach(o => desenharObjeto(v, o));
      ctx.restore();
      // o avião (fica no meio da tela, inclinado)
      const sa = Math.min(W, H) * 0.42;
      const pa = vista().proj(av.x, av.h, av.z);
      if (pa) {
        ctx.fillStyle = "rgba(0,0,0,.15)";
        const ch = vista().proj(av.x, 0, av.z);
        if (ch && av.h < 300) { ctx.beginPath(); ctx.ellipse(ch[0], ch[1], sa * 0.3 * (1 - av.h / 320), sa * 0.04, 0, 0, 7); ctx.fill(); }
        ctx.save(); ctx.translate(pa[0], pa[1]); desenharAviao(ctx, sa, cor, av.incl * 0.9, fase !== "pousado"); ctx.restore();
      }
      if (branco > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, branco * 1.4)})`; ctx.fillRect(0, 0, W, H); }
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,230,${flash * 1.6})`; ctx.fillRect(0, 0, W, H); }
      painel();
      Palco.desenharConfete(ctx, confete, dt);
      if (msg) { Palco.texto(ctx, msg.txt, W / 2, H * 0.2, Math.min(34 * P.esc(), W / 18), "#fff"); msg.t -= dt; if (msg.t <= 0) msg = null; }
      if (pausado) Palco.texto(ctx, "⏸️ Pausa", W / 2, H / 2, 54 * P.esc());
    }
    function faixaChao(v, z, band, xa1, xa2, xb1, xb2, corF) {
      const a1 = v.proj(xa1, 0, z), a2 = v.proj(xa2, 0, z), b1 = v.proj(xb1, 0, z + band), b2 = v.proj(xb2, 0, z + band);
      if (!a1 || !a2 || !b1 || !b2) return;
      ctx.fillStyle = corF; ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(b1[0], b1[1]); ctx.closePath(); ctx.fill();
    }
    function pista(v, z0) {
      const L = 1200, Wp = 60;
      faixaChao(v, z0 - 100, L + 100, -Wp - 30, Wp + 30, -Wp - 30, Wp + 30, "#5c940d");
      faixaChao(v, z0 - 100, L + 100, -Wp, Wp, -Wp, Wp, "#495057");
      for (let z = z0; z < z0 + L; z += 80) faixaChao(v, z, 40, -3, 3, -3, 3, "#f8f9fa");
      // luzes de aproximação antes da pista de pouso
      if (z0 > 0) for (let z = z0 - 600; z < z0 - 100; z += 60) { const p = v.proj(0, 0, z); if (p) { ctx.fillStyle = "#ffd43b"; ctx.beginPath(); ctx.arc(p[0], p[1], Math.max(1.5, p[2] * 6), 0, 7); ctx.fill(); } }
      // torre de controle na de partida
      if (z0 === 0) { const p = v.proj(-180, 0, 300); if (p) { const s = p[2]; ctx.fillStyle = "#dee2e6"; ctx.fillRect(p[0] - 8 * s, p[1] - 90 * s, 16 * s, 90 * s); ctx.fillStyle = "#4dabf7"; ctx.fillRect(p[0] - 16 * s, p[1] - 110 * s, 32 * s, 20 * s); } }
    }
    // árvores, prédios e casas espalhados (posições fixas por "célula" do mapa)
    const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    function decoracao(v) {
      const CEL = 260;
      const z0 = Math.floor((v.camZ + 80) / CEL), z1 = z0 + 26;
      for (let iz = z1; iz >= z0; iz--) {
        const tp = paisagemEm(iz * CEL);
        if (tp === "mar") continue;
        for (let ix = -6; ix <= 6; ix++) {
          const r = hash(ix, iz), x = ix * CEL + (hash(iz, ix) - 0.5) * CEL * 0.8 + v.camX * 0, z = iz * CEL + r * CEL * 0.6;
          if (Math.abs(x) < (z < 1400 ? 140 : 320) && (z < 1400 || (zPista && z > zPista - 2700 && z < zPista + 1400))) continue; // pista e a descida até ela livres
          if (tp === "rio" && Math.abs(x - rioX(z)) < 180) continue;
          if (tp === "praia" && x > 200) continue;
          const p = v.proj(x, 0, z);
          if (!p || p[1] > v.H + 40 || p[0] < -200 || p[0] > v.W + 200) continue;
          const s = p[2];
          if (tp === "cidade") {
            const h = (40 + r * 120) * s, w = 50 * s;
            ctx.fillStyle = ["#adb5bd", "#ced4da", "#e9ecef", "#a5d8ff"][Math.floor(r * 4)]; ctx.fillRect(p[0] - w / 2, p[1] - h, w, h);
            ctx.fillStyle = "rgba(0,0,0,.12)"; ctx.fillRect(p[0] + w * 0.15, p[1] - h, w * 0.35, h);
          } else if (tp === "floresta" || tp === "rio" || (tp === "serra" && r < 0.7) || (tp === "cerrado" && r < 0.35) || (tp === "praia" && r < 0.5)) {
            const tam = (tp === "floresta" ? 70 : 50) * s;
            ctx.fillStyle = tp === "cerrado" ? "#7a8b2e" : tp === "praia" ? "#2b8a3e" : "#14532d";
            ctx.beginPath(); ctx.arc(p[0], p[1] - tam * 0.5, tam * 0.55, 0, 7); ctx.fill();
            if (tp === "floresta" || tp === "rio") { ctx.beginPath(); ctx.arc(p[0] - tam * 0.45, p[1] - tam * 0.3, tam * 0.4, 0, 7); ctx.arc(p[0] + tam * 0.45, p[1] - tam * 0.3, tam * 0.4, 0, 7); ctx.fill(); }
          }
        }
      }
    }
    function desenharObjeto(v, o) {
      const p = v.proj(o.x, o.h, o.z);
      if (!p) return;
      const s = p[2];
      if (o.tipo === "argola") {
        if (o.pegou) return;
        ctx.strokeStyle = "#ffd43b"; ctx.lineWidth = Math.max(2, 10 * s);
        ctx.beginPath(); ctx.ellipse(p[0], p[1], 60 * s, 60 * s, 0, 0, 7); ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = Math.max(1, 3 * s); ctx.stroke();
      } else if (o.tipo === "nuvem" || o.tipo === "tempestade") {
        const esc = o.tipo === "nuvem" ? "rgba(255,255,255,.92)" : "rgba(52,58,64,.92)", r = 70 * s * o.s;
        ctx.fillStyle = esc;
        [[0, 0, 1], [-0.9, 0.2, 0.7], [0.9, 0.25, 0.75], [-0.4, -0.4, 0.7], [0.45, -0.35, 0.65]].forEach(([dx, dy, k]) => { ctx.beginPath(); ctx.arc(p[0] + dx * r, p[1] + dy * r, r * k, 0, 7); ctx.fill(); });
        if (o.tipo === "tempestade" && Math.random() < 0.06) { ctx.strokeStyle = "#ffe066"; ctx.lineWidth = Math.max(2, 4 * s); ctx.beginPath(); ctx.moveTo(p[0], p[1] + r * 0.6); ctx.lineTo(p[0] - r * 0.2, p[1] + r * 1.2); ctx.lineTo(p[0] + r * 0.1, p[1] + r * 1.25); ctx.lineTo(p[0] - r * 0.15, p[1] + r * 1.9); ctx.stroke(); }
      } else if (o.tipo === "passaros") {
        ctx.strokeStyle = "#212529"; ctx.lineWidth = Math.max(1.5, 3 * s);
        const asa = Math.sin(performance.now() / 120 + o.z) * 6 * s;
        for (let i = 0; i < 5; i++) { const bx = p[0] + (i - 2) * 22 * s, by = p[1] + Math.abs(i - 2) * 10 * s; ctx.beginPath(); ctx.moveTo(bx - 9 * s, by - asa); ctx.lineTo(bx, by); ctx.lineTo(bx + 9 * s, by - asa); ctx.stroke(); }
      }
    }
    // Painel: rota, progresso e km, altitude e velocidade, estrelas e o mapa
    function painel() {
      const s = P.esc(), W = P.W, H = P.H;
      const prog = Math.max(0, Math.min(1, av.z / COMP));
      const bw = Math.min(W - 160, 520 * s), bx = W / 2 - bw / 2, by = 10;
      Palco.caixa(ctx, bx, by, bw, 50 * s, 14);
      Palco.texto(ctx, `${CIDADES[rota.de].nome} ✈️ ${CIDADES[rota.para].nome}`, W / 2, by + 16 * s, 17 * s);
      ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(bx + 14, by + 32 * s, bw - 28, 8 * s);
      ctx.fillStyle = "#ffd43b"; ctx.fillRect(bx + 14, by + 32 * s, (bw - 28) * prog, 8 * s);
      // instrumentos
      const ix = 12, iy = H - (fase === "pista" ? 130 : 20) - 70 * s;
      Palco.caixa(ctx, ix, iy, 150 * s, 66 * s, 12);
      // valores de verdade: decola a uns 250 km/h e voa a uns 850 km/h, a até 11 mil metros
      const kmh = av.vel * (1.05 + 1.6 * Math.min(1, av.h / 300));
      Palco.texto(ctx, `⛰️ ${(Math.round(av.h * 21 / 10) * 10).toLocaleString("pt-BR")} m`, ix + 10 * s, iy + 20 * s, 16 * s, "#fff", { alinhar: "left" });
      Palco.texto(ctx, `💨 ${Math.round(kmh)} km/h`, ix + 10 * s, iy + 46 * s, 16 * s, "#fff", { alinhar: "left" });
      Palco.texto(ctx, `⭐ ${estrelas}`, W / 2, by + 50 * s + 22 * s, 24 * s, "#ffd43b");
      Palco.texto(ctx, `${Math.round(rota.km * (1 - prog))} km`, bx + bw - 14, by + 16 * s, 13 * s, "#fff", { alinhar: "right" });
      // mapa
      if (W > 380) {
        const mw = Math.min(150 * s, W * 0.22), mh = mw * 0.95, mx = W - mw - 10, my = 70 * Math.min(1.3, s);
        Palco.caixa(ctx, mx - 4, my - 4, mw + 8, mh + 8, 12, "rgba(165,216,255,.85)");
        desenharMapa(ctx, mx, my, mw, mh, op.rota, prog);
      }
      // guia de pouso: diz se está alto ou baixo e para que lado está a pista
      if (fase === "aproximacao" && zPista) {
        const ideal = altitudeIdeal(), dif = av.h - ideal;
        const t = Math.abs(av.x) > 80 ? (av.x > 0 ? "⬅️ Pista para a esquerda" : "Pista para a direita ➡️") : dif > 40 ? "⬇️ Desça mais" : dif < -40 ? "⬆️ Muito baixo, suba um pouco" : "👍 Ótimo, assim!";
        Palco.texto(ctx, t, W / 2, H * 0.3, Math.min(28 * s, W / 18), "#ffd43b");
      }
      if (fase === "pista") {
        const w = Math.min(W * 0.5, 320 * s), x = W / 2 - w / 2, y = H * 0.27;
        Palco.caixa(ctx, x - 6, y - 6, w + 12, 30 * s, 10);
        const k = av.vel / VEL;
        ctx.fillStyle = k > 0.72 ? "#69db7c" : "#ffd43b"; ctx.fillRect(x, y, w * k, 18 * s);
        ctx.fillStyle = "#fff"; ctx.fillRect(x + w * 0.72, y - 4, 3, 26 * s);
        Palco.texto(ctx, k > 0.72 ? "Puxe para cima ⬆️" : "Segure ACELERAR 🛫", W / 2, y + 48 * s, 22 * s);
      }
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.AVIAO_TESTE) window.AVIAO_TESTE = { pular: z => { av.z = z; }, estado: () => ({ fase, z: Math.round(av.z), h: Math.round(av.h), x: Math.round(av.x), estrelas }) };
    P.aoMedir = posicionar;
    P.rodar(dt => {
      if (!pausado) atualizar(dt);
      desenhar(dt);
    });
    Motor.falar(`${rota.partida} Segure acelerar para decolar!`);
  }
})();
