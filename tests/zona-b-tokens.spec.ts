import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://localhost:5173'

/**
 * Zona B token family (sdd/modo-uso-zona-b/design D1, spec `zona-b-tokens`).
 * Contrast is verified against the raw computed `--zona-b-*` CSS custom
 * properties declared in `:root` (same `leerVariables` pattern as
 * `design-tokens.spec.ts`'s `--primary` suite) — every token is a flat
 * opaque value with no `.dark` override, so it resolves identically on any
 * route, no auth/fixture data required. Contrast is computed in-spec from
 * the actual rendered values, never asserted from a hardcoded expectation
 * of what the CSS *should* contain.
 */

/** Lee valores crudos de custom properties CSS en <html>, sin conversión de color. */
function leerVariables(page: Page, nombres: string[]) {
  return page.evaluate((vars) => {
    const estilos = getComputedStyle(document.documentElement)
    return Object.fromEntries(vars.map((v) => [v, estilos.getPropertyValue(v).trim()]))
  }, nombres)
}

/**
 * WCAG relative-luminance + contrast-ratio formulas (SC 1.4.3 / 1.4.11),
 * applied to the `#rrggbb` hex values Zona B declares — computed in-spec,
 * not eyeballed. See https://www.w3.org/TR/WCAG21/#dfn-relative-luminance.
 */
function canalLineal(c: number): number {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function luminanciaRelativa(hex: string): number {
  const limpio = hex.replace('#', '')
  const valor =
    limpio.length === 3
      ? limpio
          .split('')
          .map((c) => c + c)
          .join('')
      : limpio
  const r = Number.parseInt(valor.slice(0, 2), 16) / 255
  const g = Number.parseInt(valor.slice(2, 4), 16) / 255
  const b = Number.parseInt(valor.slice(4, 6), 16) / 255
  return 0.2126 * canalLineal(r) + 0.7152 * canalLineal(g) + 0.0722 * canalLineal(b)
}

function ratioContraste(hexA: string, hexB: string): number {
  const l1 = luminanciaRelativa(hexA)
  const l2 = luminanciaRelativa(hexB)
  const [claro, oscuro] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (claro + 0.05) / (oscuro + 0.05)
}

test.describe('Zona B tokens — familia declarada, opaca y light-only', () => {
  test('expone los 10 tokens --zona-b-* con valores opacos (#rrggbb, sin alpha)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/login`)
    const nombres = [
      '--zona-b-surface',
      '--zona-b-surface-raised',
      '--zona-b-border',
      '--zona-b-border-soft',
      '--zona-b-nav',
      '--zona-b-accent',
      '--zona-b-accent-foreground',
      '--zona-b-foreground',
      '--zona-b-foreground-muted',
      '--zona-b-foreground-subtle',
    ]
    const valores = await leerVariables(page, nombres)
    for (const nombre of nombres) {
      expect(valores[nombre], `${nombre} debe estar declarado`).not.toBe('')
      expect(valores[nombre], `${nombre} debe ser opaco (#rrggbb o #rgb)`).toMatch(
        /^#[0-9a-fA-F]{3,6}$/,
      )
    }
  })

  test('no declara ningún override dentro de .dark (decisión light-only deliberada)', async ({
    page,
  }) => {
    await page.goto(`${BASE}/login`)
    const valoresAntes = await leerVariables(page, ['--zona-b-surface', '--zona-b-foreground'])

    await page.evaluate(() => document.documentElement.classList.add('dark'))
    const valoresDark = await leerVariables(page, ['--zona-b-surface', '--zona-b-foreground'])
    await page.evaluate(() => document.documentElement.classList.remove('dark'))

    // Sin override en `.dark`, los valores heredan de `:root` sin cambiar.
    expect(valoresDark['--zona-b-surface']).toBe(valoresAntes['--zona-b-surface'])
    expect(valoresDark['--zona-b-foreground']).toBe(valoresAntes['--zona-b-foreground'])
  })

  test('texto: surface/foreground cumple >= 4.5:1 (WCAG SC 1.4.3)', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    const v = await leerVariables(page, ['--zona-b-surface', '--zona-b-foreground'])
    expect(ratioContraste(v['--zona-b-surface'], v['--zona-b-foreground'])).toBeGreaterThanOrEqual(
      4.5,
    )
  })

  test('texto: nav/foreground cumple >= 4.5:1 (WCAG SC 1.4.3)', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    const v = await leerVariables(page, ['--zona-b-nav', '--zona-b-foreground'])
    expect(ratioContraste(v['--zona-b-nav'], v['--zona-b-foreground'])).toBeGreaterThanOrEqual(4.5)
  })

  test('texto: accent/accent-foreground cumple >= 4.5:1 (WCAG SC 1.4.3)', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    const v = await leerVariables(page, ['--zona-b-accent', '--zona-b-accent-foreground'])
    expect(
      ratioContraste(v['--zona-b-accent'], v['--zona-b-accent-foreground']),
    ).toBeGreaterThanOrEqual(4.5)
  })

  test('no-texto: border vs surface cumple >= 3:1 (WCAG SC 1.4.11)', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    const v = await leerVariables(page, ['--zona-b-border', '--zona-b-surface'])
    expect(ratioContraste(v['--zona-b-border'], v['--zona-b-surface'])).toBeGreaterThanOrEqual(3)
  })
})
