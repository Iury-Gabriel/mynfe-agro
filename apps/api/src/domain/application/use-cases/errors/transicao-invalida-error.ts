import { UseCaseError } from '@/core/errors/use-case-error'

export class TransicaoInvalidaError extends UseCaseError<'TransicaoInvalida'> {
  readonly kind = 'TransicaoInvalida' as const

  constructor(de: string, para: string) {
    super(`Transição inválida: de "${de}" para "${para}".`)
  }
}
