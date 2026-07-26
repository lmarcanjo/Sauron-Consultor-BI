/** No production consumer remains on the removed compatibility family. */
export const LEGACY_IMPORT_ALLOWLIST: Record<string, string> = {};

export const LEGACY_MODULE_PATTERNS = [
  /(?:from\s+[^;"'\n]*["'][^"'\n]*(?:DataSourceManager|dataSourceManager)[^"'\n]*["']|import\s+["'][^"'\n]*(?:DataSourceManager|dataSourceManager)[^"'\n]*["'])/,
];
