import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingBag } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreComercio, setNombreComercio] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { signIn, signUp } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        const { needsConfirmation } = await signUp(email, password, nombreComercio, telefono);
        if (needsConfirmation) {
          setSuccessMessage('¡Registro exitoso! Revisa tu email para confirmar tu cuenta antes de iniciar sesión.');
        } else {
          setSuccessMessage('¡Comercio registrado exitosamente! Ya puedes iniciar sesión.');
        }
        setIsLogin(true); // Cambiar a modo login
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error';
      if (errorMessage.includes('Email not confirmed') || errorMessage.includes('confirm')) {
        setError('Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-sm sm:max-w-md">
        <div className="flex items-center justify-center mb-4 sm:mb-6">
          <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-amber-700" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
          Cuenta Barrio
        </h1>
        <p className="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
          Tu libreta digital de fiado
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Comercio
                </label>
                <input
                  type="text"
                  value={nombreComercio}
                  onChange={(e) => setNombreComercio(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Ej: Almacén Don Tito"
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
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="385-1234567"
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-800 text-white py-3 rounded-lg font-semibold hover:bg-amber-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : isLogin ? 'Iniciar Sesión' : 'Registrar Comercio'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMessage('');
            }}
            className="text-amber-700 hover:text-amber-800 font-medium text-sm"
          >
            {isLogin ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Ingresá'}
          </button>
        </div>
      </div>
    </div>
  );
}
