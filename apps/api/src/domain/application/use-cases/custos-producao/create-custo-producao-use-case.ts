import { Injectable } from '@nestjs/common'

import type { CustoProducaoTipo } from '@/domain/enterprise/entities/custo-producao'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { CustoProducaoRepository } from '@/domain/application/repositories/custo-producao-repository'
import { CustoProducao } from '@/domain/enterprise/entities/custo-producao'

export interface CreateCustoProducaoInput {
  tenantId: string
  safraId?: string | null
  areaId?: string | null
  tipo: CustoProducaoTipo
  descricao: string
  valor: number
  data: Date
}

export interface CreateCustoProducaoOutput {
  custo: CustoProducao
}

type CreateCustoProducaoResult = Either<UnexpectedError, CreateCustoProducaoOutput>

@Injectable()
export class CreateCustoProducaoUseCase {
  constructor(private readonly custos: CustoProducaoRepository) {}

  async execute(input: CreateCustoProducaoInput): Promise<CreateCustoProducaoResult> {
    try {
      const custo = CustoProducao.create({
        tenantId: input.tenantId,
        safraId: input.safraId ?? null,
        areaId: input.areaId ?? null,
        tipo: input.tipo,
        descricao: input.descricao,
        valor: input.valor,
        data: input.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await this.custos.create(custo)

      return right({ custo })
    } catch (err) {
      console.error('[CreateCustoProducaoUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
