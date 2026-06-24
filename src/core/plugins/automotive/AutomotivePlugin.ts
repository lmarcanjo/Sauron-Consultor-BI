/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SegmentPlugin, pluginEngine } from "../PluginEngine";
import { CostCenter } from "../../business/businessObjects";

export class AutomotivePlugin implements SegmentPlugin {
  public getSegmentName(): string {
    return "automotivo";
  }

  public getCostCenters(): CostCenter[] {
    return [
      { id: "cc_vn", code: "VN", name: "Veículos Novos", segment: "automotivo" },
      { id: "cc_vs", code: "VS", name: "Seminovos", segment: "automotivo" },
      { id: "cc_vf", code: "VF", name: "Venda Frotista", segment: "automotivo" },
      { id: "cc_pe", code: "PE", name: "Peças", segment: "automotivo" },
      { id: "cc_ac", code: "AC", name: "Acessórios", segment: "automotivo" },
      { id: "cc_me", code: "ME", name: "Mecânica", segment: "automotivo" },
      { id: "cc_fu", code: "FU", name: "Funilaria", segment: "automotivo" },
      { id: "cc_co", code: "CO", name: "Consórcio", segment: "automotivo" },
      { id: "cc_fi", code: "FI", name: "F&I/FNA", segment: "automotivo" },
      { id: "cc_ad", code: "AD", name: "Administrativo", segment: "automotivo" },
      { id: "cc_fn", code: "FN", name: "Financeiro", segment: "automotivo" },
      { id: "cc_di", code: "DI", name: "Diretoria", segment: "automotivo" }
    ];
  }

  public getRequiredColumns(): string[] {
    return ["Grupo", "CNPJ", "Marca", "Empresa", "Receita", "Custo", "Despesa", "Mês", "Razão", "Categoria"];
  }

  public getSuggestedKpis(records: any[]): any[] {
    return [
      { code: "F_I_PENETRATION", name: "Penetração de F&I", unit: "percentage" },
      { code: "ABSORPTION_RATE", name: "Taxa de Absorção de Pós-Vendas", unit: "percentage" }
    ];
  }

  public getSuggestedMappings(): Record<string, string> {
    return {
      Grupo: "Grupo",
      CNPJ: "CNPJ",
      Marca: "Bandeira",
      Empresa: "Loja",
      Receita: "Valor Venda",
      Custo: "Custo Direto",
      Despesa: "Despesas Loja",
      Mês: "Data Competência",
      Razão: "Razão Movimento",
      Categoria: "Centro Custo"
    };
  }
}

// Auto-register plugin
const automotivePlugin = new AutomotivePlugin();
pluginEngine.registerPlugin("automotivo", automotivePlugin);
export default automotivePlugin;
