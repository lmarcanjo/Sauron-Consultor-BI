/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { adaptiveTerminologyEngine } from "./AdaptiveTerminologyEngine";

export class AdaptiveThemeEngine {
  public getColor(key: string): string {
    const term = adaptiveTerminologyEngine.getTerm(key);
    const configuredColor = term.accentColor || "#64748b";
    return this.getSafeAccentColor(configuredColor, "#ffffff");
  }

  public getContrastRatio(hex1: string, hex2: string): number {
    const l1 = this.getLuminance(hex1);
    const l2 = this.getLuminance(hex2);
    const brightest = Math.max(l1, l2);
    const darkest = Math.min(l1, l2);
    return (brightest + 0.05) / (darkest + 0.05);
  }

  public validateAccentColor(colorHex: string, bgHex: string): boolean {
    return this.getContrastRatio(colorHex, bgHex) >= 4.5;
  }

  public getAccessibleForeground(bgHex: string): string {
    const contrastWithWhite = this.getContrastRatio("#ffffff", bgHex);
    const contrastWithDark = this.getContrastRatio("#0f172a", bgHex);
    return contrastWithWhite >= contrastWithDark ? "#ffffff" : "#0f172a";
  }

  public getSafeAccentColor(colorHex: string, bgHex: string): string {
    if (this.validateAccentColor(colorHex, bgHex)) {
      return colorHex;
    }
    if (this.validateAccentColor("#3b82f6", bgHex)) {
      return "#3b82f6";
    }
    return "#0f172a";
  }

  private getLuminance(hex: string): number {
    let cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split("").map(c => c + c).join("");
    }
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

    const a = [r, g, b].map(v => {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  public getStyle(key: string, property: "color" | "backgroundColor" | "borderColor" = "color"): React.CSSProperties {
    const color = this.getColor(key);
    return {
      [property]: color
    };
  }
}

export const adaptiveThemeEngine = new AdaptiveThemeEngine();
export default adaptiveThemeEngine;
