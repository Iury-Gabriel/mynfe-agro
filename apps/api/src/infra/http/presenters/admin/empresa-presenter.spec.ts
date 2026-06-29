import { makeEmpresa } from '@test/factories'
import { describe, expect, it } from 'vitest'

import { EmpresaPresenter } from './empresa-presenter'

describe(EmpresaPresenter.name, () => {
  it('mapeia todos os campos e formata CNPJ', () => {
    const empresa = makeEmpresa({
      id: 'empresa-1',
      razaoSocial: 'Agro LTDA',
      nomeFantasia: 'Agro',
      cnpjCpf: '11222333000181',
      serieNfe: 2,
      proximaNumeracaoNfe: 7,
      endereco: { municipio: 'Sinop', uf: 'MT' },
    })

    const sut = EmpresaPresenter.toHTTP(empresa)

    expect(sut.id).toBe('empresa-1')
    expect(sut.tenantId).toBe('tenant-1')
    expect(sut.razaoSocial).toBe('Agro LTDA')
    expect(sut.nomeFantasia).toBe('Agro')
    expect(sut.cnpjCpf).toBe('11222333000181')
    expect(sut.cnpjCpfFormatado).toBe('11.222.333/0001-81')
    expect(sut.serieNfe).toBe(2)
    expect(sut.proximaNumeracaoNfe).toBe(7)
    expect(sut.status).toBe('ativo')
    expect(sut.endereco.municipio).toBe('Sinop')
    expect(sut.endereco.uf).toBe('MT')
  })

  it('formata CPF quando o documento tem 11 dígitos', () => {
    const empresa = makeEmpresa({ tipoPessoa: 'PF', cnpjCpf: '52998224725' })
    const sut = EmpresaPresenter.toHTTP(empresa)

    expect(sut.cnpjCpf).toBe('52998224725')
    expect(sut.cnpjCpfFormatado).toBe('529.982.247-25')
  })

  it('não vaza tipo Prisma — expõe endereço como cópia plana', () => {
    const empresa = makeEmpresa({ endereco: { logradouro: 'Rua A' } })
    const sut = EmpresaPresenter.toHTTP(empresa)

    expect(sut.endereco).toEqual({
      logradouro: 'Rua A',
      numero: null,
      complemento: null,
      bairro: null,
      municipio: null,
      uf: null,
      cep: null,
    })
    expect(sut.endereco).not.toBe(empresa.endereco)
  })

  it('mapeia nomeFantasia e serieNfe nulos', () => {
    const empresa = makeEmpresa({ nomeFantasia: null, serieNfe: null })
    const sut = EmpresaPresenter.toHTTP(empresa)

    expect(sut.nomeFantasia).toBeNull()
    expect(sut.serieNfe).toBeNull()
  })

  it('plugnotasConfigurado é false quando não há config', () => {
    const sut = EmpresaPresenter.toHTTP(makeEmpresa({ plugnotasConfig: null }))
    expect(sut.plugnotasConfigurado).toBe(false)
  })

  it('plugnotasConfigurado é false quando a config é um objeto vazio', () => {
    const sut = EmpresaPresenter.toHTTP(makeEmpresa({ plugnotasConfig: {} }))
    expect(sut.plugnotasConfigurado).toBe(false)
  })

  it('plugnotasConfigurado é true quando há credenciais, sem vazar o conteúdo', () => {
    const sut = EmpresaPresenter.toHTTP(
      makeEmpresa({ plugnotasConfig: { apiKey: 'secret-123', cnpj: '11222333000181' } }),
    )

    expect(sut.plugnotasConfigurado).toBe(true)
    expect(sut).not.toHaveProperty('plugnotasConfig')
    expect(JSON.stringify(sut)).not.toContain('secret-123')
  })
})
