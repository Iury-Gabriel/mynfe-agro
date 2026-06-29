import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export interface Colheita {
  id: string
  tenantId: string
  empresaId: string
  produtoId: string
  safraId: string | null
  areaId: string | null
  quantidade: number
  data: string
  responsavelUsuarioId: string | null
  createdAt: string
  updatedAt: string
}

export interface Lote {
  id: string
  tenantId: string
  empresaId: string
  produtoId: string
  codigoLote: string
  origemTipo: string | null
  colheitaId: string | null
  areaId: string | null
  quantidadeInicial: number
  quantidadeAtual: number
  validade: string | null
  dataEntrada: string
  createdAt: string
  updatedAt: string
}

export interface ListColheitasResponse {
  colheitas: Colheita[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface RegistrarColheitaInput {
  empresaId: string
  produtoId: string
  quantidade: number
  data: string
  safraId?: string | null
  areaId?: string | null
  codigoLote?: string | null
  validade?: string | null
}

export interface RegistrarEmbalagemInput {
  empresaId: string
  produtoId: string
  quantidade: number
  data: string
  codigoLote?: string | null
  validade?: string | null
}

export const COLHEITAS_QUERY_KEY = ['estoque', 'colheitas'] as const
export const LOTES_QUERY_KEY = ['estoque', 'lotes'] as const
export const ESTOQUE_QUERY_KEY = ['estoque', 'posicao'] as const
export const MOVIMENTOS_QUERY_KEY = ['estoque', 'movimentos'] as const

export function useColheitas({
  empresaId,
  page = 1,
  perPage = 20,
}: {
  empresaId: string | null
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: [...COLHEITAS_QUERY_KEY, { empresaId, page, perPage }],
    enabled: !!empresaId,
    queryFn: async () => {
      const { data } = await api.get<ListColheitasResponse>('/api/colheitas', {
        params: { empresaId, page, perPage },
      })
      return data
    },
  })
}

export function useRegistrarColheita() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: RegistrarColheitaInput) => {
      const { data } = await api.post<{ colheita: Colheita; lote: Lote }>('/api/colheitas', body)
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: COLHEITAS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: MOVIMENTOS_QUERY_KEY })
    },
  })
}

export function useRegistrarEmbalagem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: RegistrarEmbalagemInput) => {
      const { data } = await api.post<{ lote: Lote; movimento: unknown }>('/api/embalagens', body)
      return data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LOTES_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ESTOQUE_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: MOVIMENTOS_QUERY_KEY })
    },
  })
}
