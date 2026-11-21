-- Напоминания и диспетчерские списки для программ «Забота о близких» и курьеров.
-- Additive only. Каждая строка — одно сообщение одной аудитории; dedup_key не даёт отправить дубль при повторном запуске.

-- Telegram-чат плательщика программы. Привязку пока делает оператор или будущий поток «привязать Telegram».
CREATE TABLE IF NOT EXISTS subscription_channels(
  program_id TEXT NOT NULL REFERENCES subscription_programs(id),
  kind TEXT NOT NULL DEFAULT 'TELEGRAM' CHECK(kind IN ('TELEGRAM')),
  chat_id TEXT NOT NULL,
  lang TEXT NOT NULL DEFAULT 'ru' CHECK(lang IN ('ru','hy','ka')),
  linked_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY(program_id, kind)
);

CREATE TABLE IF NOT EXISTS subscription_notifications(
  id TEXT PRIMARY KEY,
  dedup_key TEXT NOT NULL UNIQUE,
  audience TEXT NOT NULL CHECK(audience IN ('SUPPLIER','DRIVER_GROUP','DRIVER_PERSONAL')),
  program_id TEXT REFERENCES subscription_programs(id),
  chat_id TEXT,
  lang TEXT NOT NULL DEFAULT 'ru' CHECK(lang IN ('ru','hy','ka')),
  text TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('PENDING','SENT','OPERATOR_TASK','FAILED','AMBIGUOUS')),
  reason TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_at INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  sent_at TEXT
);
CREATE INDEX IF NOT EXISTS subscription_notifications_due ON subscription_notifications(status, next_at);
