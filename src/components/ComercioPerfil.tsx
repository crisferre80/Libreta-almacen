import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ImageUpload from './ImageUpload';

interface ComercioPerfilProps {
  onClose: () => void;
}

export default function ComercioPerfil({ onClose }: ComercioPerfilProps) {
  const { comercio } = useAuth();
  const [nombreComercio, setNombreComercio] = useState(comercio?.nombre_comercio || '');
  const [telefono, setTelefono] = useState(comercio?.telefono || '');
  const [alias, setAlias] = useState(comercio?.alias || '');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!comercio) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('comercios')
        .update({
          nombre_comercio: nombreComercio,
          telefono: telefono || null,
          alias: alias || null,
        })
        .eq('id', comercio.id);

      if (error) throw error;
      onClose();
    } catch (error) {
      console.error('Error updating comercio:', error);
      alert('Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  }

  async function updateLogo(url: string) {
    if (!comercio) return;
    try {
      const { error } = await supabase
        .from('comercios')
        .update({ logo_url: url })
        .eq('id', comercio.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating logo:', error);
    }
  }

  async function updateAvatar(url: string) {
    if (!comercio) return;
    try {
      const { error } = await supabase
        .from('comercios')
        .update({ avatar_url: url })
        .eq('id', comercio.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  }

  async function updatePortada(url: string) {
    if (!comercio) return;
    try {
      const { error } = await supabase
        .from('comercios')
        .update({ portada_url: url })
        .eq('id', comercio.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating portada:', error);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Perfil del Comercio</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Comercio
            </label>
            <input
              type="text"
              value={nombreComercio}
              onChange={(e) => setNombreComercio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alias del Comercio
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Ej: Tienda Don Juan"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <ImageUpload
            onUpload={updateLogo}
            currentImage={comercio?.logo_url}
            bucket="logos"
            path={`comercios/${comercio?.id}`}
            label="Logo del Comercio"
          />

          <ImageUpload
            onUpload={updateAvatar}
            currentImage={comercio?.avatar_url}
            bucket="avatars"
            path={`comercios/${comercio?.id}`}
            label="Avatar del Comercio"
          />

          <ImageUpload
            onUpload={updatePortada}
            currentImage={comercio?.portada_url}
            bucket="portadas"
            path={`comercios/${comercio?.id}`}
            label="Foto de Portada"
          />

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}