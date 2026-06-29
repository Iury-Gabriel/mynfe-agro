import { useMutation } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const TIPOS_PESSOA_ONBOARDING = ['PJ', 'PF'] as const
export type TipoPessoaOnboarding = (typeof TIPOS_PESSOA_ONBOARDING)[number]

export interface OnboardingEmpresaInput {
  razaoSocial: string
  cnpjCpf: string
  tipoPessoa: TipoPessoaOnboarding
  regimeTributario: string
  crt: string
}

export interface RegisterTenantInput {
  name: string
  email: string
  password: string
  tenantNome: string
  empresa: OnboardingEmpresaInput
}

export function useRegisterTenant() {
  return useMutation({
    meta: { suppressGlobalError: true },
    mutationFn: async (input: RegisterTenantInput) => {
      const { data } = await api.post('/api/onboarding/register', input)
      return data
    },
  })
}
