/**
 * Data shape used by the people view. Values are supplied by the active
 * dataset; this file contains types only and has no default records.
 */

export interface TimelineItem {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  category: "hire" | "promotion" | "target" | "best_month" | "training" | "team_change" | "campaign" | "bonus";
}

export interface PdiGoal {
  id: string;
  description: string;
  deadline: string;
  status: "pending" | "in_progress" | "completed";
}

export interface DocumentAudit {
  id: string;
  name: string;
  code: string;
  status: "validated" | "pending_review" | "archived";
  date: string;
}

export interface CollaboratorPerformance {
  collaboratorId: string;
  totalSales: number;
  accessoriesSales: number;
  partsSales: number;
  csat: number;
  cancellationRate: number;
  campaignParticipated: string[];
  lineage: {
    totalSalesCell: string;
    accessoriesSalesCell: string;
    partsSalesCell: string;
    csatCell: string;
    cancellationRateCell: string;
  };
}

export interface CollaboratorDossier {
  id: string;
  name: string;
  role: string;
  team: string;
  department: string;
  store: string;
  manager: string;
  email: string;
  status: "Ativo" | "Inativo";
  hireDate: string;
  experience: string;
  achievements: string;
  strengths: string;
  weaknesses: string;
  feedback: string;
  performance: CollaboratorPerformance;
  timeline: TimelineItem[];
  pdi: PdiGoal[];
  documents: DocumentAudit[];
}
