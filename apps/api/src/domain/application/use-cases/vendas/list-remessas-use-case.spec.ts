import { makeRemessa } from '@test/factories/make-remessa'
import { InMemoryRemessaRepository } from '@test/repositories/in-memory-remessa-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListRemessasUseCase } from './list-remessas-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListRemessasUseCase.name, () => {
  let remessaRepo: InMemoryRemessaRepository
  let sut: ListRemessasUseCase

  beforeEach(() => {
    remessaRepo = new InMemoryRemessaRepository()
    sut = new ListRemessasUseCase(remessaRepo)
  })

  it('lista remessas paginadas sem filtros', async () => {
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-1' }))
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-2', empresaFaturadoraId: 'outra' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.total).toBe(1)
    }
  })

  it('aplica os filtros informados', async () => {
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-1', status: 'aberta' }))
    remessaRepo.remessas.push(makeRemessa({ id: 'remessa-2', status: 'entregue' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      filtros: { status: 'entregue' },
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].id.toString()).toBe('remessa-2')
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(remessaRepo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaFaturadoraId: 'empresa-1',
      page: 1,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
