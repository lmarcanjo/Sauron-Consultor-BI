export interface PhysicalFingerprintParams {
  bytes: Uint8Array | ArrayBuffer;
  filename: string;
}

export interface StructuralFingerprintParams {
  sheets: Array<{
    name: string;
    columns: string[];
    types: string[];
  }>;
}

export class SpreadsheetFingerprint {
  public static computePhysical(params: PhysicalFingerprintParams): string {
    const uint8 = params.bytes instanceof Uint8Array ? params.bytes : new Uint8Array(params.bytes);
    let hash = 2166136261;
    
    // Hash determinístico dos bytes do arquivo (FNV-1a)
    for (let i = 0; i < uint8.length; i++) {
      hash ^= uint8[i];
      hash = Math.imul(hash, 16777619);
    }

    const byteHash = (hash >>> 0).toString(16).padStart(8, '0');
    return `phy_${params.filename}_${uint8.length}_${byteHash}`;
  }

  public static computeStructural(params: StructuralFingerprintParams): string {
    const rawString = params.sheets
      .map(s => `${s.name}:[${s.columns.join(',')}]-[${s.types.join(',')}]`)
      .sort()
      .join('|');

    let hash = 2166136261;
    for (let i = 0; i < rawString.length; i++) {
      hash ^= rawString.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const structHash = (hash >>> 0).toString(16).padStart(8, '0');
    return `str_${params.sheets.length}_${structHash}`;
  }
}
