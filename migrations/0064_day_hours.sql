-- Owner 30.10: «закрывай в 18:00 эти 2 дня». A day's own last delivery time for a city (src/commerce.mjs, dayClose).
CREATE TABLE IF NOT EXISTS day_hours(city_id TEXT NOT NULL,day TEXT NOT NULL,close_minute INTEGER NOT NULL,PRIMARY KEY(city_id,day));
INSERT INTO day_hours(city_id,day,close_minute) VALUES('akhalkalaki','2026-10-30',1080),('akhalkalaki','2026-10-31',1080) ON CONFLICT(city_id,day) DO UPDATE SET close_minute=excluded.close_minute;
