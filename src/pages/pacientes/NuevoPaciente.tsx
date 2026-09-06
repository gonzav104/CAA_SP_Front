import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../../components/ui/card'
import { useCrearPaciente } from '../../hooks/pacientes'
import { PacienteForm } from './PacienteForm'
import { toPacienteInput, type PacienteValues } from './schemas'

/**
 * Creación de paciente en página propia (PM-2 / AGENTS.md: forms de 2+ campos
 * nunca en modal). Submit → POST /api/pacientes → toast → detalle del paciente.
 */
export function NuevoPaciente() {
  const navigate = useNavigate()
  const crear = useCrearPaciente()

  const manejarSubmit = async (values: PacienteValues) => {
    try {
      const paciente = await crear.mutateAsync(toPacienteInput(values))
      navigate(`/pacientes/${paciente.id}`)
    } catch {
      // El error ya se muestra como toast desde useCrearPaciente.
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Nuevo paciente</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Completá los datos básicos del paciente.
        </p>
      </div>
      <Card className="shadow-sm">
        <CardContent>
          <PacienteForm
            submitting={crear.isPending}
            submitLabel="Crear paciente"
            cancelTo="/pacientes"
            onSubmit={manejarSubmit}
          />
        </CardContent>
      </Card>
    </div>
  )
}