// Letras — alfabeto com palavra-exemplo ("A de Abelha").
(() => {
  // `fala`: como a voz deve pronunciar o nome da letra (sozinha, "A" vira artigo).
  const LETRAS = [
    { nome: "A", fala: "á",       palavra: "abelha",     emoji: "🐝" },
    { nome: "B", fala: "bê",      palavra: "bola",       emoji: "⚽" },
    { nome: "C", fala: "cê",      palavra: "casa",       emoji: "🏠" },
    { nome: "D", fala: "dê",      palavra: "dado",       emoji: "🎲" },
    { nome: "E", fala: "é",       palavra: "elefante",   emoji: "🐘" },
    { nome: "F", fala: "éfe",     palavra: "foca",       emoji: "🦭" },
    { nome: "G", fala: "gê",      palavra: "gato",       emoji: "🐱" },
    { nome: "H", fala: "agá",     palavra: "hipopótamo", emoji: "🦛" },
    { nome: "I", fala: "í",       palavra: "igreja",     emoji: "⛪" },
    { nome: "J", fala: "jóta",    palavra: "jacaré",     emoji: "🐊" },
    { nome: "K", fala: "cá",      palavra: "kiwi",       emoji: "🥝" },
    { nome: "L", fala: "éle",     palavra: "leão",       emoji: "🦁" },
    { nome: "M", fala: "ême",     palavra: "macaco",     emoji: "🐒" },
    { nome: "N", fala: "êne",     palavra: "navio",      emoji: "🚢" },
    { nome: "O", fala: "ó",       palavra: "ovo",        emoji: "🥚" },
    { nome: "P", fala: "pê",      palavra: "pato",       emoji: "🦆" },
    { nome: "Q", fala: "quê",     palavra: "queijo",     emoji: "🧀" },
    { nome: "R", fala: "érre",    palavra: "rato",       emoji: "🐭" },
    { nome: "S", fala: "ésse",    palavra: "sol",        emoji: "☀️" },
    { nome: "T", fala: "tê",      palavra: "tomate",     emoji: "🍅" },
    { nome: "U", fala: "ú",       palavra: "uva",        emoji: "🍇" },
    { nome: "V", fala: "vê",      palavra: "vaca",       emoji: "🐮" },
    { nome: "W", fala: "dáblio",  palavra: "waffle",     emoji: "🧇" },
    { nome: "X", fala: "xis",     palavra: "xícara",     emoji: "☕" },
    { nome: "Y", fala: "ípsilon", palavra: "yakisoba",   emoji: "🍜" },
    { nome: "Z", fala: "zê",      palavra: "zebra",      emoji: "🦓" },
  ];
  // K, W e Y têm palavras estrangeiras: ficam fora do desafio "primeira letra"
  const COMUNS = LETRAS.filter(l => !"KWY".includes(l.nome));

  const maiuscula = t => t[0].toUpperCase() + t.slice(1);

  function letraComFigura(item, b) {
    b.classList.add("letra", "com-figura"); // letra e figura, as duas grandes
    b.innerHTML = `<span></span><span class="mini"></span>`;
    b.children[0].textContent = item.nome;
    b.children[1].textContent = item.emoji;
  }

  JOGOS.push({
    id: "letras",
    nome: "Letras",
    icone: "🔤",
    faixas: ["4-5", "5-6"],
    iniciar(area) {
      Motor.escolherModo(area, [
        {
          icone: "👆", rotulo: "Alfabeto",
          iniciar: () => Motor.modoExplorar({
            area, itens: LETRAS, porTela: 4, emOrdem: true, desenhar: letraComFigura,
            aoTocar: l => Motor.falar(`${l.fala}. ${maiuscula(l.fala)} de ${l.palavra}!`),
          }),
        },
        {
          icone: "❓", rotulo: "Cadê a letra?",
          iniciar: () => Motor.modoCade({
            area, itens: LETRAS, opcoes: 3, desenhar: Motor.desenharTexto("letra"),
            pergunta: l => `Cadê a letra ${l.fala}?`,
          }),
        },
        {
          icone: "🐝", rotulo: "Primeira letra",
          iniciar: () => Motor.modoQuiz({
            area, rodada: 10, desenhar: Motor.desenharTexto("letra"),
            gerar() {
              const certa = Motor.sortear(COMUNS);
              const outras = Motor.embaralhar(COMUNS.filter(l => l !== certa)).slice(0, 2);
              return {
                pergunta: `${maiuscula(certa.palavra)}. Com que letra começa ${certa.palavra}?`,
                opcoes: [certa, ...outras],
                certa,
                mostrar: el => { el.innerHTML = `<span class="grande"></span>`; el.firstChild.textContent = certa.emoji; },
              };
            },
            aoAcertar: l => Motor.falar(`${maiuscula(l.fala)} de ${l.palavra}!`),
          }),
        },
      ]);
    },
  });
})();
