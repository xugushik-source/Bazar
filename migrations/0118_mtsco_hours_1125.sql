-- Owner 25.11: Мццо is a market supplier: 09:00–18:00.
UPDATE vendors SET open_minute=540,close_minute=1080 WHERE id='akhalkalaki-mtsco' AND (open_minute IS NOT 540 OR close_minute IS NOT 1080);
