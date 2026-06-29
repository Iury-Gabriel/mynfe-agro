import { makeRemessa } from '@test/factories/make-remessa'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CancelarRemessaUseCase } from './cancelar-remessa-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RemessaNotFoundError } from '@/domain/application/use-cases/errors/remessa-not-found-error'
import { TransicaoInvalidaError } from '@/domain/application/use-cases/errors/transicao-invalida-error'

describe(CancelarRemessaUseCase.name, () => {
  let remessaRepo: InMemoryRemessaRepository
  let sut: CancelarRemessaUseCase

  beforeEach(() => {
    remessaRepo = new InMemoryRemessaRepository()
    sut = new CancelarRemessaUseCase(remessaRepo)
  })

  it('cancela uma remessa aberta', async () => {
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-1', status: 'aberta' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      remessaId: 'remessa-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.remessa.status).toBe('cancelada')
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

  it('retorna TransicaoInvalidaError quando a remessa já está consolidada', async () => {
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-1', status: 'consolidada' }))

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
