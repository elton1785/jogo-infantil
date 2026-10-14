// Sílabas — achar a primeira sílaba e montar palavras sílaba por sílaba.
(() => {
  const TODAS = [...new Set(PALAVRAS.flatMap(p => p.silabas))];

  // Sílabas diferentes das da palavra, para servir de distração
  function distracoes(p, quantas) {
    return Motor.embaralhar(TODAS.filter(s => !p.silabas.includes(s))).slice(0, quantas);
  }

  function primeiraSilaba(area) {
    Motor.modoQuiz({
      area, rodada: 10, desenhar: Motor.desenharTexto("palavra"),
      gerar() {
        const p = Motor.sortear(PALAVRAS);
        const certa = { nome: p.silabas[0] };
        const outras = distracoes(p, 2).map(s => ({ nome: s }));
        return {
          pergunta: `${p.palavra}. Com que sílaba começa ${p.palavra}?`,
          opcoes: [certa, ...outras], certa,
          mostrar: el => { el.innerHTML = `<span class="grande"></span>`; el.firstChild.textContent = p.emoji; },
        };
      },
    });
  }

  function montarPalavra(area) {
    let ultima = null;
    Motor.modoMontar({
      area, rodada: 10,
      gerar() {
        const p = Motor.sortear(PALAVRAS.filter(x => x !== ultima));
        ultima = p;
        return {
          pecas: p.silabas, extras: distracoes(p, 2), palavra: p.palavra,
          anuncio: `Vamos escrever ${p.palavra}!`,
          mostrar: el => { el.textContent = p.emoji; },
          falarPeca: s => s.toLowerCase(),
        };
      },
    });
  }

  JOGOS.push({
    id: "silabas",
    nome: "Sílabas",
    icone: "🧩",
    faixas: ["5-6", "6-8"],
    iniciar(area) {
      Motor.escolherModo(area, [
        { icone: "🔍", rotulo: "Primeira sílaba", iniciar: () => primeiraSilaba(area) },
        { icone: "✏️", rotulo: "Montar palavra",  iniciar: () => montarPalavra(area) },
      ]);
    },
  });
})();
