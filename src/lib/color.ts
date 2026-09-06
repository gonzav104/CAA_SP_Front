/**
 * Colores dinámicos (D8). Zona B los usa como fondo de categorías; la Zona A
 * los usa SOLO como dot/chip/strip pequeño — nunca como fondo de un contenedor.
 * El color es dato del backend (categoria.colorHex); estos helpers son la única
 * vía para traducirlo a estilo, porque las clases Tailwind dinámicas se purgan
 * en build.
 */

/** Fallback cuando el backend manda un color inválido o ausente. */
export const COLOR_FALLBACK = '#94a3b8'

/** Valida `#rrggbb`; cualquier otro valor (incluido null/undefined) → fallback. */
export function normalizeColorHex(hex: string | null | undefined): string {
  const valor = hex?.trim() ?? ''
  return /^#[0-9a-fA-F]{6}$/.test(valor) ? valor : COLOR_FALLBACK
}

/**
 * Paleta Fitzgerald key (AGENTS.md): el backend manda categoria.colorHex; estos
 * swatches son la elección que ofrece el editor al crear/editar una categoría
 * (el color es contrato del backend, el swatch es elección de UI).
 */
export const COLORES_FITZGERALD = [
  { nombre: 'Verde', valor: '#22c55e' }, // verbos
  { nombre: 'Amarillo', valor: '#eab308' }, // sustantivos / comidas
  { nombre: 'Azul', valor: '#3b82f6' }, // sentimientos
  { nombre: 'Rosa', valor: '#ec4899' }, // personas
  { nombre: 'Naranja', valor: '#f97316' }, // preguntas
  { nombre: 'Rojo', valor: '#ef4444' }, // negación
] as const