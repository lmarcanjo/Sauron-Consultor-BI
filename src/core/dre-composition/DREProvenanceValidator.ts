import {
  DREArtifact,
  DRELine,
  DRESection,
  DREProvenance,
  DRECompositionExecutionContext
} from './DRECompositionContracts';

export interface DREProvenanceValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
}

export class DREProvenanceValidator {
  public static validateProvenance(
    artifact: DREArtifact,
    context: DRECompositionExecutionContext
  ): DREProvenanceValidationResult {
    const errors: string[] = [];

    // 1. Validar referências de DataSource e Schema
    if (!artifact.dataSourceIds.includes(context.dataSourceId)) {
      errors.push(`Provenance Error: dataSourceId ${context.dataSourceId} ausente no artefato.`);
    }

    if (!artifact.schemaVersionReferences.includes(context.schemaVersionNumber)) {
      errors.push(`Provenance Error: schemaVersionNumber ${context.schemaVersionNumber} ausente no artefato.`);
    }

    // 2. Validar referências de artefatos a montante
    if (context.financialClassificationArtifact && !artifact.financialClassificationArtifactIds.includes(context.financialClassificationArtifact.artifactId)) {
      errors.push(`Provenance Error: FinancialClassificationArtifact ID ${context.financialClassificationArtifact.artifactId} ausente.`);
    }

    if (context.trustArtifact && !artifact.trustArtifactIds.includes(context.trustArtifact.artifactId)) {
      errors.push(`Provenance Error: TrustArtifact ID ${context.trustArtifact.artifactId} ausente.`);
    }

    if (context.semanticConfirmationArtifact && !artifact.semanticConfirmationArtifactIds.includes(context.semanticConfirmationArtifact.artifactId)) {
      errors.push(`Provenance Error: SemanticConfirmationArtifact ID ${context.semanticConfirmationArtifact.artifactId} ausente.`);
    }

    // 3. Validar proveniência de cada DRELine
    for (const line of artifact.lines) {
      if (!line.financialClassificationDecisionIds || line.financialClassificationDecisionIds.length === 0) {
        errors.push(`Line Provenance Error: Linha ${line.lineCode} sem decision ID.`);
      }
      if (!line.sourceCategoryIdentities || line.sourceCategoryIdentities.length === 0) {
        errors.push(`Line Provenance Error: Linha ${line.lineCode} sem categoryIdentity.`);
      }
      if (!line.provenance || !line.provenance.financialClassificationArtifactId) {
        errors.push(`Line Provenance Error: Linha ${line.lineCode} sem referência ao artefato de classificação.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
