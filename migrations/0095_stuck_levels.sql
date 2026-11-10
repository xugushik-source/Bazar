-- Owner 10.11: a stuck order first reminds the one who has to press (level 1), then the owner (level 2).
ALTER TABLE stuck_alerts ADD COLUMN level INTEGER NOT NULL DEFAULT 2;
