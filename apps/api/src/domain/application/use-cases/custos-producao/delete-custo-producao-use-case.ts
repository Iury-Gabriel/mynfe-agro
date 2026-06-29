import { Injectable } from '@nestjs/common'

import type { CustoProducao } from '@/domain/enterprise/entities/custo-producao'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { CustoProducaoRepository } from '@/domain/application/repositories/custo-producao-repository'
import { CustoProducaoNotFoundError } from '@/domain/application/use-cases/errors/custo-producao-not-found-error'

export interface DeleteCustoProducaoInput {
  tenantId: string
  custoId: string
}

export interface DeleteCustoProducaoOutput {
  custo: CustoProducao
}

type DeleteCustoProducaoResult = Either<
  CustoProducaoNotFoundError | UnexpectedError,
  DeleteCustoProducaoOutput
>

@Injectable()
export class DeleteCustoProducaoUseCase {
  constructor(private readonly custos: CustoProducaoRepository) {}

  async execute(input: DeleteCustoProducaoInput): Promise<DeleteCustoProducaoResult> {
    const custo = await this.custos.findById(input.custoId, input.tenantId)
    if (!custo) return left(new CustoProducaoNotFoundError())

    custo.softDelete()

    try {
      await this.custos.save(custo)
    } catch (err) {
      console.error('[DeleteCustoProducaoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }

    return right({ custo })
  }
}
