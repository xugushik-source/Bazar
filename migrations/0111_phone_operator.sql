-- Operator drafts have no inventory reservations, payments or notification jobs.
CREATE TABLE phone_drafts (
 id TEXT PRIMARY KEY,
 actor TEXT NOT NULL REFERENCES users(id),
 city_id TEXT NOT NULL REFERENCES cities(id),
 payload TEXT NOT NULL,
 version INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL
);
CREATE INDEX phone_drafts_actor ON phone_drafts(actor,city_id,updated_at);
