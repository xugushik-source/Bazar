-- Owner 31.10: the demo supplier «Сад Базара» (twin of the fake «Ферма Базара») is switched off with its goods. Generated from src/closed.mjs (removeGardenSql).
UPDATE vendors SET active=0 WHERE id IN ('akhalkalaki-garden','tbilisi-garden') AND active=1;
