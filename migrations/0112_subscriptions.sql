-- «БАЗАР — Забота о близких»: регулярные программы доставки.
-- Additive only: no existing table is changed or dropped. Money: integer tetri. Weight: integer grams.
-- A delivery becomes a normal order through createOrder(); this schema only plans, funds and records it.

CREATE TABLE IF NOT EXISTS subscription_programs(
  id TEXT PRIMARY KEY,
  city_id TEXT NOT NULL REFERENCES cities(id),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','PAUSED','CANCELLED')),
  payer_name TEXT NOT NULL,
  payer_phone TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  zone TEXT NOT NULL DEFAULT '',
  minute INTEGER NOT NULL DEFAULT 600 CHECK(minute>=540 AND minute<1440 AND minute%10=0),
  schedule TEXT NOT NULL,
  items TEXT NOT NULL,
  max_delivery_minor INTEGER NOT NULL CHECK(max_delivery_minor>0),
  consent_version TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  consent_by TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK(consent_by IN ('CUSTOMER','OPERATOR')),
  consent_note TEXT,
  key_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  cancel_reason TEXT,
  planned_on TEXT,                     -- день (по городу), на который план уже достроен; нужен, чтобы не писать план каждые 2 минуты
  version INTEGER NOT NULL DEFAULT 0 CHECK(version>=0)
);

-- One planned delivery per program per calendar day (UNIQUE): a second planner run cannot plan the same day twice.
CREATE TABLE IF NOT EXISTS subscription_deliveries(
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES subscription_programs(id),
  day TEXT NOT NULL,
  minute INTEGER NOT NULL CHECK(minute>=540 AND minute<1440),
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK(status IN (
    'PLANNED','CLAIMED','ORDERED','SKIPPED','CANCELLED','FAILED',
    'WAITING_FUNDS','WAITING_APPROVAL','WAITING_STOCK','WAITING_SLOT','WAITING_CHANGE')),
  allocated_minor INTEGER NOT NULL DEFAULT 0 CHECK(allocated_minor>=0),
  quoted_total_minor INTEGER CHECK(quoted_total_minor IS NULL OR quoted_total_minor>0),
  approved_max_minor INTEGER CHECK(approved_max_minor IS NULL OR approved_max_minor>0),
  order_id TEXT UNIQUE REFERENCES orders(id),
  reason TEXT,
  claimed_at TEXT,
  updated_at TEXT,
  version INTEGER NOT NULL DEFAULT 0,
  UNIQUE(program_id, day)
);
CREATE INDEX IF NOT EXISTS subscription_deliveries_due ON subscription_deliveries(status, day);

-- Money of a programme. PAYMENT/REFUND rows move only when the operator confirms them (no automatic gateway).
CREATE TABLE IF NOT EXISTS subscription_funds(
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES subscription_programs(id),
  kind TEXT NOT NULL CHECK(kind IN ('PAYMENT','REFUND')),
  amount_minor INTEGER NOT NULL CHECK(amount_minor>0),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','CONFIRMED','REJECTED')),
  reference TEXT NOT NULL,
  requested_at TEXT NOT NULL,
  confirmed_at TEXT,
  confirmed_by TEXT,
  command TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS subscription_events(
  id TEXT PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES subscription_programs(id),
  at TEXT NOT NULL,
  actor TEXT NOT NULL,
  event TEXT NOT NULL,
  data TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS subscription_events_program ON subscription_events(program_id, at);
