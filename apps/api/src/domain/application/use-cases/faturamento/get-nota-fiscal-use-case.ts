import { Injectable } from '@nestjs/common'

import { left, right, type Either } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { NotaFiscalRepository } from '@/domain/application/repositories/nota-fiscal-repository'
import { NotaFiscalNotFoundError } from '@/domain/application/use-cases/errors/nota-fiscal-not-found-error'
import { NotaFiscal } from '@/domain/enterprise/entities/nota-fiscal'

export interface GetNotaFiscalInput {
  tenantId: string
  empresaEmitenteId: string
  notaFiscalId: string
}

export interface GetNotaFiscalOutput {
  nota: NotaFiscal
}

type GetNotaFiscalResult = Either<NotaFiscalNotFoundError | UnexpectedError, GetNotaFiscalOutput>

@Injectable()
export class GetNotaFiscalUseCase {
  constructor(private readonly notas: NotaFiscalRepository) {}

  async execute(input: GetNotaFiscalInput): Promise<GetNotaFiscalResult> {
    try {
      const nota = await this.notas.findById(input.notaFiscalId, input.tenantId)

      if (nota?.empresaEmitenteId !== input.empresaEmitenteId) {
        return left(new NotaFiscalNotFoundError())
      }

      return right({ nota })
    } catch (err) {
      console.error('[GetNotaFiscalUseCase] unexpected error:', err)
      return left(new UnexpectedError(err))
    }
  }
}
