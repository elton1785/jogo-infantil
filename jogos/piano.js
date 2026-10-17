// Piano e Cantigas: teclado colorido com instrumentos sintetizados (piano, xilofone, sanfona e
// flauta), cantigas de roda para aprender ("siga a luz" e "ouvir" com a letra em karaokê) e um
// jogo de ritmo com pistas coloridas.
// Controles: toque (vários dedos ao mesmo tempo), teclado do computador (A S D F G H J K... no modo
// livre) e controle de videogame (o destaque laranja anda pelas teclas e o A toca). No jogo de ritmo
// o jogo passa a usar as setas (JOGO.teclas vira true só durante a partida).
(() => {
  // ---------- Notas ----------
  const NOMES = ["Dó", "Ré", "Mi", "Fá", "Sol", "Lá", "Si"];
  const PC_BRANCAS = [0, 2, 4, 5, 7, 9, 11];
  const CORES = ["#ef476f", "#ff8c42", "#f7c548", "#3bb273", "#17b3c9", "#4d7cfe", "#9b5de5"];
  const LETRA = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const pc = m => ((m % 12) + 12) % 12;
  const paraMidi = s => {
    const r = /^([A-G])(#?)(\d)$/.exec(s);
    if (!r) throw new Error("Nota inválida: " + s);
    return 12 * (+r[3] + 1) + LETRA[r[1]] + (r[2] ? 1 : 0);
  };
  const freq = m => 440 * Math.pow(2, (m - 69) / 12);
  const branca = m => PC_BRANCAS.includes(pc(m));
  const grau = m => PC_BRANCAS.indexOf(pc(branca(m) ? m : m - 1));
  const nomeNota = m => NOMES[grau(m)] + (branca(m) ? "" : "♯");
  const corNota = m => CORES[grau(m)];
  const pequenoDe = faixa => !faixa || ["1-2", "2-3", "3-4", "4-5"].includes(faixa.id);

  const lerPref = (k, padrao) => { try { const v = localStorage.getItem(k); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; } };
  const gravarPref = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ok */ } };

  // ---------- Som: instrumentos sintetizados (Web Audio) ----------
  let ctx = null, mestre = null;
  function audio() {
    if (!Motor.somLigado()) return null;
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 5;
      comp.connect(ctx.destination);
      mestre = ctx.createGain();
      mestre.gain.value = 0.7;
      mestre.connect(comp);
      // Um eco curtinho dá a sensação de sala (fica mais bonito que o som "seco")
      const atraso = ctx.createDelay(); atraso.delayTime.value = 0.16;
      const filtro = ctx.createBiquadFilter(); filtro.type = "lowpass"; filtro.frequency.value = 2400;
      const volta = ctx.createGain(); volta.gain.value = 0.25;
      const molhado = ctx.createGain(); molhado.gain.value = 0.22;
      mestre.connect(atraso); atraso.connect(filtro); filtro.connect(volta); volta.connect(atraso); filtro.connect(molhado); molhado.connect(comp);
    }
    mestre.gain.value = 0.7 * Motor.volume(); // volume do app (área dos pais)
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  const INSTR = {
    piano: { nome: "Piano", icone: "🎹", estilo: "piano" },
    xilo: { nome: "Xilofone", icone: "🌈", estilo: "xilo" },
    sanfona: { nome: "Sanfona", icone: "🪗", estilo: "piano" },
    flauta: { nome: "Flauta", icone: "🎐", estilo: "piano" },
  };
  const ORDEM_INSTR = ["piano", "xilo", "sanfona", "flauta"];

  // Toca uma nota. Sem `dur`, a nota dura enquanto a tecla estiver apertada (devolve { soltar }).
  const MUDO = { soltar() {} };
  function voz(m, instr, dur) {
    const a = audio();
    if (!a) return MUDO;
    const t = a.currentTime + 0.004, f = freq(m);
    const saida = a.createGain();
    saida.connect(mestre);
    const g = saida.gain;
    const oscs = [];
    const osc = (tipo, fr, vol, destino = saida) => {
      const o = a.createOscillator();
      o.type = tipo; o.frequency.value = fr;
      const v = a.createGain(); v.gain.value = vol;
      o.connect(v); v.connect(destino);
      o.start(t); oscs.push(o);
      return o;
    };
    let fimNatural = null, liberacao = 0.2, minimo = 0.12;
    if (instr === "xilo") {
      osc("sine", f * 2, 0.6);
      const brilho = a.createGain();
      brilho.connect(saida);
      brilho.gain.setValueAtTime(0.5, t); brilho.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc("sine", f * 2 * 3.93, 0.35, brilho);
      osc("sine", f * 2 * 9.2, 0.12, brilho);
      g.setValueAtTime(0.0001, t); g.exponentialRampToValueAtTime(0.55, t + 0.003); g.exponentialRampToValueAtTime(0.0001, t + 1.1);
      fimNatural = t + 1.15; liberacao = 0.5; minimo = 0.5;
    } else if (instr === "sanfona") {
      const lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = Math.min(5000, f * 5); lp.Q.value = 1.5;
      lp.connect(saida);
      osc("sawtooth", f * 0.996, 0.18, lp); osc("sawtooth", f * 1.004, 0.18, lp); osc("square", f / 2, 0.08, lp);
      // fole: um leve tremor de volume
      const lfo = a.createOscillator(), prof = a.createGain();
      lfo.frequency.value = 5.2; prof.gain.value = 0.04; lfo.connect(prof); prof.connect(g); lfo.start(t); oscs.push(lfo);
      g.setValueAtTime(0.0001, t); g.linearRampToValueAtTime(0.32, t + 0.05); g.linearRampToValueAtTime(0.26, t + 0.2);
      liberacao = 0.12; minimo = 0.3;
    } else if (instr === "flauta") {
      const o1 = osc("sine", f, 0.5); const o2 = osc("triangle", f * 2, 0.06);
      const lfo = a.createOscillator(), prof = a.createGain();
      lfo.frequency.value = 5.5; prof.gain.setValueAtTime(0, t); prof.gain.linearRampToValueAtTime(f * 0.007, t + 0.35);
      lfo.connect(prof); prof.connect(o1.frequency); prof.connect(o2.frequency); lfo.start(t); oscs.push(lfo);
      // sopro
      const n = a.createBufferSource(), buf = a.createBuffer(1, a.sampleRate * 0.25, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      n.buffer = buf; const bp = a.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f * 2; bp.Q.value = 2;
      const nv = a.createGain(); nv.gain.value = 0.12; n.connect(bp); bp.connect(nv); nv.connect(saida); n.start(t);
      g.setValueAtTime(0.0001, t); g.linearRampToValueAtTime(0.42, t + 0.07); g.linearRampToValueAtTime(0.34, t + 0.25);
      liberacao = 0.15; minimo = 0.3;
    } else {
      // piano: harmônicos que perdem o brilho com o tempo
      const lp = a.createBiquadFilter(); lp.type = "lowpass";
      lp.frequency.setValueAtTime(Math.min(9000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(500, f * 2.2), t + 1.4);
      lp.connect(saida);
      osc("triangle", f, 0.55, lp); osc("sine", f * 2.002, 0.25, lp); osc("sine", f * 3.006, 0.09, lp); osc("sawtooth", f * 1.001, 0.05, lp);
      g.setValueAtTime(0.0001, t); g.exponentialRampToValueAtTime(0.6, t + 0.006); g.exponentialRampToValueAtTime(0.22, t + 0.3); g.exponentialRampToValueAtTime(0.0001, t + 2.6);
      fimNatural = t + 2.65; liberacao = 0.35; minimo = 0.3;
    }
    let solto = false;
    const parar = quando => oscs.forEach(o => { try { o.stop(quando); } catch (e) { /* já parou */ } });
    function soltar() {
      if (solto) return;
      solto = true;
      const x = Math.max(a.currentTime, t + minimo);
      if (fimNatural && x + liberacao >= fimNatural) return; // já ia acabar sozinha
      if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(x); else g.cancelScheduledValues(x);
      g.setTargetAtTime(0.0001, x, liberacao / 3);
      parar(x + liberacao * 2 + 0.05);
    }
    if (fimNatural) parar(fimNatural + 0.05);
    if (dur) {
      const x = t + dur;
      setTimeout(soltar, Math.max(0, (x - a.currentTime) * 1000 - 5));
    }
    return { soltar };
  }

  // ---------- Cantigas (domínio público). Notas em C4 = dó central; durações em tempos;
  // letra com "-" entre as sílabas, espaço entre as palavras e "_" juntando duas sílabas numa nota ----------
  const MUSICAS_DEF = [
    { id: "doremi", nome: "Dó Ré Mi Fá", emoji: "🎵", bpm: 112, linhas: [
      ["C4 D4 E4 F4 F4 F4", "1 1 1 1 1 2", "Dó, ré, mi, fá, fá, fá,"],
      ["C4 D4 C4 D4 D4 D4", "1 1 1 1 1 2", "dó, ré, dó, ré, ré, ré,"],
      ["C4 G4 F4 E4 E4 E4", "1 1 1 1 1 2", "dó, sol, fá, mi, mi, mi,"],
      ["C4 D4 E4 F4 F4 F4", "1 1 1 1 1 2", "dó, ré, mi, fá, fá, fá!"],
    ] },
    { id: "brilha", nome: "Brilha, Brilha", emoji: "⭐", bpm: 100, linhas: [
      ["C4 C4 G4 G4 A4 A4 G4", "1 1 1 1 1 1 2", "Bri-lha, bri-lha_es-tre-li-nha,"],
      ["F4 F4 E4 E4 D4 D4 C4", "1 1 1 1 1 1 2", "que-ro ver vo-cê bri-lhar."],
      ["G4 G4 F4 F4 E4 E4 D4 D4", "1 1 1 1 1 1 1 1", "Faz de con-ta que_é só mi-nha,"],
      ["G4 G4 F4 F4 E4 E4 D4", "1 1 1 1 1 1 2", "só pra ti i-rei can-tar."],
      ["C4 C4 G4 G4 A4 A4 G4", "1 1 1 1 1 1 2", "Bri-lha, bri-lha_es-tre-li-nha,"],
      ["F4 F4 E4 E4 D4 D4 C4", "1 1 1 1 1 1 2", "que-ro ver vo-cê bri-lhar."],
    ] },
    { id: "parabens", nome: "Parabéns a Você", emoji: "🎂", bpm: 104, linhas: [
      ["G4 G4 A4 G4 C5 B4", ".75 .25 1 1 1 2", "Pa-ra-béns a vo-cê,"],
      ["G4 G4 A4 G4 G4 D5 C5", ".75 .25 1 .5 .5 1 2", "nes-ta da-ta que-ri-da,"],
      ["G4 G4 G5 E5 C5 B4 A4", ".75 .25 1 1 1 1 2", "mui-tas fe-li-ci-da-des,"],
      ["F5 F5 E5 C5 C5 D5 C5", ".75 .25 1 .5 .5 1 2", "mui-tos a-nos de vi-da!"],
    ] },
    { id: "atirei", nome: "Atirei o Pau no Gato", emoji: "🐱", bpm: 120, fimFala: "Miau!", linhas: [
      ["G4 F4 E4 D4 E4 F4 G4 G4 G4", ".5 .5 .5 .5 .5 .5 .5 .5 1", "A-ti-rei o pau no ga-to-to,"],
      ["A4 G4 F4 F4 F4", ".5 .5 .5 .5 1", "mas o ga-to-to"],
      ["G4 F4 E4 E4 E4", ".5 .5 .5 .5 1", "não mor-reu-reu-reu."],
      ["C5 C5 A4 A4 A4", ".5 .5 .5 .5 1", "Do-na Chi-ca-ca"],
      ["B4 A4 G4 G4 G4", ".5 .5 .5 .5 1", "ad-mi-rou-se-se"],
      ["E4 F4 G4 E4 F4 G4", ".5 .5 1 .5 .5 1", "do be-rô, do be-rô"],
      ["G4 F4 E4 D4 C4", ".5 .5 .5 .5 1.5", "que o ga-to deu:"],
    ] },
    { id: "ciranda", nome: "Ciranda, Cirandinha", emoji: "💃", bpm: 112, linhas: [
      ["G3 C4 C4 E4 E4 G4 G4", ".5 .5 .5 .5 .5 .5 1", "Ci-ran-da, ci-ran-di-nha,"],
      ["F4 E4 D4 G4 E4 D4 C4", ".5 .5 .5 .5 .5 .5 1", "va-mos to-dos ci-ran-dar."],
      ["E4 G4 F4 E4 D4 C4 B3 G3", ".5 .5 .5 .5 .5 .5 .5 1", "Va-mos dar a mei-a vol-ta,"],
      ["F4 D4 E4 C4 D4 B3 C4", ".5 .5 .5 .5 .5 .5 1", "vol-ta_e mei-a va-mos dar."],
      ["G3 C4 C4 E4 E4 G4 G4", ".5 .5 .5 .5 .5 .5 1", "O_a-nel que tu me des-tes"],
      ["F4 E4 D4 G4 E4 D4 C4", ".5 .5 .5 .5 .5 .5 1", "e-ra vi-dro_e se que-brou."],
      ["E4 G4 F4 E4 D4 C4 B3 G3", ".5 .5 .5 .5 .5 .5 .5 1", "O a-mor que tu me ti-nhas"],
      ["F4 D4 E4 C4 D4 B3 C4", ".5 .5 .5 .5 .5 .5 1", "e-ra pou-co_e se_a-ca-bou."],
    ] },
    { id: "marcha", nome: "Marcha Soldado", emoji: "🥁", bpm: 116, linhas: [
      ["G4 G4 E4 C4 C4", ".5 .5 .5 .5 1", "Mar-cha, sol-da-do,"],
      ["E4 G4 G4 G4 E4 D4", ".5 .5 .5 .5 .5 1", "ca-be-ça de pa-pel."],
      ["D4 F4 F4 F4 F4 D4 G4", ".5 .5 .5 .5 .5 .5 1", "Se não mar-char di-rei-to,"],
      ["A4 G4 F4 E4 D4 C4", ".5 .5 .5 .5 .5 1", "vai pre-so pro quar-tel."],
      ["C4 E4 G4 G4 E4 C4 C4", ".5 .5 .5 .5 .5 .5 1", "O quar-tel pe-gou fo-go,"],
      ["C4 E4 G4 G4 G4 E4 D4", ".5 .5 .5 .5 .5 .5 1", "a po-lí-cia deu si-nal:"],
      ["D4 F4 F4 F4 F4 D4 G4", ".5 .5 .5 .5 .5 .5 1", "a-co-de_a-co-de_a-co-de"],
      ["G4 A4 G4 F4 E4 D4 C4", ".5 .5 .5 .5 .5 .5 1", "a ban-dei-ra na-cio-nal!"],
    ] },
    { id: "borboleta", nome: "Borboletinha", emoji: "🦋", bpm: 116, linhas: [
      ["C4 D4 C4 F4 F4", ".5 .5 .5 .5 1", "Bor-bo-le-ti-nha"],
      ["C4 D4 C4 E4 E4", ".5 .5 .5 .5 1", "tá na co-zi-nha,"],
      ["C4 D4 D4 C4 C4 E4 E4", ".5 .5 .5 .5 .5 .5 1", "fa-zen-do cho-co-la-te"],
      ["C4 D4 E4 F4 F4", ".5 .5 .5 .5 1", "pa-ra_a ma-dri-nha."],
      ["C4 D4 C4 F4", ".5 .5 .5 1", "Po-ti, po-ti,"],
      ["C4 D4 C4 E4", ".5 .5 .5 1", "per-na de pau,"],
      ["C4 D4 C4 E4 E4", ".5 .5 .5 .5 1", "o-lho de vi-dro"],
      ["C4 C4 D4 D4 E4 E4 F4", ".5 .5 .5 .5 .5 .5 1", "e na-riz de pi-ca-pau,"],
      ["C4 F4", "1 1", "pau, pau!"],
    ] },
    { id: "balao", nome: "Cai, Cai, Balão", emoji: "🎈", bpm: 108, linhas: [
      ["G4 G4 F4 E4", "1 1 1 1", "Cai, cai, ba-lão,"],
      ["G4 G4 F4 E4", "1 1 1 1", "cai, cai, ba-lão,"],
      ["G4 A4 G4 F4 E4 D4", ".5 .5 .5 .5 1 1", "na ru-a do sa-bão."],
      ["D4 E4 F4", "1 1 2", "Não cai, não,"],
      ["D4 E4 F4", "1 1 2", "não cai, não,"],
      ["D4 E4 F4", "1 1 2", "não cai, não,"],
      ["G4 A4 G4 F4 E4 D4 C4", ".5 .5 .5 .5 .5 .5 2", "cai a-qui na mi-nha mão!"],
    ] },
  ];

  function compilar(def) {
    const notas = [];
    def.linhas.forEach(([ns, ds, letra], li) => {
      const ms = ns.trim().split(/\s+/).map(paraMidi);
      const dur = ds.trim().split(/\s+/).map(Number);
      const sil = [];
      letra.trim().split(/\s+/).forEach(pal => {
        const ps = pal.split("-");
        ps.forEach((p, i) => sil.push({ t: p.replace(/_/g, " "), fimPalavra: i === ps.length - 1 }));
      });
      if (ms.length !== dur.length || ms.length !== sil.length) console.warn("Cantiga com contagem diferente:", def.nome, li + 1, ms.length, dur.length, sil.length);
      ms.forEach((m, i) => notas.push({ m, dur: dur[i] || 1, sil: sil[i] || { t: "", fimPalavra: true }, linha: li }));
    });
    const alturas = notas.map(n => n.m);
    return { ...def, notas, min: Math.min(...alturas), max: Math.max(...alturas) };
  }
  const MUSICAS = MUSICAS_DEF.map(compilar);

  // Teclas brancas a partir de `inicio`
  function brancasDesde(inicio, n) {
    const l = [];
    for (let m = inicio; l.length < n; m++) if (branca(m)) l.push(m);
    return l;
  }
  function janelaDa(mus) {
    const l = [];
    for (let m = mus.min; m <= mus.max; m++) if (branca(m)) l.push(m);
    return { inicio: mus.min, brancas: Math.max(8, l.length) };
  }

  // ---------- Teclado na tela (multitoque, deslizar o dedo, controle) ----------
  function criarTeclado({ inicio, brancas, pretas, estilo, nomes, aoApertar, aoSoltar }) {
    const el = document.createElement("div");
    el.className = `pn-teclado ${estilo === "xilo" ? "xilo" : "piano"}` + (nomes ? "" : " sem-nomes");
    const teclas = new Map();
    const lista = brancasDesde(inicio, brancas), n = lista.length;
    const larguraPreta = 62 / n;
    const nova = (m, classe) => {
      const k = document.createElement("div");
      k.className = "pn-tecla " + classe;
      k.dataset.midi = m;
      k.setAttribute("data-toque", "");
      k.setAttribute("role", "button");
      k.setAttribute("aria-label", nomeNota(m));
      k.style.setProperty("--cor", corNota(m));
      k.innerHTML = `<span class="pn-nome"></span>`;
      k.firstChild.textContent = nomeNota(m);
      teclas.set(m, k);
      return k;
    };
    lista.forEach((m, i) => {
      const k = nova(m, "branca");
      if (estilo === "xilo") k.style.setProperty("--alt", (100 - i * (34 / Math.max(1, n - 1))).toFixed(1) + "%");
      el.appendChild(k);
      if (pretas && estilo !== "xilo" && i < n - 1 && !branca(m + 1)) {
        const p = nova(m + 1, "preta");
        p.style.width = larguraPreta + "%";
        p.style.left = ((i + 1) * 100 / n - larguraPreta / 2) + "%";
        el.appendChild(p);
      }
    });

    const ativos = new Map(); // ponteiro → { m, voz }
    const segurando = m => [...ativos.values()].some(a => a.m === m);
    function apertar(id, m) {
      const k = teclas.get(m);
      if (!k) return;
      const v = aoApertar ? aoApertar(m, k) : null;
      ativos.set(id, { m, voz: v });
      k.classList.add("pn-ap");
    }
    function soltar(id) {
      const a = ativos.get(id);
      if (!a) return;
      ativos.delete(id);
      if (a.voz) a.voz.soltar();
      const k = teclas.get(a.m);
      if (k && !segurando(a.m)) setTimeout(() => { if (!segurando(a.m)) k.classList.remove("pn-ap"); }, 90);
      if (aoSoltar) aoSoltar(a.m);
    }
    const teclaEm = alvo => alvo && alvo.closest ? alvo.closest(".pn-tecla") : null;
    el.addEventListener("pointerdown", e => {
      const k = teclaEm(e.target);
      if (!k || !el.contains(k)) return;
      e.preventDefault();
      if (e.pointerId !== 99) { try { el.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } }
      soltar(e.pointerId);
      apertar(e.pointerId, +k.dataset.midi);
    });
    el.addEventListener("pointermove", e => {
      const a = ativos.get(e.pointerId);
      if (!a) return;
      const k = teclaEm(document.elementFromPoint(e.clientX, e.clientY));
      if (k && el.contains(k) && +k.dataset.midi !== a.m) { soltar(e.pointerId); apertar(e.pointerId, +k.dataset.midi); }
    });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach(t => el.addEventListener(t, e => soltar(e.pointerId)));
    el.addEventListener("contextmenu", e => e.preventDefault());

    return {
      el, teclas,
      acender(m) {
        teclas.forEach(k => k.classList.remove("luz"));
        const k = teclas.get(m);
        if (k) k.classList.add("luz");
        return k;
      },
      // Teclado do computador: aperta e solta como um dedo
      apertarTecla: (id, m) => { if (!ativos.has(id)) apertar(id, m); },
      soltarTecla: id => soltar(id),
      soltarTudo: () => [...ativos.keys()].forEach(soltar),
    };
  }

  // ---------- Peças da tela ----------
  const div = (classe, texto) => { const d = document.createElement("div"); d.className = classe; if (texto !== undefined) d.textContent = texto; return d; };
  // Botão com ícone e rótulo separados (em telas estreitas só o ícone aparece)
  function rotular(b, texto) {
    const i = texto.indexOf(" ");
    b.innerHTML = "";
    if (i < 0) { b.textContent = texto; return; }
    const ic = document.createElement("span"), r = document.createElement("span");
    ic.className = "pn-ic"; ic.textContent = texto.slice(0, i);
    r.className = "pn-rot"; r.textContent = texto.slice(i);
    b.append(ic, r);
    b.setAttribute("aria-label", texto.slice(i + 1));
  }
  function chip(texto, aoClicar, classe = "") {
    const b = document.createElement("button");
    b.className = "chip " + classe;
    rotular(b, texto);
    b.addEventListener("click", aoClicar);
    return b;
  }
  // Motor.animar não tira a classe depois: numa tecla que já pulou, o "balanca" ficaria sem efeito
  function animar(el, classe) {
    if (!el) return;
    ["pn-pulo", "balanca"].forEach(c => { if (c !== classe) el.classList.remove(c); });
    Motor.animar(el, classe);
  }
  // Notinha que sobe da tecla tocada
  function notinha(palco, k, m) {
    if (!palco || !k) return;
    const rp = palco.getBoundingClientRect(), rk = k.getBoundingClientRect();
    const s = div("pn-notinha", Motor.sortear(["♪", "♫", "♩", "♬"]));
    s.style.left = (rk.left + rk.width / 2 - rp.left) + "px";
    s.style.top = Math.max(0, Math.min(rp.height - 30, rk.top - rp.top - 20)) + "px";
    s.style.color = corNota(m);
    s.style.setProperty("--dx", (Math.random() * 60 - 30) + "px");
    palco.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }

  // Teclas do computador no modo livre (estilo dos programas de música)
  const MAPA_TECLAS = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, "ç": 16, ";": 16 };

  const JOGO = {
    id: "piano", nome: "Piano e Cantigas", icone: "🎹",
    faixas: ["3-4", "4-5", "5-6", "6-8", "8-10"],
    teclas: false,
    ajuda: [
      { figura: "🎹", texto: "Toque nas teclas coloridas para fazer música. Dá para tocar várias ao mesmo tempo e deslizar o dedo!" },
      { figura: "🌈", texto: "Troque o instrumento: piano, xilofone, sanfona ou flauta." },
      { figura: "💡", texto: "Nas cantigas, a tecla que brilha é a próxima nota. Toque nela e aprenda a música!" },
      { figura: "🎧", texto: "Toque em Ouvir para escutar a música com a letra aparecendo, para cantar junto." },
      { figura: "🥁", texto: "No jogo de ritmo, toque na pista quando a bolinha chegar no círculo. No controle, use as setas ou o botão A." },
    ],
    iniciar(area, faixa) { menu(area, faixa); },
  };
  JOGOS.push(JOGO);
  CATALOGO["piano"] = ["arte", "Piano, xilofone, cantigas e ritmo"];

  function menu(area, faixa) {
    JOGO.teclas = false;
    Motor.escolherModo(area, [
      { icone: "🎹", rotulo: "Tocar livre", iniciar: () => livre(area, faixa) },
      { icone: "🎶", rotulo: "Cantigas", iniciar: () => listaMusicas(area, faixa) },
      { icone: "🥁", rotulo: "Jogo de ritmo", iniciar: () => ritmoOpcoes(area, faixa) },
    ]);
  }

  // Cria a tela cheia do jogo e devolve { tela, topo, vivo }
  function novaTela(area, classe) {
    area.innerHTML = "";
    const tela = div("pn-tela " + classe);
    const topo = div("pn-topo");
    tela.appendChild(topo);
    area.appendChild(tela);
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);
    return { tela, topo, vivo };
  }

  // ---------- Tocar livre ----------
  function livre(area, faixa) {
    JOGO.teclas = false;
    const pequeno = pequenoDe(faixa);
    const { tela, topo, vivo } = novaTela(area, "pn-livre");
    let instr = lerPref("piano-instr", pequeno ? "xilo" : "piano");
    if (!INSTR[instr]) instr = "piano";
    let nomes = lerPref("piano-nomes", true);
    let oitava = 4;

    const grupo = div("pn-instrumentos");
    const botoesInstr = ORDEM_INSTR.map(id => {
      const b = chip(`${INSTR[id].icone} ${INSTR[id].nome}`, () => {
        instr = id; gravarPref("piano-instr", id); marcar(); montar();
        voz(paraMidi("C5"), id, 0.4);
        Motor.falar(INSTR[id].nome);
      });
      b.dataset.id = id;
      grupo.appendChild(b);
      return b;
    });
    const marcar = () => botoesInstr.forEach(b => b.classList.toggle("ativo", b.dataset.id === instr));
    const bNomes = chip("🔤 Dó Ré Mi", () => { nomes = !nomes; gravarPref("piano-nomes", nomes); bNomes.classList.toggle("ativo", nomes); montar(); });
    bNomes.classList.toggle("ativo", nomes);
    const bGrave = chip("🔽 Grave", () => mudarOitava(-1));
    const bAgudo = chip("🔼 Agudo", () => mudarOitava(1));
    const extras = div("pn-extras");
    extras.append(bNomes, bGrave, bAgudo);
    topo.append(grupo, extras);
    marcar();

    const palco = div("pn-palco");
    const grande = div("pn-nota-grande", "🎶");
    palco.appendChild(grande);
    const caixa = div("pn-caixa-teclado");
    tela.append(palco, caixa);

    let teclado = null, nBrancas = 0;
    const quantas = () => (caixa.clientWidth >= 860 ? 15 : 8);
    function limites() { return nBrancas > 8 ? [3, 4] : [3, 5]; }
    function mudarOitava(d) {
      const [lo, hi] = limites();
      const nova = Math.max(lo, Math.min(hi, oitava + d));
      if (nova === oitava) { Motor.animar(d < 0 ? bGrave : bAgudo, "balanca"); return; }
      oitava = nova; montar();
      Motor.falar(d < 0 ? "Mais grave!" : "Mais agudo!");
    }
    function montar() {
      if (teclado) teclado.soltarTudo();
      nBrancas = quantas();
      const [lo, hi] = limites();
      oitava = Math.max(lo, Math.min(hi, oitava));
      teclado = criarTeclado({
        inicio: 12 * (oitava + 1), brancas: nBrancas, pretas: !pequeno, estilo: INSTR[instr].estilo, nomes,
        aoApertar: (m, k) => {
          grande.textContent = nomeNota(m);
          grande.style.color = corNota(m);
          animar(grande, "pn-pulo");
          notinha(palco, k, m);
          return voz(m, instr);
        },
      });
      caixa.innerHTML = "";
      caixa.appendChild(teclado.el);
      bGrave.disabled = oitava <= lo; bAgudo.disabled = oitava >= hi;
    }
    montar();

    const aoRedimensionar = () => { if (!vivo()) return; if (quantas() !== nBrancas) montar(); };
    const teclaBaixo = e => {
      if (!vivo()) return limpar();
      if (e.doControle || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const i = MAPA_TECLAS[e.key.toLowerCase()];
      if (i === undefined) return;
      const m = 12 * (oitava + 1) + i;
      if (!teclado.teclas.has(m)) return;
      e.preventDefault();
      teclado.apertarTecla("k" + e.key.toLowerCase(), m);
    };
    const teclaCima = e => { if (!vivo()) return limpar(); if (teclado) teclado.soltarTecla("k" + e.key.toLowerCase()); };
    function limpar() {
      document.removeEventListener("keydown", teclaBaixo);
      document.removeEventListener("keyup", teclaCima);
      window.removeEventListener("resize", aoRedimensionar);
    }
    document.addEventListener("keydown", teclaBaixo);
    document.addEventListener("keyup", teclaCima);
    window.addEventListener("resize", aoRedimensionar);
    Motor.falar("Toque nas teclas e faça a sua música!");
  }

  // ---------- Cantigas ----------
  function listaMusicas(area, faixa) {
    JOGO.teclas = false;
    Motor.escolherModo(area, [
      ...MUSICAS.map(mus => ({ icone: mus.emoji, rotulo: mus.nome, iniciar: () => cantiga(area, faixa, mus) })),
      { icone: "⬅️", rotulo: "Voltar", iniciar: () => menu(area, faixa) },
    ], { pequenos: true });
    Motor.falar("Escolha uma cantiga!");
  }

  // Letra em karaokê: a linha da vez com as sílabas e a próxima linha, mais clarinha
  function criarLetra() {
    const el = div("pn-letra");
    const atual = div("pn-linha"), prox = div("pn-linha prox");
    el.append(atual, prox);
    let linhaMostrada = -1, spans = [];
    function linhaEl(mus, li, destino) {
      destino.innerHTML = "";
      const sp = [];
      mus.notas.forEach((n, i) => {
        if (n.linha !== li) return;
        const s = document.createElement("span");
        s.className = "pn-sil";
        s.textContent = n.sil.t;
        s.style.setProperty("--cor", corNota(n.m));
        destino.appendChild(s);
        if (n.sil.fimPalavra) destino.appendChild(document.createTextNode(" "));
        sp[i] = s;
      });
      return sp;
    }
    return {
      el,
      // `i`: nota da vez; `cantadas`: quantas notas já foram (as anteriores ficam coloridas)
      mostrar(mus, i) {
        const n = mus.notas[Math.min(i, mus.notas.length - 1)];
        if (n.linha !== linhaMostrada) {
          linhaMostrada = n.linha;
          spans = linhaEl(mus, n.linha, atual);
          const temProx = mus.notas.some(x => x.linha === n.linha + 1);
          if (temProx) linhaEl(mus, n.linha + 1, prox); else prox.textContent = "";
        }
        spans.forEach((s, j) => {
          if (!s) return;
          s.classList.toggle("cantada", j < i);
          s.classList.toggle("agora", j === i);
        });
      },
      reiniciar() { linhaMostrada = -1; },
    };
  }

  function telaFimCantiga(tela, mus, titulo, aoDeNovo, aoOutra) {
    tela.querySelector(".arcade-fim")?.remove();
    const caixa = div("arcade-fim pn-fim");
    caixa.append(div("medalha-fim", mus.emoji), div("titulo-fim", titulo), div("pontos-fim", "⭐⭐⭐"));
    const botoes = div("pn-fim-botoes");
    botoes.append(chip("🔁 De novo", () => { caixa.remove(); aoDeNovo(); }, "jogar"), chip("🎵 Outra música", aoOutra));
    caixa.appendChild(botoes);
    tela.appendChild(caixa);
    Motor.comemorar(caixa);
    return caixa;
  }

  function cantiga(area, faixa, mus) {
    JOGO.teclas = false;
    const pequeno = pequenoDe(faixa);
    const { tela, topo, vivo } = novaTela(area, "pn-cantiga");
    let instr = lerPref("piano-instr", pequeno ? "xilo" : "piano");
    if (!INSTR[instr]) instr = "piano";
    let nomes = lerPref("piano-nomes", true);
    let devagar = lerPref("piano-devagar", pequeno);
    let modo = "tocar", idx = 0, erros = 0, tocador = null;

    const titulo = div("pn-titulo", `${mus.emoji} ${mus.nome}`);
    const bOuvir = chip("🎧 Ouvir", () => ouvir());
    const bTocar = chip("💡 Tocar", () => tocar(true));
    const bVel = chip("", () => { devagar = !devagar; gravarPref("piano-devagar", devagar); pintarVel(); Motor.falar(devagar ? "Devagar" : "Normal"); });
    const pintarVel = () => rotular(bVel, devagar ? "🐢 Devagar" : "🐇 Normal");
    pintarVel();
    const bInstr = chip("", () => {
      instr = ORDEM_INSTR[(ORDEM_INSTR.indexOf(instr) + 1) % ORDEM_INSTR.length];
      gravarPref("piano-instr", instr); pintarInstr(); montar(); Motor.falar(INSTR[instr].nome);
    });
    const pintarInstr = () => rotular(bInstr, `${INSTR[instr].icone} ${INSTR[instr].nome}`);
    pintarInstr();
    const bVoltar = chip("🎵 Músicas", () => { pararOuvir(); listaMusicas(area, faixa); });
    const botoes = div("pn-extras");
    botoes.append(bOuvir, bTocar, bVel, bInstr, bVoltar);
    topo.append(titulo, botoes);

    const letra = criarLetra();
    const caixa = div("pn-caixa-teclado");
    const palco = div("pn-palco pn-palco-letra");
    palco.appendChild(letra.el);
    tela.append(palco, caixa);

    const janela = janelaDa(mus);
    let teclado = null;
    function montar() {
      if (teclado) teclado.soltarTudo();
      teclado = criarTeclado({
        inicio: janela.inicio, brancas: janela.brancas, pretas: false, estilo: INSTR[instr].estilo, nomes,
        aoApertar: (m, k) => { notinha(palco, k, m); const v = voz(m, instr); apertou(m, k); return v; },
      });
      caixa.innerHTML = "";
      caixa.appendChild(teclado.el);
      if (modo === "tocar" && idx < mus.notas.length) teclado.acender(mus.notas[idx].m);
    }
    const marcarModo = () => { bOuvir.classList.toggle("ativo", modo === "ouvir"); bTocar.classList.toggle("ativo", modo === "tocar"); };

    function apertou(m, k) {
      if (modo !== "tocar" || idx >= mus.notas.length) return;
      const alvo = mus.notas[idx];
      if (m === alvo.m) {
        idx++;
        erros = 0;
        letra.mostrar(mus, idx);
        if (idx >= mus.notas.length) { teclado.acender(null); terminou(); return; }
        const kk = teclado.acender(mus.notas[idx].m);
        if (kk && pequeno) animar(kk, "pn-pulo");
      } else {
        erros++;
        animar(k, "balanca");
        const kAlvo = teclado.teclas.get(alvo.m);
        if (kAlvo) animar(kAlvo, "pn-pulo");
        if (erros === 3) Motor.falar(`Procure a tecla que está brilhando: ${nomeNota(alvo.m)}!`);
      }
    }

    function terminou() {
      Motor.tim();
      const fala = `${Motor.elogio()} Você tocou ${mus.nome}!`;
      Motor.depois(() => {
        if (mus.fimFala) Motor.falar(mus.fimFala).then(() => Motor.falar(fala)); else Motor.falar(fala);
        miau();
        telaFimCantiga(tela, mus, `Você tocou ${mus.nome}!`, () => tocar(true), () => listaMusicas(area, faixa));
      }, 500);
    }
    // "Miau!" no fim do Atirei o Pau no Gato
    function miau() {
      if (mus.id !== "atirei") return;
      Motor.nota(700, { dur: 0.45, tipo: "triangle", vol: 0.15, ate: 1100 });
      Motor.nota(1100, { dur: 0.35, tipo: "triangle", vol: 0.12, inicio: 0.4, ate: 600 });
    }

    function tocar(falar) {
      pararOuvir();
      tela.querySelector(".arcade-fim")?.remove();
      modo = "tocar"; idx = 0; erros = 0;
      marcarModo();
      letra.reiniciar();
      letra.mostrar(mus, 0);
      const k = teclado.acender(mus.notas[0].m);
      if (k) animar(k, "pn-pulo");
      if (falar) Motor.falar("Toque na tecla que está brilhando!");
    }

    function pararOuvir() {
      if (tocador) { tocador.parar(); tocador = null; }
    }
    function ouvir() {
      pararOuvir();
      tela.querySelector(".arcade-fim")?.remove();
      modo = "ouvir";
      marcarModo();
      teclado.acender(null);
      letra.reiniciar();
      letra.mostrar(mus, 0);
      const vel = devagar ? 0.72 : 1;
      const tempo = 60 / (mus.bpm * vel);
      let i = 0, parado = false;
      tocador = { parar() { parado = true; teclado.teclas.forEach(k => k.classList.remove("tocando")); } };
      const eu = tocador;
      const passo = () => {
        if (parado || !vivo()) return;
        if (i >= mus.notas.length) {
          teclado.teclas.forEach(k => k.classList.remove("tocando"));
          letra.mostrar(mus, mus.notas.length);
          if (mus.fimFala) { miau(); }
          Motor.depois(() => { if (tocador === eu) { tocador = null; Motor.falar("Agora é a sua vez! Siga a luz."); tocar(false); } }, 900);
          return;
        }
        const n = mus.notas[i];
        const d = n.dur * tempo;
        voz(n.m, instr, Math.max(0.15, d * 0.92));
        letra.mostrar(mus, i);
        teclado.teclas.forEach(k => k.classList.remove("tocando"));
        const k = teclado.teclas.get(n.m);
        if (k) { k.classList.add("tocando"); notinha(palco, k, n.m); }
        i++;
        setTimeout(passo, d * 1000);
      };
      setTimeout(passo, 400);
    }

    montar();
    tocar(false);
    Motor.falar(`${mus.nome}! Toque em ouvir para escutar, ou siga a luz para tocar.`);
  }

  // ---------- Jogo de ritmo ----------
  const NIVEIS = {
    facil: { nome: "Fácil", pistas: 3, vel: 0.75, queda: 2.4, perfeito: 0.11, bom: 0.24, minimo: 0.42 },
    normal: { nome: "Normal", pistas: 4, vel: 0.9, queda: 1.9, perfeito: 0.08, bom: 0.17, minimo: 0.2 },
    rapido: { nome: "Rápido", pistas: 4, vel: 1.1, queda: 1.45, perfeito: 0.065, bom: 0.14, minimo: 0 },
  };
  const CORES_PISTA = ["#ef476f", "#f7c548", "#3bb273", "#4d7cfe"];
  const SETA_PISTA = { 3: ["◀", "▼", "▶"], 4: ["◀", "▼", "▲", "▶"] };
  const recordeRitmo = (id, nivel) => { try { return +localStorage.getItem(`piano-ritmo-${id}-${nivel}`) || 0; } catch (e) { return 0; } };

  function ritmoOpcoes(area, faixa) {
    JOGO.teclas = false;
    const pequeno = pequenoDe(faixa);
    const antes = div("pn-ritmo-cabeca");
    antes.append(chip("⬅️ Voltar", () => menu(area, faixa)), div("pn-ritmo-titulo", "🥁 Jogo de ritmo"));
    Motor.telaOpcoes(area, {
      chave: "piano-ritmo-op", padrao: { musica: "brilha", nivel: pequeno ? "facil" : "normal" }, antes,
      opcoes: [
        { chave: "musica", titulo: "Música", valores: MUSICAS.map(m => [m.id, `${m.emoji} ${m.nome}`]) },
        { chave: "nivel", titulo: "Nível", valores: [["facil", "🐢 Fácil"], ["normal", "🐇 Normal"], ["rapido", "🚀 Rápido"]] },
      ],
      aoJogar: op => ritmo(area, faixa, op),
    });
  }

  function ritmo(area, faixa, op) {
    const mus = MUSICAS.find(m => m.id === op.musica) || MUSICAS[0];
    const nv = NIVEIS[op.nivel] || NIVEIS.normal;
    const pequeno = pequenoDe(faixa);
    const folga = pequeno ? 1.35 : 1;
    let instr = lerPref("piano-instr", "piano");
    if (!INSTR[instr]) instr = "piano";
    JOGO.teclas = true;
    const { tela, topo, vivo } = novaTela(area, "pn-ritmo");

    // Pistas: as notas mais graves à esquerda, as mais agudas à direita
    const alturas = [...new Set(mus.notas.map(n => n.m))].sort((a, b) => a - b);
    const pistaDe = m => Math.min(nv.pistas - 1, Math.floor(alturas.indexOf(m) * nv.pistas / alturas.length));
    const tempo = 60 / (mus.bpm * nv.vel);
    const INICIO = nv.queda + 1.2;
    let t = INICIO, ultimaT = -9;
    const notas = [];
    mus.notas.forEach((n, i) => {
      const nota = { i, t, m: n.m, pista: pistaDe(n.m), estado: 0, sozinha: false, linha: n.linha };
      // Fácil: notas muito juntas tocam sozinhas (sem bolinha) para a criança ter tempo
      if (t - ultimaT < nv.minimo) nota.sozinha = true; else ultimaT = t;
      notas.push(nota);
      t += n.dur * tempo;
    });
    const jogaveis = notas.filter(n => !n.sozinha);
    const FIM = t + 1.2;

    // Topo: pontos, combo, letra e botões
    const info = div("pn-ritmo-info");
    const elPontos = div("pn-pontos", "⭐ 0"), elCombo = div("pn-combo", "");
    info.append(elPontos, elCombo);
    const bPausa = chip("⏸️", () => pausar(), "pn-redondo");
    const bDeNovo = chip("🔁", () => ritmo(area, faixa, op), "pn-redondo");
    const bSair = chip("🎵", () => { JOGO.teclas = false; ritmoOpcoes(area, faixa); }, "pn-redondo");
    const botoes = div("pn-extras");
    botoes.append(bPausa, bDeNovo, bSair);
    topo.append(info, botoes);
    const letra = criarLetra();
    letra.el.classList.add("pn-letra-ritmo");
    const palco = div("pn-ritmo-palco");
    const cv = document.createElement("canvas");
    palco.append(cv, letra.el);
    tela.appendChild(palco);
    const g = cv.getContext("2d");

    let W = 0, H = 0, dpr = 1;
    function medir() {
      const r = palco.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      cv.style.width = W + "px"; cv.style.height = H + "px";
    }
    medir();
    // Em telas baixas (celular deitado) as bolinhas descem mais rápido, para não ficarem grudadas
    const queda = () => nv.queda * Math.max(0.6, Math.min(1, H / 650));
    const geo = () => {
      const largura = Math.min(W - 16, nv.pistas * 130);
      const x0 = (W - largura) / 2;
      const lp = largura / nv.pistas;
      const yLinha = H - Math.max(54, Math.min(90, H * 0.14));
      const yTopo = Math.min(70, H * 0.18);
      return { x0, lp, largura, yLinha, yTopo, r: Math.max(16, Math.min(lp * 0.36, 34, H * 0.075)) };
    };

    let pontos = 0, combo = 0, maxCombo = 0, perf = 0, bons = 0, perdidas = 0;
    let t0 = performance.now() / 1000, pausado = false, pausaEm = 0, acabou = false;
    const agora = () => (pausado ? pausaEm : performance.now() / 1000) - t0;
    const flash = new Array(nv.pistas).fill(-9);
    const textos = []; // { txt, cor, x, y, t }
    const estrelas = Array.from({ length: 40 }, () => [Math.random(), Math.random(), Math.random() * 6]);

    function pausar() {
      if (acabou) return;
      if (!pausado) { pausado = true; pausaEm = performance.now() / 1000; bPausa.textContent = "▶️"; Motor.falar("Pausa"); }
      else { t0 += performance.now() / 1000 - pausaEm; pausado = false; bPausa.textContent = "⏸️"; }
    }

    function bater(pista) {
      if (acabou || pausado) return;
      const a = agora();
      let alvo = null, melhor = Infinity;
      for (const n of jogaveis) {
        if (n.estado) continue;
        if (n.t - a > nv.bom * folga * 3) break;
        if (pista >= 0 && n.pista !== pista) continue;
        const d = Math.abs(n.t - a);
        if (d < melhor) { melhor = d; alvo = n; }
      }
      const p = alvo && pista < 0 ? alvo.pista : pista;
      if (p >= 0) flash[p] = a;
      if (!alvo || melhor > nv.bom * folga) return;
      const G = geo();
      const x = G.x0 + G.lp * (alvo.pista + 0.5);
      voz(alvo.m, instr, 0.45);
      combo++; maxCombo = Math.max(maxCombo, combo);
      if (melhor <= nv.perfeito * folga) { alvo.estado = 1; perf++; pontos += 100 + Math.min(combo, 20) * 5; textos.push({ txt: "Perfeito!", cor: "#ffe66d", x, y: G.yLinha - 50, t: a }); }
      else { alvo.estado = 2; bons++; pontos += 50 + Math.min(combo, 20) * 2; textos.push({ txt: "Bom!", cor: "#9bf6ff", x, y: G.yLinha - 50, t: a }); }
      atualizarInfo();
    }
    function atualizarInfo() {
      elPontos.textContent = `⭐ ${pontos}`;
      elCombo.textContent = combo >= 3 ? `🔥 ${combo}` : "";
    }

    // Toque na pista
    cv.addEventListener("pointerdown", e => {
      e.preventDefault();
      const r = cv.getBoundingClientRect(), G = geo();
      const x = e.clientX - r.left;
      let p = Math.floor((x - G.x0) / G.lp);
      p = Math.max(0, Math.min(nv.pistas - 1, p));
      bater(p);
    });
    // Teclado e controle (setas, D F J K, A/Enter e X/espaço acertam a bolinha mais perto)
    const TECLAS = nv.pistas === 3
      ? { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 1, ArrowRight: 2, d: 0, f: 1, j: 1, k: 2 }
      : { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, d: 0, f: 1, j: 2, k: 3 };
    const teclaBaixo = e => {
      if (!vivo()) return limpar();
      if (acabou) return;
      if (e.key === "p" || e.key === "P") { pausar(); return; }
      let p = TECLAS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (e.key === "Enter" || e.key === " ") p = -1;
      if (p === undefined) return;
      e.preventDefault();
      if (e.repeat) return;
      if (pausado) { pausar(); return; }
      bater(p);
    };
    const aoRedimensionar = () => { if (vivo()) medir(); };
    const aoEsconder = () => { if (document.hidden && !pausado && !acabou) pausar(); };
    function limpar() {
      document.removeEventListener("keydown", teclaBaixo);
      window.removeEventListener("resize", aoRedimensionar);
      document.removeEventListener("visibilitychange", aoEsconder);
    }
    document.addEventListener("keydown", teclaBaixo);
    window.addEventListener("resize", aoRedimensionar);
    document.addEventListener("visibilitychange", aoEsconder);

    let proxSozinha = 0, notaLetra = 0;
    function quadro() {
      if (!vivo()) { limpar(); return; }
      const a = agora();
      if (!pausado && !acabou) {
        // notas que tocam sozinhas e notas perdidas
        while (proxSozinha < notas.length && notas[proxSozinha].t <= a) {
          const n = notas[proxSozinha];
          if (n.sozinha) voz(n.m, instr, 0.35);
          proxSozinha++;
        }
        for (const n of jogaveis) {
          if (n.estado === 0 && a - n.t > nv.bom * folga) {
            n.estado = 3; perdidas++; combo = 0; atualizarInfo();
            const G = geo();
            textos.push({ txt: "Ops!", cor: "#ffffff", x: G.x0 + G.lp * (n.pista + 0.5), y: G.yLinha - 40, t: a });
          }
        }
        while (notaLetra < notas.length - 1 && notas[notaLetra].t <= a + 0.05) notaLetra++;
        letra.mostrar(mus, Math.max(0, notaLetra - (notas[notaLetra].t > a + 0.05 ? 1 : 0)));
        if (a > FIM) terminar();
      }
      desenhar(a);
      requestAnimationFrame(quadro);
    }

    function desenhar(a) {
      const G = geo();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fundo = g.createLinearGradient(0, 0, 0, H);
      fundo.addColorStop(0, "#241653"); fundo.addColorStop(0.6, "#4a2f8f"); fundo.addColorStop(1, "#7b5cd6");
      g.fillStyle = fundo; g.fillRect(0, 0, W, H);
      estrelas.forEach(([x, y, f]) => {
        g.globalAlpha = 0.35 + 0.35 * Math.sin(a * 2 + f);
        g.fillStyle = "#fff";
        g.beginPath(); g.arc(x * W, y * H * 0.8, 1.6, 0, Math.PI * 2); g.fill();
      });
      g.globalAlpha = 1;
      // pistas
      for (let p = 0; p < nv.pistas; p++) {
        const x = G.x0 + G.lp * p;
        const cor = CORES_PISTA[nv.pistas === 3 ? [0, 1, 3][p] : p];
        const brilho = Math.max(0, 1 - (a - flash[p]) / 0.25);
        g.fillStyle = cor;
        g.globalAlpha = 0.14 + brilho * 0.25;
        arred(x + 4, 6, G.lp - 8, H - 12, 16); g.fill();
        g.globalAlpha = 1;
        // alvo
        const cx = x + G.lp / 2;
        g.lineWidth = 6; g.strokeStyle = cor;
        g.fillStyle = brilho > 0 ? cor : "rgba(255,255,255,.12)";
        g.beginPath(); g.arc(cx, G.yLinha, G.r + 4 + brilho * 6, 0, Math.PI * 2); g.fill(); g.stroke();
        g.fillStyle = "#fff"; g.font = `bold ${Math.round(G.r * 0.9)}px Fredoka, sans-serif`; g.textAlign = "center"; g.textBaseline = "middle";
        g.fillText(SETA_PISTA[nv.pistas][p], cx, G.yLinha + 1);
      }
      // linha
      g.fillStyle = "rgba(255,255,255,.5)"; g.fillRect(G.x0, G.yLinha - 1.5, G.largura, 3);
      // bolinhas
      const vel = (G.yLinha - G.yTopo) / queda();
      for (const n of jogaveis) {
        if (n.estado === 1 || n.estado === 2) continue;
        const y = G.yLinha - (n.t - a) * vel;
        if (y < G.yTopo - G.r * 2) break;
        if (y > H + G.r) continue;
        const cx = G.x0 + G.lp * (n.pista + 0.5);
        const cor = CORES_PISTA[nv.pistas === 3 ? [0, 1, 3][n.pista] : n.pista];
        g.globalAlpha = n.estado === 3 ? 0.35 : Math.min(1, (y - G.yTopo + G.r * 2) / (G.r * 2));
        const gr = g.createRadialGradient(cx - G.r * 0.3, y - G.r * 0.35, G.r * 0.1, cx, y, G.r);
        gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.35, cor); gr.addColorStop(1, cor);
        g.fillStyle = gr;
        g.beginPath(); g.arc(cx, y, G.r, 0, Math.PI * 2); g.fill();
        g.lineWidth = 3; g.strokeStyle = "rgba(255,255,255,.9)"; g.stroke();
        g.fillStyle = "#2b2140"; g.font = `bold ${Math.round(G.r * 0.62)}px Fredoka, sans-serif`;
        g.fillText(nomeNota(n.m), cx, y + 1);
        g.globalAlpha = 1;
      }
      // textos
      for (let i = textos.length - 1; i >= 0; i--) {
        const tx = textos[i], v = (a - tx.t) / 0.8;
        if (v > 1 || v < 0) { if (v > 1) textos.splice(i, 1); continue; }
        g.globalAlpha = 1 - v;
        g.fillStyle = tx.cor; g.font = `bold ${Math.round(Math.max(18, G.r * 0.8))}px Fredoka, sans-serif`;
        g.strokeStyle = "rgba(0,0,0,.35)"; g.lineWidth = 4;
        g.strokeText(tx.txt, tx.x, tx.y - v * 30); g.fillText(tx.txt, tx.x, tx.y - v * 30);
      }
      g.globalAlpha = 1;
      if (a < notas[0].t - nv.queda * 0.5 && !pausado) {
        const n = Math.ceil(notas[0].t - nv.queda * 0.5 - a);
        if (n <= 3) {
          g.fillStyle = "#fff"; g.font = `bold ${Math.round(Math.min(W, H) * 0.18)}px Fredoka, sans-serif`;
          g.fillText(String(n), W / 2, H * 0.45);
        }
      }
      if (pausado && !acabou) {
        g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(0, 0, W, H);
        g.fillStyle = "#fff"; g.font = `bold ${Math.round(Math.min(W, H) * 0.09)}px Fredoka, sans-serif`;
        g.fillText("⏸️ Pausa", W / 2, H * 0.45);
      }
    }
    function arred(x, y, w, h, r) {
      g.beginPath();
      g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
      g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    }

    function terminar() {
      if (acabou) return;
      acabou = true;
      const total = jogaveis.length || 1;
      const nota = (perf + bons * 0.6) / total;
      const nEstrelas = nota >= 0.85 ? 3 : nota >= 0.55 ? 2 : 1;
      const chave = `piano-ritmo-${mus.id}-${op.nivel}`;
      const antes = recordeRitmo(mus.id, op.nivel);
      const recorde = pontos > antes;
      if (recorde) { try { localStorage.setItem(chave, String(pontos)); } catch (e) { /* ok */ } }
      const caixa = div("arcade-fim pn-fim");
      caixa.append(
        div("medalha-fim", nEstrelas === 3 ? "🏆" : nEstrelas === 2 ? "🥈" : "🎵"),
        div("titulo-fim", recorde && antes ? "Novo recorde!" : nEstrelas === 3 ? "Que ritmo!" : "Muito bem!"),
        div("pontos-fim", "⭐".repeat(nEstrelas) + `  ${pontos} pontos`),
        div("detalhe-fim", `Perfeito: ${perf} · Bom: ${bons} · Ops: ${perdidas}` + (maxCombo >= 3 ? ` · 🔥 ${maxCombo}` : "")),
      );
      const bs = div("pn-fim-botoes");
      bs.append(chip("🔁 De novo", () => ritmo(area, faixa, op), "jogar"), chip("🎵 Outra música", () => { JOGO.teclas = false; ritmoOpcoes(area, faixa); }));
      caixa.appendChild(bs);
      tela.appendChild(caixa);
      Motor.comemorar(caixa);
      Motor.tim();
      Motor.falar(`${nEstrelas === 3 ? "Que ritmo!" : Motor.elogio()} Você fez ${pontos} pontos!`);
    }

    letra.mostrar(mus, 0);
    Motor.falar(pequeno ? "Toque na pista quando a bolinha chegar no círculo!" : "Acerte as bolinhas quando chegarem no círculo!");
    requestAnimationFrame(quadro);
  }
})();
