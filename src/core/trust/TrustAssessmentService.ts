import { TrustEngine } from './TrustEngine';
import { ITrustArtifactRepository, trustArtifactRepository } from './TrustArtifactRepository';
import { TrustArtifact, TrustEvaluationInput } from './TrustContracts';
import { PlatformUser } from '../identity/types';
import { dispatchPlatformEvent } from '../events/PlatformEvents';

export class TrustAssessmentService {
  private readonly engine: TrustEngine;
  private readonly repository: ITrustArtifactRepository;

  constructor(repository?: ITrustArtifactRepository) {
    this.engine = new TrustEngine();
    this.repository = repository || trustArtifactRepository;
  }

  /**
   * Avalia, valida autorização, calcula confiabilidade, persiste o artefato e dispara eventos factuais
   */
  public async evaluateAndPersist(input: TrustEvaluationInput, user: PlatformUser): Promise<TrustArtifact> {
    this.validateAuthorization(user);

    dispatchPlatformEvent('TRUST_ASSESSMENT_STARTED', {
      dataSourceId: input.dataSource.id,
      evaluatedByUserId: user.id
    });

    const artifact = this.engine.evaluate(input);

    await this.repository.saveVersion(artifact);

    dispatchPlatformEvent('TRUST_ARTIFACT_GENERATED', {
      artifactId: artifact.artifactId,
      dataSourceId: artifact.dataSourceId,
      overallState: artifact.trustAssessment.overallState,
      overallScore: artifact.trustAssessment.overallScore
    });

    if (artifact.trustAssessment.overallState === 'BLOCKED') {
      dispatchPlatformEvent('TRUST_ASSESSMENT_BLOCKED', {
        artifactId: artifact.artifactId,
        dataSourceId: artifact.dataSourceId,
        primaryBlockingReason: artifact.trustAssessment.primaryBlockingReason
      });
    }

    return artifact;
  }

  public async getLatestTrustArtifact(dataSourceId: string, user?: PlatformUser): Promise<TrustArtifact | null> {
    if (user) this.validateAuthorization(user);
    return await this.repository.findLatestByDataSource(dataSourceId);
  }

  public async invalidateForNewSchema(dataSourceId: string, newSchemaVersionNumber: number, user?: PlatformUser): Promise<void> {
    if (user) this.validateAuthorization(user);
    await this.repository.invalidateForNewSchema(dataSourceId, newSchemaVersionNumber);
    dispatchPlatformEvent('TRUST_ARTIFACT_INVALIDATED', {
      dataSourceId,
      newSchemaVersionNumber
    });
  }

  private validateAuthorization(user: PlatformUser): void {
    if (!user || (user.role !== 'CONSULTANT' && user.role !== 'Consultant Admin' && user.role !== 'SUPER_ADMIN' && user.role !== 'Super Admin')) {
      throw new Error('[TrustAssessmentService] Usuário não autorizado a executar a avaliação de confiança.');
    }
  }
}
