import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { useActualizarCategoria, useCrearCategoria } from '../../hooks/cartillas'
import { COLORES_FITZGERALD } from '../../lib/color'
import { cn } from '../../lib/utils'
import {
  categoriaSchema,
  toCategoriaInput,
  type CategoriaValues,
} from './schemas'

/**
 * FormCategoriaInline (AD-6): alta/edición inline de una categoría SIN modal
 * (regla AGENTS.md: form multi-campo va en el editor, no en Dialog).
 *
 * - Usa RHF + categoriaSchema (nombre + swatch Fitzgerald).
 * - Según si llega `categoriaId` crea o actualiza; cada submit = mutateAsync →
 *   los hooks invalidan `cartillaKeys.detail` UNA vez (RF-04).
 * - Vive en la card de la categoría (edición) o al pie del editor (alta / cat. vacía).
 * - `onCancelar` (opcional) cierra el form (vuelve al modo vista de la card o
 *   esconde el alta). Si se omite no se muestra el botón Cancelar — el caso de
 *   cartilla vacía no tiene un estado previo al que volver.
 * - `onCreada` (opcional) se dispara SOLO en la rama de alta, con el id de la
 *   categoría recién creada (permite encadenar acciones, p. ej. abrir el form
 *   de item del primer item). La rama de edición nunca lo llama.
 */
export function FormCategoriaInline({
  pacienteId,
  cartillaId,
  categoriaId,
  valoresIniciales,
  onCancelar,
  onCreada,
}: {
  pacienteId: string
  cartillaId: string
  /** Si está presente → edición (useActualizarCategoria); si no → alta (useCrearCategoria). */
  categoriaId?: string
  /** Valores iniciales (edición); al omitirse arranca vacío (alta). */
  valoresIniciales?: CategoriaValues
  onCancelar?: () => void
  /** Callback de la rama de ALTA: avisa al padre el id de la categoría recién creada (para encadenar acciones). */
  onCreada?: (categoriaId: string) => void
}) {
  const crearCategoria = useCrearCategoria()
  const actualizarCategoria = useActualizarCategoria()

  const form = useForm<CategoriaValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: valoresIniciales ?? {
      nombre: '',
      colorHex: COLORES_FITZGERALD[0].valor,
    },
  })

  const submitting = crearCategoria.isPending || actualizarCategoria.isPending

  const guardar = async (values: CategoriaValues) => {
    try {
      const input = toCategoriaInput(values)
      if (categoriaId) {
        await actualizarCategoria.mutateAsync({ pacienteId, cartillaId, categoriaId, input })
      } else {
        const creada = await crearCategoria.mutateAsync({ pacienteId, cartillaId, input })
        onCreada?.(creada.id)
      }
      onCancelar?.()
    } catch {
      // El error ya se muestra como toast desde el hook.
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(guardar)}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4"
    >
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
              placeholder="p.ej. Verbos de acción"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={form.control}
        name="colorHex"
        render={({ field }) => (
          <Field>
            <FieldLabel>Color</FieldLabel>
            <div
              role="radiogroup"
              aria-label="Color de la categoría"
              className="flex flex-wrap gap-2"
            >
              {COLORES_FITZGERALD.map((color) => {
                const seleccionado = field.value === color.valor
                return (
                  <button
                    key={color.valor}
                    type="button"
                    role="radio"
                    aria-checked={seleccionado}
                    aria-label={color.nombre}
                    title={color.nombre}
                    onClick={() => field.onChange(color.valor)}
                    className={cn(
                      'size-8 rounded-full outline-none ring-offset-2 transition-shadow focus-visible:ring-2 focus-visible:ring-ring',
                      seleccionado && 'ring-2 ring-ring',
                    )}
                    style={{ backgroundColor: color.valor }}
                  />
                )
              })}
            </div>
          </Field>
        )}
      />
      <div className="flex items-center justify-end gap-2">
        {onCancelar && (
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={onCancelar}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {categoriaId ? 'Guardar categoría' : 'Crear categoría'}
        </Button>
      </div>
    </form>
  )
}
