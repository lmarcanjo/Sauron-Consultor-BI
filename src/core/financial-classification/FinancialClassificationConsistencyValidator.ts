import {
  ClassificationType,
  FinancialNature,
  StatementGroup,
  SignPolicy,
  DeclarativeCustomRule,
  FinancialClassificationDecision,
  FinancialClassificationArtifactStatus
} from './FinancialClassificationContracts';

export interface ValidationIssue {
  readonly code: string;
  readonly severity: 'ERROR' | 'WARNING';
  readonly message: string;
}

export class FinancialClassificationConsistencyValidator {
  public static validateDecision(
    decision: Omit<FinancialClassificationDecision, 'decisionId' | 'decidedAt'>
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // 1. NON_FINANCIAL deve utilizar StatementGroup UNCLASSIFIED
    if (decision.classificationType === 'NON_FINANCIAL' && decision.statementGroup !== 'UNCLASSIFIED') {
      issues.push({
        code: 'NON_FINANCIAL_GROUP_MISMATCH',
        severity: 'ERROR',
        message: 'Categorias NON_FINANCIAL devem obrigatoriamente utilizar o StatementGroup UNCLASSIFIED.'
      });
    }

    // 2. UNRESOLVED não pode ser confirmada no modelo final
    if (decision.classificationType === 'UNRESOLVED' && decision.status === 'CONFIRM_CLASSIFICATION') {
      issues.push({
        code: 'UNRESOLVED_CONFIRMATION_FORBIDDEN',
        severity: 'ERROR',
        message: 'Categorias UNRESOLVED não podem possuir o status de decisão CONFIRM_CLASSIFICATION.'
      });
    }

    // 3. INFLOW com ABSOLUTE_VALUE_AS_OUTFLOW é uma combinação conflitante
    if (decision.classificationType === 'INFLOW' && decision.signPolicy === 'ABSOLUTE_VALUE_AS_OUTFLOW') {
      if (!decision.rationale || decision.rationale.trim().length < 10) {
        issues.push({
          code: 'INFLOW_OUTFLOW_SIGN_CONFLICT',
          severity: 'ERROR',
          message: 'Combinação de INFLOW com ABSOLUTE_VALUE_AS_OUTFLOW exige justificativa do consultor (mínimo 10 caracteres).'
        });
      } else {
        issues.push({
          code: 'INFLOW_OUTFLOW_SIGN_WARNING',
          severity: 'WARNING',
          message: 'INFLOW configurado para forçar valor absoluto negativo. Verifique a coerência do fluxo.'
        });
      }
    }

    // 4. OUTFLOW com ABSOLUTE_VALUE_AS_INFLOW é uma combinação conflitante
    if (decision.classificationType === 'OUTFLOW' && decision.signPolicy === 'ABSOLUTE_VALUE_AS_INFLOW') {
      if (!decision.rationale || decision.rationale.trim().length < 10) {
        issues.push({
          code: 'OUTFLOW_INFLOW_SIGN_CONFLICT',
          severity: 'ERROR',
          message: 'Combinação de OUTFLOW com ABSOLUTE_VALUE_AS_INFLOW exige justificativa do consultor (mínimo 10 caracteres).'
        });
      } else {
        issues.push({
          code: 'OUTFLOW_INFLOW_SIGN_WARNING',
          severity: 'WARNING',
          message: 'OUTFLOW configurado para forçar valor absoluto positivo. Verifique a coerência do fluxo.'
        });
      }
    }

    // 5. CUSTOM_RULE exige contrato declarativo válido
    if (decision.signPolicy === 'CUSTOM_RULE') {
      if (!decision.customRule) {
        issues.push({
          code: 'CUSTOM_RULE_MISSING',
          severity: 'ERROR',
          message: 'SignPolicy CUSTOM_RULE exige que um objeto DeclarativeCustomRule válido seja fornecido.'
        });
      }
    }

    return issues;
  }

  public static validateStateTransition(
    currentStatus: FinancialClassificationArtifactStatus,
    newStatus: FinancialClassificationArtifactStatus
  ): boolean {
    const validTransitions: Record<FinancialClassificationArtifactStatus, readonly FinancialClassificationArtifactStatus[]> = {
      DRAFT: ['IN_REVIEW', 'INVALIDATED'],
      IN_REVIEW: ['DRAFT', 'CONFIRMED', 'INVALIDATED'],
      CONFIRMED: ['REASSESSMENT_REQUIRED', 'SUPERSEDED', 'INVALIDATED'],
      REASSESSMENT_REQUIRED: ['SUPERSEDED', 'INVALIDATED'],
      SUPERSEDED: [], // Estado final
      INVALIDATED: [] // Estado final
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
}
