'use client';

/**
 * Layout Principal de la Aplicación
 * 
 * Layout moderno con:
 * - Sidebar colapsible en desktop
 * - Sheet lateral en mobile
 * - Header con información del usuario
 * - Tema consistente verde
 * - Microinteracciones elegantes
 */

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SidebarContainer } from '@/components/ui';
import { ThemeToggleCompact, AccessibilityInfoCompact } from '@/components/ui';
import { Button } from '@/components/ui';
import { LoaderIcon } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

interface HeaderProps {
  title?: string;
  description?: string;
}

/**
 * Header del layout con información del usuario
 */
function AppHeader({ title = "AquaLytics", description }: HeaderProps) {
  const { user, signOut, isLoading, isEntrenador } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut.mutateAsync();
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  if (isLoading) return null;

  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              🏊‍♂️ {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{user?.email}</span>
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                isEntrenador 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'bg-secondary/10 text-secondary-foreground border border-secondary/20'
              }`}>
                {isEntrenador ? '👨‍🏫 Entrenador' : '🏊‍♂️ Atleta'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <AccessibilityInfoCompact />
            <ThemeToggleCompact />
            <Button
              onClick={handleLogout}
              disabled={signOut.isLoading}
              variant="outline"
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
            >
              {signOut.isLoading ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Cerrando...
                </>
              ) : (
                'Cerrar Sesión'
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Layout principal de la aplicación
 * Envuelve contenido con sidebar y header
 */
export function AppLayout({ children, title, description, className }: AppLayoutProps) {
  return (
    <SidebarContainer>
      <div className="flex flex-col h-full min-h-screen bg-background">
        <AppHeader title={title} description={description} />
        <main className={`flex-1 overflow-auto ${className || ''}`}>
          {children}
        </main>
      </div>
    </SidebarContainer>
  );
}

/**
 * Layout simple para páginas que no necesitan sidebar
 * Como auth, landing, etc.
 */
export function SimpleLayout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-h-screen bg-background ${className || ''}`}>
      {children}
    </div>
  );
}
