import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api-client'

export interface Fazenda {
  id: string
  tenantId: string
  empresaId: string
  nome: string
  enderecoLogradouro: string | null
  enderecoNumero: string | null
  enderecoBairro: string | null
  enderecoCep: string | null
  municipio: string | null
  uf: string | null
  latitude: number | null
  longitude: number | null
  car: string | null
  nirfIncra: string | null
  areaTotalHa: number | null
  createdAt: string
  updatedAt: string
}

export interface ListFazendasResponse {
  fazendas: Fazenda[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface CreateFazendaInput {
  empresaId: string
  nome: string
  enderecoLogradouro?: string | null
  enderecoNumero?: string | null
  enderecoBairro?: string | null
  enderecoCep?: string | null
  municipio?: string | null
  uf?: string | null
  latitude?: number | null
  longitude?: number | null
  car?: string | null
  nirfIncra?: string | null
  areaTotalHa?: number | null
}

export interface UpdateFazendaInput extends Partial<Omit<CreateFazendaInput, 'empresaId'>> {
  id: string
}

export const FAZENDAS_QUERY_KEY = ['admin', 'fazendas'] as const

export function useFazendas({ page = 1, perPage = 20 }: { page?: number; perPage?: number } = {}) {
  return useQuery({
    queryKey: [...FAZENDAS_QUERY_KEY, { page, perPage }],
    queryFn: async () => {
      const { data } = await api.get<ListFazendasResponse>('/api/fazendas', {
        params: { page, perPage },
      })
      return data
    },
  })
}

export function useCreateFazenda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateFazendaInput) => {
      const { data } = await api.post<{ fazenda: Fazenda }>('/api/fazendas', body)
      return data.fazenda
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FAZENDAS_QUERY_KEY }),
  })
}

export function useUpdateFazenda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateFazendaInput) => {
      const { data } = await api.patch<{ fazenda: Fazenda }>(`/api/fazendas/${id}`, body)
      return data.fazenda
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FAZENDAS_QUERY_KEY }),
  })
}

export function useDeleteFazenda() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<{ fazenda: Fazenda }>(`/api/fazendas/${id}`)
      return data.fazenda
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FAZENDAS_QUERY_KEY }),
  })
}
