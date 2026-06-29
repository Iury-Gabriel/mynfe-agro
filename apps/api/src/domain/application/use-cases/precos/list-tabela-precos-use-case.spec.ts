import { makeTabelaPrecoCliente } from '@test/factories/make-tabela-preco-cliente'
import { InMemoryTabelaPrecoClienteRepository } from '@test/repositories/in-memory-tabela-preco-cliente-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListTabelaPrecosUseCase } from './list-tabela-precos-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListTabelaPrecosUseCase.name, () => {
  let tabelaRepo: InMemoryTabelaPrecoClienteRepository
  let sut: ListTabelaPrecosUseCase

  beforeEach(() => {
    tabelaRepo = new InMemoryTabelaPrecoClienteRepository()
    sut = new ListTabelaPrecosUseCase(tabelaRepo)
  })

  it('retorna tabelas paginadas do tenant', async () => {
    await tabelaRepo.create(makeTabelaPrecoCliente({ id: 'tab-1', tenantId: 'tenant-1' }))
    await tabelaRepo.create(makeTabelaPrecoCliente({ id: 'tab-2', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(2)
      expect(result.value.perPage).toBe(10)
    }
  })

  it('isola tabelas por tenant (não vaza de outro tenant)', async () => {
    await tabelaRepo.create(makeTabelaPrecoCliente({ id: 'tab-1', tenantId: 'tenant-1' }))
    await tabelaRepo.create(makeTabelaPrecoCliente({ id: 'tab-2', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].tenantId).toBe('tenant-1')
    }
  })

  it('aplica perPage default quando não informado', async () => {
    await tabelaRepo.create(makeTabelaPrecoCliente({ id: 'tab-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.perPage).toBe(20)
    }
  })

  it('retorna lista vazia quando o tenant não tem tabelas', async () => {
    const result = await sut.execute({ tenantId: 'tenant-vazio', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toEqual([])
      expect(result.value.total).toBe(0)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(tabelaRepo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
