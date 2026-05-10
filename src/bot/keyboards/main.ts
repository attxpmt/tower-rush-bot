import { Markup } from 'telegraf';

export function mainKeyboard(miniAppUrl: string, referralUrl: string) {
  return Markup.inlineKeyboard([
    [Markup.button.webApp('🎮 Открыть Mini App', miniAppUrl)],
    [Markup.button.url('📝 Регистрация на 1win', referralUrl)],
  ]);
}

export function adminKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback('🔗 Реферальная ссылка', 'admin:referral')],
    [Markup.button.callback('📢 Ссылка на канал', 'admin:channel')],
    [Markup.button.callback('🎁 Промокод', 'admin:promo')],
    [Markup.button.callback('✏️ Название бота', 'admin:botname')],
    [Markup.button.callback('📊 Статистика', 'admin:stats')],
  ]);
}
