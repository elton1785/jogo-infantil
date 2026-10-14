// Tabuada — escolher uma tabuada (2 a 10) ou misturada; rodadas de 10 contas.
(() => {
  const aleatorio = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

  // Respostas erradas plausíveis: vizinhos na tabuada, ±1 e a soma (erro comum).
  function distracoes(a, b, certa) {
    const candidatos = [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, certa + 1, certa - 1, a + b];
    const unicos = [...new Set(candidatos)].filter(n => n > 0 && n !== certa);
    return Motor.embaralhar(unicos).slice(0, 2);
  }

  function jogar(area, tabela) {
    Motor.modoQuiz({
      area, rodada: 10, desenhar: Motor.desenharTexto("numero"),
      gerar() {
        const a = tabela || aleatorio(2, 10);
        const b = aleatorio(1, 10);
        const certa = { nome: String(a * b) };
        const outras = distracoes(a, b, a * b).map(n => ({ nome: String(n) }));
        return {
          pergunta: `Quanto é ${a} vezes ${b}?`,
          opcoes: [certa, ...outras], certa,
          mostrar: el => { el.textContent = `${a} × ${b} = ?`; },
          resposta: `${a} vezes ${b} é ${a * b}.`,
        };
      },
      aoAcertar: (item, q) => Motor.falar(q.resposta),
    });
  }

  JOGOS.push({
    id: "tabuada",
    nome: "Tabuada",
    icone: "✖️",
    faixas: ["6-8", "8-10"],
    iniciar(area) {
      const modos = [];
      for (let n = 2; n <= 10; n++) {
        modos.push({ icone: String(n), rotulo: `Tabuada do ${n}`, iniciar: () => jogar(area, n) });
      }
      modos.push({ icone: "🎲", rotulo: "Misturada", iniciar: () => jogar(area, null) });
      Motor.escolherModo(area, modos, { pequenos: true });
    },
  });
})();
