/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SegmentPlugin, pluginEngine } from "../PluginEngine";
import { CostCenter } from "../../business/businessObjects";

export class AgroPlugin implements SegmentPlugin {
  public getSegmentName(): string {
    return "agro";
  }

  public getCostCenters(): CostCenter[] {
    return [
      { id: "cc_soja", code: "SOJA", name: "Cultivo de Soja", segment: "agro" },
      { id: "cc_milho", code: "MILHO", name: "Cultivo de Milho", segment: "agro" },
      { id: "cc_insumos", code: "INSUMOS", name: "Insumos Aplicados", segment: "agro" },
      { id: "cc_maq", code: "MAQUINAS", name: "Custo Maquinário", segment: "agro" },
      { id: "cc_log", code: "LOG", name: "Logística e Escoamento", segment: "agro" }
    ];
  }

  public getRequiredColumns(): string[] {
    return ["Fazenda", "Matrícula", "Cultura", "Talhão", "Resultado Bruto", "Insumos Agro", "Custo Maquinário", "Trimestre", "Safra", "Insumo"];
  }

  public getSuggestedKpis(records: any[]): any[] {
    return [
      { code: "SACAS_POR_HECTARE", name: "Produtividade (Sacas/ha)", unit: "number" },
      { code: "ROI_CULTURA", name: "Retorno sobre Insumos", unit: "percentage" }
    ];
  }
}

// Auto-register plugin
const agroPlugin = new AgroPlugin();
pluginEngine.registerPlugin("agro", agroPlugin);
export default agroPlugin;
