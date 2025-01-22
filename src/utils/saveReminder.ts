import type { Api, RawApi } from "grammy";
import { ReminderState } from "../../types";
import { getLocaleDate } from "../helpers/date";
import { db } from "../db";
import { applyTimezoneOffset } from "./timezoneOffset";

type SaveReminder = (args: {
  chatId: number;
  state: ReminderState;
  api: Api<RawApi>;
  messageId: number;
  onSuccess: (chatId: number) => void;
  onError?: (chatId: number) => void;
}) => void;

export const saveReminder: SaveReminder = async ({
  chatId,
  state,
  api,
  messageId,
  onSuccess,
  onError,
}) => {
  if (!state.selectedDate) {
    console.error("No selected date");
    return;
  }
  try {
    const correctedDate = await applyTimezoneOffset(chatId, state.selectedDate);
    await db.createReminder({
      chat_id: chatId,
      message: state.messageText,
      remind_at: correctedDate,
    });
    await api.editMessageText(
      chatId,
      messageId,
      `✅ Напоминание "${state.messageText}" установлено на ${getLocaleDate(
        state.selectedDate
      )}`
    );
    onSuccess(chatId);
  } catch (error) {
    onError?.(chatId);
    console.error("Ошибка при создании напоминания:", error);
  }
};
