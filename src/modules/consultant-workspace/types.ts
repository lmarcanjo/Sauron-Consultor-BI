import { ExecutiveSummary, Recommendation, Anomaly, Trend, BenchmarkResult } from '../../core/analytics/types';
import type { CertifiedMetricSnapshot } from '../../core/financial-consistency';
import type { ExecutiveSnapshot } from '../../core/executive-deliverables/ExecutiveDeliverablesTypes';

export interface ActionPlan {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  responsible: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
  origin: string; // KPI, relatório ou observação
  certifiedSnapshotId?: string;
}

export interface Meeting {
  id: string;
  presentationId: string;
  selectedCharts: string[];
  observations: string;
  decisions: string;
  actionPlans: ActionPlan[];
  responsible: string;
  pendingItems: string[];
  certifiedSnapshotId?: string;
  certifiedSnapshot?: CertifiedMetricSnapshot;
}

export interface WorkspaceDataSource { id: string; name: string; type: string; }
export interface WorkspaceSpreadsheet { id: string; name: string; path: string; }
export interface WorkspaceDbConnection { id: string; name: string; host: string; }
export interface WorkspaceImportProfile { id: string; name: string; rules: any; }
export interface WorkspaceFilter { id: string; name: string; expression: string; }
export interface WorkspaceKpi { id: string; name: string; target: number; }
export interface WorkspaceDashboard { id: string; name: string; layout: any; }
export interface WorkspacePresentation {
  id: string;
  name: string;
  slides: any[];
  artifactId?: string;
  artifactFingerprint?: string;
  sourceFingerprint?: string;
  engagementId?: string;
  generatedAt?: string;
  version?: number;
  status?: "CURRENT" | "OUTDATED";
}
export interface WorkspaceHistoryEvent { id: string; event: string; timestamp: string; }
export interface WorkspaceAuditEvent { id: string; action: string; user: string; timestamp: string; }

export interface AnalysisResult {
  executiveSummary: ExecutiveSummary;
  recommendations: Recommendation[];
  anomalies: Anomaly[];
  trends: Trend[];
  benchmarks: BenchmarkResult[];
  lastUpdated: string;
}

export interface ClientEntity {
  id: string;
  legalName: string;
  tradeName?: string;
  document: string; // CNPJ ou identificador único
  segment?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  assignedConsultantId?: string;
}

export interface WorkspaceProject {
  id: string;
  client: string;
  clientId?: string;
  group: string;
  segment: string;
  companies: string[];
  brands: string[];
  cnpjs: string[];
  dbConnections: WorkspaceDbConnection[];
  spreadsheets: WorkspaceSpreadsheet[];
  importProfile: WorkspaceImportProfile | null;
  filters: WorkspaceFilter[];
  kpis: WorkspaceKpi[];
  dashboards: WorkspaceDashboard[];
  presentations: WorkspacePresentation[];
  actionPlans: ActionPlan[];
  meetings: Meeting[];
  observations: string;
  history: WorkspaceHistoryEvent[];
  auditLog: WorkspaceAuditEvent[];
  lastUpdated: string;
  isArchived: boolean;
  canonicalState?: 'NO_SOURCE' | 'SOURCE_CONNECTED' | 'DISCOVERING' | 'WAITING_CONFIRMATION' | 'READY';
  assignedConsultantId?: string;
  analysis?: AnalysisResult;
  executiveSnapshots?: ExecutiveSnapshot[];
}
