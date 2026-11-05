# Sinaliza — especificação de implementação proposta

**Status:** EM REVISÃO. Não autoriza a construção da biblioteca.

**Data da investigação:** 2026-11-05.

**Requisito de produto:** [SINALIZA_SPEC.md](SINALIZA_SPEC.md).

**Evidências:** [inventário](docs/vlibras-inventory.md) e [execução](docs/investigation.md).

## 1. Resultado da investigação

**Observado:** o serviço de tradução distribui trabalho por RabbitMQ. A API acrescenta Redis e MongoDB. O cálculo linguístico está em um pacote Python separado. O pacote `vlibras_translator==1.3.3` traduz em processo local com `Translator().translate(text, neural=False)`, depois da instalação dos recursos. O motor mantém estado mutável por chamada. Uma instância não deve processar chamadas simultâneas.

**Observado:** o player utiliza JavaScript e um build Unity WebGL. A ponte aceita glosas sem chamar o tradutor. O build renderizou o avatar localmente no Chromium. A tentativa de reproduzir `OLA` encontrou um bundle ausente e acionou soletração. Isso não valida um sinal conhecido. O repositório de dicionário contém serviços e metadados; não contém o catálogo de animações necessário para a V1.

**Achado complementar:** `vlibras-web-browsers` 7.12.3, commit `be3fa2506a7c43e36e2ba551483cb5f89388d495`, inclui o bundle `OBRIGADO` e outro build Unity. Esse conjunto carregou o bundle e reproduziu movimento localmente, com conclusão e sem fallback de soletração. A prova é técnica; não valida a correção linguística nem a licença individual. Usar esse conjunto fixado como referência do sinal conhecido. Manter o build de `player-webjs` como perfil separado do teste de recurso ausente. Ver [revisão complementar](docs/additional-repositories.md).

**Observado:** o serviço seleciona tradução neural por padrão; o experimento executou somente regras. Os resultados medidos não demonstram equivalência com o serviço em produção. A licença dos pesos neurais não foi localizada no snapshot inspecionado.

**Proposta:** extrair primeiro a execução local baseada em regras. Manter o motor Python como única implementação linguística. Não portar regras para Go ou JavaScript nesta versão. Não copiar os serviços de infraestrutura. A proposta depende da aprovação explícita deste perfil de referência; ele não substitui silenciosamente o modo neural.

## 2. Tecnologia e ambientes

| Componente | Decisão proposta | Justificativa e limite |
|---|---|---|
| Núcleo e sessões | Python 3.12; pacote upstream 1.3.3 fixado por SHA-256 | Execução real validada; preserva regras e recursos. Não implica menor inicialização. |
| Binding Node.js | TypeScript; processo Python persistente, protocolo JSON Lines por stdin/stdout | Reutiliza o mesmo núcleo. Sem HTTP, fila ou banco obrigatório. O consumidor instala o runtime Python. |
| Avatar web | TypeScript; adaptador da ponte Unity existente | Reprodução técnica unitária comprovada com `web-browsers`/`OBRIGADO`. Direitos, sequência/parada e validação linguística pendentes. |
| Tradução no navegador | Prova de viabilidade Python/WebAssembly em Web Worker antes de anunciar suporte | spaCy e suas dependências nativas exigem validação específica. Instalar um wheel Python puro não resolve essas dependências. |
| Go | Não adotar para o núcleo nesta proposta | Exigiria portar ou encapsular o motor; não há medição que justifique esse custo. |

O suporte inicial **comprovado nesta investigação** é o tradutor upstream em CPython, a renderização dos builds de avatar em Chromium e a reprodução técnica do bundle `OBRIGADO` no conjunto `web-browsers`. Não existe biblioteca Sinaliza pronta. Não existe prova de tradução em navegador nem de binding Node.

O alvo do experimento de navegador é executar o mesmo pacote e recursos em Python/WebAssembly, dentro de Worker, com arquivos locais pré-instalados. A prova deve traduzir o corpus de referência com rede externa bloqueada, medir memória, inicialização e tamanho, e comparar as glosas. Não substituir spaCy por tokenizador simplificado para declarar sucesso.

Se a prova falhar, a etapa 1 ficará BLOCKED. Apresentar as evidências e solicitar decisão sobre investimento no runtime ou ajuste explícito do requisito. Não declarar frontend completo com uma chamada obrigatória a backend. Um servidor de arquivos estáticos da aplicação pode entregar recursos locais; ele não será um serviço remoto de tradução.

## 3. Módulos e distribuição

- `translator-core`: adaptador fino do pacote upstream. Carrega recursos locais de diretório informado. Mantém a instância aquecida. Serializa o acesso ao motor. Não importa módulos de avatar ou transporte.
- `linguistic-assets`: manifesto de recursos com origem, versão, SHA-256, licença, atribuição e caminho local. Código e dados têm entradas separadas. A inicialização verifica recursos e informa o que falta; não baixa arquivos automaticamente.
- `stream`: sessões, revisão do trecho pendente, filas limitadas e cancelamento. Compartilha o motor por um agendador FIFO com exclusão mútua. Não compartilha buffers entre sessões.
- `avatar`: fila de glosas, resolução de bundles locais e ponte Unity. Não inclui tradução nem depende dela. O consumidor pode fornecer qualquer sequência compatível.
- `adapters`: adaptador de eventos de transcrição. Recebe texto; não abre microfone nem executa ASR.
- `bindings`: Python direto, Node por processo local persistente e Worker de navegador somente após prova. Reutiliza os mesmos contratos e testes de conformidade.

Distribuir o núcleo e as sessões em wheel Python. Distribuir binding Node e avatar como pacotes npm separados. Recursos linguísticos e de animação ficam em pacotes/arquivos separados, versionados por manifesto e publicados somente após verificação das permissões. A instalação pode adquirir dependências; o caminho principal, com recursos instalados, deve funcionar offline.

Conservar atribuições e cumprir as licenças aplicáveis. A proposta é LGPL-3.0 para código Sinaliza que derive do upstream. Essa escolha não relicencia modelos, dicionários, avatar ou runtime Unity. Não publicar pacotes nos registros nesta entrega.

## 4. Contratos públicos propostos

Os exemplos TypeScript definem o contrato lógico. O binding Python oferece equivalentes `async`, iteradores assíncronos e os mesmos campos/eventos. A operação síncrona do upstream fica atrás do agendador, fora do laço de eventos.

### Tradução direta

```ts
interface TranslationResult {
  glosses: string[];
  sourceText: string;
  metadata?: Record<string, unknown>;
}
interface Translator {
  translate(text: string): Promise<TranslationResult>;
}
```

Preservar `sourceText` exatamente como recebido. Preservar a ordem, os acentos e os marcadores do motor em `glosses`. Documentar e testar a conversão da string upstream em tokens; não remover marcadores como `[PONTO]`. Texto vazio produz sequência vazia. Não traduzir texto em outra língua por um motor remoto. Falha de recursos ou do motor rejeita a chamada com código estável.

Carregar o motor por uma fábrica assíncrona `createTranslator({ assetsPath })`. Não bloquear a primeira tradução com downloads. A fábrica só resolve depois de carregar e verificar os recursos. Expor `dispose()` para liberar o executor. Validar inicialização e encerramento em cada binding.

### Sessões e revisões

```ts
type StreamEvent =
  | { type: 'partial'; sessionId: string; segmentId: string;
      revision: number; glosses: string[] }
  | { type: 'committed'; sessionId: string; segmentId: string;
      revision: number; glosses: string[] }
  | { type: 'error'; sessionId: string; code: string; message: string }
  | { type: 'end'; sessionId: string };

interface TranslationSession {
  pushText(text: string, options?: {
    final?: boolean; mode?: 'append' | 'replace-pending';
  }): Promise<void>;
  events(): AsyncIterable<StreamEvent>;
  flush(): Promise<void>;
  close(): Promise<void>;
  cancel(): Promise<void>;
}
```

- Criar a sessão por `createSession(translator, bufferConfig)`. Gerar IDs únicos de sessão e IDs sequenciais de segmento dentro da sessão. Existe no máximo um segmento provisório ativo por sessão.
- Cada `partial` contém a sequência provisória **completa** do `segmentId`. Substitui integralmente o `partial` anterior desse segmento. Não é um sufixo para concatenar. `revision` cresce estritamente por sessão nos eventos de glosas; lacunas são permitidas quando trabalho obsoleto é descartado.
- `committed` encerra o mesmo segmento e substitui seu provisório. O consumidor acrescenta a sequência estável uma única vez. Nenhuma revisão posterior usa esse segmento. Um segmento pode ser confirmado sem evento provisório anterior.
- `append`, padrão, concatena o texto literalmente; o produtor fornece os espaços. `replace-pending` substitui todo o texto ainda não confirmado. Nunca recebe novamente o prefixo confirmado. O adaptador de transcrição controla o ID do enunciado e rejeita correções de enunciados já confirmados; não remove prefixos por heurística.
- O tempo e o tamanho configurados disparam tradução provisória. Na primeira versão, somente `final: true`, `flush()` ou `close()` confirmam o texto pendente. Pontuação pode antecipar uma tradução provisória, mas não confirma um trecho. Isso evita inventar estabilidade linguística que o motor não expõe.
- `final: true` equivale a alimentar e executar `flush()` na mesma ordem. `flush()` confirma todo o texto pendente e mantém a sessão aberta. Sem texto pendente, não emite novo segmento. `close()` impede novas entradas, confirma o pendente, emite um `end` e encerra o iterador. Chamadas repetidas de encerramento são idempotentes.
- `cancel()` invalida o trabalho pendente e resultados ainda não publicados, preserva confirmações já emitidas e encerra com um `end`, sem confirmar o pendente. Uma inferência Python já em execução pode terminar internamente; seu resultado é descartado. Não matar o executor compartilhado de outras sessões.
- Consumir `events()` concorrentemente com a alimentação. Admitir somente um consumidor por sessão. Após encerramento, `pushText` rejeita com `SESSION_CLOSED`. Erros fatais emitem `error`, depois `end`; erros de validação rejeitam a chamada sem alterar o buffer.

`bufferConfig` contém limites de texto, intervalo para provisórios, quantidade de trabalhos e tamanho da fila de eventos. A calibração gera os perfis padrão versionados; não fixar números a partir desta amostra. Validar limites positivos. Coalescer provisórios obsoletos. Não descartar confirmações. Bloquear a produção de resultados quando o consumidor estiver lento e rejeitar novas entradas com `QUEUE_FULL` antes de exceder os limites. Manter espaço reservado para eventos de encerramento, de modo que `cancel()` não dependa de uma fila livre.

### Avatar e recursos

```ts
interface AvatarPlayer {
  enqueueGlosses(glosses: string[]): Promise<void>;
  play(): Promise<void>;
  stop(): Promise<void>;
}
```

Criar o player com elemento de montagem, caminhos locais do build e manifesto de sinais. Concluir a inicialização apenas no callback `onLoadPlayer`. Enfileirar glosas não inicia reprodução. `play()` inicia a fila; `stop()` chama a ponte `stopAll` e esvazia o trabalho ainda pendente. Somente glosas confirmadas entram na integração automática; glosas diretas também são aceitas.

Fixar cada perfil do avatar como um conjunto de loader, manifesto, dados Unity, WASM e bundles, com origem, commit e hashes. Não misturar os dois builds investigados nem presumir compatibilidade entre seus bundles. Para o primeiro teste de sinal conhecido, usar o conjunto `web-browsers` e o bundle `OBRIGADO`, cujo SHA-256 é `f313d45a631e372e2243607ec5e9869dbb623f68de8bd06b0183d6872212071e`. Seus arquivos permanecem externos ao pacote Sinaliza até confirmação de B4.

Normalizar explicitamente os estados dos callbacks Unity: o runtime observado transmite strings `'True'`/`'False'`. Não usar coerção booleana genérica. Considerar a sequência de estado de reprodução e `CounterGloss` depois do comando atual; um estado ocioso emitido na inicialização não comprova conclusão. A ponte TypeScript de `web-browsers` serve como referência adicional; sua requisição HTTP de tradução e seu cancelamento global não entram no núcleo nem substituem sessões independentes.

O formato upstream observado é **Unity AssetBundle**, selecionado por glosa, versão, plataforma e região nos serviços de dicionário. O build consulta `baseUrl + glosa`; não recebe JSON de keyframes. O manifesto local proposto mapeia essa mesma identidade para caminho e SHA-256 do bundle. Não converter para um formato de animação inventado.

Preservar marcadores no resultado de tradução. Resolver no avatar quais são comandos, sinais ou entradas sem recurso, com fixtures obtidas do build e dos bundles reais. Registrar glosa não suportada. Não chamar o dicionário remoto como fallback. A política inicial é informar `ASSET_MISSING` e pular o item; soletração automática só será anunciada após validação com os recursos e atribuições correspondentes. A prova atual de fallback não comprova sua correção linguística.

## 5. Extração, licenças e bloqueios

| ID | Situação atual | Condição para remover o bloqueio |
|---|---|---|
| B1 | Tradução no navegador não executada; consulta ao índice estável Pyodide retornou HTTP 403 | Prova do mesmo motor e corpus em Worker, sem serviço de tradução; ou alteração explícita do requisito aprovada pelo usuário. |
| B2 | Licença/proveniência dos dados internos do tradutor não discriminadas por recurso | Manifesto com base de uso e redistribuição de cada arquivo incorporado, incluindo `tagger.pkl` e tabelas. |
| B3 | Pesos neurais sem licença localizada; referência executada usa regras | Aprovar explicitamente a referência por regras; se equivalência neural for necessária, obter pesos e permissões, executar e rever esta especificação. |
| B4 | Licenças de animações, modelos de avatar e runtime Unity não confirmadas separadamente | Confirmar direitos, atribuições e condições de redistribuição por categoria. Não extrair ativo de licença desconhecida para pacote público. |
| B5 | Bundle `OBRIGADO` encontrado e reprodução técnica unitária validada com o build correspondente; sequência, parada e validação linguística ainda pendentes | Validar sequência e `stop()` com recursos permitidos, incluindo seleção e conclusão corretas. A prova unitária não remove B4 nem substitui esses testes. |

Esses bloqueios impedem declarar a V1 concluída. Aprovar o documento não os transforma em critérios aprovados nem autoriza redistribuição de recursos sem permissão.

A extração será incremental: fixar o wheel e os recursos; encapsular a função real; retirar a dependência dos wrappers RabbitMQ/API; manter testes de referência; separar dados do pacote de código somente após seu inventário. Não incorporar o modo neural, refinador LLM, Redis, MongoDB, PostgreSQL ou serviços de dicionário ao caminho principal proposto.

## 6. Testes, métricas e critérios de aceite

**Referência observada:** seis textos próprios, trinta repetições por texto. Motor por regras, pacote 1.3.3. p50 quente 19,895 ms; p95 quente 53,787 ms. Importação 1.545,624 ms; inicialização 7.155,919 ms; RSS máximo 542.640 KiB. A execução inicial separada mediu inicialização de 3,926 s. Cache do sistema não foi limpo e houve outras tarefas no ambiente. Esses valores não são promessa de desempenho, benchmark de streaming ou comparação com o serviço neural.

O benchmark definitivo executará upstream e Sinaliza no mesmo host, corpus, recursos e modo de motor, em processos separados. Registrar SO, CPU, runtimes, versões, hashes, número de repetições e amostras brutas. Medir inicialização separadamente das chamadas aquecidas; usar p50 por mediana e p95 pelo método nearest-rank documentado. Repetir pelo menos trinta vezes cada texto e registrar CPU, RSS e bytes dos pacotes. Não excluir falhas ou regressões do relatório.

Testar:

- Tradução: vazio, acentos, números, perguntas, pontuação, texto longo, língua não suportada e recurso ausente. Comparar a string upstream com a sequência serializada sem reordenar glosas. Usar somente corpus e recursos com permissão.
- Sessões: fragmentos e substituições do pendente; revisões fora de tempo descartadas; confirmação sem duplicação; `flush`, `close`, `cancel`; erro fatal; consumidor lento; filas cheias; múltiplas sessões; concorrência com chamadas diretas. Validar ausência de crescimento ilimitado e de vazamento de estado.
- Avatar: inicialização, glosa conhecida, glosa ausente, marcadores, sequência, parada, fila e conclusão. Usar o conjunto `web-browsers`/`OBRIGADO` para a referência unitária e preservar o teste anterior de sinal ausente como perfil separado. Testar strings de estado Unity, eventos ociosos anteriores ao comando e isolamento entre perfis. Bloquear rede externa e verificar que só recursos locais são usados. Renderização de um canvas, isoladamente, não satisfaz o aceite de animação.
- Integração: medir tempo até a primeira glosa provisória, primeira confirmada e primeira animação. Usar um replay temporizado de eventos de transcrição como adaptador de referência, sem ASR próprio. Separar seus timestamps do tempo do tradutor e do avatar.
- Distribuição: instalar em consumidor limpo; importar módulos independentemente; executar exemplos offline em cada ambiente anunciado. Registrar limitações de SO e navegador. Exigir manifesto completo de recursos e atribuições.

Calibrar o buffer com os mesmos replays, variando tamanho e espera. Registrar latência, quantidade de revisões, divergências em relação à frase completa, memória e fila. Escolher o perfil padrão somente após comparar as medições. Não prometer equivalência perfeita de tradução incremental.

## 7. Etapas posteriores à aprovação

Todas as etapas abaixo estão **NOT STARTED**. Os experimentos deste PR não contam como etapas de construção concluídas.

| Etapa | Entrega | Dependências | Critério de aceite |
|---|---|---|---|
| 1 | Viabilidade e direitos dos recursos | Aprovação deste documento | Resolver B1–B5 com evidências e manifesto; confirmar perfil por regras. Se uma condição falhar, BLOCKED, sem seguir à construção. |
| 2 | Tradutor local extraído e recursos externos ao código | 1 | API direta executa o motor fixado offline; fixtures compatíveis; inicialização sem download; chamadas serializadas e módulos independentes. |
| 3 | Sessões e buffer adaptativo | 2 | Contratos de revisão, estabilidade, filas, encerramento e concorrência passam nos testes; perfil provisório medido e documentado. |
| 4 | Avatar independente | 1 e 2 | Sinal conhecido e sequência reproduzidos offline; parada e ausências tratadas; recursos permitidos e atribuídos. |
| 5 | Bindings e adaptador de transcrição | 2–4 | Python, Node e alvo de navegador aprovado passam na conformidade; nenhum duplica regras ou exige tradução remota. |
| 6 | Benchmark e integração | 3–5 | Relatórios reproduzíveis de todas as métricas, comparação no mesmo modo upstream e Sinaliza, perfil do buffer versionado; regressões explicitadas. |
| 7 | Empacotamento, exemplos e verificação V1 | 1–6 | Consumidores limpos executam exemplos offline; licenças documentadas; todos os critérios da seção 11 do spec aprovados por verificação independente. |

Cada etapa terá um construtor e um verificador independente. Permitir no máximo três tentativas de correção após falha. Registrar causa, correção, prevenção e regressão em falhas recorrentes. Marcar DONE somente com comandos, resultados e artefatos de verificação. Após três tentativas sem sucesso, marcar BLOCKED e solicitar decisão. Não executar publicação de pacotes ou merge automaticamente.

## 8. Revisão solicitada

Revisar a proposta de manter Python como núcleo único, usar regras como referência inicial e bloquear a construção até resolver portabilidade e direitos dos recursos. A aprovação de requisitos de produto já presente em `SINALIZA_SPEC.md` não aprova este documento.

Parar após apresentar este PR. Aguardar aprovação explícita da especificação de implementação antes de escrever código da biblioteca.
