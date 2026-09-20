import * as XLSX from 'xlsx';
import { SpreadsheetError } from './SpreadsheetErrors';
import { SpreadsheetTypeInference, InferredColumnType } from './SpreadsheetTypeInference';

export interface ParsedSheet {
  name: string;
  rowCount: number;
  columnCount: number;
  columns: Array<{
    name: string;
    originalName: string;
    index: number;
    inferredType: InferredColumnType;
  }>;
  rows: Record<string, any>[];
  hasFormulas: boolean;
  warnings: string[];
}

export interface ParsedSpreadsheet {
  filename: string;
  format: 'XLSX' | 'CSV';
  mimeType: string;
  sizeBytes: number;
  sheets: ParsedSheet[];
  warnings: string[];
}

export interface ParserOptions {
  maxSizeBytes?: number;
  maxSheets?: number;
  maxRows?: number;
  maxColumns?: number;
  sampleRowsLimit?: number;
}

const DEFAULT_OPTIONS: Required<ParserOptions> = {
  maxSizeBytes: 50 * 1024 * 1024, // 50MB
  maxSheets: 20,
  maxRows: 100000,
  maxColumns: 200,
  sampleRowsLimit: 1000
};

export class SpreadsheetParser {
  public static parse(
    fileBuffer: Uint8Array | ArrayBuffer,
    filename: string,
    options?: ParserOptions
  ): ParsedSpreadsheet {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const uint8 = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer);

    if (uint8.length === 0) {
      throw new SpreadsheetError('FILE_EMPTY', `O arquivo "${filename}" está vazio (0 bytes).`);
    }

    if (uint8.length > opts.maxSizeBytes) {
      throw new SpreadsheetError(
        'FILE_TOO_LARGE',
        `O arquivo "${filename}" excede o limite máximo permitido de ${opts.maxSizeBytes / (1024 * 1024)}MB.`
      );
    }

    const format = this.detectFormat(uint8, filename);
    let workbook: XLSX.WorkBook;

    try {
      workbook = XLSX.read(uint8, {
        type: 'array',
        cellFormula: true,
        cellHTML: false,
        cellNF: false,
        cellStyles: false,
        sheetRows: opts.maxRows
      });
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('password')) {
        throw new SpreadsheetError('FILE_ENCRYPTED', `O arquivo "${filename}" está protegido por senha.`, err);
      }
      throw new SpreadsheetError('FILE_CORRUPTED', `Falha ao ler a estrutura do arquivo "${filename}".`, err);
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new SpreadsheetError('FILE_CORRUPTED', `O arquivo "${filename}" não contém abas legíveis.`);
    }

    if (workbook.SheetNames.length > opts.maxSheets) {
      throw new SpreadsheetError(
        'SHEET_LIMIT_EXCEEDED',
        `O arquivo excede o limite máximo de ${opts.maxSheets} abas.`
      );
    }

    const parsedSheets: ParsedSheet[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const parsedSheet = this.parseWorksheet(worksheet, sheetName, opts);
      parsedSheets.push(parsedSheet);
    }

    return {
      filename,
      format,
      mimeType: format === 'XLSX' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
      sizeBytes: uint8.length,
      sheets: parsedSheets,
      warnings: []
    };
  }

  private static detectFormat(uint8: Uint8Array, filename: string): 'XLSX' | 'CSV' {
    const ext = filename.split('.').pop()?.toLowerCase();

    // Verificação de Assinatura ZIP / XLSX (50 4B 03 04)
    const isZipSignature = uint8.length >= 4 && uint8[0] === 0x50 && uint8[1] === 0x4b && uint8[2] === 0x03 && uint8[3] === 0x04;

    if (ext === 'xlsx') {
      if (!isZipSignature) {
        throw new SpreadsheetError(
          'INVALID_SIGNATURE',
          `Inconsistência detectada: O arquivo "${filename}" possui extensão .xlsx mas não é um arquivo ZIP/XLSX válido.`
        );
      }
      return 'XLSX';
    }

    if (ext === 'csv') {
      if (isZipSignature) {
        throw new SpreadsheetError(
          'INVALID_SIGNATURE',
          `Inconsistência detectada: O arquivo "${filename}" possui extensão .csv mas é um arquivo binário ZIP/XLSX.`
        );
      }
      return 'CSV';
    }

    if (isZipSignature) return 'XLSX';
    return 'CSV';
  }

  private static parseWorksheet(worksheet: XLSX.WorkSheet, sheetName: string, opts: Required<ParserOptions>): ParsedSheet {
    const jsonRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { header: 1, raw: true });

    if (jsonRows.length === 0) {
      return {
        name: sheetName,
        rowCount: 0,
        columnCount: 0,
        columns: [],
        rows: [],
        hasFormulas: false,
        warnings: ['Aba totalmente vazia.']
      };
    }

    // Identificação conservadora da linha de cabeçalho
    const headerRow = (jsonRows[0] as any[]) || [];
    if (headerRow.length > opts.maxColumns) {
      throw new SpreadsheetError(
        'COLUMN_LIMIT_EXCEEDED',
        `A aba "${sheetName}" excede o limite máximo de ${opts.maxColumns} colunas.`
      );
    }

    const columns: ParsedSheet['columns'] = [];
    const seenNames = new Map<string, number>();

    headerRow.forEach((colNameRaw, idx) => {
      const originalName = String(colNameRaw || `Coluna_${idx + 1}`).trim();
      let uniqueName = originalName;

      // Trata cabeçalhos duplicados adicionando índice sem apagar o original
      if (seenNames.has(originalName)) {
        const count = seenNames.get(originalName)! + 1;
        seenNames.set(originalName, count);
        uniqueName = `${originalName}_${count}`;
      } else {
        seenNames.set(originalName, 1);
      }

      columns.push({
        name: uniqueName,
        originalName,
        index: idx,
        inferredType: 'UNKNOWN'
      });
    });

    const dataRowsRaw = jsonRows.slice(1);
    const rows: Record<string, any>[] = [];
    let hasFormulas = false;

    // Detecta presença de fórmulas sem executá-las
    for (const key in worksheet) {
      if (key.startsWith('!')) continue;
      if (worksheet[key] && worksheet[key].f) {
        hasFormulas = true;
        break;
      }
    }

    for (const rawRow of dataRowsRaw) {
      if (!Array.isArray(rawRow)) continue;
      const rowObject: Record<string, any> = {};

      columns.forEach(col => {
        rowObject[col.name] = rawRow[col.index] !== undefined ? rawRow[col.index] : null;
      });

      rows.push(rowObject);
    }

    // Inferência de Tipos por Coluna
    columns.forEach(col => {
      const sampleValues = rows.slice(0, opts.sampleRowsLimit).map(r => r[col.name]);
      col.inferredType = SpreadsheetTypeInference.inferType(sampleValues);
    });

    return {
      name: sheetName,
      rowCount: rows.length,
      columnCount: columns.length,
      columns,
      rows,
      hasFormulas,
      warnings: hasFormulas ? ['Planilha contém fórmulas. Os valores calculados em cache foram lidos sem execução de fórmulas.'] : []
    };
  }
}
