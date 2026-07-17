export type CompatibilityDisposition =
  | "KEEP_TEMPORARILY"
  | "MIGRATE"
  | "DEPRECATE"
  | "REMOVE"
  | "TEST_ONLY";

export interface CompatibilityBoundary {
  symbol: string;
  module: string;
  disposition: CompatibilityDisposition;
  canonicalContract: string;
  reason: string;
  risks: string[];
  removalCondition: string;
}

export const LEGACY_COMPATIBILITY_BOUNDARIES: CompatibilityBoundary[] = [
  {
    symbol: "DataSourceManager",
    module: "src/core/data/DataSourceManager.ts",
    disposition: "KEEP_TEMPORARILY",
    canonicalContract: "ActiveDatasetStore + DataActivation + SpreadsheetStoragePort",
    reason: "Consumidores antigos ainda dependem da facade reativa e de registros compatíveis.",
    risks: ["estado persistido paralelo", "leitura materializada fora da origem paginada"],
    removalCondition: "Migrar o hook e todos os consumidores de UI para ActiveDataset e engines.",
  },
  {
    symbol: "SpreadsheetWorkspaceManager",
    module: "src/services/spreadsheetWorkspaceManager.ts",
    disposition: "DEPRECATE",
    canonicalContract: "ImportService + WorkbookRepository + DataActivation",
    reason: "API histórica mantida para testes e integrações antigas; não é dona da importação canônica.",
    risks: ["persistência alternativa se voltar ao fluxo principal"],
    removalCondition: "Remover testes e integrações que ainda importam o wrapper.",
  },
  {
    symbol: "WorkspaceDNAEngine",
    module: "src/core/workspace-intelligence/WorkspaceDNAEngine.ts",
    disposition: "MIGRATE",
    canonicalContract: "WorkspaceIntelligenceEngine + Domain Packs + ActiveDataset",
    reason: "Painéis de caso antigos ainda consomem sugestões de contexto.",
    risks: ["vocabulário e heurísticas antigas fora do fluxo de workbook"],
    removalCondition: "Migrar CaseHub e painéis de caso para o contrato de workspace atual.",
  },
];

