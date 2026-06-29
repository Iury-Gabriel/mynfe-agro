import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ClienteFormDialog } from './cliente-form-dialog'

import type { Cliente } from '@/features/admin/api/clientes-api'

import { renderWithProviders } from '@/test/render-with-providers'

function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: 'c1',
    tenantId: 't1',
    tipoPessoa: 'PJ',
    razaoSocialNome: 'Agro Cliente',
    cnpjCpf: '12345678000190',
    cnpjCpfFormatado: '12.345.678/0001-90',
    inscricaoEstadual: 'IE1',
    indicadorIe: '1',
    contribuinteIcms: true,
    enderecoLogradouro: 'Rua A',
    enderecoNumero: '10',
    enderecoBairro: 'Centro',
    enderecoCep: '12345000',
    municipio: 'Sorriso',
    codMunicipioIbge: '5107925',
    uf: 'MT',
    email: 'c@e.com',
    telefone: '6699',
    vendedorUsuarioId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('ClienteFormDialog', () => {
  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <ClienteFormDialog open={false} onOpenChange={vi.fn()} cliente={null} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida campos obrigatórios e não chama onSubmit', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ClienteFormDialog open onOpenChange={vi.fn()} cliente={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Criar cliente' }))

    expect(await screen.findByText('Nome / razão social obrigatório')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('exibe erro quando o e-mail é inválido', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ClienteFormDialog open onOpenChange={vi.fn()} cliente={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Razão social / Nome'), 'X Ltda')
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678901')
    await user.type(screen.getByLabelText('E-mail'), 'invalido')
    await user.click(screen.getByRole('button', { name: 'Criar cliente' }))

    expect(await screen.findByText('E-mail inválido')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('cria com campos opcionais vazios virando null', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ClienteFormDialog open onOpenChange={vi.fn()} cliente={null} onSubmit={onSubmit} isPending={false} />,
    )

    await user.type(screen.getByLabelText('Razão social / Nome'), 'Cliente Y')
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678901')
    await user.click(screen.getByRole('button', { name: 'Criar cliente' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          razaoSocialNome: 'Cliente Y',
          tipoPessoa: 'PJ',
          indicadorIe: '9',
          contribuinteIcms: false,
          inscricaoEstadual: null,
          email: null,
          uf: null,
        }),
      )
    })
  })

  it('cria com selects, checkbox e UF em maiúsculas', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ClienteFormDialog open onOpenChange={vi.fn()} cliente={null} onSubmit={onSubmit} isPending={false} />,
    )

    fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="tipoPessoa"]')!, {
      target: { value: 'PF' },
    })
    fireEvent.change(document.querySelector<HTMLSelectElement>('select[name="indicadorIe"]')!, {
      target: { value: '1' },
    })
    await user.type(screen.getByLabelText('Razão social / Nome'), 'Cliente Z')
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678901')
    await user.type(screen.getByLabelText('E-mail'), 'a@b.com')
    await user.type(screen.getByLabelText('UF'), 'sp')
    await user.click(screen.getByLabelText('Contribuinte ICMS'))
    await user.click(screen.getByRole('button', { name: 'Criar cliente' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoPessoa: 'PF',
          indicadorIe: '1',
          contribuinteIcms: true,
          uf: 'SP',
          email: 'a@b.com',
        }),
      )
    })
  })

  it('vem pré-preenchido no modo edição', () => {
    renderWithProviders(
      <ClienteFormDialog open onOpenChange={vi.fn()} cliente={makeCliente()} onSubmit={vi.fn()} isPending={false} />,
    )

    expect(screen.getByRole('heading', { name: 'Editar cliente' })).toBeInTheDocument()
    expect(screen.getByLabelText('Razão social / Nome')).toHaveValue('Agro Cliente')
    expect(screen.getByLabelText('UF')).toHaveValue('MT')
  })

  it('preenche string vazia quando os campos do cliente são nulos', () => {
    renderWithProviders(
      <ClienteFormDialog
        open
        onOpenChange={vi.fn()}
        cliente={makeCliente({
          inscricaoEstadual: null,
          enderecoLogradouro: null,
          enderecoNumero: null,
          enderecoBairro: null,
          enderecoCep: null,
          municipio: null,
          uf: null,
          email: null,
          telefone: null,
        })}
        onSubmit={vi.fn()}
        isPending={false}
      />,
    )

    expect(screen.getByLabelText('UF')).toHaveValue('')
    expect(screen.getByLabelText('E-mail')).toHaveValue('')
  })

  it('fecha o diálogo ao clicar em Cancelar', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <ClienteFormDialog open onOpenChange={onOpenChange} cliente={null} onSubmit={vi.fn()} isPending={false} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('exibe "Salvando..." e desabilita o submit quando isPending é true', () => {
    renderWithProviders(
      <ClienteFormDialog open onOpenChange={vi.fn()} cliente={null} onSubmit={vi.fn()} isPending />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })
})
