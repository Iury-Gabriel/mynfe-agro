import { UseCaseError } from '@/core/errors/use-case-error'

export class TabelaPrecoNotFoundError extends UseCaseError<'TabelaPrecoNotFound'> {
  readonly kind = 'TabelaPrecoNotFound' as const

  constructor() {
    super('Tabela de preço não encontrada.')
  }
}
