-- Add access_code field to clients table for direct access
ALTER TABLE clientes ADD COLUMN access_code TEXT UNIQUE DEFAULT gen_random_uuid();