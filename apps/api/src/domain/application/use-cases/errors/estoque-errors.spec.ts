import { describe, expect, it } from 'vitest'

import { EstoqueInsuficienteError } from './estoque-insuficiente-error'
import { LoteNotFoundError } from './lote-not-found-error'
import { MovimentoInvalidoError } from './movimento-invalido-error'

describe('LoteNotFoundError', () => {
  it('tem kind correto e mensagem', () => {
    const sut = new LoteNotFoundError()

    expect(sut.kind).toBe('LoteNotFound')
    expect(sut.message).toBe('Lote não encontrado.')
    expect(sut).toBeInstanceOf(Error)
  })
})

describe('EstoqueInsuficienteError', () => {
  it('tem kind correto e mensagem com disponível e solicitado', () => {
    const sut = new EstoqueInsuficienteError(100, 250)

    expect(sut.kind).toBe('EstoqueInsuficiente')
    expect(sut.message).toBe('Estoque insuficiente: disponível 100, solicitado 250.')
    expect(sut).toBeInstanceOf(Error)
  })
})

describe('MovimentoInvalidoError', () => {
  it('tem kind correto e mensagem com o motivo', () => {
    const sut = new MovimentoInvalidoError('motivo é obrigatório.')

    expect(sut.kind).toBe('MovimentoInvalido')
    expect(sut.message).toBe('Movimento de estoque inválido: motivo é obrigatório.')
    expect(sut).toBeInstanceOf(Error)
  })
})
