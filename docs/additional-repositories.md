# Revisão complementar dos repositórios VLibras

**Data:** 2026-11-05. Esta revisão responde à lista adicional de repositórios. Não inicia a implementação Sinaliza.

## Cobertura da lista

A organização `spbgovbr-vlibras` listou 15 repositórios públicos nesta consulta. Ela é um índice de componentes, não um motor adicional. Verificamos novamente o HEAD remoto dos quatro componentes já inventariados; os commits continuam iguais.

| Item solicitado | Commit examinado | Conclusão |
|---|---|---|
| `vlibras-translator-text-core` | `550b5eb215ec080dd9a50055f3f92de3b4bbdf8b` | Já analisado. Wrapper do motor Python, sem mudança de referência. |
| `vlibras-translator-api` | `5a00fd2bccb77ffa442eec4dbd6c8b036178729a` | Já analisado. API e infraestrutura, dispensáveis no fluxo local. |
| `vlibras-player-webjs` | `5389767f8dcb915e6cd1a768095bfefa825c3d14` | Já analisado. Preservar prova anterior como perfil de build distinto. |
| `libraske-player` | `3cec52d6eee836c94d1dec5d88b514d2d73a07ad` | Já analisado. Jogo com fontes C# relacionadas; não comprova a fonte exata do `PlayerManager` dos builds WebGL. |
| `vlibras-web-browsers` | `be3fa2506a7c43e36e2ba551483cb5f89388d495` | Novo exame. Consumidor web, ponte TypeScript e outro build Unity. Inclui um bundle real `OBRIGADO`. |
| `libraske-processor` | `49ffaedfc1f9edd753ebd3e4c7c8dcd95fa717dc` | Novo exame. Processa imagens e pontua gestos. Excluir do núcleo V1. |

## O que acrescenta o projeto de navegador

`vlibras-web-browsers` declara versão 7.12.3. O [tradutor do consumidor](https://github.com/spbgovbr-vlibras/vlibras-web-browsers/blob/be3fa2506a7c43e36e2ba551483cb5f89388d495/src/core/actions/index.ts) faz POST HTTP e cancela a requisição anterior. Não contém o motor linguístico local. Esse cancelamento global não deve substituir o isolamento por sessão proposto para Sinaliza.

As [ações do player](https://github.com/spbgovbr-vlibras/vlibras-web-browsers/blob/be3fa2506a7c43e36e2ba551483cb5f89388d495/src/player/actions/index.ts), as [constantes](https://github.com/spbgovbr-vlibras/vlibras-web-browsers/blob/be3fa2506a7c43e36e2ba551483cb5f89388d495/src/player/constants/unity.ts) e a [ponte Unity](https://github.com/spbgovbr-vlibras/vlibras-web-browsers/blob/be3fa2506a7c43e36e2ba551483cb5f89388d495/src/player/unity/index.js) confirmam `PlayerManager.playNow`, `setBaseUrl`, `setPauseState` e `stopAll`. O consumidor usa iframe/postMessage; não é necessário incorporar widget, extensão, Preact, Zustand ou serviços remotos para usar a ponte mínima proposta.

O acréscimo material é o [bundle OBRIGADO](https://github.com/spbgovbr-vlibras/vlibras-web-browsers/blob/be3fa2506a7c43e36e2ba551483cb5f89388d495/public/assets/bundles/OBRIGADO), usado pelo [feedback do widget](https://github.com/spbgovbr-vlibras/vlibras-web-browsers/blob/be3fa2506a7c43e36e2ba551483cb5f89388d495/src/widget/utils/feedback/index.ts). Tem 17.094 bytes e SHA-256 `f313d45a631e372e2243607ec5e9869dbb623f68de8bd06b0183d6872212071e`. Fornece um candidato real para testar a reprodução local. Não fornece um catálogo completo nem confirma a licença individual das animações.

O [manifesto desse build](https://github.com/spbgovbr-vlibras/vlibras-web-browsers/blob/be3fa2506a7c43e36e2ba551483cb5f89388d495/src/player/unity/playerweb.json) configura WebGL 1 e 268.435.456 bytes de memória inicial. Seus arquivos diferem dos de `player-webjs`:

| Artefato web-browsers | Bytes |
|---|---:|
| `public/unity/unity-loader.js` | 150.016 |
| `public/unity/playerweb.data.unityweb` | 16.992.528 |
| `public/unity/playerweb.wasm.code.unityweb` | 2.996.753 |
| `public/unity/playerweb.wasm.framework.unityweb` | 76.883 |

Não misturar arquivos dos dois builds nem assumir intercâmbio dos bundles. O perfil de teste deve fixar repositório, commit, manifesto, loader, dados, WASM e sinal como um conjunto.

O código declara [LGPL-3.0-or-later](https://github.com/spbgovbr-vlibras/vlibras-web-browsers/blob/be3fa2506a7c43e36e2ba551483cb5f89388d495/package.json) e possui [LICENSE](https://github.com/spbgovbr-vlibras/vlibras-web-browsers/blob/be3fa2506a7c43e36e2ba551483cb5f89388d495/LICENSE). Não localizamos aviso individual de licença do bundle, dos modelos embutidos ou do runtime Unity no escopo examinado. A existência pública de `OBRIGADO` não autoriza sua redistribuição por inferência.

## Prova local do sinal e impacto na spec

O [probe isolado](../experiments/avatar-known-sign-probe.cjs) executou os arquivos do conjunto `web-browsers` em Chromium 155.0.8059.79, Playwright 1.62.1 e Node 24.22.1. Interceptou as requisições e serviu somente arquivos locais. Os [resultados brutos](evidence/browser-known-sign-probe.json) registram os hashes de todos os arquivos, os eventos e os timestamps.

Resultado: `PASS_KNOWN_BUNDLE_TECHNICAL_PLAYBACK`, com oito verificações verdadeiras. As sete requisições foram locais; `OBRIGADO` recebeu 200 e o runtime informou carregamento bem-sucedido. A ponte emitiu reprodução `'True'`, `CounterGloss(1, 1)` e retorno a `'False'`. Não houve mensagem de soletração. O runtime informou Unity 2018.4.36f1; a revisão de pacote 7.12.3 não é a versão do Unity.

Capturamos frames dentro da janela entre início e fim de reprodução. Inspeção local mostrou mudança de pose da mão e do braço; os hashes dos frames também diferem. O frame inicial em branco não foi usado como prova de movimento. As imagens permanecem somente no workspace de pesquisa; o JSON guarda apenas hashes e timestamps. A prova não avalia correção linguística, catálogo completo, sequência, parada ou latência estatística.

A REA analisou o loader distribuído desse build. Evidência pai: `ev_ab6466a39bc4cd51630a13dddb217d32852f501e2aeb9cd23cbb153aa6bb9753`. O [resumo](evidence/rea-browser-loader.summary.json) registra um arquivo de 150.016 bytes, sem falha de parsing, grafo parcial e 5.503 lacunas semânticas. Não é captura de runtime; a execução veio do probe Chromium. O bundle completo da análise permanece local, sem redistribuição de código/ativos derivados.

A spec foi atualizada somente onde o achado acrescenta evidência:

- Adotar o conjunto fixado `web-browsers`/`OBRIGADO` como referência técnica do primeiro sinal conhecido. Preservar o perfil antigo para recurso ausente.
- Fixar loader, manifesto, dados, WASM e bundles por conjunto. Não presumir compatibilidade entre builds diferentes.
- Normalizar strings `'True'`/`'False'` dos callbacks e considerar somente estados posteriores ao comando. Evitar interpretar o estado ocioso de inicialização como conclusão da reprodução.
- Atualizar B5 para a parte já comprovada e a parte ainda pendente. Manter B4: não incorporar nem redistribuir o bundle enquanto sua permissão individual não estiver confirmada.

Não houve motivo para trocar o núcleo Python, acrescentar dependências ao tradutor, alterar suas APIs ou ampliar as sete etapas. O projeto de navegador continua sem demonstrar tradução local. A fonte C# exata do build segue não localizada no escopo; `libraske-player` não foi tratado como fonte correspondente.

## Por que excluir o Libraskê Processor

O [worker](https://github.com/spbgovbr-vlibras/libraske-processor/blob/49ffaedfc1f9edd753ebd3e4c7c8dcd95fa717dc/src/worker.py) recebe imagens base64 e IDs de vídeo, quadro e sessão por RabbitMQ. O [callback Holistic](https://github.com/spbgovbr-vlibras/libraske-processor/blob/49ffaedfc1f9edd753ebd3e4c7c8dcd95fa717dc/src/utils/holistic_callback.py) usa OpenCV e MediaPipe para extrair landmarks. A [pontuação](https://github.com/spbgovbr-vlibras/libraske-processor/blob/49ffaedfc1f9edd753ebd3e4c7c8dcd95fa717dc/src/utils/holistic_pontuation.py) compara coordenadas com referências e produz `idGameSession`/`pontuation`.

Não recebe português, não produz glosas e não reproduz avatar. Seus IDs de sessão correlacionam avaliação de movimentos; não implementam revisão, confirmação ou cancelamento de texto. Os arquivos `references_data` contêm coordenadas, não regras linguísticas nem clips de animação.

As [dependências](https://github.com/spbgovbr-vlibras/libraske-processor/blob/49ffaedfc1f9edd753ebd3e4c7c8dcd95fa717dc/requirements.txt) incluem MediaPipe, OpenCV, NumPy e Pika. O [README](https://github.com/spbgovbr-vlibras/libraske-processor/blob/49ffaedfc1f9edd753ebd3e4c7c8dcd95fa717dc/README.md) declara LGPLv3, mas o `LICENSE` referenciado não existe na árvore inspecionada. Não foi executado seu pipeline visual nem incorporado código, vídeos ou coordenadas ao Sinaliza.

Esse fluxo está expressamente fora da seção 2.2 do spec de produto. Não acrescentar MediaPipe, OpenCV, avaliação de pose ou recepção de vídeo ao core.
