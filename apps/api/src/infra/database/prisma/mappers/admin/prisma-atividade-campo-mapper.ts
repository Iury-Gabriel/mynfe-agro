import type { Prisma, AtividadeCampo as PrismaAtividadeCampo } from '@prisma/client'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { AtividadeCampo, type AtividadeCampoTipo } from '@/domain/enterprise/entities/atividade-campo'

export class PrismaAtividadeCampoMapper {
  static toDomain(raw: PrismaAtividadeCampo): AtividadeCampo {
    return AtividadeCampo.create(
      {
        tenantId: raw.tenantId,
        safraId: raw.safraId,
        areaId: raw.areaId,
        tipo: raw.tipo as AtividadeCampoTipo,
        data: raw.data,
        responsavelUsuarioId: raw.responsavelUsuarioId,
        observacoes: raw.observacoes,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        deletedAt: raw.deletedAt,
      },
      new UniqueEntityID(raw.id),
    )
  }

  static toPrismaCreate(atividade: AtividadeCampo): Prisma.AtividadeCampoUncheckedCreateInput {
    return {
      id: atividade.id.toString(),
      tenantId: atividade.tenantId,
      safraId: atividade.safraId,
      areaId: atividade.areaId,
      tipo: atividade.tipo,
      data: atividade.data,
      responsavelUsuarioId: atividade.responsavelUsuarioId,
      observacoes: atividade.observacoes,
      createdAt: atividade.createdAt,
      updatedAt: atividade.updatedAt,
      deletedAt: atividade.deletedAt,
    }
  }

  static toPrismaUpdate(atividade: AtividadeCampo): Prisma.AtividadeCampoUncheckedUpdateInput {
    return {
      safraId: atividade.safraId,
      areaId: atividade.areaId,
      tipo: atividade.tipo,
      data: atividade.data,
      responsavelUsuarioId: atividade.responsavelUsuarioId,
      observacoes: atividade.observacoes,
      updatedAt: atividade.updatedAt,
      deletedAt: atividade.deletedAt,
    }
  }
}
