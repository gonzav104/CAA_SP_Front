import type { Paciente } from '../types'

/** Nombre completo legible («Ana García», o «Ana» si no hay apellido). */
export function nombreCompleto(paciente: Pick<Paciente, 'nombre' | 'apellido'>): string {
  return [paciente.nombre, paciente.apellido].filter(Boolean).join(' ')
}

/** Iniciales para chips/avatares (p.ej. «Ana María» → «AM»). */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const primera = partes[0]?.charAt(0) ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : ''
  return (primera + ultima).toUpperCase()
}

/**
 * Fecha ISO → formato legible es-AR (p.ej. «15/01/2020»).
 * Las fechas puras «yyyy-mm-dd» (provenientes de un input date) se parsean como
 * UTC por JS; se fuerza medianoche local para no mostrar el día anterior.
 */
export function formatearFechaISO(iso: string): string {
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleDateString('es-AR')
}

/** Edad en años a partir de una fecha ISO (null si no se puede calcular). */
export function calcularEdad(iso: string): number | null {
  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
  if (Number.isNaN(fecha.getTime())) return null
  const hoy = new Date()
  let edad = hoy.getFullYear() - fecha.getFullYear()
  const cumpleAnios = hoy.getMonth() - fecha.getMonth()
  if (cumpleAnios < 0 || (cumpleAnios === 0 && hoy.getDate() < fecha.getDate())) {
    edad -= 1
  }
  return edad
}