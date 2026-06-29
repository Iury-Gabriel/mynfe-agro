import type { Prisma, Fazenda as PrismaFazenda } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Fazenda } from '@/domain/enterprise/entities/fazenda'

function decimalToNumber(raw: Prisma.Decimal | null): number | null {
  return raw === null ? null : raw.toNumber()
}

export class PrismaFazendaMapper {
  static toDomain(raw: PrismaFazenda): Fazenda {
    return Fazenda.create(
      {
        tenantId: raw.tenantId,
        empresaId: raw.empresaId,
        nome: raw.nome,
        enderecoLogradouro: raw.enderecoLogradouro,
        enderecoNumero: raw.enderecoNumero,
        enderecoBairro: raw.enderecoBairro,
        enderecoCep: raw.enderecoCep,
        municipio: raw.municipio,
        uf: raw.uf,
        latitude: decimalToNumber(raw.latitude),
        longitude: decimalToNumber(raw.longitude),
        car: raw.car,
        nirfIncra: raw.nirfIncra,
        areaTotalHa: decimalToNumber(raw.areaTotalHa),
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(fazenda: Fazenda): Prisma.FazendaUncheckedCreateInput {
    return {
      id: fazenda.id.toString(),
      tenantId: fazenda.tenantId,
      empresaId: fazenda.empresaId,
      nome: fazenda.nome,
      enderecoLogradouro: fazenda.enderecoLogradouro,
      enderecoNumero: fazenda.enderecoNumero,
      enderecoBairro: fazenda.enderecoBairro,
      enderecoCep: fazenda.enderecoCep,
      municipio: fazenda.municipio,
      uf: fazenda.uf,
      latitude: fazenda.latitude,
      longitude: fazenda.longitude,
      car: fazenda.car,
      nirfIncra: fazenda.nirfIncra,
      areaTotalHa: fazenda.areaTotalHa,
      createdAt: fazenda.createdAt,
      updatedAt: fazenda.updatedAt,
      deletedAt: fazenda.deletedAt,
    }
  }

  static toPrismaUpdate(fazenda: Fazenda): Prisma.FazendaUncheckedUpdateInput {
    return {
      nome: fazenda.nome,
      enderecoLogradouro: fazenda.enderecoLogradouro,
      enderecoNumero: fazenda.enderecoNumero,
      enderecoBairro: fazenda.enderecoBairro,
      enderecoCep: fazenda.enderecoCep,
      municipio: fazenda.municipio,
      uf: fazenda.uf,
      latitude: fazenda.latitude,
      longitude: fazenda.longitude,
      car: fazenda.car,
      nirfIncra: fazenda.nirfIncra,
      areaTotalHa: fazenda.areaTotalHa,
      updatedAt: fazenda.updatedAt,
      deletedAt: fazenda.deletedAt,
    }
  }
}
