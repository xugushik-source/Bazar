-- Owner 13.11: remember which pages of the morning list a supplier opened today, so «Готово» can ask whether everything was checked.
CREATE TABLE IF NOT EXISTS supplier_pages_seen(link_id TEXT NOT NULL,day TEXT NOT NULL,page INTEGER NOT NULL,PRIMARY KEY(link_id,day,page));
