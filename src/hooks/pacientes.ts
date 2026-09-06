import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatError } from '../lib/utils'
import * as pacientesService from '../services/pacientes'
import type { PacienteInput } from '../types'
import { pacienteKeys } from './queryKeys'

/**
 * Hooks de TanStack Query del dominio pacientes (D2).
 * - Las mutations centralizan toast (éxito/error) e invalidación de claves;
 *   las páginas solo llaman mutateAsync y navegan.
 * - Sesiones/Colaboradores reciben `esTerapeuta` porque un FAMILIAR jamás debe
 *   disparar esos endpoints (enabled condicional).
 * - Todos los IDs son UUID (string).
 */

/** Lista de pacientes (GET /api/pacientes). */
export function usePacientes() {
  return useQuery({
    queryKey: pacienteKeys.all,
    queryFn: () => pacientesService.listarPacientes(),
  })
}

/** Detalle de un paciente (GET /api/pacientes/{id}). `id` undefined → deshabilitada. */
export function usePaciente(id: string | undefined) {
  return useQuery({
    queryKey: pacienteKeys.detail(id ?? ''),
    queryFn: () => {
      if (id === undefined) {
        throw new Error('usePaciente requiere un id válido')
      }
      return pacientesService.obtenerPaciente(id)
    },
    enabled: id !== undefined,
  })
}

/** Creación (POST /api/pacientes): invalida la lista y avisa con toast. */
export function useCrearPaciente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: PacienteInput) => pacientesService.crearPaciente(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pacienteKeys.all })
      toast.success('Paciente creado')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Actualización (PUT /api/pacientes/{id}): invalida detalle + lista y avisa con toast. */
export function useActualizarPaciente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PacienteInput }) =>
      pacientesService.actualizarPaciente(id, input),
    onSuccess: (paciente) => {
      void queryClient.invalidateQueries({ queryKey: pacienteKeys.detail(paciente.id) })
      void queryClient.invalidateQueries({ queryKey: pacienteKeys.all })
      toast.success('Paciente actualizado')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/**
 * Eliminación (DELETE /api/pacientes/{id}): expone mutateAsync para que la UI
 * la llame DESPUÉS de confirmar en el AlertDialog. Invalida la lista y limpia
 * el detalle cacheado.
 */
export function useEliminarPaciente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pacientesService.eliminarPaciente(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: pacienteKeys.all })
      queryClient.removeQueries({ queryKey: pacienteKeys.detail(id) })
      toast.success('Paciente eliminado')
    },
    onError: (error) => toast.error(formatError(error)),
  })
}

/** Sesiones de un paciente — migrado a hooks/sesiones.ts. */
/** Colaboradores de un paciente — migrado a hooks/colaboradores.ts. */
