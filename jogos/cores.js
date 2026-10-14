// Cores — explorar as cores e depois achar a cor pedida.
(() => {
  const CORES = [
    { id: "vermelho", nome: "vermelho", cor: "#e63946", exemplo: "como o morango" },
    { id: "azul",     nome: "azul",     cor: "#277da1", exemplo: "como o céu" },
    { id: "amarelo",  nome: "amarelo",  cor: "#ffd60a", exemplo: "como o sol" },
    { id: "verde",    nome: "verde",    cor: "#2a9d55", exemplo: "como a folha" },
    { id: "laranja",  nome: "laranja",  cor: "#f77f00", exemplo: "como a laranja" },
    { id: "roxo",     nome: "roxo",     cor: "#7b2cbf", exemplo: "como a uva" },
    { id: "rosa",     nome: "rosa",     cor: "#ff70a6", exemplo: "como a flor" },
    { id: "marrom",   nome: "marrom",   cor: "#8d5524", exemplo: "como o chocolate" },
  ];

  function desenhar(item, cartao) {
    const b = document.createElement("span");
    b.className = "bolinha";
    b.style.background = item.cor;
    cartao.appendChild(b);
  }

  JOGOS.push({
    id: "cores",
    nome: "Cores",
    icone: "🎨",
    faixas: ["2-3", "3-4"],
    iniciar(area, faixa) {
      Motor.escolherModo(area, [
        {
          icone: "👆", rotulo: "Explorar",
          iniciar: () => Motor.modoExplorar({
            area, itens: CORES, porTela: 4, desenhar,
            aoTocar: c => Motor.falar(`${c.nome[0].toUpperCase() + c.nome.slice(1)}! ${c.exemplo}.`),
          }),
        },
        {
          icone: "❓", rotulo: "Cadê?",
          // Na faixa de 3 a 4 anos o desafio tem 3 opções em vez de 2
          iniciar: () => Motor.modoCade({
            area, itens: CORES, opcoes: faixa && faixa.id === "3-4" ? 3 : 2, desenhar,
            pergunta: c => `Cadê o ${c.nome}?`,
          }),
        },
      ]);
    },
  });
})();
