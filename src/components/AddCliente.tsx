import { useState } from 'react';
import { X, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ClienteQR from './ClienteQR';

interface AddClienteProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCliente({ onClose, onSuccess }: AddClienteProps) {
  const { comercio } = useAuth();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [limiteCredito, setLimiteCredito] = useState('');
  const [notas, setNotas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accessCode, setAccessCode] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comercio) return;

    setLoading(true);
    setError('');

    try {
      const accessCode = crypto.randomUUID();
      const { error: insertError } = await supabase.from('clientes').insert({
        comercio_id: comercio.id,
        nombre,
        telefono: telefono || null,
        limite_credito: limiteCredito ? parseFloat(limiteCredito) : 0,
        notas: notas || null,
        access_code: accessCode,
      });

      if (insertError) throw insertError;
      setAccessCode(accessCode);
      // No llamar onSuccess inmediatamente, mostrar QR
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar cliente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
        {accessCode ? (
          <div className="p-4">
            <ClienteQR accessCode={accessCode} clienteNombre={nombre} telefono={telefono} />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setAccessCode(null);
                  onClose();
                  onSuccess();
                }}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <User className="w-10 h-10 sm:w-12 sm:h-12 text-amber-700" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono (para WhatsApp)
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="385-1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Límite de Crédito
            </label>
            <input
              type="number"
              step="0.01"
              value={limiteCredito}
              onChange={(e) => setLimiteCredito(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Ej: 20000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Te avisaremos cuando el cliente alcance este límite
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              placeholder="Ej: Vive en la esquina, cobra el 5 de cada mes..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
