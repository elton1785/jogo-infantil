// Ortografia — escolher a palavra escrita do jeito certo.
(() => {
  // [certa, errada]
  const PARES = [
    ["cachorro", "caxorro"], ["chuva", "xuva"], ["pássaro", "pásaro"], ["hoje", "oje"],
    ["homem", "omem"], ["girafa", "jirafa"], ["cenoura", "senoura"], ["açúcar", "assúcar"],
    ["jeito", "geito"], ["chave", "xave"], ["bruxa", "brucha"], ["exercício", "ezercício"],
    ["próximo", "prósimo"], ["cebola", "sebola"], ["sozinho", "sosinho"], ["mesa", "meza"],
    ["beleza", "belesa"], ["princesa", "prinseza"], ["almoço", "almosso"], ["terra", "tera"],
    ["vassoura", "vasoura"], ["chinelo", "xinelo"], ["xícara", "chícara"], ["abacaxi", "abacachi"],
    ["bexiga", "bechiga"], ["tigela", "tijela"], ["mágico", "májico"], ["exemplo", "ezemplo"],
    ["passeio", "paseio"], ["caixa", "caicha"], ["peixe", "peiche"], ["hospital", "ospital"],
    ["osso", "oço"], ["cresça", "cressa"], ["escola", "iscola"],
    ["menino", "mininu"], ["sorvete", "sorveti"], ["travesseiro", "traveseiro"], ["professora", "profesora"],
  ];

  JOGOS.push({
    id: "ortografia",
    nome: "Escreve Certo?",
    icone: "✔️",
    faixas: ["6-8", "8-10"],
    iniciar(area) {
      let ultimo = null;
      Motor.modoQuiz({
        area, rodada: 10, desenhar: Motor.desenharTexto("palavra"),
        gerar() {
          const par = Motor.sortear(PARES.filter(p => p !== ultimo));
          ultimo = par;
          const opcoes = par.map(nome => ({ nome }));
          return { pergunta: `Como se escreve ${par[0]}?`, opcoes, certa: opcoes[0] };
        },
        aoAcertar: i => Motor.falar(`${Motor.maiuscula(i.nome)}: ${i.nome.toUpperCase().split("").join(", ")}.`),
      });
    },
  });
})();
