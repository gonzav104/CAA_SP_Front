import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatError } from '../lib/utils'
import * as cartillasService from '../services/cartillas'
import type { CartillaInput, CategoriaInput, ItemCartillaInput } from '../types'
import { cartillaKeys, pictogramasKeys } from './queryKeys'

/**
 * Hooks de TanStack Query del dominio cartillas (D2).
 * - Las mutations del editor invalidan `cartillaKeys.detail` (refetch del detalle
 *   anidado: categorías/items) y, cuando aplica, `cartillaKeys.all` (la lista).
 * - El toast de éxito/error está centralizado acá; las páginas solo llaman
 *   mutateAsync y cierran diálogos/navegan.
 * - Todos los IDs son UUID (string).
 */

/** Lista de cartillas de un paciente (GET .../cartillas). `pacienteId` undefined → deshabilitada. */
export function useCartillas(pacienteId: string | undefined) {
  return useQuery({
    queryKey: cartillaKeys.all(pacienteId ?? ''),
    queryFn: () => {
      if (pacienteId === undefined) {
        throw new Error('useCartillas requiere un pacienteId válido')
      }
      return cartillasService.listarCartillas(pacienteId)
    },
    enabled: pacienteId !== undefined,
  })
}

/**
 * Detalle anidado de una cartilla (GET .../cartillas/{cartillaId}).
 * Es la fuente del CartillaView (preview) y del EditorCartilla.
 */
export function useCartilla(pacienteId: string | undefined, cartillaId: string | undefined) {
  return useQuery({
    queryKey: cartillaKeys.detail(pacienteId ?? '', cartillaId ?? ''),
    queryFn: () => {
      if (pacienteId === undefined || cartillaId === undefined) {
        throw new Error('useCartilla requiere pacienteId y cartillaId válidos')
      }
      return cartillasService.obtenerCartilla(pacienteId, cartillaId)
    },
    enabled: pacienteId !== undefined && cartillaId !== undefined,
  })
}

/** Creación (POST .../cartillas): invalida la lista y avisa con toast. */
export function useCrearCartilla() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pacienteId, input }: { pacienteId: string; input: CartillaInput }) =>
      cartillasService.crearCartilla(pacienteId, input),
    onSuccess: (cartilla, { pacienteId }) => {
      void queryClient.invalidateQueries({ queryKey: cartillaKeys.all(pacienteId) })
      toast.success(`Cartilla «${cartilla.nombre}» creada`)
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Actualización (PUT .../cartillas/{cartillaId}): invalida detalle + lista. */
export function useActualizarCartilla() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      cartillaId,
      input,
    }: {
      pacienteId: string
      cartillaId: string
      input: CartillaInput
    }) => cartillasService.actualizarCartilla(pacienteId, cartillaId, input),
    onSuccess: (cartilla, { pacienteId }) => {
      void queryClient.invalidateQueries({ queryKey: cartillaKeys.detail(pacienteId, cartilla.id) })
      void queryClient.invalidateQueries({ queryKey: cartillaKeys.all(pacienteId) })
      toast.success('Cartilla actualizada')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Eliminación (DELETE .../cartillas/{cartillaId}): refetch de la lista, limpia el detalle. */
export function useEliminarCartilla() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      cartillaId,
    }: {
      pacienteId: string
      cartillaId: string
    }) => cartillasService.eliminarCartilla(pacienteId, cartillaId),
    onSuccess: (_data, { pacienteId, cartillaId }) => {
      void queryClient.invalidateQueries({ queryKey: cartillaKeys.all(pacienteId) })
      queryClient.removeQueries({ queryKey: cartillaKeys.detail(pacienteId, cartillaId) })
      toast.success('Cartilla eliminada')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Creación de categoría (POST .../categorias): refetch del detalle. */
export function useCrearCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      cartillaId,
      input,
    }: {
      pacienteId: string
      cartillaId: string
      input: CategoriaInput
    }) => cartillasService.crearCategoria(pacienteId, cartillaId, input),
    onSuccess: (_categoria, { pacienteId, cartillaId }) => {
      void queryClient.invalidateQueries({ queryKey: cartillaKeys.detail(pacienteId, cartillaId) })
      toast.success('Categoría creada')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Actualización de categoría (PUT .../categorias/{categoriaId}): refetch del detalle. */
export function useActualizarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      cartillaId,
      categoriaId,
      input,
    }: {
      pacienteId: string
      cartillaId: string
      categoriaId: string
      input: CategoriaInput
    }) => cartillasService.actualizarCategoria(pacienteId, cartillaId, categoriaId, input),
    onSuccess: (_categoria, { pacienteId, cartillaId }) => {
      void queryClient.invalidateQueries({ queryKey: cartillaKeys.detail(pacienteId, cartillaId) })
      toast.success('Categoría actualizada')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Eliminación de categoría (DELETE .../categorias/{categoriaId}): borra items hijos. */
export function useEliminarCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      cartillaId,
      categoriaId,
    }: {
      pacienteId: string
      cartillaId: string
      categoriaId: string
    }) => cartillasService.eliminarCategoria(pacienteId, cartillaId, categoriaId),
    onSuccess: (_data, { pacienteId, cartillaId }) => {
      void queryClient.invalidateQueries({ queryKey: cartillaKeys.detail(pacienteId, cartillaId) })
      toast.success('Categoría eliminada')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Creación de item (POST .../items): refetch del detalle. */
export function useCrearItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      cartillaId,
      categoriaId,
      input,
    }: {
      pacienteId: string
      cartillaId: string
      categoriaId: string
      input: ItemCartillaInput
    }) => cartillasService.crearItem(pacienteId, cartillaId, categoriaId, input),
    onSuccess: (_item, { pacienteId, cartillaId }) => {
      void queryClient.invalidateQueries({ queryKey: cartillaKeys.detail(pacienteId, cartillaId) })
      toast.success('Item agregado')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Actualización de item (PUT .../items/{itemId}): refetch del detalle. */
export function useActualizarItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      cartillaId,
      categoriaId,
      itemId,
      input,
    }: {
      pacienteId: string
      cartillaId: string
      categoriaId: string
      itemId: string
      input: ItemCartillaInput
    }) =>
      cartillasService.actualizarItem(pacienteId, cartillaId, categoriaId, itemId, input),
    onSuccess: (_item, { pacienteId, cartillaId }) => {
      void queryClient.invalidateQueries({ queryKey: cartillaKeys.detail(pacienteId, cartillaId) })
      toast.success('Item actualizado')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Eliminación de item (DELETE .../items/{itemId}): refetch del detalle. */
export function useEliminarItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      cartillaId,
      categoriaId,
      itemId,
    }: {
      pacienteId: string
      cartillaId: string
      categoriaId: string
      itemId: string
    }) => cartillasService.eliminarItem(pacienteId, cartillaId, categoriaId, itemId),
    onSuccess: (_data, { pacienteId, cartillaId }) => {
      void queryClient.invalidateQueries({ queryKey: cartillaKeys.detail(pacienteId, cartillaId) })
      toast.success('Item eliminado')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Pictogramas globales para el selector del editor (GET /api/pictogramas-globales). */
export function usePictogramasGlobales() {
  return useQuery({
    queryKey: pictogramasKeys.all,
    queryFn: () => cartillasService.listarPictogramasGlobales(),
  })
}