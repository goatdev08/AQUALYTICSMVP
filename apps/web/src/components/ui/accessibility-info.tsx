'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Button } from './button'
import { Keyboard, HelpCircle } from 'lucide-react'

/**
 * Componente que muestra información de accesibilidad y atajos de teclado
 */
export function AccessibilityInfo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          title="Información de accesibilidad y atajos de teclado"
          aria-label="Abrir ayuda de accesibilidad"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Ayuda de accesibilidad</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Accesibilidad y Atajos de Teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          
          {/* Navegación por Teclado */}
          <section>
            <h3 className="font-semibold text-lg mb-3">🔧 Navegación por Teclado</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><kbd className="kbd">Tab</kbd> - Navegar hacia adelante</div>
                <div><kbd className="kbd">Shift + Tab</kbd> - Navegar hacia atrás</div>
                <div><kbd className="kbd">Enter / Espacio</kbd> - Activar elemento</div>
                <div><kbd className="kbd">Escape</kbd> - Cerrar modal o ir al contenido principal</div>
                <div><kbd className="kbd">Flechas</kbd> - Navegar en tablas y menús</div>
                <div><kbd className="kbd">Home / End</kbd> - Ir al inicio/final de fila (tablas)</div>
              </div>
            </div>
          </section>

          {/* Atajos Globales */}
          <section>
            <h3 className="font-semibold text-lg mb-3">⚡ Atajos Globales</h3>
            <div className="space-y-2 text-sm">
              <div><kbd className="kbd">Alt + T</kbd> - Cambiar tema (claro/oscuro/automático)</div>
              <div><kbd className="kbd">Ctrl + /</kbd> o <kbd className="kbd">?</kbd> - Mostrar esta ayuda</div>
            </div>
          </section>

          {/* Enlaces Rápidos */}
          <section>
            <h3 className="font-semibold text-lg mb-3">🚀 Enlaces de Navegación Rápida</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Estos enlaces aparecen cuando navegas con Tab desde el inicio de la página:
            </p>
            <div className="space-y-2 text-sm">
              <div>• Ir al contenido principal</div>
              <div>• Ir a la navegación principal</div>
              <div>• Ir al menú de usuario</div>
              <div>• Ir a la búsqueda</div>
            </div>
          </section>

          {/* Características de Accesibilidad */}
          <section>
            <h3 className="font-semibold text-lg mb-3">♿ Características de Accesibilidad</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>🎨 Temas:</strong>
                <p>Soporte para temas claro, oscuro y automático con contraste optimizado.</p>
              </div>
              <div>
                <strong>🔍 Focus Visible:</strong>
                <p>Indicadores de focus claros cuando navegas con el teclado.</p>
              </div>
              <div>
                <strong>📱 Responsive:</strong>
                <p>Interfaz optimizada para diferentes tamaños de pantalla.</p>
              </div>
              <div>
                <strong>🔊 Screen Readers:</strong>
                <p>Etiquetas ARIA y roles semánticos para lectores de pantalla.</p>
              </div>
              <div>
                <strong>⚡ Reducir Movimiento:</strong>
                <p>Respeta la preferencia del usuario para reducir animaciones.</p>
              </div>
              <div>
                <strong>🎯 Alto Contraste:</strong>
                <p>Automáticamente mejora el contraste si el sistema lo solicita.</p>
              </div>
            </div>
          </section>

          {/* Navegación en Tablas */}
          <section>
            <h3 className="font-semibold text-lg mb-3">📊 Navegación en Tablas</h3>
            <div className="space-y-2 text-sm">
              <div><kbd className="kbd">→</kbd> - Celda siguiente</div>
              <div><kbd className="kbd">←</kbd> - Celda anterior</div>
              <div><kbd className="kbd">↓</kbd> - Celda abajo</div>
              <div><kbd className="kbd">↑</kbd> - Celda arriba</div>
              <div><kbd className="kbd">Home</kbd> - Primera celda de la fila</div>
              <div><kbd className="kbd">End</kbd> - Última celda de la fila</div>
            </div>
          </section>

          {/* Formularios */}
          <section>
            <h3 className="font-semibold text-lg mb-3">📝 Formularios</h3>
            <div className="space-y-2 text-sm">
              <div><kbd className="kbd">Enter</kbd> - Avanzar al siguiente campo</div>
              <div><kbd className="kbd">Ctrl + S</kbd> - Guardar (en formularios de captura)</div>
              <div><kbd className="kbd">Alt + D</kbd> - Duplicar fila anterior (en captura de resultados)</div>
              <div><kbd className="kbd">Alt + ↑/↓</kbd> - Navegar segmentos (en captura)</div>
            </div>
          </section>

        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Versión compacta solo con el icono
 */
export function AccessibilityInfoCompact() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          title="Ayuda de accesibilidad"
          aria-label="Abrir ayuda de accesibilidad y atajos de teclado"
        >
          <Keyboard className="h-4 w-4" />
          <span className="sr-only">Ayuda de accesibilidad</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atajos de Teclado y Accesibilidad
          </DialogTitle>
        </DialogHeader>
        <AccessibilityContent />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Contenido reutilizable de información de accesibilidad
 */
function AccessibilityContent() {
  return (
    <div className="space-y-4 text-sm">
      <div>
        <strong>Navegación:</strong> Tab, Shift+Tab, Flechas, Enter, Escape
      </div>
      <div>
        <strong>Atajos:</strong> Alt+T (tema), Ctrl+/ (ayuda)
      </div>
      <div>
        <strong>Captura:</strong> Ctrl+S (guardar), Alt+D (duplicar), Alt+↑/↓ (navegar)
      </div>
      <div className="text-muted-foreground">
        Usa Tab para navegar y descubrir enlaces de navegación rápida.
      </div>
    </div>
  )
}
