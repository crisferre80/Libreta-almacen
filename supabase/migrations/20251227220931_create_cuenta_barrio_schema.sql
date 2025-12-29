/*
  # Cuenta Barrio - Sistema de Libreta Digital

  1. Tablas Principales
    - `comercios` - Información del comercio y configuración
      - `id` (uuid, pk)
      - `user_id` (uuid, referencia a auth.users)
      - `nombre_comercio` (text)
      - `telefono` (text)
      - `created_at` (timestamp)
    
    - `clientes` - Perfiles de clientes
      - `id` (uuid, pk)
      - `comercio_id` (uuid, fk)
      - `nombre` (text)
      - `telefono` (text)
      - `foto_url` (text, opcional)
      - `limite_credito` (numeric, default 0)
      - `saldo_actual` (numeric, default 0)
      - `notas` (text, opcional)
      - `activo` (boolean, default true)
      - `created_at` (timestamp)
    
    - `transacciones` - Registro de deudas y pagos
      - `id` (uuid, pk)
      - `cliente_id` (uuid, fk)
      - `comercio_id` (uuid, fk)
      - `tipo` (text: 'deuda' o 'pago')
      - `monto` (numeric)
      - `descripcion` (text, opcional)
      - `foto_ticket_url` (text, opcional)
      - `created_at` (timestamp)

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas para que cada comerciante solo vea sus propios datos
*/

-- Tabla de comercios
CREATE TABLE IF NOT EXISTS comercios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre_comercio text NOT NULL,
  telefono text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comercios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comerciantes pueden ver su propio comercio"
  ON comercios FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Comerciantes pueden crear su comercio"
  ON comercios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Comerciantes pueden actualizar su comercio"
  ON comercios FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comercio_id uuid REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
  nombre text NOT NULL,
  telefono text,
  foto_url text,
  limite_credito numeric DEFAULT 0,
  saldo_actual numeric DEFAULT 0,
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comerciantes pueden ver sus clientes"
  ON clientes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comercios
      WHERE comercios.id = clientes.comercio_id
      AND comercios.user_id = auth.uid()
    )
  );

CREATE POLICY "Comerciantes pueden crear clientes"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comercios
      WHERE comercios.id = clientes.comercio_id
      AND comercios.user_id = auth.uid()
    )
  );

CREATE POLICY "Comerciantes pueden actualizar sus clientes"
  ON clientes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comercios
      WHERE comercios.id = clientes.comercio_id
      AND comercios.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comercios
      WHERE comercios.id = clientes.comercio_id
      AND comercios.user_id = auth.uid()
    )
  );

-- Tabla de transacciones
CREATE TABLE IF NOT EXISTS transacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  comercio_id uuid REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('deuda', 'pago')),
  monto numeric NOT NULL CHECK (monto > 0),
  descripcion text,
  foto_ticket_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comerciantes pueden ver sus transacciones"
  ON transacciones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comercios
      WHERE comercios.id = transacciones.comercio_id
      AND comercios.user_id = auth.uid()
    )
  );

CREATE POLICY "Comerciantes pueden crear transacciones"
  ON transacciones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM comercios
      WHERE comercios.id = transacciones.comercio_id
      AND comercios.user_id = auth.uid()
    )
  );

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_comercios_user_id ON comercios(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_comercio_id ON clientes(comercio_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_cliente_id ON transacciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_comercio_id ON transacciones(comercio_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_created_at ON transacciones(created_at DESC);

-- Función para actualizar el saldo del cliente automáticamente
CREATE OR REPLACE FUNCTION actualizar_saldo_cliente()
RETURNS TRIGGER AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para actualizar saldo automáticamente
DROP TRIGGER IF EXISTS trigger_actualizar_saldo ON transacciones;
CREATE TRIGGER trigger_actualizar_saldo
  AFTER INSERT ON transacciones
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_saldo_cliente();