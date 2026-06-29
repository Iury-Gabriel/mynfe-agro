import { describe, expect, it } from 'vitest'

import { Cliente } from './cliente'
import { ClienteEnderecoEntrega } from './cliente-endereco-entrega'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InvalidCnpjCpfError } from '@/domain/application/use-cases/errors/invalid-cnpj-cpf-error'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

function validCnpjCpf(raw = '11222333000181'): CnpjCpf {
  const result = CnpjCpf.create(raw)
  if (result.isLeft()) throw new Error('fixture inválido')
  return result.value
}

function makeClienteFull() {
  return Cliente.create({
    tenantId: 'tenant-1',
    tipoPessoa: 'PJ',
    razaoSocialNome: 'Cliente Agro LTDA',
    cnpjCpf: validCnpjCpf(),
    inscricaoEstadual: '12345',
    indicadorIe: '1',
    contribuinteIcms: true,
    enderecoLogradouro: 'Rua A',
    enderecoNumero: '100',
    enderecoBairro: 'Centro',
    enderecoCep: '78000-000',
    municipio: 'Cuiabá',
    codMunicipioIbge: '5103403',
    uf: 'MT',
    email: 'cliente@agro.com',
    telefone: '65999999999',
    vendedorUsuarioId: 'vendedor-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  })
}

describe(Cliente.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const cnpjCpf = validCnpjCpf()
    const sut = Cliente.create({
      tenantId: 'tenant-1',
      tipoPessoa: 'PJ',
      razaoSocialNome: 'Cliente Agro LTDA',
      cnpjCpf,
      inscricaoEstadual: '12345',
      indicadorIe: '1',
      contribuinteIcms: true,
      enderecoLogradouro: 'Rua A',
      enderecoNumero: '100',
      enderecoBairro: 'Centro',
      enderecoCep: '78000-000',
      municipio: 'Cuiabá',
      codMunicipioIbge: '5103403',
      uf: 'MT',
      email: 'cliente@agro.com',
      telefone: '65999999999',
      vendedorUsuarioId: 'vendedor-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      deletedAt: null,
    })

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.tipoPessoa).toBe('PJ')
    expect(sut.razaoSocialNome).toBe('Cliente Agro LTDA')
    expect(sut.cnpjCpf).toBe(cnpjCpf)
    expect(sut.inscricaoEstadual).toBe('12345')
    expect(sut.indicadorIe).toBe('1')
    expect(sut.contribuinteIcms).toBe(true)
    expect(sut.enderecoLogradouro).toBe('Rua A')
    expect(sut.enderecoNumero).toBe('100')
    expect(sut.enderecoBairro).toBe('Centro')
    expect(sut.enderecoCep).toBe('78000-000')
    expect(sut.municipio).toBe('Cuiabá')
    expect(sut.codMunicipioIbge).toBe('5103403')
    expect(sut.uf).toBe('MT')
    expect(sut.email).toBe('cliente@agro.com')
    expect(sut.telefone).toBe('65999999999')
    expect(sut.vendedorUsuarioId).toBe('vendedor-1')
    expect(sut.enderecosEntrega).toEqual([])
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('cliente-1')
    const sut = Cliente.create(
      {
        tenantId: 'tenant-1',
        tipoPessoa: 'PJ',
        razaoSocialNome: 'Cliente Agro LTDA',
        cnpjCpf: validCnpjCpf(),
        indicadorIe: '9',
        contribuinteIcms: false,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults para campos opcionais quando omitidos', () => {
    const sut = Cliente.create({
      tenantId: 'tenant-1',
      tipoPessoa: 'PF',
      razaoSocialNome: 'João Produtor',
      cnpjCpf: validCnpjCpf('52998224725'),
      indicadorIe: '2',
      contribuinteIcms: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.tipoPessoa).toBe('PF')
    expect(sut.inscricaoEstadual).toBeNull()
    expect(sut.enderecoLogradouro).toBeNull()
    expect(sut.enderecoNumero).toBeNull()
    expect(sut.enderecoBairro).toBeNull()
    expect(sut.enderecoCep).toBeNull()
    expect(sut.municipio).toBeNull()
    expect(sut.codMunicipioIbge).toBeNull()
    expect(sut.uf).toBeNull()
    expect(sut.email).toBeNull()
    expect(sut.telefone).toBeNull()
    expect(sut.vendedorUsuarioId).toBeNull()
    expect(sut.enderecosEntrega).toEqual([])
    expect(sut.deletedAt).toBeNull()
  })

  it('rejeita CNPJ/CPF inválido via value object (left InvalidCnpjCpfError)', () => {
    const result = CnpjCpf.create('00000000000000')

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidCnpjCpfError)
  })

  describe('addEnderecoEntrega()', () => {
    it('adiciona endereço de entrega ao agregado e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Cliente.create({
        tenantId: 'tenant-1',
        tipoPessoa: 'PJ',
        razaoSocialNome: 'Cliente Agro LTDA',
        cnpjCpf: validCnpjCpf(),
        indicadorIe: '1',
        contribuinteIcms: true,
        createdAt: before,
        updatedAt: before,
      })

      const endereco = ClienteEnderecoEntrega.create({
        tenantId: 'tenant-1',
        clienteId: sut.id.toString(),
        principal: true,
        createdAt: before,
        updatedAt: before,
      })

      sut.addEnderecoEntrega(endereco)

      expect(sut.enderecosEntrega).toHaveLength(1)
      expect(sut.enderecosEntrega[0]).toBe(endereco)
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('delete()', () => {
    it('marca deletedAt e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Cliente.create({
        tenantId: 'tenant-1',
        tipoPessoa: 'PJ',
        razaoSocialNome: 'Cliente Agro LTDA',
        cnpjCpf: validCnpjCpf(),
        indicadorIe: '1',
        contribuinteIcms: true,
        createdAt: before,
        updatedAt: before,
      })

      sut.delete()

      expect(sut.deletedAt).toBeInstanceOf(Date)
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('updateCadastro()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = makeClienteFull()
      const novoCnpjCpf = validCnpjCpf('52998224725')

      sut.updateCadastro({
        tipoPessoa: 'PF',
        razaoSocialNome: 'Novo Nome',
        cnpjCpf: novoCnpjCpf,
        inscricaoEstadual: '999',
        indicadorIe: '9',
        contribuinteIcms: false,
        enderecoLogradouro: 'Av B',
        enderecoNumero: '200',
        enderecoBairro: 'Jardim',
        enderecoCep: '78010-000',
        municipio: 'Sorriso',
        codMunicipioIbge: '5107925',
        uf: 'MT',
        email: 'novo@agro.com',
        telefone: '65988888888',
        vendedorUsuarioId: 'vendedor-2',
      })

      expect(sut.tipoPessoa).toBe('PF')
      expect(sut.razaoSocialNome).toBe('Novo Nome')
      expect(sut.cnpjCpf).toBe(novoCnpjCpf)
      expect(sut.inscricaoEstadual).toBe('999')
      expect(sut.indicadorIe).toBe('9')
      expect(sut.contribuinteIcms).toBe(false)
      expect(sut.enderecoLogradouro).toBe('Av B')
      expect(sut.enderecoNumero).toBe('200')
      expect(sut.enderecoBairro).toBe('Jardim')
      expect(sut.enderecoCep).toBe('78010-000')
      expect(sut.municipio).toBe('Sorriso')
      expect(sut.codMunicipioIbge).toBe('5107925')
      expect(sut.uf).toBe('MT')
      expect(sut.email).toBe('novo@agro.com')
      expect(sut.telefone).toBe('65988888888')
      expect(sut.vendedorUsuarioId).toBe('vendedor-2')
    })

    it('aceita campos opcionais como null', () => {
      const sut = makeClienteFull()

      sut.updateCadastro({
        inscricaoEstadual: null,
        enderecoLogradouro: null,
        enderecoNumero: null,
        enderecoBairro: null,
        enderecoCep: null,
        municipio: null,
        codMunicipioIbge: null,
        uf: null,
        email: null,
        telefone: null,
        vendedorUsuarioId: null,
      })

      expect(sut.inscricaoEstadual).toBeNull()
      expect(sut.enderecoLogradouro).toBeNull()
      expect(sut.enderecoNumero).toBeNull()
      expect(sut.enderecoBairro).toBeNull()
      expect(sut.enderecoCep).toBeNull()
      expect(sut.municipio).toBeNull()
      expect(sut.codMunicipioIbge).toBeNull()
      expect(sut.uf).toBeNull()
      expect(sut.email).toBeNull()
      expect(sut.telefone).toBeNull()
      expect(sut.vendedorUsuarioId).toBeNull()
    })

    it('mantém campos não informados intactos', () => {
      const sut = makeClienteFull()

      sut.updateCadastro({ razaoSocialNome: 'Somente Nome' })

      expect(sut.razaoSocialNome).toBe('Somente Nome')
      expect(sut.tipoPessoa).toBe('PJ')
      expect(sut.inscricaoEstadual).toBe('12345')
      expect(sut.indicadorIe).toBe('1')
      expect(sut.contribuinteIcms).toBe(true)
      expect(sut.enderecoLogradouro).toBe('Rua A')
      expect(sut.municipio).toBe('Cuiabá')
      expect(sut.uf).toBe('MT')
      expect(sut.email).toBe('cliente@agro.com')
    })

    it('atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Cliente.create({
        tenantId: 'tenant-1',
        tipoPessoa: 'PJ',
        razaoSocialNome: 'Cliente Agro LTDA',
        cnpjCpf: validCnpjCpf(),
        indicadorIe: '1',
        contribuinteIcms: true,
        createdAt: before,
        updatedAt: before,
      })

      sut.updateCadastro({ razaoSocialNome: 'Nova' })

      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
