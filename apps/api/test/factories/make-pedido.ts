import type { PedidoItem } from '@/domain/enterprise/entities/pedido-item'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Pedido, type PedidoStatus, type PedidoTipo } from '@/domain/enterprise/entities/pedido'

export interface MakePedidoOverrides {
  id?: string
  tenantId?: string
  empresaFaturadoraId?: string
  clienteId?: string
  numero?: string
  tipo?: PedidoTipo
  status?: PedidoStatus
  valorTotal?: number
  periodoConsolidacao?: Date | null
  data?: Date
  observacoes?: string | null
  itens?: PedidoItem[]
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makePedido(overrides: MakePedidoOverrides = {}): Pedido {
  return Pedido.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      empresaFaturadoraId: overrides.empresaFaturadoraId ?? 'empresa-1',
      clienteId: overrides.clienteId ?? 'cliente-1',
      numero: overrides.numero ?? '000001',
      tipo: overrides.tipo ?? 'avulso',
      status: overrides.status ?? 'rascunho',
      valorTotal: overrides.valorTotal ?? 0,
      periodoConsolidacao: overrides.periodoConsolidacao ?? null,
      data: overrides.data ?? new Date('2024-10-01'),
      observacoes: overrides.observacoes ?? null,
      itens: overrides.itens ?? [],
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'pedido-1'),
  )
}
