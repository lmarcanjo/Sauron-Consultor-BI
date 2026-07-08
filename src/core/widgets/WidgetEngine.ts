/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

export interface WidgetContext {
  filteredData: any[];
  activeFiles: any[];
  formatCurrency: (value: number) => string;
  onSelectTab: (tabId: string) => void;
  [key: string]: any;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  category: "analytics" | "operations" | "decisions" | "meta";
  defaultSize: "sm" | "md" | "lg" | "full";
  component: React.ComponentType<{ context: WidgetContext }>;
}

class WidgetRegistry {
  private widgets: Map<string, WidgetDefinition> = new Map();

  /**
   * Register a new widget in the platform.
   */
  public registerWidget(definition: WidgetDefinition): void {
    this.widgets.set(definition.id, definition);
  }

  /**
   * Unregister a widget.
   */
  public unregisterWidget(id: string): void {
    this.widgets.delete(id);
  }

  /**
   * Get a registered widget by ID.
   */
  public getWidget(id: string): WidgetDefinition | undefined {
    return this.widgets.get(id);
  }

  /**
   * Get all registered widgets.
   */
  public getAllWidgets(): WidgetDefinition[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Filter widgets by category.
   */
  public getWidgetsByCategory(category: WidgetDefinition["category"]): WidgetDefinition[] {
    return this.getAllWidgets().filter((w) => w.category === category);
  }
}

export const widgetRegistry = new WidgetRegistry();

export class WidgetEngine {
  /**
   * Helper to retrieve all registered widgets ready for rendering.
   */
  public static getRegistry(): WidgetRegistry {
    return widgetRegistry;
  }
}

export default WidgetEngine;
