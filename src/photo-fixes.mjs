// Owner photo audit 19.10: every product gets a photo of exactly that product (no shared or wrong pictures).
// [product key, cities, new art]. Applied by migration 0014 and by the seed, only while the product still has its old art.
export const photoFixes=[
 ['pear_loose',['akhalkalaki'],'pear','pear-conference'],['pear_yellow_loose',['akhalkalaki'],'pear','pear-yellow'],['pear_brown_loose',['akhalkalaki'],'pear','pear-brown'],
 ['dill_bunch',['akhalkalaki','tbilisi'],'herbs','dill'],['peanut_blanched',['akhalkalaki'],'peanut','peanut-blanched'],['pistachio_shell',['akhalkalaki'],'pistachio','pistachio-shell'],
 ['cucumber_long_loose',['akhalkalaki'],'cucumber','cucumber-long'],['tomato_second_loose',['akhalkalaki'],'tomato','tomato-crate'],['raisins_dried',['akhalkalaki'],'raisins','raisins-golden'],
 ['churchkhela_color_each',['akhalkalaki'],'churchkhela','churchkhela-color'],['tomato_pickled_jar',['akhalkalaki'],'pickles','pickled-tomatoes'],['cauliflower_pickled_jar',['akhalkalaki'],'pickles','pickled-cauliflower'],
 ['okra_pickled_jar',['akhalkalaki'],'pickles','okra'],['minicorn_nostimo_330g',['akhalkalaki'],'pickles','minicorn']
];
export const fixArts=[...new Set(photoFixes.map(f=>f[3]))];
// No free licensed photo of a jar of pickled baby corn was found; the shop shows «фото временно недоступно» rather than a wrong picture.
export const fixArtsWithoutPhoto=['minicorn'];
export const photoFixSql=()=>photoFixes.flatMap(([key,cities,from,to])=>cities.map(c=>`UPDATE products SET art='${to}',version=version+1 WHERE id='${c}--${key}' AND art='${from}';`));
