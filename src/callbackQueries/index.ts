import { Bot } from "grammy";
import { setMyTimezoneCallback } from "./set_my_timezone";
import { chooseReminderType } from "./chooseReminderType";
import { chooseHours } from "./customReminderDate/chooseHours";
import { chooseMinutes } from "./customReminderDate/chooseMinutes";
import { saveCustomDateReminder } from "./customReminderDate/saveCustomDateReminder";
import { UserStates } from "../../types";
import { ReminderStates } from "../../types";

export const setupCallbackQueries = (
  bot: Bot,
  userStates: UserStates,
  reminderStates: ReminderStates
) => {
  bot.callbackQuery("set_my_timezone", (ctx) =>
    setMyTimezoneCallback(ctx, userStates)
  );
  bot.callbackQuery(/^reminder_(tomorrow|monday|custom)$/, (ctx) =>
    chooseReminderType(ctx, reminderStates)
  );
  bot.callbackQuery(/^reminder_date_(\d+)$/, (ctx) =>
    chooseHours(ctx, reminderStates)
  );
  bot.callbackQuery(/^time_hour_(\d+)$/, (ctx) =>
    chooseMinutes(ctx, reminderStates)
  );
  bot.callbackQuery(/^time_min_(\d+)$/, (ctx) =>
    saveCustomDateReminder(ctx, reminderStates)
  );
};
