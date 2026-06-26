# SAURON SX DESIGN FREEZE — IMPLEMENTATION ORDER (10/10)
## docs/releases/v0.7/design-freeze/10_RELEASE_IMPLEMENTATION_ORDER.md

Este documento especifica a ordem oficial de implementação da Release v0.7 — SAURON Executive Experience. A prioridade de desenvolvimento foi estabelecida estritamente sob a ótica de geração de valor e eficiência operacional para o consultor sênior em campo (Carlos), garantindo que os componentes fundamentais de impacto comercial sejam estabilizados e homologados em primeiro lugar.

---

### 1. Cronograma de Prioridade de Entrega (Value-Driven Schedule)

```
 Sprint 1                     Sprint 2                     Sprint 3
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 1. Story Builder &      │  │ 3. Modo Reunião (F5) &  │  │ 5. ETL Central &        │
│    Contratos de Slides  │  │    Gaveta de Controle   │  │    Data Lineage Badges  │
├─────────────────────────┤  ├─────────────────────────┤  ├─────────────────────────┤
│ 2. Notas de Apoio do    │  │ 4. Registro de Atas e   │  │ 6. Home Dashboard,      │
│    Consultor UI         │  │    Ações de Metas       │  │    Skeletons & Polimento│
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

### 2. Detalhamento das Etapas e Sprints de Desenvolvimento

#### Sprint 1 — O Coração da Narrativa (Story Builder & Contratos)
- **O que será implementado**: 
  1. Criação das estruturas de dados, schemas e contratos de tipos TypeScript para apresentações, slides e templates em `src/modules/consultant-workspace/types.ts`.
  2. Desenvolvimento da interface visual de linha de tempo de slides (Story Line) com suporte a reordenação de blocos no **Presentation Studio**.
  3. Painel lateral para inserção e edição de notas analíticas de apoio ao consultor.
- **Por que é o primeiro**: O Story Builder estabelece as fundações de como os slides e apresentações nascem. Sem esse contrato de dados ativo, não há como alimentar a projeção de reuniões.

#### Sprint 2 — O Ritual da Reunião (Modo Reunião Imersivo & Atas)
- **O que será implementado**:
  1. Mecanismo de tela cheia nativo e redimensionamento responsivo dinâmico do palco de slides (Stage Canvas).
  2. Desenvolvimento da gaveta lateral colapsável de controle do consultor (Cockpit Drawer).
  3. Integração síncrona com o formulário de cadastro de metas e planos de ação.
  4. Fluxo de conclusão de apresentações com gravação de atas históricas.
- **Por que é o segundo**: É o ritual culminante. Garante que Carlos consiga projetar os slides e colher as decisões de metas da diretoria sem sair do fluxo imersivo do software.

#### Sprint 3 — Governança, ETL e Polimento Final de UX
- **O que será implementado**:
  1. Unificação da tela de ingestão de dados (Central ETL), organizando os canais de planilhas e mapeamentos de bancos.
  2. Implementação dos badges e tooltips de linhagem de dados (Data Lineage) em todos os cards analíticos e slides.
  3. Redesenho da home do workspace contendo o widget de Health Score circular e linha do tempo de reuniões passadas.
  4. Ajuste fino de contrastes de cores, ampliação de touch targets para tablets e transições de fade suave.
  5. Rodagem de bateria de testes unitários em Vitest e typecheck sem erros.
- **Por que é o terceiro**: Trata-se do acabamento de segurança, governança e experiência de usuário premium. Consolida a robustez técnica do software e sela a homologação para liberação de produção.
