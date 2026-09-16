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

/** Grupo rankeado de items de navegación (design `sdd/paciente-overview`, obs #65). */
export interface NavGroup {
  id: string
  /** Encabezado visible del grupo. Ausente para el grupo único sin agrupar. */
  label?: string
  items: NavItemDef[]
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
 *
 * Devuelve `NavGroup[]` en vez de un array plano: para TERAPEUTA con un
 * paciente en contexto, 3 grupos rankeados en orden (`principal` con
 * "Pacientes" + Cartillas; `seguimiento` con Sesiones; `gestion` con
 * Colaboradores + Pictogramas). En cualquier otro caso, un único grupo
 * sin agrupar (`groups.length === 1`, sin `label`) — el rango solo se
 * expresa cuando hay más de una sección de paciente para jerarquizar.
 */
export function construirNavItems({ rol, pacienteId }: ConstruirNavItemsArgs): NavGroup[] {
  const esTerapeuta = rol === 'TERAPEUTA'

  const itemBase: NavItemDef = esTerapeuta
    ? { id: 'pacientes', to: '/pacientes', icon: Users, label: 'Pacientes', end: true }
    : { id: 'familiar', to: '/familiar', icon: Users, label: 'Mi familia', end: true }

  if (!pacienteId || !esTerapeuta) {
    return [{ id: 'principal', items: [itemBase] }]
  }

  return [
    {
      id: 'principal',
      items: [
        itemBase,
        {
          id: 'cartillas',
          to: `/pacientes/${pacienteId}/cartillas`,
          icon: LayoutGrid,
          label: 'Cartillas',
        },
      ],
    },
    {
      id: 'seguimiento',
      label: 'Seguimiento',
      items: [
        {
          id: 'sesiones',
          to: `/pacientes/${pacienteId}/sesiones`,
          icon: CalendarDays,
          label: 'Sesiones',
        },
      ],
    },
    {
      id: 'gestion',
      label: 'Gestión',
      items: [
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
      ],
    },
  ]
}
