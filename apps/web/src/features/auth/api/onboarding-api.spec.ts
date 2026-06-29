import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useRegisterTenant, type RegisterTenantInput } from './onboarding-api'

import { api } from '@/lib/api-client'
import { createWrapper } from '@/test/render-with-providers'

vi.mock('@/lib/api-client', () => ({
  api: { post: vi.fn() },
}))

const input: RegisterTenantInput = {
  name: 'Maria',
  email: 'maria@example.com',
  password: 'senha-super-forte',
  tenantNome: 'Fazenda Verde',
  empresa: {
    razaoSocial: 'Verde Folha LTDA',
    cnpjCpf: '12345678000190',
    tipoPessoa: 'PJ',
    regimeTributario: 'Simples Nacional',
    crt: '1',
  },
}

describe('useRegisterTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('faz POST em /api/onboarding/register com o payload e retorna os dados', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { ok: true } })

    const { result } = renderHook(() => useRegisterTenant(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.post).toHaveBeenCalledWith('/api/onboarding/register', input)
    expect(result.current.data).toEqual({ ok: true })
  })

  it('expõe isError quando a request rejeita', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useRegisterTenant(), { wrapper: createWrapper('/') })

    act(() => {
      result.current.mutate(input)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
