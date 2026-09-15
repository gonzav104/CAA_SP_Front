import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'
import { nombreCompleto } from '../../lib/paciente'
import type { Paciente } from '../../types'

/**
 * Diálogo de confirmación de eliminación de un paciente. Es controlado: la
 * página dueña de la selección (`aEliminar`) y de `useEliminarPaciente()` es
 * quien decide cuándo abrirlo (`paciente !== null`) y qué hacer al confirmar.
 * Presentacional a propósito para poder reutilizarse en otros flujos de
 * confirmación destructiva sin arrastrar el hook de mutación de pacientes.
 */
export function EliminarPacienteDialog({
  paciente,
  onOpenChange,
  onConfirmar,
  pendiente,
}: {
  paciente: Paciente | null
  onOpenChange: (abierto: boolean) => void
  onConfirmar: () => void | Promise<void>
  pendiente: boolean
}) {
  return (
    <AlertDialog open={paciente !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
          <AlertDialogDescription>
            {paciente
              ? `Se eliminará «${nombreCompleto(paciente)}» y todos sus datos. Esta acción no se puede deshacer.`
              : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pendiente}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pendiente}
            onClick={(event) => {
              event.preventDefault()
              void onConfirmar()
            }}
          >
            {pendiente ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
