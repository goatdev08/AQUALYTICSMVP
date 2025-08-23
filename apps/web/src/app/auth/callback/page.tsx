/**
 * Página de callback de autenticación
 * 
 * Esta página maneja la redirección después del login/registro
 * con Supabase Auth. Es parte del flujo OAuth.
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verificando autenticación - AquaLytics',
};

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            🔄 Verificando autenticación...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Por favor espera mientras procesamos tu autenticación
          </p>
          
          <div className="mt-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              Serás redirigido automáticamente...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
