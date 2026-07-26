/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EnterpriseEvidence {
  sourceId: string;
  containerId: string;
  fieldNames: string[];
  sampleValues: unknown[];
  confidence: number;
  description: string;
}

export interface EnterpriseArea {
  id: string;
  name: string; // e.g. "Financeiro", "Comercial", "Pós-Venda", "Oficina", "RH"
  coverage: number; // 0.0 - 1.0
  confidence: number;
  evidence: EnterpriseEvidence[];
}

export interface ProcessDiscovery {
  id: string;
  areaId: string;
  name: string; // e.g. "Faturamento de Veículos", "Manutenção e Peças", "Folha de Pagamento"
  status: "ACTIVE" | "PARTIAL" | "INCOMPLETE";
  confidence: number;
  evidence: EnterpriseEvidence[];
}

export interface BusinessEntity {
  id: string;
  name: string; // e.g. "Cliente", "Vendedor", "Veículo", "Ordem de Serviço", "Lançamento"
  category: "PERSON" | "DOCUMENT" | "TRANSACTION" | "ASSET";
  confidence: number;
  evidence: EnterpriseEvidence[];
}

export interface BusinessRelationship {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  relationType: "BELONGS_TO" | "GENERATES" | "IMPACTS" | "MANAGES";
  confidence: number;
  evidence: EnterpriseEvidence[];
}

export interface InformationGap {
  id: string;
  areaName: string;
  missingConcept: string;
  impact: string;
  recommendation: string;
}

export interface EnterpriseModel {
  companyId: string;
  discoveredAt: string;
  areas: EnterpriseArea[];
  processes: ProcessDiscovery[];
  entities: BusinessEntity[];
  relationships: BusinessRelationship[];
  gaps: InformationGap[];
  executiveNarrative: string;
}
