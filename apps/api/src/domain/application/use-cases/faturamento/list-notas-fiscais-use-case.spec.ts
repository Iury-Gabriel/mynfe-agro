import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { InMemoryNotaFiscalRepository } from '@test/repositories/in-memory-nota-fiscal-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ListNotasFiscaisUseCase } from './list-notas-fiscais-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'

describe(ListNotasFiscaisUseCase.name, () => {
  let notaRepo: InMemoryNotaFiscalRepository
  let sut: ListNotasFiscaisUseCase

  beforeEach(() => {
    notaRepo = new InMemoryNotaFiscalRepository()
    sut = new ListNotasFiscaisUseCase(notaRepo)
  })

  it('lista notas paginadas da empresa', async () => {
    notaRepo.notas.push(
      makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1' }),
      makeNotaFiscal({ id: 'n-2', empresaEmitenteId: 'empresa-1' }),
      makeNotaFiscal({ id: 'n-3', empresaEmitenteId: 'outra' }),
    )

    const result = await sut.execute({ tenantId: 'tenant-1', empresaEmitenteId: 'empresa-1', page: 1 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(2)
      expect(result.value.total).toBe(2)
    }
  })

  it('filtra por status e cliente', async () => {
    notaRepo.notas.push(
      makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', status: 'autorizada', clienteId: 'c-1' }),
      makeNotaFiscal({ id: 'n-2', empresaEmitenteId: 'empresa-1', status: 'rejeitada', clienteId: 'c-1' }),
      makeNotaFiscal({ id: 'n-3', empresaEmitenteId: 'empresa-1', status: 'autorizada', clienteId: 'c-2' }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      filtros: { status: 'autorizada', clienteId: 'c-1' },
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].id.toString()).toBe('n-1')
    }
  })

  it('filtra por pedidoId', async () => {
    notaRepo.notas.push(
      makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'empresa-1', pedidoId: 'pedido-1' }),
      makeNotaFiscal({ id: 'n-2', empresaEmitenteId: 'empresa-1', pedidoId: 'pedido-2' }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      filtros: { pedidoId: 'pedido-1' },
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(1)
      expect(result.value.items[0].id.toString()).toBe('n-1')
    }
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(notaRepo, 'count').mockRejectedValueOnce(new Error('boom'))

    const result = await sut.execute({ tenantId: 'tenant-1', empresaEmitenteId: 'empresa-1', page: 1 })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
