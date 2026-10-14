// Formas geométricas desenhadas em SVG.
(() => {
  const DESENHOS = {
    "círculo":   `<circle cx="50" cy="50" r="44"/>`,
    "quadrado":  `<rect x="10" y="10" width="80" height="80" rx="4"/>`,
    "triângulo": `<polygon points="50,8 94,90 6,90"/>`,
    "retângulo": `<rect x="4" y="26" width="92" height="48" rx="4"/>`,
    "estrela":   `<polygon points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"/>`,
    "coração":   `<path d="M50 88C20 65 5 45 5 30C5 15 17 5 30 5C40 5 47 11 50 18C53 11 60 5 70 5C83 5 95 15 95 30C95 45 80 65 50 88Z"/>`,
    "losango":   `<polygon points="50,4 92,50 50,96 8,50"/>`,
    "oval":      `<ellipse cx="50" cy="50" rx="46" ry="30"/>`,
  };
  const CORES = ["#e63946", "#277da1", "#ffd60a", "#2a9d55", "#f77f00", "#7b2cbf", "#ff70a6", "#4361ee"];

  const FORMAS = Object.keys(DESENHOS).map((nome, i) => ({
    nome, artigo: ["estrela"].includes(nome) ? "a" : "o", cor: CORES[i],
  }));

  function desenhar(item, cartao) {
    cartao.innerHTML = `<svg class="forma" viewBox="0 0 100 100" fill="${item.cor}">${DESENHOS[item.nome]}</svg>`;
  }

  JOGOS.push(Motor.vocabulario({
    id: "formas", nome: "Formas", icone: "🔺", faixas: ["2-3", "3-4", "4-5"],
    itens: FORMAS, desenhar,
  }));
})();
