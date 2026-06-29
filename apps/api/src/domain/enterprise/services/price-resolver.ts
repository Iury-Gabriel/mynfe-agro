import type { TabelaPrecoCliente } from '@/domain/enterprise/entities/tabela-preco-cliente'

export interface ResolvePrecoInput {
  precosCliente: TabelaPrecoCliente[]
  precoPadrao: number | null
  ref: Date
}

function vigenciaInicioTime(preco: TabelaPrecoCliente): number {
  return preco.vigenciaInicio?.getTime() ?? Number.NEGATIVE_INFINITY
}

export function resolvePreco(input: ResolvePrecoInput): number | null {
  const vigentes = input.precosCliente.filter((preco) => preco.isVigente(input.ref))

  if (vigentes.length > 0) {
    const maisRecente = vigentes.reduce((atual, candidato) =>
      vigenciaInicioTime(candidato) >= vigenciaInicioTime(atual) ? candidato : atual,
    )
    return maisRecente.preco
  }

  return input.precoPadrao
}
