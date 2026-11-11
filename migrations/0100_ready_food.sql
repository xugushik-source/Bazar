INSERT INTO categories(id,names,sort) VALUES('rf_pizza','{"ru":"Готовая еда: пицца","hy":"Պատրաստի սնունդ՝ պիցցա","ka":"მზა საჭმელი: პიცა"}',80) ON CONFLICT(id) DO NOTHING;
INSERT INTO categories(id,names,sort) VALUES('rf_first','{"ru":"Готовая еда: первые блюда","hy":"Պատրաստի սնունդ՝ առաջին ճաշատեսակներ","ka":"მზა საჭმელი: პირველი კერძები"}',81) ON CONFLICT(id) DO NOTHING;
INSERT INTO categories(id,names,sort) VALUES('rf_second','{"ru":"Готовая еда: вторые блюда","hy":"Պատրաստի սնունդ՝ երկրորդ ճաշատեսակներ","ka":"მზა საჭმელი: მეორე კერძები"}',82) ON CONFLICT(id) DO NOTHING;
INSERT INTO categories(id,names,sort) VALUES('rf_salads','{"ru":"Готовая еда: салаты и закуски","hy":"Պատրաստի սնունդ՝ աղցաններ և նախուտեստներ","ka":"მზა საჭმელი: სალათები და საუზმეულები"}',83) ON CONFLICT(id) DO NOTHING;
INSERT INTO categories(id,names,sort) VALUES('rf_sides','{"ru":"Готовая еда: гарниры","hy":"Պատրաստի սնունդ՝ կողքի ուտեստներ","ka":"მზა საჭმელი: გარნირები"}',84) ON CONFLICT(id) DO NOTHING;
