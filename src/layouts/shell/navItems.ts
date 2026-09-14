import { CalendarDays, Image, LayoutGrid, Users, UsersRound, type LucideIcon } from 'lucide-react'
import type { Rol } from '../../types/Usuario'

/** Definición declarativa de un item de navegación (sidebar + drawer). */
export interface NavItemDef {
  id: string
  to: string
  icon: LucideIcon
  label: string
  end?: boolean
}

interface ConstruirNavItemsArgs {
  rol: Rol
  pacienteId?: string
}

/**
 * Fuente única de items de navegación (D6), consumida por `AppSidebar`
 * (desktop) y `MobileNavDrawer` (móvil) para que nunca queden desincronizados.
 *
 * Extracción PURA del comportamiento actual de `DashboardLayout.tsx`: los
 * items contextuales de paciente (Cartillas, Sesiones, Colaboradores,
 * Pictogramas) solo aparecen cuando hay `pacienteId` Y el rol es TERAPEUTA.
 * Un FAMILIAR nunca los ve (RI-2), ni siquiera con `pacienteId` presente.
 */
export function construirNavItems({ rol, pacienteId }: ConstruirNavItemsArgs): NavItemDef[] {
  const esTerapeuta = rol === 'TERAPEUTA'

  const items: NavItemDef[] = esTerapeuta
    ? [{ id: 'pacientes', to: '/pacientes', icon: Users, label: 'Pacientes', end: true }]
    : [{ id: 'familiar', to: '/familiar', icon: Users, label: 'Mi familia', end: true }]

  if (pacienteId && esTerapeuta) {
    items.push(
      {
        id: 'cartillas',
        to: `/pacientes/${pacienteId}/cartillas`,
        icon: LayoutGrid,
        label: 'Cartillas',
      },
      {
        id: 'sesiones',
        to: `/pacientes/${pacienteId}/sesiones`,
        icon: CalendarDays,
        label: 'Sesiones',
      },
      {
        id: 'colaboradores',
        to: `/pacientes/${pacienteId}/colaboradores`,
        icon: UsersRound,
        label: 'Colaboradores',
      },
      {
        id: 'pictogramas',
        to: `/pacientes/${pacienteId}/pictogramas`,
        icon: Image,
        label: 'Pictogramas',
      },
    )
  }

  return items
}
