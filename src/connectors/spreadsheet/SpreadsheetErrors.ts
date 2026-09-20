export class SpreadsheetError extends Error {
  constructor(
    public readonly code:
      | 'UNSUPPORTED_FORMAT'
      | 'FILE_EMPTY'
      | 'FILE_CORRUPTED'
      | 'FILE_TOO_LARGE'
      | 'FILE_ENCRYPTED'
      | 'INVALID_MIME_TYPE'
      | 'INVALID_SIGNATURE'
      | 'SHEET_NOT_FOUND'
      | 'SHEET_LIMIT_EXCEEDED'
      | 'ROW_LIMIT_EXCEEDED'
      | 'COLUMN_LIMIT_EXCEEDED'
      | 'PARSE_FAILED'
      | 'DISCOVERY_FAILED'
      | 'SYNCHRONIZATION_FAILED',
    message: string,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'SpreadsheetError';
    Object.setPrototypeOf(this, SpreadsheetError.prototype);
  }
}
