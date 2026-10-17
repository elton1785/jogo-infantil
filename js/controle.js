// Jogar na TV: controle de videogame (USB/Bluetooth, pela Gamepad API do navegador), controle
// remoto da TV e teclado.
// - Navegação por destaque: as setas (ou o direcional/alavanca do controle) movem um contorno
//   laranja entre os botões, cartões e casas da tela; A / OK / Enter aperta; B / Voltar volta.
// - Jogos de ação marcam `teclas: true` em JOGOS: durante a partida as setas vão para o jogo
//   (pular, mover...) em vez de mover o destaque. Telas de fim de partida ganham o destaque sozinhas.
// - Ponte do controle: direcional/alavanca esquerda = setas, A = Enter, B = Voltar, X = espaço,
//   Y = "y", LB/RB = "q"/"e", Start = "p" (pausa). Os eventos de teclado gerados levam
//   `doControle = true`, para jogos que leem o controle direto (Mundo de Blocos) os ignorarem.
// Todo elemento com ação de clique é marcado (__clicavel) para entrar na navegação, sem precisar
// mexer em cada jogo.
const Controle = (() => {
  const addOriginal = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (tipo, fn, op) {
    if (tipo === "click" && this instanceof Element) this.__clicavel = true;
    return addOriginal.call(this, tipo, fn, op);
  };

  const SETAS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  const VOLTAR = new Set(["GoBack", "BrowserBack", "XF86Back", "Back"]);
  let modoControle = false; // vira true no primeiro uso de setas/controle (mostra o destaque)
  let jogoTeclas = () => false; // o App informa se a partida atual usa as setas

  // ---------- Quem pode receber o destaque ----------
  const visivel = el => {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return false; // fora da tela vale: a lista rola até ele
    if (r.width * r.height > innerWidth * innerHeight * 0.45) return false; // áreas enormes (tabuleiro inteiro, tela)
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && !el.closest("[hidden]") && +cs.opacity > 0.05;
  };
  function candidatos() {
    const ajuda = document.querySelector(".ajuda-fundo") || document.querySelector(".sobreposta");
    const raiz = ajuda || document.querySelector(".tela.ativa");
    if (!raiz) return [];
    const els = [...raiz.querySelectorAll("button, [data-toque], [tabindex], *")].filter(el =>
      ((el.tagName === "BUTTON" && !el.disabled) || el.__clicavel || el.hasAttribute("data-toque") || (el.tabIndex >= 0 && el.tagName !== "CANVAS" && el.tagName !== "INPUT")) &&
      !(el.parentElement && el.parentElement.closest("button")));
    // Janelas por cima (mochila do Mundo, fim de partida...): só o que está nelas
    const janela = !ajuda && raiz.querySelector(".mundo-mochila, .arcade-fim, .blocos-fim, .plat-fim");
    let lista = janela ? els.filter(el => janela.contains(el)) : els;
    if (!ajuda && !janela) ["btn-ajuda", "btn-inicio", "btn-tela-cheia", "btn-atualizar"].forEach(id => { const b = document.getElementById(id); if (b) lista.push(b); });
    return [...new Set(lista)].filter(visivel);
  }

  // ---------- Destaque ----------
  let atual = null;
  let lembrado = null; // { tipo, x, y } do último destacado: para achar o substituto se ele sumir
  const tipoDe = el => el.tagName + "." + (el.classList[0] || "");
  function focar(el) {
    if (atual) atual.classList.remove("foco-tv");
    atual = el;
    if (!el) { lembrado = null; return; }
    const [x, y] = centro(el.getBoundingClientRect());
    lembrado = { tipo: tipoDe(el), x, y };
    if (el.tabIndex < 0 && !/^(BUTTON|A|INPUT)$/.test(el.tagName)) el.setAttribute("tabindex", "-1");
    el.classList.add("foco-tv");
    try { el.focus({ preventScroll: true }); } catch (e) { /* ok */ }
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }
  const focoValido = () => atual && document.contains(atual) && candidatos().includes(atual) ? atual : null;
  const centro = r => [r.left + r.width / 2, r.top + r.height / 2];
  // Jogos que redesenham a tela a cada jogada (tabuleiros) trocam o elemento destacado por um
  // novo igual: o destaque passa para o do mesmo tipo no mesmo lugar, em vez de pular para o início.
  function substituto(lista) {
    if (!lembrado || (atual && document.contains(atual))) return null;
    let melhor = null, menor = Infinity;
    lista.forEach(el => {
      if (tipoDe(el) !== lembrado.tipo) return;
      const r = el.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - lembrado.x, r.top + r.height / 2 - lembrado.y);
      if (d < menor && d < Math.max(24, Math.min(r.width, r.height))) { menor = d; melhor = el; }
    });
    return melhor;
  }

  // Vai para o elemento mais perto na direção pedida (o desalinhamento pesa mais que a distância)
  function mover([dx, dy]) {
    const lista = candidatos();
    if (!lista.length) return;
    let daqui = focoValido();
    if (!daqui) {
      daqui = substituto(lista);
      if (!daqui) { focar(primeiro(lista)); return; }
      focar(daqui);
    }
    const r = daqui.getBoundingClientRect(), [cx, cy] = centro(r);
    let melhor = null, nota = Infinity;
    lista.forEach(el => {
      if (el === daqui) return;
      const o = el.getBoundingClientRect(), [ox, oy] = centro(o);
      const frente = dx ? (ox - cx) * dx : (oy - cy) * dy;
      if (frente <= 2) return;
      // distância entre as bordas no eixo do movimento e desalinhamento no outro eixo
      const borda = dx ? Math.max(0, dx > 0 ? o.left - r.right : r.left - o.right) : Math.max(0, dy > 0 ? o.top - r.bottom : r.top - o.bottom);
      const lado = dx ? Math.max(0, Math.max(o.top, r.top) - Math.min(o.bottom, r.bottom)) : Math.max(0, Math.max(o.left, r.left) - Math.min(o.right, r.right));
      const desal = dx ? Math.abs(oy - cy) : Math.abs(ox - cx);
      const n = borda + frente * 0.1 + lado * 3 + desal * 0.3;
      if (n < nota) { nota = n; melhor = el; }
    });
    if (melhor) focar(melhor);
  }
  // Primeiro destaque: o botão principal se houver (Jogar, Entendi...), senão o de cima à esquerda
  function primeiro(lista) {
    const principal = lista.find(el => el.matches(".modo.ativo")) || lista.find(el => el.matches(".jogar, .executar")); // nos passos de escolha: o cartão escolhido da última vez
    if (principal) return principal;
    const semCanto = lista.filter(el => !el.matches(".canto"));
    return (semCanto.length ? semCanto : lista).slice().sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return Math.abs(ra.top - rb.top) > 20 ? ra.top - rb.top : ra.left - rb.left;
    })[0];
  }

  // Aperta o elemento: clique normal, ou um "toque" (pointerdown + pointerup) no meio dele
  function apertar(el) {
    if (el.hasAttribute("data-toque")) {
      const [x, y] = centro(el.getBoundingClientRect());
      const o = { bubbles: true, clientX: x, clientY: y, pointerId: 99, pointerType: "touch", isPrimary: true };
      el.dispatchEvent(new PointerEvent("pointerdown", o));
      el.dispatchEvent(new PointerEvent("pointerup", o));
      return;
    }
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  }

  function voltar() {
    if (Ajuda.aberta()) { Ajuda.fechar(); return; }
    if (typeof Album !== "undefined" && Album.aberto()) { Album.fechar(); return; }
    const janela = document.querySelector(".mundo-mochila"); // janelas por cima do jogo: fecha primeiro
    if (janela) { janela.remove(); return; }
    const casa = document.getElementById("btn-voltar");
    if (casa && casa.style.display !== "none") casa.click();
  }

  // ---------- Teclas (teclado, controle remoto e a ponte do controle) ----------
  window.addEventListener("keydown", e => {
    const k = e.key;
    const editando = e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
    if (VOLTAR.has(k) || e.keyCode === 10009 || e.keyCode === 461 || (k === "Backspace" && !editando && !document.querySelector("#jogo.ativa")) || (k === "Escape" && !jogoTeclas())) {
      e.preventDefault(); e.stopImmediatePropagation();
      voltar();
      return;
    }
    const seta = SETAS[k], ok = k === "Enter" || (k === " " && !jogoTeclas() && !(document.querySelector(".teclado") && !e.doControle)); // espaço do teclado escreve no teclado da tela
    if (!seta && !ok) return;
    modoControle = true;
    document.body.classList.add("modo-controle");
    const foco = focoValido();
    // Partida de jogo de ação: as setas e o OK são do jogo (a não ser que haja algo destacado)
    if (jogoTeclas() && !foco && !Ajuda.aberta()) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (seta) mover(seta);
    else if (foco) {
      apertar(foco);
      if (jogoTeclas()) { foco.blur(); focar(null); } // de volta para o jogo
    } else mover([0, 1]);
  }, true);

  // O mouse ou o dedo apagam o destaque (ele volta na próxima seta)
  window.addEventListener("pointerdown", e => {
    if (e.pointerId === 99) return;
    if (modoControle) { modoControle = false; document.body.classList.remove("modo-controle"); focar(null); }
  }, true);

  // Tela nova no modo controle: já destaca o botão principal (menus, fim de partida, ajuda)
  let espera = null;
  new MutationObserver(() => {
    if (!modoControle) return;
    clearTimeout(espera);
    espera = setTimeout(() => {
      if (focoValido()) return;
      const lista = candidatos();
      if (!lista.length) return;
      const janela = document.querySelector(".ajuda-fundo, .sobreposta, .mundo-mochila, .arcade-fim, .blocos-fim, .plat-fim, .fim");
      const mesmo = !janela && !jogoTeclas() && substituto(lista);
      if (mesmo) { focar(mesmo); return; }
      if (jogoTeclas() && !janela) return; // durante a partida, nada de destaque
      focar(primeiro(lista));
    }, 120);
  }).observe(document.body, { childList: true, subtree: true });

  // ---------- Ponte do controle de videogame ----------
  // Botões no mapeamento padrão: 0 A, 1 B, 2 X, 3 Y, 4 LB, 5 RB, 6 LT, 7 RT, 8 Select, 9 Start,
  // 12-15 direcional. Eixos: 0/1 alavanca esquerda, 2/3 alavanca direita.
  const MAPA = [
    ["ArrowUp", p => p.botao(12) || p.eixo(1) < -0.55],
    ["ArrowDown", p => p.botao(13) || p.eixo(1) > 0.55],
    ["ArrowLeft", p => p.botao(14) || p.eixo(0) < -0.55],
    ["ArrowRight", p => p.botao(15) || p.eixo(0) > 0.55],
    ["Enter", p => p.botao(0)],
    ["GoBack", p => p.botao(1) || p.botao(8)],
    [" ", p => p.botao(2)],
    ["y", p => p.botao(3)],
    ["q", p => p.botao(4)],
    ["e", p => p.botao(5)],
    ["p", p => p.botao(9)],
  ];
  const segurando = {}; // tecla → hora da próxima repetição
  let lendo = false, padAtual = null;
  function lerControle() {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    if (!pads.length) { lendo = false; padAtual = null; return; }
    const g = pads[0];
    padAtual = {
      botao: i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5)),
      eixo: i => { const v = g.axes[i] || 0; return Math.abs(v) < 0.18 ? 0 : v; },
    };
    const agora = performance.now();
    MAPA.forEach(([tecla, teste]) => {
      const ligado = teste(padAtual);
      if (ligado && !segurando[tecla]) {
        segurando[tecla] = agora + 420;
        enviar("keydown", tecla);
      } else if (ligado && SETAS[tecla] && agora > segurando[tecla] && !jogoTeclas()) {
        segurando[tecla] = agora + 140; // segurar a seta repete (só nos menus)
        enviar("keydown", tecla, true);
      } else if (!ligado && segurando[tecla]) {
        delete segurando[tecla];
        enviar("keyup", tecla);
      }
    });
    requestAnimationFrame(lerControle);
  }
  function enviar(tipo, key, repeat = false) {
    const code = key === " " ? "Space" : key.length === 1 ? "Key" + key.toUpperCase() : key;
    const ev = new KeyboardEvent(tipo, { key, code, repeat, bubbles: true, cancelable: true });
    ev.doControle = true;
    (document.activeElement || document.body).dispatchEvent(ev);
  }
  function comecarLeitura() {
    if (lendo) return;
    lendo = true;
    requestAnimationFrame(lerControle);
  }
  window.addEventListener("gamepadconnected", () => {
    modoControle = true;
    document.body.classList.add("modo-controle");
    comecarLeitura();
    Motor.falar("Controle conectado! Use as setas para escolher e o botão A para apertar.");
  });
  // Alguns navegadores só mostram o controle depois de apertar um botão: confere de vez em quando
  setInterval(() => { if (!lendo && navigator.getGamepads && [...navigator.getGamepads()].some(Boolean)) comecarLeitura(); }, 1500);

  return {
    // O App diz como saber se a partida atual usa as setas
    usarTeclasDoJogo(fn) { jogoTeclas = fn; },
    // Estado do controle para jogos que o leem direto (null se não houver)
    pad: () => padAtual,
    // Todos os controles ligados (jogos de 2 jogadores): [{ botao(i), eixo(i), indice }], na ordem
    // em que foram conectados. O 1º também gera as teclas de seta (eventos com doControle = true):
    // um jogo que lê os controles direto deve ignorar esses eventos.
    pads: () => (navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []).map(g => ({
      indice: g.index,
      botao: i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.5)),
      eixo: i => { const v = g.axes[i] || 0; return Math.abs(v) < 0.18 ? 0 : v; },
    })),
    ativo: () => modoControle,
  };
})();
