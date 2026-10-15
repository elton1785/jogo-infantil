// Contas — somar e subtrair, com figuras (5-6) ou só números (6-8).
(() => {
  const FRUTAS = ["🍎", "🍌", "🍓", "🍊", "⭐", "🎈", "🐟"];

  function somaFiguras(area) {
    Motor.modoQuiz({
      area, rodada: 10, desenhar: Motor.desenharTexto("numero"),
      gerar() {
        const e = Motor.sortear(FRUTAS);
        const a = Motor.aleatorio(1, 5), b = Motor.aleatorio(1, 5);
        return {
          pergunta: `${NUMEROS_FALADOS[a]} mais ${NUMEROS_FALADOS[b]}. Quanto dá?`,
          ...Motor.opcoesNumericas(a + b, { min: 1 }),
          mostrar: el => { el.innerHTML = `<span class="conjunto"></span><span class="sinal">+</span><span class="conjunto"></span>`;
            const [ca, cb] = el.querySelectorAll(".conjunto"); ca.textContent = e.repeat(a); cb.textContent = e.repeat(b); },
          resposta: `${a} mais ${b} é ${a + b}.`,
        };
      },
      aoAcertar: (_, q) => Motor.falar(q.resposta),
    });
  }

  function subtracaoFiguras(area) {
    Motor.modoQuiz({
      area, rodada: 10, desenhar: Motor.desenharTexto("numero"),
      gerar() {
        const e = Motor.sortear(FRUTAS);
        const a = Motor.aleatorio(3, 8), b = Motor.aleatorio(1, a - 1);
        return {
          pergunta: `Tinha ${NUMEROS_FALADOS[a]}. Foram embora ${NUMEROS_FALADOS[b]}. Quantos ficaram?`,
          ...Motor.opcoesNumericas(a - b, { min: 0 }),
          // As que "foram embora" aparecem riscadas
          mostrar: el => { el.innerHTML = `<span class="conjunto"></span><span class="conjunto riscado"></span>`;
            el.children[0].textContent = e.repeat(a - b); el.children[1].textContent = e.repeat(b); },
          resposta: `${a} menos ${b} é ${a - b}.`,
        };
      },
      aoAcertar: (_, q) => Motor.falar(q.resposta),
    });
  }

  function contas(area, sinal) {
    Motor.modoQuiz({
      area, rodada: 10, desenhar: Motor.desenharTexto("numero"),
      gerar() {
        let a = Motor.aleatorio(2, 20), b = Motor.aleatorio(1, 10);
        if (sinal === "-" && b > a) [a, b] = [b, a];
        const r = sinal === "+" ? a + b : a - b;
        const nome = sinal === "+" ? "mais" : "menos";
        return {
          pergunta: `Quanto é ${a} ${nome} ${b}?`,
          ...Motor.opcoesNumericas(r, { min: 0, vizinhos: [r - 1, r + 1, r + 10, r - 10, r + 2] }),
          mostrar: el => { el.textContent = `${a} ${sinal === "+" ? "+" : "−"} ${b} = ?`; },
          resposta: `${a} ${nome} ${b} é ${r}.`,
        };
      },
      aoAcertar: (_, q) => Motor.falar(q.resposta),
    });
  }

  JOGOS.push({
    id: "contas",
    nome: "Somar e Tirar",
    icone: "➕",
    faixas: ["4-5", "5-6", "6-8"],
    iniciar(area, faixa) {
      const modos = [
        { icone: "🍎", rotulo: "Somar figuras", iniciar: () => somaFiguras(area) },
        { icone: "🍌", rotulo: "Tirar figuras", iniciar: () => subtracaoFiguras(area) },
      ];
      if (faixa && faixa.id === "6-8") {
        modos.push({ icone: "➕", rotulo: "Somas", iniciar: () => contas(area, "+") });
        modos.push({ icone: "➖", rotulo: "Subtrações", iniciar: () => contas(area, "-") });
      }
      Motor.escolherModo(area, modos);
    },
  });
})();
