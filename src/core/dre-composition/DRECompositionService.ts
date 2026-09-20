import {
  DREArtifact,
  DRECompositionExecutionContext,
  DRECompositionExecutionResult,
  DRECompositionError
} from './DRECompositionContracts';
import { DRECompositionEngine } from './DRECompositionEngine';
import { IDREArtifactRepository, dreArtifactRepository } from './DREArtifactRepository';
import { dispatchPlatformEvent } from '../events/PlatformEvents';
import { PlatformUser } from '../identity/types';

export class DRECompositionService {
  private readonly engine = new DRECompositionEngine();

  constructor(private readonly repository: IDREArtifactRepository = dreArtifactRepository) {}

  public async composeAndSaveDRE(
    context: DRECompositionExecutionContext,
    user: PlatformUser
  ): Promise<DREArtifact> {
    if (!user || !user.id) {
      throw new DRECompositionError('UNAUTHORIZED', 'Autorização do consultor é obrigatória para executar a composição de DRE.');
    }

    dispatchPlatformEvent('DRE_COMPOSITION_STARTED', {
      dataSourceId: context.dataSourceId,
      engagementId: context.engagementId
    });

    const result = this.engine.composeDRE(context);

    if (!result.success || !result.artifact) {
      const errorMsg = result.issues.map(i => i.message).join('; ');
      dispatchPlatformEvent('DRE_COMPOSITION_BLOCKED', {
        dataSourceId: context.dataSourceId,
        reason: errorMsg
      });
      throw new DRECompositionError('COMPOSITION_BLOCKED', errorMsg, result.issues);
    }

    // Verificar se existe versão confirmada/gerada anterior para superseder
    const latest = await this.repository.findLatestByEngagementAndScope(context.engagementId, context.dataSourceId);
    if (latest && latest.artifactId !== result.artifact.artifactId && (latest.status === 'GENERATED' || latest.status === 'LIMITED')) {
      await this.repository.supersede(latest.artifactId, result.artifact.artifactId);
      dispatchPlatformEvent('DRE_ARTIFACT_SUPERSEDED', {
        oldArtifactId: latest.artifactId,
        newArtifactId: result.artifact.artifactId
      });
    }

    await this.repository.saveVersion(result.artifact);

    dispatchPlatformEvent('DRE_ARTIFACT_GENERATED', {
      artifactId: result.artifact.artifactId,
      dataSourceId: context.dataSourceId,
      engagementId: context.engagementId
    });

    return result.artifact;
  }

  public async invalidateForNewSchema(dataSourceId: string, newSchemaVersionNumber: number): Promise<void> {
    const history = await this.repository.findHistory(dataSourceId, dataSourceId);
    for (const art of history) {
      if (art.status === 'GENERATED' || art.status === 'LIMITED') {
        await this.repository.invalidate(art.artifactId, `Novo schema detectado (${newSchemaVersionNumber}).`);
        dispatchPlatformEvent('DRE_ARTIFACT_INVALIDATED', {
          artifactId: art.artifactId,
          dataSourceId
        });
      }
    }
  }

  public async getLatestDREArtifact(engagementId: string, scopeId: string): Promise<DREArtifact | null> {
    return this.repository.findLatestByEngagementAndScope(engagementId, scopeId);
  }
}
