// Estados do Brasil — capitais, regiões e siglas.
(() => {
  // `de`: preposição correta ("do Amazonas", "da Bahia", "de Goiás")
  const ESTADOS = [
    { sigla: "AC", nome: "Acre",                capital: "Rio Branco",     regiao: "Norte",        de: "do" },
    { sigla: "AL", nome: "Alagoas",             capital: "Maceió",         regiao: "Nordeste",     de: "de" },
    { sigla: "AP", nome: "Amapá",               capital: "Macapá",         regiao: "Norte",        de: "do" },
    { sigla: "AM", nome: "Amazonas",            capital: "Manaus",         regiao: "Norte",        de: "do" },
    { sigla: "BA", nome: "Bahia",               capital: "Salvador",       regiao: "Nordeste",     de: "da" },
    { sigla: "CE", nome: "Ceará",               capital: "Fortaleza",      regiao: "Nordeste",     de: "do" },
    { sigla: "DF", nome: "Distrito Federal",    capital: "Brasília",       regiao: "Centro-Oeste", de: "do" },
    { sigla: "ES", nome: "Espírito Santo",      capital: "Vitória",        regiao: "Sudeste",      de: "do" },
    { sigla: "GO", nome: "Goiás",               capital: "Goiânia",        regiao: "Centro-Oeste", de: "de" },
    { sigla: "MA", nome: "Maranhão",            capital: "São Luís",       regiao: "Nordeste",     de: "do" },
    { sigla: "MT", nome: "Mato Grosso",         capital: "Cuiabá",         regiao: "Centro-Oeste", de: "de" },
    { sigla: "MS", nome: "Mato Grosso do Sul",  capital: "Campo Grande",   regiao: "Centro-Oeste", de: "de" },
    { sigla: "MG", nome: "Minas Gerais",        capital: "Belo Horizonte", regiao: "Sudeste",      de: "de" },
    { sigla: "PA", nome: "Pará",                capital: "Belém",          regiao: "Norte",        de: "do" },
    { sigla: "PB", nome: "Paraíba",             capital: "João Pessoa",    regiao: "Nordeste",     de: "da" },
    { sigla: "PR", nome: "Paraná",              capital: "Curitiba",       regiao: "Sul",          de: "do" },
    { sigla: "PE", nome: "Pernambuco",          capital: "Recife",         regiao: "Nordeste",     de: "de" },
    { sigla: "PI", nome: "Piauí",               capital: "Teresina",       regiao: "Nordeste",     de: "do" },
    { sigla: "RJ", nome: "Rio de Janeiro",      capital: "Rio de Janeiro", regiao: "Sudeste",      de: "do" },
    { sigla: "RN", nome: "Rio Grande do Norte", capital: "Natal",          regiao: "Nordeste",     de: "do" },
    { sigla: "RS", nome: "Rio Grande do Sul",   capital: "Porto Alegre",   regiao: "Sul",          de: "do" },
    { sigla: "RO", nome: "Rondônia",            capital: "Porto Velho",    regiao: "Norte",        de: "de" },
    { sigla: "RR", nome: "Roraima",             capital: "Boa Vista",      regiao: "Norte",        de: "de" },
    { sigla: "SC", nome: "Santa Catarina",      capital: "Florianópolis",  regiao: "Sul",          de: "de" },
    { sigla: "SP", nome: "São Paulo",           capital: "São Paulo",      regiao: "Sudeste",      de: "de" },
    { sigla: "SE", nome: "Sergipe",             capital: "Aracaju",        regiao: "Nordeste",     de: "de" },
    { sigla: "TO", nome: "Tocantins",           capital: "Palmas",         regiao: "Norte",        de: "do" },
  ];
  const REGIOES = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];

  // "o Amazonas", "a Bahia", "Goiás"
  const artigo = e => ({ do: "o ", da: "a ", de: "" })[e.de] + e.nome;
  const desenhar = Motor.desenharTexto("palavra");
  const texto = t => el => { el.textContent = t; };

  // Pergunta com a resposta certa + 2 erradas tiradas de `todas` (sem repetir)
  function opcoesCom(certaTexto, todas) {
    const certa = { nome: certaTexto };
    const outras = Motor.embaralhar([...new Set(todas)].filter(t => t !== certaTexto)).slice(0, 2).map(n => ({ nome: n }));
    return { certa, opcoes: [certa, ...outras] };
  }

  const MODOS = {
    capitais: e => ({
      pergunta: `Qual é a capital ${e.de} ${e.nome}?`,
      mostrar: texto(`🏙️ ${e.nome}`),
      ...opcoesCom(e.capital, ESTADOS.map(x => x.capital)),
      depois: `A capital ${e.de} ${e.nome} é ${e.capital}.`,
    }),
    regioes: e => ({
      pergunta: `Em que região fica ${artigo(e)}?`,
      mostrar: texto(`🧭 ${e.nome}`),
      ...opcoesCom(e.regiao, REGIOES),
      depois: `${artigo(e)} fica na região ${e.regiao}.`,
    }),
    siglas: e => ({
      pergunta: `Qual estado tem a sigla ${e.sigla.split("").join(" ")}?`,
      mostrar: texto(`🔠 ${e.sigla}`),
      ...opcoesCom(e.nome, ESTADOS.map(x => x.nome)),
      depois: `${e.sigla.split("").join(" ")} é ${artigo(e)}.`,
    }),
  };

  function jogar(area, modo) {
    let ultimo = null;
    Motor.modoQuiz({
      area, rodada: 10, desenhar,
      gerar() {
        const e = Motor.sortear(ESTADOS.filter(x => x !== ultimo));
        ultimo = e;
        return MODOS[modo](e);
      },
      aoAcertar: (item, q) => Motor.falar(q.depois),
    });
  }

  JOGOS.push({
    id: "brasil",
    nome: "Estados do Brasil",
    icone: "🇧🇷",
    faixas: ["8-10"],
    iniciar(area) {
      Motor.escolherModo(area, [
        { icone: "🏙️", rotulo: "Capitais", iniciar: () => jogar(area, "capitais") },
        { icone: "🧭", rotulo: "Regiões",  iniciar: () => jogar(area, "regioes") },
        { icone: "🔠", rotulo: "Siglas",   iniciar: () => jogar(area, "siglas") },
      ]);
    },
  });
})();
