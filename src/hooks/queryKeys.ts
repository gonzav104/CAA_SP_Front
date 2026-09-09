/**
 * Factory de query keys del dominio pacientes (D2).
 * Todos los IDs son UUID (string). `all` cubre la lista; el detalle y las
 * sub-colecciones cuelgan de la rama del paciente para invalidar/limpiar de
 * forma granular.
 */
export const pacienteKeys = {
  all: ['pacientes'] as const,
  detail: (id: string) => ['pacientes', id] as const,
  cartillas: (id: string) => ['pacientes', id, 'cartillas'] as const,
  sesiones: (id: string) => ['pacientes', id, 'sesiones'] as const,
  colaboradores: (id: string) => ['pacientes', id, 'colaboradores'] as const,
}

/**
 * Factory de query keys del dominio cartillas (D2).
 * `cartillaKeys.all` comparte rama con pacienteKeys.cartillas (mismo arreglo →
 * misma entrada de caché); `detail` cuelga el detalle anidado, que es la clave
 * que invalidan las mutations del editor para refetchear categorías/items.
 */
export const cartillaKeys = {
  all: (pacienteId: string) => ['pacientes', pacienteId, 'cartillas'] as const,
  detail: (pacienteId: string, cartillaId: string) =>
    ['pacientes', pacienteId, 'cartillas', cartillaId] as const,
}

/** Pictogramas globales (GET /api/pictogramas-globales). */
export const pictogramasKeys = {
  all: ['pictogramas-globales'] as const,
}

/**
 * Factory de query keys de la búsqueda en el catálogo ARASAAC (API pública,
 * cliente sin cookie). El término llega ya debounced desde el componente.
 */
export const arasaacKeys = {
  search: (termino: string) => ['arasaac', 'search', termino] as const,
}

/**
 * Factory de query keys del dominio pictogramas custom (D2).
 * Cada paciente tiene su propia rama de pictogramas custom.
 */
export const pictogramasCustomKeys = {
  all: ['pictogramas-custom'] as const,
  list: (pacienteId: string) => ['pictogramas-custom', pacienteId] as const,
}
