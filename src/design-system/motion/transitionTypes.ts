/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TransitionConfig {
  duration: number;
  ease: string | number[];
}

export interface MotionVariant {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit?: Record<string, any>;
  transition?: TransitionConfig;
}

export type MotionPresetName =
  | "fade"
  | "slide"
  | "scale"
  | "drawer"
  | "modal"
  | "tab"
  | "chapterTransition"
  | "decisionCreated"
  | "actionCreated";
