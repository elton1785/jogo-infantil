// Navegação: escolha da idade → menu de jogos da faixa → jogo.
//
// Para criar um jogo novo: crie jogos/<nome>.js chamando JOGOS.push({...}) e
// inclua o <script> no index.html antes do app.js. Formato:
//   JOGOS.push({
//     id: "cores", nome: "Cores", icone: "🎨",
//     faixas: ["2-3", "3-4"],          // ids de FAIXAS (js/motor.js)
//     iniciar(area) { ... },            // desenha o jogo dentro de `area`
//   });

const App = (() => {
  const telas = document.querySelectorAll(".tela");
  const listaIdades = document.getElementById("lista-idades");
  const listaJogos = document.getElementById("lista-jogos");
  const tituloMenu = document.getElementById("titulo-menu");
  const areaJogo = document.getElementById("area-jogo");
  const btnVoltar = document.getElementById("btn-voltar");

  let telaAtual = "idades";
  let faixaAtual = null;

  function lembrar(chave, valor) {
    try { localStorage.setItem(chave, valor); } catch (e) {}
  }
  function lembrado(chave) {
    try { return localStorage.getItem(chave); } catch (e) { return null; }
  }

  function telaCheia() {
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }

  function mostrar(id) {
    telaAtual = id;
    telas.forEach(t => t.classList.toggle("ativa", t.id === id));
    btnVoltar.style.display = id === "idades" ? "none" : "block";
  }

  function criarOpcao(icone, rotulo, aoClicar, vazia) {
    const b = document.createElement("button");
    b.className = "opcao" + (vazia ? " vazia" : "");
    b.innerHTML = `<span class="icone"></span><span class="rotulo"></span>`;
    b.querySelector(".icone").textContent = icone;
    b.querySelector(".rotulo").textContent = rotulo;
    b.addEventListener("click", aoClicar);
    return b;
  }

  function jogosDa(faixa) { return JOGOS.filter(j => j.faixas.includes(faixa.id)); }

  function abrirIdades() {
    Motor.novaSessao();
    listaIdades.innerHTML = "";
    FAIXAS.forEach(f => {
      const vazia = jogosDa(f).length === 0;
      listaIdades.appendChild(criarOpcao(f.icone, f.nome, () => { telaCheia(); abrirMenu(f); }, vazia));
    });
    mostrar("idades");
  }

  // Cada tela aberta entra no histórico, para o "voltar" do celular voltar uma tela
  function abrirMenu(faixa) {
    if (telaAtual === "idades") history.pushState({ tela: "menu" }, "");
    Motor.novaSessao();
    faixaAtual = faixa;
    lembrar("faixa", faixa.id);
    tituloMenu.textContent = `${faixa.icone} ${faixa.nome}`;
    listaJogos.innerHTML = "";
    const jogos = jogosDa(faixa);
    if (jogos.length === 0) {
      const aviso = document.createElement("div");
      aviso.className = "aviso";
      aviso.textContent = "🚧 Jogos desta idade em breve!";
      listaJogos.appendChild(aviso);
    }
    jogos.forEach(j => listaJogos.appendChild(criarOpcao(j.icone, j.nome, () => abrirJogo(j))));
    mostrar("menu");
  }

  function abrirJogo(jogo) {
    history.pushState({ tela: "jogo" }, "");
    Motor.novaSessao();
    areaJogo.innerHTML = "";
    mostrar("jogo");
    Motor.falar(jogo.nome);
    jogo.iniciar(areaJogo, faixaAtual);
  }

  function voltar() {
    if (telaAtual === "jogo") abrirMenu(faixaAtual);
    else abrirIdades();
  }

  // Botão 🏠 e "voltar" do celular fazem a mesma coisa: voltam uma tela.
  window.addEventListener("popstate", () => { if (telaAtual !== "idades") voltar(); });
  btnVoltar.addEventListener("click", () => {
    if (history.state && history.state.tela) history.back(); // o popstate acima faz a navegação
    else voltar();
  });

  abrirIdades();
  const ultima = FAIXAS.find(f => f.id === lembrado("faixa"));
  if (ultima) abrirMenu(ultima);
})();

// App instalável e offline (PWA). Só funciona em https ou localhost — abrindo o
// arquivo direto ou por http na rede local, o jogo roda normal, só não instala.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
