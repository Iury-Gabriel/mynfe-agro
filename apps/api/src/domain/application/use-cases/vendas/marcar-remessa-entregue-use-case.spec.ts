import { makeRemessa } from '@test/factories/make-remessa'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MarcarRemessaEntregueUseCase } from './marcar-remessa-entregue-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RemessaNotFoundError } from '@/domain/application/use-cases/errors/remessa-not-found-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'

describe(MarcarRemessaEntregueUseCase.name, () => {
  let remessaRepo: InMemoryRemessaRepository
  let sut: MarcarRemessaEntregueUseCase

  beforeEach(() => {
    remessaRepo = new InMemoryRemessaRepository()
    sut = new MarcarRemessaEntregueUseCase(remessaRepo)
  })

  it('marca uma remessa aberta como entregue', async () => {
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-1', status: 'aberta' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      remessaId: 'remessa-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.remessa.status).toBe('entregue')
    }
  })

  it('retorna RemessaNotFoundError quando a remessa é de outra empresa', async () => {
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-1', empresaFaturadoraId: 'outra' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      remessaId: 'remessa-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(RemessaNotFoundError)
  })

  it('retorna TransicaoInvalidaError quando a remessa não está aberta', async () => {
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-1', status: 'entregue' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      remessaId: 'remessa-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TransicaoInvalidaError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-1', status: 'aberta' }))
    vi.spyOn(remessaRepo, 'save').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      remessaId: 'remessa-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
