import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export interface TabelaPreco {
  id: string
  tenantId: string
  clienteId: string
  produtoId: string
  preco: number
  vigenciaInicio: string | null
  vigenciaFim: string | null
  createdAt: string
  updatedAt: string
}

export interface ListTabelaPrecosResponse {
  tabelaPrecos: TabelaPreco[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateTabelaPrecoInput {
  clienteId: string
  produtoId: string
  preco: number
  vigenciaInicio?: string | null
  vigenciaFim?: string | null
}

export const TABELA_PRECOS_QUERY_KEY = ['admin', 'tabela-precos'] as const

export function useTabelaPrecos({
  page = 1,
  perPage = 20,
}: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...TABELA_PRECOS_QUERY_KEY, { page, perPage }],
    queryFn: async () => {
      const { data } = await api.get<ListTabelaPrecosResponse>('/api/tabela-precos', {
        params: { page, perPage },
      })
      return data
    },
  })
}

export function useCreateTabelaPreco() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateTabelaPrecoInput) => {
      const { data } = await api.post<{ tabelaPreco: TabelaPreco }>('/api/tabela-precos', body)
      return data.tabelaPreco
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TABELA_PRECOS_QUERY_KEY }),
  })
}

export function useDeleteTabelaPreco() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ success: boolean }>(`/api/tabela-precos/${id}`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TABELA_PRECOS_QUERY_KEY }),
  })
}
