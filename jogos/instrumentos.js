// Música — instrumentos com sons sintetizados e um piano colorido.
(() => {
  const N = Motor.nota;
  const INSTRUMENTOS = [
    { emoji: "🥁", nome: "tambor",   artigo: "o", tocar: () => { N(140, { dur: 0.5, vol: 0.7, ate: 45 }); Motor.ruido({ dur: 0.15, vol: 0.2, freq: 800 }); } },
    { emoji: "🔔", nome: "sino",     artigo: "o", tocar: () => { N(1320, { dur: 2, vol: 0.25 }); N(3640, { dur: 1, vol: 0.06 }); } },
    { emoji: "🎹", nome: "piano",    artigo: "o", tocar: () => [262, 330, 392, 523].forEach((f, i) => N(f, { dur: 1, tipo: "triangle", vol: 0.3, inicio: i * 0.18 })) },
    { emoji: "🎻", nome: "violino",  artigo: "o", tocar: () => [440, 494, 523].forEach((f, i) => N(f, { dur: 0.5, tipo: "sawtooth", vol: 0.08, inicio: i * 0.35 })) },
    { emoji: "🎺", nome: "trompete", artigo: "o", tocar: () => { N(392, { dur: 0.35, tipo: "sawtooth", vol: 0.12 }); N(523, { dur: 0.7, tipo: "sawtooth", vol: 0.12, inicio: 0.35 }); } },
    { emoji: "🎸", nome: "violão",   artigo: "o", tocar: () => [196, 247, 294, 392].forEach((f, i) => N(f, { dur: 1.5, tipo: "triangle", vol: 0.25, inicio: i * 0.05 })) },
    { emoji: "🎷", nome: "saxofone", artigo: "o", tocar: () => [294, 330, 392].forEach((f, i) => N(f, { dur: 0.4, tipo: "square", vol: 0.07, inicio: i * 0.3 })) },
    { emoji: "📯", nome: "corneta",  artigo: "a", tocar: () => N(330, { dur: 1, tipo: "sawtooth", vol: 0.12, ate: 440 }) },
  ];

  // Teclas do piano: dó a dó, cada uma de uma cor
  const TECLAS = [
    { f: 261.63, cor: "#e63946", nome: "dó" },  { f: 293.66, cor: "#f77f00", nome: "ré" },
    { f: 329.63, cor: "#ffd60a", nome: "mi" },  { f: 349.23, cor: "#2a9d55", nome: "fá" },
    { f: 392.0,  cor: "#277da1", nome: "sol" }, { f: 440.0,  cor: "#4361ee", nome: "lá" },
    { f: 493.88, cor: "#7b2cbf", nome: "si" },  { f: 523.25, cor: "#ff70a6", nome: "dó" },
  ];
  // "Brilha, brilha, estrelinha" (índices das teclas)
  const ESTRELINHA = [0, 0, 4, 4, 5, 5, 4, -1, 3, 3, 2, 2, 1, 1, 0];

  function piano(area) {
    Motor.falar("Toque nas teclas para fazer música! O botão de nota toca uma cantiga.");
    const teclado = document.createElement("div");
    teclado.className = "teclado";
    const botoes = TECLAS.map(t => {
      const b = document.createElement("button");
      b.className = "tecla";
      b.style.background = t.cor;
      b.setAttribute("aria-label", t.nome);
      b.addEventListener("pointerdown", () => {
        N(t.f, { dur: 1.2, tipo: "triangle", vol: 0.35 });
        N(t.f * 2, { dur: 0.5, vol: 0.06 });
        Motor.animar(b, "apertada");
      });
      teclado.appendChild(b);
      return b;
    });
    area.appendChild(teclado);
    area.appendChild(Motor.botaoCanto("repetir", "🎵", "Tocar música", () => {
      ESTRELINHA.forEach((i, passo) => Motor.depois(() => {
        if (i >= 0) botoes[i].dispatchEvent(new PointerEvent("pointerdown"));
      }, passo * 450));
    }));
  }

  JOGOS.push({
    id: "musica",
    nome: "Música",
    icone: "🎵",
    faixas: ["1-2", "2-3", "3-4"],
    iniciar(area, faixa) {
      Motor.escolherModo(area, [
        { icone: "🎹", rotulo: "Piano", iniciar: () => piano(area) },
        {
          icone: "🥁", rotulo: "Instrumentos",
          iniciar: () => Motor.modoExplorar({
            area, itens: INSTRUMENTOS, porTela: 4,
            aoTocar: i => { i.tocar(); Motor.depois(() => Motor.falar(`${Motor.maiuscula(i.artigo)} ${i.nome}!`), 1100); },
          }),
        },
        {
          icone: "👂", rotulo: "Que som é?",
          iniciar: () => {
            let ultimo = null;
            const opcoes = Motor.ehPequeno(faixa) ? 2 : 3;
            Motor.modoQuiz({
              area,
              gerar() {
                const certa = Motor.sortear(INSTRUMENTOS.filter(i => i !== ultimo));
                ultimo = certa;
                const outros = Motor.embaralhar(INSTRUMENTOS.filter(i => i !== certa)).slice(0, opcoes - 1);
                return { pergunta: "Que instrumento é esse?", opcoes: [certa, ...outros], certa, aoFalar: certa.tocar };
              },
              aoAcertar: i => Motor.falar(`${Motor.maiuscula(i.artigo)} ${i.nome}!`),
            });
          },
        },
      ]);
    },
  });
})();
