import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { AreaRepository } from '@/domain/application/repositories/area-repository'
import { Area } from '@/domain/enterprise/entities/area'

export interface CreateAreaInput {
  tenantId: string
  fazendaId: string
  identificacao: string
  tamanho?: number | null
  unidadeTamanho?: string | null
  rotulo?: string | null
  geometria?: Record<string, unknown> | null
}

export interface CreateAreaOutput {
  area: Area
}

type CreateAreaResult = Either<UnexpectedError, CreateAreaOutput>

@Injectable()
export class CreateAreaUseCase {
  constructor(private readonly areas: AreaRepository) {}

  async execute(input: CreateAreaInput): Promise<CreateAreaResult> {
    try {
      const area = Area.create({
        tenantId: input.tenantId,
        fazendaId: input.fazendaId,
        identificacao: input.identificacao,
        tamanho: input.tamanho ?? null,
        unidadeTamanho: input.unidadeTamanho ?? null,
        rotulo: input.rotulo ?? null,
        geometria: input.geometria ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await this.areas.create(area)

      return right({ area })
    } catch (err) {
      console.error('[CreateAreaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
