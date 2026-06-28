import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const SAFRA_STATUSES = ['planejado', 'em_andamento', 'colhido'] as const
export type SafraStatus = (typeof SAFRA_STATUSES)[number]

export interface Safra {
  id: string
  tenantId: string
  areaId: string
  cultura: string
  variedade: string | null
  dataPlantio: string | null
  dataColheitaPrevista: string | null
  dataColheitaRealizada: string | null
  estimativaProducao: number | null
  status: SafraStatus
  createdAt: string
  updatedAt: string
}

export interface ListSafrasResponse {
  safras: Safra[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateSafraInput {
  areaId: string
  cultura: string
  variedade?: string | null
  dataPlantio?: string | null
  dataColheitaPrevista?: string | null
  estimativaProducao?: number | null
  status?: SafraStatus
}

export interface UpdateSafraInput extends Partial<Omit<CreateSafraInput, 'areaId'>> {
  id: string
}

export const SAFRAS_QUERY_KEY = ['admin', 'safras'] as const

export function useSafras({ page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...SAFRAS_QUERY_KEY, { page, perPage }],
    queryFn: async () => {
      const { data } = await api.get<ListSafrasResponse>('/api/safras', {
        params: { page, perPage },
      })
      return data
    },
  })
}

export function useCreateSafra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateSafraInput) => {
      const { data } = await api.post<{ safra: Safra }>('/api/safras', body)
      return data.safra
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SAFRAS_QUERY_KEY }),
  })
}

export function useUpdateSafra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateSafraInput) => {
      const { data } = await api.patch<{ safra: Safra }>(`/api/safras/${id}`, body)
      return data.safra
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SAFRAS_QUERY_KEY }),
  })
}

export function useDeleteSafra() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ safra: Safra }>(`/api/safras/${id}`)
      return data.safra
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SAFRAS_QUERY_KEY }),
  })
}
