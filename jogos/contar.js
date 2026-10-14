// Contar — tocar e contar um por um, e "Quantos tem?".
(() => {
  const fem = f => f.artigo === "a";
  // "uma, duas" para palavras femininas
  const numero = (n, feminino) => (feminino && n === 1 ? "uma" : feminino && n === 2 ? "duas" : NUMEROS_FALADOS[n]);
  const quantidade = (n, f) => `${numero(n, fem(f))} ${n === 1 ? f.nome : f.plural}`;

  function tocarEContar(area, max) {
    const s = Motor.sessaoAtual();
    const caixa = document.createElement("div");
    caixa.className = "contagem";
    area.appendChild(caixa);
    let ultimo = null;

    function nova() {
      const f = Motor.sortear(FIGURAS.filter(x => x !== ultimo));
      ultimo = f;
      const n = Motor.aleatorio(Math.min(3, max), max);
      let contados = 0;
      caixa.innerHTML = "";
      for (let i = 0; i < n; i++) {
        const b = document.createElement("button");
        b.className = "contavel";
        b.textContent = f.emoji;
        b.addEventListener("click", async () => {
          if (b.dataset.n) return;
          contados++;
          b.dataset.n = contados; // o número aparece no cantinho (CSS)
          Motor.animar(b, "pula");
          Motor.ploc();
          if (contados < n) return Motor.falar(numero(contados, fem(f)));
          Motor.comemorar(caixa);
          Motor.tim();
          await Motor.falar(`${Motor.maiuscula(numero(n, fem(f)))}! São ${quantidade(n, f)}!`);
          if (s === Motor.sessaoAtual()) Motor.depois(nova, 700);
        });
        caixa.appendChild(b);
      }
      Motor.falar(`Vamos contar ${fem(f) ? "as" : "os"} ${f.plural}! Toque em cada ${fem(f) ? "uma" : "um"}.`);
    }
    nova();
  }

  function quantos(area, max) {
    let ultimo = null;
    Motor.modoQuiz({
      area, desenhar: Motor.desenharTexto("numero"),
      gerar() {
        const f = Motor.sortear(FIGURAS.filter(x => x !== ultimo));
        ultimo = f;
        const n = Motor.aleatorio(1, max);
        return {
          pergunta: `Quant${fem(f) ? "as" : "os"} ${f.plural} tem aqui?`,
          ...Motor.opcoesNumericas(n, { min: 1 }),
          mostrar: el => { el.innerHTML = `<span class="conjunto"></span>`; el.firstChild.textContent = f.emoji.repeat(n); },
          figura: f, n,
        };
      },
      aoAcertar: (item, q) => {
        const lista = [];
        for (let i = 1; i <= q.n; i++) lista.push(numero(i, fem(q.figura)));
        return Motor.falar(`${lista.join(", ")}. ${Motor.maiuscula(quantidade(q.n, q.figura))}!`);
      },
    });
  }

  JOGOS.push({
    id: "contar",
    nome: "Contar",
    icone: "🔢",
    faixas: ["2-3", "3-4", "4-5"],
    iniciar(area, faixa) {
      const max = { "2-3": 3, "3-4": 5, "4-5": 10 }[faixa && faixa.id] || 5;
      Motor.escolherModo(area, [
        { icone: "👆", rotulo: "Tocar e contar", iniciar: () => tocarEContar(area, max) },
        { icone: "❓", rotulo: "Quantos tem?",   iniciar: () => quantos(area, max) },
      ]);
    },
  });
})();
