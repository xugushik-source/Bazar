-- Owner 18.10: Karo dark speckled beans = «Фасоль красная». Move red_beans to Karo (cost 7, price 9.10), retire the duplicate product.
-- Generated from src/karo.mjs (karoFixSql). Idempotent; orders keep their own snapshots.
UPDATE products SET vendor_id='akhalkalaki-karo',price=910,cost=700,version=version+1 WHERE id='akhalkalaki--red_beans' AND vendor_id IN('akhalkalaki-garden','akhalkalaki-farm') AND EXISTS(SELECT 1 FROM vendors WHERE id='akhalkalaki-karo');
UPDATE products SET active=0,version=version+1 WHERE id='akhalkalaki--beans_speckled_dark' AND active=1;
