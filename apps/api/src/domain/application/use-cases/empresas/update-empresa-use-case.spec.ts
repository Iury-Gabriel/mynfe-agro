import { makeEmpresa } from '@test/factories'
import { InMemoryEmpresaRepository } from '@test/repositories/in-memory-empresa-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { UpdateEmpresaUseCase } from './update-empresa-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { EmpresaNotFoundError } from '@/domain/application/use-cases/errors/empresa-not-found-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

describe(UpdateEmpresaUseCase.name, () => {
  let empresaRepo: InMemoryEmpresaRepository
  let sut: UpdateEmpresaUseCase

  beforeEach(() => {
    empresaRepo = new InMemoryEmpresaRepository()
    sut = new UpdateEmpresaUseCase(empresaRepo)
  })

  it('atualiza dados cadastrais da empresa', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      razaoSocial: 'Nova Razão',
      nomeFantasia: 'Novo Fantasia',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.empresa.razaoSocial).toBe('Nova Razão')
      expect(result.value.empresa.nomeFantasia).toBe('Novo Fantasia')
    }
  })

  it('atualiza o CNPJ quando um novo documento válido é informado', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      cnpjCpf: '52998224725',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.empresa.cnpjCpf.value).toBe('52998224725')
    }
  })

  it('retorna InvalidCnpjCpfError quando o novo documento é inválido', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-1' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      cnpjCpf: '12345678000100',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
  })

  it('retorna EmpresaNotFoundError quando a empresa não existe', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaId: 'inexistente',
      razaoSocial: 'X',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmpresaNotFoundError)
  })

  it('não vaza empresa de outro tenant (IDOR) — retorna EmpresaNotFoundError', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-2' }))

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      razaoSocial: 'Hack',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(EmpresaNotFoundError)
    expect(empresaRepo.empresas[0].razaoSocial).not.toBe('Hack')
  })

  it('retorna UnexpectedError quando o repositório lança no save', async () => {
    await empresaRepo.create(makeEmpresa({ id: 'empresa-1', tenantId: 'tenant-1' }))
    empresaRepo.shouldFailOnSave = true

    const result = await sut.execute({
      tenantId: 'tenant-1',
      empresaId: 'empresa-1',
      razaoSocial: 'Nova',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
