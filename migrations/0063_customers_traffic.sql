-- Owner 30.10: consent to personal data processing (Law of Georgia No. 3144), the customer base and anonymous visit statistics.
ALTER TABLE orders ADD COLUMN consent_version TEXT;
ALTER TABLE orders ADD COLUMN marketing INTEGER NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS marketing_optout(phone_tail TEXT PRIMARY KEY,at TEXT NOT NULL,actor TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS traffic_daily(day TEXT NOT NULL,city_id TEXT NOT NULL,src TEXT NOT NULL,event TEXT NOT NULL,lang TEXT NOT NULL,device TEXT NOT NULL,hits INTEGER NOT NULL DEFAULT 0,uniques INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(day,city_id,src,event,lang,device));
