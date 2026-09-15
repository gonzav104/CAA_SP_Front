import { useEffect, useRef, type RefObject } from 'react'
import { cn } from '../../lib/utils'
import type { NavGroup } from './navItems'
import { SidebarNav } from './SidebarNav'

interface MobileNavDrawerProps {
  abierto: boolean
  onCerrar: () => void
  groups: NavGroup[]
  /** Botón trigger (hamburguesa): recibe el foco de vuelta al cerrar el drawer. */
  disparadorRef: RefObject<HTMLButtonElement | null>
}

const SELECTOR_FOCOSABLES = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Drawer de navegación (mobile/tablet <1024px) + backdrop.
 *
 * Mecanismos de cierre preservados sin cambios de comportamiento: Escape,
 * click en el backdrop y cambio de ruta (efecto en `DashboardLayout`) —
 * los tres convergen en `onCerrar`. Sobre eso se agrega, de forma aditiva:
 *
 * - Al abrir: el foco se mueve al primer elemento focosable del drawer.
 * - Mientras está abierto: Tab/Shift+Tab quedan atrapados dentro del drawer
 *   (nunca escapan al fondo); Escape está scopeado acá (ya no es un listener
 *   permanente en `window`).
 * - Al cerrar (por CUALQUIER mecanismo): el foco vuelve al trigger vía
 *   `disparadorRef` — no vía `document.activeElement`, porque `inert` le
 *   quita el foco al trigger antes de que un efecto pueda leerlo.
 * - El drawer cerrado queda `inert` (no es alcanzable con Tab aunque siga
 *   montado); mientras está abierto, deja de estarlo.
 */
export function MobileNavDrawer({ abierto, onCerrar, groups, disparadorRef }: MobileNavDrawerProps) {
  const drawerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!abierto) return

    const contenedor = drawerRef.current
    if (!contenedor) return
    const disparador = disparadorRef.current

    const obtenerFocosables = () =>
      Array.from(contenedor.querySelectorAll<HTMLElement>(SELECTOR_FOCOSABLES))

    obtenerFocosables()[0]?.focus()

    const manejarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        onCerrar()
        return
      }

      if (evento.key !== 'Tab') return

      const focosables = obtenerFocosables()
      if (focosables.length === 0) return

      const primero = focosables[0]
      const ultimo = focosables[focosables.length - 1]

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primero.focus()
      }
    }

    contenedor.addEventListener('keydown', manejarTecla)
    return () => {
      contenedor.removeEventListener('keydown', manejarTecla)
      disparador?.focus()
    }
  }, [abierto, onCerrar, disparadorRef])

  return (
    <>
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        inert={abierto ? undefined : true}
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:hidden',
          abierto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarNav groups={groups} />
      </aside>

      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onCerrar}
          aria-hidden="true"
        />
      )}
    </>
  )
}
