import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  useClientes,
  useCreateCliente,
  useDeleteCliente,
  useUpdateCliente,
} from './clientes-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const listResponse = {
  clientes: [],
  total: 0,
  page: 1,
  perPage: 20,
  totalPages: 1,
}

describe('clientes-api hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('useClientes busca a página 1 com perPage default', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: listResponse })

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/clientes', { params: { page: 1, perPage: 20 } })
    expect(result.current.data).toEqual(listResponse)
  })

  it('useClientes respeita page e perPage informados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { ...listResponse, page: 2 } })

    const { result } = renderHook(() => useClientes({ page: 2, perPage: 40 }), {
      wrapper: createWrapper('/'),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/api/clientes', { params: { page: 2, perPage: 40 } })
  })

  it('useClientes expõe isError quando a request rejeita', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useClientes(), { wrapper: createWrapper('/') })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('useCreateCliente faz POST e retorna o cliente criado', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { cliente: { id: 'c1' } } })

    const { result } = renderHook(() => useCreateCliente(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({
        tipoPessoa: 'PJ',
        razaoSocialNome: 'Agro Comércio',
        cnpjCpf: '12345678000190',
        indicadorIe: '1',
        contribuinteIcms: true,
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith(
      '/api/clientes',
      expect.objectContaining({ razaoSocialNome: 'Agro Comércio' }),
    )
    expect(result.current.data).toEqual({ id: 'c1' })
  })

  it('useUpdateCliente faz PATCH no id com o restante do body', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { cliente: { id: 'c1' } } })

    const { result } = renderHook(() => useUpdateCliente(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate({ id: 'c1', razaoSocialNome: 'Novo Nome' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.patch).toHaveBeenCalledWith('/api/clientes/c1', { razaoSocialNome: 'Novo Nome' })
  })

  it('useDeleteCliente faz DELETE no id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { cliente: { id: 'c1' } } })

    const { result } = renderHook(() => useDeleteCliente(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate('c1')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.delete).toHaveBeenCalledWith('/api/clientes/c1')
    expect(result.current.data).toEqual({ id: 'c1' })
  })
})
