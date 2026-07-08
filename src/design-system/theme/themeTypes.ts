/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeType = "light" | "dark" | "high-contrast";

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  headerBackground: string;
  headerBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
}

export interface Theme {
  id: ThemeType;
  name: string;
  colors: ThemeColors;
}
