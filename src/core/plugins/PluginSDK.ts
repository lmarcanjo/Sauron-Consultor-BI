/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WidgetDefinition } from "../widgets/WidgetEngine";

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
}

export interface ExtensionPointRegistry {
  widgets?: WidgetDefinition[];
  menuItems?: Array<{
    id: string;
    label: string;
    iconName: string;
    targetTab: string;
  }>;
  customKpis?: Array<{
    id: string;
    name: string;
    formula: (records: any[]) => number;
  }>;
  customRoutes?: Array<{
    path: string;
    label: string;
    component: React.ComponentType;
  }>;
}

export interface SauronPlugin {
  metadata: PluginMetadata;
  initialize(): void;
  getExtensions(): ExtensionPointRegistry;
}

class PluginSDK {
  private activePlugins: Map<string, SauronPlugin> = new Map();
  private widgetRegistryCallback?: (widget: WidgetDefinition) => void;

  /**
   * Register and boot an advanced Sauron Platform Plugin.
   */
  public registerAndLoad(plugin: SauronPlugin): void {
    const { id } = plugin.metadata;
    if (this.activePlugins.has(id)) {
      console.warn(`Plugin with ID ${id} is already registered. Skipping.`);
      return;
    }

    try {
      plugin.initialize();
      this.activePlugins.set(id, plugin);

      // Register widgets if any
      const extensions = plugin.getExtensions();
      if (extensions.widgets && this.widgetRegistryCallback) {
        extensions.widgets.forEach(w => this.widgetRegistryCallback!(w));
      }
    } catch (e) {
      console.error(`Failed to load plugin [${id}]:`, e);
    }
  }

  /**
   * Set callback to auto-propagate widgets registered via plugin extensions to the Widget Engine.
   */
  public setWidgetRegistryCallback(callback: (widget: WidgetDefinition) => void): void {
    this.widgetRegistryCallback = callback;
    // Back-register existing plugin widgets
    this.activePlugins.forEach(p => {
      const ext = p.getExtensions();
      if (ext.widgets) {
        ext.widgets.forEach(w => callback(w));
      }
    });
  }

  /**
   * Get all loaded advanced plugins.
   */
  public getLoadedPlugins(): SauronPlugin[] {
    return Array.from(this.activePlugins.values());
  }

  /**
   * Uninstall a plugin.
   */
  public unload(id: string): void {
    this.activePlugins.delete(id);
  }
}

export const pluginSDK = new PluginSDK();
export default pluginSDK;
