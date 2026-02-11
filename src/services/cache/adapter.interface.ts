export interface CacheAdapter {
  set<T = any>(section: string, data: T): void | Promise<void>;
  getSection<T = any>(section: string): T | undefined | Promise<T | undefined>;
  clearSection(section: string): void | Promise<void>;
  clearAll(): void | Promise<void>;
  isExpired(section: string, ttlMs: number): boolean | Promise<boolean>;
  getKeys(): string[] | Promise<string[]>;
}
