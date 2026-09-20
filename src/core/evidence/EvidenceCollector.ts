import { DiscoveryArtifact } from '../discovery/sdk/DiscoveryContracts';
import { QualityArtifact } from '../quality/QualityContracts';
import {
  EvidenceItem,
  PhysicalEvidenceItem,
  StructuralEvidenceItem,
  QualityAnomalyEvidenceItem,
  GranularProvenance,
  SamplingMetadata
} from './EvidenceContracts';
import { EvidenceSeverityResolver } from './EvidenceSeverityResolver';

export class EvidenceCollector {
  public static generateDeduplicationKey(item: EvidenceItem): string {
    const p = item.provenance;
    const container = p.containerId || '';
    const col = p.columnName || '';
    const rel = p.relationshipId || '';
    const alert = p.alertId || '';
    return `${item.type}:${item.code}:${container}:${col}:${rel}:${alert}`;
  }

  public static collectFromDiscovery(discovery: DiscoveryArtifact): EvidenceItem[] {
    const rawItems: EvidenceItem[] = [];

    // 1. Evidências Físicas dos Containers
    for (const container of discovery.containers) {
      const provenance: GranularProvenance = {
        sourceArtifactType: 'DiscoveryArtifact',
        sourceArtifactId: discovery.artifactId,
        dataSourceId: discovery.dataSourceId,
        engagementId: discovery.engagementId,
        schemaVersionNumber: discovery.schemaVersionNumber,
        sourceEngine: discovery.metadata.engineId,
        containerId: container.id,
        sourceFingerprint: discovery.fingerprint.structuralFingerprint,
        observedAt: discovery.metadata.executedAt
      };

      const sampling: SamplingMetadata = {
        isSampled: false
      };

      const item: PhysicalEvidenceItem = {
        id: `ev_phy_${container.id}`,
        type: 'PHYSICAL',
        severity: 'INFO',
        code: 'CONTAINER_PHYSICAL_DISCOVERED',
        description: `Container físico "${container.name}" identificado com ${container.rowCountEstimate} linhas estimadas e ${container.columns.length} colunas.`,
        provenance,
        sampling,
        details: { type: container.type, rowCount: container.rowCountEstimate, colCount: container.columns.length },
        containerId: container.id,
        observedAt: discovery.metadata.executedAt
      };

      rawItems.push(item);

      // 2. Evidências Físicas/Estruturais por Coluna (com métricas de amostragem)
      for (const col of container.columns) {
        const colProvenance: GranularProvenance = {
          ...provenance,
          columnName: col.name
        };

        const sampleSize = col.sampleValues ? col.sampleValues.length : undefined;
        const populationSize = container.rowCountEstimate;
        const coverageRatio = populationSize > 0 && sampleSize ? Math.min(1.0, sampleSize / populationSize) : undefined;

        const colSampling: SamplingMetadata = {
          isSampled: sampleSize !== undefined && sampleSize < populationSize,
          sampleSize,
          populationSize,
          coverageRatio: coverageRatio !== undefined ? Math.round(coverageRatio * 10000) / 10000 : undefined,
          samplingMethod: sampleSize ? 'HEAD_SAMPLE' : 'NONE',
          limitations: sampleSize && sampleSize < populationSize ? [`Baseado na amostragem das primeiras ${sampleSize} linhas.`] : []
        };

        const colItem: StructuralEvidenceItem = {
          id: `ev_struct_${container.id}_${col.name}`,
          type: 'STRUCTURAL',
          severity: EvidenceSeverityResolver.resolveFromType(col.inferredType),
          code: 'COLUMN_PHYSICAL_STRUCTURE',
          description: `Coluna "${col.name}" observada com tipo físico "${col.inferredType}" (${col.nullsCount || 0} nulos).`,
          provenance: colProvenance,
          sampling: colSampling,
          details: { inferredType: col.inferredType, nullable: col.nullable, nullsCount: col.nullsCount, distinctValues: col.distinctValuesCount },
          containerId: container.id,
          columnName: col.name,
          observedAt: discovery.metadata.executedAt
        };

        rawItems.push(colItem);
      }
    }

    // 3. Evidências de Relacionamentos Físicos
    for (const rel of discovery.relationships) {
      const relProvenance: GranularProvenance = {
        sourceArtifactType: 'DiscoveryArtifact',
        sourceArtifactId: discovery.artifactId,
        dataSourceId: discovery.dataSourceId,
        engagementId: discovery.engagementId,
        schemaVersionNumber: discovery.schemaVersionNumber,
        sourceEngine: discovery.metadata.engineId,
        containerId: rel.sourceContainerId,
        columnName: rel.sourceColumnName,
        relationshipId: rel.id,
        sourceFingerprint: discovery.fingerprint.structuralFingerprint,
        observedAt: discovery.metadata.executedAt
      };

      const relItem: StructuralEvidenceItem = {
        id: `ev_rel_${rel.id}`,
        type: 'STRUCTURAL',
        severity: 'INFO',
        code: 'PHYSICAL_RELATIONSHIP_DETECTED',
        description: `Relacionamento físico ${rel.relationshipType} detectado entre ${rel.sourceContainerId}.${rel.sourceColumnName} e ${rel.targetContainerId}.${rel.targetColumnName}.`,
        provenance: relProvenance,
        sampling: { isSampled: false },
        details: rel,
        containerId: rel.sourceContainerId,
        columnName: rel.sourceColumnName,
        observedAt: discovery.metadata.executedAt
      };

      rawItems.push(relItem);
    }

    return rawItems;
  }

  public static collectFromQuality(quality: QualityArtifact, discovery: DiscoveryArtifact): EvidenceItem[] {
    const rawItems: EvidenceItem[] = [];

    for (const alert of quality.alerts) {
      const provenance: GranularProvenance = {
        sourceArtifactType: 'QualityArtifact',
        sourceArtifactId: quality.artifactId,
        dataSourceId: quality.dataSourceId,
        engagementId: quality.engagementId,
        schemaVersionNumber: discovery.schemaVersionNumber,
        sourceEngine: 'asterion-data-quality-engine',
        containerId: alert.containerId,
        columnName: alert.columnName,
        alertId: alert.id,
        sourceFingerprint: discovery.fingerprint.structuralFingerprint,
        observedAt: alert.detectedAt
      };

      const item: QualityAnomalyEvidenceItem = {
        id: `ev_qual_${alert.id}`,
        type: 'QUALITY_ANOMALY',
        severity: EvidenceSeverityResolver.resolveFromAlert(alert.severity),
        code: alert.code,
        description: alert.message,
        provenance,
        sampling: { isSampled: false },
        details: { metricsImpacted: alert.metricsImpacted },
        alertId: alert.id,
        containerId: alert.containerId,
        columnName: alert.columnName,
        observedAt: alert.detectedAt
      };

      rawItems.push(item);
    }

    return rawItems;
  }

  public static deduplicateAndConsolidate(discoveryItems: EvidenceItem[], qualityItems: EvidenceItem[]): EvidenceItem[] {
    const map = new Map<string, EvidenceItem>();

    for (const item of [...discoveryItems, ...qualityItems]) {
      const key = this.generateDeduplicationKey(item);

      if (!map.has(key)) {
        // Clonagem defensiva para evitar vazamento de referências mutáveis
        map.set(key, JSON.parse(JSON.stringify(item)));
      } else {
        // Se a evidência já existe no mapa, mescla provenientes adicionais sem duplicar o fato no array final
        const existing = map.get(key)!;
        if (item.provenance.sourceArtifactId !== existing.provenance.sourceArtifactId) {
          existing.details = {
            ...existing.details,
            secondaryProvenance: {
              sourceArtifactType: item.provenance.sourceArtifactType,
              sourceArtifactId: item.provenance.sourceArtifactId,
              observedAt: item.provenance.observedAt
            }
          };
        }
      }
    }

    return Array.from(map.values());
  }
}
