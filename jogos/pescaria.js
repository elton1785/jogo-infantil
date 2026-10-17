// Pescaria na Amazônia 🎣 — de dentro da canoa, com a floresta ao fundo e o rio visto por baixo
// d'água (Rio Negro de água escura, Solimões barrento ou igarapé de água clara). Peixes de verdade da
// Amazônia nadando cada um na sua profundidade. Pescar como de verdade: lançar (segurar e soltar na
// força certa), regular a profundidade, esperar a boia afundar e fisgar, e na briga segurar para
// recolher sem deixar a tensão estourar a linha. Cada peixe pescado tem a sua ficha (tamanho real e
// curiosidade) e entra no caderno de espécies. O boto e o peixe-boi aparecem, mas são protegidos;
// lixo fisgado sai do rio (ajuda a natureza).
(() => {
  // len: tamanho de verdade (m); prof: faixa de profundidade (0 = superfície, 1 = fundo); forca: briga
  const PEIXES = {
    jaraqui: { nome: "Jaraqui", len: 0.3, alt: 0.36, prof: [0.15, 0.55], forca: 0.35, raro: 3, cor: ["#7b8a96", "#e9ecef"], info: "O peixe mais querido de Manaus! O ditado diz: quem come jaraqui não sai mais de Manaus." },
    tambaqui: { nome: "Tambaqui", len: 0.9, alt: 0.55, prof: [0.3, 0.75], forca: 0.7, raro: 2, cor: ["#4a5560", "#1d2328"], info: "Come frutas e sementes que caem da floresta e espalha as sementes pelo rio: ajuda a plantar árvores!" },
    tucunare: { nome: "Tucunaré", len: 0.6, alt: 0.38, prof: [0.15, 0.6], forca: 0.8, raro: 2, cor: ["#9aa63a", "#f4d35e"], info: "Tem uma mancha redonda no rabo que parece um olho, para confundir os outros peixes. É um dos peixes que mais brigam!" },
    pacu: { nome: "Pacu", len: 0.4, alt: 0.6, prof: [0.2, 0.6], forca: 0.45, raro: 3, cor: ["#9aa5ad", "#f2c14e"], info: "Primo do tambaqui, tem dentes parecidos com os nossos e adora frutinhas." },
    piranha: { nome: "Piranha", len: 0.3, alt: 0.55, prof: [0.3, 0.8], forca: 0.5, raro: 3, cor: ["#6c757d", "#e03131"], corta: true, info: "Tem dentes muito afiados e pode cortar a linha! Mas quase nunca ataca pessoas: come peixes doentes e ajuda a limpar o rio." },
    pirarucu: { nome: "Pirarucu", len: 2.2, alt: 0.22, prof: [0.35, 0.85], forca: 1, raro: 0.5, cor: ["#3d4a3e", "#c92a2a"], manejo: true, info: "Um dos maiores peixes de água doce do mundo: passa de 2 metros! Ele sobe para respirar ar. Só pode ser pescado no manejo, quando as comunidades contam os peixes para ele nunca acabar." },
    aruana: { nome: "Aruanã", len: 0.8, alt: 0.2, prof: [0.05, 0.3], forca: 0.6, raro: 1.5, cor: ["#adb5bd", "#f1f3f5"], info: "Chamado de macaco-d'água: pula para fora do rio para pegar insetos e até passarinhos nos galhos!" },
    acari: { nome: "Acari-bodó", len: 0.35, alt: 0.3, prof: [0.8, 0.97], forca: 0.3, raro: 2, cor: ["#4a3b2a", "#7a6448"], fundo: true, info: "Tem uma armadura no corpo e uma boca de ventosa para grudar nas pedras e nos troncos do fundo do rio." },
    surubim: { nome: "Surubim", len: 1.1, alt: 0.2, prof: [0.65, 0.95], forca: 0.85, raro: 1, cor: ["#5c636a", "#f1f3f5"], info: "Tem bigodes compridos, os barbilhões, e pintas pelo corpo. Caça no fundo do rio, principalmente à noite." },
    matrinxa: { nome: "Matrinxã", len: 0.45, alt: 0.3, prof: [0.1, 0.5], forca: 0.55, raro: 2, cor: ["#868e96", "#dee2e6"], info: "Peixe prateado e muito rápido, que adora pegar as frutas que caem na água." },
  };
  const PROTEGIDOS = {
    boto: { nome: "Boto-cor-de-rosa", info: "O boto é um golfinho de rio, rosado e muito esperto. É protegido por lei: não se pesca! Ele sobe para respirar." },
    peixeboi: { nome: "Peixe-boi", info: "O peixe-boi é um mamífero que come plantas do rio. Está ameaçado de extinção e é protegido: vamos deixar ele em paz!" },
  };
  const LIXO = [["garrafa", "uma garrafa"], ["lata", "uma lata"], ["sacola", "uma sacola"]];
  const RIOS = {
    negro: { nome: "Rio Negro", agua: ["#4a2e14", "#1c1006"], sup: "#3b2410", vis: 0.55, info: "água escura, cor de chá" },
    solimoes: { nome: "Rio Solimões", agua: ["#9c7a4c", "#4d3a1f"], sup: "#a58556", vis: 0.4, info: "água barrenta, cor de café com leite" },
    igarape: { nome: "Igarapé", agua: ["#2f8f7a", "#0d3d33"], sup: "#3aa58c", vis: 0.9, info: "água clarinha da floresta" },
  };
  const CHAVE_CADERNO = "pescaria-caderno";
  const caderno = () => { try { return JSON.parse(localStorage.getItem(CHAVE_CADERNO)) || {}; } catch (e) { return {}; } };
  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#2f8f7a"/><rect x="2" y="2" width="60" height="22" rx="12" fill="#74c0fc"/><path d="M2 22 Q12 14 20 20 Q30 10 40 18 Q50 12 62 20 V26 H2Z" fill="#2b8a3e"/><path d="M6 30 Q20 26 32 30 T62 30" stroke="#a5d8ff" stroke-width="2" fill="none"/><path d="M14 46 Q24 36 36 46 Q24 54 14 46Z" fill="#f4d35e"/><path d="M14 46 L6 40 L7 52Z" fill="#9aa63a"/><circle cx="32" cy="45" r="1.6" fill="#111"/><path d="M48 4 L44 38" stroke="#5c3a1e" stroke-width="2"/><path d="M44 38 V48" stroke="#fff" stroke-width="1"/></svg>';

  JOGOS.push({
    id: "pescaria", nome: "Pescaria na Amazônia", icone: ICONE, teclas: true,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: "🎣", texto: "Segure LANÇAR: a força vai subindo e descendo. Solte para jogar a isca: com mais força, ela vai mais longe." },
      { figura: "⬆️⬇️", texto: "Use ⬆️ e ⬇️ (ou os botões) para a isca subir ou descer. Cada peixe vive numa profundidade: o acari fica no fundo, o aruanã perto da superfície." },
      { figura: "🔴", texto: "Quando um peixe beliscar, a boia mexe. Quando ela afundar de vez, aperte FISGAR!" },
      { figura: "🌀", texto: "Na briga, segure RECOLHER para puxar o peixe. Se a tensão ficar vermelha, solte um pouco, senão a linha arrebenta!" },
      { figura: "📖", texto: "Cada peixe pescado ganha uma ficha com o tamanho e uma curiosidade. Complete o caderno com os 10 peixes da Amazônia!" },
      { figura: "🐬", texto: "O boto-cor-de-rosa e o peixe-boi são protegidos: não se pescam. Toque neles para conhecer!" },
      { figura: "🌎", texto: "Pegou lixo? Ótimo! Tirar lixo do rio ajuda os peixes e a floresta." },
    ],
    iniciar(area, faixa) {
      const fid = (faixa && faixa.id) || "6-8";
      Motor.telaOpcoes(area, {
        chave: `pescaria-${fid}`,
        padrao: { rio: "negro", modo: "livre", briga: fid === "5-6" ? "facil" : "normal" },
        opcoes: [
          { chave: "rio", titulo: "Onde vamos pescar?", valores: () => Object.entries(RIOS).map(([id, r]) => [id, r.nome, () => figuraRio(id)]) },
          { chave: "modo", titulo: "Como vai ser?", valores: [["livre", "🎣 Pescaria livre"], ["tempo", "⏱️ Desafio de 3 minutos"]] },
          { chave: "briga", titulo: "A briga com o peixe", valores: [["facil", "🐟 Fácil (a linha aguenta mais)"], ["normal", "🐠 De verdade"]] },
        ],
        aoJogar: op => pescar(area, op, fid),
      });
    },
  });
  CATALOGO["pescaria"] = ["descobrir", "Pesque os peixes da Amazônia"];

  function figuraRio(id) {
    const cv = document.createElement("canvas"); cv.width = 240; cv.height = 160;
    const c = cv.getContext("2d"), r = RIOS[id];
    const g = c.createLinearGradient(0, 0, 0, 60); g.addColorStop(0, "#74c0fc"); g.addColorStop(1, "#d0ebff");
    c.fillStyle = g; c.fillRect(0, 0, 240, 62);
    floresta(c, 0, 62, 240, 34);
    const ga = c.createLinearGradient(0, 62, 0, 160); ga.addColorStop(0, r.agua[0]); ga.addColorStop(1, r.agua[1]);
    c.fillStyle = ga; c.fillRect(0, 62, 240, 98);
    desenharPeixe(c, PEIXES.tucunare, 150, 115, 70, -1, 0, 1);
    desenharPeixe(c, PEIXES.jaraqui, 70, 95, 44, 1, 1, 1);
    return cv;
  }
  // Mata da beira do rio: copas de várias alturas e palmeiras de açaí
  function floresta(c, x0, base, w, h, desl = 0) {
    c.fillStyle = "#1e5b2c";
    for (let x = -((desl * 0.3) % 40) - 40; x < w + 40; x += 18) { const hh = h * (0.6 + 0.4 * Math.abs(Math.sin(x * 0.07 + 1))); c.beginPath(); c.arc(x0 + x, base - hh * 0.6, hh * 0.55, 0, 7); c.fill(); }
    c.fillStyle = "#2b7a3b";
    for (let x = -((desl * 0.5) % 46) - 46; x < w + 46; x += 23) { const hh = h * (0.45 + 0.3 * Math.abs(Math.sin(x * 0.11))); c.beginPath(); c.arc(x0 + x, base - hh * 0.4, hh * 0.5, 0, 7); c.fill(); }
    // açaizeiros (tronco fininho e folhas)
    c.strokeStyle = "#5c4a2e"; c.lineWidth = 2;
    for (let x = 30; x < w; x += 70) {
      const tx = x0 + x - (desl * 0.4) % 70, top = base - h * 1.3;
      c.beginPath(); c.moveTo(tx, base); c.quadraticCurveTo(tx + 4, base - h * 0.6, tx + 2, top); c.stroke();
      c.strokeStyle = "#2f9e44";
      for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * 0.5; c.beginPath(); c.moveTo(tx + 2, top); c.quadraticCurveTo(tx + 2 + Math.cos(a) * h * 0.3, top + Math.sin(a) * h * 0.2 - 4, tx + 2 + Math.cos(a) * h * 0.5, top + h * 0.15); c.stroke(); }
      c.strokeStyle = "#5c4a2e";
    }
    c.fillStyle = "#1e5b2c"; c.fillRect(x0, base - h * 0.15, w, h * 0.15);
  }
  // Peixe de lado (dir: 1 olha para a direita), com os detalhes de cada espécie
  function desenharPeixe(c, sp, x, y, L, dir, t, alfa) {
    const H = L * sp.alt, nome = sp.nome;
    c.save(); c.translate(x, y); c.scale(dir, 1); c.globalAlpha = alfa;
    const balanco = Math.sin(t * 9) * H * 0.18;
    // rabo
    c.fillStyle = nome === "Tucunaré" || nome === "Pirarucu" ? sp.cor[1] : sp.cor[0];
    if (nome === "Jaraqui") c.fillStyle = "#e9ecef";
    c.beginPath(); c.moveTo(-L * 0.36, 0); c.lineTo(-L * 0.52, -H * 0.5 + balanco); c.lineTo(-L * 0.46, balanco); c.lineTo(-L * 0.52, H * 0.5 + balanco); c.closePath(); c.fill();
    if (nome === "Jaraqui") { c.fillStyle = "#212529"; for (let k = 0; k < 3; k++) c.fillRect(-L * 0.5, -H * 0.4 + k * H * 0.32 + balanco, L * 0.08, H * 0.1); }
    // nadadeiras
    c.fillStyle = sp.cor[0];
    if (nome === "Acari-bodó") { c.beginPath(); c.moveTo(-L * 0.1, -H * 0.4); c.quadraticCurveTo(L * 0.05, -H * 1.25, L * 0.18, -H * 0.42); c.fill(); }
    else if (nome === "Aruanã") { c.beginPath(); c.moveTo(-L * 0.05, -H * 0.4); c.lineTo(-L * 0.38, -H * 0.2); c.lineTo(-L * 0.36, 0); c.fill(); c.beginPath(); c.moveTo(-L * 0.05, H * 0.4); c.lineTo(-L * 0.38, H * 0.2); c.lineTo(-L * 0.36, 0); c.fill(); }
    else { c.beginPath(); c.moveTo(-L * 0.12, -H * 0.42); c.quadraticCurveTo(0, -H * 0.85, L * 0.08, -H * 0.45); c.fill(); }
    // corpo (dorso escuro, barriga clara)
    const g = c.createLinearGradient(0, -H / 2, 0, H / 2);
    g.addColorStop(0, sp.cor[0]); g.addColorStop(0.55, sp.cor[0]);
    g.addColorStop(1, nome === "Piranha" || nome === "Pacu" ? sp.cor[1] : nome === "Tambaqui" ? "#2b3036" : "#f1f3f5");
    c.fillStyle = g;
    c.beginPath(); c.moveTo(L * 0.5, nome === "Acari-bodó" ? H * 0.2 : 0);
    c.quadraticCurveTo(L * 0.3, -H * 0.62, -L * 0.1, -H * 0.5);
    c.quadraticCurveTo(-L * 0.32, -H * 0.38, -L * 0.38, 0);
    c.quadraticCurveTo(-L * 0.32, H * 0.38, -L * 0.1, H * (nome === "Acari-bodó" ? 0.35 : 0.5));
    c.quadraticCurveTo(L * 0.3, H * (nome === "Acari-bodó" ? 0.4 : 0.6), L * 0.5, nome === "Acari-bodó" ? H * 0.2 : 0);
    c.fill();
    // desenhos de cada espécie
    c.save(); c.clip();
    if (nome === "Tucunaré") { c.fillStyle = "rgba(30,40,20,.55)"; for (let k = 0; k < 3; k++) c.fillRect(L * (0.18 - k * 0.17), -H * 0.6, L * 0.05, H * 0.8); }
    if (nome === "Pirarucu") { for (let k = 0; k < 9; k++) { c.fillStyle = `rgba(201,42,42,${0.2 + k * 0.08})`; c.beginPath(); c.arc(L * (0.1 - k * 0.055), H * (0.05 + (k % 2) * 0.12), H * 0.16, 0, 7); c.fill(); } }
    if (nome === "Surubim" || nome === "Acari-bodó") { c.fillStyle = "rgba(20,20,20,.5)"; for (let k = 0; k < 14; k++) { c.beginPath(); c.arc(L * (0.35 - (k % 7) * 0.1), H * (-0.25 + Math.floor(k / 7) * 0.2), H * 0.06, 0, 7); c.fill(); } }
    if (nome === "Aruanã" || nome === "Matrinxã" || nome === "Jaraqui") { c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 1; for (let k = 0; k < 7; k++) { c.beginPath(); c.arc(L * (0.3 - k * 0.09), 0, H * 0.25, -1, 1); c.stroke(); } }
    c.fillStyle = "rgba(255,255,255,.18)"; c.beginPath(); c.ellipse(L * 0.1, -H * 0.2, L * 0.28, H * 0.12, 0, 0, 7); c.fill();
    c.restore();
    // ocelo do tucunaré (o "olho" no rabo)
    if (nome === "Tucunaré") { c.fillStyle = "#f76707"; c.beginPath(); c.arc(-L * 0.36, -H * 0.05, H * 0.17, 0, 7); c.fill(); c.fillStyle = "#111"; c.beginPath(); c.arc(-L * 0.36, -H * 0.05, H * 0.1, 0, 7); c.fill(); }
    // olho, boca e bigodes
    c.fillStyle = "#fff"; c.beginPath(); c.arc(L * 0.33, -H * 0.1, Math.max(1.5, H * 0.1), 0, 7); c.fill();
    c.fillStyle = "#111"; c.beginPath(); c.arc(L * 0.34, -H * 0.1, Math.max(1, H * 0.06), 0, 7); c.fill();
    if (nome === "Piranha") { c.fillStyle = "#fff"; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(L * (0.4 + k * 0.025), H * 0.12); c.lineTo(L * (0.41 + k * 0.025), H * 0.03); c.lineTo(L * (0.42 + k * 0.025), H * 0.12); c.fill(); } }
    if (nome === "Surubim" || nome === "Aruanã") { c.strokeStyle = "#343a40"; c.lineWidth = Math.max(1, H * 0.04); c.beginPath(); c.moveTo(L * 0.47, H * 0.05); c.quadraticCurveTo(L * 0.6, H * 0.4, L * 0.7, H * 0.3 + balanco * 0.3); c.moveTo(L * 0.48, 0); c.quadraticCurveTo(L * 0.62, -H * 0.1, L * 0.72, H * 0.05); c.stroke(); }
    c.restore();
  }
  function desenharBoto(c, x, y, L, dir, t) {
    c.save(); c.translate(x, y); c.scale(dir, 1);
    const H = L * 0.28, b = Math.sin(t * 4) * H * 0.2;
    c.fillStyle = "#f3a6b8";
    c.beginPath(); c.moveTo(-L * 0.4, b); c.lineTo(-L * 0.55, -H * 0.35 + b); c.lineTo(-L * 0.55, H * 0.35 + b); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(L * 0.62, H * 0.08); c.lineTo(L * 0.38, -H * 0.05); c.quadraticCurveTo(L * 0.3, -H * 0.7, 0, -H * 0.5); c.quadraticCurveTo(-L * 0.35, -H * 0.3, -L * 0.42, 0); c.quadraticCurveTo(-L * 0.2, H * 0.5, L * 0.3, H * 0.35); c.lineTo(L * 0.62, H * 0.14); c.closePath(); c.fill();
    c.fillStyle = "#e88aa3"; c.beginPath(); c.moveTo(-L * 0.05, -H * 0.45); c.lineTo(-L * 0.15, -H * 0.62); c.lineTo(-L * 0.2, -H * 0.38); c.fill();
    c.fillStyle = "#111"; c.beginPath(); c.arc(L * 0.3, -H * 0.12, H * 0.06, 0, 7); c.fill();
    c.restore();
  }
  function desenharPeixeBoi(c, x, y, L, dir, t) {
    c.save(); c.translate(x, y); c.scale(dir, 1);
    const H = L * 0.42;
    c.fillStyle = "#6c757d";
    c.beginPath(); c.ellipse(-L * 0.45, Math.sin(t * 2) * H * 0.1, L * 0.14, H * 0.32, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(0, 0, L * 0.42, H * 0.5, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(L * 0.38, H * 0.05, L * 0.16, H * 0.3, 0, 0, 7); c.fill();
    c.fillStyle = "#868e96"; c.beginPath(); c.ellipse(L * 0.1, H * 0.35, L * 0.08, H * 0.2, 0.6, 0, 7); c.fill();
    c.fillStyle = "#111"; c.beginPath(); c.arc(L * 0.42, -H * 0.05, H * 0.05, 0, 7); c.fill();
    c.restore();
  }
  function desenharLixo(c, tipo, x, y, s) {
    c.save(); c.translate(x, y);
    if (tipo === "garrafa") { c.fillStyle = "rgba(140,220,180,.7)"; c.beginPath(); c.roundRect(-s * 0.5, -s * 0.15, s * 0.8, s * 0.3, s * 0.1); c.fill(); c.fillRect(s * 0.3, -s * 0.07, s * 0.2, s * 0.14); c.fillStyle = "#1c7ed6"; c.fillRect(s * 0.48, -s * 0.08, s * 0.08, s * 0.16); }
    else if (tipo === "lata") { c.fillStyle = "#c92a2a"; c.fillRect(-s * 0.18, -s * 0.28, s * 0.36, s * 0.56); c.fillStyle = "#adb5bd"; c.fillRect(-s * 0.18, -s * 0.3, s * 0.36, s * 0.06); }
    else { c.fillStyle = "rgba(248,249,250,.85)"; c.beginPath(); c.moveTo(-s * 0.4, -s * 0.3); c.quadraticCurveTo(0, -s * 0.5, s * 0.4, -s * 0.3); c.quadraticCurveTo(s * 0.5, s * 0.3, 0, s * 0.35); c.quadraticCurveTo(-s * 0.5, s * 0.3, -s * 0.4, -s * 0.3); c.fill(); }
    c.restore();
  }

  function pescar(area, op, fid) {
    const rio = RIOS[op.rio] || RIOS.negro, facil = op.briga === "facil", desafio = op.modo === "tempo";
    const pequeno = fid === "5-6";
    // Pescaria livre também tem meta: pescar 5 peixes (3 para 5 a 6 anos); o desafio é por tempo
    const META = pequeno ? 3 : 5;
    let pausado = false;
    const P = Palco.criar(area, { classe: "pescaria-tela", aoPausar: () => { pausado = !pausado; P.pausa.textContent = pausado ? "▶️" : "⏸️"; } });
    const ctx = P.ctx;
    let W = 0, H = 0, agua = 0, fundo = 0, esc = 1;
    const medir = () => { W = P.W; H = P.H; agua = H * 0.36; fundo = H * 0.96; esc = Math.min(W, H * 1.6) / 1000; posicionar(); };
    // ----- Estado -----
    let fase = "pronto", forca = 0, forcaT = 0, isca = { x: 0, prof: 0.3 }, peixeNaIsca = null, belisco = 0, mergulho = 0;
    let briga = null, msg = null, ficha = null, confete = [], tempo = 0, pegos = [], lixos = 0, tempoRestante = 180;
    const vivos = []; // peixes e outros no rio
    const yDe = prof => agua + (fundo - agua) * prof;
    const tamanhoPx = sp => Math.min(H * 0.42, (40 + sp.len * 110) * esc * 0.95);
    function novoPeixe(primeiro) {
      const ids = Object.keys(PEIXES), pesos = ids.map(id => PEIXES[id].raro);
      let r = Math.random() * pesos.reduce((a, b) => a + b, 0), id = ids[0];
      for (let i = 0; i < ids.length; i++) { r -= pesos[i]; if (r <= 0) { id = ids[i]; break; } }
      const sp = PEIXES[id], dir = Math.random() < 0.5 ? 1 : -1;
      vivos.push({ tipo: "peixe", id, sp, x: primeiro ? W * (0.2 + Math.random() * 0.8) : dir > 0 ? -100 : W + 100, prof: sp.prof[0] + Math.random() * (sp.prof[1] - sp.prof[0]), dir, vel: (30 + Math.random() * 40) * esc, t: Math.random() * 10, susto: 0, interesse: 0 });
    }
    function novoOutro(tipo) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      if (tipo === "lixo") vivos.push({ tipo: "lixo", lixo: Motor.sortear(LIXO), x: W * (0.35 + Math.random() * 0.6), prof: 0.3 + Math.random() * 0.65, dir: 1, vel: 0, t: 0 });
      else vivos.push({ tipo, x: dir > 0 ? -200 : W + 200, prof: tipo === "boto" ? 0.25 : 0.55, dir, vel: (tipo === "boto" ? 70 : 25) * esc, t: 0 });
    }

    // ----- Botões -----
    const bLancar = P.botao("🎣<small>LANÇAR</small>", v => { if (v) comecarLancar(); else soltarLancar(); }, { segurar: true, classe: "principal" });
    const bFisgar = P.botao("❗<small>FISGAR!</small>", () => fisgar(), { classe: "principal" });
    const bRecolher = P.botao("🌀<small>RECOLHER</small>", v => { if (briga) briga.puxando = v; }, { segurar: true, classe: "principal" });
    const bSobe = P.botao("⬆️", v => { subir = v ? -1 : subir === -1 ? 0 : subir; }, { segurar: true });
    const bDesce = P.botao("⬇️", v => { subir = v ? 1 : subir === 1 ? 0 : subir; }, { segurar: true });
    const bVoltar = P.botao("🔁<small>recolher isca</small>", () => recolherIsca());
    P.controles.append(bLancar, bFisgar, bRecolher, bSobe, bDesce, bVoltar);
    let subir = 0;
    function posicionar() {
      [bLancar, bFisgar, bRecolher].forEach(b => Object.assign(b.style, { right: "12px", bottom: "12px", minWidth: "140px", minHeight: "96px" }));
      Object.assign(bSobe.style, { left: "12px", bottom: "104px" });
      Object.assign(bDesce.style, { left: "12px", bottom: "12px" });
      Object.assign(bVoltar.style, { left: "108px", bottom: "12px" });
    }
    function botoes() {
      bLancar.hidden = fase !== "pronto" && fase !== "lancando";
      bFisgar.hidden = fase !== "esperando";
      bRecolher.hidden = fase !== "briga";
      bSobe.hidden = bDesce.hidden = bVoltar.hidden = fase !== "esperando";
    }
    P.teclas((e, d) => {
      const k = e.key;
      if (k === "Enter" || k === " ") {
        e.preventDefault();
        if (fase === "pronto" || fase === "lancando") { if (d && !e.repeat) comecarLancar(); else if (!d) soltarLancar(); }
        else if (fase === "esperando" && d) fisgar();
        else if (fase === "briga" && briga) briga.puxando = d;
        else if (fase === "ficha" && d && ficha) ficha.fechar();
      } else if (k === "ArrowUp") subir = d ? -1 : subir === -1 ? 0 : subir;
      else if (k === "ArrowDown") subir = d ? 1 : subir === 1 ? 0 : subir;
      else if ((k === "Backspace" || k === "r") && d && fase === "esperando") recolherIsca();
    });
    // tocar nos animais protegidos mostra a ficha deles; tocar na água (esperando) fisga
    P.canvas.addEventListener("pointerdown", e => {
      Motor.audio();
      const r = P.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const prot = vivos.find(v => (v.tipo === "boto" || v.tipo === "peixeboi") && Math.hypot(v.x - x, yDe(v.prof) - y) < 80 * esc * 1.5);
      if (prot) { const p = PROTEGIDOS[prot.tipo]; msg = { txt: `${prot.tipo === "boto" ? "🐬" : "💚"} ${p.nome}: protegido!`, t: 3 }; Motor.falar(p.info); return; }
      if (fase === "esperando" && y > agua) fisgar();
    });

    // ----- Lançar, esperar, fisgar -----
    function comecarLancar() { if (fase !== "pronto") return; fase = "lancando"; forcaT = 0; botoes(); }
    function soltarLancar() {
      if (fase !== "lancando") return;
      const alvoX = W * 0.36 + forca * W * 0.56;
      isca = { x: alvoX, prof: 0.02, voo: 0, x0: W * 0.3, y0: H * 0.12 };
      fase = "voando"; botoes();
      Motor.ruido({ dur: 0.35, vol: 0.12, filtro: "highpass", freq: 2500 });
    }
    function recolherIsca() { if (fase !== "esperando") return; fase = "pronto"; peixeNaIsca = null; botoes(); Motor.ruido({ dur: 0.3, vol: 0.08, freq: 800 }); }
    function fisgar() {
      if (fase !== "esperando") return;
      if (peixeNaIsca && mergulho > 0) {
        const alvo = peixeNaIsca;
        if (alvo.tipo === "lixo") return pegar(alvo);
        const sp = alvo.sp;
        briga = { peixe: alvo, dist: Math.max(0.35, (isca.x - W * 0.3) / (W * 0.6)), tensao: 0.3, puxando: false, foge: 0, tempo: 0 };
        fase = "briga"; botoes();
        Motor.falar(pequeno ? "Fisgou! Segure recolher para puxar!" : "Fisgou! Segure recolher, mas cuidado com a tensão da linha!");
        Motor.nota(520, { dur: 0.12, tipo: "square", vol: 0.1 });
        return;
      }
      // cedo demais: o peixe se assusta
      msg = { txt: peixeNaIsca ? "Cedo demais! Espere a boia afundar." : "Nada ainda... espere a boia mexer.", t: 1.8 };
      if (peixeNaIsca) { peixeNaIsca.susto = 3; peixeNaIsca.dir *= -1; peixeNaIsca = null; belisco = 0; }
    }
    function pegar(alvo) {
      const i = vivos.indexOf(alvo); if (i >= 0) vivos.splice(i, 1);
      peixeNaIsca = null; briga = null; belisco = 0; mergulho = 0;
      if (alvo.tipo === "lixo") {
        lixos++;
        msg = { txt: "🌎 Você tirou lixo do rio!", t: 2.4 };
        Motor.falar(`Você tirou ${alvo.lixo[1]} do rio! Os peixes agradecem!`);
        Motor.tim(); fase = "pronto"; botoes();
        return;
      }
      const sp = alvo.sp;
      const tam = Math.round(sp.len * 100 * (0.7 + Math.random() * 0.35));
      pegos.push({ id: alvo.id, tam });
      const cad = caderno(), novo = !cad[alvo.id];
      cad[alvo.id] = Math.max(cad[alvo.id] || 0, tam);
      try { localStorage.setItem(CHAVE_CADERNO, JSON.stringify(cad)); } catch (e) { /* ok */ }
      Palco.confete(confete, W / 2, H * 0.3, ["#ffd43b", "#69db7c", "#4dabf7", "#fff"], novo ? 90 : 40);
      Motor.comemorar(P.canvas);
      mostrarFicha(alvo, tam, novo);
    }
    function mostrarFicha(alvo, tam, novo) {
      fase = "ficha"; botoes();
      const sp = alvo.sp, el = document.createElement("div");
      el.className = "arcade-fim pesca-ficha";
      const cv = document.createElement("canvas"); cv.width = 320; cv.height = 150;
      const c = cv.getContext("2d");
      const g = c.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, rio.agua[0]); g.addColorStop(1, rio.agua[1]);
      c.fillStyle = g; c.beginPath(); c.roundRect(0, 0, 320, 150, 16); c.fill();
      desenharPeixe(c, sp, 160, 78, sp.len > 1 ? 280 : 150 + sp.len * 120, 1, 0, 1);
      el.innerHTML = `<div class="titulo-fim"></div><div class="pf-tam"></div><p class="pf-info"></p><div class="pf-caderno"></div>`;
      el.prepend(cv);
      el.querySelector(".titulo-fim").textContent = `${novo ? "✨ Peixe novo! " : ""}${sp.nome}`;
      el.querySelector(".pf-tam").textContent = `📏 ${tam} cm`;
      el.querySelector(".pf-info").textContent = sp.info;
      const total = Object.keys(caderno()).length;
      el.querySelector(".pf-caderno").textContent = `📖 Caderno: ${total} de ${Object.keys(PEIXES).length} peixes`;
      const fechar = () => {
        el.remove(); ficha = null;
        if (fase === "ficha") { fase = "pronto"; botoes(); }
        if (!desafio && pegos.length >= META && fase !== "fim") terminar();
        else if (!desafio) { const f = META - pegos.length; Motor.falar(`Falta${f > 1 ? "m" : ""} ${f} ${f === 1 ? "peixe" : "peixes"}!`, { naFila: true }); }
      };
      const b1 = Object.assign(document.createElement("button"), { className: "chip executar", textContent: sp.manejo ? "🌿 Devolver ao rio (manejo)" : "🐟 Soltar no rio" });
      const b2 = Object.assign(document.createElement("button"), { className: "chip", textContent: "🧺 Guardar no cesto" });
      b1.addEventListener("click", () => { Motor.falar("Tchau, peixinho! Volte para o rio!"); fechar(); });
      b2.addEventListener("click", fechar);
      el.append(b1);
      if (!sp.manejo) el.append(b2);
      P.tela.appendChild(el);
      ficha = { fechar };
      Motor.falar(`${novo ? "Peixe novo! " : ""}Você pescou um ${sp.nome} de ${tam} centímetros! ${sp.info}`);
    }

    // ----- Atualização -----
    function atualizar(dt) {
      tempo += dt;
      if (desafio && fase !== "fim") { tempoRestante -= dt; if (tempoRestante <= 0) return terminar(); }
      if (fase === "lancando") { forcaT += dt * 1.3; forca = 0.5 - 0.5 * Math.cos(forcaT * Math.PI); }
      if (fase === "voando") {
        isca.voo += dt * 1.6;
        if (isca.voo >= 1) { fase = "esperando"; isca.prof = 0.05; botoes(); Motor.ruido({ dur: 0.2, vol: 0.12, freq: 600 }); }
      }
      if (fase === "esperando") {
        isca.prof = Math.max(0.03, Math.min(0.96, isca.prof + subir * dt * 0.35 + (subir === 0 && isca.prof < 0.25 ? dt * 0.08 : 0)));
        // beliscadas e o mergulho da boia
        if (peixeNaIsca) {
          belisco -= dt;
          if (mergulho > 0) { mergulho -= dt; if (mergulho <= 0) { msg = { txt: "Escapou! Fisgue quando a boia afundar.", t: 1.6 }; peixeNaIsca.susto = 3; peixeNaIsca.dir *= -1; peixeNaIsca = null; } }
          else if (belisco <= 0) {
            peixeNaIsca.mordidas = (peixeNaIsca.mordidas || 0) + 1;
            if (peixeNaIsca.mordidas >= (peixeNaIsca.tipo === "lixo" ? 1 : 2 + Math.floor(Math.random() * 2))) { mergulho = pequeno ? 1.3 : 0.85; Motor.nota(330, { dur: 0.1, tipo: "triangle", vol: 0.12 }); }
            else { belisco = 0.6 + Math.random() * 0.7; Motor.nota(600, { dur: 0.04, tipo: "triangle", vol: 0.06 }); }
          }
        }
      }
      // peixes nadando; os que estão perto da isca se interessam
      const ix = isca.x, iy = yDe(isca.prof);
      vivos.forEach(v => {
        v.t += dt;
        if (v.tipo === "lixo") { v.x += Math.sin(v.t * 0.5) * 3 * dt; if (fase === "esperando" && !peixeNaIsca && Math.hypot(v.x - ix, yDe(v.prof) - iy) < 45 * esc) { peixeNaIsca = v; belisco = 0.3; v.mordidas = 0; } return; }
        if (v === (briga && briga.peixe)) return;
        if (v === peixeNaIsca) { v.x += (ix - v.dir * tamanhoPx(v.sp) * 0.48 - v.x) * Math.min(1, dt * 4); v.prof += (isca.prof - v.prof) * Math.min(1, dt * 4); return; }
        const perto = v.tipo === "peixe" && fase === "esperando" && !peixeNaIsca && v.susto <= 0 && Math.abs(v.prof - isca.prof) < 0.18 && Math.abs(v.x - ix) < W * 0.3;
        if (perto) {
          v.dir = ix > v.x ? 1 : -1;
          v.x += v.dir * v.vel * 1.3 * dt; v.prof += (isca.prof - v.prof) * Math.min(1, dt * 1.5);
          if (Math.abs(v.x + v.dir * tamanhoPx(v.sp) * 0.48 - ix) < 14 * esc) { peixeNaIsca = v; belisco = 0.4; v.mordidas = 0; mergulho = 0; }
        } else {
          v.susto = Math.max(0, v.susto - dt);
          v.x += v.dir * v.vel * (v.susto > 0 ? 2.5 : 1) * dt;
          if (v.tipo === "peixe") v.prof = Math.max(v.sp.prof[0], Math.min(v.sp.prof[1], v.prof + Math.sin(v.t * 0.7) * 0.02 * dt));
          if (v.tipo === "boto") v.prof = 0.22 + Math.sin(v.t * 0.9) * 0.2;
        }
      });
      for (let i = vivos.length - 1; i >= 0; i--) { const v = vivos[i]; if (v.tipo !== "lixo" && (v.x < -260 || v.x > W + 260) && v !== peixeNaIsca) vivos.splice(i, 1); }
      // população do rio
      if (vivos.filter(v => v.tipo === "peixe").length < (pequeno ? 9 : 7)) novoPeixe(false);
      if (!vivos.some(v => v.tipo === "lixo") && Math.random() < dt * 0.04) novoOutro("lixo");
      if (!vivos.some(v => v.tipo === "boto") && Math.random() < dt * 0.025) novoOutro("boto");
      if (!vivos.some(v => v.tipo === "peixeboi") && Math.random() < dt * 0.012) novoOutro("peixeboi");
      // briga
      if (fase === "briga" && briga) {
        const b = briga, sp = b.peixe.sp, f = sp.forca * (facil ? 0.6 : 1) * (pequeno ? 0.6 : 1);
        b.tempo += dt;
        const arranque = Math.max(0, Math.sin(b.tempo * (1.5 + f * 2))) * f; // o peixe dá puxões
        // segurando: puxa o peixe e a tensão sobe (mais nos puxões dele); soltando: a tensão cai e ele se afasta um pouco
        if (b.puxando) { b.tensao += (0.16 + arranque * 0.5) * dt; b.dist -= (0.2 - f * 0.07) * dt * (1 - arranque * 0.5); }
        else { b.tensao -= 0.5 * dt; b.dist += (0.03 + arranque * 0.06) * dt; }
        b.tensao = Math.max(0, b.tensao);
        b.peixe.x = W * 0.3 + b.dist * W * 0.6 + Math.sin(b.tempo * 3) * 20 * esc; b.peixe.prof = Math.max(0.08, Math.min(0.9, b.peixe.prof + Math.sin(b.tempo * 2.3) * dt * 0.2));
        b.peixe.dir = Math.sin(b.tempo * 1.7) > 0 ? 1 : -1;
        if (b.puxando && Math.random() < dt * 8) Motor.ruido({ dur: 0.05, vol: 0.05, freq: 1200 });
        const limite = facil ? 1.25 : 1;
        if (b.tensao > limite || (sp.corta && b.tempo > 6 && Math.random() < dt * 0.15)) { msg = { txt: sp.corta ? "A piranha cortou a linha! ✂️" : "A linha arrebentou! Solte quando ficar vermelho.", t: 2.4 }; Motor.falar(sp.corta ? "A piranha cortou a linha!" : "Ih, a linha arrebentou!"); b.peixe.susto = 4; briga = null; fase = "pronto"; botoes(); }
        else if (b.dist > 1.15) { msg = { txt: "O peixe escapou! Puxe mais vezes.", t: 2.2 }; Motor.falar("O peixe escapou!"); b.peixe.susto = 4; briga = null; fase = "pronto"; botoes(); }
        else if (b.dist <= 0.02) pegar(b.peixe);
      }
    }
    function terminar() {
      fase = "fim"; botoes();
      const det = `🐟 ${pegos.length} peixes · 🌎 ${lixos} lixos tirados do rio · 📖 ${Object.keys(caderno()).length}/10 espécies no caderno`;
      Placar.recorde("pescaria", "peixes", pegos.length);
      Motor.falar(desafio ? `Acabou o tempo! Você pescou ${pegos.length} peixes!` : `Parabéns! Você pescou os ${META} peixes!`);
      P.fim(desafio ? "Fim da pescaria!" : `${META} peixes pescados!`, "🎣", det, [
        { rotulo: "🔁 Pescar de novo", principal: true, aoClicar: () => pescar(area, op, fid) },
        { rotulo: "⚙️ Trocar opções", aoClicar: () => JOGOS.find(j => j.id === "pescaria").iniciar(area, { id: fid }) },
      ]);
    }

    // ----- Desenho -----
    function desenhar(dt) {
      const s = P.esc();
      // céu, sol e nuvens
      const g = ctx.createLinearGradient(0, 0, 0, agua);
      g.addColorStop(0, "#4dabf7"); g.addColorStop(1, "#d0ebff");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, agua);
      ctx.fillStyle = "rgba(255,245,200,.9)"; ctx.beginPath(); ctx.arc(W * 0.82, agua * 0.28, H * 0.05, 0, 7); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.85)";
      for (let i = 0; i < 4; i++) { const x = ((i * 330 + tempo * 8) % (W + 300)) - 150, y = agua * (0.15 + (i % 2) * 0.12); ctx.beginPath(); ctx.ellipse(x, y, 60 * esc * 1.5, 18 * esc * 1.5, 0, 0, 7); ctx.ellipse(x + 40 * esc, y - 10 * esc, 40 * esc, 16 * esc, 0, 0, 7); ctx.fill(); }
      floresta(ctx, 0, agua, W, agua * 0.45);
      // água (corte por baixo) com raios de luz
      const ga = ctx.createLinearGradient(0, agua, 0, H);
      ga.addColorStop(0, rio.agua[0]); ga.addColorStop(1, rio.agua[1]);
      ctx.fillStyle = ga; ctx.fillRect(0, agua, W, H - agua);
      ctx.fillStyle = `rgba(255,255,220,${0.05 + rio.vis * 0.05})`;
      for (let i = 0; i < 5; i++) { const x = (i * W / 4 + Math.sin(tempo * 0.3 + i) * 30); ctx.beginPath(); ctx.moveTo(x, agua); ctx.lineTo(x + 60 * esc, agua); ctx.lineTo(x + 160 * esc, H); ctx.lineTo(x + 90 * esc, H); ctx.fill(); }
      // fundo do rio: areia, pedras e galhos
      ctx.fillStyle = "#3b2a1a"; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, fundo + Math.sin(x * 0.02) * 8 * esc);
      ctx.lineTo(W, H); ctx.fill();
      ctx.strokeStyle = "#2b1d10"; ctx.lineWidth = 6 * esc;
      ctx.beginPath(); ctx.moveTo(W * 0.62, fundo); ctx.quadraticCurveTo(W * 0.7, fundo - 70 * esc, W * 0.8, fundo - 40 * esc); ctx.stroke();
      // plantas aquáticas
      ctx.strokeStyle = "rgba(47,158,68,.7)"; ctx.lineWidth = 4 * esc;
      for (let x = 30; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, fundo); ctx.quadraticCurveTo(x + Math.sin(tempo + x) * 15, fundo - 60 * esc, x + Math.sin(tempo * 1.3 + x) * 20, fundo - 120 * esc); ctx.stroke(); }
      // bichos do rio (a água escura esconde quem está longe da isca)
      vivos.forEach(v => {
        const y = yDe(v.prof);
        let alfa = v.tipo === "lixo" ? 0.9 : Math.max(0.15, Math.min(1, rio.vis + 0.6 - v.prof * 0.7 + (Math.hypot(v.x - isca.x, y - yDe(isca.prof)) < 120 * esc ? 0.4 : 0)));
        if (v.tipo === "peixe") desenharPeixe(ctx, v.sp, v.x, y, tamanhoPx(v.sp), v.dir, v.t, alfa);
        else if (v.tipo === "boto") desenharBoto(ctx, v.x, y, 190 * esc * 1.3, v.dir, v.t);
        else if (v.tipo === "peixeboi") desenharPeixeBoi(ctx, v.x, y, 230 * esc * 1.3, v.dir, v.t);
        else desenharLixo(ctx, v.lixo[0], v.x, y, 50 * esc * 1.3);
      });
      // superfície com ondinhas e aguapés
      ctx.fillStyle = rio.sup; ctx.globalAlpha = 0.6; ctx.fillRect(0, agua - 3, W, 8); ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2;
      ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, agua + Math.sin(x * 0.05 + tempo * 2) * 2); ctx.stroke();
      ctx.fillStyle = "#37b24d";
      [0.55, 0.58, 0.9].forEach((f, i) => { ctx.beginPath(); ctx.ellipse(W * f + Math.sin(tempo * 0.5 + i) * 5, agua, 26 * esc, 6 * esc, 0, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#cc5de8"; ctx.beginPath(); ctx.arc(W * 0.56, agua - 8 * esc, 6 * esc, 0, 7); ctx.fill();
      desenharCanoa(s);
      desenharLinha();
      painel(s);
      Palco.desenharConfete(ctx, confete, dt);
      if (msg) { Palco.texto(ctx, msg.txt, W / 2, agua * 0.55, Math.min(28 * s, W / 20), "#fff"); msg.t -= dt; if (msg.t <= 0) msg = null; }
      if (pausado) Palco.texto(ctx, "⏸️ Pausa", W / 2, H / 2, 54 * s);
    }
    // canoa de madeira com a criança e a vara
    function desenharCanoa() {
      const cx = W * 0.15, k = esc * 1.4;
      ctx.fillStyle = "#6b3e1f";
      ctx.beginPath(); ctx.moveTo(cx - 130 * k, agua - 22 * k); ctx.lineTo(cx + 130 * k, agua - 22 * k); ctx.quadraticCurveTo(cx + 110 * k, agua + 14 * k, cx + 70 * k, agua + 16 * k); ctx.lineTo(cx - 70 * k, agua + 16 * k); ctx.quadraticCurveTo(cx - 110 * k, agua + 14 * k, cx - 130 * k, agua - 22 * k); ctx.fill();
      ctx.fillStyle = "#8a5a2b"; ctx.fillRect(cx - 120 * k, agua - 24 * k, 240 * k, 6 * k);
      // criança sentada (chapéu de palha e colete salva-vidas)
      const px = cx + 10 * k, py = agua - 24 * k;
      ctx.fillStyle = "#f76707"; ctx.beginPath(); ctx.roundRect(px - 16 * k, py - 46 * k, 32 * k, 40 * k, 8 * k); ctx.fill();
      ctx.fillStyle = "#c68642"; ctx.beginPath(); ctx.arc(px, py - 60 * k, 15 * k, 0, 7); ctx.fill();
      ctx.fillStyle = "#e9c46a"; ctx.beginPath(); ctx.ellipse(px, py - 70 * k, 26 * k, 6 * k, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(px, py - 72 * k, 12 * k, Math.PI, 0); ctx.fill();
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(px + 6 * k, py - 61 * k, 2 * k, 0, 7); ctx.fill();
      // vara (curva mais na briga)
      const tensao = briga ? Math.min(1.3, briga.tensao) : 0;
      const ponta = varaPonta();
      ctx.strokeStyle = "#5c3a1e"; ctx.lineWidth = 4 * k; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(px + 12 * k, py - 30 * k); ctx.quadraticCurveTo(px + 70 * k, py - 120 * k + tensao * 40 * k, ponta[0], ponta[1]); ctx.stroke(); ctx.lineCap = "butt";
      ctx.strokeStyle = "#f1c27d"; ctx.lineWidth = 5 * k; ctx.beginPath(); ctx.moveTo(px + 4 * k, py - 36 * k); ctx.lineTo(px + 14 * k, py - 30 * k); ctx.stroke();
    }
    function varaPonta() { const k = esc * 1.4, t = briga ? Math.min(1.3, briga.tensao) : 0; return [W * 0.15 + 150 * k, agua - 150 * k + t * 70 * k]; }
    function desenharLinha() {
      const [vx, vy] = varaPonta();
      ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.2;
      if (fase === "voando") {
        const t = isca.voo, x = vx + (isca.x - vx) * t, y = vy + (agua - vy) * t - Math.sin(t * Math.PI) * H * 0.18;
        ctx.beginPath(); ctx.moveTo(vx, vy); ctx.quadraticCurveTo((vx + x) / 2, Math.min(vy, y) - 20, x, y); ctx.stroke();
        ctx.fillStyle = "#e03131"; ctx.beginPath(); ctx.arc(x, y, 6 * esc * 1.3, 0, 7); ctx.fill();
        return;
      }
      if (fase !== "esperando" && fase !== "briga") return;
      const iy = briga ? yDe(briga.peixe.prof) : yDe(isca.prof), ix = briga ? briga.peixe.x + briga.peixe.dir * tamanhoPx(briga.peixe.sp) * 0.48 : isca.x;
      const boiaX = briga ? ix : isca.x;
      const afunda = mergulho > 0 ? 14 * esc * 1.3 : peixeNaIsca && belisco > 0.4 ? Math.sin(tempo * 30) * 4 : Math.sin(tempo * 2) * 1.5;
      ctx.beginPath(); ctx.moveTo(vx, vy); ctx.quadraticCurveTo((vx + boiaX) / 2, briga ? vy + 20 : agua - 10, boiaX, agua + afunda); ctx.lineTo(ix, iy); ctx.stroke();
      // boia vermelha e branca
      if (!briga) {
        const by = agua + afunda, r = 8 * esc * 1.3;
        ctx.fillStyle = "#e03131"; ctx.beginPath(); ctx.arc(boiaX, by - r * 0.3, r, Math.PI, 0); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(boiaX, by - r * 0.3, r, 0, Math.PI); ctx.fill();
        // anzol com a isca (minhoca)
        ctx.strokeStyle = "#ced4da"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ix, iy + 6, 5, 0, Math.PI); ctx.stroke();
        ctx.strokeStyle = "#e599a3"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ix - 4, iy + 8); ctx.quadraticCurveTo(ix, iy + 14 + Math.sin(tempo * 6) * 3, ix + 5, iy + 10); ctx.stroke();
      }
    }
    function painel(s) {
      const k = Math.min(1.4, s);
      // cesto e caderno
      Palco.caixa(ctx, 74, 10, 230 * k, 34 * k, 10);
      Palco.texto(ctx, `🧺 ${pegos.length}${desafio ? "" : ` de ${META}`}   📖 ${Object.keys(caderno()).length}/10   🌎 ${lixos}`, 74 + 12, 10 + 17 * k, 17 * k, "#fff", { alinhar: "left", contorno: null });
      if (desafio) { const t = Math.max(0, Math.ceil(tempoRestante)); Palco.caixa(ctx, W / 2 - 60 * k, 10, 120 * k, 34 * k, 10, t <= 15 ? "rgba(201,42,42,.85)" : undefined); Palco.texto(ctx, `⏱️ ${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`, W / 2, 10 + 17 * k, 18 * k, "#fff", { contorno: null }); }
      // profundidade da isca
      if (fase === "esperando") {
        const x = 30, y0 = agua + 10, h = fundo - agua - 20;
        Palco.texto(ctx, `${(isca.prof * 8).toFixed(1).replace(".", ",")} m`, 110, yDe(isca.prof), 15 * k, "#fff", { alinhar: "left" });
        ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(100, yDe(isca.prof)); ctx.lineTo(isca.x - 12, yDe(isca.prof)); ctx.stroke(); ctx.setLineDash([]);
      }
      if (fase === "lancando" || fase === "pronto") {
        const w = Math.min(W * 0.4, 300 * k), x = W / 2 - w / 2, y = agua * 0.78;
        Palco.caixa(ctx, x - 6, y - 6, w + 12, 26 * k, 10);
        ctx.fillStyle = "#ffd43b"; ctx.fillRect(x, y, w * (fase === "lancando" ? forca : 0), 14 * k);
        Palco.texto(ctx, fase === "pronto" ? "Segure LANÇAR e solte na força certa 🎣" : "Solte!", W / 2, y + 36 * k, Math.min(20 * k, W / 26));
      }
      if (fase === "esperando" && !peixeNaIsca) Palco.texto(ctx, "Espere a boia mexer... ⬆️⬇️ mudam a profundidade", W / 2, agua * 0.82, Math.min(18 * k, W / 28));
      if (fase === "esperando" && mergulho > 0) Palco.texto(ctx, "AGORA! FISGUE! ❗", W / 2, agua * 0.8, 34 * k, "#ffd43b");
      if (fase === "briga" && briga) {
        const w = Math.min(W * 0.5, 360 * k), x = W / 2 - w / 2, y = agua * 0.7, lim = facil ? 1.25 : 1;
        Palco.caixa(ctx, x - 8, y - 30 * k, w + 16, 60 * k, 12);
        Palco.texto(ctx, "Tensão da linha", W / 2, y - 16 * k, 13 * k, "#fff", { contorno: null });
        const gT = ctx.createLinearGradient(x, 0, x + w, 0); gT.addColorStop(0, "#69db7c"); gT.addColorStop(0.65, "#ffd43b"); gT.addColorStop(1, "#ff6b6b");
        ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(x, y, w, 16 * k);
        ctx.fillStyle = gT; ctx.fillRect(x, y, w * Math.min(1, briga.tensao / lim), 16 * k);
        Palco.texto(ctx, `🐟 ${Math.max(0, Math.round(briga.dist * 30))} m`, W / 2, y + 38 * k, 16 * k);
      }
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.PESCA_TESTE) window.PESCA_TESTE = { estado: () => ({ fase, peixes: vivos.filter(v => v.tipo === "peixe").length, pegos: pegos.length, isca: Math.round(isca.x), tensao: briga ? +briga.tensao.toFixed(2) : null, dist: briga ? +briga.dist.toFixed(2) : null }), fisgarJa: () => { const v = vivos.find(x => x.tipo === "peixe" && x.id !== "piranha"); peixeNaIsca = v; mergulho = 1; fisgar(); } };
    P.aoMedir = medir;
    medir();
    for (let i = 0; i < 6; i++) novoPeixe(true);
    botoes();
    P.rodar(dt => {
      if (!pausado && fase !== "fim") atualizar(dt);
      desenhar(dt);
    });
    Motor.falar(`Pescaria no ${rio.nome}, de ${rio.info}! ${desafio ? "Pesque o máximo que puder em 3 minutos!" : `Pesque ${META} peixes!`} Segure lançar e solte na força certa.`);
  }
})();
