import { Injectable } from '@nestjs/common'

import type { Area } from '@/domain/enterprise/entities/area'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { AreaRepository } from '@/domain/application/repositories/area-repository'
import { AreaNotFoundError } from '@/domain/application/use-cases/errors/area-not-found-error'

export interface UpdateAreaInput {
  tenantId: string
  areaId: string
  identificacao?: string
  tamanho?: number | null
  unidadeTamanho?: string | null
  rotulo?: string | null
  geometria?: Record<string, unknown> | null
}

export interface UpdateAreaOutput {
  area: Area
}

type UpdateAreaResult = Either<AreaNotFoundError | UnexpectedError, UpdateAreaOutput>

@Injectable()
export class UpdateAreaUseCase {
  constructor(private readonly areas: AreaRepository) {}

  async execute(input: UpdateAreaInput): Promise<UpdateAreaResult> {
    const area = await this.areas.findById(input.areaId, input.tenantId)
    if (!area) return left(new AreaNotFoundError())

    area.updateCadastro({
      identificacao: input.identificacao,
      tamanho: input.tamanho,
      unidadeTamanho: input.unidadeTamanho,
      rotulo: input.rotulo,
      geometria: input.geometria,
    })

    try {
      await this.areas.save(area)
    } catch (err) {
      console.error('[UpdateAreaUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ area })
  }
}
