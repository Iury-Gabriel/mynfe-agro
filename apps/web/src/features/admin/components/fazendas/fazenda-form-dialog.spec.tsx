import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FazendaFormDialog } from './fazenda-form-dialog'

import type { Fazenda } from '@/features/admin/api/fazendas-api'

import { renderWithProviders } from '@/test/render-with-providers'

function makeFazenda(overrides: Partial<Fazenda> = {}): Fazenda {
  return {
    id: 'f1',
    tenantId: 't1',
    empresaId: 'e1',
    nome: 'Fazenda Boa Vista',
    enderecoLogradouro: 'Estrada Rural',
    enderecoNumero: 'km 5',
    enderecoBairro: 'Zona Rural',
    enderecoCep: '12345000',
    municipio: 'Sorriso',
    uf: 'MT',
    latitude: null,
    longitude: null,
    car: 'CAR-123',
    nirfIncra: 'NIRF-9',
    areaTotalHa: 1200,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('FazendaFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <FazendaFormDialog
        open={false}
        onOpenChange={vi.fn()}
        fazenda={null}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida campos obrigatórios e não chama onSubmit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FazendaFormDialog
        open
        onOpenChange={vi.fn()}
        fazenda={null}
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar fazenda' }))

    expect(await screen.findByText('Empresa obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Nome obrigatório')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('chama onSubmit com o payload normalizado no modo criação', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FazendaFormDialog
        open
        onOpenChange={vi.fn()}
        fazenda={null}
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.type(screen.getByLabelText('Empresa'), 'e1')
    await user.type(screen.getByLabelText('Nome'), 'Fazenda Nova')
    await user.type(screen.getByLabelText('UF'), 'mt')
    await user.type(screen.getByLabelText('Área total (ha)'), '500')
    await user.click(screen.getByRole('button', { name: 'Criar fazenda' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          empresaId: 'e1',
          nome: 'Fazenda Nova',
          uf: 'MT',
          areaTotalHa: 500,
          enderecoLogradouro: null,
        }),
      )
    })
  })

  it('vem pré-preenchido no modo edição e desabilita o campo empresa', () => {
    renderWithProviders(
      <FazendaFormDialog
        open
        onOpenChange={vi.fn()}
        fazenda={makeFazenda()}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Editar fazenda' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Fazenda Boa Vista')
    expect(screen.getByLabelText('Empresa')).toBeDisabled()
  })

  it('preenche defaults vazios quando a fazenda tem campos nulos', () => {
    renderWithProviders(
      <FazendaFormDialog
        open
        onOpenChange={vi.fn()}
        fazenda={makeFazenda({
          enderecoLogradouro: null,
          enderecoNumero: null,
          enderecoBairro: null,
          enderecoCep: null,
          municipio: null,
          uf: null,
          car: null,
          nirfIncra: null,
          areaTotalHa: null,
        })}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByLabelText('Área total (ha)')).toHaveValue('')
    expect(screen.getByLabelText('UF')).toHaveValue('')
  })

  it('exibe erro quando a UF excede dois caracteres', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FazendaFormDialog
        open
        onOpenChange={vi.fn()}
        fazenda={null}
        onSubmit={onSubmit}
        isPending={false}
      />,
    )

    await user.type(screen.getByLabelText('Empresa'), 'e1')
    await user.type(screen.getByLabelText('Nome'), 'Fazenda Nova')
    fireEvent.change(screen.getByLabelText('UF'), { target: { value: 'XYZ' } })
    await user.click(screen.getByRole('button', { name: 'Criar fazenda' }))

    expect(
      await screen.findByText('String must contain at most 2 character(s)'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('fecha o diálogo ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FazendaFormDialog
        open
        onOpenChange={onOpenChange}
        fazenda={null}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('exibe "Salvando..." e desabilita o submit quando isPending é true', () => {
    renderWithProviders(
      <FazendaFormDialog
        open
        onOpenChange={vi.fn()}
        fazenda={null}
        onSubmit={vi.fn()}
        isPending
      />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })
})
