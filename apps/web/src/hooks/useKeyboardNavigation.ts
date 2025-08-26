'use client'

import { useEffect, useState } from 'react'

/**
 * Hook para detectar navegación por teclado
 * 
 * Ayuda a mejorar la accesibilidad detectando cuando el usuario
 * está navegando con el teclado vs el mouse para mostrar indicadores
 * de focus apropiados.
 */
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false)

  useEffect(() => {
    // Detectar navegación por teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab, flechas, Enter, Escape indican navegación por teclado
      if (
        e.key === 'Tab' || 
        e.key === 'ArrowUp' || 
        e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || 
        e.key === 'ArrowRight' || 
        e.key === 'Enter' || 
        e.key === 'Escape' ||
        e.key === ' '
      ) {
        setIsKeyboardUser(true)
        document.body.classList.add('keyboard-navigation')
      }
    }

    // Detectar uso del mouse
    const handleMouseDown = () => {
      setIsKeyboardUser(false)
      document.body.classList.remove('keyboard-navigation')
    }

    // Detectar cuando el focus viene del teclado
    const handleFocusIn = (e: FocusEvent) => {
      // Si no hay evento de mouse reciente, probablemente es navegación por teclado
      if (isKeyboardUser) {
        (e.target as HTMLElement)?.classList.add('keyboard-focus')
      }
    }

    const handleFocusOut = (e: FocusEvent) => {
      (e.target as HTMLElement)?.classList.remove('keyboard-focus')
    }

    // Agregar event listeners
    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handleMouseDown, true)
    document.addEventListener('focusin', handleFocusIn, true)
    document.addEventListener('focusout', handleFocusOut, true)

    return () => {
      // Cleanup
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handleMouseDown, true)
      document.removeEventListener('focusin', handleFocusIn, true)
      document.removeEventListener('focusout', handleFocusOut, true)
      document.body.classList.remove('keyboard-navigation')
    }
  }, [isKeyboardUser])

  return {
    isKeyboardUser,
    /**
     * Función helper para aplicar estilos específicos de navegación por teclado
     */
    getKeyboardClasses: (baseClasses: string = '') => {
      return `${baseClasses} ${isKeyboardUser ? 'keyboard-navigation-active' : ''}`
    }
  }
}

/**
 * Hook para manejar atajos de teclado globales
 */
export function useGlobalKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Atajos globales que no deben interferir con navegación
      
      // Alt + T: Toggle tema (solo si no estamos en un input)
      if (e.altKey && e.key.toLowerCase() === 't' && 
          !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        
        // Buscar y activar el theme toggle
        const themeToggle = document.querySelector('[aria-label*="Tema actual"]') as HTMLButtonElement
        if (themeToggle) {
          themeToggle.click()
          themeToggle.focus()
        }
      }

      // Escape: Cerrar modales o navegar al contenido principal
      if (e.key === 'Escape') {
        // Buscar elementos con aria-modal="true" y cerrarlos
        const modal = document.querySelector('[aria-modal="true"]')
        if (modal) {
          const closeButton = modal.querySelector('[aria-label*="cerrar"], [aria-label*="Cerrar"], button[aria-label*="close"]')
          if (closeButton) {
            (closeButton as HTMLButtonElement).click()
            return
          }
        }
        
        // Si no hay modal, enfocar el contenido principal
        const mainContent = document.getElementById('main-content')
        if (mainContent) {
          mainContent.focus()
        }
      }

      // Ctrl + / o ?: Mostrar ayuda de atajos 
      if ((e.ctrlKey && e.key === '/') || e.key === '?') {
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
          e.preventDefault()
          // Buscar y activar el botón de ayuda de accesibilidad
          const helpButton = document.querySelector('[aria-label*="Abrir ayuda de accesibilidad"]') as HTMLButtonElement
          if (helpButton) {
            helpButton.click()
            helpButton.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])
}

/**
 * Hook para mejorar navegación por teclado en tablas
 */
export function useTableKeyboardNavigation(tableRef: React.RefObject<HTMLTableElement>) {
  useEffect(() => {
    const table = tableRef.current
    if (!table) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      
      // Solo aplicar navegación por teclado dentro de la tabla
      if (!table.contains(target)) return
      
      const cells = Array.from(table.querySelectorAll('td, th')) as HTMLElement[]
      const currentIndex = cells.indexOf(target)
      
      if (currentIndex === -1) return
      
      let newIndex: number
      const columns = table.rows[0]?.cells.length || 0
      
      switch (e.key) {
        case 'ArrowRight':
          newIndex = Math.min(currentIndex + 1, cells.length - 1)
          break
        case 'ArrowLeft':
          newIndex = Math.max(currentIndex - 1, 0)
          break
        case 'ArrowDown':
          newIndex = Math.min(currentIndex + columns, cells.length - 1)
          break
        case 'ArrowUp':
          newIndex = Math.max(currentIndex - columns, 0)
          break
        case 'Home':
          e.preventDefault()
          newIndex = Math.floor(currentIndex / columns) * columns
          break
        case 'End':
          e.preventDefault()
          newIndex = Math.floor(currentIndex / columns) * columns + columns - 1
          break
        default:
          return
      }
      
      if (newIndex !== currentIndex) {
        e.preventDefault()
        cells[newIndex]?.focus()
      }
    }

    table.addEventListener('keydown', handleKeyDown)
    
    // Hacer las celdas focusables
    const cells = table.querySelectorAll('td, th')
    cells.forEach(cell => {
      if (!cell.hasAttribute('tabindex')) {
        cell.setAttribute('tabindex', '0')
      }
    })
    
    return () => {
      table.removeEventListener('keydown', handleKeyDown)
    }
  }, [tableRef])
}
