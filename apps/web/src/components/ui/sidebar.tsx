'use client';

/**
 * Sidebar Navigation Component
 * 
 * Componente de navegación lateral moderno con:
 * - Colapsible para ahorrar espacio
 * - Estados activos destacados 
 * - Responsive para mobile/desktop
 * - Tema verde consistente
 * - Microinteracciones elegantes
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Trophy, 
  BarChart3, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Sheet, SheetContent, SheetTrigger } from './dialog';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  description?: string;
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    description: 'KPIs y métricas generales'
  },
  {
    title: 'Nadadores',
    href: '/nadadores',
    icon: <Users className="h-5 w-5" />,
    description: 'Gestión de atletas'
  },
  {
    title: 'Competencias',
    href: '/competencias',
    icon: <Trophy className="h-5 w-5" />,
    description: 'Organizar competencias'
  },
  {
    title: 'Registrar',
    href: '/resultados/registrar',
    icon: <FileText className="h-5 w-5" />,
    badge: '¡Nuevo!',
    description: 'Registro de resultados'
  },
  {
    title: 'Análisis',
    href: '/analitica',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Comparaciones y analytics'
  }
];

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ className, isCollapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname();

  const toggleCollapse = () => {
    onCollapse?.(!isCollapsed);
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-card border-r transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">🏊</span>
              </div>
              <span className="font-bold text-lg text-foreground">AquaLytics</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-8 w-8 p-0 hover:bg-muted/50"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground",
                isCollapsed && "justify-center px-2"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge 
                      variant={isActive ? "secondary" : "default"}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer con información del usuario si no está colapsado */}
      {!isCollapsed && (
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="font-medium">Sistema MVP</div>
            <div>Versión 0.1.0</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Mobile Sidebar Component
 * Sidebar para dispositivos móviles usando Sheet
 */
interface MobileSidebarProps {
  children?: React.ReactNode;
}

export function MobileSidebar({ children }: MobileSidebarProps) {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú de navegación</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <div className="h-full">
          <Sidebar />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Sidebar Container
 * Contenedor principal que maneja el estado del sidebar
 */
interface SidebarContainerProps {
  children: React.ReactNode;
  defaultCollapsed?: boolean;
}

export function SidebarContainer({ children, defaultCollapsed = false }: SidebarContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          isCollapsed={isCollapsed} 
          onCollapse={setIsCollapsed}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden border-b bg-card p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">🏊</span>
            </div>
            <span className="font-bold text-lg text-foreground">AquaLytics</span>
          </div>
          <MobileSidebar />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
