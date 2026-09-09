import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
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
import { useEliminarCategoria, useEliminarItem } from '../../hooks/cartillas'
import { imagenUrlDeItem, ordenarPorOrdenVisual } from '../../lib/cartilla'
import { normalizeColorHex } from '../../lib/color'
import type { CategoriaDetalle, ItemDetalle } from '../../types'
import { FormCategoriaInline } from './FormCategoriaInline'
import { FormItemInline } from './FormItemInline'
import { toCategoriaValues } from './schemas'

/**
 * SeccionCategoria (AD-6): card de una categoría con sus items, extraída del
 * EditorCartilla. Todo el CRUD es INLINE (regla AGENTS.md: form multi-campo va
 * en el editor, no en Dialog) y el estado es local por card:
 * - FormItemInline para alta de item y para edición de item.
 * - FormCategoriaInline para edición de la categoría (nombre + swatch).
 * - AlertDialogs SOLO para confirmar borrados (categoría e item).
 * Los hooks de crear/actualizar viven dentro de los forms inline; acá quedan
 * los de eliminación (úsan mutateAsync → invalidan `cartillaKeys.detail` 1×).
 */
export function SeccionCategoria({
  pacienteId,
  cartillaId,
  categoria,
  abrirItemInicial,
}: {
  pacienteId: string
  cartillaId: string
  categoria: CategoriaDetalle
  /**
   * Si es true, el form de alta de item arranca abierto en el PRIMER render.
   * Solo afecta el estado inicial (useState lo ignora después): si el form se
   * cierra, no se vuelve a abrir aunque la prop siga true. Se usa para
   * encadenar «crear categoría → agregar su primer item».
   */
  abrirItemInicial?: boolean
}) {
  const eliminarCategoria = useEliminarCategoria()
  const eliminarItem = useEliminarItem()

  const [formularioNuevoItem, setFormularioNuevoItem] = useState(abrirItemInicial === true)
  const [itemEnEdicion, setItemEnEdicion] = useState<ItemDetalle | null>(null)
  const [formularioCategoriaAbierto, setFormularioCategoriaAbierto] = useState(false)
  const [confirmandoEliminarCategoria, setConfirmandoEliminarCategoria] = useState(false)
  const [itemAEliminar, setItemAEliminar] = useState<ItemDetalle | null>(null)

  const items = ordenarPorOrdenVisual(categoria.items ?? [])

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
            <Button variant="outline" size="dense" onClick={() => setFormularioNuevoItem(true)}>
              <Plus aria-hidden="true" />
              Item
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar categoría ${categoria.nombre}`}
              onClick={() => setFormularioCategoriaAbierto(true)}
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

        {formularioCategoriaAbierto && (
          <FormCategoriaInline
            pacienteId={pacienteId}
            cartillaId={cartillaId}
            categoriaId={categoria.id}
            valoresIniciales={toCategoriaValues(categoria)}
            onCancelar={() => setFormularioCategoriaAbierto(false)}
          />
        )}

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

        {formularioNuevoItem && (
          <FormItemInline
            key="nuevo"
            pacienteId={pacienteId}
            cartillaId={cartillaId}
            categoriaId={categoria.id}
            onCancelar={() => setFormularioNuevoItem(false)}
          />
        )}

        {itemEnEdicion !== null && (
          <FormItemInline
            key={itemEnEdicion.id}
            pacienteId={pacienteId}
            cartillaId={cartillaId}
            categoriaId={categoria.id}
            item={itemEnEdicion}
            onCancelar={() => setItemEnEdicion(null)}
          />
        )}

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