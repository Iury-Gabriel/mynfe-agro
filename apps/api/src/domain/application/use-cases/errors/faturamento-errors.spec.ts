import { describe, expect, it } from 'vitest'

import { NotaFiscalNotFoundError } from './nota-fiscal-not-found-error'
import { NotaJaEmitidaError } from './nota-ja-emitida-error'
import { PedidoNaoFaturavelError } from './pedido-nao-faturavel-error'
import { TransicaoFiscalInvalidaError } from './transicao-fiscal-invalida-error'

describe('NotaFiscalNotFoundError', () => {
  it('tem kind correto e mensagem', () => {
    const sut = new NotaFiscalNotFoundError()

    expect(sut.kind).toBe('NotaFiscalNotFound')
    expect(sut.message).toBe('Nota fiscal não encontrada.')
    expect(sut).toBeInstanceOf(Error)
  })
})

describe('PedidoNaoFaturavelError', () => {
  it('tem kind correto e mensagem', () => {
    const sut = new PedidoNaoFaturavelError()

    expect(sut.kind).toBe('PedidoNaoFaturavel')
    expect(sut.message).toBe('O pedido não está apto para faturamento.')
    expect(sut).toBeInstanceOf(Error)
  })
})

describe('NotaJaEmitidaError', () => {
  it('tem kind correto e mensagem', () => {
    const sut = new NotaJaEmitidaError()

    expect(sut.kind).toBe('NotaJaEmitida')
    expect(sut.message).toBe('Já existe nota fiscal autorizada ou em emissão para este pedido.')
    expect(sut).toBeInstanceOf(Error)
  })
})

describe('TransicaoFiscalInvalidaError', () => {
  it('tem kind correto e mensagem com origem e destino', () => {
    const sut = new TransicaoFiscalInvalidaError('pendente', 'autorizada')

    expect(sut.kind).toBe('TransicaoFiscalInvalida')
    expect(sut.message).toBe('Transição fiscal inválida: de "pendente" para "autorizada".')
    expect(sut).toBeInstanceOf(Error)
  })
})
