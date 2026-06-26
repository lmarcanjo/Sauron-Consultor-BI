# SAURON DEVELOPMENT PROCESS
## O Processo Oficial de Engenharia e Ciclo de Vida de Software

Este documento define o processo rígido de ciclo de vida de desenvolvimento de software (SDLC) adotado na engenharia da plataforma **Sauron**. Nenhuma funcionalidade, refatoração ou correção de bug de alta severidade pode ser fundida no ramo principal ou implantada em produção sem passar estritamente pelas fases descritas neste documento.

---

## Fluxo Geral de Desenvolvimento

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────┐
│  Fase 1  │ ──> │    Fase 2    │ ──> │     Fase 3     │ ──> │  Fase 4  │
│ Planning │     │ Arch. Review │     │ Implementation │     │    QA    │
└──────────┘     └──────────────┘     └────────────────┘     └──────────┘
                                                                  │
                                                                  ▼
┌──────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────┐
│  Fase 7  │ <── │    Fase 6    │ <── │     Fase 5     │ <───┘          │
│ Post Rev.│     │   Release    │     │   Acceptance   │                │
└──────────┘     └──────────────┘     └────────────────┘                │
```

---

## Fase 1 — Planning (Planejamento)

Esta fase inicial converte requisitos de negócio ou necessidades dos consultores em itens técnicos priorizados, garantindo clareza conceitual antes do pontapé de desenvolvimento.

- **Entradas**:
  - Solicitação de melhoria de produto, roteiro estratégico (`SAURON_PRODUCT_ROADMAP.md`) ou feedback operacional dos consultores.
  - Protótipo conceitual ou documentação preliminar de negócio.
- **Saídas**:
  - Histórias de Usuário bem detalhadas na ferramenta de gestão de tarefas.
  - Requisitos não-funcionais (Performance, Segurança, Governança) documentados.
- **Critérios**:
  - Alinhamento de que o recurso melhora diretamente a operação do consultor de negócios ou aumenta a confiabilidade das demonstrações financeiras.
- **Checklist**:
  - [ ] A demanda resolve uma dor real da Persona do Consultor ou do Cliente Final?
  - [ ] A funcionalidade está coberta pelo escopo e cronograma da Release atual?
  - [ ] Os critérios de aceite funcionais e operacionais estão explícitos e sem ambiguidades?
- **Responsáveis**: Product Owner (PO), Product Manager e Lead Architect.

---

## Fase 2 — Architecture Review (Revisão Arquitetural)

Fase crucial de defesa do design de software. Protege o Sauron contra o acúmulo de débito técnico precoce e acoplamento desordenado.

- **Entradas**:
  - Histórias de Usuário prontas para desenvolvimento (atendendo ao Definition of Ready).
  - Padrões estabelecidos na Bíblia do Produto e no Manifesto de Engenharia.
- **Saídas**:
  - Design de software proposto registrado em ticket técnico.
  - Identificação clara de dependências com Core Engines existentes.
- **Critérios**:
  - A solução proposta deve respeitar a separação estrita de responsabilidades (React renderiza apenas, lógicas no Core).
- **Checklist**:
  - [ ] A funcionalidade proposta utiliza ou expande algum dos Core Engines existentes (`BusinessEngine`, `DataEngine`, `AnalyticsEngine`, `PluginEngine`) em vez de duplicar lógicas?
  - [ ] Foi validado que nenhuma regra de negócio ou cálculo matemático complexo residirá em arquivos `.tsx` do React?
  - [ ] O modelo e estrutura de dados a ser inserido foi projetado para evitar a duplicação de estados financeiros?
- **Responsáveis**: Lead Architect e Engenheiro Responsável pela Tarefa.

---

## Fase 3 — Implementation (Implementação)

Fase de codificação e escrita de código de classe enterprise, totalmente tipado e autodocumentado.

- **Entradas**:
  - Solução arquitetural aprovada e alinhada na Fase 2.
- **Saídas**:
  - Código-fonte em TypeScript desenvolvido e organizado de forma modular.
- **Critérios**:
  - Cumprimento rigoroso das regras de escrita de código do `QUALITY_STANDARD.md` e do Manifesto de Engenharia.
- **Checklist**:
  - [ ] Todo o código novo está 100% tipado, evitando o uso inadequado do tipo `any`?
  - [ ] Todo e qualquer ícone novo introduzido provém exclusivamente de `lucide-react`?
  - [ ] Foi estritamente evitado o uso de `Math.random()` na lógica de produção do Core? (Uso de alternativas determinísticas ou UUID).
  - [ ] Dados de simulação ou teste continuam estritamente isolados em `demoData.ts`?
- **Responsáveis**: Engenheiro de Software (Desenvolvedor).

---

## Fase 4 — QA (Quality Assurance)

Fase de verificação automatizada e de regressão, garantindo que o sistema não perca qualidade e estabilidade.

- **Entradas**:
  - Pull Request (PR) aberto com as alterações de código da Fase 3.
  - Suite de testes existentes (`*.test.ts`).
- **Saídas**:
  - Relatório automatizado de linter, typecheck, build e rodagem de testes unitários sem falhas.
- **Critérios**:
  - Sucesso absoluto em todas as etapas de compilação e validação do ambiente.
- **Checklist**:
  - [ ] O comando de linting (`npm run lint` ou similar) roda com sucesso e sem erros graves de TypeScript?
  - [ ] Todos os testes unitários da plataforma (`npx vitest run`) passam com 100% de sucesso?
  - [ ] Novos testes unitários cobrindo caminhos normais e de exceção foram criados e validados para os novos engines?
  - [ ] O build de produção (`npm run build`) compila com sucesso?
- **Responsáveis**: Engenheiro de QA e Desenvolvedor.

---

## Fase 5 — Acceptance (Homologação e Aceite)

Validação de produto e usabilidade conduzida no ambiente de demonstração e homologação.

- **Entradas**:
  - Artefatos que passaram com sucesso pelo QA na Fase 4.
- **Saídas**:
  - Aprovação funcional de produto para liberação.
- **Critérios**:
  - A experiência visual deve estar limpa de telemetrias artificiais e cumprir as regras do Guia de UX do Sauron.
- **Checklist**:
  - [ ] A experiência do usuário é livre de poluições visuais, logs artificiais e ruídos técnicos (larping)?
  - [ ] Os alvos e targets clicáveis cumprem o tamanho de clique mínimo de 44px?
  - [ ] A navegação é natural e de fácil entendimento para um consultor sênior em campo?
- **Responsáveis**: Product Owner (PO) e Clientes Piloto convidados (se aplicável).

---

## Fase 6 — Release (Implantação)

O lançamento e publicação segura dos novos recursos em ambiente de produção da nuvem.

- **Entradas**:
  - Escopo da Release devidamente homologado na Fase 5.
- **Saídas**:
  - Deploy efetuado em produção e disponível para os consultores finais.
- **Critérios**:
  - Implantação sem interrupção de serviço e com integridade de dados e auditorias operacionais.
- **Checklist**:
  - [ ] O arquivo `metadata.json` reflete corretamente as permissões e o nome estável do app?
  - [ ] As variáveis de ambiente necessárias foram documentadas no `.env.example`?
  - [ ] Os logs de auditoria de pós-lançamento estão ativos e sem registro de vazamento de credenciais?
- **Responsáveis**: Engenheiro de DevOps e Backend.

---

## Fase 7 — Post Release Review (Revisão Pós-Lançamento)

Avaliação de aprendizado contínuo focado na evolução do produto.

- **Entradas**:
  - Métricas de uso da Release e relatórios de incidentes.
- **Saídas**:
  - Backlog de débitos técnicos devidamente atualizado no `TECH_DEBT_REGISTRY.md`.
  - Melhorias sugeridas no processo anotadas.
- **Critérios**:
  - Encerramento formal do ciclo da Release.
- **Checklist**:
  - [ ] Algum erro ou gargalo de performance foi reportado nas primeiras 48 horas após o lançamento?
  - [ ] Novos débitos técnicos identificados durante o ciclo foram adicionados ao `TECH_DEBT_REGISTRY.md`?
  - [ ] A documentação na pasta `docs/` foi atualizada de acordo com as mudanças estruturais inseridas?
- **Responsáveis**: Toda a Equipe de Engenharia e Produto.

---

## Definition of Ready (DoR)

Uma funcionalidade está **Ready (Pronta para Codificação)** quando atende simultaneamente aos seguintes requisitos:

1. **Clareza de Requisito**: O objetivo de negócios e o valor para o consultor estão evidentes e escritos de forma simples em português.
2. **Critérios de Aceite**: Os cenários de aceitação estão definidos com cenários claros de sucesso e de tratamento de dados nulos/errados.
3. **Alinhamento Arquitetural**: O design de dados e engines correspondentes foi validado e aprovado pela arquitetura sênior do projeto.
4. **Isolamento de Dependências**: Bloqueios técnicos externos estão resolvidos, sem impedimentos para que o desenvolvedor possa codificar e testar de forma autônoma.

---

## Definition of Done (DoD)

Uma funcionalidade está **Done (Concluída Tecnologicamente)** apenas quando cumpre com sucesso o seguinte checklist:

1. **Typecheck sem Avisos**: O comando `npm run lint` ou similar é executado e o linter conclui sem apontar qualquer erro de TypeScript ou boas práticas de código.
2. **Testes Unitários Verificados**: Todos os testes unitários executam com sucesso (`npx vitest run`) sem regressões no sistema central.
3. **Build de Produção Verde**: O comando `npm run build` ou similar compila os arquivos do backend e do frontend com sucesso sem erros.
4. **Desacoplamento Rigoroso**: Foi validado que nenhuma regra de cálculo ou processo de negócio financeiro reside em componentes de visualização React.
5. **Governança de Demonstração**: Dados fictícios de simulação permanecem contidos estritamente em `demoData.ts`.
6. **Ausência de Comentários TODO**: Comentários provisórios e trechos pendentes de código de depuração foram limpos do codebase de produção.

---

## Definition of Release (DoRL)

Uma Release de Software está elegível para **Lançamento (Release)** quando cumpre os seguintes requisitos:

1. **Todas as Histórias DoD**: 100% dos cartões e tarefas que compõem o escopo da release cumpriram individualmente o Definition of Done.
2. **Avaliação dos Gates concluída**: A lista de verificação obrigatória de segurança, governança, arquitetura e UX do `SAURON_RELEASE_GATES.md` foi executada e aprovada sem ressalvas.
3. **Homologada pelo PO**: O Product Owner emitiu a validação de aceite funcional de negócios com base nas personas do produto.
4. **Documentação Coesa**: Toda alteração estrutural no código correspondente foi devidamente registrada na pasta `/docs`.
