import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { RemessaItem } from '@/domain/enterprise/entities/remessa-item'

export interface MakeRemessaItemOverrides {
  id?: string
  tenantId?: string
  remessaId?: string
  produtoId?: string
  loteId?: string | null
  quantidade?: number
  precoUnitario?: number
  valorTotal?: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeRemessaItem(overrides: MakeRemessaItemOverrides = {}): RemessaItem {
  const quantidade = overrides.quantidade ?? 100
  const precoUnitario = overrides.precoUnitario ?? 10

  return RemessaItem.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      remessaId: overrides.remessaId ?? 'remessa-1',
      produtoId: overrides.produtoId ?? 'produto-1',
      loteId: overrides.loteId ?? null,
      quantidade,
      precoUnitario,
      valorTotal: overrides.valorTotal ?? quantidade * precoUnitario,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'remessa-item-1'),
  )
}
