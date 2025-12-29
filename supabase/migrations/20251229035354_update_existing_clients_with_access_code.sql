-- Update existing clients to have access_code
UPDATE clientes SET access_code = gen_random_uuid() WHERE access_code IS NULL;