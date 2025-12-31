import QRCode from 'react-qr-code';
import { MessageCircle } from 'lucide-react';
import { Comercio } from '../types';

interface ClienteQRProps {
  accessCode: string;
  clienteNombre: string;
  telefono?: string;
  comercio: Comercio;
}

export default function ClienteQR({ accessCode, clienteNombre, telefono, comercio }: ClienteQRProps) {
  const url = `https://milibreta.netlify.app/cliente/${accessCode}`;

  const enviarWhatsApp = () => {
    if (!telefono) {
      alert('No hay teléfono registrado para este cliente.');
      return;
    }
    const mensaje = `Hola ${clienteNombre}, ${comercio.nombre_comercio} te invita a acceder a tu cuenta digital: ${url}. Contacto: ${comercio.telefono || 'Sin teléfono'}`;
    const whatsappUrl = `https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">Código QR para {clienteNombre}</h3>
      <QRCode value={url} size={200} />
      <p className="text-sm text-gray-600 mt-2 text-center">
        Escanea este código QR para acceder directamente a la cuenta de {clienteNombre}
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 text-blue-600 underline"
      >
        Enlace directo
      </a>
      {telefono && (
        <button
          onClick={enviarWhatsApp}
          className="mt-2 flex items-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
        >
          <MessageCircle className="w-4 h-4" />
          Enviar por WhatsApp
        </button>
      )}
    </div>
  );
}