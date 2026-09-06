import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { DetalleSkeleton, ErrorCarga } from '../../components/estados'
import { LabelPacienteContexto } from '../../components/LabelPacienteContexto'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { useAgregarColaborador } from '../../hooks/colaboradores'
import { usePaciente } from '../../hooks/pacientes'
import { nombreCompleto } from '../../lib/paciente'
import { formatError } from '../../lib/utils'
import type { Permiso } from '../../types'

/**
 * Schema del formulario de agregar colaborador (RI-10): RHF + zodResolver.
 * email (req, formato email) y permiso (req, LECTURA | EDICION_LIMITADA).
 */
const colaboradorSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
  permiso: z.enum(['LECTURA', 'EDICION_LIMITADA']),
})

type ColaboradorValues = z.infer<typeof colaboradorSchema>

const PERMISOS: Array<{ valor: Permiso; etiqueta: string; descripcion: string }> = [
  { valor: 'EDICION_LIMITADA', etiqueta: 'Edición limitada', descripcion: 'Puede editar cartillas' },
  { valor: 'LECTURA', etiqueta: 'Solo lectura', descripcion: 'Solo puede ver' },
]

/**
 * Formulario de agregar colaborador (/pacientes/:pacienteId/colaboradores/agregar, RI-10).
 * Página propia (2+ campos). POST + navigate back.
 */
export function AgregarColaborador() {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const id = pacienteId
  const idValido = id !== undefined && id.trim() !== ''
  const navigate = useNavigate()
  const pacienteQuery = usePaciente(idValido ? id : undefined)
  const agregar = useAgregarColaborador()

  const form = useForm<ColaboradorValues>({
    resolver: zodResolver(colaboradorSchema),
    defaultValues: { email: '', permiso: 'LECTURA' },
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

  const guardar = async (values: ColaboradorValues) => {
    try {
      await agregar.mutateAsync({
        pacienteId: id,
        input: { email: values.email.trim(), permiso: values.permiso },
      })
      navigate(`/pacientes/${id}/colaboradores`, { replace: true })
    } catch {
      // El error ya se muestra como toast desde useAgregarColaborador.
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
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Agregar colaborador</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La persona debe tener una cuenta en CAA para poder sumarla.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent>
          <form onSubmit={form.handleSubmit(guardar)} noValidate className="flex flex-col gap-4">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    placeholder="correo@ejemplo.com"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="permiso"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="permiso">Permiso</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="permiso"
                      aria-invalid={fieldState.invalid}
                      className="w-full"
                    >
                      <SelectValue placeholder="Elegí un permiso" />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISOS.map((permiso) => (
                        <SelectItem key={permiso.valor} value={permiso.valor}>
                          {permiso.etiqueta} — {permiso.descripcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={agregar.isPending}
                onClick={() => navigate(`/pacientes/${id}/colaboradores`)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={agregar.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {agregar.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                Agregar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
