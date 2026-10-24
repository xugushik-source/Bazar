-- Owner 24.10: the beef-and-pork cutlet sells at 7 ₾ a piece (cost 6 ₾). Generated from src/amo.mjs (amoCutlet24Sql).
UPDATE products SET price=700,cost=600,version=version+1 WHERE id='akhalkalaki--cutlet_beef_pork_each' AND vendor_id='akhalkalaki-amo' AND (price<>700 OR cost IS NOT 600);
