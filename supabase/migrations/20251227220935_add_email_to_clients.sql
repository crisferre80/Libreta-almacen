-- Add email field to clients table for authentication
ALTER TABLE clientes ADD COLUMN email TEXT UNIQUE;