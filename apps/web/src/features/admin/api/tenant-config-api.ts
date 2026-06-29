import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const LABEL_AREA_OPTIONS = ['Talhão', 'Gleba', 'Canteiro', 'Lote', 'Área'] as const
export type LabelAreaOption = (typeof LABEL_AREA_OPTIONS)[number]

export interface TenantConfig {
  id: string
  nome: string
  status: string
  labelArea: string
  diaCorteConsolidacao: number | null
  createdAt: string
  updatedAt: string
}

export interface UpdateTenantConfigInput {
  nome?: string
  labelArea?: string
  diaCorteConsolidacao?: number | null
}

export const TENANT_CONFIG_QUERY_KEY = ['admin', 'tenant-config'] as const

export function useTenantConfig() {
  return useQuery({
    queryKey: TENANT_CONFIG_QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<{ tenant: TenantConfig }>('/api/tenant/config')
      return data.tenant
    },
  })
}

export function useUpdateTenantConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: UpdateTenantConfigInput) => {
      const { data } = await api.patch<{ tenant: TenantConfig }>('/api/tenant/config', body)
      return data.tenant
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TENANT_CONFIG_QUERY_KEY }),
  })
}
