import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatError } from '../lib/utils'
import * as sesionesService from '../services/sesiones'
import type { SesionInput } from '../types'
import { pacienteKeys } from './queryKeys'

/**
 * Hooks de TanStack Query del dominio sesiones (D2).
 * - Read-only migrado de hooks/pacientes.ts.
 * - Mutations con toast + invalidación.
 * - Solo TERAPEUTA: enabled condicional con esTerapeuta.
 * - Todos los IDs son UUID (string).
 */

/** Lista de sesiones de un paciente — SOLO TERAPEUTA. */
export function useSesiones(pacienteId: string | undefined, esTerapeuta: boolean) {
  return useQuery({
    queryKey: pacienteKeys.sesiones(pacienteId ?? ''),
    queryFn: () => {
      if (pacienteId === undefined) {
        throw new Error('useSesiones requiere un pacienteId válido')
      }
      return sesionesService.listarSesiones(pacienteId)
    },
    enabled: esTerapeuta && pacienteId !== undefined,
  })
}

/**
 * Sesión puntual (GET /api/pacientes/{id}/sesiones/{sesionId}).
 * La ruta /sesiones/:id/editar está protegida por RequiereTerapeuta en el
 * router, por lo que este hook asume rol TERAPEUTA validado.
 * Devuelve undefined mientras carga o si no se encuentra el id.
 */
export function useSesion(pacienteId: string | undefined, sesionId: string | undefined) {
  return useQuery({
    queryKey: [...pacienteKeys.sesiones(pacienteId ?? ''), 'detalle', sesionId ?? ''],
    queryFn: () => {
      if (pacienteId === undefined || sesionId === undefined) {
        throw new Error('useSesion requiere pacienteId y sesionId válidos')
      }
      return sesionesService.obtenerSesion(pacienteId, sesionId)
    },
    enabled: pacienteId !== undefined && sesionId !== undefined,
  })
}

/** Creación de sesión (POST): invalida la lista y avisa con toast. */
export function useCrearSesion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pacienteId, input }: { pacienteId: string; input: SesionInput }) =>
      sesionesService.crearSesion(pacienteId, input),
    onSuccess: (_sesion, { pacienteId }) => {
      void queryClient.invalidateQueries({ queryKey: pacienteKeys.sesiones(pacienteId) })
      toast.success('Sesión creada')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Actualización de sesión (PUT): invalida la lista y avisa con toast. */
export function useActualizarSesion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      pacienteId,
      sesionId,
      input,
    }: {
      pacienteId: string
      sesionId: string
      input: SesionInput
    }) => sesionesService.actualizarSesion(pacienteId, sesionId, input),
    onSuccess: (_sesion, { pacienteId }) => {
      void queryClient.invalidateQueries({ queryKey: pacienteKeys.sesiones(pacienteId) })
      toast.success('Sesión actualizada')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Eliminación de sesión (DELETE): invalida la lista y avisa con toast. */
export function useEliminarSesion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ pacienteId, sesionId }: { pacienteId: string; sesionId: string }) =>
      sesionesService.eliminarSesion(pacienteId, sesionId),
    onSuccess: (_data, { pacienteId }) => {
      void queryClient.invalidateQueries({ queryKey: pacienteKeys.sesiones(pacienteId) })
      toast.success('Sesión eliminada')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}
