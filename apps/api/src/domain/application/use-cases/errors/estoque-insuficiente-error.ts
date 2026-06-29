import { UseCaseError } from '@/core/errors/use-case-error'

export class EstoqueInsuficienteError extends UseCaseError<'EstoqueInsuficiente'> {
  readonly kind = 'EstoqueInsuficiente' as const

  constructor(disponivel: number, solicitado: number) {
    super(`Estoque insuficiente: disponível ${disponivel}, solicitado ${solicitado}.`)
  }
}
