import { UseCaseError } from '@/core/errors/use-case-error'

export class MovimentoInvalidoError extends UseCaseError<'MovimentoInvalido'> {
  readonly kind = 'MovimentoInvalido' as const

  constructor(motivo: string) {
    super(`Movimento de estoque inválido: ${motivo}`)
  }
}
