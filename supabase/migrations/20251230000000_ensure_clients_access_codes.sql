-- Ensure all clients have access_code and are active
UPDATE clientes
SET access_code = COALESCE(access_code, gen_random_uuid()::text),
    activo = COALESCE(activo, true)
WHERE access_code IS NULL OR activo IS NULL;