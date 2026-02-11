import fs from "fs";
import path from "path";

export type TranslationType = "mobile" | "admin" | "backend";

/**
 * Get translation directory path for a specific type
 */
function getTranslationDir(type: TranslationType): string {
  return path.join(process.cwd(), "translations", type);
}

/**
 * Ensure translation directory exists for a type
 */
function ensureTranslationDir(type: TranslationType): void {
  const dir = getTranslationDir(type);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Load translation file from disk for a specific type
 */
export function loadTranslationFile(
  langCode: string,
  type: TranslationType = "mobile"
): Record<string, Record<string, any>> {
  const filePath = path.join(getTranslationDir(type), `${langCode}.json`);
  
  if (!fs.existsSync(filePath)) {
    // Fallback to mobile if file doesn't exist for other types
    if (type !== "mobile") {
      const mobilePath = path.join(getTranslationDir("mobile"), `${langCode}.json`);
      if (fs.existsSync(mobilePath)) {
        const fileContent = fs.readFileSync(mobilePath, "utf-8");
        return JSON.parse(fileContent);
      }
    }
    throw new Error(`Translation file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent);
}

/**
 * Save translation file to disk for a specific type
 */
export function saveTranslationFile(
  langCode: string,
  translations: Record<string, Record<string, any>>,
  type: TranslationType = "mobile"
): void {
  ensureTranslationDir(type);
  const filePath = path.join(getTranslationDir(type), `${langCode}.json`);
  fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), "utf-8");
}

/**
 * Get list of available translation files for a specific type
 */
export function getAvailableTranslationFiles(type?: TranslationType): string[] {
  if (type) {
    const translationsDir = getTranslationDir(type);
    if (!fs.existsSync(translationsDir)) {
      return [];
    }
    return fs
      .readdirSync(translationsDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));
  }

  // If no type specified, get all unique languages across all types
  const types: TranslationType[] = ["mobile", "admin", "backend"];
  const allLanguages = new Set<string>();
  
  types.forEach((t) => {
    const dir = getTranslationDir(t);
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir)
        .filter((file) => file.endsWith(".json"))
        .forEach((file) => allLanguages.add(file.replace(".json", "")));
    }
  });
  
  return Array.from(allLanguages);
}

/**
 * Get available languages for a specific type
 */
export function getAvailableLanguagesForType(type: TranslationType): string[] {
  return getAvailableTranslationFiles(type);
}

/**
 * Language code to country code mapping for flags
 * Some languages need country codes for flags (e.g., en -> gb/us, zh -> cn)
 */
const languageToCountryCode: Record<string, string> = {
  en: "gb", // English -> Great Britain flag
  es: "es", // Spanish -> Spain
  fr: "fr", // French -> France
  de: "de", // German -> Germany
  it: "it", // Italian -> Italy
  pt: "pt", // Portuguese -> Portugal
  ru: "ru", // Russian -> Russia
  zh: "cn", // Chinese -> China
  ja: "jp", // Japanese -> Japan
  ko: "kr", // Korean -> South Korea
  ar: "sa", // Arabic -> Saudi Arabia
  hi: "in", // Hindi -> India
  tr: "tr", // Turkish -> Turkey
  nl: "nl", // Dutch -> Netherlands
  pl: "pl", // Polish -> Poland
  sv: "se", // Swedish -> Sweden
  da: "dk", // Danish -> Denmark
  no: "no", // Norwegian -> Norway
  fi: "fi", // Finnish -> Finland
  cs: "cz", // Czech -> Czech Republic
  hr: "hr", // Croatian -> Croatia
  ro: "ro", // Romanian -> Romania
  hu: "hu", // Hungarian -> Hungary
  el: "gr", // Greek -> Greece
  he: "il", // Hebrew -> Israel
  th: "th", // Thai -> Thailand
  vi: "vn", // Vietnamese -> Vietnam
  id: "id", // Indonesian -> Indonesia
  ms: "my", // Malay -> Malaysia
  uk: "ua", // Ukrainian -> Ukraine
};

/**
 * Get language name from code
 */
const languageNames: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  ar: "Arabic",
  hi: "Hindi",
  tr: "Turkish",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
  da: "Danish",
  no: "Norwegian",
  fi: "Finnish",
  cs: "Czech",
  hr: "Croatian",
  ro: "Romanian",
  hu: "Hungarian",
  el: "Greek",
  he: "Hebrew",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  ms: "Malay",
  uk: "Ukrainian",
};

/**
 * Get flag URL for a language code
 * Uses flagcdn.com CDN
 */
export function getFlagUrl(langCode: string): string {
  const countryCode = languageToCountryCode[langCode.toLowerCase()] || langCode.toLowerCase();
  // Using flagcdn.com - free CDN for country flags
  return `https://flagcdn.com/w40/${countryCode}.png`;
}

/**
 * Get language info with flag
 */
export function getLanguageInfo(langCode: string): {
  code: string;
  name: string;
  flagUrl: string;
} {
  return {
    code: langCode.toLowerCase(),
    name: languageNames[langCode.toLowerCase()] || langCode.toUpperCase(),
    flagUrl: getFlagUrl(langCode),
  };
}

/**
 * Flatten nested object to dot notation keys
 */
function flattenObject(obj: any, prefix = "", result: Record<string, any> = {}): Record<string, any> {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], newKey, result);
      } else {
        result[newKey] = obj[key];
      }
    }
  }
  return result;
}

/**
 * Get all translation keys with all language values
 * Returns array like: [{ key: "auth.login.title", en: "Welcome Back", es: "Bienvenido", ... }]
 */
export function getAllTranslationKeys(
  type: TranslationType = "mobile",
  namespace?: string
): Array<Record<string, any>> {
  const languages = getAvailableTranslationFiles(type);
  const allKeys: Record<string, Record<string, any>> = {};

  // Load all language files and flatten them
  languages.forEach((lang) => {
    try {
      const translations = loadTranslationFile(lang, type);
      
      // Filter by namespace if provided
      const dataToProcess = namespace && translations[namespace] 
        ? { [namespace]: translations[namespace] }
        : translations;

      // Flatten the translation object
      const flattened = flattenObject(dataToProcess);

      // Add each key-value pair to allKeys
      Object.keys(flattened).forEach((key) => {
        if (!allKeys[key]) {
          allKeys[key] = { key };
        }
        allKeys[key][lang] = flattened[key];
      });
    } catch (error) {
      console.warn(`Failed to load translations for ${lang}:`, error);
    }
  });

  // Convert to array
  return Object.values(allKeys);
}

