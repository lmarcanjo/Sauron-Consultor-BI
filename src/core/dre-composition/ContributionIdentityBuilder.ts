import { ContributionIdentity, DRECompositionError } from './DRECompositionContracts';

export class ContributionIdentityBuilder {
  public static build(identity: ContributionIdentity): {
    identity: ContributionIdentity;
    canonicalSerialization: string;
    canonicalKey: string;
  } {
    // Validar campos obrigatórios
    if (!identity.dataSourceId) throw new DRECompositionError('INVALID_CONTRIBUTION_IDENTITY', 'dataSourceId é obrigatório na ContributionIdentity.');
    if (identity.schemaVersionNumber === undefined || identity.schemaVersionNumber === null) throw new DRECompositionError('INVALID_CONTRIBUTION_IDENTITY', 'schemaVersionNumber é obrigatório na ContributionIdentity.');
    if (!identity.containerId) throw new DRECompositionError('INVALID_CONTRIBUTION_IDENTITY', 'containerId é obrigatório na ContributionIdentity.');
    if (!identity.sourceRecordIdentity) throw new DRECompositionError('INVALID_CONTRIBUTION_IDENTITY', 'sourceRecordIdentity é obrigatório na ContributionIdentity.');
    if (!identity.monetaryFieldPhysicalName) throw new DRECompositionError('INVALID_CONTRIBUTION_IDENTITY', 'monetaryFieldPhysicalName é obrigatório na ContributionIdentity.');
    if (!identity.categoryFieldPhysicalName) throw new DRECompositionError('INVALID_CONTRIBUTION_IDENTITY', 'categoryFieldPhysicalName é obrigatório na ContributionIdentity.');
    if (!identity.classificationDecisionId) throw new DRECompositionError('INVALID_CONTRIBUTION_IDENTITY', 'classificationDecisionId é obrigatório na ContributionIdentity.');
    if (!identity.periodId) throw new DRECompositionError('INVALID_CONTRIBUTION_IDENTITY', 'periodId é obrigatório na ContributionIdentity.');
    if (!identity.currencyCode) throw new DRECompositionError('INVALID_CONTRIBUTION_IDENTITY', 'currencyCode é obrigatório na ContributionIdentity.');

    // Serialização Canônica Determinística
    const canonicalSerialization = [
      `dataSourceId:${identity.dataSourceId}`,
      `schemaVersionNumber:${identity.schemaVersionNumber}`,
      `containerId:${identity.containerId}`,
      `sourceRecordIdentity:${identity.sourceRecordIdentity}`,
      `monetaryFieldPhysicalName:${identity.monetaryFieldPhysicalName}`,
      `categoryFieldPhysicalName:${identity.categoryFieldPhysicalName}`,
      `classificationDecisionId:${identity.classificationDecisionId}`,
      `periodId:${identity.periodId}`,
      `currencyCode:${identity.currencyCode}`
    ].join('::');

    // Chave FNV-1a Hash
    let hash = 0x811c9dc5;
    for (let i = 0; i < canonicalSerialization.length; i++) {
      hash ^= canonicalSerialization.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    const canonicalKey = `fnv1a_contrib_${(hash >>> 0).toString(16)}`;

    return {
      identity: Object.freeze({ ...identity }),
      canonicalSerialization,
      canonicalKey
    };
  }
}
