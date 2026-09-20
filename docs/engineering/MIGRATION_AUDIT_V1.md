# ASTERION — Relatório de Auditoria e Plano de Migração (`MIGRATION_AUDIT_V1.md`)

---

# 1. Visão Geral da Auditoria

Este relatório analisa tecnicamente a base herdada do sistema SAURON para orientar a transição segura para o **ASTERION Versão 1.0**. 

O objetivo primário desta engenharia de migração é **reaproveitar o máximo possível do código já testado e estável**, eliminando redundâncias, desacoplando componentes paralelos e adaptando os repositórios à Constituição do Produto e à Jornada do Consultor.

---

# 2. Auditoria Detalhada por Módulo (`src/core` & `src/components`)

---

### Módulo: `EnterpriseRepository` (`src/core/persistence/EnterpriseRepository.ts`)
- **Objetivo**: Persistência de empresas, grupos econômicos e unidades no IndexedDB.
- **Responsabilidade**: CRUD de organizações e armazenamento de vínculos de fontes (`SourceEnterpriseBinding`).
- **Dependências**: `PersistenceManager`.
- **Quem utiliza**: `EnterpriseCenter.tsx`, `ConsultantDiscoveryPanel.tsx`, `ChaosProfilingPanel.tsx`.
- **Estado atual**: Estável, funcional e testado.
- **Classificação**: ✅ **KEEP**
- **Justificativa**: Contém a estrutura exata exigida pelo Épico 1 (`BusinessGroup`, `Company`, `Unit`, `SourceEnterpriseBinding`).
- **Riscos / Impacto**: Mínimo. Apenas garantir que o estado inicial das novas empresas persistidas seja imutavelmente `NO_SOURCE`.

---

### Módulo: `ActiveDatasetStore` (`src/core/data/ActiveDatasetStore.ts`)
- **Objetivo**: Gerenciamento do estado global do dataset ativo em memória e IndexedDB.
- **Responsabilidade**: Armazenar registros lidos da planilha/SQL atualmente ativa.
- **Dependências**: `persistenceManager`.
- **Quem utiliza**: `App.tsx`, `CentralDadosTab.tsx`, `ExecutivePresentationEngine.ts`.
- **Estado atual**: Funcional e com suporte a escopo.
- **Classificação**: ✅ **KEEP**
- **Justificativa**: Essencial para a camada de recepção de dados (Épico 2) e para alimentar o cálculo do diagnóstico (Épico 5).
- **Riscos / Impacto**: Nenhum.

---

### Módulo: `ChaosProfilingRepository` (`src/core/chaos-data-profiling/ChaosProfilingRepository.ts`)
- **Objetivo**: Armazenamento e gerenciamento de Perfis do Caos e Visões de Dados (`DatasetView`).
- **Responsabilidade**: Salvar análises estatísticas da fonte sem alterar a origem.
- **Dependências**: `PersistenceManager`.
- **Quem utiliza**: `ChaosProfilingPanel.tsx`, `ConsultantDiscoveryPanel.tsx`.
- **Estado atual**: Estável.
- **Classificação**: ✅ **KEEP**
- **Justificativa**: Implementa o Perfil do Caos exigido no Épico 3.
- **Riscos / Impacto**: Baixo.

---

### Módulo: `IdentityEngine` / `IdentityRepository` (`src/core/identity/`)
- **Objetivo**: Gestão de usuários, autenticação e papéis.
- **Responsabilidade**: Retornar o usuário logado e controlar permissões.
- **Dependências**: Storage local.
- **Quem utiliza**: `App.tsx`, `AppSidebar.tsx`.
- **Estado atual**: Funcional para uso local.
- **Classificação**: 🟡 **ADAPT**
- **Justificativa**: Atende à identificação do consultor logado, mas precisa ser levemente ajustado para suportar o perfil do Consultor/ICP do ASTERION.
- **Riscos / Impacto**: Baixo.

---

### Módulo: `EnterpriseConsolidationService` (`src/core/enterprise-consolidation/`)
- **Objetivo**: Consolidação e filtragem de lançamentos por escopo de Empresa/Grupo.
- **Responsabilidade**: Filtrar registros por ID organizacional tratando tipos escalares com segurança.
- **Dependências**: `normalizeExternalScalar`.
- **Quem utiliza**: `ExecutivePresentationEngine.ts`, `EnterpriseCenter.tsx`.
- **Estado atual**: Estável com proteções numéricas recentemente aplicadas.
- **Classificação**: ✅ **KEEP**
- **Justificativa**: Garante que o diagnóstico seja filtrado corretamente pela empresa selecionada no Workspace.
- **Riscos / Impacto**: Baixo.

---

### Módulo: `ExecutivePresentationEngine` (`src/core/business-intelligence/ExecutivePresentationEngine.ts`)
- **Objetivo**: Gerador automático de decks de slides executivos.
- **Responsabilidade**: Compilar métricas e gerar apresentações com rastreabilidade.
- **Dependências**: `ActiveDatasetStore`, `FinancialConsistencyOrchestrator`.
- **Quem utiliza**: `PresentationBuilderPage.tsx`, `MeetingPrepTab.tsx`.
- **Estado atual**: Funcional e testado.
- **Classificação**: 🟡 **ADAPT**
- **Justificativa**: Excelente lógica narrativa (Épico 6), precisando apenas ser vinculado diretamente à ata de reuniões do ASTERION.
- **Riscos / Impacto**: Médio.

---

### Módulo: `ConsultantDiscoveryPanel` (`src/components/ConsultantDiscoveryPanel.tsx`)
- **Objetivo**: Painel de síntese e validação da compreensão da fonte.
- **Responsabilidade**: Exibir narrativa explicável e a CTA única de aprovação (`Validar entendimento da empresa`).
- **Dependências**: `ChaosProfilingRepository`, `EnterpriseRepository`.
- **Quem utiliza**: `CentralDadosTab.tsx`, `App.tsx`.
- **Estado atual**: Estável, unificado no RC-0.
- **Classificação**: 🟡 **ADAPT**
- **Justificativa**: É a implementação exata da validação do Épico 4. Deve ser adaptado para se encaixar como área do Workspace de Engajamento.
- **Riscos / Impacto**: Baixo.

---

### Módulo: `ChaosProfilingPanel` (`src/components/ChaosProfilingPanel.tsx`)
- **Objetivo**: Painel de detalhes estatísticos e sanitização de fontes.
- **Responsabilidade**: Exibir contagem de linhas, colunas e ruídos do Perfil do Caos.
- **Dependências**: `useMemo`, `ChaosProfilingRepository`.
- **Quem utiliza**: `CentralDadosTab.tsx`.
- **Estado atual**: Estável e otimizado no RC-1.
- **Classificação**: 🟠 **REFACTOR**
- **Justificativa**: Contém ótima lógica de apresentação de ruídos, mas possui botões legados redundantes ("Usar estrutura sugerida") que devem ser removidos para manter apenas a visão purificada do ASTERION.
- **Riscos / Impacto**: Médio.

---

### Módulo: `ZcxProposalPanel` / `ZcxProposalEngine` (`src/components/ZcxProposalPanel.tsx`, `src/core/chaos-data-profiling/ZcxProposalEngine.ts`)
- **Objetivo**: Painel e engine legada de propostas ZCX.
- **Responsabilidade**: Criar propostas paralelas de estrutura.
- **Dependências**: Várias.
- **Quem utiliza**: Resíduos em `ChaosProfilingPanel.tsx`.
- **Estado atual**: Descontinuado / Redundante.
- **Classificação**: ⚫ **REMOVE**
- **Justificativa**: Viola o princípio de portão de entrada único do ASTERION, criando fluxos concorrentes de aprovação.
- **Riscos / Impacto**: Baixo (remoção limpa sem afetar o fluxo canônico).

---

### Módulo: `ReviewSourceAnalysisAction` / `HealthScoreWidget` / `ConsultingPipelineWidget`
- **Objetivo**: Widgets visuais isolados.
- **Responsabilidade**: Exibir notas ou cartões de funil genéricos.
- **Dependências**: Nenhuma.
- **Quem utiliza**: Código residual sem acoplamento.
- **Estado atual**: Inativo.
- **Classificação**: ⚫ **REMOVE**
- **Justificativa**: Componentes mortos que não fazem parte das 11 Áreas Principais do Workspace do Engajamento.
- **Riscos / Impacto**: Nulo.

---

### Módulo: Abas de "Digital Twin" e Chat Generativo (`organizacao_twin`, `usuarios_twin`, `consultor_ia`, `diagnostico_obstaculos`)
- **Objetivo**: Telas administrativas e chat bot generativo.
- **Responsabilidade**: Configurações avançadas de infraestrutura e chat sem contexto.
- **Dependências**: Rotas legadas em `App.tsx`.
- **Estado atual**: Fora da jornada do consultor.
- **Classificação**: ⚫ **REMOVE**
- **Justificativa**: Não pertencem ao domínio de negócio do ASTERION nem ao ICP de consultores de gestão.
- **Riscos / Impacto**: Baixo (desativar rotas no `App.tsx` e remover arquivos).

---

# 3. Matriz Geral de Classificação e Planejamento

| Módulo | Categoria | Prioridade | Complexidade | Dependências | Sprint Recomendada |
| --- | --- | --- | --- | --- | --- |
| `EnterpriseRepository` | ✅ **KEEP** | P0 (Crítica) | Baixa | `PersistenceManager` | **Sprint 1** |
| `IdentityEngine` | 🟡 **ADAPT** | P0 (Crítica) | Baixa | Storage local | **Sprint 1** |
| `EnterpriseCenter` | 🟠 **REFACTOR** | P0 (Crítica) | Média | `EnterpriseRepository` | **Sprint 1** |
| `DatabaseConnector` | 🟡 **ADAPT** | P0 (Crítica) | Média | Driver SQL | **Sprint 2** |
| `ActiveDatasetStore` | ✅ **KEEP** | P0 (Crítica) | Baixa | `PersistenceManager` | **Sprint 2** |
| `ChaosProfilingRepository` | ✅ **KEEP** | P0 (Crítica) | Média | `PersistenceManager` | **Sprint 3** |
| `ConsultantDiscoveryPanel` | 🟡 **ADAPT** | P0 (Crítica) | Baixa | `ChaosProfilingRepo` | **Sprint 4** |
| `ChaosProfilingPanel` | 🟠 **REFACTOR** | P1 (Alta) | Média | `ChaosProfilingRepo` | **Sprint 4** |
| `ExecutivePresentationEngine`| 🟡 **ADAPT** | P0 (Crítica) | Média | `ActiveDatasetStore` | **Sprint 6** |
| `ZcxProposalEngine` / Panel | ⚫ **REMOVE** | P2 (Baixa) | Baixa | Nenhuma | **Sprint 1 (Limpeza)** |
| Abas Digital Twin / IA Chat | ⚫ **REMOVE** | P2 (Baixa) | Baixa | Nenhuma | **Sprint 1 (Limpeza)** |

---

# 4. Síntese Técnica da Migração

1. **Código Morto Encontrado**:
   - `ZcxProposalPanel.tsx`, `ZcxProposalEngine.ts`
   - `ReviewSourceAnalysisAction.tsx`, `HealthScoreWidget.tsx`, `ConsultingPipelineWidget.tsx`
   - `DiagnosticoObstaculosTab.tsx`, `ConsultorIaTab.tsx`, `SauronArchitectPanel.tsx`, `ProductQAConsole.tsx`
2. **Responsabilidades Duplicadas**:
   - Mapeadores de colunas e botões de aprovação redundantes entre `ChaosProfilingPanel` e `ConsultantDiscoveryPanel` (já resolvidos e prontos para purificação final).
3. **Acoplamentos Excessivos**:
   - `App.tsx` acumulando roteamento, estado global de filtros e validações legadas de compatibilidade (deve ser simplificado na Sprint 1 para servir apenas de Shell do Workspace).
4. **Dependências Circulares**:
   - Nenhuma dependência circular crítica encontrada nos módulos base de persistência e cálculo.
5. **Engines Candidatas à Divisão**:
   - `CentralDadosTab.tsx`: Tela extensa que acumula upload, biblioteca de arquivos e conexão SQL (dividir nos componentes específicos da Sprint 2).
6. **Módulos Candidatos à Unificação**:
   - Unificar a navegação do consultor sob o **Workspace de Engajamento** (`ENGAGEMENT_WORKSPACE.md`).
7. **Componentes Altamente Reutilizáveis**:
   - `EnterpriseRepository.ts` (100% pronto para a Sprint 1).
   - `ActiveDatasetStore.ts` (100% pronto para a Sprint 2).
   - `ExecutivePresentationEngine.ts` (100% pronto para a Sprint 6).

---

# 5. Riscos Críticos e Plano Recomendado para a Sprint 1

### Riscos Críticos na Sprint 1
- **Preservação dos Registros Existentes**: Garantir que a adaptação do `EnterpriseRepository` não apague empresas cadastradas em sessões de teste anteriores.
- **Roteamento em `App.tsx`**: Ao remover as rotas legadas (`consultor_ia`, `organizacao_twin`), garantir que o redirecionamento padrão abra sempre a Carteira (`F1.1`).

### Plano de Migração para a Sprint 1
1. **Passo 1**: Remover das rotas de `App.tsx` e `AppSidebar.tsx` as abas obsoletas classificadas como ⚫ **REMOVE**.
2. **Passo 2**: Reutilizar diretamente o `EnterpriseRepository.ts` para prover os dados de Grupos, Empresas e Filiais da Sprint 1.
3. **Passo 3**: Ajustar a tela principal de gestão de empresas (`EnterpriseCenter.tsx`) para refletir exatamente os critérios da Sprint 1 (carteira, cadastro de cliente/engajamento e arborescência com estado inicial `NO_SOURCE`).
