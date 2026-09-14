/**
 * Nombre de la sección activa para el título del header (`<h1>` en `AppHeader`).
 * Extracción PURA (lógica sin cambios) desde `DashboardLayout.tsx`.
 */
export function tituloDeSeccion(pathname: string): string {
  const segmentos = pathname.split('/').filter(Boolean)
  if (segmentos[0] === 'familiar') return 'Mi familia'
  if (segmentos[0] === 'pacientes') {
    if (segmentos.length >= 3) {
      const sub = segmentos[2]
      if (sub === 'cartillas') return 'Cartillas'
      if (sub === 'sesiones' && segmentos[3] === 'nuevo') return 'Nueva sesión'
      if (sub === 'sesiones' && segmentos[3] === 'editar') return 'Editar sesión'
      if (sub === 'sesiones') return 'Sesiones'
      if (sub === 'colaboradores' && segmentos[3] === 'agregar') return 'Agregar colaborador'
      if (sub === 'colaboradores') return 'Colaboradores'
      if (sub === 'pictogramas') return 'Pictogramas'
    }
    if (segmentos.length === 2) return 'Paciente'
  }
  return 'Pacientes'
}
