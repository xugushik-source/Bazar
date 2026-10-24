-- Daily settlement with suppliers: only delivered (COMPLETED) orders count, at the cost recorded in each order line.
-- The owner fixes a day, the supplier agrees or disagrees; payments reduce the agreed debt. Nothing existing is changed.
CREATE TABLE vendor_statements(id TEXT PRIMARY KEY,vendor_id TEXT NOT NULL REFERENCES vendors(id),day TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>=0),lines TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'PROPOSED' CHECK(state IN('PROPOSED','AGREED','DISPUTED')),created_by TEXT NOT NULL,created_at TEXT NOT NULL,answered_by TEXT,answered_at TEXT,answer_note TEXT,command TEXT NOT NULL UNIQUE);
CREATE INDEX vendor_statements_vendor ON vendor_statements(vendor_id,day);
-- An order line belongs to at most one open or agreed statement; a disagreement releases its lines.
CREATE TABLE vendor_statement_lines(order_id TEXT NOT NULL,line_id TEXT NOT NULL,statement_id TEXT NOT NULL REFERENCES vendor_statements(id),PRIMARY KEY(order_id,line_id));
-- Payments are never edited; a mistaken one is cancelled by a reversal row (reverses = its id).
CREATE TABLE vendor_payments(id TEXT PRIMARY KEY,vendor_id TEXT NOT NULL REFERENCES vendors(id),amount INTEGER NOT NULL CHECK(amount>0),method TEXT NOT NULL CHECK(method IN('cash','transfer')),at TEXT NOT NULL,actor TEXT NOT NULL,reason TEXT NOT NULL,reverses TEXT UNIQUE REFERENCES vendor_payments(id),command TEXT NOT NULL UNIQUE);
