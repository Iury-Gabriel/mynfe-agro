import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FichaTecnicaDialog } from './ficha-tecnica-dialog'

import type { FichaTecnica } from '@/features/admin/api/fichas-tecnicas-api'
import type { Produto } from '@/features/admin/api/produtos-api'

import {
  useCreateFichaTecnica,
  useDeleteFichaTecnica,
  useFichasTecnicas,
  useUpdateFichaTecnica,
} from '@/features/admin/api/fichas-tecnicas-api'
import { renderWithProviders } from '@/test/render-with-providers'

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}))

vi.mock('@/features/admin/api/fichas-tecnicas-api', () => ({
  useFichasTecnicas: vi.fn(),
  useCreateFichaTecnica: vi.fn(),
  useUpdateFichaTecnica: vi.fn(),
  useDeleteFichaTecnica: vi.fn(),
}))

const produto: Produto = {
  id: 'p1',
  tenantId: 't1',
  empresaId: 'e1',
  descricao: 'Ração embalada',
  tipo: 'embalado',
  unidadeMedida: 'SC',
  precoPadrao: null,
  ncm: null,
  cest: null,
  cfopPadrao: null,
  origemMercadoria: null,
  cstCsosn: null,
  aliquotas: null,
  status: 'ativo',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function makeFicha(overrides: Partial<FichaTecnica> = {}): FichaTecnica {
  return {
    id: 'f1',
    tenantId: 't1',
    produtoId: 'p1',
    descricaoComponente: 'Milho moído',
    quantidadeReferencia: 5,
    observacoes: 'Base',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

interface MutateOpts {
  onSuccess: () => void
  onError: () => void
}

const createMutate = vi.fn<(payload: unknown, opts: MutateOpts) => void>()
const updateMutate = vi.fn<(payload: unknown, opts: MutateOpts) => void>()
const deleteMutate = vi.fn<(id: string, opts: MutateOpts) => void>()

function setList(state: {
  data?: { fichasTecnicas: FichaTecnica[] }
  isLoading?: boolean
  isError?: boolean
}) {
  vi.mocked(useFichasTecnicas).mockReturnValue({
    data: state.data,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
  } as unknown as ReturnType<typeof useFichasTecnicas>)
}

beforeEach(() => {
  vi.clearAllMocks()
  setList({ data: { fichasTecnicas: [] } })
  vi.mocked(useCreateFichaTecnica).mockReturnValue({
    mutate: createMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateFichaTecnica>)
  vi.mocked(useUpdateFichaTecnica).mockReturnValue({
    mutate: updateMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUpdateFichaTecnica>)
  vi.mocked(useDeleteFichaTecnica).mockReturnValue({
    mutate: deleteMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useDeleteFichaTecnica>)
})

describe('FichaTecnicaDialog', () => {
  it('não renderiza o conteúdo quando open é false', () => {
    renderWithProviders(
      <FichaTecnicaDialog open={false} onOpenChange={vi.fn()} produto={produto} canEdit />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mostra estado de carregamento', () => {
    setList({ isLoading: true })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )
    expect(screen.getByText('Carregando componentes…')).toBeInTheDocument()
  })

  it('mostra estado de erro', () => {
    setList({ isError: true })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )
    expect(screen.getByText('Erro ao carregar a ficha técnica.')).toBeInTheDocument()
  })

  it('mostra estado vazio', () => {
    setList({ data: { fichasTecnicas: [] } })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )
    expect(screen.getByText('Nenhum componente cadastrado.')).toBeInTheDocument()
  })

  it('lista os componentes existentes', () => {
    setList({ data: { fichasTecnicas: [makeFicha()] } })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )
    expect(screen.getByText('Milho moído')).toBeInTheDocument()
    expect(screen.getByText('Base')).toBeInTheDocument()
  })

  it('esconde ações de edição quando canEdit é false', () => {
    setList({ data: { fichasTecnicas: [makeFicha()] } })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit={false} />,
    )
    expect(screen.queryByRole('button', { name: /Editar Milho moído/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Descrição do componente')).not.toBeInTheDocument()
  })

  it('valida descrição obrigatória e não chama create', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: /Adicionar componente/ }))

    expect(await screen.findByText('Descrição obrigatória')).toBeInTheDocument()
    expect(createMutate).not.toHaveBeenCalled()
  })

  it('cria um componente com o payload normalizado e dispara onSuccess', async () => {
    createMutate.mockImplementation((_payload, opts) => opts.onSuccess())
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.type(screen.getByLabelText('Descrição do componente'), 'Soja')
    await user.type(screen.getByLabelText('Quantidade de referência'), '3')
    await user.type(screen.getByLabelText('Observações'), 'Obs')
    await user.click(screen.getByRole('button', { name: /Adicionar componente/ }))

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalledWith(
        {
          produtoId: 'p1',
          descricaoComponente: 'Soja',
          quantidadeReferencia: 3,
          observacoes: 'Obs',
        },
        expect.anything(),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Componente adicionado.')
  })

  it('cria componente sem quantidade nem observações (campos nulos)', async () => {
    createMutate.mockImplementation((_payload, opts) => opts.onSuccess())
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.type(screen.getByLabelText('Descrição do componente'), 'Soja')
    await user.click(screen.getByRole('button', { name: /Adicionar componente/ }))

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalledWith(
        { produtoId: 'p1', descricaoComponente: 'Soja', quantidadeReferencia: null, observacoes: null },
        expect.anything(),
      )
    })
  })

  it('mostra toast de erro quando a criação falha', async () => {
    createMutate.mockImplementation((_payload, opts) => opts.onError())
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.type(screen.getByLabelText('Descrição do componente'), 'Soja')
    await user.click(screen.getByRole('button', { name: /Adicionar componente/ }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar o componente.')
    })
  })

  it('entra em modo edição e chama update com onSuccess', async () => {
    setList({ data: { fichasTecnicas: [makeFicha()] } })
    updateMutate.mockImplementation((_payload, opts) => opts.onSuccess())
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Editar Milho moído' }))
    expect(screen.getByText('Editar componente')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Salvar componente' }))

    await waitFor(() => {
      expect(updateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'f1', descricaoComponente: 'Milho moído' }),
        expect.anything(),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Componente atualizado.')
  })

  it('mostra toast de erro quando a atualização falha', async () => {
    setList({ data: { fichasTecnicas: [makeFicha()] } })
    updateMutate.mockImplementation((_payload, opts) => opts.onError())
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Editar Milho moído' }))
    await user.click(screen.getByRole('button', { name: 'Salvar componente' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar o componente.')
    })
  })

  it('cancela a edição e volta ao modo novo', async () => {
    setList({ data: { fichasTecnicas: [makeFicha()] } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Editar Milho moído' }))
    await user.click(screen.getByRole('button', { name: /Cancelar edição/ }))

    expect(screen.getByText('Novo componente')).toBeInTheDocument()
  })

  it('remove um componente e dispara onSuccess', async () => {
    setList({ data: { fichasTecnicas: [makeFicha()] } })
    deleteMutate.mockImplementation((_id, opts) => opts.onSuccess())
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Remover Milho moído' }))

    expect(deleteMutate).toHaveBeenCalledWith('f1', expect.anything())
    expect(toastSuccess).toHaveBeenCalledWith('Componente removido.')
  })

  it('sai do modo edição ao remover o componente em edição', async () => {
    setList({ data: { fichasTecnicas: [makeFicha()] } })
    deleteMutate.mockImplementation((_id, opts) => opts.onSuccess())
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Editar Milho moído' }))
    expect(screen.getByText('Editar componente')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remover Milho moído' }))

    expect(screen.getByText('Novo componente')).toBeInTheDocument()
  })

  it('mostra toast de erro quando a remoção falha', async () => {
    setList({ data: { fichasTecnicas: [makeFicha()] } })
    deleteMutate.mockImplementation((_id, opts) => opts.onError())
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Remover Milho moído' }))

    expect(toastError).toHaveBeenCalledWith('Não foi possível remover o componente.')
  })

  it('renderiza componente sem quantidade nem observações', () => {
    setList({
      data: { fichasTecnicas: [makeFicha({ quantidadeReferencia: null, observacoes: null })] },
    })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    expect(screen.getByText('Milho moído')).toBeInTheDocument()
    expect(screen.queryByText('Base')).not.toBeInTheDocument()
  })

  it('preenche o form em edição de componente com campos nulos', async () => {
    setList({
      data: {
        fichasTecnicas: [makeFicha({ quantidadeReferencia: null, observacoes: null })],
      },
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.click(screen.getByRole('button', { name: 'Editar Milho moído' }))

    expect(screen.getByLabelText('Quantidade de referência')).toHaveValue('')
    expect(screen.getByLabelText('Observações')).toHaveValue('')
  })

  it('desabilita o botão e mostra "Salvando..." quando submetendo', () => {
    vi.mocked(useCreateFichaTecnica).mockReturnValue({
      mutate: createMutate,
      isPending: true,
    } as unknown as ReturnType<typeof useCreateFichaTecnica>)
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    expect(screen.getByRole('button', { name: 'Salvando...' })).toBeDisabled()
  })

  it('valida o tamanho máximo da quantidade e das observações', async () => {
    const user = userEvent.setup({ delay: null })
    renderWithProviders(
      <FichaTecnicaDialog open onOpenChange={vi.fn()} produto={produto} canEdit />,
    )

    await user.type(screen.getByLabelText('Descrição do componente'), 'Soja')
    await user.type(screen.getByLabelText('Quantidade de referência'), '1'.repeat(21))
    await user.type(screen.getByLabelText('Observações'), 'o'.repeat(501))
    await user.click(screen.getByRole('button', { name: /Adicionar componente/ }))

    await waitFor(() => {
      expect(
        screen.getByText('String must contain at most 20 character(s)'),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByText('String must contain at most 500 character(s)'),
    ).toBeInTheDocument()
    expect(createMutate).not.toHaveBeenCalled()
  })
})
