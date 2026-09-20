import { describe, it, expect, beforeEach } from 'vitest';
import {
  IAsterionDiscoveryEngine,
  DiscoveryArtifact,
  DiscoveryExecutionContext,
  DiscoveryRegistry,
  DiscoveryFactory
} from './sdk';

class MockDiscoveryEngine implements IAsterionDiscoveryEngine {
  public readonly metadata = {
    id: 'mock-discovery-engine',
    name: 'Mock Discovery Engine',
    version: '1.0.0',
    provider: 'ASTERION Labs',
    description: 'Motor de discovery para testes de contrato do SDK.'
  };

  public async runDiscovery(ctx: DiscoveryExecutionContext, inputData?: any): Promise<DiscoveryArtifact> {
    if (!ctx.dataSourceId) {
      throw new Error("DataSourceId é obrigatório para executar o discovery.");
    }

    return {
      artifactId: `art_${Date.now()}`,
      dataSourceId: ctx.dataSourceId,
      engagementId: ctx.engagementId,
      schemaVersionNumber: 1,
      containers: [
        {
          id: 'c1',
          name: 'Tabela Mock',
          type: 'table',
          rowCountEstimate: 500,
          columns: [
            { name: 'id', originalName: 'id', index: 0, inferredType: 'INTEGER', nullable: false, sampleValues: [1, 2, 3] }
          ]
        }
      ],
      relationships: [],
      statistics: {
        totalContainersCount: 1,
        totalColumnsCount: 1,
        totalEstimatedRows: 500,
        nullPercentageOverall: 0,
        distinctValuesEstimate: 500,
        qualityScore: 100
      },
      warnings: [],
      suggestions: [],
      fingerprint: {
        physicalFingerprint: 'phy_mock_123',
        structuralFingerprint: 'str_mock_456',
        generatedAt: new Date().toISOString()
      },
      metadata: {
        engineId: this.metadata.id,
        engineVersion: this.metadata.version,
        executionDurationMs: 15,
        executedAt: new Date().toISOString()
      }
    };
  }
}

describe('F2.0 — Discovery SDK Specification', () => {
  let registry: DiscoveryRegistry;
  let factory: DiscoveryFactory;

  beforeEach(() => {
    registry = DiscoveryRegistry.getInstance();
    registry.clear();
    factory = new DiscoveryFactory(registry);
  });

  describe('1. Registro de Motores de Discovery (DiscoveryRegistry)', () => {
    it('deve registrar com sucesso uma fábrica de motor de discovery e indexar seus metadados', () => {
      registry.register(() => new MockDiscoveryEngine());

      expect(registry.has('mock-discovery-engine')).toBe(true);

      const metadata = registry.getMetadata('mock-discovery-engine');
      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('Mock Discovery Engine');
    });

    it('deve recusar registro duplicado de motor com o mesmo ID', () => {
      registry.register(() => new MockDiscoveryEngine());
      expect(() => registry.register(() => new MockDiscoveryEngine())).toThrow(
        'Motor de Discovery com ID "mock-discovery-engine" já registrado no DiscoveryRegistry.'
      );
    });
  });

  describe('2. Resolução via Factory (DiscoveryFactory)', () => {
    it('deve instanciar um motor de discovery através da DiscoveryFactory', () => {
      registry.register(() => new MockDiscoveryEngine());

      const engine = factory.createEngine('mock-discovery-engine');
      expect(engine).toBeDefined();
      expect(engine.metadata.id).toBe('mock-discovery-engine');
    });

    it('deve lançar erro ao tentar instanciar um motor não registrado', () => {
      expect(() => factory.createEngine('non-existent-engine')).toThrow(
        'Nenhum motor de Discovery registrado com o ID "non-existent-engine".'
      );
    });
  });

  describe('3. Execução de Contratos do Discovery SDK (DiscoveryArtifact)', () => {
    it('deve executar o motor e produzir o contrato imutável DiscoveryArtifact com sucesso', async () => {
      registry.register(() => new MockDiscoveryEngine());
      const engine = factory.createEngine('mock-discovery-engine');

      const ctx: DiscoveryExecutionContext = {
        dataSourceId: 'ds_test_123',
        engagementId: 'eng_test_456'
      };

      const artifact = await engine.runDiscovery(ctx);

      expect(artifact.artifactId).toBeDefined();
      expect(artifact.dataSourceId).toBe('ds_test_123');
      expect(artifact.engagementId).toBe('eng_test_456');
      expect(artifact.containers.length).toBe(1);
      expect(artifact.statistics.qualityScore).toBe(100);
      expect(artifact.fingerprint.physicalFingerprint).toBe('phy_mock_123');
      expect(artifact.metadata.engineId).toBe('mock-discovery-engine');
    });
  });
});
