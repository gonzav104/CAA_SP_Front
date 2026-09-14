import { cn } from '../../lib/utils'
import type { NavItemDef } from './navItems'
import { SidebarNav } from './SidebarNav'

interface MobileNavDrawerProps {
  abierto: boolean
  onCerrar: () => void
  items: NavItemDef[]
}

/**
 * Drawer de navegación (mobile/tablet <1024px) + backdrop.
 *
 * PR1 (extracción pura): preserva verbatim los mecanismos de cierre actuales
 * — Escape (manejado por `DashboardLayout`), click en el backdrop y cambio de
 * ruta (efecto en `DashboardLayout`). El focus trap/restore (`disparadorRef`,
 * `inert`, ciclo de Tab) es PR2/PR3 — todavía no implementado acá.
 */
export function MobileNavDrawer({ abierto, onCerrar, items }: MobileNavDrawerProps) {
  return (
    <>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:hidden',
          abierto ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarNav items={items} />
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
