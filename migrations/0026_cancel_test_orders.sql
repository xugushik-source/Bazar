-- Owner 22.10: cancel the three test orders E3C641, 399B42 and BC6B4C (delivery 23.10 09:00) exactly as «Отменить» does:
-- release reserved stock and the delivery slot, record a CANCEL event (Telegram cards update), mark the order cancelled.
-- Only these suffixes, that day and slot, and only while still open; the real order BZ-C824F817ABDC40 is excluded.
CREATE TABLE IF NOT EXISTS fix_cancel_20261022(id TEXT PRIMARY KEY);
INSERT OR IGNORE INTO fix_cancel_20261022(id) SELECT id FROM orders WHERE substr(id,-6) IN('E3C641','399B42','BC6B4C') AND day='2026-10-23' AND minute=540 AND status NOT IN('PICKED_UP','OUT_FOR_DELIVERY','COMPLETED','CANCELLED') AND id<>'BZ-C824F817ABDC40';
UPDATE products SET reserved=reserved-(SELECT COALESCE(SUM(l.reserved),0) FROM order_lines l WHERE l.product_id=products.id AND l.order_id IN(SELECT id FROM fix_cancel_20261022)) WHERE id IN(SELECT product_id FROM order_lines WHERE order_id IN(SELECT id FROM fix_cancel_20261022));
UPDATE slots SET reserved=reserved-(SELECT COUNT(*) FROM orders o WHERE o.id IN(SELECT id FROM fix_cancel_20261022) AND o.city_id=slots.city_id AND o.day=slots.day AND o.minute=slots.minute) WHERE EXISTS(SELECT 1 FROM orders o WHERE o.id IN(SELECT id FROM fix_cancel_20261022) AND o.city_id=slots.city_id AND o.day=slots.day AND o.minute=slots.minute);
INSERT INTO events(id,order_id,at,actor,event,data) SELECT lower(hex(randomblob(16))),id,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'OWNER_REQUEST','CANCEL','{"reason":"Тестовый заказ — отменён по просьбе владельца 22.10"}' FROM fix_cancel_20261022;
INSERT INTO outbox(id,order_id,at,event) SELECT lower(hex(randomblob(16))),id,strftime('%Y-%m-%dT%H:%M:%fZ','now'),'CANCEL' FROM fix_cancel_20261022;
UPDATE orders SET status='CANCELLED',payment=CASE WHEN paid>0 THEN 'REFUND_REVIEW' ELSE payment END,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),version=version+1 WHERE id IN(SELECT id FROM fix_cancel_20261022);
DROP TABLE fix_cancel_20261022;
