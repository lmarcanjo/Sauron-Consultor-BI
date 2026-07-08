/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CostCenter } from "../business/businessObjects";
import { businessEngine } from "../business/BusinessEngine";

export interface SegmentPlugin {
  getSegmentName(): string;
  getCostCenters(): CostCenter[];
  getRequiredColumns(): string[];
  getSuggestedKpis(records: any[]): any[];
  getSuggestedMappings?(): Record<string, string>;
}

export class PluginEngine {
  private static instance: PluginEngine;
  private plugins: Map<string, SegmentPlugin> = new Map();

  private constructor() {}

  public static getInstance(): PluginEngine {
    if (!PluginEngine.instance) {
      PluginEngine.instance = new PluginEngine();
    }
    return PluginEngine.instance;
  }

  public registerPlugin(segment: string, plugin: SegmentPlugin) {
    this.plugins.set(segment, plugin);
  }

  public getPlugin(segment: string): SegmentPlugin | null {
    return this.plugins.get(segment) || null;
  }

  /**
   * Retrieves segment-specific cost centers for the active tenant.
   */
  public getSegmentCostCenters(segment: "automotivo" | "agro" | "servicos" | "industria"): CostCenter[] {
    const plugin = this.getPlugin(segment);
    if (plugin) {
      return plugin.getCostCenters();
    }
    // Fallback to business engine defaults
    return businessEngine.getCostCenters(segment);
  }
}

export const pluginEngine = PluginEngine.getInstance();
export default pluginEngine;
