import { FileQuestion, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'

/**
 * Superficies de acceso a cartilla (change cartillas-revival, Fase E1, obs #85
 * Decisión 5). Ambas honestas respecto de lo que `useCartilla` realmente sabe
 * (obs #81: el backend responde 404 — nunca 403 — para una cartilla ajena, 14
 * tests de integración, cero `isForbidden`):
 *
 * - `NoticeSoloLectura`: la cartilla se obtuvo (200, `creadorId` en mano) y NO
 *   sos el creador — la posesión es *conocida*, así que la copy la nombra.
 * - `NoticeNoEncontrada`: la cartilla NO se obtuvo (404) — la posesión es
 *   *desconocida* (un 404 no distingue "no existe" de "no es tuya"), así que
 *   la copy NUNCA afirma quién es o no el dueño.
 */

/** Notice de solo lectura: se muestra cuando el usuario no es el creador. */
export function NoticeSoloLectura({
  volverARevisión,
  volverAPaciente,
}: {
  volverARevisión: string
  volverAPaciente: string
}) {
  return (
    <Card className="py-12 shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Solo el creador puede editar esta cartilla</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Podés verla en modo revisión o abrirla en modo uso con el chico.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={volverARevisión}>Ver cartilla</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={volverAPaciente}>Volver al paciente</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Notice de "no encontrada": se muestra cuando `useCartilla`/`usePosesionCartilla`
 * resuelve `estado: 'no-encontrada'` (404). Nunca afirma conocimiento de
 * posesión — solo que la cartilla no está disponible.
 */
export function NoticeNoEncontrada({ volverACartillas }: { volverACartillas: string }) {
  return (
    <Card className="py-12 shadow-sm">
      <CardContent className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileQuestion className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">No encontramos esta cartilla</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Puede que se haya eliminado o que no esté disponible para tu cuenta.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to={volverACartillas}>Volver a cartillas</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
