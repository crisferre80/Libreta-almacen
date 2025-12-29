-- Add missing RLS policies for DELETE and UPDATE operations
-- This allows business owners to delete clients, transactions, and update transactions

-- Políticas para eliminar clientes
CREATE POLICY "Comerciantes pueden eliminar sus clientes"
  ON clientes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comercios
      WHERE comercios.id = clientes.comercio_id
      AND comercios.user_id = auth.uid()
    )
  );

-- Políticas para actualizar transacciones
CREATE POLICY "Comerciantes pueden actualizar sus transacciones"
  ON transacciones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comercios
      WHERE comercios.id = transacciones.comercio_id
      AND comercios.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comercios
      WHERE comercios.id = transacciones.comercio_id
      AND comercios.user_id = auth.uid()
    )
  );

-- Políticas para eliminar transacciones
CREATE POLICY "Comerciantes pueden eliminar sus transacciones"
  ON transacciones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comercios
      WHERE comercios.id = transacciones.comercio_id
      AND comercios.user_id = auth.uid()
    )
  );

-- Políticas para eliminar comercios (por si acaso)
CREATE POLICY "Comerciantes pueden eliminar su comercio"
  ON comercios FOR DELETE
  TO authenticated
  USING (comercios.user_id = auth.uid());

-- Actualizar la función del trigger para manejar eliminaciones
CREATE OR REPLACE FUNCTION actualizar_saldo_cliente()
RETURNS TRIGGER AS $$
BEGIN
  -- Para inserciones
  IF TG_OP = 'INSERT' THEN
    IF NEW.tipo = 'deuda' THEN
      UPDATE clientes
      SET saldo_actual = saldo_actual + NEW.monto
      WHERE id = NEW.cliente_id;
    ELSIF NEW.tipo = 'pago' THEN
      UPDATE clientes
      SET saldo_actual = saldo_actual - NEW.monto
      WHERE id = NEW.cliente_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Para eliminaciones
  IF TG_OP = 'DELETE' THEN
    IF OLD.tipo = 'deuda' THEN
      UPDATE clientes
      SET saldo_actual = saldo_actual - OLD.monto
      WHERE id = OLD.cliente_id;
    ELSIF OLD.tipo = 'pago' THEN
      UPDATE clientes
      SET saldo_actual = saldo_actual + OLD.monto
      WHERE id = OLD.cliente_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para eliminaciones también
DROP TRIGGER IF EXISTS trigger_actualizar_saldo_delete ON transacciones;
CREATE TRIGGER trigger_actualizar_saldo_delete
  AFTER DELETE ON transacciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_saldo_cliente();