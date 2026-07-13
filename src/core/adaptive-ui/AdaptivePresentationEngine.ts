/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { adaptiveUILabelEngine } from "./AdaptiveUILabelEngine";

export class AdaptivePresentationEngine {
  public adaptText(text: string): string {
    return adaptiveUILabelEngine.translatePresentationText(text);
  }

  public adaptSlide(slide: any): any {
    if (!slide) return slide;
    return {
      ...slide,
      title: this.adaptText(slide.title),
      content: Array.isArray(slide.content)
        ? slide.content.map((item: any) => {
            if (typeof item === "string") return this.adaptText(item);
            if (item && typeof item === "object") {
              return {
                ...item,
                title: item.title ? this.adaptText(item.title) : undefined,
                value: item.value ? this.adaptText(item.value) : undefined,
                label: item.label ? this.adaptText(item.label) : undefined,
                description: item.description ? this.adaptText(item.description) : undefined,
              };
            }
            return item;
          })
        : this.adaptText(slide.content),
    };
  }

  public adaptSlides(slides: any[]): any[] {
    if (!slides) return [];
    return slides.map(s => this.adaptSlide(s));
  }
}

export const adaptivePresentationEngine = new AdaptivePresentationEngine();
export default adaptivePresentationEngine;
