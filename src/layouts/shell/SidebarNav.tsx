import { HeartPulse } from 'lucide-react'
import type { NavItemDef } from './navItems'
import { NavItem } from './NavItem'

interface SidebarNavProps {
  items: NavItemDef[]
}

/**
 * Logo badge + `<nav>` de navegación principal, compartido por `AppSidebar`
 * (desktop) y `MobileNavDrawer` (móvil) para que ambos rendericen exactamente
 * los mismos items, en el mismo orden, desde una única fuente (`navItems.ts`).
 */
export function SidebarNav({ items }: SidebarNavProps) {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-4">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <HeartPulse className="size-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">CAA</span>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
        aria-label="Navegación principal"
      >
        {items.map((item) => (
          <NavItem key={item.id} to={item.to} icon={item.icon} end={item.end}>
            {item.label}
          </NavItem>
        ))}
      </nav>
    </>
  )
}
