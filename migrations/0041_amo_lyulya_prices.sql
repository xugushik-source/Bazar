-- Owner 24.10: lyulya by the piece — chicken cost 5 ₾ / sale 6 ₾, beef cost 6 ₾ / sale 7 ₾. Generated from src/amo.mjs (amoLyulya24Sql).
UPDATE products SET price=600,cost=500,version=version+1 WHERE id='akhalkalaki--lyulya_chicken_each' AND vendor_id='akhalkalaki-amo' AND (price<>600 OR cost IS NOT 500);
UPDATE products SET price=700,cost=600,version=version+1 WHERE id='akhalkalaki--lyulya_beef_pork_each' AND vendor_id='akhalkalaki-amo' AND (price<>700 OR cost IS NOT 600);
