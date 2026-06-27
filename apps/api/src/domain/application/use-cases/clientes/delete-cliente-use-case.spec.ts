import { makeCliente } from '@test/factories/make-cliente'
import { InMemoryClienteRepository } from '@test/repositories/in-memory-cliente-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeleteClienteUseCase } from './delete-cliente-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'

describe(DeleteClienteUseCase.name, () => {
  let clienteRepo: InMemoryClienteRepository
  let sut: DeleteClienteUseCase

  beforeEach(() => {
    clienteRepo = new InMemoryClienteRepository()
    sut = new DeleteClienteUseCase(clienteRepo)
  })

  it('faz soft delete do cliente do tenant', async () => {
    await clienteRepo.create(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({ tenantId: 'tenant-1', clienteId: 'cliente-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.cliente.deletedAt).toBeInstanceOf(Date)
    }
    expect(clienteRepo.clientes[0].deletedAt).toBeInstanceOf(Date)
  })

  it('retorna ClienteNotFoundError quando o cliente não existe', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', clienteId: 'inexistente' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ClienteNotFoundError)
  })

  it('não vaza cliente de outro tenant (IDOR) — retorna ClienteNotFoundError', async () => {
    await clienteRepo.create(makeCliente({ id: 'cliente-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({ tenantId: 'tenant-1', clienteId: 'cliente-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ClienteNotFoundError)
    expect(clienteRepo.clientes[0].deletedAt).toBeNull()
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await clienteRepo.create(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))
    clienteRepo.shouldFailOnSave = true

    const result = await sut.execute({ tenantId: 'tenant-1', clienteId: 'cliente-1' })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
