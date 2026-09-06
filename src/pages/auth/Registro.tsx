import { zodResolver } from '@hookform/resolvers/zod'
import { CircleCheck, Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingScreen } from '../../components/LoadingScreen'
import { Button } from '../../components/ui/button'
import { Field, FieldContent, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { useAuth } from '../../hooks/useAuth'
import { formatError } from '../../lib/utils'
import type { Rol } from '../../types'
import { AuthLayout } from './AuthLayout'
import {
  completarRegistroSchema,
  registroSchema,
  toCompletarRegistroRequest,
  toRegistroRequest,
  type CompletarRegistroValues,
  type RegistroValues,
} from './schemas'

const OPCIONES_ROL: ReadonlyArray<{ valor: Rol; etiqueta: string }> = [
  { valor: 'FAMILIAR', etiqueta: 'Familiar' },
  { valor: 'TERAPEUTA', etiqueta: 'Terapeuta' },
]

/** Aviso sobrio para el flujo de completar registro de Google. */
function NoticeGoogle() {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
      <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-medium text-foreground">Solo falta un paso:</span> tu cuenta de
        Google ya está verificada. Completá nombre, email y rol para terminar.
      </p>
    </div>
  )
}

/** Registro estándar: POST /api/usuarios/registro (nombre, email, password, rol). */
function FormRegistro() {
  const { registro } = useAuth()
  const navigate = useNavigate()
  const form = useForm<RegistroValues>({
    resolver: zodResolver(registroSchema),
    defaultValues: { nombre: '', email: '', password: '', confirmarPassword: '', rol: 'FAMILIAR' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // toRegistroRequest descarta `confirmarPassword` (campo de validación, no DTO).
      await registro(toRegistroRequest(values))
      toast.success('Cuenta creada')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(formatError(error))
    }
  })

  return (
    <AuthLayout titulo="Creá tu cuenta" subtitulo="Empezá a gestionar tableros y sesiones">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <Controller
          control={form.control}
          name="nombre"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete="given-name"
                placeholder="Nombre y apellido"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Contraseña</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="confirmarPassword"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Confirmá la contraseña</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="password"
                autoComplete="new-password"
                placeholder="Repetí la contraseña"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="rol"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="rol">Rol</FieldLabel>
              <FieldContent>
                <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="rol" aria-invalid={fieldState.invalid} className="w-full">
                    <SelectValue placeholder="Elegí tu rol" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {OPCIONES_ROL.map((opcion) => (
                      <SelectItem key={opcion.valor} value={opcion.valor}>
                        {opcion.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldContent>
            </Field>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          Crear cuenta
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
            Ingresá
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

/**
 * Completar registro de Google: POST /auth/google/completar-registro.
 * El backend ya conoce email/nombre de la cuenta de Google; acá solo se elige
 * el rol. El idToken llega por `location.state` desde Login (que lo obtuvo del
 * botón GIS) — NO se re-abre el popup de Google acá (evita el bug de doble
 * popup y el token efímero no se persiste en localStorage).
 */
function FormCompletarGoogle() {
  const { completarRegistro } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const form = useForm<CompletarRegistroValues>({
    resolver: zodResolver(completarRegistroSchema),
    defaultValues: { rol: 'FAMILIAR' },
  })

  // El idToken lo deja Login en location.state (memoria de navegación, no
  // persiste en disco). Si no está (entrada directa a /registro?google=true),
  // se muestra un mensaje de error y se redirige a /login.
  const idToken = (location.state as { idTokenGoogle?: string } | null)?.idTokenGoogle

  const onSubmit = form.handleSubmit(async (values) => {
    if (!idToken) {
      toast.error('La sesión de Google expiró. Volvé a ingresar con Google.')
      navigate('/login', { replace: true })
      return
    }
    try {
      await completarRegistro(toCompletarRegistroRequest(idToken, values))
      toast.success('Cuenta creada')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(formatError(error))
    }
  })

  return (
    <AuthLayout titulo="Completá tu registro" subtitulo="Tu cuenta de Google ya está verificada">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <NoticeGoogle />
        <Controller
          control={form.control}
          name="rol"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="rol">Rol</FieldLabel>
              <FieldContent>
                <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="rol" aria-invalid={fieldState.invalid} className="w-full">
                    <SelectValue placeholder="Elegí tu rol" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {OPCIONES_ROL.map((opcion) => (
                      <SelectItem key={opcion.valor} value={opcion.valor}>
                        {opcion.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldContent>
            </Field>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {form.formState.isSubmitting && <Loader2 className="animate-spin" aria-hidden="true" />}
          Crear cuenta
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
            Ingresá
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}

export function Registro() {
  const { usuario, isInitializing } = useAuth()
  const [searchParams] = useSearchParams()
  const esGoogle = searchParams.get('google') === 'true'

  if (isInitializing) {
    return <LoadingScreen label="Cargando…" />
  }

  if (usuario) {
    return <Navigate to="/" replace />
  }

  // Cada variante es un componente propio con su useForm — sin hooks condicionales.
  return esGoogle ? <FormCompletarGoogle /> : <FormRegistro />
}