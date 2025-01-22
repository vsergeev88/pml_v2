import { Bot } from "grammy";
import * as dotenv from "dotenv";
import type { ReminderStates, UserStates } from "./types";
import { userMessageHandler } from "./src/utils/userMessageHandler";
import { checkAndSendReminders } from "./src/utils/checkAndSendReminders";

import { setupCommands } from "./src/commands";
import { setupCallbackQueries } from "./src/callbackQueries";

dotenv.config();

const userStates: UserStates = new Map();
const reminderStates: ReminderStates = new Map();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN ?? "");

setupCommands(bot);
setupCallbackQueries(bot, userStates, reminderStates);

bot.on("message:text", (ctx) =>
  userMessageHandler(ctx, userStates, reminderStates)
);

setInterval(() => checkAndSendReminders(bot), 60 * 1000);

bot.start();
