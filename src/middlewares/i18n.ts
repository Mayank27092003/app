import { Request, Response, NextFunction } from 'express';
import { getCachedTranslation } from '../services/translation.service';

export function i18nMiddleware(req: Request, res: Response, next: NextFunction) {
  const rawLang = req.headers['accept-language']?.toString().split(',')[0] || 'en';
  const lang = rawLang.split('-')[0].toLowerCase(); // normalize "en-US" → "en"

  // Attach the translation function to res.locals instead of res to avoid type errors
  res.locals.t = async (
    key: string,
    vars: Record<string, any> = {},
    namespace = 'common',
    fallback = ''
  ): Promise<string> => {
    return await getCachedTranslation(lang, key, vars, namespace, fallback);
  };

  next();
}
