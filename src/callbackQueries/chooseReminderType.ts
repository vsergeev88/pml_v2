import { InlineKeyboard } from "grammy";

import { type Context } from "grammy";
import { ReminderStates } from "../../types";
import { getNextDayAt9AM, getNextMondayAt9AM } from "../helpers/date";
import { saveReminder } from "../utils/saveReminder";
import { chooseDate } from "./customReminderDate/chooseDate";

export const chooseReminderType = async (
  ctx: Context,
  reminderStates: ReminderStates
) => {
  const chatId = ctx.chat?.id;
  const messageId = ctx.callbackQuery?.message?.message_id;
  const match = ctx.match;
  if (!chatId || !messageId || !match) return;

  const action = match[1];
  const state = reminderStates.get(chatId);

  if (!state) {
    await ctx.answerCallbackQuery("Произошла ошибка. Начните сначала.");
    return;
  }

  const onSaveReminderSuccess = (chatId: number) => {
    reminderStates.delete(chatId);
  };

  if (action === "tomorrow") {
    state.selectedDate = getNextDayAt9AM();
    state.selectedDate.setHours(9);
    saveReminder({
      chatId,
      state,
      api: ctx.api,
      messageId,
      onSuccess: onSaveReminderSuccess,
    });
    return;
  } else if (action === "monday") {
    state.selectedDate = getNextMondayAt9AM();
    state.selectedDate.setHours(9);
    saveReminder({
      chatId,
      state,
      api: ctx.api,
      messageId,
      onSuccess: onSaveReminderSuccess,
    });
  } else if (action === "custom") {
    chooseDate(ctx, chatId, messageId);
  }

  await ctx.answerCallbackQuery();
};
