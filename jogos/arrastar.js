// Jogos de arrastar: cada peça vai para o seu lugar (usa Motor.modoArrastar).
(() => {
  const { comEmoji, comTexto, maiuscula, embaralhar, sortear } = Motor;
  const oa = x => `${x.artigo} ${x.nome}`;

  // Monta alvos/peças a partir de grupos [{ alvo: {...}, itens: [...] }], `porAlvo` peças de cada
  function sortearGrupos(grupos, qtdAlvos, porAlvo) {
    const escolhidos = embaralhar(grupos).slice(0, qtdAlvos);
    return {
      alvos: escolhidos.map(g => ({ id: g.alvo.nome, nome: g.alvo.nome, desenhar: g.alvo.desenhar || comEmoji(g.alvo.emoji), ...g.alvo })),
      pecas: escolhidos.flatMap(g => embaralhar(g.itens).slice(0, porAlvo).map(i => ({
        alvo: g.alvo.nome, nome: i.nome, desenhar: i.desenhar || comEmoji(i.emoji), ...i,
      }))),
    };
  }

  // ---------- Comida dos bichos ----------
  const COMIDAS = [
    { alvo: { emoji: "🐒", nome: "macaco",   artigo: "o" }, itens: [{ emoji: "🍌", nome: "banana" }] },
    { alvo: { emoji: "🐰", nome: "coelho",   artigo: "o" }, itens: [{ emoji: "🥕", nome: "cenoura" }, { emoji: "🥬", nome: "alface" }] },
    { alvo: { emoji: "🐶", nome: "cachorro", artigo: "o" }, itens: [{ emoji: "🦴", nome: "osso" }] },
    { alvo: { emoji: "🐱", nome: "gato",     artigo: "o" }, itens: [{ emoji: "🐟", nome: "peixe" }] },
    { alvo: { emoji: "🐭", nome: "rato",     artigo: "o" }, itens: [{ emoji: "🧀", nome: "queijo" }] },
    { alvo: { emoji: "🐮", nome: "vaca",     artigo: "a" }, itens: [{ emoji: "🌾", nome: "capim" }] },
    { alvo: { emoji: "🐼", nome: "panda",    artigo: "o" }, itens: [{ emoji: "🎋", nome: "bambu" }] },
    { alvo: { emoji: "🐝", nome: "abelha",   artigo: "a" }, itens: [{ emoji: "🌻", nome: "flor" }] },
    { alvo: { emoji: "🐻", nome: "urso",     artigo: "o" }, itens: [{ emoji: "🍯", nome: "mel" }] },
    { alvo: { emoji: "🐔", nome: "galinha",  artigo: "a" }, itens: [{ emoji: "🌽", nome: "milho" }] },
    { alvo: { emoji: "🐿️", nome: "esquilo",  artigo: "o" }, itens: [{ emoji: "🌰", nome: "castanha" }] },
    { alvo: { emoji: "🐴", nome: "cavalo",   artigo: "o" }, itens: [{ emoji: "🍎", nome: "maçã" }] },
    { alvo: { emoji: "🐸", nome: "sapo",     artigo: "o" }, itens: [{ emoji: "🪰", nome: "mosquinha" }] },
    { alvo: { emoji: "🐛", nome: "lagarta",  artigo: "a" }, itens: [{ emoji: "🍃", nome: "folha" }] },
    { alvo: { emoji: "🐧", nome: "pinguim",  artigo: "o" }, itens: [{ emoji: "🦐", nome: "camarão" }] },
  ];

  JOGOS.push({
    id: "comida", nome: "Comida dos Bichos", icone: "🍌", faixas: ["2-3", "3-4"],
    iniciar(area, faixa) {
      const qtd = faixa && faixa.id === "2-3" ? 2 : 3;
      Motor.modoArrastar({
        area,
        gerar: () => ({
          ...sortearGrupos(COMIDAS, qtd, 1),
          anuncio: "Leve a comida certa para cada bichinho!",
          aoAcertar: (p, a) => `Nham nham! ${maiuscula(oa(a))} adora ${p.nome}!`,
          aoErrar: (p, a) => `Hum, ${oa(a)} quer outra coisa.`,
        }),
      });
    },
  });

  // ---------- Separar as cores ----------
  const COR = (nome, hex) => ({
    nome, desenhar: el => { el.innerHTML = `<span class="cesto" style="border-color:${hex};background:${hex}33">🧺</span>`; },
  });
  const CORES = [
    { alvo: COR("vermelho", "#e63946"), itens: [{ emoji: "🍎", nome: "maçã" }, { emoji: "🍓", nome: "morango" }, { emoji: "🍅", nome: "tomate" }, { emoji: "🚒", nome: "caminhão de bombeiro" }, { emoji: "❤️", nome: "coração" }] },
    { alvo: COR("amarelo", "#ffd60a"),  itens: [{ emoji: "🍌", nome: "banana" }, { emoji: "🌻", nome: "girassol" }, { emoji: "🐤", nome: "pintinho" }, { emoji: "🧀", nome: "queijo" }, { emoji: "⭐", nome: "estrela" }] },
    { alvo: COR("verde", "#2a9d55"),    itens: [{ emoji: "🐸", nome: "sapo" }, { emoji: "🥦", nome: "brócolis" }, { emoji: "🍀", nome: "trevo" }, { emoji: "🥒", nome: "pepino" }, { emoji: "🌲", nome: "árvore" }] },
    { alvo: COR("azul", "#277da1"),     itens: [{ emoji: "🐳", nome: "baleia" }, { emoji: "💙", nome: "coração azul" }, { emoji: "🧢", nome: "boné" }, { emoji: "👖", nome: "calça" }, { emoji: "🦋", nome: "borboleta" }] },
    { alvo: COR("laranja", "#f77f00"),  itens: [{ emoji: "🍊", nome: "laranja" }, { emoji: "🥕", nome: "cenoura" }, { emoji: "🎃", nome: "abóbora" }, { emoji: "🦊", nome: "raposa" }, { emoji: "🏀", nome: "bola de basquete" }] },
    { alvo: COR("roxo", "#7b2cbf"),     itens: [{ emoji: "🍇", nome: "uva" }, { emoji: "🍆", nome: "berinjela" }, { emoji: "💜", nome: "coração roxo" }, { emoji: "🔮", nome: "bola de cristal" }] },
  ];

  JOGOS.push({
    id: "separar-cores", nome: "Separar Cores", icone: "🧺", faixas: ["3-4", "4-5"],
    iniciar(area, faixa) {
      const qtd = faixa && faixa.id === "4-5" ? 3 : 2;
      Motor.modoArrastar({
        area,
        gerar: () => ({
          ...sortearGrupos(CORES, qtd, 2),
          anuncio: "Coloque cada coisa no cesto da mesma cor!",
          aoAcertar: (p, a) => `${maiuscula(p.nome)}. ${maiuscula(a.nome)}!`,
          aoErrar: (p, a) => `Esse não é ${a.nome}.`,
        }),
      });
    },
  });

  // ---------- Onde vive? ----------
  const HABITATS = [
    { alvo: { emoji: "🌳", nome: "terra", fala: "na terra" }, itens: [
      { emoji: "🐶", nome: "cachorro" }, { emoji: "🐘", nome: "elefante" }, { emoji: "🐆", nome: "onça" },
      { emoji: "🦒", nome: "girafa" }, { emoji: "🐴", nome: "cavalo" }, { emoji: "🐍", nome: "cobra" },
      { emoji: "🦓", nome: "zebra" }, { emoji: "🐑", nome: "ovelha" }, { emoji: "🦁", nome: "leão" }, { emoji: "🐒", nome: "macaco" }] },
    { alvo: { emoji: "🌊", nome: "água", fala: "na água" }, itens: [
      { emoji: "🐟", nome: "peixe" }, { emoji: "🐬", nome: "golfinho" }, { emoji: "🐙", nome: "polvo" },
      { emoji: "🦈", nome: "tubarão" }, { emoji: "🐳", nome: "baleia" },
      { emoji: "🦀", nome: "caranguejo" }, { emoji: "🐡", nome: "baiacu" }, { emoji: "🦑", nome: "lula" }, { emoji: "🪼", nome: "água-viva" }] },
    { alvo: { emoji: "☁️", nome: "ar", fala: "voando no céu" }, itens: [
      { emoji: "🦅", nome: "águia" }, { emoji: "🦜", nome: "arara" }, { emoji: "🦋", nome: "borboleta" },
      { emoji: "🐝", nome: "abelha" }, { emoji: "🦉", nome: "coruja" },
      { emoji: "🐦", nome: "passarinho" }, { emoji: "🦇", nome: "morcego" }, { emoji: "🕊️", nome: "pomba" }, { emoji: "🦩", nome: "flamingo" }] },
  ];

  JOGOS.push({
    id: "habitat", nome: "Onde Vive?", icone: "🌊", faixas: ["4-5", "5-6"],
    iniciar(area) {
      Motor.modoArrastar({
        area, rodada: 5,
        gerar: () => ({
          ...sortearGrupos(HABITATS, 3, 2),
          anuncio: "Cada bicho vive num lugar: na terra, na água ou voando no céu. Arraste cada um para o seu lugar!",
          aoAcertar: (p, a) => `${maiuscula(p.nome)} vive ${a.fala}!`,
          aoErrar: (p, a) => `${maiuscula(p.nome)} não vive ${a.fala}.`,
        }),
      });
    },
  });

  // ---------- Arrumar a casa ----------
  // 6 cômodos; cada rodada sorteia 3 (e o motor evita repetir os objetos das últimas rodadas).
  // Só objetos que têm um lugar certo, sem dúvida (nada de bola que pode ser do quarto ou do quintal).
  const COMODOS = [
    { alvo: { emoji: "🛁", nome: "banheiro", artigo: "o" }, itens: [
      { emoji: "🪥", nome: "escova de dentes" }, { emoji: "🧼", nome: "sabonete" }, { emoji: "🧻", nome: "papel higiênico" },
      { emoji: "🧴", nome: "xampu" }, { emoji: "🧽", nome: "esponja de banho" }, { emoji: "🦆", nome: "patinho de borracha" }] },
    { alvo: { emoji: "🍳", nome: "cozinha", artigo: "a" }, itens: [
      { emoji: "🥄", nome: "colher" }, { emoji: "🍽️", nome: "prato" }, { emoji: "☕", nome: "xícara" }, { emoji: "🍲", nome: "panela" },
      { emoji: "🍴", nome: "garfo e faca" }, { emoji: "🫖", nome: "bule" }, { emoji: "🥛", nome: "copo de leite" }, { emoji: "🧂", nome: "saleiro" }] },
    { alvo: { emoji: "🛏️", nome: "quarto", artigo: "o" }, itens: [
      { emoji: "🧸", nome: "ursinho" }, { emoji: "⏰", nome: "despertador" }, { emoji: "🧦", nome: "meias" },
      { emoji: "👕", nome: "camiseta" }, { emoji: "👗", nome: "vestido" }, { emoji: "🎒", nome: "mochila" }] },
    { alvo: { emoji: "🛋️", nome: "sala", artigo: "a" }, itens: [
      { emoji: "📺", nome: "televisão" }, { emoji: "🪴", nome: "vaso de planta" }, { emoji: "🖼️", nome: "quadro" },
      { emoji: "🕰️", nome: "relógio da sala" }, { emoji: "🎹", nome: "piano" }] },
    { alvo: { emoji: "🌳", nome: "quintal", artigo: "o" }, itens: [
      { emoji: "🪣", nome: "balde" }, { emoji: "⚽", nome: "bola" }, { emoji: "🌻", nome: "girassol" },
      { emoji: "🌱", nome: "plantinha" }, { emoji: "🚲", nome: "bicicleta" }, { emoji: "🪁", nome: "pipa" }] },
    { alvo: { emoji: "🚗", nome: "garagem", artigo: "a" }, itens: [
      { emoji: "🔧", nome: "chave inglesa" }, { emoji: "🔨", nome: "martelo" }, { emoji: "🪛", nome: "chave de fenda" },
      { emoji: "🧰", nome: "caixa de ferramentas" }, { emoji: "⛽", nome: "galão de gasolina" }, { emoji: "🛢️", nome: "lata de óleo" }] },
  ];
  const listaFalada = nomes => nomes.length > 1 ? `${nomes.slice(0, -1).join(", ")} ou ${nomes[nomes.length - 1]}` : nomes[0];

  JOGOS.push({
    id: "casa", nome: "Arrumar a Casa", icone: "🏠", faixas: ["3-4", "4-5"],
    iniciar(area, faixa) {
      const qtd = faixa && faixa.id === "4-5" ? 2 : 1;
      Motor.modoArrastar({
        area,
        gerar: () => {
          const r = sortearGrupos(COMODOS, 3, qtd);
          return {
            ...r,
            anuncio: `Vamos arrumar a casa! Leve cada coisa para o lugar certo: ${listaFalada(r.alvos.map(a => oa(a)))}.`,
            aoAcertar: (p, a) => `${maiuscula(p.nome)} fica n${oa(a)}.`,
            aoErrar: (p, a) => `${maiuscula(p.nome)} não fica n${oa(a)}.`,
          };
        },
      });
    },
  });

  // ---------- Sombras (arrastar a figura até a sombra) ----------
  JOGOS.push({
    id: "sombra-arrastar", nome: "Achar a Sombra", icone: "👤", faixas: ["2-3", "3-4"],
    iniciar(area, faixa) {
      const qtd = faixa && faixa.id === "2-3" ? 2 : 3;
      Motor.modoArrastar({
        area,
        gerar() {
          const figs = embaralhar(FIGURAS).slice(0, qtd);
          return {
            alvos: figs.map(f => ({ id: f.nome, nome: f.nome, desenhar: el => { el.innerHTML = `<span class="sombra"></span>`; el.firstChild.textContent = f.emoji; } })),
            pecas: figs.map(f => ({ alvo: f.nome, nome: f.nome, desenhar: comEmoji(f.emoji) })),
            anuncio: "Leve cada figura até a sua sombra!",
            aoAcertar: p => `${maiuscula(oa(FIGURAS.find(f => f.nome === p.nome)))}!`,
          };
        },
      });
    },
  });

  // ---------- Número e quantidade ----------
  JOGOS.push({
    id: "numero-quantidade", nome: "Número e Quantidade", icone: "🔢", faixas: ["4-5", "5-6"],
    iniciar(area, faixa) {
      const max = faixa && faixa.id === "5-6" ? 10 : 5;
      Motor.modoArrastar({
        area, rodada: 5,
        gerar() {
          const nums = embaralhar(Array.from({ length: max }, (_, i) => i + 1)).slice(0, 3);
          const e = sortear(["🍎", "⭐", "🐟", "🎈", "🍓", "🐞"]);
          return {
            alvos: nums.map(n => ({ id: String(n), nome: String(n), desenhar: comTexto(String(n)) })),
            pecas: nums.map(n => ({ alvo: String(n), nome: `${n}`, n, desenhar: el => { el.textContent = e.repeat(n); el.classList.add("grupinho"); } })),
            anuncio: "Leve cada grupinho até o número certo!",
            aoAcertar: p => `${maiuscula(NUMEROS_FALADOS[p.n])}!`,
          };
        },
      });
    },
  });

  // ---------- Ligar palavra e figura (leitura) ----------
  JOGOS.push({
    id: "palavra-figura", nome: "Palavra e Figura", icone: "🔗", faixas: ["5-6", "6-8"],
    iniciar(area, faixa) {
      const maiusculas = !faixa || faixa.id === "5-6";
      Motor.modoArrastar({
        area, rodada: 5,
        gerar() {
          const ps = embaralhar(PALAVRAS).slice(0, 3);
          return {
            alvos: ps.map(p => ({ id: p.palavra, nome: p.palavra, desenhar: comEmoji(p.emoji) })),
            pecas: ps.map(p => ({ alvo: p.palavra, nome: p.palavra, desenhar: comTexto(maiusculas ? p.palavra.toUpperCase() : p.palavra) })),
            anuncio: "Leia cada palavra e leve até a figura certa!",
            aoAcertar: p => maiuscula(p.nome),
          };
        },
      });
    },
  });

  // ---------- Maiúscula e minúscula ----------
  const LETRAS_FALA = { A: "á", B: "bê", C: "cê", D: "dê", E: "é", F: "éfe", G: "gê", H: "agá", I: "í", J: "jóta",
    L: "éle", M: "ême", N: "êne", O: "ó", P: "pê", Q: "quê", R: "érre", S: "ésse", T: "tê", U: "ú", V: "vê", X: "xis", Z: "zê" };

  JOGOS.push({
    id: "maiuscula", nome: "Maiúscula e minúscula", icone: "🔠", faixas: ["5-6", "6-8"],
    iniciar(area) {
      Motor.modoArrastar({
        area, rodada: 5,
        gerar() {
          const letras = embaralhar(Object.keys(LETRAS_FALA)).slice(0, 4);
          return {
            alvos: letras.map(l => ({ id: l, nome: l, desenhar: comTexto(l) })),
            pecas: letras.map(l => ({ alvo: l, nome: l.toLowerCase(), desenhar: comTexto(l.toLowerCase()) })),
            anuncio: "Leve cada letra minúscula até a sua letra maiúscula!",
            aoAcertar: (p, a) => `${maiuscula(LETRAS_FALA[a.id])}!`,
          };
        },
      });
    },
  });
})();
