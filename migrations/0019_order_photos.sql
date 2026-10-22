-- Owner 22.10: one photo when the collector hands in the order and one when the courier hands it to the buyer; the buyer's
-- transfer screenshot is kept the same way. Telegram photos keep their file_id; photos uploaded on the site keep the image.
CREATE TABLE IF NOT EXISTS order_photos(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),kind TEXT NOT NULL CHECK(kind IN('COLLECTED','HANDOVER','RECEIPT')),file_id TEXT,data TEXT,mime TEXT,by_user TEXT,at TEXT NOT NULL,command TEXT UNIQUE);
CREATE INDEX IF NOT EXISTS order_photos_order ON order_photos(order_id,kind);
