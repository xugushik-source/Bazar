-- Owner 19.10: Akhalkalaki delivery is 4 GEL below 50 GEL of goods and free from 50 GEL. Other cities keep a flat fee.
-- The fee is decided at checkout from the estimated goods total and stays with the order.
ALTER TABLE cities ADD COLUMN free_delivery_from INTEGER;
UPDATE cities SET delivery_fee=400,free_delivery_from=5000 WHERE id='akhalkalaki';
