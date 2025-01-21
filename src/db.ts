import type { Database } from "sqlite3";
import * as sqlite3 from "sqlite3";

type Reminder = {
  id?: number;
  chat_id: number;
  message: string;
  remind_at: Date;
  created_at?: Date;
  is_completed?: boolean;
};

class DatabaseManager {
  private db: Database;

  constructor() {
    this.db = new sqlite3.Database("pml_v2.db", (err: Error | null) => {
      if (err) {
        console.error("Error opening database:", err);
      } else {
        console.log("Database pml_v2 connected successfully");
        this.initializeDatabase();
      }
    });
  }

  private initializeDatabase(): void {
    this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                chat_id INTEGER PRIMARY KEY,
                timezone INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        remind_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_completed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (chat_id) REFERENCES users (chat_id)
      )
    `);
  }

  async setUserTimezone(chatId: number, timezone: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT OR REPLACE INTO users (chat_id, timezone) VALUES (?, ?)",
        [chatId, timezone],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getUserTimezone(chatId: number): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT timezone FROM users WHERE chat_id = ?",
        [chatId],
        (err, row: { timezone: number } | undefined) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.timezone : null);
          }
        }
      );
    });
  }

  async createReminder(reminder: Reminder): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO reminders (chat_id, message, remind_at) 
         VALUES (?, ?, datetime(?))`,
        [reminder.chat_id, reminder.message, reminder.remind_at.toISOString()],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  async getPendingReminders(beforeDate: Date): Promise<Reminder[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, chat_id, message, remind_at, created_at, is_completed 
         FROM reminders 
         WHERE is_completed = FALSE 
         AND datetime(remind_at) <= datetime(?)
         ORDER BY remind_at`,
        [beforeDate.toISOString()],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(
              rows.map((row) => ({
                ...row,
                remind_at: new Date(row.remind_at),
                created_at: new Date(row.created_at),
              }))
            );
          }
        }
      );
    });
  }

  async markReminderAsCompleted(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE reminders SET is_completed = TRUE WHERE id = ?",
        [id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getUserReminders(chatId: number): Promise<Reminder[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, chat_id, message, remind_at, created_at, is_completed 
         FROM reminders 
         WHERE chat_id = ? AND is_completed = FALSE
         ORDER BY remind_at`,
        [chatId],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(
              rows.map((row) => ({
                ...row,
                remind_at: new Date(row.remind_at),
                created_at: new Date(row.created_at),
              }))
            );
          }
        }
      );
    });
  }
}

export const db = new DatabaseManager();
