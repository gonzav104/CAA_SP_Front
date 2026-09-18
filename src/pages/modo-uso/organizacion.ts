import type { CartillaDetalle } from '../../types/Cartilla'

/**
 * Paradigmas de organización del tablero de ModoUso (sdd/modo-uso-zona-b,
 * D6 — obs #118/#119).
 *
 * - `'taxonomica'`: navegación por categoría (grid actual, sin cambios).
 * - `'esquematica'`: agrupamiento por actividad/escena en vez de categoría
 *   léxica. Habilitado desde PR4b, que lee el campo real del backend.
 * - `'escena-visual'`: Visual Scene Display. Declarado acá porque el
 *   paradigma existe conceptualmente (ASHA/Light et al. 2019, obs #118), pero
 *   `organizacionDeCartilla` NUNCA lo devuelve: VSD necesita una imagen de
 *   escena de fondo más coordenadas de hotspot por ítem, y ni
 *   `CategoriaDetalle` ni `ItemDetalle` traen ese dato (verificado en fuente,
 *   obs #119). Un VSD degradado es clínicamente peor que no tenerlo (S14/C9).
 *   Queda fuera de alcance de todo `modo-uso-zona-b`.
 */
export type OrganizacionTablero = 'taxonomica' | 'esquematica' | 'escena-visual'

/** Paradigma usado cuando el campo real está ausente o no es reconocido. */
export const ORGANIZACION_POR_DEFECTO: OrganizacionTablero = 'taxonomica'

/**
 * Guarda de runtime: sólo los dos valores que el backend efectivamente envía
 * (verificado en fuente, obs #119; contrato real confirmado en PR4b) son
 * válidos. `'escena-visual'` y cualquier otro string caen acá — la guarda
 * queda en `unknown` a propósito, para cubrir dato corrupto/legado además
 * del caso tipado.
 */
function esParadigmaValido(valor: unknown): valor is OrganizacionTablero {
  return valor === 'taxonomica' || valor === 'esquematica'
}

/**
 * Único punto donde se resuelve el paradigma de organización del tablero.
 *
 * Desde PR4b, `CartillaDetalle.paradigma` es el campo real del backend
 * (`caa_sp`, commit `1c52cb6`): valores `'taxonomica'`/`'esquematica'`,
 * byte-a-byte iguales al wire format. Se lee y valida ACÁ y en ningún otro
 * lado — `ModoUso` sólo consume el valor de retorno de esta función.
 *
 * `'escena-visual'` nunca puede llegar tipado desde `CartillaDetalle`
 * (el campo no lo incluye), pero la validación de runtime sigue existiendo
 * para dato corrupto/legado — cualquier valor no reconocido cae al default,
 * nunca revienta ni propaga un valor inválido.
 */
export function organizacionDeCartilla(cartilla: CartillaDetalle): OrganizacionTablero {
  return esParadigmaValido(cartilla.paradigma) ? cartilla.paradigma : ORGANIZACION_POR_DEFECTO
}
