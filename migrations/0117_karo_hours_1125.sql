-- Owner 25.11: Фруктовый сад (Каро) takes orders 09:00–20:00; last order 20 minutes before closing.
UPDATE vendors SET open_minute=540,close_minute=1200 WHERE id='akhalkalaki-karo' AND (open_minute IS NOT 540 OR close_minute IS NOT 1200);
