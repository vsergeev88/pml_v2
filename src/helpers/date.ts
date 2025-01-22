export function getLocaleDate(date: Date, locale: string = "ru-RU"): string {
  return date.toLocaleString(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getNextDayAt9AM(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  return tomorrow;
}

export function getNextMondayAt9AM(): Date {
  const monday = new Date();
  monday.setDate(monday.getDate() + ((8 - monday.getDay()) % 7));
  monday.setHours(9, 0, 0, 0);
  return monday;
}

export function getDaysForTwoWeeks(): { date: Date; label: string }[] {
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
