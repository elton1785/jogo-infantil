// Jogo da memória — o número de pares cresce com a idade.
(() => {
  const PARES_POR_FAIXA = { "3-4": 3, "4-5": 4, "5-6": 6, "6-8": 8 };

  JOGOS.push({
    id: "memoria",
    nome: "Memória",
    icone: "🃏",
    faixas: ["3-4", "4-5", "5-6", "6-8"],
    iniciar(area, faixa) {
      const pares = PARES_POR_FAIXA[faixa && faixa.id] || 3;

      function jogo() {
        const figuras = Motor.embaralhar(FIGURAS).slice(0, pares);
        const cartas = Motor.embaralhar([...figuras, ...figuras]);
        const grade = document.createElement("div");
        grade.className = `grade g${cartas.length} memoria`;
        let aberta = null, travado = false, achados = 0, jogadas = 0;

        cartas.forEach(fig => {
          const c = Motor.criarCartao({ nome: "carta", emoji: "❓" });
          c.classList.add("virada");
          c.addEventListener("click", () => {
            if (travado || !c.classList.contains("virada")) return;
            c.classList.remove("virada");
            c.textContent = fig.emoji;
            Motor.ploc();
            if (!aberta) { aberta = { c, fig }; return; }
            jogadas++;
            if (aberta.fig === fig) {
              achados++;
              [aberta.c, c].forEach(x => { x.classList.add("certo"); Motor.animar(x, "pula"); });
              Motor.comemorar(c);
              Motor.tim();
              aberta = null;
              if (achados === pares) {
                Motor.falar(`Você achou todos os pares em ${jogadas} jogadas!`).then(() =>
                  Motor.depois(() => Motor.telaFim(area, pares, pares, jogo), 400));
              } else {
                Motor.falar(`${Motor.maiuscula(fig.plural)}!`);
              }
            } else {
              travado = true;
              const anterior = aberta;
              aberta = null;
              Motor.depois(() => {
                [anterior.c, c].forEach(x => { x.classList.add("virada"); x.textContent = "❓"; });
                travado = false;
              }, 1000);
            }
          });
          grade.appendChild(c);
        });
        area.appendChild(grade);
        Motor.falar("Ache os pares iguais!");
      }

      jogo();
    },
  });
})();
