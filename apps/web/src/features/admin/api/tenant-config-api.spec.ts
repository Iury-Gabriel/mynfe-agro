import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTenantConfig, useUpdateTenantConfig } from './tenant-config-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}))

const tenant = {
  id: 't1',
  nome: 'Fazenda X',
  status: 'ativo',
  labelArea: 'Talhão',
  diaCorteConsolidacao: 5,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('tenant-config-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useTenantConfig busca a config do tenant', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { tenant } })

    const { result } = renderHook(() => useTenantConfig(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/tenant/config')
    expect(result.current.data).toEqual(tenant)
  })

  it('useTenantConfig expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useTenantConfig(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useUpdateTenantConfig faz PATCH e retorna o tenant atualizado', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { tenant: { ...tenant, nome: 'Novo' } } })

    const { result } = renderHook(() => useUpdateTenantConfig(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ nome: 'Novo', labelArea: 'Gleba', diaCorteConsolidacao: 10 })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/tenant/config', {
      nome: 'Novo',
      labelArea: 'Gleba',
      diaCorteConsolidacao: 10,
    })
    expect(result.current.data?.nome).toBe('Novo')
  })
})
