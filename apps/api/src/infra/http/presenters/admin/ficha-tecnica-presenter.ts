import type { ProdutoFichaTecnica } from '@/domain/enterprise/entities/produto-ficha-tecnica'

export interface FichaTecnicaPresenterOutput {
  id: string
  tenantId: string
  produtoId: string
  descricaoComponente: string
  quantidadeReferencia: number | null
  observacoes: string | null
  createdAt: Date
  updatedAt: Date
}

export class FichaTecnicaPresenter {
  static toHTTP(fichaTecnica: ProdutoFichaTecnica): FichaTecnicaPresenterOutput {
    return {
      id: fichaTecnica.id.toString(),
      tenantId: fichaTecnica.tenantId,
      produtoId: fichaTecnica.produtoId,
      descricaoComponente: fichaTecnica.descricaoComponente,
      quantidadeReferencia: fichaTecnica.quantidadeReferencia,
      observacoes: fichaTecnica.observacoes,
      createdAt: fichaTecnica.createdAt,
      updatedAt: fichaTecnica.updatedAt,
    }
  }
}
