// Amazônia: bichos, frutas, rios e lugares da nossa floresta (o dono mora em Manaus).
// Modos: 📖 Conhecer (desenho grande, nome e curiosidade falados, som sintetizado),
// ❓ Perguntas (Cadê? para os pequenos, curiosidades para os maiores), 🚤 Passeio de barco
// (canvas: guiar o barco pelo Rio Negro, passar pelo Encontro das Águas, desviar de troncos,
// pegar frutas e anotar os bichos das margens no diário de bordo) e 📒 Diário de bordo.
// Desenhos em SVG feitos aqui mesmo (sem arquivos). O passeio usa as setas: o jogo só pede as
// setas (`teclas`) enquanto o passeio está na tela; nos outros modos o controle navega normal.
(() => {
  const svg = (c, vb = "0 0 100 100") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" aria-hidden="true">${c}</svg>`;
  const nota = (x, y, cor) => `<ellipse cx="${x}" cy="${y}" rx="3.6" ry="2.6" fill="${cor}" transform="rotate(-20 ${x} ${y})"/><path d="M${x + 3.2} ${y} V${y - 13} q4 2 6 7" stroke="${cor}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const brilho = (x, y, r = 1.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".75"/>`;
  const galho = (y1, y2, cor = "#7a4a22") => `<path d="M4 ${y1} L96 ${y2}" stroke="${cor}" stroke-width="7" stroke-linecap="round"/><path d="M78 ${y2 + 1} q6 -10 14 -8 q-4 8 -14 8Z" fill="#3f9e4a"/>`;
  const ondas = (y, cor = "#3a8fc4") => `<path d="M0 ${y} Q12.5 ${y - 6} 25 ${y} T50 ${y} T75 ${y} T100 ${y} V100 H0Z" fill="${cor}"/><path d="M8 ${y + 7} q6 -3 12 0 M58 ${y + 9} q6 -3 12 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6" stroke-linecap="round"/>`;

  // ---------- Desenhos ----------
  const ARTE = {
    onca: svg(`<g stroke="#4a2e12" stroke-width="2"><circle cx="24" cy="26" r="12" fill="#e9a23b"/><circle cx="76" cy="26" r="12" fill="#e9a23b"/></g>
      <circle cx="24" cy="27" r="5.5" fill="#5a3a1a"/><circle cx="76" cy="27" r="5.5" fill="#5a3a1a"/>
      <ellipse cx="50" cy="56" rx="38" ry="34" fill="#f2b544" stroke="#4a2e12" stroke-width="2"/>
      <g fill="none" stroke="#3b2614" stroke-width="2.6" stroke-dasharray="6 3">${[[34, 33], [50, 27], [66, 33], [20, 52], [80, 52], [23, 70], [77, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5"/>`).join("")}</g>
      <g fill="#3b2614">${[[42, 37], [58, 37], [27, 42], [73, 42], [16, 62], [84, 62], [31, 82], [69, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2"/>`).join("")}</g>
      <ellipse cx="50" cy="75" rx="20" ry="12.5" fill="#fff4dc"/>
      <ellipse cx="36" cy="51" rx="7" ry="5.5" fill="#f9e27d" stroke="#3a2a1a" stroke-width="1.5"/><ellipse cx="36" cy="51" rx="2.2" ry="4.5" fill="#1d1d1d"/>
      <ellipse cx="64" cy="51" rx="7" ry="5.5" fill="#f9e27d" stroke="#3a2a1a" stroke-width="1.5"/><ellipse cx="64" cy="51" rx="2.2" ry="4.5" fill="#1d1d1d"/>
      ${brilho(34, 49, 1.3)}${brilho(62, 49, 1.3)}
      <path d="M42 64 Q50 60 58 64 Q55 70 50 71 Q45 70 42 64Z" fill="#5a2e1e"/>
      <path d="M50 71 V76 M50 76 Q44 82 39 78 M50 76 Q56 82 61 78" fill="none" stroke="#3a2a1a" stroke-width="2" stroke-linecap="round"/>
      <g fill="#8a6a4a">${[[40, 76], [43, 80], [60, 76], [57, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join("")}</g>`),

    boto: svg(`${ondas(82)}
      <path d="M20 80 L6 72 L10 84 L8 96 L22 86 Z" fill="#f4a3c0" stroke="#b9537c" stroke-width="2" stroke-linejoin="round"/>
      <path d="M18 78 C22 50 46 30 70 30 C78 30 84 33 86 37 L98 42 C97 45 92 46 85 45 C80 52 64 56 50 62 C38 67 28 74 22 84 Z" fill="#f4a3c0" stroke="#b9537c" stroke-width="2" stroke-linejoin="round"/>
      <path d="M30 72 C42 62 60 54 80 46" stroke="#fcd3e2" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M58 52 Q60 66 52 70 Q50 60 52 54Z" fill="#e88aab" stroke="#b9537c" stroke-width="1.5"/>
      <path d="M44 38 Q50 32 57 33" fill="none" stroke="#b9537c" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="80" cy="39" r="2.2" fill="#2b2b2b"/>${brilho(79.3, 38.3, .8)}
      <g fill="#bfe6ff"><circle cx="12" cy="70" r="3"/><circle cx="30" cy="88" r="2.5"/><circle cx="6" cy="62" r="2"/><circle cx="94" cy="60" r="2.4"/></g>`),

    peixeboi: svg(`<path d="M10 100 Q6 86 12 76 M18 100 Q22 88 15 80 M88 100 Q92 88 86 80 M94 100 Q96 92 92 86" stroke="#3f9e5a" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="14" cy="56" rx="12" ry="15" fill="#8794a1" stroke="#4d5966" stroke-width="2"/>
      <path d="M18 50 C24 34 54 30 74 36 C88 40 94 50 92 60 C90 70 78 74 64 74 C44 76 24 70 18 60Z" fill="#9aa6b2" stroke="#4d5966" stroke-width="2"/>
      <path d="M30 68 C48 74 70 72 84 64" stroke="#b9c3cc" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M40 40 q4 3 0 6 M52 37 q4 3 0 6" stroke="#7d8996" stroke-width="1.5" fill="none"/>
      <path d="M62 66 Q66 80 56 84 Q54 74 56 66Z" fill="#8794a1" stroke="#4d5966" stroke-width="2"/>
      <ellipse cx="88" cy="56" rx="8" ry="9" fill="#b3bdc6" stroke="#4d5966" stroke-width="2"/>
      <g fill="#4d5966"><circle cx="86" cy="55" r="1"/><circle cx="90" cy="53" r="1"/><circle cx="90" cy="58" r="1"/></g>
      <circle cx="80" cy="46" r="2.2" fill="#222"/>
      <g fill="none" stroke="#e8f6ff" stroke-width="1.5"><circle cx="93" cy="34" r="3"/><circle cx="88" cy="24" r="2"/><circle cx="94" cy="16" r="1.5"/></g>`),

    arara: svg(`${galho(80, 72)}
      <path d="M54 66 L62 99 L70 97 L66 64Z" fill="#d62828" stroke="#7a1010" stroke-width="1.5"/>
      <path d="M60 66 L74 98 L80 95 L68 64Z" fill="#1d6fd8" stroke="#0c3c7a" stroke-width="1.5"/>
      <ellipse cx="54" cy="52" rx="16" ry="21" fill="#e63946" stroke="#7a1010" stroke-width="2"/>
      <path d="M50 42 Q70 38 72 56 Q64 58 54 56 Q52 50 50 42Z" fill="#ffd23f" stroke="#7a1010" stroke-width="1.5"/>
      <path d="M54 56 Q66 54 72 56 Q72 72 60 75 Q56 66 54 56Z" fill="#1d6fd8" stroke="#0c3c7a" stroke-width="1.5"/>
      <path d="M48 72 l-2 6 M52 72 l1 6" stroke="#555" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="46" cy="28" r="14" fill="#e63946" stroke="#7a1010" stroke-width="2"/>
      <ellipse cx="40" cy="30" rx="7" ry="6.5" fill="#fff"/>
      <path d="M36 28 h5 M36 31 h5 M37 34 h4" stroke="#e7b3b3" stroke-width=".9"/>
      <circle cx="43" cy="27" r="2.6" fill="#f5d000" stroke="#222" stroke-width=".8"/><circle cx="43" cy="27" r="1.2" fill="#111"/>
      <path d="M35 21 C24 21 19 33 26 42 C28 36 31 34 35 34Z" fill="#f2ead8" stroke="#3a2a1a" stroke-width="1.5"/>
      <path d="M33 34 Q29 38 32 41 Q36 39 38 35Z" fill="#2b2b2b"/>`),

    tucano: svg(`${galho(86, 82)}
      <path d="M62 76 L60 99 L72 99 L70 76Z" fill="#1d1d1d"/>
      <ellipse cx="64" cy="56" rx="17" ry="26" fill="#1d1d1d"/>
      <path d="M50 38 Q45 52 54 62 Q63 54 61 40Z" fill="#fff4c2"/>
      <ellipse cx="64" cy="80" rx="7" ry="4" fill="#e63946"/>
      <path d="M58 82 l-2 6 M66 82 l1 6" stroke="#5b6b8a" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="58" cy="32" r="14" fill="#1d1d1d"/>
      <circle cx="58" cy="29" r="5" fill="#59c3f0"/><circle cx="58" cy="29" r="2.2" fill="#111"/>${brilho(57, 28, .8)}
      <path d="M48 22 C34 16 14 20 4 34 C10 38 30 40 48 40Z" fill="#ff9f1c" stroke="#3a2a1a" stroke-width="1.5"/>
      <path d="M48 23 C34 18 16 22 7 31 C20 26 36 26 48 29Z" fill="#ffd23f"/>
      <path d="M47 38.5 C34 38.5 16 37 8 34.5" stroke="#e63946" stroke-width="3" fill="none"/>
      <path d="M4 34 C6 30 9 28 12 27 C11 31 11 35 12 37 C9 37 6 36 4 34Z" fill="#1d1d1d"/>`),

    preguica: svg(`<path d="M2 14 L98 18" stroke="#6b4423" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="14" cy="8" rx="8" ry="4" fill="#3f9e4a" transform="rotate(-20 14 8)"/><ellipse cx="88" cy="9" rx="8" ry="4" fill="#4caf50" transform="rotate(15 88 9)"/>
      <path d="M30 16 Q26 34 38 50" stroke="#7d5f42" stroke-width="11" fill="none" stroke-linecap="round"/>
      <path d="M72 18 Q76 36 62 50" stroke="#7d5f42" stroke-width="11" fill="none" stroke-linecap="round"/>
      <path d="M25 12 q4 -5 9 0 M67 14 q4 -5 9 0" stroke="#2b1d12" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="68" rx="24" ry="24" fill="#a3825e" stroke="#5e4630" stroke-width="2"/>
      <path d="M34 70 q3 6 0 10 M64 66 q3 6 0 10 M48 82 q3 5 0 8" stroke="#8a6b4a" stroke-width="1.6" fill="none"/>
      <path d="M30 82 Q40 97 50 89 M70 82 Q60 97 50 89" stroke="#7d5f42" stroke-width="9" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="17" fill="#b8956c" stroke="#5e4630" stroke-width="2"/>
      <ellipse cx="50" cy="53" rx="13" ry="11" fill="#f1e2c6"/>
      <ellipse cx="43" cy="50" rx="6.5" ry="3.2" fill="#4a3424" transform="rotate(-18 43 50)"/><ellipse cx="57" cy="50" rx="6.5" ry="3.2" fill="#4a3424" transform="rotate(18 57 50)"/>
      <circle cx="43.5" cy="50" r="1.7" fill="#fff"/><circle cx="56.5" cy="50" r="1.7" fill="#fff"/>
      <ellipse cx="50" cy="56" rx="3.5" ry="2.5" fill="#3a2a1a"/>
      <path d="M45 60 Q50 64 55 60" stroke="#3a2a1a" stroke-width="1.8" fill="none" stroke-linecap="round"/>`),

    macaco: svg(`<path d="M64 84 C92 86 96 58 82 54 C76 52 74 60 80 62" stroke="#5a3a22" stroke-width="6" fill="none" stroke-linecap="round"/>
      <ellipse cx="50" cy="70" rx="19" ry="21" fill="#8a5a33" stroke="#4a2e18" stroke-width="2"/>
      <ellipse cx="50" cy="72" rx="10" ry="13" fill="#c99a68"/>
      <ellipse cx="38" cy="90" rx="9" ry="5" fill="#6e4426"/><ellipse cx="62" cy="90" rx="9" ry="5" fill="#6e4426"/>
      <path d="M34 62 Q30 78 44 80 M66 62 Q70 78 56 80" stroke="#6e4426" stroke-width="7" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="80" r="5" fill="#a0703e" stroke="#4a2e18" stroke-width="1.5"/>
      <circle cx="31" cy="40" r="6" fill="#e8c497" stroke="#4a2e18" stroke-width="1.5"/><circle cx="69" cy="40" r="6" fill="#e8c497" stroke="#4a2e18" stroke-width="1.5"/>
      <circle cx="50" cy="38" r="18" fill="#8a5a33" stroke="#4a2e18" stroke-width="2"/>
      <path d="M37 41 Q37 29 50 31 Q63 29 63 41 Q63 55 50 55 Q37 55 37 41Z" fill="#f0d2a8"/>
      <path d="M34 32 Q36 16 50 18 Q64 16 66 32 Q58 26 50 28 Q42 26 34 32Z" fill="#2e1c0e"/>
      <path d="M40 22 L37 11 L45 19Z M60 22 L63 11 L55 19Z" fill="#2e1c0e" stroke="#2e1c0e" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="45" cy="39" r="2.4" fill="#2b1b0e"/><circle cx="55" cy="39" r="2.4" fill="#2b1b0e"/>${brilho(44.3, 38.3, .8)}${brilho(54.3, 38.3, .8)}
      <circle cx="48.5" cy="45" r=".9" fill="#4a2e18"/><circle cx="51.5" cy="45" r=".9" fill="#4a2e18"/>
      <path d="M46 49 Q50 51.5 54 49" stroke="#4a2e18" stroke-width="1.6" fill="none" stroke-linecap="round"/>`),

    sucuri: svg(`<ellipse cx="48" cy="80" rx="38" ry="13" fill="#6f8f2a" stroke="#34460f" stroke-width="2"/>
      <ellipse cx="48" cy="80" rx="18" ry="5" fill="#4d6519"/>
      <ellipse cx="50" cy="66" rx="28" ry="10" fill="#7a9c30" stroke="#34460f" stroke-width="2"/>
      <ellipse cx="50" cy="66" rx="12" ry="3.5" fill="#4d6519"/>
      <path d="M66 64 C80 56 76 40 64 34" stroke="#34460f" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M66 64 C80 56 76 40 64 34" stroke="#86a836" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M50 30 Q56 20 70 24 Q78 28 72 34 Q62 38 52 36Z" fill="#86a836" stroke="#34460f" stroke-width="2"/>
      <g fill="#1f2a0a">${[[24, 78], [40, 87], [60, 88], [76, 78], [34, 64], [58, 71], [70, 61], [73, 46], [76, 53], [67, 27]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="2.6"/>`).join("")}</g>
      <circle cx="59" cy="26" r="3.2" fill="#f2d03b" stroke="#222" stroke-width="1"/><ellipse cx="59" cy="26" rx=".8" ry="2.2" fill="#111"/>
      <path d="M51 33 L43 34 L39 31 M43 34 L39 37" stroke="#e63946" stroke-width="1.8" fill="none" stroke-linecap="round"/>`),

    pirarucu: svg(`<path d="M16 50 L2 35 L4 65Z" fill="#c0392b" stroke="#6e1b12" stroke-width="2" stroke-linejoin="round"/>
      <path d="M30 38 Q36 27 46 36Z" fill="#c0392b" stroke="#6e1b12" stroke-width="1.5"/><path d="M30 62 Q36 73 46 64Z" fill="#c0392b" stroke="#6e1b12" stroke-width="1.5"/>
      <path d="M12 50 C22 36 56 30 84 40 C92 44 96 50 92 56 C64 70 24 66 12 50Z" fill="#5f6f5a"/>
      <path d="M12 50 C18 42 30 38 40 37 C37 46 37 56 40 64 C28 62 18 58 12 50Z" fill="#c0392b"/>
      <g stroke="#2f3a2c" stroke-width="1" fill="none" opacity=".55">${[44, 52, 60].map(y => [26, 34, 42, 50, 58, 66].map(x => `<path d="M${x} ${y} q3 -4 6 0"/>`).join("")).join("")}</g>
      <path d="M70 37 C80 39 92 44 94 52 C90 58 80 60 70 62 Q76 50 70 37Z" fill="#3f4a3c"/>
      <path d="M12 50 C22 36 56 30 84 40 C92 44 96 50 92 56 C64 70 24 66 12 50Z" fill="none" stroke="#2f3a2c" stroke-width="2"/>
      <circle cx="82" cy="46" r="3" fill="#f2d03b"/><circle cx="82" cy="46" r="1.5" fill="#111"/>
      <path d="M93.5 50 L86 52.5" stroke="#1d1d1d" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M70 54 Q66 62 60 62 Q64 56 70 54Z" fill="#8a9a80"/>`),

    jacare: svg(`${ondas(74)}
      <path d="M34 64 L30 75 L39 74Z M60 60 L58 72 L66 70Z" fill="#4f7a3a" stroke="#253f18" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M2 64 C18 58 30 52 44 52 L70 50 C78 46 84 47 97 53 C92 58 84 60 72 60 L46 66 C30 68 16 68 2 64Z" fill="#4f7a3a" stroke="#253f18" stroke-width="2" stroke-linejoin="round"/>
      <g fill="#3d6230" stroke="#253f18" stroke-width="1">${[14, 21, 28, 35, 42, 49, 56, 63].map((x, i) => `<path d="M${x} ${58 - i * .9} l3 -5 l3 5Z"/>`).join("")}</g>
      <path d="M10 65 C30 66 46 64 70 58" stroke="#a7c47a" stroke-width="2" fill="none"/>
      <circle cx="74" cy="47" r="5" fill="#5c8a45" stroke="#253f18" stroke-width="1.5"/><circle cx="75" cy="46" r="2.6" fill="#f2d03b"/><ellipse cx="75" cy="46" rx=".8" ry="2" fill="#111"/>
      <circle cx="94" cy="51" r="1.2" fill="#253f18"/>
      <path d="M78 57 l2 3 l2 -3 l2 3 l2 -3 l2 3 l2 -3" stroke="#fff" fill="none" stroke-width="1.5"/>`),

    tartaruga: svg(`<ellipse cx="50" cy="86" rx="46" ry="7" fill="#e9c98a"/>
      <ellipse cx="24" cy="74" rx="8" ry="6" fill="#6f7d5c" stroke="#36402b" stroke-width="2"/><ellipse cx="74" cy="76" rx="9" ry="6" fill="#6f7d5c" stroke="#36402b" stroke-width="2"/>
      <path d="M12 66 L3 70 L13 71Z" fill="#6f7d5c" stroke="#36402b" stroke-width="1.5"/>
      <path d="M78 60 Q85 44 95 51 Q99 62 86 65Z" fill="#6f7d5c" stroke="#36402b" stroke-width="2"/>
      <g fill="#f2d03b"><circle cx="85" cy="56" r="1.6"/><circle cx="94" cy="58" r="1.4"/><circle cx="89" cy="60" r="1.2"/></g>
      <circle cx="91" cy="51" r="1.7" fill="#111"/>
      <path d="M12 68 Q14 26 50 26 Q84 26 88 68Z" fill="#6b5a3e" stroke="#3a2f20" stroke-width="2"/>
      <path d="M30 66 Q30 44 50 40 Q70 44 70 66 M50 40 V27 M30 50 L16 53 M70 50 L84 53 M40 66 V55 M60 66 V55" stroke="#9c8660" stroke-width="2" fill="none"/>
      <path d="M10 68 H90 Q90 74 84 74 H16 Q10 74 10 68Z" fill="#c9b38a" stroke="#3a2f20" stroke-width="2"/>`),

    uirapuru: svg(`${galho(84, 80)}
      <path d="M48 76 l-2 7 M54 76 l1 6" stroke="#5a4a3a" stroke-width="2" stroke-linecap="round"/>
      <path d="M30 62 L8 48 L12 58 L28 70Z" fill="#6b3f1d" stroke="#3a2210" stroke-width="1.5" stroke-linejoin="round"/>
      <ellipse cx="44" cy="64" rx="20" ry="14" fill="#8b5a2b" stroke="#3a2210" stroke-width="2"/>
      <ellipse cx="50" cy="70" rx="12" ry="7" fill="#c98a54"/>
      <path d="M30 60 Q44 52 56 60 Q46 70 32 68Z" fill="#6b3f1d"/>
      <path d="M36 61 l4 4 M42 59 l4 4 M48 59 l3 4" stroke="#c98a54" stroke-width="1.3"/>
      <circle cx="60" cy="50" r="12" fill="#8b5a2b" stroke="#3a2210" stroke-width="2"/>
      <ellipse cx="64" cy="55" rx="6" ry="5" fill="#d9773a"/>
      <path d="M70 46 L83 40 L72 50Z M71 52 L83 55 L71 54.5Z" fill="#3a2a1a"/>
      <circle cx="63" cy="47" r="2.1" fill="#111"/>${brilho(62.4, 46.4, .7)}
      ${nota(82, 28, "#7b2cbf")}${nota(70, 18, "#2a9d55")}${nota(90, 14, "#e63946")}`),

    harpia: svg(`<path d="M8 95 L92 95" stroke="#7a4a22" stroke-width="7" stroke-linecap="round"/>
      <path d="M30 46 Q8 62 14 92 Q28 86 34 70Z" fill="#4a4f57" stroke="#23262b" stroke-width="2"/><path d="M70 46 Q92 62 86 92 Q72 86 66 70Z" fill="#4a4f57" stroke="#23262b" stroke-width="2"/>
      <path d="M16 70 l8 2 M15 80 l9 1 M84 70 l-8 2 M85 80 l-9 1" stroke="#7a808a" stroke-width="1.5"/>
      <ellipse cx="50" cy="66" rx="22" ry="26" fill="#f4f4f2" stroke="#23262b" stroke-width="2"/>
      <path d="M29 52 Q50 64 71 52 L70 45 Q50 56 30 45Z" fill="#2b2e33"/>
      <path d="M40 78 h6 M54 78 h6 M41 84 h5 M55 84 h5" stroke="#9aa0a8" stroke-width="1.4"/>
      <path d="M43 86 V92 M57 86 V92" stroke="#f2c230" stroke-width="7" stroke-linecap="round"/>
      <path d="M36 96 q2 -4 7 -3 q4 -1 6 3 M51 96 q2 -4 7 -3 q4 -1 6 3" stroke="#222" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M38 22 L29 3 L45 16Z M62 22 L71 3 L55 16Z" fill="#3a3f45" stroke="#23262b" stroke-width="1.5" stroke-linejoin="round"/>
      <circle cx="50" cy="32" r="16" fill="#c3c8cf" stroke="#23262b" stroke-width="2"/>
      <ellipse cx="50" cy="34" rx="11" ry="9" fill="#d9dde2"/>
      <circle cx="44" cy="30" r="3" fill="#1a1a1a"/><circle cx="56" cy="30" r="3" fill="#1a1a1a"/>${brilho(43.2, 29.2, .9)}${brilho(55.2, 29.2, .9)}
      <path d="M46 35 Q50 33 54 35 Q54 42 50 46 Q48 42 46 35Z" fill="#2b2b2b"/>`),

    capivara: svg(`<path d="M2 89 H98" stroke="#5c9e3a" stroke-width="5" stroke-linecap="round"/>
      <path d="M8 89 l2 -6 l2 6 M88 89 l2 -7 l2 7" stroke="#5c9e3a" stroke-width="2" fill="none"/>
      <g fill="#7d5130" stroke="#4a2e18" stroke-width="1.5"><rect x="20" y="68" width="9" height="20" rx="4"/><rect x="33" y="70" width="9" height="18" rx="4"/><rect x="56" y="70" width="9" height="18" rx="4"/><rect x="68" y="68" width="9" height="20" rx="4"/></g>
      <ellipse cx="44" cy="58" rx="32" ry="20" fill="#9c6b3f" stroke="#4a2e18" stroke-width="2"/>
      <path d="M24 52 q3 4 0 8 M36 46 q3 4 0 8 M28 64 q3 4 0 8 M50 62 q3 4 0 8" stroke="#7d5130" stroke-width="1.5" fill="none"/>
      <path d="M62 44 Q78 34 92 44 Q98 52 94 60 Q86 64 70 62 Q62 56 62 44Z" fill="#a8764a" stroke="#4a2e18" stroke-width="2"/>
      <ellipse cx="70" cy="38" rx="4" ry="5" fill="#7d5130" stroke="#4a2e18" stroke-width="1.5"/>
      <circle cx="80" cy="46" r="2.3" fill="#1d1d1d"/>${brilho(79.4, 45.4, .7)}
      <ellipse cx="94" cy="52" rx="2.4" ry="3.2" fill="#3a2414"/>
      <path d="M91 59 Q87 60.5 84 58" stroke="#4a2e18" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="38" cy="36" rx="6" ry="4.5" fill="#ffd23f" stroke="#7a5a00" stroke-width="1.2"/><circle cx="43" cy="32.5" r="3.2" fill="#ffd23f" stroke="#7a5a00" stroke-width="1.2"/>
      <path d="M46 32.5 L49.5 33.5 L46 34.5Z" fill="#e07a00"/><circle cx="44" cy="32" r=".8" fill="#111"/>`),

    ariranha: svg(`<path d="M30 92 Q26 56 36 42 Q50 34 64 42 Q74 56 70 92Z" fill="#5a3d2b" stroke="#2b1b10" stroke-width="2"/>
      <path d="M40 46 Q50 44 59 48 Q61 58 52 64 Q48 58 42 60 Q38 52 40 46Z" fill="#f3e1c0"/>
      <path d="M38 62 Q42 71 48 68 M62 62 Q58 71 52 68" stroke="#4a3122" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="35" cy="20" r="3.8" fill="#4a3122"/><circle cx="65" cy="20" r="3.8" fill="#4a3122"/>
      <ellipse cx="50" cy="30" rx="17" ry="14" fill="#5a3d2b" stroke="#2b1b10" stroke-width="2"/>
      <ellipse cx="50" cy="37" rx="9" ry="6" fill="#6e4c37"/>
      <path d="M45 33 Q50 31 55 33 Q53 37 50 37 Q47 37 45 33Z" fill="#1d1d1d"/>
      <circle cx="43" cy="26" r="2.4" fill="#111"/><circle cx="57" cy="26" r="2.4" fill="#111"/>${brilho(42.4, 25.4, .8)}${brilho(56.4, 25.4, .8)}
      <path d="M40 37 l-9 -2 M40 39 l-9 1 M60 37 l9 -2 M60 39 l9 1" stroke="#cbb79a" stroke-width="1"/>
      ${ondas(86)}`),

    // ---------- Frutas ----------
    acai: svg(`<path d="M50 2 V22 M50 22 Q30 30 20 50 M50 22 Q70 30 80 50 M50 22 Q46 40 40 62 M50 22 Q56 40 62 64 M50 22 Q50 50 50 80" stroke="#8a6a32" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      ${[[20, 52], [28, 45], [15, 61], [24, 62], [34, 55], [37, 65], [44, 57], [41, 74], [49, 66], [50, 77], [57, 69], [61, 60], [64, 72], [58, 82], [69, 57], [77, 51], [83, 60], [74, 66], [68, 80], [46, 86], [30, 71], [87, 50], [53, 90], [35, 82], [80, 72], [22, 74]]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#3d1a4a" stroke="#1e0822" stroke-width="1"/>${brilho(x - 2, y - 2, 1.5)}`).join("")}`),

    cupuacu: svg(`<path d="M38 16 V7" stroke="#4a2e18" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="38" cy="50" rx="25" ry="34" fill="#8b5e34" stroke="#4a2e18" stroke-width="2"/>
      <g fill="#a87a48">${[[28, 30], [44, 26], [34, 42], [50, 44], [24, 54], [40, 58], [30, 70], [46, 72], [36, 82]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2"/>`).join("")}</g>
      <ellipse cx="72" cy="66" rx="21" ry="26" fill="#8b5e34" stroke="#4a2e18" stroke-width="2"/>
      <ellipse cx="72" cy="66" rx="16" ry="21" fill="#fff8e8"/>
      <g fill="#7a4a24">${[[66, 56], [78, 56], [65, 68], [79, 68], [72, 78], [72, 48], [72, 63]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="4.5"/>`).join("")}</g>`),

    guarana: svg(`<path d="M50 2 V26 M50 18 Q34 28 26 38 M50 18 Q66 28 74 38 M50 26 Q49 46 48 58 M48 50 Q40 64 36 72 M48 50 Q58 66 62 74" stroke="#5a7a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="38" cy="10" rx="11" ry="5" fill="#3f9e4a" transform="rotate(-25 38 10)"/><ellipse cx="62" cy="10" rx="11" ry="5" fill="#4caf50" transform="rotate(25 62 10)"/>
      ${[[26, 46, 1], [74, 46, 1], [48, 66, 1.12], [33, 80, .9], [64, 84, .9]].map(([x, y, s]) => `<ellipse cx="${x}" cy="${y}" rx="${12 * s}" ry="${13 * s}" fill="#d62828" stroke="#7a1010" stroke-width="1.5"/><ellipse cx="${x}" cy="${y + 2 * s}" rx="${7.5 * s}" ry="${8 * s}" fill="#fff"/><circle cx="${x}" cy="${y + 2 * s}" r="${4.8 * s}" fill="#1d1d1d"/>${brilho(x - 1.6 * s, y + .4 * s, 1.4 * s)}`).join("")}`),

    tucuma: svg(`<path d="M10 14 Q30 4 52 10" stroke="#3f9e4a" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${[[28, 38], [64, 30]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="16" ry="18" fill="#f08c1f" stroke="#8a4a06" stroke-width="2"/><ellipse cx="${x}" cy="${y - 16}" rx="4.5" ry="3" fill="#2f3d1a"/>${brilho(x - 6, y - 6, 3)}`).join("")}
      <ellipse cx="52" cy="72" rx="22" ry="24" fill="#f08c1f" stroke="#8a4a06" stroke-width="2"/>
      <ellipse cx="52" cy="72" rx="17" ry="19" fill="#ffb347"/>
      <ellipse cx="52" cy="72" rx="9" ry="10.5" fill="#3a2414"/>${brilho(49, 68, 2)}`),

    castanha: svg(`<circle cx="44" cy="46" r="34" fill="#6b4423" stroke="#3a2210" stroke-width="2"/>
      <circle cx="44" cy="46" r="27" fill="#d8b98c"/>
      ${[0, 40, 80, 120, 160, 200, 240, 280, 320].map(a => `<path d="M0 -3 L-6 -22 Q0 -26 6 -22Z" fill="#8a5a2e" stroke="#3a2210" stroke-width="1.5" stroke-linejoin="round" transform="translate(44 46) rotate(${a})"/>`).join("")}
      <circle cx="44" cy="46" r="4" fill="#6b4423"/>
      <path d="M78 74 L70 96 Q80 100 90 96Z" fill="#8a5a2e" stroke="#3a2210" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M62 82 L58 98 Q64 100 70 97Z" fill="#f3e6c8" stroke="#a08460" stroke-width="1.5" stroke-linejoin="round"/>`),

    buriti: svg(`${[[30, 34], [66, 30], [40, 70]].map(([x, y]) => {
        let esc = "";
        for (let dy = -12; dy <= 12; dy += 5) for (let dx = -10; dx <= 10; dx += 5) {
          const ox = dx + ((dy / 5) % 2 ? 2.5 : 0);
          if ((ox / 12) ** 2 + (dy / 15) ** 2 < 0.8) esc += `<path d="M${x + ox - 2.5} ${y + dy} q2.5 3 5 0"/>`;
        }
        return `<ellipse cx="${x}" cy="${y}" rx="14" ry="17" fill="#8b2e16" stroke="#4a160a" stroke-width="2"/><g stroke="#5a1d0c" stroke-width="1.1" fill="none">${esc}</g><path d="M${x - 3} ${y - 17} h6" stroke="#4a160a" stroke-width="3"/>`;
      }).join("")}
      <ellipse cx="74" cy="72" rx="16" ry="19" fill="#8b2e16" stroke="#4a160a" stroke-width="2"/>
      <ellipse cx="74" cy="72" rx="12" ry="15" fill="#f7a440"/><ellipse cx="74" cy="72" rx="8" ry="10.5" fill="#e8d6b0"/>`),

    pupunha: svg(`<path d="M50 2 V18 M50 18 Q36 22 30 30 M50 18 Q64 22 70 30 M50 18 V30" stroke="#5a7a2a" stroke-width="3" fill="none" stroke-linecap="round"/>
      ${[[30, 40, "#e8590c", -20], [50, 38, "#dc2f02", 0], [70, 40, "#f08c00", 20], [22, 60, "#dc2f02", -30], [42, 58, "#f08c00", -8], [62, 58, "#e8590c", 10], [80, 60, "#dc2f02", 30], [34, 78, "#e8590c", -15]]
        .map(([x, y, c, r]) => `<g transform="rotate(${r} ${x} ${y})"><path d="M${x} ${y - 13} C${x + 11} ${y - 10} ${x + 11} ${y + 9} ${x} ${y + 11} C${x - 11} ${y + 9} ${x - 11} ${y - 10} ${x} ${y - 13}Z" fill="${c}" stroke="#7a2200" stroke-width="1.5"/>${brilho(x - 3, y - 4, 2)}</g>`).join("")}
      <ellipse cx="68" cy="82" rx="14" ry="13" fill="#e8590c" stroke="#7a2200" stroke-width="1.5"/><ellipse cx="68" cy="82" rx="10.5" ry="9.5" fill="#ffd166"/><circle cx="68" cy="82" r="4" fill="#5a3a1a"/>`),

    camu: svg(`<path d="M4 30 Q50 18 96 34" stroke="#6b4423" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="22" cy="17" rx="10" ry="4.5" fill="#3f9e4a" transform="rotate(-20 22 17)"/><ellipse cx="78" cy="21" rx="10" ry="4.5" fill="#4caf50" transform="rotate(20 78 21)"/><ellipse cx="50" cy="12" rx="10" ry="4.5" fill="#3f9e4a"/>
      ${[[22, 50, "#7b1e3a"], [40, 62, "#c1121f"], [58, 52, "#9d0208"], [75, 64, "#6a994e"], [88, 48, "#a4161a"], [52, 80, "#7b1e3a"], [30, 78, "#c1121f"]]
        .map(([x, y, c]) => `<path d="M${x} ${y - 10} L${x + 1} ${Math.min(y - 10, 30)}" stroke="#6b4423" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="10" fill="${c}" stroke="#3a0a14" stroke-width="1.2"/>${brilho(x - 3.5, y - 3.5, 2.5)}`).join("")}`),

    // ---------- Lugares ----------
    encontro: svg(`<rect width="100" height="100" fill="#8ecae6"/><circle cx="84" cy="14" r="8" fill="#ffd23f"/>
      <path d="M0 40 Q6 30 12 38 Q18 28 26 36 Q34 26 42 36 Q50 28 58 36 Q66 26 74 36 Q82 28 90 36 Q96 30 100 36 V47 H0Z" fill="#2d8a4e"/>
      <path d="M0 46 H53 Q46 58 54 70 Q45 84 50 100 H0Z" fill="#2b1608"/>
      <path d="M53 46 H100 V100 H50 Q45 84 54 70 Q46 58 53 46Z" fill="#c8955a"/>
      <path d="M53 46 Q46 58 54 70 Q45 84 50 100" stroke="#6e4320" stroke-width="2" fill="none" opacity=".6"/>
      <path d="M8 60 h10 M20 76 h12 M10 90 h10" stroke="#5a3a22" stroke-width="1.5"/><path d="M66 58 h12 M80 72 h12 M64 88 h10" stroke="#e4c08c" stroke-width="1.5"/>
      <path d="M60 79 H84 L80 85 H63Z" fill="#fff" stroke="#1d3557" stroke-width="1.5"/><rect x="66" y="73" width="12" height="6" fill="#e63946" stroke="#1d3557" stroke-width="1.2"/>`),

    rio: svg(`<rect width="100" height="100" fill="#9ad0ec"/><circle cx="20" cy="16" r="9" fill="#ffd23f"/>
      <path d="M0 36 Q10 28 20 34 Q30 26 40 34 L44 40 Q30 60 0 74Z" fill="#2d8a4e"/>
      <path d="M100 34 Q90 26 80 32 Q70 26 60 34 L56 40 Q70 60 100 72Z" fill="#3aa457"/>
      <path d="M44 40 H56 Q70 60 100 72 V100 H0 V74 Q30 60 44 40Z" fill="#b98a52"/>
      <path d="M30 70 h14 M60 76 h16 M20 88 h18 M58 92 h20 M46 56 h8" stroke="#e4c08c" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M38 80 H58 L55 85 H41Z" fill="#fff" stroke="#1d3557" stroke-width="1.3"/><rect x="43" y="75" width="10" height="5" fill="#2a9d55" stroke="#1d3557" stroke-width="1"/>`),

    teatro: svg(`<rect width="100" height="100" fill="#8ecae6"/>
      <rect y="84" width="100" height="16" fill="#f4f1ea"/>
      <path d="M0 89 Q6 85 12 89 T24 89 T36 89 T48 89 T60 89 T72 89 T84 89 T96 89 T108 89 M0 96 Q6 92 12 96 T24 96 T36 96 T48 96 T60 96 T72 96 T84 96 T96 96 T108 96" stroke="#222" stroke-width="2.5" fill="none"/>
      <rect x="8" y="50" width="84" height="34" fill="#f2a7a8" stroke="#8a4a4a" stroke-width="1.5"/>
      <rect x="6" y="46" width="88" height="6" fill="#fbe3e3" stroke="#8a4a4a" stroke-width="1.5"/>
      <path d="M28 46 L50 35 L72 46Z" fill="#fbe3e3" stroke="#8a4a4a" stroke-width="1.5"/>
      <rect x="28" y="52" width="44" height="32" fill="#f7c4c4"/>
      <g fill="#fff" stroke="#8a4a4a" stroke-width=".8">${[30, 37.5, 45, 52, 59.5, 67].map(x => `<rect x="${x}" y="52" width="3.5" height="32"/>`).join("")}</g>
      <g fill="#7a4a5a">${[12, 19, 78, 85].map(x => `<path d="M${x} 66 v-6 a2.5 2.5 0 0 1 5 0 v6Z"/><path d="M${x} 79 v-6 a2.5 2.5 0 0 1 5 0 v6Z"/>`).join("")}</g>
      <rect x="38" y="26" width="24" height="10" fill="#fbe3e3" stroke="#8a4a4a" stroke-width="1.5"/>
      <path d="M34 27 Q34 5 50 5 Q66 5 66 27Z" fill="#f4c430" stroke="#7a5a00" stroke-width="1.5"/>
      <path d="M39 26 Q40 11 50 6 M45 27 Q45.5 11 50 6 M55 27 Q54.5 11 50 6 M61 26 Q60 11 50 6" stroke="#1f8a4c" stroke-width="2.4" fill="none"/>
      <path d="M35.5 19 Q50 15 64.5 19 M38.5 12 Q50 9 61.5 12" stroke="#1d4ed8" stroke-width="2" fill="none"/>
      <rect x="47" y="0.5" width="6" height="5" fill="#fbe3e3" stroke="#8a4a4a" stroke-width="1"/>`),

    igarape: svg(`<rect width="100" height="100" fill="#1f6b3a"/>
      <g fill="#7a5a3a">${[8, 22, 76, 90].map(x => `<rect x="${x}" y="20" width="4" height="70"/>`).join("")}</g>
      ${[[10, 14, 14, "#2f8f46"], [30, 8, 12, "#3aa457"], [70, 10, 14, "#2f8f46"], [90, 16, 12, "#48b866"], [50, 4, 10, "#3aa457"], [6, 40, 9, "#48b866"], [94, 44, 9, "#3aa457"]].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join("")}
      <path d="M38 100 Q28 80 44 66 Q58 54 46 42 Q38 34 48 24 L56 24 Q48 34 56 42 Q70 56 56 68 Q42 80 64 100Z" fill="#3b2412"/>
      <path d="M44 84 h8 M50 60 h6 M48 38 h5" stroke="#8a6a4a" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M44 76 Q52 82 60 76 L58 79 Q52 84 46 79Z" fill="#a0673a" stroke="#4a2e18" stroke-width="1.2"/>
      <path d="M18 92 q4 -8 8 0 M70 92 q4 -8 8 0 M30 96 q3 -6 6 0" stroke="#5cc26e" stroke-width="2" fill="none"/>`),

    cheia: svg(`<rect width="50" height="100" fill="#9ad0ec"/><rect x="50" width="50" height="100" fill="#b8e0f4"/>
      <path d="M0 52 Q12 49 25 52 T50 52 V100 H0Z" fill="#b98a52"/>
      <path d="M50 80 Q60 76 70 80 L100 74 V100 H50Z" fill="#ecd29b"/><path d="M50 86 Q62 83 74 86 T100 86 V100 H50Z" fill="#b98a52"/>
      ${[[0, 0], [50, 0]].map(([ox]) => `<g transform="translate(${ox} 0)"><path d="M14 50 V92 M24 50 V92 M34 50 V92" stroke="#6b4423" stroke-width="2.5"/><rect x="10" y="36" width="30" height="14" fill="#e9c46a" stroke="#6b4423" stroke-width="1.5"/><path d="M7 37 L25 24 L43 37Z" fill="#e63946" stroke="#7a1010" stroke-width="1.5"/><rect x="21" y="41" width="7" height="9" fill="#6b4423"/></g>`).join("")}
      <path d="M44 22 V8 M40 12 L44 7 L48 12" stroke="#1d4ed8" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M94 8 V22 M90 18 L94 23 L98 18" stroke="#c0392b" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M50 0 V100" stroke="#fff" stroke-width="2"/>`),

    samauma: svg(`<rect width="100" height="100" fill="#a8dcf0"/>
      <rect y="86" width="100" height="14" fill="#5c9e3a"/>
      ${[[10, 78, 9, "#3a8f4a"], [22, 82, 7, "#48b866"], [84, 78, 9, "#3a8f4a"], [92, 82, 7, "#2f8f46"]].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join("")}
      <path d="M44 87 L46 28 L54 28 L56 87Z" fill="#cfc6b8" stroke="#7a6f60" stroke-width="1.5"/>
      <path d="M28 88 Q44 72 46 54 L48 88Z M72 88 Q56 72 54 54 L52 88Z M38 88 Q46 76 48 64 L50 88Z" fill="#bdb3a3" stroke="#7a6f60" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M50 30 L22 20 M50 30 L78 18 M50 32 L36 14 M50 32 L64 12" stroke="#a89f90" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="50" cy="22" rx="46" ry="13" fill="#2f8f46"/><ellipse cx="28" cy="15" rx="20" ry="9" fill="#3aa457"/><ellipse cx="72" cy="14" rx="22" ry="9" fill="#3aa457"/><ellipse cx="50" cy="9" rx="20" ry="8" fill="#48b866"/>
      <circle cx="66" cy="80" r="1.6" fill="#5a3a1a"/><path d="M66 81.5 V86 M64 83 h4 M66 86 l-1.5 2 M66 86 l1.5 2" stroke="#e07a00" stroke-width="1.2"/>`),

    vitoria: svg(`<rect width="100" height="100" rx="14" fill="#2f7f8f"/>
      <path d="M6 30 h14 M70 90 h16 M60 12 h12" stroke="#7fc6d2" stroke-width="1.6" stroke-linecap="round"/>
      ${[[30, 66, 25], [74, 38, 21], [82, 80, 13]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .58}" fill="#3e8e41" stroke="#b03a2e" stroke-width="3"/><ellipse cx="${x}" cy="${y}" rx="${r * .82}" ry="${r * .46}" fill="#66bb6a"/><path d="M${x} ${y} L${x + r * .82} ${y + 2}" stroke="#2f7f8f" stroke-width="2"/>${[0, 60, 120, 180, 240].map(a => `<path d="M${x} ${y} l${(Math.cos(a * Math.PI / 180) * r * .7).toFixed(1)} ${(Math.sin(a * Math.PI / 180) * r * .4).toFixed(1)}" stroke="#3e8e41" stroke-width="1"/>`).join("")}`).join("")}
      <g transform="translate(52 56)">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<ellipse cx="0" cy="-9" rx="4" ry="9" fill="#fff" stroke="#e7a1b8" stroke-width="1" transform="rotate(${a})"/>`).join("")}${[22, 112, 202, 292].map(a => `<ellipse cx="0" cy="-6" rx="3" ry="6" fill="#f48fb1" transform="rotate(${a})"/>`).join("")}<circle r="3.5" fill="#ffd23f"/></g>`),

    floresta: svg(`<rect width="100" height="100" fill="#9ad0ec"/>
      <g fill="#fff"><ellipse cx="24" cy="16" rx="14" ry="6"/><ellipse cx="32" cy="12" rx="9" ry="6"/><ellipse cx="72" cy="20" rx="16" ry="6"/><ellipse cx="80" cy="15" rx="9" ry="6"/></g>
      <path d="M20 24 l-2 6 M28 24 l-2 6 M70 28 l-2 6 M78 28 l-2 6" stroke="#4a90c2" stroke-width="1.5" stroke-linecap="round"/>
      <rect x="47" y="40" width="5" height="40" fill="#7a5a3a"/>
      ${[[50, 36, 18, "#2f8f46"], [14, 60, 16, "#3aa457"], [36, 58, 15, "#2f8f46"], [66, 58, 16, "#48b866"], [88, 60, 15, "#2f8f46"], [6, 80, 14, "#226b36"], [26, 80, 15, "#2f8f46"], [50, 78, 16, "#3aa457"], [74, 80, 15, "#226b36"], [96, 80, 13, "#3aa457"], [16, 96, 14, "#1d5c2e"], [44, 96, 15, "#226b36"], [70, 98, 15, "#1d5c2e"], [92, 96, 12, "#226b36"]].map(([x, y, r, c]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join("")}
      <path d="M58 46 l3 -2 l3 2 M30 66 l3 -2 l3 2" stroke="#e63946" stroke-width="2" fill="none"/>`),

    barco: svg(`<rect width="100" height="100" rx="16" fill="#9ad0ec"/>
      <path d="M0 64 Q12 58 25 64 T50 64 T75 64 T100 64 V100 H0Z" fill="#2b1608"/>
      <path d="M0 64 H100" stroke="none"/>
      <path d="M50 64 Q62 58 75 64 T100 64 V100 H50Z" fill="#c8955a"/>
      <path d="M14 58 H86 L78 70 H22Z" fill="#fff" stroke="#1d3557" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M22 66 H80" stroke="#1d6fd8" stroke-width="3"/>
      <rect x="24" y="44" width="50" height="14" fill="#fff" stroke="#1d3557" stroke-width="2"/>
      ${[30, 40, 50, 60].map(x => `<rect x="${x}" y="48" width="6" height="6" fill="#8ecae6" stroke="#1d3557" stroke-width="1"/>`).join("")}
      <path d="M20 44 H78 L74 38 H24Z" fill="#e63946" stroke="#1d3557" stroke-width="2" stroke-linejoin="round"/>
      <rect x="64" y="24" width="3" height="14" fill="#1d3557"/><path d="M67 24 L80 28 L67 32Z" fill="#2a9d55"/>
      <circle cx="16" cy="16" r="8" fill="#ffd23f"/>
      <path d="M8 80 h14 M60 84 h14 M34 92 h12" stroke="#fff" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>`),

    diario: svg(`<rect x="16" y="10" width="68" height="82" rx="8" fill="#2a9d55" stroke="#1b6b3a" stroke-width="2.5"/>
      <rect x="22" y="14" width="58" height="74" rx="5" fill="#fffdf6"/>
      <rect x="16" y="10" width="10" height="82" rx="4" fill="#1b6b3a"/>
      <path d="M34 30 H70 M34 70 H70 M34 78 H60" stroke="#c9c2a8" stroke-width="2.5" stroke-linecap="round"/>
      <g fill="#e07a00"><ellipse cx="52" cy="54" rx="9" ry="7"/><circle cx="41" cy="44" r="4"/><circle cx="48" cy="39" r="4"/><circle cx="57" cy="39" r="4"/><circle cx="64" cy="44" r="4"/></g>`),
  };

  // ---------- Sons sintetizados (estilizados) ----------
  const N = (f, o) => Motor.nota(f, o);
  const SONS = {
    onca: () => { Motor.ruido({ dur: 0.9, vol: 0.5, filtro: "lowpass", freq: 260 }); N(95, { dur: 0.9, tipo: "sawtooth", vol: 0.18, ate: 55 }); },
    boto: () => { for (let i = 0; i < 8; i++) N(2400, { dur: 0.03, tipo: "square", vol: 0.06, inicio: i * 0.06 }); N(3000, { dur: 0.5, vol: 0.12, inicio: 0.55, ate: 4200 }); N(4200, { dur: 0.3, vol: 0.1, inicio: 1.05, ate: 3200 }); },
    arara: () => [0, 0.35].forEach(t => { Motor.ruido({ dur: 0.22, vol: 0.35, filtro: "bandpass", freq: 2000, inicio: t }); N(1100, { dur: 0.22, tipo: "sawtooth", vol: 0.1, inicio: t, ate: 700 }); }),
    tucano: () => [0, 0.18, 0.36].forEach(t => N(420, { dur: 0.12, tipo: "square", vol: 0.1, inicio: t, ate: 300 })),
    uirapuru: () => [1568, 1760, 1319, 1976, 1568, 2093, 1760].forEach((f, i) => N(f, { dur: 0.22, vol: 0.18, inicio: i * 0.17 })),
    harpia: () => { N(2200, { dur: 0.7, vol: 0.15, ate: 1300 }); N(2100, { dur: 0.5, vol: 0.12, inicio: 0.8, ate: 1400 }); },
    macaco: () => [0, 0.2, 0.4, 0.6].forEach((t, i) => N(i % 2 ? 700 : 450, { dur: 0.16, tipo: "triangle", vol: 0.22, inicio: t, ate: i % 2 ? 500 : 650 })),
    jacare: () => { N(70, { dur: 0.7, tipo: "sawtooth", vol: 0.2, ate: 55 }); Motor.ruido({ dur: 0.7, vol: 0.3, filtro: "lowpass", freq: 180 }); },
    preguica: () => N(1700, { dur: 1, vol: 0.14, ate: 1450 }),
    ariranha: () => [0, 0.15, 0.3, 0.5].forEach(t => N(1800, { dur: 0.1, vol: 0.14, inicio: t, ate: 2600 })),
    capivara: () => [0, 0.12, 0.24].forEach(t => N(900, { dur: 0.06, tipo: "square", vol: 0.07, inicio: t })),
    sibilo: () => Motor.ruido({ dur: 0.9, vol: 0.2, filtro: "highpass", freq: 3500 }),
    agua: () => { Motor.ruido({ dur: 1.2, vol: 0.16, filtro: "lowpass", freq: 700 }); [0.1, 0.35, 0.6, 0.9].forEach(t => N(500 + Math.random() * 300, { dur: 0.08, vol: 0.14, inicio: t, ate: 1200 })); },
    floresta: () => { Motor.ruido({ dur: 1.4, vol: 0.05, filtro: "highpass", freq: 5000 }); SONS.uirapuru(); },
    teatro: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => N(f, { dur: 0.3, tipo: "triangle", vol: 0.16, inicio: i * 0.16 })),
    buzina: () => { N(330, { dur: 0.35, tipo: "square", vol: 0.08 }); N(392, { dur: 0.35, tipo: "square", vol: 0.06 }); },
    tronco: () => { N(120, { dur: 0.25, tipo: "triangle", vol: 0.35, ate: 60 }); Motor.ruido({ dur: 0.3, vol: 0.25, filtro: "lowpass", freq: 600 }); },
  };

  // ---------- Conteúdo (curiosidades conferidas) ----------
  // agua: o bicho aparece dentro do rio no passeio (senão, na margem)
  const BICHOS = [
    ["onca", "Onça-pintada", "a", "A onça-pintada é o maior felino das Américas. E, diferente de muitos gatos, ela adora nadar!", "onca"],
    ["boto", "Boto-cor-de-rosa", "o", "O boto-cor-de-rosa é um golfinho de rio. Ele acha comida na água escura usando sons, como um eco.", "boto", true],
    ["peixeboi", "Peixe-boi", "o", "O peixe-boi não é peixe: é um mamífero, que mama quando é filhote. Ele come plantas aquáticas.", "agua", true],
    ["arara", "Arara-vermelha", "a", "A arara-vermelha tem um bico tão forte que quebra sementes duras. As araras costumam voar em casais.", "arara"],
    ["tucano", "Tucano", "o", "O bico do tucano é enorme, mas é leve, porque por dentro é cheio de espacinhos, como uma esponja.", "tucano"],
    ["preguica", "Bicho-preguiça", "o", "O bicho-preguiça vive pendurado nas árvores e se mexe bem devagar. Ele desce mais ou menos uma vez por semana, só para fazer cocô!", "preguica"],
    ["macaco", "Macaco-prego", "o", "O macaco-prego é muito esperto: alguns usam pedras para quebrar cocos e sementes duras.", "macaco"],
    ["sucuri", "Sucuri", "a", "A sucuri é uma das maiores cobras do mundo. Ela não tem veneno e vive perto da água.", "sibilo", true],
    ["pirarucu", "Pirarucu", "o", "O pirarucu é um dos maiores peixes de rio do mundo e sobe até a superfície para respirar ar. O nome quer dizer peixe vermelho, em tupi.", "agua", true],
    ["jacare", "Jacaré-açu", "o", "O jacaré-açu é o maior jacaré da Amazônia. Ele fica boiando parado, só com os olhos e o nariz para fora d'água.", "jacare", true],
    ["tartaruga", "Tartaruga-da-amazônia", "a", "A tartaruga-da-amazônia é a maior tartaruga de água doce da América do Sul. Na vazante, ela põe os ovos nas praias de areia do rio.", "agua", true],
    ["uirapuru", "Uirapuru", "o", "O uirapuru tem um canto lindo. A lenda diz que, quando ele canta, os outros bichos da floresta ficam em silêncio para ouvir.", "uirapuru"],
    ["harpia", "Harpia", "a", "A harpia, também chamada de gavião-real, é uma das aves de rapina mais fortes do mundo. Suas garras são enormes!", "harpia"],
    ["capivara", "Capivara", "a", "A capivara é o maior roedor do mundo. Ela nada muito bem e adora ficar perto da água.", "capivara"],
    ["ariranha", "Ariranha", "a", "A ariranha é chamada de lontra gigante. Vive em família, nada muito rápido e conversa com vários sons.", "ariranha", true],
  ].map(([id, nome, art, curio, som, agua]) => ({ id, nome, art, curio, som, agua: !!agua, tipo: "bicho" }));

  const FRUTAS = [
    ["acai", "Açaí", "o", "O açaí nasce em cachos no alto de uma palmeira, o açaizeiro. A frutinha é roxa, quase preta."],
    ["cupuacu", "Cupuaçu", "o", "O cupuaçu é primo do cacau. A polpa é branquinha e cheirosa e vira suco, creme e doce."],
    ["guarana", "Guaraná", "o", "O guaraná parece um olhinho: casca vermelha, parte branca e semente preta. A cidade de Maués, no Amazonas, é chamada de terra do guaraná."],
    ["tucuma", "Tucumã", "o", "O tucumã é a fruta laranjinha de uma palmeira. Em Manaus, ele vai no famoso X-Caboquinho, com queijo coalho e banana."],
    ["castanha", "Castanha-do-pará", "a", "A castanha-do-pará nasce dentro de um ouriço, uma casca dura e redonda. A cutia consegue abrir o ouriço e enterra castanhas que viram árvores novas!"],
    ["buriti", "Buriti", "o", "O buriti tem a casca cheia de escamas, como um peixinho. A polpa é laranja e tem muita vitamina A."],
    ["pupunha", "Pupunha", "a", "A pupunha é a fruta de uma palmeira. Cozida com sal, ela é uma delícia no café da manhã!"],
    ["camu", "Camu-camu", "o", "O camu-camu é uma frutinha que nasce na beira dos rios e tem muito mais vitamina C que a laranja!"],
  ].map(([id, nome, art, curio]) => ({ id, nome, art, curio, tipo: "fruta" }));

  const LUGARES = [
    ["encontro", "Encontro das Águas", "o", "Perto de Manaus, a água escura do Rio Negro encontra a água barrenta do Rio Solimões. Elas correm lado a lado, sem se misturar, por vários quilômetros!", "agua"],
    ["rio", "Rio Amazonas", "o", "O Rio Amazonas é o rio com mais água do mundo. Ele nasce nos Andes, no Peru, e deságua no oceano Atlântico.", "agua"],
    ["teatro", "Teatro Amazonas", "o", "O Teatro Amazonas fica em Manaus e foi inaugurado em 1896. A cúpula tem milhares de pecinhas coloridas, nas cores da bandeira do Brasil.", "teatro"],
    ["igarape", "Igarapé", "o", "Igarapé é um riozinho estreito no meio da floresta. Em tupi, o nome quer dizer caminho da canoa.", "agua"],
    ["cheia", "Cheia e vazante", "a", "Na Amazônia, os rios sobem e descem muitos metros durante o ano. Na cheia, a água chega perto das casas; na vazante, aparecem praias de areia.", "agua", "Cadê a cheia e a vazante?"],
    ["samauma", "Samaúma", "a", "A samaúma é chamada de rainha da floresta. Ela pode passar de 50 metros de altura e tem raízes enormes, como paredes, chamadas sapopemas.", "floresta"],
    ["vitoria", "Vitória-régia", "a", "A vitória-régia tem folhas redondas gigantes que boiam na água. A flor abre à noite: no primeiro dia é branca e, no segundo, fica rosada.", "agua"],
    ["floresta", "Floresta Amazônica", "a", "A Floresta Amazônica é a maior floresta tropical do mundo. As árvores soltam tanta água no ar que formam rios voadores, que levam chuva para outras partes do Brasil.", "floresta"],
  ].map(([id, nome, art, curio, som, cade]) => ({ id, nome, art, curio, som, cade, tipo: "lugar" }));

  const TODOS = [...BICHOS, ...FRUTAS, ...LUGARES];
  const POR_ID = Object.fromEntries(TODOS.map(i => [i.id, i]));
  TODOS.forEach(i => { i.desenho = ARTE[i.id]; });
  const tocarSom = item => { const s = item.som && SONS[item.som]; if (s) s(); };
  const fala = item => `${Motor.maiuscula(item.nome)}! ${item.curio}`;

  // Diário de bordo: bichos já encontrados no passeio (fica no aparelho)
  const CHAVE_DIARIO = "amazonia-diario";
  function diario() { try { return JSON.parse(localStorage.getItem(CHAVE_DIARIO)) || []; } catch (e) { return []; } }
  function anotar(ids) {
    const novo = [...new Set([...diario(), ...ids])];
    try { localStorage.setItem(CHAVE_DIARIO, JSON.stringify(novo)); } catch (e) { /* ok */ }
    return novo;
  }

  const pequeno = faixa => ["3-4", "4-5"].includes(faixa.id);
  const grande = faixa => ["6-8", "8-10"].includes(faixa.id);

  // Fundo de tela cheia do jogo (dentro de #area-jogo)
  function telaCheia(area, classe) {
    area.innerHTML = "";
    const t = document.createElement("div");
    t.className = `amz-tela ${classe || ""}`;
    area.appendChild(t);
    return t;
  }
  function botao(classe, html, rotulo, aoClicar) {
    const b = document.createElement("button");
    b.className = classe;
    b.innerHTML = html;
    if (rotulo) b.setAttribute("aria-label", rotulo);
    b.addEventListener("click", aoClicar);
    return b;
  }

  // ---------- 📖 Conhecer ----------
  const CATEGORIAS = [
    { id: "bicho", nome: "Bichos", icone: "🐾", itens: BICHOS, fala: "Os bichos da Amazônia!" },
    { id: "fruta", nome: "Frutas", icone: "🍇", itens: FRUTAS, fala: "As frutas da Amazônia!" },
    { id: "lugar", nome: "Rios e lugares", icone: "🏞️", itens: LUGARES, fala: "Rios e lugares da Amazônia!" },
  ];
  function conhecer(area) {
    const tela = telaCheia(area, "amz-conhecer");
    const topo = document.createElement("div");
    topo.className = "amz-topo";
    const lista = document.createElement("div");
    lista.className = "amz-grade";
    const ficha = document.createElement("div");
    ficha.className = "amz-ficha";
    ficha.style.display = "none";
    tela.append(topo, lista, ficha);
    let cat = CATEGORIAS[0];
    const chips = CATEGORIAS.map(c => {
      const b = botao("chip amz-cat", `${c.icone} ${c.nome}`, c.nome, () => { cat = c; montar(); Motor.falar(c.fala); });
      topo.appendChild(b);
      return b;
    });
    topo.appendChild(Motor.botaoSom());

    function montar() {
      chips.forEach((b, i) => b.classList.toggle("ativo", CATEGORIAS[i] === cat));
      tela.dataset.cat = cat.id;
      lista.innerHTML = "";
      cat.itens.forEach((item, i) => {
        const b = botao("amz-card", `${item.desenho}<span class="amz-nome"></span>`, item.nome, () => abrir(i));
        b.querySelector(".amz-nome").textContent = item.nome;
        lista.appendChild(b);
      });
      lista.scrollTop = 0;
      fechar();
    }
    function fechar() {
      ficha.style.display = "none";
      lista.style.display = "";
      topo.style.display = "";
    }
    function abrir(i) {
      const item = cat.itens[i];
      lista.style.display = "none";
      topo.style.display = "none";
      ficha.style.display = "";
      ficha.innerHTML = `<div class="amz-ficha-fig">${item.desenho}</div><div class="amz-ficha-info"><div class="amz-ficha-nome"></div><div class="amz-ficha-texto"></div><div class="amz-ficha-botoes"></div></div>`;
      ficha.querySelector(".amz-ficha-nome").textContent = item.nome;
      ficha.querySelector(".amz-ficha-texto").textContent = item.curio;
      const fig = ficha.querySelector(".amz-ficha-fig");
      const bs = ficha.querySelector(".amz-ficha-botoes");
      const n = cat.itens.length;
      bs.append(
        botao("chip", "⬅️", "Anterior", () => abrir((i + n - 1) % n)),
        botao("chip", "🔊 Ouvir", "Ouvir de novo", () => { Motor.animar(fig, "pula"); Motor.falar(fala(item)); }),
      );
      if (item.som) bs.append(botao("chip", "🎵 Som", "Ouvir o som", () => { Motor.animar(fig, "pula"); tocarSom(item); }));
      bs.append(
        botao("chip", "📋 Todos", "Ver todos", fechar),
        botao("chip executar", "➡️", "Próximo", () => abrir((i + 1) % n)),
      );
      fig.addEventListener("pointerdown", () => { Motor.animar(fig, "pula"); tocarSom(item); });
      Motor.animar(fig, "pula");
      tocarSom(item);
      Motor.depois(() => Motor.falar(fala(item)), item.som ? 700 : 0);
    }
    montar();
    Motor.falar("Toque num bicho para conhecer!");
  }

  // ---------- ❓ Perguntas ----------
  function desenharOpcao(comNome) {
    return (item, b) => {
      b.classList.add("amz-op");
      if (item.desenho) {
        b.innerHTML = `${item.desenho}${comNome ? '<span class="amz-op-nome"></span>' : ""}`;
        if (comNome) b.querySelector(".amz-op-nome").textContent = item.nome;
        b.dataset.tipo = item.tipo;
      } else {
        b.textContent = item.nome;
        b.classList.add("palavra");
      }
    };
  }
  function caixaQuiz(area) {
    const t = telaCheia(area, "amz-quiz");
    return t;
  }

  // Cadê? (pequenos): a voz pede, a criança toca na figura
  function cade(area, faixa) {
    const caixa = caixaQuiz(area);
    const pool = faixa.id === "3-4" ? BICHOS : faixa.id === "4-5" ? [...BICHOS, ...FRUTAS] : TODOS;
    const opcoes = faixa.id === "3-4" ? 2 : 3;
    let ultimo = null;
    const pergunta = i => i.cade || (i.tipo === "fruta" ? `Qual fruta é ${i.art} ${i.nome}?` : `Cadê ${i.art} ${i.nome}?`);
    Motor.modoQuiz({
      area: caixa, desenhar: desenharOpcao(faixa.id === "5-6"), rodada: faixa.id === "5-6" ? 8 : undefined,
      gerar() {
        const alvo = Motor.sortear(pool.filter(i => i !== ultimo));
        ultimo = alvo;
        const mesmos = pool.filter(i => i.tipo === alvo.tipo && i !== alvo);
        return { pergunta: pergunta(alvo), opcoes: [alvo, ...Motor.embaralhar(mesmos).slice(0, opcoes - 1)], certa: alvo };
      },
      aoAcertar: item => { tocarSom(item); return Motor.falar(pequeno(faixa) ? `${Motor.maiuscula(item.nome)}!` : fala(item)); },
    });
  }

  // Curiosidades (maiores). `certo` e `outros`: id de um item (vira figura) ou texto.
  // nivel 2: só 8 a 10 anos.
  const PERGUNTAS = [
    [1, "Qual é o maior felino das Américas?", "onca", ["capivara", "ariranha"]],
    [1, "Qual destes é um golfinho de rio?", "boto", ["peixeboi", "pirarucu"]],
    [1, "Qual é o maior roedor do mundo?", "capivara", ["preguica", "macaco"]],
    [1, "Qual bicho vive pendurado nas árvores e se mexe bem devagar?", "preguica", ["onca", "jacare"]],
    [1, "Qual ave tem um bico enorme, mas bem leve?", "tucano", ["harpia", "uirapuru"]],
    [1, "Qual fruta é prima do cacau?", "cupuacu", ["acai", "pupunha"]],
    [1, "Qual fruta parece um olhinho?", "guarana", ["tucuma", "camu"]],
    [1, "Qual frutinha roxa nasce em cachos no alto de uma palmeira?", "acai", ["buriti", "cupuacu"]],
    [1, "Em que cidade fica o Teatro Amazonas?", "Manaus", ["Belém", "Porto Velho"]],
    [1, "Qual planta tem folhas redondas gigantes que boiam na água?", "vitoria", ["samauma", "acai"]],
    [1, "Qual destes não é peixe, apesar do nome?", "peixeboi", ["pirarucu"]],
    [1, "Qual é a maior floresta tropical do mundo?", "Amazônia", ["Mata Atlântica", "Caatinga"]],
    [1, "Qual cobra gigante não tem veneno?", "Sucuri", ["Jararaca", "Cascavel"]],
    [1, "Qual bicho é chamado de lontra gigante?", "ariranha", ["capivara", "boto"]],
    [1, "Que fruta vai no X-Caboquinho?", "tucuma", ["acai", "cupuacu"]],
    [2, "O nome pirarucu, em tupi, quer dizer...", "Peixe vermelho", ["Peixe voador", "Rio grande"]],
    [2, "Quais rios se encontram perto de Manaus sem misturar as águas?", "Negro e Solimões", ["Tapajós e Xingu", "Madeira e Purus"]],
    [2, "De que cor é a água do Rio Negro?", "Escura", ["Barrenta", "Verde"]],
    [2, "O que quer dizer igarapé, em tupi?", "Caminho da canoa", ["Casa do peixe", "Rio do céu"]],
    [2, "Como se chama a época do ano em que o rio sobe?", "Cheia", ["Vazante"]],
    [2, "Como se chamam as raízes enormes da samaúma?", "Sapopemas", ["Cipós", "Galhos"]],
    [2, "Que bicho consegue abrir o ouriço da castanha e planta castanheiras novas?", "Cutia", ["Tucano", "Boto"]],
    [2, "Qual fruta tem muito mais vitamina C que a laranja?", "camu", ["tucuma", "castanha"]],
    [2, "A harpia também é chamada de...", "Gavião-real", ["Bem-te-vi", "Beija-flor"]],
    [2, "Em que época a tartaruga-da-amazônia põe os ovos nas praias do rio?", "Vazante", ["Cheia"]],
    [2, "Onde nasce o Rio Amazonas?", "Nos Andes, no Peru", ["No oceano", "Em Manaus"]],
    [2, "Em que ano o Teatro Amazonas foi inaugurado?", "1896", ["1500", "2000"]],
  ];
  const opcao = x => POR_ID[x] || { nome: x };
  function curiosidades(area, faixa) {
    const caixa = caixaQuiz(area);
    const banco = PERGUNTAS.filter(p => faixa.id === "8-10" || p[0] === 1);
    let fila = [];
    Motor.modoQuiz({
      area: caixa, rodada: faixa.id === "8-10" ? 10 : 8, desenhar: desenharOpcao(true), classeEnunciado: "amz-pergunta",
      gerar() {
        if (!fila.length) fila = Motor.embaralhar(banco);
        const [, texto, certo, outros] = fila.shift();
        const certa = opcao(certo);
        return { pergunta: texto, opcoes: [certa, ...outros.map(opcao)], certa, mostrar: el => { el.textContent = texto; } };
      },
      aoAcertar: item => {
        if (!item.curio) return null;
        tocarSom(item);
        return Motor.falar(item.curio);
      },
    });
  }

  // ---------- 📒 Diário de bordo ----------
  function verDiario(area, faixa) {
    const tela = telaCheia(area, "amz-conhecer amz-diario");
    tela.dataset.cat = "bicho";
    const vistos = diario();
    const topo = document.createElement("div");
    topo.className = "amz-topo";
    const conta = document.createElement("span");
    conta.className = "amz-conta";
    conta.textContent = `📒 ${vistos.filter(id => POR_ID[id]).length} de ${BICHOS.length} bichos`;
    topo.append(conta, botao("chip executar", "🚤 Passear", "Ir passear de barco", () => passeio(area, faixa)), Motor.botaoSom());
    const lista = document.createElement("div");
    lista.className = "amz-grade";
    BICHOS.forEach(item => {
      const visto = vistos.includes(item.id);
      const b = botao("amz-card" + (visto ? "" : " escondido"), `${item.desenho}<span class="amz-nome"></span>`, visto ? item.nome : "Ainda não encontrado", () => {
        Motor.animar(b, "pula");
        if (visto) { tocarSom(item); Motor.falar(fala(item)); } else Motor.falar("Esse bicho ainda não apareceu. Faça o passeio de barco para encontrar!");
      });
      b.querySelector(".amz-nome").textContent = visto ? item.nome : "?";
      lista.appendChild(b);
    });
    tela.append(topo, lista);
    Motor.falar(vistos.length ? `Você já encontrou ${vistos.length} ${vistos.length === 1 ? "bicho" : "bichos"} no passeio de barco!` : "O diário está vazio. Faça o passeio de barco para encontrar os bichos!");
  }

  // ---------- 🚤 Passeio de barco ----------
  // Vista de cima: o rio desce pela tela e o barco fica embaixo. Mundo em "unidades": a tela
  // mostra pelo menos 300 de largura e 360 de altura. `d` = distância ao longo do rio.
  const imagens = {};
  function imagem(id) {
    if (!imagens[id]) {
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(ARTE[id]);
      imagens[id] = img;
    }
    return imagens[id];
  }
  let passeioAberto = null; // a tela do passeio (para o `teclas` do jogo)

  function passeio(area, faixa) {
    const peq = pequeno(faixa), med = faixa.id === "5-6";
    const CFG = {
      vel: peq ? 62 : med ? 78 : 92,
      nBichos: peq ? 5 : med ? 6 : 8,
      troncos: peq ? 0.45 : med ? 0.75 : 1.05, // por 300 unidades
      perto: peq ? 9999 : med ? 125 : 100,     // distância para "ver" o bicho
    };
    const sessao = Motor.sessaoAtual();
    const vivo = () => sessao === Motor.sessaoAtual() && document.contains(tela);

    area.innerHTML = "";
    const tela = document.createElement("div");
    tela.className = "arcade-tela amz-barco";
    area.appendChild(tela);
    passeioAberto = tela;
    const topo = document.createElement("div");
    topo.className = "arcade-topo";
    const info = document.createElement("div");
    info.className = "arcade-info";
    info.innerHTML = `<span class="amz-i-frutas"></span><span class="amz-i-bichos"></span><span class="amz-progresso"><i></i></span>`;
    const pausa = botao("chip", "⏸️", "Pausar", () => alternarPausa());
    topo.append(info, pausa, Motor.botaoSom());
    const meio = document.createElement("div");
    meio.className = "amz-barco-meio";
    const palco = document.createElement("div");
    palco.className = "arcade-palco";
    const canvas = document.createElement("canvas");
    palco.appendChild(canvas);
    const aviso = document.createElement("div");
    aviso.className = "amz-aviso";
    palco.appendChild(aviso);
    const bEsq = document.createElement("button");
    bEsq.className = "arcade-botao amz-esq";
    bEsq.textContent = "⬅️";
    bEsq.setAttribute("aria-label", "Esquerda");
    const bDir = document.createElement("button");
    bDir.className = "arcade-botao amz-dir";
    bDir.textContent = "➡️";
    bDir.setAttribute("aria-label", "Direita");
    meio.append(bEsq, palco, bDir);
    tela.append(topo, meio);
    const ctx = canvas.getContext("2d");

    // ---------- Tamanho ----------
    let escala = 1, W = 300, H = 360, BARCO_Y = 300;
    function medir() {
      tela.classList.toggle("deitado", tela.clientWidth > tela.clientHeight);
      const lw = palco.clientWidth, lh = palco.clientHeight;
      if (!lw || !lh) return;
      const dpr = window.devicePixelRatio || 1;
      Object.assign(canvas, { width: Math.round(lw * dpr), height: Math.round(lh * dpr) });
      Object.assign(canvas.style, { width: lw + "px", height: lh + "px" });
      escala = Math.min(lh / 360, lw / 300);
      W = lw / escala; H = lh / escala;
      BARCO_Y = H - 62;
      ctx.setTransform(dpr * escala, 0, 0, dpr * escala, 0, 0);
      if (rio) desenhar();
    }
    const obs = new ResizeObserver(() => { if (vivo()) medir(); else obs.disconnect(); });
    obs.observe(palco);

    // ---------- O rio ----------
    // Curva do rio e largura na distância d (as margens ondulam)
    const centro = d => W / 2 + Math.sin(d / 420) * 18 + Math.sin(d / 157) * 6;
    const meiaLarg = d => Math.min(118, W / 2 - 34) + Math.sin(d / 97) * 6 + Math.sin(d / 41) * 3;
    const S = CFG.vel * 8.5; // espaço entre bichos (dá tempo de ouvir a curiosidade)
    let rio = null;
    function montarRio() {
      const objs = [];
      const escolhidos = Motor.embaralhar(BICHOS).slice(0, CFG.nBichos);
      const metade = Math.ceil(CFG.nBichos / 2);
      const E0 = 420 + metade * S + S * 0.15;      // Encontro das Águas
      escolhidos.forEach((b, i) => {
        const d = 420 + i * S + (i >= metade ? S * 1.4 : 0);
        objs.push({ tipo: "bicho", d, item: b, lado: Math.random() < 0.5 ? -1 : 1, fase: Math.random() * 6 });
      });
      const FIM = objs[objs.length - 1].d + S * 0.85;
      // Troncos e frutas espalhados (sem ficar em cima uns dos outros)
      let d = 300;
      while (d < FIM - 150) {
        d += 300 / CFG.troncos * (0.6 + Math.random() * 0.8);
        if (d > FIM - 150) break;
        objs.push({ tipo: "tronco", d, xr: (Math.random() * 1.5 - 0.75), w: 44 + Math.random() * 26, ang: (Math.random() - 0.5) * 0.7 });
      }
      d = 200;
      while (d < FIM - 100) {
        d += 120 + Math.random() * 120;
        if (objs.some(o => o.tipo === "tronco" && Math.abs(o.d - d) < 55)) continue;
        objs.push({ tipo: "fruta", d, xr: (Math.random() * 1.5 - 0.75), item: Motor.sortear(FRUTAS), fase: Math.random() * 6 });
      }
      // Enfeites: vitórias-régias perto das margens
      const enfeites = [];
      for (let e = 150; e < FIM; e += 160 + Math.random() * 160) enfeites.push({ d: e, lado: Math.random() < 0.5 ? -1 : 1, r: 9 + Math.random() * 7 });
      return { objs, enfeites, E0, E1: E0 + S * 2.2, FIM };
    }

    // Cor da água: Rio Negro (escuro), Encontro (lado a lado) e depois Amazonas (barrento)
    const NEGRO = [43, 24, 10], SOLI = [196, 146, 88], MIST = [160, 112, 62];
    const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
    const mistura = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

    // ---------- Estado ----------
    let barco, dist, frutas, encontrados, perdidos, avisos, ultimoT, pausado, rodando, tremor, lento, falandoAte, efeitos, esq, dir, alvoX, falouEncontro, falouAmazonas, frutasFaladas, fim;
    function comecar() {
      rio = montarRio();
      barco = { x: W / 2, vx: 0 };
      dist = 0; frutas = 0; encontrados = []; perdidos = 0; avisos = 0;
      pausado = false; tremor = 0; lento = 0; falandoAte = 0; efeitos = [];
      esq = false; dir = false; alvoX = null; falouEncontro = false; falouAmazonas = false; frutasFaladas = new Set(); fim = false;
      tela.querySelectorAll(".arcade-fim").forEach(e => e.remove());
      atualizarInfo();
      pausa.textContent = "⏸️";
      falandoAte = performance.now() + 9000;
      Motor.falar(peq
        ? "Vamos passear de barco! Toque nos lados para virar o barco. Pegue as frutas e olhe os bichos!"
        : "Vamos passear de barco pelo Rio Negro, saindo de Manaus! Guie o barco tocando nos lados da tela ou com as setas. Desvie dos troncos, pegue as frutas e chegue perto dos bichos para anotar no diário de bordo.");
      ultimoT = performance.now();
      if (!rodando) { rodando = true; requestAnimationFrame(quadro); }
    }
    function atualizarInfo() {
      info.querySelector(".amz-i-frutas").textContent = `🍇 ${frutas}`;
      info.querySelector(".amz-i-bichos").textContent = `🐾 ${encontrados.length}/${CFG.nBichos}`;
      info.querySelector(".amz-progresso i").style.width = Math.min(100, (dist / rio.FIM) * 100) + "%";
    }
    function alternarPausa(forcar) {
      if (fim) return;
      pausado = forcar !== undefined ? forcar : !pausado;
      pausa.textContent = pausado ? "▶️" : "⏸️";
      if (pausado) { esq = dir = false; alvoX = null; desenhar(); }
      ultimoT = performance.now();
    }

    // ---------- Laço ----------
    function quadro(t) {
      if (!vivo()) { rodando = false; limpar(); return; }
      const dt = Math.min(0.05, (t - ultimoT) / 1000);
      ultimoT = t;
      if (!pausado && !fim) atualizar(dt, t);
      desenhar(t);
      requestAnimationFrame(quadro);
    }
    const xObjeto = o => o.tipo === "bicho" ? xBicho(o) : centro(o.d) + o.xr * meiaLarg(o.d);
    // Bichos da água ficam no rio perto da margem; os outros, na margem
    function xBicho(o) {
      const borda = centro(o.d) + o.lado * meiaLarg(o.d);
      const x = o.item.agua ? borda - o.lado * 38 : borda + o.lado * 22;
      return Math.max(32, Math.min(W - 32, x)); // celular em pé: o bicho da margem não sai da tela
    }
    function atualizar(dt, t) {
      // Velocidade e direção
      const v = CFG.vel * (lento > 0 ? 0.45 : 1);
      lento = Math.max(0, lento - dt);
      tremor = Math.max(0, tremor - dt);
      dist += v * dt;
      const LAT = 165;
      let quer = 0;
      if (esq) quer -= 1;
      if (dir) quer += 1;
      if (!quer && alvoX !== null && Math.abs(alvoX - barco.x) > 4) quer = Math.sign(alvoX - barco.x) * Math.min(1, Math.abs(alvoX - barco.x) / 30);
      barco.vx += (quer * LAT - barco.vx) * Math.min(1, dt * 8);
      barco.x += barco.vx * dt;
      const c = centro(dist), m = meiaLarg(dist) - 16;
      barco.x = Math.max(c - m, Math.min(c + m, barco.x));

      for (const o of rio.objs) {
        if (o.feito) continue;
        const dy = o.d - dist; // > 0: ainda à frente
        if (o.tipo === "tronco") {
          if (Math.abs(dy) < 14 + 4) {
            const ox = xObjeto(o), meia = (o.w / 2) * Math.abs(Math.cos(o.ang)) + 6;
            if (Math.abs(barco.x - ox) < meia + 12) {
              o.feito = true;
              tremor = 0.5; lento = 1.1;
              barco.vx = (barco.x < ox ? -1 : 1) * 140;
              SONS.tronco();
              efeitos.push({ tipo: "splash", x: ox, d: o.d, t0: t });
              if (t > falandoAte) { Motor.falar(Motor.sortear(["Opa! Um tronco!", "Cuidado com o tronco!", "Bateu no tronco! Desvie!"])); falandoAte = t + 2000; }
            }
          }
          if (dy < -40) o.feito = true;
        } else if (o.tipo === "fruta") {
          const ox = xObjeto(o);
          if (Math.abs(dy) < 22 && Math.abs(barco.x - ox) < 26) {
            o.feito = true;
            frutas++;
            Motor.ploc();
            efeitos.push({ tipo: "mais", x: ox, d: o.d, t0: t, texto: "+1" });
            if (!frutasFaladas.has(o.item.id) && t > falandoAte) { frutasFaladas.add(o.item.id); Motor.falar(`${Motor.maiuscula(o.item.nome)}!`); falandoAte = t + 1500; }
            atualizarInfo();
          }
          if (dy < -40) o.feito = true;
        } else if (o.tipo === "bicho") {
          if (dy < 6) {
            o.feito = true;
            const ox = xBicho(o);
            if (Math.abs(barco.x - ox) < CFG.perto) encontrou(o, t);
            else {
              perdidos++;
              if (avisos < 2 && t > falandoAte) { avisos++; Motor.falar(`Passou longe ${o.item.art === "a" ? "da" : "do"} ${o.item.nome}! Chegue mais perto dos bichos para ver.`); falandoAte = t + 3500; }
            }
          }
        }
      }
      // Encontro das Águas e Rio Amazonas
      if (!falouEncontro && dist > rio.E0 - 40) {
        falouEncontro = true;
        falandoAte = t + 9000;
        SONS.agua();
        Motor.falar(peq ? "O Encontro das Águas! A água escura e a água barrenta, uma do lado da outra!"
          : "Chegamos ao Encontro das Águas! O Rio Negro, de água escura, encontra o Rio Solimões, de água barrenta. Elas correm lado a lado sem se misturar. Daqui para a frente, o rio se chama Amazonas!");
      }
      if (!falouAmazonas && dist > rio.E1 + 200 && t > falandoAte) {
        falouAmazonas = true;
        if (!peq) { Motor.falar("Agora as águas se misturaram: estamos no Rio Amazonas, o rio com mais água do mundo!"); falandoAte = t + 5000; }
      }
      efeitos = efeitos.filter(e => t - e.t0 < 900);
      atualizarInfo();
      if (dist >= rio.FIM) terminar();
    }
    function encontrou(o, t) {
      encontrados.push(o.item);
      o.visto = t;
      tocarSom(o.item);
      Motor.tim();
      falandoAte = t + 7500;
      Motor.depois(() => Motor.falar(`Olha ${o.item.art} ${o.item.nome}! ${o.item.curio}`), 500);
      aviso.innerHTML = `${o.item.desenho}<span></span>`;
      aviso.querySelector("span").textContent = `📒 ${o.item.nome}`;
      Motor.animar(aviso, "amz-aparece");
      clearTimeout(aviso._t);
      aviso._t = setTimeout(() => aviso.classList.remove("amz-aparece"), 4200);
      atualizarInfo();
    }

    function terminar() {
      fim = true;
      esq = dir = false; alvoX = null;
      clearTimeout(aviso._t);
      aviso.classList.remove("amz-aparece"); // o aviso do último bicho não fica por cima do fim
      const total = anotar(encontrados.map(i => i.id));
      const caixa = document.createElement("div");
      caixa.className = "arcade-fim amz-fim";
      caixa.innerHTML = `<div class="titulo-fim">🚤 Fim do passeio!</div><div class="pontos-fim"></div><div class="amz-fim-bichos"></div><div class="detalhe-fim"></div><div class="amz-fim-botoes"></div>`;
      caixa.querySelector(".pontos-fim").textContent = `🐾 ${encontrados.length} de ${CFG.nBichos} bichos · 🍇 ${frutas} frutas`;
      caixa.querySelector(".amz-fim-bichos").innerHTML = encontrados.map(i => `<span title="${i.nome}">${i.desenho}</span>`).join("");
      caixa.querySelector(".detalhe-fim").textContent = `📒 No diário de bordo: ${total.filter(id => POR_ID[id]).length} de ${BICHOS.length} bichos`;
      const bs = caixa.querySelector(".amz-fim-botoes");
      bs.append(
        botao("chip jogar", "🔁 Passear de novo", "Passear de novo", () => comecar()),
        botao("chip", "📒 Diário", "Ver o diário", () => verDiario(area, faixa)),
      );
      tela.appendChild(caixa);
      Motor.comemorar(caixa);
      Motor.tim();
      Motor.falar(encontrados.length
        ? `Chegamos! Você viu ${encontrados.length} ${encontrados.length === 1 ? "bicho" : "bichos"} e pegou ${frutas} ${frutas === 1 ? "fruta" : "frutas"}. Eles estão no diário de bordo!`
        : `Chegamos! Você pegou ${frutas} ${frutas === 1 ? "fruta" : "frutas"}. Da próxima vez, chegue perto dos bichos!`);
    }

    // ---------- Desenho ----------
    const ruido1 = (k, s) => { const x = Math.sin(k * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
    const yDe = d => BARCO_Y - (d - dist);
    function desenhar(t = performance.now()) {
      if (!rio) return;
      ctx.save();
      if (tremor > 0) ctx.translate((Math.random() - 0.5) * 6 * tremor, 0);
      // Floresta
      ctx.fillStyle = "#2f7d3a";
      ctx.fillRect(-10, -10, W + 20, H + 20);
      // Água em faixas
      const PASSO = 5;
      for (let y = -PASSO; y < H + PASSO; y += PASSO) {
        const d = dist + (BARCO_Y - y);
        const c = centro(d), m = meiaLarg(d), xl = c - m, xr = c + m;
        ctx.fillStyle = "#d9b77a"; // areia da margem
        ctx.fillRect(xl - 5, y, xr - xl + 10, PASSO + 0.6);
        if (d < rio.E0) {
          ctx.fillStyle = rgb(NEGRO);
          ctx.fillRect(xl, y, xr - xl, PASSO + 0.6);
        } else {
          // lado a lado; depois do E1 a mistura vai clareando o lado escuro
          const tm = Math.max(0, Math.min(1, (d - rio.E1) / (S * 1.6)));
          const escuro = mistura(NEGRO, MIST, tm), claro = mistura(SOLI, MIST, tm);
          const xb = c - m * 0.08 + Math.sin(d / 35) * 7 + Math.sin(d / 13) * 2;
          const entrada = Math.min(1, (d - rio.E0) / 120); // o Solimões chega pela direita
          const xm = xr - (xr - xb) * entrada;
          ctx.fillStyle = rgb(escuro);
          ctx.fillRect(xl, y, xm - xl, PASSO + 0.6);
          ctx.fillStyle = rgb(claro);
          ctx.fillRect(xm, y, xr - xm, PASSO + 0.6);
        }
      }
      // Ondinhas
      ctx.strokeStyle = "rgba(255,255,255,.22)";
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      const k0 = Math.floor((dist - 80) / 46), k1 = Math.ceil((dist + H) / 46);
      for (let k = k0; k <= k1; k++) {
        const d = k * 46, y = yDe(d);
        const x = centro(d) + (ruido1(k, 1) * 1.6 - 0.8) * meiaLarg(d);
        ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x, y - 4, x + 7, y); ctx.stroke();
      }
      // Árvores nas duas margens
      const a0 = Math.floor((dist - 120) / 30), a1 = Math.ceil((dist + H + 40) / 30);
      const VERDES = ["#1f6b30", "#2a8a3e", "#3aa457", "#227a36", "#48b866"];
      for (let k = a0; k <= a1; k++) {
        const d = k * 30, y = yDe(d), c = centro(d), m = meiaLarg(d);
        [-1, 1].forEach(lado => {
          for (let j = 0; j < 8; j++) {
            const x = c + lado * (m + 16 + j * 26 + ruido1(k, j + lado * 9) * 12);
            if (x < -30 || x > W + 30) break;
            const r = 13 + ruido1(k, j * 3 + lado) * 9;
            ctx.fillStyle = "rgba(0,0,0,.18)";
            ctx.beginPath(); ctx.arc(x + 3, y + 4, r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = VERDES[Math.floor(ruido1(k, j + 5 * lado) * VERDES.length)];
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,.12)";
            ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, Math.PI * 2); ctx.fill();
          }
        });
      }
      // Manaus na saída: Teatro Amazonas e casas na margem esquerda
      if (dist < 420) {
        const d = 150, y = yDe(d), xl = centro(d) - meiaLarg(d);
        const img = imagem("teatro");
        // Celular em pé: a margem é estreita, então o teatro encolhe um pouco e não sai da tela
        const tam = Math.max(56, Math.min(84, xl - 4)), xt = Math.max(2, xl - tam - 2);
        if (img.complete) ctx.drawImage(img, xt, y - 50, tam, tam);
        texto("Manaus", xt + tam / 2, y - 50 + tam + 10, 13);
        [60, 250].forEach(dd => {
          const yy = yDe(dd), xx = centro(dd) - meiaLarg(dd) + 6;
          ctx.fillStyle = "#e9c46a"; ctx.fillRect(xx, yy - 9, 22, 18);
          ctx.fillStyle = "#e63946"; ctx.fillRect(xx - 2, yy - 11, 26, 6);
        });
      }
      // Vitórias-régias
      rio.enfeites.forEach(e => {
        const y = yDe(e.d);
        if (y < -30 || y > H + 30) return;
        const x = centro(e.d) + e.lado * (meiaLarg(e.d) - e.r - 4);
        ctx.fillStyle = "#3e8e41"; ctx.strokeStyle = "#b03a2e"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, e.r, 0.25, Math.PI * 2); ctx.lineTo(x, y); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#66bb6a";
        ctx.beginPath(); ctx.arc(x, y, e.r * 0.7, 0.3, Math.PI * 2 - 0.05); ctx.lineTo(x, y); ctx.fill();
      });
      // Placas do Encontro das Águas
      if (Math.abs(yDe(rio.E0 + 60) - H / 2) < H) {
        const d = rio.E0 + 70, y = yDe(d), c = centro(d), m = meiaLarg(d);
        texto("Rio Negro", c - m * 0.5, y, 15);
        texto("Rio Solimões", c + m * 0.5, y, 15);
        texto("🌊 Encontro das Águas", c, yDe(rio.E0 - 20), 15);
      }
      if (Math.abs(yDe(rio.E1) - H / 2) < H) texto("Rio Amazonas", centro(rio.E1), yDe(rio.E1), 17);
      // Chegada
      if (yDe(rio.FIM) > -60) {
        const y = yDe(rio.FIM), c = centro(rio.FIM), m = meiaLarg(rio.FIM);
        ctx.fillStyle = "#8b5a2b"; ctx.fillRect(c + m - 50, y - 12, 56, 24);
        ctx.fillStyle = "#6b4423"; for (let i = 0; i < 5; i++) ctx.fillRect(c + m - 48 + i * 11, y - 12, 2, 24);
        texto("🏁 Chegada", c, y - 26, 16);
      }
      // Objetos
      for (const o of rio.objs) {
        const y = yDe(o.d);
        if (y < -60 || y > H + 60) continue;
        if (o.tipo === "tronco" && !o.feito) desenharTronco(xObjeto(o), y, o);
        else if (o.tipo === "tronco" && o.feito && o.d > dist - 40) desenharTronco(xObjeto(o), y, o);
        else if (o.tipo === "fruta" && !o.feito) {
          const img = imagem(o.item.id), x = xObjeto(o), b = Math.sin(t / 300 + o.fase) * 2;
          ctx.fillStyle = "rgba(255,255,255,.35)";
          ctx.beginPath(); ctx.ellipse(x, y + 10, 16, 5, 0, 0, Math.PI * 2); ctx.fill();
          if (img.complete) ctx.drawImage(img, x - 16, y - 16 + b, 32, 32);
        } else if (o.tipo === "bicho") desenharBicho(o, y, t);
      }
      desenharBarco(t);
      efeitos.forEach(e => {
        const p = (t - e.t0) / 900, y = yDe(e.d);
        if (e.tipo === "mais") texto(e.texto, e.x, y - 18 - p * 30, 18, `rgba(255,214,10,${1 - p})`);
        else {
          ctx.strokeStyle = `rgba(255,255,255,${1 - p})`; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(e.x, y, 10 + p * 30, 0, Math.PI * 2); ctx.stroke();
        }
      });
      if (pausado) {
        ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, W, H);
        texto("⏸️ Pausado", W / 2, H / 2, 26);
      }
      ctx.restore();
    }
    // Retângulo de cantos redondos (sem depender de ctx.roundRect, que falta em aparelhos antigos)
    function retangulo(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    }
    function texto(s, x, y, tam, cor = "#fff") {
      ctx.font = `bold ${tam}px Fredoka, "Segoe UI Rounded", system-ui, sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineJoin = "round";
      ctx.strokeText(s, x, y);
      ctx.fillStyle = cor;
      ctx.fillText(s, x, y);
    }
    function desenharTronco(x, y, o) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(o.ang);
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.beginPath(); ctx.ellipse(2, 4, o.w / 2, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#7a4a22"; ctx.strokeStyle = "#3a2210"; ctx.lineWidth = 2;
      retangulo(-o.w / 2, -8, o.w, 16, 8); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#5a3418"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-o.w / 2 + 10, -3); ctx.lineTo(o.w / 2 - 14, -3); ctx.moveTo(-o.w / 2 + 16, 3); ctx.lineTo(o.w / 2 - 8, 3); ctx.stroke();
      ctx.fillStyle = "#c9935a";
      ctx.beginPath(); ctx.ellipse(o.w / 2 - 3, 0, 4, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#4caf50";
      ctx.beginPath(); ctx.ellipse(-o.w / 4, -9, 5, 2.5, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function desenharBicho(o, y, t) {
      const x = xBicho(o), img = imagem(o.item.id);
      let pulo = 0;
      if (o.item.id === "boto") pulo = Math.max(0, Math.sin(t / 420 + o.fase)) * 14;
      const tam = 62;
      // Aviso antes de passar: anel pulsando no bicho que ainda dá para ver
      if (!o.feito && o.d - dist < H) {
        const p = (Math.sin(t / 180) + 1) / 2;
        ctx.strokeStyle = `rgba(255,214,10,${0.5 + p * 0.5})`;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, tam * 0.55 + p * 5, 0, Math.PI * 2); ctx.stroke();
      }
      if (o.visto) {
        ctx.fillStyle = "rgba(255,255,255,.35)";
        ctx.beginPath(); ctx.arc(x, y, tam * 0.58, 0, Math.PI * 2); ctx.fill();
      }
      if (o.item.agua) {
        ctx.fillStyle = "rgba(255,255,255,.3)";
        ctx.beginPath(); ctx.ellipse(x, y + tam * 0.3, tam * 0.45, 6, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.save();
      if (o.lado > 0) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); } // olha para o rio
      if (img.complete) ctx.drawImage(img, x - tam / 2, y - tam / 2 - pulo, tam, tam);
      ctx.restore();
      if (o.visto) texto("✓", x + tam * 0.4, y - tam * 0.4, 18, "#7CFC9A");
    }
    function desenharBarco(t) {
      const x = barco.x, y = BARCO_Y, inc = Math.max(-0.3, Math.min(0.3, barco.vx / 500));
      // Esteira
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(x - 8, y + 26); ctx.lineTo(x - 20, y + 60); ctx.moveTo(x + 8, y + 26); ctx.lineTo(x + 20, y + 60); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.4)";
      for (let i = 0; i < 4; i++) { const yy = y + 30 + ((t / 25 + i * 9) % 32); ctx.beginPath(); ctx.arc(x + Math.sin(i * 2.1) * 6, yy, 2.4, 0, Math.PI * 2); ctx.fill(); }
      ctx.save();
      ctx.translate(x, y); ctx.rotate(inc);
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.beginPath(); ctx.ellipse(3, 5, 17, 32, 0, 0, Math.PI * 2); ctx.fill();
      // Casco
      ctx.fillStyle = "#fffdf6"; ctx.strokeStyle = "#1d3557"; ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -32); ctx.quadraticCurveTo(17, -16, 16, 10); ctx.lineTo(14, 28); ctx.lineTo(-14, 28); ctx.lineTo(-16, 10); ctx.quadraticCurveTo(-17, -16, 0, -32);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#1d6fd8"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, -27); ctx.quadraticCurveTo(13, -14, 12.5, 8); ctx.lineTo(11, 24); ctx.moveTo(0, -27); ctx.quadraticCurveTo(-13, -14, -12.5, 8); ctx.lineTo(-11, 24); ctx.stroke();
      // Teto
      ctx.fillStyle = "#e63946"; ctx.strokeStyle = "#7a1020"; ctx.lineWidth = 2;
      retangulo(-10, -8, 20, 28, 4); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(-6, 16); ctx.moveTo(0, -4); ctx.lineTo(0, 16); ctx.moveTo(6, -4); ctx.lineTo(6, 16); ctx.stroke();
      // Bandeirinha
      ctx.fillStyle = "#2a9d55"; ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(9 + Math.sin(t / 120) * 2, -21); ctx.lineTo(0, -18); ctx.fill();
      ctx.restore();
    }

    // ---------- Controles ----------
    const xMundo = e => { const r = canvas.getBoundingClientRect(); return (e.clientX - r.left) / escala; };
    let tocando = null;
    canvas.addEventListener("pointerdown", e => {
      if (fim) return;
      if (pausado) { alternarPausa(false); return; }
      tocando = e.pointerId;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      alvoX = xMundo(e);
    });
    canvas.addEventListener("pointermove", e => { if (e.pointerId === tocando) alvoX = xMundo(e); });
    const soltarTela = e => { if (e.pointerId === tocando) { tocando = null; alvoX = null; } };
    canvas.addEventListener("pointerup", soltarTela);
    canvas.addEventListener("pointercancel", soltarTela);
    [[bEsq, v => { esq = v; }], [bDir, v => { dir = v; }]].forEach(([b, setar]) => {
      b.addEventListener("pointerdown", e => { e.preventDefault(); if (pausado) alternarPausa(false); setar(true); try { b.setPointerCapture(e.pointerId); } catch (err) { /* ok */ } });
      ["pointerup", "pointercancel", "pointerleave"].forEach(ev => b.addEventListener(ev, () => setar(false)));
      b.addEventListener("contextmenu", e => e.preventDefault());
    });
    function tecla(e) {
      if (!vivo()) { limpar(); return; }
      const baixo = e.type === "keydown";
      const k = e.key;
      if (k === "ArrowLeft" || k === "a" || k === "A") { esq = baixo; e.preventDefault(); if (baixo && pausado) alternarPausa(false); }
      else if (k === "ArrowRight" || k === "d" || k === "D") { dir = baixo; e.preventDefault(); if (baixo && pausado) alternarPausa(false); }
      else if (baixo && !e.repeat && (k === "p" || k === "P")) alternarPausa();
      else if (baixo && !e.repeat && (k === "Enter" || k === " ") && !fim) { e.preventDefault(); if (pausado) alternarPausa(false); else SONS.buzina(); }
    }
    document.addEventListener("keydown", tecla);
    document.addEventListener("keyup", tecla);
    function limpar() {
      document.removeEventListener("keydown", tecla);
      document.removeEventListener("keyup", tecla);
      if (passeioAberto === tela) passeioAberto = null;
    }
    medir();
    comecar();
  }

  // ---------- Registro ----------
  const fig = (id, w = 64) => ARTE[id].replace("<svg ", `<svg style="width:${w}px;height:${w}px" `);
  JOGOS.push({
    id: "amazonia", nome: "Amazônia",
    icone: ARTE.arara,
    faixas: ["3-4", "4-5", "5-6", "6-8", "8-10"],
    // As setas só são do jogo durante o passeio de barco; nos outros modos o controle navega
    get teclas() { return !!passeioAberto && document.contains(passeioAberto); },
    ajuda: faixa => [
      { figura: fig("tucano"), texto: "Conhecer: toque num bicho, numa fruta ou num lugar para ouvir o nome e uma curiosidade." },
      { figura: fig("boto"), texto: grande(faixa) ? "Perguntas: leia ou ouça a pergunta e toque na resposta certa." : "Cadê?: ouça o nome e toque na figura certa." },
      { figura: fig("barco"), texto: "Passeio de barco: toque nos lados da tela, nos botões ⬅️ ➡️ ou use as setas para guiar o barco. Desvie dos troncos e pegue as frutas!" },
      { figura: fig("diario"), texto: "Passe perto dos bichos das margens: eles entram no diário de bordo." },
    ],
    iniciar(area, faixa) {
      passeioAberto = null;
      Motor.escolherModo(area, [
        { icone: ARTE.tucano, rotulo: "Conhecer", iniciar: () => conhecer(area) },
        { icone: ARTE.onca, rotulo: grande(faixa) ? "Perguntas" : "Cadê?", iniciar: () => (grande(faixa) ? curiosidades(area, faixa) : cade(area, faixa)) },
        { icone: ARTE.barco, rotulo: "Passeio de barco", iniciar: () => passeio(area, faixa) },
        { icone: ARTE.diario, rotulo: "Diário de bordo", iniciar: () => verDiario(area, faixa) },
      ]);
      const modos = area.querySelector(".modos");
      if (modos) modos.classList.add("amz-modos");
    },
  });
  CATALOGO["amazonia"] = ["descobrir", "Bichos, frutas e rios da nossa floresta"];
})();
