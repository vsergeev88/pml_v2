import { type Context, InlineKeyboard } from "grammy";
import { getDaysForTwoWeeks } from "../../helpers/date";

export const chooseDate = async (
  ctx: Context,
  chatId: number,
  messageId: number
) => {
  const days = getDaysForTwoWeeks();
  const keyboard = new InlineKeyboard();

  days.forEach((day, index) => {
    keyboard.text(day.label, `reminder_date_${index}`);
    if ((index + 1) % 3 === 0) keyboard.row();
  });

  await ctx.api.editMessageText(chatId, messageId, "Выберите дату:", {
    reply_markup: keyboard,
  });
};
