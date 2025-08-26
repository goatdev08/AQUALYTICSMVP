'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SkipLink {
  href: string
  label: string
}

interface SkipLinksProps {
  links?: SkipLink[]
  className?: string
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Ir al contenido principal' },
  { href: '#main-navigation', label: 'Ir a la navegación principal' },
  { href: '#search', label: 'Ir a la búsqueda' },
  { href: '#user-menu', label: 'Ir al menú de usuario' }
]

/**
 * Componente Skip Links para accesibilidad
 * 
 * Proporciona enlaces de navegación rápida que solo aparecen
 * cuando el usuario navega con el teclado (focus).
 * 
 * Cumple con las pautas WCAG 2.1 para navegación por teclado.
 */
export function SkipLinks({ 
  links = defaultSkipLinks,
  className 
}: SkipLinksProps) {
  return (
    <nav 
      aria-label="Enlaces de navegación rápida" 
      className={cn("skip-links-container", className)}
    >
      {links.map((link, index) => (
        <a
          key={`${link.href}-${index}`}
          href={link.href}
          className="skip-link"
          onKeyDown={(e) => {
            // Asegurar que Enter y Espacio funcionen como click
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              const target = document.querySelector(link.href)
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' })
                // Enfocar el elemento si es focuseable
                if (target instanceof HTMLElement) {
                  target.focus()
                }
              }
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}

/**
 * Hook para facilitar la gestión de skip links dinámicos
 */
export function useSkipLinks(customLinks?: SkipLink[]) {
  const [skipLinks, setSkipLinks] = React.useState<SkipLink[]>(
    customLinks || defaultSkipLinks
  )

  const addSkipLink = React.useCallback((link: SkipLink) => {
    setSkipLinks(prev => [...prev, link])
  }, [])

  const removeSkipLink = React.useCallback((href: string) => {
    setSkipLinks(prev => prev.filter(link => link.href !== href))
  }, [])

  const updateSkipLinks = React.useCallback((newLinks: SkipLink[]) => {
    setSkipLinks(newLinks)
  }, [])

  return {
    skipLinks,
    addSkipLink,
    removeSkipLink,
    updateSkipLinks
  }
}

/**
 * Componente para marcar elementos como landmarks principales
 */
interface LandmarkProps {
  id: string
  role?: 'main' | 'navigation' | 'search' | 'banner' | 'contentinfo' | 'complementary'
  ariaLabel?: string
  children: React.ReactNode
  className?: string
}

export function Landmark({ 
  id, 
  role = 'main', 
  ariaLabel, 
  children, 
  className 
}: LandmarkProps) {
  const elementProps = {
    id,
    className: cn('focus:outline-2 focus:outline-primary focus:outline-offset-2', className),
    ...(ariaLabel && { 'aria-label': ariaLabel }),
    ...(role && { role })
  }

  // Usar el elemento semántico apropiado según el role
  switch (role) {
    case 'main':
      return <main {...elementProps}>{children}</main>
    case 'navigation':
      return <nav {...elementProps}>{children}</nav>
    case 'banner':
      return <header {...elementProps}>{children}</header>
    case 'contentinfo':
      return <footer {...elementProps}>{children}</footer>
    case 'search':
    case 'complementary':
    default:
      return <section {...elementProps}>{children}</section>
  }
}
