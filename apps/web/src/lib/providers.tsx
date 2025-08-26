'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { useGlobalKeyboardShortcuts } from '@/hooks/useKeyboardNavigation'

/**
 * Componente interno que inicializa los atajos globales
 */
function GlobalKeyboardProvider({ children }: { children: React.ReactNode }) {
  useGlobalKeyboardShortcuts()
  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minuto
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange={false}
      >
        <GlobalKeyboardProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GlobalKeyboardProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
