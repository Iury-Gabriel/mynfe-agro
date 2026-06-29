import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PrecoFormDialog } from './preco-form-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('PrecoFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <PrecoFormDialog open={false} onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida campos obrigatórios e não chama onSubmit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar preço' }))

    expect(await screen.findByText('Cliente obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Produto obrigatório')).toBeInTheDocument()
    expect(screen.getByText('Preço obrigatório')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('chama onSubmit com cliente, produto, preço e vigências', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Preço'), '50')
    await user.click(screen.getByRole('button', { name: 'Criar preço' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ clienteId: 'c1', produtoId: 'p1', preco: '50' }),
        expect.anything(),
      )
    })
  })

  it('exibe erro quando as vigências excedem dez caracteres', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Cliente'), 'c1')
    await user.type(screen.getByLabelText('Produto'), 'p1')
    await user.type(screen.getByLabelText('Preço'), '50')
    fireEvent.change(screen.getByLabelText('Vigência início'), {
      target: { value: '202602-01-01' },
    })
    fireEvent.change(screen.getByLabelText('Vigência fim'), {
      target: { value: '202612-12-31' },
    })
    await user.click(screen.getByRole('button', { name: 'Criar preço' }))

    await waitFor(() => {
      expect(
        screen.getAllByText('String must contain at most 10 character(s)').length,
      ).toBe(2)
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('fecha ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={onOpenChange} onSubmit={vi.fn()} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('desabilita os botões e mostra "Salvando..." quando isPending', () => {
    renderWithProviders(
      <PrecoFormDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
