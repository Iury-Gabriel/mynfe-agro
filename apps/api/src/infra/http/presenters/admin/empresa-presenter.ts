import type { Empresa, EmpresaEndereco } from '@/domain/enterprise/entities/empresa'

export interface EmpresaPresenterOutput {
  id: string
  tenantId: string
  tipoPessoa: string
  razaoSocial: string
  nomeFantasia: string | null
  cnpjCpf: string
  cnpjCpfFormatado: string
  inscricaoEstadual: string | null
  ieProdutorRural: string | null
  regimeTributario: string
  crt: string
  ambienteFiscal: string
  serieNfe: number | null
  status: string
  endereco: EmpresaEndereco
  createdAt: Date
  updatedAt: Date
}

function formatCnpjCpf(value: string): string {
  if (value.length === 11) {
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

export class EmpresaPresenter {
  static toHTTP(empresa: Empresa): EmpresaPresenterOutput {
    return {
      id: empresa.id.toString(),
      tenantId: empresa.tenantId,
      tipoPessoa: empresa.tipoPessoa,
      razaoSocial: empresa.razaoSocial,
      nomeFantasia: empresa.nomeFantasia,
      cnpjCpf: empresa.cnpjCpf.value,
      cnpjCpfFormatado: formatCnpjCpf(empresa.cnpjCpf.value),
      inscricaoEstadual: empresa.inscricaoEstadual,
      ieProdutorRural: empresa.ieProdutorRural,
      regimeTributario: empresa.regimeTributario,
      crt: empresa.crt,
      ambienteFiscal: empresa.ambienteFiscal,
      serieNfe: empresa.serieNfe,
      status: empresa.status,
      endereco: { ...empresa.endereco },
      createdAt: empresa.createdAt,
      updatedAt: empresa.updatedAt,
    }
  }
}
