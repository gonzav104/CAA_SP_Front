import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { DetalleSkeleton, ErrorCarga } from '../../components/estados'
import { LabelPacienteContexto } from '../../components/LabelPacienteContexto'
import { usePaciente } from '../../hooks/pacientes'
import { useActualizarSesion, useSesion } from '../../hooks/sesiones'
import { nombreCompleto } from '../../lib/paciente'
import { formatError } from '../../lib/utils'
import { sesionSchema, toSesionInput, toSesionValues, type SesionValues } from './schemas'

/**
 * Formulario de edición de sesión (/pacientes/:pacienteId/sesiones/:idSesion/editar, RI-7).
 * Carga la sesión por GET individual (/sesiones/{id}). Ruta protegida por
 * RequiereTerapeuta en el router (solo TERAPEUTA). PUT + navigate back.
 */
export function EditarSesion() {
  const { pacienteId, idSesion } = useParams<{ pacienteId: string; idSesion: string }>()
  const pid = pacienteId
  const sid = idSesion
  const idsValidos = pid !== undefined && pid.trim() !== '' && sid !== undefined && sid.trim() !== ''
  const navigate = useNavigate()
  const pacienteQuery = usePaciente(idsValidos ? pid : undefined)
  const sesionQuery = useSesion(idsValidos ? pid : undefined, idsValidos ? sid : undefined)
  const actualizar = useActualizarSesion()

  const sesion = sesionQuery.data

  const form = useForm<SesionValues>({
    resolver: zodResolver(sesionSchema),
    values: sesion ? toSesionValues(sesion) : undefined,
    defaultValues: {
      fechaHora: '',
      disposicion: '',
      objetivosTrabajados: '',
      observaciones: '',
      estrategiasYProximosPasos: '',
    },
  })

  if (!idsValidos) {
    return <ErrorCarga mensaje="Identificador de sesión inválido." volverA="/pacientes" />
  }

  if (pacienteQuery.isPending || sesionQuery.isPending) {
    return <DetalleSkeleton />
  }

  if (sesionQuery.isError) {
    return (
      <ErrorCarga
        mensaje={formatError(sesionQuery.error)}
        onReintentar={() => void sesionQuery.refetch()}
        volverA={`/pacientes/${pid}/sesiones`}
      />
    )
  }

  if (!sesion) {
    return (
      <ErrorCarga mensaje="No se encontró la sesión." volverA={`/pacientes/${pid}/sesiones`} />
    )
  }

  const guardar = async (values: SesionValues) => {
    try {
      await actualizar.mutateAsync({
        pacienteId: pid,
        sesionId: sid,
        input: toSesionInput(values),
      })
      navigate(`/pacientes/${pid}/sesiones`, { replace: true })
    } catch {
      // El error ya se muestra como toast desde useActualizarSesion.
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <LabelPacienteContexto
            cargando={pacienteQuery.isPending}
            nombre={pacienteQuery.data ? nombreCompleto(pacienteQuery.data) : undefined}
          />
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Editar sesión</h2>
        <p className="mt-1 text-sm text-muted-foreground">Actualizá los datos de la sesión.</p>
      </div>

      <Card className="shadow-sm">
        <CardContent>
          <form onSubmit={form.handleSubmit(guardar)} noValidate className="flex flex-col gap-4">
            <Controller
              control={form.control}
              name="fechaHora"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Fecha y hora</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="datetime-local"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="objetivosTrabajados"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Objetivos trabajados</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={3}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="disposicion"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Disposición</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="observaciones"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Observaciones</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={3}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="estrategiasYProximosPasos"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Estrategias y próximos pasos</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={3}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={actualizar.isPending}
                onClick={() => navigate(`/pacientes/${pid}/sesiones`)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={actualizar.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {actualizar.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
