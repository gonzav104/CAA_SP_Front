/**
 * Derivaciones puras consumidas por `PacienteOverview` (design/spec
 * `sdd/paciente-overview`, obs #65/#64). PR1 (obs #66, Fase 1): net-new,
 * sin consumidor todavía — se consumen recién desde PR3a/PR3b.
 */
import type { Cartilla } from '../types/Cartilla'
import type { Sesion } from '../types/Sesion'

/**
 * Cartilla marcada como principal (entrada directa del hero de la overview).
 * `undefined` cuando no hay ninguna marcada, o cuando el array está vacío
 * (paciente sin cartillas) — ambos casos exigen un estado definido en la UI,
 * nunca una omisión silenciosa (spec "No principal cartilla defined").
 */
export function encontrarCartillaPrincipal(cartillas: Cartilla[]): Cartilla | undefined {
  return cartillas.find((cartilla) => cartilla.esPrincipal)
}

/**
 * Sesión con `fechaHora` más reciente (para la tarjeta resumen de Sesiones).
 * `undefined` con array vacío (paciente sin sesiones aún) — habilita el
 * estado vacío definido de la spec en vez de una omisión silenciosa.
 */
export function sesionMasReciente(sesiones: Sesion[]): Sesion | undefined {
  return sesiones.reduce<Sesion | undefined>((masReciente, actual) => {
    if (!masReciente) return actual
    return new Date(actual.fechaHora) > new Date(masReciente.fechaHora) ? actual : masReciente
  }, undefined)
}

/**
 * Umbral (en días) hasta el cual la recencia se considera "reciente"
 * (`variant: 'secondary'`). Nombrada en vez de un número mágico para que sea
 * ajustable sin impacto en la spec (design call #3, `sdd/paciente-overview`).
 */
export const UMBRAL_RECIENTE_DIAS = 7

/**
 * Umbral (en días) a partir del cual la etiqueta pasa de "Hace N días" a
 * "Hace N meses". Nombrada por el mismo motivo que `UMBRAL_RECIENTE_DIAS`.
 */
export const UMBRAL_DIAS_A_MESES = 30

/** Bucket de recencia devuelto por `calcularRecencia`. */
export interface Recencia {
  etiqueta: string
  variant: 'secondary' | 'outline'
}

/**
 * Etiqueta de recencia relativa + variant no-solo-color para una fecha ISO,
 * comparada contra `ahora` (inyectado para determinismo en tests).
 *
 * Buckets (spec "Cross-section summary" + design call #3):
 * - 0 días → "Hoy"; 1 día → "Ayer"; ambos `secondary`.
 * - 2..UMBRAL_RECIENTE_DIAS días → "Hace N días", `secondary`.
 * - (UMBRAL_RECIENTE_DIAS, UMBRAL_DIAS_A_MESES] días → "Hace N días", `outline`.
 * - > UMBRAL_DIAS_A_MESES días → "Hace N meses" (N = días / 30, truncado), `outline`.
 */
export function calcularRecencia(fechaISO: string, ahora: Date): Recencia {
  const fecha = new Date(fechaISO)
  const msPorDia = 1000 * 60 * 60 * 24
  const dias = Math.floor((ahora.getTime() - fecha.getTime()) / msPorDia)

  if (dias <= 0) return { etiqueta: 'Hoy', variant: 'secondary' }
  if (dias === 1) return { etiqueta: 'Ayer', variant: 'secondary' }
  if (dias <= UMBRAL_RECIENTE_DIAS) return { etiqueta: `Hace ${dias} días`, variant: 'secondary' }
  if (dias <= UMBRAL_DIAS_A_MESES) return { etiqueta: `Hace ${dias} días`, variant: 'outline' }

  const meses = Math.floor(dias / UMBRAL_DIAS_A_MESES)
  return { etiqueta: `Hace ${meses} meses`, variant: 'outline' }
}
