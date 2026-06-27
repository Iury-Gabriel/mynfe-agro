import { UseCaseError } from '@/core/errors/use-case-error'

export class ProdutoNotFoundError extends UseCaseError<'ProdutoNotFound'> {
  readonly kind = 'ProdutoNotFound' as const

  constructor() {
    super('Produto não encontrado.')
  }
}
