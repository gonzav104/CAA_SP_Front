import type { CartillaDetalle } from '../../types/Cartilla'

/**
 * Paradigmas de organización del tablero de ModoUso (sdd/modo-uso-zona-b,
 * D6 — obs #118/#119).
 *
 * - `'taxonomica'`: navegación por categoría (grid actual, sin cambios).
 * - `'esquematica'`: agrupamiento por actividad/escena en vez de categoría
 *   léxica. Habilitado por el corte 4b (bloqueado, obs #119) una vez que el
 *   backend exponga el campo real.
 * - `'escena-visual'`: Visual Scene Display. Declarado acá porque el
 *   paradigma existe conceptualmente (ASHA/Light et al. 2019, obs #118), pero
 *   `organizacionDeCartilla` NUNCA lo devuelve: VSD necesita una imagen de
 *   escena de fondo más coordenadas de hotspot por ítem, y ni
 *   `CategoriaDetalle` ni `ItemDetalle` traen ese dato (verificado en fuente,
 *   obs #119). Un VSD degradado es clínicamente peor que no tenerlo (S14/C9).
 *   Queda fuera de alcance de todo `modo-uso-zona-b`.
 */
export type OrganizacionTablero = 'taxonomica' | 'esquematica' | 'escena-visual'

/** Paradigma usado cuando no hay (todavía) un campo de backend que leer. */
export const ORGANIZACION_POR_DEFECTO: OrganizacionTablero = 'taxonomica'

/**
 * Único punto donde se resuelve el paradigma de organización del tablero.
 *
 * Hoy `CartillaDetalle` no trae ningún campo de paradigma (verificado en
 * fuente, obs #119) — este adaptador devuelve el default incondicionalmente.
 * Es un seam deliberado, no todavía una feature (obs #119/#115): cuando el
 * backend exponga el campo real (PR4b, bloqueado en obs #119), se lee y
 * valida ACÁ y en ningún otro lado. `ModoUso` ya rama sobre este valor de
 * retorno, así que el trabajo futuro de PR4b es "cablear el valor real" en
 * vez de "agregar ramificación por primera vez".
 *
 * `_cartilla` no se usa todavía — queda en la firma para que PR4b no rompa
 * el contrato del llamador al empezar a leerla.
 */
export function organizacionDeCartilla(_cartilla: CartillaDetalle): OrganizacionTablero {
  return ORGANIZACION_POR_DEFECTO
}
