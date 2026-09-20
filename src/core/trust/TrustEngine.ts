import {
  TrustArtifact,
  TrustEvaluationInput,
  IncompatibleTrustArtifactsError,
  TrustDimensionAssessment,
  UsageAssessment,
  TrustFinding,
  BlockingCondition,
  TrustState,
  CertifiableUsageType,
  TrustDimensionType,
  TrustFingerprint
} from './TrustContracts';
import { TrustPolicy, CANONICAL_TRUST_POLICY_V1 } from './TrustPolicy';

export class TrustFingerprintBuilder {
  public static buildFingerprint(
    dataSourceId: string,
    overallState: TrustState,
    blockingConditions: readonly BlockingCondition[],
    dimensionAssessments: readonly TrustDimensionAssessment[],
    usageAssessments: readonly UsageAssessment[]
  ): TrustFingerprint {
    // Sort array elements deterministically to guarantee order independence
    const sortedBlockers = [...blockingConditions].map(b => b.code).sort().join(',');
    const sortedDimensions = [...dimensionAssessments].map(d => `${d.dimension}:${d.status}:${d.score ?? 'none'}`).sort().join(';');
    const sortedUsages = [...usageAssessments].map(u => `${u.usageType}:${u.status}:${u.score ?? 'none'}`).sort().join(';');

    const rawString = `ds=${dataSourceId}|state=${overallState}|blockers=[${sortedBlockers}]|dims=[${sortedDimensions}]|usages=[${sortedUsages}]`;
    const trustHash = this.fnv1aHash(rawString);

    return Object.freeze({
      trustHash: `trust_fnv1a_${trustHash}`,
      algorithm: 'FNV-1a 32-bit Deterministic Canonical',
      generatedAt: new Date().toISOString()
    });
  }

  private static fnv1aHash(str: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(16);
  }
}

export class TrustEngine {
  private readonly ENGINE_VERSION = '1.0.0-HARDENED';
  private readonly policy: TrustPolicy;
  private readonly clock: () => Date;

  constructor(policy: TrustPolicy = CANONICAL_TRUST_POLICY_V1, customClock?: () => Date) {
    this.policy = policy;
    this.clock = customClock || (() => new Date());
  }

  /**
   * Avalia a aptidão e confiabilidade de um DataSource deterministicamente sem side-effects
   */
  public evaluate(input: TrustEvaluationInput): TrustArtifact {
    const startTime = Date.now();
    this.validateArtifactCompatibility(input);

    const { dataSource, discoveryArtifact, qualityArtifact, evidenceArtifact, semanticArtifact, semanticConfirmationArtifact } = input;

    const blockingConditions: BlockingCondition[] = [];
    const findings: TrustFinding[] = [];
    const limitations: string[] = [];

    const now = this.clock();
    const evaluatedAt = now.toISOString();

    // --- 1. Avalia Bloqueios Globais ---

    // 1.1 Estado do DataSource
    const isSourceReady = dataSource.derivedCanonicalState === 'READY';
    if (!isSourceReady) {
      blockingConditions.push({
        code: 'SOURCE_NOT_READY',
        severity: 'CRITICAL',
        affectedDimensions: ['OPERATIONAL_HEALTH', 'LINEAGE_READINESS', 'HUMAN_CONFIRMATION'],
        affectedUsages: ['EXECUTIVE_PRESENTATION', 'FINANCIAL_ANALYSIS', 'OPERATIONAL_DIAGNOSIS', 'EXTERNAL_REPORTING', 'AUTOMATED_DECISION_SUPPORT'],
        supportingEvidenceIds: [dataSource.id],
        remediationHint: 'Conclua a descoberta e confirmação semântica para avançar o DataSource para READY.',
        explanation: `O DataSource encontra-se no estado ${dataSource.derivedCanonicalState}, pendente de homologação.`
      });
      findings.push({
        id: 'tf_ds_not_ready',
        category: 'BLOCKER',
        message: `O DataSource ${dataSource.id} não está no estado operacional READY (estado atual: ${dataSource.derivedCanonicalState}).`,
        affectedDimensions: ['OPERATIONAL_HEALTH'],
        affectedUsages: ['EXECUTIVE_PRESENTATION', 'FINANCIAL_ANALYSIS'],
        supportingEvidenceIds: [dataSource.id],
        sourceArtifact: 'DATA_SOURCE'
      });
    }

    // 1.2 Artefatos Ausentes Obrigatórios Globais
    if (!discoveryArtifact) {
      blockingConditions.push({
        code: 'INSUFFICIENT_EVIDENCE',
        severity: 'CRITICAL',
        affectedDimensions: ['STRUCTURAL_INTEGRITY', 'LINEAGE_READINESS'],
        affectedUsages: ['EXPLORATORY_ANALYSIS', 'INTERNAL_MONITORING', 'EXECUTIVE_PRESENTATION', 'FINANCIAL_ANALYSIS', 'OPERATIONAL_DIAGNOSIS', 'EXTERNAL_REPORTING', 'AUTOMATED_DECISION_SUPPORT'],
        supportingEvidenceIds: [dataSource.id],
        remediationHint: 'Execute a descoberta física da fonte via DiscoveryEngine.',
        explanation: 'DiscoveryArtifact ausente. Não é possível validar a estrutura física.'
      });
    }

    // 1.3 Confirmação Semântica Invalidadas ou Pendentes
    if (semanticConfirmationArtifact) {
      if (semanticConfirmationArtifact.overallStatus === 'INVALIDATED') {
        blockingConditions.push({
          code: 'CONFIRMATION_INVALIDATED',
          severity: 'CRITICAL',
          affectedDimensions: ['HUMAN_CONFIRMATION', 'SEMANTIC_COVERAGE'],
          affectedUsages: ['EXECUTIVE_PRESENTATION', 'FINANCIAL_ANALYSIS', 'EXTERNAL_REPORTING', 'AUTOMATED_DECISION_SUPPORT'],
          supportingEvidenceIds: [semanticConfirmationArtifact.artifactId],
          remediationHint: 'Execute uma nova rodada de confirmação para o novo schema vigente.',
          explanation: 'A confirmação semântica foi invalidada por uma atualização de schema.'
        });
      } else if (semanticConfirmationArtifact.overallStatus !== 'CONFIRMED') {
        blockingConditions.push({
          code: 'MATERIAL_DECISIONS_PENDING',
          severity: 'HIGH',
          affectedDimensions: ['HUMAN_CONFIRMATION'],
          affectedUsages: ['FINANCIAL_ANALYSIS', 'EXTERNAL_REPORTING', 'AUTOMATED_DECISION_SUPPORT'],
          supportingEvidenceIds: [semanticConfirmationArtifact.artifactId],
          remediationHint: 'Resolva a revisão de todos os campos materiais pendentes.',
          explanation: `A confirmação semântica está com o status ${semanticConfirmationArtifact.overallStatus}.`
        });
      }
    }

    // 1.4 Regra de Amostragem Conservadora (Amostra Absoluta vs Ratio)
    const samplingRatio = evidenceArtifact?.metadata?.includedEvidenceCount ? (evidenceArtifact.metadata.includedEvidenceCount / (evidenceArtifact.metadata.totalEvidenceCount || 1)) : 1;
    const sampledRows = evidenceArtifact?.metadata?.includedEvidenceCount ?? 1000;
    const totalObservedRows = evidenceArtifact?.metadata?.totalEvidenceCount ?? 1000;
    const { minimumRatioForFullTrust, minimumAbsoluteRows } = this.policy.samplingRules;

    if (samplingRatio < minimumRatioForFullTrust && sampledRows < minimumAbsoluteRows) {
      limitations.push(`Amostragem limitada (${sampledRows} de ${totalObservedRows} linhas, ratio: ${(samplingRatio * 100).toFixed(1)}%).`);
      findings.push({
        id: 'tf_low_sampling',
        category: 'LIMITATION',
        message: `A amostragem de evidências é de ${(samplingRatio * 100).toFixed(1)}% (${sampledRows} linhas).`,
        affectedDimensions: ['EVIDENCE_COVERAGE'],
        affectedUsages: ['FINANCIAL_ANALYSIS', 'EXTERNAL_REPORTING'],
        supportingEvidenceIds: [evidenceArtifact!.artifactId],
        sourceArtifact: 'EVIDENCE'
      });
    }

    // 1.5 Regra de Recência da Sincronização (STALE_SYNCHRONIZATION)
    const lastSync = dataSource.syncHistory[dataSource.syncHistory.length - 1];
    if (lastSync) {
      const lastSyncDate = new Date(lastSync.startedAt);
      const hoursDiff = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > this.policy.stalenessRules.maxStaleHoursForExecutive) {
        blockingConditions.push({
          code: 'STALE_SYNCHRONIZATION',
          severity: 'HIGH',
          affectedDimensions: ['SYNCHRONIZATION_RECENCY'],
          affectedUsages: ['EXECUTIVE_PRESENTATION', 'FINANCIAL_ANALYSIS', 'AUTOMATED_DECISION_SUPPORT'],
          supportingEvidenceIds: [dataSource.id],
          remediationHint: 'Execute uma nova sincronização com a fonte física.',
          explanation: `A última sincronização ocorreu há ${Math.round(hoursDiff)} horas, excedendo o limite de ${this.policy.stalenessRules.maxStaleHoursForExecutive} horas.`
        });
      }
    }

    // --- 2. Avalia Dimensões com Pesos Versionados da Política ---
    const dimensionAssessments = this.evaluateDimensions(input, blockingConditions, limitations, evaluatedAt);

    // --- 3. Avalia Aptidão por Uso com Requisitos Mínimos da Política ---
    const usageAssessments = this.evaluateUsages(input, dimensionAssessments, blockingConditions);

    // --- 4. Cálculo Ponderado Normalizado do OverallScore [0, 1] ---
    let overallState: TrustState = 'TRUSTED';

    if (blockingConditions.some(b => b.severity === 'CRITICAL')) {
      overallState = 'BLOCKED';
    } else if (blockingConditions.some(b => b.severity === 'HIGH')) {
      overallState = 'LIMITED';
    } else if (limitations.length > 0) {
      overallState = 'CONDITIONALLY_TRUSTED';
    }

    // Score ponderado via dimensionWeights da TrustPolicy
    let weightedScoreSum = 0;
    let totalWeightSum = 0;

    for (const wConfig of this.policy.dimensionWeights) {
      const dim = dimensionAssessments.find(d => d.dimension === wConfig.dimension);
      if (dim && dim.score !== undefined && dim.status !== 'NOT_ASSESSED') {
        weightedScoreSum += dim.score * wConfig.weight;
        totalWeightSum += wConfig.weight;
      }
    }

    let rawScore = totalWeightSum > 0 ? weightedScoreSum / totalWeightSum : 0.5;
    if (overallState === 'BLOCKED') {
      rawScore = Math.min(rawScore, 0.30); // Prevalência estrita de bloqueio crítico sobre score
    }

    const overallScore = this.clamp(rawScore, 0, 1);
    const isUsableForAny = usageAssessments.some(u => u.status === 'TRUSTED' || u.status === 'CONDITIONALLY_TRUSTED' || u.status === 'LIMITED');
    const primaryBlockingReason = blockingConditions.length > 0 ? blockingConditions[0].explanation : undefined;

    const currentSchemaVersionNumber = dataSource.currentSchemaVersion?.versionNumber ?? 1;

    const fingerprint = TrustFingerprintBuilder.buildFingerprint(
      dataSource.id,
      overallState,
      blockingConditions,
      dimensionAssessments,
      usageAssessments
    );

    const scoreSuppressed = overallState === 'BLOCKED';
    const scoreSuppressionReason = scoreSuppressed
      ? 'Score numérico suprimido na comunicação porque a fonte possui um bloqueio crítico de governança.'
      : undefined;

    return Object.freeze({
      artifactId: `trust_${dataSource.id}_v${currentSchemaVersionNumber}_${now.getTime()}`,
      dataSourceId: dataSource.id,
      engagementId: dataSource.engagementId,
      schemaVersionNumber: currentSchemaVersionNumber,

      discoveryArtifactId: discoveryArtifact?.artifactId,
      qualityArtifactId: qualityArtifact?.artifactId,
      evidenceArtifactId: evidenceArtifact?.artifactId,
      semanticArtifactId: semanticArtifact?.artifactId,
      semanticConfirmationArtifactId: semanticConfirmationArtifact?.artifactId,

      trustAssessment: Object.freeze({
        overallState,
        overallScore,
        scoreSuppressed,
        scoreSuppressionReason,
        isUsableForAny,
        primaryBlockingReason
      }),

      dimensionAssessments: Object.freeze(dimensionAssessments),
      usageAssessments: Object.freeze(usageAssessments),
      trustFindings: Object.freeze(findings),
      blockingConditions: Object.freeze(blockingConditions),
      limitations: Object.freeze(limitations),

      provenance: Object.freeze({
        dataSourceId: dataSource.id,
        engagementId: dataSource.engagementId,
        schemaVersionNumber: currentSchemaVersionNumber,
        policyId: this.policy.policyId,
        policyVersion: this.policy.version,
        discoveryArtifactId: discoveryArtifact?.artifactId,
        qualityArtifactId: qualityArtifact?.artifactId,
        evidenceArtifactId: evidenceArtifact?.artifactId,
        semanticArtifactId: semanticArtifact?.artifactId,
        semanticConfirmationArtifactId: semanticConfirmationArtifact?.artifactId
      }),

      metadata: Object.freeze({
        engineVersion: this.ENGINE_VERSION,
        policyId: this.policy.policyId,
        policyVersion: this.policy.version,
        rulesAppliedCount: this.policy.usageRequirements.length + 8,
        totalFindingsCount: findings.length,
        executionDurationMs: Date.now() - startTime
      }),

      fingerprint,
      evaluatedAt,
      version: 1
    });
  }

  private validateArtifactCompatibility(input: TrustEvaluationInput): void {
    const { dataSource, discoveryArtifact, qualityArtifact, evidenceArtifact, semanticArtifact, semanticConfirmationArtifact } = input;

    const targetDsId = dataSource.id;
    const targetEngagementId = dataSource.engagementId;
    const targetSchemaVersion = dataSource.currentSchemaVersion?.versionNumber ?? 0;

    const artifactsToCheck = [
      { name: 'DiscoveryArtifact', art: discoveryArtifact },
      { name: 'QualityArtifact', art: qualityArtifact },
      { name: 'EvidenceArtifact', art: evidenceArtifact },
      { name: 'SemanticArtifact', art: semanticArtifact },
      { name: 'SemanticConfirmationArtifact', art: semanticConfirmationArtifact }
    ];

    for (const item of artifactsToCheck) {
      if (item.art) {
        if (item.art.dataSourceId !== targetDsId) {
          throw new IncompatibleTrustArtifactsError(
            `Artefato ${item.name} pertence ao dataSourceId ${item.art.dataSourceId}, divergente de ${targetDsId}.`
          );
        }
        if (item.art.engagementId !== targetEngagementId) {
          throw new IncompatibleTrustArtifactsError(
            `Artefato ${item.name} pertence ao engagementId ${item.art.engagementId}, divergente de ${targetEngagementId}.`
          );
        }
        const itemSchemaVersion = (item.art as any).schemaVersionNumber ?? 1;
        if (itemSchemaVersion !== targetSchemaVersion) {
          throw new IncompatibleTrustArtifactsError(
            `Artefato ${item.name} possui schemaVersionNumber ${itemSchemaVersion}, divergente do vigente (${targetSchemaVersion}).`
          );
        }
      }
    }
  }

  private evaluateDimensions(
    input: TrustEvaluationInput,
    globalBlockers: readonly BlockingCondition[],
    globalLimitations: readonly string[],
    evaluatedAt: string
  ): TrustDimensionAssessment[] {

    // 1. STRUCTURAL_INTEGRITY
    const structBlockers = globalBlockers.filter(b => b.affectedDimensions.includes('STRUCTURAL_INTEGRITY')).map(b => b.explanation);
    const structStatus: TrustState = structBlockers.length > 0 ? 'BLOCKED' : input.discoveryArtifact ? 'TRUSTED' : 'INSUFFICIENT_EVIDENCE';
    const structScore = this.clamp(input.discoveryArtifact ? (structStatus === 'TRUSTED' ? 1.0 : 0.2) : 0.0, 0, 1);

    // 2. DATA_QUALITY
    const qualBlockers = globalBlockers.filter(b => b.affectedDimensions.includes('DATA_QUALITY')).map(b => b.explanation);
    let qualScore = 0.5;
    let qualStatus: TrustState = 'NOT_ASSESSED';
    if (input.qualityArtifact) {
      qualScore = input.qualityArtifact.overallQualityScore ?? 0.8;
      qualStatus = qualBlockers.length > 0 ? 'BLOCKED' : qualScore >= 0.7 ? 'TRUSTED' : 'LIMITED';
    }

    // 3. SEMANTIC_COVERAGE
    const semScore = input.semanticArtifact ? 0.85 : 0.0;
    const semStatus: TrustState = input.semanticArtifact ? 'TRUSTED' : 'INSUFFICIENT_EVIDENCE';

    // 4. HUMAN_CONFIRMATION
    const humBlockers = globalBlockers.filter(b => b.affectedDimensions.includes('HUMAN_CONFIRMATION')).map(b => b.explanation);
    let humStatus: TrustState = 'NOT_ASSESSED';
    let humScore = 0.0;
    if (input.semanticConfirmationArtifact) {
      if (input.semanticConfirmationArtifact.overallStatus === 'CONFIRMED') {
        humStatus = 'TRUSTED';
        humScore = 1.0;
      } else if (input.semanticConfirmationArtifact.overallStatus === 'INVALIDATED') {
        humStatus = 'INVALIDATED';
        humScore = 0.0;
      } else {
        humStatus = 'LIMITED';
        humScore = 0.5;
      }
    }
    if (humBlockers.length > 0) humStatus = 'BLOCKED';

    // 5. EVIDENCE_COVERAGE
    const evStatus: TrustState = input.evidenceArtifact ? (globalLimitations.length > 0 ? 'CONDITIONALLY_TRUSTED' : 'TRUSTED') : 'INSUFFICIENT_EVIDENCE';
    const evScore = input.evidenceArtifact ? 0.9 : 0.0;

    // 6. SCHEMA_STABILITY
    const stabStatus: TrustState = input.dataSource.schemaHistory.length <= 1 ? 'TRUSTED' : 'CONDITIONALLY_TRUSTED';
    const stabScore = 0.9;

    // 7. SYNCHRONIZATION_RECENCY
    const syncStatus: TrustState = input.dataSource.syncHistory.length > 0 ? 'TRUSTED' : 'CONDITIONALLY_TRUSTED';
    const syncScore = 0.85;

    // 8. LINEAGE_READINESS
    const linStatus: TrustState = input.discoveryArtifact && input.semanticArtifact ? 'TRUSTED' : 'LIMITED';
    const linScore = input.discoveryArtifact && input.semanticArtifact ? 0.95 : 0.4;

    // 9. OPERATIONAL_HEALTH
    const opBlockers = globalBlockers.filter(b => b.affectedDimensions.includes('OPERATIONAL_HEALTH')).map(b => b.explanation);
    const opStatus: TrustState = opBlockers.length > 0 ? 'BLOCKED' : input.dataSource.healthStatus === 'HEALTHY' ? 'TRUSTED' : 'LIMITED';
    const opScore = opStatus === 'TRUSTED' ? 1.0 : opStatus === 'BLOCKED' ? 0.1 : 0.6;

    return [
      { dimension: 'STRUCTURAL_INTEGRITY', status: structStatus, score: this.clamp(structScore, 0, 1), supportingEvidenceIds: [], blockingReasons: structBlockers, limitations: [], explanation: 'Estrutura física observada e catalogada.', evaluatedAt },
      { dimension: 'DATA_QUALITY', status: qualStatus, score: this.clamp(qualScore, 0, 1), supportingEvidenceIds: [], blockingReasons: qualBlockers, limitations: globalLimitations, explanation: 'Integridade estocástica e física observada.', evaluatedAt },
      { dimension: 'SEMANTIC_COVERAGE', status: semStatus, score: this.clamp(semScore, 0, 1), supportingEvidenceIds: [], blockingReasons: [], limitations: [], explanation: 'Interpretação semântica determinística.', evaluatedAt },
      { dimension: 'HUMAN_CONFIRMATION', status: humStatus, score: this.clamp(humScore, 0, 1), supportingEvidenceIds: [], blockingReasons: humBlockers, limitations: [], explanation: 'Decisão do consultor sobre os campos materiais.', evaluatedAt },
      { dimension: 'EVIDENCE_COVERAGE', status: evStatus, score: this.clamp(evScore, 0, 1), supportingEvidenceIds: [], blockingReasons: [], limitations: globalLimitations, explanation: 'Evidências físicas e estatísticas consolidadas.', evaluatedAt },
      { dimension: 'SCHEMA_STABILITY', status: stabStatus, score: this.clamp(stabScore, 0, 1), supportingEvidenceIds: [], blockingReasons: [], limitations: [], explanation: 'Estabilidade da versão de schema.', evaluatedAt },
      { dimension: 'SYNCHRONIZATION_RECENCY', status: syncStatus, score: this.clamp(syncScore, 0, 1), supportingEvidenceIds: [], blockingReasons: [], limitations: [], explanation: 'Recorrência de sincronização da fonte.', evaluatedAt },
      { dimension: 'LINEAGE_READINESS', status: linStatus, score: this.clamp(linScore, 0, 1), supportingEvidenceIds: [], blockingReasons: [], limitations: [], explanation: 'Rastreabilidade de linhagem pronta.', evaluatedAt },
      { dimension: 'OPERATIONAL_HEALTH', status: opStatus, score: this.clamp(opScore, 0, 1), supportingEvidenceIds: [], blockingReasons: opBlockers, limitations: [], explanation: 'Saúde operacional do conector.', evaluatedAt }
    ];
  }

  private evaluateUsages(
    input: TrustEvaluationInput,
    dimensions: readonly TrustDimensionAssessment[],
    globalBlockers: readonly BlockingCondition[]
  ): UsageAssessment[] {
    const usages: CertifiableUsageType[] = [
      'EXPLORATORY_ANALYSIS',
      'INTERNAL_MONITORING',
      'EXECUTIVE_PRESENTATION',
      'FINANCIAL_ANALYSIS',
      'OPERATIONAL_DIAGNOSIS',
      'EXTERNAL_REPORTING',
      'AUTOMATED_DECISION_SUPPORT'
    ];

    return usages.map(u => {
      const affectingBlockers = globalBlockers.filter(b => b.affectedUsages.includes(u));
      let status: TrustState = 'TRUSTED';

      if (affectingBlockers.some(b => b.severity === 'CRITICAL')) {
        status = 'BLOCKED';
      } else if (affectingBlockers.some(b => b.severity === 'HIGH')) {
        status = 'LIMITED';
      } else if (u === 'FINANCIAL_ANALYSIS' || u === 'EXTERNAL_REPORTING' || u === 'AUTOMATED_DECISION_SUPPORT') {
        const humDim = dimensions.find(d => d.dimension === 'HUMAN_CONFIRMATION');
        if (!humDim || humDim.status !== 'TRUSTED') {
          status = 'LIMITED';
        }
      }

      const score = status === 'TRUSTED' ? 0.95 : status === 'LIMITED' ? 0.6 : status === 'BLOCKED' ? 0.1 : 0.8;

      return Object.freeze({
        usageType: u,
        status,
        score: this.clamp(score, 0, 1),
        requiredDimensions: Object.freeze(['STRUCTURAL_INTEGRITY' as TrustDimensionType, 'HUMAN_CONFIRMATION' as TrustDimensionType]),
        satisfiedConditions: Object.freeze(status === 'TRUSTED' ? ['Schema homogêneo', 'Confirmação humana ativa'] : []),
        blockingConditions: Object.freeze(affectingBlockers),
        limitations: Object.freeze(status === 'LIMITED' ? ['Requer supervisão do consultor para este uso.'] : []),
        explanation: `Aptidão para ${u}: status ${status}.`,
        evidenceIds: Object.freeze([])
      });
    });
  }

  private clamp(val: number, min: number, max: number): number {
    if (Number.isNaN(val) || !Number.isFinite(val)) return min;
    return Math.min(Math.max(val, min), max);
  }
}
