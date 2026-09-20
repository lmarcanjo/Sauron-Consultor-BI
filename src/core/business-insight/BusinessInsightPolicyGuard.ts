import { TrustArtifact, CertifiableUsageType, TrustState } from '../trust/TrustContracts';
import { BusinessInsightError, BusinessInsightExecutionContext } from './BusinessInsightSDK';
import { BusinessInsightCapability } from './BusinessArtifactContracts';

export interface CapabilityUsageRule {
  readonly capability: BusinessInsightCapability;
  readonly allowedTrustUsages: readonly CertifiableUsageType[];
  readonly allowedTrustStates: readonly TrustState[];
  readonly requiredArtifacts: readonly ('Discovery' | 'Quality' | 'Evidence' | 'Semantic' | 'Confirmation')[];
  readonly incompatibleLimitations: readonly string[];
}

export const CAPABILITY_USAGE_POLICY_MATRIX: readonly CapabilityUsageRule[] = Object.freeze([
  {
    capability: 'DESCRIPTIVE_ANALYSIS',
    allowedTrustUsages: ['EXPLORATORY_ANALYSIS', 'INTERNAL_MONITORING', 'OPERATIONAL_DIAGNOSIS', 'FINANCIAL_ANALYSIS', 'EXECUTIVE_PRESENTATION', 'EXTERNAL_REPORTING'],
    allowedTrustStates: ['TRUSTED', 'CONDITIONALLY_TRUSTED', 'LIMITED'],
    requiredArtifacts: ['Discovery'],
    incompatibleLimitations: []
  },
  {
    capability: 'VARIANCE_ANALYSIS',
    allowedTrustUsages: ['INTERNAL_MONITORING', 'OPERATIONAL_DIAGNOSIS', 'FINANCIAL_ANALYSIS', 'EXECUTIVE_PRESENTATION'],
    allowedTrustStates: ['TRUSTED', 'CONDITIONALLY_TRUSTED'],
    requiredArtifacts: ['Discovery', 'Quality'],
    incompatibleLimitations: ['HISTORICO_INCOMPLETO', 'AUSENCIA_BASE_TEMPORAL']
  },
  {
    capability: 'TREND_ANALYSIS',
    allowedTrustUsages: ['INTERNAL_MONITORING', 'OPERATIONAL_DIAGNOSIS', 'FINANCIAL_ANALYSIS', 'EXECUTIVE_PRESENTATION'],
    allowedTrustStates: ['TRUSTED', 'CONDITIONALLY_TRUSTED'],
    requiredArtifacts: ['Discovery', 'Quality'],
    incompatibleLimitations: ['SERIE_TEMPORAL_INSUFICIENTE']
  },
  {
    capability: 'COMPARATIVE_ANALYSIS',
    allowedTrustUsages: ['INTERNAL_MONITORING', 'OPERATIONAL_DIAGNOSIS', 'FINANCIAL_ANALYSIS', 'EXECUTIVE_PRESENTATION'],
    allowedTrustStates: ['TRUSTED', 'CONDITIONALLY_TRUSTED'],
    requiredArtifacts: ['Discovery', 'Semantic', 'Confirmation'],
    incompatibleLimitations: ['PERIODOS_INCOMPATIVEIS']
  },
  {
    capability: 'ACTION_HYPOTHESIS_GENERATION',
    allowedTrustUsages: ['FINANCIAL_ANALYSIS', 'EXECUTIVE_PRESENTATION', 'EXTERNAL_REPORTING'],
    allowedTrustStates: ['TRUSTED'],
    requiredArtifacts: ['Discovery', 'Quality', 'Evidence', 'Semantic', 'Confirmation'],
    incompatibleLimitations: ['AMOSTRAGEM_INSUFICIENTE', 'RECENCIA_COMPROMETIDA']
  }
]);

export class BusinessInsightPolicyGuard {
  /**
   * Valida obrigatoriamente as pré-condições de governança e matriz de capability do TrustArtifact antes de qualquer execução
   */
  public static validateExecution(context: BusinessInsightExecutionContext, requiredTrustUsage: CertifiableUsageType): void {
    const { trustArtifact, scope, requiredCapability } = context;

    if (!trustArtifact) {
      throw new BusinessInsightError(
        'INSUFFICIENT_GOVERNED_INPUT',
        'Nenhum TrustArtifact foi fornecido. Motores de negócio não podem ser executados sem governança.'
      );
    }

    // 1. Verificação de Invalidação ou Arquivamento
    if (trustArtifact.trustAssessment.overallState === 'INVALIDATED') {
      throw new BusinessInsightError(
        'TRUST_ARTIFACT_INVALIDATED',
        `O TrustArtifact ${trustArtifact.artifactId} encontra-se no estado INVALIDATED por atualização de schema ou política.`
      );
    }

    // 2. Verificação de Bloqueio Crítico
    if (trustArtifact.trustAssessment.overallState === 'BLOCKED') {
      throw new BusinessInsightError(
        'TRUST_ARTIFACT_BLOCKED',
        `A execução do motor foi bloqueada pelo Trust Engine. Motivo: ${trustArtifact.trustAssessment.primaryBlockingReason || 'Bloqueio crítico de governança.'}`
      );
    }

    // 3. Verificação de Uso Certificável
    const usageAssessment = trustArtifact.usageAssessments.find(u => u.usageType === requiredTrustUsage);
    if (!usageAssessment) {
      throw new BusinessInsightError(
        'UNSUPPORTED_TRUST_USAGE',
        `O uso de confiança ${requiredTrustUsage} não foi avaliado pela política vigente no TrustArtifact.`
      );
    }

    if (usageAssessment.status === 'BLOCKED') {
      throw new BusinessInsightError(
        'TRUST_USAGE_NOT_ALLOWED',
        `O uso de confiança ${requiredTrustUsage} está no estado BLOCKED no TrustArtifact.`
      );
    }

    // 4. Validação da Matriz de Capability por Uso e Limitações Incompatíveis
    const capabilityRule = CAPABILITY_USAGE_POLICY_MATRIX.find(r => r.capability === requiredCapability);
    if (capabilityRule) {
      if (!capabilityRule.allowedTrustUsages.includes(requiredTrustUsage)) {
        throw new BusinessInsightError(
          'UNSUPPORTED_CAPABILITY',
          `A capacidade ${requiredCapability} não é permitida sob o uso de confiança ${requiredTrustUsage}.`
        );
      }

      if (!capabilityRule.allowedTrustStates.includes(trustArtifact.trustAssessment.overallState)) {
        throw new BusinessInsightError(
          'UNSUPPORTED_CAPABILITY',
          `A capacidade ${requiredCapability} não é permitida quando o TrustArtifact está no estado ${trustArtifact.trustAssessment.overallState}.`
        );
      }

      // Verificação de Limitações Incompatíveis com a Capability
      for (const incompLim of capabilityRule.incompatibleLimitations) {
        if (trustArtifact.limitations.some(l => l.toUpperCase().includes(incompLim))) {
          throw new BusinessInsightError(
            'LIMITATION_PROPAGATION_REQUIRED',
            `A capacidade ${requiredCapability} foi bloqueada devido à limitação incompatível '${incompLim}' presente no TrustArtifact.`
          );
        }
      }
    }

    // 5. Validação de Escopo de Engajamento
    if (scope.engagementId !== trustArtifact.engagementId) {
      throw new BusinessInsightError(
        'INCOMPATIBLE_ARTIFACTS',
        `O engagementId do escopo (${scope.engagementId}) difere do pertencente ao TrustArtifact (${trustArtifact.engagementId}).`
      );
    }
  }
}
