/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemeType, Theme } from "./themeTypes";
import { ThemeEngine } from "./ThemeEngine";

interface ThemeContextType {
  themeType: ThemeType;
  theme: Theme;
  setTheme: (type: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeType, setThemeTypeState] = useState<ThemeType>("light");

  useEffect(() => {
    // Detect dark mode from html element or storage if needed
    if (typeof document !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setThemeTypeState(isDark ? "dark" : "light");
    }
  }, []);

  const setTheme = (type: ThemeType) => {
    ThemeEngine.setThemeType(type);
    setThemeTypeState(type);
  };

  const theme = ThemeEngine.getTheme(themeType);

  return (
    <ThemeContext.Provider value={{ themeType, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useSauronTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useSauronTheme must be used within a ThemeProvider");
  }
  return context;
};
