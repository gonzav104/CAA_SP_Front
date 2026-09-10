import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { ThumbPictograma } from '../../components/ThumbPictograma'
import { Button } from '../../components/ui/button'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { useActualizarItem, useCrearItem, usePictogramasGlobales } from '../../hooks/cartillas'
import { usePictogramasCustom } from '../../hooks/pictogramas-custom'
import type { ItemDetalle } from '../../types'
import {
  itemSchema,
  toItemInput,
  toItemValues,
  type ItemValues,
} from './schemas'
import {
  SeleccionPictograma,
  type PictogramaElegido,
} from './SeleccionPictograma'

/**
 * FormItemInline (AD-6): alta/edición inline de un item SIN modal (regla
 * AGENTS.md: form multi-campo va en el editor, no en Dialog; el ÚNICO Dialog
 * acá es la selección de pictograma, que es un solo campo).
 *
 * - textoHablado + campo pictograma clickeable (todo el campo es el trigger)
 *   → abre SeleccionPictograma (tabs ARASAAC/Globales/Custom, confirm-first:
 *   el picker aplica al Confirmar y puede materializar ARASAAC).
 * - X hermano absoluto quita el pictograma (limpiarPictograma).
 * - Submit con toItemInput: preserva RI-18 (selector dual mutuamente excluyente
 *   validado por itemSchema en schemas.ts, intacto).
 * - Cada submit = mutateAsync → los hooks invalidan `cartillaKeys.detail` UNA
 *   vez (RF-04).
 */
export function FormItemInline({
  pacienteId,
  cartillaId,
  categoriaId,
  item,
  onCancelar,
}: {
  pacienteId: string
  cartillaId: string
  categoriaId: string
  /** Si está presente → edición (useActualizarItem); si no → alta (useCrearItem). */
  item?: ItemDetalle
  onCancelar: () => void
}) {
  const crearItem = useCrearItem()
  const actualizarItem = useActualizarItem()
  // Para pintar el pictograma elegido y resolver la selección vigente.
  // React Query deduplica por key: aunque el editor también los consulte,
  // no hay refetch extra (misma entrada de caché).
  const pictogramasQuery = usePictogramasGlobales()
  const pictogramasCustomQuery = usePictogramasCustom(pacienteId)

  const [selectorAbierto, setSelectorAbierto] = useState(false)

  const form = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: item ? toItemValues(item) : { textoHablado: '', recursoGlobalId: undefined, recursoCustomId: undefined },
  })

  const submitting = crearItem.isPending || actualizarItem.isPending
  // useWatch (no `form.watch`): evita la nota de memoización del linter y
  // actualiza el thumbnail/selector con el valor vigente de cada recurso.
  const recursoGlobalId = useWatch({ control: form.control, name: 'recursoGlobalId' })
  const recursoCustomId = useWatch({ control: form.control, name: 'recursoCustomId' })
  const formError = form.formState.errors.recursoGlobalId?.message

  // Pictograma a mostrar junto al input: el ESTADO DEL FORM es la única fuente
  // de verdad (tras limpiar con la X no debe reaparecer la imagen vieja del
  // item); `toItemValues(item)` ya seedea los ids al editar.
  const pictogramaMostrado = ((): { imagenUrl?: string; etiqueta?: string } => {
    if (recursoGlobalId) {
      const global = pictogramasQuery.data?.find((p) => p.id === recursoGlobalId)
      if (global) return { imagenUrl: global.imagenUrl, etiqueta: global.etiqueta }
    }
    if (recursoCustomId) {
      const custom = pictogramasCustomQuery.data?.find((p) => p.id === recursoCustomId)
      if (custom) return { imagenUrl: custom.imagenUrl, etiqueta: custom.etiqueta }
    }
    return {}
  })()

  /** Aplica la elección del selector respetando la exclusión mutua (RI-18). */
  const aplicarSeleccion = ({ globalId, customId }: PictogramaElegido) => {
    form.setValue('recursoGlobalId', globalId, { shouldValidate: true })
    form.setValue('recursoCustomId', customId, { shouldValidate: true })
  }

  /** El X de quitar solo aparece si hay un pictograma elegido (si no, placeholder). */
  const tienePictograma = Boolean(recursoGlobalId || recursoCustomId)

  /** Quita el pictograma del form (el item se guarda sin pictograma, ver itemSchema). */
  const limpiarPictograma = () => {
    form.setValue('recursoGlobalId', undefined, { shouldValidate: true })
    form.setValue('recursoCustomId', undefined, { shouldValidate: true })
  }

  const guardar = async (values: ItemValues) => {
    try {
      const input = toItemInput(values)
      if (item) {
        await actualizarItem.mutateAsync({
          pacienteId,
          cartillaId,
          categoriaId,
          itemId: item.id,
          input,
        })
      } else {
        await crearItem.mutateAsync({ pacienteId, cartillaId, categoriaId, input })
      }
      onCancelar()
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
        name="textoHablado"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Texto a hablar</FieldLabel>
            <Input
              {...field}
              id={field.name}
              autoComplete="off"
              placeholder="p.ej. Quiero agua"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Field>
        <FieldLabel>Pictograma</FieldLabel>
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full justify-start gap-3 px-3 py-2 text-left"
            onClick={() => setSelectorAbierto(true)}
          >
            <ThumbPictograma
              src={pictogramaMostrado.imagenUrl}
              alt={pictogramaMostrado.etiqueta ?? 'Sin pictograma'}
              className="size-10 shrink-0"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {pictogramaMostrado.etiqueta ?? 'Sin pictograma seleccionado'}
              </span>
              <span className="block text-xs text-muted-foreground">
                {recursoGlobalId
                  ? 'Pictograma global'
                  : recursoCustomId
                    ? 'Pictograma del paciente'
                    : 'Opcional: podés guardar el item sin pictograma'}
              </span>
            </span>
            {tienePictograma ? (
              // Espaciador del mismo ancho que el X (size-9): el texto trunca
              // antes de pasar por debajo del botón de quitar.
              <span aria-hidden="true" className="size-9 shrink-0" />
            ) : (
              <ImagePlus aria-hidden="true" />
            )}
          </Button>
          {tienePictograma && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Quitar pictograma"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={(event) => {
                event.stopPropagation()
                limpiarPictograma()
              }}
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
        {formError && (
          <div role="alert" className="text-sm font-normal text-destructive">
            {formError}
          </div>
        )}
      </Field>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" disabled={submitting} onClick={onCancelar}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          {item ? 'Guardar item' : 'Agregar item'}
        </Button>
      </div>

      {/* Montaje condicional: el selector arranca con estado limpio en cada apertura
          (tab ARASAAC, término de búsqueda vacío) sin reset por efecto. */}
      {selectorAbierto && (
        <SeleccionPictograma
          abierto
          onAbiertoChange={setSelectorAbierto}
          pacienteId={pacienteId}
          valor={{ recursoGlobalId, recursoCustomId }}
          onConfirmar={aplicarSeleccion}
        />
      )}
    </form>
  )
}