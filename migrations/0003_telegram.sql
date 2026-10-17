-- D1 only: Telegram identities are separate from group membership and browser sessions.
CREATE TABLE tg_links(id TEXT PRIMARY KEY,kind TEXT NOT NULL CHECK(kind IN('OWNER','DRIVER','SUPPLIER','CUSTOMER','PERSONAL')),ref_id TEXT NOT NULL,city_id TEXT,chat_id TEXT NOT NULL,telegram_user TEXT,title TEXT NOT NULL,lang TEXT NOT NULL DEFAULT 'ru',active INTEGER NOT NULL DEFAULT 1,last_ok TEXT,last_error TEXT,created_at TEXT NOT NULL,UNIQUE(chat_id));
CREATE TABLE tg_identities(telegram_user TEXT PRIMARY KEY,user_id TEXT NOT NULL UNIQUE REFERENCES users(id),chat_id TEXT NOT NULL,linked_at TEXT NOT NULL);
CREATE TABLE tg_invites(hash TEXT PRIMARY KEY,kind TEXT NOT NULL,ref_id TEXT NOT NULL,city_id TEXT,lang TEXT NOT NULL,created_by TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
CREATE TABLE tg_updates(id INTEGER PRIMARY KEY,status TEXT NOT NULL DEFAULT 'PENDING',lease_until INTEGER NOT NULL DEFAULT 0,expires INTEGER NOT NULL);
CREATE TABLE tg_buttons(id TEXT PRIMARY KEY,link_id TEXT NOT NULL REFERENCES tg_links(id),order_id TEXT,version INTEGER,payload TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE tg_dialogs(telegram_user TEXT PRIMARY KEY,link_id TEXT NOT NULL,order_id TEXT NOT NULL,version INTEGER NOT NULL,action TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE tg_jobs(link_id TEXT NOT NULL REFERENCES tg_links(id),order_id TEXT NOT NULL REFERENCES orders(id),revision INTEGER NOT NULL DEFAULT 1,done_revision INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL DEFAULT 0,lease_until INTEGER NOT NULL DEFAULT 0,lease_owner TEXT,ambiguous INTEGER NOT NULL DEFAULT 0,message_id INTEGER,last_hash TEXT,last_error TEXT,PRIMARY KEY(link_id,order_id));
CREATE INDEX tg_jobs_due ON tg_jobs(next_at,lease_until);
CREATE TABLE courier_shifts(user_id TEXT NOT NULL REFERENCES users(id),city_id TEXT NOT NULL REFERENCES cities(id),day TEXT NOT NULL,mode TEXT NOT NULL CHECK(mode IN('DAY','HOURS','OFF')),start_minute INTEGER,end_minute INTEGER,left_at TEXT,answered_at TEXT NOT NULL,PRIMARY KEY(user_id,city_id,day));
CREATE TABLE courier_cash(id TEXT PRIMARY KEY,order_id TEXT NOT NULL REFERENCES orders(id),driver_id TEXT NOT NULL REFERENCES users(id),amount INTEGER NOT NULL CHECK(amount>0),method TEXT NOT NULL CHECK(method IN('cash','transfer')),state TEXT NOT NULL DEFAULT 'REVIEW' CHECK(state IN('REVIEW','CONFIRMED','REJECTED')),at TEXT NOT NULL,reviewed_by TEXT,reviewed_at TEXT,command TEXT NOT NULL UNIQUE);
CREATE TABLE courier_remittances(id TEXT PRIMARY KEY,driver_id TEXT NOT NULL REFERENCES users(id),city_id TEXT NOT NULL REFERENCES cities(id),amount INTEGER NOT NULL CHECK(amount>0),at TEXT NOT NULL,actor TEXT NOT NULL REFERENCES users(id),reason TEXT NOT NULL,command TEXT NOT NULL UNIQUE);
CREATE TRIGGER tg_order_events AFTER INSERT ON events BEGIN
 INSERT INTO tg_jobs(link_id,order_id) SELECT l.id,NEW.order_id FROM tg_links l JOIN orders o ON o.id=NEW.order_id WHERE l.active=1 AND (l.kind='OWNER' OR (l.kind='DRIVER' AND l.city_id=o.city_id AND o.fulfillment='delivery') OR (l.kind='SUPPLIER' AND EXISTS(SELECT 1 FROM order_groups g WHERE g.order_id=o.id AND g.vendor_id=l.ref_id)) OR (l.kind='CUSTOMER' AND l.ref_id=o.id) OR (l.kind='PERSONAL' AND l.ref_id=o.driver_id))
 ON CONFLICT(link_id,order_id) DO UPDATE SET revision=revision+1,next_at=0;
END;

CREATE UNIQUE INDEX courier_one_pending ON courier_cash(order_id) WHERE state='REVIEW';
