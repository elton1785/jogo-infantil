// Basquete 🏀 — quadra com as medidas oficiais (FIBA): cesta a 3,05 m do chão, aro de 45 cm,
// tabela de 1,80 × 1,05 m, garrafão, linha do lance livre (4,225 m da cesta) e linha de três pontos
// (6,75 m). A bola tem física de verdade: sobe em arco, bate no aro e na tabela, quica no chão, e a
// rede balança quando entra ("chuá" quando nem encosta no aro). O arremesso é como nos jogos de
// basquete: segure o botão, o jogador pula, e solte quando a barra estiver na faixa verde.
// Modos de verdade: lance livre (10 arremessos), concurso de 3 pontos (5 carrinhos com 5 bolas, a
// última de cada carrinho é a bola colorida que vale 2, contra o relógio e contra o adversário) e
// volta ao mundo (7 lugares em volta do garrafão).
(() => {
  const ARO_Y = 3.05, ARO_R = 0.2286, BOLA_R = 0.12, TABELA_Z = 0.375, LINHA_FUNDO = 1.575, G = 9.81;
  const CAMISAS = { vermelho: ["#e63946", "Vermelha"], azul: ["#1d6fb8", "Azul"], verde: ["#2a9d55", "Verde"], amarelo: ["#ffc21a", "Amarela"], roxo: ["#7048e8", "Roxa"], preto: ["#22252b", "Preta"] };
  const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="#1d3557"/><rect x="14" y="8" width="36" height="22" rx="2" fill="#fff" fill-opacity=".85" stroke="#ccc"/><rect x="25" y="16" width="14" height="10" fill="none" stroke="#e63946" stroke-width="2"/><ellipse cx="32" cy="30" rx="9" ry="2.5" fill="none" stroke="#f77f00" stroke-width="2.5"/><path d="M24 30 L27 40 L37 40 L40 30" fill="none" stroke="#fff" stroke-width="1.2"/><circle cx="32" cy="50" r="9" fill="#f08a24" stroke="#7a3d0a"/><path d="M23 50 H41 M32 41 V59 M25 44 Q32 50 25 56 M39 44 Q32 50 39 56" stroke="#3a1d05" stroke-width="1.2" fill="none"/></svg>';

  JOGOS.push({
    id: "basquete", nome: "Basquete", icone: ICONE, teclas: true,
    faixas: ["5-6", "6-8", "8-10"],
    ajuda: [
      { figura: "🎯", texto: "Primeiro a mira: o anel em cima do aro mostra para onde a bola vai. Arraste o dedo na quadra (ou use as setas / a alavanca) até ele ficar verde, no meio do aro. A mão balança um pouquinho, como de verdade!" },
      { figura: "🏀", texto: "Depois o arremesso: segure o botão ARREMESSAR (ou A no controle): o jogador sobe a bola, dobra os joelhos e pula. Solte quando a barra chegar na faixa verde! Solte cedo e a bola fica curta; tarde, ela passa da cesta." },
      { figura: "💦", texto: "Quando a bola entra sem encostar no aro, é um CHUÁ! A rede balança." },
      { figura: "🎯", texto: "Lance livre: 10 arremessos da linha do lance livre, cada cesta vale 1 ponto." },
      { figura: "🏆", texto: "Concurso de 3 pontos: 5 carrinhos com 5 bolas em volta da linha de três. Cada bola vale 1 ponto e a última, a colorida, vale 2. Corra contra o relógio e tente passar o adversário!" },
      { figura: "🌎", texto: "Volta ao mundo: 7 lugares em volta do garrafão. Acertou, passa para o próximo lugar. Termine com o menor número de arremessos!" },
      { figura: "📏", texto: "As medidas são as de verdade: a cesta fica a 3 metros e 5 centímetros do chão e a linha de três pontos, a 6 metros e 75 centímetros da cesta." },
    ],
    iniciar(area, faixa) {
      const fid = (faixa && faixa.id) || "6-8";
      const perfil = typeof Album !== "undefined" ? Album.perfilAtual().nome : "";
      Motor.telaOpcoes(area, {
        chave: `basquete-${fid}`,
        padrao: { modo: "lance", camisa: "vermelho", nivel: fid === "5-6" ? "facil" : "normal", nome1: perfil === "Visitante" ? "" : perfil },
        opcoes: [
          { chave: "modo", titulo: "O que vamos jogar?", valores: [["lance", "🎯 Lance livre"], ["tres", "🏆 Concurso de 3 pontos"], ["volta", "🌎 Volta ao mundo"]] },
          { chave: "nome1", tipo: "texto", titulo: "Qual é o nome do jogador?", dica: "Você" },
          { chave: "camisa", titulo: "A cor do seu time", valores: () => Object.entries(CAMISAS).map(([k, [hex, nm]]) => [k, nm, () => figuraCamisa(hex)]) },
          { chave: "nivel", titulo: "Jeito de jogar", valores: [["facil", "🐢 Fácil (faixa verde grande)"], ["normal", "🐇 Normal"], ["dificil", "🚀 Profissional"]] },
        ],
        aoJogar: op => jogo(area, op, fid),
      });
    },
  });
  CATALOGO["basquete"] = ["acao", "Arremesse e faça cesta!"];

  function figuraCamisa(hex) {
    const cv = document.createElement("canvas"); cv.width = 200; cv.height = 160;
    const c = cv.getContext("2d");
    c.fillStyle = "#c98a4f"; c.fillRect(0, 0, 200, 160);
    c.fillStyle = hex; c.beginPath(); c.moveTo(60, 20); c.lineTo(80, 14); c.quadraticCurveTo(100, 34, 120, 14); c.lineTo(140, 20); c.lineTo(150, 60); c.lineTo(136, 64); c.lineTo(136, 150); c.lineTo(64, 150); c.lineTo(64, 64); c.lineTo(50, 60); c.closePath(); c.fill();
    c.fillStyle = "#fff"; c.font = "bold 46px sans-serif"; c.textAlign = "center"; c.fillText("10", 100, 110);
    return cv;
  }

  function jogo(area, op, fid) {
    const cor = (CAMISAS[op.camisa] || CAMISAS.vermelho)[0], nome = (op.nome1 || "Você").slice(0, 10);
    const NIVEL = { facil: { tol: 0.15, janela: 1.05, ajuda: 0.06 }, normal: { tol: 0.09, janela: 0.9, ajuda: 0.02 }, dificil: { tol: 0.055, janela: 0.75, ajuda: 0 } }[op.nivel] || { tol: 0.09, janela: 0.9, ajuda: 0.02 };
    let pausado = false;
    const P = Palco.criar(area, { classe: "basquete-tela", aoPausar: () => { pausado = !pausado; P.pausa.textContent = pausado ? "▶️" : "⏸️"; } });
    const ctx = P.ctx;

    // ---------- Os lugares de arremesso de cada modo ----------
    const R3 = 7.0;
    const LUGARES = op.modo === "tres" ? [[-6.75, 0.55], [-R3 * 0.7071, -R3 * 0.7071], [0, -R3], [R3 * 0.7071, -R3 * 0.7071], [6.75, 0.55]]
      : op.modo === "volta" ? [-80, -55, -28, 0, 28, 55, 80].map(g => [3.4 * Math.sin(g * Math.PI / 180), -3.4 * Math.cos(g * Math.PI / 180) + (Math.abs(g) > 70 ? 0.6 : 0)])
      : [[0, -4.5]];
    const NOMES_LUGAR = op.modo === "tres" ? ["canto esquerdo", "lado esquerdo", "meio", "lado direito", "canto direito"] : op.modo === "volta" ? ["1", "2", "3", "4", "5", "6", "7"] : ["lance livre"];
    let lugar = 0, bolasNoLugar = 0, pontos = 0, arremessos = 0, acertos = 0, tempoRestante = op.modo === "tres" ? (op.nivel === "facil" ? 90 : 60) : 0, fim = false;
    const marcas = op.modo === "tres" ? LUGARES.map(() => []) : [];
    const lances = [];
    // adversário do concurso: o computador já fez a rodada dele (o placar dele aparece em cima)
    const adversario = op.modo === "tres" ? (() => { const p = { facil: 0.36, normal: 0.5, dificil: 0.62 }[op.nivel] || 0.5; let t = 0; for (let r = 0; r < 5; r++) for (let b = 0; b < 5; b++) if (Math.random() < p) t += b === 4 ? 2 : 1; return { nome: Motor.sortear(["Robô Zé", "Robô Lia", "Robô Tom"]), pontos: Math.max(6, t) }; })() : null;

    // ---------- Câmera atrás do jogador, olhando para a cesta ----------
    const cam = { x: 0, y: 2.2, z: -8, tx: 0, ty: 2.6, tz: 0 };
    function alvoCamera(i) {
      const [sx, sz] = LUGARES[i], d = Math.hypot(sx, sz), ux = -sx / d, uz = -sz / d;
      return { x: sx - ux * 3.0 + uz * 0.5, y: 2.25, z: sz - uz * 3.0 - ux * 0.5, tx: 0, ty: 2.4, tz: 0.2 };
    }
    Object.assign(cam, alvoCamera(0));
    let F = 600;
    function proj(x, y, z) {
      let fx = cam.tx - cam.x, fy = cam.ty - cam.y, fz = cam.tz - cam.z; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
      let rx = fz, rz = -fx; const rl = Math.hypot(rx, rz); rx /= rl; rz /= rl;
      const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
      const dx = x - cam.x, dy = y - cam.y, dz = z - cam.z;
      const zc = dx * fx + dy * fy + dz * fz;
      if (zc < 0.15) return null;
      const xc = dx * rx + dz * rz, yc = dx * ux + dy * uy + dz * uz;
      return [P.W / 2 + xc / zc * F, P.H * 0.48 - yc / zc * F, F / zc, zc];
    }

    // ---------- A bola ----------
    const bola = { x: 0, y: 1.2, z: 0, vx: 0, vy: 0, vz: 0, giro: 0, estado: "mao", tempo: 0, aro: false, tabela: false, contou: false, colorida: false };
    let carga = 0, carregando = false, pulo = 0, braco = 0, rede = 0, msg = null, ultFala = 0;
    // a mira: o ponto do aro para onde a bola vai (cada arremesso começa um pouco fora do centro;
    // o jogador arrasta o dedo ou usa as setas para pôr a mira no meio do aro) e o "balanço" da mão
    const mira = { x: 0, z: 0 };
    const novaMira = () => { const a = op.nivel === "facil" ? 0.4 : op.nivel === "dificil" ? 0.8 : 0.6; mira.x = (Math.random() - 0.5) * a; mira.z = (Math.random() - 0.5) * a * 0.8; };
    const AMP = { facil: 0.015, normal: 0.04, dificil: 0.07 }[op.nivel] || 0.04;
    const balanco = () => { const t = performance.now() / 1000; return { x: Math.sin(t * 1.7) * AMP + Math.sin(t * 3.1) * AMP * 0.4, z: Math.cos(t * 1.3) * AMP }; };
    novaMira();
    const naMao = () => {
      const [sx, sz] = LUGARES[Math.min(lugar, LUGARES.length - 1)], d = Math.hypot(sx, sz), fx = -sx / d, fz = -sz / d;
      if (!carregando && braco < 0.12) {
        // quicando a bola do lado direito, como o jogador faz antes do lance livre
        const t = performance.now() / 1000, f = Math.abs(Math.sin(t * 5.2));
        Object.assign(bola, { x: sx + fz * 0.38 + fx * 0.2, z: sz - fx * 0.38 + fz * 0.2, y: BOLA_R + f * 0.95 });
        if (f < 0.1 && !bola.quicou) { bola.quicou = true; Motor.nota(120, { dur: 0.08, tipo: "sine", vol: 0.05 }); } else if (f > 0.3) bola.quicou = false;
      } else {
        // nas duas mãos, subindo até em cima da cabeça
        Object.assign(bola, { x: sx + fx * (0.2 + braco * 0.06), z: sz + fz * (0.2 + braco * 0.06), y: 1.15 + braco * 1.1 + pulo * 0.45 });
      }
      bola.vx = bola.vy = bola.vz = 0;
    };
    naMao();
    const somAro = () => { Motor.nota(1650, { dur: 0.12, tipo: "square", vol: 0.05 }); Motor.nota(2480, { dur: 0.08, tipo: "triangle", vol: 0.04 }); };
    const somTabela = () => Motor.ruido({ dur: 0.12, vol: 0.18, freq: 300 });
    const somChao = v => Motor.nota(90 + v * 8, { dur: 0.1, tipo: "sine", vol: Math.min(0.25, 0.05 + v * 0.03) });
    const somRede = () => Motor.ruido({ dur: 0.35, vol: 0.18, filtro: "highpass", freq: 2500 });
    const torcida = (forte) => { Motor.ruido({ dur: forte ? 1.6 : 0.9, vol: forte ? 0.2 : 0.1, filtro: "bandpass", freq: 900 }); };
    const falar = (t, forcar) => { const ag = performance.now(); if (forcar || ag - ultFala > 2500) { ultFala = ag; Motor.falar(t); } };

    function arremessar() {
      if (bola.estado !== "mao" || fim) return;
      // timing: o centro da faixa verde é o arremesso perfeito
      const alvo = 0.82, e = (carga - alvo) / NIVEL.tol;
      bola.y = Math.max(bola.y, 2.25); // a bola sai das mãos lá em cima da cabeça, no pulo
      const bal = balanco(), mx = mira.x + bal.x, mz = mira.z + bal.z; // a bola vai para onde a mira está
      const dx = mx - bola.x, dz = mz - bola.z, d = Math.hypot(dx, dz), dh = ARO_Y - bola.y;
      const th = (d > 5.5 ? 51 : 55) * Math.PI / 180; // arco alto: a bola cai na cesta num ângulo bom (uns 45°)
      let v = Math.sqrt(G * d * d / (2 * Math.cos(th) ** 2 * (d * Math.tan(th) - dh)));
      const perfeito = Math.abs(e) < 0.35;
      const errV = perfeito ? (Math.random() - 0.5) * 0.006 : e * 0.032 * Math.min(2.2, Math.abs(e)) / Math.max(1, Math.abs(e)) + (Math.random() - 0.5) * 0.012;
      const errLado = perfeito ? (Math.random() - 0.5) * 0.004 : (Math.random() < 0.5 ? -1 : 1) * Math.min(0.05, Math.abs(e) * 0.012) + (Math.random() - 0.5) * 0.01;
      v *= 1 + errV;
      const hx = dx / d, hz = dz / d, ca = Math.cos(errLado), sa = Math.sin(errLado);
      const ax = hx * ca - hz * sa, az = hx * sa + hz * ca;
      Object.assign(bola, { vx: ax * v * Math.cos(th), vz: az * v * Math.cos(th), vy: v * Math.sin(th), estado: "voando", tempo: 0, aro: false, tabela: false, contou: false, chao: 0 });
      bola.perfeito = perfeito;
      arremessos++;
      Motor.ploc();
      if (perfeito) msg = { txt: "✨ Perfeito!", t: 1, cor: "#3cff78" };
      else msg = { txt: e < 0 ? "Soltou cedo" : "Soltou tarde", t: 1, cor: "#ffd60a" };
    }

    function fisica(dt) {
      if (bola.estado !== "voando") return;
      const N = 10, h = dt / N;
      for (let i = 0; i < N; i++) {
        const yAntes = bola.y;
        bola.vy -= G * h;
        bola.x += bola.vx * h; bola.y += bola.vy * h; bola.z += bola.vz * h;
        // aro: um anel de 45 cm; a bola bate na borda e quica
        const rh = Math.hypot(bola.x, bola.z);
        if (rh > 0.001) {
          const qx = bola.x / rh * ARO_R, qz = bola.z / rh * ARO_R;
          const ex = bola.x - qx, ey = bola.y - ARO_Y, ez = bola.z - qz, dist = Math.hypot(ex, ey, ez);
          if (dist < BOLA_R + 0.01) {
            const nx = ex / dist, ny = ey / dist, nz = ez / dist, vn = bola.vx * nx + bola.vy * ny + bola.vz * nz;
            if (vn < 0) {
              bola.vx -= 1.55 * vn * nx; bola.vy -= 1.55 * vn * ny; bola.vz -= 1.55 * vn * nz;
              bola.vx *= 0.88; bola.vy *= 0.88; bola.vz *= 0.88;
              if (!bola.aro || bola.tempo - (bola.ultAro || 0) > 0.08) somAro();
              bola.aro = true; bola.ultAro = bola.tempo;
            }
            const empurra = BOLA_R + 0.01 - dist;
            bola.x += nx * empurra; bola.y += ny * empurra; bola.z += nz * empurra;
          }
        }
        // tabela de vidro
        if (bola.z + BOLA_R > TABELA_Z && bola.z < TABELA_Z + 0.1 && Math.abs(bola.x) < 0.9 && bola.y > 2.9 && bola.y < 3.95 && bola.vz > 0) {
          bola.z = TABELA_Z - BOLA_R; bola.vz = -bola.vz * 0.6; bola.vx *= 0.9; somTabela(); bola.tabela = true;
        }
        // entrou: passou para baixo do aro por dentro dele
        if (!bola.contou && yAntes > ARO_Y && bola.y <= ARO_Y && Math.hypot(bola.x, bola.z) < ARO_R - 0.025) { bola.contou = true; cesta(); }
        // ajudinha do fácil: a bola que passa raspando é "puxada" para dentro (como o aro macio)
        if (!bola.contou && NIVEL.ajuda && bola.vy < 0 && Math.abs(bola.y - ARO_Y - 0.12) < 0.1) { const rr = Math.hypot(bola.x, bola.z); if (rr < ARO_R + NIVEL.ajuda) { bola.vx -= bola.x * 2.5 * h; bola.vz -= bola.z * 2.5 * h; } }
        // rede segura um pouquinho a bola que entrou
        if (bola.contou && bola.y > ARO_Y - 0.45 && bola.y < ARO_Y) { bola.vx *= 1 - 3 * h; bola.vz *= 1 - 3 * h; bola.vy *= 1 - 1.5 * h; }
        // chão
        if (bola.y < BOLA_R) { bola.y = BOLA_R; if (bola.vy < -1) somChao(-bola.vy); bola.vy = -bola.vy * 0.68; bola.vx *= 0.85; bola.vz *= 0.85; bola.chao = (bola.chao || 0) + 1; }
      }
      bola.giro += dt * 9;
      bola.tempo += dt;
      if (bola.tempo > (op.modo === "tres" ? 1.9 : 2.6) || (bola.chao >= 2 && bola.tempo > 1.2)) proximo();
    }
    function cesta() {
      acertos++;
      const chua = !bola.aro && !bola.tabela;
      const vale = op.modo === "tres" ? (bola.colorida ? 2 : 1) : op.modo === "lance" ? 1 : 1;
      pontos += vale;
      rede = 1; somRede(); torcida(chua || vale === 2);
      msg = { txt: chua ? "💦 CHUÁ!" : bola.tabela && !bola.aro ? "🪟 Tabela!" : "🏀 CESTA!", t: 1.6, cor: "#fff" };
      if (op.modo === "tres") { marcas[lugar].push(vale); if (bola.colorida) msg.txt += " +2"; }
      else if (op.modo === "lance") lances.push(true);
      if (op.modo !== "tres") falar(chua ? "Chuá! Nem encostou no aro!" : Motor.sortear(["Cesta!", "Boa!", "Lindo arremesso!", "Na cesta!"]));
      else if (bola.colorida) falar("Bola colorida! Dois pontos!", true);
      bola.acertou = true;
    }
    function proximo() {
      const acertou = !!bola.acertou;
      bola.acertou = false;
      if (!acertou) {
        if (op.modo === "tres") marcas[lugar].push(0);
        else if (op.modo === "lance") lances.push(false);
        if (op.modo !== "tres") falar(bola.aro ? Motor.sortear(["Bateu no aro!", "Quase! Rodou no aro.", "No aro!"]) : bola.tabela ? "Bateu na tabela!" : "Passou longe! Isso se chama air ball.");
        else if (bola.aro) Motor.ruido({ dur: 0.6, vol: 0.07, filtro: "lowpass", freq: 400 }); // "ôôô" da torcida
      }
      bola.estado = "mao"; carga = 0; carregando = false; novaMira();
      if (op.modo === "tres") {
        bolasNoLugar++;
        if (bolasNoLugar >= 5) { bolasNoLugar = 0; lugar++; if (lugar >= LUGARES.length) return terminar(); falar(`Próximo carrinho: ${NOMES_LUGAR[lugar]}!`, true); }
        bola.colorida = bolasNoLugar === 4;
      } else if (op.modo === "lance") {
        if (lances.length >= 10) return terminar();
      } else if (op.modo === "volta") {
        if (acertou) { lugar++; if (lugar >= LUGARES.length) return terminar(); falar(`Lugar ${lugar + 1} de 7!`, true); }
      }
      naMao();
    }
    function terminar() {
      fim = true;
      Motor.tim(); Motor.ruido({ dur: 1, vol: 0.12, freq: 220 }); // a buzina
      let titulo, medalha, detalhe, fala;
      if (op.modo === "tres") {
        const ganhou = pontos > adversario.pontos;
        titulo = ganhou ? "Campeão do concurso!" : pontos === adversario.pontos ? "Empate!" : "Quase lá!";
        medalha = ganhou ? "🥇" : pontos === adversario.pontos ? "🥈" : "🥉";
        detalhe = `🏀 ${pontos} pontos (de 30) · ${adversario.nome}: ${adversario.pontos}`;
        fala = `Fim do concurso! Você fez ${pontos} pontos. ${adversario.nome} fez ${adversario.pontos}. ` + (ganhou ? "Você é o campeão do concurso de três pontos!" : "Treine mais um pouco e tente de novo!");
      } else if (op.modo === "lance") {
        titulo = acertos >= 8 ? "Mão quente!" : acertos >= 5 ? "Muito bem!" : "Bom treino!";
        medalha = acertos >= 8 ? "🥇" : acertos >= 5 ? "🥈" : "🥉";
        detalhe = `🎯 ${acertos} de 10 lances livres (${acertos * 10}%)`;
        fala = `Você acertou ${acertos} de 10 lances livres!`;
      } else {
        titulo = "Volta ao mundo completa!";
        medalha = arremessos <= 9 ? "🥇" : arremessos <= 14 ? "🥈" : "🥉";
        detalhe = `🌎 7 lugares em ${arremessos} arremessos`;
        fala = `Volta ao mundo completa em ${arremessos} arremessos!`;
      }
      const chave = `basquete-rec-${op.modo}-${op.nivel}`, valor = op.modo === "volta" ? -arremessos : pontos;
      let rec = null; try { rec = localStorage.getItem(chave); } catch (e) { /* ok */ }
      const novo = rec === null || valor > +rec;
      if (novo) { try { localStorage.setItem(chave, valor); } catch (e) { /* ok */ } detalhe += " · 🏆 recorde!"; }
      Motor.falar(fala);
      torcida(true);
      setTimeout(() => {
        if (!P.vivo()) return;
        P.fim(titulo, medalha, detalhe, [
          { rotulo: "🔁 Jogar de novo", principal: true, aoClicar: () => jogo(area, op, fid) },
          { rotulo: "⚙️ Trocar o jogo", aoClicar: () => JOGOS.find(j => j.id === "basquete").iniciar(area, { id: fid }) },
        ]);
      }, 1400);
    }

    // ---------- Entradas: segurar e soltar ----------
    const bArr = P.botao("🏀<small>ARREMESSAR</small>", v => { if (v) comecar(); else soltar(); }, { segurar: true, classe: "principal" });
    P.controles.appendChild(bArr);
    const posicionar = () => { const t = Math.max(110, Math.min(150, Math.min(P.W, P.H) * 0.26)); Object.assign(bArr.style, { right: "calc(16px + env(safe-area-inset-right, 0px))", bottom: "calc(16px + env(safe-area-inset-bottom, 0px))", width: t + "px", height: t + "px", minWidth: "0", minHeight: "0", borderRadius: "50%" }); };
    posicionar(); P.aoMedir = posicionar;
    let teclaFoi = false;
    const tec = {};
    P.teclas((e, d) => {
      const k = e.key;
      if (k === " " || k === "Enter" || k === "c") { e.preventDefault(); if (d && !teclaFoi) { teclaFoi = true; comecar(); } else if (!d) { teclaFoi = false; soltar(); } }
      else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(k)) { tec[k] = d; e.preventDefault(); }
    });
    // arrastar o dedo na quadra move a mira (para os lados e para mais perto / mais longe)
    let arrasto = null;
    P.canvas.addEventListener("pointerdown", e => { arrasto = { x: e.clientX, y: e.clientY, id: e.pointerId }; try { P.canvas.setPointerCapture(e.pointerId); } catch (er) { /* ok */ } });
    P.canvas.addEventListener("pointermove", e => { if (!arrasto || e.pointerId !== arrasto.id || bola.estado !== "mao") return; moverMira((e.clientX - arrasto.x) * 0.004, -(e.clientY - arrasto.y) * 0.004); arrasto.x = e.clientX; arrasto.y = e.clientY; });
    ["pointerup", "pointercancel"].forEach(t => P.canvas.addEventListener(t, () => { arrasto = null; }));
    function moverMira(lado, frente) {
      let fx = cam.tx - cam.x, fz = cam.tz - cam.z; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
      mira.x = Math.max(-0.9, Math.min(0.9, mira.x + fz * lado + fx * frente));
      mira.z = Math.max(-0.8, Math.min(0.4, mira.z - fx * lado + fz * frente));
    }
    function comecar() { if (bola.estado === "mao" && !fim && !pausado && !carregando) { carregando = true; carga = 0; } }
    function soltar() { if (carregando) { carregando = false; arremessar(); } }

    function atualizar(dt) {
      if (op.modo === "tres" && !fim && arremessos > 0) { tempoRestante -= dt; /* o relógio começa no primeiro arremesso */ if (tempoRestante <= 0) { tempoRestante = 0; bola.estado = "fim"; return terminar(); } }
      if (bola.estado === "mao" && !fim) moverMira(((tec.ArrowRight ? 1 : 0) - (tec.ArrowLeft ? 1 : 0)) * 0.45 * dt, ((tec.ArrowUp ? 1 : 0) - (tec.ArrowDown ? 1 : 0)) * 0.45 * dt);
      if (carregando) { carga += dt / NIVEL.janela; if (carga >= 1.05) { carga = 1.05; carregando = false; arremessar(); } }
      // corpo: agacha enquanto carrega, pula e estica os braços no arremesso
      const alvoPulo = carregando ? Math.max(0, (carga - 0.35) * 1.3) : bola.estado === "voando" && bola.tempo < 0.35 ? 1 - bola.tempo / 0.35 : 0;
      pulo += (Math.min(1, alvoPulo) - pulo) * Math.min(1, dt * 10);
      const alvoBraco = carregando ? Math.min(1, carga * 1.2) : bola.estado === "voando" && bola.tempo < 0.5 ? 1 : 0;
      braco += (alvoBraco - braco) * Math.min(1, dt * 9);
      if (bola.estado === "mao") naMao();
      fisica(dt);
      rede = Math.max(0, rede - dt * 1.2);
      const alvo = alvoCamera(Math.min(lugar, LUGARES.length - 1));
      ["x", "y", "z", "tx", "ty", "tz"].forEach(k => { cam[k] += (alvo[k] - cam[k]) * Math.min(1, dt * 2.5); });
      if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
    }

    // ---------- Torcida pronta (desenhada uma vez) ----------
    const arquibancada = (() => {
      const cv = document.createElement("canvas"); cv.width = 1200; cv.height = 420;
      const c = cv.getContext("2d");
      const g = c.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, "#0e1424"); g.addColorStop(1, "#1d2740");
      c.fillStyle = g; c.fillRect(0, 0, 1200, 420);
      for (let r = 0; r < 14; r++) {
        const y = 40 + r * 26;
        c.fillStyle = r % 2 ? "#253150" : "#2b3a5e"; c.fillRect(0, y + 14, 1200, 12);
        for (let x = 8 + (r % 2) * 6; x < 1200; x += 13) {
          if (Math.random() < 0.08) continue;
          c.fillStyle = Motor.sortear(["#e63946", "#ffd60a", "#2f80ed", "#2a9d55", "#fff", "#f77f00", cor, cor]); c.fillRect(x - 4, y + 4, 9, 11);
          c.fillStyle = Motor.sortear(["#f1c27d", "#c68642", "#8d5524", "#ffdbac"]); c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill();
        }
      }
      // placar grande e as faixas de LED
      c.fillStyle = "#000"; c.fillRect(470, 0, 260, 34); c.fillStyle = "#ffd60a"; c.font = "bold 22px sans-serif"; c.textAlign = "center"; c.fillText("🏀 BASQUETE 🏀", 600, 25);
      c.fillStyle = "#111"; c.fillRect(0, 392, 1200, 28); c.fillStyle = cor; c.fillRect(0, 396, 1200, 6);
      return cv;
    })();

    // ---------- Desenho ----------
    function linhaMundo(pts, corL, lw) {
      ctx.strokeStyle = corL; ctx.lineWidth = lw; ctx.beginPath(); let on = false;
      pts.forEach(([x, y, z]) => { const p = proj(x, y, z); if (!p) { on = false; return; } on ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); on = true; });
      ctx.stroke();
    }
    function poliMundo(pts, corF) {
      const q = pts.map(([x, y, z]) => proj(x, y, z));
      if (q.some(p => !p)) return;
      ctx.fillStyle = corF; ctx.beginPath(); q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill();
    }
    function desenhar() {
      const W = P.W, H = P.H, s = P.esc();
      F = Math.min(W * 1.4, H * 1.3); // celular em pé: aproxima mais (a cesta não fica pequenininha)
      ctx.fillStyle = "#0e1424"; ctx.fillRect(0, 0, W, H);
      // a torcida em volta da quadra: uma faixa até a linha do horizonte (de qualquer lugar dá para ver)
      let fx = cam.tx - cam.x, fz = cam.tz - cam.z; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
      const hz = proj(cam.x + fx * 40, 0, cam.z + fz * 40), yh = hz ? hz[1] : H * 0.55;
      const giro = Math.atan2(fx, fz), larg = W * 1.6, off = ((giro / (Math.PI * 2)) * larg * 3) % larg;
      for (let x = -off - larg; x < W; x += larg) ctx.drawImage(arquibancada, x, yh - H * 0.62, larg, H * 0.62);
      const gl = ctx.createLinearGradient(0, 0, 0, yh - H * 0.5); gl.addColorStop(0, "rgba(255,255,230,.25)"); gl.addColorStop(1, "rgba(255,255,230,0)");
      ctx.fillStyle = gl; ctx.fillRect(0, 0, W, Math.max(0, yh - H * 0.5)); // luz dos refletores
      // chão de madeira, faixas das tábuas, área fora da quadra mais escura
      for (let z = -13; z < 7.5; z += 1) for (let x = -10; x < 10; x += 1) {
        const fora = Math.abs(x + 0.5) > 7.5 || z + 0.5 > LINHA_FUNDO;
        const tom = fora ? "#5a3b22" : ((Math.floor(x * 2) & 1) ? "#d9a066" : "#cf9558");
        poliMundo([[x, 0, z], [x + 1, 0, z], [x + 1, 0, z + 1], [x, 0, z + 1]], tom);
      }
      // garrafão pintado
      poliMundo([[-2.45, 0, LINHA_FUNDO], [2.45, 0, LINHA_FUNDO], [2.45, 0, LINHA_FUNDO - 5.8], [-2.45, 0, LINHA_FUNDO - 5.8]], cor + "cc");
      // linhas: fundo, laterais, garrafão, lance livre, círculo, três pontos
      const B = "rgba(255,255,255,.95)", lw = Math.max(1.5, 2.5 * s);
      linhaMundo([[-7.5, 0, LINHA_FUNDO], [7.5, 0, LINHA_FUNDO]], B, lw);
      linhaMundo([[-7.5, 0, LINHA_FUNDO], [-7.5, 0, -13]], B, lw); linhaMundo([[7.5, 0, LINHA_FUNDO], [7.5, 0, -13]], B, lw);
      linhaMundo([[-2.45, 0, LINHA_FUNDO], [-2.45, 0, LINHA_FUNDO - 5.8], [2.45, 0, LINHA_FUNDO - 5.8], [2.45, 0, LINHA_FUNDO]], B, lw);
      const circ = []; for (let k = 0; k <= 40; k++) { const t = k / 40 * Math.PI * 2; circ.push([Math.cos(t) * 1.8, 0, LINHA_FUNDO - 5.8 + Math.sin(t) * 1.8]); }
      linhaMundo(circ, B, lw);
      const z3 = -Math.sqrt(6.75 * 6.75 - 6.6 * 6.6), arco = [[-6.6, 0, LINHA_FUNDO], [-6.6, 0, z3]];
      for (let k = 0; k <= 60; k++) { const t = Math.atan2(z3, -6.6) + (k / 60) * (Math.atan2(z3, 6.6) - Math.atan2(z3, -6.6) + (Math.atan2(z3, 6.6) < Math.atan2(z3, -6.6) ? Math.PI * 2 : 0)); arco.push([Math.cos(t) * 6.75, 0, Math.sin(t) * 6.75]); }
      arco.push([6.6, 0, z3], [6.6, 0, LINHA_FUNDO]);
      linhaMundo(arco, B, lw);
      // poste acolchoado atrás da tabela
      poliMundo([[-0.3, 0, 2.4], [0.3, 0, 2.4], [0.3, 3.6, 2.4], [-0.3, 3.6, 2.4]], "#1d3557");
      poliMundo([[-0.1, 3.5, 0.45], [0.1, 3.5, 0.45], [0.1, 3.6, 2.4], [-0.1, 3.6, 2.4]], "#2b3a55");
      // tabela de vidro com o quadrado e o relógio de 24 segundos em cima
      poliMundo([[-0.9, 2.9, TABELA_Z], [0.9, 2.9, TABELA_Z], [0.9, 3.95, TABELA_Z], [-0.9, 3.95, TABELA_Z]], "rgba(210,230,245,.28)");
      linhaMundo([[-0.9, 2.9, TABELA_Z], [0.9, 2.9, TABELA_Z], [0.9, 3.95, TABELA_Z], [-0.9, 3.95, TABELA_Z], [-0.9, 2.9, TABELA_Z]], "#fff", Math.max(2, 4 * s));
      linhaMundo([[-0.295, ARO_Y, TABELA_Z], [-0.295, ARO_Y + 0.45, TABELA_Z], [0.295, ARO_Y + 0.45, TABELA_Z], [0.295, ARO_Y, TABELA_Z]], "#e63946", Math.max(2, 3 * s));
      poliMundo([[-0.4, 4.0, TABELA_Z + 0.05], [0.4, 4.0, TABELA_Z + 0.05], [0.4, 4.3, TABELA_Z + 0.05], [-0.4, 4.3, TABELA_Z + 0.05]], "#111");
      const pr = proj(0, 4.15, TABELA_Z);
      if (pr) Palco.texto(ctx, op.modo === "tres" ? String(Math.ceil(tempoRestante)) : "24", pr[0], pr[1], Math.max(10, pr[2] * 0.25), "#ff3b30", { contorno: null });
      // aro, rede e a bola (quem está mais perto da câmera é desenhado por último)
      const pa = proj(0, ARO_Y, 0), pb = proj(bola.x, bola.y, bola.z);
      const naMaoAgora = bola.estado === "mao";
      const bolaNaFrente = pb && pa && pb[3] < pa[3];
      if (!naMaoAgora && !bolaNaFrente) desenharBola(pb, s);
      desenharAroERede(s);
      if (!naMaoAgora && bolaNaFrente) desenharBola(pb, s);
      if (naMaoAgora && !fim) desenharMira(s);
      desenharJogador(s, naMaoAgora ? pb : null);
      painel(W, H, s);
    }
    // A mira: um anel no plano do aro (verde no meio, amarelo quase, vermelho fora) e a linha até o chão
    function desenharMira(s) {
      const bal = balanco(), ax = mira.x + bal.x, az = mira.z + bal.z, dc = Math.hypot(ax, az);
      const corM = dc < 0.07 ? "#3cff78" : dc < 0.16 ? "#ffd60a" : "#ff4d4d";
      const anel = []; for (let k = 0; k <= 24; k++) { const t = k / 24 * Math.PI * 2; anel.push([ax + Math.cos(t) * 0.11, ARO_Y + 0.01, az + Math.sin(t) * 0.11]); }
      linhaMundo(anel, "rgba(0,0,0,.5)", Math.max(3, 6 * s));
      linhaMundo(anel, corM, Math.max(2, 3.5 * s));
      linhaMundo([[ax - 0.17, ARO_Y + 0.01, az], [ax + 0.17, ARO_Y + 0.01, az]], corM, Math.max(1.5, 2 * s));
      linhaMundo([[ax, ARO_Y + 0.01, az - 0.17], [ax, ARO_Y + 0.01, az + 0.17]], corM, Math.max(1.5, 2 * s));
      const c = proj(ax, ARO_Y + 0.01, az);
      if (c) { ctx.fillStyle = corM; ctx.beginPath(); ctx.arc(c[0], c[1], Math.max(3, 4 * s), 0, 7); ctx.fill(); }
      const ch = proj(ax, 0.01, az);
      if (c && ch) { ctx.setLineDash([5, 6]); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(ch[0], ch[1]); ctx.stroke(); ctx.setLineDash([]); }
    }
    function desenharAroERede(s) {
      // a rede: 12 fios em zigue-zague até o anel de baixo, balançando quando a bola entra
      const sw = rede > 0 ? Math.sin(rede * 18) * 0.05 * rede : 0;
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = Math.max(1, 1.4 * s);
      for (let i = 0; i < 12; i++) {
        const t1 = i / 12 * Math.PI * 2, t2 = (i + 0.5) / 12 * Math.PI * 2, t3 = (i + 1) / 12 * Math.PI * 2;
        const top = [Math.cos(t1) * ARO_R, ARO_Y, Math.sin(t1) * ARO_R];
        const mid = [Math.cos(t2) * 0.19 * (1 + sw), ARO_Y - 0.22, Math.sin(t2) * 0.19 * (1 + sw)];
        const top2 = [Math.cos(t3) * ARO_R, ARO_Y, Math.sin(t3) * ARO_R];
        const bot = [Math.cos(t1) * 0.14 * (1 - sw), ARO_Y - 0.45 + sw * 0.8, Math.sin(t1) * 0.14 * (1 - sw)];
        linhaMundo([top, mid, top2], "rgba(255,255,255,.85)", Math.max(1, 1.3 * s));
        linhaMundo([mid, bot], "rgba(255,255,255,.75)", Math.max(1, 1.2 * s));
      }
      // suporte do aro na tabela e o aro laranja
      poliMundo([[-0.08, ARO_Y, TABELA_Z], [0.08, ARO_Y, TABELA_Z], [0.06, ARO_Y, ARO_R], [-0.06, ARO_Y, ARO_R]], "#c95f0f");
      const aro = []; for (let k = 0; k <= 32; k++) { const t = k / 32 * Math.PI * 2; aro.push([Math.cos(t) * ARO_R, ARO_Y, Math.sin(t) * ARO_R]); }
      linhaMundo(aro, "#f77f00", Math.max(2.5, 5 * s));
    }
    function desenharBola(p, s) {
      if (!p) return;
      const r = BOLA_R * p[2];
      // sombra no chão
      const ps = proj(bola.x, 0.01, bola.z);
      if (ps) { ctx.fillStyle = `rgba(0,0,0,${Math.max(0.08, 0.35 - bola.y * 0.06)})`; ctx.beginPath(); ctx.ellipse(ps[0], ps[1], BOLA_R * ps[2] * 1.1, BOLA_R * ps[2] * 0.35, 0, 0, 7); ctx.fill(); }
      const g = ctx.createRadialGradient(p[0] - r * 0.35, p[1] - r * 0.35, r * 0.1, p[0], p[1], r);
      if (bola.colorida && op.modo === "tres") { g.addColorStop(0, "#fff"); g.addColorStop(0.5, "#ff5e7e"); g.addColorStop(1, "#2f4cc4"); }
      else { g.addColorStop(0, "#ffb26b"); g.addColorStop(0.6, "#e8731f"); g.addColorStop(1, "#8a3b08"); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
      // gomos da bola girando
      ctx.save(); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.clip();
      ctx.strokeStyle = "rgba(40,15,0,.85)"; ctx.lineWidth = Math.max(1, r * 0.08);
      ctx.translate(p[0], p[1]); ctx.rotate(bola.giro);
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.9, 0, r * 0.55, r, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(r * 0.9, 0, r * 0.55, r, 0, Math.PI / 2, Math.PI * 1.5); ctx.stroke();
      ctx.restore();
    }
    // O jogador visto de costas: tênis, meião, short e regata do time com o nome e o número 10;
    // agacha para carregar, pula e estica os braços com a bola, e o punho "quebra" no final
    function desenharJogador(s, pBola) {
      const [sx, sz] = LUGARES[Math.min(lugar, LUGARES.length - 1)], d = Math.hypot(sx, sz);
      const fx = sx + sx / d * 0.15, fz = sz + sz / d * 0.15;
      const pe = proj(fx, pulo * 0.45, fz), cab = proj(fx, 1.85 + pulo * 0.45, fz);
      if (!pe || !cab) return;
      const k = pe[2], X = pe[0], agacha = carregando ? Math.min(1, carga * 1.4) * 0.12 * (1 - pulo) : 0;
      const Y = pe[1] - agacha * k * 0.4, m = (Y - cab[1] - agacha * k * 0.6) / 1.85;
      const pele = "#c68642", peleSombra = "#a86f35";
      const sh = proj(fx, 0.01, fz);
      if (sh) { ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(sh[0], sh[1], 0.35 * k, 0.1 * k, 0, 0, 7); ctx.fill(); }
      // pernas (dobradas quando agacha), meião e tênis
      [-1, 1].forEach(l => {
        const x = X + l * 0.12 * m, joelho = agacha * 0.25;
        ctx.strokeStyle = pele; ctx.lineWidth = 0.11 * m; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x, Y - 0.85 * m); ctx.lineTo(x + l * joelho * 0.3 * m, Y - 0.48 * m); ctx.lineTo(x, Y - 0.2 * m); ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.fillRect(x - 0.06 * m, Y - 0.3 * m, 0.12 * m, 0.2 * m);
        ctx.fillStyle = "#1b1b1f"; ctx.beginPath(); ctx.roundRect(x - 0.08 * m, Y - 0.1 * m, 0.16 * m, 0.1 * m, 0.03 * m); ctx.fill();
      });
      // short e regata com o nome e o número
      ctx.fillStyle = cor; ctx.beginPath(); ctx.roundRect(X - 0.24 * m, Y - 1.1 * m, 0.48 * m, 0.33 * m, 0.05 * m); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(X - 0.24 * m, Y - 0.8 * m, 0.48 * m, 0.03 * m);
      ctx.fillStyle = cor; ctx.beginPath(); ctx.moveTo(X - 0.24 * m, Y - 1.05 * m); ctx.lineTo(X - 0.26 * m, Y - 1.5 * m); ctx.lineTo(X - 0.16 * m, Y - 1.58 * m); ctx.quadraticCurveTo(X, Y - 1.5 * m, X + 0.16 * m, Y - 1.58 * m); ctx.lineTo(X + 0.26 * m, Y - 1.5 * m); ctx.lineTo(X + 0.24 * m, Y - 1.05 * m); ctx.fill();
      ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.max(8, 0.07 * m)}px Fredoka, sans-serif`; ctx.fillText(nome.toUpperCase(), X, Y - 1.44 * m, 0.42 * m);
      ctx.font = `bold ${Math.max(10, 0.2 * m)}px Fredoka, sans-serif`; ctx.fillText("10", X, Y - 1.27 * m);
      const ombroY = Y - 1.5 * m, ombros = [X - 0.22 * m, X + 0.22 * m];
      const bracoAte = (ox, hx, hy) => {
        ctx.strokeStyle = pele; ctx.lineWidth = 0.09 * m; ctx.lineCap = "round";
        const cx = (ox + hx) / 2 + (hx > ox ? 0.06 : -0.06) * m, cy = (ombroY + hy) / 2 + 0.08 * m;
        ctx.beginPath(); ctx.moveTo(ox, ombroY + 0.03 * m); ctx.quadraticCurveTo(cx, cy, hx, hy); ctx.stroke();
      };
      const mao = (hx, hy, ang) => { ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang); ctx.fillStyle = pele; ctx.beginPath(); ctx.ellipse(0, 0, 0.045 * m, 0.07 * m, 0, 0, 7); ctx.fill(); ctx.fillStyle = peleSombra; ctx.fillRect(-0.04 * m, -0.075 * m, 0.08 * m, 0.03 * m); ctx.restore(); };
      const cabeca = () => {
        ctx.fillStyle = pele; ctx.fillRect(X - 0.05 * m, Y - 1.66 * m, 0.1 * m, 0.1 * m);
        ctx.fillStyle = "#2b1a0e"; ctx.beginPath(); ctx.arc(X, Y - 1.76 * m, 0.12 * m, 0, 7); ctx.fill();
        ctx.fillStyle = pele; [-1, 1].forEach(l => { ctx.beginPath(); ctx.arc(X + l * 0.12 * m, Y - 1.74 * m, 0.03 * m, 0, 7); ctx.fill(); });
      };
      if (!pBola) {
        // já arremessou: braços esticados lá em cima e o punho caído (o "pescoço de cisne" do arremesso)
        cabeca();
        const alto = braco;
        [-1, 1].forEach((l, i) => { const hx = X + l * (0.25 - 0.14 * alto) * m, hy = ombroY + (0.55 - 1.1 * alto) * m; bracoAte(ombros[i], hx, hy); mao(hx, hy - 0.03 * m, l * 0.3 + (alto > 0.5 ? Math.PI : 0)); });
        return;
      }
      const r = BOLA_R * pBola[2], segurando = carregando || braco >= 0.12;
      if (segurando) {
        // bola nas duas mãos: a cabeça fica na frente da parte de baixo da bola quando ela está no alto
        const alto = pBola[1] < Y - 1.7 * m;
        if (!alto) cabeca();
        desenharBola(pBola, s);
        if (alto) cabeca();
        [-1, 1].forEach((l, i) => { const hx = pBola[0] + l * r * 0.92, hy = pBola[1] + r * 0.15; bracoAte(ombros[i], hx, hy); mao(hx, hy, l * 0.35); });
      } else {
        // quicando: a mão direita empurra a bola de cima; a esquerda fica do lado do corpo
        cabeca();
        bracoAte(ombros[0], X - 0.3 * m, ombroY + 0.62 * m); mao(X - 0.3 * m, ombroY + 0.66 * m, 0);
        desenharBola(pBola, s);
        const hy = Math.min(pBola[1] - r * 1.05, ombroY + 0.75 * m);
        bracoAte(ombros[1], pBola[0], hy); mao(pBola[0], hy, Math.PI / 2);
      }
    }
    function painel(W, H, s) {
      const x0 = 70, y0 = 8, pw = 230 * s, ph = 74 * s;
      Palco.caixa(ctx, x0, y0, pw, ph, 14);
      const titulo = op.modo === "tres" ? "CONCURSO DE 3 PONTOS" : op.modo === "lance" ? "LANCE LIVRE" : "VOLTA AO MUNDO";
      Palco.texto(ctx, titulo, x0 + 12 * s, y0 + 16 * s, 12 * s, "rgba(255,255,255,.7)", { alinhar: "left", contorno: null });
      if (op.modo === "tres") {
        Palco.texto(ctx, `🏀 ${pontos}   ⏱️ ${Math.ceil(tempoRestante)}s`, x0 + 12 * s, y0 + 40 * s, 22 * s, "#fff", { alinhar: "left", contorno: null });
        Palco.texto(ctx, `🤖 ${adversario.nome}: ${adversario.pontos}`, x0 + 12 * s, y0 + 62 * s, 13 * s, pontos > adversario.pontos ? "#3cff78" : "#ffd60a", { alinhar: "left", contorno: null });
        // os 5 carrinhos: bolinha verde (entrou), vermelha (errou), colorida (vale 2)
        const by = y0 + ph + 8 * s;
        Palco.caixa(ctx, x0, by, pw, 26 * s, 10);
        LUGARES.forEach((_, r) => { for (let b = 0; b < 5; b++) { const v = marcas[r][b], x = x0 + 12 * s + r * (pw - 20 * s) / 5 + b * 7.5 * s, y = by + 13 * s; ctx.fillStyle = v === undefined ? (b === 4 ? "rgba(255,120,160,.5)" : "rgba(255,255,255,.25)") : v ? (b === 4 ? "#ff5e7e" : "#3cff78") : "#ff4d4d"; ctx.beginPath(); ctx.arc(x, y, (r === lugar && b === bolasNoLugar ? 3.6 : 2.8) * s, 0, 7); ctx.fill(); } });
      } else if (op.modo === "lance") {
        Palco.texto(ctx, `🎯 ${acertos} de ${lances.length}`, x0 + 12 * s, y0 + 42 * s, 22 * s, "#fff", { alinhar: "left", contorno: null });
        for (let i = 0; i < 10; i++) { const v = lances[i]; ctx.fillStyle = v === undefined ? "rgba(255,255,255,.25)" : v ? "#3cff78" : "#ff4d4d"; ctx.beginPath(); ctx.arc(x0 + 16 * s + i * 20 * s, y0 + 62 * s, 6 * s, 0, 7); ctx.fill(); }
      } else {
        Palco.texto(ctx, `🌎 Lugar ${Math.min(7, lugar + 1)} de 7 · ${arremessos} arremessos`, x0 + 12 * s, y0 + 42 * s, 16 * s, "#fff", { alinhar: "left", contorno: null });
        for (let i = 0; i < 7; i++) { ctx.fillStyle = i < lugar ? "#3cff78" : i === lugar ? "#ffd60a" : "rgba(255,255,255,.25)"; ctx.beginPath(); ctx.arc(x0 + 16 * s + i * 22 * s, y0 + 62 * s, 7 * s, 0, 7); ctx.fill(); }
      }
      // barra do arremesso ao lado do jogador, com a faixa verde
      if (bola.estado === "mao" && !fim) {
        const bh = Math.min(H * 0.4, 220 * s), bw = 22 * s, bx = W * 0.5 + Math.min(W * 0.22, 160 * s), byy = H * 0.5 - bh / 2;
        Palco.caixa(ctx, bx - 4, byy - 4, bw + 8, bh + 8, 10);
        ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(bx, byy, bw, bh);
        const g0 = 0.82 - NIVEL.tol * 0.35, g1 = 0.82 + NIVEL.tol * 0.35;
        ctx.fillStyle = "rgba(60,255,120,.75)"; ctx.fillRect(bx, byy + bh * (1 - g1), bw, bh * (g1 - g0));
        ctx.fillStyle = "rgba(255,214,10,.35)"; ctx.fillRect(bx, byy + bh * (1 - 0.82 - NIVEL.tol), bw, bh * NIVEL.tol * 2);
        const c = Math.min(1, carga);
        ctx.fillStyle = c > g1 ? "#ff6b6b" : c > g0 ? "#3cff78" : "#fff"; ctx.fillRect(bx, byy + bh * (1 - c), bw, bh * c);
        ctx.fillStyle = "#fff"; ctx.fillRect(bx - 6, byy + bh * (1 - c) - 2, bw + 12, 4);
        if (!carregando) {
          const bal = balanco(), dc = Math.hypot(mira.x + bal.x, mira.z + bal.z);
          Palco.texto(ctx, dc < 0.07 ? "🎯 Mira no meio! Segure e solte no verde" : "👆 Arraste a mira para o meio do aro", W / 2, H * 0.86, Math.min(20 * s, W / 24), dc < 0.07 ? "#3cff78" : "#fff");
        }
      }
      if (msg) Palco.texto(ctx, msg.txt, W / 2, H * 0.22, Math.min(46 * s, W / 11), msg.cor || "#fff");
      if (pausado) Palco.texto(ctx, "⏸️ Pausa", W / 2, H / 2, 54 * s);
    }

    if (window.BASQUETE_TESTE) window.BASQUETE_TESTE = { estado: () => ({ pontos, acertos, arremessos, lugar, fim, bola: bola.estado, b: [bola.x, bola.y, bola.z].map(v => +v.toFixed(2)) }), chutar: c => { carga = c; arremessar(); }, mirar: (x, z) => { mira.x = x; mira.z = z; }, segurar: v => { if (v) comecar(); else soltar(); } };
    P.rodar(dt => { if (!pausado) atualizar(dt); desenhar(); });
    const falas = {
      lance: "Lance livre! A cesta fica a três metros e cinco centímetros do chão, e a linha do lance livre fica a quatro metros e vinte e cinco centímetros dela. Cada cesta vale um ponto. Segure o botão, o jogador pula, e solte quando a barra chegar na faixa verde!",
      tres: `Concurso de três pontos! São cinco carrinhos com cinco bolas em volta da linha de três, que fica a seis metros e setenta e cinco centímetros da cesta. Cada bola vale um ponto, e a última de cada carrinho, a colorida, vale dois. ${adversario ? `${adversario.nome} fez ${adversario.pontos} pontos. Consegue passar?` : ""} Valendo!`,
      volta: "Volta ao mundo! São sete lugares em volta do garrafão. Acertou, passa para o próximo. Segure o botão e solte quando a barra chegar no verde!",
    };
    Motor.falar(falas[op.modo] || falas.lance);
  }
})();
