import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, LogIn, UserPlus, Eye, EyeOff, LogOut, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Cliente, Transaccion } from '../types';
import { formatDate } from '../lib/utils';
import { formatDate } from '../lib/utils';
import { User } from '@supabase/supabase-js';

export default function ClientePortal() {
  const { code } = useParams<{ code?: string }>();
  const [, setUser] = useState<User | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [] = useState(false);
  const [, setError] = useState('');
  const [step, setStep] = useState<'auth' | 'view'>('auth');

  // Auth states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPagoModal, setShowPagoModal] = useState(false);

  useEffect(() => {
    if (code) {
      // Direct access with code
      loadClienteByCode(code);
    } else {
      // No code provided - show error
      setAuthError('Acceso denegado. Utiliza el código QR proporcionado por tu comerciante para acceder a tu portal.');
      setStep('auth');
    }
  }, [code]);

  async function loadClienteData(user: User) {
    try {
      // Find client by email
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('email', user.email)
        .eq('activo', true)
        .single();

      if (clienteError || !clienteData) {
        setAuthError('No se encontró un cliente asociado a esta cuenta.');
        await supabase.auth.signOut();
        return;
      }

      setCliente(clienteData);
      await cargarTransacciones(clienteData);
      setStep('view');
    } catch (err) {
      setAuthError('Error al cargar datos del cliente');
      console.error(err);
    }
  }

  async function loadClienteByCode(accessCode: string) {
    try {
      const { data: clienteData, error: clienteError } = await supabase
        .from('clientes')
        .select('*')
        .eq('access_code', accessCode)
        .eq('activo', true)
        .single();

      if (clienteError || !clienteData) {
        setAuthError('Código de acceso inválido o cliente inactivo.');
        return;
      }

      setCliente(clienteData);
      await cargarTransacciones(clienteData);
      setStep('view');
    } catch (err) {
      setAuthError('Error al cargar datos del cliente');
      console.error(err);
    }
  }

  async function handleAuth() {
    if (!email.trim() || !password.trim()) {
      setAuthError('Por favor completa todos los campos');
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setAuthError('Registro exitoso. Revisa tu email para confirmar la cuenta.');
        return;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error en la autenticación');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function handlePagarTransferencia() {
    setShowPagoModal(true);
  }

  function abrirBilletera(url: string) {
    const monto = cliente?.saldo_actual || 0;
    const mensaje = `Pago de deuda - ${cliente?.nombre}: $${monto.toFixed(2)}`;
    const urlCompleta = `${url}?amount=${monto}&message=${encodeURIComponent(mensaje)}`;
    window.open(urlCompleta, '_blank');
    setShowPagoModal(false);
  }

  async function cargarTransacciones(clienteSeleccionado: Cliente) {
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .select('*')
        .eq('cliente_id', clienteSeleccionado.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransacciones(data || []);
    } catch (err) {
      setError('Error al cargar transacciones');
      console.error(err);
    }
  }

  if (step === 'auth' && !code) {
    // No access code provided
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <FileText className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
            <p className="text-gray-600 mb-4">Para acceder al portal del cliente, necesitas un código de acceso válido proporcionado por tu comerciante.</p>
          </div>

          {authError && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {authError}
            </div>
          )}

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Escanea el código QR que te proporcionó tu comerciante para acceder a tus transacciones.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'auth') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <FileText className="w-12 h-12 text-amber-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal del Cliente</h1>
            <p className="text-gray-600">Revisa tus gastos y transacciones</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="tu@email.com"
                disabled={authLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Tu contraseña"
                  disabled={authLoading}
                  onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                {authError}
              </div>
            )}

            <button
              onClick={handleAuth}
              disabled={authLoading}
              className="w-full bg-amber-600 text-white py-3 px-4 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                </>
              )}
            </button>

            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-amber-600 hover:text-amber-700 text-sm"
                disabled={authLoading}
              >
                {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{cliente?.nombre}</h1>
              <p className="text-sm text-gray-600">Historial de gastos</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Saldo actual</div>
              <div className={`text-xl font-bold ${cliente!.saldo_actual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${cliente!.saldo_actual.toFixed(2)}
              </div>
            </div>
            {cliente!.saldo_actual > 0 && (
              <button
                onClick={handlePagarTransferencia}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Pagar
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {transacciones.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transacciones.map((transaccion) => (
              <div key={transaccion.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDate(transaccion.created_at)}
                      </span>
                    </div>
                    {transaccion.descripcion && (
                      <p className="text-gray-900 font-medium mb-2">{transaccion.descripcion}</p>
                    )}
                    {transaccion.cantidad && transaccion.precio_unitario && (
                      <p className="text-sm text-gray-600">
                        {transaccion.cantidad} × ${transaccion.precio_unitario.toFixed(2)} = ${transaccion.monto.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      transaccion.tipo === 'deuda' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {transaccion.tipo === 'deuda' ? '+' : '-'}${transaccion.monto.toFixed(2)}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      transaccion.tipo === 'deuda'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {transaccion.tipo === 'deuda' ? 'Compra' : 'Pago'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de pago por transferencia */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <CreditCard className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Pagar por Transferencia</h2>
              <p className="text-gray-600">Selecciona tu billetera virtual</p>
              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  Monto a pagar: ${cliente?.saldo_actual.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => abrirBilletera('https://www.mercadopago.com.ar')}
                className="w-full flex items-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">MP</span>
                </div>
                <span className="font-medium">Mercado Pago</span>
              </button>

              <button
                onClick={() => abrirBilletera('https://www.naranjax.com')}
                className="w-full flex items-center gap-3 p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">NX</span>
                </div>
                <span className="font-medium">Naranja X</span>
              </button>

              <button
                onClick={() => abrirBilletera('https://www.bna.com.ar/Personas')}
                className="w-full flex items-center gap-3 p-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
              >
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-800 font-bold text-sm">BNA</span>
                </div>
                <span className="font-medium">Banco Nación</span>
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPagoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}