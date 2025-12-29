-- Add image fields to comercios and clients tables
ALTER TABLE comercios ADD COLUMN logo_url TEXT;
ALTER TABLE comercios ADD COLUMN avatar_url TEXT;
ALTER TABLE comercios ADD COLUMN portada_url TEXT;

-- Rename foto_url to avatar_url in clientes for consistency
ALTER TABLE clientes RENAME COLUMN foto_url TO avatar_url;