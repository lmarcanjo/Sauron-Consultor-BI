import { LancamentoFinanceiro } from "../types";
export type ActiveDataSource = "DEMO_DATA" | "SPREADSHEET_DATA" | "DATABASE_DATA" | "CONSULTANT_DATA" | "MIXED_APPROVED_DATA";
export interface DataSourceState {
    activeDataSource: ActiveDataSource;
    activeSpreadsheetIds: string[];
    activeDatabaseConnectionId?: string;
    allowMixedSources: boolean;
    approvedByConsultant: boolean;
    lastUpdatedAt: string;
}
export interface SpreadsheetWorkspace {
    id: string;
    name: string;
    clientId?: string;
    files: SpreadsheetFile[];
    activeFileIds: string[];
    createdAt: string;
    updatedAt: string;
}
export interface SpreadsheetFile {
    id: string;
    fileName: string;
    nome?: string;
    importedAt: string;
    dataImportacao?: string;
    importedBy: string;
    usuario?: string;
    status: "ACTIVE" | "INACTIVE" | "PENDING_MAPPING" | "PENDING_APPROVAL" | "PENDING_VALIDATION" | "ERROR";
    sheets: SpreadsheetSheet[];
    totalRows: number;
    totalColumns: number;
    totalAbas?: number;
    qualityScore?: number;
    qualityLabel?: "Excelente" | "Boa" | "Atenção" | "Crítica";
    scoreQualidade?: "Excelente" | "Boa" | "Atenção" | "Crítica";
    approvedByConsultant?: boolean;
    version?: string;
    versao?: string;
}
export interface SpreadsheetColumn {
    name: string;
    type: string;
    hasEmptyValues: boolean;
    alias?: string;
    ignored?: boolean;
    dataType?: string;
    isFilter?: boolean;
    isKPI?: boolean;
    isDRE?: boolean;
    isPessoas?: boolean;
    isComissao?: boolean;
    isApresentacao?: boolean;
    description?: string;
}
export interface SpreadsheetSheet {
    id: string;
    fileId: string;
    sheetName: string;
    rows: Record<string, any>[];
    columns: SpreadsheetColumn[];
}
export interface ClientFilterConfig {
    id: string;
    sourceColumn: string;
    friendlyName: string;
    type: "text" | "select" | "multiselect" | "date" | "month" | "year" | "number" | "currency" | "range";
    visibleToConsultant: boolean;
    visibleToClient: boolean;
    visibleInReports: boolean;
    visibleInPresentations: boolean;
    required: boolean;
    defaultValue?: any;
    order: number;
}
export interface ConsultantAdjustment {
    id: string;
    type: "meta" | "comentario" | "observacao" | "cenario" | "classificacao" | "agrupamento" | "indicador" | "plano_acao" | "insight_favorito" | "bookmark" | "nota";
    targetField?: string;
    targetFilter?: string;
    value: any;
    description: string;
    createdAt: string;
    createdBy: string;
}
export interface DataVersion {
    versionId: string;
    label: string;
    timestamp: string;
    user: string;
    recordsCount: number;
    status: "OFFICIAL" | "DISCARDED" | "PREVIEW";
    notes?: string;
    source: "SPREADSHEET" | "DATABASE";
    data: LancamentoFinanceiro[];
}
export interface ColumnProfile {
    name: string;
    type: string;
    originalName: string;
    isFilter?: boolean;
    isKPI?: boolean;
    isDRE?: boolean;
    isPessoas?: boolean;
    isComissao?: boolean;
    isApresentacao?: boolean;
    description?: string;
    hasEmptyValues?: boolean;
}
export interface ActiveDatasetRow {
    raw: Record<string, any>;
    normalized?: Record<string, any>;
    metadata: {
        rowIndex: number;
        sheetName: string;
        fileName: string;
    };
}
export interface SheetMetadata {
    sheetName: string;
    rowCount: number;
    columnCount: number;
    formulaCount: number;
    storageRef: string;
    classification: "Base de dados" | "Cadastro" | "Relatório" | "Cálculo/Fórmulas" | "Configuração" | "Vazia" | "Não classificada";
    selectedForImport: boolean;
}
export interface ActiveDataset {
    datasetId: string;
    sourceType: ActiveDataSource;
    sourceName: string;
    importedAt: string;
    rowCount: number;
    columnCount: number;
    sheets: (string | SheetMetadata)[];
    activeSheet: string;
    previewRows: ActiveDatasetRow[];
    columnProfiles: ColumnProfile[];
    importProfile: ImportProfile | null;
    rawStorageRef: string;
    status: "ACTIVE" | "PENDING";
}
export interface ActiveWorkbookDataset extends ActiveDataset {
    workbookId: string;
    sheets: SheetMetadata[];
    formulaCount: number;
}
export interface ImportProfile {
    id: string;
    clientName: string;
    profileName: string;
    mappings: Record<string, string>;
    selectedFilters: ClientFilterConfig[];
    expectedFiles: string[];
    lastApplied: string;
}
