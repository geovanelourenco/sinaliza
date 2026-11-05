# Verificação da entrega documental

**Data:** 2026-11-05. **Resultado:** PASS para revisão do PR documental. Não é verificação de conclusão da V1.

Um agente verificador independente leu o spec de produto, a proposta, os inventários, a decisão técnica, os probes e as evidências. Comparou os fatos com os checkouts e pacotes locais. Não implementou nem alterou a biblioteca.

## Verificação inicial

Verificações executadas pelo autor e conferidas pelo verificador:

- `git diff --cached --check`: passou após remover espaços finais dos metadados Markdown.
- `python -m py_compile experiments/probe-translator-offline.py`: passou. O cache gerado não integra o PR.
- `node --check experiments/avatar-probe.cjs`: passou.
- Resolução de links Markdown locais e de caminhos por commit com `git cat-file -e`: passou.
- Leitura dos quatro JSON de evidência: passou. Recálculo de p50/p95 e contagem de 180 amostras: passaram. As saídas repetidas do corpus são consistentes e `network_attempts` está vazio.
- Resultado do avatar: cinco verificações verdadeiras e sete URLs locais. O caso cobre inicialização e sinal ausente, não animação conhecida.
- Escopo staged: documentação, resultados e probes próprios isolados. Nenhum build, modelo, wheel, bundle de animação ou screenshot upstream está incluído.
- Proposta: no máximo sete etapas; B1–B5 explícitos; fatos separados de decisões; nenhuma declaração de equivalência neural, tradução em navegador ou licenças de ativos sem prova.

Os probes originais e suas variantes parametrizadas foram executados durante a investigação. O verificador não repetiu o benchmark ou o navegador, pois não houve mudança funcional. Validou seus resultados brutos e a sintaxe dos scripts. O lock parcial e o alcance limitado do audit hook estão documentados em `experiments/README.md`.

O parecer não remove os bloqueios técnicos ou de direitos de recursos. A construção permanece pendente de aprovação explícita de `implementation-spec.md` e dos critérios de entrada descritos nesse documento.

## Revisão complementar

A revisão dos repositórios adicionais acrescentou outro perfil de avatar. Um verificador independente conferiu os seis hashes/tamanhos do conjunto `web-browsers` contra o checkout fixado e os hashes dos 13 frames contra os arquivos locais. Quatro frames diferentes caem entre o estado de reprodução aos 10.379 ms e a conclusão aos 14.363 ms. A inspeção visual confirmou mudança de pose da mão e do braço; o frame ocioso inicial não foi usado. Esses timestamps não constituem benchmark.

O JSON registra oito verificações verdadeiras, sete requisições HTTP locais com resposta 200, log de carregamento de `OBRIGADO`, `CounterGloss(1, 1)` e nenhum fallback de soletração. O novo probe passou em `node --check`. Os frames e os ativos upstream não integram o PR. O verificador não repetiu o teste funcional; comparou resultados e artefatos locais da execução final.

O novo exame do Libraskê Processor confirma fluxo de imagens e landmarks para pontuação; não altera o núcleo nem as APIs. B4 e a parte restante de B5 continuam explícitos. O parecer complementar não aprova a especificação em nome do usuário nem certifica qualidade linguística.
