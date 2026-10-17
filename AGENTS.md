# БАЗАР
Keep Tzhvzhik, Desert-, MH-tutor- and Pivka reference projects unchanged.
Use feature/bazar-store. Node 24, Worker ESM and a dedicated D1 database.
Money is integer minor currency units; weight is integer net grams. Persist immutable
quote policies. No second database. No real financial actions or messages in tests.
No client roles/prices/payment verification. Unknown costs remain null. Weighted
adjustments inside disclosed bounds do not require new approval; substitutions,
unit-price changes and out-of-bounds changes do. Apply stock/slot/version guards
atomically. Every UI string needs hy/ru/ka parity. No slow intro or hidden content.
Owner confirmed current catalogue/prices for publication on 2026-10-17. Do not invent future merchant data; imported test fixtures remain isolated. Never commit secrets.
Run npm test and npm run build; distinguish SQLite compatibility from hosted D1 tests.

## Постоянное правило владельца: публикация
Сохранять код в GitHub аккаунта xugushik-source. Основная ссылка на сайт должна быть без chatgpt в адресе: GitHub Pages или собственный домен. Не выдавать ссылку на репозиторий за ссылку на работающий магазин. Не считать статический каталог полноценным сервером заказов.
