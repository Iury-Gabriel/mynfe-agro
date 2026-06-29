import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useCancelarRemessa,
  useCriarRemessa,
  useMarcarRemessaEntregue,
  useRemessa,
  useRemessas,
} from './remessas-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}))

describe('remessas-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useRemessas busca com empresaId e filtros', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { remessas: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(
      () => useRemessas({ empresaId: 'e1', filtros: { status: 'aberta' } }),
      { wrapper: createWrapper('/') },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/remessas', {
      params: { empresaId: 'e1', page: 1, perPage: 20, status: 'aberta' },
    })
  })

  it('useRemessas sem filtros não adiciona params extras', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { remessas: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(() => useRemessas({ empresaId: 'e1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/remessas', {
      params: { empresaId: 'e1', page: 1, perPage: 20 },
    })
  })

  it('useRemessas com cliente e período monta todos os params', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { remessas: [], total: 0, page: 1, perPage: 20, totalPages: 1 },
    })

    const { result } = renderHook(
      () =>
        useRemessas({
          empresaId: 'e1',
          filtros: {
            clienteId: 'cli-1',
            periodoInicio: '2026-06-01',
            periodoFim: '2026-06-30',
          },
        }),
      { wrapper: createWrapper('/') },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/remessas', {
      params: {
        empresaId: 'e1',
        page: 1,
        perPage: 20,
        clienteId: 'cli-1',
        periodoInicio: '2026-06-01',
        periodoFim: '2026-06-30',
      },
    })
  })

  it('useRemessas não dispara quando empresaId é null', () => {
    renderHook(() => useRemessas({ empresaId: null }), { wrapper: createWrapper('/') })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('useRemessa busca o detalhe', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { remessa: { id: 'r1' } } })

    const { result } = renderHook(() => useRemessa({ empresaId: 'e1', remessaId: 'r1' }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/remessas/r1', { params: { empresaId: 'e1' } })
    expect(result.current.data).toEqual({ id: 'r1' })
  })

  it('useCriarRemessa faz POST em /api/remessas', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { remessa: { id: 'r1' } } })

    const { result } = renderHook(() => useCriarRemessa(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({
        empresaId: 'e1',
        clienteId: 'c1',
        data: '2026-06-27T00:00:00.000Z',
        itens: [{ produtoId: 'p1', quantidade: 5 }],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/remessas',
      expect.objectContaining({ empresaId: 'e1', clienteId: 'c1' }),
    )
  })

  it('useMarcarRemessaEntregue faz POST em /entregue', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { remessa: { id: 'r1' } } })

    const { result } = renderHook(() => useMarcarRemessaEntregue(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ remessaId: 'r1', empresaId: 'e1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/api/remessas/r1/entregue', { empresaId: 'e1' })
  })

  it('useCancelarRemessa faz POST em /cancelar', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { remessa: { id: 'r1' } } })

    const { result } = renderHook(() => useCancelarRemessa(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ remessaId: 'r1', empresaId: 'e1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/api/remessas/r1/cancelar', { empresaId: 'e1' })
  })
})
