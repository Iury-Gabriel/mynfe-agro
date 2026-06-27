import { InMemoryClienteRepository } from '@test/repositories/in-memory-cliente-repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { CreateClienteUseCase, type CreateClienteInput } from './create-cliente-use-case'

import { UnexpectedError } from '@/core/errors/unexpected-error'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'

function makeInput(override: Partial<CreateClienteInput> = {}): CreateClienteInput {
  return {
    tenantId: 'tenant-1',
    tipoPessoa: 'PJ',
    razaoSocialNome: 'Cliente Agro LTDA',
    cnpjCpf: '11222333000181',
    indicadorIe: '1',
    contribuinteIcms: true,
    ...override,
  }
}

describe(CreateClienteUseCase.name, () => {
  let clienteRepo: InMemoryClienteRepository
  let sut: CreateClienteUseCase

  beforeEach(() => {
    clienteRepo = new InMemoryClienteRepository()
    sut = new CreateClienteUseCase(clienteRepo)
  })

  it('cria cliente no tenant com CNPJ válido', async () => {
    const result = await sut.execute(makeInput())

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.cliente.tenantId).toBe('tenant-1')
      expect(result.value.cliente.cnpjCpf.value).toBe('11222333000181')
      expect(result.value.cliente.indicadorIe).toBe('1')
      expect(result.value.cliente.contribuinteIcms).toBe(true)
    }
    expect(clienteRepo.clientes).toHaveLength(1)
  })

  it('normaliza o CNPJ removendo máscara antes de persistir', async () => {
    const result = await sut.execute(makeInput({ cnpjCpf: '11.222.333/0001-81' }))

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.cliente.cnpjCpf.value).toBe('11222333000181')
    }
  })

  it('aceita campos opcionais e endereço principal do cliente', async () => {
    const result = await sut.execute(
      makeInput({
        inscricaoEstadual: '123',
        enderecoLogradouro: 'Rua A',
        municipio: 'Sinop',
        uf: 'MT',
        email: 'cliente@agro.com',
        telefone: '65999999999',
        vendedorUsuarioId: 'vendedor-1',
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.cliente.inscricaoEstadual).toBe('123')
      expect(result.value.cliente.enderecoLogradouro).toBe('Rua A')
      expect(result.value.cliente.municipio).toBe('Sinop')
      expect(result.value.cliente.vendedorUsuarioId).toBe('vendedor-1')
    }
  })

  it('cria cliente com endereços de entrega', async () => {
    const result = await sut.execute(
      makeInput({
        enderecosEntrega: [
          { enderecoLogradouro: 'Rua Entrega 1', municipio: 'Sorriso', uf: 'MT', principal: true },
          { enderecoLogradouro: 'Rua Entrega 2' },
        ],
      }),
    )

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const { cliente } = result.value
      expect(cliente.enderecosEntrega).toHaveLength(2)
      expect(cliente.enderecosEntrega[0].enderecoLogradouro).toBe('Rua Entrega 1')
      expect(cliente.enderecosEntrega[0].principal).toBe(true)
      expect(cliente.enderecosEntrega[0].clienteId).toBe(cliente.id.toString())
      expect(cliente.enderecosEntrega[0].tenantId).toBe('tenant-1')
      expect(cliente.enderecosEntrega[1].principal).toBe(false)
    }
  })

  it('retorna InvalidCnpjCpfError quando o documento é inválido', async () => {
    const result = await sut.execute(makeInput({ cnpjCpf: '00000000000000' }))

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
    expect(clienteRepo.clientes).toHaveLength(0)
  })

  it('retorna UnexpectedError quando o repositório lança', async () => {
    clienteRepo.shouldFailOnCreate = true

    const result = await sut.execute(makeInput())

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnexpectedError)
  })
})
