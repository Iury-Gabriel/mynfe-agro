import { describe, expect, it } from 'vitest'

import { CnpjCpf } from './cnpj-cpf'

import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

describe(CnpjCpf.name, () => {
  describe('CPF', () => {
    it('aceita CPF válido somente com dígitos', () => {
      const result = CnpjCpf.create('52998224725')

      expect(result.isRight()).toBe(true)
      if (result.isRight()) {
        expect(result.value.value).toBe('52998224725')
        expect(result.value.isCpf).toBe(true)
        expect(result.value.isCnpj).toBe(false)
      }
    })

    it('normaliza CPF removendo máscara', () => {
      const result = CnpjCpf.create('529.982.247-25')

      expect(result.isRight()).toBe(true)
      if (result.isRight()) {
        expect(result.value.value).toBe('52998224725')
      }
    })

    it('rejeita CPF com dígito verificador inválido', () => {
      const result = CnpjCpf.create('52998224724')

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    })

    it('rejeita CPF com segundo dígito verificador inválido', () => {
      const result = CnpjCpf.create('52998224715')

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    })

    it('rejeita CPF com todos os dígitos iguais', () => {
      const result = CnpjCpf.create('11111111111')

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    })

    it('exercita resto 10 do dígito verificador (mapeado para 0)', () => {
      const result = CnpjCpf.create('00000000604')

      expect(result.isRight()).toBe(true)
      if (result.isRight()) {
        expect(result.value.value).toBe('00000000604')
      }
    })
  })

  describe('CNPJ', () => {
    it('aceita CNPJ válido somente com dígitos', () => {
      const result = CnpjCpf.create('11222333000181')

      expect(result.isRight()).toBe(true)
      if (result.isRight()) {
        expect(result.value.value).toBe('11222333000181')
        expect(result.value.isCnpj).toBe(true)
        expect(result.value.isCpf).toBe(false)
      }
    })

    it('normaliza CNPJ removendo máscara', () => {
      const result = CnpjCpf.create('11.222.333/0001-81')

      expect(result.isRight()).toBe(true)
      if (result.isRight()) {
        expect(result.value.value).toBe('11222333000181')
      }
    })

    it('rejeita CNPJ com dígito verificador inválido', () => {
      const result = CnpjCpf.create('11222333000180')

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    })

    it('rejeita CNPJ com segundo dígito verificador inválido', () => {
      const result = CnpjCpf.create('11222333000191')

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    })

    it('rejeita CNPJ com todos os dígitos iguais', () => {
      const result = CnpjCpf.create('00000000000000')

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    })

    it('exercita resto < 2 do dígito verificador (mapeado para 0)', () => {
      const result = CnpjCpf.create('00000007000103')

      expect(result.isRight()).toBe(true)
      if (result.isRight()) {
        expect(result.value.value).toBe('00000007000103')
      }
    })
  })

  describe('entradas inválidas de tamanho', () => {
    it('rejeita string vazia', () => {
      const result = CnpjCpf.create('')

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    })

    it('rejeita documento com menos dígitos que CPF', () => {
      const result = CnpjCpf.create('123')

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    })

    it('rejeita documento com dígitos entre CPF e CNPJ', () => {
      const result = CnpjCpf.create('123456789012')

      expect(result.isLeft()).toBe(true)
      expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    })

    it('mensagem de erro inclui o valor cru original', () => {
      const result = CnpjCpf.create('abc')

      expect(result.isLeft()).toBe(true)
      if (result.isLeft()) {
        expect(result.value.message).toContain('abc')
      }
    })
  })
})
