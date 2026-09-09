import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
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
import { cartillaSchema, type CartillaValues } from './schemas'

/**
 * Diálogos de formulario de cartillas (regla AGENTS.md: 1-2 campos → Dialog;
 * 3+ campos → página). Desde el change editor-cartillas-unificado los forms de
 * categoría e item viven INLINE en el editor (FormCategoriaInline /
 * FormItemInline) — acá solo queda «DialogoNuevaCartilla», que usa ListaCartillas.
 * Todos usan RHF + zodResolver (D5) y cierran desde el footer; el submit lo
 * maneja la página que los abre.
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