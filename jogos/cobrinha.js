// Cobrinha: a cobrinha anda sozinha pela grade; a criança escolhe a direção (setas grandes,
// deslizar o dedo no tabuleiro ou teclado) para comer e crescer. Bater na parede ou em si
// mesma termina o jogo. Modos: Clássico (frutas), Números em ordem e Letras (soletrar).
// Opção "paredes que atravessam" para os pequenos: sai de um lado e volta do outro.
(() => {
  const N = 15; // grade N × N
  const FRUTAS = ["🍎", "🍌", "🍇", "🍓", "🍉", "🍊"];
  const VELOCIDADES = { devagar: 330, normal: 240, rapido: 170 }; // ms por passo no começo
  const DIRS = { cima: [0, -1], baixo: [0, 1], esquerda: [-1, 0], direita: [1, 0] };
  const PALAVRAS = {
    curtas: [["SOL", "☀️"], ["LUA", "🌙"], ["UVA", "🍇"], ["OVO", "🥚"], ["MEL", "🍯"], ["BOI", "🐂"],
      ["GATO", "🐱"], ["BOLA", "⚽"], ["PATO", "🦆"], ["CASA", "🏠"], ["SAPO", "🐸"], ["VACA", "🐄"], ["BOLO", "🎂"], ["PIPA", "🪁"]],
    medias: [["GATO", "🐱"], ["BOLA", "⚽"], ["PATO", "🦆"], ["CASA", "🏠"], ["SAPO", "🐸"], ["RATO", "🐭"], ["DADO", "🎲"],
      ["PEIXE", "🐟"], ["MESA", "🪑"], ["FOCA", "🦭"], ["URSO", "🐻"], ["LEAO", "🦁"], ["PIPA", "🪁"], ["NAVIO", "🚢"]],
    longas: [["PEIXE", "🐟"], ["BANANA", "🍌"], ["MACACO", "🐒"], ["CAVALO", "🐴"], ["COELHO", "🐰"], ["TOMATE", "🍅"],
      ["ESTRELA", "⭐"], ["JANELA", "🪟"], ["GIRAFA", "🦒"], ["CENOURA", "🥕"], ["TARTARUGA", "🐢"], ["BORBOLETA", "🦋"]],
  };
  const FALA_PALAVRA = { LEAO: "leão" };
  const recorde = () => { try { return +localStorage.getItem("cobrinha-recorde") || 0; } catch (e) { return 0; } };

  JOGOS.push({
    id: "cobrinha", teclas: true,
    nome: "Cobrinha",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 50 H34 a10 10 0 0 0 0 -20 H26 a8 8 0 0 1 0 -16 H44" fill="none" stroke="#151515" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 50 H34 a10 10 0 0 0 0 -20 H26 a8 8 0 0 1 0 -16 H44" fill="none" stroke="#3cb44b" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="46" cy="14" r="8" fill="#3cb44b" stroke="#151515" stroke-width="2"/><circle cx="48" cy="11" r="2.4" fill="#fff"/><circle cx="48.5" cy="11" r="1.2" fill="#151515"/><path d="M53 15 l6 1 m-6 -1 l5 4" stroke="#e63946" stroke-width="2" stroke-linecap="round"/><circle cx="55" cy="47" r="6" fill="#e63946" stroke="#151515" stroke-width="2"/><path d="M55 41 q2 -4 5 -4" stroke="#2a9d55" stroke-width="2.5" fill="none"/></svg>',
    faixas: ["5-6", "6-8", "8-10"],
    iniciar(area, faixa) {
      const pequenos = faixa === "5-6";
      const opcoes = modo => Motor.telaOpcoes(area, {
        opcoes: [
          { titulo: "Velocidade", chave: "vel", valores: [["devagar", "🐢 Devagar"], ["normal", "🐇 Normal"], ["rapido", "🚀 Rápido"]] },
          { titulo: "Paredes", chave: "paredes", valores: [["atravessa", "🌀 Atravessam"], ["bate", "🧱 Batem"]] },
        ],
        padrao: pequenos ? { vel: "devagar", paredes: "atravessa" } : { vel: "normal", paredes: "bate" },
        chave: `cobrinha-opcoes-${faixa}`,
        aoJogar: op => jogo(area, faixa, modo, op),
      });
      Motor.escolherModo(area, [
        { icone: "🍎", rotulo: "Clássico", iniciar: () => opcoes("classico") },
        { icone: "🔢", rotulo: "Números em ordem", iniciar: () => opcoes("numeros") },
        { icone: "🔤", rotulo: "Letras", iniciar: () => opcoes("letras") },
      ]);
    },
  });

  function jogo(area, faixa, modo, op) {
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    const atravessa = op.paredes === "atravessa";
    let cobra, dir, filaDir, crescer, itens, pontos, comidos, acumulado, ultimoT, pausado, acabou, comecou;
    let proximo, rodadaNum, palavra, letraIdx, palavrasFeitas, batida;

    // ---------- Tela ----------
    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "cobra-tela";
    area.appendChild(tela);
    const deitado = tela.clientWidth > tela.clientHeight;
    tela.classList.toggle("deitado", deitado);

    const lateral = document.createElement("div");
    lateral.className = "cobra-lateral";
    const info = document.createElement("div");
    info.className = "cobra-info";
    const alvo = document.createElement("div");
    alvo.className = "cobra-alvo";
    const pausa = document.createElement("button");
    pausa.className = "chip";
    pausa.addEventListener("click", () => alternarPausa());
    const botoesTopo = document.createElement("div");
    botoesTopo.className = "cobra-botoes-topo";
    botoesTopo.append(pausa, Motor.botaoSom());
    lateral.append(info, alvo, botoesTopo);
    if (modo === "classico") alvo.hidden = true;

    const canvas = document.createElement("canvas");
    canvas.className = "cobra-tabuleiro";
    const controles = document.createElement("div");
    controles.className = "cobra-controles";
    tela.append(lateral, canvas, controles);

    const larg = tela.clientWidth, alt = tela.clientHeight;
    const cel = Math.floor(deitado
      ? Math.min((alt - 8) / N, (larg - 2 * 220) / N)
      : Math.min((alt - 150 - 220) / N, (larg - 12) / N));
    const L = N * cel;
    const dpr = window.devicePixelRatio || 1;
    Object.assign(canvas, { width: L * dpr, height: L * dpr });
    Object.assign(canvas.style, { width: L + "px", height: L + "px" });
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // ---------- Regras ----------
    const ocupado = (x, y) => cobra.some(s => s.x === x && s.y === y) || itens.some(i => i.x === x && i.y === y);
    function casaLivre() {
      const livres = [];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        // longe da cabeça, para não aparecer bem na frente da cobrinha
        const c = cobra[0];
        if (!ocupado(x, y) && Math.abs(x - c.x) + Math.abs(y - c.y) > 2) livres.push({ x, y });
      }
      return livres.length ? Motor.sortear(livres) : null;
    }
    function porItem(tipo, valor) {
      const p = casaLivre();
      if (p) itens.push({ ...p, tipo, valor });
    }

    function novaRodada() {
      itens = [];
      if (modo === "classico") porItem("fruta", Motor.sortear(FRUTAS));
      else if (modo === "numeros") {
        const qtd = faixa === "5-6" ? 5 : faixa === "6-8" ? 6 : 8;
        const ini = rodadaNum * qtd + 1;
        proximo = ini;
        for (let k = 0; k < qtd; k++) porItem("numero", ini + k);
      } else {
        const lista = PALAVRAS[faixa === "5-6" ? "curtas" : faixa === "6-8" ? "medias" : "longas"];
        let p;
        do { p = Motor.sortear(lista); } while (palavra && p[0] === palavra[0] && lista.length > 1);
        palavra = p;
        letraIdx = 0;
        palavra[0].split("").forEach(l => porItem("letra", l));
        Motor.falar(`Vamos escrever ${FALA_PALAVRA[palavra[0]] || palavra[0].toLowerCase()}!`, { naFila: true });
      }
      atualizarAlvo();
    }

    function virar(nome) {
      if (acabou) return;
      if (pausado) alternarPausa();
      const ultima = filaDir.length ? filaDir[filaDir.length - 1] : dir;
      const [ux, uy] = DIRS[ultima], [nx, ny] = DIRS[nome];
      if (nome === ultima || (ux === -nx && uy === -ny && cobra.length > 1)) {
        if (!comecou && nome === ultima) comecou = true;
        return;
      }
      if (filaDir.length < 2) filaDir.push(nome);
      if (!comecou) { comecou = true; acumulado = intervalo(); }
    }

    const intervalo = () => Math.max(85, VELOCIDADES[op.vel] * Math.pow(0.975, comidos));

    function passo() {
      if (filaDir.length) dir = filaDir.shift();
      const [dx, dy] = DIRS[dir];
      let x = cobra[0].x + dx, y = cobra[0].y + dy;
      if (atravessa) { x = (x + N) % N; y = (y + N) % N; }
      else if (x < 0 || y < 0 || x >= N || y >= N) { batida = { x: cobra[0].x, y: cobra[0].y }; return fim(); }
      // O rabo sai do lugar neste passo (se não estiver crescendo), então pode encostar nele
      const corpo = crescer > 0 ? cobra : cobra.slice(0, -1);
      if (corpo.some(s => s.x === x && s.y === y)) { batida = { x, y }; return fim(); }
      cobra.unshift({ x, y });
      if (crescer > 0) crescer--; else cobra.pop();
      const k = itens.findIndex(i => i.x === x && i.y === y);
      if (k >= 0) comer(k);
    }

    function comer(k) {
      const it = itens[k];
      if (it.tipo === "fruta") {
        itens.splice(k, 1);
        crescer += 1; comidos++; pontos += 10;
        Motor.nota(520 + Math.min(comidos, 20) * 20, { dur: 0.09, vol: 0.15, tipo: "square" });
        if (comidos % 10 === 0) Motor.falar(Motor.elogio());
        porItem("fruta", Motor.sortear(FRUTAS));
      } else if (it.tipo === "numero") {
        if (it.valor === proximo) {
          itens.splice(k, 1);
          crescer += 1; comidos++; pontos += 10;
          Motor.tim();
          Motor.falar(String(it.valor));
          proximo++;
          if (!itens.length) { pontos += 50; rodadaNum++; Motor.depois(() => Motor.falar(Motor.elogio(), { naFila: true }), 300); novaRodada(); }
        } else errou();
      } else if (it.tipo === "letra") {
        if (it.valor === palavra[0][letraIdx]) {
          itens.splice(k, 1);
          crescer += 1; comidos++; pontos += 10; letraIdx++;
          Motor.tim();
          Motor.falar(it.valor.toLowerCase());
          if (letraIdx >= palavra[0].length) {
            pontos += 50; palavrasFeitas++;
            const nome = FALA_PALAVRA[palavra[0]] || palavra[0].toLowerCase();
            Motor.depois(() => Motor.falar(`${nome}! ${Motor.elogio()}`, { naFila: true }), 250);
            itens = [];
            Motor.depois(() => { if (!acabou) novaRodada(); }, 900);
          }
        } else errou();
      }
      atualizarInfo();
      atualizarAlvo();
    }
    function errou() {
      Motor.nota(200, { dur: 0.15, vol: 0.12, tipo: "triangle" });
      Motor.falar(modo === "numeros" ? `Ops! Procure o ${proximo}.` : `Ops! Procure a letra ${palavra[0][letraIdx].toLowerCase()}.`);
    }

    function alternarPausa() {
      if (acabou) return;
      pausado = !pausado;
      atualizarInfo();
      if (!pausado) { ultimoT = performance.now(); requestAnimationFrame(laco); } else desenhar();
    }

    // ---------- Laço do jogo ----------
    function laco(t) {
      if (!vivo() || pausado || acabou) return;
      const dt = Math.min(200, t - ultimoT);
      ultimoT = t;
      if (comecou) {
        acumulado += dt;
        if (acumulado >= intervalo()) { acumulado = 0; passo(); }
      }
      if (acabou) return;
      desenhar(t);
      requestAnimationFrame(laco);
    }

    // ---------- Desenho ----------
    function redondo(x, y, w, h, r) {
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
    }
    function desenhar(t = performance.now()) {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#a7d86d" : "#b5e07a";
        ctx.fillRect(x * cel, y * cel, cel, cel);
      }
      if (!atravessa) { ctx.strokeStyle = "#5a3d1e"; ctx.lineWidth = 4; ctx.strokeRect(2, 2, L - 4, L - 4); }
      // Itens
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      itens.forEach(i => {
        const cx = i.x * cel + cel / 2, cy = i.y * cel + cel / 2;
        if (i.tipo === "fruta") {
          const pulo = Math.sin(t / 200 + i.x) * cel * 0.05;
          ctx.font = `${cel * 0.85}px sans-serif`;
          ctx.fillText(i.valor, cx, cy + pulo + cel * 0.04);
        } else {
          const certo = i.tipo === "numero" ? i.valor === proximo : i.valor === palavra[0][letraIdx];
          redondo(i.x * cel + 1.5, i.y * cel + 1.5, cel - 3, cel - 3, cel * 0.25);
          ctx.fillStyle = i.tipo === "numero" ? "#ffd60a" : "#ffffff";
          ctx.fill();
          ctx.strokeStyle = certo && faixa === "5-6" ? "#e63946" : "#3a2a10";
          ctx.lineWidth = certo && faixa === "5-6" ? 3 : 1.5;
          ctx.stroke();
          ctx.fillStyle = "#1b263b";
          const txt = String(i.valor);
          ctx.font = `bold ${cel * (txt.length > 1 ? 0.6 : 0.75)}px sans-serif`;
          ctx.fillText(txt, cx, cy + cel * 0.04);
        }
      });
      // Cobrinha: um "tubo" grosso ligando os gomos, do rabo para a cabeça
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (let k = cobra.length - 1; k > 0; k--) {
        const a = cobra[k], b = cobra[k - 1];
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) !== 1) continue; // atravessou a parede
        ctx.strokeStyle = k % 2 ? "#3cb44b" : "#52c45f";
        ctx.lineWidth = cel * (0.62 - 0.14 * k / Math.max(cobra.length, 8));
        ctx.beginPath();
        ctx.moveTo(a.x * cel + cel / 2, a.y * cel + cel / 2);
        ctx.lineTo(b.x * cel + cel / 2, b.y * cel + cel / 2);
        ctx.stroke();
      }
      const rabo = cobra[cobra.length - 1];
      ctx.fillStyle = "#3cb44b";
      ctx.beginPath(); ctx.arc(rabo.x * cel + cel / 2, rabo.y * cel + cel / 2, cel * 0.24, 0, 7); ctx.fill();
      redondo(cobra[0].x * cel + cel * 0.06, cobra[0].y * cel + cel * 0.06, cel * 0.88, cel * 0.88, cel * 0.38);
      ctx.fillStyle = "#2a9d55";
      ctx.fill();
      // Olhos e língua
      const c = cobra[0], [dx, dy] = DIRS[dir];
      const cx = c.x * cel + cel / 2, cy = c.y * cel + cel / 2;
      const px = -dy, py = dx; // perpendicular
      [-1, 1].forEach(lado => {
        const ox = cx + dx * cel * 0.15 + px * lado * cel * 0.2, oy = cy + dy * cel * 0.15 + py * lado * cel * 0.2;
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ox, oy, cel * 0.14, 0, 7); ctx.fill();
        ctx.fillStyle = "#151515"; ctx.beginPath(); ctx.arc(ox + dx * cel * 0.04, oy + dy * cel * 0.04, cel * 0.07, 0, 7); ctx.fill();
      });
      if (Math.floor(t / 300) % 3 === 0) {
        ctx.strokeStyle = "#e63946"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + dx * cel * 0.45, cy + dy * cel * 0.45); ctx.lineTo(cx + dx * cel * 0.68, cy + dy * cel * 0.68); ctx.stroke();
      }
      if (batida) {
        ctx.font = `${cel * 1.1}px sans-serif`;
        ctx.fillText("💥", batida.x * cel + cel / 2, batida.y * cel + cel / 2);
      }
      const faixaTexto = (txt) => {
        const y = Math.round(N * 0.8) * cel; // abaixo da cobrinha, para não escondê-la
        ctx.fillStyle = "rgba(0,0,0,.5)";
        ctx.fillRect(0, y - cel * 1.2, L, cel * 2.4);
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(16, cel * 0.8)}px sans-serif`;
        ctx.fillText(txt, L / 2, y);
      };
      if (pausado && !acabou) faixaTexto("⏸️ Pausa");
      else if (!comecou && !acabou) faixaTexto("Toque numa seta para começar!");
    }

    function atualizarInfo() {
      info.innerHTML = "";
      [["Pontos", pontos], ["Tamanho", cobra.length + crescer], ["🏆", Math.max(recorde(), pontos)]].forEach(([r, v]) => {
        const d = document.createElement("div");
        d.innerHTML = "<span></span><b></b>";
        d.querySelector("span").textContent = r;
        d.querySelector("b").textContent = v;
        info.appendChild(d);
      });
      pausa.textContent = pausado ? "▶️ Continuar" : "⏸️ Pausar";
    }
    function atualizarAlvo() {
      alvo.innerHTML = "";
      if (modo === "numeros") {
        alvo.textContent = `Coma o número ${proximo}`;
      } else if (modo === "letras" && palavra) {
        const e = document.createElement("span");
        e.className = "cobra-emoji";
        e.textContent = palavra[1];
        alvo.appendChild(e);
        palavra[0].split("").forEach((l, i) => {
          const s = document.createElement("span");
          s.className = "cobra-letra" + (i < letraIdx ? " feita" : i === letraIdx ? " proxima" : "");
          s.textContent = l;
          alvo.appendChild(s);
        });
      }
    }

    // ---------- Controles ----------
    const botao = (icone, rotulo, nome, classe) => {
      const b = document.createElement("button");
      b.className = "cobra-botao " + classe;
      b.textContent = icone;
      b.setAttribute("aria-label", rotulo);
      b.addEventListener("pointerdown", e => { e.preventDefault(); virar(nome); });
      return b;
    };
    controles.append(
      botao("⬆️", "Cima", "cima", "c-cima"),
      botao("⬅️", "Esquerda", "esquerda", "c-esq"),
      botao("➡️", "Direita", "direita", "c-dir"),
      botao("⬇️", "Baixo", "baixo", "c-baixo"));

    // Deslizar o dedo no tabuleiro (pode continuar deslizando sem levantar o dedo)
    let toque = null;
    canvas.addEventListener("pointerdown", e => { toque = { x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } });
    canvas.addEventListener("pointermove", e => {
      if (!toque) return;
      const dx = e.clientX - toque.x, dy = e.clientY - toque.y, lim = Math.max(18, cel * 0.7);
      if (Math.max(Math.abs(dx), Math.abs(dy)) < lim) return;
      virar(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "direita" : "esquerda") : (dy > 0 ? "baixo" : "cima"));
      toque = { x: e.clientX, y: e.clientY };
    });
    ["pointerup", "pointercancel"].forEach(ev => canvas.addEventListener(ev, () => { toque = null; }));

    const teclas = e => {
      if (!vivo()) { document.removeEventListener("keydown", teclas); return; }
      const mapa = { ArrowUp: "cima", ArrowDown: "baixo", ArrowLeft: "esquerda", ArrowRight: "direita", w: "cima", s: "baixo", a: "esquerda", d: "direita" };
      if (mapa[e.key]) { e.preventDefault(); virar(mapa[e.key]); }
      else if (e.key === " " || e.key === "p") { e.preventDefault(); alternarPausa(); }
    };
    document.addEventListener("keydown", teclas);

    // ---------- Começo e fim ----------
    function comecar() {
      const m = Math.floor(N / 2);
      cobra = [{ x: m - 2, y: m }, { x: m - 3, y: m }, { x: m - 4, y: m }];
      dir = "direita"; filaDir = []; crescer = 0; pontos = 0; comidos = 0; acumulado = 0;
      pausado = false; acabou = false; comecou = false; batida = null;
      rodadaNum = 0; palavra = null; letraIdx = 0; palavrasFeitas = 0; proximo = 1;
      tela.querySelector(".cobra-fim")?.remove();
      novaRodada();
      atualizarInfo();
      ultimoT = performance.now();
      requestAnimationFrame(laco);
    }

    function fim() {
      acabou = true;
      Motor.ruido({ dur: 0.3, vol: 0.25, freq: 600 });
      const novoRecorde = pontos > recorde();
      if (novoRecorde) { try { localStorage.setItem("cobrinha-recorde", pontos); } catch (e) { /* ok */ } }
      atualizarInfo();
      desenhar();
      const caixa = document.createElement("div");
      caixa.className = "cobra-fim";
      caixa.innerHTML = `<div class="titulo-fim"></div><div class="pontos-fim"></div>`;
      caixa.querySelector(".titulo-fim").textContent = novoRecorde ? "🏆 Novo recorde!" : "Fim de jogo!";
      const extra = modo === "letras" ? ` · ${palavrasFeitas} palavra${palavrasFeitas === 1 ? "" : "s"}` : ` · tamanho ${cobra.length}`;
      caixa.querySelector(".pontos-fim").textContent = `${pontos} pontos${extra}`;
      const b = document.createElement("button");
      b.className = "chip executar";
      b.textContent = "🔁 Jogar de novo";
      b.addEventListener("click", comecar);
      caixa.appendChild(b);
      tela.appendChild(caixa);
      if (novoRecorde) { Motor.comemorar(caixa); Motor.tim(); }
      Motor.falar(novoRecorde ? `Novo recorde! ${pontos} pontos!` : `Fim de jogo! Você fez ${pontos} pontos.`);
    }

    // Gancho para os testes automáticos (só existe se a página de teste pedir)
    if (window.COBRA_TESTE) window.COBRA_TESTE = {
      estado: () => ({ cobra, dir, itens, pontos, acabou, proximo, palavra, letraIdx, palavrasFeitas, comidos, N }),
      virar,
    };

    comecar();
    const dica = { classico: "Coma as frutas para crescer!", numeros: "Coma os números em ordem: um, dois, três!", letras: "Coma as letras na ordem para escrever a palavra!" }[modo];
    Motor.falar(`${dica} Use as setas ou deslize o dedo.`);
  }
})();
