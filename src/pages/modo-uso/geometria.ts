/**
 * Geometría congelada del tablero de ModoUso (sdd/modo-uso-zona-b, D5).
 *
 * Estos valores fueron capturados TAL COMO ESTABAN en `ModoUso.tsx` antes de
 * esta extracción — esto es un refactor de nombrar-y-congelar, NO un
 * rediseño. `tamanioMinimoTilePx` documenta el `min-h-[120px] min-w-[120px]`
 * ya existente en `PictogramaTile.tsx`'s `CLASE_RAIZ_USO` (variante `uso`),
 * sin re-derivarlo desde ahí ni cambiarlo.
 *
 * Por qué esto importa (spec `board-organization`, "Spatial consistency is a
 * binding forward constraint"): una vez que un paciente entrena una
 * disposición espacial de símbolos, reubicarlos sin una decisión registrada
 * es un error clínico, no cosmético. Congelar esta constante — con
 * `geometria.test.ts` pineando su valor exacto — obliga a que cualquier
 * cambio futuro sea un acto deliberado y revisado: rompe un test en vez de
 * colarse en un refactor no relacionado.
 */
export const GEOMETRIA_TABLERO = {
  /** Columnas del grid principal de pictogramas por breakpoint Tailwind. */
  columnas: { base: 2, sm: 3, md: 4, xl: 5 },
  /** Gap del grid por breakpoint. */
  gap: { base: 2, sm: 3 },
  /** Ancho máximo del contenedor del grid, en px. */
  anchoMaximoPx: 1400,
  /** Tamaño mínimo (alto y ancho) de cada tile, en px — ver nota arriba. */
  tamanioMinimoTilePx: 120,
} as const

/**
 * Clases Tailwind del contenedor del grid, derivadas de `GEOMETRIA_TABLERO`.
 * Tailwind necesita strings literales para su JIT scanner, así que este valor
 * se mantiene como literal pineado (mismo patrón que
 * `CLASE_TILE_USO_BASE_COMMIT` en `tests/modo-uso.spec.ts`) en vez de
 * construirse dinámicamente a partir de los números de arriba. Cualquier
 * edición de esta clase DEBE mantenerse en sync con `GEOMETRIA_TABLERO` y con
 * `geometria.test.ts`.
 */
export const CLASE_GRID_TABLERO =
  'mx-auto grid max-w-[1400px] grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 xl:grid-cols-5'
