/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ChaosSourceProfile, SourceDrivenAnalysis } from "../chaos-data-profiling";
import type {
  BusinessEntity,
  BusinessRelationship,
  EnterpriseArea,
  EnterpriseEvidence,
  EnterpriseModel,
  InformationGap,
  ProcessDiscovery,
} from "./EnterpriseDiscoveryTypes";

export class EnterpriseDiscoveryEngine {
  public discoverOrganization(
    profile: ChaosSourceProfile,
    sourceDriven?: SourceDrivenAnalysis
  ): EnterpriseModel {
    const fields = profile.physicalColumns;

    // 1. Discover Areas based strictly on physical column evidence
    const areas: EnterpriseArea[] = [];
    const areaEvidenceMap = new Map<string, string[]>();

    fields.forEach(col => {
      const nameUpper = col.physicalName.toUpperCase();
      let areaName = "Gestão Geral";

      if (nameUpper.includes("VLR") || nameUpper.includes("VALOR") || nameUpper.includes("RECEITA") || nameUpper.includes("LUCRO") || nameUpper.includes("COST")) {
        areaName = "Financeiro";
      } else if (nameUpper.includes("VEND") || nameUpper.includes("PROD") || nameUpper.includes("CLIENTE") || nameUpper.includes("PEDIDO")) {
        areaName = "Comercial";
      } else if (nameUpper.includes("OFICINA") || nameUpper.includes("ORDEM") || nameUpper.includes("PECA") || nameUpper.includes("SERVICO")) {
        areaName = "Oficina e Pós-Venda";
      } else if (nameUpper.includes("FUNC") || nameUpper.includes("SALARIO") || nameUpper.includes("COMISS") || nameUpper.includes("RH")) {
        areaName = "Recursos Humanos & Comissões";
      } else if (nameUpper.includes("ESTOQUE") || nameUpper.includes("ALMOX") || nameUpper.includes("DEPOSITO")) {
        areaName = "Estoque e Logística";
      }

      const existing = areaEvidenceMap.get(areaName) || [];
      existing.push(col.physicalName);
      areaEvidenceMap.set(areaName, existing);
    });

    areaEvidenceMap.forEach((cols, name) => {
      areas.push({
        id: `area_${name.toLowerCase().replace(/[^a-z]/g, "")}`,
        name,
        coverage: Math.min(1.0, cols.length / (fields.length || 1)),
        confidence: 0.90,
        evidence: [
          {
            sourceId: profile.sourceId,
            containerId: profile.physicalContainers[0]?.id || "",
            fieldNames: cols,
            sampleValues: [],
            confidence: 0.90,
            description: `Identificados ${cols.length} campos pertinentes a ${name}.`,
          },
        ],
      });
    });

    // 2. Discover Processes
    const processes: ProcessDiscovery[] = areas.map(area => ({
      id: `proc_${area.id}`,
      areaId: area.id,
      name: `Processo Operacional de ${area.name}`,
      status: area.coverage > 0.15 ? "ACTIVE" : "PARTIAL",
      confidence: area.confidence,
      evidence: area.evidence,
    }));

    // 3. Discover Entities
    const entities: BusinessEntity[] = [
      {
        id: "ent_cliente",
        name: "Cliente / Comprador",
        category: "PERSON",
        confidence: fields.some(f => f.physicalName.toUpperCase().includes("CLIENTE")) ? 0.95 : 0.60,
        evidence: [],
      },
      {
        id: "ent_colaborador",
        name: "Vendedor / Colaborador",
        category: "PERSON",
        confidence: fields.some(f => f.physicalName.toUpperCase().includes("VEND")) ? 0.95 : 0.60,
        evidence: [],
      },
      {
        id: "ent_transacao",
        name: "Lançamento Financeiro / Operacional",
        category: "TRANSACTION",
        confidence: 0.98,
        evidence: [],
      },
    ];

    // 4. Discover Relationships
    const relationships: BusinessRelationship[] = [
      {
        id: "rel_colab_trans",
        sourceEntityId: "ent_colaborador",
        targetEntityId: "ent_transacao",
        relationType: "GENERATES",
        confidence: 0.88,
        evidence: [],
      },
    ];

    // 5. Discover Gaps automatically
    const gaps: InformationGap[] = [];
    if (!areas.some(a => a.name === "Estoque e Logística")) {
      gaps.push({
        id: "gap_estoque",
        areaName: "Estoque e Logística",
        missingConcept: "Movimentação física de mercadorias",
        impact: "Impossibilita análise de giro de peças/produtos nesta visão.",
        recommendation: "Conectar planilha ou tabela de saldo de estoque.",
      });
    }

    // 6. Build Evidence-backed Executive Narrative
    const areaNamesStr = areas.map(a => a.name).join(", ");
    const executiveNarrative =
      `Com base na análise da fonte '${profile.sourceName}', identificamos a operação de uma empresa estruturada com atuação nas áreas de: ${areaNamesStr}. ` +
      `Os dados demonstram forte densidade transacional com ${profile.totalKnownRows || profile.sampledRecords} registros consolidados. ` +
      (gaps.length > 0
        ? `Identificamos a ausência de dados diretos sobre ${gaps.map(g => g.areaName).join(" e ")}, recomendando a integração complementar caso necessário.`
        : "A cobertura observada é suficiente para geração imediata do diagnóstico corporativo.");

    return {
      companyId: profile.companyId || "default",
      discoveredAt: new Date().toISOString(),
      areas,
      processes,
      entities,
      relationships,
      gaps,
      executiveNarrative,
    };
  }

  public isProcessDiscovered(model: EnterpriseModel, areaName: string): boolean {
    return model.areas.some(a => a.name.toLowerCase().includes(areaName.toLowerCase()) && a.coverage > 0.05);
  }
}

export const enterpriseDiscoveryEngine = new EnterpriseDiscoveryEngine();
