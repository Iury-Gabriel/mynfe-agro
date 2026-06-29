import { UseCaseError } from '@/core/errors/use-case-error'

export class NotaJaEmitidaError extends UseCaseError<'NotaJaEmitida'> {
  readonly kind = 'NotaJaEmitida' as const

  constructor() {
    super('Já existe nota fiscal autorizada ou em emissão para este pedido.')
  }
}
