// Histórias — ler (ou ouvir) um texto curto e responder perguntas de interpretação.
(() => {
  // Cada pergunta: [pergunta, resposta certa, errada, errada]
  const HISTORIAS = [
    {
      titulo: "O boto cor-de-rosa", emoji: "🛶",
      texto: "Pedro mora perto do rio Negro, em Manaus. Todo sábado ele passeia de canoa com o avô. Um dia, os dois viram um boto cor-de-rosa pulando na água. Pedro ficou tão feliz que contou a novidade para toda a escola.",
      perguntas: [
        ["Onde Pedro mora?", "Perto do rio Negro", "Na praia", "Na montanha"],
        ["Com quem Pedro passeia de canoa?", "Com o avô", "Com a mãe", "Com o professor"],
        ["Que animal eles viram?", "Um boto cor-de-rosa", "Um jacaré", "Uma onça"],
      ],
    },
    {
      titulo: "A festa da Ana", emoji: "🎂",
      texto: "Ana fez sete anos no domingo. A mãe dela preparou um bolo de chocolate. Os amigos trouxeram balões azuis e amarelos. No fim da festa, Ana agradeceu a todos com um abraço bem apertado.",
      perguntas: [
        ["Quantos anos Ana fez?", "Sete", "Cinco", "Dez"],
        ["De que era o bolo?", "De chocolate", "De morango", "De cenoura"],
        ["Como Ana agradeceu aos amigos?", "Com um abraço", "Com um desenho", "Com uma música"],
      ],
    },
    {
      titulo: "O cachorrinho na chuva", emoji: "🐶",
      texto: "Lucas encontrou um cachorrinho molhado na chuva. Ele levou o cachorro para casa e deu comida e um cobertor. No dia seguinte, a dona apareceu procurando o bichinho. Ela agradeceu e deixou Lucas visitar o cachorro sempre que quisesse.",
      perguntas: [
        ["Onde Lucas encontrou o cachorro?", "Na chuva", "Na escola", "No mercado"],
        ["O que Lucas deu ao cachorro?", "Comida e um cobertor", "Uma bola", "Um banho de mar"],
        ["O que a dona deixou Lucas fazer?", "Visitar o cachorro", "Ficar com o cachorro", "Mudar o nome do cachorro"],
      ],
    },
    {
      titulo: "A horta da escola", emoji: "🥬",
      texto: "A turma da professora Rita plantou uma horta. Cada aluno cuidou de uma planta. Júlia plantou alface e Davi plantou tomate. Depois de algumas semanas, a turma fez uma salada para a merenda.",
      perguntas: [
        ["Qual é o nome da professora?", "Rita", "Júlia", "Ana"],
        ["O que Davi plantou?", "Tomate", "Alface", "Cenoura"],
        ["O que a turma fez com a horta?", "Uma salada", "Um bolo", "Um suco"],
      ],
    },
    {
      titulo: "A chuva na floresta", emoji: "🌧️",
      texto: "Na floresta amazônica chove quase todos os dias. A chuva ajuda as árvores a crescerem bem altas. Muitos animais, como macacos e araras, vivem lá no alto, nas copas das árvores. Por isso é tão importante cuidar da floresta.",
      perguntas: [
        ["Como é a chuva na floresta amazônica?", "Chove quase todo dia", "Nunca chove", "Só chove no Natal"],
        ["O que a chuva ajuda a fazer?", "As árvores crescerem", "Os rios secarem", "As pedras crescerem"],
        ["Onde vivem os macacos e as araras?", "Nas copas das árvores", "Debaixo da terra", "No fundo do rio"],
      ],
    },
    {
      titulo: "O sonho de Maria", emoji: "🚀",
      texto: "Maria quer ser astronauta. Ela adora olhar as estrelas com a luneta do tio. Na biblioteca, ela leu um livro sobre a Lua. Aprendeu que a Lua não tem luz própria: ela reflete a luz do Sol.",
      perguntas: [
        ["O que Maria quer ser?", "Astronauta", "Médica", "Cantora"],
        ["Onde Maria leu sobre a Lua?", "Na biblioteca", "No jornal", "Numa revista"],
        ["De onde vem a luz da Lua?", "Do Sol", "Da própria Lua", "Das nuvens"],
      ],
    },
    {
      titulo: "O jogo no recreio", emoji: "⚽",
      texto: "No recreio, meninos e meninas jogaram futebol juntos. O time azul fez dois gols e o time verde fez três. Mesmo perdendo, Tiago cumprimentou os colegas do outro time e disse que o jogo foi divertido.",
      perguntas: [
        ["Quantos gols o time verde fez?", "Três", "Dois", "Um"],
        ["Qual time ganhou?", "O verde", "O azul", "Deu empate"],
        ["O que Tiago fez depois do jogo?", "Cumprimentou os colegas", "Foi embora bravo", "Pegou a bola e saiu"],
      ],
    },
    {
      titulo: "A tartaruga e a semente", emoji: "🐢",
      texto: "Uma tartaruga achou uma semente no caminho. Ela cavou um buraco e plantou a semente com cuidado. Todos os dias, levava um pouquinho de água. Meses depois, nasceu uma árvore que fazia sombra para todos os bichos da floresta.",
      perguntas: [
        ["O que a tartaruga achou?", "Uma semente", "Uma pedra", "Uma folha"],
        ["O que ela fazia todos os dias?", "Levava água", "Dormia", "Cantava"],
        ["O que a árvore fazia para os bichos?", "Sombra", "Barulho", "Frio"],
      ],
    },
  ];

  JOGOS.push({
    id: "historias",
    nome: "Histórias",
    icone: "📖",
    faixas: ["6-8", "8-10"],
    iniciar(area) {
      let indice = Motor.aleatorio(0, HISTORIAS.length - 1);
      let pergunta = 0;
      let historia = HISTORIAS[indice];

      Motor.modoQuiz({
        area, rodada: 3, desenhar: Motor.desenharTexto("palavra"), classeEnunciado: "historia",
        gerar() {
          // Terminou as perguntas desta história? Passa para a próxima.
          if (pergunta >= historia.perguntas.length) {
            indice = (indice + 1) % HISTORIAS.length;
            historia = HISTORIAS[indice];
            pergunta = 0;
          }
          const [texto, ...respostas] = historia.perguntas[pergunta++];
          const opcoes = respostas.map(nome => ({ nome }));
          const h = historia;
          return {
            pergunta: texto,
            opcoes, certa: opcoes[0],
            mostrar: el => {
              el.innerHTML = `<div class="titulo-historia"></div><div class="texto-historia"></div><div class="pergunta-historia"></div>`;
              el.children[0].textContent = `${h.emoji} ${h.titulo}`;
              el.children[1].textContent = h.texto;
              el.children[2].textContent = texto;
              const ouvir = document.createElement("button");
              ouvir.className = "ouvir";
              ouvir.textContent = "🔊 Ouvir a história";
              ouvir.addEventListener("click", () => Motor.falar(`${h.titulo}. ${h.texto}`));
              el.appendChild(ouvir);
            },
          };
        },
      });
    },
  });
})();
