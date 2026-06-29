import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CancelarNotaDialog } from './cancelar-nota-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('CancelarNotaDialog', () => {
  it('renderiza título, número e campo de motivo quando aberto', () => {
    renderWithProviders(
      <CancelarNotaDialog
        open
        onOpenChange={vi.fn()}
        numero="1042"
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Cancelar nota fiscal' })).toBeInTheDocument()
    expect(screen.getByText(/NF-e 1042/)).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo')).toBeInTheDocument()
  })

  it('usa texto genérico quando não há número', () => {
    renderWithProviders(
      <CancelarNotaDialog
        open
        onOpenChange={vi.fn()}
        numero={null}
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByText(/Cancelar esta nota\?/)).toBeInTheDocument()
  })

  it('confirma enviando o motivo informado', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <CancelarNotaDialog
        open
        onOpenChange={vi.fn()}
        numero="1042"
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    await user.type(screen.getByLabelText('Motivo'), '  erro de digitação  ')
    await user.click(screen.getByRole('button', { name: 'Cancelar nota' }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('erro de digitação'))
  })

  it('confirma com motivo nulo quando vazio', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <CancelarNotaDialog
        open
        onOpenChange={vi.fn()}
        numero="1042"
        onConfirm={onConfirm}
        isPending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar nota' }))

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(null))
  })

  it('fecha ao clicar em Voltar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <CancelarNotaDialog
        open
        onOpenChange={onOpenChange}
        numero="1042"
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('não reseta o formulário quando fechado', () => {
    const { rerender } = renderWithProviders(
      <CancelarNotaDialog
        open
        onOpenChange={vi.fn()}
        numero="1042"
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    rerender(
      <CancelarNotaDialog
        open={false}
        onOpenChange={vi.fn()}
        numero="1042"
        onConfirm={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByLabelText('Motivo')).not.toBeInTheDocument()
  })

  it('mostra estado pendente nos botões', () => {
    renderWithProviders(
      <CancelarNotaDialog
        open
        onOpenChange={vi.fn()}
        numero="1042"
        onConfirm={vi.fn()}
        isPending
      />,
    )

    expect(screen.getByRole('button', { name: 'Cancelando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Voltar' })).toBeDisabled()
  })
})
