import { makeCustoProducao } from '@test/factories/make-custo-producao'
import { InMemoryCustoProducaoRepository } from '@test/repositories/in-memory-custo-producao-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeleteCustoProducaoUseCase } from './delete-custo-producao-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { CustoProducaoNotFoundError } from '@/domain/application/use-cases/errors/custo-producao-not-found-error'

describe(DeleteCustoProducaoUseCase.name, () => {
  let custoRepo: InMemoryCustoProducaoRepository
  let sut: DeleteCustoProducaoUseCase

  beforeEach(() => {
    custoRepo = new InMemoryCustoProducaoRepository()
    sut = new DeleteCustoProducaoUseCase(custoRepo)
  })

  it('aplica soft delete definindo deletedAt', async () => {
    await custoRepo.create(makeCustoProducao({ id: 'custo-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', custoId: 'custo-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.custo.deletedAt).toBeInstanceOf(Date)
    }
    expect(custoRepo.custos[0].deletedAt).toBeInstanceOf(Date)
  })

  it('retorna CustoProducaoNotFoundError quando o custo não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', custoId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CustoProducaoNotFoundError)
  })

  it('não vaza custo de outro tenant (IDOR) — retorna CustoProducaoNotFoundError', async () => {
    await custoRepo.create(makeCustoProducao({ id: 'custo-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', custoId: 'custo-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CustoProducaoNotFoundError)
    expect(custoRepo.custos[0].deletedAt).toBeNull()
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await custoRepo.create(makeCustoProducao({ id: 'custo-1', tenantId: 'tenant-1' }))
    custoRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', custoId: 'custo-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
