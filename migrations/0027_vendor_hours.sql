-- Owner 22.10: vendor working hours; an order with a vendor's goods is delivered from an hour after opening until closing.
ALTER TABLE vendors ADD COLUMN open_minute INTEGER;
ALTER TABLE vendors ADD COLUMN close_minute INTEGER;
UPDATE vendors SET open_minute=540,close_minute=1080 WHERE id='akhalkalaki-amo' AND (open_minute IS NOT 540 OR close_minute IS NOT 1080);
