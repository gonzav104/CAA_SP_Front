import { RouterProvider } from 'react-router-dom'
import { Toaster } from './components/ui/sonner'
import { router } from './routes/router'

/**
 * Punto de montaje del data router (createBrowserRouter, D1).
 * Reemplaza al BrowserRouter del template. El orden de providers vive en
 * main.tsx (QueryClientProvider > AuthProvider > App) — AuthProvider usa
 * TanStack Query, por eso va dentro del QueryClient.
 */
export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}