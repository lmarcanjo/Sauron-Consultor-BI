/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Slide } from "../business/businessObjects";

export class SlideEngine {
  private static instance: SlideEngine;

  private constructor() {}

  public static getInstance(): SlideEngine {
    if (!SlideEngine.instance) {
      SlideEngine.instance = new SlideEngine();
    }
    return SlideEngine.instance;
  }

  /**
   * Generates a template slide deck populated with custom financial metrics.
   */
  public generateDefaultDeck(totalRevenue: number): Slide[] {
    const formattedRev = "R$ " + totalRevenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    
    return [
      {
        id: "s1",
        presentationId: "pres_default",
        title: "Fechamento de Resultados & Planejamento BI",
        subtitle: "Sauron OS — Consultoria de Alta Performance",
        type: "cover",
        order: 1,
        visible: true,
        notes: "Iniciar apresentação dando boas vindas aos investidores e diretores da holding. Destacar que todas as fontes foram mapeadas via VPN.",
        content: {}
      },
      {
        id: "s2",
        presentationId: "pres_default",
        title: "DRE Consolidada e Evolução das Margens",
        subtitle: `Faturamento Consolidado: ${formattedRev}`,
        type: "dre",
        order: 2,
        visible: true,
        notes: "Aponte o volume total de Receita Bruta. Destaque se houve variações no CMV ou despesas administrativas.",
        content: {}
      }
    ];
  }
}

export const slideEngine = SlideEngine.getInstance();
export default slideEngine;
