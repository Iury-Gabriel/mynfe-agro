import { makeCliente } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { ClientePresenter } from './cliente-presenter'

import { ClienteEnderecoEntrega } from '@/domain/enterprise/entities/cliente-endereco-entrega'

describe(ClientePresenter.name, () => {
  it('mapeia todos os campos e formata CNPJ', () => {
    const cliente = makeCliente({
      id: 'cliente-1',
      razaoSocialNome: 'Cliente Agro LTDA',
      cnpjCpf: '11222333000181',
      indicadorIe: '1',
      contribuinteIcms: true,
      municipio: 'Sinop',
      uf: 'MT',
    })

    const sut = ClientePresenter.toHTTP(cliente)

    expect(sut.id).toBe('cliente-1')
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.razaoSocialNome).toBe('Cliente Agro LTDA')
    expect(sut.cnpjCpf).toBe('11222333000181')
    expect(sut.cnpjCpfFormatado).toBe('11.222.333/0001-81')
    expect(sut.indicadorIe).toBe('1')
    expect(sut.contribuinteIcms).toBe(true)
    expect(sut.municipio).toBe('Sinop')
    expect(sut.uf).toBe('MT')
    expect(sut.enderecosEntrega).toEqual([])
  })

  it('formata CPF quando o documento tem 11 dígitos', () => {
    const cliente = makeCliente({ tipoPessoa: 'PF', cnpjCpf: '52998224725' })
    const sut = ClientePresenter.toHTTP(cliente)

    expect(sut.cnpjCpf).toBe('52998224725')
    expect(sut.cnpjCpfFormatado).toBe('529.982.247-25')
  })

  it('cnpjCpf é string limpa, nunca o value object', () => {
    const cliente = makeCliente({ cnpjCpf: '11.222.333/0001-81' })
    const sut = ClientePresenter.toHTTP(cliente)

    expect(typeof sut.cnpjCpf).toBe('string')
    expect(sut.cnpjCpf).toBe('11222333000181')
  })

  it('mapeia os endereços de entrega', () => {
    const endereco = ClienteEnderecoEntrega.create(
      {
        tenantId: 'tenant-1',
        clienteId: 'cliente-1',
        enderecoLogradouro: 'Rua da Entrega',
        municipio: 'Sorriso',
        uf: 'MT',
        principal: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      undefined,
    )
    const cliente = makeCliente({ enderecosEntrega: [endereco] })

    const sut = ClientePresenter.toHTTP(cliente)

    expect(sut.enderecosEntrega).toHaveLength(1)
    expect(sut.enderecosEntrega[0].enderecoLogradouro).toBe('Rua da Entrega')
    expect(sut.enderecosEntrega[0].municipio).toBe('Sorriso')
    expect(sut.enderecosEntrega[0].principal).toBe(true)
  })

  it('mapeia campos opcionais nulos', () => {
    const cliente = makeCliente({ inscricaoEstadual: null, email: null, vendedorUsuarioId: null })
    const sut = ClientePresenter.toHTTP(cliente)

    expect(sut.inscricaoEstadual).toBeNull()
    expect(sut.email).toBeNull()
    expect(sut.vendedorUsuarioId).toBeNull()
  })
})
