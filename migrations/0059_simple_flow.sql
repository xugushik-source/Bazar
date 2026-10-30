-- Owner 30.10: «упрости до максимума». At the suppliers the one who collects also checks, so by default an order goes to them at once
-- and their «Готово» hands it to the courier; a weight outside the agreed range still waits for approval. 0 restores the full flow.
ALTER TABLE cities ADD COLUMN simple_flow INTEGER NOT NULL DEFAULT 1;
-- One reminder per stop of an order (src/stuck-orders.mjs).
CREATE TABLE IF NOT EXISTS stuck_alerts(order_id TEXT PRIMARY KEY,version INTEGER NOT NULL,at TEXT NOT NULL);
