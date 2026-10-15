// 2048: deslize o dedo (ou use as setas) e todos os blocos andam para aquele lado. Dois blocos
// iguais que se encontram viram um só, com a soma. A cada jogada aparece um 2 (ou, às vezes, um 4).
// Objetivo: chegar ao bloco 2048 (na grade 3×3 dos menores, ao 256). Com "Mostrar a soma",
// cada junção aparece como conta ("2 + 2 = 4") e a voz fala a conta.
(() => {
  const DIRECOES = ["cima", "baixo", "esquerda", "direita"];
  const CORES = {
    2: ["#fff3b0", "#6b5a2a"], 4: ["#ffd6a5", "#6b4a2a"], 8: ["#ffadad", "#fff"], 16: ["#ff8fab", "#fff"],
    32: ["#c77dff", "#fff"], 64: ["#9d4edd", "#fff"], 128: ["#4cc9f0", "#fff"], 256: ["#4895ef", "#fff"],
    512: ["#43aa8b", "#fff"], 1024: ["#90be6d", "#fff"], 2048: ["#f9c74f", "#fff"],
  };
  const OPCOES = [
    { chave: "tamanho", titulo: "Tamanho", valores: [["3", "3×3 · até 256"], ["4", "4×4 · até 2048"]] },
    { chave: "soma", titulo: "Contas", valores: [["sim", "🔢 Mostrar a soma"], ["nao", "🙈 Não mostrar"]] },
  ];

  // ---------- Regras (puras, testáveis em Node) ----------
  // Casas de cada linha na ordem em que os blocos se empilham (a primeira é a "parede")
  function linhasDe(n, dir) {
    return [...Array(n).keys()].map(i => [...Array(n).keys()].map(k => ({
      esquerda: [i, k], direita: [i, n - 1 - k], cima: [k, i], baixo: [n - 1 - k, i],
    })[dir]));
  }

  // Move tudo para `dir`. Devolve a grade nova, os pontos ganhos, se algo mudou, os movimentos
  // de cada bloco ({ de, para, junta }) e as junções ({ r, c, a, v }). Cada bloco só junta uma vez.
  function moverGrade(g, dir) {
    const n = g.length;
    const grade = g.map(l => l.map(() => 0));
    const movs = [], juncoes = [];
    let pontos = 0;
    linhasDe(n, dir).forEach(casas => {
      let k = 0, ultimo = null;
      casas.forEach(([r, c]) => {
        const v = g[r][c];
        if (!v) return;
        if (ultimo && ultimo.v === v && !ultimo.juntou) {
          const [dr, dc] = casas[k - 1];
          grade[dr][dc] = v * 2;
          ultimo.juntou = true;
          pontos += v * 2;
          movs.push({ de: [r, c], para: [dr, dc], junta: true });
          juncoes.push({ r: dr, c: dc, a: v, v: v * 2 });
        } else {
          const [dr, dc] = casas[k++];
          grade[dr][dc] = v;
          ultimo = { v, juntou: false };
          movs.push({ de: [r, c], para: [dr, dc] });
        }
      });
    });
    const moveu = movs.some(m => m.junta || m.de[0] !== m.para[0] || m.de[1] !== m.para[1]);
    return { grade, pontos, moveu, movs, juncoes };
  }

  const temJogada = g => g.some((l, r) => l.some((v, c) => !v || l[c + 1] === v || (g[r + 1] && g[r + 1][c] === v)));

  // Põe um 2 (90%) ou um 4 (10%) numa casa vazia sorteada. Devolve [r, c] ou null.
  function colocar(g, rnd = Math.random) {
    const vazias = [];
    g.forEach((l, r) => l.forEach((v, c) => { if (!v) vazias.push([r, c]); }));
    if (!vazias.length) return null;
    const [r, c] = vazias[Math.floor(rnd() * vazias.length)];
    g[r][c] = rnd() < 0.9 ? 2 : 4;
    return [r, c];
  }

  JOGOS.push({
    id: "2048", teclas: true,
    nome: "2048",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="10" fill="#bba89a"/><rect x="6" y="6" width="25" height="25" rx="5" fill="#fff3b0"/><rect x="33" y="6" width="25" height="25" rx="5" fill="#ff8fab"/><rect x="6" y="33" width="25" height="25" rx="5" fill="#c77dff"/><rect x="33" y="33" width="25" height="25" rx="5" fill="#f9c74f"/><g font-family="sans-serif" font-weight="bold" text-anchor="middle"><text x="18.5" y="25" font-size="17" fill="#6b5a2a">2</text><text x="45.5" y="25" font-size="15" fill="#fff">16</text><text x="18.5" y="51" font-size="11" fill="#fff">256</text><text x="45.5" y="50" font-size="8.5" fill="#fff">2048</text></g></svg>',
    faixas: ["6-8", "8-10"],
    iniciar(area, faixa) {
      if (faixa && faixa.id === "8-10") return jogo(area, { tamanho: "4", soma: "nao" });
      Motor.telaOpcoes(area, {
        opcoes: OPCOES, padrao: { tamanho: "3", soma: "sim" }, chave: "2048-opcoes",
        aoJogar: op => jogo(area, op),
      });
    },
  });

  function jogo(area, op) {
    const N = +op.tamanho;
    const OBJETIVO = N === 3 ? 256 : 2048;
    const chaveRecorde = N === 3 ? "2048-recorde-3x3" : "2048-recorde";
    const mostrarSoma = op.soma === "sim";
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const lerRecorde = () => { try { return +localStorage.getItem(chaveRecorde) || 0; } catch (e) { return 0; } };
    let grade, pontos, anterior, venceu, acabou, recordeInicial, animando = null, confirmarNovo = null;
    const blocos = new Map(); // "r,c" → elemento

    // ---------- Tela ----------
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "n2048-tela";
    area.appendChild(tela);
    const deitado = tela.clientWidth > tela.clientHeight;
    tela.classList.toggle("deitado", deitado);

    const barra = document.createElement("div");
    barra.className = "n2048-barra";
    const info = document.createElement("div");
    info.className = "n2048-info";
    const botoes = document.createElement("div");
    botoes.className = "n2048-botoes";
    const bDesfazer = document.createElement("button");
    bDesfazer.className = "chip";
    bDesfazer.textContent = "↩️ Desfazer";
    bDesfazer.addEventListener("click", desfazer);
    const bNovo = document.createElement("button");
    bNovo.className = "chip";
    bNovo.textContent = "🔁 Novo jogo";
    bNovo.addEventListener("click", () => {
      // Para não perder o jogo sem querer: com pontos, pede um segundo toque
      if (pontos > 0 && !acabou && !confirmarNovo) {
        bNovo.textContent = "🔁 Tem certeza?";
        confirmarNovo = setTimeout(() => { confirmarNovo = null; bNovo.textContent = "🔁 Novo jogo"; }, 2500);
        return;
      }
      comecar();
    });
    botoes.append(bDesfazer, bNovo, Motor.botaoSom());
    barra.append(info, botoes);

    const larg = tela.clientWidth, alt = tela.clientHeight;
    const lado = Math.floor(deitado
      ? Math.min(alt - 12, larg - 180 - 230)
      : Math.min(larg - 8, alt - 130 - 190, 560));
    const gap = Math.max(6, Math.round(lado * (N === 3 ? 0.03 : 0.025)));
    const tam = (lado - gap * (N + 1)) / N;

    const tabuleiro = document.createElement("div");
    tabuleiro.className = "n2048-tabuleiro";
    Object.assign(tabuleiro.style, { width: lado + "px", height: lado + "px" });
    const pos = (r, c) => `translate(${gap + c * (tam + gap)}px, ${gap + r * (tam + gap)}px)`;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const v = document.createElement("div");
      v.className = "n2048-vazia";
      Object.assign(v.style, { width: tam + "px", height: tam + "px", transform: pos(r, c) });
      tabuleiro.appendChild(v);
    }
    const soma = document.createElement("div");
    soma.className = "n2048-soma";
    tabuleiro.appendChild(soma);

    const cruz = document.createElement("div");
    cruz.className = "n2048-cruz";
    [["⬆️", "cima"], ["⬅️", "esquerda"], ["➡️", "direita"], ["⬇️", "baixo"]].forEach(([icone, dir]) => {
      const b = document.createElement("button");
      b.className = `n2048-botao n2048-${dir}`;
      b.textContent = icone;
      b.setAttribute("aria-label", "Mover para " + (dir === "cima" || dir === "baixo" ? dir : "a " + dir));
      b.addEventListener("pointerdown", e => { e.preventDefault(); jogar(dir); });
      cruz.appendChild(b);
    });
    tela.append(barra, tabuleiro, cruz);

    // ---------- Desenho ----------
    function criarBloco(r, c, v, efeito) {
      const el = document.createElement("div");
      el.className = "n2048-bloco";
      Object.assign(el.style, { width: tam + "px", height: tam + "px", transform: pos(r, c) });
      const num = document.createElement("div");
      num.className = "n2048-num" + (efeito ? " " + efeito : "") + (v >= OBJETIVO ? " brilho" : "");
      const [fundo, cor] = CORES[v] || ["#3c3a32", "#fff"];
      const dig = String(v).length;
      Object.assign(num.style, { background: fundo, color: cor, fontSize: Math.round(tam * [0, 0.55, 0.5, 0.4, 0.31, 0.26][Math.min(dig, 5)]) + "px" });
      num.textContent = v;
      el.appendChild(num);
      tabuleiro.appendChild(el);
      blocos.set(r + "," + c, el);
    }

    // Redesenha todos os blocos a partir da grade (`juntas`: casas que acabaram de juntar; `novo`: casa nova)
    function render(juntas = new Set(), novo = null) {
      blocos.forEach(el => el.remove());
      blocos.clear();
      grade.forEach((l, r) => l.forEach((v, c) => {
        if (v) criarBloco(r, c, v, juntas.has(r + "," + c) ? "junta" : novo && novo[0] === r && novo[1] === c ? "nasce" : "");
      }));
    }

    function atualizarInfo() {
      info.innerHTML = "";
      [["Pontos", pontos], ["🏆 Recorde", Math.max(lerRecorde(), pontos)], ["Objetivo", OBJETIVO]].forEach(([r, v]) => {
        const d = document.createElement("div");
        d.innerHTML = "<span></span><b></b>";
        d.querySelector("span").textContent = r;
        d.querySelector("b").textContent = v;
        info.appendChild(d);
      });
      bDesfazer.disabled = !anterior;
    }

    // ---------- Jogada ----------
    function terminarAnimacao() {
      if (!animando) return;
      clearTimeout(animando.timer);
      animando.fim();
    }

    function jogar(dir) {
      if (acabou || tela.querySelector(".n2048-aviso")) return;
      terminarAnimacao();
      const res = moverGrade(grade, dir);
      if (!res.moveu) { Motor.nota(160, { dur: 0.08, vol: 0.08 }); return; }
      anterior = { grade: grade.map(l => l.slice()), pontos };
      // Desliza os blocos que já estão na tela até o lugar novo
      res.movs.forEach(m => {
        const el = blocos.get(m.de.join(","));
        if (!el) return;
        el.style.transform = pos(m.para[0], m.para[1]);
        if (m.junta) el.style.zIndex = 2;
      });
      grade = res.grade;
      pontos += res.pontos;
      const novo = colocar(grade);
      const juntas = new Set(res.juncoes.map(j => j.r + "," + j.c));
      if (res.juncoes.length) {
        const maior = Math.max(...res.juncoes.map(j => j.v));
        Motor.nota(330 + 40 * Math.log2(maior), { dur: 0.12, tipo: "triangle", vol: 0.12 });
        if (mostrarSoma) mostrarConta(res.juncoes);
      } else Motor.nota(520, { dur: 0.04, vol: 0.04 });
      if (pontos > lerRecorde()) { try { localStorage.setItem(chaveRecorde, pontos); } catch (e) { /* ok */ } }
      atualizarInfo();
      const fim = () => {
        animando = null;
        render(juntas, novo);
        conferir();
      };
      animando = { fim, timer: setTimeout(() => { if (vivo()) fim(); }, 115) };
    }

    // Mostra as contas da jogada ("2 + 2 = 4") e a voz fala a maior delas
    function mostrarConta(juncoes) {
      const ordenadas = [...juncoes].sort((a, b) => b.v - a.v);
      soma.textContent = ordenadas.slice(0, 3).map(j => `${j.a} + ${j.a} = ${j.v}`).join("   ");
      soma.classList.remove("mostra");
      void soma.offsetWidth; // reinicia a animação
      soma.classList.add("mostra");
      const j = ordenadas[0];
      Motor.falar(`${j.a} mais ${j.a} é ${j.v}`);
    }

    function conferir() {
      const maior = Math.max(...grade.flat());
      if (!venceu && maior >= OBJETIVO) {
        venceu = true;
        aviso(`🎉 Você chegou ao ${OBJETIVO}!`, `${pontos} pontos`, [
          ["▶️ Continuar", () => fecharAviso(), true],
          ["🔁 Novo jogo", comecar],
        ]);
        Motor.tim();
        Motor.falar(`Parabéns! Você chegou ao ${OBJETIVO}!`, { naFila: true });
        return;
      }
      if (!temJogada(grade)) fimDeJogo();
    }

    function fimDeJogo() {
      acabou = true;
      const novoRecorde = pontos > recordeInicial;
      const maior = Math.max(...grade.flat());
      aviso(novoRecorde ? "🏆 Novo recorde!" : "Acabaram as jogadas!", `${pontos} pontos · maior bloco ${maior}`, [
        ["↩️ Desfazer", desfazer],
        ["🔁 Jogar de novo", comecar, true],
      ]);
      if (novoRecorde) Motor.tim();
      Motor.falar(novoRecorde ? `Novo recorde! ${pontos} pontos!` : `Acabaram as jogadas! Você fez ${pontos} pontos e chegou ao ${maior}.`, { naFila: true });
    }

    function aviso(titulo, texto, acoes) {
      fecharAviso();
      const caixa = document.createElement("div");
      caixa.className = "n2048-aviso";
      caixa.innerHTML = `<div class="titulo-fim"></div><div class="pontos-fim"></div><div class="chips"></div>`;
      caixa.querySelector(".titulo-fim").textContent = titulo;
      caixa.querySelector(".pontos-fim").textContent = texto;
      acoes.forEach(([rotulo, fn, principal]) => {
        const b = document.createElement("button");
        b.className = "chip" + (principal ? " executar" : "");
        b.textContent = rotulo;
        b.addEventListener("click", fn);
        caixa.querySelector(".chips").appendChild(b);
      });
      tela.appendChild(caixa);
      Motor.comemorar(caixa);
    }
    function fecharAviso() { tela.querySelector(".n2048-aviso")?.remove(); }

    function desfazer() {
      terminarAnimacao();
      if (!anterior) return;
      grade = anterior.grade;
      pontos = anterior.pontos;
      anterior = null;
      acabou = false;
      fecharAviso();
      render();
      atualizarInfo();
      Motor.nota(440, { dur: 0.1, vol: 0.08, ate: 300 });
    }

    // ---------- Controles ----------
    // Deslizar o dedo no tabuleiro: a jogada acontece assim que o dedo anda o suficiente
    let toque = null;
    tabuleiro.addEventListener("pointerdown", e => { toque = { x: e.clientX, y: e.clientY }; try { tabuleiro.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } });
    tabuleiro.addEventListener("pointermove", e => {
      if (!toque) return;
      const dx = e.clientX - toque.x, dy = e.clientY - toque.y;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return;
      toque = null;
      jogar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "direita" : "esquerda") : (dy > 0 ? "baixo" : "cima"));
    });
    ["pointerup", "pointercancel"].forEach(ev => tabuleiro.addEventListener(ev, () => { toque = null; }));

    const teclas = e => {
      if (!vivo()) { document.removeEventListener("keydown", teclas); return; }
      const dirs = { ArrowUp: "cima", ArrowDown: "baixo", ArrowLeft: "esquerda", ArrowRight: "direita", w: "cima", s: "baixo", a: "esquerda", d: "direita" };
      if (dirs[e.key]) { e.preventDefault(); jogar(dirs[e.key]); }
      else if (e.key === "Backspace" || e.key === "z" || e.key === "u") { e.preventDefault(); desfazer(); }
    };
    document.addEventListener("keydown", teclas);

    // ---------- Começo ----------
    function comecar() {
      terminarAnimacao();
      clearTimeout(confirmarNovo);
      confirmarNovo = null;
      bNovo.textContent = "🔁 Novo jogo";
      grade = Array.from({ length: N }, () => Array(N).fill(0));
      colocar(grade);
      colocar(grade);
      pontos = 0; anterior = null; venceu = false; acabou = false;
      recordeInicial = lerRecorde();
      fecharAviso();
      soma.classList.remove("mostra");
      render();
      atualizarInfo();
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.J2048_TESTE) {
      window.J2048_TESTE = {
        estado: () => ({ grade: grade.map(l => l.slice()), pontos, venceu, acabou, aviso: tela.querySelector(".n2048-aviso")?.textContent || "" }),
        jogar, desfazer, comecar, continuar: fecharAviso,
        // Põe uma grade pronta (para testar vitória e fim de jogo)
        definir(g) { terminarAnimacao(); grade = g.map(l => l.slice()); render(); conferir(); },
      };
    }

    comecar();
    Motor.falar(mostrarSoma
      ? "Deslize o dedo para juntar números iguais. Dois mais dois é quatro!"
      : `Deslize o dedo para juntar números iguais e chegar ao ${OBJETIVO}!`);
  }

  // Para testes em Node
  if (typeof globalThis !== "undefined") globalThis.J2048Teste = { moverGrade, temJogada, colocar, DIRECOES };
})();
