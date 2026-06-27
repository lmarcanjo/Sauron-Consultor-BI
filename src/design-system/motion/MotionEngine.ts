/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motionPresets } from "./motionPresets";
import { MotionPresetName, MotionVariant } from "./transitionTypes";

class MotionEngineService {
  public getPreset(name: MotionPresetName): MotionVariant {
    return motionPresets[name] || motionPresets.fade;
  }

  public getTransition(name: MotionPresetName) {
    const preset = this.getPreset(name);
    return preset.transition;
  }
}

export const MotionEngine = new MotionEngineService();
export default MotionEngine;
