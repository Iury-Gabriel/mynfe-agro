import { makeEstoqueMovimento } from '@test/factories/make-estoque-movimento'
import { InMemoryEstoqueMovimentoRepository } from '@test/repositories/in-memory-estoque-movimento-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListMovimentacoesUseCase } from './list-movimentacoes-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListMovimentacoesUseCase.name, () => {
  let repo: InMemoryEstoqueMovimentoRepository
  let sut: ListMovimentacoesUseCase

  beforeEach(() => {
    repo = new InMemoryEstoqueMovimentoRepository()
    sut = new ListMovimentacoesUseCase(repo)
  })

  it('retorna movimentos paginados sem filtros', async () => {
    repo.movimentos.push(makeEstoqueMovimento({ id: 'm-1', empresaId: 'empresa-1' }))
    repo.movimentos.push(makeEstoqueMovimento({ id: 'm-2', empresaId: 'empresa-1', tipo: 'saida' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(2)
    }
  })

  it('aplica filtros por tipo e produto', async () => {
    repo.movimentos.push(
      makeEstoqueMovimento({ id: 'm-1', empresaId: 'empresa-1', tipo: 'entrada', produtoId: 'p-1' }),
    )
    repo.movimentos.push(
      makeEstoqueMovimento({ id: 'm-2', empresaId: 'empresa-1', tipo: 'saida', produtoId: 'p-1' }),
    )
    repo.movimentos.push(
      makeEstoqueMovimento({ id: 'm-3', empresaId: 'empresa-1', tipo: 'entrada', produtoId: 'p-2' }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      filtros: { tipo: 'entrada', produtoId: 'p-1' },
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].id.toString()).toBe('m-1')
    }
  })

  it('isola por tenant', async () => {
    repo.movimentos.push(makeEstoqueMovimento({ id: 'm-1', tenantId: 'tenant-1', empresaId: 'empresa-1' }))
    repo.movimentos.push(makeEstoqueMovimento({ id: 'm-2', tenantId: 'tenant-2', empresaId: 'empresa-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(repo, 'count').mockRejectedValueOnce(new Error('db down'))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
