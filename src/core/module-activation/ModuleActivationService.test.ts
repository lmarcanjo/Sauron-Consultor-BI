import { describe, expect, it } from 'vitest';
import {
  InMemoryModuleConfigurationRepository,
  ModuleActivationService,
  ModuleConfigurationService,
} from './index';
import type { PreliminaryFinancialAnalysisArtifact } from '../preliminary-analysis/PreliminaryFinancialAnalysisContracts';

function artifact(fields: string[], metricCodes: string[] = ['VALUE_TOTAL']): PreliminaryFinancialAnalysisArtifact {
  return {
    artifactId: 'prelim_test',
    artifactVersion: 1,
    analysisMode: 'PRELIMINARY',
    clientId: 'client_test',
    engagementId: 'engagement_test',
    organizationalScope: { scopeType: 'COMPANY', targetId: 'company_test' },
    dataSourceId: 'source_test',
    workbookId: 'workbook_test',
    containerId: 'Sheet1',
    sourceFileName: 'Consulta Financeiro Topp.xls',
    sourceFingerprint: 'source_fp',
    schemaVersionNumber: 1,
    physicalRowCount: 3,
    headerRowCount: 1,
    dataRowCount: 2,
    validRowCount: 2,
    partiallyValidRowCount: 0,
    excludedRowCount: 0,
    emptyRowCount: 0,
    columnCount: fields.length,
    physicalFields: fields.map((name, index) => ({
      physicalName: name,
      physicalColumnIndex: index,
      displayName: name,
      usageStatus: 'USED',
    })),
    fieldUsages: {},
    metrics: metricCodes.map(code => ({
      metricId: `metric_${code}`,
      code,
      label: code,
      value: 100,
      unit: 'BRL',
      validInputCount: 2,
      excludedInputCount: 0,
      limitations: [],
      provenance: { sourceId: 'source_test', workbookId: 'workbook_test', containerId: 'Sheet1', sheetName: 'Sheet1' },
    })),
    groupings: [],
    temporalSeries: [],
    qualityFindings: [],
    limitations: [],
    policyId: 'policy',
    policyVersion: '1',
    policyFingerprint: 'policy_fp',
    engineVersion: '1',
    provenance: { generatedAt: '2026-01-01T00:00:00.000Z', generatedByUserId: 'user_test', algorithm: 'test' },
    fingerprint: 'artifact_fp',
    generatedAt: '2026-01-01T00:00:00.000Z',
    generatedByUserId: 'user_test',
    status: 'COMPLETED',
  };
}

describe('MVP-2 Module Activation', () => {
  const service = new ModuleActivationService();

  it('mantém Financeiro ACTIVE com a análise preliminar que contém Valor', () => {
    const projection = service.resolveModuleById('FINANCIAL', {
      engagementId: 'engagement_test',
      dataSourceId: 'source_test',
      preliminaryArtifact: artifact(['Valor', 'Valor Pago', 'Saldo']),
      currentUserId: 'user_test',
    });

    expect(projection.status).toBe('ACTIVE');
    expect(projection.primaryAction).toBe('OPEN_DASHBOARD');
    expect(projection.availableMetrics).toContain('VALUE_TOTAL');
  });

  it('classifica Comercial como INSUFFICIENT_DATA quando falta Produto', () => {
    const projection = service.resolveModuleById('COMMERCIAL', {
      engagementId: 'engagement_test',
      dataSourceId: 'source_test',
      preliminaryArtifact: artifact(['Pessoa', 'Valor']),
      currentUserId: 'user_test',
    });

    expect(projection.status).toBe('INSUFFICIENT_DATA');
    expect(projection.missingRequirements).toContain('Produto');
    expect(projection.primaryAction).toBe('CHANGE_SOURCE');
  });

  it('classifica Comercial como REQUIRES_CONFIGURATION com os campos mínimos encontrados', () => {
    const current = artifact(['Pessoa', 'Produto', 'Valor']);
    const projection = service.resolveModuleById('COMMERCIAL', {
      engagementId: current.engagementId,
      dataSourceId: current.dataSourceId,
      preliminaryArtifact: current,
      currentUserId: 'user_test',
    });

    expect(projection.status).toBe('REQUIRES_CONFIGURATION');
    expect(projection.primaryAction).toBe('CONFIGURE');
  });

  it('ativa Estoque, Itens e Pós-vendas apenas com os requisitos físicos correspondentes', () => {
    const inventory = service.resolveModuleById('INVENTORY', {
      engagementId: 'engagement_test', dataSourceId: 'source_test',
      preliminaryArtifact: artifact(['Produto', 'Quantidade']), currentUserId: 'user_test',
    });
    const items = service.resolveModuleById('ITEMS', {
      engagementId: 'engagement_test', dataSourceId: 'source_test',
      preliminaryArtifact: artifact(['Produto']), currentUserId: 'user_test',
    });
    const afterSales = service.resolveModuleById('AFTER_SALES', {
      engagementId: 'engagement_test', dataSourceId: 'source_test',
      preliminaryArtifact: artifact(['Pessoa', 'Data', 'Serviço']), currentUserId: 'user_test',
    });

    expect(inventory.status).toBe('REQUIRES_CONFIGURATION');
    expect(items.status).toBe('REQUIRES_CONFIGURATION');
    expect(afterSales.status).toBe('REQUIRES_CONFIGURATION');
  });

  it('persiste a configuração, isola por engagement e invalida ao trocar a fonte', async () => {
    const repository = new InMemoryModuleConfigurationRepository();
    const configurationService = new ModuleConfigurationService(repository);
    const current = artifact(['Pessoa', 'Produto', 'Valor']);

    const saved = await configurationService.saveConfiguration({
      moduleId: 'COMMERCIAL',
      engagementId: current.engagementId,
      dataSourceId: current.dataSourceId,
      schemaVersionNumber: current.schemaVersionNumber,
      selectedFields: ['Pessoa', 'Produto', 'Valor'],
      selectedMetrics: ['VALUE_TOTAL'],
      selectedDimensions: ['Pessoa'],
      createdBy: 'user_test',
      sourceFingerprint: JSON.stringify({ containerId: current.containerId, columns: current.physicalFields.map(field => ({ name: field.physicalName, index: field.physicalColumnIndex })) }),
    });

    const valid = await configurationService.getValidConfiguration({
      moduleId: 'COMMERCIAL', engagementId: current.engagementId,
      dataSourceId: current.dataSourceId, schemaVersionNumber: 1, sourceFingerprint: JSON.stringify({ containerId: current.containerId, columns: current.physicalFields.map(field => ({ name: field.physicalName, index: field.physicalColumnIndex })) }),
    });
    const otherEngagement = await configurationService.getValidConfiguration({
      moduleId: 'COMMERCIAL', engagementId: 'other_engagement',
      dataSourceId: current.dataSourceId, schemaVersionNumber: 1, sourceFingerprint: JSON.stringify({ containerId: current.containerId, columns: current.physicalFields.map(field => ({ name: field.physicalName, index: field.physicalColumnIndex })) }),
    });
    const changedSource = await configurationService.getValidConfiguration({
      moduleId: 'COMMERCIAL', engagementId: current.engagementId,
      dataSourceId: 'new_source', schemaVersionNumber: 1, sourceFingerprint: JSON.stringify({ containerId: current.containerId, columns: current.physicalFields.map(field => ({ name: field.physicalName, index: field.physicalColumnIndex })) }),
    });

    expect(saved.status).toBe('ACTIVE');
    expect(valid?.configurationId).toBe(saved.configurationId);
    expect(otherEngagement).toBeNull();
    expect(changedSource).toBeNull();
    expect((await repository.findByModule('COMMERCIAL', current.engagementId))?.status).toBe('INVALIDATED');

    const activeProjection = service.resolveModuleById('COMMERCIAL', {
      engagementId: current.engagementId,
      dataSourceId: current.dataSourceId,
      preliminaryArtifact: current,
      currentUserId: 'user_test',
      configuration: saved,
    });
    expect(activeProjection.status).toBe('ACTIVE');
  });
});
