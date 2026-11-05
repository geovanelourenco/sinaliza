# Sinaliza — Especificação técnica V1

**Status:** requisitos de produto aprovados; especificação de implementação pendente de aprovação  
**Referência:** VLibras  
**Linguagem:** português técnico, com princípios de redação ASD-STE100 adaptados ao português.

## 0. Protocolo obrigatório do agente

Este protocolo tem prioridade sobre o plano de fases da seção 9. **Não iniciar a implementação da biblioteca antes da aprovação explícita da especificação de implementação.**

### Etapa A — Instalar e aplicar REA

1. A primeira ação do agente DEVE ser localizar e instalar a skill **`rea` (Reverse Engineer Anything)** no ambiente de execução. Confirmar a origem e as instruções da skill antes de executá-la. Se a skill não estiver disponível ou não puder ser instalada, registrar o bloqueio e solicitar orientação. NÃO substituir a skill silenciosamente.
2. Usar `rea` para fazer engenharia reversa dos repositórios oficiais relevantes do **VLibras**. Identificar os repositórios e suas versões/commits. NÃO presumir que um único repositório contém todos os recursos.
3. Mapear o caminho texto → glosas → animações, regras linguísticas, dicionários, ativos, dependências, serviços, protocolos, licenças e pontos de acoplamento. Identificar o menor conjunto de componentes necessário para cumprir esta especificação.
4. Validar as conclusões com evidências do código, testes e execução local, quando possível. Registrar caminhos, símbolos, versões, resultados e lacunas. NÃO inventar comportamento não verificado.

### Etapa B — Produzir especificação e aguardar aprovação

1. Criar **`implementation-spec.md`** a partir dos resultados da REA e dos requisitos deste documento. Este documento atual define o produto; `implementation-spec.md` deve definir como implementá-lo.
2. Incluir: inventário de componentes reutilizáveis; decisão de linguagem e runtime com justificativa; desenho de módulos e interfaces; estratégia de distribuição local para frontend/backend; contratos de tradução direta e streaming; integração do avatar; recursos e licenças; plano de migração/extração; testes, métricas e critérios de aceite; riscos e bloqueios.
3. Delimitar no máximo **7 etapas de implementação**, cada uma com entrega verificável, dependências e critérios de aceite. Separar fatos observados de decisões propostas.
4. Apresentar `implementation-spec.md` para revisão e **PARAR**. Aguardar aprovação explícita do usuário. NÃO escrever código de implementação, alterar o produto ou iniciar etapas de construção enquanto a aprovação estiver pendente. São permitidos apenas experimentos isolados necessários para validar a engenharia reversa.
5. Se houver pedido de ajuste, atualizar a especificação e submetê-la novamente à aprovação.

### Etapa C — Implementar somente após aprovação

Aplicar o seguinte protocolo a cada etapa aprovada, conforme o prompt de execução fornecido:

1. Dividir a implementação em **no máximo 7 etapas**.
2. Um **subagente de construção** implementa; outro **subagente de verificação**, independente, valida os critérios de aceite e executa os testes. Não considerar autoverificação do construtor como verificação independente.
3. Permitir **no máximo 3 tentativas de correção por etapa** após falha de verificação. Se a etapa continuar falhando, marcar como **BLOCKED**, registrar evidências e solicitar decisão. NÃO avançar como se estivesse concluída.
4. Converter **toda falha recorrente** em uma regra de prevenção documentada e aplicável às etapas seguintes. Registrar causa, correção e teste de regressão.
5. Marcar uma etapa como **DONE somente quando a verificação passar**. Registrar comandos executados, resultados, artefatos e limitações.
6. Ao concluir todas as etapas, executar a verificação integrada dos critérios da seção 11. Declarar a V1 concluída somente se essa verificação passar.

### Formato de escrita

Escrever os documentos de execução em português técnico, com frases curtas, instruções explícitas, termos consistentes e voz ativa, seguindo os princípios aplicáveis da **ASD-STE100** adaptados ao português. Evitar redundância, linguagem vaga e decisões sem evidência.

## 1. Objetivo

Construir **Sinaliza**, uma biblioteca modular e de código aberto para tradução local de português para glosas de Libras e reprodução dessas glosas por avatar.

A biblioteca DEVE funcionar sem chamadas obrigatórias a serviços externos. O consumidor DEVE poder integrar a biblioteca a aplicações frontend ou backend. O objetivo de desempenho é reduzir a latência observada de aproximadamente **3 a 5 segundos** na integração atual com VLibras. Esse valor é a linha de base informada, não uma garantia de desempenho da V1.

## 2. Escopo da V1

### 2.1 Requisitos funcionais

- **RF-01 — Tradução direta:** receber texto em português e retornar uma sequência de glosas, na ordem produzida pelo motor.
- **RF-02 — Tradução incremental:** receber fragmentos de texto ou transcrições parciais e emitir resultados incrementais.
- **RF-03 — Sessões:** permitir criar, alimentar, finalizar e cancelar sessões de streaming.
- **RF-04 — Avatar:** disponibilizar um módulo que receba glosas ou sequências de animação e execute animações locais compatíveis com os recursos aproveitados do VLibras.
- **RF-05 — Uso independente:** permitir usar apenas o tradutor, apenas o avatar ou ambos em conjunto.
- **RF-06 — Execução local:** não exigir API remota, fila externa, banco remoto ou servidor central para executar o fluxo principal.
- **RF-07 — Interfaces:** oferecer chamada direta para entrada completa e interface de streaming para entrada contínua.
- **RF-08 — Extensibilidade:** separar os recursos linguísticos, o motor de tradução, a gestão de sessões e a renderização.

### 2.2 Fora do escopo

- Tradução de Libras para português.
- Captura e interpretação de mãos, rosto ou corpo de uma pessoa sinalizante.
- Treinamento de modelos para aprender novas frases.
- Substituição ou revisão linguística dos dados do VLibras na V1.
- Serviço SaaS, hospedagem obrigatória, autenticação, faturamento ou API pública remota.
- Implementação própria de reconhecimento de fala.
- Transporte de vídeo, multiplexação de mídia, FFmpeg ou sincronização audiovisual ponta a ponta.

O áudio pode entrar por um adaptador de transcrição. O núcleo Sinaliza recebe **texto ou eventos de transcrição**, não precisa decodificar áudio na V1.

## 3. Investigação obrigatória do VLibras

Antes de reescrever componentes, o agente DEVE inspecionar os repositórios oficiais e registrar:

1. Repositórios, versões, licenças e dependências dos componentes de tradução e avatar.
2. Fluxo completo: texto → normalização → análise/tradução → glosas → seleção de animações → avatar.
3. Localização e formato dos dicionários, regras, modelos, recursos e arquivos de animação.
4. Componentes que exigem serviços, processos, filas ou acesso à rede.
5. Componentes que podem funcionar em processo local ou como biblioteca.
6. Interfaces e formatos necessários para preservar compatibilidade funcional.
7. Restrições de licença e atribuição para código, modelos, dicionários, avatares e demais ativos, **avaliados separadamente**.

**Regra:** não presumir que todos os ativos tenham a mesma licença. Não copiar ou redistribuir um ativo antes de confirmar sua permissão de uso. Documentar a origem e a licença de cada recurso incorporado.

**Entrega:** `docs/vlibras-inventory.md`, com referências aos arquivos e decisões de reutilização, adaptação ou substituição.

## 4. Arquitetura proposta

```text
Aplicação consumidora
    |
    +-- Direct API -------------------+
    |                                 |
    +-- Streaming Session API --------+--> Translator Core
    |                                        |
    |                                        +--> Linguistic Assets
    |                                        +--> Translation Rules / Models
    |                                        |
    |                                        +--> Gloss Events / Results
    |                                                    |
    +-- Avatar API <-------------------------------------+
             |
             +--> Animation Assets
             +--> Local Renderer / Player
```

### 4.1 Módulos

| Módulo | Responsabilidade |
|---|---|
| `translator-core` | Traduzir texto em português para glosas. Carregar regras e recursos linguísticos locais. |
| `stream` | Gerenciar sessões, buffers, fragmentos de texto e eventos incrementais. |
| `avatar` | Receber glosas, resolver animações disponíveis e executar a reprodução local. |
| `adapters` | Adaptar entradas externas, como eventos de um transcritor de áudio. Não implementar ASR próprio. |
| `bindings` | Expor interfaces para os ambientes de execução suportados, sem duplicar a lógica linguística. |

O tradutor NÃO DEVE depender do avatar. O avatar DEVE aceitar glosas fornecidas por qualquer consumidor compatível.

### 4.2 Modos de execução

**Direct:** o consumidor chama uma função local com texto completo e recebe o resultado.

**Streaming:** o consumidor cria uma sessão local, envia fragmentos e recebe eventos. O streaming DEVE funcionar sem servidor de rede. Um adaptador opcional PODE expor WebSocket ou outra interface de transporte no futuro.

## 5. Contratos lógicos mínimos

Os contratos abaixo definem comportamento, não uma linguagem de programação.

### 5.1 Tradução direta

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

### 5.2 Streaming

```ts
type StreamEvent =
  | { type: 'partial'; sessionId: string; revision: number; glosses: string[] }
  | { type: 'committed'; sessionId: string; revision: number; glosses: string[] }
  | { type: 'error'; sessionId: string; code: string; message: string }
  | { type: 'end'; sessionId: string };

interface TranslationSession {
  pushText(text: string, options?: { final?: boolean }): Promise<void>;
  events(): AsyncIterable<StreamEvent>;
  flush(): Promise<void>;
  close(): Promise<void>;
  cancel(): Promise<void>;
}
```

**Semântica obrigatória:**

- `partial` é provisório. Uma nova revisão PODE substituir glosas provisórias anteriores.
- `committed` é estável e NÃO DEVE ser alterado por revisões posteriores.
- Cada sessão DEVE preservar a ordem dos eventos e identificar revisões.
- `flush()` DEVE processar o texto pendente. `close()` DEVE finalizar a sessão. `cancel()` DEVE interromper o trabalho pendente.
- O contrato DEVE documentar como o consumidor identifica o trecho substituído por uma revisão. O agente DEVE detalhar essa semântica antes da implementação.

### 5.3 Avatar

```ts
interface AvatarPlayer {
  enqueueGlosses(glosses: string[]): Promise<void>;
  play(): Promise<void>;
  stop(): Promise<void>;
}
```

A implementação DEVE definir o formato de associação entre glosa e recurso de animação com base no inventário real do VLibras. Não inventar formatos de ativos antes dessa investigação.

## 6. Processamento incremental

O módulo `stream` DEVE implementar um **buffer adaptativo** para texto ou transcrição parcial.

- Acumular fragmentos até existir contexto suficiente para emitir glosas.
- Usar limites configuráveis de tamanho, tempo de espera e finalização explícita.
- Emitir resultados provisórios quando necessário.
- Confirmar segmentos apenas quando o motor puder tratá-los como estáveis.
- Evitar repetir segmentos confirmados.
- Aplicar controle de fila e backpressure para impedir crescimento ilimitado de memória.

O agente DEVE medir o efeito do buffer sobre latência e qualidade da tradução. Não definir valores fixos sem benchmark. A V1 NÃO DEVE prometer equivalência perfeita entre tradução incremental e tradução de uma frase completa.

## 7. Tecnologia e portabilidade

**Não escolher a linguagem definitiva antes da investigação.** Avaliar Python, Go e TypeScript/Node.js com base em:

- Linguagem e dependências reais do núcleo VLibras.
- Custo de portar regras, modelos e recursos.
- Latência, uso de memória e tempo de inicialização.
- Execução em navegador e em servidor.
- Distribuição e instalação sem infraestrutura externa.
- Manutenção de um único núcleo linguístico.

**Diretriz inicial:** priorizar a extração funcional e os testes de compatibilidade. Reutilizar o núcleo existente quando isso reduzir risco. Portar para outra linguagem apenas quando houver justificativa técnica medida.

**Restrição:** uma biblioteca Python nativa não roda diretamente no navegador. O agente DEVE propor e validar uma estratégia de portabilidade, como núcleo compilável para WebAssembly, implementação compatível por ambiente ou outro mecanismo local. Não declarar suporte frontend completo sem prova de execução.

## 8. Desempenho e testes

Criar benchmark reproduzível com as mesmas entradas para VLibras e Sinaliza. Medir:

- Tempo de inicialização e carregamento de recursos.
- Latência de tradução direta (p50, p95).
- Tempo até a primeira glosa provisória e a primeira glosa confirmada.
- Tempo até a primeira animação do avatar.
- Latência fim a fim com um adaptador de transcrição de referência.
- Memória, CPU e tamanho dos recursos distribuídos.

Separar a latência de reconhecimento de fala da latência de tradução e avatar. A meta é **reduzir a latência atual de 3–5 s**, sem estabelecer um número de ganho antes das medições.

Criar testes de regressão com frases e glosas de referência do VLibras, quando os recursos e licenças permitirem. Registrar divergências, limitações e casos sem animação correspondente. Incluir testes de ordem, revisão, cancelamento, flush e concorrência de sessões.

## 9. Plano técnico de referência

As fases abaixo orientam a investigação e a proposta. **Não são autorização para implementar.** Após a REA, o agente DEVE consolidá-las em `implementation-spec.md`, com no máximo 7 etapas, e obter aprovação antes de executar as fases de construção.

### Fase 1 — Inventário e prova de execução

- Inspecionar o código e os ativos oficiais do VLibras.
- Identificar licenças e restrições.
- Executar o tradutor e, se possível, o avatar em ambiente local controlado.
- Documentar o fluxo e medir a linha de base.

**Aceite:** inventário auditável, dependências identificadas e tradução de referência reproduzível.

### Fase 2 — Extração do tradutor

- Isolar regras, dicionários, modelos e funções necessárias.
- Expor `translate(text)` em processo local, sem serviços externos obrigatórios.
- Criar testes de compatibilidade e benchmark.

**Aceite:** texto → glosas com chamada local e resultados comparáveis ao VLibras de referência.

### Fase 3 — Streaming

- Implementar sessões e eventos.
- Implementar buffer adaptativo, revisão e confirmação.
- Testar transcrições parciais, finalização, concorrência e backpressure.

**Aceite:** o consumidor envia texto incremental e recebe glosas sem requisição remota.

### Fase 4 — Avatar

- Isolar recursos de animação permitidos.
- Criar `AvatarPlayer` independente do tradutor.
- Conectar glosas confirmadas à fila de animação.
- Medir tempo até a primeira animação.

**Aceite:** o avatar local reproduz sequências suportadas a partir de glosas recebidas.

### Fase 5 — Empacotamento e integração

- Publicar a biblioteca com módulos independentes.
- Criar exemplo de uso direto e exemplo de streaming.
- Criar demonstração de integração com transcritor externo.
- Validar os ambientes de execução realmente suportados.
- Publicar documentação de instalação, API, licenças e limitações.

**Aceite:** um projeto consumidor usa os módulos suportados sem implantar a infraestrutura de serviços do VLibras.

## 10. Regras de execução

1. NÃO ampliar o escopo para tradução inversa, visão computacional ou treinamento de IA.
2. NÃO criar backend obrigatório. Processos auxiliares locais só são permitidos se necessários e documentados.
3. NÃO portar o VLibras integralmente sem primeiro identificar o menor núcleo reutilizável.
4. NÃO presumir licença livre para todos os dados e ativos.
5. NÃO otimizar sem medição. Preservar resultados de referência durante as mudanças.
6. NÃO acoplar tradução, streaming e avatar.
7. Registrar decisões técnicas relevantes em `docs/decisions/` e manter testes executáveis.
8. Quando uma dependência impedir a execução no navegador, registrar a limitação e propor uma solução verificável.

## 11. Definição de pronto da V1

A V1 estará pronta quando:

- O núcleo traduzir português para glosas localmente.
- O modo direto e o modo streaming funcionarem com contratos documentados.
- O avatar puder consumir glosas independentemente do tradutor.
- Nenhum módulo principal exigir serviço remoto.
- Os testes de compatibilidade e de sessão passarem.
- Os benchmarks demonstrarem o desempenho real, inclusive eventuais regressões.
- As licenças dos recursos distribuídos estiverem documentadas.
- Houver exemplos executáveis e instruções de integração para cada ambiente efetivamente suportado.

**Primeira tarefa do agente:** instalar a skill `rea`, verificar suas instruções e aplicá-la aos repositórios relevantes do VLibras. Produzir `implementation-spec.md` e aguardar aprovação. Não iniciar a implementação antes dessa aprovação.
