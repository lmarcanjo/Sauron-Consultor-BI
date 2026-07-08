/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TypographyToken {
  className: string;
}

export const typography = {
  titleLarge: "text-2xl font-black tracking-tight text-slate-800 dark:text-white uppercase font-sans",
  titleMedium: "text-lg font-extrabold tracking-tight text-slate-800 dark:text-slate-100 uppercase font-sans",
  titleSmall: "text-sm font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase font-sans",
  body: "text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans",
  caption: "text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider",
  mono: "font-mono text-[10px] tracking-tight text-slate-500 dark:text-slate-400",
  weights: {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
    extrabold: "font-extrabold",
    black: "font-black",
  },
};
