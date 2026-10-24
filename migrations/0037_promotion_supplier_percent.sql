-- Owner 22.10: a promotion records the supplier's own discount separately (it may differ from the buyer's); NULL means the same percent.
ALTER TABLE promotions ADD COLUMN supplier_percent INTEGER CHECK(supplier_percent IS NULL OR supplier_percent BETWEEN 0 AND 90);
