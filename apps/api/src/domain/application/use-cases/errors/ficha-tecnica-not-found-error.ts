import { UseCaseError } from '@/core/errors/use-case-error'

export class FichaTecnicaNotFoundError extends UseCaseError<'FichaTecnicaNotFound'> {
  readonly kind = 'FichaTecnicaNotFound' as const

  constructor() {
    super('Ficha técnica não encontrada.')
  }
}
