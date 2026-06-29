import { makeCustoProducao } from '@test/factories/make-custo-producao'
import { InMemoryCustoProducaoRepository } from '@test/repositories/in-memory-custo-producao-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListCustosProducaoUseCase } from './list-custos-producao-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListCustosProducaoUseCase.name, () => {
  let custoRepo: InMemoryCustoProducaoRepository
  let sut: ListCustosProducaoUseCase

  beforeEach(() => {
    custoRepo = new InMemoryCustoProducaoRepository()
    sut = new ListCustosProducaoUseCase(custoRepo)
  })

  it('retorna custos paginados do tenant', async () => {
    await custoRepo.create(makeCustoProducao({ id: 'custo-1', tenantId: 'tenant-1' }))
    await custoRepo.create(makeCustoProducao({ id: 'custo-2', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(2)
      expect(result.value.totalPages).toBe(1)
    }
  })

  it('isola custos por tenant (não vaza de outro tenant)', async () => {
    await custoRepo.create(makeCustoProducao({ id: 'custo-1', tenantId: 'tenant-1' }))
    await custoRepo.create(makeCustoProducao({ id: 'custo-2', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].tenantId).toBe('tenant-1')
    }
  })

  it('aplica perPage default quando não informado', async () => {
    await custoRepo.create(makeCustoProducao({ id: 'custo-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.perPage).toBe(20)
    }
  })

  it('retorna lista vazia quando o tenant não tem custos', async () => {
    const result = await sut.execute({ tenantId: 'tenant-vazio', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toEqual([])
      expect(result.value.total).toBe(0)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(custoRepo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
