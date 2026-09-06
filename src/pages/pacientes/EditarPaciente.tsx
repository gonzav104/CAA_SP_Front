import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent } from '../../components/ui/card'
import { useActualizarPaciente, usePaciente } from '../../hooks/pacientes'
import { nombreCompleto } from '../../lib/paciente'
import { formatError } from '../../lib/utils'
import { DetalleSkeleton, ErrorCarga } from '../../components/estados'
import { PacienteForm } from './PacienteForm'
import { toPacienteInput, toPacienteValues, type PacienteValues } from './schemas'

/**
 * Edición de paciente en página propia: carga el detalle y reutiliza el mismo
 * form de creación (PUT /api/pacientes/{id}). El `key` fuerza el remount del
 * form con los valores frescos al navegar entre pacientes.
 */
export function EditarPaciente() {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const id = pacienteId
  const idValido = id !== undefined && id.trim() !== ''
  const navigate = useNavigate()
  const pacienteQuery = usePaciente(idValido ? id : undefined)
  const actualizar = useActualizarPaciente()

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

  const manejarSubmit = async (values: PacienteValues) => {
    try {
      await actualizar.mutateAsync({ id: paciente.id, input: toPacienteInput(values) })
      navigate(`/pacientes/${paciente.id}`)
    } catch {
      // El error ya se muestra como toast desde useActualizarPaciente.
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Editar paciente</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Actualizá los datos de {nombreCompleto(paciente)}.
        </p>
      </div>
      <Card className="shadow-sm">
        <CardContent>
          <PacienteForm
            key={paciente.id}
            defaultValues={toPacienteValues(paciente)}
            submitting={actualizar.isPending}
            submitLabel="Guardar cambios"
            cancelTo={`/pacientes/${paciente.id}`}
            onSubmit={manejarSubmit}
          />
        </CardContent>
      </Card>
    </div>
  )
}