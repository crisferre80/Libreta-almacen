import { useState, useEffect } from 'react';
import { X, DollarSign, Plus, Minus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Cliente } from '../types';

interface AddTransaccionProps {
  cliente: Cliente;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductoTransaccion {
  descripcion: string;
  cantidad: number;
  peso?: number; // en gramos
  precioUnitario: number;
  total: number;
}

export default function AddTransaccion({ cliente, onClose, onSuccess }: AddTransaccionProps) {
  const { comercio } = useAuth();
  const [tipo, setTipo] = useState<'deuda' | 'pago'>('deuda');
  const [] = useState('');
  const [productosTransaccion, setProductosTransaccion] = useState<ProductoTransaccion[]>([]);
  const [descripcionActual, setDescripcionActual] = useState('');
  const [cantidadActual, setCantidadActual] = useState('1');
  const [pesoActual, setPesoActual] = useState('');
  const [precioUnitarioActual, setPrecioUnitarioActual] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productos, setProductos] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredProductos, setFilteredProductos] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Lista básica de productos comunes de almacén
  const productosBasicos = [
    'Pan lactal',
    'Pan de campo',
    'Facturas',
    'Medialunas',
    'Leche',
    'Yogur',
    'Queso',
    'Manteca',
    'Huevos',
    'Jamón',
    'Queso crema',
    'Salchichas',
    'Mortadela',
    'Fiambre',
    'Aceite',
    'Vinagre',
    'Sal',
    'Azúcar',
    'Café',
    'Té',
    'Galletitas',
    'Cereales',
    'Arroz',
    'Fideos',
    'Harina',
    'Polenta',
    'Tomate',
    'Cebolla',
    'Papa',
    'Zanahoria',
    'Lechuga',
    'Manzana',
    'Banana',
    'Naranja',
    'Manzana',
    'Gaseosa',
    'Agua mineral',
    'Jugo',
    'Cerveza',
    'Vino',
    'Detergente',
    'Lavandina',
    'Jabón',
    'Shampoo',
    'Pasta dental',
    'Papel higiénico',
    'Servilletas',
    'Bolsas',
    'Helado',
    'Chocolate',
    'Caramelos',
    'Chicles'
  ];

  useEffect(() => {
    loadProductos();
  }, []);

  async function loadProductos() {
    if (!comercio) return;

    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('descripcion')
        .eq('comercio_id', comercio.id)
        .not('descripcion', 'is', null)
        .neq('descripcion', '');

      if (error) throw error;

      // Obtener productos únicos de la base de datos
      const productosDB = [...new Set(data.map(item => item.descripcion).filter(Boolean))];

      // Combinar productos de BD con lista básica, dando prioridad a los de BD
      const productosCombinados = [...productosDB, ...productosBasicos.filter(p => !productosDB.includes(p))]
        .sort((a, b) => a.localeCompare(b));

      setProductos(productosCombinados);
    } catch (error) {
      console.error('Error loading productos:', error);
      // Si hay error, usar solo la lista básica
      setProductos(productosBasicos);
    }
  }

  function handleDescripcionChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setDescripcionActual(value);
    setSelectedSuggestionIndex(-1); // Reset selection when typing

    if (value.length > 0) {
      const filtered = productos.filter(producto =>
        producto.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5); // Limitar a 5 sugerencias
      setFilteredProductos(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }

  function selectProducto(producto: string) {
    setDescripcionActual(producto);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  }

  function agregarProducto() {
    if (!descripcionActual.trim()) {
      setError('Debe ingresar una descripción del producto');
      return;
    }

    const precioUnitarioNum = parseFloat(precioUnitarioActual);
    if (isNaN(precioUnitarioNum) || precioUnitarioNum <= 0) {
      setError('El precio unitario debe ser mayor a cero');
      return;
    }

    const cantidadNum = parseInt(cantidadActual) || 1; // Default to 1 if not specified
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      setError('La cantidad debe ser mayor a cero');
      return;
    }

    const pesoNum = pesoActual ? parseFloat(pesoActual) : undefined;
    if (pesoActual && (isNaN(pesoNum!) || pesoNum! <= 0)) {
      setError('El peso debe ser mayor a cero');
      return;
    }

    // Calcular el total: si hay peso, precio_unitario es por kilo
    let totalProducto: number;
    if (pesoNum) {
      totalProducto = precioUnitarioNum * (pesoNum / 1000) * cantidadNum; // precio por kilo × cantidad de porciones
    } else {
      totalProducto = precioUnitarioNum * cantidadNum; // precio por unidad
    }

    const nuevoProducto: ProductoTransaccion = {
      descripcion: descripcionActual,
      cantidad: cantidadNum,
      peso: pesoNum,
      precioUnitario: precioUnitarioNum,
      total: totalProducto
    };

    setProductosTransaccion([...productosTransaccion, nuevoProducto]);
    setDescripcionActual('');
    setCantidadActual('1');
    setPesoActual('');
    setPrecioUnitarioActual('');
    setError('');
  }

  function removerProducto(index: number) {
    setProductosTransaccion(productosTransaccion.filter((_, i) => i !== index));
  }

  function incrementarCantidad() {
    const nuevaCantidad = parseInt(cantidadActual) + 1;
    setCantidadActual(nuevaCantidad.toString());
  }

  function decrementarCantidad() {
    const nuevaCantidad = Math.max(1, parseInt(cantidadActual) - 1);
    setCantidadActual(nuevaCantidad.toString());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comercio) return;

    if (productosTransaccion.length === 0) {
      setError('Debe agregar al menos un producto');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Crear transacciones para cada producto
      const transacciones = productosTransaccion.map(producto => ({
        cliente_id: cliente.id,
        comercio_id: comercio.id,
        tipo,
        monto: producto.total,
        descripcion: producto.descripcion,
        cantidad: producto.cantidad,
        precio_unitario: producto.precioUnitario,
        peso_gramos: producto.peso // Nuevo campo que necesitarás agregar a la tabla
      }));

      const { error: insertError } = await supabase
        .from('transacciones')
        .insert(transacciones);

      if (insertError) throw insertError;
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar transacción');
    } finally {
      setLoading(false);
    }
  }

  const totalGeneral = productosTransaccion.reduce((sum, producto) => sum + producto.total, 0);
  const nuevoSaldo = tipo === 'deuda'
    ? cliente.saldo_actual + totalGeneral
    : cliente.saldo_actual - totalGeneral;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm sm:max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Nueva Transacción</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 mb-1">{cliente.nombre}</div>
            <div className="text-2xl font-bold text-gray-900">
              Saldo: ${cliente.saldo_actual.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Transacción
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('deuda')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tipo === 'deuda'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Compra al Fiado</div>
                <div className="text-xs">Aumenta deuda</div>
              </button>
              <button
                type="button"
                onClick={() => setTipo('pago')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  tipo === 'pago'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold">Pago</div>
                <div className="text-xs">Reduce deuda</div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Agregar Productos
              </label>
              
              {/* Formulario para agregar producto */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción (Producto) *
                  </label>
                  <input
                    type="text"
                    value={descripcionActual}
                    onChange={handleDescripcionChange}
                    onKeyDown={(e) => {
                      if (!showSuggestions) return;
                      
                      switch (e.key) {
                        case 'ArrowDown':
                          e.preventDefault();
                          setSelectedSuggestionIndex(prev => 
                            prev < filteredProductos.length - 1 ? prev + 1 : 0
                          );
                          break;
                        case 'ArrowUp':
                          e.preventDefault();
                          setSelectedSuggestionIndex(prev => 
                            prev > 0 ? prev - 1 : filteredProductos.length - 1
                          );
                          break;
                        case 'Enter':
                          e.preventDefault();
                          if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredProductos.length) {
                            selectProducto(filteredProductos[selectedSuggestionIndex]);
                          }
                          break;
                        case 'Escape':
                          setShowSuggestions(false);
                          setSelectedSuggestionIndex(-1);
                          break;
                      }
                    }}
                    onFocus={() => {
                      if (descripcionActual.length > 0 && filteredProductos.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay para permitir clics en las sugerencias
                      setTimeout(() => {
                        setShowSuggestions(false);
                        setSelectedSuggestionIndex(-1);
                      }, 200);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Ej: Pan, leche, fiambre..."
                  />
                  
                  {showSuggestions && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredProductos.map((producto, index) => (
                        <div
                          key={index}
                          className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                            index === selectedSuggestionIndex 
                              ? 'bg-amber-100 text-amber-900' 
                              : 'hover:bg-amber-50'
                          }`}
                          onClick={() => selectProducto(producto)}
                        >
                          {producto}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad {pesoActual ? '(Opcional)' : ' *'}
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={decrementarCantidad}
                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors touch-manipulation flex-shrink-0"
                        disabled={parseInt(cantidadActual) <= 1}
                      >
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={cantidadActual}
                        onChange={(e) => setCantidadActual(e.target.value)}
                        className="flex-1 min-w-0 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-center"
                        placeholder="1"
                      />
                      <button
                        type="button"
                        onClick={incrementarCantidad}
                        className="p-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors touch-manipulation flex-shrink-0"
                      >
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                    {pesoActual && (
                      <div className="text-xs text-gray-500 mt-1">
                        Cantidad de porciones o paquetes
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peso (g) - Opcional
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={pesoActual}
                      onChange={(e) => setPesoActual(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                      placeholder="500"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Para productos por peso (fiambres, queso, pan, etc.)
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio {pesoActual ? 'por Kilo' : 'Unitario'} *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                      <input
                        type="number"
                        step="0.01"
                        value={precioUnitarioActual}
                        onChange={(e) => setPrecioUnitarioActual(e.target.value)}
                        className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                        placeholder={pesoActual ? "0.00/kg" : "0.00"}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={agregarProducto}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  + Agregar Producto
                </button>
              </div>
            </div>

            {/* Lista de productos agregados */}
            {productosTransaccion.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Productos Agregados
                  </label>
                  <button
                    type="button"
                    onClick={() => setProductosTransaccion([])}
                    className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    Borrar Todo
                  </button>
                </div>
                <div className="space-y-2">
                  {productosTransaccion.map((producto, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{producto.descripcion}</div>
                        <div className="text-sm text-gray-600">
                          {producto.peso 
                            ? `${producto.cantidad} × (${producto.peso}g × $${producto.precioUnitario.toFixed(2)}/kg)`
                            : `${producto.cantidad} × $${producto.precioUnitario.toFixed(2)}`
                          }
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">${producto.total.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => removerProducto(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {productosTransaccion.length > 0 && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="text-sm text-amber-800 mb-1">Total General</div>
                <div className="text-xl font-bold text-amber-900">
                  ${totalGeneral.toFixed(2)}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${nuevoSaldo < 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                <div className="text-sm text-gray-600 mb-1">Nuevo Saldo</div>
                <div className={`text-2xl font-bold ${nuevoSaldo > 0 ? 'text-red-600' : 'text-amber-700'}`}>
                  ${nuevoSaldo.toFixed(2)}
                </div>
                {nuevoSaldo < 0 && (
                  <div className="text-xs text-yellow-700 mt-2">
                    El cliente quedaría con saldo a favor
                  </div>
                )}
              </div>
            </>
          )}

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
              disabled={loading || productosTransaccion.length === 0}
              className={`flex-1 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50 ${
                tipo === 'deuda' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-800 hover:bg-amber-900'
              }`}
            >
              {loading ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
