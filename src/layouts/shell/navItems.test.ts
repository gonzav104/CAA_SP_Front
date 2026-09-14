/**
 * Unit tests de src/layouts/shell/navItems.ts — fuente única de items de
 * navegación consumida por el sidebar de escritorio y el drawer móvil (D6).
 *
 * Matriz rol × pacienteId. Extracción PURA del comportamiento actual de
 * `DashboardLayout.tsx`: los items contextuales (Cartillas, Sesiones,
 * Colaboradores, Pictogramas) solo aparecen para TERAPEUTA con un paciente
 * en contexto; un FAMILIAR nunca los recibe, ni siquiera con `pacienteId` (RI-2).
 */
import { describe, it, expect } from 'vitest'
import { CalendarDays, Image, LayoutGrid, Users, UsersRound } from 'lucide-react'
import { construirNavItems } from './navItems'

describe('construirNavItems', () => {
  it('TERAPEUTA sin pacienteId ve únicamente "Pacientes"', () => {
    expect(construirNavItems({ rol: 'TERAPEUTA' })).toEqual([
      { id: 'pacientes', to: '/pacientes', icon: Users, label: 'Pacientes', end: true },
    ])
  })

  it('TERAPEUTA con pacienteId ve "Pacientes" + los 4 items contextuales, en orden', () => {
    const items = construirNavItems({ rol: 'TERAPEUTA', pacienteId: '42' })
    expect(items).toEqual([
      { id: 'pacientes', to: '/pacientes', icon: Users, label: 'Pacientes', end: true },
      { id: 'cartillas', to: '/pacientes/42/cartillas', icon: LayoutGrid, label: 'Cartillas' },
      { id: 'sesiones', to: '/pacientes/42/sesiones', icon: CalendarDays, label: 'Sesiones' },
      {
        id: 'colaboradores',
        to: '/pacientes/42/colaboradores',
        icon: UsersRound,
        label: 'Colaboradores',
      },
      { id: 'pictogramas', to: '/pacientes/42/pictogramas', icon: Image, label: 'Pictogramas' },
    ])
  })

  it('FAMILIAR sin pacienteId ve únicamente "Mi familia"', () => {
    expect(construirNavItems({ rol: 'FAMILIAR' })).toEqual([
      { id: 'familiar', to: '/familiar', icon: Users, label: 'Mi familia', end: true },
    ])
  })

  it('FAMILIAR con pacienteId NUNCA ve Sesiones ni Colaboradores (RI-2): solo "Mi familia"', () => {
    const items = construirNavItems({ rol: 'FAMILIAR', pacienteId: '42' })
    expect(items).toEqual([
      { id: 'familiar', to: '/familiar', icon: Users, label: 'Mi familia', end: true },
    ])
    expect(items.some((item) => item.id === 'sesiones')).toBe(false)
    expect(items.some((item) => item.id === 'colaboradores')).toBe(false)
    expect(items.some((item) => item.id === 'cartillas')).toBe(false)
    expect(items.some((item) => item.id === 'pictogramas')).toBe(false)
  })
})
