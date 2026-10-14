// Quebra-cabeça — a figura é cortada em peças; arrastar (ou tocar) cada peça até o lugar.
(() => {
  const TAMANHOS = { "3-4": [2, 1], "4-5": [2, 2], "5-6": [3, 2], "6-8": [3, 3] }; // [colunas, linhas]
  const FIGS = ["🐶", "🐱", "🦁", "🐸", "🐼", "🦊", "🐵", "🐯", "🐮", "🐷", "🦄", "🐙", "🍉", "🚗", "🏠", "🌻"];

  JOGOS.push({
    id: "quebra-cabeca",
    nome: "Quebra-cabeça",
    icone: "🧩",
    faixas: ["3-4", "4-5", "5-6", "6-8"],
    iniciar(area, faixa) {
      const [cols, rows] = TAMANHOS[faixa && faixa.id] || [2, 2];
      // Para os menores, a figura aparece clarinha no tabuleiro como guia
      const comGuia = !faixa || ["3-4", "4-5"].includes(faixa.id);
      let ultima = null;

      function jogo() {
        area.innerHTML = "";
        const emoji = Motor.sortear(FIGS.filter(f => f !== ultima));
        ultima = emoji;
        const lado = Math.min(window.innerWidth * 0.5, window.innerHeight * 0.55, 380);
        const w = lado / cols, h = lado / rows;
        let restantes = cols * rows, selecionada = null;

        const tabuleiro = document.createElement("div");
        tabuleiro.className = "tabuleiro";
        Object.assign(tabuleiro.style, { width: lado + "px", height: lado + "px", gridTemplateColumns: `repeat(${cols}, 1fr)` });
        if (comGuia) tabuleiro.dataset.guia = emoji;
        tabuleiro.style.setProperty("--fs", lado * 0.8 + "px");

        // Pedaço da figura: um "recorte" do emoji grande na posição (c, r)
        function recorte(c, r) {
          const el = document.createElement("span");
          el.className = "recorte";
          Object.assign(el.style, { width: w + "px", height: h + "px" });
          const dentro = document.createElement("span");
          dentro.className = "recorte-dentro";
          dentro.textContent = emoji;
          Object.assign(dentro.style, { width: lado + "px", height: lado + "px", left: -c * w + "px", top: -r * h + "px", fontSize: lado * 0.8 + "px" });
          el.appendChild(dentro);
          return el;
        }

        const casas = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const casa = document.createElement("button");
          casa.className = "casa";
          casa.dataset.pos = `${c},${r}`;
          casa.addEventListener("click", () => { if (selecionada) encaixar(selecionada.peca, selecionada.pos, casa); });
          tabuleiro.appendChild(casa);
          casas.push(casa);
        }

        const bandeja = document.createElement("div");
        bandeja.className = "bandeja";

        function encaixar(peca, pos, casa) {
          peca.classList.remove("selecionada");
          selecionada = null;
          if (casa.dataset.pos !== pos || casa.firstChild) {
            Motor.animar(peca, "balanca");
            return false;
          }
          const [c, r] = pos.split(",").map(Number);
          casa.appendChild(recorte(c, r));
          peca.remove();
          Motor.ploc();
          restantes--;
          if (restantes === 0) {
            tabuleiro.classList.add("completo");
            Motor.comemorar(tabuleiro);
            Motor.tim();
            Motor.falar(`${Motor.elogio()} Você montou o quebra-cabeça!`).then(() => Motor.depois(jogo, 1200));
          }
          return true;
        }

        const pecas = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) pecas.push([c, r]);
        Motor.embaralhar(pecas).forEach(([c, r]) => {
          const peca = document.createElement("button");
          peca.className = "peca-quebra";
          const pos = `${c},${r}`;
          peca.appendChild(recorte(c, r));
          Motor.arrastavel(peca, { alvos: () => casas, aoSoltar: casa => encaixar(peca, pos, casa) });
          peca.addEventListener("click", () => {
            bandeja.querySelectorAll(".selecionada").forEach(x => x.classList.remove("selecionada"));
            selecionada = { peca, pos };
            peca.classList.add("selecionada");
          });
          bandeja.appendChild(peca);
        });

        const mesa = document.createElement("div");
        mesa.className = "mesa";
        mesa.append(tabuleiro, bandeja);
        area.appendChild(mesa);
        Motor.falar("Monte o quebra-cabeça! Arraste cada peça para o lugar certo.");
      }

      jogo();
    },
  });
})();
