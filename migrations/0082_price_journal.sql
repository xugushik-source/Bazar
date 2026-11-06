-- Owner 06.11: a daily record of every product's cost, price and availability and how it was confirmed, append-only, so
-- «13-го был такой товар по такой цене» can always be shown. Price changes are recorded as they happen.
CREATE TABLE IF NOT EXISTS price_journal(id TEXT PRIMARY KEY,day TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN('DAY','PRICE')),vendor_id TEXT NOT NULL,product_id TEXT NOT NULL,cost INTEGER,price INTEGER NOT NULL,available INTEGER NOT NULL,how TEXT NOT NULL,at TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS price_journal_day ON price_journal(day,product_id) WHERE kind='DAY';
CREATE INDEX IF NOT EXISTS price_journal_by_day ON price_journal(day);
ALTER TABLE supplier_checks ADD COLUMN answered_at TEXT;
