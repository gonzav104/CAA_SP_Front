import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { ApiError } from '../services/api'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mensaje legible de un error para mostrar en la UI.
 * Prioriza el mensaje limpio del backend (ApiError); cae a Error genérico si no hay mensaje.
 */
export function formatError(error: unknown): string {
  if (error instanceof ApiError && error.message) {
    return error.message
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Ocurrió un error inesperado. Intentalo de nuevo.'
}