import { UseCaseError } from '@/core/errors/use-case-error'

export class TransicaoFiscalInvalidaError extends UseCaseError<'TransicaoFiscalInvalida'> {
  readonly kind = 'TransicaoFiscalInvalida' as const

  constructor(de: string, para: string) {
    super(`Transição fiscal inválida: de "${de}" para "${para}".`)
  }
}
