/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import * as Lucide from "lucide-react";
import { adaptiveTerminologyEngine } from "./AdaptiveTerminologyEngine";

export class AdaptiveIconEngine {
  public getIconComponent(key: string): React.ComponentType<any> {
    const term = adaptiveTerminologyEngine.getTerm(key);
    const iconName = term.iconKey || "HelpCircle";

    const IconComponent = (Lucide as any)[iconName] || Lucide.HelpCircle;
    return IconComponent;
  }
}

export const adaptiveIconEngine = new AdaptiveIconEngine();
export default adaptiveIconEngine;
