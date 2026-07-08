import { WorkbookEngine, workbookEngine } from "./WorkbookEngine";
import { WorkbookCatalog, WorkbookParseOptions } from "./WorkbookTypes";

export class WorkbookService {
  constructor(private readonly engine: WorkbookEngine = workbookEngine) {}

  catalogWorkbookBuffer(buffer: ArrayBuffer | Uint8Array, options: WorkbookParseOptions = {}): Promise<WorkbookCatalog> {
    return this.engine.catalogArrayBuffer(buffer, options);
  }

  catalogWorkbookFile(file: File, options: WorkbookParseOptions = {}): Promise<WorkbookCatalog> {
    return this.engine.catalogFile(file, options);
  }

  catalogAndPersistWorkbookBuffer(buffer: ArrayBuffer | Uint8Array, options: WorkbookParseOptions = {}): Promise<WorkbookCatalog> {
    return this.engine.catalogAndSaveArrayBuffer(buffer, options);
  }

  catalogAndPersistWorkbookFile(file: File, options: WorkbookParseOptions = {}): Promise<WorkbookCatalog> {
    return this.engine.catalogAndSaveFile(file, options);
  }

  saveCatalog(catalog: WorkbookCatalog): WorkbookCatalog {
    return this.engine.save(catalog);
  }

  getCatalog(id: string): WorkbookCatalog | null {
    return this.engine.get(id);
  }

  listCatalogs(): WorkbookCatalog[] {
    return this.engine.list();
  }
}

export const workbookService = new WorkbookService();
