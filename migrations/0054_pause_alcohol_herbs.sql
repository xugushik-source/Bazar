-- Owner 29.10: «Алкоголь 18+» and herbs closed until the owner says to reopen; what was on sale is kept in paused_products. Generated from src/closed.mjs (pauseSql).
CREATE TABLE IF NOT EXISTS paused_products(id TEXT PRIMARY KEY,category TEXT NOT NULL,paused_at TEXT NOT NULL);
INSERT INTO paused_products(id,category,paused_at) SELECT id,category,'2026-10-29T00:00:00Z' FROM products WHERE category IN ('alcohol','herbs') AND active=1 ON CONFLICT(id) DO NOTHING;
UPDATE products SET active=0,version=version+1 WHERE category IN ('alcohol','herbs') AND active=1;
UPDATE categories SET active=0 WHERE id IN ('alcohol','herbs') AND active=1 AND EXISTS(SELECT 1 FROM paused_products x WHERE x.category=categories.id);
