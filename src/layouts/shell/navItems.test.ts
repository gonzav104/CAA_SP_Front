/**
 * Unit tests de src/layouts/shell/navItems.ts — fuente única de items de
 * navegación consumida por el sidebar de escritorio y el drawer móvil (D6).
 *
 * Matriz rol × pacienteId. Extracción PURA del comportamiento actual de
 * `DashboardLayout.tsx`: los items contextuales (Cartillas, Sesiones,
 * Colaboradores, Pictogramas) solo aparecen para TERAPEUTA con un paciente
 * en contexto; un FAMILIAR nunca los recibe, ni siquiera con `pacienteId` (RI-2).
 *
 * `construirNavItems` devuelve `NavGroup[]` (design `sdd/paciente-overview`,
 * obs #65): para TERAPEUTA+pacienteId, 3 grupos rankeados en orden
 * (`principal`/`seguimiento`/`gestion`); en cualquier otro caso, un único
 * grupo sin agrupar (`groups.length === 1`, sin `label`).
 */
import { describe, it, expect } from 'vitest'
import { CalendarDays, Image, LayoutGrid, Users, UsersRound } from 'lucide-react'
import { construirNavItems } from './navItems'

describe('construirNavItems', () => {
  it('TERAPEUTA sin pacienteId ve un único grupo sin agrupar con "Pacientes"', () => {
    const groups = construirNavItems({ rol: 'TERAPEUTA' })
    expect(groups).toEqual([
      {
        id: 'principal',
        items: [{ id: 'pacientes', to: '/pacientes', icon: Users, label: 'Pacientes', end: true }],
      },
    ])
  })

  it('TERAPEUTA con pacienteId ve 3 grupos rankeados en orden: principal/seguimiento/gestion', () => {
    const groups = construirNavItems({ rol: 'TERAPEUTA', pacienteId: '42' })
    expect(groups).toEqual([
      {
        id: 'principal',
        items: [
          { id: 'pacientes', to: '/pacientes', icon: Users, label: 'Pacientes', end: true },
          { id: 'cartillas', to: '/pacientes/42/cartillas', icon: LayoutGrid, label: 'Cartillas' },
        ],
      },
      {
        id: 'seguimiento',
        label: 'Seguimiento',
        items: [
          { id: 'sesiones', to: '/pacientes/42/sesiones', icon: CalendarDays, label: 'Sesiones' },
        ],
      },
      {
        id: 'gestion',
        label: 'Gestión',
        items: [
          {
            id: 'colaboradores',
            to: '/pacientes/42/colaboradores',
            icon: UsersRound,
            label: 'Colaboradores',
          },
          { id: 'pictogramas', to: '/pacientes/42/pictogramas', icon: Image, label: 'Pictogramas' },
        ],
      },
    ])
  })

  it('FAMILIAR sin pacienteId ve un único grupo sin agrupar con "Mi familia"', () => {
    const groups = construirNavItems({ rol: 'FAMILIAR' })
    expect(groups).toEqual([
      {
        id: 'principal',
        items: [{ id: 'familiar', to: '/familiar', icon: Users, label: 'Mi familia', end: true }],
      },
    ])
  })

  it('FAMILIAR con pacienteId NUNCA ve Sesiones ni Colaboradores (RI-2): un único grupo con "Mi familia"', () => {
    const groups = construirNavItems({ rol: 'FAMILIAR', pacienteId: '42' })
    expect(groups).toEqual([
      {
        id: 'principal',
        items: [{ id: 'familiar', to: '/familiar', icon: Users, label: 'Mi familia', end: true }],
      },
    ])
    const items = groups.flatMap((grupo) => grupo.items)
    expect(items.some((item) => item.id === 'sesiones')).toBe(false)
    expect(items.some((item) => item.id === 'colaboradores')).toBe(false)
    expect(items.some((item) => item.id === 'cartillas')).toBe(false)
    expect(items.some((item) => item.id === 'pictogramas')).toBe(false)
  })

  it('grupo único (sin agrupar) nunca tiene label', () => {
    expect(construirNavItems({ rol: 'TERAPEUTA' })[0].label).toBeUndefined()
    expect(construirNavItems({ rol: 'FAMILIAR' })[0].label).toBeUndefined()
  })
})
