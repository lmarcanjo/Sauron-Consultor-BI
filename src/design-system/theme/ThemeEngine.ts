/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Theme, ThemeType } from "./themeTypes";
import { executiveLightTheme } from "./executiveLightTheme";
import { executiveDarkTheme } from "./executiveDarkTheme";

class ThemeEngineService {
  private currentThemeType: ThemeType = "light";
  private themes: Record<ThemeType, Theme> = {
    light: executiveLightTheme,
    dark: executiveDarkTheme,
    "high-contrast": {
      ...executiveLightTheme,
      id: "high-contrast",
      name: "High Contrast",
    },
  };

  public getTheme(type: ThemeType): Theme {
    return this.themes[type] || this.themes.light;
  }

  public getCurrentTheme(): Theme {
    return this.getTheme(this.currentThemeType);
  }

  public setThemeType(type: ThemeType): void {
    if (this.themes[type]) {
      this.currentThemeType = type;
      // In a real browser context, we can toggle 'dark' class on HTML root element
      if (typeof document !== "undefined") {
        if (type === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }
  }

  public getCurrentThemeType(): ThemeType {
    return this.currentThemeType;
  }
}

export const ThemeEngine = new ThemeEngineService();
export default ThemeEngine;
