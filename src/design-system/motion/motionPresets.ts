/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MotionVariant, MotionPresetName } from "./transitionTypes";
import { tokens } from "../tokens";

const fastDuration = tokens.motion.durations.fast;     // 0.15s
const normalDuration = tokens.motion.durations.normal; // 0.2s
const slowDuration = tokens.motion.durations.slow;     // 0.25s

export const motionPresets: Record<MotionPresetName, MotionVariant> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: fastDuration, ease: tokens.motion.easings.decelerate },
  },
  slide: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: normalDuration, ease: tokens.motion.easings.standard },
  },
  scale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: fastDuration, ease: tokens.motion.easings.standard },
  },
  drawer: {
    initial: { x: "100%", opacity: 0.8 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0.8 },
    transition: { duration: normalDuration, ease: tokens.motion.easings.decelerate },
  },
  modal: {
    initial: { opacity: 0, scale: 0.95, y: 15 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 15 },
    transition: { duration: normalDuration, ease: tokens.motion.easings.standard },
  },
  tab: {
    initial: { opacity: 0, x: -4 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 4 },
    transition: { duration: fastDuration, ease: tokens.motion.easings.decelerate },
  },
  chapterTransition: {
    initial: { opacity: 0, scale: 0.99, filter: "blur(2px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 0.99, filter: "blur(2px)" },
    transition: { duration: normalDuration, ease: tokens.motion.easings.standard },
  },
  decisionCreated: {
    initial: { scale: 0.95, y: 8, opacity: 0 },
    animate: { scale: 1, y: 0, opacity: 1 },
    transition: { duration: slowDuration, ease: "easeOut" },
  },
  actionCreated: {
    initial: { x: -8, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: slowDuration, ease: "easeOut" },
  },
};
