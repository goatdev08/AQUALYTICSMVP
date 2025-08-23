/**
 * Cliente de Supabase para AquaLytics
 * 
 * Configuración del cliente de Supabase para autenticación
 * y comunicación con la base de datos.
 * 
 * Actualizado para usar la nueva API compatible con middleware.
 */

import { createBrowserClient } from '@supabase/ssr';

// Variables de entorno requeridas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validación de variables de entorno
if (!supabaseUrl) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. ' +
    'Please add it to your .env.local file.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
    'Please add it to your .env.local file.'
  );
}

/**
 * Cliente de Supabase configurado para AquaLytics.
 * 
 * Usa la nueva API de @supabase/ssr que es compatible con
 * middleware de Next.js y maneja cookies automáticamente.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Tipos específicos de la base de datos para TypeScript.
 * 
 * Nota: En un proyecto más grande, estos tipos se generarían
 * automáticamente desde el esquema de Supabase.
 */
export interface Database {
  public: {
    Tables: {
      usuario: {
        Row: {
          id: number;
          email: string;
          rol: 'entrenador' | 'atleta';
          equipo_id: number;
          auth_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          email: string;
          rol: 'entrenador' | 'atleta';
          equipo_id: number;
          auth_user_id?: string | null;
        };
        Update: {
          email?: string;
          rol?: 'entrenador' | 'atleta';
          equipo_id?: number;
          auth_user_id?: string | null;
        };
      };
    };
  };
}
