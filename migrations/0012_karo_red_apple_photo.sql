-- Owner 18.10: Akhalkalaki «Яблоки красные» (Karo) get a fully red apple photo. Generated from src/karo.mjs (karoPhotoSql). Idempotent.
UPDATE products SET art='apple-red',version=version+1 WHERE id='akhalkalaki--apple_loose' AND art='apple';
