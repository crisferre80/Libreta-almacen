-- Add quantity and unit price fields to transactions table
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS cantidad numeric DEFAULT 1;
ALTER TABLE transacciones ADD COLUMN IF NOT EXISTS precio_unitario numeric;

-- Update existing records to set precio_unitario = monto when cantidad = 1
UPDATE transacciones SET precio_unitario = monto WHERE precio_unitario IS NULL AND cantidad = 1;

-- Add check constraint for cantidad > 0
ALTER TABLE transacciones ADD CONSTRAINT check_cantidad_positive CHECK (cantidad > 0);

-- Add check constraint for precio_unitario >= 0
ALTER TABLE transacciones ADD CONSTRAINT check_precio_unitario_non_negative CHECK (precio_unitario >= 0);