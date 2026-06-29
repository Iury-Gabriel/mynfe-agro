import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAreas, useCreateArea, useDeleteArea, useUpdateArea } from './areas-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const listResponse = {
  areas: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('areas-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useAreas busca a página 1 com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useAreas(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/areas', { params: { page: 1, perPage: 20 } })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useAreas respeita page e perPage informados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 2 } })

    const { result } = renderHook(() => useAreas({ page: 2, perPage: 40 }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/areas', { params: { page: 2, perPage: 40 } })
  })

  it('useAreas expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useAreas(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateArea faz POST e retorna a área criada', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { area: { id: 'a1' } } })

    const { result } = renderHook(() => useCreateArea(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ fazendaId: 'f1', identificacao: 'Talhão 1' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/areas',
      expect.objectContaining({ identificacao: 'Talhão 1' }),
    )
    expect(result.current.data).toEqual({ id: 'a1' })
  })

  it('useUpdateArea faz PATCH no id com o restante do body', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { area: { id: 'a1' } } })

    const { result } = renderHook(() => useUpdateArea(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 'a1', identificacao: 'Talhão 2' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/areas/a1', { identificacao: 'Talhão 2' })
  })

  it('useDeleteArea faz DELETE no id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { area: { id: 'a1' } } })

    const { result } = renderHook(() => useDeleteArea(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate('a1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.delete).toHaveBeenCalledWith('/api/areas/a1')
    expect(result.current.data).toEqual({ id: 'a1' })
  })
})
