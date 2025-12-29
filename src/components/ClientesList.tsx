import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, ExternalLink, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ClienteCard from './ClienteCard';
import AddCliente from './AddCliente';
import ClienteDetalle from './ClienteDetalle';
import ComercioPerfil from './ComercioPerfil';

export default function ClientesList() {
  const { comercio, signOut } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCliente, setShowAddCliente] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPerfil, setShowPerfil] = useState(false);

  useEffect(() => {
    if (comercio) {
      loadClientes();
    }
  }, [comercio]);

  useEffect(() => {
    const filtered = clientes.filter(cliente =>
      cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefono?.includes(searchTerm)
    );
    setFilteredClientes(filtered);
  }, [searchTerm, clientes]);

  async function fixAccessCodes() {
    try {
      // Get all clients without access_code
      const { data: clientsWithoutCode, error: fetchError } = await supabase
        .from('clientes')
        .select('id')
        .or('access_code.is.null,activo.is.null')
        .eq('comercio_id', comercio.id);

      if (fetchError) throw fetchError;

      if (clientsWithoutCode && clientsWithoutCode.length > 0) {
        // Update each client with access_code and activo=true
        for (const client of clientsWithoutCode) {
          const accessCode = crypto.randomUUID();
          const { error: updateError } = await supabase
            .from('clientes')
            .update({
              access_code: accessCode,
              activo: true
            })
            .eq('id', client.id);

          if (updateError) {
            console.error('Error updating client:', client.id, updateError);
          } else {
            console.log('Updated client:', client.id, 'with access_code:', accessCode);
          }
        }

        // Reload clients
        loadClientes();
        alert(`Se actualizaron ${clientsWithoutCode.length} clientes con códigos de acceso.`);
      } else {
        alert('Todos los clientes ya tienen códigos de acceso válidos.');
      }
    } catch (err) {
      console.error('Error fixing access codes:', err);
      alert('Error al actualizar códigos de acceso.');
    }
  }
    if (!comercio) return;

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('comercio_id', comercio.id)
        .eq('activo', true)
        .order('saldo_actual', { ascending: false });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error loading clientes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function eliminarCliente(clienteId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', clienteId);

      if (error) throw error;

      // Recargar clientes
      await loadClientes();
    } catch (error) {
      console.error('Error eliminando cliente:', error);
      alert('Error al eliminar el cliente');
    }
  }

  const totalDeuda = clientes.reduce((sum, c) => sum + c.saldo_actual, 0);
  const clientesConDeuda = clientes.filter(c => c.saldo_actual > 0).length;

  if (selectedCliente) {
    return (
      <ClienteDetalle
        cliente={selectedCliente}
        onClose={() => {
          setSelectedCliente(null);
          loadClientes();
        }}
      />
    );
  }

  if (showAddCliente) {
    return (
      <AddCliente
        onClose={() => setShowAddCliente(false)}
        onSuccess={() => {
          setShowAddCliente(false);
          loadClientes();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div 
        className="bg-amber-800 text-white p-4 sm:p-6 shadow-lg relative overflow-hidden"
        style={{
          backgroundImage: `url(${comercio?.portada_url || 'https://res.cloudinary.com/dhvrrxejo/image/upload/v1766876883/hoja_de_almacenero_zje6qa.jpg'})`,
          backgroundSize: 'cover',
          backgroundPosition: '50% 35%',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className={`absolute inset-0 ${comercio?.portada_url ? 'bg-amber-800/40' : 'bg-amber-800/80'}`}></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="text-center flex flex-col items-center gap-2">
              {comercio?.logo_url && (
                <img
                  src={comercio.logo_url}
                  alt="Logo"
                  className="w-16 h-16 rounded-full border-2 border-white"
                />
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">{comercio?.nombre_comercio}</h1>
                <p className="text-amber-100 text-sm">Libreta Digital</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4">
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-amber-100 text-xs mb-1">Total Adeudado</div>
              <div className="text-lg sm:text-xl font-bold">${totalDeuda.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 sm:p-3">
              <div className="text-amber-100 text-xs mb-1">Clientes con Deuda</div>
              <div className="text-lg sm:text-xl font-bold">{clientesConDeuda}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando clientes...</div>
        ) : filteredClientes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'No se encontraron clientes' : 'No tenés clientes registrados'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddCliente(true)}
                className="bg-amber-800 text-white px-6 py-2 rounded-lg hover:bg-amber-900"
              >
                Agregar Primer Cliente
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClientes.map(cliente => (
              <ClienteCard
                key={cliente.id}
                cliente={cliente}
                onClick={() => setSelectedCliente(cliente)}
                onDelete={() => eliminarCliente(cliente.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer con botones */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-around">
          <button
            onClick={() => setShowPerfil(true)}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-amber-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Perfil</span>
          </button>
          <button
            onClick={fixAccessCodes}
            className="flex flex-col items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
            title="Reparar códigos de acceso de clientes"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="text-xs">Reparar</span>
          </button>
          <Link
            to="/cliente"
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-amber-600 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            <span className="text-xs">Portal</span>
          </Link>
          <button
            onClick={signOut}
            className="flex flex-col items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs">Salir</span>
          </button>
        </div>
      </div>

      <button
        onClick={() => setShowAddCliente(true)}
        className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 bg-amber-800 text-white w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg hover:bg-amber-900 flex items-center justify-center transition-transform hover:scale-110"
      >
        <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      {showPerfil && <ComercioPerfil onClose={() => setShowPerfil(false)} />}
    </div>
  );
}
