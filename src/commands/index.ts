import { type Bot } from "grammy";
import { startCommand } from "./start";
import { timezoneCommand } from "./timezone";
import { remindersCommand } from "./reminders";

export const setupCommands = (bot: Bot) => {
  bot.api.setMyCommands([
    { command: "start", description: "Start the bot" },
    { command: "timezone", description: "Set my timezone" },
    { command: "reminders", description: "Show my reminders" },
  ]);

  bot.command("start", startCommand);
  bot.command("timezone", timezoneCommand);
  bot.command("reminders", remindersCommand);
};
