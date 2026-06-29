import type { ProdutoStatus, ProdutoTipo } from '@/domain/enterprise/entities/produto'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Produto } from '@/domain/enterprise/entities/produto'

export interface MakeProdutoOverrides {
  id?: string
  tenantId?: string
  empresaId?: string
  descricao?: string
  tipo?: ProdutoTipo
  unidadeMedida?: string
  precoPadrao?: number | null
  ncm?: string | null
  cest?: string | null
  cfopPadrao?: string | null
  origemMercadoria?: string | null
  cstCsosn?: string | null
  aliquotas?: Record<string, unknown> | null
  status?: ProdutoStatus
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeProduto(overrides: MakeProdutoOverrides = {}): Produto {
  return Produto.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      empresaId: overrides.empresaId ?? 'empresa-1',
      descricao: overrides.descricao ?? 'Soja a granel',
      tipo: overrides.tipo ?? 'bruto',
      unidadeMedida: overrides.unidadeMedida ?? 'KG',
      precoPadrao: overrides.precoPadrao ?? null,
      ncm: overrides.ncm ?? null,
      cest: overrides.cest ?? null,
      cfopPadrao: overrides.cfopPadrao ?? null,
      origemMercadoria: overrides.origemMercadoria ?? null,
      cstCsosn: overrides.cstCsosn ?? null,
      aliquotas: overrides.aliquotas ?? null,
      status: overrides.status ?? 'ativo',
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'produto-1'),
  )
}
