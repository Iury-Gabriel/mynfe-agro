import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AjusteEmpresaGate } from './empresa-gate'

describe('AjusteEmpresaGate', () => {
  it('exibe aviso quando não há empresa', () => {
    render(
      <AjusteEmpresaGate empresaId={null}>
        <span>conteúdo</span>
      </AjusteEmpresaGate>,
    )
    expect(
      screen.getByText('Selecione uma empresa ativa para visualizar os dados.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()
  })

  it('renderiza filhos quando há empresa', () => {
    render(
      <AjusteEmpresaGate empresaId="e1">
        <span>conteúdo</span>
      </AjusteEmpresaGate>,
    )
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })
})
