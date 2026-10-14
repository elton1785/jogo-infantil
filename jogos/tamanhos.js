// Grande e pequeno — o mesmo bichinho em dois tamanhos.
(() => {
  function desenhar(item, cartao) {
    cartao.innerHTML = `<span></span>`;
    cartao.firstChild.textContent = item.emoji;
    cartao.firstChild.style.fontSize = item.escala + "em";
  }

  JOGOS.push({
    id: "tamanhos",
    nome: "Grande e Pequeno",
    icone: "🐘",
    faixas: ["2-3", "3-4"],
    iniciar(area) {
      Motor.modoQuiz({
        area, desenhar,
        gerar() {
          const f = Motor.sortear(FIGURAS);
          const fem = f.artigo === "a";
          const grande = { ...f, escala: 1, tamanho: "grande" };
          const pequeno = { ...f, escala: 0.4, tamanho: fem ? "pequena" : "pequeno" };
          const certa = Math.random() < 0.5 ? grande : pequeno;
          return { pergunta: `Cadê ${f.artigo} ${f.nome} ${certa.tamanho}?`, opcoes: [grande, pequeno], certa };
        },
      });
    },
  });
})();
