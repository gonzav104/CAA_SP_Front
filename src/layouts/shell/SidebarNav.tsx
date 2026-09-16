import { HeartPulse } from 'lucide-react'
import type { NavGroup } from './navItems'
import { NavItem } from './NavItem'

interface SidebarNavProps {
  groups: NavGroup[]
}

/** El item de Cartillas es el único que recibe `enfasis` (rango "principal"). */
const ID_ITEM_ENFASIS = 'cartillas'

/**
 * Logo badge + `<nav>` de navegación principal, compartido por `AppSidebar`
 * (desktop) y `MobileNavDrawer` (móvil) para que ambos rendericen exactamente
 * los mismos grupos, en el mismo orden, desde una única fuente (`navItems.ts`).
 *
 * Rango sin depender de color (design `sdd/paciente-overview`, obs #65):
 * orden de grupos, encabezado visible para tiers 2-3, divider entre grupos,
 * y `enfasis` en el item de Cartillas. Cuando hay un único grupo (FAMILIAR o
 * sin paciente en contexto) se omiten encabezado y divider — el sidebar
 * queda visual y estructuralmente idéntico al previo a esta jerarquía.
 */
export function SidebarNav({ groups }: SidebarNavProps) {
  const agrupado = groups.length > 1

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
        {groups.map((grupo, indice) => (
          <div key={grupo.id} className="flex flex-col gap-1">
            {agrupado && indice > 0 && (
              <div className="my-2 border-t border-sidebar-border/60" role="separator" />
            )}
            {agrupado && grupo.label && (
              <span className="px-3 pb-1 text-[11px] uppercase text-sidebar-foreground/50">
                {grupo.label}
              </span>
            )}
            {grupo.items.map((item) => (
              <NavItem
                key={item.id}
                to={item.to}
                icon={item.icon}
                end={item.end}
                enfasis={item.id === ID_ITEM_ENFASIS}
              >
                {item.label}
              </NavItem>
            ))}
          </div>
        ))}
      </nav>
    </>
  )
}
