import { ConnectorFactoryFunction, connectorRegistry } from '../../core/datasource/sdk/ConnectorRegistry';
import { SpreadsheetConnector, SpreadsheetConnectorInitParams } from './SpreadsheetConnector';

export class SpreadsheetConnectorFactory {
  public static registerFactory(defaultParams?: SpreadsheetConnectorInitParams): void {
    const factoryFn: ConnectorFactoryFunction = () => new SpreadsheetConnector(defaultParams);
    
    if (!connectorRegistry.has('asterion-spreadsheet-connector')) {
      connectorRegistry.register(factoryFn);
    }
  }
}
