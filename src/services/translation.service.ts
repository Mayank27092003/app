import mustache from "mustache";
import { loadTranslationsIntoCache } from "../bootstrap/loadTranslation";
import { CACHE_SECTIONS } from "../constants/cache";
import { inMemoryCacheService } from "./cache";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

export async function getCachedTranslation(
  lang: string,
  key: string,
  vars: Record<string, any> = {},
  namespace = "common",
  fallback = ""
): Promise<string> {
  const isExpired = inMemoryCacheService.isExpired(
    CACHE_SECTIONS.TRANSLATIONS,
    CACHE_TTL_MS
  );

  if (isExpired) {
    console.log("🔄 Translations expired. Reloading from DB...");
    await loadTranslationsIntoCache();
  }

  const fullKey = `${namespace}.${key}`;
  const translations = inMemoryCacheService.getSection<
    Record<string, Record<string, string>>
  >(CACHE_SECTIONS.TRANSLATIONS);

  const langCache = translations?.[lang] || {};
  const raw =
    langCache?.[fullKey] || translations?.["en"]?.[fullKey] || fallback;

  return mustache.render(raw, vars);
}
