import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { TabelaPrecoCliente } from '@/domain/enterprise/entities/tabela-preco-cliente'

export interface MakeTabelaPrecoClienteOverrides {
  id?: string
  tenantId?: string
  clienteId?: string
  produtoId?: string
  preco?: number
  vigenciaInicio?: Date | null
  vigenciaFim?: Date | null
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeTabelaPrecoCliente(
  overrides: MakeTabelaPrecoClienteOverrides = {},
): TabelaPrecoCliente {
  return TabelaPrecoCliente.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      clienteId: overrides.clienteId ?? 'cliente-1',
      produtoId: overrides.produtoId ?? 'produto-1',
      preco: overrides.preco ?? 100,
      vigenciaInicio: overrides.vigenciaInicio ?? null,
      vigenciaFim: overrides.vigenciaFim ?? null,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'tabela-preco-1'),
  )
}
