// Forca (versão infantil, sem enforcamento): descubra a palavra letra por letra. A cada letra que
// não está na palavra, a florzinha no vaso perde uma pétala: são 6 pétalas = 6 chances.
// Palavras por tema (bichos, frutas, comidas, objetos, lugares do Brasil, profissões, esportes),
// com dica em figura e falada. Níveis pelo tamanho da palavra. Acentos: a palavra aparece com
// acento, mas chutar "A" revela Á/Ã/Â e "C" revela Ç. Teclado na tela e teclado físico.
// Modo 2 jogadores: um escreve a palavra escondido e o outro adivinha; depois trocam.
(() => {
  const ID = "forca";
  const CHANCES = 6;
  const RODADA = 5; // palavras por partida (sozinho)
  const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const NOME_LETRA = { A: "á", B: "bê", C: "cê", D: "dê", E: "é", F: "éfe", G: "gê", H: "agá", I: "i", J: "jota", K: "cá", L: "éle", M: "ême",
    N: "êne", O: "ó", P: "pê", Q: "quê", R: "érre", S: "ésse", T: "tê", U: "u", V: "vê", W: "dáblio", X: "xis", Y: "ípsilon", Z: "zê", "Ç": "cê cedilha" };

  const TEMAS = {
    bichos: { nome: "Bichos", icone: "🐾", eh: "um bicho" },
    frutas: { nome: "Frutas", icone: "🍓", eh: "uma fruta" },
    comidas: { nome: "Comidas", icone: "🍕", eh: "uma comida" },
    objetos: { nome: "Objetos", icone: "🧸", eh: "um objeto" },
    lugares: { nome: "Lugares do Brasil", icone: "🗺️", eh: "um lugar do Brasil" },
    profissoes: { nome: "Profissões", icone: "👷", eh: "uma profissão" },
    esportes: { nome: "Esportes", icone: "⚽", eh: "um esporte" },
  };

  // [palavra, figura, dica]
  const PALAVRAS = {
    bichos: [
      ["GATO", "🐱", "Faz miau e adora brincar com novelo de lã."], ["PATO", "🦆", "Nada na lagoa e faz quá-quá."],
      ["SAPO", "🐸", "Pula na beira da lagoa e come mosquitos."], ["VACA", "🐮", "Faz mu e dá leite."],
      ["LEÃO", "🦁", "É chamado de rei da selva e tem uma juba enorme."], ["URSO", "🐻", "Grandão, peludo e adora mel."],
      ["RATO", "🐭", "Pequenininho, adora queijo e foge do gato."], ["PEIXE", "🐟", "Vive na água e nada com as nadadeiras."],
      ["LOBO", "🐺", "Uiva para a lua."], ["PORCO", "🐷", "Faz óinc e gosta de rolar na lama."],
      ["ZEBRA", "🦓", "Parece um cavalo com listras pretas e brancas."], ["POLVO", "🐙", "Vive no mar e tem oito braços."],
      ["ONÇA", "🐆", "O maior gato do Brasil, cheio de pintas."], ["ABELHA", "🐝", "Faz mel e zumbe: zzzz."],
      ["COELHO", "🐰", "Tem orelhas compridas e adora cenoura."], ["MACACO", "🐒", "Pula de galho em galho e adora banana."],
      ["GIRAFA", "🦒", "Tem o pescoço mais comprido de todos."], ["CAVALO", "🐴", "Relincha e galopa bem rápido."],
      ["CAMELO", "🐫", "Vive no deserto e tem corcovas nas costas."], ["OVELHA", "🐑", "Faz bé e dá lã para fazer blusa."],
      ["RAPOSA", "🦊", "Laranja, esperta e com rabo peludo."], ["CORUJA", "🦉", "Fica acordada de noite e tem olhos grandes."],
      ["JACARÉ", "🐊", "Tem a boca cheia de dentes e vive nos rios."], ["BALEIA", "🐳", "O maior bicho do mar, solta água pelas costas."],
      ["PINGUIM", "🐧", "Ave que não voa, nada muito bem e vive no frio."], ["FORMIGA", "🐜", "Pequenininha e trabalhadeira, anda em fila."],
      ["GALINHA", "🐔", "Bota ovos e cisca no quintal."], ["TUBARÃO", "🦈", "Peixe grandão do mar, com muitos dentes."],
      ["MORCEGO", "🦇", "Voa de noite e dorme de cabeça para baixo."], ["CARACOL", "🐌", "Anda devagarinho e leva a casa nas costas."],
      ["MINHOCA", "🪱", "Vive debaixo da terra e ajuda as plantas."], ["CANGURU", "🦘", "Pula muito e carrega o filhote numa bolsa."],
      ["ESQUILO", "🐿️", "Pequeno, de rabo peludo, guarda nozes para o inverno."],
      ["ELEFANTE", "🐘", "Bicho bem grande com uma tromba comprida."], ["CACHORRO", "🐶", "Late au-au e é o melhor amigo das pessoas."],
      ["PAPAGAIO", "🦜", "Ave colorida que aprende a falar."], ["JOANINHA", "🐞", "Besourinho vermelho com bolinhas pretas."],
      ["FLAMINGO", "🦩", "Ave cor-de-rosa que fica numa perna só."], ["PREGUIÇA", "🦥", "Bicho bem lento que vive pendurado nas árvores."],
      ["GOLFINHO", "🐬", "Vive no mar, é muito esperto e adora pular."], ["TARTARUGA", "🐢", "Anda devagar e tem um casco duro."],
      ["BORBOLETA", "🦋", "Inseto de asas coloridas que já foi lagarta."], ["CARANGUEJO", "🦀", "Anda de lado e tem duas garras."],
      ["DINOSSAURO", "🦕", "Bicho gigante que viveu há muito, muito tempo."], ["HIPOPÓTAMO", "🦛", "Bicho enorme que passa o dia dentro do rio."],
      ["RINOCERONTE", "🦏", "Bicho grandão com um chifre no nariz."],
    ],
    frutas: [
      ["UVA", "🍇", "Vem em cacho e pode ser verde ou roxa."], ["KIWI", "🥝", "Marrom e peludinha por fora, verde por dentro."],
      ["PERA", "🍐", "Verdinha, docinha e com formato de gota."], ["COCO", "🥥", "Dura por fora, com água docinha dentro."],
      ["MAÇÃ", "🍎", "Vermelha e crocante."], ["MANGA", "🥭", "Amarela, suculenta e com um caroço grande."],
      ["LIMÃO", "🍋", "Bem azedinho, faz uma limonada gostosa."], ["MELÃO", "🍈", "Grande, amarelinho e docinho."],
      ["BANANA", "🍌", "Amarela, comprida, e o macaco adora."], ["CEREJA", "🍒", "Pequenininha, vermelha e vem em par."],
      ["TOMATE", "🍅", "Vermelho, vai na salada e no molho."], ["LARANJA", "🍊", "Tem o nome da própria cor e dá um suco gostoso."],
      ["MORANGO", "🍓", "Vermelho, com sementinhas do lado de fora."], ["ABACAXI", "🍍", "Tem uma coroa e a casca cheia de espinhos."],
      ["PÊSSEGO", "🍑", "Macio, peludinho e cor de laranja."], ["ABACATE", "🥑", "Verde por dentro, com um caroço bem grande."],
      ["MIRTILO", "🫐", "Bolinha azul pequenininha."], ["MELANCIA", "🍉", "Verde por fora, vermelha por dentro, cheia de sementes."],
      ["TANGERINA", "🍊", "Parece uma laranja pequena e é fácil de descascar."], ["CARAMBOLA", "⭐", "Cortada em fatias, parece uma estrela."],
      ["MARACUJÁ", "💛", "Amarelo por fora, com sementinhas azedinhas dentro."], ["JABUTICABA", "🟣", "Bolinha roxa que nasce grudada no tronco da árvore."],
    ],
    comidas: [
      ["PÃO", "🍞", "Sai quentinho da padaria de manhã."], ["OVO", "🥚", "A galinha bota."], ["MEL", "🍯", "As abelhas fazem, é bem docinho."],
      ["BOLO", "🎂", "Tem no aniversário, com velinhas."], ["SUCO", "🧃", "Bebida feita de fruta."],
      ["MILHO", "🌽", "Amarelo, vira pipoca e pamonha."], ["PIZZA", "🍕", "Redonda, cortada em fatias, com queijo derretido."],
      ["ARROZ", "🍚", "Branquinho, a gente come junto com feijão."], ["LEITE", "🥛", "Branco, vem da vaca."],
      ["QUEIJO", "🧀", "Amarelo, e o rato adora."], ["BATATA", "🥔", "Vira purê e também batata frita."],
      ["PIPOCA", "🍿", "Estoura na panela e é boa para ver filme."], ["FEIJÃO", "🫘", "Grãozinho que a gente come com arroz."],
      ["SORVETE", "🍦", "Gelado e docinho, derrete no calor."], ["CENOURA", "🥕", "Laranja e comprida, o coelho adora."],
      ["PIMENTA", "🌶️", "Vermelha e arde na boca."], ["PIRULITO", "🍭", "Doce redondo com um palitinho."],
      ["MACARRÃO", "🍝", "Comprido, vem com molho de tomate."], ["PANQUECA", "🥞", "Massa redondinha e fininha, enrolada ou empilhada."],
      ["BISCOITO", "🍪", "Crocante, bom para o lanche."], ["BRÓCOLIS", "🥦", "Parece uma arvorezinha verde."],
      ["COGUMELO", "🍄", "Parece um guarda-chuva pequenininho."], ["CHOCOLATE", "🍫", "Doce marrom feito de cacau."],
      ["SANDUÍCHE", "🥪", "Pão com recheio no meio."],
    ],
    objetos: [
      ["BOLA", "⚽", "Redonda, para chutar e brincar."], ["PIPA", "🪁", "Voa no céu presa numa linha."],
      ["DADO", "🎲", "Cubo com bolinhas de um a seis."], ["CAMA", "🛏️", "Lugar para dormir."], ["VELA", "🕯️", "Acende no bolo de aniversário."],
      ["LUPA", "🔍", "Deixa as coisas pequenas bem grandes."], ["TREM", "🚂", "Anda nos trilhos e faz piuí."],
      ["LIVRO", "📖", "Tem páginas cheias de histórias."], ["LÁPIS", "✏️", "Serve para escrever e desenhar."],
      ["CHAVE", "🔑", "Abre a porta."], ["ROBÔ", "🤖", "Máquina que pode andar e falar."], ["COROA", "👑", "O rei usa na cabeça."],
      ["BALÃO", "🎈", "Enche de ar e enfeita a festa."], ["AVIÃO", "✈️", "Voa lá no alto levando pessoas."],
      ["NAVIO", "🚢", "Barco bem grande que cruza o mar."], ["CARRO", "🚗", "Tem quatro rodas e leva a família para passear."],
      ["TAMBOR", "🥁", "Instrumento que a gente toca batendo."], ["CHAPÉU", "👒", "A gente usa na cabeça para se proteger do sol."],
      ["ÓCULOS", "👓", "Ajuda a enxergar melhor."], ["VIOLÃO", "🎸", "Instrumento de seis cordas."],
      ["CAMISA", "👕", "Roupa que veste o corpo."], ["SAPATO", "👞", "A gente calça no pé."], ["ESCADA", "🪜", "Serve para subir degrau por degrau."],
      ["ESCOVA", "🪥", "A gente usa para escovar os dentes."], ["CADEIRA", "🪑", "Serve para sentar."],
      ["TESOURA", "✂️", "Serve para cortar papel."], ["RELÓGIO", "⏰", "Mostra as horas."], ["MOCHILA", "🎒", "Leva o material para a escola."],
      ["MARTELO", "🔨", "Bate no prego."], ["FOGUETE", "🚀", "Voa até o espaço."], ["LÂMPADA", "💡", "Acende e ilumina a casa."],
      ["PRESENTE", "🎁", "Vem embrulhado e com laço no aniversário."], ["TELEFONE", "☎️", "Serve para conversar com quem está longe."],
      ["VASSOURA", "🧹", "Serve para varrer o chão."], ["BICICLETA", "🚲", "Tem duas rodas e pedais."],
      ["TELEVISÃO", "📺", "Mostra desenhos e filmes."], ["COMPUTADOR", "💻", "Tem teclado e tela, serve para trabalhar e jogar."],
      ["GUARDA-CHUVA", "☂️", "A gente abre quando começa a chover."],
    ],
    lugares: [
      ["PARÁ", "🫐", "Estado do Norte famoso pelo açaí."], ["ACRE", "🌳", "Estado do Norte, no meio da floresta, vizinho do Amazonas."],
      ["BAHIA", "🥥", "Estado do Nordeste famoso pelo acarajé."], ["CEARÁ", "⛵", "Estado do Nordeste das jangadas e praias lindas."],
      ["NATAL", "🎄", "Capital do Rio Grande do Norte, tem nome de festa de fim de ano."], ["GOIÁS", "🌾", "Estado do Centro-Oeste, vizinho de Brasília."],
      ["AMAPÁ", "🌍", "Estado do Norte por onde passa a linha do Equador."], ["BELÉM", "🛶", "Capital do Pará, do mercado Ver-o-Peso."],
      ["PIAUÍ", "🌵", "Estado do Nordeste onde fica a Serra da Capivara."],
      ["MANAUS", "🌳", "Capital do Amazonas, no meio da floresta, onde o Rio Negro encontra o Solimões."],
      ["RECIFE", "🌉", "Capital de Pernambuco, a cidade das pontes."], ["PARANÁ", "💧", "Estado do Sul onde ficam as Cataratas do Iguaçu."],
      ["ALAGOAS", "🏝️", "Estado do Nordeste de mar verdinho, vizinho de Pernambuco."], ["RORAIMA", "⛰️", "O estado que fica mais ao norte do Brasil."],
      ["SERGIPE", "🦀", "O menor estado do Brasil, vizinho da Bahia."], ["PARAÍBA", "🌅", "Estado onde fica a ponta mais a leste do Brasil."],
      ["BRASÍLIA", "🏛️", "A capital do Brasil."], ["AMAZONAS", "🌳", "O maior estado do Brasil, cheio de floresta e de rios."],
      ["SALVADOR", "🥁", "Capital da Bahia, onde fica o Pelourinho."], ["PANTANAL", "🐊", "Lugar alagado cheio de jacarés e tuiuiús."],
      ["CURITIBA", "🌲", "Capital do Paraná, a cidade das araucárias."], ["MARANHÃO", "🏜️", "Estado dos Lençóis: dunas de areia com lagoas."],
      ["AMAZÔNIA", "🌳", "A maior floresta tropical do mundo."], ["RONDÔNIA", "🌳", "Estado do Norte, vizinho do Acre e do Amazonas."],
      ["FORTALEZA", "🏖️", "Capital do Ceará, cheia de praias."], ["TOCANTINS", "☀️", "O estado mais novo do Brasil."],
      ["SÃO PAULO", "🏙️", "A maior cidade do Brasil."], ["MINAS GERAIS", "🧀", "Estado famoso pelo pão de queijo."],
      ["RIO DE JANEIRO", "🏖️", "Cidade do Cristo Redentor e do Pão de Açúcar."],
    ],
    profissoes: [
      ["JUIZ", "⚖️", "Decide quem tem razão no tribunal."], ["ATOR", "🎭", "Faz papéis no teatro e na novela."],
      ["GARI", "🧹", "Deixa a rua limpinha."], ["GUIA", "🧭", "Mostra o caminho e os lugares bonitos para os turistas."],
      ["PILOTO", "✈️", "Dirige o avião."], ["MÉDICO", "🩺", "Cuida da nossa saúde quando ficamos doentes."],
      ["PINTOR", "🎨", "Faz quadros ou pinta as paredes."], ["MÚSICO", "🎵", "Toca instrumentos e faz música."],
      ["PADEIRO", "🍞", "Faz o pão quentinho."], ["PALHAÇO", "🤡", "Faz todo mundo rir no circo."],
      ["CARTEIRO", "✉️", "Entrega as cartas nas casas."], ["DENTISTA", "🦷", "Cuida dos nossos dentes."],
      ["BOMBEIRO", "🚒", "Apaga o fogo e salva as pessoas."], ["POLICIAL", "👮", "Cuida da segurança de todos."],
      ["PEDREIRO", "🧱", "Constrói casas com tijolos."], ["MECÂNICO", "🔧", "Conserta carros."],
      ["PESCADOR", "🎣", "Pega peixes no rio ou no mar."], ["MOTORISTA", "🚌", "Dirige o ônibus ou o carro."],
      ["PROFESSOR", "📚", "Ensina as crianças na escola."], ["CIENTISTA", "🔬", "Faz experiências para descobrir coisas novas."],
      ["BAILARINA", "🩰", "Dança na ponta dos pés."], ["COZINHEIRO", "🍳", "Prepara a comida no restaurante."],
      ["ENFERMEIRO", "💉", "Ajuda a cuidar das pessoas no hospital."], ["ASTRONAUTA", "🚀", "Viaja para o espaço."],
      ["AGRICULTOR", "🌾", "Planta e colhe os alimentos."], ["COSTUREIRA", "🧵", "Faz roupas com linha e agulha."],
      ["VETERINÁRIO", "🐾", "O médico dos bichos."],
    ],
    esportes: [
      ["JUDÔ", "🥋", "Luta com faixa colorida na roupa, sem machucar."], ["VÔLEI", "🏐", "A bola passa por cima da rede, jogada com as mãos."],
      ["TÊNIS", "🎾", "Usa raquete e uma bolinha amarela."], ["SURFE", "🏄", "Fica em pé na prancha em cima da onda."],
      ["GOLFE", "⛳", "Bate na bolinha para ela cair no buraco."], ["SKATE", "🛹", "Prancha com quatro rodinhas."],
      ["XADREZ", "♟️", "Jogo de tabuleiro com rei, rainha e cavalo."], ["FUTEBOL", "⚽", "O esporte mais amado do Brasil, com gol."],
      ["NATAÇÃO", "🏊", "Esporte dentro da piscina."], ["CORRIDA", "🏃", "Quem chegar primeiro ganha."],
      ["BASQUETE", "🏀", "Joga a bola na cesta."], ["CICLISMO", "🚴", "Corrida de bicicleta."],
      ["CANOAGEM", "🛶", "Rema num barquinho pelo rio."], ["CAPOEIRA", "🪘", "Mistura luta e dança, ao som do berimbau."],
      ["HANDEBOL", "🤾", "Parece futebol, mas é jogado com as mãos."], ["ESCALADA", "🧗", "Sobe nas pedras e nos paredões."],
      ["GINÁSTICA", "🤸", "Dá cambalhotas e estrelinhas."], ["PATINAÇÃO", "⛸️", "Desliza no gelo ou com rodinhas."],
    ],
  };

  const NIVEIS = { curta: [1, 5], media: [6, 7], longa: [8, 99] };
  const OPCOES = [
    { chave: "modo", titulo: "Jogar", valores: [["sozinho", "🧒 Sozinho"], ["dois", "👥 2 jogadores"]] },
    { chave: "tema", titulo: "Tema", valores: [["todos", "🎲 Misturado"], ...Object.entries(TEMAS).map(([k, t]) => [k, `${t.icone} ${t.nome}`])] },
    { chave: "nivel", titulo: "Palavras", valores: [["curta", "🌱 Curtas (até 5 letras)"], ["media", "🌿 Médias (6 e 7)"], ["longa", "🌳 Longas (8 ou mais)"]] },
    { chave: "dica", regra: true, titulo: "Figura da dica", valores: [["ja", "👀 Já aparece"], ["pedir", "💡 Só quando pedir"]] },
  ];
  const PADRAO = {
    "6-8": { modo: "sozinho", tema: "todos", nivel: "curta", dica: "ja" },
    "8-10": { modo: "sozinho", tema: "todos", nivel: "media", dica: "pedir" },
  };

  // ---------- Letras ----------
  const base = ch => ch.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase(); // Á→A, Ç→C
  const ehLetra = ch => /^[A-Z]$/.test(base(ch));
  const contarLetras = p => [...p].filter(ehLetra).length;
  const falaLetra = L => NOME_LETRA[L] || L.toLowerCase();

  // Palavras do nível (se o tema tiver poucas, completa com as do nível vizinho)
  const usadas = new Set();
  function sortearPalavras(tema, nivel, quantas) {
    const temas = tema === "todos" ? Object.keys(PALAVRAS) : [tema];
    const todas = temas.flatMap(t => PALAVRAS[t].map(([p, e, d]) => ({ palavra: p, emoji: e, dica: d, tema: t })));
    const [min, max] = NIVEIS[nivel] || NIVEIS.curta;
    let lista = todas.filter(w => { const n = contarLetras(w.palavra); return n >= min && n <= max; });
    if (lista.length < quantas) {
      const alvo = (min + Math.min(max, 12)) / 2;
      lista = todas.slice().sort((a, b) => Math.abs(contarLetras(a.palavra) - alvo) - Math.abs(contarLetras(b.palavra) - alvo)).slice(0, Math.max(quantas, lista.length));
    }
    let novas = lista.filter(w => !usadas.has(w.palavra));
    if (novas.length < quantas) { lista.forEach(w => usadas.delete(w.palavra)); novas = lista; }
    const escolha = Motor.embaralhar(novas).slice(0, quantas);
    escolha.forEach(w => usadas.add(w.palavra));
    return escolha;
  }

  // ---------- Desenho: a florzinha no vaso ----------
  const CORES_PETALA = ["#ff8fab", "#c77dff", "#ff8fab", "#c77dff", "#ff8fab", "#c77dff"];
  function florSVG() {
    let s = '<svg viewBox="0 0 200 260" class="forca-flor-svg" aria-hidden="true">';
    s += '<ellipse cx="100" cy="254" rx="62" ry="6" fill="rgba(0,0,0,.12)"/>';
    s += '<path d="M100 200 C 94 172 108 150 100 116" stroke="#2a9d55" stroke-width="9" fill="none" stroke-linecap="round"/>';
    s += '<ellipse cx="80" cy="168" rx="22" ry="10" fill="#52b788" transform="rotate(-30 80 168)"/>';
    s += '<ellipse cx="121" cy="152" rx="22" ry="10" fill="#52b788" transform="rotate(28 121 152)"/>';
    for (let i = 0; i < CHANCES; i++) {
      const a = i * 60;
      s += `<g class="forca-petala" data-i="${i}"><g transform="rotate(${a} 100 90)"><ellipse cx="100" cy="50" rx="21" ry="31" fill="${CORES_PETALA[i]}" stroke="#fff" stroke-width="3"/><ellipse cx="100" cy="46" rx="7" ry="15" fill="rgba(255,255,255,.35)"/></g></g>`;
    }
    s += '<circle cx="100" cy="90" r="29" fill="#ffd166" stroke="#f4a261" stroke-width="4"/>';
    s += '<g class="forca-rosto"></g>';
    s += '<path d="M58 206 H142 L132 254 H68 Z" fill="#e07a5f"/><rect x="52" y="196" width="96" height="18" rx="7" fill="#f4a261"/>';
    s += '<path d="M76 232 h48" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".5"/>';
    return s + "</svg>";
  }
  // humor: "feliz", "ok", "preocupada", "festa", "triste"
  function rosto(humor) {
    const olhos = humor === "festa"
      ? '<path d="M83 88 q6 -8 12 0 M105 88 q6 -8 12 0" stroke="#5a3e1b" stroke-width="4" fill="none" stroke-linecap="round"/>'
      : '<circle cx="89" cy="86" r="4.5" fill="#5a3e1b"/><circle cx="111" cy="86" r="4.5" fill="#5a3e1b"/><circle cx="90.5" cy="84.5" r="1.5" fill="#fff"/><circle cx="112.5" cy="84.5" r="1.5" fill="#fff"/>';
    const boca = {
      festa: '<path d="M86 96 q14 18 28 0 z" fill="#c1121f"/>',
      feliz: '<path d="M88 97 q12 11 24 0" stroke="#5a3e1b" stroke-width="4" fill="none" stroke-linecap="round"/>',
      ok: '<path d="M90 100 q10 4 20 0" stroke="#5a3e1b" stroke-width="4" fill="none" stroke-linecap="round"/>',
      preocupada: '<ellipse cx="100" cy="101" rx="5" ry="6" fill="#5a3e1b"/>',
      triste: '<path d="M89 104 q11 -9 22 0" stroke="#5a3e1b" stroke-width="4" fill="none" stroke-linecap="round"/>',
    }[humor];
    const bochechas = '<circle cx="80" cy="97" r="5" fill="#ff8fab" opacity=".6"/><circle cx="120" cy="97" r="5" fill="#ff8fab" opacity=".6"/>';
    const lagrima = humor === "triste" ? '<path d="M111 92 q-4 7 0 10 q4 -3 0 -10z" fill="#4cc9f0"/>' : "";
    return olhos + boca + bochechas + lagrima;
  }

  const el = (tag, classe, texto) => {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texto != null) e.textContent = texto;
    return e;
  };
  const botao = (texto, aoClicar, classe = "chip") => {
    const b = el("button", classe, texto);
    b.addEventListener("click", aoClicar);
    return b;
  };

  JOGOS.push({
    id: ID, nome: "Forca", icone: "🪢",
    faixas: ["6-8", "8-10"],
    ajuda: [
      { figura: '<svg viewBox="0 0 200 60" style="width:200px" aria-hidden="true"><g font-family="sans-serif" font-weight="bold" font-size="34" fill="#1d3557" text-anchor="middle"><text x="25" y="38">G</text><text x="75" y="38"></text><text x="125" y="38">T</text><text x="175" y="38"></text></g><g stroke="#1d3557" stroke-width="5" stroke-linecap="round"><path d="M8 52h34M58 52h34M108 52h34M158 52h34"/></g></svg>',
        texto: "Descubra a palavra secreta! Cada tracinho é uma letra." },
      { figura: "🐾", texto: "A dica mostra o tema e uma figura. Toque na dica para ouvir de novo." },
      { figura: "🔤", texto: "Toque nas letras do teclado da tela (ou digite no teclado do computador). Se a letra está na palavra, ela aparece em todos os lugares onde existe." },
      { figura: florSVG().replace('class="forca-flor-svg"', 'style="width:90px"'), texto: "Errou a letra? A florzinha perde uma pétala. São 6 pétalas: 6 chances!" },
      { figura: "Á", texto: "Acentos: tocar no A já mostra Á, Ã e Â. Tocar no C mostra também o Ç." },
      { figura: "🏆", texto: "Descubra a palavra antes de a florzinha perder todas as pétalas!" },
      { figura: "👥", texto: "Com 2 jogadores: um escreve a palavra escondido e escolhe o tema, o outro adivinha. Depois trocam." },
    ],
    iniciar(area, faixa) { opcoes(area, faixa); },
  });
  CATALOGO[ID] = ["leitura", "Adivinhe a palavra letra por letra"];

  function opcoes(area, faixa) {
    const id = faixa && PADRAO[faixa.id] ? faixa.id : "8-10";
    Motor.telaOpcoes(area, {
      opcoes: OPCOES, padrao: PADRAO[id], chave: `forca-opcoes-${id}`,
      aoJogar: op => partida(area, op, faixa),
    });
  }

  // ---------- Partida ----------
  function partida(area, op, faixa) {
    const sessao = Motor.sessaoAtual();
    area.innerHTML = "";
    const tela = el("div", "forca-tela");
    area.appendChild(tela);
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    let aoTeclar = null; // quem recebe as letras do teclado físico agora
    let redesenhar = null; // ajusta os tamanhos quando a tela gira

    const teclado = e => {
      if (!vivo()) { document.removeEventListener("keydown", teclado); return; }
      if (e.doControle || e.ctrlKey || e.metaKey || e.altKey || !aoTeclar) return;
      const k = e.key || "";
      if (k.length !== 1) return;
      if (!/^[a-zA-ZÀ-ÿ]$/.test(k)) return;
      e.preventDefault();
      aoTeclar(k.toUpperCase());
    };
    document.addEventListener("keydown", teclado);
    let espera = null;
    const aoRedimensionar = () => {
      if (!vivo()) { window.removeEventListener("resize", aoRedimensionar); return; }
      clearTimeout(espera);
      espera = setTimeout(() => { if (vivo() && redesenhar) redesenhar(); }, 150);
    };
    window.addEventListener("resize", aoRedimensionar);

    // Tamanhos das teclas/letras conforme a tela e a palavra
    function medidas(qtLetras, colunasTeclado = 7, nTeclas = 26) {
      const W = tela.clientWidth, H = tela.clientHeight, deitado = W > H;
      tela.classList.toggle("deitado", deitado);
      let tecla, slot, flor;
      if (deitado) {
        const cols = colunasTeclado + 2, linhas = Math.ceil(nTeclas / cols);
        const dir = W * 0.5 - 8;
        tecla = Math.min(78, (dir - (cols - 1) * 7) / cols, ((H - 74 - (linhas - 1) * 7) / linhas) / 0.9);
        const esq = W - dir - 22;
        slot = Math.min(76, (esq - (qtLetras - 1) * 6) / qtLetras);
        flor = Math.min(esq * 0.42, H - 74 - slot * 1.35 - 20, 300);
        tela.style.setProperty("--cols", cols);
      } else {
        const cols = colunasTeclado, linhas = Math.ceil(nTeclas / cols);
        tecla = Math.min(74, (W - (cols - 1) * 7) / cols);
        const altTeclado = linhas * (tecla * 0.9 + 7);
        slot = Math.min(76, (W - (qtLetras - 1) * 6) / qtLetras);
        flor = Math.min(W * 0.46, H - 80 - altTeclado - slot * 1.35 - 46, 320);
        tela.style.setProperty("--cols", cols);
      }
      tela.style.setProperty("--tecla", Math.floor(tecla) + "px");
      tela.style.setProperty("--slot", Math.max(18, Math.floor(slot)) + "px");
      tela.style.setProperty("--flor", Math.max(90, Math.floor(flor)) + "px");
    }

    // ----- Uma palavra -----
    // cfg: { palavra, emoji, dica, tema, info: [elementos do topo], dicaJa, botoesFim(ganhou) → [botões], aoFim(ganhou) }
    function jogarPalavra(cfg) {
      const palavra = cfg.palavra.toUpperCase();
      const chars = [...palavra];
      const letrasDaPalavra = new Set(chars.filter(ehLetra).map(base));
      const tentadas = new Set();
      let erros = 0, acabou = false, dicaVisivel = !!cfg.dicaJa;
      const T = TEMAS[cfg.tema];

      tela.innerHTML = "";
      tela.className = "forca-tela";
      const topo = el("div", "forca-topo");
      (cfg.info || []).forEach(i => topo.appendChild(i));
      topo.appendChild(Motor.botaoSom());

      const meio = el("div", "forca-meio");
      const flor = el("div", "forca-flor");
      flor.innerHTML = florSVG();
      const rostoEl = flor.querySelector(".forca-rosto");
      const petalas = [...flor.querySelectorAll(".forca-petala")];
      const contador = el("div", "forca-chances");
      flor.appendChild(contador);

      const dica = el("button", "forca-dica");
      const dicaFig = el("span", "forca-dica-fig");
      const dicaTxt = el("span", "forca-dica-txt");
      dica.append(dicaFig, dicaTxt);
      dica.addEventListener("click", () => {
        if (!dicaVisivel) { dicaVisivel = true; pintarDica(); Motor.ploc(); }
        falarDica();
      });
      meio.append(flor, dica);

      const linha = el("div", "forca-palavra");
      const slots = chars.map(ch => {
        if (ch === " ") { linha.appendChild(el("span", "forca-espaco")); return null; }
        if (!ehLetra(ch)) { linha.appendChild(el("span", "forca-sinal", ch)); return null; }
        const s = el("span", "forca-slot");
        linha.appendChild(s);
        return s;
      });

      const baixo = el("div", "forca-baixo");
      const teclas = {};
      const tecladoEl = el("div", "forca-teclado");
      ALFABETO.forEach(L => {
        const b = botao(L, () => chutar(L), "forca-tecla");
        b.setAttribute("aria-label", `Letra ${L}`);
        teclas[L] = b;
        tecladoEl.appendChild(b);
      });
      baixo.appendChild(tecladoEl);

      const esquerda = el("div", "forca-esquerda");
      esquerda.append(meio, linha);
      tela.append(topo, esquerda, baixo);

      function pintarDica() {
        dica.classList.toggle("escondida", !dicaVisivel);
        dicaFig.textContent = dicaVisivel ? cfg.emoji : "💡";
        dicaTxt.textContent = dicaVisivel ? (T ? `${T.icone} ${T.nome}` : "Dica") : `${T ? T.icone + " " + T.nome + " · " : ""}Ver a dica`;
      }
      function falarDica() {
        const tema = T ? `É ${T.eh}. ` : "";
        Motor.falar(`${tema}${dicaVisivel && cfg.dica ? cfg.dica : ""}`.trim() || "Descubra a palavra!");
      }
      function humor() {
        const resta = CHANCES - erros;
        return resta >= 5 ? "feliz" : resta >= 3 ? "ok" : resta >= 1 ? "preocupada" : "triste";
      }
      function pintar(revelarTudo) {
        chars.forEach((ch, i) => {
          const s = slots[i];
          if (!s) return;
          const mostra = tentadas.has(base(ch));
          const txt = mostra || revelarTudo ? ch : "";
          if (s.textContent !== txt) {
            s.textContent = txt;
            if (txt) Motor.animar(s, "pula");
          }
          s.classList.toggle("revelada", !mostra && !!revelarTudo);
          s.classList.toggle("cheia", !!txt);
        });
        rostoEl.innerHTML = rosto(acabou ? (erros >= CHANCES ? "triste" : "festa") : humor());
        contador.textContent = `🌸 ${CHANCES - erros}`;
      }

      function chutar(L) {
        if (acabou || !vivo()) return;
        L = base(L);
        if (!/^[A-Z]$/.test(L)) return;
        const tecla = teclas[L];
        if (tentadas.has(L)) {
          Motor.animar(tecla, "balanca");
          Motor.falar(`Você já tentou a letra ${falaLetra(L)}.`);
          return;
        }
        tentadas.add(L);
        if (letrasDaPalavra.has(L)) {
          tecla.classList.add("certa");
          const qt = chars.filter(ch => ehLetra(ch) && base(ch) === L).length;
          pintar(false);
          Motor.nota(660, { dur: 0.15, tipo: "triangle", vol: 0.22 });
          Motor.nota(880, { dur: 0.2, tipo: "triangle", vol: 0.2, inicio: 0.08 });
          if ([...letrasDaPalavra].every(x => tentadas.has(x))) return fim(true);
          Motor.falar(qt > 1 ? `Tem ${qt} ${falaLetra(L)}!` : `Tem ${falaLetra(L)}!`);
        } else {
          tecla.classList.add("errada");
          Motor.animar(tecla, "balanca");
          const p = petalas[erros];
          erros++;
          if (p) {
            p.classList.add("cai");
            setTimeout(() => p.classList.add("caiu"), 1100);
          }
          Motor.nota(330, { dur: 0.35, tipo: "sine", vol: 0.2, ate: 200 });
          pintar(false);
          if (erros >= CHANCES) return fim(false);
          const resta = CHANCES - erros;
          Motor.falar(`Não tem ${falaLetra(L)}.${resta === 1 ? " Só falta uma pétala!" : ""}`);
        }
      }

      function fim(ganhou) {
        acabou = true;
        aoTeclar = null;
        dicaVisivel = true;
        pintarDica();
        pintar(true);
        if (cfg.aoFim) cfg.aoFim(ganhou);
        const falada = palavra.toLowerCase();
        if (ganhou) {
          flor.classList.add("festa");
          Motor.tim();
          Motor.comemorar(linha);
          Motor.falar(`${Motor.elogio()} A palavra é ${falada}!`);
        } else {
          Motor.falar(`Ah, quase! A palavra era ${falada}. Na próxima você consegue!`);
        }
        Motor.depois(() => {
          if (!vivo()) return;
          baixo.innerHTML = "";
          const res = el("div", "forca-resultado " + (ganhou ? "ganhou" : "quase"));
          const fig = el("div", "forca-res-fig", cfg.emoji);
          const txt = el("div", "forca-res-txt");
          txt.append(el("b", "", ganhou ? "🎉 Acertou!" : "🌱 Quase!"), el("span", "forca-res-palavra", palavra));
          const ouvir = botao("🔊", () => Motor.falar(falada), "chip forca-ouvir");
          ouvir.setAttribute("aria-label", "Ouvir a palavra");
          res.append(fig, txt, ouvir);
          const bs = el("div", "forca-res-botoes");
          cfg.botoesFim(ganhou).forEach(b => bs.appendChild(b));
          baixo.append(res, bs);
          redesenhar = () => medidas(chars.length);
        }, 1200);
      }

      redesenhar = () => medidas(chars.length);
      redesenhar();
      pintarDica();
      pintar(false);
      aoTeclar = L => chutar(L);
      const tema = T ? `É ${T.eh}` : "Descubra a palavra";
      Motor.falar(`${cfg.anuncio || ""}${tema}, com ${contarLetras(palavra)} letras.${dicaVisivel && cfg.dica ? " " + cfg.dica : ""}`);
      return { chutar };
    }

    // ----- Sozinho: 5 palavras -----
    function sozinho() {
      const lista = sortearPalavras(op.tema, op.nivel, RODADA);
      let atual = 0, acertos = 0;
      const proxima = () => {
        const w = lista[atual];
        const prog = el("span", "forca-info", `📝 ${atual + 1} de ${lista.length}`);
        const pontos = el("span", "forca-info", `⭐ ${acertos}`);
        const ultima = atual === lista.length - 1;
        const jogo = jogarPalavra({
          ...w, dicaJa: op.dica !== "pedir", info: [prog, pontos],
          anuncio: atual === 0 ? "Descubra a palavra! " : "",
          aoFim: ganhou => { if (ganhou) acertos++; pontos.textContent = `⭐ ${acertos}`; },
          botoesFim: () => [botao(ultima ? "🏆 Ver o resultado" : "➡️ Próxima palavra", () => { atual++; if (atual < lista.length) proxima(); else telaFim(acertos, lista.length); }, "chip executar")],
        });
        if (window.FORCA_TESTE) window.FORCA_TESTE.atual = { palavra: w.palavra, chutar: jogo.chutar };
      };
      proxima();
    }

    function telaFim(acertos, total) {
      aoTeclar = null;
      redesenhar = null;
      tela.innerHTML = "";
      tela.className = "forca-tela";
      const caixa = el("div", "forca-fim");
      caixa.appendChild(el("div", "forca-fim-trofeu", acertos === total ? "🏆" : acertos >= total / 2 ? "🌻" : "🌱"));
      caixa.appendChild(el("div", "forca-fim-estrelas", "⭐".repeat(Math.max(1, acertos)) ));
      caixa.appendChild(el("div", "forca-fim-txt", `Você descobriu ${acertos} de ${total} palavras!`));
      const bs = el("div", "mesa-botoes");
      bs.append(botao("🔁 Jogar de novo", () => sozinho(), "chip executar"), botao("⚙️ Opções", () => opcoes(area, faixa)));
      caixa.appendChild(bs);
      tela.appendChild(caixa);
      const novo = Placar.recorde(ID, "palavras", acertos);
      Motor.tim();
      Motor.comemorar(caixa.firstChild);
      Motor.falar(acertos === total ? `Incrível! Você descobriu todas as ${total} palavras!` : `Muito bem! Você descobriu ${acertos} de ${total} palavras!${novo ? " É o seu recorde!" : ""}`);
    }

    // ----- 2 jogadores: um escreve, o outro adivinha -----
    const pontos2 = [0, 0];
    let escritor = 0;
    const nome = i => `Jogador ${i + 1}`;
    function placar2() {
      return el("span", "forca-info", `👤1 ⭐${pontos2[0]} × ⭐${pontos2[1]} 👤2`);
    }

    function escrever() {
      redesenhar = null;
      let texto = "", tema = null;
      tela.innerHTML = "";
      tela.className = "forca-tela forca-escrever";
      const topo = el("div", "forca-topo");
      topo.append(placar2(), Motor.botaoSom());
      const titulo = el("div", "forca-escrever-titulo", `✍️ ${nome(escritor)}, escreva a palavra secreta`);
      const sub = el("div", "forca-escrever-sub", `${nome(1 - escritor)}, não olhe! 🙈`);
      const segredo = el("div", "forca-segredo");
      let ver = false;
      const olho = botao("👁️ Espiar", () => { ver = !ver; olho.textContent = ver ? "🙈 Esconder" : "👁️ Espiar"; pintar(); }, "chip forca-olho");
      const temas = el("div", "forca-temas");
      temas.appendChild(el("span", "forca-temas-tit", "Dica:"));
      const chipsTema = Object.entries(TEMAS).map(([k, t]) => {
        const b = botao(`${t.icone} ${t.nome}`, () => { tema = tema === k ? null : k; chipsTema.forEach(([kk, bb]) => bb.classList.toggle("ativo", kk === tema)); }, "chip");
        temas.appendChild(b);
        return [k, b];
      });
      const tecladoEl = el("div", "forca-teclado forca-teclado-escrever");
      [...ALFABETO, "Ç"].forEach(L => tecladoEl.appendChild(botao(L, () => digitar(L), "forca-tecla")));
      tecladoEl.appendChild(botao("␣", () => digitar(" "), "forca-tecla forca-tecla-espaco"));
      const apagar = botao("⌫", () => { texto = texto.slice(0, -1); pintar(); }, "forca-tecla forca-tecla-apagar");
      apagar.setAttribute("aria-label", "Apagar");
      tecladoEl.appendChild(apagar);
      const pronto = botao("✅ Pronto", confirmar, "chip executar forca-pronto");
      const linhaSegredo = el("div", "forca-segredo-linha");
      linhaSegredo.append(segredo, olho);
      const esquerda = el("div", "forca-esquerda");
      esquerda.append(titulo, sub, linhaSegredo, temas);
      const baixo = el("div", "forca-baixo");
      baixo.append(tecladoEl, pronto);
      tela.append(topo, esquerda, baixo);

      function pintar() {
        segredo.innerHTML = "";
        if (!texto) segredo.appendChild(el("span", "forca-segredo-vazio", "toque nas letras"));
        [...texto].forEach(ch => segredo.appendChild(el("span", ch === " " ? "forca-espaco" : "forca-slot cheia", ch === " " ? "" : ver ? ch : "●")));
        pronto.disabled = contarLetras(texto) < 2;
      }
      function digitar(L) {
        if (contarLetras(texto) >= 14) { Motor.animar(segredo, "balanca"); return; }
        if (L === " " && (!texto || texto.endsWith(" "))) return;
        texto += L;
        Motor.ploc();
        pintar();
      }
      function confirmar() {
        const p = texto.trim();
        if (contarLetras(p) < 2) return;
        passe(p, tema);
      }
      aoTeclar = L => digitar(L);
      redesenhar = () => medidas(10, 8, 29);
      redesenhar();
      pintar();
      Motor.falar(`${nome(escritor)}, escreva uma palavra secreta. ${nome(1 - escritor)}, não pode olhar!`);
    }

    function passe(palavra, tema) {
      aoTeclar = null;
      redesenhar = null;
      tela.innerHTML = "";
      tela.className = "forca-tela";
      const caixa = el("div", "forca-passe");
      caixa.append(el("div", "forca-passe-fig", "🙈"), el("div", "forca-passe-titulo", `Passe para o ${nome(1 - escritor)}!`),
        el("div", "forca-passe-sub", "A palavra secreta está guardada. Agora é a vez de adivinhar."));
      caixa.appendChild(botao(`👍 Sou o ${nome(1 - escritor)}, pronto!`, () => adivinhar(palavra, tema), "chip executar"));
      tela.appendChild(caixa);
      Motor.falar(`Agora passe para o ${nome(1 - escritor)}!`);
    }

    function adivinhar(palavra, tema) {
      const adivinho = 1 - escritor;
      const T = TEMAS[tema];
      const placar = placar2();
      jogarPalavra({
        palavra, tema, emoji: T ? T.icone : "🤫", dica: T ? "" : `Palavra secreta do ${nome(escritor)}.`, dicaJa: true,
        info: [el("span", "forca-info", `🔎 ${nome(adivinho)}`), placar],
        anuncio: `${nome(adivinho)}, descubra a palavra! `,
        aoFim: ganhou => { pontos2[ganhou ? adivinho : escritor]++; placar.textContent = placar2().textContent; },
        botoesFim: () => [
          botao(`🔁 Trocar: ${nome(adivinho)} escreve`, () => { escritor = adivinho; escrever(); }, "chip executar"),
          botao("⚙️ Opções", () => opcoes(area, faixa)),
        ],
      });
    }

    if (op.modo === "dois") escrever(); else sozinho();
  }

  if (typeof globalThis !== "undefined") globalThis.ForcaTeste = { PALAVRAS, NIVEIS, base, contarLetras };
})();
