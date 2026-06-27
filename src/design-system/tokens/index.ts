/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { colors } from "./colors";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { radius } from "./radius";
import { shadows } from "./shadows";
import { motion } from "./motion";
import { zIndex } from "./zIndex";
import { breakpoints } from "./breakpoints";

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
  motion,
  zIndex,
  breakpoints,
};

export type TokensType = typeof tokens;
export { colors, typography, spacing, radius, shadows, motion, zIndex, breakpoints };
