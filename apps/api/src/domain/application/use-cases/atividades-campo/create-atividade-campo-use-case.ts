import { Injectable } from '@nestjs/common'

import type { AtividadeCampoTipo } from '@/domain/enterprise/entities/atividade-campo'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { AtividadeCampoRepository } from '@/domain/application/repositories/atividade-campo-repository'
import { AtividadeCampo } from '@/domain/enterprise/entities/atividade-campo'

export interface CreateAtividadeCampoInput {
  tenantId: string
  safraId?: string | null
  areaId?: string | null
  tipo: AtividadeCampoTipo
  data: Date
  responsavelUsuarioId?: string | null
  observacoes?: string | null
}

export interface CreateAtividadeCampoOutput {
  atividade: AtividadeCampo
}

type CreateAtividadeCampoResult = Either<UnexpectedError, CreateAtividadeCampoOutput>

@Injectable()
export class CreateAtividadeCampoUseCase {
  constructor(private readonly atividades: AtividadeCampoRepository) {}

  async execute(input: CreateAtividadeCampoInput): Promise<CreateAtividadeCampoResult> {
    try {
      const atividade = AtividadeCampo.create({
        tenantId: input.tenantId,
        safraId: input.safraId ?? null,
        areaId: input.areaId ?? null,
        tipo: input.tipo,
        data: input.data,
        responsavelUsuarioId: input.responsavelUsuarioId ?? null,
        observacoes: input.observacoes ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await this.atividades.create(atividade)

      return right({ atividade })
    } catch (err) {
      console.error('[CreateAtividadeCampoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
