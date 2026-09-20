import {
  IDRECompositionEngine,
  DRECompositionPolicy,
  DRECompositionError
} from './DRECompositionContracts';

export const DRE_COMPOSITION_SDK_VERSION = '1.0.0-CANONICAL';

export interface DRECompositionEngineMetadata {
  readonly engineId: string;
  readonly engineVersion: string;
  readonly minimumSdkVersion: string;
  readonly supportedSdkVersions: readonly string[];
  readonly supportedPolicyIds: readonly string[];
  readonly supportedPolicyVersions: readonly string[];
  readonly stability: 'STABLE' | 'EXPERIMENTAL' | 'DEPRECATED';
  readonly description: string;
}

export interface DRECompositionEngineEntry {
  readonly metadata: DRECompositionEngineMetadata;
  readonly engine: IDRECompositionEngine;
}

export class DRECompositionRegistry {
  private readonly engines = new Map<string, DRECompositionEngineEntry>();

  public registerEngine(metadata: DRECompositionEngineMetadata, engine: IDRECompositionEngine): void {
    const key = `${metadata.engineId}:${metadata.engineVersion}`;
    if (this.engines.has(key)) {
      throw new DRECompositionError('DUPLICATE_ENGINE_REGISTRATION', `Engine com ID ${metadata.engineId} e versão ${metadata.engineVersion} já está registrado nesta instância do Registry.`);
    }
    // Congelar metadados para garantir imutabilidade
    this.engines.set(key, { metadata: Object.freeze({ ...metadata }), engine });
  }

  public resolveEngine(engineId: string, engineVersion: string): IDRECompositionEngine {
    const key = `${engineId}:${engineVersion}`;
    const entry = this.engines.get(key);
    if (!entry) {
      throw new DRECompositionError('ENGINE_NOT_FOUND', `Engine ${engineId}:${engineVersion} não encontrado nesta instância do Registry.`);
    }
    return entry.engine;
  }

  public listEngines(): readonly DRECompositionEngineMetadata[] {
    return Array.from(this.engines.values()).map(e => e.metadata);
  }

  public clear(): void {
    this.engines.clear();
  }
}

export class DRECompositionFactory {
  constructor(private readonly registry: DRECompositionRegistry) {
    if (!registry) {
      throw new DRECompositionError('MISSING_REGISTRY_DEPENDENCY', 'DRECompositionFactory exige uma instância explícita de DRECompositionRegistry.');
    }
  }

  public createEngine(engineId: string, engineVersion: string, policy?: DRECompositionPolicy): IDRECompositionEngine {
    const engine = this.registry.resolveEngine(engineId, engineVersion);
    if (policy) {
      const metadata = this.registry.listEngines().find(m => m.engineId === engineId && m.engineVersion === engineVersion);
      if (metadata) {
        if (!metadata.supportedPolicyIds.includes(policy.policyId) && !metadata.supportedPolicyIds.includes('*')) {
          throw new DRECompositionError('INCOMPATIBLE_POLICY_ID', `Policy ID ${policy.policyId} não é suportado pelo engine ${engineId}:${engineVersion}.`);
        }
        if (!metadata.supportedPolicyVersions.includes(policy.version) && !metadata.supportedPolicyVersions.includes('*')) {
          throw new DRECompositionError('INCOMPATIBLE_POLICY_VERSION', `Policy versão ${policy.version} não é suportada pelo engine ${engineId}:${engineVersion}.`);
        }
      }
    }
    return engine;
  }
}
