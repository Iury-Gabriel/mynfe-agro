import { makeCliente } from '@test/factories/make-cliente'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryClienteRepository } from '@test/repositories/in-memory-cliente-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { DeleteClienteUseCase } from './delete-cliente-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'

describe(DeleteClienteUseCase.name, () => {
  let clienteRepo: InMemoryClienteRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: DeleteClienteUseCase

  beforeEach(() => {
    clienteRepo = new InMemoryClienteRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new DeleteClienteUseCase(clienteRepo, new RegistrarAuditoriaUseCase(auditoriaRepo))
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

  it('registra auditoria de exclusão com dadosAntes e dadosDepois', async () => {
    await clienteRepo.create(
      makeCliente({ id: 'cliente-1', tenantId: 'tenant-1', razaoSocialNome: 'Antigo' }),
    )

    await sut.execute({ tenantId: 'tenant-1', clienteId: 'cliente-1' })

    expect(auditoriaRepo.logs).toHaveLength(1)
    expect(auditoriaRepo.logs[0]).toMatchObject({
      entidade: 'cliente',
      acao: 'excluir',
      entidadeId: 'cliente-1',
      dadosAntes: { razaoSocialNome: 'Antigo', deletedAt: null },
    })
    expect(auditoriaRepo.logs[0].dadosDepois?.deletedAt).toBeInstanceOf(Date)
  })

  it('não quebra quando a auditoria falha (best-effort)', async () => {
    await clienteRepo.create(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute({ tenantId: 'tenant-1', clienteId: 'cliente-1' })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })
})
