export interface ActionPlan {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  responsible: string;
  deadline: string;
  status: 'pending' | 'in-progress' | 'completed';
  origin: string; // KPI, relatório ou observação
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
}

export interface WorkspaceProject {
  id: string;
  client: string;
  group: string;
  segment: string;
  companies: string[];
  brands: string[];
  cnpjs: string[];
  dbConnections: any[]; // Placeholder for actual DB connection type
  spreadsheets: any[]; // Placeholder
  importProfile: any;
  filters: any[];
  kpis: any[];
  dashboards: any[];
  presentations: any[];
  actionPlans: ActionPlan[];
  observations: string;
  history: any[];
  auditLog: any[];
  lastUpdated: string;
  isArchived: boolean;
}
