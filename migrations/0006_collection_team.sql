-- Collection team: a collector assembles and weighs, a separate controller checks, the customer confirms the checked result.
-- City-scoped roles live outside memberships (its CHECK cannot be altered in place). Existing orders and their data are not changed.
CREATE TABLE team_roles(user_id TEXT NOT NULL REFERENCES users(id),city_id TEXT NOT NULL REFERENCES cities(id),role TEXT NOT NULL CHECK(role IN('COLLECTOR','CONTROLLER')),created_by TEXT NOT NULL,created_at TEXT NOT NULL,PRIMARY KEY(user_id,city_id));
CREATE TABLE team_invites(hash TEXT PRIMARY KEY,city_id TEXT NOT NULL REFERENCES cities(id),role TEXT NOT NULL CHECK(role IN('COLLECTOR','CONTROLLER')),created_by TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0,used_by TEXT);
-- PENDING: not looked at yet; FOUND: the collector has it (weighing implies FOUND); MISSING: needs a replacement/removal agreed by the customer.
ALTER TABLE order_lines ADD COLUMN availability TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE orders ADD COLUMN collected_by TEXT;
ALTER TABLE orders ADD COLUMN collected_at TEXT;
ALTER TABLE orders ADD COLUMN checked_by TEXT;
ALTER TABLE orders ADD COLUMN checked_at TEXT;
ALTER TABLE orders ADD COLUMN customer_confirmed_at TEXT;
ALTER TABLE orders ADD COLUMN return_reason TEXT;
ALTER TABLE orders ADD COLUMN collection_round INTEGER NOT NULL DEFAULT 0;
-- Personal chats now also serve the collectors/controllers of the order's city (in addition to the assigned courier).
DROP TRIGGER IF EXISTS tg_order_events;
CREATE TRIGGER tg_order_events AFTER INSERT ON events BEGIN
 INSERT INTO tg_jobs(link_id,order_id) SELECT l.id,NEW.order_id FROM tg_links l JOIN orders o ON o.id=NEW.order_id WHERE l.active=1 AND (l.kind='OWNER' OR (l.kind='DRIVER' AND l.city_id=o.city_id AND o.fulfillment='delivery') OR (l.kind='SUPPLIER' AND EXISTS(SELECT 1 FROM order_groups g WHERE g.order_id=o.id AND g.vendor_id=l.ref_id)) OR (l.kind='CUSTOMER' AND l.ref_id=o.id) OR (l.kind='PERSONAL' AND (l.ref_id=o.driver_id OR EXISTS(SELECT 1 FROM team_roles t JOIN users u ON u.id=t.user_id AND u.active=1 WHERE t.user_id=l.ref_id AND t.city_id=o.city_id))))
 ON CONFLICT(link_id,order_id) DO UPDATE SET revision=revision+1,next_at=0;
END;
