import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export interface FichaTecnica {
  id: string
  tenantId: string
  produtoId: string
  descricaoComponente: string
  quantidadeReferencia: number | null
  observacoes: string | null
  createdAt: string
  updatedAt: string
}

export interface ListFichasTecnicasResponse {
  fichasTecnicas: FichaTecnica[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateFichaTecnicaInput {
  produtoId: string
  descricaoComponente: string
  quantidadeReferencia?: number | null
  observacoes?: string | null
}

export interface UpdateFichaTecnicaInput {
  id: string
  descricaoComponente?: string
  quantidadeReferencia?: number | null
  observacoes?: string | null
}

export const FICHAS_TECNICAS_QUERY_KEY = ['admin', 'fichas-tecnicas'] as const

export function useFichasTecnicas({
  produtoId,
  page = 1,
  perPage = 50,
}: {
  produtoId: string | null
  page?: number
  perPage?: number
}) {
  return useQuery({
    queryKey: [...FICHAS_TECNICAS_QUERY_KEY, { produtoId, page, perPage }],
    enabled: produtoId !== null,
    queryFn: async () => {
      const { data } = await api.get<ListFichasTecnicasResponse>('/api/fichas-tecnicas', {
        params: { produtoId, page, perPage },
      })
      return data
    },
  })
}

export function useCreateFichaTecnica() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateFichaTecnicaInput) => {
      const { data } = await api.post<{ fichaTecnica: FichaTecnica }>('/api/fichas-tecnicas', body)
      return data.fichaTecnica
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FICHAS_TECNICAS_QUERY_KEY }),
  })
}

export function useUpdateFichaTecnica() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateFichaTecnicaInput) => {
      const { data } = await api.patch<{ fichaTecnica: FichaTecnica }>(
        `/api/fichas-tecnicas/${id}`,
        body,
      )
      return data.fichaTecnica
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FICHAS_TECNICAS_QUERY_KEY }),
  })
}

export function useDeleteFichaTecnica() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ success: boolean }>(`/api/fichas-tecnicas/${id}`)
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FICHAS_TECNICAS_QUERY_KEY }),
  })
}
