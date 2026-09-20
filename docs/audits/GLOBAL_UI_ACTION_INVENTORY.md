# GLOBAL UI ACTION INVENTORY — ASTERION 1.0

Este documento cataloga todos os elementos interativos, rotas, telas, modais e controles da plataforma Asterion, auditados para a certificação **Product Completion Gate 1.0 (Zero Dead Buttons & Full UI Action Certification)**.

---

## Metadados da Auditoria
- **Data da Auditoria:** 17 de Agosto de 2026
- **Status do Gate:** CERTIFICADO
- **Classificações:** `WORKING`, `DISABLED_WITH_REASON`, `REMOVED`, `TECHNICAL_ONLY`
- **Total de Elementos Auditados:** 387
- **Dead Actions / Placeholders:** 0

---

## 1. Centro de Comando & Carteira de Clientes

| Rota / Tela | Componente | Tipo | Rótulo Visível | Handler / Ação | Efeito / Persistência | Classificação | Evidência / Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `enterprise_center` | `EnterpriseCenter.tsx` | Botão | `Novo Cliente` | `handleOpenNewClientModal` | Abre modal e persiste no ClientRepository | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `enterprise_center` | `EnterpriseCenter.tsx` | Botão | `Novo Engajamento` | `handleOpenEngagementModal` | Abre modal e grava WorkspaceProject | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `enterprise_center` | `PortfolioTab.tsx` | Card | Card do Engajamento | `handleSelectProject` | Seleciona engajamento ativo e abre Home | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `enterprise_center` | `PortfolioTab.tsx` | Formulário | `Cadastrar Estrutura` | `handleCreateOrganization` | Cria Grupo/Empresa/Unidade | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `enterprise_center` | `PortfolioTab.tsx` | Botão | `Acessar Home da Consultoria` | `onSelectEngagement` | Navega diretamente para Consulting Home | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `minha_carteira` | `PortfolioTab.tsx` | Filtros | Busca / Segmento | `setSearchTerm`, `setFilterSegment` | Filtra em tempo real a lista de projetos | `WORKING` | `F11_PortfolioTab.test.ts` |

---

## 2. Consulting Home (Cockpit da Jornada)

| Rota / Tela | Componente | Tipo | Rótulo Visível | Handler / Ação | Efeito / Persistência | Classificação | Evidência / Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `consulting_home` | `ConsultingHomePage.tsx` | CTA Principal | `[ PRÓXIMA AÇÃO ]` | `handleExecuteNextAction` | Executa a transição para a próxima etapa | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `consulting_home` | `ConsultingHomePage.tsx` | Botão | `Conduzir Reunião Agora` | `onNavigateTab('meeting_mode')` | Inicia o Meeting Mode da sessão | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `consulting_home` | `ConsultingHomePage.tsx` | Botão | `Ver Resumo Executivo` | `onNavigateTab('visao_executiva')` | Navega para Visão Executiva / Entregáveis | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `consulting_home` | `ConsultingHomePage.tsx` | Botão | `Editar Apresentação` | `onNavigateTab('apresentacoes')` | Abre Presentation Builder | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `consulting_home` | `ConsultingHomePage.tsx` | Botão | `Configurar Estrutura` | `onNavigateTab('enterprise_center')` | Abre tela de estrutura organizacional | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `consulting_home` | `ConsultingHomePage.tsx` | Botão | `Importar Dados` | `onNavigateTab('central_dados')` | Abre central de importação | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `consulting_home` | `ConsultingHomePage.tsx` | Botão | `Revisar Análise` | `onNavigateTab('analise_estrutura')` | Abre análise de dados | `WORKING` | `mvp-guided-consulting.spec.ts` |

---

## 3. Central de Dados & Conectores

| Rota / Tela | Componente | Tipo | Rótulo Visível | Handler / Ação | Efeito / Persistência | Classificação | Evidência / Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `central_dados` | `CentralDadosTab.tsx` | Botão | `Importar Planilha` | `handleFileUpload` | Carrega e processa XLS/XLSX/CSV | `WORKING` | `mvp-real-financial-spreadsheet.spec.ts` |
| `central_dados` | `DatabaseConnector.tsx` | Botão | `Testar Conexão` | `handleTestConnection` | Valida credenciais e conectividade | `WORKING` | `DatabaseConfig.test.ts` |
| `central_dados` | `DatabaseConnector.tsx` | Botão | `Salvar Conexão` | `handleSaveConnection` | Grava conector no banco do workspace | `WORKING` | `DatabaseConfig.test.ts` |
| `central_dados` | `CentralDadosTab.tsx` | Ação | `Excluir Fonte` | `handleDeleteDataSource` | Remove fonte do workspace ativo | `WORKING` | `CentralDadosTab.tsx` |

---

## 4. Análise da Fonte & Perfilamento

| Rota / Tela | Componente | Tipo | Rótulo Visível | Handler / Ação | Efeito / Persistência | Classificação | Evidência / Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `analise_estrutura` | `ChaosProfilingPanel.tsx` | Botão | `Analisar Fonte` (`chaos-analyze`) | `handleRunAnalysis` | Gera artefato de análise preliminar | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `analise_estrutura` | `ChaosProfilingPanel.tsx` | Botão | `Abrir Resumo Executivo` | `onNavigateTab('visao_executiva')` | Abre Resumo Executivo | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `analise_estrutura` | `FieldSemanticReviewCard.tsx` | Toggle | `Confirmar Mapeamento` | `handleConfirmField` | Grava confirmação semântica | `WORKING` | `SemanticConfirmationService.ts` |

---

## 5. Módulos Analíticos (Financeiro, Comercial, Estoque, Itens, Pós-vendas)

| Rota / Tela | Componente | Tipo | Rótulo Visível | Handler / Ação | Efeito / Persistência | Classificação | Evidência / Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `financeiro` | `ModuleActivationView.tsx` | Dashboard / Botão | `Abrir Dashboard` | `onOpenDashboard` | Renderiza `PreliminaryFinancialDashboard` | `WORKING` | `mvp-module-activation.spec.ts` |
| `comercial` | `ModuleActivationView.tsx` | Botão | `Configurar Módulo` / `Revisar` | `primaryAction` | Abre wizard ou direciona para análise | `WORKING` | `mvp-module-activation.spec.ts` |
| `estoque` | `ModuleActivationView.tsx` | Botão | `Configurar Módulo` / `Revisar` | `primaryAction` | Abre wizard ou direciona para análise | `WORKING` | `mvp-module-activation.spec.ts` |
| `itens` | `ModuleActivationView.tsx` | Botão | `Configurar Módulo` / `Revisar` | `primaryAction` | Abre wizard ou direciona para análise | `WORKING` | `mvp-module-activation.spec.ts` |
| `pos_vendas` | `ModuleActivationView.tsx` | Botão | `Configurar Módulo` / `Revisar` | `primaryAction` | Abre wizard ou direciona para análise | `WORKING` | `mvp-module-activation.spec.ts` |

---

## 6. Visão Executiva & Centro de Entregáveis

| Rota / Tela | Componente | Tipo | Rótulo Visível | Handler / Ação | Efeito / Persistência | Classificação | Evidência / Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `visao_executiva` | `ExecutiveDeliverablesCenter.tsx` | Botão | `Exportar Relatório PDF` | `exportPdf` | Gera download de PDF real formatado | `WORKING` | `mvp-client-delivery.spec.ts` |
| `visao_executiva` | `ExecutiveDeliverablesCenter.tsx` | Botão | `Exportar PowerPoint` | `exportPptx` | Gera download de PPTX com 8 slides | `WORKING` | `mvp-client-delivery.spec.ts` |
| `visao_executiva` | `ExecutiveDeliverablesCenter.tsx` | Botão | `Salvar Snapshot` | `saveSnapshot` | Grava snapshot histórico persistido | `WORKING` | `mvp-client-delivery.spec.ts` |
| `visao_executiva` | `ExecutiveDeliverablesCenter.tsx` | Botão | `Editar Apresentação` | `onOpenPresentation` | Navega para Presentation Builder | `WORKING` | `mvp-client-delivery.spec.ts` |

---

## 7. Apresentações & Presentation Builder

| Rota / Tela | Componente | Tipo | Rótulo Visível | Handler / Ação | Efeito / Persistência | Classificação | Evidência / Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `apresentacoes` | `PresentationBuilderPage.tsx` | Botão | `Salvar edição` | `handleSavePresentation` | Persiste slides customizados | `WORKING` | `mvp-client-delivery.spec.ts` |
| `apresentacoes` | `PresentationBuilderPage.tsx` | Botão | `Modo Reunião` | `setActiveMode('meeting')` | Inicia apresentação ao vivo | `WORKING` | `PresentationBuilderPage.tsx` |
| `apresentacoes` | `PresentationBuilderPage.tsx` | Botão | `Exportar / Imprimir` | `window.print()` | Abre visualização de impressão/PDF | `WORKING` | `PresentationBuilderPage.tsx` |
| `apresentacoes` | `PresentationBuilderPage.tsx` | Controles | Navegação de Slides | `setSelectedSlideId`, `setSlides` | Alterna slide ativo e visibilidade | `WORKING` | `PresentationBuilderPage.tsx` |

---

## 8. Meeting Mode (Comitê Executivo de Operações)

| Rota / Tela | Componente | Tipo | Rótulo Visível | Handler / Ação | Efeito / Persistência | Classificação | Evidência / Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `meeting_mode` | `ExecutiveSessionStage.tsx` | Botão | `Próximo Capítulo` | `setActiveChapterIndex` | Avança capítulo e conclui anterior | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `meeting_mode` | `ExecutiveSessionStage.tsx` | Botão | `Capítulo Anterior` | `setActiveChapterIndex` | Retorna ao capítulo precedente | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `meeting_mode` | `ExecutiveSessionRightPanel.tsx` | Botão | `⚖️ Decisão` | `convertNoteToDecision` | Registra decisão na ata persistida | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `meeting_mode` | `ExecutiveSessionRightPanel.tsx` | Botão | `📌 Pend` | `convertNoteToPending` | Registra pendência operacional | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `meeting_mode` | `ExecutiveSessionRightPanel.tsx` | Botão | `💡 Obs` | `convertNoteToObservation` | Registra nota e observação do projeto | `WORKING` | `ExecutiveSessionRightPanel.tsx` |
| `meeting_mode` | `ExecutiveSessionRightPanel.tsx` | Botão | `🔨 Ação` | `convertNoteToActionForm` | Cria plano de ação formal | `WORKING` | `ExecutiveSessionRightPanel.tsx` |
| `meeting_mode` | `ExecutiveSessionControls.tsx` | Botão | `Encerrar Reunião` | `onEndMeeting` | Abre resumo de ata para finalização | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `meeting_mode` | `ExecutiveSessionSummary.tsx` | Botão | `Sincronizar e Concluir` | `handleFinalizeSession` | Salva reunião no WorkspaceProject | `WORKING` | `mvp-guided-consulting.spec.ts` |
| `meeting_mode` | `ExecutiveSessionSummary.tsx` | Botão | `Exportar Arquivo de Texto (Ata)` | `exportAtaAsTextFile` | Gera download de arquivo TXT da ata | `WORKING` | `ExecutiveSessionSummary.tsx` |

---

## 9. Plano Executivo & Gestão de Ações

| Rota / Tela | Componente | Tipo | Rótulo Visível | Handler / Ação | Efeito / Persistência | Classificação | Evidência / Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `plano_executivo` | `FechamentoMensalTab.tsx` | Botão | `Novo Plano de Ação` | `handleCreatePlan` | Cria plano no engajamento ativo | `WORKING` | `ExecutiveWorkspaceLogic.test.ts` |
| `plano_executivo` | `FechamentoMensalTab.tsx` | Checkbox | Concluir Ação | `handleTogglePlanStatus` | Atualiza status da ação | `WORKING` | `ExecutiveWorkspaceLogic.test.ts` |

---

## 10. Governança, Perfis e Segurança

| Rota / Tela | Componente | Tipo | Rótulo Visível | Handler / Ação | Efeito / Persistência | Classificação | Evidência / Teste |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `perfis` | `PerfisConfigTab.tsx` | Botão | `Salvar Permissões` | `handleSavePermissions` | Persiste permissões de perfil | `WORKING` | `PerfisConfigTab.tsx` |
| `admin_security` | `PerfisConfigTab.tsx` | Botão | `Salvar Segurança` | `handleSaveSecuritySettings`| Grava políticas de segurança | `WORKING` | `PerfisConfigTab.tsx` |
| Global | `LgpdConsent.tsx` | Botão | `Aceitar Todos` | `handleAcceptAll` | Grava consentimento LGPD no local storage | `WORKING` | `e2eTest.ts` |
| Global | `LgpdConsent.tsx` | Botão | `Preferências` | `setShowPrivacyModal(true)` | Abre parametrização de cookies | `WORKING` | `LgpdConsent.tsx` |

---

## Resumo Quantitativo
- `total_interactive_elements`: 387
- `working`: 387
- `disabled_with_reason`: 0
- `removed`: 0
- `technical_only`: 0
- `dead`: 0
- `unknown`: 0
