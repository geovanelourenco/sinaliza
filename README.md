# Sinaliza

Biblioteca proposta para tradução local de português para glosas de Libras e reprodução por avatar.

**Estado atual: investigação e especificação de implementação em revisão.** Não existe biblioteca publicada nem API Sinaliza implementada neste repositório.

- [Requisitos de produto](SINALIZA_SPEC.md).
- [Especificação de implementação proposta](implementation-spec.md).
- [Inventário do VLibras](docs/vlibras-inventory.md).
- [Resultados e limites da investigação](docs/investigation.md).
- [Experimentos isolados e reprodução](experiments/README.md).

O motor upstream por regras executou traduções localmente com tentativas de conexão bloqueadas. Os builds upstream do avatar renderizaram localmente; a revisão complementar validou a reprodução técnica do bundle `OBRIGADO` com seu build correspondente. Licenças individuais, sequência/parada do avatar, validação linguística e tradução em navegador permanecem pendentes. Os números medidos pertencem ao VLibras investigado, não ao Sinaliza.

A implementação começará somente após aprovação explícita de `implementation-spec.md`. O escopo não inclui ASR próprio, tradução inversa, treinamento de modelos ou serviço remoto obrigatório.
