import { UseCaseError } from '@/core/errors/use-case-error'

export class NotaFiscalNotFoundError extends UseCaseError<'NotaFiscalNotFound'> {
  readonly kind = 'NotaFiscalNotFound' as const

  constructor() {
    super('Nota fiscal não encontrada.')
  }
}
