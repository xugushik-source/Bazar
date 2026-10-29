-- Owner 30.10: «Алкоголь 18+» back on sale (the products paused on 29.10); herbs stay closed. Generated from src/closed.mjs (reopenAlcoholSql).
UPDATE categories SET active=1 WHERE id IN ('alcohol') AND active=0;
UPDATE products SET active=1,version=version+1 WHERE id IN (SELECT id FROM paused_products WHERE category IN ('alcohol')) AND active=0;
DELETE FROM paused_products WHERE category IN ('alcohol');
