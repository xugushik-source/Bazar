-- Owner 24.10: whole pumpkin closed for now (kept; the owner can reopen it in the cabinet). Generated from src/closed.mjs (closedSql).
UPDATE products SET active=0,version=version+1 WHERE id='akhalkalaki--pumpkin_whole_kg' AND active=1;
