import { makeProduto } from '@test/factories/make-produto'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeactivateProdutoUseCase } from './deactivate-produto-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

describe(DeactivateProdutoUseCase.name, () => {
  let produtoRepo: InMemoryProdutoRepository
  let sut: DeactivateProdutoUseCase

  beforeEach(() => {
    produtoRepo = new InMemoryProdutoRepository()
    sut = new DeactivateProdutoUseCase(produtoRepo)
  })

  it('inativa o produto do tenant', async () => {
    await produtoRepo.create(
      makeProduto({ id: 'produto-1', tenantId: 'tenant-1', status: 'ativo' }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', produtoId: 'produto-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.produto.status).toBe('inativo')
    }
  })

  it('retorna ProdutoNotFoundError quando o produto não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', produtoId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProdutoNotFoundError)
  })

  it('retorna ProdutoNotFoundError quando o produto é de outro tenant (IDOR)', async () => {
    await produtoRepo.create(makeProduto({ id: 'produto-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', produtoId: 'produto-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProdutoNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança ao salvar', async () => {
    await produtoRepo.create(makeProduto({ id: 'produto-1', tenantId: 'tenant-1' }))
    produtoRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', produtoId: 'produto-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
