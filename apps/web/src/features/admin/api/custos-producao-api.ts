import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const CUSTO_PRODUCAO_TIPOS = ['insumo', 'mao_de_obra', 'maquinario', 'outro'] as const
export type CustoProducaoTipo = (typeof CUSTO_PRODUCAO_TIPOS)[number]

export interface CustoProducao {
  id: string
  tenantId: string
  safraId: string | null
  areaId: string | null
  tipo: CustoProducaoTipo
  descricao: string
  valor: number
  data: string
  createdAt: string
  updatedAt: string
}

export interface ListCustosProducaoResponse {
  custos: CustoProducao[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateCustoProducaoInput {
  safraId?: string | null
  areaId?: string | null
  tipo: CustoProducaoTipo
  descricao: string
  valor: number
  data: string
}

export const CUSTOS_PRODUCAO_QUERY_KEY = ['admin', 'custos-producao'] as const

export function useCustosProducao({
  page = 1,
  perPage = 20,
}: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...CUSTOS_PRODUCAO_QUERY_KEY, { page, perPage }],
    queryFn: async () => {
      const { data } = await api.get<ListCustosProducaoResponse>('/api/custos-producao', {
        params: { page, perPage },
      })
      return data
    },
  })
}

export function useCreateCustoProducao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateCustoProducaoInput) => {
      const { data } = await api.post<{ custo: CustoProducao }>('/api/custos-producao', body)
      return data.custo
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOS_PRODUCAO_QUERY_KEY }),
  })
}

export function useDeleteCustoProducao() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ custo: CustoProducao }>(`/api/custos-producao/${id}`)
      return data.custo
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CUSTOS_PRODUCAO_QUERY_KEY }),
  })
}
