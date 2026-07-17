/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompensationPolicy {
  id: string;
  name: string;
  baseRate: number; // e.g., 0.015 (1.5%)
  accessoriesRate: number; // e.g., 0.02 (2%)
  partsRate: number; // e.g., 0.01 (1%)
  bonusThresholds: {
    targetAmount: number;
    bonusValue: number;
  }[];
  multipliers: {
    segment: string;
    factor: number;
  }[];
  penalties: {
    metric: "csat" | "cancellation_rate" | "compliance";
    limit: number; // if csat < limit or cancellation_rate > limit
    value: number; // absolute deduction
    reason: string;
  }[];
  campaigns: {
    id: string;
    name: string;
    bonusValue: number;
    targetCategory?: string;
  }[];
}

export interface CollaboratorPerformance {
  collaboratorId: string;
  totalSales: number;
  accessoriesSales: number;
  partsSales: number;
  csat: number; // e.g., 4.5 out of 5
  cancellationRate: number; // e.g., 0.04 (4%)
  campaignParticipated: string[]; // campaign IDs
  lineage: {
    totalSalesCell: string;
    accessoriesSalesCell: string;
    partsSalesCell: string;
    csatCell: string;
    cancellationRateCell: string;
  };
}

export interface CalculationTraceStep {
  name: string;
  formula: string;
  result: number;
  lineage: {
    sourceCell: string;
    sheetName: string;
  } | null;
}

export interface CompensationResult {
  collaboratorId: string;
  baseSalary: number;
  rawCommission: number;
  accessoriesCommission: number;
  partsCommission: number;
  thresholdBonus: number;
  multiplierBonus: number;
  campaignBonus: number;
  penaltyDeductions: number;
  netCommission: number;
  totalEarnings: number;
  trace: CalculationTraceStep[];
}

export class CompensationEngine {
  private policies: Map<string, CompensationPolicy> = new Map();

  constructor() {
    // Register Default Policies
    this.registerPolicy({
      id: "standard_performance",
      name: "Política de Performance Padrão",
      baseRate: 0.015, // 1.5%
      accessoriesRate: 0.02, // 2%
      partsRate: 0.01, // 1%
      bonusThresholds: [
        { targetAmount: 400000, bonusValue: 1500 },
        { targetAmount: 600000, bonusValue: 3000 },
        { targetAmount: 800000, bonusValue: 5000 },
      ],
      multipliers: [
        { segment: "Linha Estratégica", factor: 1.2 },
        { segment: "Linha Padrão", factor: 1.0 },
      ],
      penalties: [
        { metric: "csat", limit: 4.2, value: 500, reason: "CSAT abaixo da meta de 4.2" },
        { metric: "cancellation_rate", limit: 0.05, value: 1000, reason: "Taxa de cancelamento superior a 5%" },
      ],
      campaigns: [
        { id: "campanha_periodo", name: "Campanha Comercial do Período", bonusValue: 1200 },
        { id: "linha_alta_margem", name: "Itens de Alta Margem", bonusValue: 800 },
      ],
    });

    this.registerPolicy({
      id: "standard_volume",
      name: "Política de Volume Padrão",
      baseRate: 0.01, // 1%
      accessoriesRate: 0.015, // 1.5%
      partsRate: 0.008, // 0.8%
      bonusThresholds: [
        { targetAmount: 300000, bonusValue: 1000 },
        { targetAmount: 500000, bonusValue: 2000 },
      ],
      multipliers: [],
      penalties: [
        { metric: "csat", limit: 4.0, value: 300, reason: "CSAT abaixo da meta de 4.0" },
      ],
      campaigns: [
        { id: "campanha_periodo", name: "Campanha Comercial do Período", bonusValue: 600 },
      ],
    });
  }

  public registerPolicy(policy: CompensationPolicy): void {
    this.policies.set(policy.id, policy);
  }

  public getPolicy(policyId: string): CompensationPolicy | undefined {
    return this.policies.get(policyId);
  }

  public getPolicies(): CompensationPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Deterministic, mathematical calculation of collaborator compensation.
   * No AI dependency, fully traceable and verified.
   */
  public calculate(
    performance: CollaboratorPerformance,
    policyId: string,
    baseSalary: number = 3200
  ): CompensationResult {
    const policy = this.policies.get(policyId) || this.policies.get("standard_performance")!;
    const trace: CalculationTraceStep[] = [];

    // 1. Base Salary
    trace.push({
      name: "Salário Base",
      formula: `R$ ${baseSalary.toLocaleString("pt-BR")}`,
      result: baseSalary,
      lineage: { sourceCell: "C4", sheetName: "FOLHA_BASE" },
    });

    // 2. Raw Sales Commission
    const rawComm = performance.totalSales * policy.baseRate;
    trace.push({
      name: "Comissão de Vendas Geral",
      formula: `Faturamento Geral (R$ ${performance.totalSales.toLocaleString("pt-BR")}) x Taxa Base (${(policy.baseRate * 100).toFixed(1)}%)`,
      result: rawComm,
      lineage: { sourceCell: performance.lineage.totalSalesCell, sheetName: "FATURAMENTO" },
    });

    // 3. Accessories Commission
    const accComm = performance.accessoriesSales * policy.accessoriesRate;
    trace.push({
      name: "Comissão de Acessórios",
      formula: `Vendas Acessórios (R$ ${performance.accessoriesSales.toLocaleString("pt-BR")}) x Taxa Acessórios (${(policy.accessoriesRate * 100).toFixed(1)}%)`,
      result: accComm,
      lineage: { sourceCell: performance.lineage.accessoriesSalesCell, sheetName: "ACESSORIOS" },
    });

    // 4. Parts Commission
    const partsComm = performance.partsSales * policy.partsRate;
    trace.push({
      name: "Comissão de Itens",
      formula: `Vendas Itens (R$ ${performance.partsSales.toLocaleString("pt-BR")}) x Taxa Itens (${(policy.partsRate * 100).toFixed(1)}%)`,
      result: partsComm,
      lineage: { sourceCell: performance.lineage.partsSalesCell, sheetName: "ITENS" },
    });

    // 5. Threshold Bonus
    let thresholdBonus = 0;
    const sortedThresholds = [...policy.bonusThresholds].sort((a, b) => b.targetAmount - a.targetAmount);
    const applicableThreshold = sortedThresholds.find((t) => performance.totalSales >= t.targetAmount);
    if (applicableThreshold) {
      thresholdBonus = applicableThreshold.bonusValue;
      trace.push({
        name: "Bônus por Faixa de Meta",
        formula: `Faturamento Geral de R$ ${performance.totalSales.toLocaleString("pt-BR")} superou faixa de R$ ${applicableThreshold.targetAmount.toLocaleString("pt-BR")}`,
        result: thresholdBonus,
        lineage: { sourceCell: "H8", sheetName: "METAS_ANUAIS" },
      });
    } else {
      trace.push({
        name: "Bônus por Faixa de Meta",
        formula: `Nenhuma faixa de faturamento atingida (Meta mínima: R$ ${policy.bonusThresholds[0]?.targetAmount.toLocaleString("pt-BR") || 0})`,
        result: 0,
        lineage: null,
      });
    }

    // 6. Multipliers
    let multiplierBonus = 0;
    const strategicMultiplier = policy.multipliers.find((m) => m.segment === "Linha Estratégica");
    if (strategicMultiplier && performance.totalSales > 500000) {
      const extraFactor = strategicMultiplier.factor - 1.0;
      multiplierBonus = Math.round(rawComm * extraFactor);
      trace.push({
        name: "Multiplicador de Performance Estratégica",
        formula: `Comissão Geral (R$ ${rawComm.toLocaleString("pt-BR")}) x Fator Extra (+${(extraFactor * 100).toFixed(0)}% por vendas estratégicas > R$ 500k)`,
        result: multiplierBonus,
        lineage: { sourceCell: "I14", sheetName: "POLITICA_RECOMPENSAS" },
      });
    }

    // 7. Campaigns Bonus
    let campaignBonus = 0;
    const activeCampaignTraces: string[] = [];
    performance.campaignParticipated.forEach((campId) => {
      const campaign = policy.campaigns.find((c) => c.id === campId);
      if (campaign) {
        campaignBonus += campaign.bonusValue;
        activeCampaignTraces.push(`${campaign.name} (+R$ ${campaign.bonusValue})`);
      }
    });

    if (activeCampaignTraces.length > 0) {
      trace.push({
        name: "Prêmio de Campanhas Ativas",
        formula: activeCampaignTraces.join(" + "),
        result: campaignBonus,
        lineage: { sourceCell: "K3", sheetName: "CAMPANHAS_SAZONAIS" },
      });
    } else {
      trace.push({
        name: "Prêmio de Campanhas Ativas",
        formula: "Nenhuma campanha integrada elegível neste período",
        result: 0,
        lineage: null,
      });
    }

    // 8. Penalties
    let penaltyDeductions = 0;
    const penaltyDetails: string[] = [];
    policy.penalties.forEach((pen) => {
      if (pen.metric === "csat" && performance.csat < pen.limit) {
        penaltyDeductions += pen.value;
        penaltyDetails.push(`Penalidade CSAT (${performance.csat} < ${pen.limit}): -R$ ${pen.value}`);
      }
      if (pen.metric === "cancellation_rate" && performance.cancellationRate > pen.limit) {
        penaltyDeductions += pen.value;
        penaltyDetails.push(`Penalidade Cancelamentos (${(performance.cancellationRate * 100).toFixed(1)}% > ${(pen.limit * 100).toFixed(1)}%): -R$ ${pen.value}`);
      }
    });

    if (penaltyDeductions > 0) {
      trace.push({
        name: "Penalidades Aplicadas",
        formula: penaltyDetails.join(" / "),
        result: -penaltyDeductions,
        lineage: { sourceCell: "N15", sheetName: "GOVERNANÇA_CONTRATO" },
      });
    } else {
      trace.push({
        name: "Penalidades Aplicadas",
        formula: "Fidelidade e conformidade de metas mantidas sem desvios",
        result: 0,
        lineage: null,
      });
    }

    // 9. Totals
    const netCommission = Math.max(0, rawComm + accComm + partsComm + thresholdBonus + multiplierBonus + campaignBonus - penaltyDeductions);
    const totalEarnings = baseSalary + netCommission;

    trace.push({
      name: "Resultado Final Comissões",
      formula: "Comissão Geral + Categorias + Itens + Bônus + Campanhas - Penalidades",
      result: netCommission,
      lineage: null,
    });

    trace.push({
      name: "Remuneração Bruta Total",
      formula: `Salário Base (R$ ${baseSalary.toLocaleString("pt-BR")}) + Comissão Líquida (R$ ${netCommission.toLocaleString("pt-BR")})`,
      result: totalEarnings,
      lineage: null,
    });

    return {
      collaboratorId: performance.collaboratorId,
      baseSalary,
      rawCommission: Math.round(rawComm),
      accessoriesCommission: Math.round(accComm),
      partsCommission: Math.round(partsComm),
      thresholdBonus: Math.round(thresholdBonus),
      multiplierBonus: Math.round(multiplierBonus),
      campaignBonus: Math.round(campaignBonus),
      penaltyDeductions: Math.round(penaltyDeductions),
      netCommission: Math.round(netCommission),
      totalEarnings: Math.round(totalEarnings),
      trace,
    };
  }
}

export const compensationEngine = new CompensationEngine();
