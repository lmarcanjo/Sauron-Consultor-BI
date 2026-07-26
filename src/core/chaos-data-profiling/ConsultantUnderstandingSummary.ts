/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChaosSourceProfile } from "./ChaosDataTypes";
import type { SourceDrivenAnalysis } from "./SourceDrivenTypes";
import type { ZcxProposal } from "./ZcxTypes";

export interface FoundDomainSummary {
  domainName: string; // e.g. "Financeiro", "Comercial", "Estoque", "RH", "Clientes"
  confidence: number;
  coverage: number;
  evidence: string[];
  fieldCount: number;
}

export interface MaterialAmbiguity {
  id: string;
  title: string;
  description: string;
  impact: string;
  suggestedAction: string;
}

export interface ConsultantUnderstandingSummary {
  sourceId: string;
  sourceName: string;
  companyName: string;
  groupName: string;
  analyzedAt: string;
  
  // 1. O que descobrimos
  discovery: {
    totalRecords: number;
    totalFields: number;
    totalTables: number;
    totalSheets: number;
    totalBlocks: number;
    overallQualityScore: number;
    timeSpanAnalyzed?: string;
    originType: string; // "Planilha" | "Banco de Dados SQL"
  };

  // 2. O que encontramos (Áreas e Conceitos)
  foundDomains: FoundDomainSummary[];

  // 3. O que ainda não temos certeza (Somente ambiguidades relevantes)
  ambiguities: MaterialAmbiguity[];

  // 4. Nossa compreensão (Narrativa curta baseada em evidências)
  narrative: string;

  // Resumo executivo para o indicador do consultor
  consultantMetrics: {
    qualityLabel: string;
    coveragePercentage: number;
    pendingRevisionsCount: number;
    availableAreas: string[];
  };
}

export function buildConsultantUnderstandingSummary(
  profile: ChaosSourceProfile,
  sourceDriven: SourceDrivenAnalysis,
  proposal?: ZcxProposal
): ConsultantUnderstandingSummary {
  const totalTables = profile.physicalContainers.length;
  const totalRecords = profile.totalKnownRows || profile.sampledRecords;
  const totalFields = profile.physicalColumns.length;
  const overallQuality = Math.round((profile.confidenceScore || 0.85) * 100);

  // Group domains by found items without inventing
  const domainMap = new Map<string, FoundDomainSummary>();
  sourceDriven.interpretations.forEach(interp => {
    const domain = interp.suggestedDomain || "Geral";
    const existing = domainMap.get(domain) || {
      domainName: domain,
      confidence: interp.confidence,
      coverage: interp.coverage,
      evidence: [],
      fieldCount: 0,
    };
    existing.fieldCount += 1;
    existing.confidence = Math.max(existing.confidence, interp.confidence);
    existing.evidence = Array.from(new Set([...existing.evidence, ...interp.evidence])).slice(0, 3);
    domainMap.set(domain, existing);
  });

  const foundDomains = Array.from(domainMap.values());

  // Material ambiguities only (low or medium confidence items)
  const ambiguities: MaterialAmbiguity[] = sourceDriven.interpretations
    .filter(i => i.confidence < 0.85 && i.confidence >= 0.50)
    .map((i, idx) => ({
      id: `ambig_${idx}`,
      title: `Campo '${i.physicalName}' requer confirmação de uso`,
      description: `O campo possui ${Math.round(i.coverage * 100)}% de preenchimento e pode representar ${i.suggestedMeaning || i.suggestedLabel}.`,
      impact: "Recomendado revisar antes de gerar relatórios avançados.",
      suggestedAction: "Revisar interpretação",
    }));

  // Build short evidence-backed narrative
  const areaNames = foundDomains.map(d => d.domainName).join(" e ");
  const narrative = `Pelos dados encontrados na fonte '${profile.sourceName}', identificamos informações pertinentes à área de ${areaNames || "gestão"}. ` +
    `Encontramos ${totalRecords.toLocaleString("pt-BR")} registros distribuídos em ${totalFields} campos com qualidade geral de ${overallQuality}%. ` +
    (ambiguities.length > 0
      ? `Recomendamos a revisão de ${ambiguities.length} campo(s) com interpretação pendente para garantir a máxima precisão dos indicadores.`
      : "Todas as estruturas identificadas possuem alto grau de confiança para geração imediata das análises.");

  return {
    sourceId: profile.sourceId,
    sourceName: profile.sourceName,
    companyName: profile.companyId || "Empresa Atual",
    groupName: profile.groupId || "Grupo Atual",
    analyzedAt: profile.updatedAt || new Date().toISOString(),
    discovery: {
      totalRecords,
      totalFields,
      totalTables,
      totalSheets: profile.physicalContainers.filter(c => c.type === "sheet").length || 1,
      totalBlocks: profile.detectedBlocks.length,
      overallQualityScore: overallQuality,
      originType: profile.sourceName.endsWith(".csv") || profile.sourceName.endsWith(".xlsx") ? "Planilha" : "Banco de Dados",
    },
    foundDomains,
    ambiguities,
    narrative,
    consultantMetrics: {
      qualityLabel: overallQuality >= 80 ? "Alta Qualidade" : "Qualidade Moderada",
      coveragePercentage: Math.round(
        (sourceDriven.interpretations.reduce((acc, i) => acc + i.coverage, 0) / (totalFields || 1)) * 100
      ),
      pendingRevisionsCount: ambiguities.length,
      availableAreas: foundDomains.map(d => d.domainName),
    },
  };
}
