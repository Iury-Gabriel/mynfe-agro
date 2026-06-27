import { UseCaseError } from '@/core/errors/use-case-error'

export class ClienteNotFoundError extends UseCaseError<'ClienteNotFound'> {
  readonly kind = 'ClienteNotFound' as const

  constructor() {
    super('Cliente não encontrado.')
  }
}
