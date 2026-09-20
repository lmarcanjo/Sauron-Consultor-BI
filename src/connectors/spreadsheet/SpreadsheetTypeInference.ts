export type InferredColumnType =
  | 'STRING'
  | 'INTEGER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'EMPTY'
  | 'MIXED'
  | 'UNKNOWN';

export class SpreadsheetTypeInference {
  public static inferType(values: any[]): InferredColumnType {
    const nonNullValues = values.filter(v => v !== null && v !== undefined && String(v).trim() !== '');

    if (nonNullValues.length === 0) {
      return 'EMPTY';
    }

    const detectedTypes = new Set<InferredColumnType>();

    for (const val of nonNullValues) {
      detectedTypes.add(this.inferSingleValueType(val));
    }

    if (detectedTypes.size === 1) {
      return Array.from(detectedTypes)[0];
    }

    // Se misturar INTEGER e DECIMAL, promove para DECIMAL conservadoramente
    if (detectedTypes.size === 2 && detectedTypes.has('INTEGER') && detectedTypes.has('DECIMAL')) {
      return 'DECIMAL';
    }

    return 'MIXED';
  }

  private static inferSingleValueType(val: any): InferredColumnType {
    if (typeof val === 'number') {
      return Number.isInteger(val) ? 'INTEGER' : 'DECIMAL';
    }

    if (typeof val === 'boolean') {
      return 'BOOLEAN';
    }

    if (val instanceof Date) {
      return 'DATETIME';
    }

    const str = String(val).trim();

    if (str.toLowerCase() === 'true' || str.toLowerCase() === 'false') {
      return 'BOOLEAN';
    }

    // Checagem Numérica
    if (!isNaN(Number(str)) && !isNaN(parseFloat(str))) {
      const num = Number(str);
      return Number.isInteger(num) && !str.includes('.') ? 'INTEGER' : 'DECIMAL';
    }

    // Checagem ISO Data
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(str)) {
      return str.includes('T') ? 'DATETIME' : 'DATE';
    }

    // Checagem Data Brasileira (DD/MM/YYYY)
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      return 'DATE';
    }

    return 'STRING';
  }
}
