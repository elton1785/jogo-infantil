// Dinheiro — contar moedas e notas em reais, e calcular troco. Valores em centavos.
(() => {
  const NOTAS = [200, 500, 1000, 2000, 5000, 10000];
  const MOEDAS = [5, 10, 25, 50, 100];
  const PRODUTOS = [
    { emoji: "🍦", nome: "um picolé" }, { emoji: "🧃", nome: "um suco" }, { emoji: "🍞", nome: "um pão" },
    { emoji: "📓", nome: "um caderno" }, { emoji: "✏️", nome: "um lápis" }, { emoji: "🍫", nome: "um chocolate" },
    { emoji: "🎈", nome: "um balão" }, { emoji: "🍌", nome: "um cacho de banana" }, { emoji: "🧸", nome: "um ursinho" },
  ];

  const reais = v => "R$ " + (v / 100).toFixed(2).replace(".", ",");
  function falado(v) {
    const r = Math.floor(v / 100), c = v % 100;
    const partes = [];
    if (r) partes.push(`${r} ${r === 1 ? "real" : "reais"}`);
    if (c) partes.push(`${c} centavos`);
    return partes.join(" e ") || "zero reais";
  }

  function desenharDinheiro(valor) {
    const el = document.createElement("span");
    if (NOTAS.includes(valor)) {
      el.className = `nota n${valor / 100}`;
      el.textContent = reais(valor).replace(",00", "");
    } else {
      el.className = `moeda m${valor}`;
      el.textContent = valor === 100 ? "1 real" : `${valor}¢`;
    }
    return el;
  }

  function contarDinheiro(area, comCentavos) {
    Motor.modoQuiz({
      area, rodada: 10, desenhar: Motor.desenharTexto("palavra"),
      gerar() {
        const tipos = comCentavos ? [...MOEDAS, 200, 500, 1000] : [100, 200, 500, 1000];
        const qtd = Motor.aleatorio(2, comCentavos ? 5 : 4);
        const pecas = Array.from({ length: qtd }, () => Motor.sortear(tipos)).sort((a, b) => b - a);
        const total = pecas.reduce((s, v) => s + v, 0);
        const passo = comCentavos ? 25 : 100;
        return {
          pergunta: "Quanto dinheiro tem aqui?",
          ...Motor.opcoesNumericas(total, {
            min: 5, formatar: reais,
            vizinhos: [total + passo, total - passo, total + 100, total - 100, total + 500, total + 2 * passo],
          }),
          mostrar: el => { el.classList.add("carteira"); pecas.forEach(v => el.appendChild(desenharDinheiro(v))); },
          total,
        };
      },
      aoAcertar: (_, q) => Motor.falar(`Tem ${falado(q.total)}.`),
    });
  }

  function troco(area, comCentavos) {
    Motor.modoQuiz({
      area, rodada: 10, desenhar: Motor.desenharTexto("palavra"),
      gerar() {
        const p = Motor.sortear(PRODUTOS);
        const preco = comCentavos ? Motor.aleatorio(4, 75) * 25 : Motor.aleatorio(1, 9) * 100;
        const pago = [500, 1000, 2000, 5000].find(n => n > preco);
        const t = pago - preco;
        const passo = comCentavos ? 25 : 100;
        return {
          pergunta: `${Motor.maiuscula(p.nome)} custa ${falado(preco)}. Você pagou com ${falado(pago)}. Quanto é o troco?`,
          ...Motor.opcoesNumericas(t, { min: 0, formatar: reais, vizinhos: [t + passo, t - passo, t + 100, t - 100, preco] }),
          mostrar: el => {
            el.classList.add("carteira");
            el.innerHTML = `<span class="produto"></span><span class="etiqueta"></span><span>💵➡️</span>`;
            el.children[0].textContent = p.emoji;
            el.children[1].textContent = reais(preco);
            el.appendChild(desenharDinheiro(pago));
          },
          t,
        };
      },
      aoAcertar: (_, q) => Motor.falar(`O troco é ${falado(q.t)}.`),
    });
  }

  JOGOS.push({
    id: "dinheiro",
    nome: "Dinheiro",
    icone: "💰",
    faixas: ["6-8", "8-10"],
    iniciar(area, faixa) {
      const centavos = !!faixa && faixa.id === "8-10";
      Motor.escolherModo(area, [
        { icone: "🪙", rotulo: "Contar dinheiro", iniciar: () => contarDinheiro(area, centavos) },
        { icone: "🛒", rotulo: "Troco",           iniciar: () => troco(area, centavos) },
      ]);
    },
  });
})();
