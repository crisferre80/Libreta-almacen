import { User, Phone, AlertTriangle, MessageCircle, Trash2, QrCode } from 'lucide-react';
import { useState } from 'react';
import { Cliente } from '../types';
import ClienteQR from './ClienteQR';

interface ClienteCardProps {
  cliente: Cliente;
  onClick: () => void;
  onDelete: () => void;
}

export default function ClienteCard({ cliente, onClick, onDelete }: ClienteCardProps) {
  const enRiesgo = cliente.saldo_actual >= cliente.limite_credito && cliente.limite_credito > 0;
  const tieneDeuda = cliente.saldo_actual > 0;
  const [showQR, setShowQR] = useState(false);

  function generarMensajeWhatsApp() {
    const mensaje = `Hola ${cliente.nombre}, te paso el resumen de tu cuenta al día de hoy: $${cliente.saldo_actual.toFixed(2)}. ¡Saludos!`;
    const url = `https://wa.me/${cliente.telefono?.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-3 sm:p-4 cursor-pointer border-l-4 relative"
        style={{
          borderLeftColor: enRiesgo ? '#ef4444' : tieneDeuda ? '#f59e0b' : '#10b981'
        }}
      >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            {cliente.avatar_url ? (
              <img
                src={cliente.avatar_url}
                alt={cliente.nombre}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 sm:w-8 sm:h-8 text-amber-700" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{cliente.nombre}</h3>
            {cliente.telefono && (
              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                <Phone className="w-3 h-3" />
                <span>{cliente.telefono}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className={`text-lg sm:text-xl font-bold ${tieneDeuda ? 'text-red-600' : 'text-amber-700'}`}>
            ${cliente.saldo_actual.toFixed(2)}
          </div>
          {cliente.limite_credito > 0 && (
            <div className="text-xs text-gray-500">
              Límite: ${cliente.limite_credito.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {enRiesgo && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          <AlertTriangle className="w-4 h-4" />
          <span>Límite alcanzado</span>
        </div>
      )}

      {tieneDeuda && cliente.telefono && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            generarMensajeWhatsApp();
          }}
          className="mt-3 w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-amber-900 transition-colors text-sm font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          Enviar Recordatorio
        </button>
      )}

      {cliente.access_code && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowQR(true);
          }}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <QrCode className="w-4 h-4" />
          Ver Código QR
        </button>
      )}

      {!tieneDeuda && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center justify-center shadow-md"
          title="Eliminar cliente"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
    {showQR && cliente.access_code ? (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-4 max-w-sm w-full">
          <ClienteQR accessCode={cliente.access_code} clienteNombre={cliente.nombre} telefono={cliente.telefono || undefined} />
          <button
            onClick={() => setShowQR(false)}
            className="mt-4 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    ) : null}
    </>
  );
}
