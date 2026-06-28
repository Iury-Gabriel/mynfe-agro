import { UseCaseError } from '@/core/errors/use-case-error'

export class LoteNotFoundError extends UseCaseError<'LoteNotFound'> {
  readonly kind = 'LoteNotFound' as const

  constructor() {
    super('Lote não encontrado.')
  }
}
