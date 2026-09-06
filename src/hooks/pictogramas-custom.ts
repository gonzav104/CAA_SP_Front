import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatError } from '../lib/utils'
import * as pictogramasCustomService from '../services/pictogramas-custom'
import { pictogramasCustomKeys } from './queryKeys'

/**
 * Hooks de TanStack Query del dominio pictogramas custom (D2).
 * - Cada paciente tiene sus propios pictogramas custom.
 * - Subida: FormData multipart (Axios detecta Content-Type solo).
 * - Eliminación: invalida la lista y avisa con toast.
 * - Todos los IDs son UUID (string).
 */

/** Lista de pictogramas custom de un paciente. */
export function usePictogramasCustom(pacienteId: string | undefined) {
  return useQuery({
    queryKey: pictogramasCustomKeys.list(pacienteId ?? ''),
    queryFn: () => {
      if (pacienteId === undefined) {
        throw new Error('usePictogramasCustom requiere un pacienteId válido')
      }
      return pictogramasCustomService.listarCustom(pacienteId)
    },
    enabled: pacienteId !== undefined,
  })
}

/** Subir pictograma custom (POST multipart): invalida la lista y avisa con toast. */
export function useSubirPictogramaCustom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      etiqueta,
      archivo,
    }: {
      pacienteId: string
      etiqueta: string
      archivo: File
    }) => pictogramasCustomService.subirCustom(pacienteId, etiqueta, archivo),
    onSuccess: (_pictograma, { pacienteId }) => {
      void queryClient.invalidateQueries({ queryKey: pictogramasCustomKeys.list(pacienteId) })
      toast.success('Pictograma subido')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Eliminar pictograma custom (DELETE): invalida la lista y avisa con toast. */
export function useEliminarPictogramaCustom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pacienteId, id }: { pacienteId: string; id: string }) =>
      pictogramasCustomService.eliminarCustom(pacienteId, id),
    onSuccess: (_data, { pacienteId }) => {
      void queryClient.invalidateQueries({ queryKey: pictogramasCustomKeys.list(pacienteId) })
      toast.success('Pictograma eliminado')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}
