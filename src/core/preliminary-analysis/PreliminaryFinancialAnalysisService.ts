/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreliminaryFinancialAnalysisArtifact, PreliminaryFinancialAnalysisStatus } from "./PreliminaryFinancialAnalysisContracts";
import { IPreliminaryFinancialAnalysisRepository } from "./PreliminaryFinancialAnalysisRepository";
import { PreliminaryDatasetReader } from "./PreliminaryDatasetReader";
import { PreliminaryFieldResolver } from "./PreliminaryFieldResolver";
import { PreliminaryMetricsCalculator } from "./PreliminaryMetricsCalculator";
import { PreliminaryGroupingBuilder } from "./PreliminaryGroupingBuilder";
import { PreliminaryTemporalSeriesBuilder } from "./PreliminaryTemporalSeriesBuilder";
import { PRELIMINARY_POLICY_V1, PreliminaryFinancialAnalysisPolicy } from "./PreliminaryFinancialAnalysisPolicy";
import { WorkspaceRepository } from "../../modules/consultant-workspace/WorkspaceRepository";
import { ClientService } from "../../modules/consultant-workspace/ClientService";
import { EngagementService } from "../../modules/consultant-workspace/EngagementService";
import { PlatformUser } from "../identity/types";
import { auditEngine } from "../audit/AuditEngine";
import { dispatchPlatformEvent } from "../events/PlatformEvents";
import { preliminaryFinancialAnalysisRepository } from "./PreliminaryFinancialAnalysisRepository";
import { SpreadsheetPreliminaryDatasetReader } from "../../adapters/preliminary-analysis/SpreadsheetPreliminaryDatasetReader";

export class PreliminaryFinancialAnalysisService {
  private readonly clientService: ClientService;
  private readonly engagementService: EngagementService;

  constructor(
    private readonly repository: IPreliminaryFinancialAnalysisRepository,
    private readonly datasetReader: PreliminaryDatasetReader,
    private readonly workspaceRepository: WorkspaceRepository = new WorkspaceRepository()
  ) {
    this.clientService = new ClientService(this.workspaceRepository);
    this.engagementService = new EngagementService(this.workspaceRepository);
  }

  private async authorizeEngagement(engagementId: string, user: PlatformUser | null): Promise<void> {
    const project = await this.engagementService.getEngagementById(engagementId, user);
    if (!project) {
      throw new Error(`Acesso negado ao engajamento ID ${engagementId}.`);
    }
  }

  public async getArtifactById(artifactId: string, currentUser: PlatformUser | null): Promise<PreliminaryFinancialAnalysisArtifact | null> {
    const artifact = await this.repository.findById(artifactId);
    if (!artifact) return null;
    await this.authorizeEngagement(artifact.engagementId, currentUser);
    return artifact;
  }

  public async getLatestForEngagement(engagementId: string, currentUser: PlatformUser | null): Promise<PreliminaryFinancialAnalysisArtifact | null> {
    await this.authorizeEngagement(engagementId, currentUser);
    return await this.repository.findLatestByEngagement(engagementId);
  }

  public async getHistory(dataSourceId: string, currentUser: PlatformUser | null): Promise<readonly PreliminaryFinancialAnalysisArtifact[]> {
    const history = await this.repository.findHistoryByDataSource(dataSourceId);
    if (history.length === 0) return [];
    // Authorize against the first one
    await this.authorizeEngagement(history[0].engagementId, currentUser);
    return history;
  }

  public async invalidate(artifactId: string, reason: string, currentUser: PlatformUser | null): Promise<void> {
    const artifact = await this.getArtifactById(artifactId, currentUser);
    if (!artifact) {
      throw new Error(`Artefato ${artifactId} não encontrado para invalidação.`);
    }
    await this.repository.invalidate(artifactId, reason);
    dispatchPlatformEvent("PRELIMINARY_ANALYSIS_INVALIDATED", { artifactId, reason });
    auditEngine.logEvent("PRELIMINARY_ANALYSIS_INVALIDATED", `Análise ${artifactId} invalidada. Motivo: ${reason}`, "WARNING", {
      user: currentUser?.profile?.fullName || currentUser?.id
    });
  }

  public async analyze(
    input: {
      engagementId: string;
      dataSourceId: string;
      workbookId: string;
      containerId: string;
    },
    currentUser: PlatformUser | null,
    policy: PreliminaryFinancialAnalysisPolicy = PRELIMINARY_POLICY_V1
  ): Promise<PreliminaryFinancialAnalysisArtifact> {
    dispatchPlatformEvent("PRELIMINARY_ANALYSIS_STARTED", input);
    
    // 1. Validate authorization
    await this.authorizeEngagement(input.engagementId, currentUser);

    const project = await this.engagementService.getEngagementById(input.engagementId, currentUser);
    if (!project) {
      throw new Error("Engajamento não encontrado.");
    }

    const clientId = project.clientId || "";
    if (!clientId) {
      dispatchPlatformEvent("PRELIMINARY_ANALYSIS_BLOCKED", { ...input, reason: "MISSING_CLIENT_ID" });
      throw new Error("O Engajamento selecionado deve estar associado a um Cliente válido.");
    }

    // 2. Read dataset physically
    const dataset = await this.datasetReader.readDataset(input);

    // 3. Resolve fields deterministically
    const { resolved: resolvedFields, fieldUsages } = PreliminaryFieldResolver.resolve(dataset.columns, dataset.rows);

    // 4. Calculate core metrics and quality findings
    const provenance = {
      sourceId: input.dataSourceId,
      workbookId: input.workbookId,
      containerId: input.containerId,
      sheetName: input.containerId,
    };
    const { metrics, qualityFindings, counts } = PreliminaryMetricsCalculator.calculate(
      dataset.rows,
      resolvedFields,
      policy.numericParsingRules,
      provenance
    );

    // 5. Build dimension groupings and monthly temporal series
    const groupings = PreliminaryGroupingBuilder.build(
      dataset.rows,
      resolvedFields,
      policy.groupingRules,
      policy.numericParsingRules
    );
    const temporalSeries = PreliminaryTemporalSeriesBuilder.build(
      dataset.rows,
      resolvedFields,
      policy.numericParsingRules,
      policy.dateParsingRules,
      qualityFindings
    );

    // Check if we have compatible values
    const valueMetric = metrics.find((m) => m.code === "VALUE_TOTAL");
    const hasValue = valueMetric && valueMetric.value > 0;

    let status: PreliminaryFinancialAnalysisStatus = "COMPLETED";
    const limitations = [];

    if (!hasValue) {
      status = "BLOCKED";
      limitations.push({
        code: "NO_MONETARY_MEASURE",
        message: "Nenhuma medida monetária utilizável identificada na fonte.",
        severity: "CRITICAL" as const,
      });
      dispatchPlatformEvent("PRELIMINARY_ANALYSIS_BLOCKED", { ...input, reason: "NO_MONETARY_MEASURE" });
    }

    if (qualityFindings.length > 0) {
      status = "COMPLETED_WITH_LIMITATIONS";
      limitations.push({
        code: "DATA_QUALITY_ISSUES",
        message: `Existem ${qualityFindings.length} achados de qualidade nos dados.`,
        severity: "WARNING" as const,
      });
    }

    const fieldUsagesRecord: Record<string, string> = {};
    for (const res of resolvedFields) {
      fieldUsagesRecord[res.targetKey] = res.physicalName;
    }

    // Determine deterministic fingerprint
    const fingerprintContent = JSON.stringify({
      sourceFingerprint: dataset.fingerprint,
      resolvedFields: resolvedFields.map(f => ({ k: f.targetKey, idx: f.physicalColumnIndex })),
      policyFingerprint: policy.fingerprint,
      container: input.containerId,
      columnCount: dataset.columnCount,
      metrics: metrics.map(m => ({ c: m.code, v: m.value })),
      groupings: groupings.map(g => ({ c: g.dimensionCode, cnt: g.totalGroupCount })),
      limitations: limitations.map(l => l.code),
    });
    
    // Hash function (simple FNV1a deterministic hash)
    let hash = 2166136261;
    for (let i = 0; i < fingerprintContent.length; i++) {
      hash ^= fingerprintContent.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    const fingerprint = "prelim_fp_" + (hash >>> 0).toString(16);

    const artifactId = `prelim_art_${Date.now()}_${fingerprint.substring(10)}`;

    const artifact: PreliminaryFinancialAnalysisArtifact = {
      artifactId,
      artifactVersion: 1,
      analysisMode: "PRELIMINARY",
      clientId,
      engagementId: input.engagementId,
      organizationalScope: {
        scopeType: project.companies.length > 0 ? "COMPANY" : "GROUP",
        targetId: project.companies[0] || project.group || "",
      },
      dataSourceId: input.dataSourceId,
      workbookId: input.workbookId,
      containerId: input.containerId,
      sourceFileName: dataset.fileName,
      sourceFingerprint: dataset.fingerprint,
      schemaVersionNumber: 1,
      
      // Counts
      physicalRowCount: counts.physicalRowCount,
      headerRowCount: counts.headerRowCount,
      dataRowCount: counts.dataRowCount,
      validRowCount: counts.validRowCount,
      partiallyValidRowCount: counts.partiallyValidRowCount,
      excludedRowCount: counts.excludedRowCount,
      emptyRowCount: counts.emptyRowCount,
      
      columnCount: dataset.columnCount,
      physicalFields: fieldUsages,
      fieldUsages: fieldUsagesRecord,
      
      metrics,
      groupings,
      temporalSeries,
      qualityFindings,
      limitations,
      
      policyId: policy.policyId,
      policyVersion: policy.version,
      policyFingerprint: policy.fingerprint,
      engineVersion: "1.0.0",
      
      provenance: {
        generatedAt: new Date().toISOString(),
        generatedByUserId: currentUser?.id || "anonymous",
        algorithm: "FNV1A_32_DETERMINISTIC",
      },
      fingerprint,
      generatedAt: new Date().toISOString(),
      generatedByUserId: currentUser?.id || "anonymous",
      status,
    };

    await this.repository.saveVersion(artifact);

    dispatchPlatformEvent("PRELIMINARY_ANALYSIS_ARTIFACT_GENERATED", { artifactId: artifact.artifactId });
    auditEngine.logEvent(
      "PRELIMINARY_ANALYSIS_ARTIFACT_GENERATED",
      `Análise preliminar criada para o engajamento ${input.engagementId}`,
      status === "BLOCKED" ? "CRITICAL" : status === "COMPLETED_WITH_LIMITATIONS" ? "WARNING" : "INFO",
      { user: currentUser?.profile?.fullName || currentUser?.id }
    );

    return artifact;
  }
}

export const preliminaryFinancialAnalysisService = new PreliminaryFinancialAnalysisService(
  preliminaryFinancialAnalysisRepository,
  new SpreadsheetPreliminaryDatasetReader()
);
