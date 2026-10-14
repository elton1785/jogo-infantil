// Vogais — A E I O U: conhecer, achar e descobrir com qual começa a palavra.
(() => {
  const VOGAIS = [
    { nome: "A", fala: "á", cor: "#e63946", palavras: [["abelha", "🐝"], ["avião", "✈️"], ["abacaxi", "🍍"], ["árvore", "🌳"], ["anel", "💍"]] },
    { nome: "E", fala: "é", cor: "#277da1", palavras: [["elefante", "🐘"], ["estrela", "⭐"], ["escada", "🪜"], ["escova", "🪥"]] },
    { nome: "I", fala: "í", cor: "#2a9d55", palavras: [["igreja", "⛪"], ["ilha", "🏝️"], ["ímã", "🧲"], ["ioiô", "🪀"]] },
    { nome: "O", fala: "ó", cor: "#f77f00", palavras: [["ovo", "🥚"], ["olho", "👁️"], ["óculos", "👓"], ["onça", "🐆"], ["ônibus", "🚌"]] },
    { nome: "U", fala: "ú", cor: "#7b2cbf", palavras: [["uva", "🍇"], ["urso", "🐻"], ["unicórnio", "🦄"], ["unha", "💅"]] },
  ];

  function vogalColorida(item, b) {
    b.classList.add("letra");
    b.innerHTML = `<span></span><span class="mini"></span>`;
    b.children[0].textContent = item.nome;
    b.children[0].style.color = item.cor;
    b.children[1].textContent = item.palavras[0][1];
  }

  function soLetra(item, b) {
    b.classList.add("letra");
    b.textContent = item.nome;
    b.style.color = item.cor;
  }

  JOGOS.push({
    id: "vogais",
    nome: "Vogais",
    icone: "🅰️",
    faixas: ["3-4", "4-5"],
    iniciar(area, faixa) {
      const opcoes = faixa && faixa.id === "4-5" ? 3 : 2;
      Motor.escolherModo(area, [
        {
          icone: "👆", rotulo: "Conhecer",
          iniciar: () => Motor.modoExplorar({
            area, itens: VOGAIS, porTela: 5, emOrdem: true, desenhar: vogalColorida,
            aoTocar: (v, cartao) => {
              // A figura do cartão troca junto com a palavra falada (sempre combinando)
              const [p, emoji] = Motor.sortear(v.palavras);
              cartao.querySelector(".mini").textContent = emoji;
              Motor.falar(`${Motor.maiuscula(v.fala)}! ${Motor.maiuscula(v.fala)} de ${p}!`);
            },
          }),
        },
        {
          icone: "❓", rotulo: "Cadê a vogal?",
          iniciar: () => Motor.modoCade({ area, itens: VOGAIS, opcoes, desenhar: soLetra, pergunta: v => `Cadê a letra ${v.fala}?` }),
        },
        {
          icone: "🐝", rotulo: "Começa com?",
          iniciar: () => Motor.modoQuiz({
            area, desenhar: soLetra,
            gerar() {
              const certa = Motor.sortear(VOGAIS);
              const [palavra, emoji] = Motor.sortear(certa.palavras);
              const outras = Motor.embaralhar(VOGAIS.filter(v => v !== certa)).slice(0, opcoes - 1);
              return {
                pergunta: `${Motor.maiuscula(palavra)}. Com que letra começa ${palavra}?`,
                opcoes: [certa, ...outras], certa,
                mostrar: el => { el.innerHTML = `<span class="grande"></span>`; el.firstChild.textContent = emoji; },
                palavra,
              };
            },
            aoAcertar: (v, q) => Motor.falar(`${Motor.maiuscula(v.fala)} de ${q.palavra}!`),
          }),
        },
      ]);
    },
  });
})();
