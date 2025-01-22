import { type Context } from "grammy";
import { UserStates } from "../../types";

export const setMyTimezoneCallback = async (
  ctx: Context,
  userStates: UserStates
) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  userStates.set(chatId, "awaiting_timezone");
  await ctx.reply(
    "Пожалуйста, введите ваш часовой пояс в часах (например: 3 для МСК, -5 для EST):"
  );
  await ctx.answerCallbackQuery();
};
