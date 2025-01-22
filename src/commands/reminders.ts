import { type Context } from "grammy";
import { db } from "../db";
import { getLocaleDate } from "../helpers/date";

export const remindersCommand = async (ctx: Context) => {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    console.error("Chat ID is not available");
    return;
  }
  try {
    const reminders = await db.getUserReminders(chatId);
    const timezone = await db.getUserTimezone(chatId);

    if (reminders.length === 0) {
      await ctx.reply("У вас нет активных напоминаний.");
      return;
    }

    const remindersList = reminders
      .map((reminder) => {
        const reminderDate = new Date(reminder.remind_at);
        reminderDate.setHours(reminderDate.getHours() + Number(timezone) || 0);
        const dateStr = getLocaleDate(reminderDate);
        return `📝 ${dateStr}\n${reminder.message}`;
      })
      .join("\n\n");

    await ctx.reply(`Ваши напоминания:\n\n${remindersList}`);
  } catch (error) {
    console.error("Ошибка при получении списка напоминаний:", error);
    await ctx.reply("Произошла ошибка при получении списка напоминаний.");
  }
};
