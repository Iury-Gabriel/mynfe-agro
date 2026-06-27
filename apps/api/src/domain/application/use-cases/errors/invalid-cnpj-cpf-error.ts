import { UseCaseError } from '@/core/errors/use-case-error'

export class InvalidCnpjCpfError extends UseCaseError<'InvalidCnpjCpf'> {
  readonly kind = 'InvalidCnpjCpf' as const

  constructor(raw: string) {
    super(`O documento "${raw}" não é um CNPJ ou CPF válido.`)
  }
}
