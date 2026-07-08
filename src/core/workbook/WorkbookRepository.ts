import { WorkbookCatalog } from "./WorkbookTypes";

const STORAGE_KEY = "sauron_workbook_catalogs_v1";
const memoryCatalogs = new Map<string, WorkbookCatalog>();

type StoredCatalogs = Record<string, WorkbookCatalog>;

function canUseLocalStorage(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function readCatalogs(): StoredCatalogs {
  if (!canUseLocalStorage()) return Object.fromEntries(memoryCatalogs.entries());

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCatalogs(catalogs: StoredCatalogs): void {
  memoryCatalogs.clear();
  Object.entries(catalogs).forEach(([id, catalog]) => memoryCatalogs.set(id, catalog));

  if (!canUseLocalStorage()) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalogs));
  } catch {
    // The workbook catalog must never block the active import flow. If browser
    // storage is unavailable or full, keep the in-memory copy for the session.
  }
}

export class WorkbookRepository {
  save(catalog: WorkbookCatalog): WorkbookCatalog {
    const catalogs = readCatalogs();
    catalogs[catalog.id] = catalog;
    writeCatalogs(catalogs);
    return catalog;
  }

  get(id: string): WorkbookCatalog | null {
    return readCatalogs()[id] || null;
  }

  list(): WorkbookCatalog[] {
    return Object.values(readCatalogs())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  remove(id: string): void {
    const catalogs = readCatalogs();
    delete catalogs[id];
    writeCatalogs(catalogs);
  }

  clear(): void {
    writeCatalogs({});
    if (!canUseLocalStorage()) return;

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors; the in-memory catalog was already cleared.
    }
  }
}

export const workbookRepository = new WorkbookRepository();
