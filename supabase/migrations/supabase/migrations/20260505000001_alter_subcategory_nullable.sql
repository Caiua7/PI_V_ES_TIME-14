-- Permite subcategory nula em pricing_history
-- Alguns produtos do Excel não possuem subcategoria definida
ALTER TABLE pricing_history ALTER COLUMN subcategory DROP NOT NULL;