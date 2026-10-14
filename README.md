# Brincar e Aprender 🌈

Jogos educativos para crianças de 1 a 10 anos, em português, com voz, sem anúncios e funcionando offline.
É só HTML, CSS e JavaScript puro: sem dependências e sem etapa de build.

## Como rodar

- **No computador:** abrir o `index.html` no navegador.
- **Na rede local (testar no celular):** `python -m http.server 8080` na pasta e abrir `http://<ip-do-pc>:8080` no celular.
- **Instalar como app (PWA):** precisa de **https**. Publique no Cloudflare Pages (abaixo) e, no Chrome do celular, use "Adicionar à tela inicial" / "Instalar app".

## Publicar no Cloudflare Pages

1. Cloudflare → Workers & Pages → Create → Pages → **Connect to Git** → escolher este repositório.
2. Framework preset: **None** · Build command: *(vazio)* · Build output directory: **`/`**
3. Salvar. Cada `git push` publica uma versão nova automaticamente.

## Estrutura

```
index.html        casca da aplicação (telas e lista de scripts)
css/estilo.css    visual
js/motor.js       motor: voz, sons sintetizados, arrastar e modos prontos
                  (Explorar, Cadê?, Quiz, Montar, Arrastar, Vocabulário)
js/dados.js       vocabulário compartilhado (palavras com sílabas, figuras)
js/app.js         navegação: idade → menu → jogo
jogos/*.js        um arquivo por jogo (ou grupo de jogos)
sw.js             service worker (offline)
manifest.json     dados do app instalável
sons/             (opcional) sons reais, ex.: sons/animais/vaca.mp3
```

## Criar um jogo novo

Crie `jogos/meu-jogo.js` e inclua o `<script>` no `index.html` (antes do `js/app.js`):

```js
JOGOS.push({
  id: "meu-jogo", nome: "Meu Jogo", icone: "🎯",
  faixas: ["3-4", "4-5"],               // ids de FAIXAS em js/motor.js
  iniciar(area, faixa) {                // desenha o jogo dentro de `area`
    Motor.modoCade({ area, itens: [...], pergunta: i => `Cadê ${i.nome}?` });
  },
});
```

Ao adicionar arquivos, inclua-os também na lista `ARQUIVOS` do `sw.js` e troque a versão do `CACHE`
(ex.: `brincar-v2`) para os aparelhos baixarem a versão nova.
