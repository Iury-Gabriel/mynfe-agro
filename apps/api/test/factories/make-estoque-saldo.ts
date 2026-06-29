import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { EstoqueSaldo } from '@/domain/enterprise/entities/estoque-saldo'

export interface MakeEstoqueSaldoOverrides {
  id?: string
  tenantId?: string
  empresaId?: string
  produtoId?: string
  loteId?: string | null
  quantidadeDisponivel?: number
  quantidadeReservada?: number
  createdAt?: Date
  updatedAt?: Date
}

export function makeEstoqueSaldo(overrides: MakeEstoqueSaldoOverrides = {}): EstoqueSaldo {
  return EstoqueSaldo.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      empresaId: overrides.empresaId ?? 'empresa-1',
      produtoId: overrides.produtoId ?? 'produto-1',
      loteId: overrides.loteId ?? null,
      quantidadeDisponivel: overrides.quantidadeDisponivel ?? 0,
      quantidadeReservada: overrides.quantidadeReservada ?? 0,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
    },
    new UniqueEntityID(overrides.id ?? 'saldo-1'),
  )
}
