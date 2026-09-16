/**
 * Unit tests de src/lib/resumenPaciente.ts — derivaciones puras consumidas por
 * `PacienteOverview` (design/spec `sdd/paciente-overview`, obs #65/#64).
 * PR1 (obs #66, Fase 1): estas funciones son net-new y sin consumidor todavía;
 * se consumen recién desde PR3a/PR3b.
 */
import { describe, it, expect } from 'vitest'
import {
  encontrarCartillaPrincipal,
  sesionMasReciente,
  calcularRecencia,
  UMBRAL_RECIENTE_DIAS,
  UMBRAL_DIAS_A_MESES,
} from './resumenPaciente'
import type { Cartilla } from '../types/Cartilla'
import type { Sesion } from '../types/Sesion'

function crearCartilla(overrides: Partial<Cartilla> & Pick<Cartilla, 'id'>): Cartilla {
  return {
    pacienteId: 'p1',
    creadorId: 'u1',
    nombre: 'Cartilla sin nombre',
    esPrincipal: false,
    creadoEn: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function crearSesion(overrides: Partial<Sesion> & Pick<Sesion, 'id' | 'fechaHora'>): Sesion {
  return {
    disposicion: '',
    objetivosTrabajados: '',
    observaciones: '',
    estrategiasYProximosPasos: '',
    creadoEn: '2026-01-01T00:00:00.000Z',
    pacienteId: 'p1',
    ...overrides,
  }
}

describe('encontrarCartillaPrincipal', () => {
  it('devuelve la cartilla marcada esPrincipal entre varias', () => {
    const principal = crearCartilla({ id: 'c2', esPrincipal: true, nombre: 'Principal' })
    const cartillas = [
      crearCartilla({ id: 'c1' }),
      principal,
      crearCartilla({ id: 'c3', esPrincipal: false }),
    ]
    expect(encontrarCartillaPrincipal(cartillas)).toEqual(principal)
  })

  it('devuelve undefined si ninguna cartilla es principal', () => {
    const cartillas = [crearCartilla({ id: 'c1' }), crearCartilla({ id: 'c2' })]
    expect(encontrarCartillaPrincipal(cartillas)).toBeUndefined()
  })

  it('devuelve undefined con array vacío (paciente sin cartillas)', () => {
    expect(encontrarCartillaPrincipal([])).toBeUndefined()
  })
})

describe('sesionMasReciente', () => {
  it('devuelve la sesión con fechaHora máxima entre varias, sin importar el orden del array', () => {
    const masReciente = crearSesion({ id: 's3', fechaHora: '2026-09-10T10:00:00.000Z' })
    const sesiones = [
      crearSesion({ id: 's1', fechaHora: '2026-09-01T10:00:00.000Z' }),
      masReciente,
      crearSesion({ id: 's2', fechaHora: '2026-09-05T10:00:00.000Z' }),
    ]
    expect(sesionMasReciente(sesiones)).toEqual(masReciente)
  })

  it('devuelve undefined con array vacío (paciente sin sesiones)', () => {
    expect(sesionMasReciente([])).toBeUndefined()
  })
})

describe('calcularRecencia', () => {
  const ahora = new Date('2026-09-15T12:00:00.000Z')
  const msPorDia = 1000 * 60 * 60 * 24
  const hace = (dias: number) => new Date(ahora.getTime() - dias * msPorDia).toISOString()

  it('0 días → "Hoy", variant secondary', () => {
    expect(calcularRecencia(hace(0), ahora)).toEqual({ etiqueta: 'Hoy', variant: 'secondary' })
  })

  it('1 día → "Ayer", variant secondary', () => {
    expect(calcularRecencia(hace(1), ahora)).toEqual({ etiqueta: 'Ayer', variant: 'secondary' })
  })

  it(`día ${UMBRAL_RECIENTE_DIAS} (límite reciente inclusive) → "Hace N días", variant secondary`, () => {
    expect(calcularRecencia(hace(UMBRAL_RECIENTE_DIAS), ahora)).toEqual({
      etiqueta: `Hace ${UMBRAL_RECIENTE_DIAS} días`,
      variant: 'secondary',
    })
  })

  it(`día ${UMBRAL_RECIENTE_DIAS + 1} (recién pasado el límite reciente) → "Hace N días", variant outline`, () => {
    expect(calcularRecencia(hace(UMBRAL_RECIENTE_DIAS + 1), ahora)).toEqual({
      etiqueta: `Hace ${UMBRAL_RECIENTE_DIAS + 1} días`,
      variant: 'outline',
    })
  })

  it(`día ${UMBRAL_DIAS_A_MESES} (límite de días inclusive) → "Hace N días", variant outline`, () => {
    expect(calcularRecencia(hace(UMBRAL_DIAS_A_MESES), ahora)).toEqual({
      etiqueta: `Hace ${UMBRAL_DIAS_A_MESES} días`,
      variant: 'outline',
    })
  })

  it(`día ${UMBRAL_DIAS_A_MESES + 1} (recién pasado a meses) → "Hace N meses", variant outline`, () => {
    expect(calcularRecencia(hace(UMBRAL_DIAS_A_MESES + 1), ahora)).toEqual({
      etiqueta: 'Hace 1 meses',
      variant: 'outline',
    })
  })

  it('60 días (2 meses) → "Hace 2 meses", variant outline', () => {
    expect(calcularRecencia(hace(60), ahora)).toEqual({ etiqueta: 'Hace 2 meses', variant: 'outline' })
  })
})
