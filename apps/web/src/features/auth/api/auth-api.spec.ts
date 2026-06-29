import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSignOut } from './auth-api'

import type * as ReactRouterDom from 'react-router-dom'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>()
  return { ...actual, useNavigate: () => navigateMock }
})

vi.mock('@/lib/api-client', () => ({
  api: { post: vi.fn() },
}))

describe('useSignOut', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('faz POST em /api/auth/sign-out e navega para /sign-in no sucesso', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ok: true } })

    const { result } = renderHook(() => useSignOut(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/api/auth/sign-out')
    expect(navigateMock).toHaveBeenCalledWith('/sign-in')
  })

  it('expõe isError quando o logout falha', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useSignOut(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
