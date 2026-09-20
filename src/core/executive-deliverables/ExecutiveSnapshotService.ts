import type { PlatformUser } from "../identity/types";
import type { PreliminaryFinancialAnalysisArtifact } from "../preliminary-analysis/PreliminaryFinancialAnalysisContracts";
import type { ExecutiveSnapshot } from "./ExecutiveDeliverablesTypes";
import { preliminaryFinancialAnalysisService } from "../preliminary-analysis/PreliminaryFinancialAnalysisService";
import { consultantWorkspaceManager } from "../../modules/consultant-workspace/ConsultantWorkspaceManager";

interface SnapshotAnalysisPort {
  getArtifactById(artifactId: string, currentUser: PlatformUser | null): Promise<PreliminaryFinancialAnalysisArtifact | null>;
  getLatestForEngagement(engagementId: string, currentUser: PlatformUser | null): Promise<PreliminaryFinancialAnalysisArtifact | null>;
}

interface SnapshotWorkspacePort {
  getActiveProject(): Promise<Awaited<ReturnType<typeof consultantWorkspaceManager.getActiveProject>>>;
  updateProject(project: NonNullable<Awaited<ReturnType<typeof consultantWorkspaceManager.getActiveProject>>>): Promise<void>;
}

export class ExecutiveSnapshotService {
  constructor(
    private readonly analysis: SnapshotAnalysisPort = preliminaryFinancialAnalysisService,
    private readonly workspace: SnapshotWorkspacePort = consultantWorkspaceManager,
  ) {}

  public async createSnapshot(input: { artifact: PreliminaryFinancialAnalysisArtifact; presentationId: string; label: string }, currentUser: PlatformUser | null): Promise<ExecutiveSnapshot> {
    const artifact = await this.analysis.getArtifactById(input.artifact.artifactId, currentUser);
    const project = await this.workspace.getActiveProject();
    if (!artifact || !project || project.id !== artifact.engagementId || !project.presentations?.some(item => item.id === input.presentationId && item.artifactFingerprint === artifact.fingerprint)) {
      throw new Error("Você não tem acesso a esta análise executiva.");
    }
    const now = new Date().toISOString();
    const snapshots = project.executiveSnapshots || [];
    const snapshot: ExecutiveSnapshot = {
      snapshotId: `executive_snapshot_${Date.now()}_${artifact.artifactId}`,
      clientId: artifact.clientId,
      engagementId: artifact.engagementId,
      dataSourceId: artifact.dataSourceId,
      preliminaryArtifactId: artifact.artifactId,
      presentationId: input.presentationId,
      sourceFingerprint: artifact.sourceFingerprint,
      artifactFingerprint: artifact.fingerprint,
      createdAt: now,
      createdBy: currentUser?.id || artifact.generatedByUserId,
      status: "CURRENT",
      label: input.label.trim() || `Análise ${new Date(now).toLocaleDateString("pt-BR")}`,
      version: snapshots.length + 1,
    };
    const next = snapshots.map(item => item.engagementId === snapshot.engagementId && item.artifactFingerprint !== snapshot.artifactFingerprint ? { ...item, status: "OUTDATED" as const } : item);
    await this.workspace.updateProject({ ...project, executiveSnapshots: [...next, snapshot] });
    return snapshot;
  }

  public async listSnapshots(engagementId: string, currentUser: PlatformUser | null): Promise<ExecutiveSnapshot[]> {
    const project = await this.workspace.getActiveProject();
    if (!project || project.id !== engagementId) throw new Error("Engajamento não autorizado.");
    await this.analysis.getLatestForEngagement(engagementId, currentUser);
    return [...(project.executiveSnapshots || [])].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  public async getSnapshot(snapshotId: string, currentUser: PlatformUser | null): Promise<ExecutiveSnapshot | null> {
    const project = await this.workspace.getActiveProject();
    const snapshot = project?.executiveSnapshots?.find(item => item.snapshotId === snapshotId) || null;
    if (!snapshot) return null;
    await this.analysis.getArtifactById(snapshot.preliminaryArtifactId, currentUser);
    if (project?.id !== snapshot.engagementId) throw new Error("Engajamento não autorizado.");
    return snapshot;
  }
}

export const executiveSnapshotService = new ExecutiveSnapshotService();
