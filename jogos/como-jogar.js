// Explicações "❓ Como jogar" dos jogos com regras (abrem pelo botão ❓ e sozinhas na 1ª vez).
// Cada entrada: id do jogo → [{ figura, texto }] ou faixa => [...] (null = sem explicação).
// As figuras são desenhadas com Ajuda.grade / Ajuda.domino / Ajuda.torres (js/ajuda.js).
(() => {
  const G = Ajuda.grade;
  const pequeno = faixa => !faixa || ["1-2", "2-3", "3-4", "4-5"].includes(faixa.id);

  // Legendas usadas em mais de um desenho
  const XO = { X: { txt: "✕", cor: "#e63946" }, O: { txt: "◯", cor: "#277da1" } };
  const DISCOS = { V: { redondo: "#e63946" }, A: { redondo: "#ffd60a" } };
  const azul = { fundo: "#ffffff", borda: "#1d4ed8" };
  const NUM = { 1: { txt: "1", cor: "#1d4ed8" }, 2: { txt: "2", cor: "#15803d" }, 3: { txt: "3", cor: "#b91c1c" }, 4: { txt: "4", cor: "#6d28d9" } };
  const jardim = { fundo: "#f3dfb5", borda: "#2d6a4f" };
  const MINADO = { ...Object.fromEntries(Object.entries(NUM).map(([k, v]) => [k, { ...v, fundo: "#f3dfb5" }])),
    "#": { fundo: "#74c69d" }, b: { fundo: "#74c69d", txt: "🐝" }, f: { fundo: "#74c69d", txt: "🚩" }, "?": { fundo: "#ffd60a", txt: "?" } };
  const xadrez = (r, c) => ((r + c) % 2 ? "#f3dfb5" : "#8d5524"); // pedras nas casas escuras
  const DAMAS = { b: { redondo: "#fff", contorno: "#555" }, p: { redondo: "#222" }, B: { redondo: "#fff", contorno: "#555", txt: "♛", cor: "#c99400" }, x: { fundo: "#ffd60a" } };
  const BLOCO = c => ({ fundo: c });
  const BLOCOS = { T: BLOCO("#9b5de5"), S: BLOCO("#2a9d55"), I: BLOCO("#00b4d8"), L: BLOCO("#f77f00"), O: BLOCO("#ffd60a"), "*": BLOCO("#ffffff") };
  const escuro = { fundo: "#1b263b", borda: "#0d1b2a" };

  const AJUDAS = {
    domino: faixa => (pequeno(faixa) ? null : [
      { figura: [Ajuda.domino(3, 5) + Ajuda.domino(5, 2), Ajuda.domino(2, 6, { destaque: "#2a9d55" })],
        texto: "Na sua vez, coloque uma pedra que combine com uma das pontas da mesa: o 2 encosta no 2." },
      { figura: "👆", texto: "Toque na pedra para jogar. Se ela servir nas duas pontas, toque na setinha da ponta que você quer." },
      { figura: "🛒", texto: "Não tem pedra que combine? Compre no monte. Se o monte acabou (ou está desligado), você passa a vez." },
      { figura: Ajuda.domino(6, 6), texto: "Quem tem a carroça mais alta (as duas pontas iguais) começa. As carroças ficam atravessadas na mesa." },
      { figura: "🏆", texto: "Quem acabar com as pedras primeiro bate e ganha os pontos que sobraram na mão dos outros." },
      { figura: "🔒", texto: "Se ninguém consegue jogar, o jogo tranca: ganha quem tiver menos pontos na mão." },
      { figura: [Ajuda.domino(5, 3) , "🖐️"], texto: "No tipo Pontas de 5: quando a soma das pontas da mesa dá 5, 10, 15, 20..., quem jogou marca esses pontos." },
    ]),

    damas: [
      { figura: G(["x.x", ".b.", "..."], DAMAS, { fundo: xadrez }),
        texto: "Cada um tem 12 pedras. A pedra anda uma casa na diagonal, para a frente, só nas casas escuras." },
      { figura: [G(["...", ".p.", "b.."], DAMAS, { fundo: xadrez }), G(["..b", "...", "..."], DAMAS, { fundo: xadrez })],
        texto: "Para comer, pule por cima da pedra do outro até a casa vazia logo depois. Pode comer para trás também, e várias seguidas." },
      { figura: "⚠️", texto: "Comer é obrigatório, e é preciso fazer a jogada que come mais pedras. Nas opções dá para desligar essa regra para aprender." },
      { figura: G(["B...", "....", "...."], DAMAS, { fundo: xadrez }),
        texto: "Chegou na última fileira do outro lado? A pedra vira dama 👑, que anda e come quantas casas quiser na diagonal." },
      { figura: "🏆", texto: "Ganha quem comer todas as pedras do outro, ou deixar ele sem jogada." },
      { figura: "👆", texto: "Para jogar, toque na pedra e depois na casa, ou arraste a pedra até lá." },
    ],

    velha: [
      { figura: G(["X.O", ".X.", "O.."], XO, { fundo: "#fff", borda: "#555", cel: 26 }),
        texto: "Cada jogador coloca a sua marca numa casa vazia, um de cada vez." },
      { figura: G(["XOO", ".X.", "O.X"], XO, { fundo: "#fff", borda: "#555", cel: 26, linha: [[0, 0], [1, 1], [2, 2]] }),
        texto: "Ganha quem fizer 3 em linha: deitado, em pé ou na diagonal." },
      { figura: "👵", texto: "Se as casas acabarem e ninguém fizer 3, deu velha: é empate!" },
      { figura: "🛡️", texto: "Dica: se o outro está quase fazendo 3, tampe a casa que falta!" },
    ],

    lig4: [
      { figura: G([".......", ".......", "...A...", "..VV...", ".AVA..."].concat([".AVVA.V"]), DISCOS, azul),
        texto: "Toque numa coluna: a peça cai até o fundo, em cima das outras." },
      { figura: G(["......", "...V..", "..VA..", ".VAA..", "VAAV.."], DISCOS, { ...azul, linha: [[4, 0], [3, 1], [2, 2], [1, 3]] }),
        texto: "Ganha quem fizer 4 peças em linha: deitado, em pé ou na diagonal." },
      { figura: "🛡️", texto: "Fique de olho: se o outro tem 3 em linha, coloque a sua peça na ponta para tampar!" },
    ],

    hanoi: [
      { figura: [Ajuda.torres([[3, 2, 1], [], []]), Ajuda.torres([[], [], [3, 2, 1]])],
        texto: "Leve todos os discos para outra torre." },
      { figura: Ajuda.torres([[3, 2], [1], []]), texto: "Só dá para mover um disco de cada vez: o de cima." },
      { figura: "🚫", texto: "Nunca coloque um disco maior em cima de um menor." },
      { figura: "👆", texto: "Toque na torre para pegar o disco e depois na torre para onde ele vai. Ver a solução mostra o caminho mais curto." },
    ],

    robo: faixa => {
      const robo = faixa && faixa.id === "8-10";
      return [
        { figura: "🤖➜⭐", texto: "Monte um programa para levar o robô até a estrela, desviando das pedras 🪨." },
        robo
          ? { figura: "⬆️ ↺ ↻", texto: "Andar leva o robô uma casa para onde ele está olhando (a setinha vermelha). Esquerda e direita só viram o robô no lugar, como você virando o corpo." }
          : { figura: "⬆️➡️⬇️⬅️", texto: "Cada seta anda uma casa naquela direção." },
        ...(faixa && faixa.id !== "5-6" ? [{ figura: "🪙", texto: "Pegue todas as moedas antes de chegar na estrela." }] : []),
        { figura: "×2", texto: "Toque num comando do programa para ele repetir: ×2, ×3, ×4. Assim o programa fica curtinho!" },
        { figura: "▶️", texto: "Toque em Executar e veja o robô seguir o programa, na ordem." },
        { figura: "⭐⭐⭐", texto: "Use o menor número de comandos para ganhar 3 estrelas." },
      ];
    },

    blocos: [
      { figura: G(["..T..", ".TTT.", ".....", "S...L", "SS.LL", "IIII*"], BLOCOS, escuro),
        texto: "As peças caem lá de cima. Mova para os lados e gire para elas se encaixarem." },
      { figura: [G(["L...", "LIIII"], BLOCOS, escuro), "✨"], texto: "Complete uma linha inteira, sem buracos: ela some e você ganha pontos. Várias linhas de uma vez valem mais!" },
      { figura: "⬅️⬇️➡️", texto: "Polegar esquerdo: mover para os lados e descer." },
      { figura: "⏬ ↻", texto: "Polegar direito: girar a peça e derrubar de uma vez. No tabuleiro também dá: tocar gira, arrastar move." },
      { figura: "🚀", texto: "A cada 10 linhas o nível sobe e as peças caem mais rápido. Se as peças chegarem no topo, o jogo acaba." },
    ],

    "2048": [
      { figura: "👆↔️", texto: "Deslize o dedo para um lado: todos os blocos andam até onde der." },
      { figura: [G(["22..", "...."], { 2: { txt: "2", fundo: "#eee4da" } }, { fundo: "#cdc1b4", borda: "#bbada0" }),
        G(["4...", "...."], { 4: { txt: "4", fundo: "#ede0c8" } }, { fundo: "#cdc1b4", borda: "#bbada0" })],
        texto: "Dois blocos iguais que se encontram viram um só, com a soma: 2 + 2 = 4, 4 + 4 = 8..." },
      { figura: "➕", texto: "A cada jogada aparece um bloco novo, um 2 ou às vezes um 4." },
      { figura: "🏆", texto: "Tente chegar ao 2048! Se a grade encher e não der mais para juntar, o jogo acaba." },
    ],

    minado: [
      { figura: G(["###", "#?#", "###"], MINADO, jardim), texto: "Toque numa casa para abrir. A primeira nunca tem abelha!" },
      { figura: G(["1b#", "11#", "..."].map(l => l.replace(/\./g, " ")), { ...MINADO, " ": { fundo: "#f3dfb5" } }, jardim),
        texto: "O número diz quantas abelhas estão escondidas nas casas em volta dele, contando as diagonais." },
      { figura: G(["1f#", "11#"], MINADO, jardim), texto: "Descobriu onde está uma abelha? Marque com a bandeira 🚩: botão Marcar, ou segure o dedo na casa." },
      { figura: "🏆", texto: "Abra todas as casas que não têm abelha para ganhar." },
    ],

    sudoku: [
      { figura: G(["12.4", "34..", "2.4.", "4..2"], { 1: { txt: "1" }, 2: { txt: "2" }, 3: { txt: "3" }, 4: { txt: "4" } }, { fundo: "#fff", borda: "#555", cel: 24 }),
        texto: "Complete a grade. Em cada linha, cada coluna e cada bloco, cada número aparece uma vez só." },
      { figura: G(["12?4"], { 1: { txt: "1" }, 2: { txt: "2" }, 4: { txt: "4" }, "?": { txt: "3", fundo: "#ffd60a", cor: "#b45309" } }, { fundo: "#fff", borda: "#555", cel: 24 }),
        texto: "Procure a casa onde só um número pode entrar: nesta linha falta o 3!" },
      { figura: "👆", texto: "Toque na casa vazia e depois no número." },
      { figura: "✏️💡", texto: "Anotar escreve números pequenininhos de rascunho. Desfazer volta a jogada, e Dica mostra uma casa." },
    ],

    corredor: [
      { figura: "🦖🐆🐕", texto: "Escolha quem vai correr: o dino, a onça, o caramelo ou a capivara. Ele corre sozinho!" },
      { figura: "👆🌵", texto: "Toque na tela para pular os cactos. Segure o dedo para pular mais alto." },
      { figura: "⬇️🐦", texto: "Aperte abaixar para passar por baixo dos pássaros." },
      { figura: "⭐", texto: "Pegue as estrelas no ar para ganhar pontos. Quanto mais longe, mais pontos, e mais rápido fica!" },
    ],

    plataforma: [
      { figura: "🏃➜🏁", texto: "Leve o Pipo até a bandeira no fim da fase." },
      { figura: "⬅️➡️ ⬆️", texto: "Use as setas para andar e o botão Pular. Segure o pular para ir mais alto." },
      { figura: "👟🐌", texto: "Pule em cima dos bichos bravos para tirar eles do caminho. Encostar neles de lado faz perder uma vida ❤️." },
      { figura: "❓🪙", texto: "Bata a cabeça nos blocos de interrogação, por baixo, para ganhar moedas." },
      { figura: "🚩", texto: "Passou por uma bandeirinha? Se cair, você volta dali. Cuidado com os buracos!" },
    ],

    voador: [
      { figura: "👆🐦", texto: "Cada toque faz o passarinho bater as asas e subir. Sem tocar, ele cai." },
      { figura: "🌳 🐦 🌳", texto: "Passe pelo buraco entre os troncos: cada passagem vale 1 ponto." },
      { figura: "💥", texto: "Não encoste nos troncos, no chão nem no teto." },
      { figura: "🥉🥈🥇", texto: "Medalhas: bronze com 10 pontos, prata com 20 e ouro com 40!" },
    ],

    cobrinha: [
      { figura: G(["........", ".SSS>..@", "........"], { S: { fundo: "#2a9d55" }, ">": { fundo: "#1b7a3e", txt: "•", cor: "#fff" }, "@": { txt: "🍎" } }, { fundo: "#b7e4a7", borda: "#2d6a4f" }),
        texto: "A cobrinha anda sozinha. Escolha a direção com as setas ou deslizando o dedo." },
      { figura: "🍎➜🐍", texto: "Coma para crescer e ganhar pontos." },
      { figura: "💥", texto: "Não bata na parede nem no próprio corpo." },
      { figura: "🔢🔤", texto: "No modo Números, coma em ordem: 1, 2, 3... No modo Letras, coma as letras na ordem da palavra." },
    ],

    tijolos: [
      { figura: "👆↔️", texto: "Arraste o dedo para mover a raquete lá embaixo." },
      { figura: "⚪🧱", texto: "Rebata a bolinha para quebrar todos os tijolos. Alguns precisam de duas batidas." },
      { figura: "↖️⬆️↗️", texto: "Bateu no meio da raquete, a bolinha sobe reta; na ponta, sai inclinada. Use isso para mirar!" },
      { figura: "🟩⚪🐢", texto: "Às vezes cai um poder: raquete maior, bolinha extra ou bolinha mais lenta. Pegue com a raquete!" },
      { figura: "❤️", texto: "Não deixe a bolinha cair! Cada vez que ela cai, você perde uma vida." },
    ],

    nave: [
      { figura: "👆↔️🚀", texto: "Mova a nave arrastando o dedo ou segurando as setas." },
      { figura: "🔥👾", texto: "Atire nos alienígenas antes que eles cheguem lá embaixo. Os pequenos têm tiro automático!" },
      { figura: "🛡️", texto: "Esconda-se atrás dos escudos, mas eles se gastam com os tiros." },
      { figura: "🛸", texto: "Quando a nave-mãe passar lá em cima, acerte ela: vale muitos pontos!" },
    ],

    labirinto: [
      { figura: "👆↔️↕️", texto: "Deslize o dedo ou use as setas para guiar o Comilão pelo labirinto." },
      { figura: "😮• • •", texto: "Coma todos os pontinhos para passar de fase." },
      { figura: "👻", texto: "Fuja dos fantasmas!" },
      { figura: "🍒➜💙👻", texto: "Comeu uma cereja? Os fantasmas ficam azuis e assustados: aí é você que come eles!" },
      { figura: "↔️", texto: "Os túneis dos lados levam para o outro lado do labirinto." },
    ],

    "caca-palavras": faixa => [
      { figura: G(["GATOX", "QBOLA", "SOLRK"], { G: { txt: "G", fundo: "#ffd60a" }, A: { txt: "A" }, T: { txt: "T" }, O: { txt: "O" }, X: { txt: "X" }, Q: { txt: "Q" }, B: { txt: "B" }, L: { txt: "L" }, S: { txt: "S" }, R: { txt: "R" }, K: { txt: "K" } }, { fundo: "#fff", borda: "#999", linha: [[0, 0], [0, 3]] }),
        texto: "As palavras da lista estão escondidas no meio das letras." },
      { figura: "👆➜", texto: "Passe o dedo da primeira até a última letra da palavra, ou toque na primeira e depois na última." },
      { figura: faixa && faixa.id === "5-6" ? "➡️⬇️" : "➡️⬇️↘️↗️", texto: faixa && faixa.id === "5-6"
        ? "As palavras ficam deitadas ou em pé." : "As palavras podem estar deitadas, em pé ou na diagonal. As letras ficam sem acento." },
    ],

    memoria: faixa => (pequeno(faixa) ? null : [
      { figura: "🃏🃏", texto: "Vire duas cartas tocando nelas." },
      { figura: "🐶🐶", texto: "Se forem iguais, elas ficam abertas. Se forem diferentes, viram de novo: lembre onde elas estavam!" },
      { figura: "🏆", texto: "Ache todos os pares com o menor número de jogadas." },
    ]),

    cubo: [
      { figura: "🔤", texto: "Cada letra é uma face: U cima, D baixo, L esquerda, R direita, F frente e B trás. Com o tracinho, gira ao contrário." },
      { figura: "👆🔄", texto: "Arraste o dedo no cubo para ver os outros lados. Os botões coloridos giram as faces." },
      { figura: "🎬📘", texto: "Comece pelas Demonstrações e pelo Aprender: lá você aprende o método das camadas, passo a passo." },
      { figura: "🤖", texto: "No modo livre, embaralhe e toque em Resolver: eu mostro a solução, e você pode fazer junto." },
      { figura: "🚀", texto: "Já sabe resolver? No Avançado tem o método CFOP, com os casos desenhados, treino de reconhecer casos e desenhos bonitos no cubo." },
    ],
  };

  JOGOS.forEach(j => { if (AJUDAS[j.id]) j.ajuda = AJUDAS[j.id]; });
  // Jogos sem tela inicial: o ❓ fica sempre no canto
  ["caca-palavras", "memoria"].forEach(id => { const j = JOGOS.find(x => x.id === id); if (j) j.ajudaSempre = true; });
})();
