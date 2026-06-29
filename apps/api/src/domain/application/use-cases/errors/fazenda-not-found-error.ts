import { UseCaseError } from '@/core/errors/use-case-error'

export class FazendaNotFoundError extends UseCaseError<'FazendaNotFound'> {
  readonly kind = 'FazendaNotFound' as const

  constructor() {
    super('Fazenda não encontrada.')
  }
}
