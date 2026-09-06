import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Textarea } from '../../components/ui/textarea'
import { usePaciente } from '../../hooks/pacientes'
import { useCrearSesion } from '../../hooks/sesiones'
import { formatError } from '../../lib/utils'
import { DetalleSkeleton, ErrorCarga } from '../../components/estados'
import { LabelPacienteContexto } from '../../components/LabelPacienteContexto'
import { nombreCompleto } from '../../lib/paciente'
import { sesionSchema, toSesionInput, type SesionValues } from './schemas'

/**
 * Formulario de creación de sesión (/pacientes/:pacienteId/sesiones/nuevo, RI-7).
 * Página propia (5+ campos): fechaHora (req), objetivosTrabajados (req),
 * disposicion/observaciones/estrategiasYProximosPasos (opcionales).
 * POST + navigate back.
 */
export function NuevaSesion() {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const id = pacienteId
  const idValido = id !== undefined && id.trim() !== ''
  const navigate = useNavigate()
  const pacienteQuery = usePaciente(idValido ? id : undefined)
  const crear = useCrearSesion()

  // RHF se monta una sola vez (form vacío).
  const form = useForm<SesionValues>({
    resolver: zodResolver(sesionSchema),
    defaultValues: {
      fechaHora: '',
      disposicion: '',
      objetivosTrabajados: '',
      observaciones: '',
      estrategiasYProximosPasos: '',
    },
  })

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

  const guardar = async (values: SesionValues) => {
    try {
      await crear.mutateAsync({ pacienteId: id, input: toSesionInput(values) })
      navigate(`/pacientes/${id}/sesiones`, { replace: true })
    } catch {
      // El error ya se muestra como toast desde useCrearSesion.
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <LabelPacienteContexto
            cargando={false}
            nombre={pacienteQuery.data ? nombreCompleto(pacienteQuery.data) : undefined}
          />
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Nueva sesión</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Registrá el trabajo realizado en la sesión con el paciente.
        </p>
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
                    placeholder="p.ej. Vocabulario de acciones, turnos de espera…"
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
                    placeholder="p.ej. Mesa, cara a cara"
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
                disabled={crear.isPending}
                onClick={() => navigate(`/pacientes/${id}/sesiones`)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={crear.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {crear.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                Guardar sesión
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
