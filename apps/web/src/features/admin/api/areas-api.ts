import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export interface Area {
  id: string
  tenantId: string
  fazendaId: string
  identificacao: string
  tamanho: number | null
  unidadeTamanho: string | null
  rotulo: string | null
  geometria: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface ListAreasResponse {
  areas: Area[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateAreaInput {
  fazendaId: string
  identificacao: string
  tamanho?: number | null
  unidadeTamanho?: string | null
  rotulo?: string | null
}

export interface UpdateAreaInput extends Partial<Omit<CreateAreaInput, 'fazendaId'>> {
  id: string
}

export const AREAS_QUERY_KEY = ['admin', 'areas'] as const

export function useAreas({ page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...AREAS_QUERY_KEY, { page, perPage }],
    queryFn: async () => {
      const { data } = await api.get<ListAreasResponse>('/api/areas', {
        params: { page, perPage },
      })
      return data
    },
  })
}

export function useCreateArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateAreaInput) => {
      const { data } = await api.post<{ area: Area }>('/api/areas', body)
      return data.area
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: AREAS_QUERY_KEY }),
  })
}

export function useUpdateArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateAreaInput) => {
      const { data } = await api.patch<{ area: Area }>(`/api/areas/${id}`, body)
      return data.area
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: AREAS_QUERY_KEY }),
  })
}

export function useDeleteArea() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ area: Area }>(`/api/areas/${id}`)
      return data.area
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: AREAS_QUERY_KEY }),
  })
}
