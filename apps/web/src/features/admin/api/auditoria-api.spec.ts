import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAuditoriaLogs } from './auditoria-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn() },
}))

const listResponse = {
  logs: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('auditoria-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useAuditoriaLogs busca a página 1 com filtros vazios', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useAuditoriaLogs(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/auditoria', {
      params: { page: 1, perPage: 20, entidade: undefined, acao: undefined, usuarioId: undefined },
    })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useAuditoriaLogs repassa filtros e paginação', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 2 } })

    const { result } = renderHook(
      () => useAuditoriaLogs({ page: 2, perPage: 5, entidade: 'tenant', acao: 'editar', usuarioId: 'u1' }),
      { wrapper: createWrapper('/') },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/auditoria', {
      params: { page: 2, perPage: 5, entidade: 'tenant', acao: 'editar', usuarioId: 'u1' },
    })
  })

  it('useAuditoriaLogs expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useAuditoriaLogs(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
