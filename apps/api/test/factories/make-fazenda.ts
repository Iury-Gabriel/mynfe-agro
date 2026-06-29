import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Fazenda } from '@/domain/enterprise/entities/fazenda'

export interface MakeFazendaOverrides {
  id?: string
  tenantId?: string
  empresaId?: string
  nome?: string
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
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
}

export function makeFazenda(overrides: MakeFazendaOverrides = {}): Fazenda {
  return Fazenda.create(
    {
      tenantId: overrides.tenantId ?? 'tenant-1',
      empresaId: overrides.empresaId ?? 'empresa-1',
      nome: overrides.nome ?? 'Fazenda Boa Vista',
      enderecoLogradouro: overrides.enderecoLogradouro ?? null,
      enderecoNumero: overrides.enderecoNumero ?? null,
      enderecoBairro: overrides.enderecoBairro ?? null,
      enderecoCep: overrides.enderecoCep ?? null,
      municipio: overrides.municipio ?? null,
      uf: overrides.uf ?? null,
      latitude: overrides.latitude ?? null,
      longitude: overrides.longitude ?? null,
      car: overrides.car ?? null,
      nirfIncra: overrides.nirfIncra ?? null,
      areaTotalHa: overrides.areaTotalHa ?? null,
      createdAt: overrides.createdAt ?? new Date('2024-01-01'),
      updatedAt: overrides.updatedAt ?? new Date('2024-01-01'),
      deletedAt: overrides.deletedAt ?? null,
    },
    new UniqueEntityID(overrides.id ?? 'fazenda-1'),
  )
}
