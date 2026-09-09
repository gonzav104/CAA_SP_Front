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
 * `arasaacId` está presente a partir del backend Fase 2 (el DTO lo incluye en
 * GET y en POST materializar); los 24 seedados sin backfill lo omiten.
 */
export interface Pictograma {
  id: string // UUID
  etiqueta: string
  imagenUrl: string
  creadoEn: string // ISO datetime
  arasaacId?: number
}

/**
 * MaterializarPictogramaGlobalRequest — POST /api/pictogramas-globales/materializar.
 * Materializa un pictograma del catálogo ARASAAC como pictograma global.
 * Dedupe idempotente del backend por arasaac_id unique (repetir → mismo UUID).
 */
export interface MaterializarPictogramaGlobalRequest {
  arasaacId: number
  etiqueta: string
}

/**
 * MaterializarPictogramaGlobalResponse — PictogramaGlobalResponseDTO del POST
 * materializar: 201 recién materializado; 200 = dedupe hit (mismo UUID).
 */
export interface MaterializarPictogramaGlobalResponse {
  id: string // UUID
  etiqueta: string
  arasaacId: number
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
