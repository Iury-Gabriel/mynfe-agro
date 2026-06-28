import { makeProduto } from '@test/factories/make-produto'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UpdateProdutoUseCase } from './update-produto-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

describe(UpdateProdutoUseCase.name, () => {
  let produtoRepo: InMemoryProdutoRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: UpdateProdutoUseCase

  beforeEach(() => {
    produtoRepo = new InMemoryProdutoRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new UpdateProdutoUseCase(produtoRepo, new RegistrarAuditoriaUseCase(auditoriaRepo))
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

  it('registra auditoria de edição com dadosAntes e dadosDepois', async () => {
    await produtoRepo.create(
      makeProduto({ id: 'produto-1', tenantId: 'tenant-1', descricao: 'Soja' }),
    )

    await sut.execute({
      tenantId: 'tenant-1',
      produtoId: 'produto-1',
      descricao: 'Soja Premium',
    })

    expect(auditoriaRepo.logs).toHaveLength(1)
    expect(auditoriaRepo.logs[0]).toMatchObject({
      entidade: 'produto',
      acao: 'editar',
      entidadeId: 'produto-1',
      dadosAntes: { descricao: 'Soja' },
      dadosDepois: { descricao: 'Soja Premium' },
    })
  })

  it('mantém o sucesso quando a auditoria falha (best-effort)', async () => {
    await produtoRepo.create(makeProduto({ id: 'produto-1', tenantId: 'tenant-1' }))
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      produtoId: 'produto-1',
      descricao: 'X',
    })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
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
