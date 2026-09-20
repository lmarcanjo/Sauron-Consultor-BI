import { IAsterionConnector, ConnectorCapability, ConnectorExecutionContext } from './ConnectorContracts';
import { ConnectorRegistry, connectorRegistry } from './ConnectorRegistry';

export class ConnectorFactory {
  constructor(private registry: ConnectorRegistry = connectorRegistry) {}

  public createConnector(connectorId: string): IAsterionConnector {
    const factory = this.registry.getFactory(connectorId);
    if (!factory) {
      throw new Error(`Nenhum conector registrado com o ID "${connectorId}".`);
    }

    return factory();
  }

  public createAndValidateCapability(connectorId: string, requiredCapability: ConnectorCapability): IAsterionConnector {
    const connector = this.createConnector(connectorId);
    if (!connector.supportsCapability(requiredCapability)) {
      throw new Error(`O conector "${connectorId}" não suporta a capacidade requerida "${requiredCapability}".`);
    }
    return connector;
  }
}

export const connectorFactory = new ConnectorFactory();
