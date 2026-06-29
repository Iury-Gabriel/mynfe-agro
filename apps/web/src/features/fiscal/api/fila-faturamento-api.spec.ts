import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFilaFaturamento } from './fila-faturamento-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

describe('fila-faturamento-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useFilaFaturamento busca com empresaId e paginação default', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { pedidos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(() => useFilaFaturamento({ empresaId: 'e1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/fila-faturamento', {
      params: { empresaId: 'e1', page: 1, perPage: 20 },
    })
  })

  it('useFilaFaturamento inclui clienteId quando informado', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { pedidos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(
      () => useFilaFaturamento({ empresaId: 'e1', clienteId: 'c1' }),
      { wrapper: createWrapper('/') },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/fila-faturamento', {
      params: { empresaId: 'e1', page: 1, perPage: 20, clienteId: 'c1' },
    })
  })

  it('useFilaFaturamento não dispara quando empresaId é null', () => {
    renderHook(() => useFilaFaturamento({ empresaId: null }), { wrapper: createWrapper('/') })
    expect(api.get).not.toHaveBeenCalled()
  })
})
