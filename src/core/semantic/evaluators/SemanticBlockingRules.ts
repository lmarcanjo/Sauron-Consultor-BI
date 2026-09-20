import { SemanticCategory } from '../SemanticContracts';

export class SemanticBlockingRules {
  public static evaluateCategoryMatch(
    category: SemanticCategory,
    observedType: string,
    physicalName: string,
    colEvidences: any[]
  ): { typeScore: number; isBlocked: boolean; blockReason?: string } {
    const typeUpper = (observedType || '').toUpperCase();

    switch (category) {
      case 'MONETARY_MEASURE': {
        const isNumeric = typeUpper.includes('INT') || typeUpper.includes('FLOAT') || typeUpper.includes('DECIMAL') || typeUpper.includes('NUMBER');
        if (!isNumeric && typeUpper !== 'STRING') {
          return { typeScore: 0.10, isBlocked: true, blockReason: 'Categoria MONETARY_MEASURE exige tipo numérico ou monetário compatível.' };
        }
        if (typeUpper === 'STRING') {
          return { typeScore: 0.40, isBlocked: false };
        }
        return { typeScore: 0.95, isBlocked: false };
      }

      case 'TEMPORAL': {
        const isDateType = typeUpper.includes('DATE') || typeUpper.includes('TIME') || typeUpper.includes('TIMESTAMP');
        if (!isDateType && typeUpper !== 'STRING') {
          return { typeScore: 0.10, isBlocked: true, blockReason: 'Categoria TEMPORAL exige tipo DATE/DATETIME ou string compatível.' };
        }
        // Se for string apenas pelo nome lexical, não permite atingir HIGH (teto no typeScore)
        if (typeUpper === 'STRING') {
          return { typeScore: 0.50, isBlocked: false };
        }
        return { typeScore: 0.90, isBlocked: false };
      }

      case 'RELATIONSHIP_KEY': {
        const hasRelEvidence = colEvidences.some(e => e.type === 'STRUCTURAL' && e.code === 'PHYSICAL_RELATIONSHIP_DETECTED');
        if (!hasRelEvidence) {
          return { typeScore: 0.40, isBlocked: false, blockReason: 'RELATIONSHIP_KEY sem evidência de relacionamento físico fica restrita a pontuação reduzida.' };
        }
        return { typeScore: 0.90, isBlocked: false };
      }

      case 'IDENTIFIER': {
        const isMixed = typeUpper === 'MIXED';
        if (isMixed) {
          return { typeScore: 0.30, isBlocked: false, blockReason: 'IDENTIFIER com tipos misturados reduz a confiança.' };
        }
        return { typeScore: 0.90, isBlocked: false };
      }

      default:
        return { typeScore: 0.80, isBlocked: false };
    }
  }
}
