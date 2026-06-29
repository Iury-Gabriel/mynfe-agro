import { left, right, type Either } from '@/core/either'
import { ValueObject } from '@/core/entities/value-object'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

interface CnpjCpfProps {
  value: string
}

function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, '')
}

function allSameDigits(digits: string): boolean {
  return new Set(digits).size === 1
}

function isValidCpf(digits: string): boolean {
  if (digits.length !== 11) return false
  if (allSameDigits(digits)) return false

  const calcCheckDigit = (length: number): number => {
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i)
    }
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return calcCheckDigit(9) === Number(digits[9]) && calcCheckDigit(10) === Number(digits[10])
}

function isValidCnpj(digits: string): boolean {
  if (digits.length !== 14) return false
  if (allSameDigits(digits)) return false

  const calcCheckDigit = (weights: number[]): number => {
    let sum = 0
    for (const [i, weight] of weights.entries()) {
      sum += Number(digits[i]) * weight
    }
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  return (
    calcCheckDigit(firstWeights) === Number(digits[12]) &&
    calcCheckDigit(secondWeights) === Number(digits[13])
  )
}

export class CnpjCpf extends ValueObject<CnpjCpfProps> {
  get value(): string {
    return this.props.value
  }

  get isCpf(): boolean {
    return this.props.value.length === 11
  }

  get isCnpj(): boolean {
    return this.props.value.length === 14
  }

  static create(raw: string): Either<InvalidCnpjCpfError, CnpjCpf> {
    const digits = onlyDigits(raw)

    if (isValidCpf(digits) || isValidCnpj(digits)) {
      return right(new CnpjCpf({ value: digits }))
    }

    return left(new InvalidCnpjCpfError(raw))
  }
}
