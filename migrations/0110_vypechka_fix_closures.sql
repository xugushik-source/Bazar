-- Owner 13.11: the morning list was pressed the other way round. Today «Выпечка с любовью» has no Тарталетка, Капучино and
-- торт «Пламя»; everything else is on sale. Clear its closures and close only these three (until the supplier brings them back).
DELETE FROM day_closures WHERE vendor_id='akhalkalaki-vypechka';
INSERT INTO day_closures(product_id,day,vendor_id,closed_by,at) SELECT id,'9999-12-31',vendor_id,'owner','2026-11-13T05:30:00.000Z' FROM products WHERE vendor_id='akhalkalaki-vypechka' AND id IN ('akhalkalaki--cakes_05','akhalkalaki--cakes_10','akhalkalaki--cakes_14') ON CONFLICT(product_id,day) DO NOTHING;
