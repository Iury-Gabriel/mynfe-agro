import { UseCaseError } from '@/core/errors/use-case-error'

export class AreaNotFoundError extends UseCaseError<'AreaNotFound'> {
  readonly kind = 'AreaNotFound' as const

  constructor() {
    super('Área não encontrada.')
  }
}
