// Cubo mágico — conteúdo do modo "🚀 Avançado" (para quem já resolve pelo método das camadas).
// Usado por jogos/cubo.js. Todos os algoritmos foram conferidos num simulador: os da última
// camada só mexem na camada de cima, e os desenhos dos casos são gerados a partir deles.
//
// Cada grupo: { id, titulo, icone, intro, vista, itens: [{ nome, alg, texto, reconhecer }] }
// - vista "meios": vista de cima só com os meios (1ª olhada da OLL, os cantos não importam)
// - vista "oll":   vista de cima, amarelo × cinza (2ª olhada da OLL)
// - vista "pll":   vista de cima com todas as cores (PLL)
// - vista "3d":    cubo em perspectiva (F2L e desenhos)
// - padrao: true → a lição começa com o cubo pronto e o algoritmo FAZ o desenho
//   (nos outros, o cubo começa no caso e o algoritmo resolve).
const CUBO_AVANCADO = [
  {
    id: "oll1", titulo: "Cruz amarela (OLL 1)", icone: "➕", vista: "meios",
    intro: "No método CFOP, a camada de cima é feita em 4 olhadas. Na primeira, fazemos a cruz amarela. Olhe só para os meios: o centro, e os meios amarelos em cima.",
    itens: [
      { nome: "Linha", alg: "F R U R' U' F'",
        reconhecer: "Uma linha amarela deitada, da esquerda para a direita.",
        texto: "Com a linha deitada, faça F, R, U, R linha, U linha, F linha." },
      { nome: "L (cantinho)", alg: "F U R U' R' F'",
        reconhecer: "Um L amarelo: um meio atrás e outro à esquerda.",
        texto: "Deixe o L apontando para trás e para a esquerda e faça F, U, R, U linha, R linha, F linha." },
      { nome: "Ponto", alg: "F R U R' U' F' f R U R' U' f'",
        reconhecer: "Só o centro é amarelo: nenhum meio amarelo em cima.",
        texto: "Só o ponto do centro? Faça o algoritmo da linha e depois o mesmo com f minúsculo, que gira duas camadas da frente juntas." },
    ],
  },
  {
    id: "oll2", titulo: "Face amarela (OLL 2)", icone: "🟨", vista: "oll",
    intro: "Na segunda olhada, com a cruz pronta, deixamos toda a face de cima amarela. São 7 casos. Conte quantos cantos já estão amarelos em cima e veja para onde olha o amarelo dos outros.",
    itens: [
      { nome: "Sune (peixinho)", alg: "R U R' U R U2 R'",
        reconhecer: "Só um canto amarelo em cima: é o peixinho. Deixe esse canto na frente, à esquerda.",
        texto: "O Sune: R, U, R linha, U, R, U2, R linha." },
      { nome: "Anti-Sune", alg: "R U2 R' U' R U' R'",
        reconhecer: "Também um canto só, mas o peixinho está virado para o outro lado. Deixe o canto amarelo atrás, à direita.",
        texto: "O Anti-Sune é o Sune de trás para frente: R, U2, R linha, U linha, R, U linha, R linha." },
      { nome: "H (dois pares de faróis)", alg: "R U R' U R U' R' U R U2 R'",
        reconhecer: "Nenhum canto amarelo em cima. Os amarelos olham dois para a esquerda e dois para a direita.",
        texto: "Este é um Sune comprido: R U R linha U, três vezes R U linha R linha U, e termina com R U2 R linha." },
      { nome: "Pi", alg: "R U2 R2 U' R2 U' R2 U2 R",
        reconhecer: "Nenhum canto amarelo em cima. Dois amarelos olham para a esquerda; os da direita olham um para a frente e outro para trás.",
        texto: "O Pi: R, U2, R2, U linha, R2, U linha, R2, U2, R." },
      { nome: "Faróis (U)", alg: "R2 D R' U2 R D' R' U2 R'",
        reconhecer: "Dois cantos amarelos atrás. Na frente, os dois cantos olham para você, como faróis de carro.",
        texto: "Os faróis: R2, D, R linha, U2, R, D linha, R linha, U2, R linha. O D mexe embaixo, mas tudo volta no final!" },
      { nome: "T", alg: "r U R' U' r' F R F'",
        reconhecer: "Dois cantos amarelos à direita. Os da esquerda olham um para a frente e outro para trás.",
        texto: "O r minúsculo gira duas camadas da direita juntas: r, U, R linha, U linha, r linha, F, R, F linha." },
      { nome: "Gravatinha (L)", alg: "F' r U R' U' r' F R",
        reconhecer: "Dois cantos amarelos em diagonal: um na frente à esquerda e outro atrás à direita.",
        texto: "A gravatinha: F linha, r, U, R linha, U linha, r linha, F, R." },
    ],
  },
  {
    id: "pll1", titulo: "Cantos de cima (PLL 1)", icone: "🔦", vista: "pll",
    intro: "Na terceira olhada, a face de cima já é toda amarela. Agora trocamos os cantos de lugar. Procure faróis: um lado com os dois cantos da mesma cor.",
    itens: [
      { nome: "Faróis: T-perm", alg: "R U R' U' R' F R2 U' R' U' R U R' F'",
        reconhecer: "Um lado tem faróis, os dois cantos da mesma cor. Deixe os faróis à esquerda.",
        texto: "O T-perm troca os dois cantos da direita: R U R linha U linha, R linha F R2, U linha R linha U linha, R U R linha F linha." },
      { nome: "Diagonal: Y-perm", alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        reconhecer: "Nenhum lado tem faróis: os cantos estão trocados em diagonal.",
        texto: "O Y-perm troca dois cantos em diagonal. É comprido, mas começa e termina com F!" },
    ],
  },
  {
    id: "pll2", titulo: "Meios de cima (PLL 2)", icone: "🔄", vista: "pll",
    intro: "Na última olhada, os cantos já estão certos e só falta trocar os meios de cima. São 4 casos.",
    itens: [
      { nome: "Ua (anti-horário)", alg: "R U' R U R U R U' R' U' R2",
        reconhecer: "Um lado está pronto: deixe ele atrás. Os outros 3 meios andam ao contrário do relógio, olhando de cima.",
        texto: "O Ua: R U linha R U, R U R U linha, R linha U linha R2." },
      { nome: "Ub (horário)", alg: "R2 U R U R' U' R' U' R' U R'",
        reconhecer: "Um lado está pronto: deixe ele atrás. Os outros 3 meios andam no sentido do relógio.",
        texto: "O Ub: R2 U R U, R linha U linha R linha U linha, R linha U R linha." },
      { nome: "H (troca em cruz)", alg: "M2 U M2 U2 M2 U M2",
        reconhecer: "Nenhum lado pronto. Cada meio troca com o do lado oposto: frente com trás, esquerda com direita.",
        texto: "O M é a camada do meio, entre a esquerda e a direita: M2, U, M2, U2, M2, U, M2." },
      { nome: "Z (troca vizinha)", alg: "M2 U M2 U M' U2 M2 U2 M' U2",
        reconhecer: "Nenhum lado pronto. Cada meio troca com o vizinho: frente com direita, trás com esquerda.",
        texto: "O Z: M2 U M2 U, M linha U2 M2 U2, M linha U2." },
    ],
  },
  {
    id: "f2l", titulo: "Pares do F2L", icone: "👫", vista: "3d",
    intro: "No CFOP, depois da cruz branca, juntamos cada canto branco com o seu meio, formando um par, e encaixamos os dois de uma vez. Isso é o F2L: as duas primeiras camadas juntas. Estes são os 4 casos básicos, com o lugar do par na frente, à direita.",
    itens: [
      { nome: "Afastados: direita", alg: "R U R'",
        reconhecer: "O canto está em cima, na frente à direita, com o branco olhando para a direita. O meio está lá atrás.",
        texto: "R abre o lugar, U junta o par e R linha desce os dois: R, U, R linha." },
      { nome: "Afastados: frente", alg: "F' U' F",
        reconhecer: "O canto está em cima, na frente à direita, com o branco olhando para a frente. O meio está à esquerda.",
        texto: "O espelho do anterior: F linha, U linha, F." },
      { nome: "Lado a lado: direita", alg: "U R U' R'",
        reconhecer: "O canto, com o branco olhando para a frente, e o meio estão lado a lado em cima, à direita.",
        texto: "U afasta o par do lugar, e R U linha R linha desce os dois juntos: U, R, U linha, R linha." },
      { nome: "Lado a lado: frente", alg: "U' F' U F",
        reconhecer: "O canto, com o branco olhando para a direita, e o meio estão lado a lado em cima, na frente.",
        texto: "U linha, F linha, U, F." },
    ],
  },
  {
    id: "desenhos", titulo: "Desenhos no cubo", icone: "🎨", vista: "3d", padrao: true,
    intro: "Os algoritmos também fazem desenhos bonitos! Comece com o cubo pronto e siga o algoritmo.",
    itens: [
      { nome: "Xadrez", alg: "R2 L2 U2 D2 F2 B2",
        reconhecer: "Cada face fica como um tabuleiro de xadrez.",
        texto: "Cada face gira duas vezes: R2, L2, U2, D2, F2, B2." },
      { nome: "Pontinhos", alg: "U D' R L' F B' U D'",
        reconhecer: "Cada face fica de uma cor só, com o centro diferente.",
        texto: "Faces opostas giram para lados contrários: U D linha, R L linha, F B linha, U D linha." },
      { nome: "Cruz", alg: "U F B' L2 U2 L2 F' B U2 L2 U",
        reconhecer: "Cada face fica com uma cruz, e os cantos de outra cor.",
        texto: "Siga o algoritmo com calma: são 11 movimentos." },
      { nome: "Cubo no cubo", alg: "F L F U' R U F2 L2 U' L' B D' B' L2 U",
        reconhecer: "Parece que há um cubo menor dentro do cubo!",
        texto: "Este é comprido: 15 movimentos. No final, olhe o canto da frente!" },
      { nome: "Superflip", alg: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2",
        reconhecer: "Todas as peças no lugar, mas todos os meios virados ao contrário.",
        texto: "O superflip é famoso: é uma das posições mais difíceis de resolver, e precisa de 20 movimentos." },
    ],
  },
];

// Os métodos de resolver o cubo (tela "Conheça os métodos")
const CUBO_METODOS = [
  { icone: "🪜", nome: "Camadas (iniciante)",
    texto: "O que você aprendeu aqui: cruz branca, cantos brancos, segunda camada, e a camada de cima em 4 passos. Usa poucos algoritmos e é ótimo para começar." },
  { icone: "🚀", nome: "CFOP (Fridrich)",
    texto: "O método mais usado pelos mais rápidos do mundo. Cruz, F2L (os pares canto + meio), OLL (face de cima amarela) e PLL (peças de cima no lugar). Comece pelas 4 olhadas, que usam só 16 algoritmos; depois dá para aprender a OLL completa (57 casos) e a PLL completa (21 casos)." },
  { icone: "🧱", nome: "Roux",
    texto: "Monta dois blocos, um de cada lado, e depois resolve o resto quase só com U e M, a camada do meio. Usa poucos movimentos." },
  { icone: "🧭", nome: "ZZ",
    texto: "Começa arrumando a orientação de todos os meios. Depois, as duas primeiras camadas se resolvem só com R, U e L, sem girar o cubo." },
  { icone: "🗺️", nome: "O caminho",
    texto: "Camadas → CFOP em 4 olhadas → pares do F2L sem pensar → OLL e PLL completas. Treine um algoritmo de cada vez, devagar, até a mão fazer sozinha!" },
];
