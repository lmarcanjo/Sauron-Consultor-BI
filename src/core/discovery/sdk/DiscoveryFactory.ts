import { IAsterionDiscoveryEngine } from './DiscoveryContracts';
import { DiscoveryRegistry, discoveryRegistry } from './DiscoveryRegistry';

export class DiscoveryFactory {
  constructor(private registry: DiscoveryRegistry = discoveryRegistry) {}

  public createEngine(engineId: string): IAsterionDiscoveryEngine {
    const factory = this.registry.getFactory(engineId);
    if (!factory) {
      throw new Error(`Nenhum motor de Discovery registrado com o ID "${engineId}".`);
    }

    return factory();
  }
}

export const discoveryFactory = new DiscoveryFactory();
