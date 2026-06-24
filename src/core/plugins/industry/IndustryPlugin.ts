/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SegmentPlugin, pluginEngine } from "../PluginEngine";
import { CostCenter } from "../../business/businessObjects";

export class IndustryPlugin implements SegmentPlugin {
  public getSegmentName(): string {
    return "industria";
  }

  public getCostCenters(): CostCenter[] {
    return [
      { id: "cc_prod", code: "PROD", name: "Linha de Produção", segment: "industria" },
      { id: "cc_manut", code: "MANUT", name: "Manutenção Industrial", segment: "industria" },
      { id: "cc_qualidade", code: "QUAL", name: "Controle de Qualidade", segment: "industria" }
    ];
  }

  public getRequiredColumns(): string[] {
    return ["Grupo", "CNPJ", "Marca", "Empresa", "Receita", "Custo", "Despesa", "Mês", "Razão", "Categoria"];
  }

  public getSuggestedKpis(records: any[]): any[] {
    return [
      { code: "OEE", name: "Eficiência Global do Equipamento (OEE)", unit: "percentage" }
    ];
  }

  public getSuggestedMappings(): Record<string, string> {
    return {
      Grupo: "Grupo Industrial",
      CNPJ: "Inscrição",
      Marca: "Linha de Produto",
      Empresa: "Planta Industrial",
      Receita: "Faturamento Notas",
      Custo: "Custo Matéria Prima",
      Despesa: "Despesa Administrativa",
      Mês: "Período Calendário",
      Razão: "Razão de Lançamento",
      Categoria: "Ordem Custos"
    };
  }
}

const industryPlugin = new IndustryPlugin();
pluginEngine.registerPlugin("industria", industryPlugin);
export default industryPlugin;
