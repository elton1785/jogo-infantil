// Ciências: ☀️ Sistema Solar (órbitas animadas, tamanho comparado com a Terra, curiosidades),
// ❓ Quiz dos planetas, 🫀 Corpo humano (tocar nos órgãos e nos cinco sentidos), 🧩 Monte o corpo
// (pôr cada órgão no lugar, tocando ou arrastando), 💧 Ciclo da água (animação em etapas com
// narração) e 🔢 Ordem do ciclo (pôr as etapas na ordem). Tudo desenhado aqui (SVG e canvas).
// Controle da TV: tudo tem botões (os planetas também têm botões, além do toque no desenho).
(() => {
  const svg = (c, vb = "0 0 100 100") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true">${c}</svg>`;
  const brilho = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".25"/>`;
  const sombra = '<path d="M50 10 A40 40 0 0 1 50 90 A52 52 0 0 0 50 10Z" fill="#000" opacity=".2"/>';
  // Faixa horizontal dentro de um planeta (centro 50,50 e raio r)
  const faixa = (dy, h, cor, r = 40) => {
    const borda = Math.min(r - 0.5, Math.abs(dy) + h / 2);
    const hw = Math.sqrt(r * r - borda * borda);
    return `<rect x="${(50 - hw).toFixed(1)}" y="${50 + dy - h / 2}" width="${(2 * hw).toFixed(1)}" height="${h}" rx="${h / 2}" fill="${cor}"/>`;
  };
  const crateras = (lista, cor) => lista.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${cor}"/>`).join("");

  // ---------- Sol, planetas e Lua ----------
  const ASTROS = [
    { id: "sol", nome: "Sol", art: "o", ordem: 0, raio: 109, cor: "#ffb703",
      tam: "O Sol é 109 vezes mais largo que a Terra.",
      curio: "O Sol é uma estrela, uma bola de gás muito quente. Ele é tão grande que caberiam mais de um milhão de Terras dentro dele!",
      desenho: svg(`<g stroke="#ff9f1c" stroke-width="6" stroke-linecap="round">${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => `<path d="M50 4 V12" transform="rotate(${a} 50 50)"/>`).join("")}</g><circle cx="50" cy="50" r="34" fill="#ffb703"/><circle cx="50" cy="50" r="26" fill="#ffd23f"/><circle cx="40" cy="42" r="5" fill="#ffe680"/><circle cx="58" cy="58" r="3.5" fill="#ffe680"/>`) },
    { id: "mercurio", nome: "Mercúrio", art: "o", ordem: 1, raio: 0.38, cor: "#a9a9a9",
      tam: "Mercúrio é bem menor que a Terra: quase 3 Mercúrios lado a lado dão a largura da Terra.",
      curio: "Mercúrio é o menor planeta e o mais perto do Sol. Lá, um ano dura só 88 dias!",
      desenho: svg(`<circle cx="50" cy="50" r="40" fill="#a9a9a9"/>${crateras([[36, 36, 6], [60, 30, 4], [62, 60, 8], [38, 66, 5], [52, 48, 3]], "#8a8a8a")}${sombra}${brilho(36, 34, 10)}`) },
    { id: "venus", nome: "Vênus", art: "o", ordem: 2, raio: 0.95, cor: "#e9c46a",
      tam: "Vênus é quase do mesmo tamanho da Terra.",
      curio: "Vênus é o planeta mais quente, porque tem um ar bem grosso que prende o calor. Ele brilha tanto no céu que é chamado de estrela-d'alva, mas é um planeta!",
      desenho: svg(`<circle cx="50" cy="50" r="40" fill="#e9c46a"/>${faixa(-20, 7, "#f4d78a")}${faixa(-4, 9, "#d9a84e")}${faixa(14, 7, "#f4d78a")}${faixa(28, 6, "#d9a84e")}${sombra}${brilho(36, 34, 10)}`) },
    { id: "terra", nome: "Terra", art: "a", ordem: 3, raio: 1, cor: "#2a7de1",
      tam: "Esta é a Terra, a nossa régua para comparar os tamanhos.",
      curio: "A Terra é a nossa casa! É o único planeta onde sabemos que existe vida. Tem água, ar e uma Lua.",
      desenho: svg(`<circle cx="50" cy="50" r="40" fill="#2a7de1"/><path d="M30 24 Q44 18 48 28 Q44 38 52 44 Q48 56 38 52 Q30 60 24 50 Q16 36 30 24Z" fill="#43aa5b"/><path d="M60 50 Q72 46 78 56 Q76 70 66 76 Q58 70 60 62Z" fill="#43aa5b"/><path d="M56 16 Q66 18 70 26 Q62 28 56 22Z" fill="#43aa5b"/><path d="M22 66 Q40 60 52 68 M58 34 Q70 30 82 38" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>${sombra}${brilho(36, 34, 10)}`) },
    { id: "marte", nome: "Marte", art: "o", ordem: 4, raio: 0.53, cor: "#c1440e",
      tam: "Marte tem mais ou menos metade da largura da Terra.",
      curio: "Marte é o planeta vermelho: o chão dele tem ferrugem. Lá fica o maior vulcão do Sistema Solar, o Monte Olimpo.",
      desenho: svg(`<circle cx="50" cy="50" r="40" fill="#c1440e"/><path d="M36 12 Q50 8 64 12 Q50 18 36 12Z" fill="#fff"/>${crateras([[34, 44, 7], [60, 36, 5], [56, 62, 9], [32, 66, 4]], "#9a3410")}${sombra}${brilho(36, 34, 10)}`) },
    { id: "jupiter", nome: "Júpiter", art: "o", ordem: 5, raio: 11.2, cor: "#d9a066",
      tam: "Júpiter é 11 vezes mais largo que a Terra: 11 Terras lado a lado!",
      curio: "Júpiter é o maior planeta de todos: caberiam mais de mil Terras dentro dele! A Grande Mancha Vermelha é uma tempestade maior que a Terra.",
      desenho: svg(`<circle cx="50" cy="50" r="40" fill="#e8c08a"/>${faixa(-26, 7, "#b07040")}${faixa(-14, 6, "#f3dcb4")}${faixa(-3, 8, "#c4844e")}${faixa(10, 6, "#f3dcb4")}${faixa(22, 8, "#b07040")}${faixa(32, 5, "#d9a066")}<ellipse cx="62" cy="24" rx="8" ry="4.5" fill="#c0392b"/>${sombra}${brilho(36, 34, 10)}`) },
    { id: "saturno", nome: "Saturno", art: "o", ordem: 6, raio: 9.4, cor: "#e3c27a",
      tam: "Saturno é cerca de 9 vezes mais largo que a Terra.",
      curio: "Saturno tem os anéis mais famosos, feitos de pedaços de gelo e de rocha. Ele é tão leve para o tamanho que boiaria numa banheira gigante!",
      desenho: svg(`<ellipse cx="50" cy="50" rx="47" ry="12" fill="none" stroke="#c9a35a" stroke-width="5" transform="rotate(-18 50 50)"/><circle cx="50" cy="50" r="28" fill="#e3c27a"/>${faixa(-12, 5, "#c9a35a", 28)}${faixa(0, 6, "#f1dba6", 28)}${faixa(12, 5, "#c9a35a", 28)}<path d="M50 22 A28 28 0 0 1 50 78 A36 36 0 0 0 50 22Z" fill="#000" opacity=".18"/><path d="M3 50 A47 12 0 0 0 97 50" fill="none" stroke="#f1dba6" stroke-width="5" transform="rotate(-18 50 50)"/><path d="M3 50 A47 12 0 0 0 97 50" fill="none" stroke="#c9a35a" stroke-width="1.5" transform="rotate(-18 50 50) translate(0 3)"/>`) },
    { id: "urano", nome: "Urano", art: "o", ordem: 7, raio: 4, cor: "#7fd3e0",
      tam: "Urano é 4 vezes mais largo que a Terra.",
      curio: "Urano gira deitado, como uma bola rolando. Ele é azul-esverdeado e muito gelado.",
      desenho: svg(`<ellipse cx="50" cy="50" rx="7" ry="46" fill="none" stroke="#b9e6ee" stroke-width="2.5" transform="rotate(8 50 50)"/><circle cx="50" cy="50" r="36" fill="#7fd3e0"/><path d="M50 14 V86" stroke="#a6e3ec" stroke-width="6" opacity=".6" transform="rotate(8 50 50)"/><path d="M50 14 A36 36 0 0 1 50 86 A46 46 0 0 0 50 14Z" fill="#000" opacity=".16"/>${brilho(38, 36, 9)}<path d="M50 4 A7 46 0 0 1 50 96" fill="none" stroke="#b9e6ee" stroke-width="2.5" transform="rotate(8 50 50)"/>`) },
    { id: "netuno", nome: "Netuno", art: "o", ordem: 8, raio: 3.9, cor: "#3f6fd8",
      tam: "Netuno é quase 4 vezes mais largo que a Terra.",
      curio: "Netuno é o planeta mais longe do Sol. Tem os ventos mais fortes do Sistema Solar, e um ano lá dura 165 anos da Terra!",
      desenho: svg(`<circle cx="50" cy="50" r="40" fill="#3f6fd8"/>${faixa(-10, 5, "#5b8bf0")}${faixa(16, 4, "#2f56b8")}<ellipse cx="40" cy="58" rx="8" ry="5" fill="#24408c"/><path d="M60 32 q8 -2 12 2" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8"/>${sombra}${brilho(36, 34, 10)}`) },
    { id: "lua", nome: "Lua", art: "a", ordem: null, raio: 0.27, cor: "#d9d9d9",
      tam: "A Lua tem mais ou menos um quarto da largura da Terra.",
      curio: "A Lua gira em volta da Terra. Ela não tem luz própria: brilha porque reflete a luz do Sol. Em 1969, astronautas pisaram nela pela primeira vez.",
      desenho: svg(`<circle cx="50" cy="50" r="40" fill="#d9d9d9"/>${crateras([[34, 36, 7], [60, 30, 5], [58, 58, 10], [32, 64, 6], [72, 46, 4]], "#b8b8b8")}${sombra}${brilho(36, 34, 10)}`) },
  ];
  const ASTRO = Object.fromEntries(ASTROS.map(a => [a.id, a]));
  const PLANETAS = ASTROS.filter(a => a.ordem);

  // Tamanho comparado com a Terra (SVG): o maior dos dois ocupa o quadro
  function comparar(a) {
    if (a.id === "terra") return svg(`<circle cx="60" cy="40" r="30" fill="${a.cor}"/><text x="60" y="88" font-size="13" text-anchor="middle" font-family="sans-serif" font-weight="bold" fill="#fff">Terra</text>`, "0 0 120 95");
    const grande = Math.max(a.raio, 1), R = 34;
    const ra = (a.raio / grande) * R, rt = Math.max(1.2, (1 / grande) * R);
    if (a.id === "sol") return svg(`<circle cx="-150" cy="45" r="200" fill="#ffb703"/><circle cx="100" cy="45" r="2" fill="#2a7de1"/><text x="100" y="66" font-size="12" text-anchor="middle" font-family="sans-serif" font-weight="bold" fill="#fff">Terra</text>`, "0 0 120 95");
    const xa = 8 + ra, xt = xa + ra + 10 + rt;
    return svg(`<circle cx="${xa}" cy="${45}" r="${ra}" fill="${a.cor}"/><circle cx="${xt}" cy="${45}" r="${rt}" fill="#2a7de1"/><text x="${xt}" y="${45 + Math.max(rt, 6) + 14}" font-size="12" text-anchor="middle" font-family="sans-serif" font-weight="bold" fill="#fff">Terra</text>`, `0 0 ${Math.max(120, xt + Math.max(rt, 20) + 4)} 95`);
  }

  // ---------- Corpo humano ----------
  const PELE = "#f2c9a0", PELE_L = "#a0704a";
  const ORGAOS = {
    cerebro: svg(`<path d="M58 70 Q60 82 66 90" stroke="#e58fae" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="66" cy="70" rx="14" ry="9" fill="#e58fae" stroke="#b9537c" stroke-width="2"/><path d="M18 56 C8 40 22 16 46 18 C58 10 82 16 86 36 C96 44 92 64 76 66 C70 76 52 76 46 68 C34 74 16 70 18 56Z" fill="#f4a3c0" stroke="#b9537c" stroke-width="2.5"/><path d="M30 34 q8 -6 14 2 q6 -8 14 0 M24 50 q10 -4 16 4 q8 -8 18 -2 q8 -6 16 2 M36 62 q6 -6 12 0 q6 -6 12 0 M50 24 q4 8 -2 14 M70 26 q-4 8 4 14" stroke="#c86b92" stroke-width="2.2" fill="none" stroke-linecap="round"/>`),
    coracao: svg(`<path d="M32 40 Q30 22 36 14" stroke="#3a6fd8" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M44 40 Q42 14 58 14 Q72 14 72 28" stroke="#7a1020" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M44 40 Q42 14 58 14 Q72 14 72 28" stroke="#e63946" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M50 90 C30 78 16 62 20 44 C23 32 38 30 46 38 C52 28 72 28 78 42 C84 58 70 76 50 90Z" fill="#d62839" stroke="#7a1020" stroke-width="2.5"/><path d="M48 40 Q54 60 46 84" stroke="#9a1828" stroke-width="2" fill="none"/>${brilho(32, 48, 6)}`),
    pulmoes: svg(`<path d="M50 4 V30 M50 30 Q42 34 40 44 M50 30 Q58 34 60 44" stroke="#e8b4c4" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M46 8 h8 M46 14 h8 M46 20 h8" stroke="#c98a9e" stroke-width="1.5"/><path d="M44 28 C28 24 12 46 12 70 C12 86 28 92 42 82 C46 64 46 44 44 28Z" fill="#f28da5" stroke="#a83a5a" stroke-width="2.5"/><path d="M56 28 C72 24 88 46 88 70 C88 86 72 92 58 82 C54 64 54 44 56 28Z" fill="#f28da5" stroke="#a83a5a" stroke-width="2.5"/><path d="M38 44 q-8 10 -12 22 M38 56 q-4 8 -2 16 M62 44 q8 10 12 22 M62 56 q4 8 2 16" stroke="#c95a78" stroke-width="2" fill="none" stroke-linecap="round"/>`),
    estomago: svg(`<path d="M38 6 C38 22 32 34 30 50 C28 74 46 90 66 84 C86 78 90 56 78 48 C66 40 58 50 54 38 C50 28 52 18 50 6Z" fill="#f4a261" stroke="#a0522d" stroke-width="2.5"/><path d="M40 56 q8 6 6 14 M50 62 q10 4 10 14 M64 60 q8 4 10 12" stroke="#c97a3a" stroke-width="2" fill="none" stroke-linecap="round"/>${brilho(42, 44, 5)}`),
    intestino: svg(`<path d="M20 84 V32 Q20 18 34 18 H66 Q80 18 80 32 V86" stroke="#9c4a2a" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 84 V32 Q20 18 34 18 H66 Q80 18 80 32 V86" stroke="#d9805a" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 36 Q50 28 66 36 Q50 46 34 48 Q50 54 66 56 Q50 66 34 66 Q46 76 62 74" stroke="#b5653d" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M34 36 Q50 28 66 36 Q50 46 34 48 Q50 54 66 56 Q50 66 34 66 Q46 76 62 74" stroke="#f6bfa0" stroke-width="6" fill="none" stroke-linecap="round"/>`),
    figado: svg(`<path d="M8 38 C20 22 62 18 92 30 C94 42 82 54 66 62 C50 72 28 74 16 64 C8 56 6 46 8 38Z" fill="#8b2e2e" stroke="#4a1010" stroke-width="2.5"/><path d="M58 24 Q52 44 60 64" stroke="#5a1a1a" stroke-width="2" fill="none"/><ellipse cx="44" cy="68" rx="7" ry="5" fill="#6aa84f" stroke="#2f5a1f" stroke-width="1.5"/>${brilho(30, 38, 7)}`),
    bexiga: svg(`<path d="M30 20 Q24 10 18 6 M70 20 Q76 10 82 6" stroke="#d4b53a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M50 18 C72 18 84 36 82 56 C80 72 66 80 54 82 V94 H46 V82 C34 80 20 72 18 56 C16 36 28 18 50 18Z" fill="#f6d55c" stroke="#a88a16" stroke-width="2.5" stroke-linejoin="round"/>${brilho(38, 40, 8)}`),
    ossos: svg(`<g transform="rotate(-35 50 50)" stroke="#8a7a5a" stroke-width="2.5"><circle cx="22" cy="42" r="10" fill="#f7f1e3"/><circle cx="22" cy="58" r="10" fill="#f7f1e3"/><circle cx="78" cy="42" r="10" fill="#f7f1e3"/><circle cx="78" cy="58" r="10" fill="#f7f1e3"/><rect x="22" y="42" width="56" height="16" fill="#f7f1e3" stroke="none"/><path d="M24 42 H76 M24 58 H76"/></g>`),
    musculos: svg(`<path d="M8 92 L30 70 Q34 52 46 40 Q54 30 62 22 Q70 16 76 22 Q80 30 72 36 Q64 40 62 50 Q74 44 84 52 Q94 62 86 76 Q76 90 50 90 Z" fill="${PELE}" stroke="${PELE_L}" stroke-width="2.5" stroke-linejoin="round"/><path d="M44 72 Q50 50 66 52 Q84 54 82 70 Q74 84 52 82 Q44 80 44 72Z" fill="#e05a5a" stroke="#9a2a2a" stroke-width="2"/><path d="M52 64 q10 -6 22 -2 M50 72 q12 -4 26 0" stroke="#f29a9a" stroke-width="2" fill="none" stroke-linecap="round"/>`),
    olhos: svg(`<path d="M6 50 Q50 12 94 50 Q50 88 6 50Z" fill="#fff" stroke="#3a3a3a" stroke-width="3"/><circle cx="50" cy="50" r="19" fill="#3a86c8"/><circle cx="50" cy="50" r="8.5" fill="#111"/><circle cx="44" cy="44" r="4" fill="#fff"/><path d="M22 30 l-5 -8 M36 22 l-3 -9 M50 19 V9 M64 22 l3 -9 M78 30 l5 -8" stroke="#3a3a3a" stroke-width="3" stroke-linecap="round"/>`),
    orelhas: svg(`<path d="M58 8 C32 6 22 30 26 50 C28 62 38 64 38 74 C38 88 52 96 62 88 C70 82 66 72 72 64 C84 50 86 12 58 8Z" fill="${PELE}" stroke="${PELE_L}" stroke-width="3"/><path d="M56 24 C44 22 38 34 42 44 C46 52 54 48 52 58 C50 66 58 70 60 64" stroke="${PELE_L}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M80 30 q6 8 0 16 M86 22 q10 14 0 32" stroke="#7b2cbf" stroke-width="3" fill="none" stroke-linecap="round"/>`),
    nariz: svg(`<path d="M50 10 Q46 46 32 62 Q26 76 40 78 Q46 84 50 80 Q54 84 60 78 Q74 76 68 62 Q54 46 50 10Z" fill="${PELE}" stroke="${PELE_L}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="42" cy="72" rx="5" ry="3" fill="#8a5a3a"/><ellipse cx="58" cy="72" rx="5" ry="3" fill="#8a5a3a"/><path d="M12 30 q6 -6 0 -12 q-6 -6 0 -12 M88 30 q6 -6 0 -12 q-6 -6 0 -12" stroke="#2a9d55" stroke-width="3" fill="none" stroke-linecap="round" transform="translate(0 20)"/>`),
    lingua: svg(`<path d="M12 36 Q50 26 88 36 Q82 82 50 86 Q18 82 12 36Z" fill="#7a1f2b" stroke="#4a1018" stroke-width="3" stroke-linejoin="round"/><path d="M20 38 Q50 32 80 38 L78 46 Q50 40 22 46Z" fill="#fff"/><path d="M28 58 Q50 50 72 58 Q76 84 50 92 Q24 84 28 58Z" fill="#f28da5" stroke="#b9537c" stroke-width="2.5"/><path d="M50 58 V80" stroke="#d96a8a" stroke-width="2.5" stroke-linecap="round"/>`),
    pele: svg(`<path d="M30 92 Q22 72 22 58 L22 40 Q22 34 28 34 Q34 34 34 40 V54 L36 18 Q36 12 42 12 Q48 12 48 18 V50 L50 12 Q50 6 56 6 Q62 6 62 12 V50 L64 18 Q64 12 70 12 Q76 12 76 18 V60 L80 48 Q84 40 90 44 Q94 48 90 56 L80 80 Q74 92 64 94Z" fill="${PELE}" stroke="${PELE_L}" stroke-width="3" stroke-linejoin="round"/><path d="M8 20 l6 4 M6 34 h8 M10 8 l6 6" stroke="#ffb703" stroke-width="3" stroke-linecap="round"/>`),
  };
  const PARTES = [
    ["cerebro", "Cérebro", "o", "O cérebro fica dentro da cabeça, protegido pelo crânio. Ele comanda o corpo todo: pensar, lembrar, sentir e se mexer.", "O cérebro fica dentro da cabeça."],
    ["coracao", "Coração", "o", "O coração é um músculo mais ou menos do tamanho da sua mão fechada. Ele bate o tempo todo e bombeia o sangue para o corpo inteiro.", "O coração fica no peito, entre os pulmões."],
    ["pulmoes", "Pulmões", "os", "Os dois pulmões enchem de ar quando você respira. Eles pegam o oxigênio do ar e jogam fora o gás carbônico.", "Os pulmões ficam no peito."],
    ["estomago", "Estômago", "o", "O estômago é como uma bolsa: recebe a comida e mistura com um suco forte que ajuda a digerir.", "O estômago fica na parte de cima da barriga."],
    ["figado", "Fígado", "o", "O fígado é o maior órgão de dentro do corpo. Ele ajuda a digerir a comida e a limpar o sangue.", "O fígado fica do lado direito da barriga, embaixo dos pulmões."],
    ["intestino", "Intestino", "o", "O intestino é um tubo bem comprido e enrolado. Ele tira da comida o que o corpo precisa, e o que sobra vira cocô.", "O intestino fica na barriga, todo enrolado."],
    ["bexiga", "Bexiga", "a", "A bexiga é uma bolsinha que guarda o xixi até você ir ao banheiro.", "A bexiga fica bem embaixo da barriga."],
    ["ossos", "Ossos", "os", "Os ossos formam o esqueleto: um adulto tem 206 ossos. Eles seguram o corpo em pé e protegem os órgãos, como as costelas protegem o coração e os pulmões."],
    ["musculos", "Músculos", "os", "Os músculos puxam os ossos para o corpo se mexer. Você usa músculos para correr, pular e até para sorrir!"],
    ["olhos", "Olhos", "os", "Com os olhos você enxerga: é o sentido da visão."],
    ["orelhas", "Orelhas", "as", "Com as orelhas você escuta: é o sentido da audição. Lá dentro também fica uma parte que ajuda no equilíbrio."],
    ["nariz", "Nariz", "o", "Com o nariz você sente os cheiros: é o sentido do olfato. Ele também ajuda a sentir o gosto da comida!"],
    ["lingua", "Língua", "a", "Com a língua você sente o gosto: doce, salgado, azedo e amargo. É o sentido do paladar."],
    ["pele", "Pele", "a", "A pele cobre o corpo todo e é o maior órgão do corpo. Com ela você sente o toque, o frio e o calor: é o sentido do tato."],
  ].map(([id, nome, art, texto, lugar]) => ({ id, nome, art, texto, lugar, desenho: ORGAOS[id] }));
  const PARTE = Object.fromEntries(PARTES.map(p => [p.id, p]));
  const SENTIDOS = ["olhos", "orelhas", "nariz", "lingua", "pele"];
  // Onde cada órgão fica no corpo (caixa no desenho de 200 × 420)
  const CAIXA = {
    cerebro: [72, 14, 56, 40], pulmoes: [56, 110, 88, 82], coracao: [95, 144, 32, 34], figado: [56, 186, 52, 32],
    estomago: [104, 182, 38, 42], intestino: [64, 216, 72, 62], bexiga: [88, 270, 24, 20],
  };
  const aninhado = (id, [x, y, w, h]) => ORGAOS[id].replace("<svg ", `<svg x="${x}" y="${y}" width="${w}" height="${h}" `).replace(' xmlns="http://www.w3.org/2000/svg"', "");

  // Corpo "transparente" de frente, com os órgãos dentro. `mostrar`: ids visíveis (null = todos)
  function corpoSVG(mostrar = null) {
    const COR = "#d6ecff", LINHA = "#5b8bc9";
    const membro = (d, w) => `<path d="${d}" stroke="${LINHA}" stroke-width="${w + 5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${COR}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    const ve = id => !mostrar || mostrar.includes(id);
    let s = `<g class="cie-pele" data-parte="pele">`;
    s += membro("M52 120 Q30 126 27 160 L21 242", 22) + membro("M148 120 Q170 126 173 160 L179 242", 22);
    s += membro("M82 280 L80 392", 34) + membro("M118 280 L120 392", 34);
    s += `<ellipse cx="72" cy="404" rx="20" ry="9" fill="${COR}" stroke="${LINHA}" stroke-width="2.5"/><ellipse cx="128" cy="404" rx="20" ry="9" fill="${COR}" stroke="${LINHA}" stroke-width="2.5"/>`;
    s += `<rect x="88" y="86" width="24" height="28" fill="${COR}" stroke="${LINHA}" stroke-width="2.5"/>`;
    s += `<path d="M58 110 Q100 100 142 110 Q156 114 156 130 L150 228 Q146 258 150 292 L50 292 Q54 258 50 228 L44 130 Q44 114 58 110Z" fill="${COR}" stroke="${LINHA}" stroke-width="2.5"/>`;
    s += `<path d="M80 280 L80 292 M118 280 L120 292" stroke="${COR}" stroke-width="30"/>`;
    s += `</g>`;
    s += `<g class="cie-parte" data-parte="pele"><circle cx="20" cy="254" r="13" fill="${COR}" stroke="${LINHA}" stroke-width="2.5"/><circle cx="180" cy="254" r="13" fill="${COR}" stroke="${LINHA}" stroke-width="2.5"/></g>`;
    // Cabeça e sentidos
    s += `<g class="cie-parte" data-parte="orelhas"><ellipse cx="65" cy="58" rx="8" ry="12" fill="#ffd9c0" stroke="${PELE_L}" stroke-width="2"/><ellipse cx="135" cy="58" rx="8" ry="12" fill="#ffd9c0" stroke="${PELE_L}" stroke-width="2"/></g>`;
    s += `<ellipse cx="100" cy="52" rx="34" ry="40" fill="${COR}" stroke="${LINHA}" stroke-width="2.5"/>`;
    s += `<g class="cie-parte" data-parte="olhos"><ellipse cx="87" cy="60" rx="7" ry="5" fill="#fff" stroke="#333" stroke-width="1.5"/><circle cx="87" cy="60" r="3" fill="#3a86c8"/><ellipse cx="113" cy="60" rx="7" ry="5" fill="#fff" stroke="#333" stroke-width="1.5"/><circle cx="113" cy="60" r="3" fill="#3a86c8"/></g>`;
    s += `<g class="cie-parte" data-parte="nariz"><path d="M100 62 Q96 72 94 74 Q100 78 106 74 Q104 72 100 62Z" fill="#ffd9c0" stroke="${PELE_L}" stroke-width="1.5"/></g>`;
    s += `<g class="cie-parte" data-parte="lingua"><path d="M88 80 Q100 92 112 80Z" fill="#7a1f2b" stroke="#4a1018" stroke-width="1.5"/><ellipse cx="100" cy="85" rx="6" ry="3.5" fill="#f28da5"/></g>`;
    // Músculos e ossos (aparecem quando escolhidos)
    s += `<g class="cie-camada" data-parte="musculos"><g fill="#e05a5a" stroke="#9a2a2a" stroke-width="1.5" opacity=".9"><ellipse cx="30" cy="152" rx="9" ry="20"/><ellipse cx="170" cy="152" rx="9" ry="20"/><ellipse cx="80" cy="318" rx="14" ry="30"/><ellipse cx="120" cy="318" rx="14" ry="30"/><ellipse cx="80" cy="372" rx="10" ry="18"/><ellipse cx="120" cy="372" rx="10" ry="18"/><path d="M62 118 Q78 112 96 120 L94 140 Q76 140 62 132Z"/><path d="M138 118 Q122 112 104 120 L106 140 Q124 140 138 132Z"/></g></g>`;
    s += `<g class="cie-camada" data-parte="ossos" stroke="#8a7a5a" fill="#f7f1e3" stroke-width="1.5">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M100 ${124 + i * 15} Q${70 - i} ${120 + i * 15} ${62 + i} ${136 + i * 15}" fill="none" stroke="#f7f1e3" stroke-width="5" stroke-linecap="round"/><path d="M100 ${124 + i * 15} Q${130 + i} ${120 + i * 15} ${138 - i} ${136 + i * 15}" fill="none" stroke="#f7f1e3" stroke-width="5" stroke-linecap="round"/>`).join("")}
      <rect x="96" y="112" width="8" height="160" rx="3"/><path d="M66 266 Q100 248 134 266 Q130 290 100 292 Q70 290 66 266Z"/>
      <path d="M40 124 L28 186 M27 192 L22 240 M160 124 L172 186 M173 192 L178 240 M84 292 L82 340 M116 292 L118 340 M82 348 L80 396 M118 348 L120 396" stroke="#f7f1e3" stroke-width="7" stroke-linecap="round"/>
      <path d="M62 116 L98 112 M138 116 L102 112" stroke="#f7f1e3" stroke-width="5" stroke-linecap="round"/></g>`;
    // Órgãos
    s += `<g class="cie-orgaos">`;
    Object.keys(CAIXA).forEach(id => { s += `<g class="cie-parte cie-orgao" data-parte="${id}"${ve(id) ? "" : ' style="display:none"'}>${aninhado(id, CAIXA[id])}</g>`; });
    s += `</g>`;
    return svg(s, "0 0 200 420");
  }

  // ---------- Ciclo da água ----------
  const fundoIcone = '<rect width="100" height="100" rx="18" fill="#dff3ff"/>';
  const nuvemSVG = (x, y, s, cor, borda) => `<g transform="translate(${x} ${y}) scale(${s})"><g fill="${cor}" stroke="${borda}" stroke-width="2"><circle cx="-16" cy="4" r="12"/><circle cx="0" cy="-6" r="16"/><circle cx="17" cy="3" r="12"/></g><rect x="-16" y="2" width="33" height="13" fill="${cor}"/><path d="M-26 9 Q-28 16 -18 16 H20 Q29 15 28 8" fill="none" stroke="${borda}" stroke-width="2"/></g>`;
  const ETAPAS = [
    { id: "evaporacao", nome: "Evaporação", grupo: 1,
      texto: "Evaporação: o Sol esquenta a água dos rios, dos lagos e do mar. A água vira vapor, que a gente não vê, e sobe para o céu.",
      desenho: svg(`${fundoIcone}<circle cx="24" cy="22" r="12" fill="#ffd23f"/><g stroke="#ffb703" stroke-width="3" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M24 4 V8" transform="rotate(${a} 24 22)"/>`).join("")}</g><path d="M0 74 Q12 68 25 74 T50 74 T75 74 T100 74 V100 H0Z" fill="#2a7de1"/>${[42, 62, 82].map(x => `<path d="M${x} 66 q-6 -8 0 -16 q6 -8 0 -16" stroke="#7fb8e6" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M${x - 5} 38 L${x} 30 L${x + 5} 38" stroke="#7fb8e6" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}`) },
    { id: "condensacao", nome: "Condensação", grupo: 2,
      texto: "Condensação: lá no alto é frio. O vapor esfria e vira gotinhas de água bem pequenininhas.",
      desenho: svg(`${fundoIcone}<g stroke="#7fb8e6" stroke-width="3" stroke-linecap="round"><path d="M80 10 V30 M71 15 L89 25 M71 25 L89 15"/></g>${[[30, 40], [42, 34], [54, 40], [36, 52], [48, 50], [60, 52], [24, 56], [70, 46], [44, 64], [58, 64], [32, 66]].map(([x, y]) => `<path d="M${x} ${y - 6} Q${x + 5} ${y + 1} ${x} ${y + 4} Q${x - 5} ${y + 1} ${x} ${y - 6}Z" fill="#3a8fe0"/>`).join("")}<path d="M20 86 q6 -10 0 -18 M50 92 q6 -10 0 -18 M80 86 q6 -10 0 -18" stroke="#b9d9f2" stroke-width="3" fill="none" stroke-linecap="round"/>`) },
    { id: "nuvem", nome: "Nuvem", grupo: 3,
      texto: "Nuvem: milhões de gotinhas juntas formam as nuvens. O vento leva as nuvens para longe.",
      desenho: svg(`${fundoIcone}${nuvemSVG(50, 50, 1.6, "#fff", "#9fb8cc")}<path d="M10 82 q10 -5 20 0 M62 84 q10 -5 20 0" stroke="#9fb8cc" stroke-width="3" fill="none" stroke-linecap="round"/>`) },
    { id: "chuva", nome: "Chuva", grupo: 4,
      texto: "Precipitação: as gotinhas da nuvem se juntam, ficam pesadas e caem. Pode ser chuva, granizo ou até neve!",
      desenho: svg(`${fundoIcone}${nuvemSVG(50, 34, 1.5, "#8d99ae", "#5c677d")}${[[24, 62], [40, 70], [56, 62], [72, 70], [32, 84], [64, 86], [48, 90]].map(([x, y]) => `<path d="M${x} ${y - 7} Q${x + 5} ${y + 1} ${x} ${y + 4} Q${x - 5} ${y + 1} ${x} ${y - 7}Z" fill="#2a7de1"/>`).join("")}`) },
    { id: "rio", nome: "Rios", grupo: 5,
      texto: "Rios: a água da chuva escorre pelo chão, forma os rios, e os rios levam a água de volta para o mar.",
      desenho: svg(`${fundoIcone}<path d="M0 54 L34 18 L52 36 L66 24 L100 58 V100 H0Z" fill="#6aa84f"/><path d="M34 18 L42 26 L36 28 L28 25Z" fill="#fff"/><path d="M0 86 H100 V100 H0Z" fill="#2a7de1"/><path d="M40 30 C36 46 60 50 48 64 C38 76 60 80 56 90" stroke="#2a7de1" stroke-width="7" fill="none" stroke-linecap="round"/>`) },
    { id: "infiltracao", nome: "Infiltração", grupo: 5,
      texto: "Infiltração: ao mesmo tempo, parte da água entra no chão e fica guardada debaixo da terra. Ela mata a sede das plantas e enche as nascentes e os poços. E o ciclo recomeça!",
      desenho: svg(`${fundoIcone}<rect y="30" width="100" height="70" fill="#9c6b3f"/><rect y="26" width="100" height="8" fill="#6aa84f"/><rect y="78" width="100" height="14" fill="#5aa9e6"/><rect y="92" width="100" height="8" fill="#6b5a4a"/>${[[24, 44], [50, 54], [76, 42], [36, 66], [64, 68]].map(([x, y]) => `<path d="M${x} ${y - 7} Q${x + 5} ${y + 1} ${x} ${y + 4} Q${x - 5} ${y + 1} ${x} ${y - 7}Z" fill="#2a7de1"/>`).join("")}<path d="M24 6 Q29 13 24 16 Q19 13 24 6Z M50 10 Q55 17 50 20 Q45 17 50 10Z M76 4 Q81 11 76 14 Q71 11 76 4Z" fill="#2a7de1"/>`) },
  ];
  const ETAPA = Object.fromEntries(ETAPAS.map(e => [e.id, e]));

  // ---------- Telas ----------
  function telaCheia(area, classe) {
    area.innerHTML = "";
    const t = document.createElement("div");
    t.className = `cie-tela ${classe}`;
    area.appendChild(t);
    return t;
  }
  function botao(classe, html, rotulo, aoClicar) {
    const b = document.createElement("button");
    b.className = classe;
    b.innerHTML = html;
    if (rotulo) b.setAttribute("aria-label", rotulo);
    b.addEventListener("click", aoClicar);
    return b;
  }
  const deitado = el => el.clientWidth > el.clientHeight;
  function observarFormato(tela, extra) {
    const sessao = Motor.sessaoAtual();
    const obs = new ResizeObserver(() => {
      if (sessao !== Motor.sessaoAtual() || !document.contains(tela)) { obs.disconnect(); return; }
      tela.classList.toggle("deitado", deitado(tela));
      if (extra) extra();
    });
    obs.observe(tela);
    tela.classList.toggle("deitado", deitado(tela));
  }

  // ---------- ☀️ Sistema Solar ----------
  function sistemaSolar(area, faixa) {
    const tela = telaCheia(area, "cie-solar");
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const palco = document.createElement("div");
    palco.className = "cie-palco";
    const canvas = document.createElement("canvas");
    palco.appendChild(canvas);
    const painel = document.createElement("div");
    painel.className = "cie-painel";
    const info = document.createElement("div");
    info.className = "cie-info";
    const botoes = document.createElement("div");
    botoes.className = "cie-astros";
    const acoes = document.createElement("div");
    acoes.className = "cie-acoes";
    painel.append(info, botoes, acoes);
    tela.append(palco, painel);
    const ctx = canvas.getContext("2d");
    let W = 300, H = 300, pausado = false, sel = null, ang = PLANETAS.map(() => Math.random() * Math.PI * 2), angLua = 0, ultimoT = performance.now();
    const estrelas = Array.from({ length: 140 }, () => [Math.random(), Math.random(), Math.random() * 1.3 + 0.3, Math.random() * 6]);
    const cinturao = Array.from({ length: 90 }, () => [Math.random() * Math.PI * 2, 0.2 + 3.5 * 0.113 + (Math.random() - 0.5) * 0.05]);
    const pausa = botao("chip", "⏸️ Parar", "Parar as órbitas", () => { pausado = !pausado; pausa.textContent = pausado ? "▶️ Girar" : "⏸️ Parar"; });
    acoes.append(pausa, botao("chip", "🔊 Ouvir", "Ouvir de novo", () => sel && Motor.falar(falaAstro(sel))), Motor.botaoSom());
    const bAstro = {};
    ASTROS.forEach(a => {
      const b = botao("cie-astro", `${a.desenho}<span></span>`, a.nome, () => escolher(a));
      b.querySelector("span").textContent = a.nome;
      bAstro[a.id] = b;
      botoes.appendChild(b);
    });
    function medir() {
      const lw = palco.clientWidth, lh = palco.clientHeight;
      if (!lw || !lh) return;
      const dpr = window.devicePixelRatio || 1;
      Object.assign(canvas, { width: Math.round(lw * dpr), height: Math.round(lh * dpr) });
      Object.assign(canvas.style, { width: lw + "px", height: lh + "px" });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = lw; H = lh;
    }
    observarFormato(tela, medir);
    const PX = [3.2, 4.6, 5, 4, 10.5, 9, 6.6, 6.4]; // tamanhos na tela (não estão em escala)
    const VEL = [0.24, 0.62, 1, 1.88, 11.9, 29.5, 84, 165].map(p => 0.55 / Math.sqrt(p));
    const k = () => Math.max(0.8, Math.min(1.8, Math.min(W, H) / 300));
    function posicao(i) {
      const f = 0.2 + i * 0.113, Rx = W / 2 - 16 * k(), Ry = H / 2 - 16 * k();
      return [W / 2 + Math.cos(ang[i]) * Rx * f, H / 2 + Math.sin(ang[i]) * Ry * f];
    }
    function posLua() { const [x, y] = posicao(2); return [x + Math.cos(angLua) * 11 * k(), y + Math.sin(angLua) * 11 * k()]; }
    function quadro(t) {
      if (!vivo()) return;
      const dt = Math.min(0.05, (t - ultimoT) / 1000);
      ultimoT = t;
      if (!pausado) { ang = ang.map((a, i) => a + VEL[i] * dt); angLua += 2.2 * dt; }
      desenhar(t);
      requestAnimationFrame(quadro);
    }
    function desenhar(t) {
      const K = k();
      ctx.fillStyle = "#0b1033";
      ctx.fillRect(0, 0, W, H);
      estrelas.forEach(([x, y, r, f]) => {
        ctx.globalAlpha = 0.5 + Math.sin(t / 700 + f) * 0.35;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x * W, y * H, r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      // Órbitas
      const Rx = W / 2 - 16 * K, Ry = H / 2 - 16 * K;
      PLANETAS.forEach((p, i) => {
        const f = 0.2 + i * 0.113;
        ctx.strokeStyle = sel === p ? "rgba(255,214,10,.85)" : "rgba(255,255,255,.18)";
        ctx.lineWidth = sel === p ? 2.5 : 1.2;
        ctx.beginPath(); ctx.ellipse(W / 2, H / 2, Rx * f, Ry * f, 0, 0, Math.PI * 2); ctx.stroke();
      });
      ctx.fillStyle = "rgba(190,170,150,.6)";
      cinturao.forEach(([a, f]) => { ctx.beginPath(); ctx.arc(W / 2 + Math.cos(a + t / 40000) * Rx * f, H / 2 + Math.sin(a + t / 40000) * Ry * f, 1.1, 0, Math.PI * 2); ctx.fill(); });
      // Sol
      const rs = Math.min(Rx, Ry) * 0.12;
      const g = ctx.createRadialGradient(W / 2, H / 2, rs * 0.2, W / 2, H / 2, rs * 1.9);
      g.addColorStop(0, "#fff6b0"); g.addColorStop(0.45, "#ffc300"); g.addColorStop(0.55, "rgba(255,150,0,.55)"); g.addColorStop(1, "rgba(255,120,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, rs * 1.9, 0, Math.PI * 2); ctx.fill();
      if (sel === ASTRO.sol) anel(W / 2, H / 2, rs * 1.25, t);
      // Planetas
      PLANETAS.forEach((p, i) => {
        const [x, y] = posicao(i), r = PX[i] * K;
        if (p.id === "saturno") { ctx.strokeStyle = "#d9bb7a"; ctx.lineWidth = 2.2 * K; ctx.beginPath(); ctx.ellipse(x, y, r * 2, r * 0.6, -0.3, 0, Math.PI * 2); ctx.stroke(); }
        const gp = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
        gp.addColorStop(0, clarear(p.cor)); gp.addColorStop(1, p.cor);
        ctx.fillStyle = gp;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        if (p.id === "jupiter") { ctx.strokeStyle = "rgba(150,90,50,.6)"; ctx.lineWidth = 1.5 * K; [-0.4, 0.1, 0.5].forEach(d => { const hw = Math.sqrt(1 - d * d) * r; ctx.beginPath(); ctx.moveTo(x - hw, y + d * r); ctx.lineTo(x + hw, y + d * r); ctx.stroke(); }); }
        if (p.id === "terra") { const [lx, ly] = posLua(); ctx.fillStyle = "#d9d9d9"; ctx.beginPath(); ctx.arc(lx, ly, 1.8 * K, 0, Math.PI * 2); ctx.fill(); if (sel === ASTRO.lua) anel(lx, ly, 6 * K, t); }
        if (sel === p) {
          anel(x, y, r + 6 * K, t);
          ctx.font = `bold ${Math.round(14 * Math.min(K, 1.3))}px Fredoka, system-ui, sans-serif`;
          ctx.textAlign = "center"; ctx.fillStyle = "#ffd60a";
          ctx.fillText(p.nome, x, y - r - 10 * K);
        }
      });
    }
    function anel(x, y, r, t) {
      ctx.strokeStyle = `rgba(255,214,10,${0.6 + Math.sin(t / 200) * 0.4})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    }
    function clarear(hex) {
      const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.min(255, v + 70));
      return `rgb(${c.join(",")})`;
    }
    const ordinal = n => `${n}º planeta a partir do Sol`;
    const falaAstro = a => `${a.nome}! ${a.ordem ? ordinal(a.ordem) + ". " : ""}${a.curio} ${faixa.id === "5-6" ? "" : a.tam}`;
    function escolher(a) {
      sel = a;
      Object.entries(bAstro).forEach(([id, b]) => b.classList.toggle("ativo", id === a.id));
      info.innerHTML = `<div class="cie-info-topo"><div class="cie-info-fig">${a.desenho}</div><div><div class="cie-info-nome"></div><div class="cie-info-ordem"></div></div></div><div class="cie-info-texto"></div><div class="cie-comparar"><div class="cie-comparar-fig">${comparar(a)}</div><div class="cie-comparar-txt"></div></div>`;
      info.querySelector(".cie-info-nome").textContent = a.nome;
      info.querySelector(".cie-info-ordem").textContent = a.ordem ? ordinal(a.ordem) : a.id === "sol" ? "Uma estrela, no centro" : "O satélite da Terra";
      info.querySelector(".cie-info-texto").textContent = a.curio;
      info.querySelector(".cie-comparar-txt").textContent = a.tam;
      info.scrollTop = 0;
      Motor.animar(info.querySelector(".cie-info-fig"), "pula");
      Motor.ploc();
      Motor.falar(falaAstro(a));
    }
    // Tocar no desenho também escolhe (pointerdown: o canvas não entra na navegação do controle)
    canvas.addEventListener("pointerdown", e => {
      const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, K = k();
      let melhor = null, dist = 26 * K;
      PLANETAS.forEach((p, i) => { const [px, py] = posicao(i), d = Math.hypot(px - x, py - y) - PX[i] * K; if (d < dist) { dist = d; melhor = p; } });
      const [lx, ly] = posLua();
      if (Math.hypot(lx - x, ly - y) < 7 * K && dist > 2) melhor = ASTRO.lua;
      if (!melhor && Math.hypot(W / 2 - x, H / 2 - y) < Math.min(W, H) * 0.09 + 10) melhor = ASTRO.sol;
      if (melhor) escolher(melhor);
    });
    medir();
    info.innerHTML = `<div class="cie-info-dica">👆 Toque num planeta para conhecer!</div>`;
    Motor.falar("Este é o Sistema Solar! Os planetas giram em volta do Sol. Toque num planeta para conhecer.");
    requestAnimationFrame(quadro);
  }

  // ---------- Quiz (planetas) ----------
  const QUIZ_PLANETAS = [
    [1, "Qual é o planeta vermelho?", "marte", ["terra", "jupiter", "netuno"]],
    [1, "Qual é o maior planeta do Sistema Solar?", "jupiter", ["marte", "mercurio", "terra"]],
    [1, "Qual planeta tem os anéis mais famosos?", "saturno", ["terra", "marte", "venus"]],
    [1, "Em qual planeta nós moramos?", "terra", ["marte", "jupiter", "saturno"]],
    [1, "Qual é o planeta mais perto do Sol?", "mercurio", ["terra", "netuno", "jupiter"]],
    [1, "Quem gira em volta da Terra?", "lua", ["sol", "marte", "saturno"]],
    [1, "O Sol é uma estrela ou um planeta?", "Uma estrela", ["Um planeta"]],
    [2, "Qual é o planeta mais longe do Sol?", "netuno", ["mercurio", "terra", "marte"]],
    [2, "Qual é o planeta mais quente?", "venus", ["mercurio", "marte", "netuno"]],
    [2, "Qual planeta gira deitado?", "urano", ["terra", "jupiter", "marte"]],
    [2, "Quantos planetas tem o Sistema Solar?", "8", ["5", "9", "12"]],
    [2, "Qual é o terceiro planeta a partir do Sol?", "terra", ["venus", "marte", "jupiter"]],
    [2, "Qual planeta é chamado de estrela-d'alva?", "venus", ["marte", "saturno", "netuno"]],
    [2, "Por que a Lua brilha?", "Reflete a luz do Sol", ["Tem fogo dentro", "É uma estrela"]],
    [3, "Em que ano astronautas pisaram na Lua pela primeira vez?", "1969", ["1500", "1900", "2010"]],
    [3, "Qual planeta tem o maior vulcão do Sistema Solar?", "marte", ["terra", "venus", "jupiter"]],
    [3, "Qual planeta tem uma tempestade gigante chamada Grande Mancha Vermelha?", "jupiter", ["marte", "saturno", "terra"]],
    [3, "Quanto tempo dura um ano em Mercúrio?", "88 dias", ["365 dias", "10 anos"]],
    [3, "Qual é a ordem certa, a partir do Sol?", "Mercúrio, Vênus, Terra", ["Terra, Vênus, Mercúrio", "Vênus, Mercúrio, Terra"]],
    [3, "Um ano em Netuno dura quanto tempo da Terra?", "165 anos", ["1 ano", "12 meses"]],
  ];
  function desenharOpcao(item, b) {
    b.classList.add("cie-op");
    if (item.desenho) { b.innerHTML = `${item.desenho}<span class="cie-op-nome"></span>`; b.querySelector(".cie-op-nome").textContent = item.nome; }
    else { b.textContent = item.nome; b.classList.add("palavra"); }
  }
  function quizPlanetas(area, faixa) {
    const caixa = telaCheia(area, "cie-quiz cie-espaco");
    const nivel = { "5-6": 1, "6-8": 2, "8-10": 3 }[faixa.id] || 3;
    const nOp = faixa.id === "5-6" ? 3 : 4;
    const banco = QUIZ_PLANETAS.filter(q => q[0] <= nivel);
    let fila = [];
    Motor.modoQuiz({
      area: caixa, rodada: faixa.id === "8-10" ? 10 : 8, desenhar: desenharOpcao, classeEnunciado: "cie-pergunta",
      gerar() {
        if (!fila.length) fila = Motor.embaralhar(banco);
        const [, texto, certo, outros] = fila.shift();
        const op = x => ASTRO[x] || { nome: x };
        const certa = op(certo);
        return { pergunta: texto, certa, opcoes: [certa, ...outros.slice(0, nOp - 1).map(op)], mostrar: el => { el.textContent = texto; } };
      },
      aoAcertar: item => (item.curio ? Motor.falar(item.curio) : null),
    });
  }

  // ---------- 🫀 Corpo humano ----------
  function corpoHumano(area, faixa) {
    const tela = telaCheia(area, "cie-corpo");
    const fig = document.createElement("div");
    fig.className = "cie-figura";
    fig.innerHTML = corpoSVG();
    const painel = document.createElement("div");
    painel.className = "cie-painel";
    const info = document.createElement("div");
    info.className = "cie-info";
    info.innerHTML = `<div class="cie-info-dica">👆 Toque numa parte do corpo para conhecer!</div>`;
    const lista = document.createElement("div");
    lista.className = "cie-partes";
    painel.append(info, lista);
    tela.append(fig, painel);
    observarFormato(tela);
    const bs = {};
    const grupo = (titulo, ids) => {
      const t = document.createElement("div");
      t.className = "cie-grupo";
      t.textContent = titulo;
      lista.appendChild(t);
      ids.forEach(id => {
        const p = PARTE[id];
        const b = botao("cie-parte-b", `${p.desenho}<span></span>`, p.nome, () => escolher(p));
        b.querySelector("span").textContent = p.nome;
        bs[id] = b;
        lista.appendChild(b);
      });
    };
    grupo("Por dentro", ["cerebro", "coracao", "pulmoes", "estomago", "figado", "intestino", "bexiga", "ossos", "musculos"]);
    grupo("Os cinco sentidos", SENTIDOS);
    const svgEl = fig.querySelector("svg");
    function escolher(p) {
      Object.entries(bs).forEach(([id, b]) => b.classList.toggle("ativo", id === p.id));
      svgEl.classList.add("escolhendo");
      svgEl.querySelectorAll("[data-parte]").forEach(el => el.classList.toggle("cie-sel", el.dataset.parte === p.id));
      svgEl.classList.toggle("ver-ossos", p.id === "ossos");
      svgEl.classList.toggle("ver-musculos", p.id === "musculos");
      const sentido = SENTIDOS.includes(p.id);
      info.innerHTML = `<div class="cie-info-topo"><div class="cie-info-fig">${p.desenho}</div><div><div class="cie-info-nome"></div><div class="cie-info-ordem"></div></div></div><div class="cie-info-texto"></div>`;
      info.querySelector(".cie-info-nome").textContent = p.nome;
      info.querySelector(".cie-info-ordem").textContent = sentido ? "Um dos cinco sentidos" : p.id === "ossos" || p.id === "musculos" ? "Para o corpo se mexer" : "Órgão de dentro do corpo";
      info.querySelector(".cie-info-texto").textContent = p.texto;
      Motor.animar(info.querySelector(".cie-info-fig"), "pula");
      Motor.ploc();
      Motor.falar(`${p.nome}! ${p.texto}`);
    }
    svgEl.addEventListener("pointerdown", e => {
      const alvo = e.target.closest("[data-parte]");
      if (alvo && PARTE[alvo.dataset.parte]) escolher(PARTE[alvo.dataset.parte]);
    });
    Motor.falar("Este é o corpo humano! Toque numa parte para saber para que ela serve.");
  }

  // ---------- 🧩 Monte o corpo ----------
  function monteCorpo(area, faixa) {
    const ids = faixa.id === "5-6" ? ["cerebro", "coracao", "pulmoes", "estomago"]
      : faixa.id === "6-8" ? ["cerebro", "coracao", "pulmoes", "estomago", "figado", "intestino"]
        : ["cerebro", "coracao", "pulmoes", "estomago", "figado", "intestino", "bexiga"];
    const tela = telaCheia(area, "cie-corpo cie-monte");
    const sessao = Motor.sessaoAtual();
    const fig = document.createElement("div");
    fig.className = "cie-figura";
    fig.innerHTML = corpoSVG([]);
    const painel = document.createElement("div");
    painel.className = "cie-painel";
    const dica = document.createElement("div");
    dica.className = "cie-info cie-info-dica";
    dica.textContent = "Escolha um órgão e toque no lugar dele no corpo.";
    const pecas = document.createElement("div");
    pecas.className = "cie-pecas";
    painel.append(dica, pecas);
    tela.append(fig, painel);
    observarFormato(tela);
    const svgEl = fig.querySelector("svg");
    let escolhida = null, acertos = 0, dePrimeira = 0;
    const erros = {};
    // Lugares vazios no corpo (os menores ficam por cima)
    const vagas = Motor.embaralhar(ids).sort((a, b) => CAIXA[b][2] * CAIXA[b][3] - CAIXA[a][2] * CAIXA[a][3]).map((id, i) => {
      const [x, y, w, h] = CAIXA[id];
      const v = botao("cie-vaga", "", "Lugar vazio", () => tentar(v));
      v.dataset.id = id;
      Object.assign(v.style, { left: (x / 200) * 100 + "%", top: (y / 420) * 100 + "%", width: (w / 200) * 100 + "%", height: (h / 420) * 100 + "%", zIndex: 2 + i });
      fig.appendChild(v);
      return v;
    });
    const vagasLivres = () => vagas.filter(v => document.contains(v)).sort((a, b) => +b.style.zIndex - +a.style.zIndex);
    const bs = Motor.embaralhar(ids).map(id => {
      const p = PARTE[id];
      const b = botao("cie-peca", `${p.desenho}<span></span>`, p.nome, () => {
        pecas.querySelectorAll(".selecionada").forEach(x => x.classList.remove("selecionada"));
        escolhida = { p, b };
        b.classList.add("selecionada");
        Motor.animar(b, "pula");
        Motor.falar(`Onde fica ${p.art} ${p.nome}?`);
        fig.classList.add("escolhendo");
      });
      b.querySelector("span").textContent = p.nome;
      Motor.arrastavel(b, {
        alvos: vagasLivres,
        aoSoltar: v => { escolhida = { p, b }; return tentar(v); },
      });
      pecas.appendChild(b);
      return b;
    });
    function tentar(v) {
      if (!escolhida) { Motor.animar(v, "balanca"); Motor.falar("Primeiro escolha um órgão!"); return false; }
      const { p, b } = escolhida;
      if (v.dataset.id !== p.id) {
        erros[p.id] = (erros[p.id] || 0) + 1;
        Motor.animar(v, "balanca"); Motor.animar(b, "balanca");
        Motor.falar(erros[p.id] >= 2 ? `Quase! ${p.lugar}` : `Aí não ${p.art.endsWith("s") ? "ficam" : "fica"} ${p.art} ${p.nome}. Tente outro lugar!`);
        if (erros[p.id] >= 2) vagas.find(x => x.dataset.id === p.id)?.classList.add("dica");
        return false;
      }
      escolhida = null;
      fig.classList.remove("escolhendo");
      v.remove();
      b.disabled = true;
      b.classList.remove("selecionada");
      b.classList.add("posta");
      const g = svgEl.querySelector(`.cie-orgao[data-parte="${p.id}"]`);
      g.style.display = "";
      Motor.animar(g, "cie-entra");
      acertos++;
      if (!erros[p.id]) dePrimeira++;
      if (acertos < ids.length) {
        Motor.ploc();
        Motor.falar(`${Motor.elogio()} ${p.lugar}`);
        dica.textContent = `✅ ${p.nome}! ${p.lugar}`;
      } else {
        Motor.tim();
        Motor.comemorar(fig);
        dica.textContent = "🎉 O corpo está completo!";
        Motor.falar(`${p.lugar} Pronto, o corpo está completo!`).then(() => {
          if (sessao === Motor.sessaoAtual()) Motor.depois(() => Motor.telaFim(tela, dePrimeira, ids.length, () => monteCorpo(area, faixa)), 600);
        });
      }
      return true;
    }
    Motor.falar("Monte o corpo! Escolha um órgão e toque no lugar dele. Você também pode arrastar.");
  }

  // ---------- 💧 Ciclo da água ----------
  function cicloAgua(area, faixa) {
    const tela = telaCheia(area, "cie-ciclo");
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const palco = document.createElement("div");
    palco.className = "cie-palco";
    const canvas = document.createElement("canvas");
    palco.appendChild(canvas);
    const painel = document.createElement("div");
    painel.className = "cie-painel";
    const etapasEl = document.createElement("div");
    etapasEl.className = "cie-etapas";
    const info = document.createElement("div");
    info.className = "cie-info";
    const acoes = document.createElement("div");
    acoes.className = "cie-acoes";
    painel.append(etapasEl, info, acoes);
    tela.append(palco, painel);
    const ctx = canvas.getContext("2d");
    let W = 300, H = 200, atual = 0, t0 = performance.now(), auto = false, autoId = 0;
    const bs = ETAPAS.map((e, i) => {
      const b = botao("cie-etapa-b", `<b>${i + 1}</b>${e.desenho}<span></span>`, e.nome, () => { pararAuto(); ir(i); });
      b.querySelector("span").textContent = e.nome;
      etapasEl.appendChild(b);
      return b;
    });
    const bVer = botao("chip executar", "▶️ Ver tudo", "Ver o ciclo inteiro", () => (auto ? pararAuto() : verTudo()));
    acoes.append(botao("chip", "⬅️", "Etapa anterior", () => { pararAuto(); ir((atual + ETAPAS.length - 1) % ETAPAS.length); }), bVer, botao("chip", "➡️", "Próxima etapa", () => { pararAuto(); ir((atual + 1) % ETAPAS.length); }), Motor.botaoSom());
    function medir() {
      const lw = palco.clientWidth, lh = palco.clientHeight;
      if (!lw || !lh) return;
      const dpr = window.devicePixelRatio || 1;
      Object.assign(canvas, { width: Math.round(lw * dpr), height: Math.round(lh * dpr) });
      Object.assign(canvas.style, { width: lw + "px", height: lh + "px" });
      W = lw; H = lh;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    observarFormato(tela, medir);
    function ir(i, falar = true) {
      atual = i;
      t0 = performance.now();
      bs.forEach((b, j) => b.classList.toggle("ativo", j === i));
      const e = ETAPAS[i];
      info.innerHTML = `<div class="cie-info-nome"></div><div class="cie-info-texto"></div>`;
      info.querySelector(".cie-info-nome").textContent = `${i + 1}. ${e.id === "chuva" ? "Precipitação (chuva)" : e.nome}`;
      info.querySelector(".cie-info-texto").textContent = e.texto;
      bs[i].scrollIntoView({ block: "nearest", inline: "nearest" });
      return falar ? Motor.falar(e.texto) : Promise.resolve();
    }
    function pararAuto() { auto = false; autoId++; bVer.textContent = "▶️ Ver tudo"; }
    async function verTudo() {
      auto = true;
      const meu = ++autoId;
      bVer.textContent = "⏸️ Parar";
      for (let i = 0; i < ETAPAS.length; i++) {
        if (meu !== autoId || !vivo()) return;
        await ir(i);
        await new Promise(r => setTimeout(r, 1200));
      }
      if (meu === autoId) pararAuto();
    }

    // Cena em "unidades" (400 × 260), ajustada ao palco
    const gota = (x, y, s = 1) => { ctx.beginPath(); ctx.moveTo(x, y - 6 * s); ctx.quadraticCurveTo(x + 5 * s, y + 1 * s, x, y + 4 * s); ctx.quadraticCurveTo(x - 5 * s, y + 1 * s, x, y - 6 * s); ctx.fill(); };
    function nuvem(x, y, s, cor) {
      ctx.fillStyle = cor;
      [[-16, 4, 12], [0, -6, 16], [17, 3, 12], [-4, 8, 12], [8, 8, 12]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); ctx.fill(); });
    }
    const RIO = [[300, 108], [282, 140], [250, 150], [232, 172], [200, 192], [150, 204]];
    function caminhoRio() { ctx.beginPath(); ctx.moveTo(...RIO[0]); ctx.bezierCurveTo(...RIO[1], ...RIO[2], ...RIO[3]); ctx.bezierCurveTo(...RIO[4], ...RIO[4], ...RIO[5]); }
    function cena(t) {
      const e = ETAPAS[atual].id, s = (t - t0) / 1000;
      const esc = Math.min(W / 400, H / 260), ox = (W - 400 * esc) / 2, oy = (H - 260 * esc) / 2;
      // Fundo (céu e chão se estendem para além da cena)
      const ceu = ctx.createLinearGradient(0, 0, 0, H);
      ceu.addColorStop(0, e === "chuva" ? "#8fb3cf" : "#6fbef7"); ceu.addColorStop(0.75, "#d4f0ff");
      ctx.fillStyle = ceu; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#7a5230"; ctx.fillRect(0, oy + 200 * esc, W, H);
      ctx.save();
      ctx.translate(ox, oy); ctx.scale(esc, esc);
      // Sol
      const brilhoSol = e === "evaporacao" ? 1 + Math.sin(s * 4) * 0.08 : 1;
      ctx.save(); ctx.translate(60, 46); ctx.rotate(s * 0.3);
      ctx.strokeStyle = "#ffb703"; ctx.lineWidth = 4; ctx.lineCap = "round";
      for (let i = 0; i < 12; i++) { ctx.rotate(Math.PI / 6); ctx.beginPath(); ctx.moveTo(0, 30 * brilhoSol); ctx.lineTo(0, 38 * brilhoSol); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = "#ffd23f"; ctx.beginPath(); ctx.arc(60, 46, 24 * brilhoSol, 0, Math.PI * 2); ctx.fill();
      // Montanha, chão e camadas
      ctx.fillStyle = "#5c9e3a";
      ctx.beginPath(); ctx.moveTo(140, 202); ctx.lineTo(250, 112); ctx.lineTo(300, 70); ctx.lineTo(345, 104); ctx.lineTo(372, 92); ctx.lineTo(420, 120); ctx.lineTo(420, 202); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(286, 82); ctx.lineTo(300, 70); ctx.lineTo(316, 82); ctx.lineTo(306, 86); ctx.lineTo(298, 82); ctx.lineTo(292, 86); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#7a5230"; ctx.fillRect(140, 200, 290, 30);
      ctx.fillStyle = "#9c6b3f"; ctx.fillRect(140, 222, 290, 16);
      ctx.fillStyle = e === "infiltracao" ? "#4aa3ef" : "#6fb0de"; ctx.fillRect(140, 238, 290, 14);
      ctx.fillStyle = "#6b5a4a"; ctx.fillRect(140, 252, 290, 20);
      ctx.fillStyle = "#4f9a32"; ctx.fillRect(140, 196, 290, 6);
      // Mar
      ctx.fillStyle = "#2a7de1";
      ctx.beginPath(); ctx.moveTo(-30, 196); for (let x = -30; x <= 160; x += 10) ctx.lineTo(x, 196 + Math.sin(x / 12 + s * 2) * 2); ctx.lineTo(160, 206); ctx.lineTo(150, 272); ctx.lineTo(-30, 272); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#e9d29b"; ctx.beginPath(); ctx.moveTo(136, 204); ctx.lineTo(160, 198); ctx.lineTo(160, 272); ctx.lineTo(146, 272); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.font = "bold 14px Fredoka, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillText("mar", 70, 236);
      // Árvores
      [[190, 192], [360, 188], [215, 186]].forEach(([x, y]) => { ctx.fillStyle = "#7a5a3a"; ctx.fillRect(x - 2, y - 4, 4, 10); ctx.fillStyle = "#2f8f46"; ctx.beginPath(); ctx.arc(x, y - 10, 9, 0, Math.PI * 2); ctx.fill(); });
      // Rio
      caminhoRio();
      ctx.strokeStyle = "#2a7de1"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.stroke();
      if (e === "rio") {
        caminhoRio(); ctx.setLineDash([6, 12]); ctx.lineDashOffset = -s * 40; ctx.strokeStyle = "#cfe9ff"; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
        seta(170, 214, 140, 214, "#fff");
      }
      // Nuvem conforme a etapa
      if (e === "condensacao") {
        ctx.fillStyle = "#1e6fd0";
        const n = Math.min(28, Math.floor(s * 8));
        for (let i = 0; i < n; i++) { const a = i * 2.4, r = 6 + (i % 7) * 4; gota(180 + Math.cos(a) * r * 1.6, 64 + Math.sin(a) * r * 0.6, 0.8); }
        ctx.strokeStyle = "#7fb8e6"; ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) { const yy = 150 - ((s * 40 + i * 30) % 80); onda(100 + i * 30, yy); }
        ctx.fillStyle = "#1e6fd0"; ctx.font = "bold 13px Fredoka, system-ui, sans-serif"; ctx.fillText("❄ frio lá no alto", 180, 30);
      } else if (e === "nuvem") {
        const p = Math.min(1, s / 3);
        nuvem(180 + p * 110, 60, 1 + p * 0.5, "#fff");
        seta(200 + p * 110, 30, 240 + p * 110, 30, "#ffffff");
      } else if (e === "chuva") {
        nuvem(296, 52, 1.6, "#8d99ae");
        ctx.fillStyle = "#1e6fd0";
        for (let i = 0; i < 26; i++) { const x = 262 + (i * 37) % 76, y = 80 + ((s * 120 + i * 23) % 70); gota(x, y, 0.9); }
      } else if (e === "rio" || e === "infiltracao") {
        nuvem(296, 52, 1.2, "#eef4f8");
      }
      if (e === "evaporacao") {
        ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) { const yy = 186 - ((s * 45 + i * 28) % 120); ctx.globalAlpha = Math.max(0, Math.min(1, (yy - 60) / 60)); onda(20 + i * 26, yy); }
        ctx.globalAlpha = 1;
        seta(140, 120, 140, 80, "#fff");
      }
      if (e === "infiltracao") {
        ctx.fillStyle = "#1e6fd0";
        for (let i = 0; i < 14; i++) { const x = 170 + (i * 53) % 230, y = 204 + ((s * 26 + i * 13) % 36); gota(x, y, 0.8); }
        seta(260, 245, 200, 245, "#fff");
      }
      ctx.restore();
    }
    function onda(x, y) { ctx.beginPath(); ctx.moveTo(x, y + 12); ctx.quadraticCurveTo(x - 6, y + 6, x, y); ctx.quadraticCurveTo(x + 6, y - 6, x, y - 12); ctx.stroke(); }
    function seta(x1, y1, x2, y2, cor) {
      const a = Math.atan2(y2 - y1, x2 - x1);
      ctx.strokeStyle = cor; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(a - 0.5) * 10, y2 - Math.sin(a - 0.5) * 10);
      ctx.moveTo(x2, y2); ctx.lineTo(x2 - Math.cos(a + 0.5) * 10, y2 - Math.sin(a + 0.5) * 10); ctx.stroke();
    }
    function quadro(t) {
      if (!vivo()) { autoId++; return; }
      cena(t);
      requestAnimationFrame(quadro);
    }
    medir();
    ir(0, false);
    Motor.falar("O ciclo da água! A água do planeta não acaba: ela sobe, vira nuvem, cai e volta. Toque em ver tudo ou escolha uma etapa.");
    requestAnimationFrame(quadro);
  }

  // ---------- 🔢 Ordem do ciclo ----------
  function ordemCiclo(area, faixa) {
    const ids = faixa.id === "5-6" ? ["evaporacao", "nuvem", "chuva", "rio"]
      : faixa.id === "6-8" ? ["evaporacao", "condensacao", "nuvem", "chuva", "rio"]
        : ["evaporacao", "condensacao", "nuvem", "chuva", "rio", "infiltracao"];
    const etapas = ids.map(id => ETAPA[id]);
    const seq = etapas.map(e => e.grupo).sort((a, b) => a - b);
    const tela = telaCheia(area, "cie-ordem");
    const sessao = Motor.sessaoAtual();
    const titulo = document.createElement("div");
    titulo.className = "cie-ordem-titulo";
    titulo.textContent = "Toque nas etapas na ordem do ciclo da água!";
    const vagasEl = document.createElement("div");
    vagasEl.className = "cie-vagas";
    const pecasEl = document.createElement("div");
    pecasEl.className = "cie-ordem-pecas";
    tela.append(titulo, vagasEl, pecasEl);
    observarFormato(tela); // .deitado: tira o espaço de cima e deixa a margem do 🏠 à esquerda
    const vagas = ids.map((_, i) => {
      const v = document.createElement("div");
      v.className = "cie-vaga-ordem";
      v.innerHTML = `<b>${i + 1}</b>`;
      vagasEl.appendChild(v);
      return v;
    });
    let prox = 0, errosAgora = 0, dePrimeira = 0;
    Motor.embaralhar(etapas).forEach(e => {
      const b = botao("cie-ordem-peca", `${e.desenho}<span></span>`, e.nome, () => tentar(e, b));
      b.querySelector("span").textContent = e.nome;
      Motor.arrastavel(b, { alvos: () => (vagas[prox] ? [vagas[prox]] : []), aoSoltar: () => tentar(e, b) });
      pecasEl.appendChild(b);
    });
    function tentar(e, b) {
      if (b.disabled || prox >= seq.length) return false;
      if (e.grupo !== seq[prox]) {
        errosAgora++;
        Motor.animar(b, "balanca");
        const certa = etapas.find(x => x.grupo === seq[prox]);
        Motor.falar(errosAgora >= 2 ? `Dica: agora vem ${certa.id === "chuva" ? "a chuva" : (certa.nome.endsWith("o") ? "o " : "a ") + certa.nome}.` : prox === 0 ? "Tudo começa com o Sol esquentando a água. Tente de novo!" : `Ainda não. O que acontece depois ${artigoDe(etapas.find(x => x.grupo === seq[prox - 1] && x.feita))}?`);
        return false;
      }
      if (!errosAgora) dePrimeira++;
      errosAgora = 0;
      e.feita = true;
      b.disabled = true;
      b.classList.add("posta");
      const v = vagas[prox];
      v.innerHTML = `<b>${prox + 1}</b>${e.desenho}<span></span>`;
      v.querySelector("span").textContent = e.nome;
      v.classList.add("cheia");
      Motor.animar(v, "pula");
      prox++;
      if (prox < seq.length) { Motor.ploc(); Motor.falar(`${e.nome}!${e.id === "rio" && ids.includes("infiltracao") ? " E ao mesmo tempo..." : ""}`); }
      else {
        Motor.tim();
        Motor.comemorar(vagasEl);
        Motor.falar(`${e.nome}! Muito bem! E depois o ciclo recomeça: o Sol esquenta a água de novo.`).then(() => {
          if (sessao === Motor.sessaoAtual()) Motor.depois(() => { etapas.forEach(x => { delete x.feita; }); Motor.telaFim(tela, dePrimeira, seq.length, () => ordemCiclo(area, faixa)); }, 500);
        });
      }
      return true;
    }
    function artigoDe(e) {
      if (!e) return "disso";
      return { evaporacao: "da evaporação", condensacao: "da condensação", nuvem: "da nuvem", chuva: "da chuva", rio: "dos rios", infiltracao: "da infiltração" }[e.id];
    }
    etapas.forEach(x => { delete x.feita; });
    Motor.falar("Coloque as etapas do ciclo da água na ordem. O que acontece primeiro?");
  }

  // ---------- Registro ----------
  const fig = (s, w = 64) => s.replace("<svg ", `<svg style="width:${w}px;height:${w}px" `);
  const ICONES = {
    solar: svg(`<circle cx="50" cy="50" r="46" fill="#0b1033"/><ellipse cx="50" cy="50" rx="40" ry="18" fill="none" stroke="#8fa3ff" stroke-width="1.5"/><ellipse cx="50" cy="50" rx="26" ry="12" fill="none" stroke="#8fa3ff" stroke-width="1.5"/><circle cx="50" cy="50" r="11" fill="#ffc300"/><circle cx="76" cy="50" r="5" fill="#2a7de1"/><circle cx="18" cy="56" r="7" fill="#e8c08a"/><circle cx="30" cy="16" r="1.5" fill="#fff"/><circle cx="74" cy="20" r="1.5" fill="#fff"/><circle cx="62" cy="82" r="1.5" fill="#fff"/>`),
    corpo: svg(`<ellipse cx="50" cy="20" rx="13" ry="15" fill="#d6ecff" stroke="#5b8bc9" stroke-width="2"/><path d="M30 38 Q50 32 70 38 L68 74 L32 74Z" fill="#d6ecff" stroke="#5b8bc9" stroke-width="2"/><path d="M32 40 L22 68 M68 40 L78 68 M40 74 V96 M60 74 V96" stroke="#5b8bc9" stroke-width="7" stroke-linecap="round"/>${ORGAOS.coracao.replace("<svg ", '<svg x="46" y="40" width="18" height="18" ').replace(' xmlns="http://www.w3.org/2000/svg"', "")}${ORGAOS.cerebro.replace("<svg ", '<svg x="40" y="7" width="20" height="16" ').replace(' xmlns="http://www.w3.org/2000/svg"', "")}`),
  };
  JOGOS.push({
    id: "ciencias", nome: "Ciências",
    icone: ICONES.solar,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: fig(ICONES.solar), texto: "Sistema Solar: toque num planeta (no desenho ou nos botões) para ouvir o nome, o tamanho e uma curiosidade." },
      { figura: fig(ASTRO.saturno.desenho), texto: "Quiz dos planetas: ouça a pergunta e toque na resposta certa." },
      { figura: fig(ICONES.corpo), texto: "Corpo humano: toque numa parte do corpo para saber para que ela serve." },
      { figura: fig(ORGAOS.coracao), texto: "Monte o corpo: escolha um órgão e toque no lugar dele no corpo. Também dá para arrastar." },
      { figura: [fig(ETAPA.evaporacao.desenho, 44), fig(ETAPA.nuvem.desenho, 44), fig(ETAPA.chuva.desenho, 44)], texto: "Ciclo da água: veja cada etapa. Depois, ponha as etapas na ordem certa." },
    ],
    iniciar(area, faixa) {
      Motor.escolherModo(area, [
        { icone: ICONES.solar, rotulo: "Sistema Solar", iniciar: () => sistemaSolar(area, faixa) },
        { icone: ASTRO.saturno.desenho, rotulo: "Quiz dos planetas", iniciar: () => quizPlanetas(area, faixa) },
        { icone: ICONES.corpo, rotulo: "Corpo humano", iniciar: () => corpoHumano(area, faixa) },
        { icone: ORGAOS.coracao, rotulo: "Monte o corpo", iniciar: () => monteCorpo(area, faixa) },
        { icone: ETAPA.chuva.desenho, rotulo: "Ciclo da água", iniciar: () => cicloAgua(area, faixa) },
        { icone: ETAPA.evaporacao.desenho, rotulo: "Ordem do ciclo", iniciar: () => ordemCiclo(area, faixa) },
      ]);
      const modos = area.querySelector(".modos");
      if (modos) modos.classList.add("cie-modos");
    },
  });
  CATALOGO["ciencias"] = ["descobrir", "Planetas, corpo humano e ciclo da água"];
})();
