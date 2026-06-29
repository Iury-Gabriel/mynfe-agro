import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { RegisterTenantInput } from '@/features/auth/api/onboarding-api'

import { api } from '@/lib/api-client'

export const TENANT_STATUSES = ['ativo', 'suspenso'] as const
export type TenantStatus = (typeof TENANT_STATUSES)[number]

export interface Tenant {
  id: string
  nome: string
  status: TenantStatus
  empresasCount: number
  usuariosCount: number
  createdAt: string
}

export interface ListTenantsResponse {
  tenants: Tenant[]
  total: number
  page: number
  perPage: number
}

export const TENANTS_QUERY_KEY = ['platform', 'tenants'] as const

export function useTenants({ page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...TENANTS_QUERY_KEY, { page, perPage }],
    queryFn: async () => {
      const { data } = await api.get<ListTenantsResponse>('/api/platform/tenants', {
        params: { page, perPage },
      })
      return data
    },
  })
}

export function useCreateTenant() {
  const qc = useQueryClient()
  return useMutation({
    meta: { suppressGlobalError: true },
    mutationFn: async (body: RegisterTenantInput) => {
      const { data } = await api.post<{ tenant: Tenant }>('/api/platform/tenants', body)
      return data.tenant
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TENANTS_QUERY_KEY }),
  })
}

export function useSetTenantStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TenantStatus }) => {
      const { data } = await api.patch<{ tenant: Tenant }>(`/api/platform/tenants/${id}/status`, {
        status,
      })
      return data.tenant
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TENANTS_QUERY_KEY }),
  })
}
