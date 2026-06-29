import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAjustarEstoque, useMovimentacoes, usePosicaoEstoque } from './estoque-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

describe('estoque-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('usePosicaoEstoque busca com empresaId e paginação default', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { saldos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(() => usePosicaoEstoque({ empresaId: 'e1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/estoque/posicao', {
      params: { empresaId: 'e1', page: 1, perPage: 20 },
    })
  })

  it('usePosicaoEstoque não dispara quando empresaId é null', () => {
    renderHook(() => usePosicaoEstoque({ empresaId: null }), { wrapper: createWrapper('/') })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('useMovimentacoes envia filtros como query params', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { movimentos: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(
      () => useMovimentacoes({ empresaId: 'e1', filtros: { tipo: 'entrada' } }),
      { wrapper: createWrapper('/') },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/estoque/movimentos', {
      params: { empresaId: 'e1', page: 1, perPage: 20, tipo: 'entrada' },
    })
  })

  it('useMovimentacoes não dispara quando empresaId é null', () => {
    renderHook(() => useMovimentacoes({ empresaId: null }), { wrapper: createWrapper('/') })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('useAjustarEstoque faz POST em /api/estoque/ajustes', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { movimento: { id: 'm1' }, saldo: { id: 's1' } } })

    const { result } = renderHook(() => useAjustarEstoque(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({
        empresaId: 'e1',
        produtoId: 'p1',
        delta: -5,
        motivo: 'inventário',
        data: '2026-06-27',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/estoque/ajustes',
      expect.objectContaining({ delta: -5, motivo: 'inventário' }),
    )
    expect(result.current.data).toEqual({ movimento: { id: 'm1' }, saldo: { id: 's1' } })
  })
})
