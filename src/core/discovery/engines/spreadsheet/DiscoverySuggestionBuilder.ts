import { DiscoveryContainer, DiscoverySuggestion } from '../../sdk/DiscoveryContracts';

export class DiscoverySuggestionBuilder {
  public static build(containers: DiscoveryContainer[]): DiscoverySuggestion[] {
    const suggestions: DiscoverySuggestion[] = [];

    for (const container of containers) {
      for (const col of container.columns) {
        if (col.distinctValuesCount === container.rowCountEstimate && container.rowCountEstimate > 0) {
          suggestions.push({
            id: `sug_pk_${container.id}_${col.name}`,
            type: 'PRIMARY_KEY_CANDIDATE',
            description: `A coluna "${col.name}" possui valores 100% únicos e pode atuar como chave identificadora.`,
            confidenceScore: 0.95,
            targetRef: `${container.id}.${col.name}`,
            suggestedAction: 'MARK_AS_KEY_CANDIDATE'
          });
        }
      }
    }

    return suggestions;
  }
}
