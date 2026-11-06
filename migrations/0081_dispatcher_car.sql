-- Owner 06.11: a dispatcher (Арпик, later a taxi firm) names the courier and the car for each order; a self-registered
-- courier's car number is kept on his profile. The supplier hands the bags only to that person.
ALTER TABLE users ADD COLUMN dispatcher INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN car TEXT;
ALTER TABLE orders ADD COLUMN courier_name TEXT;
ALTER TABLE orders ADD COLUMN courier_car TEXT;
