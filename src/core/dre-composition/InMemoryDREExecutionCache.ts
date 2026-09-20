import { DREExecutionCacheEntry, IDREExecutionCache } from './DREExecutionGraphContracts';

export class InMemoryDREExecutionCache implements IDREExecutionCache {
  private readonly store = new Map<string, DREExecutionCacheEntry>();

  public get(key: string): DREExecutionCacheEntry | undefined {
    return this.store.get(key);
  }

  public set(entry: DREExecutionCacheEntry): void {
    this.store.set(entry.cacheKey, entry);
  }

  public invalidate(reason: string): void {
    this.store.clear();
  }

  public list(): readonly DREExecutionCacheEntry[] {
    return Array.from(this.store.values());
  }
}
