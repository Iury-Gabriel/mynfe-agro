import { UseCaseError } from '@/core/errors/use-case-error'

export class TenantNotFoundError extends UseCaseError<'TenantNotFound'> {
  readonly kind = 'TenantNotFound' as const

  constructor() {
    super('Tenant não encontrado.')
  }
}
