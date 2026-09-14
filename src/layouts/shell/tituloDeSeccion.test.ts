/**
 * Unit tests de src/layouts/shell/tituloDeSeccion.ts — título del header por ruta.
 * Extracción PURA (lógica sin cambios) del `tituloDeSeccion` que vivía inline
 * en `DashboardLayout.tsx`. Portea los casos existentes del pathname real.
 */
import { describe, it, expect } from 'vitest'
import { tituloDeSeccion } from './tituloDeSeccion'

describe('tituloDeSeccion', () => {
  it('/familiar → "Mi familia"', () => {
    expect(tituloDeSeccion('/familiar')).toBe('Mi familia')
  })

  it('/pacientes (sin id) → fallback "Pacientes"', () => {
    expect(tituloDeSeccion('/pacientes')).toBe('Pacientes')
  })

  it('/pacientes/:id (sin subruta) → "Paciente"', () => {
    expect(tituloDeSeccion('/pacientes/42')).toBe('Paciente')
  })

  it('/pacientes/:id/cartillas → "Cartillas"', () => {
    expect(tituloDeSeccion('/pacientes/42/cartillas')).toBe('Cartillas')
  })

  it('/pacientes/:id/sesiones → "Sesiones"', () => {
    expect(tituloDeSeccion('/pacientes/42/sesiones')).toBe('Sesiones')
  })

  it('/pacientes/:id/sesiones/nuevo → "Nueva sesión"', () => {
    expect(tituloDeSeccion('/pacientes/42/sesiones/nuevo')).toBe('Nueva sesión')
  })

  it('/pacientes/:id/sesiones/editar → "Editar sesión"', () => {
    expect(tituloDeSeccion('/pacientes/42/sesiones/editar')).toBe('Editar sesión')
  })

  it('/pacientes/:id/colaboradores → "Colaboradores"', () => {
    expect(tituloDeSeccion('/pacientes/42/colaboradores')).toBe('Colaboradores')
  })

  it('/pacientes/:id/colaboradores/agregar → "Agregar colaborador"', () => {
    expect(tituloDeSeccion('/pacientes/42/colaboradores/agregar')).toBe('Agregar colaborador')
  })

  it('/pacientes/:id/pictogramas → "Pictogramas"', () => {
    expect(tituloDeSeccion('/pacientes/42/pictogramas')).toBe('Pictogramas')
  })

  it('ruta desconocida → fallback "Pacientes"', () => {
    expect(tituloDeSeccion('/otra-ruta')).toBe('Pacientes')
  })
})
