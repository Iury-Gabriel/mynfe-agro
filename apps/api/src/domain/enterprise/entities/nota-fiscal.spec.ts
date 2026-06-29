
import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { makeNotaFiscalEvento } from '@test/factories/make-nota-fiscal-evento'
import { makeNotaFiscalItem } from '@test/factories/make-nota-fiscal-item'
import { describe, expect, it } from 'vitest'

import { NotaFiscal } from './nota-fiscal'

import { TransicaoFiscalInvalidaError } from '@/domain/application/use-cases/errors/transicao-fiscal-invalida-error'

describe(NotaFiscal.name, () => {
  it('cria com defaults (pendente, modelo 55, total 0, listas vazias)', () => {
    const sut = NotaFiscal.create({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      pedidoId: 'pedido-1',
      clienteId: 'cliente-1',
      ambiente: 'homologacao',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.status).toBe('pendente')
    expect(sut.modelo).toBe('55')
    expect(sut.numero).toBeNull()
    expect(sut.serie).toBeNull()
    expect(sut.valorTotal).toBe(0)
    expect(sut.itens).toHaveLength(0)
    expect(sut.eventos).toHaveLength(0)
    expect(sut.chaveAcesso).toBeNull()
    expect(sut.dataEmissao).toBeNull()
    expect(sut.deletedAt).toBeNull()
  })

  it('expõe getters', () => {
    const sut = makeNotaFiscal({
      numero: '7',
      serie: '1',
      naturezaOperacao: 'Venda',
      status: 'autorizada',
      chaveAcesso: '1'.repeat(44),
      protocolo: 'p-1',
      valorTotal: 500,
      ambiente: 'producao',
      plugnotasId: 'pn-1',
      xmlUrl: 'x',
      danfeUrl: 'd',
      mensagemRetorno: 'ok',
      dataEmissao: new Date('2024-02-01'),
    })

    expect(sut.empresaEmitenteId).toBe('empresa-1')
    expect(sut.pedidoId).toBe('pedido-1')
    expect(sut.clienteId).toBe('cliente-1')
    expect(sut.numero).toBe('7')
    expect(sut.serie).toBe('1')
    expect(sut.naturezaOperacao).toBe('Venda')
    expect(sut.status).toBe('autorizada')
    expect(sut.chaveAcesso).toBe('1'.repeat(44))
    expect(sut.protocolo).toBe('p-1')
    expect(sut.valorTotal).toBe(500)
    expect(sut.ambiente).toBe('producao')
    expect(sut.plugnotasId).toBe('pn-1')
    expect(sut.xmlUrl).toBe('x')
    expect(sut.danfeUrl).toBe('d')
    expect(sut.mensagemRetorno).toBe('ok')
    expect(sut.dataEmissao).toEqual(new Date('2024-02-01'))
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-01'))
  })

  it('addItem recalcula o total', () => {
    const sut = makeNotaFiscal()

    sut.addItem(makeNotaFiscalItem({ id: 'i-1', quantidade: 10, valorUnitario: 5 }))
    sut.addItem(makeNotaFiscalItem({ id: 'i-2', quantidade: 4, valorUnitario: 5 }))

    expect(sut.itens).toHaveLength(2)
    expect(sut.valorTotal).toBe(70)
  })

  it('addEvento anexa evento', () => {
    const sut = makeNotaFiscal()

    sut.addEvento(makeNotaFiscalEvento({ id: 'e-1' }))

    expect(sut.eventos).toHaveLength(1)
  })

  describe('marcarEmitindo()', () => {
    it('transiciona de pendente para emitindo', () => {
      const sut = makeNotaFiscal({ status: 'pendente' })

      const result = sut.marcarEmitindo()

      expect(result.isRight()).toBe(true)
      expect(sut.status).toBe('emitindo')
    })

    it.each(['emitindo', 'autorizada', 'rejeitada', 'cancelada'] as const)(
      'falha quando status é %s',
      (status) => {
        const sut = makeNotaFiscal({ status })

        const result = sut.marcarEmitindo()

        expect(result.isLeft()).toBe(true)
        expect(result.value).toBeInstanceOf(TransicaoFiscalInvalidaError)
      },
    )
  })

  describe('marcarAutorizada()', () => {
    it('transiciona de emitindo para autorizada e preenche dados', () => {
      const sut = makeNotaFiscal({ status: 'emitindo', mensagemRetorno: 'pendente' })

      const result = sut.marcarAutorizada({
        chaveAcesso: '2'.repeat(44),
        protocolo: 'proto-9',
        plugnotasId: 'pn-9',
        xmlUrl: 'xml',
        danfeUrl: 'danfe',
        dataEmissao: new Date('2024-05-01'),
      })

      expect(result.isRight()).toBe(true)
      expect(sut.status).toBe('autorizada')
      expect(sut.chaveAcesso).toBe('2'.repeat(44))
      expect(sut.protocolo).toBe('proto-9')
      expect(sut.plugnotasId).toBe('pn-9')
      expect(sut.xmlUrl).toBe('xml')
      expect(sut.danfeUrl).toBe('danfe')
      expect(sut.dataEmissao).toEqual(new Date('2024-05-01'))
      expect(sut.mensagemRetorno).toBeNull()
    })

    it('mantém plugnotasId existente quando não informado', () => {
      const sut = makeNotaFiscal({ status: 'emitindo', plugnotasId: 'pn-existente' })

      sut.marcarAutorizada({
        chaveAcesso: '2'.repeat(44),
        protocolo: 'proto-9',
        dataEmissao: new Date('2024-05-01'),
      })

      expect(sut.plugnotasId).toBe('pn-existente')
    })

    it('falha quando status não é emitindo', () => {
      const sut = makeNotaFiscal({ status: 'pendente' })

      const result = sut.marcarAutorizada({
        chaveAcesso: '2'.repeat(44),
        protocolo: 'proto-9',
        dataEmissao: new Date('2024-05-01'),
      })

      expect(result.isLeft()).toBe(true)
      expect(sut.status).toBe('pendente')
    })
  })

  describe('marcarRejeitada()', () => {
    it('transiciona de emitindo para rejeitada com mensagem', () => {
      const sut = makeNotaFiscal({ status: 'emitindo' })

      const result = sut.marcarRejeitada('CNPJ inválido')

      expect(result.isRight()).toBe(true)
      expect(sut.status).toBe('rejeitada')
      expect(sut.mensagemRetorno).toBe('CNPJ inválido')
    })

    it('falha quando status não é emitindo', () => {
      const sut = makeNotaFiscal({ status: 'autorizada' })

      const result = sut.marcarRejeitada('msg')

      expect(result.isLeft()).toBe(true)
      expect(sut.status).toBe('autorizada')
    })
  })

  describe('marcarCancelada()', () => {
    it('transiciona de autorizada para cancelada', () => {
      const sut = makeNotaFiscal({ status: 'autorizada' })

      const result = sut.marcarCancelada()

      expect(result.isRight()).toBe(true)
      expect(sut.status).toBe('cancelada')
    })

    it.each(['pendente', 'emitindo', 'rejeitada', 'cancelada'] as const)(
      'falha quando status é %s',
      (status) => {
        const sut = makeNotaFiscal({ status })

        const result = sut.marcarCancelada()

        expect(result.isLeft()).toBe(true)
      },
    )
  })

  describe('registrarPlugnotasId()', () => {
    it('define plugnotasId quando informado', () => {
      const sut = makeNotaFiscal({ plugnotasId: null })

      sut.registrarPlugnotasId('pn-novo')

      expect(sut.plugnotasId).toBe('pn-novo')
    })

    it('mantém valor quando recebe null', () => {
      const sut = makeNotaFiscal({ plugnotasId: 'pn-1' })

      sut.registrarPlugnotasId(null)

      expect(sut.plugnotasId).toBe('pn-1')
    })
  })
})
