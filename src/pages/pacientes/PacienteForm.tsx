import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { pacienteSchema, type PacienteValues } from './schemas'

interface PacienteFormProps {
  /** Valores iniciales (edición); al omitirse arranca vacío (creación). */
  defaultValues?: PacienteValues
  submitting: boolean
  submitLabel: string
  /** Destino del botón «Cancelar» (lista o detalle, según el flujo). */
  cancelTo: string
  onSubmit: (values: PacienteValues) => void
}

/**
 * Formulario compartido de paciente — RHF + zodResolver (D5).
 * Se usa en la creación (NuevoPaciente) y en la edición (EditarPaciente),
 * siempre en página propia (AGENTS.md: forms de 2+ campos nunca en modal).
 */
export function PacienteForm({
  defaultValues,
  submitting,
  submitLabel,
  cancelTo,
  onSubmit,
}: PacienteFormProps) {
  const form = useForm<PacienteValues>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: defaultValues ?? { nombre: '', apellido: '', fechaNacimiento: '' },
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Controller
        control={form.control}
        name="nombre"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
            <Input
              {...field}
              id={field.name}
              autoComplete="off"
              placeholder="Nombre del paciente"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="apellido"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Apellido</FieldLabel>
            <Input
              {...field}
              id={field.name}
              autoComplete="off"
              placeholder="Apellido del paciente"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="fechaNacimiento"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Fecha de nacimiento</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="date"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link to={cancelTo}>Cancelar</Link>
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}