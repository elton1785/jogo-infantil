// Sombras — qual é a sombra da figura?
(() => {
  function sombra(item, cartao) {
    cartao.innerHTML = `<span class="sombra"></span>`;
    cartao.firstChild.textContent = item.emoji;
  }

  JOGOS.push({
    id: "sombras",
    nome: "Sombras",
    icone: "🌑",
    faixas: ["3-4", "4-5"],
    iniciar(area, faixa) {
      let ultimo = null;
      const opcoes = faixa && faixa.id === "4-5" ? 4 : 3;
      Motor.modoQuiz({
        area, desenhar: sombra,
        gerar() {
          const certa = Motor.sortear(FIGURAS.filter(f => f !== ultimo));
          ultimo = certa;
          const outras = Motor.embaralhar(FIGURAS.filter(f => f !== certa)).slice(0, opcoes - 1);
          return {
            pergunta: `Qual é a sombra ${certa.artigo === "a" ? "da" : "do"} ${certa.nome}?`,
            opcoes: [certa, ...outras], certa,
            mostrar: el => { el.innerHTML = `<span class="grande"></span>`; el.firstChild.textContent = certa.emoji; },
          };
        },
      });
    },
  });
})();
