/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WorkspaceLayout {
  id: string;
  name: string;
  role: string;
  enabledWidgets: string[];
  gridConfig: Record<string, { x: number; y: number; w: number; h: number }>;
}

class LayoutEngine {
  private activePreset: string = "Diretoria";
  private presets: Map<string, WorkspaceLayout> = new Map();

  constructor() {
    this.registerDefaultPresets();
    this.loadFromStorage();
  }

  private registerDefaultPresets(): void {
    // Diretoria Layout
    this.presets.set("Diretoria", {
      id: "preset_diretoria",
      name: "Diretoria",
      role: "diretor",
      enabledWidgets: ["executive_brief", "health_center", "client_pulse", "decision_center", "executive_timeline"],
      gridConfig: {}
    });

    // Financeiro Layout
    this.presets.set("Financeiro", {
      id: "preset_financeiro",
      name: "Financeiro",
      role: "consultor",
      enabledWidgets: ["executive_brief", "client_pulse", "decision_center", "data_health"],
      gridConfig: {}
    });

    // Comercial Layout
    this.presets.set("Comercial", {
      id: "preset_comercial",
      name: "Comercial",
      role: "consultor",
      enabledWidgets: ["client_pulse", "decision_center", "executive_timeline"],
      gridConfig: {}
    });

    // Customizado Layout
    this.presets.set("Customizado", {
      id: "preset_custom",
      name: "Customizado",
      role: "consultor",
      enabledWidgets: ["executive_brief", "health_center", "client_pulse", "decision_center", "executive_timeline", "data_health"],
      gridConfig: {}
    });
  }

  private loadFromStorage(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const active = window.localStorage.getItem("sauron_active_layout_preset");
        if (active) {
          this.activePreset = active;
        }
        const storedCustom = window.localStorage.getItem("sauron_custom_layout");
        if (storedCustom) {
          const customLayout = JSON.parse(storedCustom);
          this.presets.set("Customizado", customLayout);
        }
      } catch (e) {
        console.error("Failed to load layout configs", e);
      }
    }
  }

  /**
   * Get active layout preset name.
   */
  public getActivePresetName(): string {
    return this.activePreset;
  }

  /**
   * Set active layout preset.
   */
  public setActivePreset(name: string): void {
    if (this.presets.has(name)) {
      this.activePreset = name;
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem("sauron_active_layout_preset", name);
      }
    }
  }

  /**
   * Get layout by name.
   */
  public getLayout(name: string): WorkspaceLayout | undefined {
    return this.presets.get(name);
  }

  /**
   * Get layout for active preset.
   */
  public getActiveLayout(): WorkspaceLayout {
    return this.getLayout(this.activePreset) || this.getLayout("Diretoria")!;
  }

  /**
   * Save customized layout configurations.
   */
  public saveCustomLayout(layout: Partial<WorkspaceLayout>): void {
    const currentCustom = this.getLayout("Customizado") || {
      id: "preset_custom",
      name: "Customizado",
      role: "consultor",
      enabledWidgets: [],
      gridConfig: {}
    };

    const nextCustom = { ...currentCustom, ...layout };
    this.presets.set("Customizado", nextCustom);

    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("sauron_custom_layout", JSON.stringify(nextCustom));
    }
  }

  /**
   * Get all registered presets.
   */
  public getAllPresets(): WorkspaceLayout[] {
    return Array.from(this.presets.values());
  }
}

export const layoutEngine = new LayoutEngine();
export default layoutEngine;
