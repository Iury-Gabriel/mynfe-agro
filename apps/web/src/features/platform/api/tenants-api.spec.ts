import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateTenant, useSetTenantStatus, useTenants } from './tenants-api'

import type { RegisterTenantInput } from '@/features/auth/api/onboarding-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

const listResponse = {
  tenants: [],
  total: 0,
  page: 1,
  perPage: 20,
}

const registerInput: RegisterTenantInput = {
  name: 'Maria',
  email: 'maria@example.com',
  password: 'senha-super-forte',
  tenantNome: 'Fazenda Verde',
  empresa: {
    razaoSocial: 'Verde Folha LTDA',
    cnpjCpf: '12345678000190',
    tipoPessoa: 'PJ',
    regimeTributario: 'Simples Nacional',
    crt: '1',
  },
}

describe('tenants-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useTenants busca a página 1 com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useTenants(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/platform/tenants', {
      params: { page: 1, perPage: 20 },
    })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useTenants respeita page e perPage informados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 2 } })

    const { result } = renderHook(() => useTenants({ page: 2, perPage: 50 }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/platform/tenants', {
      params: { page: 2, perPage: 50 },
    })
  })

  it('useTenants expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useTenants(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateTenant faz POST e retorna o tenant criado', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { tenant: { id: 't1' } } })

    const { result } = renderHook(() => useCreateTenant(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate(registerInput)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/api/platform/tenants', registerInput)
    expect(result.current.data).toEqual({ id: 't1' })
  })

  it('useSetTenantStatus faz PATCH no endpoint de status', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { tenant: { id: 't1', status: 'suspenso' } } })

    const { result } = renderHook(() => useSetTenantStatus(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 't1', status: 'suspenso' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/platform/tenants/t1/status', {
      status: 'suspenso',
    })
    expect(result.current.data).toEqual({ id: 't1', status: 'suspenso' })
  })
})
