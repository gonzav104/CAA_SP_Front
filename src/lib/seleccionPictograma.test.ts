/**
 * Unit tests de src/lib/seleccionPictograma.ts — decisión de confirmación del
 * selector de pictogramas (change ux-cartilla-pictogramos, T1.2, D3).
 *
 * Fixtures: Pictograma global (firma REAL del DTO; `arasaacId` presente solo en
 * los materializados — los seedeados sin backfill lo omiten) y ResultadoArasaac
 * (mapeo real de lib/arasaac).
 */
import { describe, expect, it } from 'vitest'
import { decidirConfirmacion } from './seleccionPictograma'
import type { Pictograma } from '../types'
import type { ResultadoArasaac } from './arasaac'

/** Global materializado con backfill de arasaacId (32464 = "agua" real). */
const globalAgua: Pictograma = {
  id: '11111111-1111-4111-8111-111111111111',
  etiqueta: 'agua',
  imagenUrl: 'https://static.arasaac.org/pictograms/32464/32464_300.png',
  creadoEn: '2026-01-01T00:00:00.000Z',
  arasaacId: 32464,
}

/** Global sin backfill (seed de Fase 1): NO trae `arasaacId`. */
const globalSinBackfill: Pictograma = {
  id: '22222222-2222-4222-8222-222222222222',
  etiqueta: 'leche',
  imagenUrl: 'https://static.arasaac.org/pictograms/9999/9999_300.png',
  creadoEn: '2026-01-01T00:00:00.000Z',
}

/** Resultado ARASAAC del mismo pictograma que `globalAgua` pero con OTRA etiqueta. */
const resultadoAguaRenombrado: ResultadoArasaac = {
  arasaacId: 32464, // mismo id que globalAgua
  etiqueta: 'agua (etiqueta distinta)', // NO se usa para matchear
  imagenUrl: 'https://static.arasaac.org/pictograms/32464/32464_300.png',
  schematic: false,
}

/** Resultado ARASAAC NUEVO (sin materializar en globales). */
const resultadoPan: ResultadoArasaac = {
  arasaacId: 555,
  etiqueta: 'pan',
  imagenUrl: 'https://static.arasaac.org/pictograms/555/555_300.png',
  schematic: true,
}

describe('decidirConfirmacion', () => {
  it('global → aplicar con el globalId marcado (sin mirar los globales)', () => {
    expect(
      decidirConfirmacion({ tipo: 'global', globalId: globalAgua.id }, [globalAgua, globalSinBackfill]),
    ).toEqual({ tipo: 'aplicar', elegido: { globalId: globalAgua.id } })
  })

  it('custom → aplicar con el customId marcado', () => {
    expect(decidirConfirmacion({ tipo: 'custom', customId: 'custom-1' }, [])).toEqual({
      tipo: 'aplicar',
      elegido: { customId: 'custom-1' },
    })
  })

  it('arasaac cuyo arasaacId YA está en globales → aplicar con el UUID existente (match por arasaacId, NO por etiqueta)', () => {
    // La etiqueta del resultado difiere de la del global: el match es por arasaacId.
    expect(
      decidirConfirmacion({ tipo: 'arasaac', resultado: resultadoAguaRenombrado }, [globalAgua]),
    ).toEqual({ tipo: 'aplicar', elegido: { globalId: globalAgua.id } })
  })

  it('arasaac nuevo → materializar con arasaacId + etiqueta del resultado', () => {
    expect(
      decidirConfirmacion({ tipo: 'arasaac', resultado: resultadoPan }, [globalAgua]),
    ).toEqual({ tipo: 'materializar', arasaacId: 555, etiqueta: 'pan' })
  })

  it('globales SIN arasaacId (seed sin backfill) → no hay match → materializar', () => {
    expect(
      decidirConfirmacion({ tipo: 'arasaac', resultado: resultadoAguaRenombrado }, [globalSinBackfill]),
    ).toEqual({ tipo: 'materializar', arasaacId: 32464, etiqueta: 'agua (etiqueta distinta)' })
  })
})