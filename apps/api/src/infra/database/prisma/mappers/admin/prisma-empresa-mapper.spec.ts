import { Prisma, type Empresa as PrismaEmpresa } from '@prisma/client'
import { makeEmpresa } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { PrismaEmpresaMapper } from './prisma-empresa-mapper'

function makePrismaRow(override: Partial<PrismaEmpresa> = {}): PrismaEmpresa {
  return {
    id: 'empresa-1',
    tenantId: 'tenant-1',
    tipoPessoa: 'PJ',
    razaoSocial: 'Agro LTDA',
    nomeFantasia: 'Agro',
    cnpjCpf: '11222333000181',
    inscricaoEstadual: '123',
    ieProdutorRural: '456',
    inscricaoMunicipal: null,
    regimeTributario: 'simples_nacional',
    crt: '1',
    enderecoLogradouro: 'Rua A',
    enderecoNumero: '100',
    enderecoComplemento: 'Sala 1',
    enderecoBairro: 'Centro',
    enderecoCep: '78550000',
    enderecoMunicipio: 'Sinop',
    codMunicipioIbge: null,
    uf: 'MT',
    pais: 'Brasil',
    emailFiscal: null,
    telefone: null,
    ambienteFiscal: 'homologacao',
    serieNfe: '2',
    proximaNumeracaoNfe: 1n,
    plugnotasConfig: null,
    certificadoRef: null,
    status: 'ativo',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    ...override,
  }
}

describe('PrismaEmpresaMapper', () => {
  describe('toDomain', () => {
    it('mapeia todos os campos do registro Prisma para a entidade', () => {
      const empresa = PrismaEmpresaMapper.toDomain(makePrismaRow())

      expect(empresa.id.toString()).toBe('empresa-1')
      expect(empresa.tenantId).toBe('tenant-1')
      expect(empresa.tipoPessoa).toBe('PJ')
      expect(empresa.razaoSocial).toBe('Agro LTDA')
      expect(empresa.nomeFantasia).toBe('Agro')
      expect(empresa.cnpjCpf.value).toBe('11222333000181')
      expect(empresa.inscricaoEstadual).toBe('123')
      expect(empresa.ieProdutorRural).toBe('456')
      expect(empresa.regimeTributario).toBe('simples_nacional')
      expect(empresa.crt).toBe('1')
      expect(empresa.ambienteFiscal).toBe('homologacao')
      expect(empresa.serieNfe).toBe(2)
      expect(empresa.proximaNumeracaoNfe).toBe(1)
      expect(empresa.status).toBe('ativo')
      expect(empresa.endereco).toEqual({
        logradouro: 'Rua A',
        numero: '100',
        complemento: 'Sala 1',
        bairro: 'Centro',
        municipio: 'Sinop',
        uf: 'MT',
        cep: '78550000',
      })
      expect(empresa.createdAt).toEqual(new Date('2024-01-01'))
      expect(empresa.updatedAt).toEqual(new Date('2024-01-02'))
      expect(empresa.deletedAt).toBeNull()
    })

    it('mapeia serieNfe null para null', () => {
      const empresa = PrismaEmpresaMapper.toDomain(makePrismaRow({ serieNfe: null }))
      expect(empresa.serieNfe).toBeNull()
    })

    it('converte proximaNumeracaoNfe BigInt para number', () => {
      const empresa = PrismaEmpresaMapper.toDomain(makePrismaRow({ proximaNumeracaoNfe: 42n }))
      expect(empresa.proximaNumeracaoNfe).toBe(42)
    })

    it('mapeia serieNfe não-numérica para null', () => {
      const empresa = PrismaEmpresaMapper.toDomain(makePrismaRow({ serieNfe: 'abc' }))
      expect(empresa.serieNfe).toBeNull()
    })

    it('preserva deletedAt quando presente', () => {
      const deletedAt = new Date('2024-02-01')
      const empresa = PrismaEmpresaMapper.toDomain(makePrismaRow({ deletedAt }))
      expect(empresa.deletedAt).toEqual(deletedAt)
    })

    it('mapeia plugnotasConfig objeto para Record', () => {
      const empresa = PrismaEmpresaMapper.toDomain(
        makePrismaRow({ plugnotasConfig: { apiKey: 'k', cnpj: '1' } }),
      )
      expect(empresa.plugnotasConfig).toEqual({ apiKey: 'k', cnpj: '1' })
    })

    it('mapeia plugnotasConfig null para null', () => {
      const empresa = PrismaEmpresaMapper.toDomain(makePrismaRow({ plugnotasConfig: null }))
      expect(empresa.plugnotasConfig).toBeNull()
    })

    it('mapeia plugnotasConfig não-objeto (array) para null', () => {
      const empresa = PrismaEmpresaMapper.toDomain(makePrismaRow({ plugnotasConfig: ['a', 'b'] }))
      expect(empresa.plugnotasConfig).toBeNull()
    })

    it('lança erro quando o CNPJ/CPF persistido é inválido', () => {
      expect(() => PrismaEmpresaMapper.toDomain(makePrismaRow({ cnpjCpf: '00000000000000' }))).toThrow(
        /CNPJ\/CPF persistido inválido/,
      )
    })
  })

  describe('toPrismaCreate', () => {
    it('serializa a entidade para o input de criação, com serieNfe como string', () => {
      const empresa = makeEmpresa({
        id: 'empresa-9',
        serieNfe: 3,
        endereco: { municipio: 'Sorriso', uf: 'MT', logradouro: 'Av B' },
      })

      const data = PrismaEmpresaMapper.toPrismaCreate(empresa)

      expect(data.id).toBe('empresa-9')
      expect(data.tenantId).toBe('tenant-1')
      expect(data.cnpjCpf).toBe('11222333000181')
      expect(data.serieNfe).toBe('3')
      expect(data.enderecoMunicipio).toBe('Sorriso')
      expect(data.uf).toBe('MT')
      expect(data.enderecoLogradouro).toBe('Av B')
      expect(data.status).toBe('ativo')
    })

    it('mapeia serieNfe null para null no create', () => {
      const empresa = makeEmpresa({ serieNfe: null })
      const data = PrismaEmpresaMapper.toPrismaCreate(empresa)
      expect(data.serieNfe).toBeNull()
    })

    it('serializa proximaNumeracaoNfe como BigInt', () => {
      const empresa = makeEmpresa({ proximaNumeracaoNfe: 7 })
      const data = PrismaEmpresaMapper.toPrismaCreate(empresa)
      expect(data.proximaNumeracaoNfe).toBe(7n)
    })

    it('serializa plugnotasConfig presente como objeto', () => {
      const empresa = makeEmpresa({ plugnotasConfig: { apiKey: 'k' } })
      const data = PrismaEmpresaMapper.toPrismaCreate(empresa)
      expect(data.plugnotasConfig).toEqual({ apiKey: 'k' })
    })

    it('serializa plugnotasConfig null como Prisma.DbNull', () => {
      const empresa = makeEmpresa({ plugnotasConfig: null })
      const data = PrismaEmpresaMapper.toPrismaCreate(empresa)
      expect(data.plugnotasConfig).toBe(Prisma.DbNull)
    })
  })

  describe('toPrismaUpdate', () => {
    it('serializa a entidade para o input de atualização sem id', () => {
      const empresa = makeEmpresa({ id: 'empresa-7', razaoSocial: 'Novo Nome', serieNfe: 5 })

      const data = PrismaEmpresaMapper.toPrismaUpdate(empresa)

      expect(data).not.toHaveProperty('id')
      expect(data.razaoSocial).toBe('Novo Nome')
      expect(data.serieNfe).toBe('5')
      expect(data.updatedAt).toEqual(empresa.updatedAt)
    })

    it('mapeia serieNfe null para null no update', () => {
      const empresa = makeEmpresa({ serieNfe: null })
      const data = PrismaEmpresaMapper.toPrismaUpdate(empresa)
      expect(data.serieNfe).toBeNull()
    })

    it('serializa proximaNumeracaoNfe como BigInt no update', () => {
      const empresa = makeEmpresa({ proximaNumeracaoNfe: 9 })
      const data = PrismaEmpresaMapper.toPrismaUpdate(empresa)
      expect(data.proximaNumeracaoNfe).toBe(9n)
    })

    it('serializa plugnotasConfig presente como objeto no update', () => {
      const empresa = makeEmpresa({ plugnotasConfig: { apiKey: 'k' } })
      const data = PrismaEmpresaMapper.toPrismaUpdate(empresa)
      expect(data.plugnotasConfig).toEqual({ apiKey: 'k' })
    })

    it('serializa plugnotasConfig null como Prisma.DbNull no update', () => {
      const empresa = makeEmpresa({ plugnotasConfig: null })
      const data = PrismaEmpresaMapper.toPrismaUpdate(empresa)
      expect(data.plugnotasConfig).toBe(Prisma.DbNull)
    })
  })
})
