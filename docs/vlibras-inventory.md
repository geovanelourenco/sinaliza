# Inventário VLibras

**Data:** 2026-11-05. **Estado:** investigação concluída no escopo documentado, com lacunas explícitas. A viabilidade integral da V1 permanece bloqueada pelos itens B1–B5 da [proposta](../implementation-spec.md).

## Origem e cobertura

O [portal do Governo Digital](https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/vlibras) identifica a suíte e a parceria com o LAVID/UFPB. A [organização VLibras — Software Público Brasileiro](https://github.com/spbgovbr-vlibras) publica os componentes inspecionados e aponta para o portal governamental. O wrapper de tradução aponta para o pacote e para os repositórios LAVID. Esses vínculos orientaram a seleção; não foi estabelecido quais commits estão implantados no serviço público.

| Componente | Versão/commit fixado | Resultado |
|---|---|---|
| `vlibras-translator-api` | `5a00fd2bccb77ffa442eec4dbd6c8b036178729a` | API HTTP, cache e transporte; dispensar do núcleo local. |
| `vlibras-translator-text-core` | `550b5eb215ec080dd9a50055f3f92de3b4bbdf8b` | Wrapper Python/RabbitMQ; motor importado de outro pacote. |
| `vlibras_translator` | 1.3.3; SHA-256 `a8bd00451a0ed931b4a6fa3fea37da7a56b39fa13f24afb2fd52ce21d3fba8ea` | Menor motor por regras executado em processo local. |
| `pt_core_news_md` | 3.7.0; SHA-256 `8114b18aad511452f3c4682fbbedd440f453f8bd3de20ce7bf8a1ca6543a0315` | Modelo spaCy necessário; licença distinta do código. |
| `translator-models` LAVID | `2c6cfa5965e4d049400c24b377ab2e18b8472790` | Ponteiro Git LFS e recursos neurais; pesos não adquiridos. |
| `vlibras-player-webjs` | 1.1.0; `5389767f8dcb915e6cd1a768095bfefa825c3d14` | Adaptador JS + build Unity WebGL; inicialização local validada. |
| `vlibras-dictionary-api` | `ab0d23f2df3f7d5cacd2482d911109bbe490ce83` | Resolução de sinais e cache; usar como referência do contrato. |
| `vlibras-dictionary-repository` | `bf1ed09187d347112ee84f1b9e312d267728fc76` | Metadados e armazenamento; não fornece os bundles no checkout. |
| `vlibras-mobile-cross-platform` | `caa9f0f4616389f62c7d4aa62f12cea2990f02f8` | Confirma ponte JS/Unity em outro consumidor. |
| `libraske-player` | `3cec52d6eee836c94d1dec5d88b514d2d73a07ad` | Fonte C# relacionada. Não corresponde comprovadamente ao build playerweb. |

Os relatórios abaixo contêm links por commit, caminhos internos dos artefatos, símbolos, formatos, tamanhos, dependências e licenças:

- [Tradutor, regras, modelos e dados](translator-inventory.md).
- [Avatar, ponte e dicionários de animações](avatar-inventory.md).
- [REA, execução, métricas e limites](investigation.md).

## Fluxo e menor conjunto

```text
texto
  → números / limpeza / transformações / abreviações
  → spaCy + postag / lematização / regras / dicionário
  → string de glosas com marcadores
  → [neural opcional, não executado nesta investigação]
  → glosas
  → ponte PlayerManager.playNow
  → busca de AssetBundle por base local + glosa
  → Unity WebGL / avatar
```

O menor conjunto **demonstrado para tradução por regras** é Python 3.12, pacote fixado, dependências, modelo spaCy e dados locais. Não exige API HTTP, RabbitMQ, Redis, MongoDB, PostgreSQL ou LLM. Isso não demonstra equivalência com o modo neural padrão do serviço.

O menor conjunto proposto para avatar é ponte JS, loader/build Unity e bundles locais compatíveis. O build e a ponte foram executados; falta validar um bundle de sinal conhecido. `Player.translate()` e a configuração remota do wrapper não devem entrar no módulo local independente.

## Decisões de reutilização

- **Reutilizar, condicionado às permissões:** núcleo Python e recursos efetivamente necessários, com versões e hashes fixados; manter regras intactas na extração inicial.
- **Adaptar:** formato de resultado, carregamento de recursos, fila local e ponte Unity. São propostas Sinaliza, não capacidades já implementadas.
- **Excluir do caminho principal:** serviços HTTP, bancos, filas externas, refinador LLM e download automático de pesos.
- **Não incorporar por enquanto:** modelos/rigs/texturas, bundles externos, pesos neurais e dados sem proveniência discriminada. Nenhum desses ativos foi adicionado ao repositório Sinaliza.

## Licenças e lacunas

Código de wrappers e player declara LGPLv3. O wheel declara LGPL-3.0. O modelo spaCy declara CC BY-SA 4.0 e atribuições próprias. Esses fatos não transferem automaticamente a mesma licença a todos os arquivos. As tabelas dos relatórios discriminam código, tabelas linguísticas, tagger, pesos, malhas, animações e runtime Unity.

O commit fonte exato do motor correspondente ao wheel não foi obtido nos endereços históricos consultados, que exigiram autenticação. O wheel contém fontes e foi identificado por hash. A fonte C# exata do `PlayerManager` do build WebGL não foi localizada no escopo inspecionado. Esses limites permanecem abertos; não são evidência de inexistência global dos recursos.
