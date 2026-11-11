UPDATE vendors SET open_minute=540,close_minute=1200 WHERE id='akhalkalaki-vypechka' AND (open_minute IS NOT 540 OR close_minute IS NOT 1200);
UPDATE products SET profile='{"mode":"EACH","policy_version":1,"prep_minutes":25}',version=version+1 WHERE id='akhalkalaki--rf_pizza_01' AND profile<>'{"mode":"EACH","policy_version":1,"prep_minutes":25}';
UPDATE products SET profile='{"mode":"EACH","policy_version":1,"prep_minutes":25}',version=version+1 WHERE id='akhalkalaki--rf_pizza_02' AND profile<>'{"mode":"EACH","policy_version":1,"prep_minutes":25}';
UPDATE products SET profile='{"mode":"EACH","policy_version":1,"prep_minutes":25}',version=version+1 WHERE id='akhalkalaki--rf_pizza_03' AND profile<>'{"mode":"EACH","policy_version":1,"prep_minutes":25}';
UPDATE products SET profile='{"mode":"EACH","policy_version":1,"prep_minutes":20}',version=version+1 WHERE id='akhalkalaki--rf_pizza_05' AND profile<>'{"mode":"EACH","policy_version":1,"prep_minutes":20}';
