-- Owner 22.10: couriers join from the courier group (the owner accepts them in the bot) and answer a morning roll call.
CREATE TABLE IF NOT EXISTS tg_joins(telegram_user TEXT PRIMARY KEY,name TEXT NOT NULL,username TEXT,link_id TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'PENDING' CHECK(state IN('PENDING','ACCEPTED','REJECTED')),user_id TEXT,at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tg_polls(day TEXT NOT NULL,link_id TEXT NOT NULL,message_id INTEGER NOT NULL,PRIMARY KEY(day,link_id));
