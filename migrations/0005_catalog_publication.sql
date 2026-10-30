-- Owner approved current catalogue/prices for publication, 2026-10-17.
-- Rename only untouched initial vendor labels. Preserve custom names, IDs, stock and orders.
UPDATE vendors SET names='{"ru":"Сад Базара","hy":"Բազարի այգի","ka":"ბაზრის ბაღი"}'
WHERE id IN ('akhalkalaki-garden','tbilisi-garden') AND json_extract(names,'$.ru')='Учебный сад';
UPDATE vendors SET names='{"ru":"Ферма Базара","hy":"Բազարի ֆերմա","ka":"ბაზრის ფერმა"}'
WHERE id IN ('akhalkalaki-farm','tbilisi-farm') AND json_extract(names,'$.ru')='Учебная ферма';
