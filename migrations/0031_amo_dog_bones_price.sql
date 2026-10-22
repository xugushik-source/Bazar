-- Owner 22.10: dog bones sell at 3 ₾/kg (cost 1.80 unchanged). Generated from src/amo.mjs (amoOverrideSql).
UPDATE products SET price=300,version=version+1 WHERE id='akhalkalaki--dog_bones' AND vendor_id='akhalkalaki-amo' AND cost=180 AND price<>300;
