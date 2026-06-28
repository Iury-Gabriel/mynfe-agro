import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { FakeFiscalProvider } from '@test/providers/fake-fiscal-provider'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryNotaFiscalRepository } from '@test/repositories/in-memory-nota-fiscal-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CancelarNotaFiscalUseCase } from './cancelar-nota-fiscal-use-case'

import { left } from '@/core/either'
import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { NotaFiscalNotFoundError } from '@/domain/application/use-cases/errors/nota-fiscal-not-found-error'
import { TransicaoFiscalInvalidaError } from '@/domain/application/use-cases/errors/transicao-fiscal-invalida-error'

describe(CancelarNotaFiscalUseCase.name, () => {
  let notaRepo: InMemoryNotaFiscalRepository
  let fiscalProvider: FakeFiscalProvider
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: CancelarNotaFiscalUseCase

  beforeEach(() => {
    notaRepo = new InMemoryNotaFiscalRepository()
    fiscalProvider = new FakeFiscalProvider()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new CancelarNotaFiscalUseCase(
      notaRepo,
      fiscalProvider,
      new RegistrarAuditoriaUseCase(auditoriaRepo),
    )
  })

  it('cancela nota autorizada e registra evento', async () => {
    notaRepo.notas.push(
      makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', status: 'autorizada', plugnotasId: 'pn-1' }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
      motivo: 'erro de digitação',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('cancelada')
      expect(result.value.nota.eventos.some((e) => e.tipo === 'cancelamento')).toBe(true)
    }
    expect(fiscalProvider.cancelarCalls).toEqual(['pn-1'])

    expect(auditoriaRepo.logs).toHaveLength(1)
    const log = auditoriaRepo.logs[0]
    expect(log.entidade).toBe('nota_fiscal')
    expect(log.acao).toBe('editar')
    expect(log.dadosAntes).toMatchObject({ status: 'autorizada' })
    expect(log.dadosDepois).toMatchObject({ status: 'cancelada' })
  })

  it('não quebra o cancelamento quando o registro de auditoria falha', async () => {
    notaRepo.notas.push(
      makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', status: 'autorizada' }),
    )
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
    })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })

  it('cancela sem motivo informado', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', status: 'autorizada' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('cancelada')
      const evento = result.value.nota.eventos.find((e) => e.tipo === 'cancelamento')
      expect(evento?.payload).toEqual({ motivo: null })
    }
  })

  it('registra evento de rejeição quando o provider rejeita o cancelamento', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', status: 'autorizada' }))
    fiscalProvider.cancelarResult = { status: 'rejeitada' }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.status).toBe('autorizada')
      const evento = result.value.nota.eventos.find((e) => e.tipo === 'rejeicao')
      expect(evento?.payload).toEqual({ acao: 'cancelamento', mensagemRetorno: null })
    }

    expect(auditoriaRepo.logs).toHaveLength(1)
    expect(auditoriaRepo.logs[0].dadosDepois).toMatchObject({ cancelamento: 'rejeitado' })
  })

  it('retorna NotaFiscalNotFoundError quando a nota é de outra empresa (IDOR)', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'outra', status: 'autorizada' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotaFiscalNotFoundError)
  })

  it('retorna TransicaoFiscalInvalidaError quando a nota não está autorizada', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', status: 'pendente' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TransicaoFiscalInvalidaError)
    expect(fiscalProvider.cancelarCalls).toHaveLength(0)
  })

  it('propaga TransicaoFiscalInvalidaError quando a transição da entidade falha após o provider', async () => {
    const nota = makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', status: 'autorizada' })
    nota.marcarCancelada = () => left(new TransicaoFiscalInvalidaError('autorizada', 'cancelada'))
    notaRepo.notas.push(nota)

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TransicaoFiscalInvalidaError)
  })

  it('retorna UnexpectedError quando o provider lança', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', status: 'autorizada' }))
    fiscalProvider.cancelar = async () => {
      throw new Error('boom')
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
