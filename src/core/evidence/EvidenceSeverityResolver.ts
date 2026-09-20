import { EvidenceSeverity } from './EvidenceContracts';

export class EvidenceSeverityResolver {
  public static resolveFromType(inferredType: string): EvidenceSeverity {
    if (inferredType === 'EMPTY' || inferredType === 'MIXED') {
      return 'WARNING';
    }
    return 'INFO';
  }

  public static resolveFromAlert(alertSeverity: 'INFO' | 'WARNING' | 'CRITICAL'): EvidenceSeverity {
    switch (alertSeverity) {
      case 'CRITICAL':
        return 'CRITICAL';
      case 'WARNING':
        return 'WARNING';
      case 'INFO':
      default:
        return 'INFO';
    }
  }
}
