import { makeCliente } from '@test/factories/make-cliente'
import { InMemoryAuditoriaLogRepository } from '@test/repositories/in-memory-auditoria-log-repository'
import { InMemoryClienteRepository } from '@test/repositories/in-memory-cliente-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UpdateClienteUseCase } from './update-cliente-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { RegistrarAuditoriaUseCase } from '@/domain/application/use-cases/auditoria/registrar-auditoria-use-case'
import { ClienteNotFoundError } from '@/domain/application/use-cases/errors/cliente-not-found-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

describe(UpdateClienteUseCase.name, () => {
  let clienteRepo: InMemoryClienteRepository
  let auditoriaRepo: InMemoryAuditoriaLogRepository
  let sut: UpdateClienteUseCase

  beforeEach(() => {
    clienteRepo = new InMemoryClienteRepository()
    auditoriaRepo = new InMemoryAuditoriaLogRepository()
    sut = new UpdateClienteUseCase(clienteRepo, new RegistrarAuditoriaUseCase(auditoriaRepo))
  })

  it('atualiza dados cadastrais do cliente', async () => {
    await clienteRepo.create(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      razaoSocialNome: 'Novo Nome',
      contribuinteIcms: false,
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.cliente.razaoSocialNome).toBe('Novo Nome')
      expect(result.value.cliente.contribuinteIcms).toBe(false)
    }
  })

  it('atualiza o CNPJ quando um novo documento válido é informado', async () => {
    await clienteRepo.create(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      cnpjCpf: '52998224725',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.cliente.cnpjCpf.value).toBe('52998224725')
    }
  })

  it('retorna InvalidCnpjCpfError quando o novo documento é inválido', async () => {
    await clienteRepo.create(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      cnpjCpf: '12345678000100',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
  })

  it('retorna ClienteNotFoundError quando o cliente não existe', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      clienteId: 'inexistente',
      razaoSocialNome: 'X',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ClienteNotFoundError)
  })

  it('não vaza cliente de outro tenant (IDOR) — retorna ClienteNotFoundError', async () => {
    await clienteRepo.create(makeCliente({ id: 'cliente-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      razaoSocialNome: 'Hack',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ClienteNotFoundError)
    expect(clienteRepo.clientes[0].razaoSocialNome).not.toBe('Hack')
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await clienteRepo.create(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))
    clienteRepo.shouldFailOnSave = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      razaoSocialNome: 'Nova',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })

  it('registra auditoria de edição com dadosAntes e dadosDepois', async () => {
    await clienteRepo.create(
      makeCliente({ id: 'cliente-1', tenantId: 'tenant-1', razaoSocialNome: 'Antigo' }),
    )

    await sut.execute({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      razaoSocialNome: 'Novo Nome',
    })

    expect(auditoriaRepo.logs).toHaveLength(1)
    expect(auditoriaRepo.logs[0]).toMatchObject({
      entidade: 'cliente',
      acao: 'editar',
      entidadeId: 'cliente-1',
      dadosAntes: { razaoSocialNome: 'Antigo' },
      dadosDepois: { razaoSocialNome: 'Novo Nome' },
    })
  })

  it('não quebra quando a auditoria falha (best-effort)', async () => {
    await clienteRepo.create(makeCliente({ id: 'cliente-1', tenantId: 'tenant-1' }))
    auditoriaRepo.shouldFailOnCreate = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      clienteId: 'cliente-1',
      razaoSocialNome: 'Novo Nome',
    })

    expect(result.isRight()).toBe(true)
    expect(auditoriaRepo.logs).toHaveLength(0)
  })
})
