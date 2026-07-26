/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChaosSourceProfile } from "./ChaosDataTypes";
import type {
  FieldInterpretation,
  SourceDrivenAnalysis,
  SourceDrivenStructure,
} from "./SourceDrivenTypes";

export function buildSourceDrivenAnalysis(profile: ChaosSourceProfile): SourceDrivenAnalysis {
  const containerId = profile.physicalContainers[0]?.id || "";

  const interpretations: FieldInterpretation[] = profile.physicalColumns.map(column => {
    const suggestion = profile.semanticSuggestions.find(s => s.physicalColumns.includes(column.physicalName));
    const confidence = suggestion?.confidence ?? (column.emptyPercentage < 0.2 ? 0.88 : 0.65);
    const coverage = Number((1 - column.emptyPercentage).toFixed(2));

    const evidence: string[] = [];
    if (column.observedTypes.length > 0) {
      evidence.push(`Formato observado: ${column.observedTypes.join(", ")}`);
    }
    evidence.push(`Preenchimento de ${Math.round(coverage * 100)}% da amostra`);
    if (column.examples.length > 0) {
      evidence.push(`Valores reais: ${column.examples.slice(0, 3).map(v => String(v)).join(", ")}`);
    }

    let suggestedDomain = "Geral";
    if (column.probableRole === "date" || column.probableRole === "metric") suggestedDomain = "Financeiro";
    if (column.probableRole === "name" || column.probableRole === "code") suggestedDomain = "Comercial / Cadastro";

    return {
      fieldId: `interp_${column.containerId}_${column.physicalName}`,
      sourceId: profile.sourceId,
      containerId: column.containerId || containerId,
      scope: "container",
      physicalName: column.physicalName, // IMMUTABLE
      originalType: column.observedTypes[0] || "unknown",
      sampleValues: column.examples,
      inferredType: column.observedTypes[0] || "unknown",
      suggestedLabel: suggestion?.suggestedLabel || column.physicalName,
      suggestedMeaning: suggestion ? `Interpretação sugerida como '${suggestion.suggestedRole}'` : undefined,
      suggestedDomain,
      confidence,
      coverage,
      evidence,
      status: "PROPOSED",
      updatedAt: new Date().toISOString(),
    };
  });

  const structures: SourceDrivenStructure[] = profile.physicalContainers.map(container => ({
    structureId: `struct_${container.id}`,
    containerId: container.id,
    title: container.name || "Tabela Principal",
    probableDomain: "Financeiro / Operacional",
    recordCount: container.rowCount || profile.totalKnownRows || profile.sampledRecords,
    confidence: 0.90,
    evidence: [`Container com ${container.records?.length || 0} registros de amostra`],
    fields: interpretations.filter(i => i.containerId === container.id),
  }));

  return {
    sourceId: profile.sourceId,
    sourceName: profile.sourceName,
    generatedAt: new Date().toISOString(),
    totalRecords: profile.totalKnownRows || profile.sampledRecords,
    totalFields: profile.physicalColumns.length,
    structures,
    interpretations,
    unresolvedMaterialQuestions: [],
  };
}

export function migrateLegacyMapping(
  legacyRole: string,
  physicalName: string,
  sourceId: string
): FieldInterpretation {
  return {
    fieldId: `legacy_${sourceId}_${physicalName}`,
    sourceId,
    containerId: "legacy",
    scope: "source",
    physicalName, // IMMUTABLE
    originalType: "unknown",
    sampleValues: [],
    inferredType: "unknown",
    suggestedLabel: physicalName,
    suggestedMeaning: `Mapeamento legado: ${legacyRole}`,
    confidence: 0.50,
    coverage: 1.0,
    evidence: ["Convertido de mapeamento prévio da plataforma"],
    status: "NEEDS_REVIEW",
    updatedAt: new Date().toISOString(),
  };
}
