import { UseCaseError } from '@/core/errors/use-case-error'

export class SafraNotFoundError extends UseCaseError<'SafraNotFound'> {
  readonly kind = 'SafraNotFound' as const

  constructor() {
    super('Safra não encontrada.')
  }
}
