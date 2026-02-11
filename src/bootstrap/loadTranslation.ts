import db from "../database/db";
import { inMemoryCacheService } from "../services/cache";

export async function loadTranslationsIntoCache() {
  const rows = await db("translationKeys")
    .join("translations", "translationKeys.id", "=", "translations.keyId")
    .select(
      "translationKeys.key",
      "translationKeys.namespace",
      "translations.lang",
      "translations.value"
    );

  const translationCache: Record<string, Record<string, string>> = {};

  for (const row of rows) {
    const fullKey = `${row.namespace}.${row.key}`;
    if (!translationCache[row.lang]) {
      translationCache[row.lang] = {};
    }
    translationCache[row.lang][fullKey] = row.value;
  }

  inMemoryCacheService.set("translations", translationCache);
  console.log(`✅ Loaded ${rows.length} translations into cache.`);
}
