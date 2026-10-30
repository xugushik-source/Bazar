// Owner 30.10: «Это были тестовые заказы … всё нужно обнулить» → «Удалить вообще все». A one-time wipe before the real start:
// every order with everything hanging off it (lines, events, payments, settlements, courier cash, supplier statements and
// payments, referral rewards, Telegram jobs/buttons), slot and stock reservations freed, test sales put back on stock.
// Catalogue, prices, suppliers, users, bot links and the owner's expenses stay.
export function resetOrdersSql(){return [
 'UPDATE products SET reserved=0 WHERE reserved>0;',
 "UPDATE products SET stock=stock+(SELECT -SUM(delta) FROM inventory i WHERE i.product_id=products.id AND i.reason='SALE') WHERE EXISTS(SELECT 1 FROM inventory i WHERE i.product_id=products.id AND i.reason='SALE');",
 "DELETE FROM inventory WHERE reason='SALE';",
 'UPDATE slots SET reserved=0 WHERE reserved>0;',
 'DELETE FROM tg_jobs;','DELETE FROM tg_buttons WHERE order_id IS NOT NULL;','DELETE FROM tg_dialogs;',
 'DELETE FROM referral_ledger;','DELETE FROM courier_cash;','DELETE FROM courier_remittances;',
 'DELETE FROM vendor_statement_lines;','DELETE FROM vendor_statements;','DELETE FROM vendor_payments;',
 'DELETE FROM order_photos;','DELETE FROM settlements;','DELETE FROM payments;','DELETE FROM outbox;','DELETE FROM events;',
 'DELETE FROM order_lines;','DELETE FROM order_groups;','DELETE FROM orders;']}
