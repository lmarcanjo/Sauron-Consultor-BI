/**
 * RC-3 baseline for vocabulary that still exists in pre-Domain-Pack code.
 * New production files cannot use these terms without an explicit migration.
 *
 * TRACKED DEBT — RC-3.1.1 baseline (2026-08-01)
 * ──────────────────────────────────────────────
 * Files listed here contain known domain vocabulary OUTSIDE of designated
 * Domain Pack directories. Each entry represents technical debt that must be
 * remediated by migrating the term into the appropriate Domain Pack.
 *
 * Rules:
 *   1. Only files that already existed in the RC-3 snapshot may be added.
 *   2. New files written after RC-3.1 may NOT be added; they must use Domain Packs.
 *   3. Removing a file from this list is encouraged when the debt is paid.
 *   4. Adding a file requires a comment explaining what terms are present and why.
 */
export const DOMAIN_VOCABULARY_LEGACY_PATHS = new Set([
  "src/types/dataSource.ts",
  "src/types/meetingPrep.ts",
  "src/utils/industryTemplates.ts",
  "src/utils/profileManager.ts",
  "src/types.ts",
  "src/App.tsx",
  "src/components/FechamentoMensalTab.tsx",
  "src/components/CommissionClosingPanel.tsx",
  "src/components/LoginScreen.tsx",
  "src/components/PerfisConfigTab.tsx",
  "src/components/ExecutiveSessionStage.tsx",
  "src/components/MeetingPrepTab.tsx",
  "src/components/MeetingModePage.tsx",
  "src/components/PresentationBuilderPage.tsx",
  "src/components/ExecutiveSessionHeader.tsx",
  "src/components/ComissoesTab.tsx",
  "src/components/DatabaseConnector.tsx",
  "src/components/EnterpriseCenter.tsx",
  "src/components/ExecutiveSessionSummary.tsx",
  "src/components/CentralDadosTab.tsx",
  "src/components/AppSidebar.tsx",
  "src/components/PosVendasTab.tsx",
  "src/components/pages/ReportsPage.tsx",
  "src/components/ConsultorAreaTab.tsx",
  "src/components/ContabilTab.tsx",
  "src/components/DataFlowDebugPanel.tsx",
  "src/components/DiagnosticoObstaculosTab.tsx",
  "src/components/EstoqueTab.tsx",
  "src/components/ItensTab.tsx",
  "src/components/ProductQAConsole.tsx",
  "src/components/VendedoresTab.tsx",
  "src/components/useExecutiveSessionState.ts",
  "src/components/spreadsheet/SimpleSpreadsheetImporter.tsx",
  "src/components/ExecutiveSessionRightPanel.tsx",
  "src/components/PeopleIntelligenceTab.tsx",
  "src/services/meetingPrepService.ts",
  "src/services/clientFilterManager.ts",
  "src/core/compatibility/legacyImportAllowlist.ts",
  "src/core/compatibility/CompatibilityPolicy.ts",
  "src/core/knowledge-graph/KnowledgeGraphBuilder.ts",
  "src/core/knowledge-graph/KnowledgeGraphDiagnostics.ts",
  "src/core/navigation/consultingFlowStructure.ts",
  "src/core/business/businessObjects.ts",
  "src/core/business/BusinessEngine.ts",
  "src/core/rule-engine/RuleDiagnostics.ts",
  "src/core/rule-engine/BusinessRuleExtractor.ts",
  "src/core/rule-engine/FormulaClassifier.ts",
  "src/core/persistence/EnterpriseRepository.ts",
  "src/core/persistence/TrashRepository.ts",
  "src/core/business-intelligence/ExecutivePresentationEngine.ts",
  "src/core/identity/IdentityEngine.ts",
  "src/core/smart-configuration/ColumnRoleSuggestionEngine.ts",
  "src/core/business-intelligence/ConsultingReadinessService.ts",
  "src/core/workbook-library/WorkbookReadinessService.ts",
  "src/core/connections/DatabaseConnectionManager.ts",
  "src/core/connections/ConnectorSDK.ts",
  "src/core/identity/SecurityScoreEngine.ts",
  "src/core/plugins/industry/IndustryPlugin.ts",
  "src/core/plugins/PluginEngine.ts",
  "src/core/identity/IdentityCleanupMigration.ts",
  "src/core/identity/RoleManager.ts",
  "src/core/identity/PermissionManager.ts",
  "src/core/identity/ShareLinkManager.ts",
  "src/core/workbook-reverse/KpiCandidateDetector.ts",
  "src/core/workbook-reverse/BusinessRuleCandidateDetector.ts",
  "src/modules/consultant-workspace/ConsultantWorkspaceManager.ts",
  "src/core/workbook-reverse/WorkbookRiskAnalyzer.ts",
  "src/core/adaptive-ui/WorkspaceDictionaryRepository.ts",
  "src/core/market-intelligence/MarketSignalProvider.ts",
  "src/core/market-intelligence/MarketQuoteProvider.ts",
  "src/core/market-intelligence/MarketNewsProvider.ts",
  "src/core/market-intelligence/DomainMarketPackMapper.ts",
  "src/core/workbook-reverse/WorkbookReverseTypes.ts",
  "src/core/identity/AccessControlEngine.ts",
  "src/core/identity/digitalTwin/CompanyTwin.ts",
  "src/core/identity/types.ts",
  "src/core/data/moduleMapping.ts",
  "src/core/workbook-reverse/SheetRoleClassifier.ts",
  "src/core/security/SecurityEngine.ts",
  "src/core/persistence/TransactionManager.ts",
  "src/core/workspace-intelligence/CaseDossierEngine.ts",
  "src/core/workspace-intelligence/ContextResolver.ts",
  "src/core/workspace-intelligence/BusinessDomainClassifier.ts",
  "src/core/workspace-intelligence/WorkspaceIntelligenceEngine.ts",
  "src/core/workspace-intelligence/WorkspaceIntelligenceTypes.ts",
  "src/core/rule-engine/BusinessRuleTypes.ts",
  "src/components/ModeloConsultivoTab.tsx",
  "src/core/business-intelligence/ConsultingModelRepository.ts",
  "src/core/business-intelligence/ProjectDNA.ts",
  "src/components/SauronArchitectPanel.tsx",
  "src/components/CustomAreaTab.tsx",
  "src/core/business-intelligence/CustomAreaViewModel.ts",

  // ── RC-3.1.1 Tracked Debt additions (2026-08-01) ──────────────────────────
  // The following files were discovered by the real scanner during the RC-3.1.1
  // hotfix. They contain domain vocabulary outside Domain Pack directories and
  // must be migrated in a future sprint. Each is documented below.

  // Debt: uses "indústria", "varejo", "serviços" in sector-selection UI.
  // Migration target: move sector enum/labels to DomainPacks; UI renders labels
  // from domain metadata instead of hardcoding them here.
  "src/components/ClientManagementModal.tsx",

  // Debt: uses "serviços", "varejo", "indústria" in engagement-type selector.
  // Migration target: engagement types should reference DomainPack category names.
  "src/components/EngagementModal.tsx",

  // Debt: uses "construção" as a string literal in evidence classification.
  // Migration target: replace with DomainVocabularyCategory enum reference.
  "src/core/evidence/EvidenceEngine.ts",

  // Debt: uses "construção" in semantic classification logic.
  // Migration target: delegate industry-label resolution to ConstructionPack.
  "src/core/semantic/SourceDrivenSemanticEngine.ts",

  // Debt: uses "serviços" in engagement-service-type initialization.
  // Migration target: ServicesPack should own this vocabulary.
  "src/modules/consultant-workspace/EngagementService.ts",

  // Debt: uses "fazenda" (agribusiness) in organization type definitions.
  // Migration target: AgribusinessPack should own organization-type vocabulary.
  "src/modules/consultant-workspace/OrganizationService.ts",
]);
