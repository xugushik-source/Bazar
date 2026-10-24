-- Owner photo audit 19.10: each product gets its own matching photo. Generated from src/photo-fixes.mjs (photoFixSql). Idempotent; only products still carrying the old shared picture change.
UPDATE products SET art='pear-conference',version=version+1 WHERE id='akhalkalaki--pear_loose' AND art='pear';
UPDATE products SET art='pear-yellow',version=version+1 WHERE id='akhalkalaki--pear_yellow_loose' AND art='pear';
UPDATE products SET art='pear-brown',version=version+1 WHERE id='akhalkalaki--pear_brown_loose' AND art='pear';
UPDATE products SET art='dill',version=version+1 WHERE id='akhalkalaki--dill_bunch' AND art='herbs';
UPDATE products SET art='dill',version=version+1 WHERE id='tbilisi--dill_bunch' AND art='herbs';
UPDATE products SET art='peanut-blanched',version=version+1 WHERE id='akhalkalaki--peanut_blanched' AND art='peanut';
UPDATE products SET art='pistachio-shell',version=version+1 WHERE id='akhalkalaki--pistachio_shell' AND art='pistachio';
UPDATE products SET art='cucumber-long',version=version+1 WHERE id='akhalkalaki--cucumber_long_loose' AND art='cucumber';
UPDATE products SET art='tomato-crate',version=version+1 WHERE id='akhalkalaki--tomato_second_loose' AND art='tomato';
UPDATE products SET art='raisins-golden',version=version+1 WHERE id='akhalkalaki--raisins_dried' AND art='raisins';
UPDATE products SET art='churchkhela-color',version=version+1 WHERE id='akhalkalaki--churchkhela_color_each' AND art='churchkhela';
UPDATE products SET art='pickled-tomatoes',version=version+1 WHERE id='akhalkalaki--tomato_pickled_jar' AND art='pickles';
UPDATE products SET art='pickled-cauliflower',version=version+1 WHERE id='akhalkalaki--cauliflower_pickled_jar' AND art='pickles';
UPDATE products SET art='okra',version=version+1 WHERE id='akhalkalaki--okra_pickled_jar' AND art='pickles';
UPDATE products SET art='minicorn',version=version+1 WHERE id='akhalkalaki--minicorn_nostimo_330g' AND art='pickles';
