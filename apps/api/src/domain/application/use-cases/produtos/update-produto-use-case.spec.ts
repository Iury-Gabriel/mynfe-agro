import { makeProduto } from '@test/factories/make-produto'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UpdateProdutoUseCase } from './update-produto-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

describe(UpdateProdutoUseCase.name, () => {
  let produtoRepo: InMemoryProdutoRepository
  let sut: UpdateProdutoUseCase

  beforeEach(() => {
    produtoRepo = new InMemoryProdutoRepository()
    sut = new UpdateProdutoUseCase(produtoRepo)
  })

  it('atualiza o produto do tenant', async () => {
    await produtoRepo.create(makeProduto({ id: 'produto-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      produtoId: 'produto-1',
      descricao: 'Soja Premium',
      precoPadrao: 99,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.produto.descricao).toBe('Soja Premium')
      expect(result.value.produto.precoPadrao).toBe(99)
    }
  })

  it('retorna ProdutoNotFoundError quando o produto não existe', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      produtoId: 'inexistente',
      descricao: 'X',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProdutoNotFoundError)
  })

  it('retorna ProdutoNotFoundError quando o produto é de outro tenant (IDOR)', async () => {
    await produtoRepo.create(makeProduto({ id: 'produto-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      produtoId: 'produto-1',
      descricao: 'X',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProdutoNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança ao salvar', async () => {
    await produtoRepo.create(makeProduto({ id: 'produto-1', tenantId: 'tenant-1' }))
    produtoRepo.shouldFailOnSave = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      produtoId: 'produto-1',
      descricao: 'X',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
