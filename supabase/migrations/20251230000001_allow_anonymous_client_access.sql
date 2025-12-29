-- Allow anonymous access to client data via access_code
CREATE POLICY "Clientes pueden ver sus propios datos con access_code"
  ON clientes FOR SELECT
  TO anon
  USING (access_code IS NOT NULL AND activo = true);

-- Allow anonymous access to transactions for clients with valid access_code
CREATE POLICY "Clientes pueden ver sus transacciones con access_code"
  ON transacciones FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM clientes
      WHERE clientes.id = transacciones.cliente_id
      AND clientes.access_code IS NOT NULL
      AND clientes.activo = true
    )
  );