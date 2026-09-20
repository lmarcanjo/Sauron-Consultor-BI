import type { PlatformUser } from "../identity/types";
import type { ExecutiveExportContext, ExecutiveExportProvenance, GeneratedExecutiveFile } from "./ExecutiveDeliverablesTypes";
import { preliminaryFinancialAnalysisService } from "../preliminary-analysis/PreliminaryFinancialAnalysisService";
import { consultantWorkspaceManager } from "../../modules/consultant-workspace/ConsultantWorkspaceManager";
import { buildExportFileName } from "./ExportFileName";
import { buildPptxEntries, createStoredZip } from "./PptxPackage";

export class ExecutivePresentationExportService {
  public async export(context: ExecutiveExportContext, currentUser: PlatformUser | null): Promise<GeneratedExecutiveFile> {
    const artifact = await preliminaryFinancialAnalysisService.getArtifactById(context.artifact.artifactId, currentUser);
    const project = await consultantWorkspaceManager.getActiveProject();
    const persisted = project?.presentations?.find(item => item.id === context.presentation.id);
    if (!artifact || !project || project.id !== artifact.engagementId || !persisted || persisted.artifactFingerprint !== artifact.fingerprint) throw new Error("Você não tem acesso à apresentação ou ela está desatualizada.");
    const generatedAt = new Date().toISOString();
    const provenance: ExecutiveExportProvenance = { engagementId: artifact.engagementId, clientId: artifact.clientId, dataSourceId: artifact.dataSourceId, preliminaryArtifactId: artifact.artifactId, artifactFingerprint: artifact.fingerprint, sourceFingerprint: artifact.sourceFingerprint, presentationId: persisted.id, presentationVersion: persisted.version || artifact.artifactVersion, generatedAt, generatedByUserId: currentUser?.id || artifact.generatedByUserId, exportVersion: "MVP4_PPTX_1" };
    const slides = (persisted.slides || []).map((slide: any) => ({ title: String(slide.title || "Slide"), subtitle: String(slide.subtitle || ""), body: [String(slide.content?.summary || ""), ...(Array.isArray(slide.content?.points) ? slide.content.points.map(String) : []), ...(Array.isArray(slide.content?.data) ? slide.content.data.slice(0, 10).map((item: any) => `${item.categoria || item.label || "Item"}: ${item.valor ?? item.value ?? ""}`) : [])].filter(Boolean) }));
    const bytes = createStoredZip(buildPptxEntries(slides, provenance));
    return { fileName: `${buildExportFileName(project.client, "Apresentacao_Executiva")}.pptx`, mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", bytes, provenance };
  }
}

export const executivePresentationExportService = new ExecutivePresentationExportService();
