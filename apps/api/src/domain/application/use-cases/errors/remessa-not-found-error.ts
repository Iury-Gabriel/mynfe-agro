import { UseCaseError } from '@/core/errors/use-case-error'

export class RemessaNotFoundError extends UseCaseError<'RemessaNotFound'> {
  readonly kind = 'RemessaNotFound' as const

  constructor() {
    super('Remessa não encontrada.')
  }
}
