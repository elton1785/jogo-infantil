// Ver as Horas — relógio de ponteiros (explorar arrastando, "Que horas são?", "Coloque o relógio"),
// rotina do dia (manhã, tarde e noite) e calendário (semana, meses, estações, ontem/hoje/amanhã e
// o calendário do mês com o dia de hoje e o aniversário).
(() => {
  const ID = "horas";

  // ---------- Utilidades ----------
  function el(tag, classe, html) {
    const e = document.createElement(tag);
    if (classe) e.className = classe;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function botao(classe, html, aoClicar, rotulo) {
    const b = el("button", classe, html);
    if (rotulo) b.setAttribute("aria-label", rotulo);
    b.addEventListener("click", aoClicar);
    return b;
  }
  const ler = (k, padrao) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? padrao : v; } catch (e) { return padrao; } };
  const gravar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } };
  const nivelDe = faixa => ({ "5-6": 0, "6-8": 1, "8-10": 2 }[faixa && faixa.id] ?? 2);
  const pad = n => String(n).padStart(2, "0");
  const mod = (n, m) => ((n % m) + m) % m;

  // ---------- Horas faladas (português do Brasil) ----------
  const UNI = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze",
    "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta"];
  function num(n, fem = false) {
    if (n < 20) return fem && n === 1 ? "uma" : fem && n === 2 ? "duas" : UNI[n];
    const d = Math.floor(n / 10), u = n % 10;
    return u ? `${DEZ[d]} e ${num(u, fem)}` : DEZ[d];
  }
  const h12 = h => (h % 12) || 12;
  function periodo(h) {
    if (h < 5) return "madrugada";
    if (h < 12) return "manhã";
    if (h < 18) return "tarde";
    return "noite";
  }
  const classePeriodo = p => ({ madrugada: "madrugada", "manhã": "manha", tarde: "tarde", noite: "noite" }[p]);
  const ASTRO = { madrugada: "🌙", "manhã": "🌅", tarde: "☀️", noite: "🌙" };
  function nomeHora(h) {
    h = mod(h, 24);
    if (h === 12) return "meio-dia";
    if (h === 0) return "meia-noite";
    return num(h12(h), true);
  }
  function paraA(h) {
    h = mod(h, 24);
    if (h === 12) return "para o meio-dia";
    if (h === 0) return "para a meia-noite";
    return h12(h) === 1 ? "para a uma" : `para as ${nomeHora(h)}`;
  }
  // "três e quinze", "meio-dia", "duas e meia", "quinze para as quatro", "uma hora da tarde"...
  // `comPeriodo`: acrescenta "da manhã/tarde/noite/madrugada" (não vale para meio-dia e meia-noite)
  function horaFalada(h, m, comPeriodo = true) {
    let t, base = h;
    if (m === 0) t = h % 12 === 0 ? nomeHora(h) : h12(h) === 1 ? "uma hora" : `${nomeHora(h)} horas`;
    else if (m === 30) t = `${nomeHora(h)} e meia`;
    else if (m >= 40 && m % 5 === 0) { base = h + 1; t = `${num(60 - m)} ${paraA(base)}`; }
    else t = `${nomeHora(h)} e ${num(m)}`;
    if (comPeriodo && mod(base, 12) !== 0) t += ` da ${periodo(mod(base, 24))}`;
    return t;
  }
  // "às sete horas", "à uma", "ao meio-dia", "à meia-noite"
  const prep = h => (h === 12 ? "ao" : h === 0 || h % 12 === 1 ? "à" : "às");
  // Relógio digital de 24 horas, falado: "quatorze horas e trinta minutos"
  function fala24(h, m) {
    const hs = h === 0 ? "zero hora" : h === 1 ? "uma hora" : `${num(h, true)} horas`;
    return m ? `${hs} e ${num(m)} ${m === 1 ? "minuto" : "minutos"}` : hs;
  }
  const dig12 = (h, m) => `${h12(h)}:${pad(m)}`;
  const dig24 = (h, m) => `${pad(h)}:${pad(m)}`;
  const hDe = t => Math.floor(mod(t, 1440) / 60), mDe = t => mod(t, 60);

  // ---------- Relógio de ponteiros (SVG) ----------
  let idSvg = 0;
  function svgRelogio(h, m, { rotulos = false, alcas = false, largura } = {}) {
    const id = "hrg" + (++idSvg);
    const p = (r, a) => [(Math.sin(a * Math.PI / 180) * r).toFixed(1), (-Math.cos(a * Math.PI / 180) * r).toFixed(1)];
    let s = `<svg class="hr-svg" viewBox="-112 -112 224 224"${largura ? ` style="width:${largura}px"` : ""} aria-hidden="true">` +
      `<defs><radialGradient id="${id}f" cx="42%" cy="36%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#fff0c2"/></radialGradient>` +
      `<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#f26b3a"/></linearGradient></defs>` +
      `<circle r="109" fill="rgba(0,0,0,.14)" cy="4"/><circle r="108" fill="url(#${id}b)"/><circle r="95" fill="url(#${id}f)"/>`;
    for (let i = 0; i < 60; i++) {
      const grosso = i % 5 === 0;
      const [x1, y1] = p(grosso ? 83 : 88, i * 6), [x2, y2] = p(93, i * 6);
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${grosso ? "#5b4a3a" : "#c2b08f"}" stroke-width="${grosso ? 3.2 : 1.4}" stroke-linecap="round"/>`;
    }
    for (let i = 1; i <= 12; i++) {
      const [x, y] = p(68, i * 30);
      s += `<text x="${x}" y="${(+y + 8).toFixed(1)}" text-anchor="middle" font-size="23" font-weight="700" font-family="Fredoka, sans-serif" fill="${i % 3 === 0 ? "#d6336c" : "#3a3a3a"}">${i}</text>`;
      if (rotulos) {
        const [rx, ry] = p(101.5, i * 30);
        s += `<text x="${rx}" y="${(+ry + 3.6).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" font-family="Fredoka, sans-serif" fill="#fff">${pad((i * 5) % 60)}</text>`;
      }
    }
    s += `<g class="hr-ph" transform="rotate(${(h % 12) * 30 + m * 0.5})"><line x1="0" y1="12" x2="0" y2="-50" stroke="#e5484d" stroke-width="11" stroke-linecap="round"/>` +
      (alcas ? `<circle cy="-50" r="10" fill="#e5484d" stroke="#fff" stroke-width="3"/>` : "") + `</g>` +
      `<g class="hr-pm" transform="rotate(${m * 6})"><line x1="0" y1="16" x2="0" y2="-80" stroke="#1d6fb8" stroke-width="7" stroke-linecap="round"/>` +
      (alcas ? `<circle cy="-80" r="9" fill="#1d6fb8" stroke="#fff" stroke-width="3"/>` : "") + `</g>` +
      `<circle r="9" fill="#2d3436"/><circle r="3.5" fill="#ffd166"/></svg>`;
    return s;
  }

  // Relógio vivo. `interativo`: arrastar os ponteiros (o grande muda os minutos — passando do 12
  // muda a hora —, o pequeno muda a hora). Guarda o horário em minutos do dia (0 a 1439).
  function relogio({ total = 180, interativo = false, rotulos = false, passo = () => 5, aoMudar, aoSoltar } = {}) {
    const caixa = el("div", "hr-mostrador", svgRelogio(hDe(total), mDe(total), { rotulos, alcas: interativo }));
    const svg = caixa.querySelector("svg"), ph = svg.querySelector(".hr-ph"), pm = svg.querySelector(".hr-pm");
    const r = { el: caixa, total: mod(total, 1440) };
    function pintar() {
      const h = hDe(r.total), m = mDe(r.total);
      ph.setAttribute("transform", `rotate(${(h % 12) * 30 + m * 0.5})`);
      pm.setAttribute("transform", `rotate(${m * 6})`);
    }
    r.definir = (t, avisar = false) => { r.total = mod(t, 1440); pintar(); if (avisar && aoMudar) aoMudar(r.total); };
    if (interativo) {
      caixa.classList.add("interativo");
      svg.style.touchAction = "none";
      let arrastando = null;
      const ponto = e => {
        const b = svg.getBoundingClientRect();
        const x = (e.clientX - b.left) / b.width * 224 - 112, y = (e.clientY - b.top) / b.height * 224 - 112;
        return { d: Math.hypot(x, y), a: mod(Math.atan2(x, -y) * 180 / Math.PI, 360) };
      };
      const dif = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
      function mover(p) {
        const h = hDe(r.total), m = mDe(r.total);
        let novo;
        if (arrastando === "m") {
          const ps = passo();
          const nm = mod(Math.round(p.a / 6 / ps) * ps, 60);
          let nh = h;
          if (m >= 45 && nm < 15) nh++; else if (m < 15 && nm >= 45) nh--;
          novo = nh * 60 + nm;
        } else {
          const alvo = mod(Math.round(p.a / 30 - m / 60), 12);
          const delta = mod(alvo - (h % 12) + 18, 12) - 6;
          novo = (h + delta) * 60 + m;
        }
        novo = mod(novo, 1440);
        if (novo !== r.total) {
          r.total = novo;
          pintar();
          Motor.nota(1300, { dur: 0.03, vol: 0.05, tipo: "square" });
          if (aoMudar) aoMudar(r.total);
        }
      }
      svg.addEventListener("pointerdown", e => {
        const p = ponto(e);
        if (p.d > 112 || p.d < 6) return;
        const h = hDe(r.total), m = mDe(r.total);
        const dH = dif(p.a, (h % 12) * 30 + m * 0.5), dM = dif(p.a, m * 6);
        if (p.d < 62) arrastando = dM < 16 && dH > 28 ? "m" : "h";
        else arrastando = dH < 16 && dM > 28 && p.d < 76 ? "h" : "m";
        e.preventDefault();
        try { svg.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
        caixa.classList.add("arrastando-" + arrastando);
        mover(p);
      });
      svg.addEventListener("pointermove", e => { if (arrastando) mover(ponto(e)); });
      const fim = () => {
        if (!arrastando) return;
        caixa.classList.remove("arrastando-h", "arrastando-m");
        arrastando = null;
        if (aoSoltar) aoSoltar(r.total);
      };
      svg.addEventListener("pointerup", fim);
      svg.addEventListener("pointercancel", fim);
    }
    return r;
  }

  // ---------- Tela do relógio grande (Explorar, Coloque o relógio, Meu dia) ----------
  // Céu atrás do relógio muda com a hora: madrugada, manhã, tarde e noite.
  function telaRelogio(area, { titulo, total, rotulos, passo, aoMudar, aoSoltar, comPronto, aoPronto, extrasTopo = [] }) {
    area.innerHTML = "";
    const tela = el("div", "hr-tela");
    const topo = el("div", "hr-topo");
    const tit = el("div", "hr-titulo", titulo);
    topo.appendChild(tit);
    const chips = el("div", "hr-chips");
    extrasTopo.forEach(b => chips.appendChild(b));
    topo.appendChild(chips);
    const cena = el("div", "hr-cena");
    const ceu = el("div", "hr-ceu");
    const astro = el("div", "hr-astro");
    ceu.append(astro, el("div", "hr-morro"));
    cena.appendChild(ceu);
    const rel = relogio({
      total, interativo: true, rotulos, passo,
      aoMudar: t => { pintarCena(t); if (aoMudar) aoMudar(t); },
      aoSoltar,
    });
    ceu.appendChild(rel.el);
    const painel = el("div", "hr-painel");
    const info = el("div", "hr-info");
    const ajustes = el("div", "hr-ajustes");
    function linha(rotulo, cor, menos, mais) {
      const l = el("div", "hr-linha " + cor);
      l.append(
        botao("hr-botao", "➖", menos, `Voltar ${rotulo}`),
        el("span", "hr-rotulo", rotulo),
        botao("hr-botao", "➕", mais, `Avançar ${rotulo}`));
      return l;
    }
    const passoBotao = () => Math.max(passo(), 1);
    let espera = null;
    function ajustar(delta, eMinuto) {
      let t = rel.total + delta;
      if (eMinuto) { const p = passoBotao(); t = Math.round(t / p) * p; }
      rel.definir(t, true);
      Motor.ploc();
      clearTimeout(espera);
      const s = Motor.sessaoAtual();
      espera = setTimeout(() => { if (s === Motor.sessaoAtual() && aoSoltar && document.contains(tela)) aoSoltar(rel.total); }, 650);
    }
    ajustes.append(
      linha("Hora", "vermelho", () => ajustar(-60), () => ajustar(60)),
      linha("Minutos", "azul", () => ajustar(-passoBotao(), true), () => ajustar(passoBotao(), true)));
    painel.append(info, ajustes);
    let pronto = null;
    if (comPronto) {
      pronto = botao("hr-pronto", comPronto, () => aoPronto(rel.total));
      painel.appendChild(pronto);
    }
    tela.append(topo, cena, painel);
    area.appendChild(tela);
    function pintarCena(t) {
      const p = periodo(hDe(t));
      ceu.className = "hr-ceu " + classePeriodo(p);
      astro.textContent = p === "madrugada" || p === "noite" ? "🌙" : p === "manhã" ? "🌅" : "☀️";
    }
    pintarCena(rel.total);
    return { tela, topo, tit, cena, ceu, painel, info, rel, pronto, pintarCena };
  }

  const legendaPonteiros = '<span class="hr-legenda"><i class="ver"></i>hora <i class="azu"></i>minutos</span>';

  // 🕐 Explorar: arrastar os ponteiros; o digital acompanha e a voz fala a hora
  function explorar(area, faixa) {
    const nivel = nivelDe(faixa);
    const passo = () => (nivel === 2 ? 1 : 5);
    let t = ler("horas-explorar", null);
    if (t == null) t = 15 * 60 + 15;
    const falar = tt => {
      const h = hDe(tt), m = mDe(tt);
      let f = Motor.maiuscula(horaFalada(h, m)) + ".";
      if (nivel === 2) f += ` No relógio digital: ${fala24(h, m)}.`;
      Motor.falar(f);
    };
    const tela = telaRelogio(area, {
      titulo: `Arraste os ponteiros! ${legendaPonteiros}`,
      total: t, rotulos: nivel > 0, passo,
      aoMudar: tt => pintar(tt),
      aoSoltar: tt => { gravar("horas-explorar", tt); falar(tt); },
      extrasTopo: [
        botao("chip", "⏰ Agora", () => { const d = new Date(); tela.rel.definir(d.getHours() * 60 + d.getMinutes(), true); falar(tela.rel.total); }),
        botao("chip", "🔊", () => falar(tela.rel.total), "Falar a hora"),
      ],
    });
    const dig = el("div", "hr-digital");
    const sub = el("div", "hr-sub");
    const frase = el("div", "hr-frase");
    tela.info.append(dig, sub, frase);
    function pintar(tt) {
      const h = hDe(tt), m = mDe(tt), p = periodo(h);
      if (nivel === 2) {
        dig.textContent = dig24(h, m);
        sub.textContent = `${h}h${m ? pad(m) : ""} · ${dig12(h, m)} da ${p}`;
      } else {
        dig.textContent = dig12(h, m);
        sub.textContent = `${ASTRO[p]} ${h % 12 === 0 && m === 0 ? (h === 12 ? "meio-dia" : "meia-noite") : "da " + p}`;
      }
      frase.textContent = Motor.maiuscula(horaFalada(h, m, true));
    }
    pintar(tela.rel.total);
    Motor.falar("Arraste os ponteiros do relógio! O pequeno vermelho mostra as horas, e o grande azul mostra os minutos.");
  }

  // ---------- Gerar horários por idade ----------
  function sortearHora(nivel, { dia = false } = {}) {
    const h = Motor.aleatorio(dia ? 0 : 1, dia ? 23 : 12) % 24;
    let m = 0;
    if (nivel === 1) m = Motor.sortear([0, 15, 30, 45, 30, 15]);
    if (nivel === 2) m = Math.random() < 0.7 ? Motor.aleatorio(0, 11) * 5 : Motor.aleatorio(1, 59);
    return { h, m };
  }
  // Outras horas parecidas (mesma hora com outros minutos, hora vizinha, ponteiros trocados)
  function distratores({ h, m }, nivel, quantos, { dia = false } = {}) {
    const lista = [];
    const add = (hh, mm) => { hh = mod(hh, dia ? 24 : 12); if (!dia && hh === 0) hh = 12; lista.push(hh * 60 + mm); };
    const hb = dia ? h : h12(h);
    if (nivel === 0) {
      add(hb + 1, 0); add(hb - 1, 0); add(hb + 3, 0); add(hb + 6, 0);
      if (hb !== 12) add(12, hb * 5 % 60); // ponteiros trocados
    } else {
      [15, 30, 45, 0].forEach(x => { if (x !== m) add(hb, x); });
      add(hb + 1, m); add(hb - 1, m);
      if (nivel === 2) { add(hb, mod(m + 5, 60)); add(hb, mod(m - 5, 60)); add(hb, mod(m + 10, 60)); }
      const troca = Math.round(m / 5) % 12 || 12;
      add(troca, (hb % 12) * 5);
    }
    const certa = mod(hb, 24) * 60 + m;
    return Motor.embaralhar([...new Set(lista)].filter(t => t !== certa)).slice(0, quantos);
  }

  // Desenho das opções dos quizzes: relógio, período do dia (cena) ou texto
  function desenharOpcao(item, b) {
    if (item.relogio != null) {
      b.classList.add("com-figura", "hr-op-relogio");
      b.appendChild(relogio({ total: item.relogio }).el);
    } else if (item.periodo) {
      b.classList.add("com-figura", "hr-op-periodo", classePeriodo(item.periodo));
      b.innerHTML = `<span class="hr-op-astro">${ASTRO[item.periodo]}</span><b>${item.periodo}</b>`;
    } else if (item.chip) {
      b.classList.add("com-figura", "hr-op-chip");
      b.innerHTML = item.chip;
    } else {
      b.textContent = item.nome;
      b.classList.add(item.classe || (item.valor != null ? "numero" : "palavra")); // valor: Motor.opcoesNumericas
    }
  }
  const mostrarRelogio = (total, extra = "") => e => {
    e.appendChild(relogio({ total }).el);
    if (extra) e.appendChild(el("div", "hr-enun-extra", extra));
  };

  // ❓ Que horas são?
  function quizHoras(area, faixa) {
    const nivel = nivelDe(faixa);
    const quantas = nivel === 2 ? 4 : 3;
    let ultimo = -1;
    const tipos = nivel === 0 ? ["ler", "ler", "achar"] : nivel === 1 ? ["ler", "achar", "falar", "ler"] : ["ler", "achar", "falar", "dia"];
    Motor.modoQuiz({
      area, rodada: 8, classeEnunciado: "hr-enun", desenhar: desenharOpcao,
      gerar() {
        const tipo = Motor.sortear(tipos);
        let hm;
        do { hm = sortearHora(nivel, { dia: tipo === "dia" }); } while (hm.h * 60 + hm.m === ultimo);
        ultimo = hm.h * 60 + hm.m;
        const { h, m } = hm;
        if (tipo === "dia") {
          const p = periodo(h);
          const certa = { nome: dig24(h, m), classe: "numero" };
          const outros = new Set([dig24(mod(h + 12, 24), m), dig24(mod(h + 2, 24), m), dig24(h, mod(m + 15, 60)), dig24(mod(h - 1, 24), m)]);
          outros.delete(certa.nome);
          const ops = [...outros].slice(0, quantas - 1).map(n => ({ nome: n, classe: "numero" }));
          return {
            pergunta: `É de ${p === "madrugada" ? "madrugada" : p}. Que horas são no relógio digital de vinte e quatro horas?`,
            mostrar: mostrarRelogio(h * 60 + m, `${ASTRO[p]} ${p === "madrugada" ? "madrugada" : "de " + p}`),
            certa, opcoes: [certa, ...ops],
            aoAcertar: () => Motor.falar(`${Motor.maiuscula(horaFalada(h, m))} é ${fala24(h, m)}!`),
          };
        }
        const hb = h12(h), total = hb * 60 + m;
        const outros = distratores({ h: hb, m }, nivel, quantas - 1);
        if (tipo === "achar") {
          const certa = { nome: dig12(hb, m), relogio: total };
          return {
            pergunta: `Qual relógio mostra ${horaFalada(hb, m, false)}?`,
            mostrar: e => { e.appendChild(el("div", "hr-digital", dig12(hb, m))); },
            certa, opcoes: [certa, ...outros.map(t => ({ nome: dig12(hDe(t), mDe(t)), relogio: t }))],
          };
        }
        if (tipo === "falar") {
          const certa = { nome: horaFalada(hb, m, false) };
          const ops = outros.map(t => ({ nome: horaFalada(hDe(t), mDe(t), false) })).filter(o => o.nome !== certa.nome);
          return {
            pergunta: "Como a gente fala essa hora?",
            mostrar: mostrarRelogio(total),
            certa, opcoes: [certa, ...ops],
          };
        }
        const certa = { nome: dig12(hb, m), classe: "numero" };
        return {
          pergunta: "Que horas são?",
          mostrar: mostrarRelogio(total),
          certa, opcoes: [certa, ...outros.map(t => ({ nome: dig12(hDe(t), mDe(t)), classe: "numero" }))],
        };
      },
      aoAcertar: (item, q) => {
        if (q.aoAcertar) return q.aoAcertar();
        const t = q.certa.relogio != null ? q.certa.relogio : null;
        const [hh, mm] = t != null ? [hDe(t), mDe(t)] : q.certa.nome.includes(":") ? q.certa.nome.split(":").map(Number) : [null, null];
        if (hh == null) return Motor.falar(Motor.maiuscula(q.certa.nome) + "!");
        return Motor.falar(Motor.maiuscula(horaFalada(hh, mm, false)) + "!");
      },
    });
  }

  // ⌚ Relógio digital de 24 horas (8 a 10 anos)
  function quiz24(area) {
    let ultimo = -1;
    Motor.modoQuiz({
      area, rodada: 8, classeEnunciado: "hr-enun", desenhar: desenharOpcao,
      gerar() {
        let h, m;
        do { h = Motor.aleatorio(0, 23); m = Motor.sortear([0, 0, 15, 30, 45, 10, 20, 40, 50]); } while (h * 60 + m === ultimo);
        ultimo = h * 60 + m;
        const p = periodo(h);
        const textoDe = (hh, mm) => `${dig12(hh, mm)} ${hh % 12 === 0 && mm === 0 ? (hh === 12 ? "meio-dia" : "meia-noite") : "da " + periodo(hh)}`;
        if (Math.random() < 0.5) {
          // 24h → como se fala
          const certa = { nome: textoDe(h, m) };
          const outros = [...new Set([textoDe(mod(h + 12, 24), m), textoDe(mod(h - 2, 24), m), textoDe(mod(h + 2, 24), m)])].filter(n => n !== certa.nome).slice(0, 3);
          return {
            pergunta: `No relógio digital está ${fala24(h, m)}. Que horas são no relógio de ponteiros?`,
            mostrar: e => e.appendChild(el("div", "hr-digital grande", dig24(h, m))),
            certa, opcoes: [certa, ...outros.map(n => ({ nome: n }))],
            fala: `${fala24(h, m)} é ${horaFalada(h, m)}!`,
          };
        }
        const certa = { nome: dig24(h, m), classe: "numero" };
        const outros = [...new Set([dig24(mod(h + 12, 24), m), dig24(mod(h + 10, 24), m), dig24(mod(h + 1, 24), m), dig24(mod(h - 12, 24), mod(m + 30, 60))])].filter(n => n !== certa.nome).slice(0, 3);
        return {
          pergunta: `${Motor.maiuscula(horaFalada(h, m))}. Como fica no relógio digital de vinte e quatro horas?`,
          mostrar: mostrarRelogio(h * 60 + m, `${ASTRO[p]} ${p === "madrugada" ? "madrugada" : "de " + p}`),
          certa, opcoes: [certa, ...outros.map(n => ({ nome: n, classe: "numero" }))],
          fala: `${Motor.maiuscula(horaFalada(h, m))} é ${fala24(h, m)}!`,
        };
      },
      aoAcertar: (item, q) => Motor.falar(q.fala),
    });
  }

  // 👆 Coloque o relógio em ...
  function colocar(area, faixa) {
    const nivel = nivelDe(faixa);
    const RODADA = 6;
    let feitas = 0, dePrimeira = 0, alvo = null, errou = false, passoAtual = 5, ultimo = -1;
    const placar = el("span", "chip hr-placar");
    const repetir = botao("chip", "🔊", () => Motor.falar(pedido()), "Repetir");
    let tela = null;
    const pedido = () => alvo.dia ? `Coloque o relógio em ${fala24(alvo.h, alvo.m)}!` : `Coloque o relógio em ${horaFalada(alvo.h, alvo.m, false)}!`;
    function nova() {
      errou = false;
      let hm;
      do {
        hm = sortearHora(nivel);
        hm.dia = nivel === 2 && Math.random() < 0.4;
        if (hm.dia) hm.h = Motor.aleatorio(13, 23);
      } while (hm.h * 60 + hm.m === ultimo);
      alvo = hm;
      ultimo = hm.h * 60 + hm.m;
      passoAtual = nivel === 0 ? 15 : nivel === 1 ? 15 : alvo.m % 5 ? 1 : 5;
      // Começa numa hora diferente da pedida
      let inicio;
      do {
        let hi = Motor.aleatorio(1, 12);
        if (hi < 6 || alvo.h >= 12) hi += 12; // céu de dia/tarde (o relógio de ponteiros é de 12 horas)
        inicio = mod(hi, 24) * 60 + (nivel === 0 ? 0 : Motor.sortear([0, 15, 30, 45]));
      } while (inicio % 720 === (alvo.h * 60 + alvo.m) % 720);
      tela = telaRelogio(area, {
        titulo: `Coloque em: <b class="hr-alvo">${alvo.dia ? dig24(alvo.h, alvo.m) : dig12(alvo.h, alvo.m)}</b>`,
        total: inicio, rotulos: nivel > 0, passo: () => passoAtual,
        comPronto: "✅ Pronto!", aoPronto: conferir,
        extrasTopo: [placar, repetir],
      });
      const frase = el("div", "hr-frase", alvo.dia ? "Relógio de 24 horas: depois do meio-dia, tire 12!" : Motor.maiuscula(horaFalada(alvo.h, alvo.m, false)));
      tela.info.append(el("div", "hr-dica", legendaPonteiros), frase);
      placar.textContent = `⭐ ${feitas} / ${RODADA}`;
      Motor.falar(pedido());
    }
    async function conferir(t) {
      const ok = mod(t, 720) === mod(alvo.h * 60 + alvo.m, 720);
      const h = hDe(t), m = mDe(t);
      if (!ok) {
        errou = true;
        Motor.animar(tela.rel.el, "balanca");
        Motor.falar(`Quase! O relógio está marcando ${horaFalada(h12(h), m, false)}. ${pedido()}`);
        return;
      }
      tela.pronto.disabled = true;
      feitas++;
      if (!errou) dePrimeira++;
      placar.textContent = `⭐ ${feitas} / ${RODADA}`;
      Motor.comemorar(tela.rel.el);
      Motor.tim();
      const s = Motor.sessaoAtual();
      await Motor.falar(`${Motor.elogio()} ${Motor.maiuscula(horaFalada(alvo.h, alvo.m, alvo.dia))}!`);
      if (s !== Motor.sessaoAtual()) return;
      if (feitas >= RODADA) Motor.depois(() => Motor.telaFim(area, dePrimeira, RODADA, () => { feitas = 0; dePrimeira = 0; nova(); }), 300);
      else Motor.depois(nova, 500);
    }
    nova();
  }

  // ---------- ☀️ Rotina do dia ----------
  const ATIVIDADES = [
    { id: "acordar", emoji: "🛏️", nome: "acordar", pergunta: "A que horas você acorda?", fala: "acorda", padrao: 7 * 60, de: 4, ate: 11 },
    { id: "escola", emoji: "🎒", nome: "ir para a escola", pergunta: "A que horas você vai para a escola?", fala: "vai para a escola", padrao: 7 * 60, de: 6, ate: 14, maiores: true },
    { id: "almoco", emoji: "🍽️", nome: "almoçar", pergunta: "A que horas você almoça?", fala: "almoça", padrao: 12 * 60, de: 10, ate: 15 },
    { id: "banho", emoji: "🛁", nome: "tomar banho", pergunta: "A que horas você toma banho?", fala: "toma banho", padrao: 18 * 60, de: 5, ate: 23, maiores: true },
    { id: "dormir", emoji: "😴", nome: "dormir", pergunta: "A que horas você dorme?", fala: "dorme", padrao: 21 * 60, de: 18, ate: 25 },
  ];
  // A criança mexe só nos ponteiros (12 horas); a atividade diz se é manhã, tarde ou noite
  function ajustarAoDia(t, a) {
    const m = mDe(t);
    let h = hDe(t) % 12;
    const opcoes = [h, h + 12, h + 24];
    const meio = (a.de + a.ate) / 2;
    const dentro = opcoes.filter(x => x >= a.de && x <= a.ate);
    h = (dentro.length ? dentro : opcoes).sort((x, y) => Math.abs(x - meio) - Math.abs(y - meio))[0];
    return mod(h, 24) * 60 + m;
  }

  function meuDia(area, faixa) {
    const nivel = nivelDe(faixa);
    const lista = ATIVIDADES.filter(a => !a.maiores || nivel > 0);
    const salvo = ler("horas-meudia", {});
    let i = 0;
    function passo() {
      const a = lista[i];
      const tela = telaRelogio(area, {
        titulo: `<span class="hr-emoji-tit">${a.emoji}</span> ${a.pergunta}`,
        total: salvo[a.id] != null ? salvo[a.id] : a.padrao, rotulos: nivel > 0, passo: () => (nivel === 2 ? 5 : 15),
        aoMudar: t => pintar(t),
        aoSoltar: t => { const tt = ajustarAoDia(t, a); Motor.falar(Motor.maiuscula(horaFalada(hDe(tt), mDe(tt)))); },
        comPronto: "✅ É essa hora!",
        aoPronto: async t => {
          const tt = ajustarAoDia(t, a);
          salvo[a.id] = tt;
          gravar("horas-meudia", salvo);
          tela.pronto.disabled = true;
          Motor.tim();
          Motor.comemorar(tela.rel.el);
          const s = Motor.sessaoAtual();
          await Motor.falar(`Você ${a.fala} ${prep(hDe(tt))} ${horaFalada(hDe(tt), mDe(tt))}!`);
          if (s !== Motor.sessaoAtual()) return;
          i++;
          if (i < lista.length) passo(); else resumo();
        },
        extrasTopo: [botao("chip", "🔊", () => Motor.falar(a.pergunta), "Repetir")],
      });
      const fig = el("div", "hr-atividade", a.emoji);
      tela.ceu.appendChild(fig);
      const frase = el("div", "hr-frase");
      const sub = el("div", "hr-sub");
      tela.info.append(frase, sub);
      function pintar(t) {
        const tt = ajustarAoDia(t, a), h = hDe(tt), m = mDe(tt);
        tela.pintarCena(tt);
        frase.textContent = Motor.maiuscula(horaFalada(h, m));
        sub.textContent = nivel === 2 ? `${dig24(h, m)} no relógio digital` : `${ASTRO[periodo(h)]} ${dig12(h, m)}`;
      }
      pintar(tela.rel.total);
      Motor.falar(a.pergunta + " Mexa nos ponteiros e toque em pronto.");
    }
    function resumo() {
      area.innerHTML = "";
      const caixa = el("div", "hr-resumo");
      caixa.appendChild(el("div", "hr-resumo-tit", "🌈 O meu dia"));
      const linhaTempo = el("div", "hr-linha-tempo");
      const ord = [...lista].sort((x, y) => mod(salvo[x.id] - 240, 1440) - mod(salvo[y.id] - 240, 1440));
      ord.forEach(a => {
        const t = salvo[a.id], p = periodo(hDe(t));
        const c = botao("hr-momento " + classePeriodo(p), "", () => Motor.falar(`Você ${a.fala} ${prep(hDe(t))} ${horaFalada(hDe(t), mDe(t))}.`));
        c.innerHTML = `<span class="hr-momento-emoji">${a.emoji}</span>`;
        c.appendChild(relogio({ total: t }).el);
        c.appendChild(el("b", "", `${dig12(hDe(t), mDe(t))} ${p === "madrugada" ? "madrugada" : p}`));
        linhaTempo.appendChild(c);
      });
      caixa.appendChild(linhaTempo);
      caixa.appendChild(botao("modo hr-denovo", '<span class="icone">🔁</span><span class="rotulo">De novo</span>', () => { i = 0; passo(); }));
      area.appendChild(caixa);
      Motor.comemorar(caixa);
      Motor.tim();
      Motor.falar("Esse é o seu dia! Toque em cada momento para ouvir.");
    }
    passo();
  }

  const PERIODOS_FATOS = [
    { emoji: "🌅", texto: "O sol nasce", p: "manhã" },
    { emoji: "🐓", texto: "O galo canta: cocoricó!", p: "manhã" },
    { emoji: "🥣", texto: "Café da manhã", p: "manhã" },
    { emoji: "🛏️", texto: "Acordar e escovar os dentes", p: "manhã" },
    { emoji: "🍪", texto: "Lanche da tarde", p: "tarde" },
    { emoji: "🪁", texto: "Soltar pipa depois do almoço", p: "tarde" },
    { emoji: "🌇", texto: "O sol começa a se pôr", p: "tarde" },
    { emoji: "💤", texto: "Soneca depois do almoço", p: "tarde" },
    { emoji: "🌙", texto: "A lua aparece no céu", p: "noite" },
    { emoji: "⭐", texto: "Ver as estrelas", p: "noite" },
    { emoji: "😴", texto: "Dormir na cama", p: "noite" },
    { emoji: "🦉", texto: "A coruja acorda", p: "noite" },
    { emoji: "🍲", texto: "Jantar com a família", p: "noite" },
  ];
  function periodosQuiz(area, faixa) {
    const nivel = nivelDe(faixa);
    let ultimo = null;
    const opcoes = ["manhã", "tarde", "noite"].map(p => ({ nome: p, periodo: p }));
    Motor.modoQuiz({
      area, rodada: 8, classeEnunciado: "hr-enun", desenhar: desenharOpcao,
      gerar() {
        if (nivel > 0 && Math.random() < 0.4) {
          const h = Motor.sortear([6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22]);
          const p = periodo(h);
          const certa = opcoes.find(o => o.nome === p);
          return {
            pergunta: nivel === 2 ? `O relógio digital marca ${fala24(h, 0)}. É manhã, tarde ou noite?` : `${Motor.maiuscula(horaFalada(h, 0, false))}... de manhã, de tarde ou de noite? Olhe o sol!`,
            mostrar: e => {
              if (nivel === 2) e.appendChild(el("div", "hr-digital grande", dig24(h, 0)));
              else { e.appendChild(relogio({ total: h * 60 }).el); e.appendChild(el("div", "hr-enun-extra", ASTRO[p])); }
            },
            certa, opcoes,
            fala: `${Motor.maiuscula(horaFalada(h, 0))}!`,
          };
        }
        const f = Motor.sortear(PERIODOS_FATOS.filter(x => x !== ultimo));
        ultimo = f;
        const certa = opcoes.find(o => o.nome === f.p);
        return {
          pergunta: `${f.texto}. É de manhã, de tarde ou de noite?`,
          mostrar: e => { e.appendChild(el("span", "hr-fato-emoji", f.emoji)); e.appendChild(el("span", "hr-fato-texto", f.texto)); },
          certa, opcoes,
          fala: `${f.texto}: de ${f.p}!`,
        };
      },
      aoAcertar: (item, q) => Motor.falar(q.fala),
    });
  }

  // 🔢 Ordem do dia: tocar nas cenas na ordem em que acontecem
  function ordemDia(area, faixa) {
    const nivel = nivelDe(faixa);
    const SEQ = [
      { emoji: "🛏️", nome: "acordar", t: 7 * 60 },
      { emoji: "🥣", nome: "café da manhã", t: 7 * 60 + 30 },
      { emoji: "🎒", nome: "escola", t: 8 * 60 },
      { emoji: "🍽️", nome: "almoço", t: 12 * 60 },
      { emoji: "🍪", nome: "lanche da tarde", t: 15 * 60 + 30 },
      { emoji: "🛁", nome: "banho", t: 18 * 60 },
      { emoji: "🍲", nome: "jantar", t: 19 * 60 + 30 },
      { emoji: "😴", nome: "dormir", t: 21 * 60 },
    ];
    const quantos = [4, 5, 6][nivel];
    const RODADA = 4;
    let feitas = 0, dePrimeira = 0;
    function nova() {
      area.innerHTML = "";
      const escolhidas = Motor.embaralhar(SEQ).slice(0, quantos).sort((a, b) => a.t - b.t);
      let prox = 0, errou = false;
      const tela = el("div", "hr-ordem");
      const trilho = el("div", "hr-trilho");
      const vagas = escolhidas.map((x, k) => { const v = el("div", "hr-vaga", `<span>${k + 1}</span>`); trilho.appendChild(v); return v; });
      const grade = el("div", "hr-cenas");
      Motor.embaralhar(escolhidas).forEach(x => {
        const p = periodo(Math.floor(x.t / 60));
        const c = botao("hr-cena-carta " + classePeriodo(p), `<span class="hr-carta-emoji">${x.emoji}</span><b>${x.nome}</b>${nivel > 0 ? `<small>${dig12(Math.floor(x.t / 60), x.t % 60)}</small>` : ""}`, () => {
          if (c.disabled) return;
          if (x !== escolhidas[prox]) {
            errou = true;
            Motor.animar(c, "balanca");
            Motor.falar(`Ainda não! O que vem antes de ${x.nome}?`);
            return;
          }
          c.disabled = true;
          c.classList.add("usada");
          vagas[prox].innerHTML = `<span class="hr-carta-emoji">${x.emoji}</span>`;
          vagas[prox].classList.add("cheia", classePeriodo(p));
          Motor.animar(vagas[prox], "pula");
          prox++;
          if (prox < escolhidas.length) { Motor.ploc(); Motor.falar(Motor.maiuscula(x.nome) + "!"); return; }
          feitas++;
          if (!errou) dePrimeira++;
          Motor.tim();
          Motor.comemorar(trilho);
          const s = Motor.sessaoAtual();
          Motor.falar(`${escolhidas.map(y => y.nome).join(", ")}. ${Motor.elogio()}`).then(() => {
            if (s !== Motor.sessaoAtual()) return;
            if (feitas >= RODADA) Motor.depois(() => Motor.telaFim(area, dePrimeira, RODADA, () => { feitas = 0; dePrimeira = 0; nova(); }), 300);
            else Motor.depois(nova, 500);
          });
        });
        grade.appendChild(c);
      });
      const dica = el("div", "hr-ordem-tit", `Toque na ordem do dia! <span class="chip hr-placar">⭐ ${feitas} / ${RODADA}</span>`);
      tela.append(dica, trilho, grade);
      area.appendChild(tela);
      Motor.falar("O que acontece primeiro? Toque nas figuras na ordem do dia, de manhã até a noite!");
    }
    nova();
  }

  // ---------- 📅 Calendário ----------
  const DIAS = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const DIAS_CURTOS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
  const DIAS_CORES = ["#ef476f", "#f78c6b", "#e0a800", "#06d6a0", "#118ab2", "#7b5cd6", "#e05cb3"];
  const DIAS_FATOS = [
    "É o primeiro dia da semana no calendário. Dia de descansar e passear!",
    "Começa a semana de escola e de trabalho.",
    "É o terceiro dia da semana.",
    "É o meio da semana!",
    "É o quinto dia da semana.",
    "O último dia de escola da semana. Amanhã já é fim de semana!",
    "É o último dia da semana. Fim de semana, oba!",
  ];
  const MESES = [
    { nome: "janeiro", dias: 31, emoji: "🎆", fato: "É o primeiro mês do ano: começa o Ano-Novo, e tem férias!" },
    { nome: "fevereiro", dias: 28, emoji: "🎭", fato: "É o menor mês: tem 28 dias, e 29 no ano bissexto. Muitas vezes tem Carnaval!" },
    { nome: "março", dias: 31, emoji: "🍂", fato: "No fim de março começa o outono." },
    { nome: "abril", dias: 30, emoji: "🐰", fato: "Muitas vezes a Páscoa cai em abril." },
    { nome: "maio", dias: 31, emoji: "💐", fato: "Tem o Dia das Mães, no segundo domingo de maio." },
    { nome: "junho", dias: 30, emoji: "🌽", fato: "Tem festa junina! E no Amazonas tem o Festival de Parintins. No fim de junho começa o inverno." },
    { nome: "julho", dias: 31, emoji: "🪁", fato: "Tem as férias do meio do ano. Tempo de soltar pipa!" },
    { nome: "agosto", dias: 31, emoji: "👨", fato: "Tem o Dia dos Pais, no segundo domingo de agosto." },
    { nome: "setembro", dias: 30, emoji: "🌸", fato: "Dia 7 de setembro é a Independência do Brasil. No fim do mês começa a primavera." },
    { nome: "outubro", dias: 31, emoji: "🧸", fato: "Dia 12 de outubro é o Dia das Crianças!" },
    { nome: "novembro", dias: 30, emoji: "📜", fato: "Dia 15 de novembro é a Proclamação da República." },
    { nome: "dezembro", dias: 31, emoji: "🎄", fato: "Tem o Natal, dia 25! E no fim de dezembro começa o verão." },
  ];
  const ESTACOES = [
    { id: "verao", nome: "verão", emoji: "☀️", fig: "🏖️", meses: "de dezembro a março", fato: "Verão: dias quentes e compridos, tempo de praia e de férias. Vai de dezembro a março." },
    { id: "outono", nome: "outono", emoji: "🍂", fig: "🍁", meses: "de março a junho", fato: "Outono: as folhas de muitas árvores ficam amarelas e caem. Vai de março a junho." },
    { id: "inverno", nome: "inverno", emoji: "⛄", fig: "🧣", meses: "de junho a setembro", fato: "Inverno: é a estação mais fria. No Sul do Brasil faz bastante frio e pode até gear. Vai de junho a setembro." },
    { id: "primavera", nome: "primavera", emoji: "🌸", fig: "🦋", meses: "de setembro a dezembro", fato: "Primavera: muitas flores se abrem e as borboletas aparecem. Vai de setembro a dezembro." },
    { id: "norte", nome: "chuvas e seca", emoji: "🌧️", fig: "☀️", meses: "no Norte", fato: "No Brasil as estações são menos marcadas do que em países frios. No Norte, como em Manaus, faz calor o ano inteiro, e a gente fala em período de chuvas, mais ou menos de dezembro a maio, e período de seca, mais ou menos de junho a novembro. Muita gente lá chama o tempo das chuvas de inverno amazônico!" },
  ];
  const hojeData = () => { const d = new Date(); d.setHours(12, 0, 0, 0); return d; };
  const somarDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const diasNoMes = (ano, mes) => new Date(ano, mes + 1, 0).getDate();
  const dataFalada = d => `${DIAS[d.getDay()]}, ${d.getDate() === 1 ? "primeiro" : d.getDate()} de ${MESES[d.getMonth()].nome}`;

  // Explorar cartões + botão de perguntas
  function explorarCartoes(area, { titulo, itens, classe, desenhar, falar, quiz, intro }) {
    area.innerHTML = "";
    const tela = el("div", "hr-tela-cartoes");
    const topo = el("div", "hr-topo");
    topo.appendChild(el("div", "hr-titulo", titulo));
    const chips = el("div", "hr-chips");
    chips.appendChild(botao("chip hr-perguntas", "❓ Perguntas", () => { area.innerHTML = ""; quiz(); }));
    topo.appendChild(chips);
    const grade = el("div", "hr-grade-cartoes " + classe);
    itens.forEach((it, k) => {
      const c = botao("hr-carta", "", () => { Motor.animar(c, "pula"); Motor.ploc(); Motor.falar(falar(it, k)); });
      desenhar(it, c, k);
      grade.appendChild(c);
    });
    tela.append(topo, grade);
    area.appendChild(tela);
    Motor.falar(intro);
  }

  function semana(area, faixa) {
    const nivel = nivelDe(faixa);
    const hoje = hojeData().getDay();
    explorarCartoes(area, {
      titulo: "📆 Os dias da semana", classe: "semana", itens: DIAS,
      intro: "Toque em cada dia da semana para ouvir. Depois, toque em perguntas!",
      desenhar: (d, c, k) => {
        c.style.setProperty("--cor", DIAS_CORES[k]);
        c.innerHTML = `<span class="hr-carta-num">${k + 1}º</span><b>${d}</b>${k === hoje ? '<span class="hr-hoje">⭐ hoje</span>' : ""}${k === 0 || k === 6 ? '<small>fim de semana</small>' : ""}`;
      },
      falar: (d, k) => `${Motor.maiuscula(d)}! ${DIAS_FATOS[k]}${k === hoje ? " E hoje é " + d + "!" : ""}`,
      quiz: () => quizSemana(area, nivel),
    });
  }
  const tiraDias = (destaque, falta) => e => {
    const t = el("div", "hr-tira");
    DIAS.forEach((d, k) => {
      const s = el("span", "hr-tira-dia" + (k === destaque ? " destaque" : "") + (k === falta ? " falta" : ""), k === falta ? "?" : DIAS_CURTOS[k]);
      s.style.setProperty("--cor", DIAS_CORES[k]);
      t.appendChild(s);
    });
    e.appendChild(t);
  };
  const opcoesDias = (certo, quantas) => {
    const certa = { nome: DIAS[certo] };
    const outros = Motor.embaralhar([mod(certo + 1, 7), mod(certo - 1, 7), mod(certo + 2, 7), mod(certo + 3, 7)]).slice(0, quantas - 1);
    return { certa, opcoes: [certa, ...outros.map(k => ({ nome: DIAS[k] }))] };
  };
  function quizSemana(area, nivel) {
    const quantas = nivel === 0 ? 3 : 4;
    const tipos = nivel === 0 ? ["falta", "depois", "fds", "falta"] : nivel === 1 ? ["falta", "depois", "antes", "fds", "quantos"] : ["depois", "antes", "primeiro", "quantos", "depois2"];
    let ultimo = "";
    Motor.modoQuiz({
      area, rodada: 8, classeEnunciado: "hr-enun hr-enun-texto",
      gerar() {
        let tipo;
        do { tipo = Motor.sortear(tipos); } while (tipo === ultimo && tipos.length > 1);
        ultimo = tipo;
        const k = Motor.aleatorio(0, 6);
        if (tipo === "falta") return { pergunta: "Que dia está faltando?", mostrar: tiraDias(-1, k), ...opcoesDias(k, quantas), fala: `${Motor.maiuscula(DIAS[k])}!` };
        if (tipo === "depois") return { pergunta: `Que dia vem depois de ${DIAS[k]}?`, mostrar: tiraDias(k, -1), ...opcoesDias(mod(k + 1, 7), quantas), fala: `Depois de ${DIAS[k]} vem ${DIAS[mod(k + 1, 7)]}!` };
        if (tipo === "antes") return { pergunta: `Que dia vem antes de ${DIAS[k]}?`, mostrar: tiraDias(k, -1), ...opcoesDias(mod(k - 1, 7), quantas), fala: `Antes de ${DIAS[k]} vem ${DIAS[mod(k - 1, 7)]}!` };
        if (tipo === "depois2") return { pergunta: `Hoje é ${DIAS[k]}. Que dia vai ser daqui a dois dias?`, mostrar: e => e.appendChild(el("div", "hr-enun-frase", `Hoje: <b>${DIAS[k]}</b> + 2 dias`)), ...opcoesDias(mod(k + 2, 7), quantas), fala: `${Motor.maiuscula(DIAS[mod(k + 2, 7)])}!` };
        if (tipo === "primeiro") {
          const certa = { nome: "domingo" };
          return { pergunta: "No calendário, qual é o primeiro dia da semana?", mostrar: e => e.appendChild(el("div", "hr-enun-frase", "1º dia da semana = ?")), certa, opcoes: [certa, { nome: "segunda-feira" }, { nome: "sábado" }, { nome: "sexta-feira" }].slice(0, quantas), fala: "Domingo! No calendário, a semana começa no domingo." };
        }
        if (tipo === "quantos") {
          const certa = { nome: "7", classe: "numero" };
          return { pergunta: "Quantos dias tem uma semana?", mostrar: tiraDias(-1, -1), certa, opcoes: [certa, { nome: "5", classe: "numero" }, { nome: "10", classe: "numero" }, { nome: "12", classe: "numero" }].slice(0, quantas), fala: "Sete dias! De domingo a sábado." };
        }
        const fds = Motor.sortear([0, 6]);
        const certa = { nome: DIAS[fds] };
        const outros = Motor.embaralhar([1, 2, 3, 4, 5]).slice(0, quantas - 1).map(x => ({ nome: DIAS[x] }));
        return { pergunta: "Qual destes dias é fim de semana?", mostrar: e => e.appendChild(el("div", "hr-enun-frase", "🏖️ Fim de semana")), certa, opcoes: [certa, ...outros], fala: "Sábado e domingo são o fim de semana!" };
      },
      desenhar: desenharOpcao,
      aoAcertar: (item, q) => Motor.falar(q.fala),
    });
  }

  function meses(area, faixa) {
    const nivel = nivelDe(faixa);
    const mesHoje = hojeData().getMonth();
    explorarCartoes(area, {
      titulo: "🗓️ Os meses do ano", classe: "meses", itens: MESES,
      intro: "O ano tem doze meses. Toque em cada mês para ouvir!",
      desenhar: (mm, c, k) => {
        c.style.setProperty("--cor", DIAS_CORES[k % 7]);
        c.innerHTML = `<span class="hr-carta-emoji">${mm.emoji}</span><b>${mm.nome}</b><small>${k + 1}º · ${mm.dias === 28 ? "28 ou 29" : mm.dias} dias</small>${k === mesHoje ? '<span class="hr-hoje">⭐ agora</span>' : ""}`;
      },
      falar: (mm, k) => `${Motor.maiuscula(mm.nome)}, o ${k + 1}º mês. ${mm.dias === 28 ? "" : `Tem ${mm.dias} dias. `}${mm.fato}${k === mesHoje ? " E é o mês em que estamos!" : ""}`,
      quiz: () => quizMeses(area, nivel),
    });
  }
  function quizMeses(area, nivel) {
    const quantas = nivel === 0 ? 3 : 4;
    const ops = (certo) => {
      const certa = { nome: MESES[certo].nome };
      const outros = Motor.embaralhar([mod(certo + 1, 12), mod(certo - 1, 12), mod(certo + 2, 12), mod(certo + 6, 12)]).slice(0, quantas - 1);
      return { certa, opcoes: [certa, ...outros.map(k => ({ nome: MESES[k].nome }))] };
    };
    const FESTAS = [
      { p: "Em que mês é o Natal?", m: 11, e: "🎄" }, { p: "Em que mês é o Dia das Crianças?", m: 9, e: "🧸" },
      { p: "Em que mês tem festa junina?", m: 5, e: "🌽" }, { p: "Qual é o primeiro mês do ano?", m: 0, e: "🎆" },
      { p: "Qual é o último mês do ano?", m: 11, e: "🎆" }, { p: "Qual é o mês mais curto?", m: 1, e: "✂️" },
      { p: "Em que mês é a Independência do Brasil?", m: 8, e: "🎉" },
    ];
    const tipos = nivel === 0 ? ["festa", "depois", "quantos"] : nivel === 1 ? ["festa", "depois", "antes", "dias"] : ["depois", "antes", "dias", "festa", "numero"];
    let ultimo = "";
    Motor.modoQuiz({
      area, rodada: 8, classeEnunciado: "hr-enun hr-enun-texto", desenhar: desenharOpcao,
      gerar() {
        let tipo;
        do { tipo = Motor.sortear(tipos); } while (tipo === ultimo);
        ultimo = tipo;
        const k = Motor.aleatorio(0, 11);
        const quadro = (txt, emoji) => e => e.appendChild(el("div", "hr-enun-frase", `${emoji ? `<span class="hr-fato-emoji">${emoji}</span>` : ""}${txt}`));
        if (tipo === "depois") return { pergunta: `Que mês vem depois de ${MESES[k].nome}?`, mostrar: quadro(`${MESES[k].nome} → ?`, MESES[k].emoji), ...ops(mod(k + 1, 12)), fala: `Depois de ${MESES[k].nome} vem ${MESES[mod(k + 1, 12)].nome}!` };
        if (tipo === "antes") return { pergunta: `Que mês vem antes de ${MESES[k].nome}?`, mostrar: quadro(`? → ${MESES[k].nome}`, MESES[k].emoji), ...ops(mod(k - 1, 12)), fala: `Antes de ${MESES[k].nome} vem ${MESES[mod(k - 1, 12)].nome}!` };
        if (tipo === "numero") return { pergunta: `Qual é o ${k + 1}º mês do ano?`, mostrar: quadro(`${k + 1}º mês`), ...ops(k), fala: `${Motor.maiuscula(MESES[k].nome)} é o mês ${k + 1}!` };
        if (tipo === "quantos") {
          const certa = { nome: "12", classe: "numero" };
          return { pergunta: "Quantos meses tem um ano?", mostrar: quadro("📅 1 ano = ? meses"), certa, opcoes: [certa, { nome: "7", classe: "numero" }, { nome: "10", classe: "numero" }], fala: "Doze meses! De janeiro a dezembro." };
        }
        if (tipo === "dias") {
          const mm = MESES[k];
          const certa = { nome: mm.dias === 28 ? "28" : String(mm.dias), classe: "numero" };
          const opcoes = ["28", "30", "31"].map(n => (n === certa.nome ? certa : { nome: n, classe: "numero" }));
          return { pergunta: `Quantos dias tem ${mm.nome}?`, mostrar: quadro(mm.nome, mm.emoji), certa, opcoes, fala: mm.dias === 28 ? "Fevereiro tem 28 dias, e 29 no ano bissexto!" : `${Motor.maiuscula(mm.nome)} tem ${mm.dias} dias! Dica: conte nos ossinhos das mãos fechadas.` };
        }
        const f = Motor.sortear(FESTAS);
        return { pergunta: f.p, mostrar: quadro(f.p, f.e), ...ops(f.m), fala: `${Motor.maiuscula(MESES[f.m].nome)}! ${MESES[f.m].fato}` };
      },
      aoAcertar: (item, q) => Motor.falar(q.fala),
    });
  }

  function estacoes(area, faixa) {
    const nivel = nivelDe(faixa);
    explorarCartoes(area, {
      titulo: "🍂 As estações do ano", classe: "estacoes", itens: ESTACOES,
      intro: "O ano tem quatro estações: verão, outono, inverno e primavera. Toque para ouvir. E veja como é no Norte do Brasil!",
      desenhar: (e, c) => {
        c.classList.add("est-" + e.id);
        c.innerHTML = `<span class="hr-carta-emoji">${e.emoji}${e.fig}</span><b>${e.nome}</b><small>${e.meses}</small>`;
      },
      falar: e => e.fato,
      quiz: () => quizEstacoes(area, nivel),
    });
  }
  function quizEstacoes(area, nivel) {
    const P = [
      { p: "Em que estação as flores se abrem?", c: "primavera", e: "🌸🦋" },
      { p: "Qual é a estação mais fria?", c: "inverno", e: "🧣🥶" },
      { p: "Em que estação as folhas caem das árvores?", c: "outono", e: "🍂🍁" },
      { p: "Qual é a estação mais quente, de praia e férias?", c: "verão", e: "🏖️😎" },
      { p: "Em que estação usamos casaco e cachecol?", c: "inverno", e: "🧥🧣" },
      { p: "Em que estação é gostoso tomar sorvete na praia?", c: "verão", e: "🍦🏖️" },
      { p: "Em que estação as folhas ficam amarelas e marrons?", c: "outono", e: "🍂🌳" },
      { p: "Em que estação os passarinhos cantam e o jardim fica florido?", c: "primavera", e: "🐦🌷" },
      { p: "Que estação começa em dezembro?", c: "verão", e: "📅 dezembro", n: 1 },
      { p: "Que estação começa em junho?", c: "inverno", e: "📅 junho", n: 1 },
      { p: "Que estação começa em setembro?", c: "primavera", e: "📅 setembro", n: 1 },
      { p: "Que estação começa em março?", c: "outono", e: "📅 março", n: 1 },
      { p: "Que estação vem depois do inverno?", c: "primavera", e: "⛄ → ?", n: 1 },
      { p: "Que estação vem depois do verão?", c: "outono", e: "☀️ → ?", n: 1 },
    ];
    const NORTE = [
      { p: "Em Manaus, faz frio no inverno como no Sul?", c: "não, faz calor o ano todo", o: ["sim, neva muito", "sim, faz muito frio"], e: "🌴☀️" },
      { p: "No Norte, os meses de mais chuva são mais ou menos...", c: "de dezembro a maio", o: ["de junho a agosto", "só em setembro"], e: "🌧️" },
      { p: "No Norte, o período de seca é mais ou menos...", c: "de junho a novembro", o: ["de dezembro a março", "o ano todo"], e: "☀️🏞️" },
    ];
    const nomes = ["verão", "outono", "inverno", "primavera"];
    let ultimo = null;
    Motor.modoQuiz({
      area, rodada: 6, classeEnunciado: "hr-enun hr-enun-texto", desenhar: desenharOpcao,
      gerar() {
        const lista = [...P.filter(x => !x.n || nivel > 0), ...(nivel === 2 ? NORTE : [])];
        let q;
        do { q = Motor.sortear(lista); } while (q === ultimo);
        ultimo = q;
        const certa = { nome: q.c };
        const outros = q.o ? q.o : Motor.embaralhar(nomes.filter(n => n !== q.c)).slice(0, nivel === 0 ? 2 : 3);
        const est = ESTACOES.find(e => e.nome === q.c);
        return {
          pergunta: q.p,
          mostrar: e => e.appendChild(el("div", "hr-enun-frase", `<span class="hr-fato-emoji">${q.e}</span>${q.p}`)),
          certa, opcoes: [certa, ...outros.map(n => ({ nome: n }))],
          fala: est ? est.fato : ESTACOES[4].fato,
        };
      },
      aoAcertar: (item, q) => Motor.falar(q.fala),
    });
  }

  // ⏪ Ontem, hoje e amanhã
  function ontemHoje(area, faixa) {
    const nivel = nivelDe(faixa);
    const quantas = nivel === 0 ? 3 : 4;
    let primeira = true;
    const tipos = nivel === 0 ? ["amanhã", "ontem"] : nivel === 1 ? ["amanhã", "ontem", "data"] : ["amanhã", "ontem", "depois de amanhã", "anteontem", "data", "semana"];
    Motor.modoQuiz({
      area, rodada: 8, classeEnunciado: "hr-enun hr-enun-texto", desenhar: desenharOpcao,
      gerar() {
        const real = primeira;
        primeira = false;
        const k = real ? hojeData().getDay() : Motor.aleatorio(0, 6);
        const intro = real ? `Hoje é ${DIAS[k]}.` : `Imagine que hoje é ${DIAS[k]}.`;
        const tipo = Motor.sortear(tipos);
        const desl = { "amanhã": 1, ontem: -1, "depois de amanhã": 2, anteontem: -2 };
        if (tipo === "data" || tipo === "semana") {
          const d = Motor.aleatorio(3, 20);
          const n = tipo === "semana" ? 7 : Motor.sortear([1, -1]);
          const res = d + n;
          const certa = { nome: String(res), classe: "numero" };
          const pal = tipo === "semana" ? "daqui a uma semana" : n === 1 ? "amanhã" : "ontem";
          return {
            pergunta: `Se hoje é dia ${d}, que dia ${n > 0 ? "vai ser" : "foi"} ${pal}?`,
            mostrar: e => e.appendChild(el("div", "hr-enun-frase", `<span class="hr-fato-emoji">📅</span>Hoje: dia <b>${d}</b> · ${pal}?`)),
            ...Motor.opcoesNumericas(res, { quantas, min: 1, vizinhos: [res + 1, res - 1, d, res + 2, res - 2] }),
            fala: `Dia ${res}!`,
          };
        }
        const alvo = mod(k + desl[tipo], 7);
        const tira = e => {
          const t = el("div", "hr-tira ohm");
          [[-1, "ontem"], [0, "hoje"], [1, "amanhã"]].forEach(([x, rot]) => {
            const kk = mod(k + x, 7);
            const perguntado = x === desl[tipo];
            const s = el("span", "hr-tira-dia" + (x === 0 ? " destaque" : "") + (perguntado ? " falta" : ""), `<small>${rot}</small>${perguntado ? "?" : DIAS_CURTOS[kk]}`);
            s.style.setProperty("--cor", DIAS_CORES[kk]);
            t.appendChild(s);
          });
          e.appendChild(t);
        };
        return {
          pergunta: `${intro} ${desl[tipo] > 0 ? `Que dia vai ser ${tipo}?` : `Que dia foi ${tipo}?`}`,
          mostrar: Math.abs(desl[tipo]) === 1 ? tira : e => e.appendChild(el("div", "hr-enun-frase", `Hoje: <b>${DIAS[k]}</b> · ${tipo}?`)),
          ...opcoesDias(alvo, quantas),
          fala: `${Motor.maiuscula(tipo)} ${desl[tipo] > 0 ? "vai ser" : "foi"} ${DIAS[alvo]}!`,
        };
      },
      aoAcertar: (item, q) => Motor.falar(q.fala),
    });
  }

  // 📅 Meu calendário: o mês com o dia de hoje, o aniversário e desafios de tocar no dia certo
  function meuCalendario(area, faixa) {
    const nivel = nivelDe(faixa);
    const hoje = hojeData();
    let ano = hoje.getFullYear(), mes = hoje.getMonth();
    let aniver = ler("horas-aniversario", null); // { d, m }
    let marcando = false, desafio = null;
    area.innerHTML = "";
    const tela = el("div", "hr-cal-tela");
    const topo = el("div", "hr-topo hr-cal-topo");
    const titulo = el("div", "hr-titulo hr-cal-mes");
    topo.append(
      botao("hr-botao", "◀️", () => mudar(-1), "Mês anterior"),
      titulo,
      botao("hr-botao", "▶️", () => mudar(1), "Próximo mês"));
    const grade = el("div", "hr-cal-grade");
    const lado = el("div", "hr-cal-lado");
    const aviso = el("div", "hr-cal-aviso");
    const botoes = el("div", "hr-cal-botoes");
    const bDesafio = botao("chip hr-cal-chip desafio", "❓ Desafio", novoDesafio);
    const bAniver = botao("chip hr-cal-chip", "🎂 Meu aniversário", () => {
      marcando = true; desafio = null;
      dizer("Ache o mês do seu aniversário com as setas e toque no dia!");
    });
    const bHoje = botao("chip hr-cal-chip", "⭐ Hoje", () => { ano = hoje.getFullYear(); mes = hoje.getMonth(); desenhar(); dizer(`Hoje é ${dataFalada(hoje)}.`); });
    botoes.append(bDesafio, bAniver, bHoje);
    lado.append(aviso, botoes);
    tela.append(topo, grade, lado);
    area.appendChild(tela);
    function dizer(t) { aviso.textContent = t; Motor.falar(t); }
    function mudar(n) {
      mes += n;
      if (mes < 0) { mes = 11; ano--; }
      if (mes > 11) { mes = 0; ano++; }
      desafio = null;
      desenhar();
      Motor.ploc();
      Motor.falar(`${Motor.maiuscula(MESES[mes].nome)} de ${ano}. ${MESES[mes].emoji === "🎄" ? "Mês do Natal!" : ""}`);
    }
    function faltamAniver() {
      if (!aniver) return null;
      let alvo = new Date(hoje.getFullYear(), aniver.m, aniver.d, 12);
      if (alvo < hoje) alvo = new Date(hoje.getFullYear() + 1, aniver.m, aniver.d, 12);
      return Math.round((alvo - hoje) / 86400000);
    }
    function desenhar() {
      titulo.innerHTML = `${MESES[mes].emoji} <b>${Motor.maiuscula(MESES[mes].nome)}</b> ${ano}`;
      grade.innerHTML = "";
      DIAS_CURTOS.forEach((d, k) => { const c = el("div", "hr-cal-sem", d); c.style.setProperty("--cor", DIAS_CORES[k]); grade.appendChild(c); });
      const primeiro = new Date(ano, mes, 1).getDay();
      for (let i = 0; i < primeiro; i++) grade.appendChild(el("div", "hr-cal-vazio"));
      const n = diasNoMes(ano, mes);
      for (let d = 1; d <= n; d++) {
        const data = new Date(ano, mes, d, 12);
        const ehHoje = data.toDateString() === hoje.toDateString();
        const ehAniver = aniver && aniver.d === d && aniver.m === mes;
        const c = botao("hr-cal-dia" + (ehHoje ? " hoje" : "") + (data.getDay() === 0 || data.getDay() === 6 ? " fds" : "") + (ehAniver ? " aniver" : ""),
          `<span>${d}</span>${ehAniver ? "<i>🎂</i>" : ehHoje ? "<i>⭐</i>" : ""}`, () => tocar(data, c));
        grade.appendChild(c);
      }
      const semanas = Math.ceil((primeiro + n) / 7);
      grade.style.setProperty("--linhas", semanas);
      if (!desafio && !marcando) {
        const f = faltamAniver();
        aviso.textContent = f == null ? `Hoje é ${dataFalada(hoje)}.` : f === 0 ? "🎉 Hoje é o seu aniversário! Parabéns!" : `Hoje é ${dataFalada(hoje)}. Faltam ${f} ${f === 1 ? "dia" : "dias"} para o seu aniversário!`;
      }
    }
    function tocar(data, c) {
      Motor.animar(c, "pula");
      const d = data.getDate();
      if (marcando) {
        marcando = false;
        aniver = { d, m: data.getMonth() };
        gravar("horas-aniversario", aniver);
        desenhar();
        Motor.tim();
        Motor.comemorar(c);
        const f = faltamAniver();
        dizer(`Seu aniversário é dia ${d} de ${MESES[aniver.m].nome}! ${f === 0 ? "É hoje! Parabéns!" : `Faltam ${f} ${f === 1 ? "dia" : "dias"}.`}`);
        return;
      }
      if (desafio) {
        if (desafio.certo(data)) {
          desafio = null;
          Motor.tim();
          Motor.comemorar(c);
          dizer(`${Motor.elogio()} ${Motor.maiuscula(dataFalada(data))}. Toque em desafio para outro!`);
          Motor.animar(bDesafio, "pula");
        } else {
          Motor.animar(c, "balanca");
          dizer(`Esse é ${dataFalada(data)}. ${desafio.texto}`);
        }
        return;
      }
      Motor.ploc();
      const dif = Math.round((data - hoje) / 86400000);
      const rel = dif === 0 ? " É hoje!" : dif === 1 ? " É amanhã!" : dif === -1 ? " Foi ontem!" : "";
      dizer(`${Motor.maiuscula(dataFalada(data))}.${rel}`);
    }
    function novoDesafio() {
      marcando = false;
      const n = diasNoMes(ano, mes);
      const noMesDeHoje = ano === hoje.getFullYear() && mes === hoje.getMonth();
      const lista = [];
      const d = Motor.aleatorio(1, n);
      lista.push({ texto: `Toque no dia ${d}!`, certo: x => x.getDate() === d });
      const sem = Motor.aleatorio(0, 6);
      const fem = sem >= 1 && sem <= 5; // segunda-feira... sexta-feira
      lista.push({ texto: `Toque em um dia que seja ${DIAS[sem]}!`, certo: x => x.getDay() === sem });
      if (noMesDeHoje) {
        lista.push({ texto: "Toque no dia de hoje!", certo: x => x.toDateString() === hoje.toDateString() });
        if (hoje.getDate() < n) lista.push({ texto: "Toque no dia de amanhã!", certo: x => x.getDate() === hoje.getDate() + 1 });
        if (hoje.getDate() > 1) lista.push({ texto: "Toque no dia de ontem!", certo: x => x.getDate() === hoje.getDate() - 1 });
      }
      if (nivel > 0) {
        lista.push({ texto: `Toque n${fem ? "a primeira" : "o primeiro"} ${DIAS[sem]} do mês!`, certo: x => x.getDay() === sem && x.getDate() <= 7 });
        lista.push({ texto: "Toque no último dia do mês!", certo: x => x.getDate() === n });
        if (mes === 9) lista.push({ texto: "Toque no Dia das Crianças, 12 de outubro!", certo: x => x.getDate() === 12 });
        if (mes === 11) lista.push({ texto: "Toque no dia do Natal!", certo: x => x.getDate() === 25 });
        if (mes === 8) lista.push({ texto: "Toque no dia da Independência, 7 de setembro!", certo: x => x.getDate() === 7 });
      }
      if (nivel === 2) {
        const k = Motor.aleatorio(2, 4);
        lista.push({ texto: `Toque n${fem ? "a" : "o"} ${["", "", "segund", "terceir", "quart"][k]}${fem ? "a" : "o"} ${DIAS[sem]} do mês!`, certo: x => x.getDay() === sem && Math.ceil(x.getDate() / 7) === k });
      }
      desafio = Motor.sortear(lista);
      dizer(desafio.texto);
    }
    desenhar();
    Motor.falar(`Esse é o calendário de ${MESES[mes].nome}. Hoje é ${dataFalada(hoje)}. Toque nos dias para ouvir!`);
  }

  // ---------- Menus ----------
  function rotina(area, faixa) {
    Motor.escolherModo(area, [
      { icone: "🛏️", rotulo: "Meu dia", iniciar: () => meuDia(area, faixa) },
      { icone: "🌗", rotulo: "Manhã, tarde ou noite?", iniciar: () => periodosQuiz(area, faixa) },
      { icone: "🔢", rotulo: "Ordem do dia", iniciar: () => ordemDia(area, faixa) },
    ]);
    { const mm = area.querySelector(":scope > .modos"); if (mm) mm.classList.add("hr-modos"); }
  }
  function calendario(area, faixa) {
    Motor.escolherModo(area, [
      { icone: "📅", rotulo: "Meu calendário", iniciar: () => meuCalendario(area, faixa) },
      { icone: "📆", rotulo: "Dias da semana", iniciar: () => semana(area, faixa) },
      { icone: "⏪", rotulo: "Ontem, hoje e amanhã", iniciar: () => ontemHoje(area, faixa) },
      { icone: "🗓️", rotulo: "Meses do ano", iniciar: () => meses(area, faixa) },
      { icone: "🍂", rotulo: "Estações do ano", iniciar: () => estacoes(area, faixa) },
    ]);
    { const mm = area.querySelector(":scope > .modos"); if (mm) mm.classList.add("hr-modos"); }
  }

  const ICONE_COLOCAR = `<svg viewBox="-128 -128 256 256">${svgRelogio(3, 0).replace(/^<svg[^>]*>|<\/svg>$/g, "")}<text x="30" y="122" font-size="78">👆</text></svg>`;

  JOGOS.push({
    id: ID, nome: "Ver as Horas", icone: "🕐",
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: faixa => [
      { figura: svgRelogio(3, 0, { largura: 110 }), texto: "O ponteiro pequeno, vermelho, mostra as horas. O grande, azul, mostra os minutos." },
      { figura: [svgRelogio(2, 30, { largura: 90 }), "2:30"], texto: "Quando o ponteiro grande está no 6, é meia hora: duas e meia!" },
      { figura: "👆", texto: "Arraste os ponteiros com o dedo, ou use os botões ➖ e ➕ de hora e minutos." },
      { figura: "✅", texto: "Em Coloque o relógio, acerte os ponteiros e toque em Pronto." },
      { figura: ["🌅", "☀️", "🌙"], texto: "Na Rotina, veja o que a gente faz de manhã, de tarde e de noite." },
      { figura: "📅", texto: "No Calendário: dias da semana, meses, estações, o dia de hoje e o seu aniversário!" },
      ...(nivelDe(faixa) === 2 ? [{ figura: ["2:30", "☀️", "14:30"], texto: "No relógio digital de 24 horas, depois do meio-dia a gente soma 12: duas e meia da tarde é 14h30." }] : []),
    ],
    iniciar(area, faixa) {
      const nivel = nivelDe(faixa);
      Motor.escolherModo(area, [
        { icone: "🕐", rotulo: "Mexer no relógio", iniciar: () => explorar(area, faixa) },
        { icone: "❓", rotulo: "Que horas são?", iniciar: () => quizHoras(area, faixa) },
        { icone: ICONE_COLOCAR, rotulo: "Coloque o relógio", iniciar: () => colocar(area, faixa) },
        ...(nivel === 2 ? [{ icone: "⌚", rotulo: "Relógio de 24 horas", iniciar: () => quiz24(area) }] : []),
        { icone: "🌅", rotulo: "Rotina do dia", iniciar: () => rotina(area, faixa) },
        { icone: "📅", rotulo: "Calendário", iniciar: () => calendario(area, faixa) },
      ]);
    { const mm = area.querySelector(":scope > .modos"); if (mm) mm.classList.add("hr-modos"); }
    },
  });
  CATALOGO[ID] = ["numeros", "Relógio, rotina e calendário"];
})();
