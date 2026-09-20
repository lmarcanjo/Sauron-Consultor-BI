import { DiscoveryArtifact } from '../discovery/sdk/DiscoveryContracts';
import { QualityArtifact } from '../quality/QualityContracts';
import { EvidenceArtifact, EvidenceMetadata, IncompatibleArtifactsError } from './EvidenceContracts';
import { EvidenceCollector } from './EvidenceCollector';
import { EvidenceFingerprintBuilder } from './EvidenceFingerprintBuilder';
import { auditEngine } from '../audit/AuditEngine';
import { dispatchPlatformEvent } from '../events/PlatformEvents';

export class EvidenceEngine {
  private static readonly DEFAULT_MAX_EVIDENCES = 1000;

  public consolidate(
    discoveryArtifact: DiscoveryArtifact,
    qualityArtifact: QualityArtifact,
    maxLimit: number = EvidenceEngine.DEFAULT_MAX_EVIDENCES
  ): EvidenceArtifact {
    // 1. Validação estrita de compatibilidade entre os artefatos de entrada
    if (!discoveryArtifact || !qualityArtifact) {
      throw new IncompatibleArtifactsError("DiscoveryArtifact e QualityArtifact são obrigatórios.");
    }

    if (discoveryArtifact.dataSourceId !== qualityArtifact.dataSourceId) {
      throw new IncompatibleArtifactsError(
        `dataSourceId incompatível (${discoveryArtifact.dataSourceId} vs ${qualityArtifact.dataSourceId})`
      );
    }

    if (discoveryArtifact.engagementId !== qualityArtifact.engagementId) {
      throw new IncompatibleArtifactsError(
        `engagementId incompatível (${discoveryArtifact.engagementId} vs ${qualityArtifact.engagementId})`
      );
    }

    if (qualityArtifact.discoveryArtifactId !== discoveryArtifact.artifactId) {
      throw new IncompatibleArtifactsError(
        `discoveryArtifactId incompatível (${qualityArtifact.discoveryArtifactId} vs ${discoveryArtifact.artifactId})`
      );
    }

    // 2. Coleta e consolidação/deduplicação de evidências
    const discoveryEvidences = EvidenceCollector.collectFromDiscovery(discoveryArtifact);
    const qualityEvidences = EvidenceCollector.collectFromQuality(qualityArtifact, discoveryArtifact);
    const consolidatedEvidences = EvidenceCollector.deduplicateAndConsolidate(discoveryEvidences, qualityEvidences);

    const totalCount = consolidatedEvidences.length;
    const isTruncated = totalCount > maxLimit;
    const finalEvidences = isTruncated ? consolidatedEvidences.slice(0, maxLimit) : consolidatedEvidences;

    const metadata: EvidenceMetadata = {
      totalEvidenceCount: totalCount,
      includedEvidenceCount: finalEvidences.length,
      truncated: isTruncated,
      truncationReason: isTruncated
        ? `O limite máximo configurado de ${maxLimit} evidências foi atingido.`
        : undefined,
      maxEvidenceLimit: maxLimit
    };

    // 3. Construção do Fingerprint Determinístico
    const fingerprint = EvidenceFingerprintBuilder.build(
      discoveryArtifact.fingerprint.structuralFingerprint,
      qualityArtifact.artifactId,
      finalEvidences
    );

    // 4. Criação do Artefato com Imutabilidade Garantida (Object.freeze)
    const evidenceArtifact: EvidenceArtifact = Object.freeze({
      artifactId: `evid_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      discoveryArtifactId: discoveryArtifact.artifactId,
      qualityArtifactId: qualityArtifact.artifactId,
      dataSourceId: discoveryArtifact.dataSourceId,
      engagementId: discoveryArtifact.engagementId,
      evidences: Object.freeze(finalEvidences),
      fingerprint: Object.freeze(fingerprint),
      metadata: Object.freeze(metadata),
      totalEvidencesCount: totalCount,
      evaluatedAt: new Date().toISOString()
    });

    // 5. Auditoria e Emissão Exclusiva do Evento Factual Próprio (EVIDENCE_ARTIFACT_GENERATED)
    auditEngine.logEvent(
      "DATA_SOURCE_DISCOVERY_COMPLETED",
      `Consolidação de Evidências concluída pelo EvidenceEngine para a fonte ${discoveryArtifact.dataSourceId} (Total: ${totalCount} evidências)`,
      "INFO",
      {}
    );

    dispatchPlatformEvent("EVIDENCE_ARTIFACT_GENERATED", {
      artifactId: evidenceArtifact.artifactId,
      dataSourceId: evidenceArtifact.dataSourceId,
      engagementId: evidenceArtifact.engagementId,
      totalEvidencesCount: totalCount
    });

    return evidenceArtifact;
  }
}
