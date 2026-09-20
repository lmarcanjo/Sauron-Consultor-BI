import { DiscoveryContainer, DiscoveryRelationship } from '../../sdk/DiscoveryContracts';

export class DiscoveryRelationshipDetector {
  public static detect(containers: DiscoveryContainer[]): DiscoveryRelationship[] {
    const relationships: DiscoveryRelationship[] = [];

    if (containers.length < 2) {
      return relationships;
    }

    // Compara pares de containers procurando colunas com nomes exatamente iguais e cardinalidades compativeis
    for (let i = 0; i < containers.length; i++) {
      for (let j = i + 1; j < containers.length; j++) {
        const c1 = containers[i];
        const c2 = containers[j];

        for (const col1 of c1.columns) {
          for (const col2 of c2.columns) {
            if (
              col1.name.toLowerCase() === col2.name.toLowerCase() &&
              col1.inferredType === col2.inferredType &&
              col1.inferredType !== 'EMPTY'
            ) {
              const isCol1Unique = col1.distinctValuesCount === c1.rowCountEstimate && c1.rowCountEstimate > 0;
              const isCol2Unique = col2.distinctValuesCount === c2.rowCountEstimate && c2.rowCountEstimate > 0;

              let relType: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY' = 'MANY_TO_MANY';
              if (isCol1Unique && isCol2Unique) {
                relType = 'ONE_TO_ONE';
              } else if (isCol1Unique || isCol2Unique) {
                relType = 'ONE_TO_MANY';
              }

              relationships.push({
                id: `rel_${c1.id}_${col1.name}__${c2.id}_${col2.name}`,
                sourceContainerId: isCol2Unique && !isCol1Unique ? c2.id : c1.id,
                sourceColumnName: isCol2Unique && !isCol1Unique ? col2.name : col1.name,
                targetContainerId: isCol2Unique && !isCol1Unique ? c1.id : c2.id,
                targetColumnName: isCol2Unique && !isCol1Unique ? col1.name : col2.name,
                relationshipType: relType,
                confidenceScore: 0.85
              });
            }
          }
        }
      }
    }

    return relationships;
  }
}
