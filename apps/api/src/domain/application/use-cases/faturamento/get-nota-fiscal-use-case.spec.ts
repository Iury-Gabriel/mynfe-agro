import { makeNotaFiscal } from '@test/factories/make-nota-fiscal'
import { makeNotaFiscalEvento } from '@test/factories/make-nota-fiscal-evento'
import { makeNotaFiscalItem } from '@test/factories/make-nota-fiscal-item'
import { InMemoryNotaFiscalRepository } from '@test/repositories/in-memory-nota-fiscal-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GetNotaFiscalUseCase } from './get-nota-fiscal-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { NotaFiscalNotFoundError } from '@/domain/application/use-cases/errors/nota-fiscal-not-found-error'

describe(GetNotaFiscalUseCase.name, () => {
  let notaRepo: InMemoryNotaFiscalRepository
  let sut: GetNotaFiscalUseCase

  beforeEach(() => {
    notaRepo = new InMemoryNotaFiscalRepository()
    sut = new GetNotaFiscalUseCase(notaRepo)
  })

  it('retorna a nota com itens e eventos', async () => {
    notaRepo.notas.push(
      makeNotaFiscal({
        id: 'n-1',
        empresaEmitenteId: 'empresa-1',
        itens: [makeNotaFiscalItem({ id: 'i-1' })],
        eventos: [makeNotaFiscalEvento({ id: 'e-1' })],
      }),
    )

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.nota.itens).toHaveLength(1)
      expect(result.value.nota.eventos).toHaveLength(1)
    }
  })

  it('retorna NotaFiscalNotFoundError quando inexistente', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'sumida',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotaFiscalNotFoundError)
  })

  it('retorna NotaFiscalNotFoundError quando a nota é de outra empresa (IDOR)', async () => {
    notaRepo.notas.push(makeNotaFiscal({ id: 'n-1', empresaEmitenteId: 'outra' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotaFiscalNotFoundError)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    vi.spyOn(notaRepo, 'findById').mockRejectedValueOnce(new Error('boom'))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaEmitenteId: 'empresa-1',
      notaFiscalId: 'n-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
