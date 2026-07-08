/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FeatureFlags {
  peopleIntelligence: boolean;
  meetingAi: boolean;
  storyBuilder: boolean;
  executiveDossier: boolean;
  copilot: boolean;
  realtimeSync: boolean;
}

class FeatureFlagEngine {
  private flags: FeatureFlags = {
    peopleIntelligence: true,
    meetingAi: true,
    storyBuilder: true,
    executiveDossier: true,
    copilot: false, // Beta flag disabled by default
    realtimeSync: false // Under development
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const stored = window.localStorage.getItem("sauron_feature_flags");
        if (stored) {
          this.flags = { ...this.flags, ...JSON.parse(stored) };
        }
      } catch (e) {
        console.error("Failed to load feature flags from localStorage", e);
      }
    }
  }

  private saveToStorage(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem("sauron_feature_flags", JSON.stringify(this.flags));
      } catch (e) {
        console.error("Failed to save feature flags to localStorage", e);
      }
    }
  }

  /**
   * Check if a feature flag is enabled.
   */
  public isEnabled(flag: keyof FeatureFlags): boolean {
    return !!this.flags[flag];
  }

  /**
   * Set the state of a feature flag.
   */
  public setFlag(flag: keyof FeatureFlags, value: boolean): void {
    this.flags[flag] = value;
    this.saveToStorage();
  }

  /**
   * Get all flags.
   */
  public getFlags(): FeatureFlags {
    return { ...this.flags };
  }
}

export const featureFlagEngine = new FeatureFlagEngine();
export default featureFlagEngine;
