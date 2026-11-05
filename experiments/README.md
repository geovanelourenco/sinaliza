# Experimentos isolados

Estes scripts investigam componentes upstream. Não implementam a biblioteca Sinaliza. Nenhum wheel, modelo, animação, build Unity ou screenshot é distribuído neste repositório.

Os recursos devem ser adquiridos separadamente de suas origens, conforme as permissões aplicáveis. Aquisição e instalação podem usar rede; os probes executam com recursos locais. Não iniciar o Dockerfile upstream: estes testes não precisam de RabbitMQ, bancos ou serviço remoto de tradução.

## Tradutor

Ambiente observado: Python 3.12.14, Linux x86_64. O arquivo `translator-requirements.lock.txt` fixa as versões efetivas do experimento. As URLs do motor, modelo spaCy e NLTK incluem SHA-256. As outras dependências estão fixadas por versão, mas não têm hashes de artefato neste arquivo. Não é um lock integral de cadeia de distribuição.

Executar da raiz do checkout Sinaliza, com Python 3.12 disponível:

```sh
python3.12 -m venv /tmp/sinaliza-translator-probe
/tmp/sinaliza-translator-probe/bin/python -m pip install -r experiments/translator-requirements.lock.txt
/tmp/sinaliza-translator-probe/bin/python experiments/probe-translator-offline.py --output /tmp/sinaliza-translator-result.json
```

O probe carrega `Translator()` e chama `translate(text, neural=False)`. Instala um audit hook antes do import para rejeitar `socket.connect` e `socket.getaddrinfo`. Registra importação, inicialização, seis primeiras chamadas e 180 chamadas aquecidas, CPU e RSS. O script rejeita execução com tentativas de conexão. Esse mecanismo cobre os caminhos Python exercitados; não é uma sandbox geral para todo código nativo ou subprocesso arbitrário.

Comparar com [o resultado observado](../docs/evidence/translator-offline-benchmark.json). O p50 usa mediana; p95 usa nearest rank. Mudanças no host, cache e carga concorrente mudam os números. O experimento não executa neural, Sinaliza, streaming nem serviço público.

## Avatar

Ambiente observado: Node 24.22.1, Playwright 1.62.1, Chromium 155.0.8059.79 (Debian 13). Usamos Chromium já instalado. A reprodução em outras versões precisa de validação própria.

Obter o checkout fixado fora deste repositório. Ele contém os cinco arquivos de build necessários. Não copiar seus ativos para o checkout Sinaliza.

```sh
git clone --depth 1 https://github.com/spbgovbr-vlibras/vlibras-player-webjs.git /tmp/sinaliza-player-reference
git -C /tmp/sinaliza-player-reference fetch origin 5389767f8dcb915e6cd1a768095bfefa825c3d14
git -C /tmp/sinaliza-player-reference checkout --detach 5389767f8dcb915e6cd1a768095bfefa825c3d14
npm install --prefix /tmp/sinaliza-probe-tools --cache /tmp/sinaliza-npm-cache --ignore-scripts playwright@1.62.1
node experiments/avatar-probe.cjs --assets /tmp/sinaliza-player-reference/src/target --output /tmp/sinaliza-avatar-result.json --playwright-module /tmp/sinaliza-probe-tools/node_modules/playwright --chromium /usr/bin/chromium
```

O script intercepta as requisições de página, serve somente cinco arquivos locais e responde 404 para sinais. Rejeita requisições de outras origens. Não precisa iniciar servidor HTTP ou contatar dicionário remoto. Encerra o browser ao final. A capacidade de rede do executor foi necessária para o processo Chromium funcionar; ela não desativa o bloqueio de requisições do probe.

O resultado `PASS_INITIALIZATION_AND_MISSING_SIGN_PATH` significa: callback de carregamento, canvas, requisição local de `OLA`, somente URLs locais e log de fallback. **Não significa reprodução correta do sinal OLA.** A captura de screenshot é opcional e não é incluída no PR. Não usar este teste como benchmark ou como comparação de frames de movimento.

Comparar com [as observações registradas](../docs/evidence/avatar-probe.json). Os hashes dos cinco arquivos estão no [inventário do avatar](../docs/avatar-inventory.md).

### Sinal conhecido: conjunto web-browsers

Esse experimento usa **outro build**, com o bundle `OBRIGADO` do mesmo checkout. Não substitui nem mistura os arquivos do teste anterior. Preparar fora do repositório Sinaliza:

```sh
git clone --depth 1 --filter=blob:none --sparse https://github.com/spbgovbr-vlibras/vlibras-web-browsers.git /tmp/sinaliza-browser-reference
git -C /tmp/sinaliza-browser-reference fetch origin be3fa2506a7c43e36e2ba551483cb5f89388d495
git -C /tmp/sinaliza-browser-reference checkout --detach be3fa2506a7c43e36e2ba551483cb5f89388d495
git -C /tmp/sinaliza-browser-reference sparse-checkout set --no-cone '/public/unity/' '/public/assets/bundles/OBRIGADO' '/src/player/unity/playerweb.json'
node experiments/avatar-known-sign-probe.cjs --assets /tmp/sinaliza-browser-reference/public/unity --manifest /tmp/sinaliza-browser-reference/src/player/unity/playerweb.json --bundle /tmp/sinaliza-browser-reference/public/assets/bundles/OBRIGADO --output /tmp/sinaliza-known-sign-result.json --playwright-module /tmp/sinaliza-probe-tools/node_modules/playwright --chromium /usr/bin/chromium
```

Reutilizar o Playwright instalado no exemplo anterior. `--frames-dir DIR` é opcional; sem ele, o script captura frames em memória e registra somente seus hashes. Não adicionar imagens ou ativos ao repositório. Os arquivos devem corresponder aos hashes registrados na [evidência observada](../docs/evidence/browser-known-sign-probe.json).

O probe retorna `PASS_KNOWN_BUNDLE_TECHNICAL_PLAYBACK` somente após servir o bundle, observar seu carregamento, início/fim de reprodução, ausência de fallback e frames diferentes dentro da janela de reprodução. Não usa o estado ocioso inicial como conclusão. O resultado não certifica qualidade linguística, sequência, parada ou permissão de redistribuição. Os timestamps não são benchmark da primeira animação.

Para repetir a análise REA desse loader, usar um diretório contendo somente `public/unity/unity-loader.js`, com o mesmo procedimento abaixo e uma saída nova. Não confundir essa evidência com a análise do loader `player-webjs`.

## REA

Origem da skill: [SKILL.md no commit fixado](https://github.com/morluto/rea/blob/fe677f6cf9853fb12490dfb8ef23ccae3a551049/.agents/skills/reverse-engineer-anything/SKILL.md). Ler o arquivo e suas referências pertinentes antes de executar a CLI. A skill pode ser instalada manualmente em um diretório de skills gravável e carregada pelo agente. Não presumir que essa instalação registra um servidor MCP.

Com os recursos previamente adquiridos e os diretórios de saída ainda inexistentes:

```sh
npm install --prefix /tmp/sinaliza-rea --cache /tmp/sinaliza-npm-cache --ignore-scripts --omit=optional rea-agents@6.8.0
/tmp/sinaliza-rea/node_modules/.bin/rea --version
mkdir /tmp/sinaliza-loader-artifact
cp /tmp/sinaliza-player-reference/src/target/UnityLoader.js /tmp/sinaliza-loader-artifact/
/tmp/sinaliza-rea/node_modules/.bin/rea analyze-javascript-application /tmp/sinaliza-loader-artifact --detail summary --evidence_output /tmp/sinaliza-loader-evidence.bundle.json --format json > /tmp/sinaliza-loader-evidence.summary.json
```

O `inspect-artifact` recebeu o wheel original, antes da instalação. Para repetir, baixar a URL fixada no requirements para um arquivo local, verificar o SHA-256 `a8bd00451a0ed931b4a6fa3fea37da7a56b39fa13f24afb2fd52ce21d3fba8ea` e executar:

```sh
/tmp/sinaliza-rea/node_modules/.bin/rea inspect-artifact /tmp/vlibras_translator-1.3.3-py3-none-any.whl --detail summary --evidence_output /tmp/sinaliza-wheel-evidence.bundle.json --format json > /tmp/sinaliza-wheel-evidence.summary.json
```

A CLI não sobrescreve o bundle. Escolher uma nova saída para cada investigação. Preservar bundles completos localmente; os resumos deste PR contêm IDs, cobertura e limites e não incluem o conteúdo do motor ou dos ativos.

## Limite desta entrega

As licenças e a portabilidade pendentes estão em [implementation-spec.md](../implementation-spec.md). Não executar etapas de construção da biblioteca com base nestes probes. A aprovação da especificação de implementação ainda é necessária.
