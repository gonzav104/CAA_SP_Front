import { NavLink } from 'react-router-dom'
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
 *
 * El estado activo lo calcula `NavLink` vía su mecanismo `isActive` (matching
 * por segmentos de `pathname`, ignora `search`), con `end` configurado por
 * item para distinguir coincidencia exacta (p.ej. «Pacientes» en /pacientes)
 * de coincidencia por prefijo (items por paciente). `NavLink` emite
 * `aria-current="page"` automáticamente cuando está activo — no hace falta
 * calcularlo a mano.
 */
export function NavItem({ to, icon: Icon, end, children }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )
      }
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </NavLink>
  )
}
