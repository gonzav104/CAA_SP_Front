import type {
  Cartilla,
  CartillaDetalle,
  CartillaInput,
  Categoria,
  CategoriaInput,
  ItemCartilla,
  ItemCartillaInput,
  Pictograma,
} from '../types'
import { api } from './api'

/**
 * Endpoints del dominio cartillas (D3): CRUD anidado de cartillas/categorías/items.
 * Todos los IDs son UUID (string). El GET de una cartilla puntual devuelve
 * CartillaDetalle (categorías con items, cada item con su pictograma resuelto);
 * el listado devuelve Cartilla[] plano.
 */

/** GET /api/pacientes/{id}/cartillas — lista plana de cartillas del paciente. */
export async function listarCartillas(pacienteId: string): Promise<Cartilla[]> {
  const { data } = await api.get<Cartilla[]>(`/api/pacientes/${pacienteId}/cartillas`)
  return data
}

/** GET /api/pacientes/{id}/cartillas/{idCartilla} — detalle anidado (categorías + items). */
export async function obtenerCartilla(
  pacienteId: string,
  cartillaId: string,
): Promise<CartillaDetalle> {
  const { data } = await api.get<CartillaDetalle>(
    `/api/pacientes/${pacienteId}/cartillas/${cartillaId}`,
  )
  return data
}

/** POST /api/pacientes/{id}/cartillas — crea la cartilla y devuelve la entidad. */
export async function crearCartilla(pacienteId: string, input: CartillaInput): Promise<Cartilla> {
  const { data } = await api.post<Cartilla>(`/api/pacientes/${pacienteId}/cartillas`, input)
  return data
}

/** PUT /api/pacientes/{id}/cartillas/{idCartilla} — actualiza la cartilla. */
export async function actualizarCartilla(
  pacienteId: string,
  cartillaId: string,
  input: CartillaInput,
): Promise<Cartilla> {
  const { data } = await api.put<Cartilla>(
    `/api/pacientes/${pacienteId}/cartillas/${cartillaId}`,
    input,
  )
  return data
}

/** DELETE /api/pacientes/{id}/cartillas/{idCartilla} — elimina cartilla y sus categorías/items. */
export async function eliminarCartilla(pacienteId: string, cartillaId: string): Promise<void> {
  await api.delete(`/api/pacientes/${pacienteId}/cartillas/${cartillaId}`)
}

/** POST /api/pacientes/{id}/cartillas/{idCartilla}/categorias */
export async function crearCategoria(
  pacienteId: string,
  cartillaId: string,
  input: CategoriaInput,
): Promise<Categoria> {
  const { data } = await api.post<Categoria>(
    `/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias`,
    input,
  )
  return data
}

/** PUT /api/pacientes/{id}/cartillas/{idCartilla}/categorias/{idCategoria} */
export async function actualizarCategoria(
  pacienteId: string,
  cartillaId: string,
  categoriaId: string,
  input: CategoriaInput,
): Promise<Categoria> {
  const { data } = await api.put<Categoria>(
    `/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias/${categoriaId}`,
    input,
  )
  return data
}

/** DELETE .../categorias/{idCategoria} — elimina la categoría y sus items hijos. */
export async function eliminarCategoria(
  pacienteId: string,
  cartillaId: string,
  categoriaId: string,
): Promise<void> {
  await api.delete(
    `/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias/${categoriaId}`,
  )
}

/** POST .../categorias/{idCategoria}/items */
export async function crearItem(
  pacienteId: string,
  cartillaId: string,
  categoriaId: string,
  input: ItemCartillaInput,
): Promise<ItemCartilla> {
  const { data } = await api.post<ItemCartilla>(
    `/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias/${categoriaId}/items`,
    input,
  )
  return data
}

/** PUT .../categorias/{idCategoria}/items/{idItem} */
export async function actualizarItem(
  pacienteId: string,
  cartillaId: string,
  categoriaId: string,
  itemId: string,
  input: ItemCartillaInput,
): Promise<ItemCartilla> {
  const { data } = await api.put<ItemCartilla>(
    `/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias/${categoriaId}/items/${itemId}`,
    input,
  )
  return data
}

/** DELETE .../categorias/{idCategoria}/items/{idItem} */
export async function eliminarItem(
  pacienteId: string,
  cartillaId: string,
  categoriaId: string,
  itemId: string,
): Promise<void> {
  await api.delete(
    `/api/pacientes/${pacienteId}/cartillas/${cartillaId}/categorias/${categoriaId}/items/${itemId}`,
  )
}

/** GET /api/pictogramas-globales — pictogramas ARASAAC/globales para el selector del editor. */
export async function listarPictogramasGlobales(): Promise<Pictograma[]> {
  const { data } = await api.get<Pictograma[]>('/api/pictogramas-globales')
  return data
}
