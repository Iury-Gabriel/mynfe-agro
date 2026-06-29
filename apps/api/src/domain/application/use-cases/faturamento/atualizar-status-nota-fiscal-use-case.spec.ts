import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { FakeFiscalProvider } from '@test/providers/fake-fiscal-provider'
import { InMemoryNotaFiscalRepository } from '@test/repositories/in-memory-nota-fiscal-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { AtualizarStatusNotaFiscalUseCase } from './atualizar-status-nota-fiscal-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { NotaFiscalNotFoundError } from '@/domain/application/use-cases/errors/nota-fiscal-not-found-error'
import { TransicaoFiscalInvalidaError } from '@/domain/application/use-cases/errors/transicao-fiscal-invalida-error'

describe(AtualizarStatusNotaFiscalUseCase.name, () => {
  let notaRepo: InMemoryNotaFiscalRepository
  let fiscalProvider: FakeFiscalProvider
  let sut: AtualizarStatusNotaFiscalUseCase

  beforeEach(() => {
    notaRepo = new InMemoryNotaFiscalRepository()
    fiscalProvider = new FakeFiscalProvider()
    sut = new AtualizarStatusNotaFiscalUseCase(notaRepo, fiscalProvider)
  })

  it('autoriza nota em emissão quando o provider retorna autorizada', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', status: 'emitindo', plugnotasId: 'pn-1' }))
    fiscalProvider.consultarResult = {
      status: 'autorizada',
      chaveAcesso: '3'.repeat(44),
      protocolo: 'proto-x',
    }

    const result = await sut.execute({ tenantId: 'tenant-1', plugnotasId: 'pn-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('autorizada')
      expect(result.value.nota.chaveAcesso).toBe('3'.repeat(44))
      expect(result.value.nota.eventos.some((e) => e.tipo === 'emissao')).toBe(true)
    }
  })

  it('rejeita nota em emissão quando o provider retorna rejeitada', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', status: 'emitindo', plugnotasId: 'pn-1' }))
    fiscalProvider.consultarResult = { status: 'rejeitada', mensagemRetorno: 'erro sefaz' }

    const result = await sut.execute({ tenantId: 'tenant-1', plugnotasId: 'pn-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('rejeitada')
      expect(result.value.nota.mensagemRetorno).toBe('erro sefaz')
    }
  })

  it('mantém a nota inalterada quando o provider ainda retorna emitindo', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', status: 'emitindo', plugnotasId: 'pn-1' }))
    fiscalProvider.consultarResult = { status: 'emitindo' }

    const result = await sut.execute({ tenantId: 'tenant-1', plugnotasId: 'pn-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('emitindo')
    }
  })

  it('preenche defaults ao autorizar sem campos opcionais', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', status: 'emitindo', plugnotasId: 'pn-1' }))
    fiscalProvider.consultarResult = { status: 'autorizada' }

    const result = await sut.execute({ tenantId: 'tenant-1', plugnotasId: 'pn-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('autorizada')
      expect(result.value.nota.chaveAcesso).toBe('')
      expect(result.value.nota.protocolo).toBe('')
      expect(result.value.nota.plugnotasId).toBe('pn-1')
    }
  })

  it('usa mensagem vazia ao rejeitar sem mensagem', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', status: 'emitindo', plugnotasId: 'pn-1' }))
    fiscalProvider.consultarResult = { status: 'rejeitada' }

    const result = await sut.execute({ tenantId: 'tenant-1', plugnotasId: 'pn-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('rejeitada')
      expect(result.value.nota.mensagemRetorno).toBe('')
    }
  })

  it('retorna NotaFiscalNotFoundError quando não há nota com o plugnotasId', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', plugnotasId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotaFiscalNotFoundError)
  })

  it('retorna TransicaoFiscalInvalidaError quando autorização chega para nota não-emitindo', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', status: 'pendente', plugnotasId: 'pn-1' }))
    fiscalProvider.consultarResult = { status: 'autorizada', chaveAcesso: '0'.repeat(44), protocolo: 'p' }

    const result = await sut.execute({ tenantId: 'tenant-1', plugnotasId: 'pn-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TransicaoFiscalInvalidaError)
  })

  it('retorna TransicaoFiscalInvalidaError quando rejeição chega para nota não-emitindo', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', status: 'autorizada', plugnotasId: 'pn-1' }))
    fiscalProvider.consultarResult = { status: 'rejeitada', mensagemRetorno: 'x' }

    const result = await sut.execute({ tenantId: 'tenant-1', plugnotasId: 'pn-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TransicaoFiscalInvalidaError)
  })

  it('retorna UnexpectedError quando o provider lança', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', status: 'emitindo', plugnotasId: 'pn-1' }))
    fiscalProvider.consultar = async () => {
      throw new Error('boom')
    }

    const result = await sut.execute({ tenantId: 'tenant-1', plugnotasId: 'pn-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
