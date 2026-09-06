import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { ThumbPictograma } from '../../components/ThumbPictograma'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { COLORES_FITZGERALD } from '../../lib/color'
import { cn } from '../../lib/utils'
import type { Pictograma, PictogramaCustom } from '../../types'
import {
  cartillaSchema,
  categoriaSchema,
  itemSchema,
  type CartillaValues,
  type CategoriaValues,
  type ItemValues,
} from './schemas'

/**
 * Diálogos de formulario del editor de cartillas (regla AGENTS.md: 1-2 campos →
 * Dialog; 3+ campos → página). Todos usan RHF + zodResolver (D5) y cierran
 * desde el footer; el submit lo maneja la página que los abre.
 */

interface DialogoFormProps {
  abierto: boolean
  onOpenChange: (abierto: boolean) => void
  submitting: boolean
}

/* ------------------------------ Nueva cartilla ------------------------------ */

interface DialogoNuevaCartillaProps extends DialogoFormProps {
  onSubmit: (values: CartillaValues) => void
}

/** «Nueva cartilla» (2 campos): nombre + esPrincipal opcional. */
export function DialogoNuevaCartilla({
  abierto,
  onOpenChange,
  submitting,
  onSubmit,
}: DialogoNuevaCartillaProps) {
  const form = useForm<CartillaValues>({
    resolver: zodResolver(cartillaSchema),
    defaultValues: { nombre: '', esPrincipal: false },
  })

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva cartilla</DialogTitle>
          <DialogDescription>
            Nombre de la cartilla de comunicación. Podés marcarla como principal:
            es la que abre el modo de uso por defecto.
          </DialogDescription>
        </DialogHeader>
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
                  placeholder="p.ej. Mis primeras palabras"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="esPrincipal"
            render={({ field }) => (
              <Field>
                <label
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                  htmlFor="esPrincipal"
                >
                  <input
                    id="esPrincipal"
                    type="checkbox"
                    checked={field.value === true}
                    onChange={(event) => field.onChange(event.target.checked)}
                    className="size-4 rounded border-border accent-blue-600"
                  />
                  Marcar como cartilla principal
                </label>
              </Field>
            )}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              Crear cartilla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------ Crear/editar categoría ------------------------------ */

interface DialogoFormCategoriaProps extends DialogoFormProps {
  titulo: string
  /** Valores iniciales (edición); al omitirse arranca vacío (creación). */
  defaultValues?: CategoriaValues
  onSubmit: (values: CategoriaValues) => void
}

/** Categoría (2 campos): nombre + swatch de color Fitzgerald. */
export function DialogoFormCategoria({
  abierto,
  onOpenChange,
  titulo,
  defaultValues,
  submitting,
  onSubmit,
}: DialogoFormCategoriaProps) {
  const form = useForm<CategoriaValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: defaultValues ?? { nombre: '', colorHex: COLORES_FITZGERALD[0].valor },
  })

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            El color sigue la convención Fitzgerald: verbos verde, comidas amarillo,
            sentimientos azul, personas rosa, preguntas naranja, negación rojo.
          </DialogDescription>
        </DialogHeader>
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
                <div role="radiogroup" aria-label="Color de la categoría" className="flex flex-wrap gap-2">
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
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------ Crear/editar item ------------------------------ */

interface DialogoFormItemProps extends DialogoFormProps {
  titulo: string
  /** Valores iniciales (edición); al omitirse arranca vacío (creación). */
  defaultValues?: ItemValues
  pictogramas: Pictograma[]
  pictogramasCargando?: boolean
  /** Pictogramas custom del paciente (selector dual, RI-18). */
  pictogramasCustom?: PictogramaCustom[]
  pictogramasCustomCargando?: boolean
  onSubmit: (values: ItemValues) => void
}

/** Item (2 campos): textoHablado + selector de pictograma dual (global | custom). */
export function DialogoFormItem({
  abierto,
  onOpenChange,
  titulo,
  defaultValues,
  pictogramas,
  pictogramasCargando,
  pictogramasCustom,
  pictogramasCustomCargando,
  submitting,
  onSubmit,
}: DialogoFormItemProps) {
  const form = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: defaultValues ?? {
      textoHablado: '',
      recursoGlobalId: undefined,
      recursoCustomId: undefined,
    },
  })

  const formError = form.formState.errors.recursoGlobalId?.message

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Texto que el chico escuchará al tocar el pictograma, y pictograma asociado
            (global o del paciente).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
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
          <Controller
            control={form.control}
            name="recursoGlobalId"
            render={({ field }) => (
              <Field>
                <FieldLabel>Pictogramas globales</FieldLabel>
                {pictogramasCargando ? (
                  <p className="text-sm text-muted-foreground">Cargando pictogramas…</p>
                ) : pictogramas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay pictogramas globales disponibles.
                  </p>
                ) : (
                  <div
                    role="radiogroup"
                    aria-label="Pictogramas globales"
                    className="grid max-h-[50vh] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:max-h-60 sm:grid-cols-5"
                  >
                    {pictogramas.map((pictograma) => {
                      const seleccionado = field.value === pictograma.id
                      return (
                        <button
                          key={pictograma.id}
                          type="button"
                          role="radio"
                          aria-checked={seleccionado}
                          title={pictograma.etiqueta}
                          onClick={() => {
                            // Seleccionar un global limpia el custom (mutuamente excluyente).
                            form.setValue('recursoCustomId', undefined)
                            field.onChange(seleccionado ? undefined : pictograma.id)
                          }}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-lg border p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                            seleccionado
                              ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                              : 'border-border hover:border-muted-foreground/40',
                          )}
                        >
                          <ThumbPictograma
                            src={pictograma.imagenUrl}
                            alt={pictograma.etiqueta}
                            className="size-10"
                          />
                          <span className="w-full truncate text-center text-xs text-muted-foreground">
                            {pictograma.etiqueta}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="recursoCustomId"
            render={({ field }) => (
              <Field>
                <FieldLabel>Pictogramas del paciente</FieldLabel>
                {pictogramasCustomCargando ? (
                  <p className="text-sm text-muted-foreground">Cargando pictogramas…</p>
                ) : !pictogramasCustom || pictogramasCustom.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Este paciente no tiene pictogramas custom.
                  </p>
                ) : (
                  <div
                    role="radiogroup"
                    aria-label="Pictogramas del paciente"
                    className="grid max-h-[50vh] grid-cols-4 gap-2 overflow-y-auto pr-1 sm:max-h-60 sm:grid-cols-5"
                  >
                    {pictogramasCustom.map((pictograma) => {
                      const seleccionado = field.value === pictograma.id
                      return (
                        <button
                          key={pictograma.id}
                          type="button"
                          role="radio"
                          aria-checked={seleccionado}
                          title={pictograma.etiqueta}
                          onClick={() => {
                            // Seleccionar un custom limpia el global (mutuamente excluyente).
                            form.setValue('recursoGlobalId', undefined)
                            field.onChange(seleccionado ? undefined : pictograma.id)
                          }}
                          className={cn(
                            'flex flex-col items-center gap-1 rounded-lg border p-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                            seleccionado
                              ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                              : 'border-border hover:border-muted-foreground/40',
                          )}
                        >
                          <ThumbPictograma
                            src={pictograma.imagenUrl}
                            alt={pictograma.etiqueta}
                            className="size-10"
                          />
                          <span className="w-full truncate text-center text-xs text-muted-foreground">
                            {pictograma.etiqueta}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </Field>
            )}
          />
          {formError && (
            <div role="alert" className="text-sm font-normal text-destructive">
              {formError}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Opcional: podés guardar el item sin pictograma.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}