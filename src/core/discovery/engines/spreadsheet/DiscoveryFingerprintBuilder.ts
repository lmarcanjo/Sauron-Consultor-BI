import { DiscoveryContainer, DiscoveryFingerprint } from '../../sdk/DiscoveryContracts';

export class DiscoveryFingerprintBuilder {
  public static build(physicalFingerprint: string, containers: DiscoveryContainer[]): DiscoveryFingerprint {
    const rawStruct = containers
      .map(c => `${c.name}:[${c.columns.map(col => `${col.name}:${col.inferredType}`).join(',')}]`)
      .sort()
      .join('|');

    let hash = 2166136261;
    for (let i = 0; i < rawStruct.length; i++) {
      hash ^= rawStruct.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    const structHash = (hash >>> 0).toString(16).padStart(8, '0');

    return {
      physicalFingerprint,
      structuralFingerprint: `str_disc_${containers.length}_${structHash}`,
      generatedAt: new Date().toISOString()
    };
  }
}
