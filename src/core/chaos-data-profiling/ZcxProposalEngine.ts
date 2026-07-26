/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChaosSourceProfile, PhysicalColumnProfile } from "./ChaosDataTypes";
import type {
  ZcxCapabilityModule,
  ZcxCapabilityProposal,
  ZcxCapabilityStatus,
  ZcxConfidenceTier,
  ZcxFieldCategory,
  ZcxFieldProposal,
  ZcxProposal,
  ZcxUnresolvedQuestion,
} from "./ZcxTypes";

export function determineConfidenceTier(confidence: number): ZcxConfidenceTier {
  if (confidence >= 0.85) return "HIGH";
  if (confidence >= 0.60) return "MEDIUM";
  return "LOW";
}

function categorizeColumn(column: PhysicalColumnProfile): ZcxFieldCategory {
  if (column.emptyPercentage > 0.95) return "empty";
  const role = column.probableRole;
  if (role === "date") return "date";
  if (role === "metric") return "metric";
  if (role === "identifier") return "identifier";
  if (role === "code") return "identifier";
  if (role === "dimension") return "dimension";
  if (role === "name") return "essential";
  if (column.physicalName.toLowerCase().includes("id") || column.physicalName.toLowerCase().includes("codigo")) return "identifier";
  return "description";
}

export function generateZcxProposal(profile: ChaosSourceProfile): ZcxProposal {
  const containerId = profile.physicalContainers[0]?.id || "";
  const totalFields = profile.physicalColumns.length;
  const totalRecords = profile.totalKnownRows || profile.sampledRecords;

  const fieldProposals: ZcxFieldProposal[] = profile.physicalColumns.map(column => {
    const suggestion = profile.semanticSuggestions.find(s => s.physicalColumns.includes(column.physicalName));
    const confidence = suggestion?.confidence ?? (column.emptyPercentage < 0.2 ? 0.88 : 0.65);
    const confidenceTier = determineConfidenceTier(confidence);
    const category = categorizeColumn(column);

    const evidence: string[] = [];
    if (column.observedTypes.length > 0) {
      evidence.push(`Tipos observados na amostra: ${column.observedTypes.join(", ")}`);
    }
    if (column.emptyPercentage < 0.05) {
      evidence.push(`Preenchimento consistente (${Math.round((1 - column.emptyPercentage) * 100)}% presente)`);
    } else if (column.emptyPercentage > 0.5) {
      evidence.push(`Atenção: ${Math.round(column.emptyPercentage * 100)}% de valores vazios`);
    }
    if (suggestion) {
      evidence.push(`Sugestão semântica '${suggestion.suggestedRole}' vinculada com ${Math.round(suggestion.confidence * 100)}% de confiança`);
    }
    if (column.examples.length > 0) {
      evidence.push(`Exemplos reais da origem: ${column.examples.slice(0, 3).map(v => String(v)).join(", ")}`);
    }

    const autoSelected = confidenceTier === "HIGH" && category !== "empty";

    return {
      fieldId: `zcx_${column.containerId}_${column.physicalName}`,
      physicalName: column.physicalName,
      suggestedLabel: suggestion?.suggestedLabel || column.physicalName,
      suggestedRole: suggestion?.suggestedRole || column.probableRole,
      confidence,
      confidenceTier,
      category,
      evidence,
      autoSelected,
      inferredType: column.observedTypes[0] || "unknown",
      sampleValues: column.examples,
      containerId: column.containerId || containerId,
    };
  });

  const capabilityProposals: ZcxCapabilityProposal[] = evaluateCapabilities(fieldProposals);
  const unresolvedQuestions: ZcxUnresolvedQuestion[] = generateUnresolvedQuestions(fieldProposals, profile);

  const highConfidenceCount = fieldProposals.filter(f => f.confidenceTier === "HIGH").length;
  const overallConfidence = totalFields > 0 ? Number((highConfidenceCount / totalFields).toFixed(2)) : 0;

  const warnings: string[] = [];
  if (profile.qualityFindings.length > 0) {
    warnings.push(`Encontrados ${profile.qualityFindings.length} achados de qualidade na origem`);
  }
  const emptyFieldsCount = fieldProposals.filter(f => f.category === "empty").length;
  if (emptyFieldsCount > 0) {
    warnings.push(`${emptyFieldsCount} campo(s) possuem mais de 95% de valores vazios`);
  }

  return {
    proposalId: `zcx_prop_${profile.sourceId}_${Date.now()}`,
    sourceId: profile.sourceId,
    profileId: profile.profileId,
    groupId: profile.groupId,
    companyId: profile.companyId,
    generatedAt: new Date().toISOString(),
    version: 1,
    status: "GENERATED",
    sourceSummary: {
      totalRecords,
      totalFields,
      containersCount: profile.physicalContainers.length,
      blocksCount: profile.detectedBlocks.length,
    },
    fieldProposals,
    capabilityProposals,
    unresolvedQuestions,
    overallConfidence,
    evidence: [
      `Análise concluída com base na amostragem física da fonte (${totalRecords.toLocaleString("pt-BR")} registros)`,
      `Identificados ${highConfidenceCount} de ${totalFields} campos com alta confiança (≥85%)`,
    ],
    warnings,
  };
}

function evaluateCapabilities(fields: ZcxFieldProposal[]): ZcxCapabilityProposal[] {
  const hasDate = fields.some(f => f.category === "date" || f.suggestedRole === "date");
  const hasMetric = fields.some(f => f.category === "metric" || f.suggestedRole === "metric");
  const hasNameOrDim = fields.some(f => f.category === "essential" || f.category === "dimension");

  const modules: { name: ZcxCapabilityModule; requiredRoles: string[] }[] = [
    { name: "Financeiro", requiredRoles: ["date", "metric"] },
    { name: "Comercial", requiredRoles: ["metric", "dimension"] },
    { name: "Pessoas", requiredRoles: ["essential"] },
    { name: "DRE", requiredRoles: ["date", "metric"] },
    { name: "Comissão", requiredRoles: ["metric"] },
  ];

  return modules.map(mod => {
    let status: ZcxCapabilityStatus = "NOT_IDENTIFIED";
    const missing: string[] = [];
    const evidence: string[] = [];

    if (mod.name === "Financeiro" || mod.name === "DRE") {
      if (hasDate && hasMetric) {
        status = "AVAILABLE";
        evidence.push("Datas e métricas financeiras identificadas com alta confiança.");
      } else {
        if (!hasDate) missing.push("Data do lançamento");
        if (!hasMetric) missing.push("Valor financeiro");
        status = missing.length === 1 ? "NEEDS_CONFIRMATION" : "NOT_IDENTIFIED";
        evidence.push(`Falta confirmar: ${missing.join(", ")}`);
      }
    } else if (mod.name === "Comercial") {
      if (hasMetric && hasNameOrDim) {
        status = "AVAILABLE";
        evidence.push("Valores e dimensões de vendas identificados.");
      } else {
        if (!hasMetric) missing.push("Faturamento / Valor de venda");
        if (!hasNameOrDim) missing.push("Vendedor / Cliente / Produto");
        status = "NEEDS_CONFIRMATION";
        evidence.push(`Falta confirmar: ${missing.join(", ")}`);
      }
    } else if (mod.name === "Pessoas" || mod.name === "Comissão") {
      if (hasMetric || hasNameOrDim) {
        status = "PROBABLE";
        evidence.push("Campos de identificação ou remuneração encontrados.");
      } else {
        missing.push("Nome do colaborador / Valor de comissão");
        status = "NEEDS_CONFIRMATION";
        evidence.push("Falta confirmar identificador da equipe.");
      }
    }

    return {
      moduleName: mod.name,
      status,
      confidence: status === "AVAILABLE" ? 0.90 : status === "PROBABLE" ? 0.75 : 0.40,
      evidence,
      missingFieldRoles: missing.length > 0 ? missing : undefined,
    };
  });
}

function generateUnresolvedQuestions(fields: ZcxFieldProposal[], profile: ChaosSourceProfile): ZcxUnresolvedQuestion[] {
  const questions: ZcxUnresolvedQuestion[] = [];

  const mediumFields = fields.filter(f => f.confidenceTier === "MEDIUM");
  if (mediumFields.length > 0) {
    questions.push({
      questionId: `q_medium_fields_${Date.now()}`,
      title: "Confirmar interpretação dos campos pendentes",
      description: `Encontramos ${mediumFields.length} campo(s) com sugestão de média confiança que precisam da sua validação.`,
      scope: "source",
      targetFields: mediumFields.map(f => f.physicalName),
      options: [
        { label: "Aceitar sugestões", action: "ACCEPT_MEDIUM" },
        { label: "Manter nomes originais", action: "KEEP_ORIGINAL" },
      ],
      impact: "Influencia a rotulagem automática nos módulos executivos.",
    });
  }

  const ambigFields = fields.filter(f => f.category === "ambiguous");
  if (ambigFields.length > 0) {
    questions.push({
      questionId: `q_ambig_fields_${Date.now()}`,
      title: "Resolver campos ambíguos",
      description: `Os campos ${ambigFields.map(f => f.physicalName).join(", ")} possuem mais de um significado provável.`,
      scope: "field",
      targetFields: ambigFields.map(f => f.physicalName),
      options: [
        { label: "Revisar cada campo", action: "REVIEW_EACH" },
        { label: "Tratar como texto", action: "FORCE_TEXT" },
      ],
      impact: "Previne divergência em agregações.",
    });
  }

  return questions;
}
