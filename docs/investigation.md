# Registro da investigação

## Protocolo e preparação

Aplicamos a skill [REA — Reverse Engineer Anything](https://github.com/morluto/rea/blob/fe677f6cf9853fb12490dfb8ef23ccae3a551049/.agents/skills/reverse-engineer-anything/SKILL.md), versão de metadados 60. Origem: `morluto/rea`, commit `fe677f6cf9853fb12490dfb8ef23ccae3a551049`. A skill foi lida antes do uso e instalada no workspace em `/workspace/skills/reverse-engineer-anything`. Não foi instalada por plugin nem foi registrado servidor MCP.

Instalamos a CLI `rea-agents@6.8.0` em prefixo isolado, com `--ignore-scripts --omit=optional`. `rea --version` retornou `6.8.0` em Node `24.22.1`. A CLI forneceu a execução das análises; instalar apenas a skill não teria fornecido essas ferramentas. A skill orienta analisar fontes completas com ferramentas normais e utilizar REA para artefatos distribuídos e evidências pertinentes. Aplicamos REA ao wheel real e ao loader JavaScript distribuído no build do avatar.

A conexão inicialmente falhou porque o comando não tinha acesso de rede ao proxy. O mesmo `git ls-remote` passou com a capacidade de rede do executor habilitada. Mantivemos proxy e TLS; não alteramos política de destino. A primeira instalação npm falhou por diretório de cache fora do workspace; a correção usou `--cache /workspace/cache/npm`. O navegador também precisou da capacidade de rede do executor para iniciar; todas as suas requisições foram interceptadas e limitadas a arquivos locais.

## Evidências REA

| Alvo | Operação | Evidência completa (ID) | Resultado e limite |
|---|---|---|---|
| Wheel `vlibras_translator` 1.3.3 | `inspect-artifact` | `ev_e39e90da100e9e5b2bbcc8232295aa3aae368d2468d80cb5cf7687ee5617c6a9` | Inventário ZIP completo dentro do escopo de entradas do container. Não executa Python nem comprova comportamento. |
| `UnityLoader.js` de player-webjs | `analyze-javascript-application` | `ev_18c0f5aa102a2fc76f97d91d932810479c5a2781ea15ac8a6fd7c640c83f1c91` | Um arquivo de 156.644 bytes analisado sem falha de parsing. Grafo parcial; semântica unknown, 5.959 lacunas. Nenhuma execução do loader pela análise estática. |
| `unity-loader.js` de web-browsers | `analyze-javascript-application` | `ev_ab6466a39bc4cd51630a13dddb217d32852f501e2aeb9cd23cbb153aa6bb9753` | Revisão complementar: um arquivo de 150.016 bytes, sem falha de parsing. Grafo parcial; 5.503 lacunas semânticas. Não estabelece comportamento de runtime. |

Resumos integrais das ferramentas: [wheel](evidence/rea-translator-wheel.summary.json) e [loader](evidence/rea-player-loader.summary.json). Os resumos mantêm limitações, hashes, IDs pais e cobertura. Os IDs nomeiam o conteúdo da evidência; não são URLs de um serviço público.

A revisão complementar acrescenta o [resumo do loader web-browsers](evidence/rea-browser-loader.summary.json). Seu bundle completo está em `/workspace/research/evidence/browser-loader.bundle.json`, somente no workspace de pesquisa.

Bundles completos ficaram em `/workspace/research/evidence/translator-wheel.bundle.json` e `player-loader.bundle.json`. O bundle do loader tem cerca de 30 MB e contém material derivado do artefato. Não foi redistribuído neste PR, assim como os ativos upstream. Para repetir a análise e preservar novas evidências, consultar [os comandos dos experimentos](../experiments/README.md). Não afirmar que um resumo equivale à inspeção de toda a semântica do build.

## Provas de execução

Estas evidências vieram de probes próprios executados por shell/Python/Chromium. Não são resultados de captura de runtime da REA.

| Prova | Estado | Evidência |
|---|---|---|
| Tradução real por regras | PASS | [180 amostras e ambiente](evidence/translator-offline-benchmark.json). Audit hook instalado antes do import bloqueou conexão/DNS; zero tentativas nos caminhos exercitados. |
| Avatar local | PASS para inicialização e ponte | [Observações Chromium](evidence/avatar-probe.json). Canvas, WebGL 2, `GetAvatar(icaro)`, `onLoadPlayer`; sete requisições locais. |
| Sinal conhecido | PASS técnico unitário no complemento | `OLA` continua como caso ausente do perfil inicial. No perfil distinto `web-browsers`, [OBRIGADO](evidence/browser-known-sign-probe.json) carregou localmente, apresentou movimento e concluiu sem fallback. Não valida correção linguística, sequência ou parada. |
| Neural | NÃO EXECUTADO | Inspecionamos ponteiro Git LFS; não adquirimos o checkpoint. |
| Tradutor no navegador | NÃO VALIDADO | Não houve prova de spaCy/Python em WebAssembly. Consulta a `https://pyodide.org/en/stable/pyodide-lock.json` retornou HTTP 403; isso não prova ausência de suporte em todo Pyodide. |
| Biblioteca Sinaliza / streaming / Node | NÃO IMPLEMENTADOS | A aprovação da especificação ainda está pendente. |

No modo por regras, p50 quente foi 19,895 ms e p95 53,787 ms. Importação levou 1,546 s; inicialização levou 7,156 s. Uma prova anterior mediu inicialização de 3,926 s. RSS máximo: 542.640 KiB. São resultados exploratórios em máquina compartilhada, sem limpeza do cache do SO ou validação linguística. O serviço público, ASR, streaming e Sinaliza não foram medidos. Não concluir redução dos 3–5 s informados no requisito.

## Checklist e prevenção

| Pergunta obrigatória | Cobertura |
|---|---|
| Repositórios e identidades | Respondida no escopo: wrappers, pacote, modelos, player e dicionários; fontes correspondentes exatas ainda parciais. |
| Texto → glosas | Respondida para regras; neural apenas estático. |
| Glosas → animações | Ponte e seleção local exercitadas; complemento validou reprodução técnica de `OBRIGADO`. Layout completo, catálogo, direitos, sequência/parada e qualidade linguística seguem pendentes. |
| Dependências e serviços | Identificados nos componentes inspecionados; tradutor por regras executado sem serviços externos. |
| Recursos e licenças | Inventariados por categoria; permissões específicas pendentes, conforme B2–B5. |
| Portabilidade | CPython e renderização WebGL comprovados; tradução em navegador pendente. |
| Desempenho | Amostra upstream por regras registrada; comparação integrada e calibração de streaming pendentes. |

Regras de prevenção para as etapas seguintes:

1. Identificar a dependência efetivamente instalada. Não tratar um wrapper de fila como motor completo.
2. Fixar modo, versões, dados e corpus antes de comparar latência ou glosas. Não comparar regras com neural como se fossem equivalentes.
3. Separar inventário estático, execução e qualidade linguística. Não usar parsing ou canvas como prova de animação correta.
4. Manter licença por recurso. Não herdar a licença do wrapper para pesos, dados ou avatar por inferência.
5. Usar cache de ferramentas no workspace e habilitar a capacidade de rede necessária ao proxy. Não substituir credenciais nem contornar a política.
6. Fixar os arquivos de cada build Unity como conjunto. Interpretar explicitamente estados string e filtrar eventos anteriores ao comando. O probe complementar corrigiu sua janela de timestamps antes de validar o ciclo de reprodução; o estado ocioso inicial não conta como fim do gesto.

As falhas de preparação foram resolvidas; os bloqueios de produto continuam explícitos. O protocolo de construtor/verificador e de três correções por etapa será aplicado à construção, depois da aprovação.
