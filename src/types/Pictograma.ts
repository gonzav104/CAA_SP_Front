/**
 * PictogramaInfoDTO — pictograma resuelto dentro de un ItemDetalle en el
 * detalle anidado de una cartilla (CategoriaDetalle.items[].pictograma).
 */
export interface PictogramaInfo {
  id: string // UUID
  etiqueta: string
  imagenUrl: string
  tipo: string
}

/**
 * PictogramaGlobalResponseDTO (GET /api/pictogramas-globales).
 * Pictogramas ARASAAC/globales para el selector del editor.
 */
export interface Pictograma {
  id: string // UUID
  etiqueta: string
  imagenUrl: string
  creadoEn: string // ISO datetime
}

/**
 * PictogramaCustomResponseDTO (GET /api/pacientes/{id}/pictogramas-custom;
 * POST/PUT son multipart: etiqueta + archivo). Un pictograma custom pertenece
 * a un paciente puntual.
 */
export interface PictogramaCustom {
  id: string // UUID
  pacienteId: string // UUID
  etiqueta: string
  imagenUrl: string
  creadoEn: string // ISO datetime
}
