import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { formatError } from '../lib/utils'
import * as pictogramasGlobalesService from '../services/pictogramas-globales'
import type { MaterializarPictogramaGlobalRequest } from '../types'
import { pictogramasKeys } from './queryKeys'

/**
 * Materializa un pictograma ARASAAC como global (POST .../materializar, AD-4).
 * - onSuccess: invalida `pictogramasKeys.all` (el nuevo aparece en "Globales
 *   guardados") + toast de éxito.
 * - onError: toast con formatError. Si el backend todavía no tiene el endpoint
 *   (desfase Fase 1/Fase 2), el resto del editor no se rompe: solo no selecciona.
 * - El dedupe es idempotente del backend (arasaac_id unique → mismo UUID).
 */
export function useMaterializarPictogramaGlobal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: MaterializarPictogramaGlobalRequest) =>
      pictogramasGlobalesService.materializarPictogramaGlobal(input),
    onSuccess: (pictograma) => {
      void queryClient.invalidateQueries({ queryKey: pictogramasKeys.all })
      toast.success(`Pictograma «${pictograma.etiqueta}» guardado en globales`)
    },
    onError: (error) => toast.error(formatError(error)),
  })
}