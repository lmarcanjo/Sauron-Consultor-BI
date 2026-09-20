import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  IAsterionConnector,
  ConnectorMetadata,
  ConnectorCapability,
  ConnectorExecutionContext,
  ConnectorHealthResult,
  ConnectorValidationResult,
  ConnectorDiscoveryResult,
  ConnectorRegistry,
  ConnectorFactory
} from './index';

class MockTestConnector implements IAsterionConnector {
  public readonly metadata: ConnectorMetadata = {
    id: 'mock-test-connector',
    name: 'Mock Test Connector',
    version: '1.0.0',
    provider: 'ASTERION Labs',
    originType: 'MOCK',
    supportedCapabilities: ['connect', 'validate', 'discover', 'health']
  };

  public supportsCapability(capability: ConnectorCapability): boolean {
    return this.metadata.supportedCapabilities.includes(capability);
  }

  public async connect(ctx: ConnectorExecutionContext): Promise<boolean> {
    if (!ctx.engagementId) throw new Error("EngagementId é obrigatório para conexão.");
    return true;
  }

  public async disconnect(ctx: ConnectorExecutionContext): Promise<void> {}

  public async checkHealth(ctx: ConnectorExecutionContext): Promise<ConnectorHealthResult> {
    return { status: 'HEALTHY', checkedAt: new Date().toISOString(), message: 'Mock ok' };
  }

  public async validate(ctx: ConnectorExecutionContext): Promise<ConnectorValidationResult> {
    return { isValid: true, errors: [], checkedAt: new Date().toISOString() };
  }

  public async discover(ctx: ConnectorExecutionContext): Promise<ConnectorDiscoveryResult> {
    return {
      containers: [{ id: 'c1', name: 'Mock Table', type: 'table', columns: [{ name: 'id', inferredType: 'string' }] }],
      discoveredAt: new Date().toISOString()
    };
  }
}

class MockIncompleteConnector implements IAsterionConnector {
  public readonly metadata: ConnectorMetadata = {
    id: 'mock-incomplete-connector',
    name: 'Mock Incomplete Connector',
    version: '1.0.0',
    provider: 'ASTERION Labs',
    originType: 'MOCK',
    supportedCapabilities: ['connect']
  };

  public supportsCapability(capability: ConnectorCapability): boolean {
    return this.metadata.supportedCapabilities.includes(capability);
  }

  public async connect(ctx: ConnectorExecutionContext): Promise<boolean> { return true; }
  public async disconnect(ctx: ConnectorExecutionContext): Promise<void> {}
  public async checkHealth(ctx: ConnectorExecutionContext): Promise<ConnectorHealthResult> { return { status: 'UNAVAILABLE', checkedAt: '' }; }
  public async validate(ctx: ConnectorExecutionContext): Promise<ConnectorValidationResult> { return { isValid: false, errors: [], checkedAt: '' }; }
  public async discover(ctx: ConnectorExecutionContext): Promise<ConnectorDiscoveryResult> { return { containers: [], discoveredAt: '' }; }
}

describe('F1.4B — Connector SDK Specification', () => {
  let registry: ConnectorRegistry;
  let factory: ConnectorFactory;

  beforeEach(() => {
    registry = ConnectorRegistry.getInstance();
    registry.clear();
    factory = new ConnectorFactory(registry);
  });

  describe('1. Registro de Conectores (Connector Registry)', () => {
    it('deve registrar com sucesso uma factory de conector e indexar seus metadados', () => {
      registry.register(() => new MockTestConnector());

      expect(registry.has('mock-test-connector')).toBe(true);

      const metadata = registry.getMetadata('mock-test-connector');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('Mock Test Connector');
      expect(metadata?.supportedCapabilities).toContain('discover');
    });

    it('deve recusar registros duplicados de conectores com o mesmo ID', () => {
      registry.register(() => new MockTestConnector());
      expect(() => registry.register(() => new MockTestConnector())).toThrow(
        'Conector com ID "mock-test-connector" já registrado no Registry.'
      );
    });

    it('deve buscar e filtrar conectores por capacidade ou tipo de origem', () => {
      registry.register(() => new MockTestConnector());
      registry.register(() => new MockIncompleteConnector());

      const discoverableConnectors = registry.findByCapability('discover');
      expect(discoverableConnectors.length).toBe(1);
      expect(discoverableConnectors[0].id).toBe('mock-test-connector');

      const mockConnectors = registry.findByOriginType('MOCK');
      expect(mockConnectors.length).toBe(2);
    });
  });

  describe('2. Resolução via Factory (Connector Factory)', () => {
    it('deve instanciar um conector registrado através da ConnectorFactory', () => {
      registry.register(() => new MockTestConnector());

      const connector = factory.createConnector('mock-test-connector');
      expect(connector).toBeDefined();
      expect(connector.metadata.id).toBe('mock-test-connector');
    });

    it('deve lançar erro ao tentar instanciar um conector não registrado', () => {
      expect(() => factory.createConnector('non-existent-connector')).toThrow(
        'Nenhum conector registrado com o ID "non-existent-connector".'
      );
    });

    it('deve validar se o conector suporta a capacidade requerida antes de instanciar', () => {
      registry.register(() => new MockIncompleteConnector());

      expect(() => factory.createAndValidateCapability('mock-incomplete-connector', 'discover')).toThrow(
        'O conector "mock-incomplete-connector" não suporta a capacidade requerida "discover".'
      );

      const validConnector = factory.createAndValidateCapability('mock-incomplete-connector', 'connect');
      expect(validConnector).toBeDefined();
    });
  });

  describe('3. Execução de Contratos de SDK (Connect, Health, Validate, Discover)', () => {
    it('deve cumprir o contrato de execução de um conector simulado', async () => {
      registry.register(() => new MockTestConnector());
      const connector = factory.createConnector('mock-test-connector');

      const ctx: ConnectorExecutionContext = {
        engagementId: 'eng_test_123',
        dataSourceId: 'ds_test_456'
      };

      const connected = await connector.connect(ctx);
      expect(connected).toBe(true);

      const health = await connector.checkHealth(ctx);
      expect(health.status).toBe('HEALTHY');

      const validation = await connector.validate(ctx);
      expect(validation.isValid).toBe(true);

      const discovery = await connector.discover(ctx);
      expect(discovery.containers.length).toBe(1);
      expect(discovery.containers[0].name).toBe('Mock Table');
    });
  });
});
