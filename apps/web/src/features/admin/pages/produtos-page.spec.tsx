import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProdutosPage } from './produtos-page'

import type { Produto } from '@/features/admin/api/produtos-api'

import { api } from '@/lib/api-client'
import { renderWithProviders } from '@/test/render-with-providers'

const toastSuccess = vi.fn()
const toastError = vi.fn()

vi.mock('sonner', () => ({
  toast: {
    success: (msg: string) => toastSuccess(msg),
    error: (msg: string) => toastError(msg),
  },
}))

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const useAuthMock = vi.fn()
vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock() as unknown,
}))

vi.mock('@/features/admin/api/fichas-tecnicas-api', () => ({
  useFichasTecnicas: () => ({ data: { fichasTecnicas: [] }, isLoading: false, isError: false }),
  useCreateFichaTecnica: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateFichaTecnica: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteFichaTecnica: () => ({ mutate: vi.fn(), isPending: false }),
}))

const ALL_PERMS = ['produto:read', 'produto:create', 'produto:update', 'produto:status']

function makeProduto(overrides: Partial<Produto> = {}): Produto {
  return {
    id: 'p1',
    tenantId: 't1',
    empresaId: 'e1',
    descricao: 'Soja em grão',
    tipo: 'bruto',
    unidadeMedida: 'kg',
    precoPadrao: 12.5,
    ncm: '12019000',
    cest: null,
    cfopPadrao: '5101',
    origemMercadoria: null,
    cstCsosn: '102',
    aliquotas: null,
    status: 'ativo',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(produtos: Produto[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: {
      produtos,
      total: produtos.length,
      page: 1,
      perPage: 20,
      totalPages: 1,
      ...extra,
    },
  })
}

describe('ProdutosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { permissions: ALL_PERMS } })
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<ProdutosPage />)
    expect(screen.getByText('Carregando produtos…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    expect(await screen.findByText('Erro ao carregar produtos.')).toBeInTheDocument()

    mockList([makeProduto()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Soja em grão')).toBeInTheDocument()
  })

  it('lista produtos com tipo, unidade, preço formatado e status', async () => {
    mockList([makeProduto()])
    renderWithProviders(<ProdutosPage />)

    expect(await screen.findByText('Soja em grão')).toBeInTheDocument()
    expect(screen.getByText('Bruto')).toBeInTheDocument()
    expect(screen.getByText('kg')).toBeInTheDocument()
    expect(screen.getByText(/12,50/)).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('exibe traço quando não há preço padrão e mostra produto embalado/inativo', async () => {
    mockList([makeProduto({ precoPadrao: null, tipo: 'embalado', status: 'inativo' })])
    renderWithProviders(<ProdutosPage />)

    expect(await screen.findByText('Embalado')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('Inativo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ativar/ })).toBeInTheDocument()
  })

  it('oculta ações quando o usuário não tem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['produto:read'] } })
    mockList([makeProduto()])
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Soja em grão')
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Inativar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Novo produto/ })).not.toBeInTheDocument()
  })

  it('abre o dialog de criação e envia o formulário', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { produto: makeProduto() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Novo produto/ }))

    expect(screen.getByRole('heading', { name: 'Novo produto' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Descrição'), 'Milho')
    await user.type(screen.getByLabelText('Unidade de medida'), 'sc')
    await user.type(screen.getByLabelText('Empresa'), 'e1')
    await user.click(screen.getByRole('button', { name: 'Criar produto' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/produtos',
        expect.objectContaining({ descricao: 'Milho', empresaId: 'e1' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Produto criado com sucesso.')
  })

  it('exibe toast de erro quando a criação falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('falhou'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Novo produto/ }))
    await user.type(screen.getByLabelText('Descrição'), 'Milho')
    await user.type(screen.getByLabelText('Unidade de medida'), 'sc')
    await user.type(screen.getByLabelText('Empresa'), 'e1')
    await user.click(screen.getByRole('button', { name: 'Criar produto' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar o produto.')
    })
  })

  it('abre o dialog de edição e salva sem enviar empresaId', async () => {
    mockList([makeProduto()])
    vi.mocked(api.patch).mockResolvedValue({ data: { produto: makeProduto() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Soja em grão')
    await user.click(screen.getByRole('button', { name: /Editar/ }))

    expect(screen.getByRole('heading', { name: 'Editar produto' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Descrição'))
    await user.type(screen.getByLabelText('Descrição'), 'Soja premium')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/produtos/p1',
        expect.objectContaining({ descricao: 'Soja premium' }),
      )
    })
    const body = vi.mocked(api.patch).mock.calls[0]![1] as Record<string, unknown>
    expect(body).not.toHaveProperty('empresaId')
    expect(toastSuccess).toHaveBeenCalledWith('Produto atualizado com sucesso.')
  })

  it('exibe toast de erro quando a atualização falha', async () => {
    mockList([makeProduto()])
    vi.mocked(api.patch).mockRejectedValue(new Error('falhou'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Soja em grão')
    await user.click(screen.getByRole('button', { name: /Editar/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar o produto.')
    })
  })

  it('inativa um produto pela confirmação de status', async () => {
    mockList([makeProduto()])
    vi.mocked(api.patch).mockResolvedValue({ data: { produto: makeProduto({ status: 'inativo' }) } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Soja em grão')
    await user.click(screen.getByRole('button', { name: /Inativar/ }))

    expect(screen.getByRole('heading', { name: 'Inativar produto' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Inativar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/produtos/p1/deactivate')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Produto inativado.')
  })

  it('ativa um produto inativo pela confirmação de status', async () => {
    mockList([makeProduto({ status: 'inativo' })])
    vi.mocked(api.patch).mockResolvedValue({ data: { produto: makeProduto() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Soja em grão')
    await user.click(screen.getByRole('button', { name: /Ativar/ }))
    await user.click(screen.getByRole('button', { name: 'Ativar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/produtos/p1/activate')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Produto ativado.')
  })

  it('exibe toast de erro quando a alteração de status falha', async () => {
    mockList([makeProduto()])
    vi.mocked(api.patch).mockRejectedValue(new Error('falhou'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Soja em grão')
    await user.click(screen.getByRole('button', { name: /Inativar/ }))
    await user.click(screen.getByRole('button', { name: 'Inativar' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível alterar o status.')
    })
  })

  it('fecha o dialog de status ao cancelar limpando a seleção', async () => {
    mockList([makeProduto()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Soja em grão')
    await user.click(screen.getByRole('button', { name: /Inativar/ }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Inativar produto' })).not.toBeInTheDocument()
    })
  })

  it('abre a ficha técnica de um produto embalado e fecha limpando a seleção', async () => {
    mockList([makeProduto({ tipo: 'embalado', descricao: 'Ração' })])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Ração')
    await user.click(screen.getByRole('button', { name: /Ficha técnica/ }))

    expect(screen.getByRole('heading', { name: 'Ficha técnica' })).toBeInTheDocument()
    expect(screen.getByText('Nenhum componente cadastrado.')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Ficha técnica' })).not.toBeInTheDocument()
    })
  })

  it('não exibe o botão de ficha técnica para produto bruto', async () => {
    mockList([makeProduto({ tipo: 'bruto' })])
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Soja em grão')
    expect(screen.queryByRole('button', { name: /Ficha técnica/ })).not.toBeInTheDocument()
  })

  it('filtra produtos pela busca', async () => {
    mockList([
      makeProduto({ id: 'p1', descricao: 'Soja' }),
      makeProduto({ id: 'p2', descricao: 'Milho' }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Soja')
    await user.type(screen.getByLabelText('Buscar produtos'), 'milho')

    expect(screen.queryByText('Soja')).not.toBeInTheDocument()
    expect(screen.getByText('Milho')).toBeInTheDocument()
  })

  it('navega entre páginas com Anterior/Próxima', async () => {
    const first = makeProduto({ id: 'p1', descricao: 'Primeiro' })
    const second = makeProduto({ id: 'p2', descricao: 'Segundo' })
    vi.mocked(api.get).mockImplementation(
      (_url: string, config?: { params?: { page?: number } }) => {
        const page = config?.params?.page ?? 1
        const produtos = page === 1 ? [first] : [second]
        return Promise.resolve({
          data: { produtos, total: 2, page, perPage: 20, totalPages: 2 },
        })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Primeiro')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segundo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Primeiro')).toBeInTheDocument()
  })

  it('usa defaults de paginação quando a resposta omite os metadados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { produtos: [makeProduto()] } })
    renderWithProviders(<ProdutosPage />)

    await screen.findByText('Soja em grão')
    expect(screen.getByText(/Página 1 de 1 · 0 produtos/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })
})
