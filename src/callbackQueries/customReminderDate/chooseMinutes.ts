import { InlineKeyboard, type Context } from "grammy";
import type { ReminderStates } from "../../../types";

function createMinutesKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("00", "time_min_00")
    .text("15", "time_min_15")
    .text("30", "time_min_30")
    .text("45", "time_min_45");
}

export const chooseMinutes = async (
  ctx: Context,
  reminderStates: ReminderStates
) => {
  const chatId = ctx.chat?.id;
  const messageId = ctx.callbackQuery?.message?.message_id;
  const match = ctx.match;
  if (!chatId || !messageId || !match) return;

  const hour = parseInt(match[1] ?? "0");
  const state = reminderStates.get(chatId);

  if (state && state.selectedDate) {
    state.selectedDate.setHours(hour);
    state.selectedHour = hour;

    await ctx.api.editMessageText(chatId, messageId, "Выберите минуты:", {
      reply_markup: createMinutesKeyboard(),
    });
  }

  await ctx.answerCallbackQuery();
};
