import { InlineKeyboard, type Context } from "grammy";
import { db } from "../db";

export const timezoneCommand = async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    console.error("Chat ID is not available");
    return;
  }
  try {
    const timezone = await db.getUserTimezone(chatId);
    const keyboard = new InlineKeyboard().text(
      "Изменить часовой пояс",
      "set_my_timezone"
    );

    if (timezone !== null) {
      await ctx.reply(
        `Ваш текущий часовой пояс: ${
          timezone > 0 ? "+" : ""
        }${timezone}:00\nДля изменения нажмите кнопку ниже:`,
        { reply_markup: keyboard }
      );
    } else {
      await ctx.reply(
        "У вас ещё не установлен часовой пояс.\nДля установки нажмите кнопку ниже:",
        { reply_markup: keyboard }
      );
    }
  } catch (error) {
    console.error("Ошибка при получении часового пояса:", error);
    await ctx.reply(
      "Произошла ошибка при получении часового пояса. Попробуйте позже."
    );
  }
};
