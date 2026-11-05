# ADR 0001 — Preservar o núcleo Python e separar a portabilidade

**Estado:** proposto; depende da aprovação de `implementation-spec.md`.

## Evidência

O [inventário](../vlibras-inventory.md) e as [provas](../investigation.md) mostram que o motor por regras é Python, usa spaCy, NLTK, joblib e dados próprios. Executou em CPython 3.12 sem serviços de infraestrutura. Instanciar o motor tem custo relevante: as duas amostras de inicialização variaram de 3,926 s a 7,156 s. As chamadas aquecidas foram muito menores, mas não medem o serviço neural.

## Decisão proposta

Manter um único motor Python fixado e aquecido. Serializar suas chamadas. Expor TypeScript por binding local, sem duplicar regras. Manter avatar independente, por ponte Unity e recursos locais. Não adotar Go nem reescrever em JavaScript sem benchmark e teste de equivalência que justifiquem a mudança.

Validar Python/WebAssembly em Worker para tradução no navegador antes de anunciar esse suporte. Falha da prova bloqueia a etapa; um processo Python backend não conta como prova de tradução em página web autônoma.

## Consequências

Preserva regras e reduz o risco inicial de divergência. Exige runtime Python para backend/Node e uma solução verificável para as dependências nativas no navegador. Não garante ganho de latência fria. Exige pacote local de recursos e confirmação de direitos antes de distribuição. O modo por regras proposto precisa de aprovação explícita, pois o wrapper do serviço seleciona neural por padrão.
