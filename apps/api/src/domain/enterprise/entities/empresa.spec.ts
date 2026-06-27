import { describe, expect, it } from 'vitest'

import { Empresa } from './empresa'

import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CnpjCpf } from '@/domain/enterprise/entities/value-objects/cnpj-cpf'

function validCnpjCpf(raw = '11222333000181'): CnpjCpf {
  const result = CnpjCpf.create(raw)
  if (result.isLeft()) throw new Error('fixture inválido')
  return result.value
}

function makeEmpresaFull() {
  return Empresa.create({
    tenantId: 'tenant-1',
    tipoPessoa: 'PJ',
    razaoSocial: 'Agro LTDA',
    nomeFantasia: 'Agro',
    cnpjCpf: validCnpjCpf(),
    inscricaoEstadual: '12345',
    ieProdutorRural: '67890',
    regimeTributario: 'simples_nacional',
    crt: '1',
    ambienteFiscal: 'homologacao',
    serieNfe: 1,
    status: 'ativo',
    endereco: { logradouro: 'Rua A', municipio: 'Cuiabá', uf: 'MT' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
  })
}

describe(Empresa.name, () => {
  it('cria com id gerado e expõe todos os getters', () => {
    const cnpjCpf = validCnpjCpf()
    const sut = Empresa.create({
      tenantId: 'tenant-1',
      tipoPessoa: 'PJ',
      razaoSocial: 'Agro LTDA',
      nomeFantasia: 'Agro',
      cnpjCpf,
      inscricaoEstadual: '12345',
      ieProdutorRural: '67890',
      regimeTributario: 'simples_nacional',
      crt: '1',
      ambienteFiscal: 'producao',
      serieNfe: 2,
      status: 'ativo',
      endereco: { logradouro: 'Rua A' },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      deletedAt: null,
    })

    expect(sut.id).toBeInstanceOf(UniqueEntityID)
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.tipoPessoa).toBe('PJ')
    expect(sut.razaoSocial).toBe('Agro LTDA')
    expect(sut.nomeFantasia).toBe('Agro')
    expect(sut.cnpjCpf).toBe(cnpjCpf)
    expect(sut.inscricaoEstadual).toBe('12345')
    expect(sut.ieProdutorRural).toBe('67890')
    expect(sut.regimeTributario).toBe('simples_nacional')
    expect(sut.crt).toBe('1')
    expect(sut.ambienteFiscal).toBe('producao')
    expect(sut.serieNfe).toBe(2)
    expect(sut.status).toBe('ativo')
    expect(sut.endereco.logradouro).toBe('Rua A')
    expect(sut.createdAt).toEqual(new Date('2024-01-01'))
    expect(sut.updatedAt).toEqual(new Date('2024-01-02'))
    expect(sut.deletedAt).toBeNull()
  })

  it('aceita id explícito', () => {
    const id = new UniqueEntityID('empresa-1')
    const sut = Empresa.create(
      {
        tenantId: 'tenant-1',
        tipoPessoa: 'PJ',
        razaoSocial: 'Agro LTDA',
        cnpjCpf: validCnpjCpf(),
        regimeTributario: 'simples_nacional',
        crt: '1',
        ambienteFiscal: 'homologacao',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      id,
    )

    expect(sut.id).toBe(id)
  })

  it('aplica defaults para campos opcionais quando omitidos', () => {
    const sut = Empresa.create({
      tenantId: 'tenant-1',
      tipoPessoa: 'PF',
      razaoSocial: 'Produtor Rural',
      cnpjCpf: validCnpjCpf('52998224725'),
      regimeTributario: 'mei',
      crt: '4',
      ambienteFiscal: 'homologacao',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.tipoPessoa).toBe('PF')
    expect(sut.nomeFantasia).toBeNull()
    expect(sut.inscricaoEstadual).toBeNull()
    expect(sut.ieProdutorRural).toBeNull()
    expect(sut.serieNfe).toBeNull()
    expect(sut.status).toBe('ativo')
    expect(sut.deletedAt).toBeNull()
    expect(sut.endereco).toEqual({
      logradouro: null,
      numero: null,
      complemento: null,
      bairro: null,
      municipio: null,
      uf: null,
      cep: null,
    })
  })

  it('mescla endereço parcial com o endereço vazio padrão', () => {
    const sut = Empresa.create({
      tenantId: 'tenant-1',
      tipoPessoa: 'PJ',
      razaoSocial: 'Agro LTDA',
      cnpjCpf: validCnpjCpf(),
      regimeTributario: 'lucro_real',
      crt: '3',
      ambienteFiscal: 'producao',
      endereco: { municipio: 'Sorriso', uf: 'MT' },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    })

    expect(sut.endereco.municipio).toBe('Sorriso')
    expect(sut.endereco.uf).toBe('MT')
    expect(sut.endereco.logradouro).toBeNull()
  })

  describe('activate()', () => {
    it('define status ativo e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Empresa.create({
        tenantId: 'tenant-1',
        tipoPessoa: 'PJ',
        razaoSocial: 'Agro LTDA',
        cnpjCpf: validCnpjCpf(),
        regimeTributario: 'simples_nacional',
        crt: '1',
        ambienteFiscal: 'homologacao',
        status: 'inativo',
        createdAt: before,
        updatedAt: before,
      })

      sut.activate()

      expect(sut.status).toBe('ativo')
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('deactivate()', () => {
    it('define status inativo e atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Empresa.create({
        tenantId: 'tenant-1',
        tipoPessoa: 'PJ',
        razaoSocial: 'Agro LTDA',
        cnpjCpf: validCnpjCpf(),
        regimeTributario: 'simples_nacional',
        crt: '1',
        ambienteFiscal: 'homologacao',
        status: 'ativo',
        createdAt: before,
        updatedAt: before,
      })

      sut.deactivate()

      expect(sut.status).toBe('inativo')
      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })

  describe('updateCadastro()', () => {
    it('atualiza todos os campos quando informados', () => {
      const sut = makeEmpresaFull()
      const novoCnpjCpf = validCnpjCpf('52998224725')

      sut.updateCadastro({
        razaoSocial: 'Agro 2',
        nomeFantasia: 'A2',
        cnpjCpf: novoCnpjCpf,
        inscricaoEstadual: '999',
        ieProdutorRural: '888',
        regimeTributario: 'lucro_presumido',
        crt: '2',
        ambienteFiscal: 'producao',
        serieNfe: 9,
        endereco: { cep: '78000-000' },
      })

      expect(sut.razaoSocial).toBe('Agro 2')
      expect(sut.nomeFantasia).toBe('A2')
      expect(sut.cnpjCpf).toBe(novoCnpjCpf)
      expect(sut.inscricaoEstadual).toBe('999')
      expect(sut.ieProdutorRural).toBe('888')
      expect(sut.regimeTributario).toBe('lucro_presumido')
      expect(sut.crt).toBe('2')
      expect(sut.ambienteFiscal).toBe('producao')
      expect(sut.serieNfe).toBe(9)
      expect(sut.endereco.cep).toBe('78000-000')
      expect(sut.endereco.logradouro).toBe('Rua A')
    })

    it('aceita nomeFantasia e campos opcionais como null', () => {
      const sut = makeEmpresaFull()

      sut.updateCadastro({
        nomeFantasia: null,
        inscricaoEstadual: null,
        ieProdutorRural: null,
        serieNfe: null,
      })

      expect(sut.nomeFantasia).toBeNull()
      expect(sut.inscricaoEstadual).toBeNull()
      expect(sut.ieProdutorRural).toBeNull()
      expect(sut.serieNfe).toBeNull()
    })

    it('mantém campos não informados intactos', () => {
      const sut = makeEmpresaFull()

      sut.updateCadastro({ razaoSocial: 'Somente Razão' })

      expect(sut.razaoSocial).toBe('Somente Razão')
      expect(sut.nomeFantasia).toBe('Agro')
      expect(sut.inscricaoEstadual).toBe('12345')
      expect(sut.ieProdutorRural).toBe('67890')
      expect(sut.regimeTributario).toBe('simples_nacional')
      expect(sut.crt).toBe('1')
      expect(sut.ambienteFiscal).toBe('homologacao')
      expect(sut.serieNfe).toBe(1)
      expect(sut.endereco.logradouro).toBe('Rua A')
    })

    it('atualiza updatedAt', () => {
      const before = new Date('2024-01-01')
      const sut = Empresa.create({
        tenantId: 'tenant-1',
        tipoPessoa: 'PJ',
        razaoSocial: 'Agro LTDA',
        cnpjCpf: validCnpjCpf(),
        regimeTributario: 'simples_nacional',
        crt: '1',
        ambienteFiscal: 'homologacao',
        createdAt: before,
        updatedAt: before,
      })

      sut.updateCadastro({ razaoSocial: 'Nova' })

      expect(sut.updatedAt.getTime()).toBeGreaterThan(before.getTime())
    })
  })
})
