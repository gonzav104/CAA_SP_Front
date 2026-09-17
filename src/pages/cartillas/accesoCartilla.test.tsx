// @vitest-environment jsdom
/**
 * Unit tests de las superficies de acceso a cartilla (change cartillas-revival,
 * Fase E1, obs #85 Decisión 5): `NoticeSoloLectura` se MUEVE verbatim desde
 * `EditorCartilla.tsx` (mismos props, mismo JSX, misma copy — no se reescribe);
 * `NoticeNoEncontrada` es nueva. Los dos honestos surfaces del obs #81: 404
 * nunca distingue "no existe" de "no es tuya", así que `NoticeNoEncontrada`
 * jamás afirma conocimiento de posesión (nunca dice "no sos el dueño").
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { NoticeNoEncontrada, NoticeSoloLectura } from './accesoCartilla'

afterEach(() => {
  cleanup()
})

describe('NoticeSoloLectura', () => {
  it('renderiza la copy existente y los dos links de vuelta', () => {
    render(
      <MemoryRouter>
        <NoticeSoloLectura
          volverARevisión="/pacientes/p1/cartillas/c1"
          volverAPaciente="/pacientes/p1"
        />
      </MemoryRouter>,
    )

    expect(
      screen.getByText('Solo el creador puede editar esta cartilla'),
    ).toBeTruthy()
    expect(
      screen.getByText('Podés verla en modo revisión o abrirla en modo uso con el chico.'),
    ).toBeTruthy()

    const verCartilla = screen.getByRole('link', { name: 'Ver cartilla' })
    expect(verCartilla.getAttribute('href')).toBe('/pacientes/p1/cartillas/c1')

    const volverAlPaciente = screen.getByRole('link', { name: 'Volver al paciente' })
    expect(volverAlPaciente.getAttribute('href')).toBe('/pacientes/p1')
  })
})

describe('NoticeNoEncontrada', () => {
  it('renderiza copy de "no encontrada" y un link de vuelta a la lista de cartillas', () => {
    render(
      <MemoryRouter>
        <NoticeNoEncontrada volverACartillas="/pacientes/p1/cartillas" />
      </MemoryRouter>,
    )

    expect(screen.getByText('No encontramos esta cartilla')).toBeTruthy()

    const volver = screen.getByRole('link', { name: 'Volver a cartillas' })
    expect(volver.getAttribute('href')).toBe('/pacientes/p1/cartillas')
  })

  it('nunca afirma conocimiento de posesión (404 no distingue "no existe" de "no es tuya", obs #81)', () => {
    render(
      <MemoryRouter>
        <NoticeNoEncontrada volverACartillas="/pacientes/p1/cartillas" />
      </MemoryRouter>,
    )

    const texto = document.body.textContent ?? ''
    expect(texto.toLowerCase()).not.toContain('no sos el dueño')
    expect(texto.toLowerCase()).not.toContain('no sos la dueña')
    expect(texto.toLowerCase()).not.toContain('no eres el dueño')
    expect(texto.toLowerCase()).not.toContain('propietario')
  })
})
