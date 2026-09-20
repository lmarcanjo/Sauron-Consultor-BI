import {
  IAsterionBusinessInsightEngine,
  BusinessInsightEngineMetadata,
  BusinessInsightError,
  BUSINESS_INSIGHT_SDK_VERSION
} from './BusinessInsightSDK';
import { BusinessInsightCapability } from './BusinessArtifactContracts';

export class BusinessInsightRegistry {
  private readonly engines: Map<string, IAsterionBusinessInsightEngine> = new Map();

  public register(engine: IAsterionBusinessInsightEngine): void {
    if (!engine || !engine.metadata || !engine.metadata.engineId) {
      throw new BusinessInsightError('INSUFFICIENT_GOVERNED_INPUT', 'Motor inválido fornecido para registro.');
    }

    const { metadata } = engine;
    const key = `${metadata.engineId}:${metadata.version}`;

    if (this.engines.has(key)) {
      throw new BusinessInsightError(
        'DUPLICATE_BUSINESS_ENGINE',
        `Motor com engineId '${metadata.engineId}' e versão '${metadata.version}' já registrado no repositório.`
      );
    }

    if (metadata.stability === 'DEPRECATED') {
      console.warn(`[BusinessInsightRegistry] AVISO DE DEPRECATION: Registrando motor descontinuado '${metadata.engineId}' v${metadata.version}.`);
    }

    this.engines.set(key, Object.freeze(engine));
  }

  public getEngine(engineId: string, version?: string): IAsterionBusinessInsightEngine | undefined {
    if (version) {
      return this.engines.get(`${engineId}:${version}`);
    }

    // Retorna a versão mais recente cadastrada se não for informada versão explícita
    const matches = Array.from(this.engines.values()).filter(e => e.metadata.engineId === engineId);
    if (matches.length === 0) return undefined;
    return matches[matches.length - 1];
  }

  public findByCapability(capability: BusinessInsightCapability): IAsterionBusinessInsightEngine[] {
    const results: IAsterionBusinessInsightEngine[] = [];
    for (const engine of this.engines.values()) {
      if (engine.metadata.supportedCapabilities.includes(capability) && engine.metadata.stability !== 'DEPRECATED') {
        results.push(engine);
      }
    }
    return results;
  }

  public listEngines(): readonly BusinessInsightEngineMetadata[] {
    return Array.from(this.engines.values()).map(e => e.metadata);
  }

  public clear(): void {
    this.engines.clear();
  }
}

export class BusinessInsightFactory {
  private readonly registry: BusinessInsightRegistry;

  constructor(registry?: BusinessInsightRegistry) {
    this.registry = registry || new BusinessInsightRegistry();
  }

  public getRegistry(): BusinessInsightRegistry {
    return this.registry;
  }

  public createEngine(engineId: string, version?: string): IAsterionBusinessInsightEngine {
    const engine = this.registry.getEngine(engineId, version);
    if (!engine) {
      throw new BusinessInsightError(
        'BUSINESS_ENGINE_NOT_FOUND',
        `Nenhum motor de inteligência cadastrado com engineId '${engineId}'${version ? ` v${version}` : ''}.`
      );
    }
    return engine;
  }
}

export const businessInsightRegistry = new BusinessInsightRegistry();

