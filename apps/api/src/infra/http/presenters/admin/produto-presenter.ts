import type { Produto } from '@/domain/enterprise/entities/produto'

export interface ProdutoPresenterOutput {
  id: string
  tenantId: string
  empresaId: string
  descricao: string
  tipo: string
  unidadeMedida: string
  precoPadrao: number | null
  ncm: string | null
  cest: string | null
  cfopPadrao: string | null
  origemMercadoria: string | null
  cstCsosn: string | null
  aliquotas: Record<string, unknown> | null
  status: string
  createdAt: Date
  updatedAt: Date
}

export class ProdutoPresenter {
  static toHTTP(produto: Produto): ProdutoPresenterOutput {
    return {
      id: produto.id.toString(),
      tenantId: produto.tenantId,
      empresaId: produto.empresaId,
      descricao: produto.descricao,
      tipo: produto.tipo,
      unidadeMedida: produto.unidadeMedida,
      precoPadrao: produto.precoPadrao,
      ncm: produto.ncm,
      cest: produto.cest,
      cfopPadrao: produto.cfopPadrao,
      origemMercadoria: produto.origemMercadoria,
      cstCsosn: produto.cstCsosn,
      aliquotas: produto.aliquotas === null ? null : { ...produto.aliquotas },
      status: produto.status,
      createdAt: produto.createdAt,
      updatedAt: produto.updatedAt,
    }
  }
}
