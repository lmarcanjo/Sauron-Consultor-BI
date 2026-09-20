import { DREArtifact, DRECompositionExecutionContext } from './DRECompositionContracts';

export interface TemporalValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export class DRETemporalProvenanceValidator {
  public static validate(artifact: DREArtifact, context: DRECompositionExecutionContext): TemporalValidationResult {
    const errors: string[] = [];

    if (!artifact) {
      return { isValid: false, errors: ['DREArtifact é obrigatório.'] };
    }

    if (!artifact.periods || artifact.periods.length === 0) {
      errors.push('DREArtifact deve possuir ao menos um DREPeriod registrado.');
    }

    for (const line of artifact.lines) {
      if (!line.periodValues) {
        errors.push(`Linha ${line.lineId} não possui periodValues registrado.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
