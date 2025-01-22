import { InlineKeyboard, type Context } from "grammy";
import { ReminderStates } from "../../../types";
import { getDaysForTwoWeeks } from "../../helpers/date";

function createTimeKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (let hour = 0; hour < 24; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    keyboard.text(`${hourStr}:00`, `time_hour_${hour}`);
    if ((hour + 1) % 4 === 0) keyboard.row();
  }
  return keyboard;
}

export const chooseHours = async (
  ctx: Context,
  reminderStates: ReminderStates
) => {
  const chatId = ctx.chat?.id;
  const messageId = ctx.callbackQuery?.message?.message_id;
  const match = ctx.match;
  if (!chatId || !messageId || !match) return;

  const dayIndex = parseInt(match[1] ?? "0");
  const days = getDaysForTwoWeeks();
  const selectedDate = days[dayIndex]?.date;

  const state = reminderStates.get(chatId);
  if (state) {
    state.selectedDate = selectedDate;
    await ctx.api.editMessageText(chatId, messageId, "Выберите час:", {
      reply_markup: createTimeKeyboard(),
    });
  }

  await ctx.answerCallbackQuery();
};
