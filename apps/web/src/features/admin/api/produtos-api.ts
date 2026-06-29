import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export const PRODUTO_TIPOS = ['bruto', 'embalado'] as const
export type ProdutoTipo = (typeof PRODUTO_TIPOS)[number]

export const PRODUTO_STATUSES = ['ativo', 'inativo'] as const
export type ProdutoStatus = (typeof PRODUTO_STATUSES)[number]

export interface Produto {
  id: string
  tenantId: string
  empresaId: string
  descricao: string
  tipo: ProdutoTipo
  unidadeMedida: string
  precoPadrao: number | null
  ncm: string | null
  cest: string | null
  cfopPadrao: string | null
  origemMercadoria: string | null
  cstCsosn: string | null
  aliquotas: Record<string, unknown> | null
  status: ProdutoStatus
  createdAt: string
  updatedAt: string
}

export interface ListProdutosResponse {
  produtos: Produto[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateProdutoInput {
  empresaId: string
  descricao: string
  tipo: ProdutoTipo
  unidadeMedida: string
  precoPadrao?: number | null
  ncm?: string | null
  cest?: string | null
  cfopPadrao?: string | null
  origemMercadoria?: string | null
  cstCsosn?: string | null
  aliquotas?: Record<string, unknown> | null
}

export interface UpdateProdutoInput extends Partial<Omit<CreateProdutoInput, 'empresaId'>> {
  id: string
}

export const PRODUTOS_QUERY_KEY = ['admin', 'produtos'] as const

export function useProdutos({ page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...PRODUTOS_QUERY_KEY, { page, perPage }],
    queryFn: async () => {
      const { data } = await api.get<ListProdutosResponse>('/api/produtos', {
        params: { page, perPage },
      })
      return data
    },
  })
}

export function useCreateProduto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateProdutoInput) => {
      const { data } = await api.post<{ produto: Produto }>('/api/produtos', body)
      return data.produto
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEY }),
  })
}

export function useUpdateProduto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateProdutoInput) => {
      const { data } = await api.patch<{ produto: Produto }>(`/api/produtos/${id}`, body)
      return data.produto
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEY }),
  })
}

export function useSetProdutoStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProdutoStatus }) => {
      const action = status === 'ativo' ? 'activate' : 'deactivate'
      const { data } = await api.patch<{ produto: Produto }>(`/api/produtos/${id}/${action}`)
      return data.produto
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: PRODUTOS_QUERY_KEY }),
  })
}
