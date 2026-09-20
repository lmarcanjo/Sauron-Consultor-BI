import {
  DREReconciliationArtifact,
  DREReconciliationError
} from './DREReconciliationContracts';
import { DREReconciliationEngine, DREReconciliationExecutionContext } from './DREReconciliationEngine';
import { IDREReconciliationArtifactRepository, dreReconciliationArtifactRepository } from './DREReconciliationArtifactRepository';
import { dispatchPlatformEvent } from '../events/PlatformEvents';
import { PlatformUser } from '../identity/types';

export class DREReconciliationService {
  private readonly engine = new DREReconciliationEngine();

  constructor(private readonly repository: IDREReconciliationArtifactRepository = dreReconciliationArtifactRepository) {}

  public async reconcileAndSaveDRE(
    context: DREReconciliationExecutionContext,
    user: PlatformUser
  ): Promise<DREReconciliationArtifact> {
    if (!user || !user.id) {
      throw new DREReconciliationError('UNAUTHORIZED', 'Autorização do consultor é obrigatória para executar a reconciliação de DRE.');
    }

    dispatchPlatformEvent('DRE_RECONCILIATION_STARTED', {
      dreArtifactId: context.dreArtifact.artifactId,
      engagementId: context.dreArtifact.engagementId
    });

    const result = this.engine.reconcile(context);

    if (!result.success || !result.artifact) {
      const errorMsg = result.issues.map(i => i.message).join('; ');
      dispatchPlatformEvent('DRE_RECONCILIATION_BLOCKED', {
        dreArtifactId: context.dreArtifact.artifactId,
        reason: errorMsg
      });
      throw new DREReconciliationError('RECONCILIATION_BLOCKED', errorMsg, result.issues);
    }

    await this.repository.saveVersion(result.artifact);

    dispatchPlatformEvent('DRE_RECONCILIATION_ARTIFACT_GENERATED', {
      artifactId: result.artifact.artifactId,
      dreArtifactId: context.dreArtifact.artifactId,
      engagementId: context.dreArtifact.engagementId,
      status: result.artifact.reconciliationStatus
    });

    return result.artifact;
  }

  public async invalidateForDREChange(dreArtifactId: string, reason: string): Promise<void> {
    const latest = await this.repository.findLatestByDREArtifact(dreArtifactId);
    if (latest && latest.reconciliationStatus !== 'INVALIDATED') {
      await this.repository.invalidate(latest.artifactId, reason);
      dispatchPlatformEvent('DRE_RECONCILIATION_INVALIDATED', {
        artifactId: latest.artifactId,
        dreArtifactId,
        reason
      });
    }
  }

  public async getLatestReconciliation(dreArtifactId: string): Promise<DREReconciliationArtifact | null> {
    return this.repository.findLatestByDREArtifact(dreArtifactId);
  }

  public async getHistory(engagementId: string, scopeId: string): Promise<readonly DREReconciliationArtifact[]> {
    return this.repository.findHistory(engagementId, scopeId);
  }
}
