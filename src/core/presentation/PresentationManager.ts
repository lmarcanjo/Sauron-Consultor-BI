/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Presentation, Slide } from "../business/businessObjects";

export class PresentationManager {
  private static instance: PresentationManager;
  private currentPresentationId: string = "pres_default";

  private constructor() {}

  public static getInstance(): PresentationManager {
    if (!PresentationManager.instance) {
      PresentationManager.instance = new PresentationManager();
    }
    return PresentationManager.instance;
  }

  /**
   * Retrieves slides from local storage, or returns an empty list.
   */
  public loadPresentation(presentationId: string = this.currentPresentationId): Presentation | null {
    if (typeof localStorage === "undefined") return null;
    const data = localStorage.getItem(`sauron_presentation_${presentationId}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }

  /**
   * Saves slides to local storage.
   */
  public savePresentation(presentation: Presentation): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(
      `sauron_presentation_${presentation.id}`,
      JSON.stringify(presentation)
    );
  }

  /**
   * Generates a brand new presentation profile.
   */
  public createPresentation(title: string, clientId: string): Presentation {
    const newPres: Presentation = {
      id: `pres_${Date.now()}`,
      title,
      clientId,
      slides: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.savePresentation(newPres);
    return newPres;
  }
}

export const presentationManager = PresentationManager.getInstance();
export default presentationManager;
