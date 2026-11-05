# Investigação do tradutor VLibras

Data: 2026-11-05. Escopo: fontes do serviço e pacote efetivamente instalado pelo Dockerfile. Não houve implementação da biblioteca Sinaliza. Nenhum recurso upstream foi copiado para o repositório Sinaliza.

## Identidade e evidências

| Componente | Identidade inspecionada | Evidência |
|---|---|---|
| Wrapper Python do serviço | `spbgovbr-vlibras/vlibras-translator-text-core`, branch padrão `dev`, commit `550b5eb215ec080dd9a50055f3f92de3b4bbdf8b` | [Dockerfile](https://github.com/spbgovbr-vlibras/vlibras-translator-text-core/blob/550b5eb215ec080dd9a50055f3f92de3b4bbdf8b/Dockerfile), [worker.py](https://github.com/spbgovbr-vlibras/vlibras-translator-text-core/blob/550b5eb215ec080dd9a50055f3f92de3b4bbdf8b/src/worker.py) |
| API HTTP | `spbgovbr-vlibras/vlibras-translator-api`, branch padrão `abner.souza-master-patch-97628`, commit `5a00fd2bccb77ffa442eec4dbd6c8b036178729a` | [textTranslator.js](https://github.com/spbgovbr-vlibras/vlibras-translator-api/blob/5a00fd2bccb77ffa442eec4dbd6c8b036178729a/src/app/translator/textTranslator.js), [package.json](https://github.com/spbgovbr-vlibras/vlibras-translator-api/blob/5a00fd2bccb77ffa442eec4dbd6c8b036178729a/package.json) |
| Motor real | `vlibras_translator-1.3.3-py3-none-any.whl` do TestPyPI, 4.170.815 bytes, SHA-256 `a8bd00451a0ed931b4a6fa3fea37da7a56b39fa13f24afb2fd52ce21d3fba8ea` | [JSON oficial da distribuição](https://test.pypi.org/pypi/vlibras-translator/1.3.3/json), caminhos internos abaixo |
| Modelo spaCy | `pt_core_news_md-3.7.0-py3-none-any.whl`, 42.370.615 bytes, SHA-256 `8114b18aad511452f3c4682fbbedd440f453f8bd3de20ce7bf8a1ca6543a0315` | [Release Explosion](https://github.com/explosion/spacy-models/releases/tag/pt_core_news_md-3.7.0), `pt_core_news_md/pt_core_news_md-3.7.0/meta.json` |
| Modelo neural separado | `gitlab.lavid.ufpb.br/vlibras-deeplearning/translator-models`, commit `2c6cfa5965e4d049400c24b377ab2e18b8472790`, tags locais `v1.3-LATEST` e `v1.3.4` | [árvore fixada](https://gitlab.lavid.ufpb.br/vlibras-deeplearning/translator-models/-/tree/2c6cfa5965e4d049400c24b377ab2e18b8472790) |

Os dois repositórios GitHub não continham AGENTS.md no checkout inspecionado. A API HTTP é uma revisão de 2023; o wrapper inspecionado é de 2026. Não ficou estabelecido que esses commits são o conjunto implantado no serviço público atual.

## Fluxo observado nos fontes

### Serviço

1. A API registra `POST /translate` em `src/app/translator/textTranslatorRoute.js`. Valida o campo `text`. Consulta o cache Redis pelo middleware `translationCache`.
2. `textTranslatorController` abre canal RabbitMQ. Publica JSON `{"text": ...}` em `TRANSLATOR_QUEUE`, com `correlationId`, `replyTo` e TTL. Consome a resposta e envia `content.translation` como corpo HTTP.
3. `TranslationWorker` do wrapper cria `translate.Translator()`. `handle_payload` chama `self.translator.translate(text, neural=neural)` e retorna `{"translation": gloss, "version": ...}`.
4. A inicialização da API exige MongoDB e Redis (`src/index.js:53–68`). O processamento exige RabbitMQ. Estatísticas e tradução são registradas no MongoDB.
5. O modo neural é `True` por padrão em `src/config.py`. Refinamento por LLM é opcional, desativado por padrão; não pertence ao menor núcleo necessário. Quando ativado, `GlossRefinementWorker` instancia `vlibras_refiner.Refiner` e pode usar OpenAI ou Ollama.

As filas, MongoDB, Redis, API HTTP e refiner podem ser excluídos do caminho local Sinaliza: não há necessidade desses serviços para instanciar o motor real. A prova abaixo valida essa extração por chamada direta ao pacote, sem importar o wrapper.

### Motor real no wheel 1.3.3

Todos os caminhos desta subseção são relativos à raiz do wheel fixado por SHA-256.

- `vlibras_translator/translate.py:50` define `Translator`. O construtor carrega `spacy.load("pt_core_news_md")`, acrescenta o componente `postag` e instancia cleanup, transformações, lematizador, tabelas de lookup, formatador numérico e dicionário.
- `translate.py:554` (`_initial_steps`) aplica números, limpeza, transformações, abreviações e análise spaCy.
- `translate.py:572` (`translate`) chama `_initial_steps`, `_lemmatize`, `_depluralize`, `_substitutions_and_exclusions`, `_build_text_gloss` e, se habilitado, a tradução neural. No final aplica `replace_famosos`.
- `translate.py:107` (`_build_text_gloss`) filtra tokens removidos, tenta substituições com o dicionário, concatena em maiúsculas, converte pontuação, aplica sinônimos/pronomes e converte hífen em espaço. O retorno é uma **string** de glosas, não uma lista estruturada.
- `constants.py` define classes e regras para artigos, preposições, contrações, pronomes e marcadores de pontuação. `translate.py` implementa regras contextuais conforme POS, dependências e entidades spaCy.
- Pontuação observada: `[PONTO]`, `[INTERROGAÇÃO]`, `[EXCLAMAÇÃO]`; não eliminar esses símbolos ao adaptar para `string[]`.
- `tagger.py:13` carrega `data/tagger.pkl` com `joblib.load` e expõe uma extensão `Token._.postag`. O formato é Python/joblib/pickle, vinculado ao ecossistema Python.
- `lemmatization.py` usa JSON via `spacy.lookups.Table`; a tabela padrão é `pt_lemma_lookup_legacy.json`.
- `dictionary.py` lê uma glosa por linha em `dictionary.txt`. Tenta a forma lematizada quando o token não está no dicionário.
- `lookups.py` lê arquivos de pares separados por `;`, abreviações com separadores próprios e nomes `&FAMOSO` a partir do dicionário.
- `model_utils.py` decide compatibilidade pelo major/minor do pacote. Se o modelo neural faltar, `prepare_model` pode apagar o diretório `model` e clonar via Git/LFS `VLIBRAS_DL_MODEL_REPO` (padrão GitLab oficial), tag `v1.3-LATEST`. Esta aquisição automática deve ser eliminada ou impedida no fluxo offline Sinaliza.
- `neural.py:22` carrega checkpoint `Checkpoints/checkpoint_best.pt`, `BIN/dict.gr.txt`, `BIN/dict.gi.txt` e `BPE/bpe_code`. Usa `CPUTranslationModel.from_fairseq_artifacts`, beam 6 e quantização dinâmica. Segmenta por marcadores de pontuação antes da inferência.
- `Translator.translate` desativa neural para menos de três palavras. Falhas de inicialização neural específicas podem resultar em fallback para regras. A API Sinaliza precisa tornar esse fallback observável; não deve declarar sucesso neural sem saber o modo efetivo.
- `Translator` mantém `doc`, `tokens` e `num_tokens` mutáveis. Uma instância compartilhada precisa de serialização por chamada, ou de isolamento por worker. A presença dessas variáveis não prova segurança concorrente.

## Recursos e licenças

| Recurso | Formato/tamanho observado | Licença/evidência | Decisão proposta |
|---|---|---|---|
| Código dos dois repositórios GitHub | Python e JS | LICENSE LGPLv3 | Não portar wrappers; reusar apenas contratos necessários como referência |
| Código Python do wheel | Python, cabeçalhos LAViD LGPL-3.0; METADATA LGPL-3.0 | LICENSE do wheel e cabeçalhos | Reutilizar o núcleo Python, preservando atribuição e obrigações; não reescrever regras agora |
| `data/dictionary.txt` | UTF-8, 268.420 bytes, uma glosa por linha | Incluído no wheel com licença geral; não há aviso próprio nos dados inspecionados | Confirmar proveniência/permissão específica antes de redistribuir dados |
| `data/pt_lemma_lookup_legacy.json` | JSON, 10.949.513 bytes | Sem cabeçalho/licença individual observados | Confirmar proveniência antes de redistribuir |
| `data/pt_lemma_lookup.json` | JSON, 26.151.495 bytes | Sem cabeçalho/licença individual observados | Confirmar proveniência e necessidade; tabela padrão é a legacy |
| `data/tagger.pkl` | joblib/pickle, 751.742 bytes | Sem licença individual observada | Confirmar licença e treinamento/origem antes de redistribuir |
| Tabelas de abreviações/sinônimos/pronomes | texto, total aproximado 100 KB | Sem licença individual observada | Mesmo bloqueio de proveniência |
| `pt_core_news_md` 3.7.0 | wheel 42,37 MB | `meta.json`: CC BY-SA 4.0; UD Portuguese Bosque CC BY-SA 4.0; WikiNER CC BY 4.0; vetores Explosion CC0 | Preservar atribuição e licença específicas do modelo; não atribuir LGPL ao modelo |
| Pesos neurais externos | Git LFS pointer; checkpoint de 105.427.861 bytes, SHA-256 `f463d97bc61f3f422aec5c57a73b3aff020965261c41d627c73350fc6593b767` | Árvore fixada não contém LICENSE nem README | **Bloqueado para incorporação/redistribuição** até confirmação explícita |

O wheel tem 52 arquivos, total descomprimido 38.646.531 bytes. Manifesto completo: `translator-wheel-manifest.json`. O clone dos modelos usou `GIT_LFS_SKIP_SMUDGE=1`; os pesos não foram baixados nem executados. O ponteiro informa tamanho e digest do peso; não comprova o conteúdo do peso.

O Dockerfile também baixa WordNet. A prova de regras abaixo não precisou dessa aquisição e não acessou rede. Não foi verificada a necessidade de WordNet em todos os caminhos possíveis da distribuição.

## Prova local real e benchmark exploratório

Ambiente isolado: `/workspace/research/translator-venv`, Python 3.12.14, Linux x86_64. Sem patch do motor, sem mock das glosas e sem iniciar RabbitMQ, Redis, MongoDB ou API HTTP.

Instalação executada:

```sh
python -m venv /workspace/research/translator-venv
/workspace/research/translator-venv/bin/pip install /workspace/research/vlibras_translator-1.3.3-py3-none-any.whl 'spacy==3.7.5' 'numpy==1.26.0' 'joblib==1.2.0' 'nltk==3.9.4'
/workspace/research/translator-venv/bin/pip install --no-deps /workspace/research/pt_core_news_md-3.7.0-py3-none-any.whl
/workspace/research/translator-venv/bin/python /workspace/research/probe-translator-offline.py > /workspace/research/translator-offline-benchmark.json
```

Os wheels foram adquiridos antes do teste. O script instala um audit hook **antes de importar o motor**, bloqueia `socket.connect` e `socket.getaddrinfo` com exceção e registra tentativas. Resultado: `network_attempts: []`. O teste exercita o modo de regras `neural=False` com recursos locais pré-instalados; não estabelece que o modo neural seja offline.

| Entrada | Glosas observadas |
|---|---|
| `Olá mundo.` | `OLÁ MUNDO [PONTO]` |
| `Eu gosto de estudar.` | `EU GOSTO ESTUDAR [PONTO]` |
| `Nós vamos ao mercado amanhã.` | `NÓS IR MERCADO AMANHÃ [PONTO]` |
| `Quanto custa o livro?` | `QUANTO CUSTAR LIVRO [INTERROGAÇÃO]` |
| `Tenho 25 anos.` | `TER 25 ANO [PONTO]` |

Amostra: seis entradas sintéticas, 30 repetições por entrada, 180 chamadas com instância aquecida. Quantil p95 calculado por nearest rank; p50 por mediana. Resultados brutos no JSON:

- Importação: 1.545,62 ms.
- Inicialização de uma instância em novo processo: 7.155,92 ms.
- Tradução aquecida agregada: p50 19,90 ms; p95 53,79 ms; mínimo 13,71 ms; máximo 81,12 ms.
- CPU das 180 chamadas: 3,35 s; tempo de parede: 4,93 s.
- Pico RSS: 542.640 KiB.
- A primeira prova simples teve inicialização de 3,93 s e chamadas de aproximadamente 9–35 ms. A variação reforça a necessidade de medição controlada, sem usar uma amostra como garantia.

Limitações: cache de arquivos do SO não foi limpo; não há distribuição estatística da inicialização; máquina compartilhada; nenhuma validação linguística; sem inferência neural, avatar, streaming ou adaptador de transcrição; sem comparação com serviço público nem com Sinaliza. Não afirmar redução frente à linha de base informada de 3–5 s.

Artefatos locais: `translator-install.log`, `translator-model-install.log`, `translator-smoke.log`, `translator-offline-benchmark.json`, `translator-offline-benchmark.stderr`, `translator-freeze.txt`, `translator-wheel-manifest.json`, `translator-pypi.json`, `probe-translator-offline.py`. O stderr da prova offline ficou vazio.

O probe é parametrizável por `--output CAMINHO`; sem essa opção escreve JSON em stdout. Não contém caminhos absolutos do ambiente. `translator-requirements.lock.txt` fixa as versões transitivas observadas e substitui os caminhos locais dos dois wheels por URLs de origem com SHA-256. Não é um lock integral com hash de todas as dependências. O artefato NLTK fixado é [nltk-3.9.4-py3-none-any.whl](https://files.pythonhosted.org/packages/9d/91/04e965f8e717ba0ab4bdca5c112deeab11c9e750d94c4d4602f050295d39/nltk-3.9.4-py3-none-any.whl), SHA-256 `f2fa301c3a12718ce4a0e9305c5675299da5ad9e26068218b69d692fda84828f`. Não foi baixado corpus WordNet para a prova de regras.

## Menor núcleo e tecnologia proposta

**Observado:** regras Python + spaCy + postag joblib + recursos textuais executam texto→glosas localmente. O modelo neural separado é opcional no pacote, mas habilitado por padrão pelo wrapper do serviço. A prova de regras não equivale a compatibilidade com a configuração neural de produção.

**Proposta:** manter um único núcleo linguístico Python 3.12 e encapsular `vlibras_translator` 1.3.3, com versão/hash explícitos e configuração de modo observável. Não portar o motor para Go/TypeScript nesta fase. Evitar o custo e o risco de reimplementar spaCy, POS tagging e regras sem evidência de ganho.

**Proposta:** serializar trabalho por instância. Traduzir fora do event loop do consumidor; limitar fila e memória. Não compartilhar a instância entre sessões concorrentes sem essa proteção. O streaming será um módulo Sinaliza sobre tradução de segmentos, não uma capacidade incremental comprovada do motor upstream.

**Proposta:** frontend exige prova própria de execução local no navegador. A existência de código Python puro no wheel não torna spaCy e seus binários dependências WASM disponíveis. Não declarar suporte completo do tradutor no navegador antes de validar essa distribuição. Um processo Python local pode servir bindings Node/backend, mas não resolve por si só uma página web autônoma e não deve virar servidor remoto obrigatório.

**Decisões ainda dependentes de evidência:** incluir neural na V1 e escolher exatamente seus pesos; licença específica dos dados; estratégia de execução no navegador. A proposta de implementação deve trazer gates verificáveis para esses bloqueios em vez de prometer suporte.

## Lacunas e prevenção

- Repositórios históricos de fontes do motor (`vlibras2019/vlibras-library/vlibras-translate` e tentativa `vlibras-translator`) exigiram autenticação via HTTPS. Não foi obtido commit fonte correspondente ao wheel. O wheel contém fontes e foi fixado por digest.
- O repositório neural é público nesta sessão, mas não estabelece licença dos pesos. Não redistribuir por inferência da licença do wrapper.
- Não repetir o erro de tratar wrapper de fila como motor linguístico: inventariar a dependência efetiva do Dockerfile e o artefato instalado.
- Não repetir o erro de comparar regras com produção neural como se fossem o mesmo perfil: fixar modo, versões, recursos e corpus em cada benchmark.
- Não chamar uma prova estática de execução. Evidências de código, execução e lacunas estão separadas neste relatório.
