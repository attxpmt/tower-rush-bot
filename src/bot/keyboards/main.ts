import { Markup } from 'telegraf';

export function mainKeyboard(miniAppUrl: string, referralUrl: string) {
  const buttons: any[][] = [[Markup.button.webApp('🎮 Открыть', miniAppUrl)]];
  if (referralUrl) {
    buttons.push([Markup.button.url('📝 Зарегистрироваться', referralUrl)]);
  }
  return Markup.inlineKeyboard(buttons);
}

export function helpKeyboard(miniAppUrl: string, supportContact: string) {
  const buttons: any[][] = [[Markup.button.webApp('🎮 Открыть Mini App', miniAppUrl)]];
  if (supportContact) {
    const url = supportContact.startsWith('http')
      ? supportContact
      : `https://t.me/${supportContact.replace('@', '')}`;
    buttons.push([Markup.button.url('💬 Написать в поддержку', url)]);
  }
  return Markup.inlineKeyboard(buttons);
}
