import { makeAtividadeCampo } from '@test/factories/make-atividade-campo'
import { InMemoryAtividadeCampoRepository } from '@test/repositories/in-memory-atividade-campo-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListAtividadesCampoUseCase } from './list-atividades-campo-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListAtividadesCampoUseCase.name, () => {
  let atividadeRepo: InMemoryAtividadeCampoRepository
  let sut: ListAtividadesCampoUseCase

  beforeEach(() => {
    atividadeRepo = new InMemoryAtividadeCampoRepository()
    sut = new ListAtividadesCampoUseCase(atividadeRepo)
  })

  it('retorna atividades paginadas do tenant', async () => {
    await atividadeRepo.create(makeAtividadeCampo({ id: 'atividade-1', tenantId: 'tenant-1' }))
    await atividadeRepo.create(makeAtividadeCampo({ id: 'atividade-2', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(2)
      expect(result.value.totalPages).toBe(1)
    }
  })

  it('isola atividades por tenant (não vaza de outro tenant)', async () => {
    await atividadeRepo.create(makeAtividadeCampo({ id: 'atividade-1', tenantId: 'tenant-1' }))
    await atividadeRepo.create(makeAtividadeCampo({ id: 'atividade-2', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].tenantId).toBe('tenant-1')
    }
  })

  it('aplica perPage default quando não informado', async () => {
    await atividadeRepo.create(makeAtividadeCampo({ id: 'atividade-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.perPage).toBe(20)
    }
  })

  it('retorna lista vazia quando o tenant não tem atividades', async () => {
    const result = await sut.execute({ tenantId: 'tenant-vazio', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toEqual([])
      expect(result.value.total).toBe(0)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(atividadeRepo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
