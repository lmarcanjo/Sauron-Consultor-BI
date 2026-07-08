/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SegmentPlugin, pluginEngine } from "../PluginEngine";
import { CostCenter } from "../../business/businessObjects";

export class ServicesPlugin implements SegmentPlugin {
  public getSegmentName(): string {
    return "servicos";
  }

  public getCostCenters(): CostCenter[] {
    return [
      { id: "cc_consultoria", code: "CONS", name: "Consultoria Executiva", segment: "servicos" },
      { id: "cc_suporte", code: "SUPP", name: "Suporte Operacional", segment: "servicos" },
      { id: "cc_marketing", code: "MKT", name: "Marketing Digital", segment: "servicos" }
    ];
  }

  public getRequiredColumns(): string[] {
    return ["Holding", "Documento", "Portfólio", "Unidade Negócio", "Horas Faturadas", "Custo Consultores", "Overhead", "Mês", "Contrato Tipo", "Canal"];
  }

  public getSuggestedKpis(records: any[]): any[] {
    return [
      { code: "BILLABLE_UTILIZATION", name: "Taxa de Utilização Faturável", unit: "percentage" }
    ];
  }

  public getSuggestedMappings(): Record<string, string> {
    return {
      Grupo: "Holding",
      CNPJ: "Documento",
      Marca: "Portfólio",
      Empresa: "Unidade Negócio",
      Receita: "Horas Faturadas",
      Custo: "Custo Consultores",
      Despesa: "Overhead",
      Mês: "Mês",
      Razão: "Contrato Tipo",
      Categoria: "Canal"
    };
  }
}

const servicesPlugin = new ServicesPlugin();
pluginEngine.registerPlugin("servicos", servicesPlugin);
export default servicesPlugin;
