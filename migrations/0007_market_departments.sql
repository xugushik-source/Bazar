-- Market departments beyond fruit and vegetables, so owners can connect cheese, bread, meat, trout and other suppliers.
-- Empty departments stay hidden in the shop until a product is added. Existing categories and products are not changed.
INSERT INTO categories(id,names,sort) VALUES
('dairy','{"ru":"Сыр и молочное","hy":"Պանիր և կաթնամթերք","ka":"ყველი და რძის ნაწარმი"}',8),
('eggs','{"ru":"Яйца","hy":"Ձու","ka":"კვერცხი"}',9),
('bread','{"ru":"Хлеб и лаваш","hy":"Հաց և լավաշ","ka":"პური და ლავაში"}',10),
('meat','{"ru":"Мясо и птица","hy":"Միս և թռչնամիս","ka":"ხორცი და ფრინველი"}',11),
('trout','{"ru":"Форель","hy":"Իշխան","ka":"კალმახი"}',12),
('deli','{"ru":"Бастурма, суджух, колбасы","hy":"Բաստուրմա, սուջուխ, երշիկ","ka":"ბასტურმა, სუჯუხი, ძეხვეული"}',13),
('preserves','{"ru":"Соленья и консервация","hy":"Թթուներ և պահածոներ","ka":"მწნილი და კონსერვები"}',14),
('pantry','{"ru":"Мука, масло, бакалея","hy":"Ալյուր, յուղ, նպարեղեն","ka":"ფქვილი, ზეთი, ბაკალეა"}',15),
('drinks','{"ru":"Напитки","hy":"Ըմպելիքներ","ka":"სასმელები"}',16),
('household','{"ru":"Хозтовары","hy":"Տնտեսական ապրանքներ","ka":"სამეურნეო საქონელი"}',17)
ON CONFLICT(id) DO NOTHING;
