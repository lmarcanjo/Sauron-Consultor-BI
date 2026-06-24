/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { dataSourceManager, DataSourceManager } from "./DataSourceManager";
import { dataCatalog, DataCatalog } from "./DataCatalog";
import { dataLineage, DataLineage } from "./DataLineage";
import { dataQuality, DataQuality } from "./DataQuality";
import { LancamentoFinanceiro } from "../../types";

export class DataEngine {
  private static instance: DataEngine;

  private constructor() {}

  public static getInstance(): DataEngine {
    if (!DataEngine.instance) {
      DataEngine.instance = new DataEngine();
    }
    return DataEngine.instance;
  }

  public getManager(): DataSourceManager {
    return dataSourceManager;
  }

  public getCatalog(): DataCatalog {
    return dataCatalog;
  }

  public getLineage(): DataLineage {
    return dataLineage;
  }

  public getQuality(): DataQuality {
    return dataQuality;
  }

  /**
   * Retrieves active financial records with safety filters applied to prevent mock data leaking into real sources.
   */
  public getApprovedRecords(): LancamentoFinanceiro[] {
    return dataSourceManager.getActiveRecords();
  }

  /**
   * Checks if the active datasource is fully approved by a consultant.
   */
  public isApproved(): boolean {
    return dataSourceManager.isApproved();
  }
}

export const dataEngine = DataEngine.getInstance();
export default dataEngine;
