import { db } from "../db";

async function getChatTimezoneOffset(chatId: number): Promise<number> {
  const timezone = await db.getUserTimezone(chatId);
  const serverTimezone = new Date().getTimezoneOffset() / 60;
  if (!timezone) return 0;
  return timezone + serverTimezone;
}

export async function applyTimezoneOffset(
  chatId: number,
  date: Date
): Promise<Date> {
  const timezoneOffset = await getChatTimezoneOffset(chatId);
  if (!timezoneOffset) return date;

  const adjustedDate = new Date(date);
  adjustedDate.setHours(adjustedDate.getHours() - timezoneOffset);

  return adjustedDate;
}
