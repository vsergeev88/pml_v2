import { type Context } from "grammy";
import { ReminderStates } from "../../../types";
import { saveReminder } from "../../utils/saveReminder";

export const saveCustomDateReminder = async (
  ctx: Context,
  reminderStates: ReminderStates
) => {
  const chatId = ctx.chat?.id;
  const messageId = ctx.callbackQuery?.message?.message_id;
  const match = ctx.match;
  if (!chatId || !messageId || !match) return;

  const minutes = parseInt(match[1] ?? "0");
  const state = reminderStates.get(chatId);

  if (state && state.selectedDate) {
    state.selectedDate.setMinutes(minutes);

    try {
      await saveReminder({
        chatId,
        state,
        api: ctx.api,
        messageId,
        onSuccess: () => reminderStates.delete(chatId),
      });
    } catch (error) {
      console.error("Ошибка при создании напоминания:", error);
      await ctx.api.editMessageText(
        chatId,
        messageId,
        "Произошла ошибка при создании напоминания. Попробуйте позже."
      );
    }
  }

  await ctx.answerCallbackQuery();
};
