-- Owner 28.10: free delivery on a buyer's first order (by phone number), on in every city; the owner can switch it off per city.
ALTER TABLE cities ADD COLUMN first_order_free INTEGER NOT NULL DEFAULT 1;
