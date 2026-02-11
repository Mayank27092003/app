import { Request, Response, NextFunction } from "express";
import { inMemoryCacheService } from "../../services/cache";

export class CacheController {
  /**
   * Clear all cache entries (admin use only)
   */
  clearAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      inMemoryCacheService.clearAll();
      res.status(200).json({ message: "All cache cleared successfully." });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Clear a specific cache section by name
   */
  clearSection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const section = req.params.section as string;
      if (!section) {
        res.status(400).json({ message: "Cache section is required." });
        return;
      }

      inMemoryCacheService.clearSection(String(section));
      res.status(200).json({ message: `Cache section '${section}' cleared.` });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get all loaded cache keys (for inspection/debug)
   */
  listKeys = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const keys = inMemoryCacheService.getKeys?.() ?? [];
      res.status(200).json({ cacheKeys: keys });
    } catch (err) {
      next(err);
    }
  };
}
