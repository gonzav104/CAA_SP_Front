import type { NavGroup } from './navItems'
import { SidebarNav } from './SidebarNav'

interface AppSidebarProps {
  groups: NavGroup[]
}

/** Sidebar fija de escritorio (≥1024px, D6 Zona A). */
export function AppSidebar({ groups }: AppSidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarNav groups={groups} />
    </aside>
  )
}
