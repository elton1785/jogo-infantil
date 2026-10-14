// Frações com pizza: qual fração está pintada? / qual pizza mostra a fração?
(() => {
  const DENOMINADORES = [2, 3, 4, 6, 8];
  const NOME_PARTE = { 2: ["meio", "meios"], 3: ["terço", "terços"], 4: ["quarto", "quartos"], 6: ["sexto", "sextos"], 8: ["oitavo", "oitavos"] };
  const falada = (k, n) => `${NUMEROS_FALADOS[k]} ${NOME_PARTE[n][k === 1 ? 0 : 1]}`;

  function pizza(k, n) {
    const el = document.createElement("span");
    el.className = "pizza";
    const pintado = (k / n) * 360;
    const fatia = 360 / n;
    el.style.background =
      `repeating-conic-gradient(#8a5a2b 0deg 1.5deg, transparent 1.5deg ${fatia}deg),` +
      `conic-gradient(#e76f51 0deg ${pintado}deg, #ffe8c2 ${pintado}deg 360deg)`;
    return el;
  }

  function sortearFracao() {
    const n = Motor.sortear(DENOMINADORES);
    return { k: Motor.aleatorio(1, n - 1), n };
  }

  // Duas frações de VALOR diferente da certa (1/2 e 2/4 pintam o mesmo tanto da pizza)
  function outrasFracoes({ k, n }) {
    const valor = f => (f.k / f.n).toFixed(4);
    const vistos = new Set([valor({ k, n })]);
    const res = [];
    const tentar = f => {
      if (f.k >= 1 && f.k < f.n && NOME_PARTE[f.n] && !vistos.has(valor(f))) { vistos.add(valor(f)); res.push(f); }
    };
    [{ k: n - k, n }, { k, n: n * 2 }].forEach(tentar);
    while (res.length < 2) tentar(sortearFracao());
    return res.slice(0, 2);
  }

  function qualFracao(area) {
    Motor.modoQuiz({
      area, rodada: 10, desenhar: Motor.desenharTexto("numero"),
      gerar() {
        const f = sortearFracao();
        const opcoes = [f, ...outrasFracoes(f)].map(x => ({ nome: `${x.k}/${x.n}`, ...x }));
        return {
          pergunta: "Que fração da pizza está pintada?",
          opcoes, certa: opcoes[0],
          mostrar: el => el.appendChild(pizza(f.k, f.n)),
        };
      },
      aoAcertar: i => Motor.falar(`${Motor.maiuscula(falada(i.k, i.n))}. A pizza tem ${i.n} pedaços e ${i.k} ${i.k === 1 ? "está pintado" : "estão pintados"}.`),
    });
  }

  function qualPizza(area) {
    Motor.modoQuiz({
      area, rodada: 10,
      desenhar: (item, c) => c.appendChild(pizza(item.k, item.n)),
      gerar() {
        const f = sortearFracao();
        const opcoes = [f, ...outrasFracoes(f)].map(x => ({ nome: `${x.k}/${x.n}`, ...x }));
        return {
          pergunta: `Qual pizza mostra ${falada(f.k, f.n)}?`,
          opcoes, certa: opcoes[0],
          mostrar: el => { el.textContent = `${f.k}/${f.n}`; },
        };
      },
    });
  }

  JOGOS.push({
    id: "fracoes",
    nome: "Frações",
    icone: "🍕",
    faixas: ["8-10"],
    iniciar(area) {
      Motor.escolherModo(area, [
        { icone: "🍕", rotulo: "Que fração?", iniciar: () => qualFracao(area) },
        { icone: "🔍", rotulo: "Qual pizza?", iniciar: () => qualPizza(area) },
      ]);
    },
  });
})();
