import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LoadingScreen } from '../../components/LoadingScreen'
import { Button } from '../../components/ui/button'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Separator } from '../../components/ui/separator'
import { useGoogleButton } from '../../hooks/useGoogleButton'
import { useAuth } from '../../hooks/useAuth'
import { limpiarCallbackGoogle, obtenerIdTokenDeCallback } from '../../lib/google'
import { formatError } from '../../lib/utils'
import { loginSchema, type LoginValues } from './schemas'
import { AuthLayout } from './AuthLayout'

export function Login() {
  const { usuario, isInitializing, login, loginConGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [procesandoGoogle, setProcesandoGoogle] = useState(false)
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  /** Consume un idToken de Google: lo manda al backend y decide el redirect. */
  const autenticarConGoogle = async (idToken: string) => {
    setProcesandoGoogle(true)
    try {
      const resultado = await loginConGoogle(idToken)
      if (resultado.requiereRol) {
        // El usuario ya tiene cuenta de Google pero le falta elegir el rol.
        // Pasamos el idToken SOLO a la siguiente página vía location.state
        // (memoria, no persiste) para que FormCompletarGoogle no deba re-abrir
        // el popup de Google (que es la causa raíz del "botón no funciona").
        navigate('/registro?google=true', {
          replace: true,
          state: { idTokenGoogle: idToken },
        })
        return
      }
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(formatError(error))
    } finally {
      setProcesandoGoogle(false)
    }
  }

  // callback estable que el hook de Google usa (evita re-montar el botón).
  const onIdToken = (token: string) => {
    void autenticarConGoogle(token)
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  // OJO: este hook va ANTES de todo return condicional (regla de hooks).
  const { contenedorRef, error: errorGoogle, cargando: cargandoBoton } =
    useGoogleButton(clientId, onIdToken, Boolean(clientId), {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
    })

  if (isInitializing) {
    return <LoadingScreen label="Cargando…" />
  }

  // Logueado en /login → nunca ve el formulario (REQUISITO T5).
  if (usuario) {
    return <Navigate to="/" replace />
  }

  // Respaldo: si el login llegó con un credential en la URL (flujo redirect de
  // GIS, o un refresh tras volver del consentimiento), consumilo automáticamente.
  const idTokenDeUrl = obtenerIdTokenDeCallback(location.search)
  if (idTokenDeUrl && !procesandoGoogle && !usuario) {
    limpiarCallbackGoogle(window.history)
    void autenticarConGoogle(idTokenDeUrl)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values)
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(formatError(error))
    }
  })

  const enviando = form.formState.isSubmitting
  const ocupado = enviando || procesandoGoogle

  return (
    <AuthLayout titulo="Ingresá a tu cuenta" subtitulo="Accedé al panel de CAA">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
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
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Button
          type="submit"
          disabled={ocupado}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {enviando && <Loader2 className="animate-spin" aria-hidden="true" />}
          Ingresar
        </Button>
        <div className="flex items-center gap-3" aria-hidden="true">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">o</span>
          <Separator className="flex-1" />
        </div>

        {/* Contenedor donde GIS renderiza el botón oficial de Google */}
        <div ref={contenedorRef} className="w-full [&>div]:w-full [&>div>iframe]:w-full" />
        {cargandoBoton && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Cargando opciones de Google…
          </div>
        )}
        {errorGoogle && (
          <p role="alert" className="text-center text-sm text-destructive">
            {errorGoogle}
          </p>
        )}

        <p className="text-center text-sm text-muted-foreground">
          ¿No tenés cuenta?{' '}
          <Link to="/registro" className="font-medium text-blue-600 hover:text-blue-700 hover:underline">
            Registrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
