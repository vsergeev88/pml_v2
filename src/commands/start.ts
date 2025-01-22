import { type Context, InlineKeyboard } from "grammy";

export const startCommand = async (ctx: Context) => {
  const keyboard = new InlineKeyboard().text(
    "Установить часовой пояс",
    "set_my_timezone"
  );

  await ctx.reply("Добро пожаловать! Выберите действие:", {
    reply_markup: keyboard,
  });
};
