import { UseCaseError } from '@/core/errors/use-case-error'

export class PedidoNaoFaturavelError extends UseCaseError<'PedidoNaoFaturavel'> {
  readonly kind = 'PedidoNaoFaturavel' as const

  constructor() {
    super('O pedido não está apto para faturamento.')
  }
}
