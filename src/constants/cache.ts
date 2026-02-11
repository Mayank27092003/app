export const CACHE_SECTIONS = {
  TRANSLATIONS: "translations",
  USERS: "users",
  PRODUCTS: "products",
  // Add more sections here as needed
} as const;

export type CacheSection = (typeof CACHE_SECTIONS)[keyof typeof CACHE_SECTIONS];
