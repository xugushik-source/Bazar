-- Owner 24.10: «Помидоры, второй сорт» retired; tomatoes are light, dark and Azerbaijani. Generated from src/karo-varieties.mjs (karoRetire2Sql).
UPDATE products SET active=0,version=version+1 WHERE id='akhalkalaki--tomato_second_loose' AND active=1;
