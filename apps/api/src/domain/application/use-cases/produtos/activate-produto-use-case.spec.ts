import { makeProduto } from '@test/factories/make-produto'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { ActivateProdutoUseCase } from './activate-produto-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { ProdutoNotFoundError } from '@/domain/application/use-cases/errors/produto-not-found-error'

describe(ActivateProdutoUseCase.name, () => {
  let produtoRepo: InMemoryProdutoRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: ActivateProdutoUseCase

  beforeEach(() => {
    produtoRepo = new InMemoryProdutoRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new ActivateProdutoUseCase(produtoRepo, new RegistrarAuditoriaUseCase(auditoriaRepo))
  })

  it('ativa o produto do tenant', async () => {
    await produtoRepo.create(
      makeProduto({ id: 'produto-1', tenantId: 'tenant-1', status: 'inativo' }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', produtoId: 'produto-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.produto.status).toBe('ativo')
    }
  })

  it('registra auditoria de ativação com dadosAntes e dadosDepois', async () => {
    await produtoRepo.create(
      makeProduto({ id: 'produto-1', tenantId: 'tenant-1', status: 'inativo' }),
    )

    await sut.execute({ tenantId: 'tenant-1', produtoId: 'produto-1' })

    expect(auditoriaRepo.logs).toHaveLength(1)
    expect(auditoriaRepo.logs[0]).toMatchObject({
      entidade: 'produto',
      acao: 'editar',
      entidadeId: 'produto-1',
      dadosAntes: { status: 'inativo' },
      dadosDepois: { status: 'ativo' },
    })
  })

  it('mantém o sucesso quando a auditoria falha (best-effort)', async () => {
    await produtoRepo.create(
      makeProduto({ id: 'produto-1', tenantId: 'tenant-1', status: 'inativo' }),
    )
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute({ tenantId: 'tenant-1', produtoId: 'produto-1' })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
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
