import { Bot, InlineKeyboard, Context, Api, RawApi } from "grammy";
import * as dotenv from "dotenv";
import { db } from "./src/db";

dotenv.config();

type ReminderState = {
  messageText: string;
  selectedDate?: Date;
  selectedHour?: number;
};

// Создаем объект для хранения состояний пользователей
const userStates = new Map<number, string>();
const reminderStates = new Map<number, ReminderState>();

function getLocaleDate(date: Date, locale: string = "ru-RU"): string {
  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function saveReminder(
  chatId: number,
  state: ReminderState,
  api: Api<RawApi>,
  messageId: number
) {
  if (!state.selectedDate) {
    console.error("No selected date");
    return;
  }
  try {
    const corrctedDate = await applyTimezoneOffset(chatId, state.selectedDate);
    // Сохраняем напоминание в базу
    await db.createReminder({
      chat_id: chatId,
      message: state.messageText,
      remind_at: corrctedDate,
    });
    await api.editMessageText(
      chatId,
      messageId,
      `✅ Напоминание "${state.messageText}" установлено на ${getLocaleDate(
        state.selectedDate
      )}`
    );
    // Очищаем состояние
    reminderStates.delete(chatId);
  } catch (error) {
    console.error("Ошибка при создании напоминания:", error);
  }
}

async function getChatTimezoneOffset(chatId: number): Promise<number> {
  const timezone = await db.getUserTimezone(chatId);
  const serverTimezone = new Date().getTimezoneOffset() / 60;
  if (!timezone) return 0;
  return timezone + serverTimezone;
}

async function applyTimezoneOffset(chatId: number, date: Date): Promise<Date> {
  const timezoneOffset = await getChatTimezoneOffset(chatId);
  if (!timezoneOffset) return date;

  // Create a new date to avoid modifying the original
  const adjustedDate = new Date(date);

  // Adjust the hours by the timezone difference
  adjustedDate.setHours(adjustedDate.getHours() - timezoneOffset);

  return adjustedDate;
}

// Функции для работы с датами
function getNextDayAt9AM(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow;
}

function getNextMondayAt9AM(): Date {
  const monday = new Date();
  monday.setDate(monday.getDate() + ((8 - monday.getDay()) % 7));
  monday.setHours(9, 0, 0, 0);
  return monday;
}

function getDaysForTwoWeeks(): { date: Date; label: string }[] {
  const days: { date: Date; label: string }[] = [];
  const today = new Date();
  const weekDays = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    date.setHours(9, 0, 0, 0);

    const dayName = weekDays[date.getDay()];
    const dayMonth = date.getDate().toString().padStart(2, "0");
    const label = `${dayName} ${dayMonth}`;

    days.push({ date, label });
  }

  return days;
}

function createTimeKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  for (let hour = 0; hour < 24; hour++) {
    const hourStr = hour.toString().padStart(2, "0");
    keyboard.text(`${hourStr}:00`, `time_hour_${hour}`);
    if ((hour + 1) % 4 === 0) keyboard.row();
  }
  return keyboard;
}

function createMinutesKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("00", "time_min_00")
    .text("15", "time_min_15")
    .text("30", "time_min_30")
    .text("45", "time_min_45");
}

// Функция для проверки и отправки напоминаний
async function checkAndSendReminders() {
  try {
    const now = new Date();
    const reminders = await db.getPendingReminders(now);
    for (const reminder of reminders) {
      try {
        await bot.api.sendMessage(
          reminder.chat_id,
          `🔔 Напоминание:\n${reminder.message}`
        );
        await db.markReminderAsCompleted(reminder.id!);
      } catch (error) {
        console.error(`Ошибка отправки напоминания ${reminder.id}:`, error);
      }
    }
  } catch (error) {
    console.error("Ошибка проверки напоминаний:", error);
  }
}

// Запускаем проверку напоминаний каждую минуту
setInterval(checkAndSendReminders, 60 * 1000);

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN ?? "");
bot.api.setMyCommands([
  { command: "start", description: "Start the bot" },
  { command: "timezone", description: "Set my timezone" },
  { command: "reminders", description: "Show my reminders" },
]);

// Команда /start
bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard().text(
    "Установить часовой пояс",
    "set_my_timezone"
  );

  await ctx.reply("Добро пожаловать! Выберите действие:", {
    reply_markup: keyboard,
  });
});

// Команда /timezone
bot.command("timezone", async (ctx) => {
  console.log("timezone command");
  const chatId = ctx.chat.id;
  try {
    const timezone = await db.getUserTimezone(chatId);
    const keyboard = new InlineKeyboard().text(
      "Изменить часовой пояс",
      "set_my_timezone"
    );

    if (timezone !== null) {
      await ctx.reply(
        `Ваш текущий часовой пояс: ${
          timezone > 0 ? "+" : ""
        }${timezone}:00\nДля изменения нажмите кнопку ниже:`,
        { reply_markup: keyboard }
      );
    } else {
      await ctx.reply(
        "У вас ещё не установлен часовой пояс.\nДля установки нажмите кнопку ниже:",
        { reply_markup: keyboard }
      );
    }
  } catch (error) {
    console.error("Ошибка при получении часового пояса:", error);
    await ctx.reply(
      "Произошла ошибка при получении часового пояса. Попробуйте позже."
    );
  }
});

// Команда /reminders
bot.command("reminders", async (ctx) => {
  const chatId = ctx.chat.id;
  try {
    const reminders = await db.getUserReminders(chatId);
    const timezone = await db.getUserTimezone(chatId);

    if (reminders.length === 0) {
      await ctx.reply("У вас нет активных напоминаний.");
      return;
    }

    const remindersList = reminders
      .map((reminder) => {
        const reminderDate = new Date(reminder.remind_at);
        reminderDate.setHours(reminderDate.getHours() + Number(timezone) || 0);
        const dateStr = getLocaleDate(reminderDate);
        return `📝 ${dateStr}\n${reminder.message}`;
      })
      .join("\n\n");

    await ctx.reply(`Ваши напоминания:\n\n${remindersList}`);
  } catch (error) {
    console.error("Ошибка при получении списка напоминаний:", error);
    await ctx.reply("Произошла ошибка при получении списка напоминаний.");
  }
});

// Обработчик нажатия на кнопку установки часового пояса
bot.callbackQuery("set_my_timezone", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  userStates.set(chatId, "awaiting_timezone");
  await ctx.reply(
    "Пожалуйста, введите ваш часовой пояс в часах (например: 3 для МСК, -5 для EST):"
  );
  await ctx.answerCallbackQuery();
});

// Обработчик текстовых сообщений
bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id;
  const userState = userStates.get(chatId);

  // Обработка установки часового пояса
  if (userState === "awaiting_timezone") {
    const timezoneText = ctx.message.text;
    const timezone = parseInt(timezoneText);

    if (isNaN(timezone)) {
      await ctx.reply(
        "Пожалуйста, введите корректное числовое значение часового пояса."
      );
      return;
    }

    if (timezone < -12 || timezone > 14) {
      await ctx.reply(
        "Часовой пояс должен быть в диапазоне от -12 до +14 часов."
      );
      return;
    }

    try {
      await db.setUserTimezone(chatId, timezone);
      await ctx.reply(
        `Ваш часовой пояс успешно установлен: ${
          timezone > 0 ? "+" : ""
        }${timezone}:00`
      );
      userStates.delete(chatId);
    } catch (error) {
      console.error("Ошибка при установке часового пояса:", error);
      await ctx.reply(
        "Произошла ошибка при установке часового пояса. Попробуйте позже."
      );
    }
  } else {
    // Обработка нового сообщения как потенциального напоминания
    try {
      const timezone = await db.getUserTimezone(chatId);

      if (timezone === null) {
        const keyboard = new InlineKeyboard().text(
          "Установить часовой пояс",
          "set_my_timezone"
        );
        await ctx.reply(
          "Для создания напоминания необходимо установить часовой пояс:",
          { reply_markup: keyboard }
        );
        return;
      }

      // Сохраняем сообщение и начинаем процесс создания напоминания
      reminderStates.set(chatId, { messageText: ctx.message.text });

      const keyboard = new InlineKeyboard()
        .text("Завтра в 9:00", "reminder_tomorrow")
        .text("В понедельник в 9:00", "reminder_monday")
        .row()
        .text("Выбрать другую дату", "reminder_custom");

      await ctx.reply("Выберите время для напоминания:", {
        reply_markup: keyboard,
      });
    } catch (error) {
      console.error("Ошибка при проверке часового пояса:", error);
      await ctx.reply("Произошла ошибка. Попробуйте позже.");
    }
  }
});

// Обработчики выбора даты и времени
bot.callbackQuery(/^reminder_(tomorrow|monday|custom)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  const messageId = ctx.callbackQuery.message?.message_id;
  const match = ctx.match;
  if (!chatId || !messageId || !match) return;

  const action = match[1];
  const state = reminderStates.get(chatId);

  if (!state) {
    await ctx.answerCallbackQuery("Произошла ошибка. Начните сначала.");
    return;
  }

  if (action === "tomorrow") {
    state.selectedDate = getNextDayAt9AM();
    state.selectedDate.setHours(9);
    await saveReminder(chatId, state, ctx.api, messageId);
    return;
  } else if (action === "monday") {
    state.selectedDate = getNextMondayAt9AM();
    state.selectedDate.setHours(9);
    await saveReminder(chatId, state, ctx.api, messageId);
  } else if (action === "custom") {
    const days = getDaysForTwoWeeks();
    const keyboard = new InlineKeyboard();

    days.forEach((day, index) => {
      keyboard.text(day.label, `reminder_date_${index}`);
      if ((index + 1) % 3 === 0) keyboard.row();
    });

    await ctx.api.editMessageText(chatId, messageId, "Выберите дату:", {
      reply_markup: keyboard,
    });
  }

  await ctx.answerCallbackQuery();
});

bot.callbackQuery(/^reminder_date_(\d+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  const messageId = ctx.callbackQuery.message?.message_id;
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
});

bot.callbackQuery(/^time_hour_(\d+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  const messageId = ctx.callbackQuery.message?.message_id;
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
});

bot.callbackQuery(/^time_min_(\d+)$/, async (ctx) => {
  const chatId = ctx.chat?.id;
  const messageId = ctx.callbackQuery.message?.message_id;
  const match = ctx.match;
  if (!chatId || !messageId || !match) return;

  const minutes = parseInt(match[1] ?? "0");
  const state = reminderStates.get(chatId);

  if (state && state.selectedDate) {
    state.selectedDate.setMinutes(minutes);

    try {
      await saveReminder(chatId, state, ctx.api, messageId);
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
});

bot.start();
