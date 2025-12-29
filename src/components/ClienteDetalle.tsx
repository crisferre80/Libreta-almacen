import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, User, Calendar, Download, FileText, Trash2, Phone, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, Transaccion } from '../types';
import { useAuth } from '../contexts/AuthContext';
import AddTransaccion from './AddTransaccion';
import ImageUpload from './ImageUpload';
import jsPDF from 'jspdf';
import { formatDate } from '../lib/utils';

interface ClienteDetalleProps {
  cliente: Cliente;
  onClose: () => void;
}

export default function ClienteDetalle({ cliente, onClose }: ClienteDetalleProps) {
  const { comercio } = useAuth();
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [showAddTransaccion, setShowAddTransaccion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingAvatar, setEditingAvatar] = useState(false);

  useEffect(() => {
    loadTransacciones();
  }, []);

  async function loadTransacciones() {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransacciones(data || []);
    } catch (error) {
      console.error('Error loading transacciones:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateAvatar(url: string) {
    try {
      const { error } = await supabase
        .from('clientes')
        .update({ avatar_url: url })
        .eq('id', cliente.id);

      if (error) throw error;
      cliente.avatar_url = url;
      setEditingAvatar(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Error al actualizar avatar');
    }
  }

  async function descargarCuentaPDF() {
    const doc = new jsPDF();
    
    // Logo y nombre del comercio (si existe)
    if (comercio?.nombre_comercio) {
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(comercio.nombre_comercio, 20, 30);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
    }
    
    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Cuenta de Cliente', 20, comercio?.nombre_comercio ? 50 : 30);
    
    // Información del cliente
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${cliente.nombre}`, 20, comercio?.nombre_comercio ? 70 : 50);
    if (cliente.telefono) {
      doc.text(`Teléfono: ${cliente.telefono}`, 20, comercio?.nombre_comercio ? 80 : 60);
    }
    doc.text(`Saldo Actual: $${cliente.saldo_actual.toFixed(2)}`, 20, comercio?.nombre_comercio ? 90 : 70);
    
    // Historial de compras
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Historial de Compras', 20, comercio?.nombre_comercio ? 110 : 90);
    
    let yPosition = comercio?.nombre_comercio ? 130 : 110;
    const compras = transacciones.filter(trans => trans.tipo === 'deuda');
    
    compras.forEach((trans, index) => {
      if (yPosition > 270) { // Nueva página si es necesario
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${index + 1}. ${trans.descripcion || 'Sin descripción'}`, 20, yPosition);
      doc.text(`Cant: ${trans.cantidad || 1} x $${((trans.precio_unitario || trans.monto) / (trans.cantidad || 1)).toFixed(2)} = $${trans.monto.toFixed(2)}`, 20, yPosition + 8);
      doc.text(`${formatDate(trans.created_at)}`, 20, yPosition + 16);
      yPosition += 30;
    });
    
    // Total
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Adeudado: $${cliente.saldo_actual.toFixed(2)}`, 20, yPosition + 10);
    
    // Fecha de emisión
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Emitido el ${new Date().toLocaleDateString('es-AR')}`, 20, 280);
    
    doc.save(`cuenta_${cliente.nombre.replace(/\s+/g, '_')}.pdf`);
  }

  async function enviarCuentaWhatsApp() {
    if (!cliente.telefono) {
      alert('El cliente no tiene teléfono registrado');
      return;
    }

    const mensaje = `*${comercio?.nombre_comercio || 'Cuenta'} - ${cliente.nombre}*\n\n*Saldo Actual:* $${cliente.saldo_actual.toFixed(2)}\n\n*Historial de Compras:*\n${transacciones
      .filter(trans => trans.tipo === 'deuda')
      .map((trans, index) => `${index + 1}. ${trans.descripcion || 'Sin descripción'}\n   Cant: ${trans.cantidad || 1} x $${((trans.precio_unitario || trans.monto) / (trans.cantidad || 1)).toFixed(2)} = $${trans.monto.toFixed(2)}\n   ${formatDate(trans.created_at)}`)
      .join('\n\n')}\n\n*Total Adeudado:* $${cliente.saldo_actual.toFixed(2)}\n\n_Emitido el ${new Date().toLocaleDateString('es-AR')}_`;

    const url = `https://wa.me/${cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  async function eliminarTransaccion(transaccionId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transacción? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', transaccionId);

      if (error) throw error;

      // Recargar transacciones (el trigger ya actualizó el saldo automáticamente)
      await loadTransacciones();
      // Nota: El saldo se actualiza automáticamente via trigger en la base de datos
    } catch (error) {
      console.error('Error eliminando transacción:', error);
      alert('Error al eliminar la transacción');
    }
  }

  async function eliminarTodasTransacciones() {
    if (!confirm('¿Estás seguro de que quieres eliminar TODAS las transacciones de este cliente? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('cliente_id', cliente.id);

      if (error) throw error;

      // Recargar transacciones (el trigger ya actualizó el saldo automáticamente)
      await loadTransacciones();
      // Nota: El saldo se actualiza automáticamente via trigger en la base de datos
    } catch (error) {
      console.error('Error eliminando transacciones:', error);
      alert('Error al eliminar las transacciones');
    }
  }

  async function descargarTransaccionPDF(trans: Transaccion) {
    const doc = new jsPDF();
    
    // Logo y nombre del comercio (si existe)
    if (comercio?.nombre_comercio) {
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(comercio.nombre_comercio, 20, 30);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
    }
    
    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Compra', 20, comercio?.nombre_comercio ? 50 : 30);
    
    // Información del cliente
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${cliente.nombre}`, 20, comercio?.nombre_comercio ? 70 : 50);
    
    // Detalle de la transacción
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de la Compra', 20, comercio?.nombre_comercio ? 90 : 70);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Producto: ${trans.descripcion || 'Sin descripción'}`, 20, comercio?.nombre_comercio ? 110 : 90);
    doc.text(`Cantidad: ${trans.cantidad || 1}`, 20, comercio?.nombre_comercio ? 120 : 100);
    doc.text(`Precio Unitario: $${((trans.precio_unitario || trans.monto) / (trans.cantidad || 1)).toFixed(2)}`, 20, comercio?.nombre_comercio ? 130 : 110);
    doc.text(`Total: $${trans.monto.toFixed(2)}`, 20, comercio?.nombre_comercio ? 140 : 120);
    doc.text(`Fecha: ${formatDate(trans.created_at)}`, 20, comercio?.nombre_comercio ? 150 : 130);
    
    // Fecha de emisión
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text(`Emitido el ${new Date().toLocaleDateString('es-AR')}`, 20, 280);
    
    doc.save(`compra_${cliente.nombre.replace(/\s+/g, '_')}_${trans.id}.pdf`);
  }

  async function enviarTransaccionWhatsApp(trans: Transaccion) {
    if (!cliente.telefono) {
      alert('El cliente no tiene teléfono registrado');
      return;
    }

    const mensaje = `*${comercio?.nombre_comercio || 'Detalle de Compra'}*\n\n*Cliente:* ${cliente.nombre}\n*Producto:* ${trans.descripcion || 'Sin descripción'}\n*Cantidad:* ${trans.cantidad || 1}\n*Precio Unitario:* $${((trans.precio_unitario || trans.monto) / (trans.cantidad || 1)).toFixed(2)}\n*Total:* $${trans.monto.toFixed(2)}\n*Fecha:* ${formatDate(trans.created_at)}\n\n_Emitido el ${new Date().toLocaleDateString('es-AR')}_`;

    const url = `https://wa.me/${cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  if (showAddTransaccion) {
    return (
      <AddTransaccion
        cliente={cliente}
        onClose={() => setShowAddTransaccion(false)}
        onSuccess={() => {
          setShowAddTransaccion(false);
          loadTransacciones();
          onClose();
        }}
      />
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'url(https://res.cloudinary.com/dhvrrxejo/image/upload/v1766876883/hoja_de_almacenero_zje6qa.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: '50% 70%',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div 
        className="bg-amber-800 text-white p-6 shadow-lg relative overflow-hidden"
        style={{
          backgroundImage: 'url(https://res.cloudinary.com/dhvrrxejo/image/upload/v1766876883/hoja_de_almacenero_zje6qa.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: '50% 35%',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-amber-800/80"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <button
            onClick={onClose}
            className="flex items-center gap-2 mb-4 hover:text-amber-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>

          <div className="flex items-start gap-4">
            <div className="relative w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              {cliente.avatar_url ? (
                <img
                  src={cliente.avatar_url}
                  alt={cliente.nombre}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="w-10 h-10" />
              )}
              <button
                onClick={() => setEditingAvatar(true)}
                className="absolute -bottom-1 -right-1 bg-amber-600 text-white rounded-full p-1 hover:bg-amber-700"
              >
                <Edit className="w-3 h-3" />
              </button>
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{cliente.nombre}</h1>
              {cliente.telefono && (
                <p className="text-amber-100">{cliente.telefono}</p>
              )}
              {cliente.notas && (
                <p className="text-sm text-amber-100 mt-2">{cliente.notas}</p>
              )}
            </div>
          </div>

          <div className="mt-6 bg-white/10 rounded-lg p-4">
            <div className="text-amber-100 text-sm mb-1">Saldo Actual</div>
            <div className="text-4xl font-bold">${cliente.saldo_actual.toFixed(2)}</div>
            {cliente.limite_credito > 0 && (
              <div className="text-sm text-amber-100 mt-2">
                Límite: ${cliente.limite_credito.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6 bg-white/90 rounded-lg p-4 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900">Historial</h2>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={descargarCuentaPDF}
              className="flex items-center gap-2 bg-blue-600 text-white px-2 py-2 rounded-lg hover:bg-blue-700 text-xs sm:text-sm"
              title="Descargar cuenta como PDF"
            >
              <Download className="w-4 h-4" />
              Cuenta
            </button>
            <button
              onClick={eliminarTodasTransacciones}
              className="flex items-center gap-2 bg-red-600 text-white px-2 py-2 rounded-lg hover:bg-red-700 text-xs sm:text-sm"
              title="Eliminar todas las transacciones"
              disabled={transacciones.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Eliminar Todo</span>
            </button>
          </div>
        </div>

        <div className="mb-6 flex justify-center items-center gap-4">
          <img
            src="https://res.cloudinary.com/dhvrrxejo/image/upload/c_fill,w_600,h_230/v1766939778/pngwing.com_spksuq.png"
            alt="Lápicera"
            className="w-24 h-24 sm:w-24 sm:h-24"
          />
          <button
            onClick={() => setShowAddTransaccion(true)}
            className="flex items-center gap-2 bg-amber-800 text-white px-6 py-3 rounded-lg hover:bg-amber-900 text-sm sm:text-base font-semibold shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nueva Transacción
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500 bg-white/90 rounded-lg shadow-lg">Cargando historial...</div>
        ) : transacciones.length === 0 ? (
          <div className="text-center py-12 bg-white/90 rounded-lg shadow-lg">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="bg-white border-2 border-red-800 rounded-lg overflow-hidden shadow-lg overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-red-50/90">
                  <th className="border border-red-600 px-2 sm:px-4 py-3 text-left font-bold text-red-900 text-xs sm:text-sm">Producto</th>
                  <th className="border border-red-600 px-2 sm:px-4 py-3 text-left font-bold text-red-900 text-xs sm:text-sm">Cant.</th>
                  <th className="border border-red-600 px-2 sm:px-4 py-3 text-left font-bold text-red-900 text-xs sm:text-sm">Precio Unit/Kg.</th>
                  <th className="border border-red-600 px-2 sm:px-4 py-3 text-left font-bold text-red-900 text-xs sm:text-sm">Total</th>
                  <th className="border border-red-600 px-2 sm:px-4 py-3 text-left font-bold text-red-900 text-xs sm:text-sm">Fecha de Compra</th>
                  <th className="border border-red-600 px-2 sm:px-4 py-3 text-left font-bold text-red-900 text-xs sm:text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transacciones.filter(trans => trans.tipo === 'deuda').map((trans) => (
                  <tr key={trans.id} className="hover:bg-red-25/50 bg-white/90">
                    <td className="border border-red-600 px-2 sm:px-4 py-3 text-gray-900 font-['SilentForest'] text-lg sm:text-2xl break-words max-w-xs" style={{
                      background: 'linear-gradient(45deg, #1e40af 60%, #ffffff 40%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '1px 1px 2px rgba(255,255,255,0.3)'
                    }}>
                      {trans.descripcion || 'Sin descripción'}
                    </td>
                    <td className="border border-red-600 px-2 sm:px-4 py-3 text-gray-900 font-semibold text-center text-sm">
                      {trans.cantidad || 1}
                    </td>
                    <td className="border border-red-600 px-2 sm:px-4 py-3 text-gray-900 font-semibold text-sm">
                      ${((trans.precio_unitario || trans.monto) / (trans.cantidad || 1)).toFixed(2)}
                    </td>
                    <td className="border border-red-600 px-2 sm:px-4 py-3 text-gray-900 font-semibold text-sm">
                      ${trans.monto.toFixed(2)}
                    </td>
                    <td className="border border-red-600 px-2 sm:px-4 py-3 text-gray-500 text-xs sm:text-sm">
                      {formatDate(trans.created_at)}
                    </td>
                    <td className="border border-red-600 px-2 sm:px-4 py-3">
                      <div className="flex flex-wrap gap-1 justify-center">
                        <button
                          onClick={() => eliminarTransaccion(trans.id)}
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                          title="Eliminar transacción"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => descargarTransaccionPDF(trans)}
                          className="p-1 bg-amber-800 text-white rounded hover:bg-amber-900"
                          title="Descargar detalle como PDF"
                        >
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => enviarTransaccionWhatsApp(trans)}
                          className="p-1 bg-green-400 text-white rounded hover:bg-green-500"
                          title="Enviar detalle por WhatsApp"
                        >
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transacciones.filter(trans => trans.tipo === 'deuda').length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-white/90">
                No hay compras registradas
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botón flotante de WhatsApp */}
      {cliente.telefono && (
        <button
          onClick={enviarCuentaWhatsApp}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
          title="Enviar cuenta por WhatsApp"
        >
          <Phone className="w-6 h-6" />
        </button>
      )}

      {/* Modal para editar avatar */}
      {editingAvatar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Cambiar Avatar</h3>
            <ImageUpload
              onUpload={updateAvatar}
              currentImage={cliente.avatar_url}
              bucket="avatars"
              path={`clientes/${cliente.id}`}
              label="Avatar del cliente"
            />
            <button
              onClick={() => setEditingAvatar(false)}
              className="mt-4 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
