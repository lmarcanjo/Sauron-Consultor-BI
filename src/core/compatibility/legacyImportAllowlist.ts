/**
 * Existing consumers are explicit debt. Adding a new consumer requires a
 * deliberate change to this list and a migration note in the exit plan.
 */
export const LEGACY_IMPORT_ALLOWLIST: Record<string, string> = {
  "src/App.tsx": "shell compatibility until the application state is fully canonical",
  "src/components/ApresentacoesTab.tsx": "legacy presentation tab",
  "src/components/CentralDadosTab.tsx": "legacy database connector actions",
  "src/components/CaseDataPanel.tsx": "case compatibility",
  "src/components/CaseHub.tsx": "case compatibility",
  "src/components/CaseOverview.tsx": "case compatibility",
  "src/components/CaseOverviewPanel.tsx": "case compatibility",
  "src/components/ComissoesTab.tsx": "legacy commission tab",
  "src/components/ConsultorAreaTab.tsx": "legacy consultant area",
  "src/components/ContabilTab.tsx": "legacy accounting tab",
  "src/components/DataFlowDebugPanel.tsx": "diagnostic-only compatibility panel",
  "src/components/DiagnosticoObstaculosTab.tsx": "legacy diagnostic tab",
  "src/components/EnterpriseCenter.tsx": "compatibility props in the shell",
  "src/components/EnterpriseContextSelector.tsx": "legacy context selector",
  "src/components/EnterpriseDigitalTwinTab.tsx": "legacy digital twin view",
  "src/components/EstoqueTab.tsx": "legacy inventory tab",
  "src/components/GlobalContextBar.tsx": "legacy shell context",
  "src/components/ItensTab.tsx": "legacy items tab",
  "src/components/MeetingPrepTab.tsx": "legacy preparation adapter",
  "src/components/PosVendasTab.tsx": "legacy post-sales tab",
  "src/components/PresentationBuilderPage.tsx": "legacy presentation compatibility",
  "src/components/ProductQAConsole.tsx": "QA compatibility console",
  "src/components/VendedoresTab.tsx": "legacy sellers tab",
  "src/components/spreadsheet/SpreadsheetFieldSelectionPanel.tsx": "legacy field selection panel",
  "src/core/data/DataCatalog.ts": "legacy catalog adapter",
  "src/core/data/DataEngine.ts": "legacy data engine adapter",
  "src/core/data/DataQuality.ts": "legacy data quality adapter",
  "src/hooks/useDataSourceManager.ts": "legacy hook facade",
  "src/services/dataSourceManager.ts": "legacy re-export",
  "src/services/spreadsheetWorkspaceManager.ts": "legacy service wrapper",
};

export const LEGACY_MODULE_PATTERNS = [
  /(?:from\s+|import\s*\()?["'][^"']*(?:DataSourceManager|dataSourceManager|spreadsheetWorkspaceManager|WorkspaceDNAEngine)[^"']*["']/,
];

