import { UseCaseError } from '@/core/errors/use-case-error'

export class AtividadeCampoNotFoundError extends UseCaseError<'AtividadeCampoNotFound'> {
  readonly kind = 'AtividadeCampoNotFound' as const

  constructor() {
    super('Atividade de campo não encontrada.')
  }
}
