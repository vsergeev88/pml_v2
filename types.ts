export type ReminderState = {
  messageText: string;
  selectedDate?: Date;
  selectedHour?: number;
};

export type UserStates = Map<number, string>;
export type ReminderStates = Map<number, ReminderState>;
