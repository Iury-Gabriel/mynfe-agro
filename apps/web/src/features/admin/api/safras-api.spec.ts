import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCreateSafra, useDeleteSafra, useSafras, useUpdateSafra } from './safras-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const listResponse = {
  safras: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('safras-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useSafras busca a página 1 com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useSafras(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/safras', { params: { page: 1, perPage: 20 } })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useSafras respeita page e perPage informados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 2 } })

    const { result } = renderHook(() => useSafras({ page: 2, perPage: 40 }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/safras', { params: { page: 2, perPage: 40 } })
  })

  it('useSafras expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useSafras(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateSafra faz POST e retorna a safra criada', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { safra: { id: 's1' } } })

    const { result } = renderHook(() => useCreateSafra(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ areaId: 'a1', cultura: 'Soja' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/safras',
      expect.objectContaining({ cultura: 'Soja' }),
    )
    expect(result.current.data).toEqual({ id: 's1' })
  })

  it('useUpdateSafra faz PATCH no id com o restante do body', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { safra: { id: 's1' } } })

    const { result } = renderHook(() => useUpdateSafra(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 's1', cultura: 'Milho' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/safras/s1', { cultura: 'Milho' })
  })

  it('useDeleteSafra faz DELETE no id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { safra: { id: 's1' } } })

    const { result } = renderHook(() => useDeleteSafra(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate('s1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.delete).toHaveBeenCalledWith('/api/safras/s1')
    expect(result.current.data).toEqual({ id: 's1' })
  })
})
