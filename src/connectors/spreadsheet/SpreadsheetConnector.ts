import {
  IAsterionConnector,
  ConnectorMetadata,
  ConnectorCapability,
  ConnectorExecutionContext,
  ConnectorHealthResult,
  ConnectorValidationResult,
  ConnectorDiscoveryResult,
  ConnectorSyncParams,
  ConnectorSyncBatch
} from '../../core/datasource/sdk/ConnectorContracts';
import { SpreadsheetParser, ParsedSpreadsheet } from './SpreadsheetParser';
import { SpreadsheetFingerprint } from './SpreadsheetFingerprint';
import { SpreadsheetError } from './SpreadsheetErrors';

export interface SpreadsheetConnectorInitParams {
  fileBuffer: Uint8Array | ArrayBuffer;
  filename: string;
}

export class SpreadsheetConnector implements IAsterionConnector {
  public readonly metadata: ConnectorMetadata = {
    id: 'asterion-spreadsheet-connector',
    name: 'ASTERION Official Spreadsheet Connector',
    version: '1.0.0',
    provider: 'ASTERION Core',
    description: 'Conector de planilhas XLSX e CSV sob o princípio de recepção imutável da origem bruta.',
    originType: 'EXCEL',
    supportedCapabilities: [
      'connect',
      'validate',
      'discover',
      'sample',
      'synchronize',
      'health',
      'metadata',
      'schemaEvolution'
    ]
  };

  private parsedSpreadsheet: ParsedSpreadsheet | null = null;
  private physicalFingerprint: string | null = null;
  private structuralFingerprint: string | null = null;

  constructor(private initParams?: SpreadsheetConnectorInitParams) {}

  public supportsCapability(capability: ConnectorCapability): boolean {
    return this.metadata.supportedCapabilities.includes(capability);
  }

  public async connect(ctx: ConnectorExecutionContext): Promise<boolean> {
    if (!ctx.engagementId) {
      throw new Error("EngagementId é obrigatório para conectar o SpreadsheetConnector.");
    }

    if (ctx.parameters?.fileBuffer && ctx.parameters?.filename) {
      this.initParams = {
        fileBuffer: ctx.parameters.fileBuffer,
        filename: ctx.parameters.filename
      };
    }

    if (!this.initParams) {
      throw new SpreadsheetError('FILE_EMPTY', 'Nenhum buffer de arquivo fornecido para o SpreadsheetConnector.');
    }

    this.parsedSpreadsheet = SpreadsheetParser.parse(
      this.initParams.fileBuffer,
      this.initParams.filename
    );

    this.physicalFingerprint = SpreadsheetFingerprint.computePhysical({
      bytes: this.initParams.fileBuffer,
      filename: this.initParams.filename
    });

    this.structuralFingerprint = SpreadsheetFingerprint.computeStructural({
      sheets: this.parsedSpreadsheet.sheets.map(s => ({
        name: s.name,
        columns: s.columns.map(c => c.name),
        types: s.columns.map(c => c.inferredType)
      }))
    });

    return true;
  }

  public async disconnect(ctx: ConnectorExecutionContext): Promise<void> {
    this.parsedSpreadsheet = null;
  }

  public async checkHealth(ctx: ConnectorExecutionContext): Promise<ConnectorHealthResult> {
    const isHealthy = this.parsedSpreadsheet !== null && this.parsedSpreadsheet.sheets.length > 0;
    return {
      status: isHealthy ? 'HEALTHY' : 'UNAVAILABLE',
      message: isHealthy ? `Planilha "${this.parsedSpreadsheet?.filename}" pronta.` : 'Nenhum arquivo de planilha conectado.',
      checkedAt: new Date().toISOString(),
      details: {
        format: this.parsedSpreadsheet?.format,
        sheetsCount: this.parsedSpreadsheet?.sheets.length
      }
    };
  }

  public async validate(ctx: ConnectorExecutionContext): Promise<ConnectorValidationResult> {
    if (!this.parsedSpreadsheet) {
      await this.connect(ctx);
    }

    const errors: string[] = [];
    const warnings: string[] = [...(this.parsedSpreadsheet?.warnings || [])];

    if (!this.parsedSpreadsheet || this.parsedSpreadsheet.sheets.length === 0) {
      errors.push('A planilha não contém abas válidas.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      checkedAt: new Date().toISOString()
    };
  }

  public async discover(ctx: ConnectorExecutionContext): Promise<ConnectorDiscoveryResult> {
    if (!this.parsedSpreadsheet) {
      await this.connect(ctx);
    }

    return {
      containers: this.parsedSpreadsheet!.sheets.map(sheet => ({
        id: sheet.name,
        name: sheet.name,
        type: 'sheet',
        rowCountEstimate: sheet.rowCount,
        columns: sheet.columns.map(col => ({
          name: col.name,
          inferredType: col.inferredType,
          nullable: true
        }))
      })),
      discoveredAt: new Date().toISOString()
    };
  }

  public async sample(ctx: ConnectorExecutionContext, limit: number = 100): Promise<Record<string, any>[]> {
    if (!this.parsedSpreadsheet) {
      await this.connect(ctx);
    }

    const targetSheetName = ctx.parameters?.sheetName || this.parsedSpreadsheet!.sheets[0]?.name;
    const sheet = this.parsedSpreadsheet!.sheets.find(s => s.name === targetSheetName);

    if (!sheet) {
      throw new SpreadsheetError('SHEET_NOT_FOUND', `Aba "${targetSheetName}" não encontrada na planilha.`);
    }

    const effectiveLimit = Math.min(limit, 1000);
    return sheet.rows.slice(0, effectiveLimit);
  }

  public async *synchronize(ctx: ConnectorExecutionContext, params: ConnectorSyncParams): AsyncIterable<ConnectorSyncBatch> {
    if (!this.parsedSpreadsheet) {
      await this.connect(ctx);
    }

    const targetSheetName = ctx.parameters?.sheetName || this.parsedSpreadsheet!.sheets[0]?.name;
    const sheet = this.parsedSpreadsheet!.sheets.find(s => s.name === targetSheetName);

    if (!sheet) {
      throw new SpreadsheetError('SHEET_NOT_FOUND', `Aba "${targetSheetName}" não encontrada para sincronização.`);
    }

    const batchSize = params.batchSize || 500;
    let offset = 0;

    if (params.cursor) {
      offset = parseInt(params.cursor, 10) || 0;
    }

    while (offset < sheet.rows.length) {
      const slice = sheet.rows.slice(offset, offset + batchSize);
      offset += slice.length;

      const hasMore = offset < sheet.rows.length;
      yield {
        records: slice,
        recordsCount: slice.length,
        hasMore,
        nextCursor: hasMore ? String(offset) : undefined,
        fingerprint: this.physicalFingerprint || undefined
      };
    }
  }

  // --- MÉTODOS AUXILIARES DE FINGERPRINT ---
  public getPhysicalFingerprint(): string | null {
    return this.physicalFingerprint;
  }

  public getStructuralFingerprint(): string | null {
    return this.structuralFingerprint;
  }
}
