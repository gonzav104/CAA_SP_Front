import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ThumbPictograma } from '../../components/ThumbPictograma'
import { CardVacio, ErrorCarga } from '../../components/estados'
import { LabelPacienteContexto } from '../../components/LabelPacienteContexto'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { usePaciente } from '../../hooks/pacientes'
import {
  useEliminarPictogramaCustom,
  usePictogramasCustom,
  useSubirPictogramaCustom,
} from '../../hooks/pictogramas-custom'
import { useAuth } from '../../hooks/useAuth'
import { nombreCompleto, puedeEditarPaciente } from '../../lib/paciente'
import { formatError } from '../../lib/utils'
import type { PictogramaCustom } from '../../types'

const subirSchema = z.object({
  etiqueta: z.string().min(1, 'La etiqueta es obligatoria'),
  archivo: z
    .custom<File>((valor) => valor instanceof File, 'Elegí un archivo de imagen')
    .refine((archivo) => archivo && archivo.size > 0, 'El archivo no puede estar vacío'),
})

type SubirValues = z.infer<typeof subirSchema>

/**
 * Pictogramas custom del paciente (/pacientes/:pacienteId/pictogramas, RI-17).
 * Lista de pictogramas custom (cards con imagen + etiqueta), botón «Subir»
 * (diálogo: etiqueta + file picker, validación zod). Eliminar con confirmación.
 */
export function PictogramasCustom() {
  const { pacienteId } = useParams<{ pacienteId: string }>()
  const id = pacienteId
  const idValido = id !== undefined && id.trim() !== ''
  const { usuario } = useAuth()
  const esTerapeuta = usuario?.rol === 'TERAPEUTA'
  const pacienteQuery = usePaciente(idValido ? id : undefined)
  // Puede subir/editar: terapeuta o familiar con permiso EDICION_LIMITADA.
  const puedeEditar = puedeEditarPaciente(esTerapeuta, pacienteQuery.data?.miPermiso)
  const pictogramasQuery = usePictogramasCustom(idValido ? id : undefined)
  const subir = useSubirPictogramaCustom()
  const eliminar = useEliminarPictogramaCustom()

  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [aEliminar, setAEliminar] = useState<PictogramaCustom | null>(null)

  const form = useForm<SubirValues>({
    resolver: zodResolver(subirSchema),
    defaultValues: { etiqueta: '', archivo: undefined as unknown as File },
  })

  const archivoSeleccionado = form.watch('archivo')

  if (!idValido) {
    return <ErrorCarga mensaje="Identificador de paciente inválido." volverA="/pacientes" />
  }

  const guardar = async (values: SubirValues) => {
    try {
      await subir.mutateAsync({
        pacienteId: id,
        etiqueta: values.etiqueta.trim(),
        archivo: values.archivo,
      })
      setDialogoAbierto(false)
      form.reset({ etiqueta: '', archivo: undefined as unknown as File })
    } catch {
      // El error ya se muestra como toast desde useSubirPictogramaCustom.
    }
  }

  const confirmarEliminar = async () => {
    if (!aEliminar) return
    try {
      await eliminar.mutateAsync({ pacienteId: id, id: aEliminar.id })
      setAEliminar(null)
    } catch {
      // El error ya se muestra como toast desde useEliminarPictogramaCustom.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <LabelPacienteContexto
              cargando={pacienteQuery.isPending}
              nombre={pacienteQuery.data ? nombreCompleto(pacienteQuery.data) : undefined}
            />
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Pictogramas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Imágenes propias de este paciente para usar en sus cartillas.
          </p>
        </div>
        {puedeEditar && (
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setDialogoAbierto(true)}
          >
            <Upload aria-hidden="true" />
            Subir pictograma
          </Button>
        )}
      </div>

      {pictogramasQuery.isPending && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, indice) => (
            <Card key={indice} className="shadow-sm">
              <CardContent className="flex aspect-square items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pictogramasQuery.isError && (
        <ErrorCarga
          mensaje={formatError(pictogramasQuery.error)}
          onReintentar={() => void pictogramasQuery.refetch()}
        />
      )}

      {pictogramasQuery.isSuccess && pictogramasQuery.data.length === 0 && (
        <CardVacio
          icono={<ImagePlus className="size-5" aria-hidden="true" />}
          titulo="Sin pictogramas custom"
          descripcion="Subí imágenes propias del paciente para usarlas en sus cartillas."
        >
          {puedeEditar && (
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setDialogoAbierto(true)}
          >
            <Upload aria-hidden="true" />
            Subir pictograma
          </Button>
        )}
      </CardVacio>
      )}

      {pictogramasQuery.isSuccess && pictogramasQuery.data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {pictogramasQuery.data.map((pictograma) => (
            <Card key={pictograma.id} className="shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col gap-3">
                <ThumbPictograma
                  src={pictograma.imagenUrl}
                  alt={pictograma.etiqueta}
                  className="aspect-square w-full"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">
                    {pictograma.etiqueta}
                  </span>
                  {esTerapeuta && (
                    <AlertDialog
                      open={aEliminar?.id === pictograma.id}
                      onOpenChange={(abierto) => {
                        if (!abierto) setAEliminar(null)
                      }}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Eliminar pictograma ${pictograma.etiqueta}`}
                          className="shrink-0 text-destructive hover:text-destructive"
                          onClick={() => setAEliminar(pictograma)}
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar pictograma?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará «{pictograma.etiqueta}». Los items que lo usan podrían
                            quedarse sin imagen. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={eliminar.isPending}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={eliminar.isPending}
                            onClick={(event) => {
                              event.preventDefault()
                              void confirmarEliminar()
                            }}
                          >
                            {eliminar.isPending ? 'Eliminando…' : 'Eliminar'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir pictograma</DialogTitle>
            <DialogDescription>
              Etiqueta y archivo de imagen (PNG, JPG, WEBP) para este paciente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(guardar)} noValidate className="flex flex-col gap-4">
            <Controller
              control={form.control}
              name="etiqueta"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Etiqueta</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                    placeholder="p.ej. Mi perro"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="archivo"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Archivo</FieldLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    aria-invalid={fieldState.invalid}
                    onChange={(event) => field.onChange(event.target.files?.[0])}
                  />
                  {archivoSeleccionado instanceof File && (
                    <p className="text-xs text-muted-foreground">
                      {archivoSeleccionado.name} (
                      {Math.round(archivoSeleccionado.size / 1024)} KB)
                    </p>
                  )}
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={subir.isPending}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={subir.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {subir.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                Subir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
