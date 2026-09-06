import { CalendarDays, LayoutGrid, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { CardVacio, DetalleSkeleton, ErrorCarga } from '../../components/estados'
import { useEliminarPaciente, usePaciente } from '../../hooks/pacientes'
import { useAuth } from '../../hooks/useAuth'
import { calcularEdad, formatearFechaISO, nombreCompleto } from '../../lib/paciente'
import { formatError } from '../../lib/utils'

/**
 * Detalle de paciente (PM-3): header con acciones (Editar/Eliminar) + acceso a
 * cartillas. Sesiones y Colaboradores ya no viven acá: tienen páginas propias
 * (/pacientes/:id/sesiones y /pacientes/:id/colaboradores).
 * - Las acciones de edición se gatean con `miPermiso` (LECTURA → solo lectura).
 */
export function PacienteDetalle() {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const id = pacienteId
  const idValido = id !== undefined && id.trim() !== ''
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const esTerapeuta = usuario?.rol === 'TERAPEUTA'
  const pacienteQuery = usePaciente(idValido ? id : undefined)
  const eliminar = useEliminarPaciente()
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)

  if (!idValido) {
    return <ErrorCarga mensaje="Identificador de paciente inválido." volverA="/pacientes" />
  }

  if (pacienteQuery.isPending) {
    return <DetalleSkeleton />
  }

  if (pacienteQuery.isError) {
    return (
      <ErrorCarga
        mensaje={formatError(pacienteQuery.error)}
        onReintentar={() => void pacienteQuery.refetch()}
        volverA="/pacientes"
      />
    )
  }

  const paciente = pacienteQuery.data
  if (!paciente) {
    return <ErrorCarga mensaje="No se encontró el paciente." volverA="/pacientes" />
  }

  // Gestión de pacientes: SOLO terapeutas (un FAMILIAR jamás edita/elimina,
// aunque tenga miPermiso de edición — RI-2).
  const puedeEditar = esTerapeuta && paciente.miPermiso === 'EDICION_LIMITADA'

  const confirmarEliminar = async () => {
    try {
      await eliminar.mutateAsync(paciente.id)
      navigate('/pacientes', { replace: true })
    } catch {
      // El error ya se muestra como toast desde useEliminarPaciente.
    }
  }

  const edad = calcularEdad(paciente.fechaNacimiento)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight">{nombreCompleto(paciente)}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              <CalendarDays className="size-3" aria-hidden="true" />
              Nacimiento: {formatearFechaISO(paciente.fechaNacimiento)}
              {edad !== null && ` · ${edad} ${edad === 1 ? 'año' : 'años'}`}
            </Badge>
          </div>
        </div>

        {puedeEditar && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to={`/pacientes/${paciente.id}/editar`}>
                <Pencil aria-hidden="true" />
                Editar
              </Link>
            </Button>

            <AlertDialog open={confirmandoEliminar} onOpenChange={setConfirmandoEliminar}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 aria-hidden="true" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará «{nombreCompleto(paciente)}» y todos sus datos. Esta acción no se
                    puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={eliminar.isPending}
                    onClick={(event) => {
                      event.preventDefault()
                      void confirmarEliminar()
                    }}
                  >
                    {eliminar.isPending ? 'Eliminando…' : 'Eliminar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <CardVacio
        icono={<LayoutGrid className="size-5" aria-hidden="true" />}
        titulo="Cartillas"
        descripcion="Cartillas de comunicación del paciente: revisión, edición y modo de uso."
      >
        <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
          <Link to={`/pacientes/${paciente.id}/cartillas`}>
            <LayoutGrid aria-hidden="true" />
            Administrar cartillas
          </Link>
        </Button>
      </CardVacio>
    </div>
  )
}
