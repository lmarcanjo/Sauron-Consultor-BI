import { FieldSemanticDecision, SemanticConfirmationFingerprint } from './SemanticConfirmationContracts';

export class SemanticConfirmationFingerprintBuilder {
  public static build(semanticArtifactId: string, decisions: readonly FieldSemanticDecision[]): SemanticConfirmationFingerprint {
    // Ordenação determinística imutável (independe de ordem dos arrays ou timestamps)
    const sortedTokens = decisions
      .map(d => `${d.containerId}:${d.physicalName}:${d.decision}:${d.selectedInterpretationId || 'NONE'}:${d.consultantLabel || 'NONE'}`)
      .sort();

    const canonicalContent = sortedTokens.join('||');

    let hash = 2166136261;
    for (let i = 0; i < canonicalContent.length; i++) {
      hash ^= canonicalContent.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const hashStr = (hash >>> 0).toString(16).padStart(8, '0');

    return Object.freeze({
      semanticArtifactId,
      confirmationHash: `conf_hash_${decisions.length}_${hashStr}`,
      algorithm: 'FNV1A_32_CANONICAL',
      generatedAt: new Date().toISOString()
    });
  }
}
