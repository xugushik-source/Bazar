-- Owner 22.10: pork spleen is no longer sold. Generated from src/amo.mjs (amoRemovedSql).
UPDATE products SET active=0,version=version+1 WHERE id='akhalkalaki--pork_spleen' AND active=1;
