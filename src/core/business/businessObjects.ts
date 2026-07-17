/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Core domain entity definitions for Sauron Operating Platform

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  corporateName: string;
  cnpj: string;
  segment: "especializado" | "agro" | "servicos" | "industria";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface Group {
  id: string;
  tenantId: string;
  name: string; // Conglomerado
  description?: string;
}

export interface Company {
  id: string;
  groupId: string;
  name: string; // Empresa / Unidade
  cnpj: string;
  brand: string; // Bandeira / Marca
  segment: string;
}

export interface CNPJ {
  value: string;
  companyName: string;
  status: "VALID" | "INVALID";
}

export interface Brand {
  id: string;
  name: string; // e.g. Marca A, Marca B, Soja, Milho
  segment: string;
}

export interface Store {
  id: string;
  companyId: string;
  name: string;
  location?: string;
}

export interface Department {
  id: string;
  name: string; // e.g. Operações, Vendas, Serviços
  costCenterId?: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string; // e.g. "Linha Comercial", "Contratos", "Operações"
  parentCode?: string;
  segment: string;
}

export interface Account {
  id: string;
  code: string; // e.g. "1.01.01"
  name: string; // e.g. "Vendas Bruto"
  type: "REVENUE" | "COST" | "EXPENSE" | "ASSET" | "LIABILITY" | "EQUITY";
  parentCode?: string;
}

export interface Transaction {
  id: string;
  tenantId: string;
  companyId: string;
  date: string;
  competence: string; // Mês/Ano (e.g., "2026-06")
  accountCode: string;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  costCenterCode?: string;
  documentId?: string;
  createdBy: string;
}

export interface Document {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  status: "PROCESSED" | "PROCESSING" | "ERROR";
}

export interface Revenue {
  id: string;
  companyId: string;
  amount: number;
  category: string;
  date: string;
}

export interface Expense {
  id: string;
  companyId: string;
  amount: number;
  category: string;
  date: string;
}

export interface KPI {
  id: string;
  code: string;
  name: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit: "currency" | "percentage" | "number" | "ratio";
  status: "EXCELLENT" | "GOOD" | "WARNING" | "CRITICAL";
  trend: "UP" | "DOWN" | "STABLE";
}

export interface Report {
  id: string;
  title: string;
  type: "dre" | "fluxo_caixa" | "balanço" | "desempenho_vendas";
  generatedAt: string;
  parameters: Record<string, any>;
  data: any;
}

export interface Presentation {
  id: string;
  title: string;
  subtitle?: string;
  clientId: string;
  slides: Slide[];
  createdAt: string;
  updatedAt: string;
}

export interface Slide {
  id: string;
  presentationId: string;
  title: string;
  subtitle?: string;
  type: "cover" | "dre" | "ranking" | "category" | "checklist";
  order: number;
  content: Record<string, any>;
  visible: boolean;
  notes?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string;
  consultantId: string;
  clientId: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";
  notes?: string;
}

export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  responsible: string;
  deadline: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  meetingId?: string;
}

export interface ConsultantNote {
  id: string;
  targetId: string; // e.g., cell coordinate or filter
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface ImportProfile {
  id: string;
  name: string;
  clientName: string;
  segment: "especializado" | "agro" | "servicos" | "industria";
  mappings: Record<string, string>;
  filters: any[];
  calculatedFields: any[];
}

export interface DataSource {
  id: string;
  type: "UNMAPPED" | "SPREADSHEET" | "DATABASE" | "CONSULTANT";
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastSyncedAt?: string;
}

export interface DataLineageRecord {
  id: string;
  targetKpi: string;
  value: number;
  sourceType: "SPREADSHEET" | "DATABASE" | "UNMAPPED";
  fileId?: string;
  sheetName?: string;
  rowIndices?: number[];
  filterApplied?: string;
  formulaApplied?: string;
  calculatedAt: string;
  responsibleUser: string;
}
