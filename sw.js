// Service worker: guarda os arquivos do jogo no aparelho para funcionar sem internet.
// Estratégia: responde do cache na hora e atualiza em segundo plano.
// Versão nova (CACHE trocado): fica esperando até a pessoa tocar em "Atualizar" no app,
// que manda a mensagem "atualizar" — aí ela assume e o app recarrega.
// A cada publicação, aumente VERSAO (é o número que aparece no menu do app).
const VERSAO = 44;
const CACHE = `brincar-v${VERSAO}`;
const ARQUIVOS = [
  "./",
  "index.html",
  "manifest.json",
  "css/estilo.css",
  "icones/app-192.png",
  "icones/app-512.png",
  "jogos/animais.js",
  "jogos/arrastar.js",
  "jogos/blocos.js",
  "jogos/bolhas.js",
  "jogos/brasil.js",
  "jogos/cacapalavras.js",
  "jogos/carros.js",
  "jogos/cobrinha.js",
  "jogos/como-jogar.js",
  "jogos/contar.js",
  "jogos/contas.js",
  "jogos/cores.js",
  "jogos/corredor-personagens.js",
  "jogos/corredor.js",
  "jogos/cubo-algoritmos.js",
  "jogos/cubo-resolver.js",
  "jogos/cubo.js",
  "jogos/damas.js",
  "jogos/dinheiro.js",
  "jogos/domino.js",
  "jogos/esconde.js",
  "jogos/familias.js",
  "jogos/formas.js",
  "jogos/fracoes.js",
  "jogos/frases.js",
  "jogos/hanoi.js",
  "jogos/historias.js",
  "jogos/instrumentos.js",
  "jogos/j2048.js",
  "jogos/labirinto.js",
  "jogos/leitura.js",
  "jogos/ler.js",
  "jogos/letras.js",
  "jogos/lig4.js",
  "jogos/memoria.js",
  "jogos/minado.js",
  "jogos/mundo-texturas.js",
  "jogos/mundo.js",
  "jogos/nave.js",
  "jogos/ordenar.js",
  "jogos/ortografia.js",
  "jogos/pintura.js",
  "jogos/plataforma.js",
  "jogos/quebracabeca.js",
  "jogos/robo.js",
  "jogos/sequencias.js",
  "jogos/silabas.js",
  "jogos/sombras.js",
  "jogos/sudoku.js",
  "jogos/tabuada.js",
  "jogos/tamanhos.js",
  "jogos/tijolos.js",
  "jogos/velha.js",
  "jogos/voador.js",
  "jogos/vocabulario.js",
  "jogos/vogais.js",
  "js/ajuda.js",
  "jogos/futebol.js",
  "jogos/ludo.js",
  "jogos/trilha.js",
  "jogos/batalha-naval.js",
  "jogos/forca.js",
  "jogos/xadrez.js",
  "jogos/amazonia.js",
  "jogos/ciencias.js",
  "jogos/horas.js",
  "jogos/ingles.js",
  "jogos/piano.js",
  "jogos/bichinho.js",
  "css/futebol.css",
  "css/tabuleiros.css",
  "css/naval-forca.css",
  "css/xadrez.css",
  "css/descobrir.css",
  "css/horas-ingles.css",
  "css/piano-bichinho.css",
  "css/melhorias.css",
  "css/album.css",
  "js/album.js",
  "js/app.js",
  "js/catalogo.js",
  "fontes/fredoka.woff2",
  "js/controle.js",
  "js/dados.js",
  "js/motor.js",
  "js/placar.js",
];

// Guarda arquivo por arquivo: se um falhar (internet instável), os outros ficam guardados
// e ele é baixado depois, quando for usado.
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.allSettled(ARQUIVOS.map(f => c.add(new Request(f, { cache: "reload" }))))));
});

self.addEventListener("message", e => {
  if (e.data === "atualizar") self.skipWaiting();
  if (e.data === "versao" && e.ports[0]) e.ports[0].postMessage(VERSAO);
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(chaves => Promise.all(chaves.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const guardado = await cache.match(e.request, { ignoreSearch: true });
    const daRede = fetch(e.request)
      .then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; })
      .catch(() => guardado);
    return guardado || daRede;
  }));
});
