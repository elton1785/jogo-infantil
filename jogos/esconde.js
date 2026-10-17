// Esconde-esconde — um bichinho se esconde numa caixa; a criança procura.
(() => {
  JOGOS.push({
    id: "esconde",
    nome: "Esconde-esconde",
    icone: "📦",
    faixas: ["1-2", "2-3"],
    iniciar(area, faixa) {
      const s = Motor.sessaoAtual();
      const qtdCaixas = faixa && faixa.id === "1-2" ? 2 : 3;
      const palco = document.createElement("div");
      palco.className = "palco";
      area.appendChild(palco);
      let ultimo = null, errou = false;
      const fase = Motor.fases(area, () => this.iniciar(area, faixa));

      async function rodada() {
        errou = false;
        const bicho = Motor.sortear(FIGURAS.slice(0, 10).filter(f => f !== ultimo));
        ultimo = bicho;
        palco.innerHTML = "";

        // 1. Mostra o bichinho
        const visto = document.createElement("div");
        visto.className = "mostrando";
        visto.textContent = bicho.emoji;
        palco.appendChild(visto);
        await Motor.falar(`${Motor.maiuscula(bicho.artigo)} ${bicho.nome} vai se esconder!`);
        if (s !== Motor.sessaoAtual()) return;

        // 2. Caixas fechadas
        palco.innerHTML = "";
        const grade = document.createElement("div");
        grade.className = `grade g${qtdCaixas}`;
        const esconderijo = Motor.aleatorio(0, qtdCaixas - 1);
        let achou = false;
        for (let i = 0; i < qtdCaixas; i++) {
          const c = Motor.criarCartao({ nome: "caixa", emoji: "📦" });
          c.addEventListener("click", async () => {
            if (achou || c.disabled) return;
            if (i !== esconderijo) {
              Motor.animar(c, "balanca");
              errou = true;
              c.textContent = "💨";
              c.disabled = true;
              Motor.falar("Aqui não!");
              return;
            }
            achou = true;
            c.textContent = bicho.emoji;
            c.classList.add("certo");
            Motor.animar(c, "pula");
            Motor.comemorar(c);
            Motor.tim();
            await Motor.falar(`Achou! ${Motor.maiuscula(bicho.artigo)} ${bicho.nome}!`);
            if (!fase(!errou)) Motor.depois(rodada, 900);
          });
          grade.appendChild(c);
        }
        palco.appendChild(grade);
        Motor.falar(`Cadê ${bicho.artigo} ${bicho.nome}?`);
      }

      rodada();
    },
  });
})();
