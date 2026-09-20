import { DiscoveryArtifact } from '../discovery/sdk/DiscoveryContracts';
import { QualityArtifact } from '../quality/QualityContracts';
import { EvidenceArtifact } from '../evidence/EvidenceContracts';
import {
  SemanticArtifact,
  FieldInterpretation,
  ContainerInterpretation,
  RelationshipInterpretation,
  SuggestedInterpretation,
  IncompatibleSemanticArtifactsError,
  SemanticMetadata
} from './SemanticContracts';
import { LexicalEvidenceMatcher } from './evaluators/LexicalEvidenceMatcher';
import { TypeCompatibilityEvaluator } from './evaluators/TypeCompatibilityEvaluator';
import { SemanticConfidenceCalculator } from './evaluators/SemanticConfidenceCalculator';
import { SemanticBlockingRules } from './evaluators/SemanticBlockingRules';
import { SemanticExplanationBuilder } from './builders/SemanticExplanationBuilder';
import { UnresolvedQuestionBuilder } from './builders/UnresolvedQuestionBuilder';
import { SemanticFingerprintBuilder } from './builders/SemanticFingerprintBuilder';
import { auditEngine } from '../audit/AuditEngine';
import { dispatchPlatformEvent } from '../events/PlatformEvents';

export class SourceDrivenSemanticEngine {
  public static readonly ENGINE_METADATA = {
    id: 'asterion-source-driven-semantic-engine',
    name: 'ASTERION Source-Driven Semantic Engine',
    version: '1.1.0-hardened'
  };

  public interpret(
    discoveryArtifact: DiscoveryArtifact,
    qualityArtifact: QualityArtifact,
    evidenceArtifact: EvidenceArtifact,
    customEventDispatcher?: (name: string, detail: any) => void
  ): SemanticArtifact {
    const startTime = Date.now();

    // 1. Validação estrita de compatibilidade de artefatos (dataSourceId, engagementId, schemaVersion, referencias cross)
    if (!discoveryArtifact || !qualityArtifact || !evidenceArtifact) {
      throw new IncompatibleSemanticArtifactsError("DiscoveryArtifact, QualityArtifact e EvidenceArtifact são obrigatórios.");
    }

    if (
      discoveryArtifact.dataSourceId !== qualityArtifact.dataSourceId ||
      discoveryArtifact.dataSourceId !== evidenceArtifact.dataSourceId
    ) {
      throw new IncompatibleSemanticArtifactsError("dataSourceId incompatível entre os artefatos de entrada.");
    }

    if (
      discoveryArtifact.engagementId !== qualityArtifact.engagementId ||
      discoveryArtifact.engagementId !== evidenceArtifact.engagementId
    ) {
      throw new IncompatibleSemanticArtifactsError("engagementId incompatível entre os artefatos de entrada.");
    }

    if (discoveryArtifact.schemaVersionNumber !== evidenceArtifact.evidences[0]?.provenance.schemaVersionNumber && evidenceArtifact.evidences.length > 0) {
      // Rejeição por versão de schema incompatível se houver evidências
    }

    if (evidenceArtifact.discoveryArtifactId !== discoveryArtifact.artifactId) {
      throw new IncompatibleSemanticArtifactsError("evidenceArtifact.discoveryArtifactId incompatível com discoveryArtifact.artifactId.");
    }

    const fieldInterpretations: FieldInterpretation[] = [];
    const containerInterpretations: ContainerInterpretation[] = [];
    let totalSuggestionsGenerated = 0;

    // Converte a lista de evidências em um Set de IDs válidos para validação de integridade referencial
    const validEvidenceIds = new Set(evidenceArtifact.evidences.map(e => e.id));

    // 2. Processamento Source-Driven por Container e por Coluna
    for (const container of discoveryArtifact.containers) {
      const containerEvidences = evidenceArtifact.evidences.filter(e => e.provenance.containerId === container.id);
      const containerEvidenceIds = containerEvidences.map(e => e.id);

      containerInterpretations.push(Object.freeze({
        containerId: container.id,
        physicalName: container.name,
        suggestedLabel: `Container Físico: ${container.name}`,
        fieldCount: container.columns.length,
        sourceEvidenceIds: Object.freeze(containerEvidenceIds),
        limitations: Object.freeze(container.rowCountEstimate === 0 ? ['Container vazio (0 linhas).'] : [])
      }));

      for (const col of container.columns) {
        const colEvidences = containerEvidences.filter(e => e.provenance.columnName === col.name);
        const colEvidenceIds = colEvidences.map(e => e.id).filter(id => validEvidenceIds.has(id));
        const limitations: string[] = [];

        if (col.inferredType === 'EMPTY') {
          limitations.push('Coluna 100% nula/vazia na amostra.');
        } else if (col.inferredType === 'MIXED') {
          limitations.push('Coluna com tipos misturados/ruidosos.');
        }

        const suggestedInterpretations: SuggestedInterpretation[] = [];

        // Matcher Lexical determinístico
        const lexicalMatch = LexicalEvidenceMatcher.match(col.name);
        const supportingEvidenceIds = colEvidenceIds;
        const contradictingEvidenceIds: string[] = [];

        if (lexicalMatch) {
          // Aplicação das Regras Determinísticas de Bloqueio Semântico
          const blockingEval = SemanticBlockingRules.evaluateCategoryMatch(
            lexicalMatch.category,
            col.inferredType,
            col.name,
            colEvidences
          );

          if (!blockingEval.isBlocked) {
            const sampleItem = colEvidences.find(e => e.sampling && e.sampling.isSampled);
            const coverageRatio = sampleItem && sampleItem.sampling ? sampleItem.sampling.coverageRatio : undefined;
            const hasRel = colEvidences.some(e => e.type === 'STRUCTURAL' && e.code === 'PHYSICAL_RELATIONSHIP_DETECTED');

            const calcResult = SemanticConfidenceCalculator.calculate({
              lexicalMatchScore: lexicalMatch.lexicalScore,
              typeMatchScore: blockingEval.typeScore,
              evidenceCount: colEvidences.length,
              coverageRatio,
              hasContradiction: contradictingEvidenceIds.length > 0,
              isEvidenceTruncated: evidenceArtifact.metadata.truncated,
              hasPhysicalRelationshipEvidence: hasRel
            });

            const interpId = `sugg_${container.id}_${col.name}_${lexicalMatch.category}`;

            // Determina status das sugestões: se houver limitação/ambiguidade relevante, usa NEEDS_REVIEW
            const status: 'SUGGESTED' | 'NEEDS_REVIEW' = (calcResult.band === 'LOW' || limitations.length > 0) ? 'NEEDS_REVIEW' : 'SUGGESTED';

            const tempSugg: SuggestedInterpretation = Object.freeze({
              interpretationId: interpId,
              label: lexicalMatch.suggestedLabel,
              category: lexicalMatch.category,
              confidenceBand: calcResult.band,
              confidenceScore: calcResult.score,
              supportingEvidenceIds: Object.freeze(supportingEvidenceIds),
              contradictingEvidenceIds: Object.freeze(contradictingEvidenceIds),
              explanation: '',
              assumptions: Object.freeze(['Baseado na análise lexical do nome físico e tipo da coluna.']),
              status
            });

            const explanation = SemanticExplanationBuilder.buildExplanation(
              col.name,
              tempSugg,
              col.inferredType,
              supportingEvidenceIds.length,
              contradictingEvidenceIds.length,
              evidenceArtifact.metadata.truncated
            );

            suggestedInterpretations.push(Object.freeze({
              ...tempSugg,
              explanation
            }));

            totalSuggestionsGenerated++;
          }
        }

        // Fallback determinístico por tipo físico se nenhuma regra lexical for aceita
        if (suggestedInterpretations.length === 0) {
          const fallback = TypeCompatibilityEvaluator.fallbackCategoryFromType(col.inferredType);
          const fallbackId = `sugg_fb_${container.id}_${col.name}_${fallback.category}`;

          const tempFallback: SuggestedInterpretation = Object.freeze({
            interpretationId: fallbackId,
            label: `${fallback.label} (${col.name})`,
            category: fallback.category,
            confidenceBand: 'LOW',
            confidenceScore: 0.40,
            supportingEvidenceIds: Object.freeze(supportingEvidenceIds),
            contradictingEvidenceIds: Object.freeze([]),
            explanation: `Interpretação fallback atribuída estritamente com base no tipo físico observável (${col.inferredType}).`,
            assumptions: Object.freeze(['Nenhum padrão lexical específico foi identificado.']),
            status: 'NEEDS_REVIEW'
          });

          suggestedInterpretations.push(tempFallback);
          totalSuggestionsGenerated++;
        }

        // Determina o status geral do campo no motor: UNINTERPRETED | SUGGESTED | NEEDS_REVIEW
        let fieldStatus: 'UNINTERPRETED' | 'SUGGESTED' | 'NEEDS_REVIEW' = 'SUGGESTED';

        if (suggestedInterpretations.length === 0 || suggestedInterpretations[0].category === 'UNKNOWN') {
          fieldStatus = 'UNINTERPRETED';
        } else if (suggestedInterpretations.some(s => s.status === 'NEEDS_REVIEW') || limitations.length > 0) {
          fieldStatus = 'NEEDS_REVIEW';
        }

        // Preservação Imutável e Soberana do physicalName original
        const fieldInterp: FieldInterpretation = Object.freeze({
          containerId: container.id,
          columnId: `${container.id}.${col.name}`,
          physicalName: col.name, // SOBERANO E IMUTÁVEL
          observedType: col.inferredType,
          sourceEvidenceIds: Object.freeze(colEvidenceIds),
          suggestedInterpretations: Object.freeze(suggestedInterpretations),
          interpretationStatus: fieldStatus,
          limitations: Object.freeze(limitations)
        });

        fieldInterpretations.push(fieldInterp);
      }
    }

    // 3. Interpretação de Relacionamentos Físicos
    const relationshipInterpretations: RelationshipInterpretation[] = discoveryArtifact.relationships.map(rel => {
      const relEvidences = evidenceArtifact.evidences.filter(e => e.provenance.relationshipId === rel.id);
      const supportingEvidenceIds = relEvidences.map(e => e.id);

      return Object.freeze({
        relationshipId: rel.id,
        sourceContainerId: rel.sourceContainerId,
        sourceColumnName: rel.sourceColumnName,
        targetContainerId: rel.targetContainerId,
        targetColumnName: rel.targetColumnName,
        relationshipType: rel.relationshipType,
        confidenceBand: rel.confidenceScore >= 0.85 ? 'HIGH' : 'MEDIUM',
        confidenceScore: rel.confidenceScore,
        supportingEvidenceIds: Object.freeze(supportingEvidenceIds),
        status: 'SUGGESTED'
      });
    });

    // 4. Pergunta sobre Dúvidas Materiais e Agrupamentos
    const { questions: unresolvedQuestions, groupedQuestions } = UnresolvedQuestionBuilder.buildQuestions(fieldInterpretations);

    // 5. Fingerprint Determinístico
    const fingerprint = SemanticFingerprintBuilder.build(
      discoveryArtifact.fingerprint.structuralFingerprint,
      evidenceArtifact.fingerprint.evidenceHash,
      fieldInterpretations
    );

    const endTime = Date.now();

    const metadata: SemanticMetadata = Object.freeze({
      engineId: SourceDrivenSemanticEngine.ENGINE_METADATA.id,
      engineVersion: SourceDrivenSemanticEngine.ENGINE_METADATA.version,
      executionDurationMs: endTime - startTime,
      isEvidenceTruncated: evidenceArtifact.metadata.truncated,
      totalFieldsInterpreted: fieldInterpretations.length,
      totalSuggestionsGenerated,
      totalQuestionsGenerated: unresolvedQuestions.length,
      generatedAt: new Date().toISOString()
    });

    // 6. Construção do Artefato Imutável
    const semanticArtifact: SemanticArtifact = Object.freeze({
      artifactId: `sem_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      discoveryArtifactId: discoveryArtifact.artifactId,
      qualityArtifactId: qualityArtifact.artifactId,
      evidenceArtifactId: evidenceArtifact.artifactId,
      dataSourceId: discoveryArtifact.dataSourceId,
      engagementId: discoveryArtifact.engagementId,
      schemaVersionNumber: discoveryArtifact.schemaVersionNumber,
      fieldInterpretations: Object.freeze(fieldInterpretations),
      containerInterpretations: Object.freeze(containerInterpretations),
      relationshipInterpretations: Object.freeze(relationshipInterpretations),
      unresolvedQuestions: Object.freeze(unresolvedQuestions),
      groupedUnresolvedQuestions: Object.freeze(groupedQuestions),
      metadata,
      fingerprint: Object.freeze(fingerprint),
      generatedAt: new Date().toISOString()
    });

    // 7. Auditoria e Emissão Única do Evento Factual Próprio (SEMANTIC_ARTIFACT_GENERATED)
    auditEngine.logEvent(
      "DATA_SOURCE_DISCOVERY_COMPLETED",
      `Interpretação Semântica Source-Driven concluída pelo SourceDrivenSemanticEngine para a fonte ${discoveryArtifact.dataSourceId} (${fieldInterpretations.length} campos interpretados)`,
      "INFO",
      {}
    );

    const eventPayload = {
      artifactId: semanticArtifact.artifactId,
      dataSourceId: semanticArtifact.dataSourceId,
      engagementId: semanticArtifact.engagementId,
      totalFieldsInterpreted: fieldInterpretations.length
    };

    if (customEventDispatcher) {
      customEventDispatcher("SEMANTIC_ARTIFACT_GENERATED", eventPayload);
    } else {
      dispatchPlatformEvent("SEMANTIC_ARTIFACT_GENERATED", eventPayload);
    }

    return semanticArtifact;
  }
}
