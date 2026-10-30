-- Owner 30.10: supplier «Ферма Базара» removed (demo placeholder) with its goods. Generated from src/closed.mjs (removeFarmSql).
UPDATE vendors SET active=0 WHERE id IN ('akhalkalaki-farm','tbilisi-farm') AND active=1;
