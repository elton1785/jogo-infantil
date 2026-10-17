// Progresso de cada criança (perfil do álbum): estrelas, trilhas de lições, missão do dia, Parque,
// moedas, loja e a área dos pais.
//
// Modo de cada perfil (os pais escolhem na área dos pais; 1 a 3 anos é sempre Livre):
// - Livre: tudo aberto, como sempre foi. Estrelas e moedas contam do mesmo jeito.
// - Guiado: 📚 lições em sequência (trilha de cada matéria: a próxima abre quando a anterior tem
//   estrela), 🧠 desafios por nível (o médio abre depois de 2 fáceis), 🎨 livres sempre abertos e
//   🎡 Parque só depois da missão do dia (3 atividades), pelo tempo que os pais escolherem.
//
// Como um jogo "termina" (dá estrelas): a tela de troféu (Motor.telaFim: 1 a 3 ⭐ pelos acertos de
// primeira), uma partida contra o computador (Placar.resultado: vitória 3 ⭐, empate 2, derrota 1)
// ou, nos jogos sem fim de rodada, 8 acertos na lição / 3 vitórias ou 4 minutos no desafio /
// 90 segundos brincando nos livres.
//
// Moedas 🪙: as estrelas de lições e desafios (só as 2 primeiras vezes de cada jogo no dia, para
// não virar "repetir o mais fácil") e 5 por missão cumprida. Servem só para enfeites na 🛍️ Loja:
// pacotinhos e figurinhas do álbum, bichinhos para o perfil e chapéus do Bichinho Virtual.
const Progresso = (() => {
  const MINUTOS_PARQUE = 15, EXTRA_POR_LICAO = 5, EXTRA_MAX = 15;
  const pequeno = faixaId => ["1-2", "2-3"].includes(faixaId);
  const faixaObj = id => FAIXAS.find(f => f.id === id);
  const diaDe = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  // Hoje, sem voltar no tempo: se a data do aparelho for atrasada (para ganhar missão e Parque de
  // novo), continua valendo o maior dia já visto. Adiantar a data só "gasta" os dias seguintes.
  function hoje() {
    const real = diaDe(new Date());
    let maior = null;
    try { maior = localStorage.getItem("dia-maior"); } catch (e) { /* ok */ }
    if (maior && real < maior) return maior;
    if (real !== maior) try { localStorage.setItem("dia-maior", real); } catch (e) { /* ok */ }
    return real;
  }
  const numeroDoDia = () => Math.floor(new Date(hoje() + "T12:00:00").getTime() / 86400000);
  // Toque, clique ou tecla nos últimos 20 s: a criança está mexendo (jogo aberto parado não conta)
  let ultimoGesto = 0;
  ["pointerdown", "keydown"].forEach(t => window.addEventListener(t, () => { ultimoGesto = Date.now(); }, true));
  const mexendo = () => Date.now() - ultimoGesto < 20000;
  // Sorteio que não muda no mesmo dia (a missão é a mesma ao abrir o app de novo)
  function semente(txt) {
    let h = 2166136261;
    for (const c of txt) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }

  // ---------- Estado (por perfil) ----------
  const vazio = () => ({ estrelas: {}, feitos: {}, moedas: 0, ganhos: { dia: "", por: {} }, missao: null,
    parque: { dia: "", seg: 0, extra: 0 }, liberado: "", compras: { avatares: [], enfeites: [] }, enfeite: null });
  const perfil = () => Album.perfilAtual();
  const chave = (id = perfil().id) => `progresso-${id}`;
  function dados(id) {
    try { return { ...vazio(), ...JSON.parse(localStorage.getItem(chave(id))) }; } catch (e) { return vazio(); }
  }
  function salvar(d, id) { try { localStorage.setItem(chave(id), JSON.stringify(d)); } catch (e) { /* sem espaço */ } }
  let aoMudar = null;
  const mudou = () => { if (aoMudar) aoMudar(); };

  const k = (jogo, faixaId) => `${jogo.id || jogo}|${faixaId}`;
  const estrelas = (d, jogo, faixaId) => d.estrelas[k(jogo, faixaId)] || 0;
  // Guiado: o padrão de toda criança com idade a partir de 3 anos, até os pais escolherem o Livre
  const guiado = (p = perfil()) => (p.modo === "guiado" || !p.modoEscolhido) && !!p.faixa && !pequeno(p.faixa);
  const minutosParque = (p = perfil()) => (p.parqueMin == null ? MINUTOS_PARQUE : p.parqueMin); // 0 = sem limite
  const liberadoHoje = d => d.liberado === hoje();

  // Trilhas da idade: as lições de cada matéria, na ordem de ensino
  function trilhasDa(faixaId) {
    return TRILHAS.map(t => ({ ...t, jogos: t.jogos.map(id => JOGOS.find(j => j.id === id)).filter(j => j && j.faixas.includes(faixaId) && tipoDe(j) === "licao") }))
      .filter(t => t.jogos.length);
  }
  const trilhaDe = (jogo, faixaId) => trilhasDa(faixaId).find(t => t.jogos.includes(jogo));
  const nivelDe = jogo => NIVEL_DESAFIO[jogo.id] || 1;
  const desafiosDa = faixaId => JOGOS.filter(j => j.faixas.includes(faixaId) && tipoDe(j) === "desafio");

  // ---------- Pode abrir? ----------
  // { aberto, motivo (falado quando está fechado), estrelas, passo ("Passo 2 de 9"), nivel }
  function situacao(jogo, faixa, d = dados()) {
    const fx = faixa.id, tipo = tipoDe(jogo);
    const r = { aberto: true, motivo: "", estrelas: estrelas(d, jogo, fx), tipo };
    if (tipo === "licao") {
      const t = trilhaDe(jogo, fx);
      if (t) {
        const i = t.jogos.indexOf(jogo);
        r.passo = `Passo ${i + 1} de ${t.jogos.length}`;
        r.trilha = t;
        if (i > 0 && !estrelas(d, t.jogos[i - 1], fx)) { r.aberto = false; r.motivo = `Termine ${t.jogos[i - 1].nome} para abrir esta lição!`; }
      }
    } else if (tipo === "desafio") {
      r.nivel = nivelDe(jogo);
      if (r.nivel > 1) {
        const antes = desafiosDa(fx).filter(j => nivelDe(j) === r.nivel - 1);
        const precisa = Math.min(2, antes.length), feitos = antes.filter(j => estrelas(d, j, fx)).length;
        if (feitos < precisa) {
          r.aberto = false;
          const falta = precisa - feitos, qual = NOMES_NIVEL[r.nivel - 1].toLowerCase();
          r.motivo = `Complete mais ${falta === 1 ? "um desafio" : falta + " desafios"} ${qual}${falta === 1 ? "" : "s"} para abrir este!`;
        }
      }
    } else if (tipo === "parque") {
      const m = d.missao && d.missao.dia === hoje() ? d.missao : null;
      if (!(m && m.completa)) { r.aberto = false; r.motivo = "Complete a missão do dia para abrir o Parque!"; }
      else if (minutosParque() && d.parque.dia === hoje() && d.parque.seg <= 0) { r.aberto = false; r.motivo = "O tempo do Parque de hoje acabou. Amanhã tem mais!"; r.acabou = true; }
    }
    // Guiado: só os jogos da idade da criança (o "Continuar", os favoritos ou recarregar a página
    // não podem abrir um jogo de outra idade, jogado quando ela estava no Livre)
    if (guiado() && fx !== perfil().faixa) { r.aberto = false; r.foraDaIdade = true; r.motivo = "Este jogo é de outra idade. Escolha um dos seus jogos!"; }
    if (!guiado() || liberadoHoje(d)) { r.aberto = true; r.motivo = ""; r.foraDaIdade = false; }
    return r;
  }

  // Níveis dos desafios da idade: quantos feitos e o que falta para abrir cada um (para o menu)
  function niveisDesafio(faixaId, d = dados()) {
    const des = desafiosDa(faixaId);
    return [1, 2, 3].map(n => {
      const lista = des.filter(j => nivelDe(j) === n);
      const antes = des.filter(j => nivelDe(j) === n - 1);
      const precisa = n === 1 ? 0 : Math.min(2, antes.length);
      const feitosAntes = antes.filter(j => estrelas(d, j, faixaId)).length;
      return { nivel: n, lista, feitos: lista.filter(j => estrelas(d, j, faixaId)).length,
        aberto: n === 1 || feitosAntes >= precisa || !guiado() || liberadoHoje(d), precisa, feitosAntes };
    }).filter(x => x.lista.length);
  }

  // ---------- Missão do dia: 1 lição, 1 desafio e 1 brincadeira livre ----------
  function missao(d = dados()) {
    const p = perfil(), fx = p.faixa;
    if (!guiado(p)) return null;
    if (d.missao && d.missao.dia === hoje() && d.missao.faixa === fx) return d.missao;
    const sorte = semente(hoje() + p.id), fxo = faixaObj(fx);
    const escolher = l => l[Math.floor(sorte() * l.length)];
    const ids = [];
    // Lição: a próxima da trilha da vez (cada dia começa por uma matéria)
    const trilhas = trilhasDa(fx), dn = numeroDoDia();
    const proximaDe = t => t.jogos.find(j => !estrelas(d, j, fx) && situacao(j, fxo, d).aberto && !ids.includes(j.id));
    const licao = () => {
      for (let i = 0; i < trilhas.length; i++) { const j = proximaDe(trilhas[(dn + ids.length + i) % trilhas.length]); if (j) return j; }
      const todas = trilhas.flatMap(t => t.jogos).filter(j => !ids.includes(j.id)); // tudo feito: revisão
      return todas.length ? escolher(todas) : null;
    };
    const l1 = licao(); if (l1) ids.push(l1.id);
    // Desafio aberto, de preferência um ainda sem estrela
    const des = desafiosDa(fx).filter(j => situacao(j, fxo, d).aberto);
    const novos = des.filter(j => !estrelas(d, j, fx));
    const dj = (novos.length ? novos : des).length ? escolher(novos.length ? novos : des) : null;
    if (dj) ids.push(dj.id);
    const liv = JOGOS.filter(j => j.faixas.includes(fx) && tipoDe(j) === "livre");
    if (liv.length) ids.push(escolher(liv).id);
    while (ids.length < 3) { const x = licao() || null; if (!x) break; ids.push(x.id); }
    d.missao = { dia: hoje(), faixa: fx, ids: ids.slice(0, 3), feitos: [], completa: false };
    salvar(d);
    return d.missao;
  }

  // ---------- Avisos (por cima de tudo, um de cada vez) ----------
  const fila = [];
  let avisando = false;
  function avisar(texto, { fala, grande } = {}) {
    fila.push({ texto, fala, grande });
    if (!avisando) proximoAviso();
  }
  function proximoAviso() {
    const a = fila.shift();
    if (!a) { avisando = false; return; }
    avisando = true;
    const el = document.createElement("div");
    el.className = "prog-aviso" + (a.grande ? " grande" : "");
    el.textContent = a.texto;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("visivel"));
    if (a.fala) Motor.falar(a.fala, { naFila: true });
    setTimeout(() => { el.classList.remove("visivel"); setTimeout(() => { el.remove(); proximoAviso(); }, 350); }, a.grande ? 3800 : 2800);
  }

  // ---------- Terminou (dá estrelas) ----------
  function concluir(jogo, faixa, n, caixa) {
    if (!jogo || !faixa) return;
    const p = perfil(), d = dados(), fx = faixa.id, chave = k(jogo, fx), tipo = tipoDe(jogo);
    const antes = d.estrelas[chave] || 0;
    // O que estava fechado antes (para avisar o que abriu)
    const fechados = guiado(p) && fx === p.faixa ? JOGOS.filter(j => j.faixas.includes(fx) && tipoDe(j) !== "parque" && !situacao(j, faixa, d).aberto) : [];
    d.estrelas[chave] = Math.max(antes, n);
    d.feitos[chave] = hoje();
    // Moedas: só as 2 primeiras vezes de cada jogo no dia
    let moedas = 0, semMoedaHoje = false;
    if (tipo === "licao" || tipo === "desafio") {
      if (d.ganhos.dia !== hoje()) d.ganhos = { dia: hoje(), por: {} };
      const vezes = d.ganhos.por[jogo.id] || 0;
      if (vezes < 2) { moedas = n; d.ganhos.por[jogo.id] = vezes + 1; } else semMoedaHoje = true;
    }
    d.moedas += moedas;
    // Missão do dia
    let cumpriu = false, ganhouTempo = false;
    const m = guiado(p) && fx === p.faixa ? missao(d) : null;
    if (m && m.ids.includes(jogo.id) && !m.feitos.includes(jogo.id)) {
      m.feitos.push(jogo.id);
      if (m.feitos.length >= m.ids.length && !m.completa) {
        m.completa = true; cumpriu = true;
        d.moedas += 5;
        d.parque = { dia: hoje(), seg: minutosParque(p) * 60, extra: 0 };
      }
    } else if (m && m.completa && tipo === "licao" && minutosParque(p) && d.parque.dia === hoje() && d.parque.extra < EXTRA_MAX) {
      // Lição a mais depois da missão: +5 minutos de Parque
      d.parque.extra += EXTRA_POR_LICAO; d.parque.seg += EXTRA_POR_LICAO * 60; ganhouTempo = true;
    }
    salvar(d);
    const abriu = fechados.filter(j => situacao(j, faixa, d).aberto);
    const naMissao = m && m.ids.includes(jogo.id);
    mostrarRecompensa({ tipo, n, antes, moedas, semMoedaHoje, total: d.moedas, abriu, cumpriu, ganhouTempo,
      missao: naMissao ? { feitos: m.feitos.length, total: m.ids.length } : null, parque: temParque(fx) }, caixa);
    mudou();
  }

  // ---------- 🎁 Recompensa: o que a criança ganhou ao terminar ----------
  // Na tela de troféu (Motor.telaFim) vai dentro dela; nos outros jogos, um cartão por cima que
  // some sozinho (ou com um toque), sem atrapalhar a partida.
  function mostrarRecompensa(r, caixa) {
    const box = el("div", "recompensa" + (caixa ? "" : " flutuante"));
    const titulo = r.tipo === "livre" ? "Que legal!" : r.n === 3 ? "Perfeito!" : r.n === 2 ? "Muito bem!" : "Conseguiu!";
    box.appendChild(el("div", "rec-titulo", `🎁 ${titulo}`));
    const est = el("div", "rec-estrelas");
    est.innerHTML = [0, 1, 2].map(i => `<i class="${i < r.n ? "on" : ""}" style="animation-delay:${i * 0.18}s">★</i>`).join("");
    box.appendChild(est);
    const linhas = [];
    if (r.n > r.antes && r.antes) linhas.push(["rec-recorde", "🏅 Novo recorde de estrelas!"]);
    if (r.moedas) linhas.push(["rec-moedas", `+${r.moedas} 🪙  ·  agora você tem ${r.total} 🪙`]);
    else if (r.semMoedaHoje) linhas.push(["rec-obs", "🪙 As moedas deste jogo já saíram hoje. Jogue outro para ganhar mais!"]);
    if (r.cumpriu) linhas.push(["rec-missao cumpriu", `🎉 Missão do dia cumprida! +5 🪙${r.parque ? "  ·  🎡 O Parque abriu!" : ""}`]);
    else if (r.missao) linhas.push(["rec-missao", `🎯 Missão do dia: ${r.missao.feitos} de ${r.missao.total}`]);
    if (r.ganhouTempo) linhas.push(["rec-obs", `⏱️ +${EXTRA_POR_LICAO} minutos de Parque!`]);
    r.abriu.slice(0, 3).forEach(j => linhas.push(["rec-abriu", `🔓 Abriu: ${j.icone.startsWith("<svg") ? "" : j.icone + " "}${j.nome}`]));
    linhas.forEach(([c, t]) => box.appendChild(el("div", c, t)));
    // Voz: estrelas, moedas e o mais importante (missão ou o que abriu)
    const falas = [`Você ganhou ${r.n} ${r.n === 1 ? "estrela" : "estrelas"}${r.moedas ? ` e ${r.moedas} ${r.moedas === 1 ? "moeda" : "moedas"}` : ""}!`];
    if (r.cumpriu) falas.push("Você cumpriu a missão do dia!" + (r.parque ? " O Parque de diversões abriu!" : ""));
    else if (r.missao) { const f = r.missao.total - r.missao.feitos; falas.push(`Falta${f > 1 ? "m" : ""} ${f} na missão do dia.`); }
    if (r.abriu.length) falas.push(`Abriu ${r.abriu[0].nome}!`);
    if (caixa) {
      const antesDe = caixa.querySelector(".modo");
      caixa.insertBefore(box, antesDe);
      Motor.depois(() => Motor.falar(falas.join(" "), { importante: true }), 400);
    } else {
      document.body.appendChild(box);
      requestAnimationFrame(() => box.classList.add("visivel"));
      const tirar = () => { box.classList.remove("visivel"); setTimeout(() => box.remove(), 400); };
      box.addEventListener("click", tirar);
      setTimeout(tirar, 7000);
      Motor.falar(falas.join(" "), { importante: true }); // a próxima pergunta espera esta fala
    }
    if (r.moedas) moedasVoando(box, r.moedas);
  }
  // Moedinhas que pulam do quadro
  function moedasVoando(box, n) {
    setTimeout(() => {
      const rr = box.getBoundingClientRect();
      for (let i = 0; i < Math.min(8, n * 2 + 2); i++) {
        const mo = el("div", "moeda-voa", "🪙");
        mo.style.left = rr.left + rr.width / 2 - 16 + "px";
        mo.style.top = rr.top + 20 + "px";
        mo.style.setProperty("--dx", (Math.random() * 260 - 130) + "px");
        mo.style.setProperty("--dy", (-60 - Math.random() * 140) + "px");
        mo.style.animationDelay = i * 0.06 + "s";
        document.body.appendChild(mo);
        setTimeout(() => mo.remove(), 1600);
      }
      Motor.tim();
    }, 500);
  }
  // Tempo do Parque acabou (depois do minuto para terminar): volta para o início
  function fimDoParque() {
    if (typeof App !== "undefined" && App && App.irParaInicio) App.irParaInicio();
    avisar("🌙 Hora de descansar do Parque! Amanhã tem mais.", { grande: true, fala: "Hora de descansar do Parque! Amanhã tem mais." });
  }
  const temParque = faixaId => JOGOS.some(j => j.faixas.includes(faixaId) && tipoDe(j) === "parque");

  // ---------- O jogo aberto agora (o App avisa ao entrar e sair) ----------
  let atual = null, relogio = null;
  function entrar(jogo, faixa) {
    sair();
    atual = { jogo, faixa, tipo: tipoDe(jogo), acertos: 0, erros: 0, seg: 0, ativo: 0, deu: false, saida: 0 };
    relogio = setInterval(segundo, 1000);
  }
  function sair() { clearInterval(relogio); relogio = null; atual = null; }
  function segundo() {
    if (!atual || document.visibilityState !== "visible") return;
    atual.seg++;
    if (mexendo()) atual.ativo++;
    // Livre e desafio sem fim de partida: contam pelo tempo MEXENDO (deixar aberto parado não vale)
    if (atual.tipo === "livre" && atual.ativo === 90 && !atual.deu) { atual.deu = true; concluir(atual.jogo, atual.faixa, 1); }
    if (atual.tipo === "desafio" && atual.ativo === 240 && !atual.deu) { atual.deu = true; concluir(atual.jogo, atual.faixa, 1); }
    // Tempo do Parque: só conta com o jogo do Parque aberto
    const p = perfil();
    if (atual.tipo === "parque" && guiado(p) && minutosParque(p)) {
      const d = dados();
      if (liberadoHoje(d)) return;
      if (d.parque.dia !== hoje() || d.parque.seg <= 0) {
        // Acabou: 1 minuto para terminar a partida, depois volta para o início
        atual.saida++;
        if (atual.saida === 1) avisar("🌙 O tempo do Parque acabou! Você tem 1 minuto para terminar.", { grande: true, fala: "O tempo do Parque acabou! Você tem um minuto para terminar. Amanhã tem mais!" });
        if (atual.saida >= 60) { sair(); fimDoParque(); }
        return;
      }
      d.parque.seg--;
      salvar(d);
      if (d.parque.seg === 60) avisar("⏱️ Falta 1 minuto de Parque!", { fala: "Falta um minuto de Parque!" });
    }
  }
  // Motor.comemorar (cada acerto ou vitória)
  function acerto() {
    if (!atual || atual.deu) return;
    atual.acertos++;
    const boaMira = atual.erros * 2 <= atual.acertos; // chutando, erra tanto quanto acerta
    if ((atual.tipo === "licao" && atual.acertos >= 8 && boaMira) || (atual.tipo === "desafio" && atual.acertos >= 3)) {
      atual.deu = true;
      concluir(atual.jogo, atual.faixa, 1);
    }
  }
  // Resposta errada (Motor.animar "balanca", em qualquer jogo)
  function erro() { if (atual) atual.erros++; }
  // Motor.telaFim: fim de rodada com acertos de primeira. Menos da metade de primeira (chute) não
  // ganha estrela: a próxima lição continua fechada e a voz pede para tentar de novo.
  function fimDeRodada(acertos, total, caixa) {
    if (!atual) return;
    const r = total ? acertos / total : 1;
    if (r < 0.5) {
      if (tipoDe(atual.jogo) !== "parque") {
        const q = el("div", "recompensa quase");
        q.append(el("div", "rec-titulo", "💪 Quase!"), el("div", "rec-obs", `Para ganhar estrela, acerte de primeira pelo menos ${Math.ceil(total / 2)} de ${total}. Tente de novo, com calma!`));
        if (caixa) caixa.insertBefore(q, caixa.querySelector(".modo"));
        Motor.depois(() => Motor.falar("Quase! Tente de novo, com calma, para ganhar estrela!", { importante: true }), 400);
      }
      return;
    }
    atual.deu = true;
    concluir(atual.jogo, atual.faixa, r >= 0.9 ? 3 : r >= 0.7 ? 2 : 1, caixa);
  }
  // Placar.resultado: fim de partida contra o computador
  function partida(venceu, empate) {
    if (!atual) return;
    if (!venceu && !empate && atual.ativo < 45) return; // perder de propósito, bem rápido, não vale
    atual.deu = true;
    concluir(atual.jogo, atual.faixa, venceu ? 3 : empate ? 2 : 1);
  }

  // ---------- Telas por cima (loja e área dos pais) ----------
  let camada = null;
  function fechar() {
    if (!camada) return;
    camada.remove(); camada = null;
    if (history.state && history.state.tela === "progresso") history.back();
    mudou();
  }
  window.addEventListener("popstate", () => { if (camada && !(history.state && history.state.tela === "progresso")) { camada.remove(); camada = null; mudou(); } });
  function novaCamada(classe) {
    if (!camada) { history.pushState({ tela: "progresso" }, ""); camada = document.createElement("div"); document.body.appendChild(camada); }
    camada.className = "sobreposta album-camada prog-camada " + (classe || "");
    camada.innerHTML = "";
    camada.scrollTop = 0;
    const fecharB = Object.assign(document.createElement("button"), { className: "canto album-fechar", textContent: "✖️" });
    fecharB.setAttribute("aria-label", "Fechar");
    fecharB.addEventListener("click", fechar);
    const conteudo = Object.assign(document.createElement("div"), { className: "album-conteudo" });
    camada.append(fecharB, conteudo);
    return conteudo;
  }
  const el = (tag, classe, texto) => { const e = document.createElement(tag); if (classe) e.className = classe; if (texto != null) e.textContent = texto; return e; };

  // ---------- 🛍️ Loja (só enfeites: nada de comprar jogos) ----------
  const AVATARES_LOJA = [["🦖", "Dinossauro"], ["🐙", "Polvo"], ["🦉", "Coruja"], ["🐢", "Tartaruga"], ["🦋", "Borboleta"], ["🐳", "Baleia"],
    ["🦩", "Flamingo"], ["🐝", "Abelha"], ["🤖", "Robô"], ["👽", "ET"], ["🦸", "Super-herói"], ["🧜", "Sereia"]];
  const ENFEITES = [["🎩", "Cartola"], ["👑", "Coroa"], ["🎀", "Laço"], ["🧢", "Boné"], ["🎓", "Capelo"], ["🌸", "Flor"], ["⛑️", "Capacete"], ["🪖", "Chapéu de explorador"]];
  const PRECO = { pacote: 10, figurinha: 30, avatar: 15, enfeite: 20 };
  function loja() {
    const d = dados(), p = perfil();
    const c = novaCamada("loja");
    const topo = el("div", "prog-loja-topo");
    topo.append(el("div", "album-titulo-pagina", "🛍️ Loja"), el("div", "prog-moedas grande", `🪙 ${d.moedas}`));
    const dica = el("p", "prog-dica", "Ganhe moedas terminando lições e desafios e cumprindo a missão do dia.");
    const comprar = (preco, fazer) => {
      const dd = dados();
      if (dd.moedas < preco) { Motor.falar(`Você precisa de ${preco} moedas. Você tem ${dd.moedas}. Termine lições para ganhar mais!`); return false; }
      dd.moedas -= preco; salvar(dd);
      Motor.tim();
      fazer(dados());
      return true;
    };
    const item = (icone, nome, preco, acao, { comprado, emUso } = {}) => {
      const b = el("button", "prog-item" + (comprado ? " comprado" : "") + (emUso ? " em-uso" : ""));
      b.innerHTML = `<span class="ic"></span><span class="nm"></span><span class="pr"></span>`;
      b.querySelector(".ic").textContent = icone;
      b.querySelector(".nm").textContent = nome;
      b.querySelector(".pr").textContent = emUso ? "✅ Usando" : comprado ? "Usar" : `🪙 ${preco}`;
      b.addEventListener("click", acao);
      return b;
    };
    const secao = (titulo, itens) => { const s = el("section", "prog-secao"); s.append(el("h3", "prog-secao-titulo", titulo)); const g = el("div", "prog-itens"); itens.forEach(i => g.appendChild(i)); s.appendChild(g); return s; };
    // Álbum
    const album = [
      item("🎁", "Pacotinho de figurinhas", PRECO.pacote, () => { if (comprar(PRECO.pacote, () => Album.darPacotes(1))) { Motor.falar("Você comprou um pacotinho! Vamos abrir?"); fechar(); setTimeout(() => Album.abrirPacote(), 50); } }),
      item("🔎", "Escolher figurinha que falta", PRECO.figurinha, () => {
        if (!Album.faltando().length) { Motor.falar("Seu álbum já está completo!"); return; }
        if (dados().moedas < PRECO.figurinha) { comprar(PRECO.figurinha); return; }
        escolherFigurinha();
      }),
    ];
    // Bichinhos para o perfil
    const avatares = AVATARES_LOJA.map(([a, nome]) => {
      const tem = d.compras.avatares.includes(a), usa = p.avatar === a;
      return item(a, nome, PRECO.avatar, () => {
        if (p.id === "visitante") { Motor.falar("Crie o seu perfil no álbum primeiro!"); return; }
        const usar = () => { Album.salvarPerfil({ ...perfil(), avatar: a }); Motor.falar(`Pronto! ${nome} no seu perfil!`); loja(); };
        if (tem) usar(); else if (comprar(PRECO.avatar, dd => { dd.compras.avatares.push(a); salvar(dd); })) usar();
      }, { comprado: tem, emUso: usa });
    });
    // Chapéus do Bichinho Virtual
    const enfeites = ENFEITES.map(([e, n]) => {
      const tem = d.compras.enfeites.includes(e), usa = d.enfeite === e;
      return item(e, n, PRECO.enfeite, () => {
        const usar = () => { const dd = dados(); dd.enfeite = usa ? null : e; salvar(dd); Motor.falar(usa ? "Tirei o enfeite." : `${n} no seu Bichinho Virtual!`); loja(); };
        if (tem) usar(); else if (comprar(PRECO.enfeite, dd => { dd.compras.enfeites.push(e); salvar(dd); })) usar();
      }, { comprado: tem, emUso: usa });
    });
    c.append(topo, dica, secao("📒 Álbum de figurinhas", album), secao("🐾 Figura do seu perfil", avatares), secao("🐶 Enfeites do Bichinho Virtual", enfeites));
    Motor.falar(`Loja! Você tem ${d.moedas} ${d.moedas === 1 ? "moeda" : "moedas"}.`);
  }
  function escolherFigurinha() {
    const c = novaCamada("loja");
    c.append(el("div", "album-titulo-pagina", "🔎 Qual figurinha você quer?"));
    const g = el("div", "prog-itens");
    Album.faltando().forEach(f => {
      const b = el("button", "prog-item");
      b.innerHTML = `<span class="ic"></span><span class="nm"></span><span class="pr"></span>`;
      b.querySelector(".ic").textContent = f.e;
      b.querySelector(".nm").textContent = f.n;
      b.querySelector(".pr").textContent = `🪙 ${PRECO.figurinha}`;
      b.addEventListener("click", () => {
        const d = dados();
        if (d.moedas < PRECO.figurinha) return;
        d.moedas -= PRECO.figurinha; salvar(d);
        Album.darFigurinha(f.id);
        Motor.tim(); Motor.falar(`${f.n} no seu álbum!`);
        fechar(); setTimeout(() => Album.abrir(f.pagina), 50);
      });
      g.appendChild(b);
    });
    c.appendChild(g);
    Motor.falar("Qual figurinha você quer?");
  }

  // ---------- 💾 Cópia de segurança (tudo fica só no aparelho: nada vai para servidor) ----------
  // O arquivo tem todos os dados do app neste navegador (perfis, progresso, álbum, senha...).
  // Os pais guardam onde quiserem; "Restaurar" troca os dados deste aparelho pelos do arquivo.
  const MARCA_COPIA = "brincar-e-aprender";
  function juntarDados() {
    const dados = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k !== "backup-ultimo") dados[k] = localStorage.getItem(k); }
    return { app: MARCA_COPIA, formato: 1, data: new Date().toISOString(), dados };
  }
  async function salvarCopia() {
    const nome = `brincar-e-aprender-copia-${hoje()}.json`;
    const arquivo = new File([JSON.stringify(juntarDados())], nome, { type: "application/json" });
    try { localStorage.setItem("backup-ultimo", hoje()); } catch (e) { /* ok */ }
    // Celular: abre o "Compartilhar" (WhatsApp, Drive, e-mail...); senão, baixa o arquivo
    if (matchMedia("(pointer: coarse)").matches && navigator.canShare && navigator.canShare({ files: [arquivo] })) {
      try { await navigator.share({ files: [arquivo], title: "Cópia do Brincar e Aprender" }); return "ok"; } catch (e) { if (e.name === "AbortError") return "cancelou"; }
    }
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(arquivo), download: nome });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return "ok";
  }
  function restaurarCopia(aoTerminar) {
    const inp = Object.assign(document.createElement("input"), { type: "file", accept: ".json,application/json" });
    inp.addEventListener("change", () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const leitor = new FileReader();
      leitor.onload = () => {
        let copia = null;
        try { copia = JSON.parse(leitor.result); } catch (e) { /* inválido */ }
        if (!copia || copia.app !== MARCA_COPIA || !copia.dados || typeof copia.dados !== "object") { aoTerminar("invalido"); return; }
        aoTerminar("confirmar", copia, () => {
          try {
            localStorage.clear();
            Object.entries(copia.dados).forEach(([k, v]) => { if (typeof v === "string") localStorage.setItem(k, v); });
            localStorage.setItem("backup-ultimo", (copia.data || "").slice(0, 10));
          } catch (e) { aoTerminar("erro"); return; }
          try { sessionStorage.clear(); } catch (e) { /* ok */ }
          location.reload();
        });
      };
      leitor.readAsText(f);
    });
    inp.click();
  }
  // Pede ao navegador para não apagar os dados sozinho (falta de espaço, site sem uso)
  async function protegerArmazenamento() {
    try { if (navigator.storage && navigator.storage.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch (e) { /* ok */ }
  }
  protegerArmazenamento();
  // 🔊 Volume do app (o do aparelho, só nos botões do próprio aparelho)
  function blocoVolume() {
    const box = el("section", "prog-copia");
    box.appendChild(el("b", null, "🔊 Volume do app"));
    box.appendChild(el("p", null, "Ajusta a voz e os sons do app. O volume do aparelho o navegador não deixa mudar: ele continua nos botões do celular, tablet ou TV (o app nunca fica mais alto que o aparelho)."));
    const v = Motor.volume();
    const ch = el("div", "chips");
    [[0.35, "🔈 Baixo"], [0.65, "🔉 Médio"], [1, "🔊 Alto"]].forEach(([nv, t]) => {
      const b = el("button", "chip" + (Math.abs(v - nv) < 0.01 ? " ativo" : ""), t);
      b.addEventListener("click", () => { Motor.definirVolume(nv); Motor.tim(); Motor.falar("Assim está bom?"); pais(); });
      ch.appendChild(b);
    });
    box.appendChild(ch);
    return box;
  }
  function blocoCopia() {
    const box = el("section", "prog-copia");
    box.appendChild(el("b", null, "💾 Cópia de segurança"));
    const info = el("p", null, "Tudo do app (crianças, progresso, figurinhas, senha) fica guardado só neste aparelho, neste navegador. Nada vai para a internet. Salve uma cópia de vez em quando: se o navegador for limpo ou o aparelho trocar, é só restaurar.");
    const ultimo = (() => { try { return localStorage.getItem("backup-ultimo"); } catch (e) { return null; } })();
    const quando = el("p", "prog-copia-quando", ultimo ? `Última cópia: ${ultimo.split("-").reverse().join("/")}` : "Ainda não foi salva nenhuma cópia.");
    const protegido = el("p", "prog-copia-quando", "");
    if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(ok => {
      protegido.textContent = ok ? "🛡️ O navegador está protegendo os dados deste app." : "⚠️ O navegador ainda pode limpar os dados se faltar espaço. No celular, instalar o app na tela de início ajuda.";
    }).catch(() => {});
    const acoes = el("div", "chips");
    const salvar = el("button", "chip", "💾 Salvar cópia");
    salvar.addEventListener("click", async () => { const r = await salvarCopia(); if (r === "ok") { Motor.tim(); pais(); } });
    const restaurar = el("button", "chip", "📂 Restaurar cópia");
    const aviso = el("p", "prog-copia-aviso", "");
    restaurar.addEventListener("click", () => restaurarCopia((estado, copia, aplicar) => {
      if (estado === "invalido") { aviso.textContent = "❌ Este arquivo não é uma cópia do Brincar e Aprender."; return; }
      if (estado === "erro") { aviso.textContent = "❌ Não deu para restaurar (sem espaço no aparelho?)."; return; }
      let nomes = [];
      try { nomes = JSON.parse(copia.dados.perfis || "[]").map(p => p.nome); } catch (e) { /* ok */ }
      aviso.innerHTML = "";
      aviso.append(el("span", null, `Cópia de ${(copia.data || "").slice(0, 10).split("-").reverse().join("/")}${nomes.length ? " com " + nomes.join(", ") : ""}. Os dados de agora deste aparelho serão trocados por ela. `));
      const ok = el("button", "chip perigo confirmar", "✅ Restaurar agora");
      ok.addEventListener("click", aplicar);
      aviso.appendChild(ok);
    }));
    acoes.append(salvar, restaurar);
    box.append(info, quando, protegido, acoes, aviso);
    return box;
  }

  // ---------- 🔒 Senha dos pais (4 números) ----------
  // Protege a área dos pais e o cadastro de criança nova (senão a criança cria um perfil Livre).
  // Na 1ª vez o adulto cria a senha; "Esqueci a senha" pede uma conta de adulto para criar outra.
  const lerSenha = () => { try { return localStorage.getItem("pais-senha"); } catch (e) { return null; } };
  const gravarSenha = s => { try { localStorage.setItem("pais-senha", s); } catch (e) { /* ok */ } };
  function pedirSenha(depois, { titulo = "🔒 Senha dos pais", criar = !lerSenha(), confirmar = null, adulto = false } = {}) {
    // Ainda sem senha: antes de criar, a conta de adulto (senão a própria criança cria a senha)
    if (criar && !confirmar && !adulto && !lerSenha()) { contaDeAdulto(() => pedirSenha(depois, { titulo, criar: true, adulto: true }), "Primeiro, mostre que é um adulto"); return; }
    const c = novaCamada("senha");
    let digitos = "";
    const titulo2 = criar ? (confirmar ? "Digite a senha de novo" : "Crie uma senha de 4 números") : "Digite a senha dos pais";
    c.append(el("div", "album-titulo-pagina", titulo), el("p", "prog-dica", titulo2));
    if (criar && !confirmar) c.appendChild(el("p", "prog-senha-obs", "Ela protege a área dos pais e o cadastro de crianças. Não conte para as crianças! 😉"));
    const bolinhas = el("div", "prog-senha-bolinhas");
    const pintar = () => { bolinhas.innerHTML = [0, 1, 2, 3].map(i => `<i class="${i < digitos.length ? "on" : ""}"></i>`).join(""); };
    pintar();
    const tecl = el("div", "prog-senha-teclado");
    const pronto = () => {
      if (criar && !confirmar) { pedirSenha(depois, { titulo, criar: true, confirmar: digitos, adulto: true }); return; }
      if (criar) {
        if (digitos !== confirmar) { Motor.animar(bolinhas, "balanca"); Motor.falar("As senhas não são iguais. Vamos de novo."); setTimeout(() => pedirSenha(depois, { titulo, criar: true, adulto: true }), 900); return; }
        gravarSenha(digitos); Motor.tim(); depois(); return;
      }
      if (digitos === lerSenha()) { depois(); return; }
      Motor.animar(bolinhas, "balanca"); Motor.ploc();
      digitos = ""; setTimeout(pintar, 300);
    };
    [1, 2, 3, 4, 5, 6, 7, 8, 9, "⌫", 0, "✖️"].forEach(n => {
      const b = el("button", "prog-senha-tecla" + (typeof n === "string" ? " funcao" : ""), String(n));
      b.addEventListener("click", () => {
        if (n === "✖️") { fechar(); return; }
        if (n === "⌫") digitos = digitos.slice(0, -1);
        else if (digitos.length < 4) digitos += n;
        pintar();
        if (digitos.length === 4) setTimeout(pronto, 150);
      });
      tecl.appendChild(b);
    });
    c.append(bolinhas, tecl);
    if (!criar) {
      const esqueci = el("button", "chip", "Esqueci a senha");
      esqueci.addEventListener("click", () => contaDeAdulto(() => pedirSenha(depois, { titulo, criar: true, adulto: true })));
      c.appendChild(esqueci);
    }
  }
  // Conta difícil para criança (2 algarismos × 2 algarismos), para trocar a senha esquecida
  function contaDeAdulto(depois, aviso) {
    const a = 12 + Math.floor(Math.random() * 18), b = 13 + Math.floor(Math.random() * 16);
    const c = novaCamada("senha");
    c.append(el("div", "album-titulo-pagina", "🧮 Só para adultos"));
    if (aviso) c.appendChild(el("p", "prog-senha-obs", aviso + " (depois você cria a senha dos pais):"));
    c.appendChild(el("p", "prog-dica", `Quanto é ${a} × ${b}?`));
    let valor = "";
    const visor = el("div", "prog-senha-visor", "?");
    const tecl = el("div", "prog-senha-teclado");
    [1, 2, 3, 4, 5, 6, 7, 8, 9, "⌫", 0, "✅"].forEach(n => {
      const bt = el("button", "prog-senha-tecla" + (typeof n === "string" ? " funcao" : ""), String(n));
      bt.addEventListener("click", () => {
        if (n === "✅") {
          if (+valor === a * b) { depois(); return; }
          Motor.animar(visor, "balanca"); valor = ""; visor.textContent = "?"; return;
        }
        valor = n === "⌫" ? valor.slice(0, -1) : (valor + n).slice(0, 4);
        visor.textContent = valor || "?";
      });
      tecl.appendChild(bt);
    });
    c.append(visor, tecl);
  }
  // Para o álbum: cadastrar criança nova só com a senha (se ainda não há senha, cria na hora)
  const comSenha = depois => pedirSenha(depois);

  // ---------- 👨‍👩‍👧 Área dos pais (abre segurando o botão + senha) ----------
  function pais(abrirId) {
    const c = novaCamada("pais");
    c.append(el("div", "album-titulo-pagina", "👨‍👩‍👧 Área dos pais"));
    const ajuda = el("div", "prog-pais-ajuda");
    ajuda.innerHTML = `<p><b>Livre:</b> todos os jogos abertos, como sempre.</p>
      <p><b>Guiado:</b> lições em sequência (a próxima abre quando a anterior termina), desafios do fácil ao difícil, e o <b>Parque</b> (corridas, futebol, sinuca…) só abre depois da <b>missão do dia</b>: 1 lição, 1 desafio e 1 brincadeira. Cada lição a mais depois da missão dá +5 minutos de Parque.</p>
      <p>De 1 a 3 anos fica sempre no Livre: nessa idade cadeado só frustra.</p>`;
    c.appendChild(ajuda);
    const lista = Album.perfis();
    if (!lista.length) {
      c.appendChild(el("p", "prog-dica", "Ainda não há crianças cadastradas. Crie um perfil para usar o modo Guiado."));
      const novo = el("button", "chip jogar", "➕ Cadastrar criança");
      novo.addEventListener("click", () => { fechar(); setTimeout(() => Album.criarPerfil({ semSenha: true }), 50); });
      c.appendChild(novo);
    }
    lista.forEach(p => c.appendChild(cartaoPais(p, p.id === abrirId)));
    c.appendChild(blocoVolume());
    c.appendChild(blocoCopia());
    const trocar = el("button", "chip", "🔑 Trocar a senha");
    trocar.addEventListener("click", () => pedirSenha(() => pais(), { criar: true, adulto: true }));
    c.appendChild(trocar);
  }
  function cartaoPais(p, aberto) {
    const d = dados(p.id);
    const box = el("section", "prog-pais-perfil" + (aberto ? " aberto" : ""));
    const cab = el("button", "prog-pais-cab");
    cab.innerHTML = `<span class="av"></span><span class="nm"></span><span class="md"></span>`;
    cab.querySelector(".av").textContent = p.avatar; cab.querySelector(".av").style.background = p.cor;
    cab.querySelector(".nm").textContent = p.nome;
    cab.querySelector(".md").textContent = `${p.faixa ? faixaObj(p.faixa).nome : "sem idade"} · ${guiado(p) ? "Guiado" : "Livre"} · 🪙 ${d.moedas}`;
    cab.addEventListener("click", () => box.classList.toggle("aberto"));
    const corpo = el("div", "prog-pais-corpo");
    const salvarP = mud => { Album.salvarPerfil({ ...p, ...mud }); pais(p.id); };
    const linha = (rotulo, opcoes, atual, aoEscolher, desligadas = []) => {
      const l = el("div", "prog-linha");
      l.appendChild(el("span", "prog-rotulo", rotulo));
      const ch = el("div", "chips");
      opcoes.forEach(([v, t]) => {
        const b = el("button", "chip" + (v === atual ? " ativo" : ""), t);
        if (desligadas.includes(v)) { b.disabled = true; b.classList.add("desligado"); }
        b.addEventListener("click", () => aoEscolher(v));
        ch.appendChild(b);
      });
      l.appendChild(ch);
      return l;
    };
    corpo.appendChild(linha("Idade", FAIXAS.map(f => [f.id, f.nome]), p.faixa, v => salvarP({ faixa: v })));
    corpo.appendChild(linha("Modo", [["livre", "🌟 Livre"], ["guiado", "🧭 Guiado"]], guiado(p) ? "guiado" : "livre", v => salvarP({ modo: v, modoEscolhido: true }), pequeno(p.faixa) || !p.faixa ? ["guiado"] : []));
    if (guiado(p)) {
      corpo.appendChild(linha("Parque por dia", [[10, "10 min"], [15, "15 min"], [20, "20 min"], [30, "30 min"], [0, "Sem limite"]], minutosParque(p), v => salvarP({ parqueMin: v })));
      const lib = el("button", "chip" + (liberadoHoje(d) ? " ativo" : ""), liberadoHoje(d) ? "🔓 Tudo liberado hoje (tocar para desfazer)" : "🔓 Liberar tudo só hoje");
      lib.addEventListener("click", () => { const dd = dados(p.id); dd.liberado = liberadoHoje(dd) ? "" : hoje(); salvar(dd, p.id); pais(p.id); });
      corpo.appendChild(lib);
    }
    // Progresso nas trilhas
    if (p.faixa) {
      const prog = el("div", "prog-pais-trilhas");
      prog.appendChild(el("b", null, `📊 Progresso (${faixaObj(p.faixa).nome})`));
      trilhasDa(p.faixa).forEach(t => {
        const feitas = t.jogos.filter(j => estrelas(d, j, p.faixa)).length;
        const l = el("div", "prog-pais-trilha");
        l.innerHTML = `<span></span><span class="barra"><i></i></span><small></small>`;
        l.querySelector("span").textContent = `${t.icone} ${t.nome}`;
        l.querySelector("i").style.width = (feitas / t.jogos.length * 100) + "%";
        l.querySelector("i").style.background = t.cor;
        l.querySelector("small").textContent = `${feitas}/${t.jogos.length}`;
        prog.appendChild(l);
      });
      const des = desafiosDa(p.faixa), dfeitos = des.filter(j => estrelas(d, j, p.faixa)).length;
      prog.appendChild(el("small", null, `🧠 Desafios: ${dfeitos} de ${des.length} · ⭐ ${Object.values(d.estrelas).reduce((a, b) => a + b, 0)} estrelas no total`));
      corpo.appendChild(prog);
    }
    const zerar = el("button", "chip perigo", "🗑️ Zerar o progresso");
    zerar.addEventListener("click", () => {
      if (!zerar.classList.contains("confirmar")) { zerar.classList.add("confirmar"); zerar.textContent = "Tem certeza? Toque de novo para zerar"; return; }
      const dd = dados(p.id); salvar({ ...vazio(), compras: dd.compras, enfeite: dd.enfeite, moedas: dd.moedas }, p.id); pais(p.id);
    });
    corpo.appendChild(zerar);
    box.append(cab, corpo);
    return box;
  }

  // Botão da área dos pais: segurar 2 segundos (o toque rápido só explica)
  function botaoPais() {
    const b = el("button", "prog-btn-pais");
    b.innerHTML = `<span class="anel"></span><span>👨‍👩‍👧 Área dos pais</span><small>segure para abrir</small>`;
    let t = null;
    const soltar = () => { clearTimeout(t); t = null; b.classList.remove("segurando"); };
    b.addEventListener("pointerdown", () => { b.classList.add("segurando"); t = setTimeout(() => { soltar(); pedirSenha(() => pais()); }, 2000); });
    ["pointerup", "pointerleave", "pointercancel"].forEach(ev => b.addEventListener(ev, soltar));
    b.addEventListener("click", () => { if (!camada) Motor.falar("Peça para um adulto segurar este botão."); });
    b.addEventListener("contextmenu", e => e.preventDefault());
    return b;
  }

  // ---------- 🙂 Página da criança (tocar no nome dela, no início) ----------
  function paginaCrianca() {
    const p = perfil(), d = dados();
    if (p.id === "visitante") { Album.telaPerfis({ inicio: true }); return; }
    const c = novaCamada("crianca");
    const topo = el("div", "prog-crianca-topo");
    topo.innerHTML = `<span class="av"></span><div class="textos"><b></b><small></small></div>`;
    topo.querySelector(".av").textContent = p.avatar; topo.querySelector(".av").style.background = p.cor;
    topo.querySelector("b").textContent = p.nome;
    topo.querySelector("small").textContent = `${p.faixa ? faixaObj(p.faixa).nome : "sem idade"} · ${guiado(p) ? "🧭 Modo Guiado" : "🌟 Modo Livre"}`;
    const numeros = el("div", "prog-crianca-numeros");
    [["⭐", totalEstrelas(d), "estrelas"], ["🪙", d.moedas, "moedas"]].forEach(([i, n, t]) => {
      const b = el("div", "prog-numero"); b.innerHTML = `<span></span><b></b><small></small>`;
      b.querySelector("span").textContent = i; b.querySelector("b").textContent = n; b.querySelector("small").textContent = t;
      numeros.appendChild(b);
    });
    c.append(topo, numeros);
    // Como funciona (em palavras de criança, a voz lê)
    const como = el("div", "prog-como");
    if (guiado(p)) {
      const m = missao(d);
      como.innerHTML = `<b>Como funciona</b>
        <p>🎯 Todo dia tem uma <b>missão</b> com 3 atividades.</p>
        <p>🎡 Cumpriu a missão? O <b>Parque de diversões</b> abre!</p>
        <p>📚 As lições vão abrindo uma de cada vez, como uma trilha.</p>
        <p>🪙 Ganhe moedas e troque na <b>Loja</b> por figurinhas e enfeites.</p>`;
      if (m) como.appendChild(el("p", "prog-como-missao", m.completa ? "🎉 A missão de hoje está cumprida!" : `🎯 Missão de hoje: ${m.feitos.length} de ${m.ids.length}`));
    } else {
      como.innerHTML = `<b>Modo Livre</b><p>🌟 Todos os jogos estão abertos.</p><p>Para usar trilhas de lições e missão do dia, um adulto liga o <b>modo Guiado</b> na Área dos pais (no fim da tela inicial).</p>`;
    }
    c.appendChild(como);
    // Trilhas
    if (p.faixa) {
      const prog = el("div", "prog-pais-trilhas");
      prog.appendChild(el("b", null, "🗺️ Minhas trilhas"));
      trilhasDa(p.faixa).forEach(t => {
        const feitas = t.jogos.filter(j => estrelas(d, j, p.faixa)).length;
        const l = el("div", "prog-pais-trilha");
        l.innerHTML = `<span></span><span class="barra"><i></i></span><small></small>`;
        l.querySelector("span").textContent = `${t.icone} ${t.nome}`;
        l.querySelector("i").style.width = (feitas / t.jogos.length * 100) + "%";
        l.querySelector("i").style.background = t.cor;
        l.querySelector("small").textContent = `${feitas} de ${t.jogos.length}`;
        prog.appendChild(l);
      });
      c.appendChild(prog);
    }
    const acoes = el("div", "prog-crianca-acoes");
    const botao = (txt, fn) => { const b = el("button", "chip", txt); b.addEventListener("click", fn); acoes.appendChild(b); };
    botao("📒 Meu álbum", () => { fechar(); setTimeout(() => Album.abrir(), 50); });
    botao("🛍️ Loja", () => loja());
    botao("🔄 Trocar de criança", () => { fechar(); setTimeout(() => Album.telaPerfis({ inicio: true }), 50); });
    c.appendChild(acoes);
    Motor.falar(guiado(p) ? `Oi, ${p.nome}! Cumpra a missão do dia para abrir o Parque de diversões!` : `Oi, ${p.nome}! Todos os jogos estão abertos.`);
  }

  // ---------- Para o App e os jogos ----------
  const moedas = () => dados().moedas;
  function infoParque(fx) {
    const d = dados(), m = missao(d), p = perfil();
    if (!guiado(p) || !temParque(fx)) return null;
    if (liberadoHoje(d)) return { aberto: true, texto: "Liberado hoje pelos pais" };
    if (!(m && m.completa)) return { aberto: false, texto: m ? `Missão: ${m.feitos.length} de ${m.ids.length}` : "" };
    if (!minutosParque(p)) return { aberto: true, texto: "Aberto hoje" };
    const s = d.parque.dia === hoje() ? d.parque.seg : 0;
    return s > 0 ? { aberto: true, texto: `⏱️ ${Math.ceil(s / 60)} min hoje` } : { aberto: false, acabou: true, texto: "Acabou por hoje. Amanhã tem mais!" };
  }
  const totalEstrelas = (d = dados()) => Object.values(d.estrelas).reduce((a, b) => a + b, 0);
  const enfeite = () => dados().enfeite;
  const avataresExtras = () => dados().compras.avatares;

  return { situacao, missao: () => missao(), trilhasDa, guiado, pequeno, entrar, sair, acerto, erro, fimDeRodada, partida, concluir,
    faixaAtual: () => (atual ? atual.faixa : null), niveisDesafio,
    loja, pais, botaoPais, paginaCrianca, comSenha, temSenha: () => !!lerSenha(), moedas, infoParque, totalEstrelas, enfeite, avataresExtras, fechar, aberto: () => !!camada,
    estrelasDe: (jogo, faixa) => estrelas(dados(), jogo, faixa.id), aoMudar: fn => { aoMudar = fn; } };
})();
