-- Owner 28.10: where orders come from. A short channel code from the storefront link (…/?src=instagram); NULL = direct.
ALTER TABLE orders ADD COLUMN source TEXT;
