/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dataSourceManager } from "./DataSourceManager";

export interface CatalogField {
  name: string;
  type: string;
  description?: string;
  sampleValue?: any;
}

export interface CatalogItem {
  id: string;
  name: string;
  type: "file" | "table" | "virtual_layer";
  fields: CatalogField[];
  rowCount: number;
}

export class DataCatalog {
  private static instance: DataCatalog;

  private constructor() {}

  public static getInstance(): DataCatalog {
    if (!DataCatalog.instance) {
      DataCatalog.instance = new DataCatalog();
    }
    return DataCatalog.instance;
  }

  /**
   * Generates a structural catalog of the active workspace and database targets.
   */
  public generateCatalog(): CatalogItem[] {
    const catalog: CatalogItem[] = [];
    const workspace = dataSourceManager.getWorkspace();
    
    // Add active spreadsheet files to catalog
    workspace.files.forEach(f => {
      f.sheets.forEach(sh => {
        const fields: CatalogField[] = sh.columns.map(col => ({
          name: col.name,
          type: col.type,
          sampleValue: sh.rows[0]?.[col.name] || null
        }));

        catalog.push({
          id: `sheet_${f.id}_${sh.id}`,
          name: `${f.fileName} - ${sh.sheetName}`,
          type: "file",
          fields,
          rowCount: sh.rows.length
        });
      });
    });

    return catalog;
  }
}

export const dataCatalog = DataCatalog.getInstance();
