import { describe, expect, it } from 'vitest'
import {
  CLASE_ETIQUETA_PREVIEW,
  CLASE_ETIQUETA_USO,
  CLASE_RAIZ_PREVIEW,
  CLASE_RAIZ_USO,
} from './PictogramaTile'

/**
 * Structural guard (sdd/modo-uso-zona-b, D2/D6): the `preview` branch of
 * `PictogramaTile` must never depend on `zona-b-*` tokens (Zona A stays
 * fully independent of Zona B's palette), and the `uso` branch must have
 * zero ad-hoc `amber-`/`slate-`/`white` utilities left after the token
 * migration. Plain vitest, no DOM — these are string constants, not
 * rendered output.
 */
describe('PictogramaTile — class-constant guard (preview vs. uso token isolation)', () => {
  it('CLASE_RAIZ_PREVIEW contiene cero utilidades zona-b-', () => {
    expect(CLASE_RAIZ_PREVIEW).not.toMatch(/zona-b-/)
  })

  it('CLASE_ETIQUETA_PREVIEW contiene cero utilidades zona-b-', () => {
    expect(CLASE_ETIQUETA_PREVIEW).not.toMatch(/zona-b-/)
  })

  it('CLASE_RAIZ_USO contiene cero utilidades amber-/slate-/white ad-hoc', () => {
    expect(CLASE_RAIZ_USO).not.toMatch(/amber-/)
    expect(CLASE_RAIZ_USO).not.toMatch(/slate-/)
    expect(CLASE_RAIZ_USO).not.toMatch(/white/)
  })

  it('CLASE_ETIQUETA_USO contiene cero utilidades amber-/slate-/white ad-hoc', () => {
    expect(CLASE_ETIQUETA_USO).not.toMatch(/amber-/)
    expect(CLASE_ETIQUETA_USO).not.toMatch(/slate-/)
    expect(CLASE_ETIQUETA_USO).not.toMatch(/white/)
  })
})
