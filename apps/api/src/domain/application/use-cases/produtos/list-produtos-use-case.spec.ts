import { makeProduto } from '@test/factories/make-produto'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListProdutosUseCase } from './list-produtos-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListProdutosUseCase.name, () => {
  let produtoRepo: InMemoryProdutoRepository
  let sut: ListProdutosUseCase

  beforeEach(() => {
    produtoRepo = new InMemoryProdutoRepository()
    sut = new ListProdutosUseCase(produtoRepo)
  })

  it('retorna produtos paginados do tenant', async () => {
    await produtoRepo.create(makeProduto({ id: 'produto-1', tenantId: 'tenant-1' }))
    await produtoRepo.create(makeProduto({ id: 'produto-2', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(2)
      expect(result.value.page).toBe(1)
      expect(result.value.perPage).toBe(10)
      expect(result.value.totalPages).toBe(1)
    }
  })

  it('isola produtos por tenant (não vaza de outro tenant)', async () => {
    await produtoRepo.create(makeProduto({ id: 'produto-1', tenantId: 'tenant-1' }))
    await produtoRepo.create(makeProduto({ id: 'produto-2', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].tenantId).toBe('tenant-1')
    }
  })

  it('aplica perPage default quando não informado', async () => {
    await produtoRepo.create(makeProduto({ id: 'produto-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.perPage).toBe(20)
    }
  })

  it('retorna lista vazia quando o tenant não tem produtos', async () => {
    const result = await sut.execute({ tenantId: 'tenant-vazio', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toEqual([])
      expect(result.value.total).toBe(0)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(produtoRepo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
