import { SemanticCategory } from '../SemanticContracts';

export class TypeCompatibilityEvaluator {
  public static evaluate(observedType: string, category: SemanticCategory): number {
    const typeUpper = (observedType || '').toUpperCase();

    switch (category) {
      case 'TEMPORAL':
        return typeUpper.includes('DATE') || typeUpper.includes('TIME') || typeUpper.includes('TIMESTAMP') || typeUpper === 'STRING' ? 0.90 : 0.20;

      case 'MONETARY_MEASURE':
      case 'NUMERIC_MEASURE':
      case 'PERCENTAGE':
        return typeUpper.includes('INT') || typeUpper.includes('FLOAT') || typeUpper.includes('DECIMAL') || typeUpper.includes('NUMBER') || typeUpper.includes('NUMERIC') ? 0.95 : 0.10;

      case 'BOOLEAN_FLAG':
        return typeUpper.includes('BOOL') || typeUpper.includes('BIT') || typeUpper.includes('INTEGER') || typeUpper.includes('STRING') ? 0.90 : 0.30;

      case 'IDENTIFIER':
      case 'RELATIONSHIP_KEY':
        return typeUpper.includes('INT') || typeUpper === 'STRING' || typeUpper.includes('UUID') ? 0.95 : 0.40;

      case 'CATEGORICAL':
      case 'TEXTUAL_DESCRIPTION':
      case 'ORGANIZATIONAL_REFERENCE':
      case 'GEOGRAPHIC_REFERENCE':
        return typeUpper === 'STRING' || typeUpper.includes('VARCHAR') || typeUpper.includes('TEXT') ? 0.90 : 0.50;

      case 'UNKNOWN':
      default:
        return 0.50;
    }
  }

  public static fallbackCategoryFromType(observedType: string): { category: SemanticCategory; label: string } {
    const typeUpper = (observedType || '').toUpperCase();

    if (typeUpper.includes('DATE') || typeUpper.includes('TIME') || typeUpper.includes('TIMESTAMP')) {
      return { category: 'TEMPORAL', label: 'Campo de Data / Horário' };
    }
    if (typeUpper.includes('INT') || typeUpper.includes('FLOAT') || typeUpper.includes('DECIMAL') || typeUpper.includes('NUMBER')) {
      return { category: 'NUMERIC_MEASURE', label: 'Medida Numérica Generalizada' };
    }
    if (typeUpper.includes('BOOL') || typeUpper.includes('BIT')) {
      return { category: 'BOOLEAN_FLAG', label: 'Indicador Booleano' };
    }
    if (typeUpper.includes('STRING') || typeUpper.includes('VARCHAR') || typeUpper.includes('TEXT')) {
      return { category: 'TEXTUAL_DESCRIPTION', label: 'Texto / Descrição Físico' };
    }

    return { category: 'UNKNOWN', label: 'Tipo Físico Não Classificado' };
  }
}
