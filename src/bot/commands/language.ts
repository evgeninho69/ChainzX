import { Context } from 'telegraf';

export async function handleLanguage(ctx: Context) {
  await ctx.reply(
    ctx.i18n!.t('language_title'),
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇬🇧 English', callback_data: 'lang_en' }],
          [{ text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
          [{ text: '🇪🇸 Español', callback_data: 'lang_es' }],
          [{ text: '🇵🇹 Português', callback_data: 'lang_pt' }],
          [{ text: '🇮🇳 हिन्दी', callback_data: 'lang_hi' }]
        ]
      }
    }
  );
}

