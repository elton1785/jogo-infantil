// Personagens do jogo de corrida (jogos/corredor.js), desenhados no canvas com animação de
// corrida de verdade: cada pé faz um ciclo (apoia no chão e vai para trás, levanta e volta para
// a frente) e o joelho é calculado (cinemática inversa de 2 segmentos). Todos são bichos
// originais, sem personagens de marca registrada.
//
// desenhar(ctx, s): origem no chão, no meio do personagem, olhando para a direita, y para cima
// é negativo. Cabem em ~46 × 46 unidades (a caixa de colisão do jogo), cauda pode sobrar atrás.
// s = { fi (fase da passada, rad), correndo, noAr, abaixado, morto, t (segundos), piscando }
const CORREDORES = (() => {
  // ---------- Ajudantes de desenho ----------
  function traco(ctx, x1, y1, x2, y2, w, cor) {
    ctx.strokeStyle = cor; ctx.lineWidth = w; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function elipse(ctx, x, y, rx, ry, cor, rot = 0, contorno, lw = 1.2) {
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
    ctx.fillStyle = cor; ctx.fill();
    if (contorno) { ctx.strokeStyle = contorno; ctx.lineWidth = lw; ctx.stroke(); }
  }
  // Joelho entre o quadril (hx, hy) e o pé (fx, fy). dobra +1: joelho para a frente; -1: para trás
  function joelho(hx, hy, fx, fy, l1, l2, dobra) {
    const dx = fx - hx, dy = fy - hy;
    const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(Math.hypot(dx, dy), l1 + l2 - 0.01));
    const a = Math.atan2(dy, dx), b = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
    const ang = a - dobra * b;
    return [hx + Math.cos(ang) * l1, hy + Math.sin(ang) * l1, hx + Math.cos(a) * d, hy + Math.sin(a) * d];
  }
  // Onde fica o pé: no ar (encolhido), parado ou no ciclo da corrida
  function pe(s, hx, hy, { l1, l2, passo, ergue, fase = 0, frente = 0 }) {
    if (s.noAr) return [hx + (fase % (2 * Math.PI) < Math.PI ? 4 : -3) + frente, hy + (l1 + l2) * 0.66];
    if (!s.correndo || s.morto) return [hx + frente + (fase ? -2 : 2), 0];
    const f = s.fi + fase, sn = Math.sin(f);
    return [hx + frente - passo * Math.cos(f), sn > 0 ? -ergue * sn : 0];
  }
  // Perna inteira: coxa, canela e pé (pata). Devolve a posição do pé.
  function perna(ctx, s, hx, hy, o) {
    const [fx, fy] = pe(s, hx, hy, o);
    const [kx, ky, px, py] = joelho(hx, hy, fx, fy, o.l1, o.l2, o.dobra);
    traco(ctx, hx, hy, kx, ky, o.w1, o.cor);
    traco(ctx, kx, ky, px, py, o.w2, o.cor);
    if (o.pata) o.pata(px, py);
    else elipse(ctx, px + 1.5, py - 1, o.w2 * 0.75, o.w2 * 0.45, o.cor);
    return [px, py];
  }
  // Olho com brilho; morto = ✕; piscando = risquinho
  function olho(ctx, s, x, y, r, { iris = "#2b1a0e", pupilaVertical = false } = {}) {
    if (s.morto) {
      traco(ctx, x - r, y - r, x + r, y + r, 1.3, "#222"); traco(ctx, x - r, y + r, x + r, y - r, 1.3, "#222");
      return;
    }
    if (s.piscando) { traco(ctx, x - r, y, x + r, y, 1.2, "#222"); return; }
    elipse(ctx, x, y, r, r, "#fff", 0, "#222", 0.6);
    if (pupilaVertical) { elipse(ctx, x + r * 0.2, y, r * 0.7, r * 0.7, iris); elipse(ctx, x + r * 0.25, y, r * 0.22, r * 0.6, "#111"); }
    else elipse(ctx, x + r * 0.25, y, r * 0.6, r * 0.6, iris);
    elipse(ctx, x + r * 0.45, y - r * 0.35, r * 0.25, r * 0.25, "#fff");
  }
  const grad = (ctx, y1, y2, c1, c2) => { const g = ctx.createLinearGradient(0, y1, 0, y2); g.addColorStop(0, c1); g.addColorStop(1, c2); return g; };

  // Membro "musculoso": passa pelos pontos [[x, y], ...] afinando de largura (ws), com contorno
  function membro(ctx, pts, ws, cor, contorno) {
    const pedaco = (extra, c) => {
      ctx.fillStyle = c;
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const dx = x1 - x0, dy = y1 - y0, n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
        const a = ws[i] / 2 + extra, b = ws[i + 1] / 2 + extra;
        ctx.beginPath();
        ctx.moveTo(x0 + nx * a, y0 + ny * a); ctx.lineTo(x1 + nx * b, y1 + ny * b);
        ctx.lineTo(x1 - nx * b, y1 - ny * b); ctx.lineTo(x0 - nx * a, y0 - ny * a); ctx.closePath(); ctx.fill();
      }
      pts.forEach(([x, y], i) => { ctx.beginPath(); ctx.arc(x, y, ws[i] / 2 + extra, 0, Math.PI * 2); ctx.fill(); });
    };
    if (contorno) pedaco(0.7, contorno);
    pedaco(0, cor);
  }
  // Perna de 2 segmentos (coxa e canela) com o pé no ciclo da corrida; devolve [joelho, pé]
  function pernaCheia(ctx, s, hx, hy, o) {
    const [fx, fy] = pe(s, hx, hy, o);
    const [kx, ky, px, py] = joelho(hx, hy, fx, fy, o.l1, o.l2, o.dobra);
    membro(ctx, [[hx, hy], [kx, ky], [px, py]], o.ws, o.cor, o.contorno);
    if (o.pata) o.pata(px, py);
    return [[kx, ky], [px, py]];
  }

  // ---------- 🦖 Dino (tiranossauro, com o corpo na horizontal como os de verdade) ----------
  function dino(ctx, s) {
    ctx.save();
    ctx.translate(-4, 0); // a cabeça grande fica dentro da caixa de colisão
    desenharDino(ctx, s);
    ctx.restore();
  }
  function desenharDino(ctx, s) {
    const k = s.abaixado ? 0.66 : 1;
    const anda = s.correndo && !s.noAr && !s.morto;
    const bob = anda ? Math.abs(Math.sin(s.fi)) * 1.5 : 0;
    const Y = v => v * k - bob;
    const pele = "#6b8f3e", costas = "#4e6e2b", barriga = "#d8d29a", contorno = "#2f4419";
    const balanco = anda ? Math.sin(s.fi) * 1.5 : Math.sin(s.t * 2) * 0.6;
    const cabeca = s.abaixado ? 3 : anda ? Math.sin(s.fi * 2) * 0.8 : 0;
    const quadril = [-5, Y(-25)];
    // Pé apoiado: os dedos vão para a frente do tornozelo (pernas de ave)
    const perna = (fase, cor) => {
      const [fx, fy] = pe(s, quadril[0], quadril[1], { l1: 12, l2: 11, passo: 8, ergue: 7, fase });
      const tornozelo = [fx - 2.5, fy - 5];
      const [kx, ky, ax, ay] = joelho(quadril[0], quadril[1], tornozelo[0], tornozelo[1], 12, 11, 1);
      membro(ctx, [quadril, [kx, ky], [ax, ay], [ax + 5, ay + 4.5]], [11, 6, 3.6, 2.6], cor, contorno);
      ctx.fillStyle = "#e8e4c8";
      [[ax + 6.5, ay + 5], [ax + 4.6, ay + 5.4]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, y - 1); ctx.lineTo(x + 1.6, y); ctx.lineTo(x, y + 0.6); ctx.fill(); });
    };
    perna(Math.PI, costas);
    // Corpo + cauda numa silhueta só
    ctx.beginPath();
    ctx.moveTo(-36, Y(-30) + balanco);                                   // ponta da cauda
    ctx.bezierCurveTo(-26, Y(-35), -16, Y(-38), -4, Y(-38));            // em cima da cauda até o quadril
    ctx.bezierCurveTo(4, Y(-38), 9, Y(-37), 13, Y(-35) + cabeca);       // costas até o pescoço
    ctx.lineTo(14, Y(-27) + cabeca);                                    // garganta
    ctx.bezierCurveTo(10, Y(-23), 6, Y(-19), -2, Y(-19));               // peito e barriga
    ctx.bezierCurveTo(-10, Y(-19), -18, Y(-25), -36, Y(-29) + balanco); // embaixo da cauda
    ctx.closePath();
    ctx.fillStyle = grad(ctx, Y(-39), Y(-19), "#7a9f48", "#5c7d34"); ctx.fill();
    ctx.strokeStyle = contorno; ctx.lineWidth = 1.1; ctx.stroke();
    // Barriga clara e listras nas costas
    ctx.save(); ctx.clip();
    elipse(ctx, 0, Y(-19), 13, 4.5, barriga, -0.1);
    ctx.fillStyle = costas;
    [-24, -17, -10, -3, 4].forEach((x, i) => { ctx.beginPath(); ctx.moveTo(x, Y(-40)); ctx.lineTo(x + 3, Y(-40)); ctx.lineTo(x + 1.5 - i * 0.2, Y(-31)); ctx.closePath(); ctx.fill(); });
    ctx.restore();
    // Bracinho
    const braco = anda ? Math.sin(s.fi + Math.PI) * 0.4 : 0.2;
    membro(ctx, [[8, Y(-27)], [10 + braco, Y(-23)], [13, Y(-23.5)]], [3, 2, 1.4], "#5c7d34", contorno);
    // Cabeça grande: crânio, focinho e mandíbula
    const cx = 12, cy = Y(-37) + cabeca;
    ctx.beginPath();
    ctx.moveTo(cx - 1, cy - 3);
    ctx.bezierCurveTo(cx + 2, cy - 7.5, cx + 10, cy - 7, cx + 17, cy - 4.5); // crânio
    ctx.quadraticCurveTo(cx + 20, cy - 3, cx + 19.5, cy);                      // focinho
    ctx.lineTo(cx + 18.5, cy + 2.2);
    ctx.quadraticCurveTo(cx + 11, cy + 2.6, cx + 5, cy + 2);                   // linha da boca
    ctx.quadraticCurveTo(cx + 11, cy + 6.5, cx + 3, cy + 7.5);                 // mandíbula
    ctx.quadraticCurveTo(cx - 2, cy + 6, cx - 1, cy - 3);
    ctx.fillStyle = grad(ctx, cy - 7, cy + 7, "#7fa54d", "#5f8238"); ctx.fill();
    ctx.strokeStyle = contorno; ctx.lineWidth = 1.1; ctx.stroke();
    // Dentes na linha da boca
    ctx.fillStyle = "#f4f1df";
    [6.5, 9.5, 12.5, 15.5].forEach(x => { ctx.beginPath(); ctx.moveTo(cx + x, cy + 2.1); ctx.lineTo(cx + x + 0.9, cy + 3.6); ctx.lineTo(cx + x + 1.8, cy + 2.2); ctx.fill(); });
    ctx.beginPath(); ctx.moveTo(cx + 5, cy + 2); ctx.quadraticCurveTo(cx + 11, cy + 2.6, cx + 18.5, cy + 2.2);
    ctx.strokeStyle = contorno; ctx.lineWidth = 0.9; ctx.stroke();
    elipse(ctx, cx + 17.6, cy - 2.6, 0.9, 0.6, contorno); // narina
    // Olho com sobrancelha de osso
    traco(ctx, cx + 4.5, cy - 5, cx + 9.5, cy - 5.6, 1.8, costas);
    olho(ctx, s, cx + 7.4, cy - 2.6, 1.9, { iris: "#d9861c" });
    perna(0, pele);
  }

  // ---------- Quadrúpedes desenhados (onça e caramelo) ----------
  // Patas com coxa grossa afinando até a pata; galope: as de trás e as da frente se alternam
  function patas(ctx, s, { tras, frente, lt, lf, wt, wf, passo, ergue, cor, longe, contorno, pata }) {
    const T = (fase, c) => pernaCheia(ctx, s, tras[0], tras[1], { l1: lt[0], l2: lt[1], passo, ergue, fase, dobra: 1, ws: wt, cor: c, contorno, pata: pata(c) });
    const F = (fase, c) => pernaCheia(ctx, s, frente[0], frente[1], { l1: lf[0], l2: lf[1], passo, ergue, fase, dobra: -1, ws: wf, cor: c, contorno, pata: pata(c) });
    return { longe: () => { T(0.7, longe); F(Math.PI + 0.7, longe); }, perto: () => { T(0, cor); F(Math.PI, cor); } };
  }
  const flexao = s => (s.correndo && !s.noAr && !s.morto ? Math.sin(s.fi * 2) : 0);

  // 🐆 Onça-pintada: corpo forte e baixo, cabeça larga, rosetas
  function onca(ctx, s) {
    const k = s.abaixado ? 0.68 : 1, fl = flexao(s);
    const Y = v => v * k - fl * 0.6;
    const pelo = "#e3a03a", claro = "#f7e4bd", escuro = "#33210f", contorno = "#7a4a14";
    const pata = c => (px, py) => elipse(ctx, px + 1.4, py - 1.3, 2.9, 1.7, c, 0, contorno, 0.5);
    const p = patas(ctx, s, { tras: [-13, Y(-21)], frente: [7, Y(-19)], lt: [9, 10.5], lf: [8.5, 9.5], wt: [10, 5, 3.4], wf: [7, 4.2, 3.4],
      passo: 9.5, ergue: 6, cor: pelo, longe: "#c18530", contorno, pata });
    p.longe();
    // Cauda grossa, caída e com a ponta para cima
    const bal = s.correndo && !s.morto ? Math.sin(s.fi) * 2.5 : Math.sin(s.t * 2) * 1;
    const cauda = [[-19, Y(-26)], [-26, Y(-24)], [-31, Y(-27) + bal], [-33, Y(-32) + bal]];
    membro(ctx, cauda, [4.4, 3.6, 3.2, 3], pelo, contorno);
    cauda.slice(1).forEach(([x, y]) => elipse(ctx, x, y, 1.1, 1.7, escuro));
    elipse(ctx, -33, Y(-32.5) + bal, 1.8, 1.8, escuro);
    // Corpo: costas retas, peito fundo, barriga recolhida
    const corpo = () => {
      ctx.beginPath();
      ctx.moveTo(-21, Y(-23));
      ctx.bezierCurveTo(-20, Y(-30), -12, Y(-30.5), -3, Y(-30));
      ctx.bezierCurveTo(4, Y(-29.5), 9, Y(-32), 13, Y(-30));
      ctx.lineTo(15, Y(-22));
      ctx.bezierCurveTo(13, Y(-15), 7, Y(-14), 2, Y(-15));
      ctx.bezierCurveTo(-5, Y(-16.5), -10, Y(-15.5), -15, Y(-16));
      ctx.bezierCurveTo(-20, Y(-16.5), -22, Y(-19), -21, Y(-23));
      ctx.closePath();
    };
    corpo();
    ctx.fillStyle = grad(ctx, Y(-31), Y(-14), "#eaab48", "#d38f2c"); ctx.fill();
    ctx.strokeStyle = contorno; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); corpo(); ctx.clip();
    elipse(ctx, -2, Y(-14.5), 15, 3.8, claro);
    // Rosetas: um anel de manchinhas com o miolo mais escuro que o pelo
    [[-17, -25], [-11, -28], [-12, -21], [-5, -25], [1, -28], [-1, -20], [6, -25], [11, -28], [-7, -18.5], [-18, -19.5]].forEach(([x, y], i) => {
      const cy = Y(y);
      elipse(ctx, x, cy, 1.6, 1.4, "#c47e22");
      for (let j = 0; j < 5; j++) {
        const a = j * 1.26 + i;
        elipse(ctx, x + Math.cos(a) * 2, cy + Math.sin(a) * 1.7, 0.75, 0.6, escuro, a);
      }
    });
    ctx.restore();
    p.perto();
    // Cabeça larga, focinho curto, orelhas redondas
    const hx = 17, hy = Y(-28.5);
    elipse(ctx, hx - 4.5, hy - 5.5, 2.3, 2.3, pelo, 0, contorno, 0.6);
    elipse(ctx, hx + 0.5, hy - 6.6, 2.3, 2.3, pelo, 0, contorno, 0.6);
    elipse(ctx, hx - 4.5, hy - 5.5, 1.1, 1.1, escuro);
    elipse(ctx, hx + 0.5, hy - 6.6, 1.1, 1.1, escuro);
    elipse(ctx, hx - 1, hy, 7, 6.2, grad(ctx, hy - 6, hy + 6, "#eaab48", "#d8963a"), 0, contorno, 1);
    elipse(ctx, hx + 4.2, hy + 2.4, 3.6, 2.8, claro, 0.15);
    elipse(ctx, hx - 2, hy + 4.8, 4, 1.6, claro); // queixo
    ctx.beginPath(); ctx.moveTo(hx + 5.6, hy + 0.4); ctx.lineTo(hx + 7.8, hy + 0.6); ctx.lineTo(hx + 6.8, hy + 2.1); ctx.closePath();
    ctx.fillStyle = "#5a2e1e"; ctx.fill();
    traco(ctx, hx + 6.8, hy + 2.1, hx + 5.4, hy + 4, 0.7, "#5a2e1e");
    [[hx - 4.5, hy - 1.5], [hx - 3, hy + 2.5], [hx - 6, hy + 1.5], [hx - 1.5, hy - 3.5]].forEach(([x, y]) => elipse(ctx, x, y, 0.75, 0.75, escuro));
    olho(ctx, s, hx + 1.8, hy - 1.6, 1.8, { iris: "#c99a10", pupilaVertical: true });
  }

  // 🐕 Caramelo: vira-lata magro e esperto, peito fundo, focinho comprido, orelha caída
  function caramelo(ctx, s) {
    const k = s.abaixado ? 0.68 : 1, fl = flexao(s);
    const Y = v => v * k - fl * 0.6;
    const pelo = "#cf8a3c", claro = "#f3dbb0", contorno = "#6e4216";
    const pata = c => (px, py) => elipse(ctx, px + 1.3, py - 1.2, 2.6, 1.6, c === pelo ? claro : c, 0, contorno, 0.5);
    const p = patas(ctx, s, { tras: [-12, Y(-22)], frente: [7, Y(-21)], lt: [10, 11], lf: [10, 10.5], wt: [8, 4, 2.8], wf: [5.5, 3.4, 2.8],
      passo: 9.5, ergue: 6.5, cor: pelo, longe: "#a96b28", contorno, pata });
    p.longe();
    // Rabo curvado para cima, abanando
    const abana = s.morto ? 0 : Math.sin(s.t * 16) * 3;
    membro(ctx, [[-17, Y(-28)], [-22, Y(-31)], [-23 + abana * 0.5, Y(-36)], [-21 + abana, Y(-39)]], [3.4, 3, 2.4, 1.6], pelo, contorno);
    // Corpo: peito fundo e cintura fina
    const corpo = () => {
      ctx.beginPath();
      ctx.moveTo(-19, Y(-25));
      ctx.bezierCurveTo(-18, Y(-31), -10, Y(-31), -2, Y(-31));
      ctx.bezierCurveTo(4, Y(-31), 8, Y(-33), 12, Y(-31));
      ctx.lineTo(13, Y(-22));
      ctx.bezierCurveTo(11, Y(-17), 6, Y(-16.5), 2, Y(-18));
      ctx.bezierCurveTo(-4, Y(-21), -9, Y(-21.5), -14, Y(-20));
      ctx.bezierCurveTo(-19, Y(-19.5), -20, Y(-22), -19, Y(-25));
      ctx.closePath();
    };
    corpo();
    ctx.fillStyle = grad(ctx, Y(-32), Y(-17), "#d9964c", "#bb7a33"); ctx.fill();
    ctx.strokeStyle = contorno; ctx.lineWidth = 1; ctx.stroke();
    ctx.save(); corpo(); ctx.clip();
    elipse(ctx, 9, Y(-20), 6, 5.5, claro, 0.3); // peito claro
    ctx.restore();
    p.perto();
    // Pescoço, coleira e cabeça
    const hx = 16, hy = Y(-35);
    membro(ctx, [[9, Y(-28)], [hx - 2, hy + 2]], [9, 7], pelo, contorno);
    traco(ctx, hx - 6.5, hy + 3.5, hx - 2, hy + 6.5, 2.4, "#e63946");
    elipse(ctx, hx - 2.5, hy + 7.8, 1.4, 1.4, "#ffd60a", 0, "#b38f00", 0.4);
    elipse(ctx, hx - 1, hy, 5.6, 5.2, grad(ctx, hy - 5, hy + 5, "#d9964c", "#c4823a"), 0, contorno, 1);
    // Focinho comprido
    ctx.beginPath();
    ctx.moveTo(hx + 2, hy - 2.5); ctx.quadraticCurveTo(hx + 8, hy - 2, hx + 10, hy + 0.5);
    ctx.quadraticCurveTo(hx + 10, hy + 3.6, hx + 6, hy + 3.8); ctx.quadraticCurveTo(hx + 2.5, hy + 4, hx + 1.5, hy + 2);
    ctx.closePath(); ctx.fillStyle = claro; ctx.fill(); ctx.strokeStyle = contorno; ctx.lineWidth = 0.8; ctx.stroke();
    elipse(ctx, hx + 9.6, hy + 0.3, 1.5, 1.2, "#222"); // nariz
    if (s.correndo && !s.morto) elipse(ctx, hx + 5.5, hy + 4.8 + Math.abs(Math.sin(s.fi)) * 1.2, 1.4, 2.2, "#ff7b9c", 0.25); // linguinha
    traco(ctx, hx + 3, hy + 3.4, hx + 8, hy + 3.3, 0.7, contorno);
    olho(ctx, s, hx + 1.2, hy - 1.4, 1.6);
    // Orelha caída balançando com a corrida
    const orelha = s.correndo && !s.morto ? Math.sin(s.fi + 1) * 0.3 : 0;
    ctx.save(); ctx.translate(hx - 3, hy - 4); ctx.rotate(0.35 + orelha);
    ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.quadraticCurveTo(-3.5, 4, -1.5, 7.5); ctx.quadraticCurveTo(1.5, 6, 1.8, 0); ctx.closePath();
    ctx.fillStyle = "#9b5f22"; ctx.fill(); ctx.restore();
  }

  // ---------- Capivara (patas curtinhas, desenhadas como traços grossos) ----------
  // Galope: as patas de trás e as da frente se alternam, cada par com um pequeno atraso
  function quatroPatas(ctx, s, { tras, frente, leg, corPerto, corLonge, pata }) {
    const fases = [[0, true], [0.6, false], [Math.PI, true], [Math.PI + 0.6, false]];
    // longe primeiro (atrás do corpo)
    return {
      longe: () => {
        perna(ctx, s, tras[0], tras[1], { ...leg, dobra: 1, fase: fases[1][0], cor: corLonge, pata: pata && pata(corLonge) });
        perna(ctx, s, frente[0], frente[1], { ...leg, dobra: -1, fase: fases[3][0], cor: corLonge, pata: pata && pata(corLonge) });
      },
      perto: () => {
        perna(ctx, s, tras[0], tras[1], { ...leg, dobra: 1, fase: fases[0][0], cor: corPerto, pata: pata && pata(corPerto) });
        perna(ctx, s, frente[0], frente[1], { ...leg, dobra: -1, fase: fases[2][0], cor: corPerto, pata: pata && pata(corPerto) });
      },
    };
  }

  // 🦫 Capivara (com um passarinho de carona nas costas)
  function capivara(ctx, s) {
    const k = s.abaixado ? 0.7 : 1;
    const bob = s.correndo && !s.noAr && !s.morto ? Math.abs(Math.sin(s.fi)) * 1.4 : 0;
    const Y = v => v * k - bob;
    const pelo = "#8c6a4a", escuro = "#5e4430", contorno = "#4a3524";
    const leg = { l1: 6, l2: 7.5, passo: 6.5, ergue: 4.5, w1: 5.5, w2: 4 };
    const pata = cor => (px, py) => elipse(ctx, px + 1, py - 1.2, 2.4, 1.5, escuro);
    const p = quatroPatas(ctx, s, { tras: [-13, Y(-12.5)], frente: [3, Y(-12.5)], leg, corPerto: pelo, corLonge: "#6f5239", pata });
    p.longe();
    // Corpo de barril, com tufinhos de pelo
    elipse(ctx, -6, Y(-21), 17, 10.5, grad(ctx, Y(-32), Y(-11), "#9b7756", "#7a5b3e"), -0.03, contorno, 1);
    ctx.strokeStyle = escuro; ctx.lineWidth = 0.8;
    [[-16, -25], [-11, -28], [-5, -26], [-13, -19], [-1, -21], [-7, -16]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x, Y(y)); ctx.lineTo(x + 2.2, Y(y) - 1.2); ctx.stroke(); });
    // Cabeça comprida e quadradona
    const hx = 9, hy = Y(-25);
    ctx.beginPath();
    ctx.moveTo(hx - 3, hy - 6);
    ctx.quadraticCurveTo(hx + 7, hy - 8.5, hx + 13, hy - 5);
    ctx.quadraticCurveTo(hx + 15.5, hy - 3, hx + 15, hy + 1.5);
    ctx.quadraticCurveTo(hx + 14, hy + 5, hx + 9, hy + 5);
    ctx.lineTo(hx - 2, hy + 6);
    ctx.quadraticCurveTo(hx - 6, hy, hx - 3, hy - 6);
    ctx.fillStyle = grad(ctx, hy - 8, hy + 6, "#9b7756", "#836244"); ctx.fill();
    ctx.strokeStyle = contorno; ctx.lineWidth = 1; ctx.stroke();
    elipse(ctx, hx - 1, hy - 6.8, 1.9, 1.5, escuro, 0, contorno, 0.6); // orelha
    elipse(ctx, hx + 13, hy - 2.2, 1.1, 0.7, "#2a1d12", 0.3); // narina
    traco(ctx, hx + 10, hy + 3, hx + 14, hy + 2.6, 0.8, contorno);
    olho(ctx, s, hx + 4.5, hy - 3, 1.5);
    // Passarinho de carona
    const pul = s.correndo && !s.morto ? Math.abs(Math.sin(s.fi * 2)) * 1 : 0;
    const bx = -9, by = Y(-31.5) - pul;
    elipse(ctx, bx, by, 3, 2.4, "#ffd60a", 0, "#b38f00", 0.6);
    elipse(ctx, bx + 2.3, by - 2, 1.8, 1.8, "#ffd60a", 0, "#b38f00", 0.6);
    ctx.beginPath(); ctx.moveTo(bx + 3.8, by - 2.2); ctx.lineTo(bx + 5.6, by - 1.6); ctx.lineTo(bx + 3.8, by - 1.2); ctx.fillStyle = "#f77f00"; ctx.fill();
    elipse(ctx, bx + 2.7, by - 2.4, 0.45, 0.45, "#111");
    p.perto();
  }

  return {
    dino: { nome: "Dino", fala: "o dinossauro", desenhar: dino },
    onca: { nome: "Onça", fala: "a onça-pintada", desenhar: onca },
    caramelo: { nome: "Caramelo", fala: "o caramelo", desenhar: caramelo },
    capivara: { nome: "Capivara", fala: "a capivara", desenhar: capivara },
  };
})();
