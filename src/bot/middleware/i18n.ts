import { Context } from 'telegraf';
import i18n from 'i18n';
import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../../database/connection';

// Initialize i18n
const locales = ['en', 'ru', 'es', 'pt', 'hi'];

i18n.configure({
  locales,
  directory: join(__dirname, '../../locales'),
  defaultLocale: 'en',
  objectNotation: true,
  updateFiles: false,
  autoReload: false,
});

export const i18nMiddleware = async (ctx: Context, next: () => Promise<void>) => {
  const userId = ctx.from?.id;
  if (!userId) {
    return next();
  }

  try {
    const result = await query(
      'SELECT language_code FROM users WHERE telegram_id = $1',
      [userId]
    );

    const userLang = result.rows[0]?.language_code || ctx.from?.language_code || 'en';
    const locale = locales.includes(userLang) ? userLang : 'en';

    ctx.i18n = {
      locale,
      t: (key: string, params?: Record<string, any>) => {
        try {
          let translated = i18n.__({ phrase: key, locale });
          
          // Ручная подстановка параметров, если библиотека не сделала это автоматически
          if (params && translated.includes('{')) {
            Object.keys(params).forEach(paramKey => {
              const value = params[paramKey];
              translated = translated.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
            });
          }
          
          return translated;
        } catch (err) {
          console.error(`Translation error for key "${key}":`, err);
          return key; // Return key if translation fails
        }
      },
    };
  } catch (error) {
    console.error('i18n middleware error:', error);
    ctx.i18n = {
      locale: 'en',
      t: (key: string, params?: Record<string, any>) => {
        try {
          let translated = i18n.__({ phrase: key, locale: 'en' });
          
          // Ручная подстановка параметров
          if (params && translated.includes('{')) {
            Object.keys(params).forEach(paramKey => {
              const value = params[paramKey];
              translated = translated.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
            });
          }
          
          return translated;
        } catch (err) {
          console.error(`Translation error for key "${key}":`, err);
          return key;
        }
      },
    };
  }

  await next();
};

