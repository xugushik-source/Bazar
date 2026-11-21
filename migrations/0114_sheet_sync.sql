-- Копия заказов в Google Таблицы. D1 остаётся основным хранилищем; таблица — резервная копия.
-- Строка на заказ: row_no — номер строки в листе, synced_version — версия заказа, которую записали в таблицу.
-- Additive only.
CREATE TABLE IF NOT EXISTS sheet_sync(
  order_id TEXT PRIMARY KEY REFERENCES orders(id),
  synced_version INTEGER NOT NULL DEFAULT -1,
  row_no INTEGER,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SYNCED','ERROR','NOT_CONFIGURED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  synced_at TEXT
);
CREATE INDEX IF NOT EXISTS sheet_sync_status ON sheet_sync(status);
