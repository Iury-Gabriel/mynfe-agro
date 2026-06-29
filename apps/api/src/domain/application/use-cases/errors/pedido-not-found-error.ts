import { UseCaseError } from '@/core/errors/use-case-error'

export class PedidoNotFoundError extends UseCaseError<'PedidoNotFound'> {
  readonly kind = 'PedidoNotFound' as const

  constructor() {
    super('Pedido não encontrado.')
  }
}
