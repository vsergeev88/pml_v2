import type { Bot } from "grammy";
import { db } from "../db";

export async function checkAndSendReminders(bot: Bot) {
  try {
    const now = new Date();
    const reminders = await db.getPendingReminders(now);
    for (const reminder of reminders) {
      try {
        await bot.api.sendMessage(
          reminder.chat_id,
          `🔔 Напоминание:\n${reminder.message}`
        );
        await db.markReminderAsCompleted(reminder.id!);
      } catch (error) {
        console.error(`Ошибка отправки напоминания ${reminder.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Ошибка проверки напоминаний:", error);
  }
}
