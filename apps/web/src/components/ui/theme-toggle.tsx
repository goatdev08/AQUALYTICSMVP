'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemeToggleProps = {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
}

/**
 * Toggle de tema para AquaLytics
 * 
 * Componente que permite cambiar entre tema claro, oscuro y automático.
 * Integrado con el ThemeProvider y persiste la preferencia en localStorage.
 */
export function ThemeToggle({ 
  className,
  showLabel = false,
  size = 'md',
  variant = 'ghost'
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
      default:
        return <Monitor className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Tema Claro'
      case 'dark':
        return 'Tema Oscuro'
      case 'system':
      default:
        return 'Tema Sistema'
    }
  }

  const getTooltipText = () => {
    switch (theme) {
      case 'light':
        return 'Cambiar a tema oscuro'
      case 'dark':
        return 'Cambiar a tema automático'
      case 'system':
      default:
        return 'Cambiar a tema claro'
    }
  }

  return (
    <Button
      onClick={cycleTheme}
      variant={variant}
      size={size}
      className={cn(
        'relative transition-colors',
        showLabel && 'gap-2',
        className
      )}
      title={getTooltipText()}
      aria-label={`Tema actual: ${getLabel()}. ${getTooltipText()}`}
      aria-describedby={showLabel ? undefined : "theme-description"}
      role="button"
      tabIndex={0}
    >
      <div className="relative">
        {getIcon()}
        {resolvedTheme !== theme && (
          <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}
      </div>
      {showLabel && (
        <span className="hidden sm:inline">{getLabel()}</span>
      )}
      
      {/* Descripción oculta para screen readers */}
      {!showLabel && (
        <span 
          id="theme-description" 
          className="sr-only"
          aria-hidden="true"
        >
          Alternar entre tema claro, oscuro y automático. 
          El tema automático se ajusta según las preferencias de tu sistema.
        </span>
      )}
    </Button>
  )
}

/**
 * Version compacta del theme toggle para usar en headers/navbars
 */
export function ThemeToggleCompact({ className }: { className?: string }) {
  return (
    <ThemeToggle
      className={className}
      size="sm"
      variant="ghost"
      showLabel={false}
    />
  )
}

/**
 * Version con label para usar en settings/ajustes
 */
export function ThemeToggleWithLabel({ className }: { className?: string }) {
  return (
    <ThemeToggle
      className={className}
      size="md"
      variant="outline"
      showLabel={true}
    />
  )
}
