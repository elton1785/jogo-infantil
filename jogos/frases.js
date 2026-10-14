// Complete a frase — ler a frase e escolher a palavra que falta.
(() => {
  const FRASES = [
    ["O ___ late no quintal.", "cachorro", "peixe", "livro"],
    ["A ___ voa no jardim.", "borboleta", "mesa", "pedra"],
    ["Eu bebo ___ quando tenho sede.", "água", "sapato", "lápis"],
    ["O peixe nada no ___.", "rio", "fogão", "armário"],
    ["Eu escovo os ___ depois de comer.", "dentes", "pés", "livros"],
    ["A vaca dá ___.", "leite", "suco", "pão"],
    ["Eu uso o ___ para escrever.", "lápis", "prato", "chapéu"],
    ["À noite eu ___ na minha cama.", "durmo", "nado", "pulo"],
    ["O gato faz ___.", "miau", "au au", "piu piu"],
    ["A ___ é vermelha e doce.", "maçã", "cebola", "pedra"],
    ["O avião voa no ___.", "céu", "mar", "chão"],
    ["Eu vou à ___ para aprender.", "escola", "praia", "piscina"],
    ["Eu lavo as mãos com água e ___.", "sabão", "areia", "farinha"],
    ["A galinha bota ___.", "ovos", "pedras", "folhas"],
    ["No meu aniversário, ganhei um ___.", "presente", "tijolo", "parafuso"],
    ["O macaco come ___.", "banana", "sabonete", "papel"],
    ["Eu enxergo com os ___.", "olhos", "joelhos", "cotovelos"],
    ["Manaus fica no estado do ___.", "Amazonas", "Paraná", "Ceará"],
    ["Quando chove, eu abro o ___.", "guarda-chuva", "livro", "forno"],
    ["O sol nasce de ___.", "manhã", "noite", "madrugada"],
    ["O bombeiro apaga o ___.", "fogo", "rio", "vento"],
    ["A ___ cuida das plantas do jardim.", "jardineira", "piloto", "cozinheira"],
    ["O boto mora no ___.", "rio", "deserto", "telhado"],
    ["Eu calço os ___ antes de sair.", "sapatos", "pratos", "óculos"],
  ];

  JOGOS.push({
    id: "frases",
    nome: "Complete a Frase",
    icone: "💬",
    faixas: ["6-8", "8-10"],
    iniciar(area) {
      let ultima = null;
      Motor.modoQuiz({
        area, rodada: 10, desenhar: Motor.desenharTexto("palavra"),
        gerar() {
          const f = Motor.sortear(FRASES.filter(x => x !== ultima));
          ultima = f;
          const [frase, certaTxt, ...erradas] = f;
          const opcoes = [certaTxt, ...erradas].map(nome => ({ nome }));
          return {
            pergunta: "Leia e complete a frase.",
            opcoes, certa: opcoes[0],
            mostrar: el => { el.classList.add("frase"); el.textContent = frase; },
            completa: frase.replace("___", certaTxt),
          };
        },
        aoAcertar: (_, q) => Motor.falar(q.completa),
      });
    },
  });
})();
