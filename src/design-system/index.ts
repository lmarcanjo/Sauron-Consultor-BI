/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

// ────────────────────────────────────────────────────────────────────────
// DESIGN SYSTEM TOKENS & INTERACTIVE LAYERS (Sauron DS)
// ────────────────────────────────────────────────────────────────────────

export const DesignSystem = {
  // Color presets (Tailwind reference classes)
  Colors: {
    primary: "blue",
    secondary: "indigo",
    success: "emerald",
    warning: "amber",
    danger: "rose",
    neutral: "slate"
  },

  // Typography system pairings
  Typography: {
    titleLarge: "text-2xl font-black tracking-tight text-slate-800 dark:text-white uppercase font-sans",
    titleMedium: "text-lg font-extrabold tracking-tight text-slate-800 dark:text-slate-100 uppercase font-sans",
    titleSmall: "text-sm font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase font-sans",
    body: "text-xs text-slate-600 dark:text-slate-305 leading-relaxed font-sans",
    caption: "text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider",
    mono: "font-mono text-[10px] tracking-tight text-slate-500 dark:text-slate-400"
  },

  // Elevation and shadows
  Elevation: {
    none: "shadow-none",
    xs: "shadow-xs border border-slate-100 dark:border-slate-800/60",
    sm: "shadow-sm border border-slate-200/80 dark:border-slate-800",
    md: "shadow-md border border-slate-200 dark:border-slate-800",
    lg: "shadow-lg border border-slate-200 dark:border-slate-800/80",
    xl: "shadow-xl border border-slate-200 dark:border-slate-700/80"
  },

  // Layout Spacing constants
  Spacing: {
    container: "p-6 space-y-6 max-w-7xl mx-auto",
    cardPadding: "p-5",
    gapSmall: "gap-2",
    gapMedium: "gap-4",
    gapLarge: "gap-6"
  },

  // Border radius tokens
  Radius: {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    full: "rounded-full"
  },

  // Micro-interactions and animations
  Animations: {
    hoverScale: "transition-all duration-200 hover:scale-[1.01] hover:shadow-md",
    transitionQuick: "transition-all duration-150 ease-in-out",
    pulseStatus: "animate-pulse",
    fadeIn: "animate-fade-in"
  },

  // Badge components class builders
  Badge: {
    build: (type: "primary" | "success" | "warning" | "danger" | "neutral") => {
      const styles = {
        primary: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20",
        success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20",
        danger: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20",
        neutral: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20"
      };
      return `px-2 py-0.5 text-[9px] font-black font-mono uppercase rounded-full ${styles[type]}`;
    }
  },

  // Button components class builders
  Button: {
    build: (variant: "filled" | "outline" | "ghost" | "danger", size: "sm" | "md" = "md") => {
      const base = "inline-flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50 select-none text-center";
      
      const sizes = {
        sm: "px-2.5 py-1.5 text-[9px]",
        md: "px-4 py-2 text-[10px]"
      };

      const variants = {
        filled: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs border border-blue-700",
        outline: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 dark:active:bg-slate-800",
        ghost: "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 active:bg-slate-200 dark:active:bg-slate-800",
        danger: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-rose-700"
      };

      return `${base} ${sizes[size]} ${variants[variant]}`;
    }
  },

  // Input fields classes
  Input: {
    text: "w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-400 font-medium transition-shadow",
    select: "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wide"
  },

  // Interactive Card layout
  Card: {
    container: "bg-white dark:bg-slate-900 border border-slate-250/60 dark:border-slate-800/80 rounded-2xl shadow-xs overflow-hidden",
    header: "p-4 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20",
    body: "p-5"
  }
};
