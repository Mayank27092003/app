import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import {
  loadTranslationFile,
  saveTranslationFile,
  getAvailableTranslationFiles,
  getAvailableLanguagesForType,
  TranslationType,
  getAllTranslationKeys,
  getLanguageInfo,
} from "../../services/translation/sync.service";

export class TranslationController {
  /**
   * Upload translation file (multipart/form-data)
   * Admin only - uploads JSON file to translations directory
   * Supports type parameter: mobile, admin, or backend
   */
  async uploadTranslationFile(req: Request, res: Response) {
    try {
      const file = (req.files as any)?.file;
      const { lang, type = "mobile" } = req.body;

      // Validate type
      const validTypes: TranslationType[] = ["mobile", "admin", "backend"];
      if (!validTypes.includes(type as TranslationType)) {
        res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        });
        return;
      }

      if (!file) {
        res.status(400).json({
          success: false,
          error: "No file provided. Please upload a JSON translation file.",
        });
        return;
      }

      if (!lang || typeof lang !== "string" || lang.length !== 2) {
        res.status(400).json({
          success: false,
          error: "Invalid or missing 'lang' parameter. Must be a 2-letter language code (e.g., 'en', 'fr', 'es').",
        });
        return;
      }

      // Validate file is JSON
      if (!file.name.endsWith(".json")) {
        res.status(400).json({
          success: false,
          error: "Invalid file type. Only JSON files are allowed.",
        });
        return;
      }

      // Read and parse JSON file
      let translations: Record<string, Record<string, any>>;
      try {
        const fileContent = file.tempFilePath
          ? fs.readFileSync(file.tempFilePath, "utf-8")
          : file.data.toString("utf-8");
        translations = JSON.parse(fileContent);
      } catch (parseError: any) {
        res.status(400).json({
          success: false,
          error: `Invalid JSON file: ${parseError.message}`,
        });
        return;
      }

      // Validate JSON structure (should be object with namespace keys)
      if (typeof translations !== "object" || translations === null || Array.isArray(translations)) {
        res.status(400).json({
          success: false,
          error: "Invalid translation file structure. Expected an object with namespace keys.",
        });
        return;
      }

      // Save file to translations directory for the specified type
      saveTranslationFile(lang, translations, type as TranslationType);

      // Get all available files after upload
      const allFiles = getAvailableTranslationFiles(type as TranslationType);

      res.status(200).json({
        success: true,
        message: `Translation file uploaded successfully for language: ${lang} (type: ${type})`,
        data: {
          lang,
          type,
          fileName: file.name,
          allFiles, // Return all file names
        },
      });
    } catch (error: any) {
      console.error("Error uploading translation file:", error);
      res.status(500).json({
        success: false,
        error: "Failed to upload translation file",
        details: error.message,
      });
    }
  }


  /**
   * Get translation file for a specific language
   * Public endpoint - frontend can fetch translations
   * GET /api/v1/translations/:lang?type=mobile|admin|backend
   */
  async getTranslationFile(req: Request, res: Response) {
    try {
      const { lang } = req.params;
      const { type = "mobile" } = req.query;

      if (!lang || lang.length !== 2) {
        res.status(400).json({
          success: false,
          error: "Invalid language code. Must be a 2-letter code (e.g., 'en', 'fr', 'es').",
        });
        return;
      }

      // Validate type
      const validTypes: TranslationType[] = ["mobile", "admin", "backend"];
      if (!validTypes.includes(type as TranslationType)) {
        res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        });
        return;
      }

      // Load translation file for the specified type
      const translations = loadTranslationFile(lang as string, type as TranslationType);

      // Set content type - no cache headers, frontend will handle caching if needed
      res.setHeader("Content-Type", "application/json");

      // Return translation data with success key
      res.status(200).json({
        success: true,
        lang,
        type,
        data: translations,
      });
    } catch (error: any) {
      console.error("Error getting translation file:", error);
      res.status(500).json({
        success: false,
        error: "Failed to load translation file",
        details: error.message,
      });
    }
  }

  /**
   * Get list of available languages
   * Public endpoint - frontend can see available languages
   * GET /api/v1/translations/languages?type=mobile|admin|backend
   * Returns array of objects with language code, name, and flag URL
   */
  async getAvailableLanguages(req: Request, res: Response) {
    try {
      const { type } = req.query;

      let files: string[];
      if (type && ["mobile", "admin", "backend"].includes(type as string)) {
        files = getAvailableLanguagesForType(type as TranslationType);
      } else {
        files = getAvailableTranslationFiles();
      }

      // Convert to array of objects with language info and flag
      const languages = files.map((langCode) => getLanguageInfo(langCode));

      res.status(200).json({
        success: true,
        total: languages.length,
        languages: languages,
      });
    } catch (error: any) {
      console.error("Error getting available languages:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get available languages",
        details: error.message,
      });
    }
  }

  /**
   * Get list of available translation files
   * Admin only
   * GET /api/v1/translations/files?type=mobile|admin|backend
   */
  async listTranslationFiles(req: Request, res: Response) {
    try {
      const { type } = req.query;
      const types: TranslationType[] = type && ["mobile", "admin", "backend"].includes(type as string)
        ? [type as TranslationType]
        : ["mobile", "admin", "backend"];

      const fileDetails: Array<{
        lang: string;
        type: TranslationType;
        fileName: string;
        lastModified?: string;
        size?: number;
        error?: string;
      }> = [];

      types.forEach((t) => {
        const files = getAvailableTranslationFiles(t);
        files.forEach((lang) => {
          try {
            const filePath = path.join(process.cwd(), "translations", t, `${lang}.json`);
            const stats = fs.statSync(filePath);
            fileDetails.push({
              lang,
              type: t,
              fileName: `${lang}.json`,
              lastModified: stats.mtime.toISOString(),
              size: stats.size,
            });
          } catch {
            fileDetails.push({
              lang,
              type: t,
              fileName: `${lang}.json`,
              error: "Could not read file stats",
            });
          }
        });
      });

      res.status(200).json({
        success: true,
        data: {
          files: fileDetails,
          count: fileDetails.length,
          types: types,
        },
      });
    } catch (error: any) {
      console.error("Error listing translation files:", error);
      res.status(500).json({
        success: false,
        error: "Failed to list translation files",
        details: error.message,
      });
    }
  }


  /**
   * Get all translation keys with all language values
   * Public endpoint - returns array of keys with all language values
   * GET /api/v1/translations/keys?type=mobile|admin|backend&namespace=common
   */
  async getAllTranslationKeys(req: Request, res: Response) {
    try {
      const { type = "mobile", namespace } = req.query;

      // Validate type
      const validTypes: TranslationType[] = ["mobile", "admin", "backend"];
      if (!validTypes.includes(type as TranslationType)) {
        res.status(400).json({
          success: false,
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        });
        return;
      }

      // Get all translation keys with all language values
      const keys = getAllTranslationKeys(type as TranslationType, namespace as string | undefined);

      res.status(200).json({
        success: true,
        total: keys.length,
        type,
        namespace: namespace || null,
        keys: keys,
      });
    } catch (error: any) {
      console.error("Error getting translation keys:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get translation keys",
        details: error.message,
      });
    }
  }
}

export default new TranslationController();

