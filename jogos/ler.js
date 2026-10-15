// Ler palavras — a criança lê a palavra escrita e escolhe a figura certa.
// Também: ditado (ouvir e montar com letras).
(() => {
  const ALFABETO = "ABCDEFGHIJLMNOPRSTUVXZ".split("");

  function lerPalavras(area, faixa) {
    // 5-6 anos: LETRA DE FORMA; 6-8 e 8-10: minúscula
    const maiusculas = !faixa || faixa.id === "5-6";
    let ultima = null;
    Motor.modoQuiz({
      area, rodada: 10,
      gerar() {
        const p = Motor.sortear(PALAVRAS.filter(x => x !== ultima));
        ultima = p;
        const outras = Motor.embaralhar(PALAVRAS.filter(x => x !== p)).slice(0, 2);
        const opcoes = [p, ...outras].map(x => ({ nome: x.palavra, emoji: x.emoji }));
        return {
          pergunta: "Leia a palavra. Qual é a figura?",
          opcoes, certa: opcoes[0],
          mostrar: el => { el.classList.add("palavra-lida"); el.textContent = maiusculas ? p.palavra.toUpperCase() : p.palavra; },
        };
      },
      aoAcertar: i => Motor.falar(Motor.maiuscula(i.nome)),
    });
  }

  function ditado(area, comFigura) {
    let ultima = null;
    const curtas = PALAVRAS.filter(p => p.palavra.length <= 7);
    Motor.modoMontar({
      area, rodada: 10,
      gerar() {
        const p = Motor.sortear(curtas.filter(x => x !== ultima));
        ultima = p;
        const letras = [...p.palavra.toUpperCase()];
        const extras = Motor.embaralhar(ALFABETO.filter(l => !letras.includes(l))).slice(0, 2);
        return {
          pecas: letras, extras, palavra: p.palavra,
          anuncio: `Escreva: ${p.palavra}`,
          mostrar: comFigura ? el => { el.innerHTML = `<span class="grande"></span>`; el.firstChild.textContent = p.emoji; } : null,
        };
      },
    });
  }

  JOGOS.push({
    id: "ler",
    nome: "Ler Palavras",
    icone: "👀",
    faixas: ["5-6", "6-8"],
    iniciar: (area, faixa) => lerPalavras(area, faixa),
  });

  JOGOS.push({
    id: "ditado",
    nome: "Ditado",
    icone: "📝",
    faixas: ["5-6", "6-8", "8-10"],
    iniciar(area, faixa) {
      const modos = [{ icone: "🖼️", rotulo: "Com figura", iniciar: () => ditado(area, true) }];
      if (faixa && faixa.id !== "5-6") modos.push({ icone: "👂", rotulo: "Só ouvindo", iniciar: () => ditado(area, false) });
      Motor.escolherModo(area, modos);
    },
  });
})();
