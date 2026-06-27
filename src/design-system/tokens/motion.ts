/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const motion = {
  timings: {
    instant: "0ms",
    fast: "150ms",
    normal: "200ms",
    slow: "250ms",
  },
  durations: {
    fast: 0.15, // in seconds for Framer Motion
    normal: 0.2,
    slow: 0.25,
  },
  easings: {
    standard: "cubic-bezier(0.4, 0, 0.2, 1)",
    decelerate: "cubic-bezier(0, 0, 0.2, 1)", // ease-out
    accelerate: "cubic-bezier(0.4, 0, 1, 1)", // ease-in
  },
  classes: {
    transitionQuick: "transition-all duration-150 ease-in-out",
    transitionNormal: "transition-all duration-200 ease-in-out",
    hoverScale: "transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99]",
  },
};
