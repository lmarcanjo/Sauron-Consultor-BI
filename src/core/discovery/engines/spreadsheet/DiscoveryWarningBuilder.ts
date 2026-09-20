import { DiscoveryContainer, DiscoveryWarning } from '../../sdk/DiscoveryContracts';

export class DiscoveryWarningBuilder {
  public static build(containers: DiscoveryContainer[]): DiscoveryWarning[] {
    const warnings: DiscoveryWarning[] = [];
    const now = new Date().toISOString();

    for (const container of containers) {
      if (container.rowCountEstimate === 0) {
        warnings.push({
          code: 'EMPTY_CONTAINER',
          message: `A aba/tabela "${container.name}" está totalmente vazia (0 registros).`,
          severity: 'WARNING',
          affectedContainerId: container.id,
          timestamp: now
        });
      }

      for (const col of container.columns) {
        if (col.inferredType === 'EMPTY') {
          warnings.push({
            code: 'EMPTY_COLUMN',
            message: `A coluna "${col.name}" na aba "${container.name}" contém apenas valores nulos/vazios.`,
            severity: 'WARNING',
            affectedContainerId: container.id,
            affectedColumnName: col.name,
            timestamp: now
          });
        } else if (col.inferredType === 'MIXED') {
          warnings.push({
            code: 'MIXED_DATA_TYPES',
            message: `A coluna "${col.name}" na aba "${container.name}" contém dados com tipos incompatíveis/misturados.`,
            severity: 'WARNING',
            affectedContainerId: container.id,
            affectedColumnName: col.name,
            timestamp: now
          });
        }
      }
    }

    return warnings;
  }
}
