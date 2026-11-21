-- Остатков товара больше нет как лимита: доступность на день задаёт поставщик утром (day_closures, «нет сегодня»).
-- Режим хранится в app_config. Без строки действует прежний режим LIMITED (поведение для старых тестов не меняется).
-- Additive: только одна строка настроек.
INSERT INTO app_config(key,value) VALUES('stock-mode','DAILY') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
