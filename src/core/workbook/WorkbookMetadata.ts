import { WorkbookSourceMetadata } from "./WorkbookTypes";

export function extractExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? `.${parts.pop()}`.toLowerCase() : "";
}

export async function hashBuffer(buffer: ArrayBuffer): Promise<string> {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.subtle) {
    const digest = await cryptoApi.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
  }

  let hash = 0;
  const bytes = new Uint8Array(buffer);
  bytes.forEach(byte => {
    hash = ((hash << 5) - hash + byte) | 0;
  });
  return `fallback-${Math.abs(hash).toString(16)}`;
}

function extractLibreOfficeVersion(application?: string): string | undefined {
  if (!application) return undefined;
  const match = application.match(/LibreOffice\/([^$\s]+)/i);
  return match?.[1];
}

export function buildWorkbookMetadata(params: {
  id: string;
  fileName: string;
  hash: string;
  importedAt: string;
  sizeBytes?: number;
  props?: Record<string, any>;
  sheetCount: number;
  rowCount: number;
  columnCount: number;
  cellCount: number;
}): WorkbookSourceMetadata {
  const props = params.props || {};
  const application = String(props.Application || "");

  return {
    id: params.id,
    name: params.fileName,
    extension: extractExtension(params.fileName),
    importedAt: params.importedAt,
    hash: params.hash,
    sizeBytes: params.sizeBytes,
    sheetCount: params.sheetCount,
    rowCount: params.rowCount,
    columnCount: params.columnCount,
    cellCount: params.cellCount,
    author: props.Author || props.LastAuthor || undefined,
    company: props.Company || undefined,
    lastModified: props.ModifiedDate ? new Date(props.ModifiedDate).toISOString() : undefined,
    officeVersion: props.AppVersion || props.Version || undefined,
    libreOfficeVersion: extractLibreOfficeVersion(application),
    encoding: "UTF-8",
    language: props.Language || undefined,
  };
}

