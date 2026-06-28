import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryProdutoRepository } from '@test/repositories/in-memory-produto-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateProdutoUseCase, type CreateProdutoInput } from './create-produto-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'

function makeInput(override: Partial<CreateProdutoInput> = {}): CreateProdutoInput {
  return {
    tenantId: 'tenant-1',
    empresaId: 'empresa-1',
    descricao: 'Soja',
    tipo: 'bruto',
    unidadeMedida: 'KG',
    ...override,
  }
}

describe(CreateProdutoUseCase.name, () => {
  let produtoRepo: InMemoryProdutoRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: CreateProdutoUseCase

  beforeEach(() => {
    produtoRepo = new InMemoryProdutoRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new CreateProdutoUseCase(produtoRepo, new RegistrarAuditoriaUseCase(auditoriaRepo))
  })

  it('cria produto no tenant', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.produto.tenantId).toBe('tenant-1')
      expect(result.value.produto.empresaId).toBe('empresa-1')
      expect(result.value.produto.status).toBe('ativo')
      expect(result.value.produto.precoPadrao).toBeNull()
    }
    expect(produtoRepo.produtos).toHaveLength(1)
  })

  it('aceita campos fiscais opcionais', async () => {
    const result = await sut.execute(
      makeInput({
        precoPadrao: 50,
        ncm: '12019000',
        cest: '0100100',
        cfopPadrao: '5101',
        origemMercadoria: '0',
        cstCsosn: '102',
        aliquotas: { icms: 12 },
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.produto.precoPadrao).toBe(50)
      expect(result.value.produto.ncm).toBe('12019000')
      expect(result.value.produto.aliquotas).toEqual({ icms: 12 })
    }
  })

  it('registra auditoria de criação', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(1)
    expect(auditoriaRepo.logs[0]).toMatchObject({
      entidade: 'produto',
      acao: 'criar',
      dadosDepois: { descricao: 'Soja', status: 'ativo' },
    })
    if (result.isRight()) {
      expect(auditoriaRepo.logs[0].entidadeId).toBe(result.value.produto.id.toString())
    }
  })

  it('mantém o sucesso quando a auditoria falha (best-effort)', async () => {
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    produtoRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
