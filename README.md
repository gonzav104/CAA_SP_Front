# CAA_SP_Front — Frontend de Comunicación Aumentativa y Alternativa

> [!IMPORTANT]
> **Salvedad sobre el versionado de `.md`.**
> Por decisión del proyecto, `.gitignore` excluye los archivos `*.md` (sección «Archivos de configuración de IA y docs»): la documentación en Markdown —`AGENTS.md`, `INFORME_AUDITORIA.md`, artefactos de `openspec/` y `sdd/`— **no se sube al repositorio** y vive únicamente en local (puede comprobarse con `git ls-files '*.md'`).
> **Este `README.md` es la única excepción**: el `.gitignore` incluye la regla `!README.md`, por lo que sí está versionado y se sube al repo. Si en el futuro se quisiera versionar otra documentación, hay que agregar su excepción explícita (por ejemplo `!INFORME_AUDITORIA.md`) o usar `git add -f <archivo>`.

---

## 1. Descripción del proyecto

Aplicación web de **Comunicación Aumentativa y Alternativa (CAA)** para personas con dificultades en el habla. El frontend sirve a dos audiencias muy distintas, con dos interfaces separadas:

1. **Terapeutas y familias** — *dashboard* de gestión: pacientes, cartillas, sesiones, colaboradores y pictogramas.
2. **Niño/a usuario de CAA** — interfaz de comunicación simple, visual, táctil y de alta accesibilidad.

El backend es **Spring Boot** y vive en el repositorio hermano [`CAA_SP`](https://github.com/gonzav104/CAA_SP) (base local `http://localhost:8080`, Swagger en `http://localhost:8080/swagger-ui/index.html`).

La interfaz debe ser profesional, accesible, predecible y fácil de usar. **No** es un SaaS genérico ni una interfaz «hecha por IA».

## 2. Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| UI | React 19 · TypeScript estricto |
| Build / dev | Vite · Oxlint |
| Routing | React Router v7 |
| Datos | TanStack Query · Axios |
| Formularios | React Hook Form · Zod (zodResolver) |
| Estilos | Tailwind CSS · shadcn/ui |
| Tiempo de ejecución | Node ≥ 20.19 (se desarrolla con Node 24) |
| Tests unitarios | Vitest · Testing Library · jsdom |
| Tests E2E | Playwright |

## 3. Requisitos previos

- **Node.js** ≥ 20.19 (probado con Node 24) y npm ≥ 10.
- **Backend `CAA_SP` corriendo** en `http://localhost:8080` (el frontend no funciona sin él: todas las pantallas consultan la API).

## 4. Instalación y puesta en marcha

```bash
npm install          # instala dependencias (necesario con node_modules fresco o incompleto)
npm run dev          # Vite en http://localhost:5173
```

`vite.config.ts` ya incluye proxy en desarrollo:

```
/auth  → http://localhost:8080
/api   → http://localhost:8080
```

En producción el `baseURL` de Axios es directo a `http://localhost:8080` (ver `src/services/api.ts`).

### Variables de entorno

No hay `.env.example`; las variables que se leen son:

| Variable | Uso | ¿Obligatoria? |
| --- | --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Login con Google (botón en `Login.tsx`) | Solo si se usa Google Auth |

Los valores se colocan en un archivo `.env` local (ignorado por git).

## 5. Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Typecheck (`tsc -b`) + build de producción (`vite build`) |
| `npm run check` | Typecheck + build completo |
| `npm run lint` | Lint con Oxlint (`oxlint`) |
| `npm run test` | Tests unitarios con Vitest (`vitest run`) |
| `npx playwright test` | Tests E2E (requiere dev server + backend + browsers instalados) |

## 6. Estructura del proyecto

```
src/
├── components/        # Componentes compartidos (ui/ = shadcn, pictogramas/, pacientes/)
├── context/           # AuthContext (sesión y rol)
├── hooks/             # Hooks de dominio: useAuth, cartillas, pacientes, sesiones,
│                      #   colaboradores, pictogramas-*, arasaac, usePosesionCartilla,
│                      #   constructor-oraciones (frase del modo de uso), queryKeys
├── layouts/           # DashboardLayout (Zona A) y shell/ (AppHeader, AppSidebar,
│                      #   SidebarNav, MobileNavDrawer, NavItem, navItems)
├── lib/               # Utilidades puras: color (paleta Fitzgerald), tts, arasaac,
│                      #   cartilla, seleccionPictograma, resumenPaciente, paciente, google
├── pages/             # Pantallas por dominio:
│   ├── auth/          #   Login, Registro, OlvidePassword, RestablecerPassword
│   ├── pacientes/     #   Lista, NuevoPaciente, EditarPaciente, PacienteOverview, PictogramasCustom
│   ├── cartillas/     #   ListaCartillas, CartillaView, EditorCartilla, FormCategoriaInline,
│   │                  #   FormItemInline, SeleccionPictograma, seccionCategoria, accesoCartilla
│   ├── sesiones/      #   ListaSesiones, NuevaSesion, EditarSesion
│   ├── colaboradores/ #   ListaColaboradores, AgregarColaborador
│   ├── familiar/      #   FamiliarDashboard
│   └── modo-uso/      #   ModoUso (Zona B), geometria, organizacion
├── routes/            # router.tsx (definición central de rutas) y RedirectPorRol
├── services/          # Capa HTTP: api.ts (Axios + interceptor 401) y un servicio por dominio
├── testUtils/         # Utilidades de test (jsdom smoke)
└── types/             # Tipos espejo del backend: Usuario, Paciente, Cartilla, Categoria,
                       #   ItemCartilla, Pictograma, Sesion, Colaborador
tests/                 # Suites E2E de Playwright (por flujo: shell-navegacion,
                       #   dashboard-pacientes, paciente-overview, design-tokens,
                       #   pictogramas-guard, modo-uso, zona-b-tokens)
```

Los **unit tests** viven co-localizados en `src/**/*.test.{ts,tsx}` y los **E2E** en `tests/*.spec.ts` (Playwright). Vitest está configurado para recolectar **solo** `src/` (ver `vite.config.ts`); `tests/` es exclusivo de Playwright.

## 7. Dos zonas de producto

### Zona A — Dashboard de adultos (terapeutas y familias)

- Look **profesional, sobrio y de gestión** (principios B2B tipo Linear/Notion). No debe parecer una app infantil.
- Navegación por **sidebar contextual** (ver `navItems.ts`): Pacientes, Cartillas, Sesiones (solo TERAPEUTA), Colaboradores y Pictogramas, según rol y permisos.
- Formularios de 3+ campos: preferir **página propia**, no modal. Los modales quedan para confirmaciones y acciones simples.
- La cartilla del dashboard es una vista de **administración/preview**, distinta de la pantalla del niño.
- Colores: azul profesional (`blue-600` / `blue-700`), migrado a la variable `--primary`.

### Zona B — Modo de uso (comunicación del niño)

- Interfaz **simple, visual, táctil, predecible y de alto contraste**, con poca carga cognitiva.
- **Sin** sidebar ni navbar del dashboard: debe sentirse como una herramienta de comunicación.
- Categorías con la **convención Fitzgerald** (verbos → verde, sustantivos/comidas → amarillo, sentimientos → azul, personas → rosa, preguntas → naranja, negación → rojo).
- Tiles grandes y táctiles (referencia mínima **~120px**), cada uno con imagen + etiqueta textual.
- **Voz**: al tocar un pictograma se reproduce el término con `window.speechSynthesis`; siempre se llama `speechSynthesis.cancel()` antes de reproducir uno nuevo (ver `src/lib/tts.ts`).
- **Piso táctil de 44px** exigido en todos los controles interactivos (geometría en `src/pages/modo-uso/geometria.ts`).
- **Salida con confirmación**: el niño no debe abandonar la pantalla accidentalmente.
- **Persistencia de la frase** entre recargas (`src/hooks/constructor-oraciones.ts`) con limpieza reversible.

## 8. Autenticación y roles

- Autenticación por **cookie httpOnly `jwt`** (nunca se almacena ni manipula el JWT en JS).
- Axios usa `withCredentials: true` (ver `src/services/api.ts`).
- Flujos: login local, login con Google (`VITE_GOOGLE_CLIENT_ID`), registro, olvidé mi contraseña, restablecer contraseña.
- El interceptor de Axios redirige a `/login` ante `401`, excepto en los **endpoints públicos** (login, logout, google, registro, olvide/restablecer password y `/api/usuarios/me`, que solo significa «no hay sesión»).

### Roles y permisos

| Rol | Ve / puede |
| --- | --- |
| `TERAPEUTA` | Todo: pacientes, cartillas, **sesiones**, colaboradores, pictogramas |
| `FAMILIAR` | Pacientes y cartillas asociadas. **Nunca** sesiones, colaboradores ni pictogramas |

- **Las sesiones son exclusivas de TERAPEUTA**: un FAMILIAR no debe ver ni acceder a esa sección desde el frontend (verificado en `navItems.ts` y en el router con `RequiereTerapeuta`).
- Los colaboradores pueden tener permisos por paciente (`EDICION_LIMITADA`, etc., ver `src/types/Permiso` y `src/lib/paciente.ts`): un TERAPEUTA siempre puede editar contenido del paciente; un FAMILIAR solo si tiene `EDICION_LIMITADA`.
- Las cartillas tienen **posesión**: el gate de edición usa `usePosesionCartilla` + el predicado `esCreadorDe` (solo el creador edita; falla cerrado → `'ajena'`).

## 9. Contrato de API (Front ↔ Back)

- Backend: `CAA_SP` · Base: `http://localhost:8080` · Swagger: `/swagger-ui/index.html`.
- **Antes de modificar una llamada, verificar endpoint/método/parámetros/body/respuesta** contra Swagger o el código del backend. No asumir nada por el nombre.

Endpoints principales:

| Área | Endpoints |
| --- | --- |
| Auth | `POST /auth/login` · `POST /auth/logout` · `POST /auth/google` · `POST /auth/google/completar-registro` · `POST /auth/olvide-password` · `POST /auth/restablecer-password` |
| Usuario | `GET /api/usuarios/me` · `POST /api/usuarios/registro` |
| Pacientes | `GET/POST /api/pacientes` · `GET/PUT/DELETE /api/pacientes/{id}` |
| Cartillas | `GET/POST/PUT/DELETE /api/pacientes/{id}/cartillas` |
| Categorías | `GET/POST/PUT/DELETE /api/pacientes/{id}/cartillas/{cartillaId}/categorias` |
| Items | `GET/POST/PUT/DELETE /api/pacientes/{id}/cartillas/{cartillaId}/categorias/{categoriaId}/items` |
| Pictogramas globales | `GET /api/pictogramas-globales` |
| Pictogramas custom | `GET/POST/PUT/DELETE /api/pacientes/{id}/pictogramas-custom` |
| Colaboradores | `GET/POST/PUT/DELETE /api/pacientes/{id}/colaboradores` |
| Sesiones | `GET/POST /api/pacientes/{id}/sesiones` (solo TERAPEUTA) |

Notas de contrato importantes:

- **Items de cartilla**: el backend exige **exactamente un recurso** por item (global *o* custom, nunca ambos, nunca ninguno). El frontend lo valida con un `refine` XOR en los schemas de Zod (`src/pages/cartillas/schemas.ts`) y el backend lo rechaza con 400.
- **Sesiones**: varios campos son **nullable** en el backend (`disposicion`, `objetivosTrabajados`, `observaciones`, `estrategiasYProximosPasos`). No asumir que todos son obligatorios; el frontend los defiende con `|| ''` / guards.
- **Los tipos** en `src/types/` representan los campos reales del backend (incluida la nulabilidad). No inventar propiedades.

## 10. Datos, formularios y código limpio

- **Datos**: toda obtención remota usa TanStack Query (`useQuery` / `useMutation` + invalidación por `queryKeys.ts`). **No** usar `useEffect` + `fetch` para datos.
- **Formularios**: React Hook Form + Zod + `zodResolver`. No crear validaciones paralelas; el frontend debe ser coherente con las restricciones reales del backend.
- **TypeScript estricto**: cero `any`, sin casts innecesarios, sin `!` no justificado.
- **Sin `console.log`** en código final (se permite `console.error` para errores críticos).
- **Control de alcance**: una tarea por vez, cambios incrementales, sin refactors oportunistas.

## 11. Testing

### Unitarios (Vitest)

```bash
npm run test
```

- Config en `vite.config.ts`: entorno base `node` + `// @vitest-environment jsdom` por archivo cuando el test necesita DOM.
- Los archivos jsdom requieren `jsdom` + `@testing-library/react` instalados (ver Troubleshooting).
- Hasta la fecha: ~56 tests en archivos node + suites jsdom co-localizadas (cartillas, posesión, constructor de oraciones).

### E2E (Playwright)

```bash
# requisito: backend en :8080 y `npm run dev` en :5173, browsers de Playwright instalados
npx playwright install chromium
npx playwright test
```

- `playwright.config.ts` organiza **proyectos por flujo** con `storageState` compartido (setups de autenticación en `tests/.auth/`): shell-navegacion (viewport móvil 390×844), pictogramas-guard (FAMILIAR vs TERAPEUTA), dashboard-pacientes, design-tokens, paciente-overview y modo-uso.
- Headless está **desactivado** por defecto (`headless: false`).
- Los artefactos de ejecución (`playwright-report/`, `test-results/`, `screenshots/`, `tests/.auth/`) están ignorados por git.

## 12. Accesibilidad

La accesibilidad es prioridad funcional, no estética. Antes de terminar un cambio visual, comprobar: contraste, tamaño de objetivos táctiles, estados de focus, navegación por teclado, etiquetas accesibles, `aria-*` solo cuando hace falta, lectura por tecnologías asistivas y comportamiento responsive.

- Zona B: atención especial al **contraste de los colores de categoría** (no asumir `text-white` sobre cualquier color; la paleta Fitzgerald está en `src/lib/color.ts`). El piso táctil de 44px está endurecido por test y por la geometría.
- Zona A: los CTAs usan `bg-primary` (`--primary`) — las specs de design tokens verifican los colores renderizados.

## 13. Informe de auditoría y deuda conocida

`INFORME_AUDITORIA.md` (local, no versionado por la salvedad de `.md`) documenta hallazgos conocidos. Los principales, vigentes a la fecha:

- **Contraste Zona B**: algunos colores de categoría no alcanzan 4.5:1 con `text-white` (p. ej. amarillo sustantivos ~1.9:1). Está trackeado como pendiente; no asumir resuelto.
- **Guards y permisos**: existen varios patrones de protección de rutas; no crear un cuarto patrón.
- **Edición de pacientes**: el gate de `Lista.tsx` fue corregido (solo TERAPEUTA edita); cuidado al tocarlo.
- **Registro y Sesión**: diferencias conocidas entre el contrato real del backend y el esperado (nullables en sesiones).

## 14. Troubleshooting

- **`TS2307: Cannot find module '@testing-library/react' / 'jsdom'`** en tests: el `node_modules` local está incompleto. Ejecutar `npm install` (los paquetes están declarados en `package.json` y en el lockfile).
- **Los tests jsdom no arrancan** (`Cannot find package 'jsdom'`): misma causa; falta `npm install`.
- **Problemas de CORS en E2E**: el backend limita orígenes a `:5173`; el E2E necesita que el dev server corra en ese puerto.
- **El login no responde**: verificar que el backend esté en `:8080` y que la cookie `jwt` se guarde (requiere `withCredentials`).

---

*Documentación de referencia. El resto de los `.md` del proyecto queda intencionalmente fuera de git (ver salvedad al inicio); este README es la excepción versionada.*