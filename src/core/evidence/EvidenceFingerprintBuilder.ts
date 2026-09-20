import { EvidenceItem, EvidenceFingerprint } from './EvidenceContracts';

export class EvidenceFingerprintBuilder {
  public static build(discoveryFingerprint: string, qualityArtifactId: string, evidences: EvidenceItem[]): EvidenceFingerprint {
    // 1. Ordenação canônica determinística imutável baseada no conteúdo completo da evidência
    const sortedTokens = evidences
      .map(e => {
        const provKey = `${e.provenance.sourceArtifactType}:${e.provenance.containerId || ''}:${e.provenance.columnName || ''}:${e.provenance.relationshipId || ''}:${e.provenance.alertId || ''}`;
        const typeDetails = e.type === 'STRUCTURAL' ? `${(e.details as any)?.inferredType || ''}:${(e.details as any)?.nullsCount || 0}` : '';
        return `${e.type}|${e.code}|${e.severity}|${provKey}|${typeDetails}`;
      })
      .sort();

    const canonicalContent = sortedTokens.join('||');

    // 2. FNV-1a Hash de 32-bit em Hexadecimal (8 caracteres)
    let hash = 2166136261;
    for (let i = 0; i < canonicalContent.length; i++) {
      hash ^= canonicalContent.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const hashStr = (hash >>> 0).toString(16).padStart(8, '0');

    return {
      discoveryFingerprint,
      qualityArtifactId,
      evidenceHash: `ev_hash_${evidences.length}_${hashStr}`,
      generatedAt: new Date().toISOString()
    };
  }
}
