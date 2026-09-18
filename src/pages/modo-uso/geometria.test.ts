import { describe, expect, it } from 'vitest'
import { CLASE_GRID_TABLERO, GEOMETRIA_TABLERO } from './geometria'

/**
 * Congela la geometría del tablero de ModoUso (sdd/modo-uso-zona-b, D5): estos
 * valores fueron capturados TAL COMO ESTABAN antes de esta extracción — esto
 * es un refactor de nombrar-y-congelar, no un rediseño. Un cambio futuro a
 * cualquiera de estos valores debe ser un acto deliberado y revisado, nunca
 * algo que se cuele en un refactor no relacionado (spec `board-organization`,
 * "Spatial consistency is a binding forward constraint"). Mismo patrón que
 * `CLASE_TILE_USO_BASE_COMMIT` en `tests/modo-uso.spec.ts`.
 */
describe('GEOMETRIA_TABLERO — geometría del tablero congelada', () => {
  it('pinea exactamente los valores capturados', () => {
    expect(GEOMETRIA_TABLERO).toEqual({
      columnas: { base: 2, sm: 3, md: 4, xl: 5 },
      gap: { base: 2, sm: 3 },
      anchoMaximoPx: 1400,
      tamanioMinimoTilePx: 120,
    })
  })

  it('pinea exactamente la clase Tailwind del grid derivada de la geometría', () => {
    expect(CLASE_GRID_TABLERO).toBe(
      'mx-auto grid max-w-[1400px] grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5',
    )
  })
})
