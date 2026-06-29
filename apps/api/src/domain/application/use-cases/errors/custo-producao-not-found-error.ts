import { UseCaseError } from '@/core/errors/use-case-error'

export class CustoProducaoNotFoundError extends UseCaseError<'CustoProducaoNotFound'> {
  readonly kind = 'CustoProducaoNotFound' as const

  constructor() {
    super('Custo de produção não encontrado.')
  }
}
