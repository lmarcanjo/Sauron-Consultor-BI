/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { slideEngine, SlideEngine } from "./SlideEngine";
import { chartEngine, ChartEngine } from "./ChartEngine";
import { presentationManager, PresentationManager } from "./PresentationManager";
import { Presentation, Slide } from "../business/businessObjects";

export class PresentationEngine {
  private static instance: PresentationEngine;

  private constructor() {}

  public static getInstance(): PresentationEngine {
    if (!PresentationEngine.instance) {
      PresentationEngine.instance = new PresentationEngine();
    }
    return PresentationEngine.instance;
  }

  public getSlideEngine(): SlideEngine {
    return slideEngine;
  }

  public getChartEngine(): ChartEngine {
    return chartEngine;
  }

  public getManager(): PresentationManager {
    return presentationManager;
  }

  /**
   * Builds an executive presentation deck with default slide templates and tracks it.
   */
  public generateAndSaveDefaultPresentation(title: string, clientId: string, totalRevenue: number): Presentation {
    const pres = presentationManager.createPresentation(title, clientId);
    const slides = slideEngine.generateDefaultDeck(totalRevenue);
    pres.slides = slides;
    presentationManager.savePresentation(pres);
    return pres;
  }
}

export const presentationEngine = PresentationEngine.getInstance();
export default presentationEngine;
