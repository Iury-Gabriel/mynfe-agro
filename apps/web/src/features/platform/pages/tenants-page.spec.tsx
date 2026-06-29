import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TenantsPage } from './tenants-page'

import type { Tenant } from '@/features/platform/api/tenants-api'

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

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 't1',
    nome: 'Fazenda Verde',
    status: 'ativo',
    empresasCount: 2,
    usuariosCount: 5,
    createdAt: '2026-01-15T12:00:00.000Z',
    ...overrides,
  }
}

function mockList(tenants: Tenant[], extra: Record<string, number> = {}) {
  vi.mocked(api.get).mockResolvedValue({
    data: { tenants, total: tenants.length, page: 1, perPage: 20, ...extra },
  })
}

function fillTenantForm(): void {
  fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Maria' } })
  fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'maria@example.com' } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-super-forte' } })
  fireEvent.change(screen.getByLabelText('Nome da organização'), {
    target: { value: 'Nova Org' },
  })
  fireEvent.change(screen.getByLabelText('Razão social'), { target: { value: 'Nova LTDA' } })
  fireEvent.change(screen.getByLabelText('CNPJ / CPF'), { target: { value: '12345678000190' } })
  fireEvent.change(screen.getByLabelText('Regime tributário'), { target: { value: 'Simples' } })
  fireEvent.change(screen.getByLabelText('CRT'), { target: { value: '1' } })
}

describe('TenantsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<TenantsPage />)
    expect(screen.getByText('Carregando tenants…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantsPage />)

    expect(await screen.findByText('Erro ao carregar tenants.')).toBeInTheDocument()

    mockList([makeTenant()])
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Fazenda Verde')).toBeInTheDocument()
  })

  it('lista tenants com status, contagens e data', async () => {
    mockList([makeTenant()])
    renderWithProviders(<TenantsPage />)

    expect(await screen.findByText('Fazenda Verde')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('15/01/2026')).toBeInTheDocument()
  })

  it('mostra Suspender para tenant ativo e Ativar para suspenso', async () => {
    mockList([makeTenant({ id: 't1', status: 'ativo' }), makeTenant({ id: 't2', status: 'suspenso' })])
    renderWithProviders(<TenantsPage />)

    await screen.findAllByText('Fazenda Verde')
    expect(screen.getByRole('button', { name: /Suspender/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ativar/ })).toBeInTheDocument()
    expect(screen.getByText('Suspenso')).toBeInTheDocument()
  })

  it('cria um tenant pelo dialog', async () => {
    mockList([])
    vi.mocked(api.post).mockResolvedValue({ data: { tenant: makeTenant() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantsPage />)

    await screen.findByText('Nenhum registro encontrado.')
    await user.click(screen.getByRole('button', { name: /Novo tenant/ }))

    expect(screen.getByRole('heading', { name: 'Novo tenant' })).toBeInTheDocument()
    fillTenantForm()
    await user.click(screen.getByRole('button', { name: 'Criar tenant' }))

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/platform/tenants',
        expect.objectContaining({ tenantNome: 'Nova Org' }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Tenant criado com sucesso.')
  })

  it('suspende um tenant pela confirmação de status', async () => {
    mockList([makeTenant()])
    vi.mocked(api.patch).mockResolvedValue({ data: { tenant: makeTenant({ status: 'suspenso' }) } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantsPage />)

    await screen.findByText('Fazenda Verde')
    await user.click(screen.getByRole('button', { name: /Suspender/ }))

    expect(screen.getByRole('heading', { name: 'Suspender tenant' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Suspender' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/platform/tenants/t1/status', {
        status: 'suspenso',
      })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Tenant suspenso.')
  })

  it('ativa um tenant suspenso pela confirmação de status', async () => {
    mockList([makeTenant({ status: 'suspenso' })])
    vi.mocked(api.patch).mockResolvedValue({ data: { tenant: makeTenant() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantsPage />)

    await screen.findByText('Fazenda Verde')
    await user.click(screen.getByRole('button', { name: /Ativar/ }))
    await user.click(screen.getByRole('button', { name: 'Ativar' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/api/platform/tenants/t1/status', { status: 'ativo' })
    })
    expect(toastSuccess).toHaveBeenCalledWith('Tenant ativado.')
  })

  it('exibe toast de erro quando a alteração de status falha', async () => {
    mockList([makeTenant()])
    vi.mocked(api.patch).mockRejectedValue(new Error('falhou'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantsPage />)

    await screen.findByText('Fazenda Verde')
    await user.click(screen.getByRole('button', { name: /Suspender/ }))
    await user.click(screen.getByRole('button', { name: 'Suspender' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível alterar o status.')
    })
  })

  it('fecha o dialog de status ao cancelar', async () => {
    mockList([makeTenant()])
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantsPage />)

    await screen.findByText('Fazenda Verde')
    await user.click(screen.getByRole('button', { name: /Suspender/ }))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Suspender tenant' })).not.toBeInTheDocument()
    })
  })

  it('navega entre páginas com Anterior/Próxima', async () => {
    vi.mocked(api.get).mockImplementation(
      (_url: string, config?: { params?: { page?: number } }) => {
        const page = config?.params?.page ?? 1
        const tenant =
          page === 1
            ? makeTenant({ id: 't1', nome: 'Primeiro' })
            : makeTenant({ id: 't2', nome: 'Segundo' })
        return Promise.resolve({ data: { tenants: [tenant], total: 40, page, perPage: 20 } })
      },
    )
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<TenantsPage />)

    await screen.findByText('Primeiro')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(await screen.findByText('Segundo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(await screen.findByText('Primeiro')).toBeInTheDocument()
  })

  it('usa defaults de paginação quando a resposta omite os metadados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tenants: [makeTenant()] } })
    renderWithProviders(<TenantsPage />)

    await screen.findByText('Fazenda Verde')
    expect(screen.getByText(/Página 1 de 1 · 0 tenants/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })
})
