'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: Theme
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'light'
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

/**
 * Hook para usar el contexto de tema
 */
export function useTheme() {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}

/**
 * Provider de tema para AquaLytics
 * 
 * Maneja el tema claro/oscuro con persistencia en localStorage
 * y detección automática del tema del sistema.
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'aqualytics-theme',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<Theme>('light')

  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme)
    }
  }, [storageKey])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const updateTheme = () => {
      const isDarkSystem = mediaQuery.matches
      let newResolvedTheme: Theme
      
      if (theme === 'system') {
        newResolvedTheme = isDarkSystem ? 'dark' : 'light'
      } else {
        newResolvedTheme = theme
      }
      
      setResolvedTheme(newResolvedTheme)
      
      // Aplicar tema al DOM
      const root = window.document.documentElement
      
      if (disableTransitionOnChange) {
        const style = document.createElement('style')
        style.appendChild(
          document.createTextNode(
            '*,*::before,*::after{transition:none!important;animation-duration:0.01ms!important;animation-delay:-1ms!important;animation-iteration-count:1!important;background-attachment:initial!important;scroll-behavior:auto!important;}'
          )
        )
        document.head.appendChild(style)
        
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            document.head.removeChild(style)
          })
        })
      }
      
      if (attribute === 'class') {
        root.classList.remove('light', 'dark')
        if (newResolvedTheme !== 'light') {
          root.classList.add(newResolvedTheme)
        }
      } else {
        root.setAttribute(attribute, newResolvedTheme)
      }
    }

    updateTheme()
    
    if (enableSystem && theme === 'system') {
      mediaQuery.addEventListener('change', updateTheme)
      return () => mediaQuery.removeEventListener('change', updateTheme)
    }
  }, [theme, attribute, enableSystem, disableTransitionOnChange])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(storageKey, newTheme)
  }

  const value = {
    theme,
    setTheme,
    resolvedTheme
  }

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
