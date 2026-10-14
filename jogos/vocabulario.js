// Jogos de vocabulário (Explorar + Cadê?): corpo, veículos, frutas e emoções.
(() => {
  JOGOS.push(Motor.vocabulario({
    id: "corpo", nome: "Meu Corpo", icone: "👃", faixas: ["1-2", "2-3"],
    itens: [
      { emoji: "👃", nome: "nariz",  artigo: "o" },
      { emoji: "👀", nome: "olhos",  artigo: "os" },
      { emoji: "👄", nome: "boca",   artigo: "a" },
      { emoji: "👂", nome: "orelha", artigo: "a" },
      { emoji: "✋", nome: "mão",    artigo: "a" },
      { emoji: "🦶", nome: "pé",     artigo: "o" },
      { emoji: "🦷", nome: "dente",  artigo: "o" },
      { emoji: "👅", nome: "língua", artigo: "a" },
      { emoji: "💪", nome: "braço",  artigo: "o" },
      { emoji: "🦵", nome: "perna",  artigo: "a" },
    ],
  }));

  JOGOS.push(Motor.vocabulario({
    id: "veiculos", nome: "Veículos", icone: "🚗", faixas: ["1-2", "2-3"],
    itens: [
      { emoji: "🚗", nome: "carro",       artigo: "o", fala: "Bi bi! O carro!" },
      { emoji: "🚌", nome: "ônibus",      artigo: "o", fala: "Fom fom! O ônibus!" },
      { emoji: "✈️", nome: "avião",       artigo: "o", fala: "Vuuuum! O avião!" },
      { emoji: "🚢", nome: "navio",       artigo: "o", fala: "Fóóóm! O navio!" },
      { emoji: "🚂", nome: "trem",        artigo: "o", fala: "Piuííí! O trem!" },
      { emoji: "🚲", nome: "bicicleta",   artigo: "a", fala: "Trim trim! A bicicleta!" },
      { emoji: "🚁", nome: "helicóptero", artigo: "o", fala: "Tá tá tá tá! O helicóptero!" },
      { emoji: "🚒", nome: "caminhão de bombeiros", artigo: "o", fala: "Uóóó uóóó! O caminhão de bombeiros!" },
      { emoji: "🚑", nome: "ambulância",  artigo: "a", fala: "Iiuu iiuu! A ambulância!" },
      { emoji: "🛶", nome: "canoa",       artigo: "a", fala: "Plic ploc! A canoa no rio!" },
      { emoji: "🏍️", nome: "moto",        artigo: "a", fala: "Vrum vrum! A moto!" },
      { emoji: "🚜", nome: "trator",      artigo: "o", fala: "Tuc tuc tuc! O trator!" },
    ],
  }));

  JOGOS.push(Motor.vocabulario({
    id: "frutas", nome: "Frutas", icone: "🍎", faixas: ["2-3", "3-4"],
    itens: [
      { emoji: "🍎", nome: "maçã",     artigo: "a" },
      { emoji: "🍌", nome: "banana",   artigo: "a" },
      { emoji: "🍇", nome: "uva",      artigo: "a" },
      { emoji: "🍊", nome: "laranja",  artigo: "a" },
      { emoji: "🍉", nome: "melancia", artigo: "a" },
      { emoji: "🍓", nome: "morango",  artigo: "o" },
      { emoji: "🍍", nome: "abacaxi",  artigo: "o" },
      { emoji: "🥭", nome: "manga",    artigo: "a" },
      { emoji: "🥥", nome: "coco",     artigo: "o" },
      { emoji: "🍐", nome: "pera",     artigo: "a" },
      { emoji: "🥑", nome: "abacate",  artigo: "o" },
      { emoji: "🍋", nome: "limão",    artigo: "o" },
    ],
  }));

  JOGOS.push(Motor.vocabulario({
    id: "emocoes", nome: "Emoções", icone: "😀", faixas: ["2-3", "3-4", "4-5"],
    itens: [
      { emoji: "😀", nome: "feliz",       artigo: "o", fala: "Feliz! Quando ganho um abraço, fico feliz." },
      { emoji: "😢", nome: "triste",      artigo: "o", fala: "Triste. Quando estou triste, posso chorar e pedir colo." },
      { emoji: "😠", nome: "bravo",       artigo: "o", fala: "Bravo! Quando estou bravo, respiro fundo." },
      { emoji: "😮", nome: "surpreso",    artigo: "o", fala: "Surpreso! Uau, que surpresa!" },
      { emoji: "😴", nome: "com sono",    artigo: "o", fala: "Com sono. Hora de dormir!" },
      { emoji: "😨", nome: "com medo",    artigo: "o", fala: "Com medo. Quando tenho medo, chamo alguém que eu amo." },
      { emoji: "😂", nome: "rindo",       artigo: "o", fala: "Rindo! Ha ha ha, que engraçado!" },
      { emoji: "🥰", nome: "apaixonado",  artigo: "o", fala: "Cheio de amor!" },
    ],
    pergunta: i => `Cadê o rostinho ${i.nome}?`,
  }));
})();
