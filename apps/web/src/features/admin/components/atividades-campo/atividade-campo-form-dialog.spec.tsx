import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AtividadeCampoFormDialog } from './atividade-campo-form-dialog'

import { renderWithProviders } from '@/test/render-with-providers'

describe('AtividadeCampoFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <AtividadeCampoFormDialog
        open={false}
        onOpenChange={vi.fn()}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida a data obrigatória e não chama onSubmit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AtividadeCampoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar atividade' }))

    expect(await screen.findByText('Data obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('chama onSubmit com o payload normalizado', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AtividadeCampoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Data'), '2026-02-01')
    await user.type(screen.getByLabelText('Safra (opcional)'), 's1')
    await user.type(screen.getByLabelText('Área (opcional)'), 'a1')
    await user.type(screen.getByLabelText('Responsável (opcional)'), 'u1')
    await user.type(screen.getByLabelText('Observações'), 'Plantio')
    await user.click(screen.getByRole('button', { name: 'Criar atividade' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        safraId: 's1',
        areaId: 'a1',
        tipo: 'plantio',
        data: '2026-02-01',
        responsavelUsuarioId: 'u1',
        observacoes: 'Plantio',
      })
    })
  })

  it('normaliza campos opcionais vazios para null', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AtividadeCampoFormDialog open onOpenChange={vi.fn()} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Data'), '2026-02-01')
    await user.click(screen.getByRole('button', { name: 'Criar atividade' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          safraId: null,
          areaId: null,
          responsavelUsuarioId: null,
          observacoes: null,
        }),
      )
    })
  })

  it('fecha ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <AtividadeCampoFormDialog open onOpenChange={onOpenChange} onSubmit={vi.fn()} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('desabilita os botões e mostra "Salvando..." quando isPending', () => {
    renderWithProviders(
      <AtividadeCampoFormDialog open onOpenChange={vi.fn()} onSubmit={vi.fn()} isPending />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })
})
