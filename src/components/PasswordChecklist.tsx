import { CircleCheck, CircleX } from 'lucide-react'
import {
  PASSWORD_DIGIT,
  PASSWORD_LOWER,
  PASSWORD_MIN_LENGTH,
  PASSWORD_SYMBOL,
  PASSWORD_UPPER,
} from '../pages/auth/schemas'

/**
 * Ítem del checklist de password: check verde si se cumple, x gris si no.
 * Feedback SOLO visual — la validación real la hace el schema Zod en el submit.
 */
export function PasswordCheckItem({ cumple, etiqueta }: { cumple: boolean; etiqueta: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
      {cumple ? (
        <CircleCheck className="size-4 shrink-0 text-green-600" aria-hidden="true" />
      ) : (
        <CircleX className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      )}
      <span>{etiqueta}</span>
    </li>
  )
}

/**
 * Checklist en vivo del password: usa las MISMAS piezas del PASSWORD_PATTERN
 * de schemas.ts (PASSWORD_LOWER/UPPER/DIGIT/SYMBOL/MIN_LENGTH) — no inventa
 * reglas nuevas. Se actualiza mientras el usuario escribe (form.watch).
 */
export function PasswordChecklist({ password }: { password: string }) {
  const checks: ReadonlyArray<{ cumple: boolean; etiqueta: string }> = [
    { cumple: password.length >= PASSWORD_MIN_LENGTH, etiqueta: `Al menos ${PASSWORD_MIN_LENGTH} caracteres` },
    { cumple: PASSWORD_UPPER.test(password), etiqueta: 'Una mayúscula' },
    { cumple: PASSWORD_LOWER.test(password), etiqueta: 'Una minúscula' },
    { cumple: PASSWORD_DIGIT.test(password), etiqueta: 'Un número' },
    { cumple: PASSWORD_SYMBOL.test(password), etiqueta: 'Un símbolo' },
  ]
  return (
    <ul className="flex flex-col gap-1.5">
      {checks.map((check) => (
        <PasswordCheckItem key={check.etiqueta} cumple={check.cumple} etiqueta={check.etiqueta} />
      ))}
    </ul>
  )
}
