# Investigação do avatar e dos dicionários VLibras

Data: 2026-11-05. Escopo: fonte pública e execução isolada. Nenhum ativo upstream foi incorporado ao repositório Sinaliza.

## Identidades fixadas

| Componente | Commit | Versão observada | Papel |
|---|---|---|---|
| spbgovbr-vlibras/vlibras-player-webjs | `5389767f8dcb915e6cd1a768095bfefa825c3d14` | package.json 1.1.0 | Adaptador JS e build Unity WebGL |
| spbgovbr-vlibras/vlibras-dictionary-repository | `bf1ed09187d347112ee84f1b9e312d267728fc76` | README 2.0.0 | Registro e armazenamento dos arquivos dos sinais |
| spbgovbr-vlibras/vlibras-dictionary-api | `ab0d23f2df3f7d5cacd2482d911109bbe490ce83` | versão de recursos padrão 2018.3.1 | API/cache para downloads e estatísticas |
| spbgovbr-vlibras/vlibras-mobile-cross-platform | `caa9f0f4616389f62c7d4aa62f12cea2990f02f8` | branch 46-dicionary-feedback | Confirmação independente da ponte JS/Unity |
| spbgovbr-vlibras/libraske-player | `3cec52d6eee836c94d1dec5d88b514d2d73a07ad` | Unity 2021.1.27f1 | Projeto de jogo relacionado; NÃO é prova de correspondência com playerweb |

A busca de árvores não encontrou AGENTS.md nesses componentes. Fontes de terceiros foram lidas, sem alterações.

## Fluxo observado no código

1. `Player.translate()` usa `GlosaTranslator.translate()` para POST remoto `{text,domain}`; timeout de 30 s. Esse caminho não serve como tradutor local Sinaliza. Em erro, o wrapper pode tentar reproduzir o texto em maiúsculas.
2. `Player.play(glosa)` envia uma string à ponte. `PlayerManagerAdapter.play(glosa)` chama `player.SendMessage("PlayerManager", "playNow", glosa)`. Sem string, chama `setPauseState` com zero. `stop()` chama `stopAll`; `pause()` chama `setPauseState` com um. Eventos Unity chegam por callbacks globais.
3. `Player.load()` injeta `UnityLoader.js`; `_initializeTarget()` instancia `playerweb.json`. O manifesto referencia os três arquivos `.unityweb`, configura memória inicial 268435456 bytes e permite WebGL 1 e 2.
4. `setBaseUrl(url)` é ponto de acoplamento para resolver sinais. O wrapper troca URLs no `load`, `play` e `setRegion`; portanto não basta chamar setBaseUrl uma vez e conservar Player inteiro. O módulo independente deve usar a ponte ou remover essa política de troca de URL.
5. `config.js` contém serviços remotos de tradução e dicionário. O caminho normal de sinais inclui versão `2018.3.1`, plataforma `WEBGL` e região `BR`; a URL estática inclui `static/BUNDLES`. Não são obrigatórios dentro do build Unity: uma base local funcionou no experimento.
6. A API de dicionário baixa `/:version/:platform/:region/:sign` ou `/:version/:platform/:sign`. Faz cache em disco e usa MongoDB para metadados/estatísticas. O repository usa PostgreSQL/Sequelize, filesystem e rota `/api/signs/:version/:platform/:region?/:sign`. Não reutilizar esses serviços no fluxo principal local.
7. `FileService` mantém os arquivos por versão/plataforma/região/nome. A extensão do formato BUNDLE é vazia; `.blend` e `.mp4` pertencem aos fontes WikiLibras. Não inferir que MP4 é entrada do player Unity.
8. Seeds do repository possuem 17733 nomes no patch 201831 e 1050 no patch 201830. Não contêm os bundles. Esses números não medem cobertura efetiva do avatar nem recursos distribuíveis.
9. A API faz fallback removendo intensificador `(+)/(-)` e contexto `&...`. Preservar essa regra apenas após testes de compatibilidade com os recursos efetivamente usados.

Referências primárias fixadas:

- [Player.js](https://github.com/spbgovbr-vlibras/vlibras-player-webjs/blob/5389767f8dcb915e6cd1a768095bfefa825c3d14/src/Player.js)
- [PlayerManagerAdapter.js](https://github.com/spbgovbr-vlibras/vlibras-player-webjs/blob/5389767f8dcb915e6cd1a768095bfefa825c3d14/src/PlayerManagerAdapter.js)
- [GlosaTranslator.js](https://github.com/spbgovbr-vlibras/vlibras-player-webjs/blob/5389767f8dcb915e6cd1a768095bfefa825c3d14/src/GlosaTranslator.js)
- [config.js](https://github.com/spbgovbr-vlibras/vlibras-player-webjs/blob/5389767f8dcb915e6cd1a768095bfefa825c3d14/src/config.js)
- [playerweb.json](https://github.com/spbgovbr-vlibras/vlibras-player-webjs/blob/5389767f8dcb915e6cd1a768095bfefa825c3d14/src/target/playerweb.json)
- [FileService](https://github.com/spbgovbr-vlibras/vlibras-dictionary-repository/blob/bf1ed09187d347112ee84f1b9e312d267728fc76/src/services/FileService.js)
- [SignService](https://github.com/spbgovbr-vlibras/vlibras-dictionary-repository/blob/bf1ed09187d347112ee84f1b9e312d267728fc76/src/services/SignService.js)
- [formatos](https://github.com/spbgovbr-vlibras/vlibras-dictionary-repository/blob/bf1ed09187d347112ee84f1b9e312d267728fc76/src/database/resources/formats.json)
- [downloader e fallback](https://github.com/spbgovbr-vlibras/vlibras-dictionary-api/blob/ab0d23f2df3f7d5cacd2482d911109bbe490ce83/src/app/sign/signsDownloader.js)
- [requisição ao repository](https://github.com/spbgovbr-vlibras/vlibras-dictionary-api/blob/ab0d23f2df3f7d5cacd2482d911109bbe490ce83/src/app/util/repositorySignRequest.js)
- [sanitizer](https://github.com/spbgovbr-vlibras/vlibras-dictionary-api/blob/ab0d23f2df3f7d5cacd2482d911109bbe490ce83/src/app/util/sanitizer.js)
- [serviço Unity mobile](https://github.com/spbgovbr-vlibras/vlibras-mobile-cross-platform/blob/caa9f0f4616389f62c7d4aa62f12cea2990f02f8/src/services/unity.ts)

## Formato de animação: evidência e limites

Observado: build WebGL contém WASM e dados Unity. Um sinal é solicitado sem extensão no caminho base. O runtime descreve o arquivo como Asset Bundle. A fonte relacionada `libraske-player` carrega `UnityEngine.AssetBundle` e extrai `AnimationClip` pelo primeiro nome (`GetAllAssetNames()[desiredIndex]`). Isso confirma uso de bundles e AnimationClip nesse projeto distinto, mas NÃO identifica o layout exato dos bundles playerweb, a versão Unity de origem nem compatibilidade binária entre os dois.

- [BundleConversor do projeto relacionado](https://github.com/spbgovbr-vlibras/libraske-player/blob/3cec52d6eee836c94d1dec5d88b514d2d73a07ad/Assets/Scripts/Util/Conversos/BundleConversor.cs)
- [ProjectVersion do projeto relacionado](https://github.com/spbgovbr-vlibras/libraske-player/blob/3cec52d6eee836c94d1dec5d88b514d2d73a07ad/ProjectSettings/ProjectVersion.txt)

Desconhecido: fonte C# exata do PlayerManager do build playerweb; regras internas completas de tokenização/soletração; mapa completo glosa→AnimationClip; rig e dependências exatas dos bundles externos. A busca limitada aos componentes acima não prova que essas fontes não existam em outro lugar.

## Tamanhos e identidade do build

| Arquivo | Bytes | SHA-256 |
|---|---:|---|
| UnityLoader.js | 156644 | `586b45e52af43bb074f2c57c4b70488620e0317c96af655e060d65ef6253cbe0` |
| playerweb.json | 434 | `0a7d69f416a71f0c3da162ff2a72943896ed7abdd7029271430e2a0e4554baa3` |
| playerweb.data.unityweb | 10376767 | `416db289fc2982843905e7149534b68606b04cd8ab29dc2ca6a9e928e416b163` |
| playerweb.wasm.code.unityweb | 3200645 | `9866f672b63e695d8e8414f2895647f9b3b440a5795c6862bae034b0524df703` |
| playerweb.wasm.framework.unityweb | 77267 | `73d18afd6c8d73b38d789978c1dd4f06c20a0da101a478b883d46b03e2894605` |

Os arquivos unityweb começam com bytes `6b8d00556e69747957656220436f6d7072657373` (inclui `UnityWeb Compress...`). Gzip e zlib diretos rejeitaram. Não definir formato puro de compressão sem decodificação confirmada. O loader original consegue carregá-los localmente.

## Prova de execução isolada

Comando validado: `node /workspace/research/avatar-probe.cjs --assets /workspace/research/vlibras-player-webjs/src/target --output /workspace/research/evidence/avatar-probe-portable.json --playwright-module /opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright` com acesso de rede habilitado no executor; o script intercepta todas as requisições, serve arquivos locais e bloqueia qualquer origem diferente de `http://127.0.0.1:8871`. Não houve backend remoto nem download de sinais.

Ambiente: Node 24.22.1; Playwright 1.62.1 instalado no ambiente; Chromium 155.0.8059.79 (`/usr/bin/chromium`), Debian 13, headless com SwiftShader. O script aceita diretório de assets, caminho de saída, módulo Playwright e executável Chromium como argumentos; não requer caminhos /workspace para reutilização. Primeira tentativa em sandbox padrão falhou por `setsockopt EPERM`/SIGTRAP. A segunda, com permissão de rede fornecida pelo executor, passou. O processo do navegador foi encerrado no fim.

Resultados observados:

- Unity carregou os três arquivos locais e criou WebGL 2.0.
- Um canvas renderizou Ícaro; callback `GetAvatar` retornou `icaro`; `onLoadPlayer` foi emitido.
- `setBaseUrl('http://127.0.0.1:8871/signs/')` e `playNow('OLA')` causaram uma requisição local `/signs/OLA`.
- O servidor simulado respondeu 404, pois o bundle está ausente. Logs registraram falha de carregamento e `To spell: OLA`; callbacks CounterGloss emitiram 0,1,2 e o estado voltou a não reproduzir.
- O script realizou exatamente sete requisições, todas locais: documento, loader, manifesto, três arquivos Unity e sinal OLA.

Limites: o experimento prova inicialização e renderização local do avatar e exercita a ponte com fallback. Não prova que o sinal OLA existe, nem que sua animação foi reproduzida, nem que a soletração é linguisticamente correta. O screenshot final está em repouso; sem comparação de frames, não usar como prova visual de movimento. Não fornece benchmark válido, p50/p95 ou medição de primeira animação. Não prova tradutor em navegador. Os arquivos e screenshot ficam no workspace de pesquisa, sem redistribuição no PR.

Artefatos locais: `avatar-probe.cjs`, `evidence/avatar-probe-portable.json`, `evidence/avatar-probe-portable-command.log`; primeira execução também gerou `evidence/avatar-probe.json`, `evidence/avatar-probe-command.log`, `evidence/avatar-probe.png`; árvore de fontes `player-tree.txt`. O probe e o JSON de observações próprios podem ser incluídos no PR; não incluir screenshot nem assets upstream. Para reproduzir: obter o checkout do player fixado, disponibilizar seus cinco arquivos target localmente, usar Playwright 1.62.1 e Chromium 155.0.8059.79, executar o script com `--assets DIR_TARGET --output LOG.json --playwright-module MODULO --chromium BIN`. Instalação de ferramentas e obtenção inicial dos recursos podem requerer rede; o experimento de reprodução usa somente recursos locais.

## Licenças separadas

| Categoria | Evidência | Decisão proposta |
|---|---|---|
| Código JS player-webjs | LICENSE raiz LGPLv3, README declara LGPLv3 | Reutilização/adaptação condicionada a cumprir LGPLv3, atribuição e disponibilização das modificações pertinentes |
| Código API/repository | LICENSE raiz LGPLv3, README declara LGPLv3 | Usar como referência do contrato; não incorporar servidores ao núcleo |
| Seeds de nomes/metadados | Presentes no repository; sem aviso individual observado | Registrar origem e cobertura da licença antes de redistribuir o conjunto |
| Modelos, malha, rig, texturas Ícaro/Hosana embutidos | Build binário do player; não há inventário separado no repo | Bloquear redistribuição até confirmar origem, licença e atribuição por recurso |
| Animações externas/bundles do dicionário | Não presentes no repository/API; repos dictionary-bundles/cache/video listados como tamanho zero na busca GitHub | Bloquear incorporação e distribuição até obter pacote auditável e licença |
| Unity runtime/loader/export | Código/artefato gerado; licença raiz do projeto não resolve obrigações de terceiros | Confirmar termos e avisos específicos antes de distribuir |
| libraske-player | Não há LICENSE raiz na árvore; licenças individuais de fontes tipográficas | Não extrair código ou ativos desse projeto sem permissão confirmada |

A presença de LICENSE raiz não foi tratada como prova de mesma licença para todos os ativos e dependências.

## Proposta para a especificação

1. Avatar navegador independente, com a ponte mínima `SendMessage(PlayerManager, playNow/setPauseState/stopAll/setBaseUrl)`, assets locais e fila própria Sinaliza. Não portar animações Unity para Three.js sem formato/rig validado.
2. Configuração explícita do pacote local do avatar e dicionário, com versão/plataforma/região/digest/licença. A glosa deve mapear para o nome real do bundle; preservar chave e glosa original.
3. Impedir que a política remota do wrapper sobrescreva a base local. Falha de sinal deve produzir diagnóstico e política de fallback documentada; não esconder ausência como tradução bem-sucedida.
4. O backend pode usar tradutor e sessões sem carregar WebGL. Não declarar renderização server-side do avatar como suporte V1 sem prova própria.
5. Gate de aceite do avatar: pacote de sinais com permissão confirmada; reproduzir pelo menos uma sequência com bundle real, rede externa bloqueada, callbacks ordenados e stop; medir primeiro frame de movimento; validar a sequência com referência VLibras. A renderização inicial já foi provada, mas a sequência de sinais externos permanece BLOCKED.
