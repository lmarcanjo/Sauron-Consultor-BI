import { SuggestedInterpretation } from '../SemanticContracts';

export class SemanticExplanationBuilder {
  public static buildExplanation(
    physicalName: string,
    suggestion: SuggestedInterpretation,
    observedType: string,
    supportingEvidenceCount: number,
    contradictingEvidenceCount: number,
    isTruncated: boolean
  ): string {
    const parts: string[] = [];

    parts.push(`Sugestão semântica "${suggestion.label}" para o campo físico "${physicalName}".`);
    parts.push(`Categoria atribuída: ${suggestion.category} com nível de confiança ${suggestion.confidenceBand} (${Math.round(suggestion.confidenceScore * 100)}%).`);

    if (supportingEvidenceCount > 0) {
      parts.push(`Sustentada por ${supportingEvidenceCount} evidência(s) técnica(s) observada(s) no schema (tipo físico: ${observedType}).`);
    } else {
      parts.push(`Baseada exclusivamente nas propriedades físicas e de nome da coluna.`);
    }

    if (contradictingEvidenceCount > 0) {
      parts.push(`ATENÇÃO: Existem ${contradictingEvidenceCount} evidência(s) contraditória(s) que reduziram o score de confiança.`);
    }

    if (isTruncated) {
      parts.push(`LIMITAÇÃO: O conjunto de evidências de entrada foi truncado, impondo teto à confiança máxima.`);
    }

    parts.push(`Ação necessária: Aguarda revisão e confirmação por parte do consultor.`);

    return parts.join(' ');
  }
}
