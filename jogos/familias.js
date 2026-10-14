// Famílias silábicas — BA BE BI BO BU, CA CE CI CO CU...
(() => {
  const CONSOANTES = ["B", "C", "D", "F", "G", "J", "L", "M", "N", "P", "R", "S", "T", "V"];
  const ACENTO = { A: "á", E: "é", I: "í", O: "ó", U: "ú" };

  // Acento na vogal faz a voz ler a sílaba ("bá") em vez de soletrar ("bê a")
  const silaba = (c, v) => ({ nome: c + v, fala: c.toLowerCase() + ACENTO[v] });
  const familia = c => ["A", "E", "I", "O", "U"].map(v => silaba(c, v));

  const desenhar = Motor.desenharTexto("letra");

  function explorarFamilia(area, c) {
    Motor.modoExplorar({
      area, itens: familia(c), porTela: 5, emOrdem: true, desenhar,
      aoTocar: s => Motor.falar(s.fala),
    });
    Motor.falar(familia(c).map(s => s.fala).join(", "));
  }

  function cadeSilaba(area, opcoes) {
    let ultima = null;
    Motor.modoQuiz({
      area, rodada: 10, desenhar,
      gerar() {
        const fam = familia(Motor.sortear(CONSOANTES));
        const certa = Motor.sortear(fam.filter(s => !ultima || s.nome !== ultima.nome));
        ultima = certa;
        const outras = Motor.embaralhar(fam.filter(s => s !== certa)).slice(0, opcoes - 1);
        return { pergunta: `Cadê o ${certa.fala}?`, opcoes: [certa, ...outras], certa };
      },
    });
  }

  JOGOS.push({
    id: "familias",
    nome: "Famílias Silábicas",
    icone: "📚",
    faixas: ["4-5", "5-6"],
    iniciar(area, faixa) {
      const opcoes = faixa && faixa.id === "5-6" ? 4 : 3;
      Motor.escolherModo(area, [
        {
          icone: "📖", rotulo: "Famílias",
          iniciar: () => Motor.escolherModo(area,
            CONSOANTES.map(c => ({ icone: c, rotulo: `${c}A ${c}E ${c}I ${c}O ${c}U`, iniciar: () => explorarFamilia(area, c) })),
            { pequenos: true }),
        },
        { icone: "❓", rotulo: "Cadê a sílaba?", iniciar: () => cadeSilaba(area, opcoes) },
      ]);
    },
  });
})();
