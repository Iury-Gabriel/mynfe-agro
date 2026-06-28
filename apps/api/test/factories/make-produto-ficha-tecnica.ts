import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProdutoFichaTecnica } from '@/domain/enterprise/entities/produto-ficha-tecnica'

export interface MakeProdutoFichaTecnicaOverrides {
  id?: string
  tenantId?: string
  produtoId?: string
  descricaoComponente?: string
  quantidadeReferencia?: number | null
  observacoes?: string | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeProdutoFichaTecnica(
  overrides: MakeProdutoFichaTecnicaOverrides = {},
): ProdutoFichaTecnica {
  return ProdutoFichaTecnica.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      produtoId: overrides.produtoId ?? 'produto-1',
      descricaoComponente: overrides.descricaoComponente ?? 'Milho moído',
      quantidadeReferencia: overrides.quantidadeReferencia ?? null,
      observacoes: overrides.observacoes ?? null,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'ficha-1'),
  )
}
