import { UseCaseError } from '@/core/errors/use-case-error'

export class SemRemessasParaConsolidarError extends UseCaseError<'SemRemessasParaConsolidar'> {
  readonly kind = 'SemRemessasParaConsolidar' as const

  constructor() {
    super('Nenhuma remessa disponível para consolidação no período informado.')
  }
}
