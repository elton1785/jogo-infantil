// Campo Minado das Abelhas: abrir as casas do jardim sem acordar as abelhas escondidas.
// - Os números contam quantas abelhas há nas 8 casas em volta (cada número tem uma cor).
// - A primeira casa tocada nunca tem abelha: elas são sorteadas depois do 1º toque, longe dele.
// - Casa sem abelhas em volta abre as vizinhas em cascata.
// - Para pôr 🚩: botão "🚩 Marcar" (modo), toque longo na casa, ou botão direito do mouse.
// - Tocar num número já aberto com todas as bandeiras em volta abre as outras vizinhas.
// Três tamanhos, tempo e recorde (menor tempo) por tamanho.
(() => {
  const NIVEIS = {
    pequeno: { icone: "🐣", nome: "Pequeno", l: 6, c: 6, minas: 5 },
    medio:   { icone: "🐥", nome: "Médio", l: 8, c: 8, minas: 10 },
    grande:  { icone: "🦅", nome: "Grande", l: 10, c: 10, minas: 18 },
  };
  const TOQUE_LONGO = 450; // ms segurando para marcar

  // ---------- Regras (funções puras, testadas em Node) ----------
  // Casas numeradas de 0 a l*c-1, linha por linha.
  function vizinhos(l, c, i) {
    const r = Math.floor(i / c), k = i % c, res = [];
    for (let dr = -1; dr <= 1; dr++) for (let dk = -1; dk <= 1; dk++) {
      if (!dr && !dk) continue;
      const rr = r + dr, kk = k + dk;
      if (rr >= 0 && rr < l && kk >= 0 && kk < c) res.push(rr * c + kk);
    }
    return res;
  }

  // Sorteia as abelhas fora da primeira casa tocada e das vizinhas dela
  function sortearMinas(l, c, qtd, primeira, rnd = Math.random) {
    const proibidas = new Set([primeira, ...vizinhos(l, c, primeira)]);
    let livres = [];
    for (let i = 0; i < l * c; i++) if (!proibidas.has(i)) livres.push(i);
    if (livres.length < qtd) { livres = []; for (let i = 0; i < l * c; i++) if (i !== primeira) livres.push(i); }
    for (let i = 0; i < qtd; i++) {
      const j = i + Math.floor(rnd() * (livres.length - i));
      [livres[i], livres[j]] = [livres[j], livres[i]];
    }
    return new Set(livres.slice(0, qtd));
  }

  const contar = (l, c, minas) => Array.from({ length: l * c }, (_, i) => vizinhos(l, c, i).filter(v => minas.has(v)).length);

  function criarCampo(l, c, qtd, primeira, rnd) {
    const minas = sortearMinas(l, c, qtd, primeira, rnd);
    return { l, c, minas, num: contar(l, c, minas) };
  }

  // Abre a casa i (se não estiver aberta nem marcada); casa "0" abre as vizinhas em cascata.
  // Muda `abertas` e devolve as casas abertas agora: [[casa, distância até i], ...]
  function abrir(campo, abertas, marcadas, i) {
    if (abertas.has(i) || marcadas.has(i)) return [];
    const novas = [], fila = [[i, 0]];
    abertas.add(i);
    while (fila.length) {
      const [j, d] = fila.shift();
      novas.push([j, d]);
      if (campo.minas.has(j) || campo.num[j]) continue;
      for (const v of vizinhos(campo.l, campo.c, j)) {
        if (!abertas.has(v) && !marcadas.has(v)) { abertas.add(v); fila.push([v, d + 1]); }
      }
    }
    return novas;
  }

  const venceu = (campo, abertas) => [...abertas].filter(i => !campo.minas.has(i)).length === campo.l * campo.c - campo.minas.size;

  const tempoTexto = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const recorde = nid => { try { return +localStorage.getItem(`minado-recorde-${nid}`) || 0; } catch (e) { return 0; } };
  const salvarRecorde = (nid, s) => { try { localStorage.setItem(`minado-recorde-${nid}`, s); } catch (e) { /* ok */ } };

  function escolher(area) {
    Motor.escolherModo(area, Object.entries(NIVEIS).map(([nid, n]) => ({
      icone: n.icone, rotulo: `${n.nome} ${n.l}×${n.c}`, iniciar: () => jogo(area, nid),
    })));
  }

  JOGOS.push({
    id: "minado",
    nome: "Campo Minado",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="8" fill="#2d6a4f"/><g stroke="#2d6a4f" stroke-width="2"><rect x="4" y="4" width="19" height="19" rx="3" fill="#74c69d"/><rect x="23" y="4" width="19" height="19" rx="3" fill="#95d5b2"/><rect x="42" y="4" width="18" height="19" rx="3" fill="#74c69d"/><rect x="4" y="23" width="19" height="19" rx="3" fill="#f3dfb5"/><rect x="23" y="23" width="19" height="19" rx="3" fill="#f3dfb5"/><rect x="42" y="23" width="18" height="19" rx="3" fill="#95d5b2"/><rect x="4" y="42" width="19" height="18" rx="3" fill="#f3dfb5"/><rect x="23" y="42" width="19" height="18" rx="3" fill="#f3dfb5"/><rect x="42" y="42" width="18" height="18" rx="3" fill="#74c69d"/></g><text x="13.5" y="38.5" font-size="15" font-weight="bold" text-anchor="middle" fill="#1d4ed8" font-family="sans-serif">1</text><text x="32.5" y="38.5" font-size="15" font-weight="bold" text-anchor="middle" fill="#15803d" font-family="sans-serif">2</text><line x1="48" y1="27" x2="48" y2="39" stroke="#333" stroke-width="2"/><path d="M48 27 L57 30.5 L48 34 Z" fill="#e63946"/><ellipse cx="51" cy="12" rx="6.5" ry="5" fill="#ffd60a" stroke="#222" stroke-width="1.3"/><path d="M49 7.6 V16.4 M53 7.6 V16.4" stroke="#222" stroke-width="2"/><ellipse cx="48" cy="7" rx="3.5" ry="2.4" fill="#e0f4ff" stroke="#555" stroke-width=".8"/><ellipse cx="54" cy="7" rx="3.5" ry="2.4" fill="#e0f4ff" stroke="#555" stroke-width=".8"/></svg>',
    faixas: ["6-8", "8-10"],
    iniciar(area) { escolher(area); },
  });

  function jogo(area, nid) {
    const N = NIVEIS[nid];
    const sessao = Motor.sessaoAtual();
    let campo = null, abertas = new Set(), marcadas = new Set(), reveladas = new Set();
    let modo = "abrir", acabou = false, ganhou = false, explodiu = -1, segundos = 0, relogio = null;
    let casas = [], grade, infoAbelhas, infoTempo, botoesModo = {};

    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "minado-tela";
    area.appendChild(tela);
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);

    // ---------- Tela ----------
    function desenhar() {
      tela.innerHTML = "";
      const larg = tela.clientWidth, alt = tela.clientHeight, deitado = larg > alt;
      tela.classList.toggle("deitado", deitado);

      const infos = document.createElement("div");
      infos.className = "minado-infos";
      const pilula = () => { const p = document.createElement("div"); p.className = "cubo-info"; infos.appendChild(p); return p; };
      pilula().textContent = `${N.icone} ${N.nome}`;
      infoAbelhas = pilula();
      infoTempo = pilula();
      const rec = recorde(nid);
      if (rec) pilula().textContent = `🏆 ${tempoTexto(rec)}`;
      infos.appendChild(Motor.botaoSom());

      // Modo do toque: abrir ou marcar
      const modos = document.createElement("div");
      modos.className = "minado-modos";
      [["abrir", "⛏️ Abrir"], ["marcar", "🚩 Marcar"]].forEach(([m, rotulo]) => {
        const b = document.createElement("button");
        b.className = "minado-op";
        b.textContent = rotulo;
        b.addEventListener("click", () => trocarModo(m));
        botoesModo[m] = b;
        modos.appendChild(b);
      });

      const cel = Math.floor(deitado
        ? Math.min((alt - 16) / N.l, (larg - 250) / N.c)
        : Math.min((larg - 16) / N.c, (alt - 240) / N.l));
      grade = document.createElement("div");
      grade.className = "minado-grade";
      Object.assign(grade.style, {
        gridTemplateColumns: `repeat(${N.c}, ${cel}px)`, gridTemplateRows: `repeat(${N.l}, ${cel}px)`, fontSize: cel * 0.55 + "px",
      });
      casas = [];
      for (let i = 0; i < N.l * N.c; i++) {
        const b = document.createElement("button");
        b.dataset.i = i;
        ligarToques(b, i);
        casas.push(b);
        grade.appendChild(b);
      }
      tela.append(infos, grade, modos);
      atualizar();
    }

    function ligarToques(b, i) {
      let timer = null, segurou = false;
      b.addEventListener("pointerdown", e => {
        segurou = false;
        clearTimeout(timer);
        if (e.button !== 0 || acabou) return;
        timer = setTimeout(() => { segurou = true; marcar(i); try { navigator.vibrate && navigator.vibrate(30); } catch (err) { /* ok */ } }, TOQUE_LONGO);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, () => clearTimeout(timer)));
      b.addEventListener("click", () => { if (segurou) { segurou = false; return; } tocar(i); });
      b.addEventListener("contextmenu", e => { e.preventDefault(); clearTimeout(timer); if (!segurou) { segurou = true; marcar(i); } });
    }

    // novas: Map casa → distância (para a cascata abrir em onda)
    function atualizar(novas = new Map()) {
      casas.forEach((b, i) => {
        const r = Math.floor(i / N.c), k = i % N.c;
        let cls = "minado-casa" + ((r + k) % 2 ? " alt" : ""), txt = "";
        const mina = campo && campo.minas.has(i);
        if (abertas.has(i) || reveladas.has(i)) {
          cls += " aberta";
          if (mina) { cls += ganhou ? " flor" : " abelha"; txt = ganhou ? "🌻" : "🐝"; if (i === explodiu) cls += " explodiu"; }
          else if (campo.num[i]) { txt = campo.num[i]; cls += " n" + campo.num[i]; }
        } else if (marcadas.has(i)) {
          cls += " bandeira";
          txt = acabou && !ganhou && campo && !mina ? "❌" : ganhou ? "🌻" : "🚩";
        }
        if (novas.has(i)) { cls += " abrindo"; b.style.animationDelay = Math.min(novas.get(i) * 35, 600) + "ms"; }
        b.className = cls;
        b.textContent = txt;
      });
      infoAbelhas.textContent = `🐝 ${N.minas - marcadas.size}`;
      infoTempo.textContent = `⏱️ ${tempoTexto(segundos)}`;
      Object.entries(botoesModo).forEach(([m, b]) => b.classList.toggle("ativo", m === modo));
    }

    function trocarModo(m) {
      if (m === modo) return;
      modo = m;
      Motor.ploc();
      atualizar();
      Motor.falar(m === "marcar" ? "Agora toque para pôr bandeira!" : "Agora toque para abrir!");
    }

    // ---------- Jogadas ----------
    function tocar(i) {
      if (acabou) return;
      if (modo === "marcar" && !abertas.has(i)) return marcar(i);
      abrirCasa(i);
    }

    function marcar(i) {
      if (acabou || abertas.has(i)) return;
      if (marcadas.has(i)) { marcadas.delete(i); Motor.nota(500, { dur: 0.08, vol: 0.15 }); }
      else { marcadas.add(i); Motor.nota(760, { dur: 0.1, tipo: "triangle", vol: 0.2 }); }
      atualizar();
    }

    function abrirCasa(i) {
      if (marcadas.has(i)) { Motor.animar(casas[i], "balanca"); return; }
      if (!campo) { campo = criarCampo(N.l, N.c, N.minas, i); iniciarRelogio(); }
      let novas = [];
      if (abertas.has(i)) {
        // Número com todas as bandeiras em volta: abre as outras vizinhas
        const viz = vizinhos(N.l, N.c, i);
        if (!campo.num[i] || viz.filter(v => marcadas.has(v)).length !== campo.num[i]) return;
        viz.forEach(v => { novas.push(...abrir(campo, abertas, marcadas, v)); });
        if (!novas.length) return;
      } else novas = abrir(campo, abertas, marcadas, i);
      const bomba = novas.find(([j]) => campo.minas.has(j));
      if (bomba) return perder(bomba[0]);
      if (novas.length > 1) Motor.ruido({ dur: 0.25, vol: 0.12, filtro: "bandpass", freq: 1800 });
      Motor.ploc();
      atualizar(new Map(novas));
      if (venceu(campo, abertas)) ganhar();
    }

    function iniciarRelogio() {
      segundos = 0;
      clearInterval(relogio);
      relogio = setInterval(() => {
        if (!vivo() || acabou) { clearInterval(relogio); return; }
        segundos++;
        infoTempo.textContent = `⏱️ ${tempoTexto(segundos)}`;
      }, 1000);
    }

    // ---------- Fim ----------
    function perder(i) {
      acabou = true;
      clearInterval(relogio);
      explodiu = i;
      atualizar();
      Motor.animar(grade, "balanca");
      Motor.nota(220, { dur: 0.4, tipo: "sawtooth", vol: 0.12, ate: 90 });
      Motor.ruido({ dur: 0.5, vol: 0.2, freq: 700 });
      // As outras abelhas aparecem uma a uma, da mais perto para a mais longe
      const r0 = Math.floor(i / N.c), k0 = i % N.c;
      const dist = j => Math.hypot(Math.floor(j / N.c) - r0, j % N.c - k0);
      const resto = [...campo.minas].filter(j => j !== i && !marcadas.has(j)).sort((a, b) => dist(a) - dist(b));
      resto.forEach((j, n) => Motor.depois(() => { reveladas.add(j); atualizar(); Motor.nota(900 + n * 30, { dur: 0.05, vol: 0.06 }); }, 250 + n * Math.min(90, 900 / resto.length)));
      Motor.depois(() => telaFim(false), 1500);
    }

    function ganhar() {
      acabou = true;
      ganhou = true;
      clearInterval(relogio);
      campo.minas.forEach(j => reveladas.add(j));
      atualizar();
      Motor.comemorar(grade);
      Motor.tim();
      Motor.depois(() => telaFim(true), 1100);
    }

    function telaFim(venceuJogo) {
      if (!vivo()) return;
      const antigo = recorde(nid);
      const novoRecorde = venceuJogo && (!antigo || segundos < antigo);
      if (novoRecorde) salvarRecorde(nid, segundos);
      const caixa = document.createElement("div");
      caixa.className = "mesa-fim";
      const titulo = document.createElement("div");
      titulo.className = "titulo-fim";
      titulo.textContent = venceuJogo ? (novoRecorde && antigo ? "🏆 Novo recorde!" : "🎉 Você conseguiu!") : "🐝 Ops! Acordou uma abelha!";
      const detalhe = document.createElement("div");
      detalhe.className = "pontos-fim";
      detalhe.textContent = venceuJogo
        ? `⏱️ ${tempoTexto(segundos)}` + (antigo && !novoRecorde ? ` · 🏆 ${tempoTexto(antigo)}` : "")
        : `Faltaram ${N.l * N.c - N.minas - [...abertas].filter(j => !campo.minas.has(j)).length} casas`;
      const denovo = document.createElement("button");
      denovo.className = "chip executar";
      denovo.textContent = "🔁 Jogar de novo";
      denovo.addEventListener("click", () => jogo(area, nid));
      const outro = document.createElement("button");
      outro.className = "chip";
      outro.textContent = "🔀 Outro tamanho";
      outro.addEventListener("click", () => escolher(area));
      const botoes = document.createElement("div");
      botoes.className = "mesa-botoes";
      botoes.append(denovo, outro);
      caixa.append(titulo, detalhe, botoes);
      tela.appendChild(caixa);
      if (venceuJogo) {
        const plural = (q, palavra) => `${q} ${palavra}${q === 1 ? "" : "s"}`;
        const emTempo = segundos < 60 ? plural(segundos, "segundo") : `${plural(Math.floor(segundos / 60), "minuto")} e ${plural(segundos % 60, "segundo")}`;
        Motor.comemorar(titulo);
        Motor.falar(novoRecorde && antigo
          ? `Novo recorde! Você achou todas as abelhas em ${emTempo}!`
          : `Parabéns! Você achou todas as abelhas em ${emTempo}!`);
      } else Motor.falar("Ops! Você acordou uma abelha! Vamos tentar de novo?");
    }

    // Girou o celular: desenha de novo
    let espera = null;
    const aoRedimensionar = () => {
      if (!vivo()) { window.removeEventListener("resize", aoRedimensionar); return; }
      clearTimeout(espera);
      espera = setTimeout(() => { if (vivo() && !tela.querySelector(".mesa-fim")) desenhar(); }, 200);
    };
    window.addEventListener("resize", aoRedimensionar);

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.MINADO_TESTE) window.MINADO_TESTE = { estado: () => ({ campo, abertas, marcadas, acabou, ganhou, segundos }), tocar, marcar, trocarModo };

    desenhar();
    Motor.falar("Abra o jardim sem acordar as abelhas! Os números contam quantas abelhas tem em volta. Toque longo põe bandeira.");
  }

  // Para testes
  if (typeof globalThis !== "undefined") globalThis.MinadoTeste = { vizinhos, sortearMinas, contar, criarCampo, abrir, venceu, NIVEIS };
})();
