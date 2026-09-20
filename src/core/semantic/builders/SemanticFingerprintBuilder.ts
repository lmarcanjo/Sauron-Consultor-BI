import { FieldInterpretation, SemanticFingerprint } from '../SemanticContracts';

export class SemanticFingerprintBuilder {
  public static build(
    discoveryFingerprint: string,
    evidenceHash: string,
    fieldInterpretations: readonly FieldInterpretation[]
  ): SemanticFingerprint {
    // 1. Ordenação canônica determinística imutável (independe de timestamps voláteis, explicações de apresentação ou ordem dos arrays)
    const sortedTokens = fieldInterpretations
      .map(f => {
        const topSugg = f.suggestedInterpretations[0];
        const suggKey = topSugg ? `${topSugg.category}:${topSugg.confidenceBand}:${topSugg.confidenceScore}:${topSugg.status}` : 'NONE';
        const evKey = (f.sourceEvidenceIds || []).slice().sort().join(',');
        return `${f.containerId}:${f.physicalName}:${f.observedType}:${f.interpretationStatus}:${suggKey}:${evKey}`;
      })
      .sort();

    const canonicalContent = sortedTokens.join('||');

    // 2. FNV-1a Hash de 32-bit em Hexadecimal (8 caracteres)
    let hash = 2166136261;
    for (let i = 0; i < canonicalContent.length; i++) {
      hash ^= canonicalContent.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const semanticHashStr = (hash >>> 0).toString(16).padStart(8, '0');

    return Object.freeze({
      discoveryFingerprint,
      evidenceHash,
      semanticHash: `sem_hash_${fieldInterpretations.length}_${semanticHashStr}`,
      algorithm: 'FNV1A_32_CANONICAL',
      generatedAt: new Date().toISOString()
    });
  }
}
