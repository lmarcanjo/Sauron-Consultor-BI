/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SegmentPlugin, pluginEngine } from "../PluginEngine";
import { CostCenter } from "../../business/businessObjects";

export class AutomotivePlugin implements SegmentPlugin {
  public getSegmentName(): string {
    return "especializado";
  }

  public getCostCenters(): CostCenter[] {
    return [
      { id: "cc_vn", code: "LC", name: "Linha Comercial", segment: "especializado" },
      { id: "cc_vs", code: "LR", name: "Linha Recorrente", segment: "especializado" },
      { id: "cc_vf", code: "CC", name: "Canal Corporativo", segment: "especializado" },
      { id: "cc_pe", code: "IT", name: "Itens", segment: "especializado" },
      { id: "cc_ac", code: "CA", name: "Categorias Adicionais", segment: "especializado" },
      { id: "cc_me", code: "OP", name: "Operações", segment: "especializado" },
      { id: "cc_fu", code: "SV", name: "Serviços", segment: "especializado" },
      { id: "cc_co", code: "CT", name: "Contratos", segment: "especializado" },
      { id: "cc_fi", code: "FI", name: "Financeiro", segment: "especializado" },
      { id: "cc_ad", code: "AD", name: "Administrativo", segment: "especializado" },
      { id: "cc_fn", code: "FN", name: "Financeiro", segment: "especializado" },
      { id: "cc_di", code: "DI", name: "Diretoria", segment: "especializado" }
    ];
  }

  public getRequiredColumns(): string[] {
    return ["Grupo", "CNPJ", "Marca", "Empresa", "Receita", "Custo", "Despesa", "Mês", "Razão", "Categoria"];
  }

  public getSuggestedKpis(records: any[]): any[] {
    return [
      { code: "F_I_PENETRATION", name: "Penetração de F&I", unit: "percentage" },
      { code: "ABSORPTION_RATE", name: "Taxa de Absorção Operacional", unit: "percentage" }
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
pluginEngine.registerPlugin("especializado", automotivePlugin);
export default automotivePlugin;
