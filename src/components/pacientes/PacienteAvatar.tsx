import { iniciales } from '../../lib/paciente'

const TAMANIOS = {
  sm: 'size-9',
  md: 'size-10',
} as const

/**
 * Badge de iniciales del paciente. Única fuente de la marca visual de avatar:
 * la lista de pacientes (TERAPEUTA) y el dashboard familiar (FAMILIAR) la
 * comparten en vez de duplicar el `<span>` con `iniciales()` inline.
 */
export function PacienteAvatar({
  nombre,
  tamanio = 'sm',
}: {
  nombre: string
  tamanio?: 'sm' | 'md'
}) {
  return (
    <span
      className={`flex ${TAMANIOS[tamanio]} shrink-0 items-center justify-center rounded-full bg-sidebar-primary/10 text-sm font-semibold text-sidebar-primary`}
    >
      {iniciales(nombre)}
    </span>
  )
}
