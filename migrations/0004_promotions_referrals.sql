CREATE TABLE promotions(id TEXT PRIMARY KEY,city_id TEXT NOT NULL REFERENCES cities(id),names TEXT NOT NULL,terms TEXT NOT NULL,kind TEXT NOT NULL CHECK(kind IN('SALE','EVENING')),percent INTEGER NOT NULL CHECK(percent BETWEEN 1 AND 90),starts_at TEXT NOT NULL,ends_at TEXT NOT NULL,start_minute INTEGER NOT NULL DEFAULT 0 CHECK(start_minute BETWEEN 0 AND 1439),end_minute INTEGER NOT NULL DEFAULT 1440 CHECK(end_minute BETWEEN 1 AND 1440),active INTEGER NOT NULL DEFAULT 0,version INTEGER NOT NULL DEFAULT 0,actor TEXT NOT NULL,at TEXT NOT NULL,CHECK(starts_at<ends_at),CHECK(start_minute<end_minute));
CREATE TABLE promotion_products(promotion_id TEXT NOT NULL REFERENCES promotions(id),product_id TEXT NOT NULL REFERENCES products(id),PRIMARY KEY(promotion_id,product_id));
CREATE TABLE operations_audit(id TEXT PRIMARY KEY,at TEXT NOT NULL,actor TEXT NOT NULL,event TEXT NOT NULL,data TEXT NOT NULL);
CREATE TABLE referral_campaign(id TEXT PRIMARY KEY CHECK(id='main'),enabled INTEGER NOT NULL DEFAULT 0,reward_percent INTEGER NOT NULL DEFAULT 0 CHECK(reward_percent BETWEEN 0 AND 50),until_at TEXT,points_days INTEGER NOT NULL DEFAULT 60 CHECK(points_days BETWEEN 1 AND 365),version INTEGER NOT NULL DEFAULT 0);
INSERT INTO referral_campaign(id) VALUES('main');
CREATE TABLE referral_customers(id TEXT PRIMARY KEY,phone_hash TEXT NOT NULL UNIQUE,code TEXT NOT NULL UNIQUE,referred_by TEXT REFERENCES referral_customers(id),created_at TEXT NOT NULL,wallet_version INTEGER NOT NULL DEFAULT 0);
ALTER TABLE orders ADD COLUMN referral_customer TEXT REFERENCES referral_customers(id);
ALTER TABLE orders ADD COLUMN referral_percent INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN referral_days INTEGER NOT NULL DEFAULT 60;
ALTER TABLE orders ADD COLUMN referral_deadline TEXT;
CREATE TABLE referral_ledger(id TEXT PRIMARY KEY,customer_id TEXT NOT NULL REFERENCES referral_customers(id),friend_id TEXT REFERENCES referral_customers(id),order_id TEXT NOT NULL REFERENCES orders(id),amount INTEGER NOT NULL,kind TEXT NOT NULL CHECK(kind IN('REWARD','REVERSAL','REDEEM')),at TEXT NOT NULL,expires_at TEXT,actor TEXT NOT NULL,reason TEXT NOT NULL DEFAULT '',UNIQUE(order_id,kind));
CREATE UNIQUE INDEX one_reward_per_friend ON referral_ledger(friend_id) WHERE kind='REWARD';
-- Reward only when delivered AND separately paid. A cancelled first order does not consume the friend reward.
CREATE TRIGGER referral_paid_delivery AFTER UPDATE OF status,payment ON orders WHEN NEW.status='COMPLETED' AND NEW.payment='PAID' AND NEW.referral_percent>0 AND (NEW.referral_deadline IS NULL OR NEW.created_at<=NEW.referral_deadline) BEGIN
 INSERT OR IGNORE INTO referral_ledger(id,customer_id,friend_id,order_id,amount,kind,at,expires_at,actor)
 SELECT lower(hex(randomblob(16))),c.referred_by,c.id,NEW.id,(NEW.items_total*NEW.referral_percent+50)/100,'REWARD',strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now','+'||NEW.referral_days||' days'),'SYSTEM' FROM referral_customers c WHERE c.id=NEW.referral_customer AND c.referred_by IS NOT NULL AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.referral_customer=c.id AND o.id<>NEW.id AND o.status='COMPLETED' AND o.payment='PAID');
END;
CREATE TRIGGER referral_cancel AFTER UPDATE OF status ON orders WHEN NEW.status='CANCELLED' BEGIN
 INSERT OR IGNORE INTO referral_ledger(id,customer_id,friend_id,order_id,amount,kind,at,actor) SELECT lower(hex(randomblob(16))),customer_id,friend_id,order_id,-amount,'REVERSAL',strftime('%Y-%m-%dT%H:%M:%fZ','now'),'SYSTEM' FROM referral_ledger WHERE order_id=NEW.id AND kind='REWARD';
END;

CREATE INDEX orders_phone_normalized ON orders(replace(replace(replace(replace(replace(json_extract(customer,'$.phone'),'+',''),' ',''),'(',''),')',''),'-',''));

CREATE TRIGGER referral_wallet_version AFTER INSERT ON referral_ledger BEGIN
 UPDATE referral_customers SET wallet_version=wallet_version+1 WHERE id=NEW.customer_id;
END;
