-- Owner 29.10: suppliers answer in the bot every morning. «Нет сегодня» closes a product for that day only; a new cost is a
-- request the owner approves, and the retail price is then set by src/price-rules.mjs.
CREATE TABLE IF NOT EXISTS day_closures(product_id TEXT NOT NULL REFERENCES products(id),day TEXT NOT NULL,vendor_id TEXT NOT NULL,closed_by TEXT NOT NULL,at TEXT NOT NULL,PRIMARY KEY(product_id,day));
CREATE TABLE IF NOT EXISTS price_requests(id TEXT PRIMARY KEY,product_id TEXT NOT NULL REFERENCES products(id),vendor_id TEXT NOT NULL,product_version INTEGER NOT NULL,old_cost INTEGER,new_cost INTEGER NOT NULL CHECK(new_cost>0),old_price INTEGER NOT NULL,new_price INTEGER,rule TEXT NOT NULL,final_price INTEGER,state TEXT NOT NULL DEFAULT 'PROPOSED' CHECK(state IN('PROPOSED','APPROVED','REJECTED','STALE')),requested_by TEXT NOT NULL,requested_at TEXT NOT NULL,decided_by TEXT,decided_at TEXT);
CREATE INDEX IF NOT EXISTS price_requests_open ON price_requests(product_id,state);
CREATE TABLE IF NOT EXISTS supplier_checks(link_id TEXT NOT NULL,day TEXT NOT NULL,message_id INTEGER,answered_by TEXT,PRIMARY KEY(link_id,day));
