// Bolhas — bolhas sobem pela tela; tocar estoura com "ploc". Algumas trazem um bichinho.
(() => {
  const CORES = [
    { nome: "vermelho", h: 0 }, { nome: "laranja", h: 30 }, { nome: "amarelo", h: 55 },
    { nome: "verde", h: 120 }, { nome: "azul", h: 210 }, { nome: "roxo", h: 275 }, { nome: "rosa", h: 330 },
  ];

  JOGOS.push({
    id: "bolhas",
    nome: "Bolhas",
    icone: "🫧",
    faixas: ["1-2", "2-3"],
    iniciar(area, faixa) {
      // Para 2-3 anos a bolha fala a cor; para 1-2, só o bichinho (quando tem)
      const falaCor = !!faixa && faixa.id === "2-3";

      function estourar(b, fig, cor) {
        if (b.dataset.estourou) return;
        b.dataset.estourou = "1";
        Motor.ploc();
        const m = getComputedStyle(b).transform;
        b.style.animation = "none";
        b.style.transform = m;
        requestAnimationFrame(() => {
          b.style.transition = "transform .2s, opacity .2s";
          b.style.transform = `${m === "none" ? "" : m} scale(1.8)`;
          b.style.opacity = "0";
        });
        setTimeout(() => b.remove(), 250);
        if (fig) Motor.falar(`${Motor.maiuscula(fig.artigo)} ${fig.nome}!`);
        else if (falaCor) Motor.falar(Motor.maiuscula(cor.nome));
      }

      function soltarBolha() {
        const b = document.createElement("button");
        b.className = "bolha";
        const tam = Motor.aleatorio(90, 170);
        const cor = Motor.sortear(CORES);
        const fig = Math.random() < 0.4 ? Motor.sortear(FIGURAS) : null;
        b.style.width = b.style.height = tam + "px";
        b.style.left = Motor.aleatorio(0, Math.max(0, window.innerWidth - tam)) + "px";
        b.style.setProperty("--h", cor.h);
        b.style.setProperty("--t", Motor.aleatorio(6, 10) + "s");
        if (fig) b.textContent = fig.emoji;
        b.addEventListener("pointerdown", () => estourar(b, fig, cor));
        b.addEventListener("animationend", () => b.remove());
        area.appendChild(b);
      }

      // Loop de bolhas: para sozinho quando a sessão muda (criança saiu do jogo)
      (function ciclo() {
        if (area.querySelectorAll(".bolha").length < 8) soltarBolha();
        Motor.depois(ciclo, 900);
      })();
    },
  });
})();
