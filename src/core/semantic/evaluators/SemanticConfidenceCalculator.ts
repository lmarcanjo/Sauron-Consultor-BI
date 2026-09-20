import { ConfidenceBand } from '../SemanticContracts';

export interface ConfidenceCalculationParams {
  lexicalMatchScore: number;     // 0.0 a 1.0
  typeMatchScore: number;        // 0.0 a 1.0
  evidenceCount: number;
  coverageRatio?: number;        // 0.0 a 1.0
  hasContradiction: boolean;
  isEvidenceTruncated: boolean;
  hasPhysicalRelationshipEvidence?: boolean;
}

export class SemanticConfidenceCalculator {
  // Limites e constantes objetivas documentadas e imutáveis
  public static readonly MAX_EVIDENCE_BONUS = 0.05;
  public static readonly CONTRADICTION_PENALTY_FACTOR = 0.60;
  public static readonly TRUNCATION_CAP = 0.80;

  public static calculate(params: ConfidenceCalculationParams): { score: number; band: ConfidenceBand } {
    let lexical = isNaN(params.lexicalMatchScore) ? 0 : Math.max(0, Math.min(1, params.lexicalMatchScore));
    let typeMatch = isNaN(params.typeMatchScore) ? 0 : Math.max(0, Math.min(1, params.typeMatchScore));

    let score = (lexical * 0.5) + (typeMatch * 0.5);

    // Ajuste determinístico por quantidade de evidências (Bônus Máximo: 0.05)
    if (params.evidenceCount >= 2) {
      score += this.MAX_EVIDENCE_BONUS;
    }

    // Ajuste por cobertura de amostragem (normalizado de forma segura)
    if (params.coverageRatio !== undefined && !isNaN(params.coverageRatio)) {
      const normalizedCoverage = Math.max(0, Math.min(1, params.coverageRatio));
      if (normalizedCoverage < 0.5) {
        score *= (0.5 + normalizedCoverage * 0.5);
      }
    }

    // Penalidade por contradição
    if (params.hasContradiction) {
      score *= this.CONTRADICTION_PENALTY_FACTOR;
    }

    // Bônus para relacionamento físico (se aplicável)
    if (params.hasPhysicalRelationshipEvidence) {
      score += 0.10;
    }

    // Teto de confiança para evidências truncadas
    if (params.isEvidenceTruncated && score > this.TRUNCATION_CAP) {
      score = this.TRUNCATION_CAP;
    }

    // CLAMP RIGOROSO ENTRE 0.00 E 1.00 (Previne NaN, Infinity ou estouro de teto)
    if (isNaN(score) || !isFinite(score)) {
      score = 0.0;
    } else {
      score = Math.max(0.0, Math.min(1.0, Math.round(score * 100) / 100));
    }

    let band: ConfidenceBand = 'LOW';
    if (score >= 0.85) {
      band = 'HIGH';
    } else if (score >= 0.60) {
      band = 'MEDIUM';
    }

    return { score, band };
  }
}
