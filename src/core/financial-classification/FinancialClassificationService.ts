import {
  FinancialClassificationArtifact,
  FinancialClassificationDecision,
  FinancialClassificationProvenance
} from './FinancialClassificationContracts';
import { FinancialClassificationEngine, CANONICAL_MATERIALITY_POLICY_V1 } from './FinancialClassificationEngine';
import { FinancialClassificationConsistencyValidator } from './FinancialClassificationConsistencyValidator';
import { IFinancialClassificationRepository, financialClassificationRepository } from './FinancialClassificationRepository';
import { PlatformUser } from '../identity/types';
import { dispatchPlatformEvent } from '../events/PlatformEvents';
import { DataSourceService } from '../datasource/DataSourceService';
import { semanticConfirmationRepository } from '../semantic/confirmation/SemanticConfirmationRepository';
import { TrustAssessmentService } from '../trust/TrustAssessmentService';

export class FinancialClassificationService {
  private readonly engine: FinancialClassificationEngine;
  private readonly repository: IFinancialClassificationRepository;

  constructor(repository?: IFinancialClassificationRepository) {
    this.engine = new FinancialClassificationEngine();
    this.repository = repository || financialClassificationRepository;
  }

  public async getLatestClassification(
    dataSourceId: string,
    scopeId: string,
    user: PlatformUser
  ): Promise<FinancialClassificationArtifact | null> {
    const dsService = new DataSourceService();
    const sources = await dsService.listDataSourcesByEngagement(scopeId, user);
    if (!sources.some(s => s.id === dataSourceId)) {
      return null;
    }
    return await this.repository.findLatestByDataSourceAndScope(dataSourceId, scopeId);
  }

  public async saveDraftClassification(
    input: {
      engagementId: string;
      dataSourceId: string;
      schemaVersionNumber: number;
      semanticConfirmationArtifactId: string;
      trustArtifactId: string;
      containerId: string;
      monetaryFieldReference: string;
      categoryFieldReference: string;
      decisions: Omit<FinancialClassificationDecision, 'decisionId' | 'decidedAt'>[];
    },
    user: PlatformUser
  ): Promise<FinancialClassificationArtifact> {
    const dsService = new DataSourceService();
    const dataSource = await dsService.getDataSourceById(input.dataSourceId, user);
    if (!dataSource) throw new Error('DataSource não encontrado.');

    const semanticConf = await semanticConfirmationRepository.findById(input.semanticConfirmationArtifactId);
    if (!semanticConf || semanticConf.overallStatus !== 'CONFIRMED') {
      throw new Error('SemanticConfirmationArtifact vigente não encontrado ou não confirmado.');
    }

    const trustService = new TrustAssessmentService();
    const trustArt = await trustService.getLatestTrustArtifact(input.dataSourceId, user);
    if (!trustArt || trustArt.artifactId !== input.trustArtifactId) {
      throw new Error('TrustArtifact diverge do artefato autorizado vigente.');
    }

    // Validar cada decisão com o validador de coerência
    const finalizedDecisions: FinancialClassificationDecision[] = [];
    const unresolved: string[] = [];

    for (const d of input.decisions) {
      this.engine.validateDecisionEligibility(d, semanticConf.fieldDecisions, trustArt);

      const issues = FinancialClassificationConsistencyValidator.validateDecision(d);
      const errors = issues.filter(i => i.severity === 'ERROR');
      if (errors.length > 0) {
        throw new Error(`Incoerência na decisão da categoria "${d.physicalValue}": ${errors.map(e => e.message).join('; ')}`);
      }

      const decisionId = `dec_${d.categoryFieldPhysicalName}_${d.normalizedValue}_${Date.now()}`;
      const finalized: FinancialClassificationDecision = {
        ...d,
        decisionId,
        decidedAt: new Date().toISOString()
      };
      finalizedDecisions.push(finalized);

      if (d.classificationType === 'UNRESOLVED' && d.materialityAssessment.materialityState === 'MATERIAL') {
        unresolved.push(String(d.physicalValue));
      }

      dispatchPlatformEvent('FINANCIAL_CLASSIFICATION_DECISION_RECORDED', {
        decisionId,
        category: String(d.physicalValue),
        classificationType: d.classificationType
      });
    }

    const provenance: FinancialClassificationProvenance = {
      dataSourceId: input.dataSourceId,
      schemaVersionNumber: input.schemaVersionNumber,
      trustArtifactId: input.trustArtifactId,
      trustUsage: 'FINANCIAL_ANALYSIS',
      semanticConfirmationArtifactId: input.semanticConfirmationArtifactId,
      engineId: 'FinancialClassificationEngine',
      engineVersion: '1.0.0-HARDENED'
    };

    const now = new Date().toISOString();
    const artifactId = `art_fin_class_${input.dataSourceId}_v${input.schemaVersionNumber}_${Date.now()}`;
    const fingerprint = `fp_class_${input.dataSourceId}_${input.decisions.length}_${Date.now()}`;

    const artifact: FinancialClassificationArtifact = {
      artifactId,
      engagementId: input.engagementId,
      dataSourceId: input.dataSourceId,
      schemaVersionNumber: input.schemaVersionNumber,
      semanticConfirmationArtifactId: input.semanticConfirmationArtifactId,
      trustArtifactId: input.trustArtifactId,
      scope: { scopeLevel: 'DATA_SOURCE', scopeId: input.dataSourceId, engagementId: input.engagementId },
      containerId: input.containerId,
      monetaryFieldReference: input.monetaryFieldReference,
      categoryFieldReference: input.categoryFieldReference,
      classificationDecisions: finalizedDecisions,
      unresolvedClassifications: unresolved,
      limitations: unresolved.length > 0 ? [`Existem ${unresolved.length} categorias materiais não classificadas.`] : [],
      provenance,
      metadata: {
        engineVersion: '1.0.0-HARDENED',
        policyId: 'asterion_materiality_policy_v1',
        policyVersion: '1.0.0'
      },
      fingerprint,
      version: 1,
      status: 'DRAFT',
      createdAt: now
    };

    // Garantir transição e salvar
    await this.repository.saveVersion(artifact);
    return artifact;
  }

  public async confirmClassification(
    artifactId: string,
    user: PlatformUser
  ): Promise<FinancialClassificationArtifact> {
    const artifact = await this.repository.findById(artifactId);
    if (!artifact) throw new Error('Artefato de classificação não encontrado.');

    if (artifact.unresolvedClassifications.length > 0) {
      throw new Error(`Não é possível confirmar a classificação financeira. Categorias materiais não resolvidas: ${artifact.unresolvedClassifications.join(', ')}.`);
    }

    if (!user || !user.id) {
      throw new Error('Confirmação rejeitada: consultantId é obrigatório para registrar a decisão humana.');
    }

    // Verificar se existe versão confirmada anterior para superseder
    const latest = await this.repository.findLatestByDataSourceAndScope(artifact.dataSourceId, artifact.scope.scopeId);
    if (latest && latest.artifactId !== artifact.artifactId && latest.status === 'CONFIRMED') {
      await this.repository.supersede(latest.artifactId, artifact.artifactId);
      dispatchPlatformEvent('FINANCIAL_CLASSIFICATION_SUPERSEDED', {
        oldArtifactId: latest.artifactId,
        newArtifactId: artifact.artifactId
      });
    }

    const updated: FinancialClassificationArtifact = {
      ...artifact,
      status: 'CONFIRMED',
      confirmedAt: new Date().toISOString()
    };

    await this.repository.saveVersion(updated);

    dispatchPlatformEvent('FINANCIAL_CLASSIFICATION_CONFIRMED', {
      artifactId: updated.artifactId,
      dataSourceId: updated.dataSourceId,
      engagementId: updated.engagementId
    });

    return updated;
  }

  public async invalidateForNewSchema(dataSourceId: string, newSchemaVersionNumber: number): Promise<void> {
    const history = await this.repository.findHistory(dataSourceId, dataSourceId);
    for (const art of history) {
      if (art.status === 'CONFIRMED' || art.status === 'DRAFT' || art.status === 'REASSESSMENT_REQUIRED') {
        await this.repository.invalidate(art.artifactId, `Novo schema detectado (${newSchemaVersionNumber}).`);
        dispatchPlatformEvent('FINANCIAL_CLASSIFICATION_INVALIDATED', {
          artifactId: art.artifactId,
          dataSourceId
        });
      }
    }
  }

  public async markReassessmentRequiredForPolicyChange(dataSourceId: string, newPolicyId: string): Promise<void> {
    const history = await this.repository.findHistory(dataSourceId, dataSourceId);
    for (const art of history) {
      if (art.status === 'CONFIRMED') {
        const updated: FinancialClassificationArtifact = {
          ...art,
          status: 'REASSESSMENT_REQUIRED',
          limitations: [...art.limitations, `Reavaliação exigida por alteração na política de materialidade (${newPolicyId}).`]
        };
        await this.repository.saveVersion(updated);
      }
    }
  }
}
