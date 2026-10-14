// Sequências — descobrir o padrão: 🔴🔵🔴🔵 ❓
(() => {
  const CONJUNTOS = [
    ["🔴", "🔵", "🟡", "🟢", "🟣"],
    ["🐶", "🐱", "🐰", "🐸", "🐵"],
    ["🍎", "🍌", "🍇", "🍓", "🍊"],
    ["⭐", "🌙", "☀️", "☁️", "⚡"],
    ["🚗", "🚌", "🚲", "✈️", "🚢"],
  ];
  const PADROES = { "4-5": ["AB", "AAB"], "5-6": ["AB", "AAB", "ABC", "ABB"], "6-8": ["ABC", "AABB", "ABBC", "ABCD"] };

  JOGOS.push({
    id: "sequencias",
    nome: "Sequências",
    icone: "🔁",
    faixas: ["4-5", "5-6", "6-8"],
    iniciar(area, faixa) {
      const padroes = PADROES[faixa && faixa.id] || PADROES["4-5"];
      Motor.modoQuiz({
        area, rodada: 10,
        gerar() {
          const padrao = Motor.sortear(padroes);
          const letras = [...new Set(padrao)];
          const figuras = Motor.embaralhar(Motor.sortear(CONJUNTOS));
          const mapa = Object.fromEntries(letras.map((l, i) => [l, figuras[i]]));
          const unidade = [...padrao].map(l => mapa[l]);
          // Mostra 2 ciclos completos e às vezes um pedaço do terceiro
          const tamanho = unidade.length * 2 + Motor.aleatorio(0, unidade.length - 1);
          const mostrados = Array.from({ length: tamanho }, (_, i) => unidade[i % unidade.length]);
          const resposta = unidade[tamanho % unidade.length];

          const usadas = letras.map(l => mapa[l]);
          const extras = figuras.filter(f => !usadas.includes(f));
          const opcoesEmoji = [...new Set([resposta, ...Motor.embaralhar(usadas), ...extras])].slice(0, 3);
          const opcoes = opcoesEmoji.map(e => ({ nome: e, emoji: e }));
          return {
            pergunta: "O que vem depois?",
            opcoes, certa: opcoes[0],
            mostrar: el => { el.innerHTML = `<span class="sequencia"></span>`; el.firstChild.textContent = mostrados.join(" ") + " ❓"; },
          };
        },
      });
    },
  });
})();
