import { NavLink, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface NavItemProps {
  to: string
  icon: LucideIcon
  /** Marca el item activo solo cuando la ruta coincide exacta (p.ej. base /pacientes). */
  end?: boolean
  children: string
}

/**
 * Item de navegación del sidebar: NavLink con estado activo (Zona A).
 * El estado activo se calcula sobre `pathname + search` del location: con `end`
 * se resalta solo en la coincidencia exacta (p.ej. «Pacientes» en /pacientes),
 * sin `end` se resalta cuando el pathname empieza por `to` (items por paciente).
 *
 * PR1 (extracción pura): esta es la MISMA lógica de activo/`aria-current` que
 * vivía inline en `DashboardLayout.tsx`, solo con el token de color activo
 * migrado al nav-scoped token `--sidebar-primary` (antes hardcodeado). El
 * cambio al mecanismo `isActive` de `NavLink` y el anillo `focus-visible`
 * quedan para PR2/PR3.
 */
export function NavItem({ to, icon: Icon, end, children }: NavItemProps) {
  const location = useLocation()
  const activo = end
    ? location.pathname + location.search === to
    : (location.pathname + location.search).startsWith(to)

  return (
    <NavLink
      to={to}
      end={end}
      aria-current={activo ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        activo
          ? 'bg-sidebar-primary text-sidebar-primary-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </NavLink>
  )
}
