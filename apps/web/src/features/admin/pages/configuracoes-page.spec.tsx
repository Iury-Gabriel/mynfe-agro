import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ConfiguracoesPage } from './configuracoes-page'

import type { TenantConfig } from '@/features/admin/api/tenant-config-api'

import { api } from '@/lib/api-client'
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
  api: { get: vi.fn(), patch: vi.fn() },
}))

const useAuthMock = vi.fn<() => { user: { permissions: string[] } }>()
vi.mock('@/providers/auth-context', () => ({
  useAuth: () => useAuthMock(),
}))

function makeConfig(overrides: Partial<TenantConfig> = {}): TenantConfig {
  return {
    id: 't1',
    nome: 'Fazenda X',
    status: 'ativo',
    labelArea: 'Talhão',
    diaCorteConsolidacao: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('ConfiguracoesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthMock.mockReturnValue({ user: { permissions: ['view:settings', 'manage:settings'] } })
  })

  it('exibe estado de carregamento', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined))
    renderWithProviders(<ConfiguracoesPage />)
    expect(screen.getByText('Carregando configurações…')).toBeInTheDocument()
  })

  it('exibe erro e permite tentar novamente', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConfiguracoesPage />)

    expect(await screen.findByText('Erro ao carregar configurações.')).toBeInTheDocument()

    vi.mocked(api.get).mockResolvedValue({ data: { tenant: makeConfig() } })
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByDisplayValue('Fazenda X')).toBeInTheDocument()
  })

  it('preenche o form com a config carregada', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tenant: makeConfig() } })
    renderWithProviders(<ConfiguracoesPage />)

    expect(await screen.findByDisplayValue('Fazenda X')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5')).toBeInTheDocument()
  })

  it('salva as configurações com sucesso', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tenant: makeConfig() } })
    vi.mocked(api.patch).mockResolvedValue({ data: { tenant: makeConfig({ nome: 'Nova' }) } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConfiguracoesPage />)

    const nome = await screen.findByLabelText('Nome da organização')
    await user.clear(nome)
    await user.type(nome, 'Nova')
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/tenant/config',
        expect.objectContaining({ nome: 'Nova', labelArea: 'Talhão', diaCorteConsolidacao: 5 }),
      )
    })
    expect(toastSuccess).toHaveBeenCalledWith('Configurações salvas com sucesso.')
  })

  it('envia diaCorteConsolidacao null quando o campo é limpo', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tenant: makeConfig() } })
    vi.mocked(api.patch).mockResolvedValue({ data: { tenant: makeConfig() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConfiguracoesPage />)

    const dia = await screen.findByLabelText('Dia de corte da consolidação')
    await user.clear(dia)
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }))

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/tenant/config',
        expect.objectContaining({ diaCorteConsolidacao: null }),
      )
    })
  })

  it('exibe toast de erro quando o save falha', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tenant: makeConfig() } })
    vi.mocked(api.patch).mockRejectedValue(new Error('boom'))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConfiguracoesPage />)

    await screen.findByDisplayValue('Fazenda X')
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }))

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith('Não foi possível salvar as configurações.')
    })
  })

  it('oculta o botão de salvar quando o usuário não pode gerenciar', async () => {
    useAuthMock.mockReturnValue({ user: { permissions: ['view:settings'] } })
    vi.mocked(api.get).mockResolvedValue({ data: { tenant: makeConfig() } })
    renderWithProviders(<ConfiguracoesPage />)

    await screen.findByDisplayValue('Fazenda X')
    expect(screen.queryByRole('button', { name: 'Salvar configurações' })).not.toBeInTheDocument()
  })

  it('normaliza nomenclatura inválida para Talhão e deixa o dia em branco quando nulo', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { tenant: makeConfig({ labelArea: 'Inexistente', diaCorteConsolidacao: null }) },
    })
    renderWithProviders(<ConfiguracoesPage />)

    await screen.findByDisplayValue('Fazenda X')
    expect(screen.getByLabelText('Dia de corte da consolidação')).toHaveValue(null)
    expect(screen.getByLabelText('Nomenclatura de área')).toHaveTextContent('Talhão')
  })

  it('exibe "Salvando…" enquanto persiste as configurações', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tenant: makeConfig() } })
    vi.mocked(api.patch).mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConfiguracoesPage />)

    await screen.findByDisplayValue('Fazenda X')
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }))

    expect(await screen.findByRole('button', { name: 'Salvando…' })).toBeInTheDocument()
  })

  it('exibe erro de validação quando o nome é vazio', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tenant: makeConfig() } })
    const user = userEvent.setup({ delay: null })
    renderWithProviders(<ConfiguracoesPage />)

    const nome = await screen.findByLabelText('Nome da organização')
    await user.clear(nome)
    await user.click(screen.getByRole('button', { name: 'Salvar configurações' }))

    expect(await screen.findByText('Nome obrigatório')).toBeInTheDocument()
    expect(api.patch).not.toHaveBeenCalled()
  })
})
