import { IAsterionConnector, ConnectorMetadata, ConnectorCapability } from './ConnectorContracts';

export type ConnectorFactoryFunction = () => IAsterionConnector;

export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, ConnectorFactoryFunction> = new Map();
  private metadataMap: Map<string, ConnectorMetadata> = new Map();

  private constructor() {}

  public static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  public register(factory: ConnectorFactoryFunction): void {
    const tempInstance = factory();
    const metadata = tempInstance.metadata;

    if (!metadata || !metadata.id) {
      throw new Error("Não é possível registrar um conector sem um ID válido nos metadados.");
    }

    if (this.connectors.has(metadata.id)) {
      throw new Error(`Conector com ID "${metadata.id}" já registrado no Registry.`);
    }

    this.connectors.set(metadata.id, factory);
    this.metadataMap.set(metadata.id, metadata);
  }

  public unregister(connectorId: string): boolean {
    this.metadataMap.delete(connectorId);
    return this.connectors.delete(connectorId);
  }

  public has(connectorId: string): boolean {
    return this.connectors.has(connectorId);
  }

  public getFactory(connectorId: string): ConnectorFactoryFunction | undefined {
    return this.connectors.get(connectorId);
  }

  public getMetadata(connectorId: string): ConnectorMetadata | undefined {
    return this.metadataMap.get(connectorId);
  }

  public listAllMetadata(): ConnectorMetadata[] {
    return Array.from(this.metadataMap.values());
  }

  public findByOriginType(originType: string): ConnectorMetadata[] {
    return this.listAllMetadata().filter(m => m.originType === originType);
  }

  public findByCapability(capability: ConnectorCapability): ConnectorMetadata[] {
    return this.listAllMetadata().filter(m => m.supportedCapabilities.includes(capability));
  }

  public clear(): void {
    this.connectors.clear();
    this.metadataMap.clear();
  }
}

export const connectorRegistry = ConnectorRegistry.getInstance();
