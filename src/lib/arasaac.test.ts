/**
 * Unit tests de src/lib/arasaac.ts — mapeo del response de la API pública de ARASAAC
 * (AD-5 del change editor-cartillas-unificado, task 4.1).
 *
 * Fixtures REALES: response de `GET https://api.arasaac.org/api/pictograms/es/search/agua`
 * (curl ejecutado 2026-09-08, 54 resultados). Verificado sobre el response real:
 * - `_id` numérico (32464, 2248, 37273, 27278...); `schematic` boolean (19 true / 35 false);
 *   `score` opcional (ausente en varios ítems).
 * - `keywords[].type` es NÚMERO 1..5 (distribución real: 51×type 2, 38×type 3, 2×type 5, 1×type 1).
 * - NINGÚN ítem trae el campo `language`.
 * - Contrato frágil confirmado: el ítem `_id=27278` trae `desc` y los demás no.
 *
 * Los fixtures inválidos usan `as unknown as ResultadoArasaacRaw` para no pisar el tipo
 * (nota de apply Fase 1: tsconfig.app incluye "src" con strict — los test files typecheckean).
 */
import { describe, it, expect } from 'vitest'
import { mapearResultadoArasaac, imagenUrlArasaac } from './arasaac'
import type { ResultadoArasaacRaw } from './arasaac'

/** Ítem 1 del response real de "agua" (schematic: true, un keyword, sin score). */
const realAguaSchematico = {
  _id: 32464,
  created: '2018-01-29T18:19:48.000Z',
  downloads: 0,
  tags: ['feeding', 'food', 'beverage', 'core vocabulary'],
  synsets: ['07951744-n', '14869913-n'],
  sex: false,
  lastUpdated: '2021-02-04T19:15:45.398Z',
  schematic: true,
  keywords: [
    {
      keyword: 'agua',
      type: 2,
      meaning:
        'f. Sustancia cuyas moléculas están formadas por la combinación de un átomo de oxígeno y dos de hidrógeno, líquida, inodora, insípida e incolora. Es el componente más abundante de la superficie terrestre.',
      plural: 'aguas',
      hasLocution: true,
    },
  ],
  categories: ['beverage', 'core vocabulary-feeding'],
  violence: false,
  hair: false,
  skin: false,
  aac: true,
  aacColor: false,
}

/** Ítem real con 2 keywords y `score` (schematic: true). */
const realAguaMultiKeyword = {
  _id: 37273,
  schematic: true,
  sex: false,
  violence: false,
  aac: false,
  aacColor: false,
  skin: true,
  hair: false,
  downloads: 0,
  categories: ['verb', 'swimming'],
  synsets: ['01908286-v'],
  tags: ['communication', 'language', 'verb', 'leisure', 'sport', 'swimming'],
  keywords: [
    { keyword: 'flotar en el agua', type: 3, hasLocution: false },
    { keyword: 'posición de estrella', hasLocution: false, type: 2 },
  ],
  created: '2021-01-07T08:36:30.212Z',
  lastUpdated: '2021-01-07T12:27:25.064Z',
  score: 6.25,
}

/** Ítem real con 4 keywords + campo `desc` que los demás ítems NO traen (schematic: false). */
const realAguaCuatroKeywords = {
  _id: 27278,
  created: '2012-08-30T20:09:21.000Z',
  downloads: 0,
  tags: [
    'communication',
    'language',
    'verb',
    'leisure',
    'sport',
    'swimming',
    'outdoor activity',
    'swimming pool',
  ],
  synsets: ['01925957-v', '02019450-v'],
  sex: false,
  lastUpdated: '2020-12-12T00:05:46.547Z',
  schematic: false,
  keywords: [
    {
      type: 3,
      meaning: 'tr. Recorrer yendo hacia arriba, remontar por una escalera con pocos escalones.',
      plural: '',
      keyword: 'subir por la escalerilla',
      hasLocution: false,
    },
    {
      type: 3,
      meaning: 'tr. Pasar de dentro afuera del agua de la piscina.',
      plural: '',
      keyword: 'salir de la piscina',
      hasLocution: false,
    },
    { type: 3, meaning: 'tr. Pasar de dentro afuera del agua.', plural: '', keyword: 'salir del agua', hasLocution: false },
    { keyword: 'salir de la pileta', hasLocution: false, type: 3 },
  ],
  desc: '',
  categories: ['verb', 'swimming', 'swimming pool'],
  violence: false,
  hair: true,
  skin: true,
  aac: false,
  aacColor: false,
  score: 6.666666666666666,
}

/** Ítem real no esquemático (schematic: false, un keyword). */
const realAguaNoSchematico = {
  _id: 2248,
  created: '2007-12-12T10:05:23.000Z',
  downloads: 0,
  tags: ['feeding', 'food', 'beverage', 'mineral rich food'],
  synsets: ['07951744-n', '14869913-n'],
  sex: false,
  lastUpdated: '2020-05-29T14:55:44.924Z',
  schematic: false,
  keywords: [
    {
      keyword: 'agua',
      type: 2,
      meaning:
        'f. Sustancia cuyas moléculas están formadas por la combinación de un átomo de oxígeno y dos de hidrógeno, líquida, inodora, insípida e incolora. Es el componente más abundante de la superficie terrestre.',
      plural: 'aguas',
      hasLocution: true,
    },
  ],
  categories: ['beverage', 'mineral rich food'],
  violence: false,
  hair: false,
  skin: false,
  aac: false,
  aacColor: false,
}

const URL_AGUA_32464 = 'https://static.arasaac.org/pictograms/32464/32464_300.png'

describe('mapearResultadoArasaac', () => {
  it('mapea el fixture REAL del curl "agua": etiqueta = primer keyword, URL del CDN', () => {
    expect(mapearResultadoArasaac(realAguaSchematico)).toEqual({
      arasaacId: 32464,
      etiqueta: 'agua',
      imagenUrl: URL_AGUA_32464,
      schematic: true,
    })
  })

  it('el response real NO trae el campo `language` y el mapeo no lo requiere', () => {
    expect('language' in realAguaSchematico).toBe(false)
    expect(mapearResultadoArasaac(realAguaSchematico)?.etiqueta).toBe('agua')
  })

  it('con múltiples keywords usa el PRIMERO (el API ya ordena por relevancia)', () => {
    const conDos = mapearResultadoArasaac(realAguaMultiKeyword)
    expect(conDos?.etiqueta).toBe('flotar en el agua') // type 3, NO "posición de estrella" (type 2)
    expect(conDos?.schematic).toBe(true)

    const conCuatro = mapearResultadoArasaac(realAguaCuatroKeywords)
    expect(conCuatro?.etiqueta).toBe('subir por la escalerilla')
  })

  it('tolera campos extra del response real (tags, categories, `desc` solo en _id=27278)', () => {
    expect(mapearResultadoArasaac(realAguaCuatroKeywords)).toEqual({
      arasaacId: 27278,
      etiqueta: 'subir por la escalerilla',
      imagenUrl: 'https://static.arasaac.org/pictograms/27278/27278_300.png',
      schematic: false,
    })
  })

  it('keywords vacías → fallback `Pictograma {_id}`', () => {
    expect(
      mapearResultadoArasaac({ _id: 32464, keywords: [], schematic: false }),
    ).toEqual({
      arasaacId: 32464,
      etiqueta: 'Pictograma 32464',
      imagenUrl: URL_AGUA_32464,
      schematic: false,
    })
  })

  it('sin array de keywords (undefined) → fallback `Pictograma {_id}`', () => {
    const sinKeywords = { _id: 32464, schematic: false } as unknown as ResultadoArasaacRaw
    expect(mapearResultadoArasaac(sinKeywords)?.etiqueta).toBe('Pictograma 32464')
  })

  it('primer keyword vacío pero segundo con valor → usa el segundo (fallback 2)', () => {
    const mutado = {
      _id: 39004, // ítem real "hervidor de agua" mutado: primer keyword vacío
      keywords: [
        { keyword: '', type: 2 },
        { keyword: 'hervidor', type: 2 },
      ],
      schematic: false,
    }
    expect(mapearResultadoArasaac(mutado)?.etiqueta).toBe('hervidor')
  })

  it('primer keyword con `keyword` undefined y segundo con valor → usa el segundo (contrato frágil)', () => {
    const mutado = {
      _id: 39004,
      keywords: [
        { type: 2, meaning: '...' },
        { keyword: 'hervidor', type: 2 },
      ],
      schematic: false,
    } as unknown as ResultadoArasaacRaw
    expect(mapearResultadoArasaac(mutado)?.etiqueta).toBe('hervidor')
  })

  it('keywords no utilizables (solo vacíos/undefined) → fallback `Pictograma {_id}`', () => {
    const mutado = {
      _id: 39004,
      keywords: [
        { type: 2 },
        { keyword: '', type: 2 },
      ],
      schematic: false,
    } as unknown as ResultadoArasaacRaw
    expect(mapearResultadoArasaac(mutado)?.etiqueta).toBe('Pictograma 39004')
  })

  it('_id 0 → null (se filtra del grid)', () => {
    expect(
      mapearResultadoArasaac({ _id: 0, keywords: [{ keyword: 'agua', type: 2 }], schematic: false }),
    ).toBeNull()
  })

  it('_id negativo → null', () => {
    expect(
      mapearResultadoArasaac({ _id: -1, keywords: [{ keyword: 'agua', type: 2 }], schematic: false }),
    ).toBeNull()
  })

  it('_id no entero (3.5) → null', () => {
    expect(
      mapearResultadoArasaac({ _id: 3.5, keywords: [{ keyword: 'agua', type: 2 }], schematic: false }),
    ).toBeNull()
  })

  it('_id NaN → null', () => {
    expect(
      mapearResultadoArasaac({ _id: Number.NaN, keywords: [{ keyword: 'agua', type: 2 }], schematic: false }),
    ).toBeNull()
  })

  it('_id string → null', () => {
    expect(
      mapearResultadoArasaac({ _id: '32464', keywords: [{ keyword: 'agua', type: 2 }], schematic: false } as unknown as ResultadoArasaacRaw),
    ).toBeNull()
  })

  it('_id undefined → null', () => {
    expect(
      mapearResultadoArasaac({ keywords: [{ keyword: 'agua', type: 2 }], schematic: false } as unknown as ResultadoArasaacRaw),
    ).toBeNull()
  })

  it('schematic true y false AMBOS mapean (no se filtra por schematic)', () => {
    expect(mapearResultadoArasaac(realAguaSchematico)?.schematic).toBe(true)
    expect(mapearResultadoArasaac(realAguaNoSchematico)).toEqual({
      arasaacId: 2248,
      etiqueta: 'agua',
      imagenUrl: 'https://static.arasaac.org/pictograms/2248/2248_300.png',
      schematic: false,
    })
  })

  it('schematic ausente → schematic false (tolerancia al contrato frágil)', () => {
    const sinSchematic = {
      _id: 32464,
      keywords: [{ keyword: 'agua', type: 2 }],
    } as unknown as ResultadoArasaacRaw
    expect(mapearResultadoArasaac(sinSchematic)).toEqual({
      arasaacId: 32464,
      etiqueta: 'agua',
      imagenUrl: URL_AGUA_32464,
      schematic: false,
    })
  })
})

describe('imagenUrlArasaac', () => {
  it('id válido → URL 300px del CDN estático', () => {
    expect(imagenUrlArasaac(32464)).toBe(URL_AGUA_32464)
    expect(imagenUrlArasaac(2248)).toBe('https://static.arasaac.org/pictograms/2248/2248_300.png')
  })

  it('id no numérico positivo NO se valida acá: interpola igual (la validación vive en mapearResultadoArasaac)', () => {
    // Comportamiento REAL de la implementación actual: imagenUrlArasaac es una función
    // pura de interpolación sin guards; el filtrado de `_id` inválidos ocurre ANTES,
    // en mapearResultadoArasaac (devuelve null), nunca llamando a imagenUrlArasaac.
    expect(imagenUrlArasaac(0)).toBe('https://static.arasaac.org/pictograms/0/0_300.png')
    expect(imagenUrlArasaac(-5)).toBe('https://static.arasaac.org/pictograms/-5/-5_300.png')
  })
})