/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Client ID de Google Identity Services (OAuth 2.0 Web).
   * Se configura en .env como VITE_GOOGLE_CLIENT_ID=<client_id>.apps.googleusercontent.com
   * Sin él, el botón «Continuar con Google» muestra un toast informativo (no rompe el build).
   */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

/**
 * Google Identity Services (script https://accounts.google.com/gsi/client).
 * Solo tipamos lo que usa el proyecto: initialize + renderButton (Sign in with
 * Google) + prompt (One Tap, respaldo). Único lugar donde se declara el tipo
 * global de window.google — las páginas lo consumen vía lib/google.ts.
 */
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string
          callback: (respuesta: { credential: string }) => void
          auto_select?: boolean
          cancel_on_tap_outside?: boolean
        }) => void
        /** Botón dedicado «Sign in with Google» — flujo robusto (no One Tap). */
        renderButton: (
          parent: HTMLElement,
          options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black'
            size?: 'large' | 'medium' | 'small'
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
            shape?: 'rectangular' | 'pill' | 'circle' | 'square'
            width?: number
            type?: 'standard' | 'icon'
            logo_alignment?: 'left' | 'center'
            click_listener?: () => void
          },
        ) => void
        /** One Tap (auto prompt) — NO se usa en el flujo principal; solo respaldo. */
        prompt: () => void
      }
    }
  }
}