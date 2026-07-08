/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ColorScale {
  light: string;
  dark: string;
}

export interface StatusColors {
  primary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  danger: ColorScale;
  neutral: ColorScale;
}

export const colors = {
  brand: {
    primary: "blue-600",
    secondary: "indigo-600",
  },
  status: {
    primary: {
      light: "text-blue-700 bg-blue-50 border-blue-100",
      dark: "text-blue-400 bg-blue-950/40 border-blue-900/50",
    },
    success: {
      light: "text-emerald-700 bg-emerald-50 border-emerald-100",
      dark: "text-emerald-400 bg-emerald-950/40 border-emerald-900/50",
    },
    warning: {
      light: "text-amber-700 bg-amber-50 border-amber-100",
      dark: "text-amber-400 bg-amber-950/40 border-amber-900/50",
    },
    danger: {
      light: "text-rose-700 bg-rose-50 border-rose-100",
      dark: "text-rose-400 bg-rose-950/40 border-rose-900/50",
    },
    neutral: {
      light: "text-slate-700 bg-slate-50 border-slate-100",
      dark: "text-slate-400 bg-slate-950/40 border-slate-800/50",
    },
  },
  bg: {
    mainLight: "bg-white",
    mainDark: "bg-slate-950",
    cardLight: "bg-white border-slate-200/80",
    cardDark: "bg-slate-900 border-slate-800/80",
    headerLight: "bg-slate-50/50 border-slate-100",
    headerDark: "bg-slate-950/40 border-slate-800/50",
  },
  text: {
    primaryLight: "text-slate-800",
    primaryDark: "text-slate-100",
    secondaryLight: "text-slate-500",
    secondaryDark: "text-slate-400",
    mutedLight: "text-slate-400",
    mutedDark: "text-slate-500",
  },
};
