// Placar geral dos jogos contra o computador, guardado no aparelho:
// vitórias de cada um, sequência de vitórias seguidas da criança e recordes.
const Placar = (() => {
  const chave = jogo => `placar-${jogo}`;
  const vazio = () => ({ vitorias: {}, rotulos: {}, sequencia: 0, melhorSequencia: 0, recordes: {} });

  function dados(jogo) {
    try { return { ...vazio(), ...JSON.parse(localStorage.getItem(chave(jogo))) }; } catch (e) { return vazio(); }
  }
  function salvar(jogo, d) {
    try { localStorage.setItem(chave(jogo), JSON.stringify(d)); } catch (e) { /* sem armazenamento */ }
  }

  // Fim de partida. `vencedor`: { id, rotulo } (id "voce" = a criança) ou null para empate.
  // Devolve { sequencia, novaMelhorSequencia }.
  function resultado(jogo, vencedor) {
    const d = dados(jogo);
    let novaMelhorSequencia = false;
    if (vencedor) {
      d.vitorias[vencedor.id] = (d.vitorias[vencedor.id] || 0) + 1;
      d.rotulos[vencedor.id] = vencedor.rotulo;
      if (vencedor.id === "voce") {
        d.sequencia++;
        if (d.sequencia > d.melhorSequencia) { novaMelhorSequencia = d.sequencia > 1; d.melhorSequencia = d.sequencia; }
      } else d.sequencia = 0;
    }
    salvar(jogo, d);
    return { sequencia: d.sequencia, novaMelhorSequencia };
  }

  // Guarda `valor` se for o maior já feito em `nome`; devolve true se é recorde novo
  function recorde(jogo, nome, valor) {
    const d = dados(jogo);
    if (!valor || valor <= (d.recordes[nome] || 0)) return false;
    const novo = nome in d.recordes; // o primeiro valor registrado não conta como "novo recorde"
    d.recordes[nome] = valor;
    salvar(jogo, d);
    return novo;
  }

  function zerar(jogo) {
    try { localStorage.removeItem(chave(jogo)); } catch (e) { /* sem armazenamento */ }
  }

  // Painel com o resumo. `recordes`: { nome: "rótulo" } dos recordes a mostrar.
  // `comZerar`: botão que pede dois toques (evita zerar sem querer).
  function painel(jogo, { recordes = {}, comZerar = false } = {}) {
    const d = dados(jogo);
    const el = document.createElement("div");
    el.className = "placar-geral";
    const ids = Object.keys(d.vitorias).sort((a, b) => (a === "voce" ? -1 : b === "voce" ? 1 : d.vitorias[b] - d.vitorias[a]));
    const linha = (texto, classe = "") => {
      const s = document.createElement("span");
      s.className = "item-placar " + classe;
      s.textContent = texto;
      el.appendChild(s);
    };
    linha("🏆 Vitórias", "titulo-placar");
    if (!ids.length) linha("ainda nenhuma partida");
    if (ids.length && !ids.includes("voce")) linha("🧒 Você 0", "voce");
    ids.forEach(id => linha(`${d.rotulos[id]} ${d.vitorias[id]}`, id === "voce" ? "voce" : ""));
    if (d.sequencia > 1) linha(`🔥 ${d.sequencia} seguidas`);
    if (d.melhorSequencia > 1) linha(`🥇 melhor sequência: ${d.melhorSequencia}`);
    Object.entries(recordes).forEach(([nome, rotulo]) => { if (d.recordes[nome]) linha(`⭐ ${rotulo}: ${d.recordes[nome]}`); });
    if (comZerar && ids.length) {
      const b = document.createElement("button");
      b.className = "zerar-placar";
      b.textContent = "🗑️ Zerar";
      let confirmar = false;
      b.addEventListener("click", () => {
        if (!confirmar) { confirmar = true; b.textContent = "Toque de novo para zerar"; return; }
        zerar(jogo);
        el.replaceWith(painel(jogo, { recordes, comZerar }));
      });
      el.appendChild(b);
    }
    return el;
  }

  return { dados, resultado, recorde, zerar, painel };
})();
