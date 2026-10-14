// Sons dos Animais — para sons reais, coloque sons/animais/<id>.mp3
// (ex.: sons/animais/cachorro.mp3). Sem o arquivo, a voz do aparelho fala o som.
(() => {
  const ANIMAIS = [
    { id: "cachorro", emoji: "🐶", nome: "cachorro", artigo: "o", som: "Au au!" },
    { id: "gato",     emoji: "🐱", nome: "gato",     artigo: "o", som: "Miau!" },
    { id: "vaca",     emoji: "🐮", nome: "vaca",     artigo: "a", som: "Muuuu!" },
    { id: "porco",    emoji: "🐷", nome: "porco",    artigo: "o", som: "Óinc óinc!" },
    { id: "pato",     emoji: "🦆", nome: "pato",     artigo: "o", som: "Quá quá!" },
    { id: "galo",     emoji: "🐓", nome: "galo",     artigo: "o", som: "Cocoricó!" },
    { id: "ovelha",   emoji: "🐑", nome: "ovelha",   artigo: "a", som: "Mééé!" },
    { id: "cavalo",   emoji: "🐴", nome: "cavalo",   artigo: "o", som: "Iirrí!" },
    { id: "leao",     emoji: "🦁", nome: "leão",     artigo: "o", som: "Roaar!" },
    { id: "sapo",     emoji: "🐸", nome: "sapo",     artigo: "o", som: "Croác croác!" },
    { id: "abelha",   emoji: "🐝", nome: "abelha",   artigo: "a", som: "Zzzzz!" },
    { id: "pintinho", emoji: "🐤", nome: "pintinho", artigo: "o", som: "Piu piu!" },
  ];

  const somDo = a => Motor.tocarSom(`animais/${a.id}.mp3`, a.som);

  JOGOS.push({
    id: "animais",
    nome: "Sons dos Animais",
    icone: "🐮",
    faixas: ["1-2", "2-3"],
    iniciar(area) {
      Motor.escolherModo(area, [
        {
          icone: "👆", rotulo: "Explorar",
          iniciar: () => Motor.modoExplorar({
            area, itens: ANIMAIS, porTela: 4,
            aoTocar: async a => {
              const s = Motor.sessaoAtual();
              await somDo(a);
              if (s === Motor.sessaoAtual()) Motor.falar(`${a.artigo === "a" ? "A" : "O"} ${a.nome}!`);
            },
          }),
        },
        {
          icone: "❓", rotulo: "Cadê?",
          iniciar: () => Motor.modoCade({
            area, itens: ANIMAIS, opcoes: 2,
            pergunta: a => `Cadê ${a.artigo} ${a.nome}?`,
            aoAcertar: somDo,
          }),
        },
      ]);
    },
  });
})();
