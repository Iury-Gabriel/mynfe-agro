import { makeProduto } from '@test/factories/make-produto'
import { InMemoryProdutoFichaTecnicaRepository } from '@test/repositories/in-memory-produto-ficha-tecnica-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateFichaTecnicaUseCase } from './create-ficha-tecnica-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

describe(CreateFichaTecnicaUseCase.name, () => {
  let fichaRepo: InMemoryProdutoFichaTecnicaRepository
  let produtoRepo: InMemoryProdutoRepository
  let sut: CreateFichaTecnicaUseCase

  beforeEach(async () => {
    fichaRepo = new InMemoryProdutoFichaTecnicaRepository()
    produtoRepo = new InMemoryProdutoRepository()
    sut = new CreateFichaTecnicaUseCase(fichaRepo, produtoRepo)
    await produtoRepo.create(makeProduto({ id: 'produto-1', tenantId: 'tenant-1' }))
  })

  it('cria a ficha técnica de um produto do tenant', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      produtoId: 'produto-1',
      descricaoComponente: 'Milho moído',
      quantidadeReferencia: 5,
      observacoes: 'Base',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.fichaTecnica.descricaoComponente).toBe('Milho moído')
      expect(result.value.fichaTecnica.quantidadeReferencia).toBe(5)
    }
    expect(fichaRepo.fichas).toHaveLength(1)
  })

  it('aplica null nos campos opcionais quando omitidos', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      produtoId: 'produto-1',
      descricaoComponente: 'Soja',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.fichaTecnica.quantidadeReferencia).toBeNull()
      expect(result.value.fichaTecnica.observacoes).toBeNull()
    }
  })

  it('retorna ProdutoNotFoundError quando o produto não existe', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      produtoId: 'inexistente',
      descricaoComponente: 'Soja',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProdutoNotFoundError)
  })

  it('retorna ProdutoNotFoundError quando o produto é de outro tenant (IDOR)', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-2',
      produtoId: 'produto-1',
      descricaoComponente: 'Soja',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProdutoNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança ao criar', async () => {
    fichaRepo.shouldFailOnCreate = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      produtoId: 'produto-1',
      descricaoComponente: 'Soja',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
