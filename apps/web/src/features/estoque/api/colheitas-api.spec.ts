import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useColheitas, useRegistrarColheita, useRegistrarEmbalagem } from './colheitas-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

const listResponse = {
  colheitas: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('colheitas-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useColheitas busca com empresaId e paginação default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useColheitas({ empresaId: 'e1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/colheitas', {
      params: { empresaId: 'e1', page: 1, perPage: 20 },
    })
  })

  it('useColheitas não dispara quando empresaId é null', () => {
    renderHook(() => useColheitas({ empresaId: null }), { wrapper: createWrapper('/') })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('useColheitas expõe isError quando rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useColheitas({ empresaId: 'e1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useRegistrarColheita faz POST e retorna colheita e lote', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { colheita: { id: 'c1' }, lote: { id: 'l1' } },
    })

    const { result } = renderHook(() => useRegistrarColheita(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ empresaId: 'e1', produtoId: 'p1', quantidade: 10, data: '2026-06-27' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/colheitas',
      expect.objectContaining({ produtoId: 'p1', quantidade: 10 }),
    )
    expect(result.current.data).toEqual({ colheita: { id: 'c1' }, lote: { id: 'l1' } })
  })

  it('useRegistrarEmbalagem faz POST em /api/embalagens', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { lote: { id: 'l1' }, movimento: {} } })

    const { result } = renderHook(() => useRegistrarEmbalagem(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ empresaId: 'e1', produtoId: 'p1', quantidade: 5, data: '2026-06-27' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/embalagens',
      expect.objectContaining({ produtoId: 'p1', quantidade: 5 }),
    )
  })
})
