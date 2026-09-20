# ASTERION — ADR 001 ao 010 (Architecture Decision Records)

Este documento centraliza as Decisões de Arquitetura tomadas durante a Sprint 1.

---

## ADR-001: Filosofia do Domínio (Domain-Driven Design)
- **Problema**: Complexidade crescente de negócio ao migrar do antigo SAURON para o ASTERION.
- **Decisão**: Adotar estritamente Domain-Driven Design (DDD) com Agregados e Value Objects encapsulados.
- **Consequências**: Invariantes de negócio são validadas antes da persistência.

---

## ADR-002: Arquitetura Hexagonal (Ports & Adapters)
- **Problema**: Alto acoplamento entre leitura de planilhas/bancos de dados e o motor de BI.
- **Decisão**: Implementar Arquitetura Hexagonal. O Core conhece apenas Interfaces (Ports). Conectores e bancos são adaptadores.
- **Consequências**: Testabilidade isolada e substituição transparente de adaptadores.

---

## ADR-003: Agregado DataSource como Ativo de Negócio
- **Problema**: Tratar fontes de dados como meras strings de conexão.
- **Decisão**: Elevar `DataSource` ao status de Ativo de Negócio de Primeira Classe com histórico, auditoria e estado canônico.
- **Consequências**: Garantia de governança e rastreabilidade total.

---

## ADR-004: Abstração do Connector SDK
- **Problema**: Riscos de vazamento de bibliotecas de terceiros (`xlsx`, `pg`) para o código de domínio.
- **Decisão**: Criar o Connector SDK (`IAsterionConnector`) com capacidades declarativas.
- **Consequências**: Domínio imune a mudanças de fornecedores de conectores.

---

## ADR-005: Estado Canônico Derivado
- **Problema**: Inconsistências causadas por mutações arbitrárias de status (`ds.status = 'READY'`).
- **Decisão**: O Estado Canônico é estritamente derivado por evidências reais e histórico de schema/confirmação.
- **Consequências**: Impossibilidade de falsos positivos no status de prontidão da consultoria.

---

## ADR-006: Versionamento Imutável de Schemas
- **Problema**: Mudanças na estrutura das planilhas/tabelas invalidando diagnósticos passados.
- **Decisão**: Toda descoberta gera uma versão imutável de `SourceSchema`. Novas versões requerem nova confirmação do consultor.
- **Consequências**: Rastreabilidade e proteção contra mudanças quebram a DRE.

---

## ADR-007: Escopo Organizacional Obrigatório
- **Problema**: Fontes de dados órfãs sem dona no ecossistema da consultoria.
- **Decisão**: Todo `DataSource` deve ser vinculado a um nó da árvore organizacional (`GROUP`, `COMPANY`, `UNIT`).
- **Consequências**: Consolidação multi-empresa nativa e limpa.

---

## ADR-008: Estratégia de Auditoria Centralizada
- **Problema**: Eventos auditáveis espalhados e inconsistentes.
- **Decisão**: Centralizar emissão no `AuditEngine` via eventos factuais.
- **Consequências**: Trilha de auditoria homogênea para compliance executivo.

---

## ADR-009: Comunicação por Eventos Desacoplada
- **Problema**: Dependência direta de UI com serviços internos.
- **Decisão**: Utilizar `PlatformEvents` para notificar mudanças de estado no navegador.
- **Consequências**: UI reativa e sem acoplamento direto de chamadas síncronas cruzadas.

---

## ADR-010: Filosofia de Testes e Certificação
- **Problema**: Quebras não detectadas no pipeline.
- **Decisão**: Exigir testes de unidade de domínio e testes de integração com build 100% livre de erros antes de cada selo de versão.
- **Consequências**: Estabilidade comprovada a cada entrega.

---

## ADR-011: Abstração do Discovery SDK
- **Problema**: Riscos de acoplamento direto do domínio do ASTERION com algoritmos específicos de descoberta semântica, profiling e motores de IA.
- **Decisão**: Criar o Discovery SDK (`IAsterionDiscoveryEngine`) e padronizar a saída no contrato imutável `DiscoveryArtifact`.
- **Consequências**: Desacoplamento total do Domínio. Motores de IA e profiling produzem o mesmo contrato padronizado sem impactar agregados do Core.

---

## ADR-012: Data Quality Engine e QualityArtifact
- **Problema**: Necessidade de avaliar a qualidade e ruídos físicos dos dados sem introduzir regras semânticas de negócio ou algoritmos não determinísticos de IA.
- **Decisão**: Criar o `DataQualityEngine` alimentado por um `DiscoveryArtifact` e produtor do contrato imutável `QualityArtifact`.
- **Consequências**: Medição matemática pura de completude, consistência, densidade e unicidade sem qualquer inferência de negócio.

---

## ADR-013: Consolidação Factual do Evidence Engine
- **Problema**: Necessidade de unificar todas as evidências estruturais, físicas e de qualidade para rastreabilidade auditável sem realizar interpretação semântica.
- **Decisão**: Criar o `EvidenceEngine` consolidando `DiscoveryArtifact` e `QualityArtifact` em um `EvidenceArtifact` imutável com fingerprint de integridade.
- **Consequências**: Rastreabilidade auditável absoluta de todas as observações técnicas antes de qualquer camada de IA ou BI.

---

## ADR-014: Source-Driven Semantic Interpretation Engine & SemanticArtifact
- **Problema**: Necessidade de interpretar os dados sem forçar a fonte em esquemas rígidos predefinidos ou alterar o modelo físico.
- **Decisão**: A fonte é 100% soberana. O motor gera hipóteses semânticas em um `SemanticArtifact` sem alterar `physicalName` nem produzir estados `CONFIRMED`.
- **Consequências**: Preservação garantida da soberania da fonte e preparação transparente para a confirmação humana do consultor.

---

## ADR-015: Consultant Semantic Confirmation & SemanticConfirmationArtifact
- **Problema**: Como o consultor valida a interpretação da fonte sem alterar a estrutura física dos dados de origem.
- **Decisão**: Implementar `SemanticConfirmationArtifact`, `SemanticConfirmationService` e a transição do DataSource Aggregate para READY via `confirmSourceUnderstanding`. A fonte permanece intocada. As decisões permitidas são `CONFIRMED`, `REJECTED`, `KEEP_ORIGINAL`, `CUSTOM_INTERPRETATION` e `DEFERRED`.
- **Consequências**: Rastreabilidade auditável completa, versionamento imutável com calculador FNV-1a de confirmação e um único CTA de validação na interface de usuário.

---

## ADR-019: Financial Classification as Human-Governed DRE Readiness Layer & Integrity Hardening
- **Problema**: Como preparar os dados financeiros confirmados semanticamente para uma futura composição de DRE sem realizar classificações contábeis automáticas nem assumir inferências de negócio.
- **Decisão**: Implementar e endurecer a camada de **Classificação Financeira Declarada** (`FinancialClassificationArtifact`) governada estritamente por decisão humana do consultor, sem gerar DRE ou KPIs contábeis nesta Sprint.
  - **Zero Classificação Automática**: Nenhuma atribuição de entrada/saída é feita sem ação explícita.
  - **Governança por Trust e Semântica**: Exige `SemanticConfirmationArtifact` confirmado e `TrustArtifact` autorizado para `FINANCIAL_ANALYSIS`.
  - **Materialidade Multidimensional Versionada**: A avaliação `FinancialClassificationMaterialityAssessment` avalia valor relativo (≥5%), volume (≥5%), recorrência e sinais mistos. Categorias materiais não resolvidas bloqueiam confirmação.
  - **Identidade & Normalização**: O `physicalValue` original é 100% imutável. A normalização gera um `normalizedValue` e `categoryIdentity` de forma determinística sem consolidar colisões automaticamente.
  - **Coerência & Custom Rule Segura**: O `FinancialClassificationConsistencyValidator` impede combinações incoerentes (ex: `NON_FINANCIAL` fora do grupo `UNCLASSIFIED`). A `DeclarativeCustomRule` é puramente declarativa (`PRESERVE`, `ABSOLUTE`, `INVERT`, `MULTIPLY_BY_NEGATIVE_ONE`) sem uso de `eval()` ou dynamic code execution.
  - **SignPolicy Imutável**: Regras de sinal aplicam-se apenas a projeções futuras sem alterar o dado de origem.
- **Consequências**: Base fortemente tipada, auditável e imutável preparada para alimentações futuras da DRE com imutabilidade preservada e rastreabilidade total.

---

## ADR-020: DRE Composition as Deterministic Projection of Human-Confirmed Financial Classifications
- **Problema**: Como organizar os dados financeiros confirmados e classificados pelo consultor em uma estrutura de DRE composta, rastreável e auditável, sem gerar inferências arbitrárias, diagnósticos não sustentados ou métricas financeiras derivadas (Receita Líquida, Margem, EBITDA, Lucro) antes da definição de suas políticas específicas.
- **Decisão**: Implementar o **DRE Composition SDK** (`src/core/dre-composition/`) e o contrato imutável `DREArtifact`.
  - **Pureza e Determinismo**: O `DRECompositionEngine` é uma função pura sem I/O, DOM ou mutação de estado. Ele transforma estritamente `FinancialClassificationArtifact` (status `CONFIRMED`) em `DREArtifact`.
  - **Governança Inviolável**: Exige obrigatoriamente `TrustArtifact` (uso `FINANCIAL_ANALYSIS` autorizado) e `SemanticConfirmationArtifact` (`CONFIRMED`). Fontes `BLOCKED` ou `INVALIDATED` impedem a execução.
  - **Aplicação da SignPolicy**: Aplica exatamente as políticas de sinal confirmadas na classificação (`PRESERVE_SOURCE_SIGN`, `ABSOLUTE_VALUE_AS_INFLOW`, `ABSOLUTE_VALUE_AS_OUTFLOW`, `INVERT_SOURCE_SIGN`, `CUSTOM_RULE`) sem alterar os valores físicos de origem.
  - **Ausência de Cálculos Avançados nesta Sprint**: Não são calculados Receita Líquida, Lucro Bruto, Margem ou EBITDA. A coleção `subtotals` permanece vazia na V1 até a aprovação formal de suas fórmulas.
  - **Rastreabilidade e Proveniência Total**: Cada linha (`DRELine`) rastreia seu `lineCode`, `statementGroup`, `sourceCategoryIdentities`, `financialClassificationDecisionIds`, `signPoliciesApplied` e `provenance` até a decisão do consultor e arquivo físico original.
  - **Disclaimer Obrigatorio**: O `DREArtifact` carrega um aviso explícito de que representa uma projeção preparatória e não substitui a demonstração contábil oficial auditada.
- **Consequências**: Estrutura composta fortemente tipada, auditável, imutável e desacoplada, pronta para alimentar futuras camadas de diagnóstico financeiro e apresentação executiva.

---

## ADR-021: DRE Reconciliation & Structural Integrity Engine
- **Problema**: Como certificar matematicamente a cobertura de registros monetários elegíveis, ausência de dupla contagem, ausência de omissões materiais e coerência de fórmulas de subtotais da DRE composta sem alterar o `DREArtifact` original nem realizar pareceres contábeis oficiais ou inferências via IA.
- **Decisão**: Implementar o **DREReconciliationEngine** e o contrato imutável `DREReconciliationArtifact`.
  - **Pureza e Oracle Independente**: O `DREReconciliationEngine` é uma função pura sem I/O ou mutação de estado. Ele reexecuta as fórmulas via um Oracle Independente desacoplado do motor de composição.
  - **Equação Estrutural Factual**: Enforça que `eligibleSignedValue = usedSignedValue + excludedSignedValue + unresolvedSignedValue + unexplainedDifference`.
  - **Identificação de Anomalias**: Detecta duplicidades em `PhysicalContributionIdentity`, omissões materiais (`MISSING_CONTRIBUTION`) e incoerências de moeda/período.
  - **Disclaimer de Não Auditoria Contábil**: O artefato expressa que se trata de uma reconciliação técnica estrutural e não representa parecer auditado ou certificação das demonstrações financeiras.
- **Consequências**: Transparência absoluta e rastreabilidade total entre arquivos fonte físicos, decisões de classificação, linhas projetadas e a árvore de 13 subtotais da Política V3.

---

## ADR-022: DRE Execution Graph & Formula Dependency Engine
- **Problema**: A composição e reconciliação da DRE necessitam de um controle estrito da ordem de dependências topológicas, invalidação e recomposição incremental.
- **Decisão**: Criar o `DREExecutionGraphArtifact` e seu motor de ordenação/validação topológica (`DRETopologicalSorter` e `DREExecutionGraphValidator`).
  - **DAG e Ordem Determinística**: Criação de um Grafo Acíclico Dirigido que mapeia a dependência exata de entradas físicas para fórmulas, e fórmulas para subtotais dependentes.
  - **Filtros por Gates**: Introdução deGates de validação do Trust, Moeda, Período, Materialidade e Reconciliação antes da execução de fórmulas descendentes.
  - **Ausência de Cálculos Avançados ou LLMs**: Preservação estrita das políticas de não implementar EBITDA, Lucro Líquido contábil oficial ou diagnósticos automáticos por IA.
- **Consequências**: Governança determinística sobre a árvore de dependências das fórmulas da Política V3 com rastreabilidade absoluta e execução estritamente segura.

