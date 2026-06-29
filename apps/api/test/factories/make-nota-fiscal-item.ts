import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotaFiscalItem } from '@/domain/enterprise/entities/nota-fiscal-item'

export interface MakeNotaFiscalItemOverrides {
  id?: string
  tenantId?: string
  notaFiscalId?: string
  produtoId?: string
  descricao?: string
  ncm?: string | null
  cfop?: string | null
  cstCsosn?: string | null
  quantidade?: number
  valorUnitario?: number
  valorTotal?: number
  impostos?: Record<string, unknown>
  createdAt?: Date
  updatedAt?: Date
}

export function makeNotaFiscalItem(overrides: MakeNotaFiscalItemOverrides = {}): NotaFiscalItem {
  const quantidade = overrides.quantidade ?? 100
  const valorUnitario = overrides.valorUnitario ?? 10

  return NotaFiscalItem.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      notaFiscalId: overrides.notaFiscalId ?? 'nota-1',
      produtoId: overrides.produtoId ?? 'produto-1',
      descricao: overrides.descricao ?? 'Soja a granel',
      ncm: overrides.ncm ?? '12019000',
      cfop: overrides.cfop ?? '5101',
      cstCsosn: overrides.cstCsosn ?? '102',
      quantidade,
      valorUnitario,
      valorTotal: overrides.valorTotal ?? quantidade * valorUnitario,
      impostos: overrides.impostos ?? {},
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
    },
    new UniqueEntityID(overrides.id ?? 'nota-item-1'),
  )
}
