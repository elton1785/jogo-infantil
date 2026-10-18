// Piloto de Avião ✈️ — voar entre capitais do Brasil. Decolagem (acelerar na pista e puxar para cima),
// voo de cruzeiro com a paisagem da rota passando lá embaixo (floresta e rios de cor de verdade,
// cerrado com plantações, caatinga, serra, litoral com praia, espuma e mar, cidades com prédios e os
// pontos famosos de cada uma), argolas para seguir e ganhar estrelas, nuvens, tempestades com raios e
// bandos de pássaros para desviar, e o pouso: alinhar com a pista e descer devagar (torto ou rápido
// demais, arremete e tenta de novo, como na vida real). O voo dura uns minutos e o comandante e a
// tripulação dão os avisos de bordo (com legenda na tela): serviço de bordo, o que dá para ver pela
// janela em cada trecho da rota, curiosidades. Avião de linha visto de trás, com flaps, trem de
// pouso, spoilers, luzes de navegação e as trilhas brancas no céu.
(() => {
  // Contorno simplificado do Brasil (longitude, latitude) e as cidades nas posições reais
  const BRASIL = [[-73.9, -7.5], [-73.2, -6], [-72.6, -4.6], [-70, -4.2], [-69.9, -1.2], [-69.5, 1], [-67.4, 2.1], [-66.9, 1.2], [-64, 2.1], [-63.4, 3.9], [-60.7, 5.2], [-59.9, 3.9], [-58.2, 1.6], [-56, 1.9], [-54, 2.3], [-51.6, 4.2], [-50, 1.8], [-49.9, 0], [-48.5, -1.2], [-44.3, -2.5], [-41, -2.9], [-38.5, -3.7], [-35.2, -5.4], [-34.8, -7.1], [-35, -9], [-37, -11], [-38.5, -13], [-39, -15], [-39.2, -17.7], [-40.3, -20.3], [-41.9, -22.8], [-43.2, -23], [-46.3, -24], [-48.5, -26], [-48.6, -28.5], [-50, -31], [-52.1, -32.2], [-53.4, -33.7], [-53.6, -32.5], [-55.6, -30.9], [-57.6, -30.2], [-56, -28.1], [-54.6, -25.6], [-54.3, -24], [-55.6, -22.6], [-57.9, -22.1], [-58, -20], [-57.6, -18], [-58.4, -16.3], [-60.2, -15.1], [-60.5, -13.5], [-62, -12.8], [-65.3, -10.9], [-66.8, -9.8], [-68.6, -11], [-70.5, -11], [-72.4, -10]];
  const CIDADES = {
    manaus: { nome: "Manaus", lon: -60.02, lat: -3.1 }, belem: { nome: "Belém", lon: -48.5, lat: -1.45 }, boavista: { nome: "Boa Vista", lon: -60.67, lat: 2.82 },
    brasilia: { nome: "Brasília", lon: -47.9, lat: -15.8 }, rio: { nome: "Rio de Janeiro", lon: -43.2, lat: -22.9 }, saopaulo: { nome: "São Paulo", lon: -46.63, lat: -23.55 },
    salvador: { nome: "Salvador", lon: -38.5, lat: -12.97 }, recife: { nome: "Recife", lon: -34.9, lat: -8.05 }, fortaleza: { nome: "Fortaleza", lon: -38.54, lat: -3.72 },
    portoalegre: { nome: "Porto Alegre", lon: -51.2, lat: -30.03 }, floripa: { nome: "Florianópolis", lon: -48.55, lat: -27.6 },
  };
  // Temperatura típica de cada cidade (para o aviso do comandante no pouso)
  const TEMPERATURA = { manaus: 32, belem: 31, boavista: 33, brasilia: 26, rio: 29, saopaulo: 24, salvador: 29, recife: 29, fortaleza: 30, portoalegre: 22, floripa: 23 };
  // Altura dos prédios de cada cidade (São Paulo cheia de arranha-céus; Brasília e Boa Vista baixinhas)
  const ALTURA_CIDADE = { saopaulo: 2.4, rio: 1.5, salvador: 1.3, recife: 1.4, fortaleza: 1.4, belem: 1.2, portoalegre: 1.2, brasilia: 0.6, manaus: 1.2, boavista: 0.55, floripa: 0.9 };
  const PAISAGEM_FALADA = { floresta: "a floresta amazônica, verdinha", rio: "um rio enorme", cerrado: "o cerrado e as plantações", caatinga: "a caatinga, o sertão", serra: "as serras e montanhas", mar: "o mar", praia: "as praias e o mar", cidade: "a cidade" };

  // ---------- Som de bordo ----------
  // Turbinas: ronco grave (ruído filtrado) e o assobio agudo; sobem com a potência
  function turbina() {
    const a = Motor.audio();
    if (!a) return { atualizar() {}, parar() {} };
    const buf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ruido = a.createBufferSource(); ruido.buffer = buf; ruido.loop = true;
    const filtro = a.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 300;
    const gRuido = a.createGain(); gRuido.gain.value = 0;
    ruido.connect(filtro).connect(gRuido).connect(a.destination);
    const assobio = a.createOscillator(); assobio.type = "sine"; assobio.frequency.value = 1500;
    const gAssobio = a.createGain(); gAssobio.gain.value = 0;
    assobio.connect(gAssobio).connect(a.destination);
    const grave = a.createOscillator(); grave.type = "triangle"; grave.frequency.value = 50;
    const gGrave = a.createGain(); gGrave.gain.value = 0;
    grave.connect(gGrave).connect(a.destination);
    ruido.start(); assobio.start(); grave.start();
    let parado = false;
    return {
      // potência 0..1 (null = silêncio: pausa, som desligado)
      atualizar(pot) {
        if (parado) return;
        const t = a.currentTime, on = pot != null && Motor.somLigado(), q = on ? pot : 0;
        filtro.frequency.setTargetAtTime(250 + q * 900, t, 0.3);
        gRuido.gain.setTargetAtTime(on ? 0.025 + q * 0.11 : 0, t, 0.25);
        assobio.frequency.setTargetAtTime(1300 + q * 1900, t, 0.4);
        gAssobio.gain.setTargetAtTime(on ? 0.004 + q * 0.012 : 0, t, 0.3);
        gGrave.gain.setTargetAtTime(on ? 0.02 + q * 0.05 : 0, t, 0.3);
      },
      parar() { if (parado) return; parado = true; try { ruido.stop(); assobio.stop(); grave.stop(); } catch (e) { /* ok */ } },
    };
  }
  // "Plim-plom" do aviso de bordo, antes da voz do comandante ou da tripulação
  function plimPlom() {
    Motor.nota(988, { dur: 0.9, tipo: "sine", vol: 0.12 });
    Motor.nota(784, { dur: 1.1, tipo: "sine", vol: 0.12, inicio: 0.42 });
  }
  // Rotas. paisagem: trechos [tipo, até que fração do caminho]. costa: água de um lado
  // [de, até, lado (1 = direita), tipo da água, distância da pista]. marcos: pontos famosos
  // [tipo, 0 = perto da partida / 1 = perto da chegada, z a partir dali, x]. pontos: avisos do
  // comandante sobre o que passa lá embaixo [fração, texto]. janela: aviso na descida.
  const ROTAS = {
    "manaus-belem": { de: "manaus", para: "belem", km: 1300, corRio: "rio", encontro: true,
      paisagem: [["cidade", 0.05], ["rio", 0.42], ["floresta", 0.52], ["rio", 0.82], ["floresta", 0.94], ["cidade", 1]],
      costa: [[0, 0.05, 1, "negro", 520], [0.94, 1, -1, "rio", 470]],
      marcos: [["teatro", 0, 2700, -700], ["veropeso", 1, -1300, -340]],
      pontos: [
        [0.1, "Olhem lá embaixo: é o Encontro das Águas! O rio Negro, escuro, e o rio Solimões, cor de barro, correm lado a lado por quilômetros sem se misturar. Juntos, eles formam o rio Amazonas."],
        [0.3, "Estamos passando perto de Parintins, a cidade do Festival Folclórico, onde o boi Garantido, vermelho, e o boi Caprichoso, azul, disputam quem dança mais bonito!"],
        [0.47, "Agora estamos sobre Santarém. Ali, as águas azuis do rio Tapajós encontram o Amazonas, e tem praias de rio com areia branquinha, como Alter do Chão!"],
        [0.63, "Vocês sabiam? O rio Amazonas é o maior rio do mundo em quantidade de água. Em alguns lugares ele é tão largo que nem dá para ver a outra margem!"],
        [0.78, "Lá na frente fica a ilha de Marajó, a maior ilha de rio e mar do mundo. Lá, até a polícia anda montada em búfalos!"],
      ],
      janela: "Olhem do lado esquerdo: a baía do Guajará e o mercado Ver-o-Peso, com as suas torrezinhas!",
      chegada: "Belém fica pertinho de onde o rio Amazonas encontra o mar. É famosa pelo açaí e pelo mercado Ver-o-Peso!", partida: "Saindo de Manaus, no coração da floresta amazônica!" },
    "manaus-boavista": { de: "manaus", para: "boavista", km: 660, corRio: "negro",
      paisagem: [["cidade", 0.05], ["rio", 0.3], ["floresta", 0.74], ["cerrado", 0.94], ["cidade", 1]],
      costa: [[0, 0.05, 1, "negro", 520], [0.95, 1, -1, "rio", 480]],
      marcos: [["teatro", 0, 2700, -700]],
      pontos: [
        [0.1, "Estamos sobre o rio Negro, de águas escuras como chá. Lá embaixo fica o arquipélago de Anavilhanas, com centenas de ilhas no meio do rio!"],
        [0.27, "A floresta aqui embaixo é a casa de povos indígenas, que cuidam dela há milhares de anos, e de bichos como a onça-pintada, o macaco e a arara."],
        [0.44, "Atenção, passageiros: daqui a pouquinho vamos cruzar a linha do Equador, a linha imaginária que divide a Terra em hemisfério Sul e hemisfério Norte!"],
        [0.7, "A floresta está dando lugar ao lavrado, os campos abertos de Roraima. Lá longe fica o Monte Roraima, uma montanha enorme com o topo achatado, como uma mesa!"],
      ],
      linhas: [[0.525, "🌐 Cruzamos a linha do Equador!"]],
      janela: "Olhem do lado esquerdo: o rio Branco, que passa por Boa Vista!",
      chegada: "Boa Vista é a única capital do Brasil que fica todinha ao norte da linha do Equador!", partida: "Saindo de Manaus em direção ao norte!" },
    "brasilia-rio": { de: "brasilia", para: "rio", km: 930,
      paisagem: [["cidade", 0.06], ["cerrado", 0.5], ["serra", 0.9], ["cidade", 1]],
      costa: [[0, 0.06, -1, "lago", 520], [0.88, 1, 1, "mar", 470]],
      marcos: [["congresso", 0, 2600, 620], ["cristo", 1, -3900, -900], ["paoacucar", 1, -1000, 1050]],
      pontos: [
        [0.08, "Olhem lá embaixo: vista do alto, Brasília tem o formato de um avião! No meio fica o Congresso Nacional, com duas torres e duas cúpulas, uma virada para cima e outra para baixo."],
        [0.3, "Estamos sobre o cerrado, a savana brasileira, com árvores de tronco torto e bichos como o lobo-guará, de pernas compridas, e o tamanduá-bandeira."],
        [0.5, "Agora estamos sobre Minas Gerais, terra das montanhas, do pão de queijo e de cidades antigas, como Ouro Preto."],
        [0.7, "Lá na frente aparecem as serras cobertas pela Mata Atlântica, a floresta do mico-leão-dourado. Depois delas vem o oceano Atlântico!"],
      ],
      janela: "Olhem do lado esquerdo: o Cristo Redentor, lá no alto do morro do Corcovado! E do lado direito, no mar, o Pão de Açúcar!",
      chegada: "O Rio de Janeiro tem o Cristo Redentor, o Pão de Açúcar e praias famosas. Já foi a capital do Brasil!", partida: "Saindo de Brasília, a capital do Brasil!" },
    "saopaulo-salvador": { de: "saopaulo", para: "salvador", km: 1450,
      paisagem: [["cidade", 0.07], ["serra", 0.36], ["praia", 0.94], ["cidade", 1]],
      costa: [[0.36, 1, 1, "mar", 540]],
      marcos: [["farol", 1, -4300, 380], ["elevador", 1, -1700, 330]],
      pontos: [
        [0.07, "Lá embaixo está São Paulo, com mais de doze milhões de pessoas. É a maior cidade da América do Sul, cheia de prédios altos!"],
        [0.24, "Estamos voando sobre Minas Gerais, a terra das montanhas e do pão de queijo."],
        [0.4, "Olhem do lado direito: o mar! Agora vamos seguir o litoral, passando pelo Espírito Santo e pelo sul da Bahia."],
        [0.56, "Lá no mar, perto daqui, fica o arquipélago de Abrolhos, onde as baleias jubarte vêm todos os anos ter os seus filhotes!"],
        [0.7, "Estamos passando perto de Porto Seguro, onde os navegantes portugueses chegaram no ano de mil e quinhentos."],
        [0.84, "Daqui a pouco aparece a Baía de Todos os Santos, a maior baía do Brasil, onde fica Salvador!"],
      ],
      janela: "Olhem do lado direito: o Farol da Barra! E logo depois, o Elevador Lacerda, que leva as pessoas da cidade baixa para a cidade alta!",
      chegada: "Salvador foi a primeira capital do Brasil e tem um elevador gigante, o Elevador Lacerda, que liga a cidade baixa à cidade alta!", partida: "Saindo de São Paulo, a maior cidade do Brasil!" },
    "recife-fortaleza": { de: "recife", para: "fortaleza", km: 630,
      paisagem: [["cidade", 0.07], ["praia", 0.3], ["caatinga", 0.78], ["praia", 0.94], ["cidade", 1]],
      costa: [[0, 0.3, 1, "mar", 540], [0.78, 1, 1, "mar", 540]],
      marcos: [["jangada", 0, 3200, 950], ["dunas", 1, -3900, -560], ["jangada", 1, -3400, 780], ["jangada", 1, -2600, 920], ["jangada", 1, -1900, 1250]],
      pontos: [
        [0.08, "Recife é chamada de Veneza brasileira por causa dos rios e das pontes. Na praia de Boa Viagem, quando a maré baixa, aparecem piscinas naturais!"],
        [0.26, "Estamos passando por João Pessoa, na Paraíba. Lá fica a Ponta do Seixas, o ponto mais a leste de todas as Américas!"],
        [0.44, "Agora estamos sobre o sertão. A vegetação é a caatinga, que aguenta muito tempo sem chuva. Olhem os cactos mandacaru lá embaixo!"],
        [0.6, "Lá longe, do lado direito, fica Natal, com as dunas de areia de Genipabu e o maior cajueiro do mundo, que parece uma floresta inteira!"],
        [0.79, "Já estamos no Ceará! Olhem o mar: os pescadores saem nas jangadas, barquinhos de vela branca, como faziam os seus avós."],
      ],
      janela: "Olhem do lado direito: as jangadas no mar! E do lado esquerdo, as dunas de areia!",
      chegada: "Fortaleza tem praias lindas e venta muito: é ótima para soltar pipa e para o kitesurf!", partida: "Saindo de Recife, a Veneza brasileira, cheia de rios e pontes!" },
    "portoalegre-floripa": { de: "portoalegre", para: "floripa", km: 380,
      paisagem: [["cidade", 0.08], ["serra", 0.55], ["praia", 0.94], ["cidade", 1]],
      costa: [[0, 0.08, -1, "lago", 520], [0.58, 1, 1, "mar", 540]],
      canal: [-3750, -3350],
      marcos: [["ponte", 1, -3550, -500]],
      pontos: [
        [0.1, "Porto Alegre fica na beira do lago Guaíba, famoso pelo pôr do sol. É a terra do chimarrão!"],
        [0.3, "Estamos sobre a Serra Gaúcha, com cânions enormes, como o Itaimbezinho, e muitas plantações de uva."],
        [0.55, "Agora estamos sobre Santa Catarina. Olhem o mar do lado direito: no inverno, as baleias-francas vêm para estas praias ter os seus filhotes!"],
        [0.74, "Lá na frente aparece a Ilha de Santa Catarina, onde fica Florianópolis, com mais de quarenta praias!"],
      ],
      janela: "Olhem do lado esquerdo: a ponte Hercílio Luz, uma ponte pênsil antiga, que liga a ilha ao continente!",
      chegada: "Florianópolis fica numa ilha e tem mais de quarenta praias!", partida: "Saindo de Porto Alegre, lá no sul do Brasil!" },
  };
  // Avisos de bordo que valem para todas as rotas (curto: também no voo das crianças menores)
  const GERAIS = [
    { f: 0.16, quem: "Tripulação", curto: true, texto: "Senhoras e senhores, vamos começar o serviço de bordo! Hoje temos suco, água, café e um lanchinho. Por favor, abram a mesinha da poltrona da frente." },
    { f: 0.36, quem: "Comandante", texto: "Informação do comandante: lá fora a temperatura é de cinquenta graus abaixo de zero! Aqui dentro o ar é aquecido e pressurizado, para todo mundo respirar bem." },
    { f: 0.52, quem: "Comandante", curto: true, metade: true },
    { f: 0.66, quem: "Comandante", texto: "Vocês sabiam? As listras brancas que os aviões deixam no céu são o vapor das turbinas, que congela e vira uma nuvem fininha. Olhem atrás das turbinas!" },
    { f: 0.74, quem: "Tripulação", curto: true, texto: "O serviço de bordo terminou. Por favor, fechem a mesinha e entreguem o lixo para a tripulação. Obrigada!" },
  ];
  const AGUA = { mar: "#1a68ab", rio: "#a4844e", negro: "#2e2b20", lago: "#2d6f8f" };
  const CORES = { azul: ["#1c7ed6", "Azul"], vermelho: ["#e03131", "Vermelho"], verde: ["#2f9e44", "Verde"], laranja: ["#f76707", "Laranja"], roxo: ["#7048e8", "Roxo"] };
  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#74c0fc"/><path d="M2 46h60v16H2z" fill="#2f9e44"/><ellipse cx="18" cy="20" rx="10" ry="4" fill="#fff"/><ellipse cx="46" cy="14" rx="8" ry="3" fill="#fff"/><path d="M10 34 L54 34 L46 30 H18Z" fill="#dee2e6"/><ellipse cx="32" cy="32" rx="7" ry="7" fill="#fff" stroke="#adb5bd"/><path d="M32 18 L35 30 H29Z" fill="#1c7ed6"/><circle cx="22" cy="36" r="3" fill="#868e96"/><circle cx="42" cy="36" r="3" fill="#868e96"/></svg>';

  // Tempo de um voo de verdade nessa distância (uns 780 km/h de média, mais taxiar, subir e descer)
  const minutosReais = km => Math.round((km / 780 * 60 + 20) / 5) * 5;
  function falaTempo(m) {
    const h = Math.floor(m / 60), mm = m % 60, hs = ["", "uma hora", "duas horas", "três horas"][h];
    return h ? (mm ? `${hs} e ${mm} minutos` : hs) : `${mm} minutos`;
  }

  JOGOS.push({
    id: "aviao", nome: "Piloto de Avião", icone: ICONE, teclas: true,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: "🛫", texto: "Na pista, segure ACELERAR até a barra ficar verde. Depois puxe para cima ⬆️ e o avião decola!" },
      { figura: "⬅️➡️⬆️⬇️", texto: "No ar, as setas viram o avião para os lados e sobem ou descem. No celular, use as setas do canto da tela (ou arraste o dedo como se fosse o manche)." },
      { figura: "⭐", texto: "Passe por dentro das argolas douradas para ganhar estrelas. Elas mostram o caminho!" },
      { figura: "📢", texto: "Escute os avisos de bordo: o comandante conta o que dá para ver pela janela em cada lugar da viagem (e o texto aparece na tela)." },
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
    const g = c.createLinearGradient(0, 0, 0, 150); g.addColorStop(0, "#4a9fe0"); g.addColorStop(1, "#d6e6f2");
    c.fillStyle = g; c.beginPath(); c.roundRect(0, 0, 240, 150, 18); c.fill();
    c.save(); c.translate(120, 92); desenharAviao(c, 200, hex, 0.1, { luzes: false }); c.restore();
    return cv;
  }
  // brilho de uma luz (navegação, strobo, farol)
  function luz(c, x, y, cor, raio) {
    const g = c.createRadialGradient(x, y, 0, x, y, raio);
    g.addColorStop(0, "#fff"); g.addColorStop(0.25, cor); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.beginPath(); c.arc(x, y, raio, 0, 7); c.fill();
  }
  // Avião de linha visto de trás: asas com diedro e winglets, turbinas sob as asas, fuselagem com a
  // pintura, cone de cauda, profundor e leme na cor escolhida. Opções: trem (0..1), flap (0..1),
  // spoiler (0..1, depois do pouso), luzes (navegação vermelha/verde, strobos e farol piscando).
  function desenharAviao(c, w, cor, inclina, { trem = 0, flap = 0, spoiler = 0, luzes = true } = {}) {
    const t = performance.now();
    c.save(); c.rotate(inclina);
    const r = w * 0.075;                              // raio da fuselagem
    const asaY = x => r * 0.5 - Math.abs(x) * 0.085;  // a asa sobe um pouco para as pontas (diedro)
    const gAsa = c.createLinearGradient(0, -w * 0.06, 0, r * 0.8);
    gAsa.addColorStop(0, "#f4f6f8"); gAsa.addColorStop(1, "#9ba5ae");
    [-1, 1].forEach(l => {
      const ponta = l * w / 2, raiz = l * r * 0.7;
      c.fillStyle = gAsa; c.strokeStyle = "rgba(60,66,72,.45)"; c.lineWidth = Math.max(0.6, r * 0.03);
      c.beginPath(); c.moveTo(raiz, asaY(raiz) - r * 0.17); c.lineTo(ponta, asaY(ponta) - r * 0.04); c.lineTo(ponta, asaY(ponta) + r * 0.04); c.lineTo(raiz, asaY(raiz) + r * 0.21); c.closePath(); c.fill(); c.stroke();
      // flaps: abaixam atrás da asa na decolagem e no pouso
      if (flap > 0.02) {
        const a = l * r * 1.1, b = l * w * 0.37;
        c.fillStyle = "#7d868f"; c.beginPath(); c.moveTo(a, asaY(a) + r * 0.18); c.lineTo(b, asaY(b) + r * 0.09); c.lineTo(b, asaY(b) + r * (0.09 + 0.2 * flap)); c.lineTo(a, asaY(a) + r * (0.18 + 0.3 * flap)); c.closePath(); c.fill();
      }
      // spoilers: placas que levantam em cima da asa logo depois de tocar o chão
      if (spoiler > 0.02) for (let k = 0; k < 3; k++) {
        const a = l * (r * 1.4 + k * w * 0.065), b = a + l * w * 0.055;
        c.fillStyle = "#c3cad1"; c.beginPath(); c.moveTo(a, asaY(a) - r * 0.13); c.lineTo(b, asaY(b) - r * 0.13); c.lineTo(b, asaY(b) - r * (0.13 + 0.42 * spoiler)); c.lineTo(a, asaY(a) - r * (0.13 + 0.48 * spoiler)); c.closePath(); c.fill();
      }
      // winglet na cor do avião
      c.fillStyle = cor; c.beginPath(); c.moveTo(ponta - l * r * 0.03, asaY(ponta) + r * 0.03); c.lineTo(ponta + l * r * 0.13, asaY(ponta) - r * 0.95); c.lineTo(ponta + l * r * 0.22, asaY(ponta) - r * 0.9); c.lineTo(ponta + l * r * 0.06, asaY(ponta) + r * 0.04); c.closePath(); c.fill();
    });
    // turbinas penduradas embaixo da asa (vê-se a saída: anel, escape e o cone no meio)
    [-1, 1].forEach(l => {
      const ex = l * w * 0.18, ey = asaY(ex) + r * 0.62, er = r * 0.5;
      c.fillStyle = "#a3acb4"; c.fillRect(ex - er * 0.16, asaY(ex) - r * 0.05, er * 0.32, ey - asaY(ex));
      const g = c.createRadialGradient(ex - er * 0.35, ey - er * 0.45, er * 0.1, ex, ey, er);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.7, "#ced4da"); g.addColorStop(1, "#78818a");
      c.fillStyle = g; c.beginPath(); c.arc(ex, ey, er, 0, 7); c.fill();
      c.fillStyle = "#1c1f23"; c.beginPath(); c.arc(ex, ey, er * 0.74, 0, 7); c.fill();
      c.fillStyle = "#4a5056"; c.beginPath(); c.arc(ex, ey, er * 0.56, 0, 7); c.fill();
      const g2 = c.createRadialGradient(ex - er * 0.08, ey - er * 0.1, 0, ex, ey, er * 0.3);
      g2.addColorStop(0, "#e9ecef"); g2.addColorStop(1, "#6c757d");
      c.fillStyle = g2; c.beginPath(); c.arc(ex, ey, er * 0.28, 0, 7); c.fill();
    });
    // trem de pouso: o principal sob a raiz das asas (4 rodas) e o do nariz, lá na frente
    if (trem > 0.02) {
      const roda = (x, y, rw, rh) => { c.fillStyle = "#1f2326"; c.beginPath(); c.roundRect(x - rw / 2, y - rh / 2, rw, rh, rw * 0.35); c.fill(); c.fillStyle = "#868e96"; c.fillRect(x - rw * 0.2, y - rh * 0.12, rw * 0.4, rh * 0.24); };
      c.fillStyle = "#adb5bd";
      c.fillRect(-r * 0.09, r * 0.8, r * 0.18, r * 0.75 * trem);
      roda(-r * 0.13, r * 0.8 + r * 0.75 * trem, r * 0.2, r * 0.34); roda(r * 0.13, r * 0.8 + r * 0.75 * trem, r * 0.2, r * 0.34);
      [-1, 1].forEach(l => {
        const gx = l * r * 1.1, y0 = asaY(gx) + r * 0.1, y1 = y0 + r * 1.3 * trem;
        c.fillStyle = "#adb5bd"; c.fillRect(gx - r * 0.07, y0, r * 0.14, y1 - y0);
        roda(gx - r * 0.17, y1, r * 0.24, r * 0.46); roda(gx + r * 0.17, y1, r * 0.24, r * 0.46);
      });
    }
    // fuselagem com luz de cima, faixa da pintura e a barriga cinza
    const gf = c.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.1, 0, 0, r * 1.05);
    gf.addColorStop(0, "#ffffff"); gf.addColorStop(0.65, "#e9ecef"); gf.addColorStop(1, "#98a1aa");
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = gf; c.fill(); c.clip();
    c.fillStyle = cor; c.fillRect(-r, r * 0.3, r * 2, r * 0.26);
    c.fillStyle = "rgba(120,130,140,.55)"; c.fillRect(-r, r * 0.56, r * 2, r);
    c.restore();
    // cone de cauda (mais perto de quem olha) e a saidinha do APU
    const gc = c.createRadialGradient(-r * 0.2, -r * 0.25, 0, 0, 0, r * 0.58);
    gc.addColorStop(0, "#fdfdfd"); gc.addColorStop(1, "#bfc6cd");
    c.fillStyle = gc; c.beginPath(); c.arc(0, -r * 0.05, r * 0.56, 0, 7); c.fill();
    c.fillStyle = "#30353a"; c.beginPath(); c.arc(0, -r * 0.03, r * 0.13, 0, 7); c.fill();
    // profundor (asinha de trás), com diedro
    [-1, 1].forEach(l => {
      const a = l * r * 0.3, b = l * w * 0.21, ya = -r * 0.12, yb = ya - w * 0.21 * 0.06;
      c.fillStyle = gAsa; c.beginPath(); c.moveTo(a, ya - r * 0.07); c.lineTo(b, yb - r * 0.025); c.lineTo(b, yb + r * 0.025); c.lineTo(a, ya + r * 0.09); c.closePath(); c.fill();
    });
    // leme (deriva) bem alto, na cor do avião, com a estrela branca
    const gl = c.createLinearGradient(-r * 0.15, 0, r * 0.15, 0);
    gl.addColorStop(0, cor); gl.addColorStop(0.45, cor); gl.addColorStop(1, "rgba(0,0,0,.25)");
    c.fillStyle = cor; c.beginPath(); c.moveTo(-r * 0.14, -r * 0.45); c.lineTo(-r * 0.05, -r * 3.4); c.lineTo(r * 0.05, -r * 3.4); c.lineTo(r * 0.14, -r * 0.45); c.closePath(); c.fill();
    c.fillStyle = gl; c.fill();
    c.fillStyle = "#fff"; c.font = `${r * 0.34}px sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("★", 0, -r * 2.2);
    // luzes: vermelha na asa esquerda, verde na direita, strobos brancos piscando em dupla e o farol vermelho
    if (luzes) {
      const yp = asaY(w / 2);
      luz(c, -w / 2, yp, "#ff2d2d", r * 0.38); luz(c, w / 2, yp, "#2bd36a", r * 0.38);
      const fs = t % 1300;
      if (fs < 60 || (fs > 160 && fs < 220)) { luz(c, -w / 2, yp, "#fff", r * 1.2); luz(c, w / 2, yp, "#fff", r * 1.2); }
      if (t % 1000 < 130) { luz(c, -r * 0.35, -r * 0.92, "#ff3b30", r * 0.55); luz(c, 0, r * 1.02, "#ff3b30", r * 0.5); }
      luz(c, 0, r * 0.5, "#fff8e0", r * 0.2);
    }
    c.restore();
  }

  function voo(area, op, fid) {
    const rota = ROTAS[op.rota] || ROTAS["manaus-belem"], auto = op.pouso === "auto", cor = (CORES[op.cor] || CORES.azul)[0];
    const pequeno = fid === "5-6";
    const nomeChegada = CIDADES[rota.para].nome, minReal = minutosReais(rota.km);
    let pausado = false, cintos = true, avisouTurbulencia = false, ultimaTurbulencia = 0, avisouJanela = false;
    const P = Palco.criar(area, { classe: "aviao-tela", aoPausar: () => { pausado = !pausado; P.pausa.textContent = pausado ? "▶️" : "⏸️"; } });
    const ctx = P.ctx;
    const VEL = 320;                        // velocidade de cruzeiro (unidades do mundo por segundo)
    // duração do voo pela distância: de uns 2 min e meio (380 km) a uns 4 min (1450 km)
    const DUR = (120 + rota.km * 0.08) * (pequeno ? 0.75 : 1);
    const COMP = Math.round(DUR * VEL);     // comprimento do voo; a pista de chegada fica no fim
    const DESCIDA = 6500;                   // a descida começa a essa distância da pista
    // estado do avião
    const av = { x: 0, h: 0, z: 0, vel: 0, incl: 0, vh: 0 }, instr = { alt: 0, vel: 0 };
    let fase = "pista", estrelas = 0, conforto = 3, tempoFase = 0, msg = null, sacode = 0, flash = 0, branco = 0, tentativas = 0;
    let entX = 0, entY = 0, acel = false, confete = [], trem = 1, flap = 0.5, spoiler = 0, tremAlvoAnt = 1;
    const objetos = [];
    let zPista = null; // pista de chegada (z)

    // ----- Avisos de bordo: fila, um de cada vez, com plim-plom e legenda na tela -----
    const fila = [];
    let legenda = null, livreEm = 0;
    const ocupado = () => fila.length > 0 || performance.now() < livreEm;
    function aviso(texto, quem = "Comandante", primeiro = false) { (primeiro ? fila.unshift : fila.push).call(fila, { texto, quem }); }
    function falarAviso({ texto, quem }) {
      plimPlom();
      const agora = performance.now(), comSom = Motor.somLigado();
      const L = { quem, frases: (texto.match(/[^.!?]+[.!?]*/g) || [texto]).map(s => s.trim()).filter(Boolean), ini: agora + 1300 };
      // sem som, a legenda fica o tempo que a voz levaria; com som, até a voz terminar
      L.fim = comSom ? Infinity : L.ini + texto.length * 75 + 800;
      livreEm = comSom ? Infinity : L.fim + 2000;
      legenda = L;
      Motor.depois(() => Motor.falar(texto, { importante: true }).then(() => {
        const f = performance.now();
        if (L.fim === Infinity) L.fim = f + 700;
        if (livreEm === Infinity) livreEm = f + 2500;
      }), 1300);
    }
    // os avisos do caminho (curiosidades da rota e os gerais), na ordem em que aparecem
    const agenda = [...rota.pontos.map(([f, texto]) => ({ f, texto, quem: "Comandante" })), ...GERAIS.filter(g => !pequeno || g.curto)].sort((a, b) => a.f - b.f);
    const linhas = (rota.linhas || []).slice();
    function textoAgenda(it) {
      if (!it.metade) return it.texto;
      return `Informação do comandante: já fizemos metade da viagem! Faltam ${Math.round(rota.km / 2)} quilômetros para ${nomeChegada}, mais ou menos ${falaTempo(Math.max(10, Math.round(minReal / 2 / 5) * 5))}. Lá embaixo dá para ver ${PAISAGEM_FALADA[paisagemEm(av.z)] || "a paisagem"}!`;
    }

    // ----- Objetos do caminho -----
    function gerarObjetos() {
      let x = 0;
      for (let z = 1800; z < COMP - DESCIDA - 600; z += 700 + Math.random() * 400) {
        const t = z / COMP, r = Math.random();
        if (r < 0.5) { x = Math.max(-260, Math.min(260, x + (Math.random() - 0.5) * 220)); objetos.push({ tipo: "argola", x, h: 140 + Math.random() * 160, z }); }
        else if (r < 0.75) objetos.push({ tipo: "nuvem", x: (Math.random() - 0.5) * 900, h: 180 + Math.random() * 260, z, s: 0.8 + Math.random() * 0.8 });
        else if (r < 0.9 && t > 0.15) objetos.push({ tipo: "tempestade", x: (Math.random() - 0.5) * 600, h: 150 + Math.random() * 200, z, s: 1 + Math.random() * 0.5 });
        else if (t > 0.1) objetos.push({ tipo: "passaros", x: (Math.random() - 0.5) * 500, h: 100 + Math.random() * 180, z, vx: (Math.random() < 0.5 ? -1 : 1) * 40 });
      }
    }
    gerarObjetos();
    const fracao = z => Math.max(0, Math.min(1, z / COMP));
    const paisagemEm = z => { const t = fracao(z); return (rota.paisagem.find(([, ate]) => t <= ate) || rota.paisagem[rota.paisagem.length - 1])[0]; };
    // chão: duas cores bem parecidas por trecho (as faixas dão a sensação de velocidade sem listrar)
    const CHAO = { floresta: ["#24612f", "#26663a"], rio: ["#2c6e35", "#2e7338"], cerrado: ["#9aa651", "#9eaa55"], caatinga: ["#a89464", "#ac9868"], serra: ["#4f7f3d", "#538541"], mar: ["#185f9e", "#1a64a5"], praia: ["#3d8a3f", "#40903f"], cidade: ["#8a9096", "#8d939a"] };
    const CAMPOS = { cerrado: ["#b4b65a", "#8f9f45", "#c9b873", "#7c9440", "#a5a04e", "#d1c48a"], serra: ["#5d9045", "#4a7a37", "#6b9b4f", "#7aa25a"] };
    const rioX = z => Math.sin(z * 0.0009) * 260 + Math.sin(z * 0.00031) * 180;
    const costaEm = z => { const t = fracao(z); return (rota.costa || []).find(c => t >= c[0] && t <= c[1]) || null; };
    const linhaCosta = (c, z) => c[4] + Math.sin(z * 0.0011) * 110 + Math.sin(z * 0.0041 + 1) * 45;
    const noCanal = z => rota.canal && z > COMP + rota.canal[0] && z < COMP + rota.canal[1];
    const encontroAte = COMP * 0.16, LR = 230; // LR: metade da largura do rio
    // que água tem nesse ponto do chão (null = terra)
    function agua(x, z) {
      if (noCanal(z)) return "mar";
      const c = costaEm(z);
      if (c && x * c[2] > linhaCosta(c, z)) return c[3];
      const tp = paisagemEm(z);
      if (tp === "mar") return "mar";
      if (tp === "rio" && Math.abs(x - rioX(z)) < LR) return rota.encontro && z < encontroAte ? (x < rioX(z) ? "negro" : "rio") : (rota.corRio || "rio");
      return null;
    }
    // pontos famosos nas posições do mundo
    const marcos = (rota.marcos || []).map(([tipo, base, dz, x]) => ({ tipo, x, z: (base ? COMP : 0) + dz }));
    const pertoDeMarco = (x, z) => marcos.some(m => Math.abs(m.z - z) < (m.tipo === "cristo" ? 700 : 300) && Math.abs(m.x - x) < (m.tipo === "cristo" ? 650 : m.tipo === "congresso" || m.tipo === "teatro" || m.tipo === "veropeso" ? 300 : 160));

    // ----- Entradas -----
    const bAcel = P.botao("🛫<small>ACELERAR</small>", v => { acel = v; }, { segurar: true, classe: "principal" });
    P.controles.appendChild(bAcel);
    const teclasDown = {};
    // Celular e tablet: setas na tela (direcional à esquerda), como as do teclado; arrastar o dedo
    // na tela também funciona, como um manche
    const toqueNaTela = matchMedia("(pointer: coarse)").matches;
    const setas = toqueNaTela ? [["ArrowUp", "⬆️", "Subir"], ["ArrowDown", "⬇️", "Descer"], ["ArrowLeft", "⬅️", "Esquerda"], ["ArrowRight", "➡️", "Direita"]].map(([k, ic, nome]) => {
      const b = P.botao(ic, v => { teclasDown[k] = v; }, { segurar: true, classe: "seta-aviao" });
      b.setAttribute("aria-label", nome);
      P.controles.appendChild(b);
      return b;
    }) : [];
    let tamSeta = 0;
    const posicionar = () => {
      Object.assign(bAcel.style, { right: "14px", bottom: "14px", minWidth: "150px", minHeight: "100px" });
      const t = Math.max(58, Math.min(76, Math.min(P.W || 400, P.H || 400) * 0.13)), m = 12;
      tamSeta = setas.length ? t : 0;
      const pos = [[m + t, m + t * 2], [m + t, m], [m, m + t], [m + t * 2, m + t]]; // [left, bottom]: cima, baixo, esquerda, direita
      setas.forEach((b, i) => Object.assign(b.style, { left: pos[i][0] + "px", bottom: `calc(${pos[i][1]}px + env(safe-area-inset-bottom, 0px))`, width: t + "px", height: t + "px", minWidth: "0", minHeight: "0", fontSize: t * 0.5 + "px", padding: "0" }));
    };
    posicionar();
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
    // instrução do jogo: aparece na tela e a voz fala (se não estiver no meio de um aviso de bordo)
    function dizer(t, falar = !ocupado()) { msg = { txt: t, t: 2.6 }; if (falar) Motor.falar(t); }
    function atualizar(dt) {
      lerEntrada();
      tempoFase += dt;
      if (fila.length && performance.now() >= livreEm) falarAviso(fila.shift());
      const acelera = acel || teclasDown.Enter || teclasDown[" "];
      if (fase === "pista") {
        if (acelera || (auto && tempoFase > 2.5)) av.vel = Math.min(VEL, av.vel + 95 * dt);
        else av.vel = Math.max(0, av.vel - 40 * dt);
        if (av.vel > VEL * 0.72 && (entY > 0.3 || (auto && av.vel > VEL * 0.85))) { fase = "subindo"; tempoFase = 0; bAcel.hidden = true; msg = { txt: "Decolamos! 🛫", t: 2.6 }; if (!ocupado()) Motor.falar("Decolamos! Vamos voar!"); }
        else if (av.vel > VEL * 0.72 && !msg) dizer("Agora puxe para cima! ⬆️");
      } else if (fase === "subindo") {
        av.vel = Math.min(VEL, av.vel + 40 * dt);
        av.h += (90 + 60 * Math.max(0, entY)) * dt;
        if (av.h > 160) {
          fase = "cruzeiro"; tempoFase = 0; cintos = false;
          aviso(`Aqui fala o comandante. Estamos voando para ${nomeChegada}, a dez mil metros de altitude, a oitocentos e cinquenta quilômetros por hora. O aviso de cintos foi desligado. Passe nas argolas douradas!`);
        }
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
        // avisos do caminho: cada um na sua hora; se passou muito da hora (voo curto), fica para outra viagem
        const prog = av.z / COMP;
        if (fase === "cruzeiro" && agenda.length && prog >= agenda[0].f) {
          if (prog > agenda[0].f + 0.2) agenda.shift();
          else if (!ocupado()) { const it = agenda.shift(); aviso(textoAgenda(it), it.quem); }
        }
        if (linhas.length && prog >= linhas[0][0]) msg = { txt: linhas.shift()[1], t: 4 };
        if (fase === "cruzeiro" && !arremetendo && av.z > COMP - DESCIDA) {
          fase = "aproximacao"; zPista = COMP; tempoFase = 0; cintos = true; agenda.length = 0;
          aviso(`Tripulação, preparar para o pouso. Senhoras e senhores, iniciamos a descida para ${nomeChegada}. Coloquem o encosto da poltrona na posição vertical, fechem a mesinha e apertem os cintos!`, "Comandante", true);
          msg = { txt: auto ? "Alinhe com a pista! 🛬" : "Alinhe e desça devagar! 🛬", t: 5 };
        }
        if (fase === "aproximacao" && !avisouJanela && rota.janela && av.z > COMP - 4600) { avisouJanela = true; aviso(rota.janela); }
        if (fase === "aproximacao") verificarPouso();
      } else if (fase === "pousado") {
        av.vel = Math.max(0, av.vel - 120 * dt); av.incl *= 0.9; av.x *= 0.98;
      }
      av.z += av.vel * dt;
      // trem de pouso, flaps e spoilers como num avião de verdade
      const tremAlvo = fase === "pista" || fase === "pousado" ? 1 : fase === "subindo" ? (av.h > 70 ? 0 : 1) : fase === "aproximacao" && av.h < 230 ? 1 : 0;
      if (tremAlvo !== tremAlvoAnt) {
        tremAlvoAnt = tremAlvo;
        Motor.ruido({ dur: 0.35, vol: 0.14, freq: 90 });
        if (!msg || msg.t < 1) msg = { txt: tremAlvo ? "⚙️ Trem de pouso baixado" : "⚙️ Trem de pouso recolhido", t: 2.2 };
      }
      trem += (tremAlvo - trem) * Math.min(1, dt * 1.3);
      const flapAlvo = fase === "pista" || fase === "subindo" ? 0.5 : fase === "aproximacao" ? (av.h < 330 ? 1 : 0.5) : fase === "pousado" ? 1 : 0;
      flap += (flapAlvo - flap) * Math.min(1, dt * 0.8);
      spoiler += ((fase === "pousado" && av.vel > 20 ? 1 : 0) - spoiler) * Math.min(1, dt * 4);
      // instrumentos: no cruzeiro, uns 10 mil metros e 850 km/h; na descida, vão baixando até a pista
      const altAlvo = fase === "cruzeiro" && !arremetendo ? 10000 + (av.h - 160) * 6 : av.h * 21;
      const velAlvo = fase === "pista" || fase === "pousado" ? av.vel * 0.85 : fase === "subindo" ? 280 + av.h * 2 : fase === "cruzeiro" ? 850 + (av.h - 160) * 0.08 : 250 + Math.min(1, av.h / 455) * 560;
      instr.alt += (altAlvo - instr.alt) * Math.min(1, dt * (fase === "pista" || fase === "pousado" ? 10 : 0.35));
      instr.vel += (velAlvo - instr.vel) * Math.min(1, dt * (fase === "pista" || fase === "pousado" ? 10 : 0.5));
      // objetos: passou por eles?
      objetos.forEach(o => {
        if (o.passou || o.z > av.z) return;
        o.passou = true;
        const dx = o.x - av.x, dh = o.h - av.h;
        if (o.tipo === "argola" && Math.hypot(dx, dh) < 60) { estrelas++; Motor.nota(1320, { dur: 0.15, tipo: "triangle", vol: 0.12 }); Motor.nota(1760, { dur: 0.2, tipo: "triangle", vol: 0.1, inicio: 0.08 }); o.pegou = 1; }
        else if (o.tipo === "nuvem" && Math.hypot(dx, dh) < 120 * o.s) branco = 0.7;
        else if (o.tipo === "tempestade" && Math.hypot(dx, dh) < 140 * o.s) { sacode = 1.6; flash = 0.3; conforto = Math.max(0, conforto - 1); Motor.ruido({ dur: 0.9, vol: 0.3, freq: 120 }); cintos = true; setTimeout(() => { if (fase === "cruzeiro") cintos = false; }, 6000);
          // a voz avisa no máximo a cada 8 s (a nuvem é atravessada por vários quadros seguidos)
          const agora = performance.now();
          if (!avisouTurbulencia && !ocupado()) { avisouTurbulencia = true; ultimaTurbulencia = agora; aviso("Atenção, passageiros: estamos passando por uma área de turbulência. Mantenham os cintos afivelados!"); msg = { txt: "Turbulência! Desvie das nuvens escuras!", t: 3 }; }
          else if (agora - ultimaTurbulencia > 8000) { ultimaTurbulencia = agora; dizer("Turbulência! Desvie das nuvens escuras!"); } }
        else if (o.tipo === "passaros" && Math.hypot(dx, dh) < 70) { sacode = 0.8; conforto = Math.max(0, conforto - 1); dizer("Cuidado com os pássaros!"); }
      });
      objetos.forEach(o => { if (o.tipo === "passaros") o.x += o.vx * dt; });
      sacode = Math.max(0, sacode - dt); flash = Math.max(0, flash - dt); branco = Math.max(0, branco - dt);
    }
    // descida ideal até a pista (rampa suave, como a dos aviões de verdade)
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
      dizer(t, true);
      fase = "cruzeiro"; arremetendo = true; av.h = Math.max(av.h, 40); av.vh = 120;
      setTimeout(() => { if (P.vivo() && fase === "cruzeiro") { arremetendo = false; fase = "aproximacao"; zPista = av.z + 4000; dizer("Vamos tentar de novo: alinhe e desça devagar.", true); } }, 3000);
    }
    function pousar() {
      fase = "pousado"; av.h = 0; av.vh = 0; tempoFase = 0;
      Motor.ruido({ dur: 0.4, vol: 0.2, freq: 300 });
      Motor.tim();
      Palco.confete(confete, P.W / 2, P.H * 0.35, ["#ffd43b", "#69db7c", "#4dabf7", "#ff8787", "#fff"], 80);
      Motor.comemorar(P.canvas);
      cintos = false;
      fila.length = 0;
      aviso(`Senhoras e senhores, bem-vindos a ${nomeChegada}! A temperatura local é de ${TEMPERATURA[rota.para] || 28} graus. ${rota.chegada} Permaneçam sentados, com os cintos afivelados, até o avião parar no portão.`, "Comandante", true);
      setTimeout(() => {
        if (!P.vivo()) return;
        const det = document.createElement("div");
        det.className = "aviao-fim";
        const cv = document.createElement("canvas"); cv.width = 260; cv.height = 220;
        desenharMapa(cv.getContext("2d"), 10, 10, 240, 200, op.rota, 1);
        const tx = document.createElement("p"); tx.textContent = rota.chegada;
        const st = document.createElement("div"); st.className = "detalhe-fim"; st.textContent = `⭐ ${estrelas} estrelas · ${"😊".repeat(conforto) || "😵"} conforto · ${rota.km} km`;
        det.append(cv, tx, st);
        P.fim(`Bem-vindo a ${nomeChegada}!`, "🛬", det, [
          { rotulo: "🔁 Voar de novo", principal: true, aoClicar: () => voo(area, op, fid) },
          { rotulo: "🗺️ Outra rota", aoClicar: () => JOGOS.find(j => j.id === "aviao").iniciar(area, { id: fid }) },
        ]);
      }, 3200);
    }

    // ----- Projeção e desenho -----
    function vista() {
      const W = P.W, H = P.H, f = Math.min(W, H * 1.4) * 0.9, hz = H * 0.42;
      const camZ = av.z - 260, camY = av.h + 70, camX = av.x * 0.85;
      const proj = (x, y, z) => { const dz = z - camZ; if (dz < 5) return null; const s = f / dz; return [W / 2 + (x - camX) * s, hz + (camY - y) * s, s]; };
      return { W, H, f, hz, camZ, camY, camX, proj };
    }
    // polígono com pontos do mundo [x, y, z]
    function poli(v, pts, corF) {
      const q = [];
      for (const [x, y, z] of pts) { const p = v.proj(x, y, z); if (!p) return; q.push(p); }
      ctx.fillStyle = corF; ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
    }
    // caixa (prédio, terminal): lado, telhado e frente; janelas em faixas quando está perto
    function caixa3d(v, x, z, w, d, h, [cf, cl, ct], janelas = true) {
      const x0 = x - w / 2, x1 = x + w / 2, xl = x > v.camX ? x0 : x1;
      poli(v, [[xl, 0, z], [xl, 0, z + d], [xl, h, z + d], [xl, h, z]], cl);
      if (h < v.camY) poli(v, [[x0, h, z], [x1, h, z], [x1, h, z + d], [x0, h, z + d]], ct);
      poli(v, [[x0, 0, z], [x1, 0, z], [x1, h, z], [x0, h, z]], cf);
      const a = v.proj(x0, 0, z), b = v.proj(x1, 0, z);
      if (janelas && a && b && b[0] - a[0] > 20) {
        ctx.fillStyle = "rgba(60,100,140,.42)";
        const s = a[2], andares = Math.min(45, Math.floor((h - 8) / 9));
        for (let k = 0; k < andares; k++) ctx.fillRect(a[0] + 3 * s, a[1] - (10 + k * 9) * s, b[0] - a[0] - 6 * s, 4.5 * s);
      }
    }
    function desenhar(dt) {
      const v = vista(), { W, H, hz } = v;
      ctx.save();
      // o mundo inclina junto com o avião (e balança na turbulência)
      const tremor = sacode > 0 ? (Math.random() - 0.5) * 10 * sacode : 0;
      ctx.translate(W / 2 + tremor, H * 0.5 + tremor); ctx.rotate(-av.incl * 0.5); ctx.translate(-W / 2, -H * 0.5);
      const D = Math.hypot(W, H);
      // céu: azul forte lá em cima, clareando até a névoa do horizonte
      const g = ctx.createLinearGradient(0, hz - H, 0, hz);
      g.addColorStop(0, "#0d58ad"); g.addColorStop(0.55, "#4c9fe4"); g.addColorStop(1, "#d6e6f2");
      ctx.fillStyle = "#0d58ad"; ctx.fillRect(-D, hz - D * 1.5, W + 2 * D, D * 1.5);
      ctx.fillStyle = g; ctx.fillRect(-D, hz - H, W + 2 * D, H);
      const sx = W * 0.8, sy = hz - H * 0.28, sr = Math.min(W, H) * 0.05;
      const gs = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 4);
      gs.addColorStop(0, "rgba(255,253,235,1)"); gs.addColorStop(0.22, "rgba(255,250,215,.9)"); gs.addColorStop(0.3, "rgba(255,248,210,.35)"); gs.addColorStop(1, "rgba(255,248,210,0)");
      ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(sx, sy, sr * 4, 0, 7); ctx.fill();
      // chão em faixas (de longe para perto)
      const BAND = 120, zIni = Math.floor((v.camZ + 30) / BAND) * BAND;
      const tipoLonge = paisagemEm(v.camZ + 9000);
      ctx.fillStyle = CHAO[tipoLonge][0]; ctx.fillRect(-D, hz, W + 2 * D, D * 1.5);
      // montanhas no horizonte (serra), em duas camadas com a névoa
      const tipoPerto = paisagemEm(av.z);
      if (tipoLonge === "serra" || tipoPerto === "serra") {
        [["#8fb0c2", 0.03, 95, 0], ["#6f9a72", 0.06, 60, 110]].forEach(([corM, par, alt, des]) => {
          ctx.fillStyle = corM;
          for (let i = -3; i < 10; i++) { const mx = ((i * 230 + des - v.camX * par) % (W + 460) + W + 460) % (W + 460) - 230, ah = alt + ((i * 7) % 3) * 22; ctx.beginPath(); ctx.moveTo(mx - 170, hz + 1); ctx.quadraticCurveTo(mx - 40, hz - ah * 1.1, mx, hz - ah); ctx.quadraticCurveTo(mx + 60, hz - ah * 0.9, mx + 170, hz + 1); ctx.fill(); }
        });
      }
      for (let z = zIni + 60 * BAND; z >= zIni; z -= BAND) {
        const a = v.proj(0, 0, z + BAND), b = v.proj(0, 0, z);
        if (!a || !b) continue;
        const tp = paisagemEm(z), cores = CHAO[tp], ib = Math.floor(z / BAND);
        ctx.fillStyle = cores[ib & 1];
        ctx.fillRect(-D, a[1], W + 2 * D, b[1] - a[1] + 1);
        // plantações e pastos em retalhos (com uma beiradinha entre um e outro)
        if (CAMPOS[tp] && b[1] - a[1] > 0.6 && z - v.camZ < 5200) {
          const pal = CAMPOS[tp], fz = Math.floor(z / (BAND * 3)), za = ib % 3 === 0 ? 14 : 0;
          for (let ix = -6; ix <= 6; ix++) {
            const hh = hash(ix * 3.1, fz);
            if (hh < 0.25) continue;
            faixaChao(v, z + za, BAND - za, ix * 520 + 14, ix * 520 + 506, ix * 520 + 14, ix * 520 + 506, pal[Math.floor(hash(fz, ix) * pal.length)]);
          }
        }
        // estrada no meio do campo
        if (tp === "cerrado" || tp === "caatinga" || tp === "serra") { const ex = (zz => 900 + Math.sin(zz * 0.0006) * 300); faixaChao(v, z, BAND, ex(z) - 12, ex(z) + 12, ex(z + BAND) - 12, ex(z + BAND) + 12, "#5d5f5e"); }
        // ruas da cidade: avenidas compridas e ruas atravessadas
        if (tp === "cidade") {
          for (let k = -3; k <= 3; k++) if (k) faixaChao(v, z, BAND, k * 780 - 14, k * 780 + 14, k * 780 - 14, k * 780 + 14, "#5f656b");
          if (ib % 4 === 0) faixaChao(v, z, 22, -6000, 6000, -6000, 6000, "#666c72");
        }
        // rio (no Encontro das Águas, metade escuro e metade barrento)
        if (tp === "rio") {
          const r1 = rioX(z), r2 = rioX(z + BAND);
          faixaChao(v, z, BAND, r1 - LR - 10, r1 + LR + 10, r2 - LR - 10, r2 + LR + 10, "#5b6b3a");
          if (rota.encontro && z < encontroAte) { faixaChao(v, z, BAND, r1 - LR, r1, r2 - LR, r2, AGUA.negro); faixaChao(v, z, BAND, r1, r1 + LR, r2, r2 + LR, AGUA.rio); }
          else faixaChao(v, z, BAND, r1 - LR, r1 + LR, r2 - LR, r2 + LR, AGUA[rota.corRio || "rio"]);
        }
        // litoral, lago ou beira de rio de um dos lados
        const c = costaEm(z);
        if (c) {
          const l = c[2], la = linhaCosta(c, z), lb = linhaCosta(c, z + BAND), q = (p, k) => l * (p + k);
          const quad = (k1, k2, corF) => faixaChao(v, z, BAND, Math.min(q(la, k1), q(la, k2)), Math.max(q(la, k1), q(la, k2)), Math.min(q(lb, k1), q(lb, k2)), Math.max(q(lb, k1), q(lb, k2)), corF);
          if (c[3] === "mar") {
            quad(-55, 0, "#ecd9a0");               // areia da praia
            quad(0, 9000, AGUA.mar);               // mar
            quad(0, 70, "#2fa3b8");                // água rasinha, verde-azulada
            quad(0, 12, "#f4fbff");                // espuma das ondas
            quad(26, 32, "rgba(255,255,255,.55)"); // a onda seguinte
          } else { quad(-12, 0, "#4a5a30"); quad(0, 9000, AGUA[c[3]]); }
        }
        // canal entre a ilha e o continente
        if (noCanal(z) || noCanal(z + BAND)) faixaChao(v, z, BAND, -9000, 9000, -9000, 9000, AGUA.mar);
      }
      // pista de decolagem e de pouso
      pista(v, 0);
      if (zPista) pista(v, zPista);
      // coisas no chão: árvores, prédios, ondas, barcos e os pontos famosos (de longe para perto)
      decoracao(v);
      // névoa do horizonte: o que está longe fica clarinho, como de verdade
      const gn = ctx.createLinearGradient(0, hz - H * 0.06, 0, hz + H * 0.24);
      gn.addColorStop(0, "rgba(214,230,242,0)"); gn.addColorStop(0.24, "rgba(214,230,242,.92)"); gn.addColorStop(0.5, "rgba(214,230,242,.45)"); gn.addColorStop(1, "rgba(214,230,242,0)");
      ctx.fillStyle = gn; ctx.fillRect(-D, hz - H * 0.06, W + 2 * D, H * 0.3);
      // objetos no ar, de longe para perto
      objetos.filter(o => o.z > v.camZ + 20 && o.z < v.camZ + 7000).sort((a, b) => b.z - a.z).forEach(o => desenharObjeto(v, o));
      ctx.restore();
      // o avião (fica no meio da tela, inclinado)
      const sa = Math.min(W, H) * 0.55;
      const pa = v.proj(av.x, av.h, av.z);
      if (pa) {
        ctx.fillStyle = "rgba(0,0,0,.18)";
        const ch = v.proj(av.x, 0, av.z);
        if (ch && av.h < 300) { ctx.beginPath(); ctx.ellipse(ch[0], ch[1], sa * 0.36 * (1 - av.h / 320), sa * 0.035, 0, 0, 7); ctx.fill(); }
        // trilhas brancas (vapor que congela) atrás das turbinas, lá no alto
        if (fase === "cruzeiro" && av.h > 300) {
          const k = Math.min(1, (av.h - 300) / 120) * 0.4, r = sa * 0.075;
          ctx.save(); ctx.translate(pa[0], pa[1]); ctx.rotate(av.incl * 0.9);
          [-1, 1].forEach(l => {
            const ex = l * sa * 0.18, ey = r * 0.5 - Math.abs(ex) * 0.085 + r * 0.62;
            const gt = ctx.createLinearGradient(0, ey, 0, ey + H * 0.55);
            gt.addColorStop(0, `rgba(255,255,255,${k})`); gt.addColorStop(1, "rgba(255,255,255,0)");
            ctx.fillStyle = gt; ctx.beginPath(); ctx.moveTo(ex - r * 0.12, ey); ctx.lineTo(ex + r * 0.12, ey); ctx.lineTo(ex * 2.4 + l * r * 2.2, ey + H * 0.55); ctx.lineTo(ex * 2.4 - l * r * 0.6, ey + H * 0.55); ctx.closePath(); ctx.fill();
          });
          ctx.restore();
        }
        ctx.save(); ctx.translate(pa[0], pa[1]); desenharAviao(ctx, sa, cor, av.incl * 0.9, { trem, flap, spoiler }); ctx.restore();
      }
      if (branco > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.85, branco * 1.4)})`; ctx.fillRect(0, 0, W, H); }
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,230,${flash * 1.6})`; ctx.fillRect(0, 0, W, H); }
      painel();
      desenharLegenda();
      Palco.desenharConfete(ctx, confete, dt);
      if (msg) { Palco.texto(ctx, msg.txt, W / 2, H * 0.2, Math.min(34 * P.esc(), W / 18), "#fff"); msg.t -= dt; if (msg.t <= 0) msg = null; }
      if (pausado) Palco.texto(ctx, "⏸️ Pausa", W / 2, H / 2, 54 * P.esc());
    }
    function faixaChao(v, z, band, xa1, xa2, xb1, xb2, corF) {
      const a1 = v.proj(xa1, 0, z), a2 = v.proj(xa2, 0, z), b1 = v.proj(xb1, 0, z + band), b2 = v.proj(xb2, 0, z + band);
      if (!a1 || !a2 || !b1 || !b2) return;
      ctx.fillStyle = corF; ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(b1[0], b1[1]); ctx.closePath(); ctx.fill();
    }
    // pista com faixas de cabeceira, marcas de toque, linha do meio, luzes; terminal de passageiros
    function pista(v, z0) {
      const L = 1200, Wp = 60;
      faixaChao(v, z0 - 100, L + 100, -Wp - 30, Wp + 30, -Wp - 30, Wp + 30, "#6b8f3a");
      faixaChao(v, z0 - 100, L + 100, -Wp, Wp, -Wp, Wp, "#3f4448");
      faixaChao(v, z0 - 100, L + 100, -Wp + 3, -Wp + 6, -Wp + 3, -Wp + 6, "#e9ecef");
      faixaChao(v, z0 - 100, L + 100, Wp - 6, Wp - 3, Wp - 6, Wp - 3, "#e9ecef");
      for (let z = z0 + 160; z < z0 + L - 60; z += 80) faixaChao(v, z, 40, -2.5, 2.5, -2.5, 2.5, "#f8f9fa");
      [z0 - 80, z0 + L - 90].forEach(zc => { for (let k = 0; k < 6; k++) { const x = 10 + k * 8; faixaChao(v, zc, 70, x, x + 5, x, x + 5, "#f8f9fa"); faixaChao(v, zc, 70, -x - 5, -x, -x - 5, -x, "#f8f9fa"); } });
      [z0 + 260, z0 + 420].forEach(zt => { faixaChao(v, zt, 60, 18, 34, 18, 34, "#f1f3f5"); faixaChao(v, zt, 60, -34, -18, -34, -18, "#f1f3f5"); });
      // luzes da beira da pista e as de aproximação antes da pista de pouso
      for (let z = z0 - 80; z < z0 + L; z += 90) [-Wp - 4, Wp + 4].forEach(x => { const p = v.proj(x, 0, z); if (p && p[2] > 0.08) { ctx.fillStyle = "#fff4c2"; ctx.beginPath(); ctx.arc(p[0], p[1], Math.min(4, Math.max(1, p[2] * 3)), 0, 7); ctx.fill(); } });
      if (z0 > 0) for (let z = z0 - 700; z < z0 - 100; z += 60) { const p = v.proj(0, 0, z); if (p) { ctx.fillStyle = "#ffd43b"; ctx.beginPath(); ctx.arc(p[0], p[1], Math.min(7, Math.max(1.5, p[2] * 6)), 0, 7); ctx.fill(); } }
      // pista de taxiamento e o terminal com as pontes de embarque
      faixaChao(v, z0 + 540, 50, -300, -Wp, -300, -Wp, "#4a4f54");
      caixa3d(v, -380, z0 + 260, 120, 640, 42, ["#cfd8df", "#9fb4c4", "#8a959e"], false);
      // pontes de embarque saindo do terminal
      for (let k = 0; k < 4; k++) caixa3d(v, -300, z0 + 330 + k * 140, 40, 14, 22, ["#e9ecef", "#ced4da", "#adb5bd"], false);
      // torre de controle no aeroporto de partida
      if (z0 === 0) {
        caixa3d(v, -230, 300, 22, 22, 110, ["#dee2e6", "#b9c1c8", "#adb5bd"], false);
        const p = v.proj(-230, 135, 300), q = v.proj(-230, 110, 300);
        if (p && q) { const s = p[2]; ctx.fillStyle = "#3b7fb5"; ctx.fillRect(p[0] - 22 * s, p[1], 44 * s, q[1] - p[1]); ctx.fillStyle = "#e9ecef"; ctx.fillRect(p[0] - 25 * s, p[1] - 6 * s, 50 * s, 6 * s); }
      }
    }
    // árvores, prédios, ondas e barcos espalhados (posições fixas por "célula" do mapa)
    const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
    const PREDIOS = [["#c9ccd1", "#a3a9b0", "#8f969d"], ["#dfe2e6", "#b5bbc2", "#9aa1a8"], ["#d8cbb8", "#b3a690", "#998d79"], ["#aebccb", "#8597a9", "#7a8794"], ["#e8e0d0", "#c2b9a6", "#a39b8a"], ["#b9c4cc", "#93a0aa", "#80898f"]];
    const VERDES = ["#1b5e2b", "#14532d", "#22703a", "#2b7a3c"];
    function decoracao(v) {
      const CEL = 260;
      const z0 = Math.floor((v.camZ + 80) / CEL), z1 = z0 + 26;
      const mOrd = marcos.filter(m => m.z > v.camZ + 30).sort((a, b) => b.z - a.z);
      let im = 0;
      for (let iz = z1; iz >= z0; iz--) {
        // pontos famosos que ficam nesta fileira (ou mais longe)
        while (im < mOrd.length && mOrd[im].z >= iz * CEL) desenharMarco(v, mOrd[im++]);
        const tp = paisagemEm(iz * CEL);
        const altCid = ALTURA_CIDADE[iz * CEL < COMP / 2 ? rota.de : rota.para] || 1;
        for (let ix = -6; ix <= 6; ix++) {
          const r = hash(ix, iz), x = ix * CEL + (hash(iz, ix) - 0.5) * CEL * 0.8, z = iz * CEL + r * CEL * 0.6;
          if (Math.abs(x) < (z < 1400 ? 140 : 320) && (z < 1400 || (z > COMP - 7000 && z < COMP + 1400) || (zPista && z > zPista - 4200 && z < zPista + 1400))) continue; // pista e a descida até ela livres
          if (Math.abs(x + 380) < 120 && ((z > 150 && z < 1000) || (zPista && z > zPista + 150 && z < zPista + 1000))) continue; // terminal
          if (z - v.camZ < 70) continue; // colado na câmera: ficaria gigante
          const ag = agua(x, z);
          const p = v.proj(x, 0, z);
          if (!p || p[1] > v.H + 60 || p[0] < -300 || p[0] > v.W + 300) continue;
          const s = p[2];
          if (ag) {
            // ondinhas brilhando e, de vez em quando, um barco com a sua esteira
            if (s > 0.03 && (ag === "mar" || ag === "lago")) {
              ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = Math.max(1, 2 * s);
              [[0, 0], [70, 90], [-60, 150]].forEach(([dx, dz]) => { const q = v.proj(x + dx, 0, z + dz); if (q) { ctx.beginPath(); ctx.moveTo(q[0] - 14 * q[2], q[1]); ctx.quadraticCurveTo(q[0], q[1] - 3 * q[2], q[0] + 14 * q[2], q[1]); ctx.stroke(); } });
            }
            if (r > 0.94) barco(p, s, ag === "mar" ? "#f8f9fa" : "#e9d8a6");
            continue;
          }
          if (pertoDeMarco(x, z)) continue;
          if (tp === "cidade") {
            for (let k = 0; k < 3; k++) {
              const h1 = hash(ix + k * 7, iz), h2 = hash(iz + k, ix * 3), bx = x + (k - 1) * 85, bz = z + (k === 1 ? 70 : 0);
              if (agua(bx, bz) || Math.abs(bx) % 780 < 30) continue;
              let h = (30 + h1 * 100) * altCid;
              if (h2 > 0.88) h *= 2.1;
              caixa3d(v, bx, bz, 55 + h2 * 25, 50 + h1 * 40, h, PREDIOS[Math.floor(h2 * PREDIOS.length)]);
            }
            if (r < 0.2) arvore(v.proj(x + 120, 0, z + 120), "#2f7a3c", 40);
          } else if (tp === "caatinga") {
            if (r < 0.7) { ctx.fillStyle = r < 0.25 ? "#8a7f62" : r < 0.5 ? "#7d8a5a" : "#6f7a4c"; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 10 * s, 26 * s, 12 * s, 0, 0, 7); ctx.ellipse(p[0] + 60 * s, p[1] + 30 * s - 8 * s, 18 * s, 9 * s, 0, 0, 7); ctx.fill(); }
            else if (r > 0.86) mandacaru(p, s);
          } else if (tp === "praia") {
            if (r < 0.45) coqueiro(p, s);
            else if (r > 0.9) casinha(p, s);
          } else if (tp === "cerrado") {
            if (r < 0.32) arvore(p, r < 0.16 ? "#6f7f2c" : "#5d7030", 44);
            else if (r > 0.95) casinha(p, s);
          } else if (tp === "serra") {
            if (r > 0.86) { ctx.fillStyle = "#4b7a39"; ctx.beginPath(); ctx.ellipse(p[0], p[1], 220 * s, 95 * s, 0, Math.PI, 0); ctx.fill(); }
            if (r < 0.6) arvore(p, VERDES[Math.floor(r * 6.6) % 4], 52);
          } else if (tp === "floresta" || tp === "rio") {
            // copas fechadas, de vários verdes, e de vez em quando uma castanheira bem alta
            arvore(p, VERDES[Math.floor(r * 4)], r > 0.93 ? 120 : 72, true);
            const q = v.proj(x + 120, 0, z + 90);
            if (q && !agua(x + 120, z + 90)) arvore(q, VERDES[Math.floor(hash(iz, ix * 5) * 4)], 64, true);
          }
        }
      }
      while (im < mOrd.length) desenharMarco(v, mOrd[im++]);
    }
    function arvore(p, corA, tam, copa = false) {
      if (!p) return;
      const s = p[2], t = tam * s;
      if (p[1] - t * 1.2 > P.H || s > 3) return;
      ctx.fillStyle = corA;
      ctx.beginPath(); ctx.arc(p[0], p[1] - t * 0.5, t * 0.55, 0, 7); ctx.fill();
      if (copa) { ctx.beginPath(); ctx.arc(p[0] - t * 0.45, p[1] - t * 0.3, t * 0.4, 0, 7); ctx.arc(p[0] + t * 0.45, p[1] - t * 0.3, t * 0.4, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.arc(p[0] - t * 0.15, p[1] - t * 0.7, t * 0.25, 0, 7); ctx.fill(); }
    }
    function coqueiro(p, s) {
      ctx.strokeStyle = "#8a6a3f"; ctx.lineWidth = Math.max(1, 4 * s);
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(p[0] + 10 * s, p[1] - 35 * s, p[0] + 4 * s, p[1] - 62 * s); ctx.stroke();
      ctx.strokeStyle = "#2f8a3a"; ctx.lineWidth = Math.max(1, 5 * s);
      const tx = p[0] + 4 * s, ty = p[1] - 62 * s;
      [-2.6, -2, -1.2, -0.5, 0.2].forEach(a => { ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * 18 * s, ty + Math.sin(a) * 18 * s - 6 * s, tx + Math.cos(a) * 30 * s, ty + Math.sin(a) * 22 * s + 10 * s); ctx.stroke(); });
    }
    function mandacaru(p, s) {
      ctx.fillStyle = "#4f7a3a";
      ctx.fillRect(p[0] - 4 * s, p[1] - 50 * s, 8 * s, 50 * s);
      ctx.fillRect(p[0] - 16 * s, p[1] - 34 * s, 12 * s, 5 * s); ctx.fillRect(p[0] - 16 * s, p[1] - 46 * s, 5 * s, 14 * s);
      ctx.fillRect(p[0] + 4 * s, p[1] - 26 * s, 12 * s, 5 * s); ctx.fillRect(p[0] + 11 * s, p[1] - 40 * s, 5 * s, 16 * s);
    }
    function casinha(p, s) {
      ctx.fillStyle = "#f1ebe0"; ctx.fillRect(p[0] - 14 * s, p[1] - 14 * s, 28 * s, 14 * s);
      ctx.fillStyle = "#c0533a"; ctx.beginPath(); ctx.moveTo(p[0] - 17 * s, p[1] - 14 * s); ctx.lineTo(p[0], p[1] - 26 * s); ctx.lineTo(p[0] + 17 * s, p[1] - 14 * s); ctx.fill();
    }
    function barco(p, s, corB) {
      ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = Math.max(1, 2 * s);
      ctx.beginPath(); ctx.moveTo(p[0] - 30 * s, p[1] + 14 * s); ctx.lineTo(p[0], p[1]); ctx.lineTo(p[0] + 30 * s, p[1] + 14 * s); ctx.stroke();
      ctx.fillStyle = corB; ctx.beginPath(); ctx.moveTo(p[0] - 20 * s, p[1] - 6 * s); ctx.lineTo(p[0] + 20 * s, p[1] - 6 * s); ctx.lineTo(p[0] + 14 * s, p[1] + 2 * s); ctx.lineTo(p[0] - 14 * s, p[1] + 2 * s); ctx.fill();
      ctx.fillStyle = "#495057"; ctx.fillRect(p[0] - 6 * s, p[1] - 13 * s, 12 * s, 7 * s);
    }
    // Pontos famosos (desenhados de pé, no lugar do mapa)
    function desenharMarco(v, m) {
      if (m.tipo === "ponte") return ponte(v, m);
      const p = v.proj(m.x, 0, m.z);
      if (!p || p[0] < -600 || p[0] > v.W + 600) return;
      const s = p[2], X = p[0], Y = p[1];
      const ret = (x, y, w, h, corR) => { ctx.fillStyle = corR; ctx.fillRect(X + x * s, Y - (y + h) * s, w * s, h * s); };
      if (m.tipo === "cristo") {
        // morro do Corcovado com a mata, a pedra e o Cristo de braços abertos lá no alto
        ctx.fillStyle = "#3d6b37"; ctx.beginPath(); ctx.moveTo(X - 560 * s, Y); ctx.bezierCurveTo(X - 300 * s, Y - 120 * s, X - 90 * s, Y - 560 * s, X, Y - 620 * s); ctx.bezierCurveTo(X + 60 * s, Y - 600 * s, X + 140 * s, Y - 330 * s, X + 520 * s, Y); ctx.fill();
        ctx.fillStyle = "#7d7f72"; ctx.beginPath(); ctx.moveTo(X - 10 * s, Y - 618 * s); ctx.bezierCurveTo(X + 50 * s, Y - 590 * s, X + 90 * s, Y - 420 * s, X + 130 * s, Y - 330 * s); ctx.lineTo(X + 40 * s, Y - 420 * s); ctx.closePath(); ctx.fill();
        ret(-8, 620, 16, 14, "#e9ecef");
        ret(-5, 634, 10, 52, "#f8f9fa"); ret(-34, 672, 68, 8, "#f8f9fa");
        ctx.fillStyle = "#f8f9fa"; ctx.beginPath(); ctx.arc(X, Y - 694 * s, 6 * s, 0, 7); ctx.fill();
      } else if (m.tipo === "paoacucar") {
        // o Pão de Açúcar e o morro da Urca saindo do mar, com o bondinho
        const morro = (dx, w, h) => { const g = ctx.createLinearGradient(X + (dx - w / 2) * s, 0, X + (dx + w / 2) * s, 0); g.addColorStop(0, "#8a8d7e"); g.addColorStop(0.5, "#6f7466"); g.addColorStop(1, "#4f5548"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(X + (dx - w / 2) * s, Y); ctx.bezierCurveTo(X + (dx - w / 2) * s, Y - h * 1.1 * s, X + (dx + w / 2) * s, Y - h * 1.1 * s, X + (dx + w / 2) * s, Y); ctx.fill(); ctx.fillStyle = "rgba(47,110,60,.75)"; ctx.beginPath(); ctx.ellipse(X + dx * s, Y - h * 0.1 * s, w * 0.5 * s, h * 0.2 * s, 0, Math.PI, 0); ctx.fill(); };
        morro(-170, 240, 170); morro(120, 230, 330);
        ctx.strokeStyle = "#343a40"; ctx.lineWidth = Math.max(1, 1.5 * s); ctx.beginPath(); ctx.moveTo(X - 170 * s, Y - 128 * s); ctx.lineTo(X + 120 * s, Y - 246 * s); ctx.stroke();
        ret(-30, 176, 14, 9, "#e03131");
      } else if (m.tipo === "elevador") {
        // a encosta da cidade alta, o Elevador Lacerda e a passarela até lá em cima
        ctx.fillStyle = "#4f7a3f"; ctx.beginPath(); ctx.moveTo(X - 520 * s, Y); ctx.lineTo(X - 520 * s, Y - 120 * s); ctx.lineTo(X - 40 * s, Y - 120 * s); ctx.lineTo(X - 10 * s, Y); ctx.fill();
        for (let k = 0; k < 6; k++) ret(-480 + k * 75, 120, 55, 24 + (k % 3) * 12, ["#f3d9a4", "#e8b4a0", "#cfe3f0", "#f1ebe0"][k % 4]);
        ret(-20, 0, 40, 150, "#eadfc4"); ret(-26, 150, 52, 26, "#e0d3b4"); ret(-6, 0, 3, 150, "#c9b993"); ret(5, 0, 3, 150, "#c9b993");
        ret(-60, 140, 40, 10, "#d7cbb0");
      } else if (m.tipo === "farol") {
        // Farol da Barra: torre listrada em cima do forte, na pontinha
        ctx.fillStyle = "#7d7f72"; ctx.beginPath(); ctx.ellipse(X, Y, 120 * s, 30 * s, 0, Math.PI, 0); ctx.fill();
        ret(-70, 10, 140, 26, "#e9dcc0");
        for (let k = 0; k < 5; k++) ret(-9 + k * 0.6, 36 + k * 16, 18 - k * 1.2, 16, k % 2 ? "#212529" : "#f8f9fa");
        ret(-7, 116, 14, 10, "#ffd43b"); ret(-9, 126, 18, 5, "#c92a2a");
      } else if (m.tipo === "teatro") {
        // Teatro Amazonas: prédio rosa de colunas brancas e a cúpula colorida
        ret(-95, 0, 190, 62, "#e7a2a6"); ret(-95, 62, 190, 8, "#f8f0f0");
        for (let k = 0; k < 6; k++) ret(-60 + k * 22, 0, 6, 58, "#fdf3f3");
        const dx = X, dy = Y - 70 * s, rr = 40 * s;
        ["#2f9e44", "#fcc419", "#1c7ed6", "#2f9e44", "#fcc419", "#1c7ed6"].forEach((corC, k) => { ctx.fillStyle = corC; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.arc(dx, dy, rr, Math.PI + k * Math.PI / 6, Math.PI + (k + 1) * Math.PI / 6); ctx.fill(); });
        ret(-3, 110, 6, 14, "#f8f0f0");
      } else if (m.tipo === "congresso") {
        // Congresso Nacional: as duas torres, a cúpula virada para baixo e a virada para cima
        ret(-170, 0, 340, 20, "#e9ecef");
        ret(-19, 20, 16, 180, "#dfe3e7"); ret(3, 20, 16, 180, "#cfd5da"); ret(-19, 120, 38, 6, "#cfd5da");
        ctx.fillStyle = "#f1f3f5"; ctx.beginPath(); ctx.ellipse(X - 110 * s, Y - 20 * s, 48 * s, 36 * s, 0, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(X + 50 * s, Y - 50 * s); ctx.quadraticCurveTo(X + 110 * s, Y - 10 * s, X + 170 * s, Y - 50 * s); ctx.lineTo(X + 140 * s, Y - 20 * s); ctx.lineTo(X + 80 * s, Y - 20 * s); ctx.fill();
        ctx.fillStyle = "#ced4da"; ctx.beginPath(); ctx.ellipse(X + 110 * s, Y - 50 * s, 60 * s, 8 * s, 0, 0, 7); ctx.fill();
      } else if (m.tipo === "veropeso") {
        // mercado Ver-o-Peso na beira da baía, com as torrezinhas de ferro
        ret(-110, 0, 220, 46, "#8fa9c2"); ret(-110, 46, 220, 6, "#5c6f82");
        [-100, -35, 35, 100].forEach(tx => { ret(tx - 8, 46, 16, 22, "#7d97b0"); ctx.fillStyle = "#4f6375"; ctx.beginPath(); ctx.moveTo(X + (tx - 10) * s, Y - 68 * s); ctx.lineTo(X + tx * s, Y - 92 * s); ctx.lineTo(X + (tx + 10) * s, Y - 68 * s); ctx.fill(); });
        for (let k = 0; k < 9; k++) ret(-100 + k * 24, 8, 12, 24, "#4f6375");
      } else if (m.tipo === "jangada") {
        // jangada: barquinho de vela branca, inclinado pelo vento
        ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = Math.max(1, 1.5 * s); ctx.beginPath(); ctx.moveTo(X - 26 * s, Y + 10 * s); ctx.lineTo(X, Y); ctx.lineTo(X + 26 * s, Y + 10 * s); ctx.stroke();
        ret(-24, -2, 48, 6, "#8a6a3f"); ret(-1, 4, 2, 58, "#5c4a2e");
        ctx.fillStyle = "#fffaf0"; ctx.beginPath(); ctx.moveTo(X + 1 * s, Y - 62 * s); ctx.quadraticCurveTo(X + 34 * s, Y - 30 * s, X + 30 * s, Y - 8 * s); ctx.lineTo(X + 1 * s, Y - 8 * s); ctx.fill();
        ctx.fillStyle = "#e8590c"; ctx.fillRect(X + 2 * s, Y - 30 * s, 26 * s, 4 * s);
      } else if (m.tipo === "dunas") {
        [[-260, 340, 70], [60, 420, 95], [380, 300, 60]].forEach(([dx, w, h]) => {
          ctx.fillStyle = "#f3e2b3"; ctx.beginPath(); ctx.moveTo(X + (dx - w / 2) * s, Y); ctx.quadraticCurveTo(X + (dx - w * 0.1) * s, Y - h * 2 * s, X + (dx + w / 2) * s, Y); ctx.fill();
          ctx.fillStyle = "#d9c48e"; ctx.beginPath(); ctx.moveTo(X + (dx + w * 0.05) * s, Y - h * 0.95 * s); ctx.quadraticCurveTo(X + (dx + w * 0.25) * s, Y - h * 0.6 * s, X + (dx + w / 2) * s, Y); ctx.lineTo(X + dx * s, Y); ctx.fill();
        });
      }
    }
    // Ponte Hercílio Luz: pênsil, por cima do canal, com as duas torres e os cabos de corrente
    function ponte(v, m) {
      const za = COMP + rota.canal[0] - 120, zb = COMP + rota.canal[1] + 120, H0 = 34, T = 130;
      const p = (y, z) => v.proj(m.x, y, z);
      const a = p(H0, za), b = p(H0, zb);
      if (!a || !b) return;
      ctx.strokeStyle = "#868e96"; ctx.lineWidth = Math.max(1.5, a[2] * 10); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      const t1 = za + 130, t2 = zb - 130;
      [t1, t2].forEach(zt => { const q0 = p(0, zt), q1 = p(T, zt); if (q0 && q1) { ctx.strokeStyle = "#adb5bd"; ctx.lineWidth = Math.max(1.5, q0[2] * 12); ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); } });
      ctx.strokeStyle = "#9aa1a8"; ctx.lineWidth = Math.max(1, a[2] * 4);
      const cabo = zz => { if (zz <= t1) return T - (T - H0) * (t1 - zz) / (t1 - za); if (zz >= t2) return T - (T - H0) * (zz - t2) / (zb - t2); const u = (zz - t1) / (t2 - t1); return H0 + 6 + (T - H0 - 6) * Math.pow(2 * u - 1, 2); };
      ctx.beginPath(); let ini = true;
      for (let zz = za; zz <= zb; zz += 30) { const q = p(cabo(zz), zz); if (!q) continue; ini ? ctx.moveTo(q[0], q[1]) : ctx.lineTo(q[0], q[1]); ini = false; }
      ctx.stroke();
      ctx.lineWidth = Math.max(0.6, a[2] * 1.5);
      for (let zz = t1 + 40; zz < t2; zz += 40) { const q0 = p(H0, zz), q1 = p(cabo(zz), zz); if (q0 && q1) { ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); } }
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
        // nuvem fofa: cada bolota com luz em cima e sombra embaixo
        const tem = o.tipo === "tempestade", r = 70 * s * o.s;
        [[-0.9, 0.2, 0.7], [0.9, 0.25, 0.75], [0, 0, 1], [-0.4, -0.4, 0.7], [0.45, -0.35, 0.65]].forEach(([dx, dy, k]) => {
          const cx = p[0] + dx * r, cy = p[1] + dy * r, rr = r * k;
          const g = ctx.createRadialGradient(cx - rr * 0.3, cy - rr * 0.45, rr * 0.1, cx, cy, rr);
          g.addColorStop(0, tem ? "rgba(110,118,128,.96)" : "rgba(255,255,255,.97)"); g.addColorStop(1, tem ? "rgba(40,45,52,.95)" : "rgba(205,218,230,.93)");
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill();
        });
        if (tem && Math.random() < 0.06) { ctx.strokeStyle = "#ffe066"; ctx.lineWidth = Math.max(2, 4 * s); ctx.beginPath(); ctx.moveTo(p[0], p[1] + r * 0.6); ctx.lineTo(p[0] - r * 0.2, p[1] + r * 1.2); ctx.lineTo(p[0] + r * 0.1, p[1] + r * 1.25); ctx.lineTo(p[0] - r * 0.15, p[1] + r * 1.9); ctx.stroke(); }
      } else if (o.tipo === "passaros") {
        ctx.strokeStyle = "#212529"; ctx.lineWidth = Math.max(1.5, 3 * s);
        const asa = Math.sin(performance.now() / 120 + o.z) * 6 * s;
        for (let i = 0; i < 5; i++) { const bx = p[0] + (i - 2) * 22 * s, by = p[1] + Math.abs(i - 2) * 10 * s; ctx.beginPath(); ctx.moveTo(bx - 9 * s, by - asa); ctx.lineTo(bx, by); ctx.lineTo(bx + 9 * s, by - asa); ctx.stroke(); }
      }
    }
    // quebra o texto em linhas que cabem na largura
    function quebrar(texto, larg) {
      const linhasT = []; let atual = "";
      texto.split(" ").forEach(p => { const t = atual ? atual + " " + p : p; if (ctx.measureText(t).width > larg && atual) { linhasT.push(atual); atual = p; } else atual = t; });
      if (atual) linhasT.push(atual);
      return linhasT;
    }
    // Legenda do aviso de bordo: quem fala e a frase que a voz está dizendo agora
    function desenharLegenda() {
      if (!legenda) return;
      const agora = performance.now(), L = legenda;
      if (agora > L.fim) { legenda = null; return; }
      if (agora < L.ini) return;
      let acc = 0, i = 0;
      for (; i < L.frases.length - 1; i++) { acc += L.frases[i].length * 75; if (agora - L.ini < acc) break; }
      const s = P.esc(), W = P.W, H = P.H;
      // fica embaixo, entre as setas (ou os instrumentos) e o botão de acelerar; sem espaço, sobe
      const esq = toqueNaTela ? 12 + tamSeta * 3 + 10 : 12 + 150 * s + 10;
      const dir = fase === "pista" ? 180 : 12;
      const altEsq = toqueNaTela ? 12 + tamSeta * 3 : (fase === "pista" ? 130 : 20) + 70 * s;
      let x0 = esq, x1 = W - dir, base = H - 16;
      if (x1 - x0 < Math.min(440, W * 0.55)) { x0 = 12; x1 = W - 12; base = H - Math.max(altEsq, fase === "pista" ? 118 : 0) - 14; }
      const larg = Math.min(x1 - x0, 640 * s), cx = (x0 + x1) / 2;
      const tam = Math.max(14, Math.min(19 * s, W / 24));
      ctx.font = `bold ${tam}px Fredoka, sans-serif`;
      const ls = quebrar(L.frases[i], larg - 28).slice(0, 4);
      const alt = 14 + tam * 0.95 + ls.length * tam * 1.25 + 10;
      const y0 = base - alt;
      Palco.caixa(ctx, cx - larg / 2, y0, larg, alt, 14, "rgba(12,22,44,.84)");
      Palco.texto(ctx, L.quem === "Tripulação" ? "📢 Tripulação" : "📢 Comandante", cx - larg / 2 + 14, y0 + 10 + tam * 0.4, tam * 0.78, "#ffd43b", { alinhar: "left", contorno: null });
      ls.forEach((l, k) => Palco.texto(ctx, l, cx, y0 + 14 + tam * 0.95 + k * tam * 1.25 + tam * 0.5, tam, "#fff", { contorno: null, peso: "600" }));
    }
    // Painel: rota, progresso e km, tempo que falta, altitude e velocidade, estrelas e o mapa
    function painel() {
      const s = P.esc(), W = P.W, H = P.H;
      const prog = Math.max(0, Math.min(1, av.z / COMP));
      const bw = Math.min(W - 160, 520 * s), bx = W / 2 - bw / 2, by = 10;
      const estreito = bw < 430, hb = (estreito ? 64 : 50) * s;
      Palco.caixa(ctx, bx, by, bw, hb, 14);
      Palco.texto(ctx, `${CIDADES[rota.de].nome} ✈️ ${nomeChegada}`, W / 2, by + 16 * s, Math.min(17 * s, (bw - 20) / 15));
      ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(bx + 14, by + 32 * s, bw - 28, 8 * s);
      ctx.fillStyle = "#ffd43b"; ctx.fillRect(bx + 14, by + 32 * s, (bw - 28) * prog, 8 * s);
      // instrumentos
      // com as setas na tela (celular), os instrumentos sobem para baixo do botão voltar
      const ix = 12, iy = toqueNaTela ? 92 : H - (fase === "pista" ? 130 : 20) - 70 * s;
      Palco.caixa(ctx, ix, iy, 150 * s, 66 * s, 12);
      // valores de verdade: decola a uns 250 km/h e voa a uns 850 km/h, a até 11 mil metros
      Palco.texto(ctx, `⛰️ ${(Math.round(instr.alt / 10) * 10).toLocaleString("pt-BR")} m`, ix + 10 * s, iy + 20 * s, 16 * s, "#fff", { alinhar: "left" });
      Palco.texto(ctx, `💨 ${Math.round(instr.vel)} km/h`, ix + 10 * s, iy + 46 * s, 16 * s, "#fff", { alinhar: "left" });
      Palco.texto(ctx, `⭐ ${estrelas}`, estreito ? bx + 176 * s + 40 * s : W / 2, by + hb + 22 * s, 24 * s, "#ffd43b");
      // aviso luminoso de cintos (decolagem, turbulência e pouso)
      if (cintos && fase !== "pousado") {
        // logo abaixo da barra da rota, à esquerda (longe da barra de força e da mensagem do meio)
        const cw = 176 * s, cx = bx, cy = by + hb + 4 * s;
        Palco.caixa(ctx, cx, cy, cw, 22 * s, 11 * s, "rgba(255,170,0,.92)");
        Palco.texto(ctx, "💺 APERTEM OS CINTOS", cx + cw / 2, cy + 11 * s, 12 * s, "#3d2600", { contorno: null });
      }
      // quanto falta: km e o tempo de um voo de verdade (como na telinha do avião)
      const falta = Math.round(minReal * (1 - prog)), hhmm = falta >= 60 ? `${Math.floor(falta / 60)}h${String(falta % 60).padStart(2, "0")}` : `${falta} min`;
      const tFalta = `${Math.round(rota.km * (1 - prog))} km · ⏱️ ${hhmm}`;
      if (estreito) Palco.texto(ctx, tFalta, W / 2, by + 51 * s, 13 * s, "#fff");
      else Palco.texto(ctx, tFalta, bx + bw - 14, by + 16 * s, 13 * s, "#fff", { alinhar: "right" });
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
    if (window.AVIAO_TESTE) window.AVIAO_TESTE = { COMP, pular: z => { av.z = z; }, estado: () => ({ fase, z: Math.round(av.z), h: Math.round(av.h), x: Math.round(av.x), estrelas, agenda: agenda.length, fila: fila.length }) };
    P.aoMedir = posicionar;
    // Turbinas: potência pela fase (acelerando na pista, força máxima subindo, cruzeiro, descida)
    const motor = turbina();
    const vigia = setInterval(() => { if (!P.vivo()) { motor.parar(); clearInterval(vigia); } }, 500);
    P.rodar(dt => {
      if (!pausado) atualizar(dt);
      const pot = fase === "pista" ? Math.min(1, 0.15 + av.vel / VEL * 0.85) : fase === "subindo" ? 1 : fase === "cruzeiro" ? 0.6 : fase === "aproximacao" ? 0.4 : Math.max(0, 0.3 - tempoFase * 0.08); // pousado: vai desligando
      motor.atualizar(pausado || fase === "fim" ? null : pot);
      desenhar(dt);
    });
    aviso(`Senhoras e senhores, bem-vindos a bordo! Este voo vai de ${CIDADES[rota.de].nome} para ${nomeChegada}: são ${rota.km} quilômetros, e o tempo de voo será de ${falaTempo(minReal)}. ${rota.partida} Apertem os cintos e boa viagem!`);
  }
})();
