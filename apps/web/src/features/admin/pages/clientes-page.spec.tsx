import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ClientesPage } from './clientes-page'

import type { Cliente } from '@/features/admin/api/clientes-api'

import { api } from '@/lib/api-client'
import { ApiError } from '@/lib/api-error'
import { renderWithProviders } from '@/test/render-with-providers'

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: {
    success: (m: string) => {
      toastSuccess(m)
    },
    error: (m: string) => {
      toastError(m)
    },
  },
}))

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const useAuthMock = vi.fn<() => { user: { permissions: string[] } }>()
vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock(),
}))

const ALL_PERMS = ['cliente:read', 'cliente:create', 'cliente:update', 'cliente:delete']

function makeCliente(overrides: Partial<Cliente> = {}): Cliente {
  return {
    id: 'c1',
    tenantId: 't1',
    tipoPessoa: 'PJ',
    razaoSocialNome: 'Agro Comércio LTDA',
    cnpjCpf: '12345678000190',
    cnpjCpfFormatado: '12.345.678/0001-90',
    inscricaoEstadual: '123',
    indicadorIe: '1',
    contribuinteIcms: true,
    enderecoLogradouro: null,
    enderecoNumero: null,
    enderecoBairro: null,
    enderecoCep: null,
    municipio: null,
    codMunicipioIbge: null,
    uf: null,
    email: 'contato@agro.com',
    telefone: '6699999999',
    vendedorUsuarioId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function mockList(clientes: Cliente[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: { clientes, total: clientes.length, page: 1, perPage: 20, totalPages: 1, ...extra },
  })
}

describe('ClientesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { permissions: ALL_PERMS } })
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<ClientesPage />)
    expect(screen.getByText('Carregando clientes…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    expect(await screen.findByText('Erro ao carregar clientes.')).toBeInTheDocument()

    mockList([makeCliente()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Agro Comércio LTDA')).toBeInTheDocument()
  })

  it('lista clientes com documento, tipo, ICMS e contato', async () => {
    mockList([makeCliente()])
    renderWithProviders(<ClientesPage />)

    expect(await screen.findByText('Agro Comércio LTDA')).toBeInTheDocument()
    expect(screen.getByText('12.345.678/0001-90')).toBeInTheDocument()
    expect(screen.getByText('Jurídica')).toBeInTheDocument()
    expect(screen.getByText('Contribuinte')).toBeInTheDocument()
    expect(screen.getByText('contato@agro.com')).toBeInTheDocument()
  })

  it('mostra cliente não contribuinte e usa telefone quando não há e-mail', async () => {
    mockList([
      makeCliente({ tipoPessoa: 'PF', contribuinteIcms: false, email: null, telefone: '11988887777' }),
    ])
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Agro Comércio LTDA')
    expect(screen.getByText('Física')).toBeInTheDocument()
    expect(screen.getByText('Não')).toBeInTheDocument()
    expect(screen.getByText('11988887777')).toBeInTheDocument()
  })

  it('exibe traço quando não há e-mail nem telefone', async () => {
    mockList([makeCliente({ email: null, telefone: null })])
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Agro Comércio LTDA')
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('oculta ações sem permissão', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['cliente:read'] } })
    mockList([makeCliente()])
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Agro Comércio LTDA')
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Novo cliente/ })).not.toBeInTheDocument()
  })

  it('cria um cliente com sucesso', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { cliente: makeCliente() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Novo cliente/ }))
    await user.type(screen.getByLabelText('Razão social / Nome'), 'Cliente Novo')
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678901')
    await user.click(screen.getByRole('button', { name: 'Criar cliente' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/clientes', expect.objectContaining({ razaoSocialNome: 'Cliente Novo' }))
    })
    expect(toastSuccess).toHaveBeenCalledWith('Cliente criado com sucesso.')
  })

  it('exibe erro de CNPJ/CPF inválido vindo do servidor na criação', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new ApiError('InvalidCnpjCpf', 'invalido', 400))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Novo cliente/ }))
    await user.type(screen.getByLabelText('Razão social / Nome'), 'Cliente Novo')
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678901')
    await user.click(screen.getByRole('button', { name: 'Criar cliente' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('CNPJ/CPF inválido.')
    })
  })

  it('exibe erro genérico quando a criação falha', async () => {
    mockList([])
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Novo cliente/ }))
    await user.type(screen.getByLabelText('Razão social / Nome'), 'Cliente Novo')
    await user.type(screen.getByLabelText('CNPJ / CPF'), '12345678901')
    await user.click(screen.getByRole('button', { name: 'Criar cliente' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar o cliente.')
    })
  })

  it('edita um cliente com sucesso', async () => {
    mockList([makeCliente()])
    vi.mocked(api.patch).mockResolvedValue({ data: { cliente: makeCliente() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Agro Comércio LTDA')
    await user.click(screen.getByRole('button', { name: /Editar/ }))
    await user.clear(screen.getByLabelText('Razão social / Nome'))
    await user.type(screen.getByLabelText('Razão social / Nome'), 'Cliente Editado')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/clientes/c1',
        expect.objectContaining({ razaoSocialNome: 'Cliente Editado' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Cliente atualizado com sucesso.')
  })

  it('exibe erro de CNPJ/CPF inválido vindo do servidor na edição', async () => {
    mockList([makeCliente()])
    vi.mocked(api.patch).mockRejectedValue(new ApiError('InvalidCnpjCpf', 'invalido', 400))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Agro Comércio LTDA')
    await user.click(screen.getByRole('button', { name: /Editar/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('CNPJ/CPF inválido.')
    })
  })

  it('exibe erro genérico quando a edição falha', async () => {
    mockList([makeCliente()])
    vi.mocked(api.patch).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Agro Comércio LTDA')
    await user.click(screen.getByRole('button', { name: /Editar/ }))
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar o cliente.')
    })
  })

  it('exclui um cliente', async () => {
    mockList([makeCliente()])
    vi.mocked(api.delete).mockResolvedValue({ data: { cliente: makeCliente() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Agro Comércio LTDA')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/api/clientes/c1')
    })
    expect(toastSuccess).toHaveBeenCalledWith('Cliente excluído.')
  })

  it('exibe erro ao falhar a exclusão', async () => {
    mockList([makeCliente()])
    vi.mocked(api.delete).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Agro Comércio LTDA')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    await user.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível excluir o cliente.')
    })
  })

  it('filtra clientes pela busca', async () => {
    mockList([
      makeCliente({ id: 'c1', razaoSocialNome: 'Alpha' }),
      makeCliente({ id: 'c2', razaoSocialNome: 'Beta' }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Alpha')
    await user.type(screen.getByLabelText('Buscar clientes'), 'beta')

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('navega entre páginas', async () => {
    vi.mocked(api.get).mockImplementation((_url: string, config?: { params?: { page?: number } }) => {
      const page = config?.params?.page ?? 1
      const clientes = page === 1 ? [makeCliente({ id: 'c1', razaoSocialNome: 'Primeiro' })] : [makeCliente({ id: 'c2', razaoSocialNome: 'Segundo' })]
      return Promise.resolve({ data: { clientes, total: 2, page, perPage: 20, totalPages: 2 } })
    })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Primeiro')
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segundo')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Primeiro')).toBeInTheDocument()
  })

  it('usa defaults de paginação quando a resposta omite os metadados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { clientes: [makeCliente()] } })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Agro Comércio LTDA')
    expect(screen.getByText(/Página 1 de 1 · 0 clientes/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })

  it('filtra pelo e-mail ignorando clientes sem e-mail', async () => {
    mockList([
      makeCliente({ id: 'c1', razaoSocialNome: 'Alpha', email: 'alpha@mail.com' }),
      makeCliente({ id: 'c2', razaoSocialNome: 'Beta', email: null }),
    ])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Alpha')
    await user.type(screen.getByLabelText('Buscar clientes'), 'alpha@mail')

    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
  })

  it('exibe o tipo bruto quando não há rótulo mapeado', async () => {
    mockList([makeCliente({ tipoPessoa: 'XX' as never })])
    renderWithProviders(<ClientesPage />)

    expect(await screen.findByText('XX')).toBeInTheDocument()
  })

  it('cancela a exclusão e limpa a seleção', async () => {
    mockList([makeCliente()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ClientesPage />)

    await screen.findByText('Agro Comércio LTDA')
    await user.click(screen.getByRole('button', { name: /Excluir/ }))
    expect(screen.getByRole('heading', { name: 'Excluir cliente' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Excluir cliente' })).not.toBeInTheDocument()
    })
  })
})
