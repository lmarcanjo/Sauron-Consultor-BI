import {
  IAsterionDiscoveryEngine,
  DiscoveryArtifact,
  DiscoveryExecutionContext,
  DiscoveryContainer,
  DiscoveryColumn
} from '../../sdk/DiscoveryContracts';
import { SpreadsheetConnector } from '../../../../connectors/spreadsheet/SpreadsheetConnector';
import { DiscoveryStatisticsBuilder } from './DiscoveryStatisticsBuilder';
import { DiscoveryRelationshipDetector } from './DiscoveryRelationshipDetector';
import { DiscoveryWarningBuilder } from './DiscoveryWarningBuilder';
import { DiscoverySuggestionBuilder } from './DiscoverySuggestionBuilder';
import { DiscoveryFingerprintBuilder } from './DiscoveryFingerprintBuilder';
import { dispatchPlatformEvent } from '../../../events/PlatformEvents';
import { auditEngine } from '../../../audit/AuditEngine';

export class SpreadsheetDiscoveryEngine implements IAsterionDiscoveryEngine {
  public readonly metadata = {
    id: 'asterion-spreadsheet-discovery-engine',
    name: 'ASTERION Official Spreadsheet Discovery Engine',
    version: '1.0.0',
    provider: 'ASTERION Data Intelligence',
    description: 'Motor de descoberta estrutural de planilhas sob o princípio de observação sem interpretação semântica.'
  };

  public async runDiscovery(ctx: DiscoveryExecutionContext, connectorInstance?: SpreadsheetConnector): Promise<DiscoveryArtifact> {
    const startTime = Date.now();

    if (!ctx.dataSourceId) {
      throw new Error("DataSourceId é obrigatório para executar o SpreadsheetDiscoveryEngine.");
    }
    if (!ctx.engagementId) {
      throw new Error("EngagementId é obrigatório para executar o SpreadsheetDiscoveryEngine.");
    }
    if (!connectorInstance) {
      throw new Error("Uma instância ativa do SpreadsheetConnector é obrigatória para o SpreadsheetDiscoveryEngine.");
    }

    // 1. Executa a descoberta física via conector
    const discoveryResult = await connectorInstance.discover(ctx);
    const containers: DiscoveryContainer[] = [];

    // 2. Coleta amostras neutras para calcular estatísticas de cardinalidade e nulos por coluna
    for (const container of discoveryResult.containers) {
      const sampleRows = await connectorInstance.sample({ ...ctx, parameters: { sheetName: container.name } }, 1000);
      const columns: DiscoveryColumn[] = [];

      for (let i = 0; i < container.columns.length; i++) {
        const colDef = container.columns[i];
        const colValues = sampleRows.map(r => r[colDef.name]);
        const nullsCount = colValues.filter(v => v === null || v === undefined || String(v).trim() === '').length;
        const distinctValuesCount = new Set(colValues.filter(v => v !== null && v !== undefined && String(v).trim() !== '')).size;

        columns.push({
          name: colDef.name,
          originalName: colDef.name,
          index: i,
          inferredType: colDef.inferredType,
          nullable: colDef.nullable ?? true,
          sampleValues: colValues.slice(0, 5),
          distinctValuesCount,
          nullsCount
        });
      }

      containers.push({
        id: container.id,
        name: container.name,
        type: container.type,
        rowCountEstimate: container.rowCountEstimate || sampleRows.length,
        columns
      });
    }

    // 3. Monta componentes observacionais sem inferência de negócio
    const statistics = DiscoveryStatisticsBuilder.calculate(containers);
    const relationships = DiscoveryRelationshipDetector.detect(containers);
    const warnings = DiscoveryWarningBuilder.build(containers);
    const suggestions = DiscoverySuggestionBuilder.build(containers);
    const fingerprint = DiscoveryFingerprintBuilder.build(
      connectorInstance.getPhysicalFingerprint() || `phy_ds_${ctx.dataSourceId}`,
      containers
    );

    const endTime = Date.now();

    const artifact: DiscoveryArtifact = {
      artifactId: `art_disc_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
      dataSourceId: ctx.dataSourceId,
      engagementId: ctx.engagementId,
      schemaVersionNumber: 1,
      containers,
      relationships,
      statistics,
      warnings,
      suggestions,
      fingerprint,
      metadata: {
        engineId: this.metadata.id,
        engineVersion: this.metadata.version,
        executionDurationMs: endTime - startTime,
        executedAt: new Date().toISOString()
      }
    };

    // Auditoria e Evento Factual de Plataforma
    auditEngine.logEvent("DATA_SOURCE_DISCOVERY_COMPLETED", `Discovery contratual concluído pelo SpreadsheetDiscoveryEngine para a fonte ${ctx.dataSourceId}`, "INFO", {
      user: ctx.user?.profile?.fullName || ctx.user?.id
    });
    dispatchPlatformEvent("DISCOVERY_ARTIFACT_GENERATED", { artifactId: artifact.artifactId, dataSourceId: ctx.dataSourceId });

    return artifact;
  }
}
