import { makeEstoqueSaldo } from '@test/factories/make-estoque-saldo'
import { InMemoryEstoqueSaldoRepository } from '@test/repositories/in-memory-estoque-saldo-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetPosicaoEstoqueUseCase } from './get-posicao-estoque-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(GetPosicaoEstoqueUseCase.name, () => {
  let repo: InMemoryEstoqueSaldoRepository
  let sut: GetPosicaoEstoqueUseCase

  beforeEach(() => {
    repo = new InMemoryEstoqueSaldoRepository()
    sut = new GetPosicaoEstoqueUseCase(repo)
  })

  it('retorna saldos paginados da empresa', async () => {
    repo.saldos.push(makeEstoqueSaldo({ id: 's-1', empresaId: 'empresa-1', quantidadeDisponivel: 10 }))
    repo.saldos.push(makeEstoqueSaldo({ id: 's-2', empresaId: 'empresa-1', quantidadeDisponivel: 20 }))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaId: 'empresa-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(2)
    }
  })

  it('isola por tenant e empresa', async () => {
    repo.saldos.push(makeEstoqueSaldo({ id: 's-1', tenantId: 'tenant-1', empresaId: 'empresa-1' }))
    repo.saldos.push(makeEstoqueSaldo({ id: 's-2', tenantId: 'tenant-1', empresaId: 'empresa-2' }))

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
