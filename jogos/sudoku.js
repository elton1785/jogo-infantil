// Sudoku: completar a grade para que cada linha, coluna e bloco tenha todos os números (ou frutas)
// uma vez só. Tamanhos 4×4 (blocos 2×2), 6×6 (blocos 2×3) e 9×9 (fácil e médio).
// O quebra-cabeça é gerado na hora: uma solução completa sorteada por backtracking e depois as
// casas são esvaziadas uma a uma, só se o quebra-cabeça continuar com UMA solução.
// Joga-se tocando na casa e depois no número. Tem anotações (rascunho), desfazer, dica e
// "mostrar erros" (opcional). Tempo e recorde por tamanho (o recorde só vale sem dicas).
(() => {
  const TAMANHOS = {
    "4":  { n: 4, br: 2, bc: 2, pistas: 8, nome: "4×4" },
    "6":  { n: 6, br: 2, bc: 3, pistas: 17, nome: "6×6" },
    "9f": { n: 9, br: 3, bc: 3, pistas: 38, nome: "9×9 fácil" },
    "9m": { n: 9, br: 3, bc: 3, pistas: 30, nome: "9×9 médio" },
  };
  const FRUTAS = ["🍎", "🍌", "🍇", "🍓", "🍊", "🍉"];
  const OPCOES = [
    { chave: "tamanho", titulo: "Tamanho", valores: [["4", "🐣 4×4"], ["6", "🐥 6×6"], ["9f", "🦉 9×9 fácil"], ["9m", "🦅 9×9 médio"]] },
    { chave: "simbolos", titulo: "No 4×4 e no 6×6, usar", valores: [["numeros", "🔢 Números"], ["frutas", "🍎 Frutas"]] },
    { chave: "erros", titulo: "Mostrar erros", valores: [["sim", "🟥 Sim"], ["nao", "🙈 Não"]] },
  ];
  const PADRAO = {
    "6-8":  { tamanho: "4", simbolos: "numeros", erros: "sim" },
    "8-10": { tamanho: "9f", simbolos: "numeros", erros: "sim" },
  };

  // ---------- Regras (funções puras, testadas em Node) ----------
  // Grade: array de n*n números (0 = vazia). Blocos de br linhas × bc colunas.
  const geometrias = {};
  function geometria(n, br, bc) {
    const k = `${n},${br},${bc}`;
    if (!geometrias[k]) {
      const L = [], C = [], B = [];
      for (let i = 0; i < n * n; i++) {
        const r = Math.floor(i / n), c = i % n;
        L.push(r); C.push(c); B.push(Math.floor(r / br) * (n / bc) + Math.floor(c / bc));
      }
      geometrias[k] = { L, C, B };
    }
    return geometrias[k];
  }
  const bits = m => { let q = 0; while (m) { m &= m - 1; q++; } return q; };

  // Resolve por backtracking (sempre pela casa com menos opções). Para quando achar `limite`
  // soluções. `rnd`: sorteia a ordem dos números (para gerar soluções diferentes).
  // Devolve { total, solucao } (total = 0, 1 ou `limite`).
  function resolver(g0, n, br, bc, limite = 2, rnd = null) {
    const { L, C, B } = geometria(n, br, bc);
    const g = g0.slice();
    const lin = new Array(n).fill(0), col = new Array(n).fill(0), blo = new Array(n).fill(0);
    for (let i = 0; i < n * n; i++) {
      if (!g[i]) continue;
      const m = 1 << g[i];
      if ((lin[L[i]] | col[C[i]] | blo[B[i]]) & m) return { total: 0, solucao: null };
      lin[L[i]] |= m; col[C[i]] |= m; blo[B[i]] |= m;
    }
    const todos = (1 << (n + 1)) - 2;
    let total = 0, solucao = null;
    function busca() {
      let casa = -1, cand = 0, menor = 99;
      for (let i = 0; i < n * n; i++) {
        if (g[i]) continue;
        const c = todos & ~(lin[L[i]] | col[C[i]] | blo[B[i]]);
        const q = bits(c);
        if (q < menor) { menor = q; casa = i; cand = c; if (q <= 1) break; }
      }
      if (casa < 0) { total++; if (!solucao) solucao = g.slice(); return total >= limite; }
      if (!menor) return false;
      const vals = [];
      for (let v = 1; v <= n; v++) if (cand & (1 << v)) vals.push(v);
      if (rnd) for (let i = vals.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [vals[i], vals[j]] = [vals[j], vals[i]]; }
      for (const v of vals) {
        const m = 1 << v;
        g[casa] = v; lin[L[casa]] |= m; col[C[casa]] |= m; blo[B[casa]] |= m;
        if (busca()) return true;
        lin[L[casa]] &= ~m; col[C[casa]] &= ~m; blo[B[casa]] &= ~m;
      }
      g[casa] = 0;
      return false;
    }
    busca();
    return { total, solucao };
  }

  // Quebra-cabeça com solução única: { n, br, bc, pistas: [...], solucao: [...] }
  function gerar(tam, rnd = Math.random) {
    const { n, br, bc, pistas } = TAMANHOS[tam];
    const solucao = resolver(new Array(n * n).fill(0), n, br, bc, 1, rnd).solucao;
    const g = solucao.slice();
    const ordem = [...g.keys()];
    for (let i = ordem.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ordem[i], ordem[j]] = [ordem[j], ordem[i]]; }
    let restam = n * n;
    for (const i of ordem) {
      if (restam <= pistas) break;
      const v = g[i];
      g[i] = 0;
      if (resolver(g, n, br, bc, 2).total !== 1) g[i] = v; // ficaria com mais de uma solução
      else restam--;
    }
    return { n, br, bc, pistas: g, solucao };
  }

  // Casas da mesma linha, coluna ou bloco
  function relacionadas(n, br, bc, i, j) {
    const { L, C, B } = geometria(n, br, bc);
    return L[i] === L[j] || C[i] === C[j] || B[i] === B[j];
  }

  const tempoTexto = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const recorde = tam => { try { return +localStorage.getItem(`sudoku-recorde-${tam}`) || 0; } catch (e) { return 0; } };
  const salvarRecorde = (tam, s) => { try { localStorage.setItem(`sudoku-recorde-${tam}`, s); } catch (e) { /* ok */ } };

  function painelRecordes() {
    const el = document.createElement("div");
    el.className = "placar-geral";
    const linha = (texto, classe = "") => { const s = document.createElement("span"); s.className = "item-placar " + classe; s.textContent = texto; el.appendChild(s); };
    linha("🏆 Recordes", "titulo-placar");
    const lista = Object.entries(TAMANHOS).filter(([tam]) => recorde(tam));
    if (!lista.length) linha("ainda nenhum");
    lista.forEach(([tam, t]) => linha(`${t.nome}: ${tempoTexto(recorde(tam))}`));
    return el;
  }

  function opcoes(area, faixa) {
    const id = (faixa && faixa.id) || "6-8";
    Motor.telaOpcoes(area, {
      opcoes: OPCOES, padrao: PADRAO[id] || PADRAO["6-8"], chave: `sudoku-opcoes-${id}`,
      antes: painelRecordes(),
      aoJogar: op => partida(area, op, faixa),
    });
  }

  JOGOS.push({
    id: "sudoku",
    nome: "Sudoku",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="3" y="3" width="58" height="58" rx="6" fill="#fffdf6" stroke="#34495e" stroke-width="4"/><path d="M22.3 5V59M41.7 5V59M5 22.3H59M5 41.7H59" stroke="#34495e" stroke-width="2.5"/><rect x="23.5" y="23.5" width="17" height="17" fill="#ffd60a" opacity=".6"/><g font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle"><text x="12.7" y="18" fill="#34495e">1</text><text x="51.3" y="18" fill="#34495e">3</text><text x="32" y="37.5" fill="#e76f51">2</text><text x="12.7" y="56.5" fill="#34495e">4</text><text x="51.3" y="56.5" fill="#2a9d55">1</text><text x="32" y="18" fill="#2a9d55">4</text></g></svg>',
    faixas: ["6-8", "8-10"],
    iniciar(area, faixa) { opcoes(area, faixa); },
  });

  function partida(area, op, faixa) {
    const cfg = TAMANHOS[op.tamanho] || TAMANHOS["4"];
    const { n, br, bc } = cfg;
    const frutas = op.simbolos === "frutas" && n <= 6;
    const simbolo = v => (frutas ? FRUTAS[v - 1] : String(v));
    const mostrarErros = op.erros !== "nao";
    const quebra = gerar(op.tamanho);
    const solucao = quebra.solucao;
    const dadas = quebra.pistas.map(v => v > 0);
    let valores = quebra.pistas.slice(), notas = new Array(n * n).fill(0);
    let sel = -1, anotar = false, historico = [], dicas = new Set(), segundos = 0, acabou = false, piscar = new Set();
    let casas = [], teclas = [], infoTempo, botaoAnotar;

    const sessao = Motor.sessaoAtual();
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "sudoku-tela";
    area.appendChild(tela);
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);

    // ---------- Tela ----------
    function desenhar() {
      tela.innerHTML = "";
      const larg = tela.clientWidth, alt = tela.clientHeight, deitado = larg > alt;
      tela.classList.toggle("deitado", deitado);

      const topo = document.createElement("div");
      topo.className = "sudoku-topo";
      const pilula = texto => { const p = document.createElement("div"); p.className = "cubo-info"; p.textContent = texto; topo.appendChild(p); return p; };
      pilula(`🧩 ${cfg.nome}`);
      infoTempo = pilula("");
      if (recorde(op.tamanho)) pilula(`🏆 ${tempoTexto(recorde(op.tamanho))}`);
      topo.appendChild(Motor.botaoSom());

      // Tabuleiro
      const lado = Math.floor(deitado ? Math.min(alt - 12, larg - 440) : Math.min(larg - 8, alt - 300));
      const cel = Math.floor(lado / n);
      const grade = document.createElement("div");
      grade.className = "sudoku-grade";
      Object.assign(grade.style, { gridTemplateColumns: `repeat(${n}, ${cel}px)`, gridTemplateRows: `repeat(${n}, ${cel}px)` });
      grade.style.setProperty("--cel", cel + "px");
      casas = [];
      for (let i = 0; i < n * n; i++) {
        const b = document.createElement("button");
        b.addEventListener("click", () => escolher(i));
        casas.push(b);
        grade.appendChild(b);
      }

      // Teclado de números (ou frutas)
      const teclado = document.createElement("div");
      teclado.className = "sudoku-teclado";
      if (deitado) teclado.style.gridTemplateColumns = `repeat(${n === 4 ? 2 : 3}, 1fr)`;
      teclas = [];
      for (let v = 1; v <= n; v++) {
        const b = document.createElement("button");
        b.className = "sudoku-tecla";
        b.textContent = simbolo(v);
        b.addEventListener("click", () => colocar(v));
        teclas.push(b);
        teclado.appendChild(b);
      }

      // Ferramentas
      const ferr = document.createElement("div");
      ferr.className = "sudoku-ferramentas";
      const botao = (txt, rotulo, fn) => { const b = document.createElement("button"); b.className = "chip"; b.textContent = txt; b.setAttribute("aria-label", rotulo); b.addEventListener("click", fn); ferr.appendChild(b); return b; };
      botaoAnotar = botao("✏️ Anotar", "Anotações", alternarAnotar);
      botao("🧽 Apagar", "Apagar", apagar);
      botao("↩️ Desfazer", "Desfazer", desfazer);
      botao("💡 Dica", "Dica", dica);

      tela.append(topo, grade, teclado, ferr);
      atualizar();
    }

    function atualizar() {
      const vSel = sel >= 0 ? valores[sel] : 0;
      casas.forEach((b, i) => {
        const r = Math.floor(i / n), c = i % n;
        let cls = "sudoku-casa";
        if ((c + 1) % bc === 0 && c < n - 1) cls += " bd-d";
        if ((r + 1) % br === 0 && r < n - 1) cls += " bd-b";
        if (dadas[i]) cls += " dada";
        else if (dicas.has(i)) cls += " dica";
        if (i === sel) cls += " sel";
        else if (sel >= 0 && relacionadas(n, br, bc, i, sel)) cls += " rel";
        if (vSel && valores[i] === vSel && i !== sel) cls += " igual";
        if (mostrarErros && valores[i] && valores[i] !== solucao[i]) cls += " erro";
        if (piscar.has(i)) cls += " completa";
        if (frutas) cls += " fruta";
        b.className = cls;
        if (valores[i]) b.textContent = simbolo(valores[i]);
        else if (notas[i]) {
          b.innerHTML = "";
          const nt = document.createElement("span");
          nt.className = `sudoku-notas n${n}`;
          for (let v = 1; v <= n; v++) { const s = document.createElement("span"); s.textContent = notas[i] & (1 << v) ? simbolo(v) : ""; nt.appendChild(s); }
          b.appendChild(nt);
        } else b.textContent = "";
      });
      // Número que já está em todas as linhas fica apagadinho no teclado
      teclas.forEach((t, k) => {
        const v = k + 1;
        t.classList.toggle("esgotado", valores.filter((x, i) => x === v && x === solucao[i]).length >= n);
        t.classList.toggle("igual", v === vSel);
      });
      botaoAnotar.classList.toggle("ativo", anotar);
      infoTempo.textContent = `⏱️ ${tempoTexto(segundos)}`;
    }

    // ---------- Jogadas ----------
    function escolher(i) {
      if (acabou) return;
      sel = i;
      Motor.nota(620, { dur: 0.04, vol: 0.08 });
      atualizar();
    }

    const guardar = () => { historico.push({ valores: valores.slice(), notas: notas.slice(), sel }); if (historico.length > 200) historico.shift(); };

    function colocar(v) {
      if (acabou) return;
      if (sel < 0) { Motor.falar("Toque numa casa primeiro!"); return; }
      if (dadas[sel] || dicas.has(sel)) { Motor.animar(casas[sel], "balanca"); return; }
      if (anotar) {
        if (valores[sel]) { Motor.animar(casas[sel], "balanca"); return; }
        guardar();
        notas[sel] ^= 1 << v;
        Motor.nota(880, { dur: 0.05, vol: 0.08 });
        atualizar();
        return;
      }
      guardar();
      if (valores[sel] === v) { valores[sel] = 0; atualizar(); return; } // mesmo número de novo: apaga
      valores[sel] = v;
      notas[sel] = 0;
      // O número sai das anotações das casas da mesma linha, coluna e bloco
      for (let j = 0; j < n * n; j++) if (relacionadas(n, br, bc, j, sel)) notas[j] &= ~(1 << v);
      if (v !== solucao[sel] && mostrarErros) {
        Motor.nota(220, { dur: 0.2, tipo: "triangle", vol: 0.15 });
        atualizar();
        Motor.animar(casas[sel], "balanca");
        return;
      }
      Motor.ploc();
      if (v === solucao[sel]) verGrupos(sel);
      atualizar();
      if (valores.every((x, i) => x === solucao[i])) ganhar();
    }

    // Linha, coluna ou bloco completos (e certos) piscam
    function verGrupos(i) {
      const { L, C, B } = geometria(n, br, bc);
      const grupos = [j => L[j] === L[i], j => C[j] === C[i], j => B[j] === B[i]];
      let completou = false;
      grupos.forEach(f => {
        const g = [...valores.keys()].filter(f);
        if (g.every(j => valores[j] === solucao[j])) { g.forEach(j => piscar.add(j)); completou = true; }
      });
      if (completou) {
        Motor.tim();
        Motor.depois(() => { piscar.clear(); if (!acabou) atualizar(); }, 700);
      }
    }

    function apagar() {
      if (acabou || sel < 0 || dadas[sel] || dicas.has(sel)) return;
      if (!valores[sel] && !notas[sel]) return;
      guardar();
      valores[sel] = 0;
      notas[sel] = 0;
      Motor.nota(300, { dur: 0.08, vol: 0.12 });
      atualizar();
    }

    function desfazer() {
      if (acabou) return;
      const h = historico.pop();
      if (!h) { Motor.falar("Não tem nada para desfazer."); return; }
      valores = h.valores; notas = h.notas; sel = h.sel;
      Motor.nota(450, { dur: 0.08, vol: 0.12, ate: 300 });
      atualizar();
    }

    function alternarAnotar() {
      anotar = !anotar;
      Motor.ploc();
      atualizar();
      Motor.falar(anotar ? "Modo rascunho: anote os números possíveis." : "Rascunho desligado.");
    }

    // Dica: preenche a casa escolhida (se estiver vazia ou errada) ou a casa mais fácil do tabuleiro
    function dica() {
      if (acabou) return;
      let alvo = sel >= 0 && !dadas[sel] && valores[sel] !== solucao[sel] ? sel : -1;
      if (alvo < 0) {
        let menor = 99;
        for (let i = 0; i < n * n; i++) {
          if (valores[i] === solucao[i]) continue;
          const usados = new Set();
          for (let j = 0; j < n * n; j++) if (valores[j] && j !== i && relacionadas(n, br, bc, i, j)) usados.add(valores[j]);
          const q = n - usados.size + (valores[i] ? -0.5 : 0); // errada primeiro, depois a com menos opções
          if (q < menor) { menor = q; alvo = i; }
        }
      }
      if (alvo < 0) return;
      guardar();
      valores[alvo] = solucao[alvo];
      notas[alvo] = 0;
      for (let j = 0; j < n * n; j++) if (relacionadas(n, br, bc, j, alvo)) notas[j] &= ~(1 << solucao[alvo]);
      dicas.add(alvo);
      sel = alvo;
      Motor.tim();
      verGrupos(alvo);
      atualizar();
      Motor.animar(casas[alvo], "pula");
      if (valores.every((x, i) => x === solucao[i])) ganhar();
    }

    // ---------- Tempo e fim ----------
    const relogio = setInterval(() => {
      if (!vivo() || acabou) { clearInterval(relogio); return; }
      segundos++;
      if (infoTempo) infoTempo.textContent = `⏱️ ${tempoTexto(segundos)}`;
    }, 1000);

    function ganhar() {
      acabou = true;
      clearInterval(relogio);
      sel = -1;
      piscar = new Set(valores.keys());
      atualizar();
      Motor.comemorar(tela.querySelector(".sudoku-grade"));
      Motor.tim();
      const antigo = recorde(op.tamanho);
      const valeRecorde = !dicas.size;
      const novoRecorde = valeRecorde && (!antigo || segundos < antigo);
      if (novoRecorde) salvarRecorde(op.tamanho, segundos);
      Motor.depois(() => {
        if (!vivo()) return;
        const caixa = document.createElement("div");
        caixa.className = "mesa-fim";
        const titulo = document.createElement("div");
        titulo.className = "titulo-fim";
        titulo.textContent = novoRecorde && antigo ? "🏆 Novo recorde!" : "🎉 Sudoku completo!";
        const detalhe = document.createElement("div");
        detalhe.className = "pontos-fim";
        detalhe.textContent = `${cfg.nome} · ⏱️ ${tempoTexto(segundos)}`
          + (dicas.size ? ` · 💡 ${dicas.size} ${dicas.size > 1 ? "dicas" : "dica"}` : "")
          + (antigo && !novoRecorde ? ` · 🏆 ${tempoTexto(antigo)}` : "");
        const botoes = document.createElement("div");
        botoes.className = "mesa-botoes";
        const denovo = document.createElement("button");
        denovo.className = "chip executar";
        denovo.textContent = "🔁 Jogar de novo";
        denovo.addEventListener("click", () => partida(area, op, faixa));
        const outro = document.createElement("button");
        outro.className = "chip";
        outro.textContent = "⚙️ Trocar tamanho";
        outro.addEventListener("click", () => opcoes(area, faixa));
        botoes.append(denovo, outro);
        caixa.append(titulo, detalhe, botoes);
        tela.appendChild(caixa);
        Motor.comemorar(titulo);
        const plural = (q, palavra) => `${q} ${palavra}${q === 1 ? "" : "s"}`;
        const tempoFala = segundos < 60 ? plural(segundos, "segundo") : `${plural(Math.floor(segundos / 60), "minuto")} e ${plural(segundos % 60, "segundo")}`;
        Motor.falar(novoRecorde && antigo ? `Novo recorde! Você completou em ${tempoFala}!` : `Parabéns! Você completou o sudoku em ${tempoFala}!`);
      }, 1200);
    }

    // ---------- Teclado do computador ----------
    const aoTeclar = e => {
      if (!vivo()) { document.removeEventListener("keydown", aoTeclar); return; }
      if (acabou) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); desfazer(); return; }
      const v = +e.key;
      if (v >= 1 && v <= n) { e.preventDefault(); colocar(v); return; }
      const mov = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
      if (mov) {
        e.preventDefault();
        if (sel < 0) { escolher(0); return; }
        const r = (Math.floor(sel / n) + mov[0] + n) % n, c = (sel % n + mov[1] + n) % n;
        escolher(r * n + c);
      } else if (["Backspace", "Delete", "0"].includes(e.key)) { e.preventDefault(); apagar(); }
      else if (e.key.toLowerCase() === "n") alternarAnotar();
    };
    document.addEventListener("keydown", aoTeclar);

    // Girou o celular: desenha de novo
    let espera = null;
    const aoRedimensionar = () => {
      if (!vivo()) { window.removeEventListener("resize", aoRedimensionar); return; }
      clearTimeout(espera);
      espera = setTimeout(() => { if (vivo() && !acabou) desenhar(); }, 200);
    };
    window.addEventListener("resize", aoRedimensionar);

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.SUDOKU_TESTE) window.SUDOKU_TESTE = { estado: () => ({ valores, solucao, dadas, sel, acabou, notas }), escolher, colocar, dica, desfazer, alternarAnotar };

    desenhar();
    Motor.falar(frutas
      ? "Cada fruta aparece uma vez só em cada linha, coluna e bloco. Toque numa casa e depois na fruta!"
      : "Cada número aparece uma vez só em cada linha, coluna e bloco. Toque numa casa e depois no número!");
  }

  // Para testes
  if (typeof globalThis !== "undefined") globalThis.SudokuTeste = { resolver, gerar, relacionadas, TAMANHOS };
})();
