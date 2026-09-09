import { zodResolver } from '@hookform/resolvers/zod'
import { FolderPlus, Loader2, Plus, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { CardVacio, DetalleSkeleton, ErrorCarga } from '../../components/estados'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { useActualizarCartilla, useCartilla } from '../../hooks/cartillas'
import { useAuth } from '../../hooks/useAuth'
import { ordenarPorOrden } from '../../lib/cartilla'
import { formatError } from '../../lib/utils'
import type { CartillaDetalle } from '../../types'
import { FormCategoriaInline } from './FormCategoriaInline'
import { SeccionCategoria } from './seccionCategoria'
import {
  cartillaSchema,
  toCartillaInput,
  toCartillaValues,
  type CartillaValues,
} from './schemas'

/**
 * EditorCartilla (/pacientes/:pacienteId/cartillas/:idCartilla/editar, T8).
 *
 * GATE de creador INNEGOCIABLE: si el usuario logueado no es cartilla.creadorId,
 * NO se renderiza el editor — se muestra un notice de solo lectura. El backend
 * además rechaza ediciones no autorizadas; la UI no llega a intentarlas.
 *
 * Cuando hay permiso: cabecera editable (nombre + esPrincipal) y el CRUD de la
 * cartilla FULL INLINE en una sola pantalla (change editor-cartillas-unificado):
 * SeccionCategoria[] (items + forms inline + borrados con alert-dialog) y alta
 * de categoría con FormCategoriaInline — a la vista si la cartilla está vacía
 * (única acción posible) o desplegable con el botón «Agregar categoría».
 * Sin modales multi-campo (regla AGENTS.md). Los pictogramas globales/custom
 * los consultan internamente FormItemInline y SeccionCategoria (React Query
 * deduplica por key — sin refetch extra).
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
  const [formularioNuevaCategoria, setFormularioNuevaCategoria] = useState(false)
  // Categoría recién creada cuyo form de item queremos ver abierto (encadenado).
  const [categoriaConItemAbierto, setCategoriaConItemAbierto] = useState<string | null>(null)

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
        {categorias.length > 0 && (
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => setFormularioNuevaCategoria((abierto) => !abierto)}
          >
            <Plus aria-hidden="true" />
            Agregar categoría
          </Button>
        )}
      </div>

      {categorias.length > 0 && (
        <div className="flex flex-col gap-4">
          {categorias.map((categoria) => (
            <SeccionCategoria
              key={categoria.id}
              pacienteId={pid}
              cartillaId={cid}
              categoria={categoria}
              abrirItemInicial={categoriaConItemAbierto === categoria.id}
            />
          ))}
        </div>
      )}

      {categorias.length === 0 ? (
        <div className="flex flex-col gap-4">
          <CardVacio
            icono={<FolderPlus className="size-5" aria-hidden="true" />}
            titulo="Sin categorías"
            descripcion="Agregá la primera categoría para empezar a armar la cartilla."
          />
          {/* Categoría vacía: el alta inline queda a la vista (es la única acción posible). */}
          <FormCategoriaInline
            pacienteId={pid}
            cartillaId={cid}
            onCreada={(categoriaId) => setCategoriaConItemAbierto(categoriaId)}
          />
        </div>
      ) : (
        formularioNuevaCategoria && (
          <FormCategoriaInline
            pacienteId={pid}
            cartillaId={cid}
            onCancelar={() => setFormularioNuevaCategoria(false)}
            onCreada={(categoriaId) => setCategoriaConItemAbierto(categoriaId)}
          />
        )
      )}
    </div>
  )
}