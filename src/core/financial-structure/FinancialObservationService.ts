import { FinancialStructureObservationEngine } from './FinancialStructureObservationEngine';
import { FinancialStructureEngineMetadata, FinancialObservationInput } from './FinancialStructureContracts';
import {
  BusinessInsightRegistry,
  businessInsightRegistry,
  BusinessInsightError,
  BusinessInsightExecutionContext,
  BusinessArtifact,
  IBusinessArtifactRepository,
  businessArtifactRepository
} from '../business-insight';
import { PlatformUser } from '../identity/types';
import { dispatchPlatformEvent } from '../events/PlatformEvents';
import { DataSourceService } from '../datasource/DataSourceService';
import { activeDatasetStore } from '../data/ActiveDatasetStore';
import { semanticConfirmationRepository } from '../semantic/confirmation/SemanticConfirmationRepository';
import { TrustAssessmentService } from '../trust/TrustAssessmentService';
import { ActiveDataset } from '../../types/dataSource';
import { CanonicalDataState } from '../datasource/types';
import {
  FinancialObservationDatasetContextInput,
  FinancialObservationContextProjection,
  WorkspaceAvailability
} from './FinancialStructureContracts';

export class FinancialObservationService {
  private readonly engine: FinancialStructureObservationEngine;
  private readonly registry: BusinessInsightRegistry;
  private readonly repository: IBusinessArtifactRepository;

  constructor(registry?: BusinessInsightRegistry, repository?: IBusinessArtifactRepository) {
    this.engine = new FinancialStructureObservationEngine();
    this.registry = registry || businessInsightRegistry;
    this.repository = repository || businessArtifactRepository;
    
    // Auto-registro no Registry canônico oficial se ainda não registrado
    try {
      this.registry.register(this.engine);
    } catch (e: any) {
      if (e instanceof BusinessInsightError && e.code === 'DUPLICATE_BUSINESS_ENGINE') {
        // Já registrado, ignora
      } else {
        throw e;
      }
    }
  }

  /**
   * Resolve a projeção do contexto canônico de observação financeira para a UI/Workspace.
   * Evita acesso direto da camada React a Repositories/Storage.
   */
  /**
   * Resolve a projeção do contexto canônico de observação financeira para a UI/Workspace.
   * Evita acesso direto da camada React a Repositories/Storage e preserva os 5 estados canônicos.
   */
  public async resolveContext(
    engagementId: string,
    activeDatasetInput: ActiveDataset | FinancialObservationDatasetContextInput | null,
    user: PlatformUser | null
  ): Promise<FinancialObservationContextProjection> {
    const dsService = new DataSourceService();
    const dataSources = await dsService.listDataSourcesByEngagement(engagementId, user);
    const activeDS = dataSources.find(d => d.lifecycleStatus === 'ACTIVE');

    let normalizedActiveDataset: ActiveDataset | null = null;
    if (activeDatasetInput) {
      if ('datasetId' in activeDatasetInput && 'sourceType' in activeDatasetInput) {
        normalizedActiveDataset = activeDatasetInput as ActiveDataset;
      } else if ('rawDataset' in activeDatasetInput && activeDatasetInput.rawDataset) {
        normalizedActiveDataset = activeDatasetInput.rawDataset;
      }
    }

    if (!normalizedActiveDataset && activeDS) {
      normalizedActiveDataset = {
        datasetId: activeDS.id,
        sourceType: (activeDS.metadata.originType === 'EXCEL' || activeDS.metadata.originType === 'CSV' || activeDS.metadata.originType === 'FILE') ? 'SPREADSHEET_DATA' : 'DATABASE_DATA',
        sourceName: activeDS.metadata.name,
        importedAt: activeDS.createdAt,
        rowCount: activeDS.currentQualityProfile?.evaluatedRecordsCount || 0,
        columnCount: activeDS.currentQualityProfile?.totalColumnsCount || 0,
        sheets: [],
        activeSheet: 'Sheet1',
        previewRows: [],
        columnProfiles: [],
        importProfile: null,
        rawStorageRef: activeDS.id,
        status: 'READY'
      };
      activeDatasetStore.setActiveDataset(normalizedActiveDataset);
    }

    // Determine 5 Canonical Data States
    let derivedCanonicalState: CanonicalDataState = 'NO_SOURCE';
    let workspaceAvailability: WorkspaceAvailability = 'NO_DATA';

    if (activeDS) {
      derivedCanonicalState = activeDS.derivedCanonicalState || (activeDS.currentSchemaVersion ? 'READY' : 'SOURCE_CONNECTED');
    } else if (normalizedActiveDataset) {
      derivedCanonicalState = 'SOURCE_CONNECTED';
    }

    if (derivedCanonicalState === 'NO_SOURCE') {
      workspaceAvailability = 'NO_DATA';
      return {
        engagementId,
        dataSource: null,
        derivedCanonicalState: 'NO_SOURCE',
        workspaceAvailability,
        schemaVersionNumber: 1,
        activeDataset: null,
        semanticConfirmation: null,
        trustArtifact: null,
        businessArtifact: null,
        artifactHistory: [],
        eligibleMonetaryFields: [],
        eligibleTemporalFields: [],
        eligibleCategoryFields: [],
        blockingConditions: ['Nenhuma fonte de dados conectada.'],
        limitations: []
      };
    }

    if (derivedCanonicalState === 'SOURCE_CONNECTED') {
      workspaceAvailability = 'PROCESSING';
      return {
        engagementId,
        dataSource: activeDS || null,
        derivedCanonicalState: 'SOURCE_CONNECTED',
        workspaceAvailability,
        schemaVersionNumber: activeDS?.currentSchemaVersion?.versionNumber || 1,
        activeDataset: normalizedActiveDataset,
        semanticConfirmation: null,
        trustArtifact: null,
        businessArtifact: null,
        artifactHistory: [],
        eligibleMonetaryFields: [],
        eligibleTemporalFields: [],
        eligibleCategoryFields: [],
        blockingConditions: ['Fonte conectada aguardando discovery/confirmação.'],
        limitations: []
      };
    }

    if (derivedCanonicalState === 'DISCOVERING') {
      workspaceAvailability = 'PROCESSING';
      return {
        engagementId,
        dataSource: activeDS || null,
        derivedCanonicalState: 'DISCOVERING',
        workspaceAvailability,
        schemaVersionNumber: activeDS?.currentSchemaVersion?.versionNumber || 1,
        activeDataset: normalizedActiveDataset,
        semanticConfirmation: null,
        trustArtifact: null,
        businessArtifact: null,
        artifactHistory: [],
        eligibleMonetaryFields: [],
        eligibleTemporalFields: [],
        eligibleCategoryFields: [],
        blockingConditions: ['Discovery em andamento.'],
        limitations: []
      };
    }

    const dataSourceId = normalizedActiveDataset ? normalizedActiveDataset.datasetId : activeDS!.id;
    const confirmationArtifact = await semanticConfirmationRepository.findLatestByDataSource(dataSourceId);

    if (!confirmationArtifact) {
      derivedCanonicalState = 'WAITING_CONFIRMATION';
      workspaceAvailability = 'REQUIRES_CONFIRMATION';
      return {
        engagementId,
        dataSource: activeDS || null,
        derivedCanonicalState: 'WAITING_CONFIRMATION',
        workspaceAvailability,
        schemaVersionNumber: activeDS?.currentSchemaVersion?.versionNumber || 1,
        activeDataset: normalizedActiveDataset,
        semanticConfirmation: confirmationArtifact || null,
        trustArtifact: null,
        businessArtifact: null,
        artifactHistory: [],
        eligibleMonetaryFields: [],
        eligibleTemporalFields: [],
        eligibleCategoryFields: [],
        blockingConditions: ['Revisão e confirmação semântica pendentes.'],
        limitations: []
      };
    }

    const trustService = new TrustAssessmentService();
    const trustArtifact = await trustService.getLatestTrustArtifact(dataSourceId, user);

    const isTrustBlocked = !trustArtifact || trustArtifact.trustAssessment.overallState === 'BLOCKED';
    derivedCanonicalState = 'READY';
    workspaceAvailability = isTrustBlocked ? 'BLOCKED' : 'AVAILABLE';

    const history = await this.repository.findHistory('FinancialStructureObservationEngine', dataSourceId);
    const latest = await this.repository.findLatestByEngineAndScope('FinancialStructureObservationEngine', dataSourceId);

    const eligibleMonetaryFields = confirmationArtifact.fieldDecisions
      .filter((d: any) => d.decision === 'CONFIRMED' || d.decision === 'CUSTOM_INTERPRETATION')
      .map((d: any) => d.physicalName);

    return {
      engagementId,
      dataSource: activeDS || null,
      derivedCanonicalState: 'READY',
      workspaceAvailability,
      schemaVersionNumber: activeDS?.currentSchemaVersion?.versionNumber || 1,
      activeDataset: normalizedActiveDataset,
      semanticConfirmation: confirmationArtifact,
      trustArtifact,
      businessArtifact: latest,
      artifactHistory: history,
      eligibleMonetaryFields,
      eligibleTemporalFields: eligibleMonetaryFields,
      eligibleCategoryFields: eligibleMonetaryFields,
      blockingConditions: (trustArtifact?.blockingConditions || []).map((b: any) => typeof b === 'string' ? b : b.description || b.code || 'Bloqueio de governança'),
      limitations: trustArtifact?.limitations || []
    };
  }

  public getEngineMetadata(): FinancialStructureEngineMetadata {
    return this.engine.metadata as FinancialStructureEngineMetadata;
  }

  /**
   * Serviço de aplicação encarregado de autorização, validação de política, execução do motor e emissão de eventos
   */
  public async executeObservation(input: FinancialObservationInput, user: PlatformUser): Promise<BusinessArtifact> {
    this.validateAuthorization(user);

    dispatchPlatformEvent('BUSINESS_ANALYSIS_STARTED', {
      dataSourceId: input.trustArtifact.dataSourceId,
      evaluatedByUserId: user.id
    });

    const context: BusinessInsightExecutionContext = {
      user,
      scope: input.scope,
      trustArtifact: input.trustArtifact,
      requiredCapability: 'DESCRIPTIVE_ANALYSIS',
      options: {
        financialInput: input,
        trustUsage: input.trustUsage || 'FINANCIAL_ANALYSIS'
      }
    };

    try {
      const result = await this.engine.execute(context);

      if (!result.success || !result.artifact) {
        throw result.error || new Error('Falha na geração do BusinessArtifact.');
      }

      await this.repository.saveVersion(result.artifact);

      dispatchPlatformEvent('BUSINESS_ARTIFACT_GENERATED', {
        artifactId: result.artifact.artifactId,
        dataSourceId: result.artifact.dataSourceIds[0],
        engineId: result.artifact.engineId,
        observationsCount: result.artifact.businessObservations.length
      });

      return result.artifact;
    } catch (error: any) {
      if (error instanceof BusinessInsightError && error.code === 'TRUST_ARTIFACT_BLOCKED') {
        dispatchPlatformEvent('BUSINESS_ANALYSIS_BLOCKED', {
          dataSourceId: input.trustArtifact.dataSourceId,
          primaryBlockingReason: error.message
        });
      }
      throw error;
    }
  }

  private validateAuthorization(user: PlatformUser): void {
    if (!user || !['CONSULTANT', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      throw new BusinessInsightError(
        'BUSINESS_POLICY_VIOLATION',
        'Usuário não possui autorização para executar análises de estrutura financeira.'
      );
    }
  }
}
