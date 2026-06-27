import { UseCaseError } from '@/core/errors/use-case-error'

export class EmpresaNotFoundError extends UseCaseError<'EmpresaNotFound'> {
  readonly kind = 'EmpresaNotFound' as const

  constructor() {
    super('Empresa não encontrada.')
  }
}
