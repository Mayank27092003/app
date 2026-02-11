import { Logger } from "../../../utils/logger";
import { CacheService, CachedUserDetails } from "../types";

/**
 * User details cache service
 * Handles caching of user details with TTL support
 */
export class UserDetailsCacheService implements CacheService {
  private cache: Map<string, CachedUserDetails> = new Map();
  private readonly defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached value
   */
  get(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    if (this.isExpired(cached.timestamp)) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set cached value with TTL
   */
  set(key: string, value: any, ttl?: number): void {
    const timestamp = Date.now();
    const cacheTTL = ttl || this.defaultTTL;
    
    this.cache.set(key, {
      data: value,
      timestamp: timestamp + cacheTTL
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(timestamp: number): boolean {
    return Date.now() > timestamp;
  }

  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, value] of this.cache.entries()) {
      if (now > value.timestamp) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      Logger.info(`Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Set user details with caching
   */
  setUserDetails(userId: number, userDetails: any, ttl?: number): void {
    const key = `user:${userId}`;
    this.set(key, userDetails, ttl);
    Logger.info(`Cached user details for user ${userId}`);
  }

  /**
   * Get user details from cache
   */
  getUserDetails(userId: number): any {
    const key = `user:${userId}`;
    return this.get(key);
  }

  /**
   * Clear user cache
   */
  clearUserCache(userId: number): void {
    const key = `user:${userId}`;
    this.delete(key);
    Logger.info(`Cleared cache for user ${userId}`);
  }

  /**
   * Batch clear user caches
   */
  clearUserCaches(userIds: number[]): void {
    userIds.forEach(userId => {
      this.clearUserCache(userId);
    });
  }
}
