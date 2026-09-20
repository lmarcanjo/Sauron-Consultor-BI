import { BusinessArtifact } from './BusinessArtifactContracts';

export class BusinessArtifactFingerprintBuilder {
  /**
   * Constrói fingerprint determinístico independente da ordem dos elementos de array
   */
  public static buildFingerprint(artifact: Omit<BusinessArtifact, 'fingerprint'>): string {
    const canonicalPayload = {
      engineId: artifact.engineId,
      engineVersion: artifact.engineVersion,
      sdkVersion: artifact.sdkVersion,
      dataSourceIds: [...artifact.dataSourceIds].sort(),
      engagementId: artifact.engagementId,
      schemaVersions: [...artifact.schemaVersionReferences].sort((a, b) => a.dataSourceId.localeCompare(b.dataSourceId)),
      trustArtifactIds: [...artifact.trustArtifactIds].sort(),
      scope: artifact.analysisScope,
      observationsCount: artifact.businessObservations.length,
      metricsCount: artifact.calculatedMetrics.length,
      comparisonsCount: artifact.comparisons.length,
      findingsCount: artifact.findings.length,
      risksCount: artifact.risks.length,
      opportunitiesCount: artifact.opportunities.length,
      hypothesesCount: artifact.actionHypotheses.length,
      unresolvedQuestionsCount: artifact.unresolvedBusinessQuestions.length,
      limitations: [...artifact.limitations].sort()
    };

    const str = JSON.stringify(canonicalPayload);
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return `fnv1a_${(hash >>> 0).toString(16)}`;
  }

  public static buildFingerprintMetadata(artifact: Omit<BusinessArtifact, 'fingerprint'>): {
    artifactHash: string;
    algorithm: string;
    version: string;
    cryptographic: boolean;
    generatedAt: string;
  } {
    const artifactHash = this.buildFingerprint(artifact);
    return {
      artifactHash,
      algorithm: 'FNV1A_32_CANONICAL',
      version: '1.0.0',
      cryptographic: false,
      generatedAt: artifact.generatedAt || new Date().toISOString()
    };
  }
}

