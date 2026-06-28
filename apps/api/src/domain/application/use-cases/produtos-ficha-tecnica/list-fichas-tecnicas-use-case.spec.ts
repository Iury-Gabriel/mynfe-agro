import { makeProdutoFichaTecnica } from '@test/factories/make-produto-ficha-tecnica'
import { InMemoryProdutoFichaTecnicaRepository } from '@test/repositories/in-memory-produto-ficha-tecnica-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListFichasTecnicasUseCase } from './list-fichas-tecnicas-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListFichasTecnicasUseCase.name, () => {
  let fichaRepo: InMemoryProdutoFichaTecnicaRepository
  let sut: ListFichasTecnicasUseCase

  beforeEach(() => {
    fichaRepo = new InMemoryProdutoFichaTecnicaRepository()
    sut = new ListFichasTecnicasUseCase(fichaRepo)
  })

  it('lista fichas paginadas do produto', async () => {
    await fichaRepo.create(makeProdutoFichaTecnica({ id: 'f-1', produtoId: 'produto-1' }))
    await fichaRepo.create(makeProdutoFichaTecnica({ id: 'f-2', produtoId: 'produto-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', produtoId: 'produto-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(2)
      expect(result.value.perPage).toBe(20)
    }
  })

  it('isola por produto (não vaza de outro produto)', async () => {
    await fichaRepo.create(makeProdutoFichaTecnica({ id: 'f-1', produtoId: 'produto-1' }))
    await fichaRepo.create(makeProdutoFichaTecnica({ id: 'f-2', produtoId: 'produto-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', produtoId: 'produto-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].produtoId).toBe('produto-1')
    }
  })

  it('isola por tenant (IDOR)', async () => {
    await fichaRepo.create(
      makeProdutoFichaTecnica({ id: 'f-1', produtoId: 'produto-1', tenantId: 'tenant-2' }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', produtoId: 'produto-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toEqual([])
      expect(result.value.total).toBe(0)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(fichaRepo, 'countByProduto').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', produtoId: 'produto-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
