import { InlineKeyboard } from "grammy";

import { type Context } from "grammy";
import { ReminderStates, UserStates } from "../../types";
import { db } from "../db";

export const userMessageHandler = async (
  ctx: Context,
  userStates: UserStates,
  reminderStates: ReminderStates
) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;
  const userState = userStates.get(chatId);

  if (userState === "awaiting_timezone") {
    const timezoneText = ctx.message?.text;
    if (!timezoneText) return;
    const timezone = parseInt(timezoneText);

    if (isNaN(timezone)) {
      await ctx.reply(
        "Пожалуйста, введите корректное числовое значение часового пояса."
      );
      return;
    }

    if (timezone < -12 || timezone > 14) {
      await ctx.reply(
        "Часовой пояс должен быть в диапазоне от -12 до +14 часов."
      );
      return;
    }

    try {
      await db.setUserTimezone(chatId, timezone);
      await ctx.reply(
        `Ваш часовой пояс успешно установлен: ${
          timezone > 0 ? "+" : ""
        }${timezone}:00`
      );
      userStates.delete(chatId);
    } catch (error) {
      console.error("Ошибка при установке часового пояса:", error);
      await ctx.reply(
        "Произошла ошибка при установке часового пояса. Попробуйте позже."
      );
    }
  } else {
    try {
      const timezone = await db.getUserTimezone(chatId);

      if (timezone === null) {
        const keyboard = new InlineKeyboard().text(
          "Установить часовой пояс",
          "set_my_timezone"
        );
        await ctx.reply(
          "Для создания напоминания необходимо установить часовой пояс:",
          { reply_markup: keyboard }
        );
        return;
      }

      reminderStates.set(chatId, { messageText: ctx.message?.text ?? "" });

      const keyboard = new InlineKeyboard()
        .text("Завтра в 9:00", "reminder_tomorrow")
        .text("В понедельник в 9:00", "reminder_monday")
        .row()
        .text("Выбрать другую дату", "reminder_custom");

      await ctx.reply("Выберите время для напоминания:", {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error("Ошибка при проверке часового пояса:", error);
      await ctx.reply("Произошла ошибка. Попробуйте позже.");
    }
  }
};
