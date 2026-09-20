export interface NormalizedDateResult {
  readonly isValid: boolean;
  readonly physicalValue: string;
  readonly normalizedDate: string | null; // Formato YYYY-MM-DD
  readonly parserRuleId: string;
  readonly parserVersion: string;
  readonly timezone: string;
  readonly reason?: string;
  readonly isAmbiguous?: boolean;
}

export class DREDateParser {
  private static readonly PARSER_RULE_ID = 'rule_deterministic_date_v1';
  private static readonly PARSER_VERSION = '1.0.0';

  public static parse(physicalValue: any, timezone: string = 'UTC'): NormalizedDateResult {
    if (physicalValue === null || physicalValue === undefined || physicalValue === '') {
      return {
        isValid: false,
        physicalValue: String(physicalValue ?? ''),
        normalizedDate: null,
        parserRuleId: this.PARSER_RULE_ID,
        parserVersion: this.PARSER_VERSION,
        timezone,
        reason: 'VALOR_VAZIO'
      };
    }

    const strVal = String(physicalValue).trim();

    // 1. ISO YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss...
    const isoMatch = strVal.match(/^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      if (this.isValidDate(year, month, day)) {
        return {
          isValid: true,
          physicalValue: strVal,
          normalizedDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          parserRuleId: this.PARSER_RULE_ID,
          parserVersion: this.PARSER_VERSION,
          timezone
        };
      }
    }

    // 2. Formato Brasileiro DD/MM/YYYY
    const brMatch = strVal.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brMatch) {
      const day = parseInt(brMatch[1], 10);
      const month = parseInt(brMatch[2], 10);
      const year = parseInt(brMatch[3], 10);
      if (this.isValidDate(year, month, day)) {
        return {
          isValid: true,
          physicalValue: strVal,
          normalizedDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
          parserRuleId: this.PARSER_RULE_ID,
          parserVersion: this.PARSER_VERSION,
          timezone
        };
      }
    }

    // 3. Checagem de ambiguidade (ex: 05/06/2026 pode ser 5 de junho ou 6 de maio se não houver padrão explicitado)
    // Para barras não-ISO que não sigam DD/MM/YYYY estrito ou que permitam MM/DD/YYYY ambíguo:
    const slashMatch = strVal.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      const p1 = parseInt(slashMatch[1], 10);
      const p2 = parseInt(slashMatch[2], 10);
      if (p1 <= 12 && p2 <= 12 && p1 !== p2) {
        // Ambiguidade detectada
        return {
          isValid: false,
          physicalValue: strVal,
          normalizedDate: null,
          parserRuleId: this.PARSER_RULE_ID,
          parserVersion: this.PARSER_VERSION,
          timezone,
          isAmbiguous: true,
          reason: 'DATA_AMBIGUA: Formato numérico ambíguo entre dia/mês.'
        };
      }
    }

    return {
      isValid: false,
      physicalValue: strVal,
      normalizedDate: null,
      parserRuleId: this.PARSER_RULE_ID,
      parserVersion: this.PARSER_VERSION,
      timezone,
      reason: 'FORMATO_INVALIDO: Formato de data não reconhecido.'
    };
  }

  private static isValidDate(year: number, month: number, day: number): boolean {
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1) return false;

    const daysInMonth = [31, (this.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day <= daysInMonth[month - 1];
  }

  private static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }
}
