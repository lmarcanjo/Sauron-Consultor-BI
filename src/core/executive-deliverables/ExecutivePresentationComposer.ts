/**
 * Composes a factual executive deck from the persisted preliminary artifact.
 * Formatting and projection are allowed here; row-level calculations are not.
 */

import type { WorkspaceProject } from "../../modules/consultant-workspace/types";
import type { ModuleActivationProjection } from "../module-activation/ModuleActivationContracts";
import type { PreliminaryFinancialAnalysisArtifact } from "../preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import type { ExecutivePresentation, PresentationSlide } from "../business-intelligence/ExecutivePresentationEngine";
import type { ComposedExecutivePresentation } from "./ExecutiveDeliverablesTypes";

const currency = (value: number) => new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
}).format(value);

const metricValue = (artifact: PreliminaryFinancialAnalysisArtifact, code: string) =>
  artifact.metrics.find(metric => metric.code === code)?.value ?? null;

const groupingRows = (artifact: PreliminaryFinancialAnalysisArtifact, codes: string[]) => artifact.groupings
  .filter(group => codes.includes(group.dimensionCode))
  .flatMap(group => group.items.slice(0, 10).map(item => ({
    categoria: `${group.dimensionLabel}: ${item.displayName}`,
    valor: item.valueTotal,
  })));

export interface ExecutivePresentationComposerInput {
  artifact: PreliminaryFinancialAnalysisArtifact;
  project?: WorkspaceProject | null;
  moduleProjections?: readonly ModuleActivationProjection[];
}

export class ExecutivePresentationComposer {
  public compose(input: ExecutivePresentationComposerInput): ComposedExecutivePresentation {
    const { artifact, project, moduleProjections = [] } = input;
    const clientName = project?.client || artifact.clientId || "Cliente";
    const engagementName = project?.id || artifact.engagementId;
    const generatedAt = new Date().toISOString();
    const total = metricValue(artifact, "VALUE_TOTAL");
    const paid = metricValue(artifact, "PAID_VALUE_TOTAL");
    const balance = metricValue(artifact, "BALANCE_TOTAL");
    const periodItems = artifact.temporalSeries.flatMap(series => series.items);
    const periodText = periodItems.length > 0
      ? `${periodItems[0].periodKey} a ${periodItems[periodItems.length - 1].periodKey}`
      : "Não disponível no artefato";
    const limitations = artifact.limitations.map(item => item.message);
    const findings = artifact.qualityFindings.map(item => item.message);
    const moduleLabels: Record<string, string> = { FINANCIAL: "Financeiro", COMMERCIAL: "Comercial", INVENTORY: "Estoque", ITEMS: "Itens", AFTER_SALES: "Pós-vendas" };
    const modules = moduleProjections.map(module =>
      `${moduleLabels[module.moduleId] || module.moduleId}: ${module.status}${module.missingRequirements.length > 0 ? ` (${module.missingRequirements.join(", ")})` : ""}`
    );
    const fields = artifact.physicalFields.filter(field => field.usageStatus === "USED").map(field => field.displayName || field.physicalName);
    const temporalRows = artifact.temporalSeries[0]?.items.slice(0, 12).map(item => ({
      categoria: item.periodKey,
      valor: item.valueTotal,
    })) || [];
    const distributionRows = groupingRows(artifact, ["SITUATION", "RESULT_CENTER"]);
    const accountPeopleRows = groupingRows(artifact, ["ACCOUNT", "PERSON"]);
    const financialRows = [
      total === null ? null : { categoria: "Valor Total", valor: total },
      paid === null ? null : { categoria: "Valor Pago", valor: paid },
      balance === null ? null : { categoria: "Saldo", valor: balance },
    ].filter((row): row is { categoria: string; valor: number } => row !== null);

    const slides: PresentationSlide[] = [
      {
        id: `${artifact.artifactId}_cover`,
        title: "Apresentação Executiva",
        subtitle: "Material factual da análise preliminar",
        type: "cover",
        content: { summary: `${clientName} · ${engagementName} · ${artifact.sourceFileName}` },
      },
      {
        id: `${artifact.artifactId}_summary`,
        title: "Resumo Executivo",
        subtitle: "Fatos observados na fonte",
        type: "executive_summary",
        content: {
          summary: `Registros válidos: ${artifact.validRowCount.toLocaleString("pt-BR")}. Período: ${periodText}. Status: ${artifact.status}.`,
          points: [
            `Valor Total: ${total === null ? "Não disponível" : currency(total)}`,
            `Valor Pago: ${paid === null ? "Não disponível" : currency(paid)}`,
            `Saldo: ${balance === null ? "Não disponível" : currency(balance)}`,
          ],
        },
      },
      {
        id: `${artifact.artifactId}_financial`,
        title: "Visão Financeira",
        subtitle: "Indicadores e evolução temporal disponíveis",
        type: "financial_data",
        content: {
          data: [...financialRows, ...temporalRows],
        },
      },
      {
        id: `${artifact.artifactId}_distribution`,
        title: "Distribuição",
        subtitle: "Situação e centro de resultado encontrados",
        type: "financial_data",
        content: { data: distributionRows },
      },
      {
        id: `${artifact.artifactId}_accounts_people`,
        title: "Contas e Pessoas",
        subtitle: "Dimensões presentes no artefato",
        type: "financial_data",
        content: { data: accountPeopleRows },
      },
      {
        id: `${artifact.artifactId}_quality`,
        title: "Qualidade dos Dados",
        subtitle: "Contagens e achados factuais",
        type: "executive_summary",
        content: {
          summary: `Linhas físicas: ${artifact.physicalRowCount.toLocaleString("pt-BR")}. Linhas excluídas: ${artifact.excludedRowCount.toLocaleString("pt-BR")}. Campos: ${artifact.columnCount}.`,
          points: [
            `Achados registrados: ${artifact.qualityFindings.length}`,
            `Campos utilizados: ${fields.length}`,
            ...findings.slice(0, 4),
          ],
        },
      },
      {
        id: `${artifact.artifactId}_modules`,
        title: "Módulos",
        subtitle: "Estado da ativação por módulo",
        type: "executive_summary",
        content: { summary: modules.join(" · ") || "Nenhuma projeção de módulo disponível." },
      },
      {
        id: `${artifact.artifactId}_limitations`,
        title: "Limitações",
        subtitle: "Escopo e rastreabilidade do material",
        type: "pending",
        content: {
          points: [
            ...limitations,
            `Modo: ${artifact.analysisMode}`,
            `Fonte: ${artifact.sourceFileName}`,
            `Fingerprint da fonte: ${artifact.sourceFingerprint}`,
          ],
        },
      },
    ];

    const presentation: ExecutivePresentation = {
      id: `executive_presentation_${artifact.artifactId}`,
      title: `Apresentação Executiva — ${clientName}`,
      targetName: clientName,
      targetType: artifact.organizationalScope.scopeType,
      slides,
      status: "ready",
      artifactId: artifact.artifactId,
      artifactFingerprint: artifact.fingerprint,
      sourceFingerprint: artifact.sourceFingerprint,
      engagementId: artifact.engagementId,
      generatedAt,
      version: artifact.artifactVersion,
      origin: "MVP3_EXECUTIVE_DELIVERABLES",
    };

    return {
      presentation,
      artifactId: artifact.artifactId,
      artifactFingerprint: artifact.fingerprint,
      sourceFingerprint: artifact.sourceFingerprint,
      engagementId: artifact.engagementId,
      generatedAt,
      version: artifact.artifactVersion,
    };
  }
}

export const executivePresentationComposer = new ExecutivePresentationComposer();
