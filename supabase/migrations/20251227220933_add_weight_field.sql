-- Add weight field to transactions table for products sold by weight (like deli meats, cheese, bread, etc.)
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS peso_gramos numeric;

-- Add check constraint for peso_gramos >= 0
ALTER TABLE transacciones ADD CONSTRAINT check_peso_gramos_non_negative CHECK (peso_gramos >= 0 OR peso_gramos IS NULL);