import type { PlatformUser } from "../identity/types";
import type { PreliminaryFinancialAnalysisArtifact } from "../preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import type { ExecutivePresentation } from "../business-intelligence/ExecutivePresentationEngine";
import type { WorkspaceProject } from "../../modules/consultant-workspace/types";
import type { ModuleActivationProjection } from "../module-activation/ModuleActivationContracts";
import type { ExecutiveExportContext, ExecutiveExportProvenance, GeneratedExecutiveFile } from "./ExecutiveDeliverablesTypes";
import { buildExportFileName } from "./ExportFileName";
import { preliminaryFinancialAnalysisService } from "../preliminary-analysis/PreliminaryFinancialAnalysisService";
import { consultantWorkspaceManager } from "../../modules/consultant-workspace/ConsultantWorkspaceManager";

const encoder = new TextEncoder();

function ascii(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "?");
}

function escapePdf(value: string): string {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function metric(artifact: PreliminaryFinancialAnalysisArtifact, code: string): number | undefined {
  return artifact.metrics.find(item => item.code === code)?.value;
}

function formatNumber(value: number, unit?: string): string {
  if (unit && ["BRL", "R$", "REAL", "REALS"].includes(unit.toUpperCase())) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  }
  if (!unit || unit.toUpperCase() === "UNKNOWN") return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)} (Moeda nao confirmada)`;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)} ${unit}`;
}

function linesForPage(title: string, lines: string[]): string[] {
  return ["ASTERION", title, "", ...lines.slice(0, 34)];
}

export function buildExecutivePdfPages(context: ExecutiveExportContext): string[][] {
  const { artifact, project, presentation, moduleProjections } = context;
  const unit = artifact.metrics.find(item => item.code === "VALUE_TOTAL")?.unit;
  const total = metric(artifact, "VALUE_TOTAL");
  const paid = metric(artifact, "PAID_VALUE_TOTAL");
  const balance = metric(artifact, "BALANCE_TOTAL");
  const periods = artifact.temporalSeries.flatMap(series => series.items).slice(0, 18)
    .map(item => `${item.periodKey}: ${formatNumber(item.valueTotal, unit)}`);
  const groupingLines = artifact.groupings
    .filter(group => ["SITUATION", "RESULT_CENTER", "ACCOUNT", "PERSON", "PAYMENT_METHOD"].includes(group.dimensionCode))
    .flatMap(group => group.items.slice(0, 8).map(item => `${group.dimensionLabel} - ${item.displayName}: ${formatNumber(item.valueTotal, unit)}`));
  const moduleLines = moduleProjections.map(module => {
    const reason = module.missingRequirements.join(", ") || module.limitations[0] || "";
    return `${module.moduleId}: ${module.status}${reason ? ` - ${reason}` : ""}`;
  });
  const qualityLines = [
    `Linhas fisicas: ${artifact.physicalRowCount}`,
    `Linhas validas: ${artifact.validRowCount}`,
    `Linhas excluidas: ${artifact.excludedRowCount}`,
    `Campos: ${artifact.columnCount}`,
    `Campos nao utilizados: ${artifact.physicalFields.filter(field => field.usageStatus !== "USED").length}`,
    `Findings: ${artifact.qualityFindings.length}`,
    `Limitacoes: ${artifact.limitations.length}`,
    ...artifact.qualityFindings.slice(0, 8).map(item => item.message),
    ...artifact.limitations.slice(0, 8).map(item => item.message),
  ];
  const inventoryLines = [
    `Arquivo: ${artifact.sourceFileName}`,
    `Formato: ${artifact.sourceFileName.split(".").pop()?.toUpperCase() || "ARQUIVO"}`,
    `Workbook: ${artifact.workbookId}`,
    `Container: ${artifact.containerId}`,
    `Schema: ${artifact.schemaVersionNumber}`,
    `Source fingerprint: ${artifact.sourceFingerprint}`,
    `Artifact fingerprint: ${artifact.fingerprint}`,
    `Data source: ${artifact.dataSourceId}`,
    `Campos: ${artifact.physicalFields.map(field => field.displayName || field.physicalName).join(", ")}`,
  ];
  const presentationLines = presentation.slides.map(slide => `${slide.title}: ${slide.subtitle}`);
  return [
    linesForPage("Capa", [`Cliente: ${project.client}`, `Engajamento: ${project.id}`, `Data: ${new Date().toLocaleDateString("pt-BR")}`, `Fonte: ${artifact.sourceFileName}`, "Modo: PRELIMINARY"]),
    linesForPage("Resumo Executivo", [`Registros: ${artifact.validRowCount}`, `Campos: ${artifact.columnCount}`, `Periodo: ${artifact.temporalSeries.flatMap(series => series.items).map(item => item.periodKey).join(" a ") || "Nao disponivel"}`, `Moeda: ${unit || "Moeda nao confirmada"}`, `Valor Total: ${total === undefined ? "Nao disponivel" : formatNumber(total, unit)}`, `Valor Pago: ${paid === undefined ? "Nao disponivel" : formatNumber(paid, unit)}`, `Saldo: ${balance === undefined ? "Nao disponivel" : formatNumber(balance, unit)}`]),
    linesForPage("Visao Financeira", ["Cards e evolucao temporal do artefato", ...periods]),
    linesForPage("Distribuicoes", groupingLines.filter(line => /Situacao|Centro de Resultado/i.test(line))),
    linesForPage("Contas e Pessoas", groupingLines.filter(line => /Conta|Pessoa|Forma de Pagamento/i.test(line))),
    linesForPage("Qualidade dos Dados", qualityLines),
    linesForPage("Inventario da Fonte", inventoryLines),
    linesForPage("Modulos e Limitacoes", [...moduleLines, ...artifact.limitations.map(item => item.message), "Modo PRELIMINARY", ...presentationLines.slice(0, 8)]),
  ];
}

function createPdf(pages: string[][], provenance: ExecutiveExportProvenance): Uint8Array {
  const objects: string[] = [];
  const pageObjectIds = pages.map((_, index) => 3 + index * 2);
  const contentObjectIds = pages.map((_, index) => 4 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  pages.forEach((page, index) => {
    const content = ["BT", "/F1 18 Tf", "50 740 Td", ...page.flatMap((line, lineIndex) => [lineIndex === 0 ? `(${escapePdf(line)}) Tj` : "0 -22 Td", lineIndex === 0 ? "" : `(${escapePdf(line)}) Tj`]), "ET"].filter(Boolean).join("\n");
    objects[pageObjectIds[index]] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 20 0 R >> >> /Contents ${contentObjectIds[index]} 0 R >>`;
    objects[contentObjectIds[index]] = `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`;
  });
  objects[20] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[21] = `<< /Title (ASTERION Executive Delivery) /Author (ASTERION) /Subject (PRELIMINARY) /Keywords (${escapePdf(JSON.stringify(provenance))}) >>`;
  let output = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [0];
  for (let id = 1; id <= 21; id++) {
    offsets[id] = encoder.encode(output).length;
    output += `${id} 0 obj\n${objects[id] || "<< >>"}\nendobj\n`;
  }
  const xrefOffset = encoder.encode(output).length;
  output += `xref\n0 22\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size 22 /Root 1 0 R /Info 21 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return encoder.encode(output);
}

export function buildExecutivePdfBytes(context: ExecutiveExportContext, provenance: ExecutiveExportProvenance): Uint8Array {
  return createPdf(buildExecutivePdfPages(context), provenance);
}

export class ExecutivePdfExportService {
  public async export(context: ExecutiveExportContext, currentUser: PlatformUser | null): Promise<GeneratedExecutiveFile> {
    const artifact = await preliminaryFinancialAnalysisService.getArtifactById(context.artifact.artifactId, currentUser);
    const project = await consultantWorkspaceManager.getActiveProject();
    if (!artifact || !project || project.id !== artifact.engagementId || project.id !== context.project.id) throw new Error("Você não tem acesso a este material executivo.");
    if (artifact.fingerprint !== context.artifact.fingerprint) throw new Error("A análise mudou. Gere uma nova versão antes de exportar.");
    const generatedAt = new Date().toISOString();
    const provenance: ExecutiveExportProvenance = { engagementId: artifact.engagementId, clientId: artifact.clientId, dataSourceId: artifact.dataSourceId, preliminaryArtifactId: artifact.artifactId, artifactFingerprint: artifact.fingerprint, sourceFingerprint: artifact.sourceFingerprint, presentationId: context.presentation.id, presentationVersion: context.presentation.version || artifact.artifactVersion, generatedAt, generatedByUserId: currentUser?.id || artifact.generatedByUserId, exportVersion: "MVP4_PDF_1" };
    return { fileName: `${buildExportFileName(project.client, "Resumo_Executivo")}.pdf`, mimeType: "application/pdf", bytes: buildExecutivePdfBytes({ ...context, artifact, project }, provenance), provenance };
  }
}

export const executivePdfExportService = new ExecutivePdfExportService();
