export interface Comercio {
  id: string;
  user_id: string;
  nombre_comercio: string;
  telefono: string | null;
  logo_url: string | null;
  avatar_url: string | null;
  portada_url: string | null;
  created_at: string;
}

export interface Cliente {
  id: string;
  comercio_id: string;
  nombre: string;
  telefono: string | null;
  avatar_url: string | null;
  limite_credito: number;
  saldo_actual: number;
  notas: string | null;
  activo: boolean;
  email: string | null;
  access_code: string | null;
  created_at: string;
}

export interface Transaccion {
  id: string;
  cliente_id: string;
  comercio_id: string;
  tipo: 'deuda' | 'pago';
  monto: number;
  cantidad?: number;
  precio_unitario?: number;
  peso_gramos?: number;
  descripcion: string | null;
  foto_ticket_url: string | null;
  created_at: string;
}
