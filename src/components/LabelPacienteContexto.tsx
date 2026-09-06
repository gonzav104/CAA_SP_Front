/**
 * Etiqueta de contexto del paciente para páginas de recursos anidados
 * (sesiones, colaboradores, pictogramas). Muestra «Paciente: {nombre}» o un
 * placeholder mientras carga el detalle.
 */
export function LabelPacienteContexto({
  cargando,
  nombre,
}: {
  cargando: boolean
  nombre?: string
}) {
  if (cargando) {
    return <span className="text-muted-foreground">Cargando paciente…</span>
  }
  return (
    <span>
      Paciente: <span className="font-medium text-foreground">{nombre ?? '—'}</span>
    </span>
  )
}
