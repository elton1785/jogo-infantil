// Torre de Hanói — levar todos os discos para outra torre, um de cada vez, sem nunca pôr
// um disco grande em cima de um menor. Toca na torre para pegar o disco de cima e toca
// na torre de destino (ou arrasta o disco). "Ver a solução" mostra o algoritmo recursivo.
(() => {
  const DISCOS = { "5-6": [3, 4], "6-8": [3, 4, 5], "8-10": [3, 4, 5, 6, 7] };
  const CORES = ["#e63946", "#f77f00", "#ffd60a", "#2a9d55", "#277da1", "#7b2cbf", "#ff70a6"];

  const melhor = n => { try { return +localStorage.getItem(`hanoi-melhor-${n}`) || 0; } catch (e) { return 0; } };
  const guardarMelhor = (n, v) => { try { localStorage.setItem(`hanoi-melhor-${n}`, v); } catch (e) { /* sem armazenamento */ } };

  // Algoritmo recursivo: para levar n discos de A para C, leva n-1 de A para B,
  // o maior de A para C, e os n-1 de B para C.
  function solucao(n, de = 0, para = 2, via = 1, lista = []) {
    if (n === 0) return lista;
    solucao(n - 1, de, via, para, lista);
    lista.push([de, para]);
    solucao(n - 1, via, para, de, lista);
    return lista;
  }

  JOGOS.push({
    id: "hanoi",
    nome: "Torre de Hanói",
    icone: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="2" y="52" width="60" height="7" rx="3" fill="#8d5524"/><rect x="14" y="14" width="4" height="40" rx="2" fill="#a0673a"/><rect x="30" y="14" width="4" height="40" rx="2" fill="#a0673a"/><rect x="46" y="14" width="4" height="40" rx="2" fill="#a0673a"/><rect x="3" y="43" width="26" height="9" rx="4" fill="#e63946"/><rect x="6" y="34" width="20" height="9" rx="4" fill="#f77f00"/><rect x="9" y="25" width="14" height="9" rx="4" fill="#ffd60a"/><rect x="41" y="43" width="14" height="9" rx="4" fill="#2a9d55"/></svg>',
    faixas: ["5-6", "6-8", "8-10"],
    iniciar(area, faixa) {
      const opcoes = DISCOS[(faixa && faixa.id) || "6-8"] || DISCOS["6-8"];
      Motor.escolherModo(area, opcoes.map(n => ({ icone: n, rotulo: `${n} discos`, iniciar: () => jogo(n) })), { pequenos: opcoes.length > 3 });

      function jogo(n) {
        const minimo = 2 ** n - 1;
        let torres, jogadas, sel, animando, acabou;

        function recomecar() {
          torres = [Array.from({ length: n }, (_, i) => n - i), [], []]; // de baixo para cima
          jogadas = 0; sel = null; animando = false; acabou = false;
          desenhar();
        }

        function desenhar() {
          area.innerHTML = "";
          const tela = document.createElement("div");
          tela.className = "hanoi";

          const topo = document.createElement("div");
          topo.className = "hanoi-topo";
          const cont = document.createElement("div");
          cont.className = "hanoi-contador";
          cont.textContent = `Jogadas: ${jogadas} · Mínimo: ${minimo}` + (melhor(n) ? ` · Recorde: ${melhor(n)}` : "");
          const botao = (txt, rotulo, fn) => {
            const b = document.createElement("button");
            b.className = "chip";
            b.textContent = txt;
            b.setAttribute("aria-label", rotulo);
            b.addEventListener("click", fn);
            return b;
          };
          topo.append(cont, botao("🔄 Recomeçar", "Recomeçar", () => { Motor.novaSessao(); recomecar(); }),
            botao("💡 Ver a solução", "Ver a solução", verSolucao));

          const base = document.createElement("div");
          base.className = "hanoi-torres";
          const torreEls = torres.map((pilha, i) => {
            const t = document.createElement("button");
            t.className = "torre" + (sel === i ? " escolhida" : "");
            t.dataset.i = i;
            t.setAttribute("aria-label", `Torre ${i + 1}`);
            const pino = document.createElement("span");
            pino.className = "pino";
            t.appendChild(pino);
            pilha.forEach((tam, k) => {
              const d = document.createElement("span");
              d.className = "disco" + (sel === i && k === pilha.length - 1 ? " levantado" : "");
              Object.assign(d.style, { width: 28 + (tam / n) * 66 + "%", background: CORES[(tam - 1) % CORES.length], bottom: 6 + k * (100 / (n + 3)) + "%", height: 80 / (n + 3) + "%" });
              t.appendChild(d);
              // O disco de cima pode ser arrastado até outra torre
              if (k === pilha.length - 1 && !animando && !acabou) {
                Motor.arrastavel(d, { alvos: () => torreEls, aoSoltar: alvo => { sel = null; return mover(i, +alvo.dataset.i); } });
              }
            });
            t.addEventListener("click", () => tocar(i, t));
            return t;
          });
          base.append(...torreEls);
          tela.append(topo, base);
          area.appendChild(tela);
        }

        function tocar(i, t) {
          if (animando || acabou) return;
          if (sel === null) {
            if (!torres[i].length) { Motor.animar(t, "balanca"); return; }
            sel = i;
            Motor.nota(500, { dur: 0.08, vol: 0.15 });
            desenhar();
          } else if (sel === i) { sel = null; desenhar(); }
          else { const de = sel; sel = null; if (!mover(de, i)) desenhar(); }
        }

        function mover(de, para) {
          if (de === para || animando || acabou) return false;
          const a = torres[de], b = torres[para];
          if (!a.length) return false;
          if (b.length && b[b.length - 1] < a[a.length - 1]) {
            desenhar();
            Motor.animar(area.querySelectorAll(".torre")[para], "balanca");
            Motor.falar("Disco grande não pode ficar em cima do pequeno!");
            return false;
          }
          b.push(a.pop());
          jogadas++;
          Motor.ploc();
          desenhar();
          if (torres[1].length === n || torres[2].length === n) venceu();
          return true;
        }

        function venceu() {
          acabou = true;
          const estrelas = jogadas === minimo ? 3 : jogadas <= minimo * 1.5 ? 2 : 1;
          const recorde = !melhor(n) || jogadas < melhor(n);
          if (recorde) guardarMelhor(n, jogadas);
          Motor.comemorar(area.querySelector(".hanoi-torres"));
          Motor.tim();
          const fala = jogadas === minimo
            ? `Perfeito! Você usou o mínimo de jogadas: ${minimo}!`
            : `Muito bem! Você conseguiu em ${jogadas} jogadas. O mínimo é ${minimo}. Tente de novo!`;
          Motor.falar(fala + (recorde && jogadas !== minimo ? " É o seu recorde!" : ""));
          Motor.depois(() => {
            const cont = area.querySelector(".hanoi-contador");
            if (cont) cont.textContent = `${"⭐".repeat(estrelas)} ${jogadas} jogadas · Mínimo: ${minimo}`;
          }, 300);
        }

        // Mostra o algoritmo recursivo jogando sozinho, um movimento por vez
        function verSolucao() {
          Motor.novaSessao();
          recomecar();
          animando = true;
          desenhar();
          Motor.falar(`Para mover ${n} discos: primeiro levamos ${n - 1} para a torre do meio, depois o maior para a última torre, e então os ${n - 1} por cima dele.`);
          const passos = solucao(n);
          const vel = Math.max(250, 900 - n * 90);
          let k = 0;
          const proximo = () => {
            if (k === passos.length) { animando = false; acabou = true; desenhar(); Motor.tim(); Motor.falar(`Pronto! ${minimo} jogadas. Agora tente você!`); return; }
            const [de, para] = passos[k++];
            torres[para].push(torres[de].pop());
            jogadas++;
            Motor.ploc();
            desenhar();
            Motor.depois(proximo, vel);
          };
          Motor.depois(proximo, 2500);
        }

        recomecar();
        Motor.falar(`Leve todos os discos para outra torre. Um disco grande nunca pode ficar em cima de um menor!`);
      }
    },
  });
})();
