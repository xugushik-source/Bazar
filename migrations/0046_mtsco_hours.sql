-- Owner 24.10: Mtsco works 08:00–18:00. Generated from src/mtsco.mjs (mtscoHoursSql).
UPDATE vendors SET open_minute=480,close_minute=1080 WHERE id='akhalkalaki-mtsco' AND (open_minute IS NOT 480 OR close_minute IS NOT 1080);
