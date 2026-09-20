import { IAsterionDiscoveryEngine } from './DiscoveryContracts';

export type DiscoveryEngineFactoryFunction = () => IAsterionDiscoveryEngine;

export class DiscoveryRegistry {
  private static instance: DiscoveryRegistry;
  private engines: Map<string, DiscoveryEngineFactoryFunction> = new Map();
  private metadataMap: Map<string, IAsterionDiscoveryEngine['metadata']> = new Map();

  private constructor() {}

  public static getInstance(): DiscoveryRegistry {
    if (!DiscoveryRegistry.instance) {
      DiscoveryRegistry.instance = new DiscoveryRegistry();
    }
    return DiscoveryRegistry.instance;
  }

  public register(factory: DiscoveryEngineFactoryFunction): void {
    const tempInstance = factory();
    const metadata = tempInstance.metadata;

    if (!metadata || !metadata.id) {
      throw new Error("Não é possível registrar um motor de Discovery sem um ID válido nos metadados.");
    }

    if (this.engines.has(metadata.id)) {
      throw new Error(`Motor de Discovery com ID "${metadata.id}" já registrado no DiscoveryRegistry.`);
    }

    this.engines.set(metadata.id, factory);
    this.metadataMap.set(metadata.id, metadata);
  }

  public unregister(engineId: string): boolean {
    this.metadataMap.delete(engineId);
    return this.engines.delete(engineId);
  }

  public has(engineId: string): boolean {
    return this.engines.has(engineId);
  }

  public getFactory(engineId: string): DiscoveryEngineFactoryFunction | undefined {
    return this.engines.get(engineId);
  }

  public getMetadata(engineId: string): IAsterionDiscoveryEngine['metadata'] | undefined {
    return this.metadataMap.get(engineId);
  }

  public listAllMetadata(): IAsterionDiscoveryEngine['metadata'][] {
    return Array.from(this.metadataMap.values());
  }

  public clear(): void {
    this.engines.clear();
    this.metadataMap.clear();
  }
}

export const discoveryRegistry = DiscoveryRegistry.getInstance();
