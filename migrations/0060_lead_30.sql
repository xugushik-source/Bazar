-- Owner 30.10: «от 30 минут до часа». The nearest delivery slot is at least this many minutes after the order; slots are every
-- half hour, so the buyer gets the goods 30 to 60 minutes after ordering. Was a fixed hour in code.
ALTER TABLE cities ADD COLUMN min_lead_minutes INTEGER NOT NULL DEFAULT 30;
