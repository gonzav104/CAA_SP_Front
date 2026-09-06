import { zodResolver } from '@hookform/resolvers/zod'
import { FolderPlus, Loader2, Pencil, Plus, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { ThumbPictograma } from '../../components/ThumbPictograma'
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
import { CardVacio, DetalleSkeleton, ErrorCarga } from '../../components/estados'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import {
  useActualizarCartilla,
  useActualizarCategoria,
  useActualizarItem,
  useCartilla,
  useCrearCategoria,
  useCrearItem,
  useEliminarCategoria,
  useEliminarItem,
  usePictogramasGlobales,
} from '../../hooks/cartillas'
import { useAuth } from '../../hooks/useAuth'
import { usePictogramasCustom } from '../../hooks/pictogramas-custom'
import { imagenUrlDeItem, ordenarPorOrden, ordenarPorOrdenVisual } from '../../lib/cartilla'
import { normalizeColorHex } from '../../lib/color'
import { formatError } from '../../lib/utils'
import type {
  CartillaDetalle,
  CategoriaDetalle,
  ItemDetalle,
  Pictograma,
  PictogramaCustom,
} from '../../types'
import { DialogoFormCategoria, DialogoFormItem } from './dialogos'
import {
  cartillaSchema,
  toCategoriaInput,
  toCategoriaValues,
  toCartillaInput,
  toCartillaValues,
  toItemInput,
  toItemValues,
  type CartillaValues,
  type CategoriaValues,
  type ItemValues,
} from './schemas'

/**
 * EditorCartilla (/pacientes/:pacienteId/cartillas/:idCartilla/editar, T8).
 *
 * GATE de creador INNEGOCIABLE: si el usuario logueado no es cartilla.creadorId,
 * NO se renderiza el editor — se muestra un notice de solo lectura. El backend
 * además rechaza ediciones no autorizadas; la UI no llega a intentarlas.
 *
 * Cuando hay permiso: cabecera editable (nombre + esPrincipal), alta de
 * categorías con swatch Fitzgerald y CRUD de items con selector de pictogramas
 * globales. Diálogos = 1-2 campos (regla AGENTS.md). El drag & drop de orden
 * queda como mejora futura (el backend expone orden/ordenVisual).
 */

/* ------------------------------ Cabecera editable ------------------------------ */

function FormCabeceraCartilla({
  cartilla,
  submitting,
  onSubmit,
}: {
  cartilla: CartillaDetalle
  submitting: boolean
  onSubmit: (values: CartillaValues) => void
}) {
  const form = useForm<CartillaValues>({
    resolver: zodResolver(cartillaSchema),
    defaultValues: toCartillaValues(cartilla),
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-1 flex-col gap-4">
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
                  Cartilla principal (abre por defecto en modo uso)
                </label>
              </Field>
            )}
          />
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white hover:bg-blue-700 md:mt-7"
        >
          {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          Guardar
        </Button>
      </div>
    </form>
  )
}

/* ------------------------------ Categoría con sus items ------------------------------ */

function SeccionCategoria({
  pacienteId,
  cartillaId,
  categoria,
  pictogramas,
  pictogramasCargando,
  pictogramasCustom,
  pictogramasCustomCargando,
}: {
  pacienteId: string
  cartillaId: string
  categoria: CategoriaDetalle
  pictogramas: Pictograma[]
  pictogramasCargando: boolean
  pictogramasCustom: PictogramaCustom[]
  pictogramasCustomCargando: boolean
}) {
  const actualizarCategoria = useActualizarCategoria()
  const eliminarCategoria = useEliminarCategoria()
  const crearItem = useCrearItem()
  const actualizarItem = useActualizarItem()
  const eliminarItem = useEliminarItem()

  const [dialogoCategoriaAbierto, setDialogoCategoriaAbierto] = useState(false)
  const [dialogoNuevoItem, setDialogoNuevoItem] = useState(false)
  const [itemEnEdicion, setItemEnEdicion] = useState<ItemDetalle | null>(null)
  const [confirmandoEliminarCategoria, setConfirmandoEliminarCategoria] = useState(false)
  const [itemAEliminar, setItemAEliminar] = useState<ItemDetalle | null>(null)

  const items = ordenarPorOrdenVisual(categoria.items ?? [])

  const guardarCategoria = async (values: CategoriaValues) => {
    try {
      await actualizarCategoria.mutateAsync({
        pacienteId,
        cartillaId,
        categoriaId: categoria.id,
        input: toCategoriaInput(values),
      })
      setDialogoCategoriaAbierto(false)
    } catch {
      // El error ya se muestra como toast desde useActualizarCategoria.
    }
  }

  const guardarNuevoItem = async (values: ItemValues) => {
    try {
      await crearItem.mutateAsync({
        pacienteId,
        cartillaId,
        categoriaId: categoria.id,
        input: toItemInput(values),
      })
      setDialogoNuevoItem(false)
    } catch {
      // El error ya se muestra como toast desde useCrearItem.
    }
  }

  const guardarItemEnEdicion = async (values: ItemValues) => {
    if (!itemEnEdicion) return
    try {
      await actualizarItem.mutateAsync({
        pacienteId,
        cartillaId,
        categoriaId: categoria.id,
        itemId: itemEnEdicion.id,
        input: toItemInput(values),
      })
      setItemEnEdicion(null)
    } catch {
      // El error ya se muestra como toast desde useActualizarItem.
    }
  }

  const confirmarEliminarCategoria = async () => {
    try {
      await eliminarCategoria.mutateAsync({ pacienteId, cartillaId, categoriaId: categoria.id })
      setConfirmandoEliminarCategoria(false)
    } catch {
      // El error ya se muestra como toast desde useEliminarCategoria.
    }
  }

  const confirmarEliminarItem = async () => {
    if (!itemAEliminar) return
    try {
      await eliminarItem.mutateAsync({
        pacienteId,
        cartillaId,
        categoriaId: categoria.id,
        itemId: itemAEliminar.id,
      })
      setItemAEliminar(null)
    } catch {
      // El error ya se muestra como toast desde useEliminarItem.
    }
  }

  return (
    <Card className="shadow-sm">
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-full ring-1 ring-black/10"
            style={{ backgroundColor: normalizeColorHex(categoria.colorHex) }}
          />
          <h4 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {categoria.nombre}
          </h4>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="dense" onClick={() => setDialogoNuevoItem(true)}>
              <Plus aria-hidden="true" />
              Item
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar categoría ${categoria.nombre}`}
              onClick={() => setDialogoCategoriaAbierto(true)}
            >
              <Pencil aria-hidden="true" />
            </Button>
            <AlertDialog
              open={confirmandoEliminarCategoria}
              onOpenChange={setConfirmandoEliminarCategoria}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Eliminar categoría ${categoria.nombre}`}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará «{categoria.nombre}» y sus {items.length}{' '}
                    {items.length === 1 ? 'item' : 'items'}. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={eliminarCategoria.isPending}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={eliminarCategoria.isPending}
                    onClick={(event) => {
                      event.preventDefault()
                      void confirmarEliminarCategoria()
                    }}
                  >
                    {eliminarCategoria.isPending ? 'Eliminando…' : 'Eliminar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">Sin items</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
              >
                <ThumbPictograma
                  src={imagenUrlDeItem(item)}
                  alt={item.textoHablado}
                  className="size-10 shrink-0"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {item.textoHablado}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Editar item ${item.textoHablado}`}
                  onClick={() => setItemEnEdicion(item)}
                >
                  <Pencil aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Eliminar item ${item.textoHablado}`}
                  className="text-destructive hover:text-destructive"
                  onClick={() => setItemAEliminar(item)}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <DialogoFormCategoria
          abierto={dialogoCategoriaAbierto}
          onOpenChange={setDialogoCategoriaAbierto}
          titulo="Editar categoría"
          defaultValues={toCategoriaValues(categoria)}
          submitting={actualizarCategoria.isPending}
          onSubmit={guardarCategoria}
        />

        <DialogoFormItem
          abierto={dialogoNuevoItem}
          onOpenChange={setDialogoNuevoItem}
          titulo="Nuevo item"
          pictogramas={pictogramas}
          pictogramasCargando={pictogramasCargando}
          pictogramasCustom={pictogramasCustom}
          pictogramasCustomCargando={pictogramasCustomCargando}
          submitting={crearItem.isPending}
          onSubmit={guardarNuevoItem}
        />

        <DialogoFormItem
          abierto={itemEnEdicion !== null}
          onOpenChange={(abierto) => {
            if (!abierto) setItemEnEdicion(null)
          }}
          titulo="Editar item"
          key={itemEnEdicion?.id ?? 'nuevo'}
          defaultValues={itemEnEdicion ? toItemValues(itemEnEdicion) : undefined}
          pictogramas={pictogramas}
          pictogramasCargando={pictogramasCargando}
          pictogramasCustom={pictogramasCustom}
          pictogramasCustomCargando={pictogramasCustomCargando}
          submitting={actualizarItem.isPending}
          onSubmit={guardarItemEnEdicion}
        />

        <AlertDialog
          open={itemAEliminar !== null}
          onOpenChange={(abierto) => {
            if (!abierto) setItemAEliminar(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar item?</AlertDialogTitle>
              <AlertDialogDescription>
                {itemAEliminar
                  ? `Se eliminará «${itemAEliminar.textoHablado}» de esta categoría. Esta acción no se puede deshacer.`
                  : ''}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={eliminarItem.isPending}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={eliminarItem.isPending}
                onClick={(event) => {
                  event.preventDefault()
                  void confirmarEliminarItem()
                }}
              >
                {eliminarItem.isPending ? 'Eliminando…' : 'Eliminar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

/* ------------------------------ Página ------------------------------ */

/** Notice de solo lectura: se muestra cuando el usuario no es el creador. */
function NoticeSoloLectura({
  volverARevisión,
  volverAPaciente,
}: {
  volverARevisión: string
  volverAPaciente: string
}) {
  return (
    <Card className="py-12 shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Solo el creador puede editar esta cartilla</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Podés verla en modo revisión o abrirla en modo uso con el chico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={volverARevisión}>Ver cartilla</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={volverAPaciente}>Volver al paciente</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function EditorCartilla() {
  const { pacienteId, idCartilla } = useParams<{ pacienteId: string; idCartilla: string }>()
  const pid = pacienteId
  const cid = idCartilla
  const idsValidos = pid !== undefined && pid.trim() !== '' && cid !== undefined && cid.trim() !== ''
  const { usuario } = useAuth()
  const cartillaQuery = useCartilla(idsValidos ? pid : undefined, idsValidos ? cid : undefined)
  const actualizarCartilla = useActualizarCartilla()
  const crearCategoria = useCrearCategoria()
  const pictogramasQuery = usePictogramasGlobales()
  const pictogramasCustomQuery = usePictogramasCustom(idsValidos ? pid : undefined)
  const [dialogoNuevaCategoria, setDialogoNuevaCategoria] = useState(false)

  if (!idsValidos) {
    return <ErrorCarga mensaje="Identificador de cartilla inválido." volverA="/pacientes" />
  }

  if (cartillaQuery.isPending) {
    return <DetalleSkeleton />
  }

  if (cartillaQuery.isError) {
    return (
      <ErrorCarga
        mensaje={formatError(cartillaQuery.error)}
        onReintentar={() => void cartillaQuery.refetch()}
        volverA={`/pacientes/${pid}/cartillas`}
      />
    )
  }

  const cartilla = cartillaQuery.data
  if (!cartilla) {
    return (
      <ErrorCarga
        mensaje="No se encontró la cartilla."
        volverA={`/pacientes/${pid}/cartillas`}
      />
    )
  }

  const esCreador = usuario?.id === cartilla.creadorId

  // GATE: un familiar (o terapeuta ajeno) nunca llega al editor.
  if (!esCreador) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <NoticeSoloLectura
          volverARevisión={`/pacientes/${pid}/cartillas/${cid}`}
          volverAPaciente={`/pacientes/${pid}`}
        />
      </div>
    )
  }

  const categorias = ordenarPorOrden(cartilla.categorias ?? [])

  const guardarCabecera = async (values: CartillaValues) => {
    try {
      await actualizarCartilla.mutateAsync({
        pacienteId: pid,
        cartillaId: cid,
        input: toCartillaInput(values),
      })
    } catch {
      // El error ya se muestra como toast desde useActualizarCartilla.
    }
  }

  const crearNuevaCategoria = async (values: CategoriaValues) => {
    try {
      await crearCategoria.mutateAsync({
        pacienteId: pid,
        cartillaId: cid,
        input: toCategoriaInput(values),
      })
      setDialogoNuevaCategoria(false)
    } catch {
      // El error ya se muestra como toast desde useCrearCategoria.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Editor de cartilla</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Modificá la estructura de «{cartilla.nombre}».
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/pacientes/${pid}/cartillas/${cid}`}>Ver revisión</Link>
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent>
          <FormCabeceraCartilla
            key={cartilla.id}
            cartilla={cartilla}
            submitting={actualizarCartilla.isPending}
            onSubmit={guardarCabecera}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-tight">Categorías</h3>
        <Button
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setDialogoNuevaCategoria(true)}
        >
          <Plus aria-hidden="true" />
          Agregar categoría
        </Button>
      </div>

      {categorias.length === 0 ? (
        <CardVacio
          icono={<FolderPlus className="size-5" aria-hidden="true" />}
          titulo="Sin categorías"
          descripcion="Agregá la primera categoría para empezar a armar la cartilla."
        >
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setDialogoNuevaCategoria(true)}
          >
            <Plus aria-hidden="true" />
            Agregar categoría
          </Button>
        </CardVacio>
      ) : (
        <div className="flex flex-col gap-4">
          {categorias.map((categoria) => (
            <SeccionCategoria
              key={categoria.id}
              pacienteId={pid}
              cartillaId={cid}
              categoria={categoria}
              pictogramas={pictogramasQuery.data ?? []}
              pictogramasCargando={pictogramasQuery.isPending}
              pictogramasCustom={pictogramasCustomQuery.data ?? []}
              pictogramasCustomCargando={pictogramasCustomQuery.isPending}
            />
          ))}
        </div>
      )}

      <DialogoFormCategoria
        abierto={dialogoNuevaCategoria}
        onOpenChange={setDialogoNuevaCategoria}
        titulo="Nueva categoría"
        submitting={crearCategoria.isPending}
        onSubmit={crearNuevaCategoria}
      />
    </div>
  )
}