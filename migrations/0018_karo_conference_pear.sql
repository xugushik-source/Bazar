-- Owner 21.10: Conference pears stay at the 20% price (only the premium chain sells them). Generated from src/karo.mjs (karoUndoSql).
UPDATE products SET price=960,version=version+1 WHERE id='akhalkalaki--pear_loose' AND vendor_id='akhalkalaki-karo' AND cost=800 AND price=1040;
