// Ordenar — números em ordem, do menor para o maior, e ordem alfabética (arrastar ou tocar).
(() => {
  const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  function ordemNumeros(area, ate) {
    Motor.modoMontar({
      area, rodada: 5,
      gerar: () => {
        const tam = Math.min(ate, 5);
        const inicio = Motor.aleatorio(1, ate - tam + 1);
        const pecas = Array.from({ length: tam }, (_, i) => String(inicio + i));
        return { pecas, extras: [], palavra: pecas.join(", "), anuncio: "Coloque os números em ordem, do menor para o maior!", falarPeca: n => n };
      },
    });
  }

  function menorMaior(area) {
    Motor.modoMontar({
      area, rodada: 5,
      gerar: () => {
        const nums = new Set();
        while (nums.size < 5) nums.add(Motor.aleatorio(1, 99));
        const pecas = [...nums].sort((a, b) => a - b).map(String);
        return { pecas, extras: [], palavra: pecas.join(", "), anuncio: "Do menor para o maior!", falarPeca: n => n };
      },
    });
  }

  function ordemAlfabetica(area) {
    Motor.modoMontar({
      area, rodada: 5,
      gerar: () => {
        const i = Motor.aleatorio(0, ALFABETO.length - 5);
        const pecas = ALFABETO.slice(i, i + 5);
        return { pecas, extras: [], palavra: "Ordem alfabética", anuncio: "Coloque as letras na ordem do alfabeto!" };
      },
    });
  }

  JOGOS.push({
    id: "ordenar",
    nome: "Pôr em Ordem",
    icone: "📶",
    faixas: ["4-5", "5-6", "6-8"],
    iniciar(area, faixa) {
      const id = faixa && faixa.id;
      const modos = [{ icone: "1️⃣", rotulo: id === "4-5" ? "Números até 5" : "Números até 20", iniciar: () => ordemNumeros(area, id === "4-5" ? 5 : 20) }];
      if (id !== "4-5") modos.push({ icone: "🔤", rotulo: "Ordem alfabética", iniciar: () => ordemAlfabetica(area) });
      if (id === "6-8") modos.push({ icone: "📈", rotulo: "Menor para maior", iniciar: () => menorMaior(area) });
      Motor.escolherModo(area, modos);
    },
  });
})();
