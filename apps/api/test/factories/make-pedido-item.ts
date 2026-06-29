import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { PedidoItem } from '@/domain/enterprise/entities/pedido-item'

export interface MakePedidoItemOverrides {
  id?: string
  tenantId?: string
  pedidoId?: string
  produtoId?: string
  loteId?: string | null
  quantidade?: number
  precoUnitario?: number
  valorTotal?: number
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makePedidoItem(overrides: MakePedidoItemOverrides = {}): PedidoItem {
  const quantidade = overrides.quantidade ?? 100
  const precoUnitario = overrides.precoUnitario ?? 10

  return PedidoItem.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      pedidoId: overrides.pedidoId ?? 'pedido-1',
      produtoId: overrides.produtoId ?? 'produto-1',
      loteId: overrides.loteId ?? null,
      quantidade,
      precoUnitario,
      valorTotal: overrides.valorTotal ?? quantidade * precoUnitario,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'pedido-item-1'),
  )
}
