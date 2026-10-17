// Leitura com apoio — para quem já conhece as letras:
//  Juntar Letras (B + A = BA), Ler Juntinho (sílaba por sílaba), Rimas e Palmas (contar sílabas).
(() => {
  const NOME_LETRA = { B: "bê", C: "cê", D: "dê", F: "éfe", G: "gê", J: "jóta", L: "éle", M: "ême", N: "êne",
    P: "pê", R: "érre", S: "ésse", T: "tê", V: "vê" };
  const VOGAIS = [["A", "á"], ["E", "é"], ["I", "í"], ["O", "ó"], ["U", "ú"]];
  const ORDEM = ["B", "P", "M", "L", "T", "D", "F", "V", "N", "R", "S", "C", "G", "J"];

  // ---------- Juntar Letras: arrastar a consoante até cada vogal ----------
  function juntarLetras(area) {
    const s = Motor.sessaoAtual();
    let indice = 0;

    function rodada() {
      area.innerHTML = "";
      const c = ORDEM[indice % ORDEM.length];
      let feitas = 0;

      const consoante = document.createElement("button");
      consoante.className = "letra-arrastar";
      consoante.textContent = c;

      const linha = document.createElement("div");
      linha.className = "vogais-alvo";
      const alvos = VOGAIS.map(([v, falaV]) => {
        const b = document.createElement("button");
        b.className = "vogal-alvo";
        b.innerHTML = `<span class="c"></span><span class="v"></span>`;
        b.children[1].textContent = v;
        b.addEventListener("click", () => juntar(b, v, falaV));
        linha.appendChild(b);
        return b;
      });

      function juntar(b, v, falaV) {
        if (b.dataset.feito) return false;
        b.dataset.feito = "1";
        b.children[0].textContent = c;
        b.classList.add("certo");
        Motor.animar(b, "pula");
        Motor.ploc();
        feitas++;
        const silaba = c.toLowerCase() + falaV;
        // "bê com á: bá!"
        Motor.falar(`${NOME_LETRA[c]} com ${falaV}: ${silaba}!`).then(() => {
          if (feitas < 5 || s !== Motor.sessaoAtual()) return;
          Motor.comemorar(linha);
          Motor.tim();
          Motor.falar(`${VOGAIS.map(([, f]) => c.toLowerCase() + f).join(", ")}! ${Motor.elogio()}`)
            .then(() => { indice++; Motor.depois(rodada, 800); });
        });
        return true;
      }

      Motor.arrastavel(consoante, {
        alvos: () => alvos.filter(a => !a.dataset.feito),
        aoSoltar: alvo => juntar(alvo, alvo.children[1].textContent, VOGAIS.find(([v]) => v === alvo.children[1].textContent)[1]),
      });
      consoante.addEventListener("click", () => Motor.falar(NOME_LETRA[c]));

      area.append(consoante, linha);
      area.appendChild(Motor.botaoCanto("proximo", "➡️", "Outra letra", () => { indice++; rodada(); }));
      Motor.falar(`Esta é a letra ${NOME_LETRA[c]}. Arraste o ${NOME_LETRA[c]} até cada vogal para formar sílabas!`);
    }
    rodada();
  }

  // ---------- Ler Juntinho: tocar cada pedaço, ouvir e depois ler tudo junto ----------
  const FRASES = [
    { texto: "O gato bebe leite.", emoji: "🐱🥛" },
    { texto: "A vaca come capim.", emoji: "🐮🌾" },
    { texto: "O sapo pula no lago.", emoji: "🐸" },
    { texto: "Eu gosto de banana.", emoji: "🍌" },
    { texto: "O sol é amarelo.", emoji: "☀️" },
    { texto: "A lua brilha à noite.", emoji: "🌙" },
    { texto: "O macaco sobe na árvore.", emoji: "🐒🌳" },
    { texto: "O pato nada no rio.", emoji: "🦆" },
    { texto: "A menina lê um livro.", emoji: "👧📖" },
    { texto: "O menino chuta a bola.", emoji: "👦⚽" },
    { texto: "A abelha faz mel.", emoji: "🐝🍯" },
    { texto: "O bolo é de chocolate.", emoji: "🎂🍫" },
    { texto: "A fada tem uma varinha.", emoji: "🧚" },
    { texto: "O peixe mora no aquário.", emoji: "🐠" },
  ];

  function lerJuntinho(area, modo) {
    const s = Motor.sessaoAtual();
    let ultimo = null;

    function rodada() {
      area.innerHTML = "";
      // Pedaços: sílabas de uma palavra, ou palavras de uma frase
      const item = modo === "frases"
        ? Motor.sortear(FRASES.filter(f => f !== ultimo))
        : Motor.sortear(PALAVRAS.filter(p => p !== ultimo));
      ultimo = item;
      const pedacos = modo === "frases" ? item.texto.split(" ") : item.silabas;
      const inteiro = modo === "frases" ? item.texto : item.palavra.toUpperCase();
      let proximo = 0;

      const figura = document.createElement("div");
      figura.className = "figura-surpresa";
      figura.textContent = "❓";

      const linha = document.createElement("div");
      linha.className = "pedacos" + (modo === "frases" ? " frase-pedacos" : "");
      const chips = pedacos.map((p, i) => {
        const b = document.createElement("button");
        b.className = "pedaco" + (i === 0 ? " proximo-pedaco" : "");
        b.textContent = p;
        b.addEventListener("click", () => {
          // Já leu tudo: tocar de novo só repete o pedaço
          if (proximo >= chips.length) { Motor.falar(p.toLowerCase().replace(/[.,]/g, "")); return; }
          if (i !== proximo) { Motor.animar(chips[proximo], "pula"); return; }
          Motor.falar(p.toLowerCase().replace(/[.,]/g, ""));
          b.classList.remove("proximo-pedaco");
          b.classList.add("lido");
          proximo++;
          if (proximo < chips.length) chips[proximo].classList.add("proximo-pedaco");
          else juntar.classList.add("visivel");
        });
        linha.appendChild(b);
        return b;
      });

      const juntar = document.createElement("button");
      juntar.className = "juntar";
      juntar.textContent = `👉 ${inteiro}`;
      juntar.addEventListener("click", async () => {
        if (!juntar.classList.contains("visivel") || juntar.disabled) return;
        juntar.disabled = true;
        figura.textContent = item.emoji;
        Motor.animar(figura, "pula");
        Motor.comemorar(figura);
        Motor.tim();
        await Motor.falar(modo === "frases" ? item.texto : item.palavra);
        if (s !== Motor.sessaoAtual()) return;
        await Motor.falar(Motor.elogio());
        Motor.depois(rodada, 900);
      });

      area.append(figura, linha, juntar);
      Motor.falar(modo === "frases"
        ? "Toque em cada palavra para ler. Depois leia a frase inteira!"
        : "Toque em cada sílaba para ler. Depois junte tudo!");
    }
    rodada();
  }

  // ---------- Rimas ----------
  const RIMAS = [
    [["gato", "🐱"], ["pato", "🦆"], ["rato", "🐭"], ["sapato", "👟"]],
    [["mão", "✋"], ["pão", "🍞"], ["avião", "✈️"], ["balão", "🎈"], ["limão", "🍋"], ["leão", "🦁"], ["cão", "🐕"], ["melão", "🍈"], ["feijão", "🫘"]],
    [["foca", "🦭"], ["boca", "👄"], ["pipoca", "🍿"], ["minhoca", "🪱"]],
    [["estrela", "⭐"], ["janela", "🪟"], ["panela", "🍳"], ["vela", "🕯️"]],
    [["anel", "💍"], ["papel", "📄"], ["pastel", "🥟"], ["mel", "🍯"]],
    [["abelha", "🐝"], ["ovelha", "🐑"], ["orelha", "👂"]],
    [["queijo", "🧀"], ["beijo", "💋"]],
    [["coelho", "🐰"], ["espelho", "🪞"], ["joelho", "🦵"]],
    [["flor", "🌸"], ["trator", "🚜"]],
    [["chapéu", "🎩"], ["céu", "🌤️"], ["troféu", "🏆"]],
    [["sorvete", "🍦"], ["foguete", "🚀"], ["sete", "7️⃣"]],
    [["caracol", "🐌"], ["sol", "☀️"], ["futebol", "⚽"], ["anzol", "🪝"]],
    [["girafa", "🦒"], ["garrafa", "🍾"]],
    [["cenoura", "🥕"], ["tesoura", "✂️"]],
    [["sino", "🔔"], ["menino", "👦"], ["pepino", "🥒"]],
    [["dente", "🦷"], ["presente", "🎁"], ["serpente", "🐍"]],
    [["porta", "🚪"], ["torta", "🥧"]],
  ];

  function rimas(area) {
    Motor.modoQuiz({
      area, rodada: 10,
      gerar() {
        const grupo = Motor.sortear(RIMAS);
        const [alvo, certa] = Motor.embaralhar(grupo);
        const outros = Motor.embaralhar(RIMAS.filter(g => g !== grupo)).slice(0, 2).map(g => Motor.sortear(g));
        const opcoes = [certa, ...outros].map(([nome, emoji]) => ({ nome, emoji }));
        return {
          opcoes, certa: opcoes[0],
          perguntaCom: ordem => `${Motor.maiuscula(alvo[0])}. O que rima com ${alvo[0]}? ${ordem.map(o => o.nome).join(", ")}?`,
          mostrar: el => { el.innerHTML = `<span class="grande"></span><span></span>`; el.children[0].textContent = alvo[1]; el.children[1].textContent = alvo[0]; },
          alvo: alvo[0],
        };
      },
      aoAcertar: (i, q) => Motor.falar(`${Motor.maiuscula(q.alvo)}, ${i.nome}! Rimam!`),
    });
  }

  // ---------- Palmas: quantas sílabas? ----------
  const EXTRAS = [
    { silabas: ["PÉ"], emoji: "🦶" }, { silabas: ["SOL"], emoji: "☀️" }, { silabas: ["MAR"], emoji: "🌊" },
    { silabas: ["PÃO"], emoji: "🍞" }, { silabas: ["FLOR"], emoji: "🌸" }, { silabas: ["MÃO"], emoji: "✋" },
    { silabas: ["BOR", "BO", "LE", "TA"], emoji: "🦋" }, { silabas: ["BI", "CI", "CLE", "TA"], emoji: "🚲" },
    { silabas: ["A", "BA", "CA", "XI"], emoji: "🍍" }, { silabas: ["MO", "CHI", "LA"], emoji: "🎒" },
  ].map(p => ({ ...p, palavra: p.silabas.join("").toLowerCase() }));

  const QUANTAS = { 1: "Uma sílaba", 2: "Duas sílabas", 3: "Três sílabas", 4: "Quatro sílabas" };

  function palmas(area) {
    const todas = [...PALAVRAS, ...EXTRAS];
    let ultima = null;
    Motor.modoQuiz({
      area, rodada: 10,
      desenhar: (item, b) => { b.innerHTML = `<span></span><span class="mini-palmas"></span>`; b.classList.add("numero", "letra");
        b.children[0].textContent = item.nome; b.children[1].textContent = "👏".repeat(item.n); },
      gerar() {
        const p = Motor.sortear(todas.filter(x => x !== ultima));
        ultima = p;
        const opcoes = [1, 2, 3, 4].map(n => ({ nome: String(n), n }));
        return {
          pergunta: `${Motor.maiuscula(p.palavra)}. Bata palmas: quantas sílabas tem ${p.palavra}?`,
          opcoes, certa: opcoes[p.silabas.length - 1],
          mostrar: el => { el.innerHTML = `<span class="grande"></span><span></span>`; el.children[0].textContent = p.emoji; el.children[1].textContent = p.palavra.toUpperCase(); },
          p,
        };
      },
      aoAcertar: (i, q) => Motor.falar(`${q.p.silabas.map(x => x.toLowerCase()).join("... ")}. ${QUANTAS[i.n]}!`),
    });
  }

  JOGOS.push({
    id: "juntar-letras", nome: "Juntar Letras", icone: "🧲", faixas: ["4-5", "5-6"],
    iniciar: area => juntarLetras(area),
  });

  JOGOS.push({
    id: "ler-juntinho", nome: "Ler Juntinho", icone: "👆", faixas: ["5-6", "6-8"],
    iniciar(area) {
      Motor.escolherModo(area, [
        { icone: "🔤", rotulo: "Palavras", iniciar: () => lerJuntinho(area, "palavras") },
        { icone: "💬", rotulo: "Frases",   iniciar: () => lerJuntinho(area, "frases") },
      ]);
    },
  });

  JOGOS.push({
    id: "rimas", nome: "Rimas", icone: "🎶", faixas: ["4-5", "5-6", "6-8"],
    iniciar: area => rimas(area),
  });

  JOGOS.push({
    id: "palmas", nome: "Bater Palmas", icone: "👏", faixas: ["4-5", "5-6"],
    iniciar: area => palmas(area),
  });
})();
