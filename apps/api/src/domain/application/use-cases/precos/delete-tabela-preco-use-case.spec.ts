import { makeTabelaPrecoCliente } from '@test/factories/make-tabela-preco-cliente'
import { InMemoryTabelaPrecoClienteRepository } from '@test/repositories/in-memory-tabela-preco-cliente-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeleteTabelaPrecoUseCase } from './delete-tabela-preco-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { TabelaPrecoNotFoundError } from '@/domain/application/use-cases/errors/tabela-preco-not-found-error'

describe(DeleteTabelaPrecoUseCase.name, () => {
  let tabelaRepo: InMemoryTabelaPrecoClienteRepository
  let sut: DeleteTabelaPrecoUseCase

  beforeEach(() => {
    tabelaRepo = new InMemoryTabelaPrecoClienteRepository()
    sut = new DeleteTabelaPrecoUseCase(tabelaRepo)
  })

  it('marca a tabela de preço do tenant como deletada', async () => {
    await tabelaRepo.create(makeTabelaPrecoCliente({ id: 'tab-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', tabelaPrecoId: 'tab-1' })

    expect(result.isRight()).toBe(true)
    expect(tabelaRepo.tabelas[0].deletedAt).toBeInstanceOf(Date)
  })

  it('retorna TabelaPrecoNotFoundError quando a tabela não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', tabelaPrecoId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TabelaPrecoNotFoundError)
  })

  it('retorna TabelaPrecoNotFoundError quando a tabela é de outro tenant (IDOR)', async () => {
    await tabelaRepo.create(makeTabelaPrecoCliente({ id: 'tab-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', tabelaPrecoId: 'tab-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(TabelaPrecoNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança ao salvar', async () => {
    await tabelaRepo.create(makeTabelaPrecoCliente({ id: 'tab-1', tenantId: 'tenant-1' }))
    tabelaRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', tabelaPrecoId: 'tab-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
