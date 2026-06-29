import type { Fazenda } from '@/domain/enterprise/entities/fazenda'

export interface FazendaPresenterOutput {
  id: string
  tenantId: string
  empresaId: string
  nome: string
  enderecoLogradouro: string | null
  enderecoNumero: string | null
  enderecoBairro: string | null
  enderecoCep: string | null
  municipio: string | null
  uf: string | null
  latitude: number | null
  longitude: number | null
  car: string | null
  nirfIncra: string | null
  areaTotalHa: number | null
  createdAt: Date
  updatedAt: Date
}

export class FazendaPresenter {
  static toHTTP(fazenda: Fazenda): FazendaPresenterOutput {
    return {
      id: fazenda.id.toString(),
      tenantId: fazenda.tenantId,
      empresaId: fazenda.empresaId,
      nome: fazenda.nome,
      enderecoLogradouro: fazenda.enderecoLogradouro,
      enderecoNumero: fazenda.enderecoNumero,
      enderecoBairro: fazenda.enderecoBairro,
      enderecoCep: fazenda.enderecoCep,
      municipio: fazenda.municipio,
      uf: fazenda.uf,
      latitude: fazenda.latitude,
      longitude: fazenda.longitude,
      car: fazenda.car,
      nirfIncra: fazenda.nirfIncra,
      areaTotalHa: fazenda.areaTotalHa,
      createdAt: fazenda.createdAt,
      updatedAt: fazenda.updatedAt,
    }
  }
}
