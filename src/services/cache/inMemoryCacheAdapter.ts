import { CacheAdapter } from "./adapter.interface";

type CacheEntry<T = any> = {
  data: T;
  loadedAt: number;
};

export class InMemoryCacheAdapter implements CacheAdapter {
  private cache: Record<string, CacheEntry> = {};

  set<T>(section: string, data: T) {
    this.cache[section] = { data, loadedAt: Date.now() };
  }

  getSection<T>(section: string): T | undefined {
    return this.cache[section]?.data;
  }

  clearSection(section: string) {
    delete this.cache[section];
  }

  clearAll() {
    this.cache = {};
  }

  isExpired(section: string, ttlMs: number): boolean {
    const entry = this.cache[section];
    return !entry || Date.now() - entry.loadedAt > ttlMs;
  }

  print() {
    console.log("🧠 InMemory Cache Snapshot:");
    for (const section in this.cache) {
      const { data, loadedAt } = this.cache[section];
      console.log(
        `📦 [${section}] (loadedAt: ${new Date(loadedAt).toISOString()}):`
      );
      console.dir(data, { depth: null });
    }
    if (Object.keys(this.cache).length === 0) {
      console.log("⚠️  Cache is empty.");
    }
  }

  getKeys(): string[] {
    return Object.keys(this.cache);
  }
}
