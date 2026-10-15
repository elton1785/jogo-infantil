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

  // ---------- 🦖 Dino (tiranossauro) ----------
  function dino(ctx, s) {
    ctx.save();
    ctx.translate(-3, 0); // o focinho comprido fica dentro da caixa de colisão
    desenharDino(ctx, s);
    ctx.restore();
  }
  function desenharDino(ctx, s) {
    const k = s.abaixado ? 0.62 : 1, frente = s.abaixado ? 4 : 0;
    const bob = s.correndo && !s.noAr && !s.morto ? Math.abs(Math.sin(s.fi)) * 1.6 : 0;
    const Y = v => v * k - bob;
    const verde = "#4a8f45", escuro = "#2c5e2e", barriga = "#d5e3a0";
    const hx = -6, hy = Y(-21);
    const leg = { l1: 10, l2: 12, passo: 7.5, ergue: 6, dobra: 1, w1: 6, w2: 3.6 };
    const garra = cor => (px, py) => { traco(ctx, px, py - 1, px + 5, py - 0.5, 2.6, cor); traco(ctx, px, py - 1, px - 2.5, py - 0.6, 2.2, cor); };
    // Perna de trás (mais escura)
    perna(ctx, s, hx, hy, { ...leg, fase: Math.PI, cor: escuro, pata: garra(escuro) });
    // Cauda
    const balanco = s.correndo && !s.morto ? Math.sin(s.fi) * 2 : Math.sin(s.t * 2) * 0.8;
    ctx.beginPath();
    ctx.moveTo(-14, Y(-34));
    ctx.quadraticCurveTo(-26, Y(-33), -34, Y(-27) + balanco);
    ctx.quadraticCurveTo(-25, Y(-24), -13, Y(-20));
    ctx.closePath();
    ctx.fillStyle = grad(ctx, Y(-34), Y(-20), verde, "#3c7a3a"); ctx.fill();
    ctx.strokeStyle = escuro; ctx.lineWidth = 1.1; ctx.stroke();
    // Corpo
    elipse(ctx, -5, Y(-28), 15, 10.5, grad(ctx, Y(-39), Y(-18), "#5aa354", "#3f7f3b"), -0.22, escuro);
    elipse(ctx, -2, Y(-23.5), 10, 5, barriga, -0.15);
    // Listras nas costas
    [[-12, -36], [-6, -38], [0, -38.5]].forEach(([x, y]) => traco(ctx, x, Y(y), x + 2, Y(y + 4.5), 1.6, escuro));
    // Pescoço e cabeça
    ctx.beginPath();
    ctx.moveTo(1, Y(-35)); ctx.lineTo(6 + frente, Y(-43)); ctx.lineTo(10 + frente, Y(-31)); ctx.lineTo(4, Y(-25)); ctx.closePath();
    ctx.fillStyle = verde; ctx.fill();
    const cx = 2 + frente, cy = Y(-38);
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 6);
    ctx.quadraticCurveTo(cx + 12, cy - 9, cx + 19, cy - 5);
    ctx.quadraticCurveTo(cx + 23, cy - 3, cx + 22, cy + 1);
    ctx.lineTo(cx + 20, cy + 5);
    ctx.quadraticCurveTo(cx + 12, cy + 8, cx + 5, cy + 7);
    ctx.quadraticCurveTo(cx - 1, cy + 3, cx + 2, cy - 6);
    ctx.fillStyle = grad(ctx, cy - 9, cy + 8, "#5aa354", "#4a8f45"); ctx.fill();
    ctx.strokeStyle = escuro; ctx.lineWidth = 1.1; ctx.stroke();
    // Boca (sorriso) e dentinhos
    ctx.beginPath(); ctx.moveTo(cx + 9, cy + 2.5); ctx.quadraticCurveTo(cx + 16, cy + 4, cx + 21, cy + 1.5);
    ctx.strokeStyle = escuro; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = "#fff";
    [cx + 13, cx + 16, cx + 19].forEach(x => { ctx.beginPath(); ctx.moveTo(x, cy + 3); ctx.lineTo(x + 1.2, cy + 4.6); ctx.lineTo(x + 2.2, cy + 2.8); ctx.fill(); });
    elipse(ctx, cx + 19.5, cy - 3.5, 0.8, 0.6, escuro); // narina
    traco(ctx, cx + 7, cy - 5.5, cx + 12, cy - 6.5, 1.4, escuro); // sobrancelha
    olho(ctx, s, cx + 10, cy - 2.5, 2.4);
    // Bracinho
    const braco = s.correndo && !s.morto ? Math.sin(s.fi + Math.PI) * 0.5 : 0.2;
    const bx = 5 + frente * 0.5, by = Y(-26);
    const ex = bx + Math.sin(0.9 + braco) * 4.5, ey = by + Math.cos(0.9 + braco) * 4.5;
    traco(ctx, bx, by, ex, ey, 2.6, "#3f7f3b");
    traco(ctx, ex, ey, ex + 2.8, ey - 1.2, 1.8, "#3f7f3b");
    // Perna da frente
    perna(ctx, s, hx + 1, hy, { ...leg, cor: verde, w1: 7, pata: garra(escuro) });
  }

  // ---------- Quadrúpedes (onça, caramelo, capivara) ----------
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

  // 🐆 Onça-pintada
  function onca(ctx, s) {
    const k = s.abaixado ? 0.66 : 1;
    const flex = s.correndo && !s.noAr && !s.morto ? Math.sin(s.fi * 2) * 1.2 : 0;
    const Y = v => v * k - flex * 0.5;
    const pelo = "#e3a33b", barriga = "#f8e8c6", mancha = "#3b2716", contorno = "#7a4b16";
    const leg = { l1: 8, l2: 9.5, passo: 9, ergue: 6, w1: 5.5, w2: 3.6 };
    const pata = cor => (px, py) => elipse(ctx, px + 1.2, py - 1.2, 2.6, 1.6, cor);
    const p = quatroPatas(ctx, s, { tras: [-15, Y(-16)], frente: [4, Y(-16)], leg, corPerto: pelo, corLonge: "#c4862a", pata });
    p.longe();
    // Cauda (comprida, com anéis e a ponta preta)
    const bal = s.correndo && !s.morto ? Math.sin(s.fi) * 2.5 : Math.sin(s.t * 2) * 1;
    ctx.beginPath(); ctx.moveTo(-19, Y(-24)); ctx.quadraticCurveTo(-29, Y(-25), -32, Y(-32) + bal);
    ctx.strokeStyle = pelo; ctx.lineWidth = 3.4; ctx.lineCap = "round"; ctx.stroke();
    elipse(ctx, -32, Y(-32) + bal, 1.8, 1.8, mancha);
    // Corpo com rosetas
    ctx.save();
    ctx.beginPath(); ctx.ellipse(-6, Y(-22), 16, 8.5, -0.04, 0, Math.PI * 2);
    ctx.fillStyle = grad(ctx, Y(-31), Y(-13), "#eaae4a", "#d39231"); ctx.fill();
    ctx.strokeStyle = contorno; ctx.lineWidth = 1; ctx.stroke();
    ctx.clip();
    elipse(ctx, -5, Y(-15.5), 13, 3.5, barriga);
    ctx.strokeStyle = mancha; ctx.lineWidth = 1.1;
    [[-17, -24], [-12, -28], [-8, -22], [-3, -27], [2, -23], [-14, -19], [5, -28], [-1, -18], [-19, -28]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.arc(x, Y(y), 1.9, 0.4, Math.PI * 1.8); ctx.stroke();
      elipse(ctx, x + 0.2, Y(y), 0.6, 0.6, "#b8761f");
    });
    ctx.restore();
    // Cabeça
    const hx = 12, hy = Y(-27);
    elipse(ctx, hx - 3, hy + 4, 5, 5.5, pelo); // pescoço
    elipse(ctx, hx - 3, hy - 6, 2.8, 2.8, pelo, 0, contorno, 0.8); // orelhas
    elipse(ctx, hx + 2, hy - 6.5, 2.8, 2.8, pelo, 0, contorno, 0.8);
    elipse(ctx, hx - 3, hy - 6, 1.3, 1.3, mancha);
    elipse(ctx, hx + 2, hy - 6.5, 1.3, 1.3, mancha);
    elipse(ctx, hx, hy, 7, 6.3, grad(ctx, hy - 6, hy + 6, "#eaae4a", "#d89a36"), 0, contorno, 1);
    elipse(ctx, hx + 5, hy + 2.3, 4, 3, barriga); // focinho
    ctx.beginPath(); ctx.moveTo(hx + 7.4, hy + 0.2); ctx.lineTo(hx + 9.6, hy + 0.4); ctx.lineTo(hx + 8.6, hy + 2); ctx.closePath();
    ctx.fillStyle = "#4a2a1a"; ctx.fill(); // nariz
    traco(ctx, hx + 8.5, hy + 2, hx + 7, hy + 4, 0.8, "#4a2a1a"); // boca
    [[hx - 4, hy - 2], [hx - 2, hy + 3], [hx - 5, hy + 2]].forEach(([x, y]) => elipse(ctx, x, y, 0.8, 0.8, mancha));
    olho(ctx, s, hx + 2.6, hy - 1.8, 1.9, { iris: "#c99a10", pupilaVertical: true });
    p.perto();
  }

  // 🐕 Caramelo (o vira-lata caramelo)
  function caramelo(ctx, s) {
    const k = s.abaixado ? 0.66 : 1;
    const flex = s.correndo && !s.noAr && !s.morto ? Math.sin(s.fi * 2) * 1.2 : 0;
    const Y = v => v * k - flex * 0.5;
    const pelo = "#cf8a3c", claro = "#f4dcb0", contorno = "#7a4a18";
    const leg = { l1: 8.5, l2: 9.5, passo: 8.5, ergue: 6, w1: 5, w2: 3.4 };
    const pata = cor => (px, py) => elipse(ctx, px + 1.3, py - 1.2, 2.5, 1.6, cor === pelo ? claro : cor);
    const p = quatroPatas(ctx, s, { tras: [-14, Y(-16.5)], frente: [4, Y(-16.5)], leg, corPerto: pelo, corLonge: "#a96c2b", pata });
    p.longe();
    // Rabo abanando para cima
    const abana = Math.sin(s.t * (s.morto ? 0 : 16)) * 3;
    ctx.beginPath(); ctx.moveTo(-18, Y(-25)); ctx.quadraticCurveTo(-25, Y(-28), -24 + abana, Y(-36));
    ctx.strokeStyle = pelo; ctx.lineWidth = 3.4; ctx.lineCap = "round"; ctx.stroke();
    // Corpo
    elipse(ctx, -5, Y(-22.5), 15, 8.5, grad(ctx, Y(-31), Y(-14), "#d8964a", "#bd7a30"), -0.05, contorno, 1);
    elipse(ctx, 3, Y(-19), 6, 5, claro, 0.4); // peito
    // Coleira
    traco(ctx, 6, Y(-29), 9.5, Y(-20), 2.4, "#e63946");
    elipse(ctx, 9.5, Y(-19), 1.4, 1.4, "#ffd60a");
    // Cabeça
    const hx = 13, hy = Y(-30);
    elipse(ctx, hx, hy, 6.5, 6, grad(ctx, hy - 6, hy + 6, "#d8964a", "#c4823a"), 0, contorno, 1);
    elipse(ctx, hx + 6, hy + 2.5, 4.3, 3, claro, 0.1, contorno, 0.6); // focinho
    elipse(ctx, hx + 9.6, hy + 1.2, 1.6, 1.3, "#222"); // nariz
    // Linguinha para fora quando corre
    if (s.correndo && !s.morto) {
      const l = 1 + Math.abs(Math.sin(s.fi)) * 1.2;
      elipse(ctx, hx + 6.5, hy + 5.5 + l, 1.5, 2 + l * 0.5, "#ff7b9c", 0.2);
    }
    traco(ctx, hx + 3.5, hy + 4.4, hx + 8, hy + 4.2, 0.8, contorno);
    olho(ctx, s, hx + 2.8, hy - 1.6, 1.9);
    // Orelha caída, balançando com a corrida
    const orelha = s.correndo && !s.morto ? Math.sin(s.fi + 1) * 0.35 : 0;
    elipse(ctx, hx - 3, hy - 1, 2.6, 5.2, "#9d6224", 0.5 + orelha);
    p.perto();
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
