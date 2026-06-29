import type { Cliente } from '@/domain/enterprise/entities/cliente'
import type { ClienteEnderecoEntrega } from '@/domain/enterprise/entities/cliente-endereco-entrega'

export interface ClienteEnderecoEntregaPresenterOutput {
  id: string
  enderecoLogradouro: string | null
  enderecoNumero: string | null
  enderecoBairro: string | null
  enderecoCep: string | null
  municipio: string | null
  uf: string | null
  principal: boolean
}

export interface ClientePresenterOutput {
  id: string
  tenantId: string
  tipoPessoa: string
  razaoSocialNome: string
  cnpjCpf: string
  cnpjCpfFormatado: string
  inscricaoEstadual: string | null
  indicadorIe: string
  contribuinteIcms: boolean
  enderecoLogradouro: string | null
  enderecoNumero: string | null
  enderecoBairro: string | null
  enderecoCep: string | null
  municipio: string | null
  codMunicipioIbge: string | null
  uf: string | null
  email: string | null
  telefone: string | null
  vendedorUsuarioId: string | null
  enderecosEntrega: ClienteEnderecoEntregaPresenterOutput[]
  createdAt: Date
  updatedAt: Date
}

function formatCnpjCpf(value: string): string {
  if (value.length === 11) {
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

function enderecoToHTTP(endereco: ClienteEnderecoEntrega): ClienteEnderecoEntregaPresenterOutput {
  return {
    id: endereco.id.toString(),
    enderecoLogradouro: endereco.enderecoLogradouro,
    enderecoNumero: endereco.enderecoNumero,
    enderecoBairro: endereco.enderecoBairro,
    enderecoCep: endereco.enderecoCep,
    municipio: endereco.municipio,
    uf: endereco.uf,
    principal: endereco.principal,
  }
}

export class ClientePresenter {
  static toHTTP(cliente: Cliente): ClientePresenterOutput {
    return {
      id: cliente.id.toString(),
      tenantId: cliente.tenantId,
      tipoPessoa: cliente.tipoPessoa,
      razaoSocialNome: cliente.razaoSocialNome,
      cnpjCpf: cliente.cnpjCpf.value,
      cnpjCpfFormatado: formatCnpjCpf(cliente.cnpjCpf.value),
      inscricaoEstadual: cliente.inscricaoEstadual,
      indicadorIe: cliente.indicadorIe,
      contribuinteIcms: cliente.contribuinteIcms,
      enderecoLogradouro: cliente.enderecoLogradouro,
      enderecoNumero: cliente.enderecoNumero,
      enderecoBairro: cliente.enderecoBairro,
      enderecoCep: cliente.enderecoCep,
      municipio: cliente.municipio,
      codMunicipioIbge: cliente.codMunicipioIbge,
      uf: cliente.uf,
      email: cliente.email,
      telefone: cliente.telefone,
      vendedorUsuarioId: cliente.vendedorUsuarioId,
      enderecosEntrega: cliente.enderecosEntrega.map((endereco) => enderecoToHTTP(endereco)),
      createdAt: cliente.createdAt,
      updatedAt: cliente.updatedAt,
    }
  }
}
