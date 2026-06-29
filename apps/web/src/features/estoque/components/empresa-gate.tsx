import type { ReactElement, ReactNode } from 'react'

interface EmpresaGateProps {
  empresaId: string | null
  children: ReactNode
}

export function AjusteEmpresaGate({ empresaId, children }: EmpresaGateProps): ReactElement {
  if (!empresaId) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Selecione uma empresa ativa para visualizar os dados.
      </p>
    )
  }
  return <>{children}</>
}
