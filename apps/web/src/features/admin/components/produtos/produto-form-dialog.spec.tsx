import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ProdutoFormDialog } from './produto-form-dialog'

import type { Produto } from '@/features/admin/api/produtos-api'

import { renderWithProviders } from '@/test/render-with-providers'

function makeProduto(overrides: Partial<Produto> = {}): Produto {
  return {
    id: 'p1',
    tenantId: 't1',
    empresaId: 'e1',
    descricao: 'Soja',
    tipo: 'bruto',
    unidadeMedida: 'KG',
    precoPadrao: 9.5,
    ncm: '1201',
    cest: 'C1',
    cfopPadrao: '5101',
    origemMercadoria: '0',
    cstCsosn: '102',
    aliquotas: null,
    status: 'ativo',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('ProdutoFormDialog', () => {
  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <ProdutoFormDialog open={false} onOpenChange={vi.fn()} produto={null} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida campos obrigatórios e não chama onSubmit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ProdutoFormDialog open onOpenChange={vi.fn()} produto={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar produto' }))

    expect(await screen.findByText('Descrição obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Empresa obrigatória')).toBeInTheDocument()
    expect(screen.getByText('Unidade obrigatória')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('cria com preço vazio e campos fiscais vazios virando null', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ProdutoFormDialog open onOpenChange={vi.fn()} produto={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Descrição'), 'Alface')
    await user.type(screen.getByLabelText('Empresa'), 'e1')
    await user.type(screen.getByLabelText('Unidade de medida'), 'MC')
    await user.click(screen.getByRole('button', { name: 'Criar produto' }))

    await waitFor(() => {
      expect(onSubmit.mock.calls[0]![0]).toEqual({
        empresaId: 'e1',
        descricao: 'Alface',
        tipo: 'bruto',
        unidadeMedida: 'MC',
        precoPadrao: '',
        ncm: '',
        cest: '',
        cfopPadrao: '',
        cstCsosn: '',
      })
    })
  })

  it('cria com preço numérico, fiscais e tipo trocado pelo select', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ProdutoFormDialog open onOpenChange={vi.fn()} produto={null} onSubmit={onSubmit} isPending={false} />,
    )

    fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="tipo"]')!, {
      target: { value: 'embalado' },
    })
    await user.type(screen.getByLabelText('Descrição'), 'Mix 200g')
    await user.type(screen.getByLabelText('Empresa'), 'e1')
    await user.type(screen.getByLabelText('Unidade de medida'), 'UN')
    await user.type(screen.getByLabelText('Preço padrão'), '12.5')
    await user.type(screen.getByLabelText('NCM'), '1234')
    await user.click(screen.getByRole('button', { name: 'Criar produto' }))

    await waitFor(() => {
      expect(onSubmit.mock.calls[0]![0]).toMatchObject({
        tipo: 'embalado',
        precoPadrao: '12.5',
        ncm: '1234',
      })
    })
  })

  it('vem pré-preenchido no modo edição', () => {
    renderWithProviders(
      <ProdutoFormDialog open onOpenChange={vi.fn()} produto={makeProduto()} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.getByRole('heading', { name: 'Editar produto' })).toBeInTheDocument()
    expect(screen.getByLabelText('Descrição')).toHaveValue('Soja')
    expect(screen.getByLabelText('Preço padrão')).toHaveValue('9.5')
  })

  it('preenche string vazia quando os campos do produto são nulos', () => {
    renderWithProviders(
      <ProdutoFormDialog
        open
        onOpenChange={vi.fn()}
        produto={makeProduto({ precoPadrao: null, ncm: null, cest: null, cfopPadrao: null, cstCsosn: null })}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByLabelText('Preço padrão')).toHaveValue('')
    expect(screen.getByLabelText('NCM')).toHaveValue('')
  })

  it('exibe mensagens de erro quando os campos fiscais excedem o tamanho', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ProdutoFormDialog open onOpenChange={vi.fn()} produto={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Descrição'), 'Alface')
    await user.type(screen.getByLabelText('Empresa'), 'e1')
    await user.type(screen.getByLabelText('Unidade de medida'), 'UN')
    await user.type(screen.getByLabelText('Preço padrão'), '1'.repeat(21))
    await user.type(screen.getByLabelText('NCM'), 'x'.repeat(21))
    await user.type(screen.getByLabelText('CEST'), 'x'.repeat(21))
    await user.type(screen.getByLabelText('CFOP padrão'), 'x'.repeat(11))
    await user.type(screen.getByLabelText('CST / CSOSN'), 'x'.repeat(6))
    await user.click(screen.getByRole('button', { name: 'Criar produto' }))

    await waitFor(() => {
      expect(
        screen.getByText('String must contain at most 5 character(s)'),
      ).toBeInTheDocument()
    })
    expect(
      screen.getAllByText('String must contain at most 20 character(s)').length,
    ).toBeGreaterThanOrEqual(3)
    expect(screen.getByText('String must contain at most 10 character(s)')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('fecha o diálogo ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ProdutoFormDialog open onOpenChange={onOpenChange} produto={null} onSubmit={vi.fn()} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('exibe "Salvando..." e desabilita o submit quando isPending é true', () => {
    renderWithProviders(
      <ProdutoFormDialog open onOpenChange={vi.fn()} produto={null} onSubmit={vi.fn()} isPending />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })
})
