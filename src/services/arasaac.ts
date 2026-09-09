import axios from 'axios'
import type { ResultadoArasaacRaw } from '../lib/arasaac'

/**
 * Cliente HTTP dedicado a la API pública de ARASAAC (AD-3).
 * SIN withCredentials: va a un tercero (api.arasaac.org), no a nuestro backend.
 * - La cookie jwt del backend jAMÁS viaja a este dominio (el navegador ata las
 *   cookies al dominio que las creó); la separación es por responsabilidad:
 *   baseURL/timeout/errores propios de un servicio externo.
 * - CORS verificado 2026-09-08: Access-Control-Allow-Origin: * en preflight y GET.
 */
export const arasaacApi = axios.create({
  baseURL: 'https://api.arasaac.org/api',
  timeout: 10000,
})

/** GET /pictograms/es/search/{termino} — busca pictogramas en el catálogo ARASAAC. */
export async function buscarEnArasaac(termino: string): Promise<ResultadoArasaacRaw[]> {
  const { data } = await arasaacApi.get<ResultadoArasaacRaw[]>(
    `/pictograms/es/search/${encodeURIComponent(termino)}`,
  )
  return data
}