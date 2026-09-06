import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatError } from '../lib/utils'
import * as colaboradoresService from '../services/colaboradores'
import type { ColaboradorInput } from '../types'
import { pacienteKeys } from './queryKeys'

/**
 * Hooks de TanStack Query del dominio colaboradores (D2).
 * - Read-only migrado de hooks/pacientes.ts.
 * - Mutations con toast + invalidación.
 * - Solo TERAPEUTA: enabled condicional con esTerapeuta.
 * - Todos los IDs son UUID (string).
 */

/** Lista de colaboradores de un paciente — SOLO TERAPEUTA. */
export function useColaboradores(pacienteId: string | undefined, esTerapeuta: boolean) {
  return useQuery({
    queryKey: pacienteKeys.colaboradores(pacienteId ?? ''),
    queryFn: () => {
      if (pacienteId === undefined) {
        throw new Error('useColaboradores requiere un pacienteId válido')
      }
      return colaboradoresService.listarColaboradores(pacienteId)
    },
    enabled: esTerapeuta && pacienteId !== undefined,
  })
}

/** Agregar colaborador (POST): invalida la lista y avisa con toast. */
export function useAgregarColaborador() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pacienteId, input }: { pacienteId: string; input: ColaboradorInput }) =>
      colaboradoresService.agregarColaborador(pacienteId, input),
    onSuccess: (_colaborador, { pacienteId }) => {
      void queryClient.invalidateQueries({ queryKey: pacienteKeys.colaboradores(pacienteId) })
      toast.success('Colaborador agregado')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Eliminar colaborador (DELETE): invalida la lista y avisa con toast. */
export function useEliminarColaborador() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      usuarioId,
    }: {
      pacienteId: string
      usuarioId: string
    }) => colaboradoresService.eliminarColaborador(pacienteId, usuarioId),
    onSuccess: (_data, { pacienteId }) => {
      void queryClient.invalidateQueries({ queryKey: pacienteKeys.colaboradores(pacienteId) })
      toast.success('Colaborador eliminado')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}
